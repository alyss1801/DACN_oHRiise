/* eslint-disable @typescript-eslint/no-require-imports -- Pure TypeScript authorization test. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
Module._extensions[".ts"] = function loadTs(module, filename) { module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename); };
const { applyAdminAccess } = require("../lib/authorization/admin-access.ts");
const { getPersona } = require("../lib/authorization/personas.ts");
const { can, canAccessScopedRecord } = require("../lib/authorization/engine.ts");
const { navigationFor } = require("../lib/navigation.ts");

const profile = { employeeId: "OH-0091", status: "active", scope: "branch", target: "HN-CG", branch: "HCM-Q1", department: "Nhân sự", allowedCodes: ["hr.employee.manage", "hr.organization.manage"] };

test("admin assigned HR permissions and scope drive visible modules and record access", () => {
  const session = applyAdminAccess(getPersona("hr-total"), profile);
  const visible = navigationFor(session).flatMap((group) => group.items.map((item) => item.id));
  assert.equal(can(session, "email"), true);
  assert.equal(can(session, "employees"), true);
  assert.equal(can(session, "organization", "edit"), true);
  assert.equal(can(session, "offboarding"), false);
  assert.equal(visible.includes("offboarding"), false);
  assert.equal(session.effectiveScope, "branch");
  assert.equal(session.branch, "HN-CG");
  assert.equal(canAccessScopedRecord(session, { branch: "HN-CG" }), true);
  assert.equal(canAccessScopedRecord(session, { branch: "HCM-Q1" }), false);
});

test("team and admin capabilities can be removed without losing employee services", () => {
  const lead = applyAdminAccess(getPersona("team-lead"), { ...profile, employeeId: "OH-0184", scope: "team", target: "Sản phẩm", allowedCodes: [] });
  assert.equal(can(lead, "team"), false);
  assert.equal(can(lead, "email", "create"), true);
  const admin = applyAdminAccess(getPersona("system-admin"), { ...profile, employeeId: "OH-0001", scope: "company", allowedCodes: ["admin.accounts.manage"] });
  assert.equal(can(admin, "accounts"), true);
  assert.equal(can(admin, "permissions"), false);
});
