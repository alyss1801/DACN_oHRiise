export type LeaveType = "annual" | "unpaid";
export type LeavePortion = "full" | "morning" | "afternoon";
export type LeaveStatus = "manager-pending" | "hr-pending" | "approved" | "rejected" | "withdrawn" | "cancellation-pending" | "cancelled";
export type LeaveEvent = { at: string; actorId: string; action: string; note: string };
export type LeaveRequest = {
  id: string; employeeId: string; managerId: string; hrReviewerId: string; type: LeaveType;
  from: string; to: string; portion: LeavePortion; days: number; reason: string; handover: string;
  policyVersion?: number; entitlementAtSubmit?: number;
  status: LeaveStatus; events: LeaveEvent[]; submittedAt: string;
};
export type LeaveStore = { version: 1; requests: LeaveRequest[] };
export type LeaveResult = { ok: true; store: LeaveStore; request: LeaveRequest } | { ok: false; error: string };
export const emptyLeaveStore: LeaveStore = { version: 1, requests: [] };

export function effectiveLeaveEntitlement(policies: HrPolicy[], date: string) {
  const policy = policies.filter((item) => item.group === "Nghỉ phép" && item.name === "Phép năm được cấp" && ["active", "scheduled", "retired"].includes(item.status) && item.effectiveAt <= date)
    .sort((a, b) => b.effectiveAt.localeCompare(a.effectiveAt) || b.version - a.version)[0];
  const days = Number(policy?.value);
  return policy && Number.isFinite(days) && days >= 0 ? { days, version: policy.version } : null;
}

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
function validDate(value: string) {
  if (!isoDate.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function dayStamp(value: string) { return new Date(`${value}T00:00:00Z`).getTime(); }
export function leaveDays(from: string, to: string, portion: LeavePortion): number {
  if (!validDate(from) || !validDate(to) || from > to || (portion !== "full" && from !== to)) return 0;
  let days = 0;
  for (let stamp = dayStamp(from); stamp <= dayStamp(to); stamp += 86_400_000) {
    const weekday = new Date(stamp).getUTCDay();
    if (weekday !== 0 && weekday !== 6) days += 1;
  }
  return portion === "full" ? days : days ? 0.5 : 0;
}
export function leaveBalance(store: LeaveStore, employeeId: string, adjustment = 0, entitlement = 12, year = "2026") {
  const annual = store.requests.filter((item) => item.employeeId === employeeId && item.type === "annual" && item.from.startsWith(year));
  const used = annual.filter((item) => item.status === "approved" || item.status === "cancellation-pending").reduce((sum, item) => sum + item.days, 0);
  const reserved = annual.filter((item) => item.status === "manager-pending" || item.status === "hr-pending").reduce((sum, item) => sum + item.days, 0);
  return { entitlement, adjustment, used, reserved, available: entitlement + adjustment - used - reserved };
}
export function submitLeave(store: LeaveStore, input: Omit<LeaveRequest, "status" | "days" | "events" | "submittedAt" | "policyVersion" | "entitlementAtSubmit">, now: string, adjustment: number, businessDate: string, policy: { days: number; version: number }): LeaveResult {
  if (store.requests.some((item) => item.id === input.id)) return { ok: false, error: "Mã đơn đã tồn tại." };
  if (!input.employeeId || !input.managerId || !input.hrReviewerId || input.employeeId === input.managerId || input.employeeId === input.hrReviewerId || input.managerId === input.hrReviewerId) return { ok: false, error: "Tuyến duyệt không hợp lệ hoặc có tự duyệt." };
  const days = leaveDays(input.from, input.to, input.portion);
  if (!days) return { ok: false, error: "Khoảng ngày nghỉ không hợp lệ hoặc không có ngày làm việc." };
  if (input.from < businessDate) return { ok: false, error: "Không thể tạo đơn cho ngày đã qua." };
  if (input.reason.trim().length < 8 || !input.handover.trim()) return { ok: false, error: "Cần lý do ít nhất 8 ký tự và người bàn giao." };
  if (store.requests.some((item) => item.employeeId === input.employeeId && !["rejected", "withdrawn", "cancelled"].includes(item.status) && input.from <= item.to && input.to >= item.from)) return { ok: false, error: "Khoảng nghỉ trùng với đơn đang hiệu lực." };
  if (input.from.slice(0, 4) !== input.to.slice(0, 4)) return { ok: false, error: "Đơn nghỉ qua năm cần tách thành hai đơn." };
  if (!Number.isFinite(policy.days) || policy.days < 0 || policy.version < 1) return { ok: false, error: "Chưa có chính sách quỹ phép hợp lệ." };
  if (input.type === "annual" && leaveBalance(store, input.employeeId, adjustment, policy.days, input.from.slice(0, 4)).available < days) return { ok: false, error: "Số ngày phép khả dụng không đủ." };
  const request: LeaveRequest = { ...input, days, policyVersion: policy.version, entitlementAtSubmit: policy.days, status: "manager-pending", submittedAt: now, events: [{ at: now, actorId: input.employeeId, action: "submitted", note: input.reason.trim() }] };
  return { ok: true, store: { ...store, requests: [request, ...store.requests] }, request };
}
export function transitionLeave(store: LeaveStore, id: string, actorId: string, action: "approve" | "reject" | "withdraw" | "request-cancellation" | "approve-cancellation" | "reject-cancellation", note: string, now: string): LeaveResult {
  const current = store.requests.find((item) => item.id === id);
  if (!current) return { ok: false, error: "Không tìm thấy đơn nghỉ." };
  const owner = actorId === current.employeeId;
  const manager = actorId === current.managerId;
  const hr = actorId === current.hrReviewerId;
  let status: LeaveStatus | undefined;
  if (action === "withdraw" && owner && ["manager-pending", "hr-pending"].includes(current.status)) status = "withdrawn";
  if (action === "request-cancellation" && owner && current.status === "approved") status = "cancellation-pending";
  if (action === "approve" && manager && current.status === "manager-pending") status = "hr-pending";
  if (action === "approve" && hr && current.status === "hr-pending") status = "approved";
  if (action === "reject" && ((manager && current.status === "manager-pending") || (hr && current.status === "hr-pending"))) status = "rejected";
  if (action === "approve-cancellation" && hr && current.status === "cancellation-pending") status = "cancelled";
  if (action === "reject-cancellation" && hr && current.status === "cancellation-pending") status = "approved";
  if (!status) return { ok: false, error: "Bạn không phải người xử lý bước hiện tại, hoặc đơn đã đổi trạng thái." };
  if (["reject", "request-cancellation", "approve-cancellation", "reject-cancellation"].includes(action) && note.trim().length < 8) return { ok: false, error: "Cần ghi chú ít nhất 8 ký tự." };
  const request = { ...current, status, events: [...current.events, { at: now, actorId, action, note: note.trim() }] };
  return { ok: true, store: { ...store, requests: store.requests.map((item) => item.id === id ? request : item) }, request };
}
import type { HrPolicy } from "@/features/hr/hr-demo-data";
