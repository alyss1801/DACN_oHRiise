import type { HrCase, HrState } from "./hr-demo-data";

type AccountTaskState = Pick<HrState, "cases" | "employees">;
export type AccountTaskResult = { ok: true; state: AccountTaskState; case: HrCase } | { ok: false; error: string };

export function completeOnboardingAccountTask(state: AccountTaskState, input: { caseId: string; employeeId: string; accountId: string; actorId: string; note: string; at: string }): AccountTaskResult {
  const selected = state.cases.find((item) => item.id === input.caseId && item.kind === "onboarding");
  const person = state.employees.find((item) => item.id === input.employeeId);
  if (!selected || !person || selected.employeeId !== person.id || person.status === "inactive" || selected.completedAt || selected.cancelledAt) return { ok: false, error: "Quy trình onboarding hoặc nhân sự không còn hợp lệ." };
  if (!input.accountId.trim() || !input.actorId.trim() || input.actorId === person.id || input.note.trim().length < 8) return { ok: false, error: "Admin cần tài khoản đúng người và căn cứ xử lý tối thiểu 8 ký tự." };
  if (!selected.tasks.some((task) => task.id === "account" && !task.doneAt)) return { ok: false, error: "Tác vụ tài khoản đã được hoàn tất hoặc không tồn tại." };
  const tasks = selected.tasks.map((task) => task.id === "account" ? { ...task, doneAt: input.at, note: `${input.note.trim()} · IAM ${input.accountId}` } : task);
  const completed: HrCase = { ...selected, tasks, completedAt: tasks.every((task) => task.doneAt) ? input.at : undefined };
  return { ok: true, case: completed, state: { ...state, cases: state.cases.map((item) => item.id === completed.id ? completed : item) } };
}
