/* eslint-disable @typescript-eslint/no-require-imports -- This CommonJS test installs a local TypeScript require hook for the pure business model. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

// Load the project's TypeScript business rules without adding a runtime dependency.
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function resolve(request, parent, ...rest) {
  return originalResolve.call(this, request.startsWith("@/") ? path.join(process.cwd(), request.slice(2)) : request, parent, ...rest);
};
Module._extensions[".ts"] = function loadTs(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  module._compile(output, filename);
};

const { initialHrState, hrToday } = require("../features/hr/hr-demo-data.ts");
const { applyOrganizationCommand } = require("../features/hr/organization-model.ts");
const hrTotal = { id: "hr-total", effectiveScope: "company", label: "HR", permissions: [{ resource: "organization", actions: ["view", "edit"] }] };
const hrBranch = { ...hrTotal, effectiveScope: "branch", branch: "HCM-Q1", scopeTarget: "HCM-Q1" };

test("create Data Analytics and transfer three employees with shared history", () => {
  let state = structuredClone(initialHrState);
  let result = applyOrganizationCommand(state, {
    type: "team.save",
    value: { code: "DATA-ANALYTICS", name: "Data Analytics", type: "project", departmentId: "DEPT-IT", leadId: "OH-0259", description: "Demo", startsAt: hrToday(), status: "active" },
    initialMemberIds: ["OH-0259"],
  }, hrTotal);
  assert.equal(result.ok, true, result.error);
  state = result.state;
  const teamId = result.id;
  result = applyOrganizationCommand(state, {
    type: "transfer", employeeIds: ["OH-0271", "OH-0218", "OH-0137"], departmentId: "DEPT-IT", teamId,
    teamMode: "primary", managerId: "OH-0259", effectiveAt: hrToday(), reason: "Thành lập Team Data Analytics", pendingRequestIds: ["LV-2026-191"],
  }, hrTotal);
  assert.equal(result.ok, true, result.error);
  state = result.state;
  assert.equal(state.organization.teams.find((team) => team.id === teamId).memberIds.length, 4);
  assert(state.employees.filter((person) => ["OH-0271", "OH-0218", "OH-0137"].includes(person.id)).every((person) => person.primaryTeamId === teamId && person.department === "Công nghệ thông tin" && person.branch === "HCM-TD"));
  assert.equal(state.organization.changes[0].transfers.length, 3);
  assert.deepEqual(state.organization.changes[0].pendingRequestIds, ["LV-2026-191"]);
});

test("reject duplicate code, active department deactivation and cross-branch edit", () => {
  const state = structuredClone(initialHrState);
  const duplicate = applyOrganizationCommand(state, { type: "department.save", value: { code: "IT", name: "IT clone", branch: "HCM-Q1", description: "", status: "active", effectiveAt: hrToday() } }, hrTotal);
  assert.equal(duplicate.ok, false);
  const deactivate = applyOrganizationCommand(state, { type: "department.deactivate", id: "DEPT-IT", effectiveAt: hrToday() }, hrTotal);
  assert.equal(deactivate.ok, false);
  const crossBranch = applyOrganizationCommand(state, { type: "department.deactivate", id: "DEPT-IT", effectiveAt: hrToday() }, hrBranch);
  assert.equal(crossBranch.ok, false);
});
