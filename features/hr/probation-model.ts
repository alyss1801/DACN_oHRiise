import type { HrProbationReview, HrState } from "./hr-demo-data";
import { effectiveContractStatus } from "./contract-model";
import { assessmentError, probationTemplates, templateForDepartment, type ProbationAssessment } from "./probation-template";

type ProbationState = Pick<HrState, "employees" | "probationReviews" | "contracts" | "cases">;
export type ProbationResult = { ok: true; state: ProbationState; review: HrProbationReview } | { ok: false; error: string };

export function assignProbationReview(state: ProbationState, input: { employeeId: string; dueAt: string; actorId: string; actor: string; at: string; businessDate: string; templateId?: string }): ProbationResult {
  const person = state.employees.find((item) => item.id === input.employeeId);
  const manager = state.employees.find((item) => item.id === person?.managerId);
  if (!person || person.status !== "probation") return { ok: false, error: "Chỉ giao đánh giá cho nhân sự đang thử việc." };
  if (!manager || manager.status === "inactive" || manager.id === person.id) return { ok: false, error: "Cần gán quản lý trực tiếp đang hoạt động trong hồ sơ nhân sự." };
  const parsedDue = new Date(`${input.dueAt}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dueAt) || input.dueAt < input.businessDate || Number.isNaN(parsedDue.getTime()) || parsedDue.toISOString().slice(0, 10) !== input.dueAt) return { ok: false, error: "Hạn đánh giá phải là ngày hợp lệ không trước ngày nghiệp vụ." };
  if (!input.actorId || !input.actor.trim() || input.actorId === person.id || input.actorId === manager.id) return { ok: false, error: "Người giao đánh giá phải là HR khác nhân sự và quản lý trực tiếp." };
  if ((state.probationReviews ?? []).some((item) => item.employeeId === person.id && item.status !== "activated")) return { ok: false, error: "Nhân sự đã có đánh giá thử việc đang mở hoặc đang offboarding." };
  const templateId = input.templateId ?? templateForDepartment(person.department);
  if (!probationTemplates[templateId]) return { ok: false, error: "Mẫu đánh giá không hợp lệ." };
  const review: HrProbationReview = { id: `PR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, employeeId: person.id, managerId: manager.id, dueAt: input.dueAt, status: "assigned", version: 1, assignedAt: input.at, assignedBy: input.actor.trim(), templateId, templateVersion: probationTemplates[templateId].version };
  return { ok: true, review, state: { ...state, probationReviews: [review, ...(state.probationReviews ?? [])] } };
}

export function saveProbationDraft(state: ProbationState, input: { reviewId: string; expectedVersion: number; actorId: string; assessment: ProbationAssessment }): ProbationResult {
  const review = (state.probationReviews ?? []).find((item) => item.id === input.reviewId);
  if (!review || review.status !== "assigned" || review.version !== input.expectedVersion) return { ok: false, error: "Đánh giá đã thay đổi hoặc không còn chờ quản lý." };
  if (review.managerId !== input.actorId) return { ok: false, error: "Chỉ quản lý trực tiếp được lưu bản nháp." };
  const updated = { ...review, version: review.version + 1, draft: input.assessment };
  return { ok: true, review: updated, state: { ...state, probationReviews: state.probationReviews.map((item) => item.id === review.id ? updated : item) } };
}

export function evaluateProbationReview(state: ProbationState, input: { reviewId: string; expectedVersion: number; actorId: string; outcome: "pass" | "fail"; evidence: string; at: string; assessment?: ProbationAssessment }): ProbationResult {
  const review = (state.probationReviews ?? []).find((item) => item.id === input.reviewId);
  if (!review || review.status !== "assigned" || review.version !== input.expectedVersion) return { ok: false, error: "Đánh giá đã thay đổi hoặc không còn chờ quản lý." };
  if (input.actorId !== review.managerId || input.evidence.trim().length < 10) return { ok: false, error: "Chỉ quản lý trực tiếp được nộp đánh giá với căn cứ tối thiểu 10 ký tự." };
  if (review.templateId) {
    const error = assessmentError(review.templateId, input.assessment);
    if (error) return { ok: false, error };
    if (input.assessment?.outcome !== input.outcome || input.assessment?.evidence.trim() !== input.evidence.trim()) return { ok: false, error: "Kết luận đánh giá đã thay đổi; vui lòng kiểm tra lại." };
  }
  const updated: HrProbationReview = { ...review, status: "evaluated", version: review.version + 1, outcome: input.outcome, evidence: input.evidence.trim(), assessment: input.assessment, draft: undefined, evaluatedAt: input.at };
  return { ok: true, review: updated, state: { ...state, probationReviews: state.probationReviews.map((item) => item.id === review.id ? updated : item) } };
}

export function decideProbationReview(state: ProbationState, input: { reviewId: string; expectedVersion: number; actorId: string; actor: string; decision: "activate" | "offboard"; reason: string; at: string; businessDate: string }): ProbationResult {
  const review = (state.probationReviews ?? []).find((item) => item.id === input.reviewId);
  const person = state.employees.find((item) => item.id === review?.employeeId);
  if (!review || !person || review.status !== "evaluated" || review.version !== input.expectedVersion || person.status !== "probation") return { ok: false, error: "Đánh giá đã thay đổi hoặc nhân sự không còn ở giai đoạn thử việc." };
  if (!input.actorId || input.actorId === person.id || input.actorId === review.managerId || !input.actor.trim() || input.reason.trim().length < 8) return { ok: false, error: "HR khác quản lý/người được đánh giá phải ghi lý do quyết định tối thiểu 8 ký tự." };
  if (input.decision === "activate" && (!state.contracts.some((item) => item.employeeId === person.id && effectiveContractStatus(item, input.businessDate) === "active") || !state.cases.some((item) => item.employeeId === person.id && item.kind === "onboarding" && item.completedAt))) return { ok: false, error: "Cần hoàn tất onboarding và xác minh hợp đồng đã hiệu lực trước khi chuyển đang làm việc." };
  const updated: HrProbationReview = { ...review, status: input.decision === "activate" ? "activated" : "offboarding-required", version: review.version + 1, decidedAt: input.at, decidedBy: input.actor.trim(), decisionReason: input.reason.trim() };
  return { ok: true, review: updated, state: { ...state, probationReviews: state.probationReviews.map((item) => item.id === review.id ? updated : item), employees: input.decision === "activate" ? state.employees.map((item) => item.id === person.id ? { ...item, status: "active" as const } : item) : state.employees } };
}
