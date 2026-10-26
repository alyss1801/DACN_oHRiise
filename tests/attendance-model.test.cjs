/* eslint-disable @typescript-eslint/no-require-imports -- Pure TypeScript model tests without another runtime dependency. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
Module._extensions[".ts"] = function loadTs(module, filename) { module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename); };
const { applyAttendanceConfirmation, applyAttendanceResolution, approvedLeaveDates, closeTimesheetPeriod, effectiveAttendanceTime, openTimesheetPeriod, reviewAttendanceExplanation, reopenTimesheetPeriod, submitAttendanceExplanation } = require("../features/hr/attendance-model.ts");
const { prepareInternalTimesheetRows, internalTimesheetCsv } = require("../features/hr/internal-timesheet-export.ts");

const fixture = () => ({ employees: [{ id: "OH-1", branch: "HCM-Q1" }], attendance: [{ id: "row-1", employeeId: "OH-1", date: "2026-09-30", shift: "Hành chính", plannedIn: "08:30", plannedOut: "17:30", events: [{ kind: "check-in", at: "08:25", method: "QR" }], issue: "missing-out", resolution: "open" }], attendanceAdjustments: [], attendanceConfirmations: [], periods: [{ id: "2026-09", status: "reconciling", version: 1, snapshots: [] }] });
const command = (version = 1) => ({ attendanceId: "row-1", resolution: "approved", reason: "Đã đối chiếu phiếu xác nhận", correctionOut: "17:35", actor: "HR", at: "2026-10-20T09:00:00Z", businessDate: "2026-10-20", businessTime: "16:00", expectedVersion: version });
const confirmation = (version = 2, overrides = {}) => ({ attendanceId: "row-1", employeeId: "OH-1", expectedVersion: version, decision: "confirmed", actorId: "OH-1", actor: "Nhân viên", reason: "", at: "2026-10-20T10:00:00Z", ...overrides });

test("HR can open a new monthly period once, including after the seed months", () => {
  const opened = openTimesheetPeriod(fixture().periods, "2026-11");
  assert.equal(opened.ok, true);
  assert.equal(opened.periods[0].id, "2026-11");
  assert.equal(openTimesheetPeriod(opened.periods, "2026-11").ok, false);
  assert.equal(openTimesheetPeriod(opened.periods, "2026-13").ok, false);
});

test("an open manual punch blocks closing the period", () => {
  const state = { ...fixture(), selfPunches: [{ id: "P-1", employeeId: "OH-1", date: "2026-09-30", checkInAt: "2026-09-30T01:30:00Z", source: "demo-manual" }] };
  const result = closeTimesheetPeriod(state, "2026-09", "HR", "2026-10-20T09:00:00Z", "2026-10-20", []);
  assert.equal(result.ok, false);
  assert.match(result.error, /chưa check-out/);
});

test("employee explanation routes to snapshotted direct manager before HR can approve", () => {
  const start = fixture();
  start.employees[0].managerId = "OH-2";
  start.employees.push({ id: "OH-2", status: "active", branch: "HCM-Q1" });
  const requested = applyAttendanceResolution(start, { ...command(), resolution: "explanation", correctionOut: undefined });
  assert.equal(requested.ok, true);
  assert.equal(applyAttendanceResolution(requested.state, command(2)).ok, false);
  const input = { attendanceId: "row-1", employeeId: "OH-1", expectedVersion: 2, actorId: "OH-1", text: "Tôi đã hoàn tất ca, có biên bản đối chiếu.", at: "2026-10-20T10:00:00Z" };
  assert.equal(submitAttendanceExplanation(requested.state, { ...input, actorId: "OH-2" }).ok, false);
  const submitted = submitAttendanceExplanation(requested.state, input);
  assert.equal(submitted.ok, true);
  assert.equal(submitAttendanceExplanation(submitted.state, input).ok, false);
  const review = { explanationId: submitted.explanation.id, actorId: "OH-2", decision: "confirmed", reason: "Đã đối chiếu với lịch nhóm.", at: "2026-10-20T11:00:00Z" };
  assert.equal(reviewAttendanceExplanation(submitted.state, { ...review, actorId: "OH-3" }).ok, false);
  const confirmed = reviewAttendanceExplanation(submitted.state, review);
  assert.equal(confirmed.ok, true);
  assert.equal(reviewAttendanceExplanation(confirmed.state, review).ok, false);
  const approved = applyAttendanceResolution(confirmed.state, command(2));
  assert.equal(approved.ok, true);
  assert.equal(closeTimesheetPeriod(approved.state, "2026-09", "HR", "2026-10-20T12:00:00Z", "2026-10-20", []).ok, false);
  const employeeConfirmed = applyAttendanceConfirmation(approved.state, confirmation(3));
  assert.equal(employeeConfirmed.ok, true);
  assert.equal(closeTimesheetPeriod(employeeConfirmed.state, "2026-09", "HR", "2026-10-20T12:00:00Z", "2026-10-20", []).ok, true);
});

test("raw events stay immutable; adjustment has version and cannot be applied twice", () => {
  const start = fixture();
  const result = applyAttendanceResolution(start, command());
  assert.equal(result.ok, true);
  assert.deepEqual(result.state.attendance[0].events, start.attendance[0].events);
  assert.equal(effectiveAttendanceTime(result.state.attendance[0], result.state.attendanceAdjustments, "check-out"), "17:35");
  assert.equal(result.state.attendanceAdjustments[0].version, 2);
  assert.equal(applyAttendanceResolution(result.state, command()).ok, false);
});

test("missing checkout cannot be decided before the shift ends", () => {
  const start = fixture();
  start.attendance[0].date = "2026-10-20";
  start.periods[0].id = "2026-10";
  assert.equal(applyAttendanceResolution(start, command()).ok, false);
});

test("close blocks unresolved rows; closed snapshot stays unchanged after reopen", () => {
  const start = fixture();
  assert.equal(closeTimesheetPeriod(start, "2026-09", "HR", "2026-10-20T09:00:00Z", "2026-10-20", []).ok, false);
  const approved = applyAttendanceResolution(start, command()).state;
  assert.equal(closeTimesheetPeriod(approved, "2026-09", "HR", "2026-10-20T09:01:00Z", "2026-10-20", []).ok, false);
  const confirmed = applyAttendanceConfirmation(approved, confirmation()).state;
  const leaveDates = [{ employeeId: "OH-1", date: "2026-09-29", portion: "full" }];
  const closed = closeTimesheetPeriod(confirmed, "2026-09", "HR", "2026-10-20T09:01:00Z", "2026-10-20", leaveDates);
  assert.equal(closed.ok, true);
  assert.equal(closed.snapshot.rows[0].effectiveOut, "17:35");
  assert.equal(closed.snapshot.rows[0].confirmation, "confirmed");
  assert.deepEqual(closed.snapshot.leaveDates, [{ ...leaveDates[0], branch: "HCM-Q1" }]);
  const exported = prepareInternalTimesheetRows(closed.snapshot, [{ id: "OH-1", name: "NhÃ¢n viÃªn demo" }], "2026-09", "HCM-Q1");
  assert.equal(exported[0].validDays, 1);
  assert.equal(exported[0].approvedLeaveDays, 1);
  assert.match(internalTimesheetCsv(exported), /2026-09/);
  assert.equal(applyAttendanceResolution({ ...approved, periods: closed.periods }, command(2)).ok, false);
  const reopened = reopenTimesheetPeriod(closed.periods, "2026-09", "Cần đối soát bổ sung");
  assert.equal(reopened.ok, true);
  assert.equal(reopened.periods[0].version, 2);
  assert.equal(reopened.periods[0].snapshots[0].version, 1);
  assert.equal(reopened.periods[0].snapshots[0].rows[0].effectiveOut, "17:35");
});

test("approved leave dates freeze half-day and exclude weekends", () => {
  const requests = [{ employeeId: "OH-1", status: "approved", from: "2026-09-25", to: "2026-09-28", portion: "full" }, { employeeId: "OH-1", status: "approved", from: "2026-09-30", to: "2026-09-30", portion: "morning" }];
  assert.deepEqual(approvedLeaveDates(requests, "2026-09"), [{ employeeId: "OH-1", date: "2026-09-25", portion: "full" }, { employeeId: "OH-1", date: "2026-09-28", portion: "full" }, { employeeId: "OH-1", date: "2026-09-30", portion: "morning" }]);
});

test("snapshot export includes leave-only employee and does not double count full-day leave", () => {
  const snapshot = { version: 3, at: "2026-10-01T09:00:00Z", actor: "HR", rows: [{ attendanceId: "a", employeeId: "OH-1", branch: "HCM-Q1", date: "2026-09-29", issue: "none", resolution: "open", effectiveIn: "08:30", effectiveOut: "17:30" }], leaveDates: [{ employeeId: "OH-1", date: "2026-09-29", portion: "full", branch: "HCM-Q1" }, { employeeId: "OH-2", date: "2026-09-29", portion: "full", branch: "HCM-Q1" }] };
  const rows = prepareInternalTimesheetRows(snapshot, [{ id: "OH-1", name: "A" }, { id: "OH-2", name: "B" }], "2026-09", "HCM-Q1");
  assert.equal(rows.length, 2);
  assert.equal(rows[0].validDays, 0);
  assert.equal(rows[0].approvedLeaveDays, 1);
  assert.equal(rows[1].approvedLeaveDays, 1);
  assert.equal(rows[1].snapshotVersion, 3);
});

test("WFH needs HR decision before closing; confirmed evidence is frozen and counted once", () => {
  const state = fixture();
  const approved = applyAttendanceConfirmation(applyAttendanceResolution(state, command()).state, confirmation()).state;
  const session = { requestId: "WFH-1", employeeId: "OH-1", date: "2026-09-28", version: 4, checkInAt: "2026-09-28T01:30:00Z", checkOutAt: "2026-09-28T10:30:00Z", reportDraft: "Đã hoàn thành việc", reportSubmittedAt: "2026-09-28T10:40:00Z" };
  const plan = { id: "WFH-1", type: "WFH", status: "approved", employeeId: "OH-1", date: "2026-09-28" };
  const close = (sessions, leaves = [], requests = [plan]) => closeTimesheetPeriod(approved, "2026-09", "HR", "2026-10-20T09:00:00Z", "2026-10-20", leaves, sessions, requests);
  assert.equal(close([session]).ok, false);
  const confirmed = { ...session, review: { decision: "confirmed", actorId: "OH-9", actor: "HR", at: "2026-09-29T02:00:00Z", reason: "Đối chiếu báo cáo" } };
  assert.equal(close([confirmed], [{ employeeId: "OH-1", date: "2026-09-28", portion: "full" }]).ok, false);
  assert.equal(close([{ ...confirmed, date: "2026-09-30" }]).ok, false);
  assert.equal(close([confirmed], [], [{ ...plan, status: "rejected" }]).ok, false);
  const result = close([confirmed]);
  assert.equal(result.ok, true);
  assert.equal(result.snapshot.wfhDays.length, 1);
  assert.equal(result.snapshot.wfhDays[0].requestId, "WFH-1");
  const exported = prepareInternalTimesheetRows(result.snapshot, [{ id: "OH-1", name: "A" }], "2026-09");
  assert.equal(exported[0].confirmedWfhDays, 1);
  assert.equal(exported[0].validDays, 2);
  assert.match(internalTimesheetCsv(exported), /Trong đó WFH đã xác nhận/);
  const duplicate = { ...confirmed, requestId: "WFH-2" };
  assert.equal(close([confirmed, duplicate], [], [plan, { ...plan, id: "WFH-2" }]).ok, false);
  assert.equal(closeTimesheetPeriod({ ...approved, periods: result.periods }, "2026-09", "HR", "2026-10-20T09:01:00Z", "2026-10-20", [], [confirmed], [plan]).ok, false);
});

test("employee dispute blocks close; HR revision requires fresh confirmation", () => {
  const approved = applyAttendanceResolution(fixture(), command()).state;
  const disputed = applyAttendanceConfirmation(approved, confirmation(2, { decision: "disputed", reason: "Giờ ra thực tế chưa khớp" }));
  assert.equal(disputed.ok, true);
  assert.equal(closeTimesheetPeriod(disputed.state, "2026-09", "HR", "2026-10-20T11:00:00Z", "2026-10-20", []).ok, false);
  assert.equal(applyAttendanceConfirmation(disputed.state, confirmation(2)).ok, false);
  const revised = applyAttendanceResolution(disputed.state, { ...command(2), correctionOut: "17:45", reason: "Đối soát lại cùng nhân viên" });
  assert.equal(revised.ok, true);
  assert.equal(effectiveAttendanceTime(revised.state.attendance[0], revised.state.attendanceAdjustments, "check-out"), "17:45");
  assert.equal(closeTimesheetPeriod(revised.state, "2026-09", "HR", "2026-10-20T11:00:00Z", "2026-10-20", []).ok, false);
  const confirmed = applyAttendanceConfirmation(revised.state, confirmation(3));
  assert.equal(confirmed.ok, true);
  assert.equal(closeTimesheetPeriod(confirmed.state, "2026-09", "HR", "2026-10-20T11:00:00Z", "2026-10-20", []).ok, true);
});

test("HR exception cannot be self-issued and needs evidence", () => {
  const approved = applyAttendanceResolution(fixture(), command()).state;
  assert.equal(applyAttendanceConfirmation(approved, confirmation(2, { decision: "exception", reason: "Nhân sự vắng mặt" })).ok, false);
  assert.equal(applyAttendanceConfirmation(approved, confirmation(2, { decision: "exception", actorId: "OH-2", reason: "Ngắn" })).ok, false);
  const exception = applyAttendanceConfirmation(approved, confirmation(2, { decision: "exception", actorId: "OH-2", actor: "HR khác", reason: "Nhân viên không thể phản hồi; đối chiếu chứng từ" }));
  assert.equal(exception.ok, true);
  const closed = closeTimesheetPeriod(exception.state, "2026-09", "HR", "2026-10-20T11:00:00Z", "2026-10-20", []);
  assert.equal(closed.ok, true);
  assert.equal(closed.snapshot.rows[0].confirmation, "exception");
});
