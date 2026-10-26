/* eslint-disable @typescript-eslint/no-require-imports -- Pure TypeScript model test. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
Module._extensions[".ts"] = function loadTs(module, filename) { module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename); };
const { recordSelfPunch } = require("../features/hr/self-punch-model.ts");

const state = () => ({ employees: [{ id: "OH-1", status: "active" }], attendance: [], selfPunches: [], periods: [{ id: "2026-10", status: "reconciling" }] });
test("manual demo check-in is one open session, checkout creates one raw attendance row", () => {
  const checkIn = recordSelfPunch(state(), { employeeId: "OH-1", kind: "check-in", at: "2026-10-21T01:30:00Z", businessDate: "2026-10-21" });
  assert.equal(checkIn.ok, true);
  assert.equal(checkIn.state.attendance.length, 0);
  assert.equal(recordSelfPunch(checkIn.state, { employeeId: "OH-1", kind: "check-in", at: "2026-10-21T01:31:00Z", businessDate: "2026-10-21" }).ok, false);
  const checkOut = recordSelfPunch(checkIn.state, { employeeId: "OH-1", kind: "check-out", at: "2026-10-21T10:40:00Z", businessDate: "2026-10-21" });
  assert.equal(checkOut.ok, true);
  assert.equal(checkOut.state.attendance.length, 1);
  assert.equal(checkOut.state.attendance[0].events.length, 2);
  assert.equal(checkOut.state.attendance[0].events[0].method, "DEMO");
  assert.equal(recordSelfPunch(checkOut.state, { employeeId: "OH-1", kind: "check-out", at: "2026-10-21T10:41:00Z", businessDate: "2026-10-21" }).ok, false);
});
test("closed period, existing row, invalid time and wrong business day block punches", () => {
  assert.equal(recordSelfPunch({ ...state(), periods: [{ id: "2026-10", status: "closed" }] }, { employeeId: "OH-1", kind: "check-in", at: "2026-10-21T01:30:00Z", businessDate: "2026-10-21" }).ok, false);
  assert.equal(recordSelfPunch({ ...state(), attendance: [{ employeeId: "OH-1", date: "2026-10-21" }] }, { employeeId: "OH-1", kind: "check-in", at: "2026-10-21T01:30:00Z", businessDate: "2026-10-21" }).ok, false);
  assert.equal(recordSelfPunch(state(), { employeeId: "OH-1", kind: "check-in", at: "bad", businessDate: "2026-10-21" }).ok, false);
  assert.equal(recordSelfPunch(state(), { employeeId: "OH-1", kind: "check-in", at: "2026-10-21T01:30:00Z", businessDate: "2026-10-22" }).ok, false);
});
test("GPS and device demo choices persist as labeled raw events without claiming verification", () => {
  const checkIn = recordSelfPunch(state(), { employeeId: "OH-1", kind: "check-in", method: "gps", at: "2026-10-21T01:30:00Z", businessDate: "2026-10-21" });
  assert.equal(checkIn.ok, true);
  assert.equal(checkIn.punch.checkInMethod, "gps");
  const checkOut = recordSelfPunch(checkIn.state, { employeeId: "OH-1", kind: "check-out", method: "face", at: "2026-10-21T10:40:00Z", businessDate: "2026-10-21" });
  assert.equal(checkOut.ok, true);
  assert.equal(checkOut.punch.checkOutMethod, "face");
  assert.deepEqual(checkOut.state.attendance[0].events.map((event) => event.method), ["DEMO", "DEMO"]);
  assert.match(checkOut.state.attendance[0].events[0].note, /GPS/);
  assert.match(checkOut.state.attendance[0].events[1].note, /khuôn mặt/);
});
