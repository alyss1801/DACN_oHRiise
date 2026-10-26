import type { BusinessRequest } from "@/features/demo/demo-data-context";
import type { HrAttendance, HrEmployee, HrSelfPunch, HrShiftAssignment } from "@/features/hr/hr-demo-data";
import type { LeaveRequest } from "@/features/leave/leave-model";
import type { WfhSession } from "@/features/wfh/wfh-model";

export type TeamDay = {
  kind: "office" | "wfh" | "leave" | "off" | "unscheduled";
  label: string;
  detail: string;
  pending: string[];
  attendance?: HrAttendance;
  checkIn?: string;
  checkOut?: string;
  issue?: string;
  leaveId?: string;
  wfhId?: string;
};

export type TeamDaySources = {
  attendance: HrAttendance[];
  shiftAssignments: HrShiftAssignment[];
  selfPunches: HrSelfPunch[];
  leave: LeaveRequest[];
  requests: BusinessRequest[];
  wfhSessions: WfhSession[];
};

export function teamDay(employee: HrEmployee, date: string, sources: TeamDaySources): TeamDay {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  const pending: string[] = [];
  const leave = sources.leave.find((item) => item.employeeId === employee.id && item.from <= date && item.to >= date && ["approved", "cancellation-pending"].includes(item.status));
  const pendingLeave = sources.leave.some((item) => item.employeeId === employee.id && item.from <= date && item.to >= date && ["manager-pending", "hr-pending"].includes(item.status));
  if (pendingLeave) pending.push("Nghỉ phép chờ duyệt");
  const wfh = sources.requests.find((item) => item.type === "WFH" && item.employeeId === employee.id && item.date === date && item.status === "approved");
  if (sources.requests.some((item) => item.type === "WFH" && item.employeeId === employee.id && item.date === date && item.status === "pending")) pending.push("WFH chờ duyệt");
  if (sources.requests.some((item) => item.type === "Đổi ca" && item.employeeId === employee.id && item.date === date && item.status === "pending")) pending.push("Đổi ca chờ duyệt");
  const row = sources.attendance.find((item) => item.employeeId === employee.id && item.date === date);
  const assigned = sources.shiftAssignments.find((item) => item.employeeId === employee.id && item.date === date);
  const swap = sources.requests.find((item) => item.type === "Đổi ca" && item.employeeId === employee.id && item.date === date && item.status === "approved" && item.shiftAssignmentId === assigned?.id && item.shiftStart && item.shiftEnd);
  const punch = sources.selfPunches.find((item) => item.employeeId === employee.id && item.date === date);
  const checkIn = punch?.checkInAt ?? row?.events.find((item) => item.kind === "check-in")?.at;
  const checkOut = punch?.checkOutAt ?? row?.events.find((item) => item.kind === "check-out")?.at;
  const base = { pending, attendance: row, checkIn, checkOut, issue: row && row.issue !== "none" && row.resolution !== "approved" ? row.issue : undefined };
  if (leave?.portion === "full") return { ...base, kind: "leave", label: "Nghỉ phép", detail: leave.type === "annual" ? "Phép năm đã duyệt" : "Nghỉ không lương đã duyệt", leaveId: leave.id };
  if (wfh) {
    const session = sources.wfhSessions.find((item) => item.requestId === wfh.id);
    return { ...base, kind: "wfh", label: "WFH", detail: session?.checkInAt ? `Đã check-in ${session.checkInAt.slice(11, 16)}` : "Kế hoạch đã duyệt", wfhId: wfh.id };
  }
  if (weekday === 0 || weekday === 6) return { ...base, kind: "off", label: "Ngày nghỉ", detail: "Cuối tuần" };
  if (!row && !punch && !assigned) return { ...base, kind: "unscheduled", label: "Chưa phân ca", detail: "Chưa có lịch được ghi nhận" };
  return { ...base, kind: "office", label: leave ? "Văn phòng · nửa ngày" : "Văn phòng", detail: swap ? `Đổi ca đã duyệt · ${swap.shiftStart}–${swap.shiftEnd}` : assigned ? `${assigned.shift} · ${assigned.plannedIn}–${assigned.plannedOut}` : row ? `${row.shift} · ${row.plannedIn}–${row.plannedOut}` : "Có lượt chấm công", leaveId: leave?.id };
}

export function isoWeek(date: string, offset = 0) {
  const anchor = new Date(`${date}T12:00:00Z`);
  anchor.setUTCDate(anchor.getUTCDate() - (anchor.getUTCDay() + 6) % 7 + offset * 7);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(anchor);
    day.setUTCDate(day.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
}

export const shortDate = (date: string) => new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(`${date}T12:00:00Z`));
