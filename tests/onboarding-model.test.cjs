/* eslint-disable @typescript-eslint/no-require-imports -- Pure TypeScript domain tests without another runtime dependency. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
Module._extensions[".ts"] = function loadTs(module, filename) { module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename); };
const { completeOnboardingAccountTask } = require("../features/hr/onboarding-model.ts");

const state = () => ({
  employees: [{ id: "OH-1", status: "probation" }],
  cases: [{ id: "ON-1", kind: "onboarding", employeeId: "OH-1", startedAt: "2026-10-01", tasks: [
    { id: "profile", doneAt: "2026-10-01T01:00:00Z" },
    { id: "account" },
  ] }],
});
const command = { caseId: "ON-1", employeeId: "OH-1", accountId: "user-1", actorId: "system-admin", note: "Đã đối chiếu hồ sơ", at: "2026-10-24T01:00:00Z" };

test("Admin account result completes the matching onboarding checklist exactly once", () => {
  const result = completeOnboardingAccountTask(state(), command);
  assert.equal(result.ok, true);
  assert.equal(result.case.completedAt, command.at);
  assert.match(result.case.tasks.find((item) => item.id === "account").note, /user-1/);
  assert.equal(completeOnboardingAccountTask(result.state, command).ok, false);
});

test("onboarding account action rejects wrong employee, self action and missing evidence", () => {
  assert.equal(completeOnboardingAccountTask(state(), { ...command, employeeId: "OH-2" }).ok, false);
  assert.equal(completeOnboardingAccountTask(state(), { ...command, actorId: "OH-1" }).ok, false);
  assert.equal(completeOnboardingAccountTask(state(), { ...command, note: "short" }).ok, false);
  assert.equal(completeOnboardingAccountTask(state(), { ...command, accountId: "" }).ok, false);
});
