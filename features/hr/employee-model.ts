import type { HrEmployee } from "./hr-demo-data";

export function nextEmployeeId(employees: Pick<HrEmployee, "id">[]) {
  const existing = employees.map((item) => /^OH-(\d+)$/.exec(item.id)).filter((match): match is RegExpExecArray => Boolean(match)).map((match) => Number(match[1]));
  return `OH-${String(Math.max(0, ...existing) + 1).padStart(4, "0")}`;
}

export function canCreateEmployee(employees: Pick<HrEmployee, "email">[], input: Pick<HrEmployee, "email" | "status">) {
  const email = input.email.trim().toLowerCase();
  return input.status !== "inactive" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !employees.some((item) => item.email.trim().toLowerCase() === email);
}
