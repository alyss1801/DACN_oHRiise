/* eslint-disable @typescript-eslint/no-require-imports -- Pure authorization demo helper test. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
Module._extensions[".ts"] = function loadTs(module, filename) { module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename); };
const { canAccessScopedRecord } = require("../lib/authorization/engine.ts");

test("demo self scope follows persona identity instead of a fixed employee", () => {
  assert.equal(canAccessScopedRecord({ id: "employee", effectiveScope: "self" }, { employeeId: "OH-0248" }), true);
  assert.equal(canAccessScopedRecord({ id: "team-lead", effectiveScope: "self" }, { employeeId: "OH-0184" }), true);
  assert.equal(canAccessScopedRecord({ id: "team-lead", effectiveScope: "self" }, { employeeId: "OH-0248" }), false);
  assert.equal(canAccessScopedRecord({ id: "system-admin", effectiveScope: "self" }, { employeeId: "OH-0248" }), false);
});

test("team scope uses manager relationship and branch scope does not cross branch", () => {
  assert.equal(canAccessScopedRecord({ id: "team-lead", effectiveScope: "team" }, { employeeId: "OH-0248", managerId: "OH-0184" }), true);
  assert.equal(canAccessScopedRecord({ id: "team-lead", effectiveScope: "team" }, { employeeId: "OH-0271", managerId: "OH-0259" }), false);
  assert.equal(canAccessScopedRecord({ id: "hr-total", effectiveScope: "branch", branch: "HCM-Q1", scopeTarget: "HCM-Q1" }, { employeeId: "OH-0204", branch: "HN-CG" }), false);
});
