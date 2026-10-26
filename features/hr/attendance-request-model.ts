import type { BusinessRequest } from "@/features/demo/demo-data-context";
import type { HrAttendance, HrEmployee, TimesheetPeriod } from "./hr-demo-data";

type Input = { type: "Điều chỉnh chấm công" | "Đăng ký OT"; employee: HrEmployee; date: string; today: string; attendance: HrAttendance[]; periods: TimesheetPeriod[]; requests: BusinessRequest[]; correctionIn?: string; correctionOut?: string; overtimeHours?: number };

export function validateAttendanceRequest(input: Input): { ok: true; managerId: string; row?: HrAttendance } | { ok: false; error: string } {
  const managerId = input.employee.managerId;
  if (input.employee.status === "inactive" || !managerId || managerId === input.employee.id) return { ok: false, error: "Cần quan hệ lao động và quản lý trực tiếp hợp lệ để định tuyến đơn." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || Number.isNaN(Date.parse(`${input.date}T00:00:00Z`)) || new Date(`${input.date}T00:00:00Z`).toISOString().slice(0, 10) !== input.date) return { ok: false, error: "Ngày áp dụng không hợp lệ." };
  if (input.periods.find((item) => item.id === input.date.slice(0, 7))?.status !== "reconciling") return { ok: false, error: "Kỳ công chưa mở hoặc đã chốt; liên hệ HR." };
  if (input.date > input.today && input.type === "Điều chỉnh chấm công") return { ok: false, error: "Chỉ điều chỉnh bản ghi công đã phát sinh." };
  if (input.date < input.today && input.type === "Đăng ký OT") return { ok: false, error: "Đơn OT mới phải có ngày hiện tại hoặc tương lai." };
  if (input.requests.some((item) => item.type === input.type && item.employeeId === input.employee.id && item.date === input.date && ["pending", "hr-review", "approved"].includes(item.status))) return { ok: false, error: "Đã có yêu cầu cùng loại cho ngày này; không gửi trùng." };
  const row = input.attendance.find((item) => item.employeeId === input.employee.id && item.date === input.date);
  if (input.type === "Điều chỉnh chấm công") {
    if (!row || row.issue === "none" || row.resolution !== "open") return { ok: false, error: "Chọn ngày có ngoại lệ công chưa xử lý. Nếu HR đã yêu cầu giải trình, dùng luồng giải trình hiện có." };
    if (!["missing-in", "missing-out", "late", "shift-mismatch"].includes(row.issue)) return { ok: false, error: "Loại ngoại lệ này cần giải trình/đối soát HR, không phải chỉnh giờ vào/ra." };
    const time = /^([01]\d|2[0-3]):[0-5]\d$/;
    if ((!input.correctionIn && !input.correctionOut) || (input.correctionIn && !time.test(input.correctionIn)) || (input.correctionOut && !time.test(input.correctionOut))) return { ok: false, error: "Nhập ít nhất một giờ vào/ra hợp lệ (HH:mm)." };
    if (row.issue === "missing-in" && !input.correctionIn || row.issue === "missing-out" && !input.correctionOut) return { ok: false, error: "Cần nhập đúng giờ đang thiếu trên bản công." };
  } else if (!Number.isInteger(input.overtimeHours) || input.overtimeHours! < 1 || input.overtimeHours! > 4) return { ok: false, error: "Đơn OT demo hỗ trợ 1–4 giờ; chưa tính tiền hay phép bù." };
  return { ok: true, managerId, row };
}
