import type { BusinessRequest } from "@/features/demo/demo-data-context";

export type WfhSession = { requestId: string; employeeId: string; date: string; version: number; checkInAt: string; checkOutAt?: string; reportDraft: string; reportSubmittedAt?: string; reportText?: string; review?: { decision: "confirmed" | "excluded"; actorId: string; actor: string; at: string; reason: string } };
export type WfhStore = { version: 1; sessions: WfhSession[] };
export const emptyWfhStore: WfhStore = { version: 1, sessions: [] };
export type WfhCommand = { action: "check-in" | "check-out" | "save-report" | "submit-report"; requestId: string; employeeId: string; expectedVersion: number; at: string; businessDate: string; periodStatus: "reconciling" | "closed" | "exported" | undefined; reportText?: string };
export type WfhResult = { ok: true; store: WfhStore; session: WfhSession } | { ok: false; error: string };
export type WfhReviewCommand = { requestId: string; employeeId: string; expectedVersion: number; decision: "confirmed" | "excluded"; actorId: string; actor: string; reason: string; at: string; periodStatus: "reconciling" | "closed" | "exported" | undefined; hasRawAttendance: boolean; hasApprovedLeave: boolean };

export function applyWfhCommand(store: WfhStore, request: BusinessRequest | undefined, command: WfhCommand): WfhResult {
  if (!request || request.type !== "WFH" || request.id !== command.requestId || request.status !== "approved") return { ok: false, error: "Chỉ đơn WFH đã duyệt mới được mở phiên." };
  if (request.employeeId !== command.employeeId) return { ok: false, error: "Phiên WFH chỉ thuộc về người gửi đơn." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(request.date)) return { ok: false, error: "Đơn WFH cũ chưa có ngày chuẩn ISO; cần tạo đơn mới để mở phiên." };
  if (command.periodStatus !== "reconciling") return { ok: false, error: "Kỳ công đã đóng hoặc chưa tồn tại; không thể thay đổi phiên WFH." };
  const current = store.sessions.find((item) => item.requestId === request.id);
  if ((current?.version ?? 0) !== command.expectedVersion) return { ok: false, error: "Phiên đã thay đổi; tải lại trước khi tiếp tục." };
  if (current?.review) return { ok: false, error: "Phiên đã được HR đối soát; không thể sửa đè." };
  if (command.action === "check-in") {
    if (current || command.businessDate !== request.date) return { ok: false, error: "Chỉ bắt đầu một lần vào đúng ngày WFH được duyệt." };
    const session: WfhSession = { requestId: request.id, employeeId: command.employeeId, date: request.date, version: 1, checkInAt: command.at, reportDraft: "" };
    return { ok: true, store: { ...store, sessions: [session, ...store.sessions] }, session };
  }
  if (!current) return { ok: false, error: "Chưa bắt đầu phiên WFH." };
  if (current.reportSubmittedAt) return { ok: false, error: "Báo cáo đã nộp; không thể ghi đè." };
  let updated: WfhSession;
  if (command.action === "check-out") {
    if (current.checkOutAt || command.businessDate !== current.date || command.at <= current.checkInAt) return { ok: false, error: "Chỉ kết thúc một lần sau giờ bắt đầu trong ngày WFH." };
    updated = { ...current, version: current.version + 1, checkOutAt: command.at };
  } else if (command.action === "save-report") {
    if (command.reportText === undefined) return { ok: false, error: "Không có nội dung nháp." };
    updated = { ...current, version: current.version + 1, reportDraft: command.reportText };
  } else {
    const content = command.reportText?.trim() ?? current.reportDraft.trim();
    if (!current.checkOutAt || content.length < 10) return { ok: false, error: "Cần kết thúc phiên và nhập báo cáo ít nhất 10 ký tự." };
    updated = { ...current, version: current.version + 1, reportDraft: content, reportText: content, reportSubmittedAt: command.at };
  }
  return { ok: true, store: { ...store, sessions: store.sessions.map((item) => item.requestId === request.id ? updated : item) }, session: updated };
}

export function reviewWfhSession(store: WfhStore, request: BusinessRequest | undefined, command: WfhReviewCommand): WfhResult {
  const current = store.sessions.find((item) => item.requestId === command.requestId);
  if (!current || !request || request.type !== "WFH" || request.id !== current.requestId || request.employeeId !== current.employeeId || current.employeeId !== command.employeeId || request.date !== current.date) return { ok: false, error: "Đơn và phiên WFH không còn khớp; cần đối soát dữ liệu." };
  if (command.periodStatus !== "reconciling") return { ok: false, error: "Kỳ công đã đóng hoặc chưa tồn tại; không thể đối soát phiên." };
  if (current.version !== command.expectedVersion || current.review) return { ok: false, error: "Phiên đã được xử lý hoặc thay đổi; tải lại trước khi tiếp tục." };
  if (!command.actorId || command.actorId === current.employeeId || !command.actor.trim() || command.reason.trim().length < 8) return { ok: false, error: "HR khác chủ phiên phải ghi lý do/căn cứ ít nhất 8 ký tự." };
  if (command.decision === "confirmed" && (request.status !== "approved" || !current.checkOutAt || !current.reportSubmittedAt || command.hasRawAttendance || command.hasApprovedLeave || store.sessions.some((item) => item.requestId !== current.requestId && item.employeeId === current.employeeId && item.date === current.date && item.review?.decision === "confirmed"))) return { ok: false, error: "Cần đơn còn hiệu lực, check-out, báo cáo; không được trùng công gốc, WFH hoặc nghỉ phép đã duyệt." };
  const updated: WfhSession = { ...current, version: current.version + 1, review: { decision: command.decision, actorId: command.actorId, actor: command.actor.trim(), at: command.at, reason: command.reason.trim() } };
  return { ok: true, store: { ...store, sessions: store.sessions.map((item) => item.requestId === current.requestId ? updated : item) }, session: updated };
}
