import type { HrAttendance, HrAttendanceAdjustment, HrAttendanceConfirmation, HrAttendanceExplanation, HrState, TimesheetPeriod, TimesheetSnapshot } from "./hr-demo-data";
import type { LeaveRequest } from "@/features/leave/leave-model";
import type { WfhSession } from "@/features/wfh/wfh-model";
import type { BusinessRequest } from "@/features/demo/demo-data-context";

type AttendanceState = Pick<HrState, "attendance" | "attendanceAdjustments" | "attendanceConfirmations" | "attendanceExplanations" | "periods" | "employees"> & { selfPunches?: HrState["selfPunches"] };
export type AttendanceCommand = { attendanceId: string; resolution: Exclude<HrAttendance["resolution"], "open">; reason: string; correctionIn?: string; correctionOut?: string; actor: string; at: string; businessDate: string; businessTime: string; expectedVersion: number };
export type AttendanceResult = { ok: true; state: AttendanceState; adjustment: HrAttendanceAdjustment } | { ok: false; error: string };
export type AttendanceConfirmationCommand = { attendanceId: string; employeeId: string; expectedVersion: number; decision: HrAttendanceConfirmation["decision"]; actorId: string; actor: string; reason: string; at: string };
export type AttendanceConfirmationResult = { ok: true; state: AttendanceState; confirmation: HrAttendanceConfirmation } | { ok: false; error: string };
export type AttendanceExplanationResult = { ok: true; state: AttendanceState; explanation: HrAttendanceExplanation } | { ok: false; error: string };
export type PeriodResult = { ok: true; periods: TimesheetPeriod[]; snapshot?: TimesheetSnapshot } | { ok: false; error: string };

export function effectiveAttendanceTime(row: HrAttendance, adjustments: HrAttendanceAdjustment[], kind: "check-in" | "check-out"): string | null {
  const correction = adjustments.find((item) => item.attendanceId === row.id && item.resolution === "approved");
  return (kind === "check-in" ? correction?.correctionIn : correction?.correctionOut) ?? row.events.find((event) => event.kind === kind)?.at ?? null;
}

export function latestAttendanceConfirmation(confirmations: HrAttendanceConfirmation[], row: HrAttendance) {
  return confirmations.find((item) => item.attendanceId === row.id && item.attendanceVersion === (row.version ?? 1));
}

export function latestAttendanceExplanation(explanations: HrAttendanceExplanation[], row: HrAttendance) {
  return explanations.find((item) => item.attendanceId === row.id && item.attendanceVersion === (row.version ?? 1));
}

export function submitAttendanceExplanation(state: AttendanceState, input: { attendanceId: string; employeeId: string; expectedVersion: number; actorId: string; text: string; at: string }): AttendanceExplanationResult {
  const row = state.attendance.find((item) => item.id === input.attendanceId && item.employeeId === input.employeeId);
  const person = state.employees.find((item) => item.id === input.employeeId);
  const manager = state.employees.find((item) => item.id === person?.managerId);
  if (!row || row.resolution !== "explanation" || (row.version ?? 1) !== input.expectedVersion || input.actorId !== row.employeeId) return { ok: false, error: "Chỉ nhân viên được yêu cầu mới có thể nộp giải trình cho phiên bản công này." };
  if (state.periods.find((item) => item.id === row.date.slice(0, 7))?.status !== "reconciling") return { ok: false, error: "Kỳ công không còn mở để giải trình." };
  if (!manager || manager.status === "inactive" || manager.id === person?.id) return { ok: false, error: "Chưa có quản lý trực tiếp hợp lệ; cần HR sửa tuyến quản lý." };
  if (input.text.trim().length < 10 || latestAttendanceExplanation(state.attendanceExplanations ?? [], row)) return { ok: false, error: "Cần giải trình tối thiểu 10 ký tự và chưa nộp cho phiên bản này." };
  const explanation: HrAttendanceExplanation = { id: `AE-${crypto.randomUUID()}`, attendanceId: row.id, employeeId: row.employeeId, attendanceVersion: input.expectedVersion, managerId: manager.id, text: input.text.trim(), submittedAt: input.at, status: "submitted" };
  return { ok: true, explanation, state: { ...state, attendanceExplanations: [explanation, ...(state.attendanceExplanations ?? [])] } };
}

export function reviewAttendanceExplanation(state: AttendanceState, input: { explanationId: string; actorId: string; decision: "confirmed" | "rejected"; reason: string; at: string }): AttendanceExplanationResult {
  const explanation = (state.attendanceExplanations ?? []).find((item) => item.id === input.explanationId);
  const row = state.attendance.find((item) => item.id === explanation?.attendanceId);
  if (!explanation || !row || explanation.status !== "submitted" || row.resolution !== "explanation" || (row.version ?? 1) !== explanation.attendanceVersion) return { ok: false, error: "Giải trình đã thay đổi hoặc không còn chờ quản lý." };
  if (state.periods.find((item) => item.id === row.date.slice(0, 7))?.status !== "reconciling" || input.actorId !== explanation.managerId || input.actorId === explanation.employeeId || input.reason.trim().length < 8) return { ok: false, error: "Chỉ quản lý được giao mới được quyết định với căn cứ tối thiểu 8 ký tự khi kỳ còn mở." };
  const updated: HrAttendanceExplanation = { ...explanation, status: input.decision, reviewReason: input.reason.trim(), reviewedAt: input.at };
  return { ok: true, explanation: updated, state: { ...state, attendanceExplanations: state.attendanceExplanations.map((item) => item.id === updated.id ? updated : item) } };
}

export function applyAttendanceConfirmation(state: AttendanceState, command: AttendanceConfirmationCommand): AttendanceConfirmationResult {
  const row = state.attendance.find((item) => item.id === command.attendanceId && item.employeeId === command.employeeId);
  if (!row || row.issue === "none" || row.resolution !== "approved") return { ok: false, error: "Chỉ xác nhận ngoại lệ đã được HR đối soát." };
  if (state.periods.find((item) => item.id === row.date.slice(0, 7))?.status !== "reconciling") return { ok: false, error: "Kỳ công đã đóng; không thể thay đổi xác nhận." };
  if ((row.version ?? 1) !== command.expectedVersion || latestAttendanceConfirmation(state.attendanceConfirmations ?? [], row)) return { ok: false, error: "Bản ghi đã thay đổi hoặc đã có phản hồi; tải lại trước khi tiếp tục." };
  if (!command.actor.trim() || !command.actorId || ((command.decision === "exception") === (command.actorId === row.employeeId))) return { ok: false, error: "Chủ bản ghi tự xác nhận/tranh chấp; ngoại lệ HR phải do người khác lập." };
  if (command.decision !== "confirmed" && command.reason.trim().length < 8) return { ok: false, error: "Tranh chấp hoặc ngoại lệ cần lý do tối thiểu 8 ký tự." };
  const confirmation: HrAttendanceConfirmation = { id: `AC-${crypto.randomUUID()}`, attendanceId: row.id, employeeId: row.employeeId, attendanceVersion: command.expectedVersion, decision: command.decision, actorId: command.actorId, actor: command.actor.trim(), at: command.at, reason: command.reason.trim() };
  return { ok: true, confirmation, state: { ...state, attendanceConfirmations: [confirmation, ...(state.attendanceConfirmations ?? [])] } };
}

export function applyAttendanceResolution(state: AttendanceState, command: AttendanceCommand): AttendanceResult {
  const row = state.attendance.find((item) => item.id === command.attendanceId);
  if (!row || row.issue === "none") return { ok: false, error: "Không có ngoại lệ công cần xử lý." };
  const period = state.periods.find((item) => item.id === row.date.slice(0, 7));
  if (!period || period.status !== "reconciling") return { ok: false, error: "Kỳ công đã đóng; cần mở lại có lý do trước khi điều chỉnh." };
  if ((row.version ?? 1) !== command.expectedVersion) return { ok: false, error: "Bản ghi đã thay đổi; tải lại trước khi xử lý." };
  if (!command.actor || command.reason.trim().length < 8) return { ok: false, error: "Cần người xử lý và lý do/bằng chứng tối thiểu 8 ký tự." };
  const disputedRevision = row.resolution === "approved" && command.resolution === "approved" && latestAttendanceConfirmation(state.attendanceConfirmations ?? [], row)?.decision === "disputed";
  if (row.resolution === "explanation" && command.resolution === "approved" && latestAttendanceExplanation(state.attendanceExplanations ?? [], row)?.status !== "confirmed") return { ok: false, error: "Cần nhân viên nộp giải trình và quản lý trực tiếp xác nhận trước khi HR đối soát." };
  if (!disputedRevision && (row.resolution === "approved" || row.resolution === "rejected" || row.resolution === command.resolution)) return { ok: false, error: "Ngoại lệ này đã có quyết định; không ghi lại tác động trùng." };
  if (row.date > command.businessDate || (row.issue === "missing-out" && row.date === command.businessDate && command.businessTime < row.plannedOut)) return { ok: false, error: "Chưa hết ca hoặc ngày công chưa đến; không thể xác nhận thiếu check-out." };
  const validTime = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (command.resolution === "approved" && ((row.issue === "missing-in" && !validTime.test(command.correctionIn ?? "")) || (row.issue === "missing-out" && !validTime.test(command.correctionOut ?? "")) || (command.correctionIn && !validTime.test(command.correctionIn)) || (command.correctionOut && !validTime.test(command.correctionOut)) || (command.correctionIn && command.correctionOut && command.correctionIn >= command.correctionOut))) return { ok: false, error: "Cần giờ vào/ra hợp lệ và giờ ra muộn hơn giờ vào." };
  const adjustment: HrAttendanceAdjustment = { id: `AA-${crypto.randomUUID()}`, attendanceId: row.id, employeeId: row.employeeId, at: command.at, actor: command.actor, resolution: command.resolution, reason: command.reason.trim(), correctionIn: command.resolution === "approved" ? command.correctionIn : undefined, correctionOut: command.resolution === "approved" ? command.correctionOut : undefined, version: command.expectedVersion + 1, source: "demo" };
  return { ok: true, adjustment, state: { ...state, attendance: state.attendance.map((item) => item.id === row.id ? { ...item, resolution: command.resolution, version: adjustment.version } : item), attendanceAdjustments: [adjustment, ...state.attendanceAdjustments] } };
}

export function approvedLeaveDates(requests: LeaveRequest[], period: string): TimesheetSnapshot["leaveDates"] {
  const result: TimesheetSnapshot["leaveDates"] = [];
  for (const request of requests.filter((item) => (item.status === "approved" || item.status === "cancellation-pending") && item.from <= `${period}-31` && item.to >= `${period}-01`)) {
    for (let stamp = new Date(`${request.from}T00:00:00Z`).getTime(); stamp <= new Date(`${request.to}T00:00:00Z`).getTime(); stamp += 86_400_000) {
      const day = new Date(stamp);
      const date = day.toISOString().slice(0, 10);
      if (date.startsWith(`${period}-`) && day.getUTCDay() !== 0 && day.getUTCDay() !== 6) result.push({ employeeId: request.employeeId, date, portion: request.portion });
    }
  }
  return result;
}

export function closeTimesheetPeriod(state: AttendanceState, id: string, actor: string, at: string, businessDate: string, leaveDates: TimesheetSnapshot["leaveDates"], wfhSessions: WfhSession[] = [], wfhRequests: BusinessRequest[] = []): PeriodResult {
  const period = state.periods.find((item) => item.id === id);
  if (!period || period.status !== "reconciling") return { ok: false, error: "Kỳ công không ở trạng thái đối soát." };
  if (state.selfPunches?.some((item) => item.date.startsWith(`${id}-`) && !item.checkOutAt)) return { ok: false, error: "Còn phiên điểm danh chưa check-out trong kỳ." };
  if (!/^\d{4}-\d{2}$/.test(id) || `${id}-${new Date(Number(id.slice(0, 4)), Number(id.slice(5)), 0).getDate()}` >= businessDate) return { ok: false, error: "Chỉ chốt kỳ sau ngày cuối tháng." };
  const rows = state.attendance.filter((item) => item.date.startsWith(`${id}-`));
  if (!rows.length || rows.some((item) => item.issue !== "none" && (item.resolution !== "approved" || !["confirmed", "exception"].includes(latestAttendanceConfirmation(state.attendanceConfirmations ?? [], item)?.decision ?? "")))) return { ok: false, error: "Kỳ không có dữ liệu hoặc còn ngoại lệ chưa có HR xử lý và xác nhận nhân viên/ngoại lệ có căn cứ." };
  const periodWfh = wfhSessions.filter((item) => item.date.startsWith(`${id}-`));
  if (periodWfh.some((item) => !item.review)) return { ok: false, error: "Còn phiên WFH chưa được HR đối soát." };
  const confirmed = periodWfh.filter((item) => item.review?.decision === "confirmed");
  if (new Set(confirmed.map((item) => `${item.employeeId}:${item.date}`)).size !== confirmed.length || confirmed.some((item) => !item.checkOutAt || !item.reportSubmittedAt || rows.some((row) => row.employeeId === item.employeeId && row.date === item.date) || leaveDates.some((leave) => leave.employeeId === item.employeeId && leave.date === item.date) || !wfhRequests.some((request) => request.type === "WFH" && request.status === "approved" && request.id === item.requestId && request.employeeId === item.employeeId && request.date === item.date))) return { ok: false, error: "Phiên WFH xác nhận bị thiếu căn cứ, trùng công/phép hoặc đơn không còn hiệu lực." };
  const snapshot: TimesheetSnapshot = { version: period.version ?? 1, at, actor, leaveDates: leaveDates.filter((item) => item.date.startsWith(`${id}-`)).map((item) => ({ ...item, branch: state.employees.find((person) => person.id === item.employeeId)?.branch ?? "" })), wfhDays: confirmed.map((item) => ({ requestId: item.requestId, employeeId: item.employeeId, branch: state.employees.find((person) => person.id === item.employeeId)?.branch ?? "", date: item.date, checkInAt: item.checkInAt, checkOutAt: item.checkOutAt!, reportSubmittedAt: item.reportSubmittedAt!, reviewedAt: item.review!.at, reviewedBy: item.review!.actor })), rows: rows.map((row) => { const confirmation = latestAttendanceConfirmation(state.attendanceConfirmations ?? [], row); return { attendanceId: row.id, employeeId: row.employeeId, branch: state.employees.find((person) => person.id === row.employeeId)?.branch ?? "", date: row.date, effectiveIn: effectiveAttendanceTime(row, state.attendanceAdjustments, "check-in"), effectiveOut: effectiveAttendanceTime(row, state.attendanceAdjustments, "check-out"), issue: row.issue, resolution: row.resolution, confirmation: confirmation?.decision === "confirmed" || confirmation?.decision === "exception" ? confirmation.decision : undefined, confirmedBy: confirmation?.actor, confirmedAt: confirmation?.at }; }) };
  return { ok: true, snapshot, periods: state.periods.map((item) => item.id === id ? { ...item, status: "closed", version: snapshot.version, snapshots: [...(item.snapshots ?? []), snapshot], closedAt: at, closedBy: actor } : item) };
}

export function reopenTimesheetPeriod(periods: TimesheetPeriod[], id: string, reason: string): PeriodResult {
  const period = periods.find((item) => item.id === id);
  if (!period || period.status === "reconciling" || reason.trim().length < 8) return { ok: false, error: "Cần kỳ đã chốt và lý do mở lại tối thiểu 8 ký tự." };
  return { ok: true, periods: periods.map((item) => item.id === id ? { ...item, status: "reconciling", version: (item.version ?? 1) + 1, reopenReason: reason.trim(), closedAt: undefined, closedBy: undefined } : item) };
}

export function openTimesheetPeriod(periods: TimesheetPeriod[], id: string): PeriodResult {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(id)) return { ok: false, error: "Chọn kỳ công hợp lệ theo YYYY-MM." };
  if (periods.some((item) => item.id === id)) return { ok: false, error: "Kỳ công đã tồn tại; không mở trùng." };
  const opened: TimesheetPeriod = { id, status: "reconciling", version: 1, snapshots: [] };
  return { ok: true, periods: [opened, ...periods].sort((a, b) => b.id.localeCompare(a.id)) };
}

export function normalizeAttendanceSnapshot(snapshot: HrState): Pick<HrState, "attendance" | "attendanceAdjustments" | "attendanceConfirmations" | "attendanceExplanations" | "periods"> {
  const adjustments = Array.isArray(snapshot.attendanceAdjustments) ? snapshot.attendanceAdjustments : snapshot.attendance.filter((row) => row.correctionIn || row.correctionOut || row.reason).map((row) => ({ id: `AA-legacy-${row.id}`, attendanceId: row.id, employeeId: row.employeeId, at: `${row.date}T12:00:00+07:00`, actor: "Dữ liệu demo cũ", resolution: row.resolution, reason: row.reason ?? "Bản ghi demo cũ; chưa có lý do gốc", correctionIn: row.correctionIn, correctionOut: row.correctionOut, version: row.version ?? 2, source: "legacy" as const }));
  return { attendance: snapshot.attendance.map((row) => { const next = { ...row }; delete next.correctionIn; delete next.correctionOut; delete next.reason; return next; }), attendanceAdjustments: adjustments, attendanceConfirmations: Array.isArray(snapshot.attendanceConfirmations) ? snapshot.attendanceConfirmations : [], attendanceExplanations: Array.isArray(snapshot.attendanceExplanations) ? snapshot.attendanceExplanations : [], periods: snapshot.periods.map((item) => ({ ...item, version: item.version ?? 1, snapshots: item.snapshots ?? [] })) };
}
