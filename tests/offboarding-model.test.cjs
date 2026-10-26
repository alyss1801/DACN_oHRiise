/* eslint-disable @typescript-eslint/no-require-imports -- Pure TypeScript model tests without another runtime dependency. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
Module._extensions[".ts"] = function loadTs(module, filename) { module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename); };
const { disableIsDue, offboardingChangeBlocker, offboardingInputError, scheduledDisableAt } = require("../features/hr/offboarding-model.ts");

const input = { lastWorkingDay: "2026-10-31", disableAt: "2026-10-31T11:00:00.000Z", sourceType: "employee-request", reason: "Nhân viên xin nghỉ việc", sourceReference: "Quyết định HR-018" };

test("offboarding requires source evidence, reason and a scheduled disable time after work", () => {
  assert.equal(offboardingInputError(input, "2026-10-24"), null);
  assert.match(offboardingInputError({ ...input, disableAt: "2026-10-31T09:00:00.000Z" }, "2026-10-24"), /17:30/);
  assert.match(offboardingInputError({ ...input, reason: "nghỉ" }, "2026-10-24"), /lý do/);
  assert.match(offboardingInputError({ ...input, lastWorkingDay: "2026-10-23" }, "2026-10-24"), /quá khứ/);
});

test("account action is blocked until exact scheduled time; legacy case gets explicit fallback", () => {
  assert.equal(disableIsDue(input, "2026-10-31T10:59:59.000Z"), false);
  assert.equal(disableIsDue(input, "2026-10-31T11:00:00.000Z"), true);
  assert.equal(scheduledDisableAt({ lastWorkingDay: "2026-10-31" }), "2026-10-31T11:00:00.000Z");
  assert.equal(disableIsDue({ lastWorkingDay: "2026-10-31" }, "2026-10-31T10:00:00.000Z"), false);
});

test("reschedule or cancellation stops after any checklist side effect", () => {
  const current = { id: "OFF-1", kind: "offboarding", tasks: [{ id: "account" }, { id: "handover" }] };
  assert.equal(offboardingChangeBlocker(current), null);
  assert.match(offboardingChangeBlocker({ ...current, tasks: [{ id: "handover", doneAt: "2026-10-24T10:00:00Z" }] }), /tác động/);
  assert.match(offboardingChangeBlocker({ ...current, cancelledAt: "2026-10-24T10:00:00Z" }), /kết thúc/);
});
