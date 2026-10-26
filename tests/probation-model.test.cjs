/* eslint-disable @typescript-eslint/no-require-imports -- Pure TypeScript domain tests without another runtime dependency. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
Module._extensions[".ts"] = function loadTs(module, filename) { module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename); };
const { assignProbationReview, evaluateProbationReview, decideProbationReview } = require("../features/hr/probation-model.ts");

const start = () => ({ employees: [{ id: "OH-1", status: "probation", managerId: "OH-2" }, { id: "OH-2", status: "active" }, { id: "OH-3", status: "active" }], probationReviews: [], contracts: [], cases: [] });
const assignment = { employeeId: "OH-1", dueAt: "2026-11-30", actorId: "OH-3", actor: "HR Lan", at: "2026-10-20T02:00:00Z", businessDate: "2026-10-20" };

test("HR assigns a single probation review to the direct manager", () => {
  const result = assignProbationReview(start(), assignment);
  assert.equal(result.ok, true);
  assert.equal(result.review.managerId, "OH-2");
  assert.equal(assignProbationReview(result.state, assignment).ok, false);
  assert.equal(assignProbationReview(start(), { ...assignment, actorId: "OH-2" }).ok, false);
  assert.equal(assignProbationReview(start(), { ...assignment, dueAt: "2026-10-01" }).ok, false);
  assert.equal(assignProbationReview(start(), { ...assignment, dueAt: "2026-11-31" }).ok, false);
  assert.equal(assignProbationReview({ ...start(), employees: [{ id: "OH-1", status: "probation" }] }, assignment).ok, false);
});

test("manager submits evidence once; HR needs completed onboarding and active verified contract", () => {
  const assigned = assignProbationReview(start(), assignment);
  const input = { reviewId: assigned.review.id, expectedVersion: 1, actorId: "OH-2", outcome: "pass", evidence: "Đã hoàn thành mục tiêu thử việc.", at: "2026-10-21T02:00:00Z" };
  assert.equal(evaluateProbationReview(assigned.state, { ...input, actorId: "OH-3" }).ok, false);
  const evaluated = evaluateProbationReview(assigned.state, input);
  assert.equal(evaluated.ok, true);
  assert.equal(evaluateProbationReview(evaluated.state, input).ok, false);
  const decision = { reviewId: assigned.review.id, expectedVersion: 2, actorId: "OH-3", actor: "HR Lan", decision: "activate", reason: "Đạt yêu cầu vị trí", at: "2026-10-22T02:00:00Z", businessDate: "2026-10-22" };
  assert.equal(decideProbationReview(evaluated.state, decision).ok, false);
  const ready = { ...evaluated.state, contracts: [{ employeeId: "OH-1", document: "verified", startsAt: "2026-10-01", endsAt: null }], cases: [{ employeeId: "OH-1", kind: "onboarding", completedAt: "2026-10-21T10:00:00Z" }] };
  assert.equal(decideProbationReview(ready, { ...decision, actorId: "OH-2" }).ok, false);
  const activated = decideProbationReview(ready, decision);
  assert.equal(activated.ok, true);
  assert.equal(activated.state.employees[0].status, "active");
  assert.equal(decideProbationReview(activated.state, decision).ok, false);
});

test("not continuing probation records a decision without silently ending employment", () => {
  const assigned = assignProbationReview(start(), assignment);
  const evaluated = evaluateProbationReview(assigned.state, { reviewId: assigned.review.id, expectedVersion: 1, actorId: "OH-2", outcome: "fail", evidence: "Chưa đạt mục tiêu công việc.", at: "2026-10-21T02:00:00Z" });
  const decided = decideProbationReview(evaluated.state, { reviewId: assigned.review.id, expectedVersion: 2, actorId: "OH-3", actor: "HR Lan", decision: "offboard", reason: "Không tiếp tục sau thử việc", at: "2026-10-22T02:00:00Z", businessDate: "2026-10-22" });
  assert.equal(decided.ok, true);
  assert.equal(decided.review.status, "offboarding-required");
  assert.equal(decided.state.employees[0].status, "probation");
});
