import type { BusinessRequest } from "@/features/demo/demo-data-context";
import type { HrCase, HrEmployee } from "./hr-demo-data";

export function resignationInputError(input: {
  employee?: HrEmployee;
  lastWorkingDay: string;
  reason: string;
  today: string;
  requests: BusinessRequest[];
  cases: HrCase[];
}): string | null {
  const { employee, lastWorkingDay, reason, today, requests, cases } = input;
  if (!employee || employee.status === "inactive") return "Không tìm thấy hồ sơ nhân sự đang làm việc.";
  const date = new Date(`${lastWorkingDay}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lastWorkingDay) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== lastWorkingDay || lastWorkingDay < today) return "Ngày làm việc cuối phải hợp lệ và không ở quá khứ.";
  if (reason.trim().length < 8 || reason.trim().length > 2000) return "Lý do cần từ 8 đến 2.000 ký tự.";
  if (cases.some((item) => item.kind === "offboarding" && item.employeeId === employee.id && !item.completedAt && !item.cancelledAt)) return "Bạn đã có quy trình nghỉ việc đang thực hiện.";
  if (requests.some((item) => item.type === "Nghỉ việc" && item.employeeId === employee.id && ["pending", "hr-review"].includes(item.status) && !cases.some((entry) => entry.kind === "offboarding" && entry.sourceReference === item.id && entry.cancelledAt))) return "Bạn đã có đơn xin nghỉ việc đang xử lý.";
  return null;
}
