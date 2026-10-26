/* eslint-disable @typescript-eslint/no-require-imports -- Local TypeScript loader for pure demo rules. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function resolve(request, parent, ...rest) {
  return originalResolve.call(this, request.startsWith("@/") ? path.join(process.cwd(), request.slice(2)) : request, parent, ...rest);
};
Module._extensions[".ts"] = function loadTs(module, filename) {
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  module._compile(output, filename);
};

const { initialHrState, effectivePolicyStatus, hrContractEnd } = require("../features/hr/hr-demo-data.ts");
const { demoBusinessDate, setDemoClockMode } = require("../lib/demo-clock.ts");

test("indefinite contract has no artificial expiry and shares employee ID", () => {
  const contract = initialHrState.contracts.find((item) => item.employeeId === "OH-0184");
  assert.equal(contract.endsAt, null);
  assert.equal(hrContractEnd(contract.endsAt), "Không xác định thời hạn");
  assert(initialHrState.employees.some((item) => item.id === contract.employeeId));
});

test("future policy stays scheduled before effective date", () => {
  const policy = initialHrState.policies.find((item) => item.id === "POL-ATT-01");
  assert.equal(effectivePolicyStatus(policy, "2026-10-23"), "scheduled");
  assert.equal(effectivePolicyStatus(policy, "2026-11-01"), "active");
});

test("scheduled version supersedes older active version only on effective date", () => {
  const old = { id: "old", group: "Nghỉ phép", name: "Số ngày", value: "12", scope: "Toàn công ty", effectiveAt: "2026-01-01", version: 1, status: "active", updatedAt: "2026-01-01" };
  const next = { ...old, id: "next", value: "14", effectiveAt: "2026-11-01", version: 2, status: "scheduled" };
  assert.equal(effectivePolicyStatus(old, "2026-10-23", [old, next]), "active");
  assert.equal(effectivePolicyStatus(next, "2026-10-23", [old, next]), "scheduled");
  assert.equal(effectivePolicyStatus(old, "2026-11-01", [old, next]), "retired");
  assert.equal(effectivePolicyStatus(next, "2026-11-01", [old, next]), "active");
});

test("scenario and real clock use one business-date service", () => {
  setDemoClockMode("scenario");
  assert.equal(demoBusinessDate(new Date("2026-12-01T00:00:00Z")), "2026-10-20");
  setDemoClockMode("real");
  assert.equal(demoBusinessDate(new Date("2026-12-01T00:00:00Z")), "2026-12-01");
  setDemoClockMode("scenario");
});
