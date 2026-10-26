/* eslint-disable @typescript-eslint/no-require-imports -- Pure TypeScript domain tests without another runtime dependency. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
Module._extensions[".ts"] = function loadTs(module, filename) { module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename); };
const { validateWfhPlan, wfhMonthlyQuota } = require("../features/wfh/wfh-plan-model.ts");

const employee = { id: "OH-1", name: "Employee", status: "active", managerId: "OH-2" };
const manager = { id: "OH-2", name: "Manager", status: "active" };
const policy = { id: "P-1", group: "WFH", name: "Quỹ WFH tháng (ngày)", value: "4", scope: "Toàn công ty", effectiveAt: "2026-01-01", version: 1, status: "active", updatedAt: "2026-01-01" };
const input = { employee, employees: [employee, manager], date: "2026-10-26", today: "2026-10-24", requests: [], leaves: [], periods: [{ id: "2026-10", status: "reconciling" }], policies: [policy] };

test("WFH plan snapshots direct manager and effective monthly quota", () => {
  assert.deepEqual(wfhMonthlyQuota([policy], input.date), { days: 4, version: 1 });
  const result = validateWfhPlan(input);
  assert.equal(result.ok, true);
  assert.equal(result.approverId, "OH-2");
  assert.equal(result.usedDays, 0);
});

test("WFH blocks no manager, leave overlap, duplicate, closed period, and monthly quota", () => {
  assert.equal(validateWfhPlan({ ...input, employee: { ...employee, managerId: undefined } }).ok, false);
  assert.equal(validateWfhPlan({ ...input, leaves: [{ employeeId: "OH-1", from: input.date, to: input.date, status: "pending" }] }).ok, false);
  const existing = { id: "WFH-1", employeeId: "OH-1", type: "WFH", date: input.date, status: "pending" };
  assert.equal(validateWfhPlan({ ...input, requests: [existing] }).ok, false);
  assert.equal(validateWfhPlan({ ...input, periods: [{ id: "2026-10", status: "closed" }] }).ok, false);
  assert.equal(validateWfhPlan({ ...input, requests: [27, 28, 29, 30].map((day) => ({ ...existing, id: `WFH-${day}`, date: `2026-10-${day}` })) }).ok, false);
  assert.equal(validateWfhPlan({ ...input, date: "2026-10-25" }).ok, false);
});

test("WFH uses future published policy version without changing historical quota", () => {
  const next = { ...policy, id: "P-2", value: "2", version: 2, effectiveAt: "2026-11-01", status: "scheduled" };
  assert.equal(wfhMonthlyQuota([policy, next], "2026-10-26").days, 4);
  assert.deepEqual(wfhMonthlyQuota([policy, next], "2026-11-02"), { days: 2, version: 2 });
  assert.deepEqual(wfhMonthlyQuota([{ ...policy, status: "retired" }, { ...next, status: "active" }], "2026-10-26"), { days: 4, version: 1 });
});
