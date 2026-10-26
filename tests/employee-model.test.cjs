/* eslint-disable @typescript-eslint/no-require-imports -- Pure TypeScript model tests without another runtime dependency. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
Module._extensions[".ts"] = function loadTs(module, filename) { module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename); };
const { canCreateEmployee, nextEmployeeId } = require("../features/hr/employee-model.ts");

test("employee IDs continue from existing records without clock-based collision", () => {
  assert.equal(nextEmployeeId([{ id: "OH-0248" }, { id: "OH-0271" }, { id: "service-1" }]), "OH-0272");
  assert.equal(nextEmployeeId([{ id: "OH-0271" }, { id: "OH-0272" }]), "OH-0273");
});

test("employee creation rejects duplicate normalized email and inactive status", () => {
  const people = [{ email: "ha.nguyen@ohriise.vn" }];
  assert.equal(canCreateEmployee(people, { email: " HA.NGUYEN@OHRIISE.VN ", status: "active" }), false);
  assert.equal(canCreateEmployee(people, { email: "new@ohriise.vn", status: "inactive" }), false);
  assert.equal(canCreateEmployee(people, { email: "new@ohriise.vn", status: "probation" }), true);
});
