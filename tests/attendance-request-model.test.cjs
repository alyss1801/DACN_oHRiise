/* eslint-disable @typescript-eslint/no-require-imports -- Pure TypeScript model test. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
Module._extensions[".ts"] = function loadTs(module, filename) { module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename); };
const { validateAttendanceRequest } = require("../features/hr/attendance-request-model.ts");

const employee = { id: "OH-0248", managerId: "OH-0184", status: "active" };
const input = { type: "Điều chỉnh chấm công", employee, date: "2026-09-30", today: "2026-10-20", attendance: [{ id: "OH-0248-2026-09-30", employeeId: "OH-0248", date: "2026-09-30", issue: "missing-out", resolution: "open", version: 1 }], periods: [{ id: "2026-09", status: "reconciling" }], requests: [], correctionOut: "17:40" };
test("clock adjustment links a real unresolved record and direct manager", () => {
  const result = validateAttendanceRequest(input);
  assert.equal(result.ok, true);
  assert.equal(result.managerId, "OH-0184");
  assert.equal(result.row.id, input.attendance[0].id);
  assert.equal(validateAttendanceRequest({ ...input, correctionOut: "" }).ok, false);
  assert.equal(validateAttendanceRequest({ ...input, periods: [{ id: "2026-09", status: "closed" }] }).ok, false);
  assert.equal(validateAttendanceRequest({ ...input, requests: [{ type: input.type, employeeId: employee.id, date: input.date, status: "pending" }] }).ok, false);
});
test("OT requires current/future open period and bounded hours", () => {
  const ot = { ...input, type: "Đăng ký OT", date: "2026-10-21", periods: [{ id: "2026-10", status: "reconciling" }], overtimeHours: 2 };
  assert.equal(validateAttendanceRequest(ot).ok, true);
  assert.equal(validateAttendanceRequest({ ...ot, overtimeHours: 8 }).ok, false);
  assert.equal(validateAttendanceRequest({ ...ot, date: "2026-10-19" }).ok, false);
});
