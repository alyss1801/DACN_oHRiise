/* eslint-disable @typescript-eslint/no-require-imports -- Pure TypeScript model tests without another runtime dependency. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
Module._extensions[".ts"] = function loadTs(module, filename) { module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename); };
const { applyWfhCommand, emptyWfhStore, reviewWfhSession } = require("../features/wfh/wfh-model.ts");

const request = { id: "WFH-1", employeeId: "OH-0248", type: "WFH", employee: "Hà", date: "2026-10-20", status: "approved" };
const command = (action, expectedVersion, overrides = {}) => ({ action, requestId: "WFH-1", employeeId: "OH-0248", expectedVersion, at: "2026-10-20T09:00:00Z", businessDate: "2026-10-20", periodStatus: "reconciling", ...overrides });
const review = (expectedVersion, overrides = {}) => ({ requestId: "WFH-1", employeeId: "OH-0248", expectedVersion, decision: "confirmed", actorId: "OH-0091", actor: "HR Lan", reason: "Đối chiếu báo cáo ngày", at: "2026-10-21T09:00:00Z", periodStatus: "reconciling", hasRawAttendance: false, hasApprovedLeave: false, ...overrides });

test("WFH plan needs approval, owner and business date", () => {
  assert.equal(applyWfhCommand(emptyWfhStore, { ...request, status: "pending" }, command("check-in", 0)).ok, false);
  assert.equal(applyWfhCommand(emptyWfhStore, request, command("check-in", 0, { employeeId: "OH-1" })).ok, false);
  assert.equal(applyWfhCommand(emptyWfhStore, request, command("check-in", 0, { businessDate: "2026-10-21" })).ok, false);
  assert.equal(applyWfhCommand(emptyWfhStore, request, command("check-in", 0, { periodStatus: "closed" })).ok, false);
});

test("one session, immutable submitted report and optimistic version", () => {
  const started = applyWfhCommand(emptyWfhStore, request, command("check-in", 0));
  assert.equal(started.ok, true);
  assert.equal(applyWfhCommand(started.store, request, command("check-in", 0)).ok, false);
  const draft = applyWfhCommand(started.store, request, command("save-report", 1, { reportText: "Hoàn thành tài liệu dự án." }));
  assert.equal(draft.ok, true);
  assert.equal(applyWfhCommand(draft.store, request, command("submit-report", 2)).ok, false);
  const ended = applyWfhCommand(draft.store, request, command("check-out", 2, { at: "2026-10-20T10:00:00Z" }));
  assert.equal(ended.ok, true);
  const submitted = applyWfhCommand(ended.store, request, command("submit-report", 3, { at: "2026-10-20T10:01:00Z" }));
  assert.equal(submitted.ok, true);
  assert.equal(submitted.session.reportText, "Hoàn thành tài liệu dự án.");
  assert.equal(applyWfhCommand(submitted.store, request, command("submit-report", 4)).ok, false);
  assert.equal(started.session.reportSubmittedAt, undefined);
});

test("HR review requires report and distinct actor; stale or duplicate decisions fail", () => {
  const started = applyWfhCommand(emptyWfhStore, request, command("check-in", 0));
  assert.equal(reviewWfhSession(started.store, request, review(1)).ok, false);
  const ended = applyWfhCommand(started.store, request, command("check-out", 1, { at: "2026-10-20T10:00:00Z" }));
  const submitted = applyWfhCommand(ended.store, request, command("submit-report", 2, { at: "2026-10-20T10:01:00Z", reportText: "Đã hoàn thành các công việc trong ngày." }));
  assert.equal(reviewWfhSession(submitted.store, request, review(3, { actorId: "OH-0248" })).ok, false);
  assert.equal(reviewWfhSession(submitted.store, request, review(3, { hasRawAttendance: true })).ok, false);
  assert.equal(reviewWfhSession(submitted.store, request, review(3, { hasApprovedLeave: true })).ok, false);
  assert.equal(reviewWfhSession(submitted.store, request, review(3, { periodStatus: "closed" })).ok, false);
  const confirmed = reviewWfhSession(submitted.store, request, review(3));
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.session.review.decision, "confirmed");
  assert.equal(reviewWfhSession(confirmed.store, request, review(3)).ok, false);
  assert.equal(applyWfhCommand(confirmed.store, request, command("save-report", 4, { reportText: "Overwrite" })).ok, false);
});

test("HR can exclude an unfinished or no-longer-approved session with reason", () => {
  const started = applyWfhCommand(emptyWfhStore, request, command("check-in", 0));
  const excluded = reviewWfhSession(started.store, { ...request, status: "rejected" }, review(1, { decision: "excluded" }));
  assert.equal(excluded.ok, true);
  assert.equal(excluded.session.review.decision, "excluded");
});
