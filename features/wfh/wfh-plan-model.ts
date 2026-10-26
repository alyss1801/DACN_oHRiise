import type { BusinessRequest } from "@/features/demo/demo-data-context";
import type { HrEmployee, HrPolicy, TimesheetPeriod } from "@/features/hr/hr-demo-data";

type LeaveLike = { employeeId: string; from: string; to: string; status: string };

export function wfhMonthlyQuota(policies: HrPolicy[], date: string) {
  const policy = policies
    .filter((item) => item.group === "WFH" && item.name === "Quỹ WFH tháng (ngày)" && ["active", "scheduled", "retired"].includes(item.status) && item.effectiveAt <= date)
    .sort((a, b) => b.effectiveAt.localeCompare(a.effectiveAt) || b.version - a.version)[0];
  const days = Number(policy?.value);
  return policy && Number.isInteger(days) && days > 0 ? { days, version: policy.version } : null;
}

export function validateWfhPlan(input: {
  employee: HrEmployee; employees: HrEmployee[]; date: string; today: string;
  requests: BusinessRequest[]; leaves: LeaveLike[]; periods: TimesheetPeriod[]; policies: HrPolicy[];
}): { ok: true; approverId: string; quotaDays: number; usedDays: number; policyVersion: number } | { ok: false; error: string } {
  const { employee, employees, date, today, requests, leaves, periods, policies } = input;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || date < today) return { ok: false, error: "Chọn ngày WFH hợp lệ, không ở quá khứ." };
  if (employee.status !== "active" && employee.status !== "probation") return { ok: false, error: "Chỉ nhân sự đang làm việc mới được đăng ký WFH." };
  if ([0, 6].includes(parsed.getUTCDay())) return { ok: false, error: "Ngày WFH phải là ngày làm việc trong demo." };
  const manager = employees.find((person) => person.id === employee.managerId && person.status === "active");
  if (!manager || manager.id === employee.id) return { ok: false, error: "Chưa có quản lý trực tiếp đang hoạt động để nhận đơn WFH." };
  if (periods.some((period) => period.id === date.slice(0, 7) && period.status !== "reconciling")) return { ok: false, error: "Kỳ công đã chốt; không thể tạo đơn WFH cho ngày này." };
  if (leaves.some((item) => item.employeeId === employee.id && !["rejected", "withdrawn", "cancelled"].includes(item.status) && item.from <= date && item.to >= date)) return { ok: false, error: "Ngày này đã có đơn nghỉ phép còn hiệu lực hoặc chờ duyệt." };
  if (requests.some((item) => item.type === "WFH" && item.employeeId === employee.id && item.date === date && item.status !== "rejected")) return { ok: false, error: "Đã có đơn WFH cho ngày này." };
  const quota = wfhMonthlyQuota(policies, date);
  if (!quota) return { ok: false, error: "Chưa có chính sách quỹ WFH có hiệu lực cho ngày này." };
  const usedDays = requests.filter((item) => item.type === "WFH" && item.employeeId === employee.id && item.date.startsWith(date.slice(0, 7)) && item.status !== "rejected").length;
  if (usedDays >= quota.days) return { ok: false, error: `Đã dùng hoặc giữ chỗ đủ ${quota.days} ngày WFH trong tháng.` };
  return { ok: true, approverId: manager.id, quotaDays: quota.days, usedDays, policyVersion: quota.version };
}
