import type { HrEmployee, TimesheetSnapshot } from "./hr-demo-data";

export type InternalTimesheetRow = { employeeId: string; name: string; period: string; branch: string; validDays: number; confirmedWfhDays: number; approvedLeaveDays: number; unresolved: number; snapshotVersion: number };

export function prepareInternalTimesheetRows(snapshot: TimesheetSnapshot, employees: HrEmployee[], period: string, branch = ""): InternalTimesheetRow[] {
  const ids = [...new Set([...snapshot.rows.filter((row) => !branch || row.branch === branch).map((row) => row.employeeId), ...snapshot.leaveDates.filter((item) => !branch || item.branch === branch).map((item) => item.employeeId), ...(snapshot.wfhDays ?? []).filter((item) => !branch || item.branch === branch).map((item) => item.employeeId)])];
  return ids.map((employeeId) => {
    const employee = employees.find((person) => person.id === employeeId);
    const rows = snapshot.rows.filter((row) => row.employeeId === employeeId && (!branch || row.branch === branch));
    const leaveDates = snapshot.leaveDates.filter((item) => item.employeeId === employeeId && (!branch || item.branch === branch));
    const wfhDays = (snapshot.wfhDays ?? []).filter((item) => item.employeeId === employeeId && (!branch || item.branch === branch));
    const confirmedWfhDays = wfhDays.filter((day) => !rows.some((row) => row.date === day.date) && !leaveDates.some((leave) => leave.date === day.date)).length;
    return { employeeId, name: employee?.name ?? employeeId, period, branch: rows[0]?.branch ?? leaveDates[0]?.branch ?? wfhDays[0]?.branch ?? "", validDays: rows.filter((row) => (row.issue === "none" || row.resolution === "approved") && !leaveDates.some((leave) => leave.date === row.date && leave.portion === "full")).length + confirmedWfhDays, confirmedWfhDays, approvedLeaveDays: leaveDates.reduce((sum, item) => sum + (item.portion === "full" ? 1 : 0.5), 0), unresolved: rows.filter((row) => row.issue !== "none" && row.resolution !== "approved").length, snapshotVersion: snapshot.version };
  }).sort((a, b) => a.employeeId.localeCompare(b.employeeId));
}

function csvCell(value: string | number) { return `"${String(value).replaceAll('"', '""')}"`; }
export function internalTimesheetCsv(rows: InternalTimesheetRow[]) {
  const header = ["Mã nhân viên", "Họ tên", "Kỳ công", "Chi nhánh", "Ngày công hợp lệ", "Trong đó WFH đã xác nhận", "Ngày nghỉ đã duyệt", "Ngoại lệ chưa xử lý", "Phiên bản snapshot"];
  return `\ufeff${[header, ...rows.map((row) => [row.employeeId, row.name, row.period, row.branch, row.validDays, row.confirmedWfhDays, row.approvedLeaveDays, row.unresolved, row.snapshotVersion])].map((cells) => cells.map(csvCell).join(",")).join("\r\n")}`;
}
