import type { HrAttendance, HrEmployee } from "./hr-demo-data";

// File-only demo adapter. Replace with a separately authenticated server adapter for real MISA AMIS.
export const misaFieldMapping = [
  ["Mã nhân viên oHRiise", "employee_code"], ["Kỳ công", "period"], ["Chi nhánh", "branch_code"],
  ["Ngày công hợp lệ", "valid_days"], ["Ngày nghỉ đã duyệt", "approved_leave_days"], ["Giờ tăng ca", "overtime_hours"],
] as const;

export type MisaDemoRow = { employee_code: string; period: string; branch_code: string; valid_days: number; approved_leave_days: number; overtime_hours: number };

export function prepareMisaDemoRows(employees: HrEmployee[], attendance: HrAttendance[], period: string, approvedLeaveDays: (name: string) => number): MisaDemoRow[] {
  return employees.filter((employee) => attendance.some((row) => row.employeeId === employee.id && row.date.startsWith(period))).map((employee) => {
    const rows = attendance.filter((row) => row.employeeId === employee.id && row.date.startsWith(period));
    return { employee_code: employee.id, period, branch_code: employee.branch, valid_days: rows.filter((row) => row.issue === "none" || row.resolution === "approved").length, approved_leave_days: approvedLeaveDays(employee.name), overtime_hours: 0 };
  });
}

export function misaDemoCsv(rows: MisaDemoRow[]) {
  const keys = misaFieldMapping.map(([, output]) => output);
  return `\ufeff${[keys.join(","), ...rows.map((row) => keys.map((key) => String(row[key])).join(","))].join("\r\n")}`;
}
