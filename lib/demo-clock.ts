export type DemoClockMode = "scenario" | "real";
export let scenarioDate = "2026-10-20";
let mode: DemoClockMode = "scenario";

export function setDemoClockMode(next: DemoClockMode) { mode = next; }
export function setDemoScenarioDate(next: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(next) || Number.isNaN(new Date(`${next}T12:00:00Z`).getTime()) || new Date(`${next}T12:00:00Z`).toISOString().slice(0, 10) !== next) return false;
  scenarioDate = next;
  return true;
}
export function demoClockMode() { return mode; }
export function demoBusinessDate(now = new Date()) {
  if (mode === "scenario") return scenarioDate;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function demoBusinessNow(now = new Date()) {
  if (mode === "real") return now;
  const clock = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(now);
  return new Date(`${scenarioDate}T${clock}+07:00`);
}
