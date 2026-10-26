import type { HrAttendance, HrEmployee, HrSelfPunch, PunchMethod, TimesheetPeriod } from "./hr-demo-data";

type PunchState = { employees: HrEmployee[]; attendance: HrAttendance[]; selfPunches: HrSelfPunch[]; periods: TimesheetPeriod[] };
type PunchCommand = { employeeId: string; kind: "check-in" | "check-out"; at: string; businessDate: string; method?: PunchMethod };

const methodLabel: Record<PunchMethod, string> = { manual: "thủ công", gps: "GPS", card: "thẻ từ", fingerprint: "vân tay", face: "khuôn mặt" };

export function recordSelfPunch(state: PunchState, command: PunchCommand): { ok: true; state: PunchState; punch: HrSelfPunch } | { ok: false; error: string } {
  const person = state.employees.find((item) => item.id === command.employeeId);
  const period = state.periods.find((item) => item.id === command.businessDate.slice(0, 7));
  if (!person || person.status === "inactive") return { ok: false, error: "Persona không có hồ sơ làm việc đang hiệu lực." };
  if (!period || period.status !== "reconciling") return { ok: false, error: "Kỳ công chưa mở hoặc đã chốt; liên hệ HR." };
  if (new Date(`${command.businessDate}T12:00:00Z`).getUTCDay() % 6 === 0) return { ok: false, error: "Ngày nghỉ lịch chưa hỗ trợ điểm danh demo." };
  if (Number.isNaN(Date.parse(command.at))) return { ok: false, error: "Thời điểm điểm danh không hợp lệ." };
  const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(command.at));
  if (localDate !== command.businessDate) return { ok: false, error: "Chỉ điểm danh theo ngày nghiệp vụ hiện tại." };
  const existing = state.selfPunches.find((item) => item.employeeId === command.employeeId && item.date === command.businessDate);
  const hasRow = state.attendance.some((item) => item.employeeId === command.employeeId && item.date === command.businessDate);
  if (command.kind === "check-in") {
    if (existing || hasRow) return { ok: false, error: "Ngày này đã có phiên hoặc bản ghi công; không điểm danh trùng." };
    const punch: HrSelfPunch = { id: `PUNCH-${command.employeeId}-${command.businessDate}`, employeeId: command.employeeId, date: command.businessDate, checkInAt: command.at, source: "demo-manual", checkInMethod: command.method ?? "manual" };
    return { ok: true, punch, state: { ...state, selfPunches: [punch, ...state.selfPunches] } };
  }
  if (!existing || existing.checkOutAt || hasRow || Date.parse(command.at) <= Date.parse(existing.checkInAt)) return { ok: false, error: "Cần phiên check-in mở và giờ check-out muộn hơn; không ghi hai lần." };
  const time = (at: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(at));
  const inTime = time(existing.checkInAt);
  const outTime = time(command.at);
  const issue: HrAttendance["issue"] = inTime > "08:45" ? "late" : outTime < "17:30" ? "shift-mismatch" : "none";
  const checkInMethod = existing.checkInMethod ?? "manual";
  const checkOutMethod = command.method ?? "manual";
  const punch = { ...existing, checkOutAt: command.at, checkOutMethod };
  const row: HrAttendance = { id: `${command.employeeId}-${command.businessDate}`, employeeId: command.employeeId, date: command.businessDate, shift: "Hành chính", plannedIn: "08:30", plannedOut: "17:30", events: [{ kind: "check-in", at: inTime, method: "DEMO", note: `Mô phỏng ${methodLabel[checkInMethod]}; chưa xác thực thiết bị/vị trí` }, { kind: "check-out", at: outTime, method: "DEMO", note: `Mô phỏng ${methodLabel[checkOutMethod]}; chưa xác thực thiết bị/vị trí` }], issue, resolution: issue === "none" ? "approved" : "open", version: 1 };
  return { ok: true, punch, state: { ...state, selfPunches: state.selfPunches.map((item) => item.id === punch.id ? punch : item), attendance: [row, ...state.attendance] } };
}
