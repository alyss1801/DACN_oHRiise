import type { HrCase } from "./hr-demo-data";

export type OffboardingSource = "employee-request" | "employer-decision" | "contract-expiry" | "other";
export type OffboardingDetails = { lastWorkingDay: string; disableAt: string; sourceType: OffboardingSource; reason: string; sourceReference: string };

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
function validDate(value: string) { return datePattern.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value; }

export function offboardingInputError(input: OffboardingDetails, businessDate: string): string | null {
  if (!validDate(input.lastWorkingDay) || input.lastWorkingDay < businessDate) return "Ngày làm việc cuối phải hợp lệ và không ở quá khứ.";
  const disableAt = new Date(input.disableAt);
  if (Number.isNaN(disableAt.getTime()) || disableAt.getTime() < Date.parse(`${input.lastWorkingDay}T17:30:00+07:00`)) return "Thời điểm khóa dự kiến phải từ 17:30 ngày làm việc cuối trở đi (giờ Việt Nam).";
  if (!["employee-request", "employer-decision", "contract-expiry", "other"].includes(input.sourceType)) return "Cần chọn nguồn phát sinh offboarding.";
  if (input.reason.trim().length < 8 || input.sourceReference.trim().length < 5) return "Cần lý do tối thiểu 8 ký tự và tham chiếu chứng từ tối thiểu 5 ký tự.";
  return null;
}

export function scheduledDisableAt(item: Pick<HrCase, "disableAt" | "lastWorkingDay">): string | null {
  if (item.disableAt && !Number.isNaN(Date.parse(item.disableAt))) return item.disableAt;
  return item.lastWorkingDay ? new Date(`${item.lastWorkingDay}T18:00:00+07:00`).toISOString() : null;
}

export function disableIsDue(item: Pick<HrCase, "disableAt" | "lastWorkingDay">, now: string) {
  const scheduled = scheduledDisableAt(item);
  return Boolean(scheduled && Date.parse(now) >= Date.parse(scheduled));
}

export function offboardingChangeBlocker(item: HrCase): string | null {
  if (item.kind !== "offboarding" || item.completedAt || item.cancelledAt) return "Case đã kết thúc hoặc không phải offboarding.";
  if (item.tasks.some((task) => task.doneAt)) return "Checklist đã có tác động; không thể hủy hoặc đổi lịch tự động. Cần xử lý thủ công có kiểm soát.";
  return null;
}
