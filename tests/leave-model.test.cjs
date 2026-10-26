/* eslint-disable @typescript-eslint/no-require-imports -- Local TypeScript hook for the pure demo model. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
Module._extensions[".ts"] = function loadTs(module, filename) {
  module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
};
const { effectiveLeaveEntitlement, emptyLeaveStore, leaveDays, leaveBalance, submitLeave, transitionLeave } = require("../features/leave/leave-model.ts");
const now = "2026-10-20T09:00:00.000Z";
const input = { id: "LV-1", employeeId: "OH-0248", managerId: "OH-0184", hrReviewerId: "OH-0091", type: "annual", from: "2026-10-26", to: "2026-10-28", portion: "full", reason: "Nghỉ việc gia đình", handover: "Bùi Thanh Tâm" };
function submit(store = emptyLeaveStore, patch = {}) { return submitLeave(store, { ...input, ...patch }, now, 0, "2026-10-20", { days: 12, version: 1 }); }
function act(store, actor, action, note = "Đã kiểm tra đủ thông tin") { return transitionLeave(store, "LV-1", actor, action, note, now); }

test("working days and half-day exclude weekends", () => {
  assert.equal(leaveDays("2026-10-23", "2026-10-27", "full"), 3);
  assert.equal(leaveDays("2026-10-24", "2026-10-24", "morning"), 0);
  assert.equal(leaveDays("2026-10-26", "2026-10-26", "afternoon"), 0.5);
  assert.equal(leaveDays("2026-10-26", "2026-10-27", "morning"), 0);
});
test("leave policy effective date and version are frozen on submission", () => {
  const base = { group: "Nghỉ phép", name: "Phép năm được cấp", value: "12", effectiveAt: "2026-01-01", version: 1, status: "active" };
  const future = { ...base, value: "15", effectiveAt: "2026-11-01", version: 2, status: "scheduled" };
  assert.deepEqual(effectiveLeaveEntitlement([base, future], "2026-10-26"), { days: 12, version: 1 });
  assert.deepEqual(effectiveLeaveEntitlement([base, future], "2026-11-02"), { days: 15, version: 2 });
  assert.deepEqual(effectiveLeaveEntitlement([{ ...base, status: "retired" }, { ...future, status: "active" }], "2026-10-26"), { days: 12, version: 1 });
  const result = submit();
  assert.equal(result.request.policyVersion, 1);
  assert.equal(result.request.entitlementAtSubmit, 12);
  assert.equal(submitLeave(emptyLeaveStore, input, now, 0, "2026-10-20", { days: 0, version: 2 }).ok, false);
});
test("two-stage approval reserves and then uses the same balance", () => {
  const created = submit(); assert.equal(created.ok, true);
  assert.deepEqual(leaveBalance(created.store, input.employeeId), { entitlement: 12, adjustment: 0, used: 0, reserved: 3, available: 9 });
  assert.equal(act(created.store, input.employeeId, "approve").ok, false);
  assert.equal(act(created.store, "OH-0259", "approve").ok, false);
  const manager = act(created.store, input.managerId, "approve"); assert.equal(manager.request.status, "hr-pending");
  assert.equal(act(manager.store, input.managerId, "approve").ok, false);
  const hr = act(manager.store, input.hrReviewerId, "approve"); assert.equal(hr.request.status, "approved");
  assert.deepEqual(leaveBalance(hr.store, input.employeeId), { entitlement: 12, adjustment: 0, used: 3, reserved: 0, available: 9 });
  assert.equal(act(hr.store, input.hrReviewerId, "approve").ok, false);
});
test("withdraw and cancellation refund only after valid transition", () => {
  const created = submit();
  const withdrawn = act(created.store, input.employeeId, "withdraw"); assert.equal(withdrawn.request.status, "withdrawn");
  assert.equal(leaveBalance(withdrawn.store, input.employeeId).available, 12);
  assert.equal(act(withdrawn.store, input.employeeId, "withdraw").ok, false);
  const approved = act(act(created.store, input.managerId, "approve").store, input.hrReviewerId, "approve");
  const pendingCancel = act(approved.store, input.employeeId, "request-cancellation");
  assert.equal(leaveBalance(pendingCancel.store, input.employeeId).available, 9);
  assert.equal(act(pendingCancel.store, input.managerId, "approve-cancellation").ok, false);
  const cancelled = act(pendingCancel.store, input.hrReviewerId, "approve-cancellation");
  assert.equal(leaveBalance(cancelled.store, input.employeeId).available, 12);
});
test("duplicates, overlap, insufficient balance, past dates and self-approval fail", () => {
  const created = submit();
  assert.equal(submit(created.store).ok, false);
  assert.equal(submit(created.store, { id: "LV-2", from: "2026-10-27", to: "2026-10-29" }).ok, false);
  assert.equal(submit(emptyLeaveStore, { id: "LV-3", from: "2026-10-01", to: "2026-10-01" }).ok, false);
  assert.equal(submit(emptyLeaveStore, { id: "LV-4", from: "2026-10-26", to: "2026-11-20" }).ok, false);
  assert.equal(submit(emptyLeaveStore, { id: "LV-5", managerId: input.employeeId }).ok, false);
});
