export type ProbationCriterion = { id: string; label: string; weight: number };
export type ProbationScore = { id: string; score: number; comment: string };
export type ProbationAssessment = { outcome: "pass" | "fail"; scores: ProbationScore[]; evidence: string; updatedAt: string };

export const probationTemplates: Record<string, { label: string; version: number; criteria: ProbationCriterion[] }> = {
  general: { label: "Đánh giá thử việc chung", version: 1, criteria: [
    { id: "delivery", label: "Kết quả công việc", weight: 35 },
    { id: "quality", label: "Chất lượng công việc", weight: 30 },
    { id: "collaboration", label: "Hợp tác và giao tiếp", weight: 20 },
    { id: "ownership", label: "Tinh thần trách nhiệm", weight: 15 },
  ] },
  technology: { label: "Đánh giá kỹ thuật", version: 1, criteria: [
    { id: "technical", label: "Năng lực chuyên môn", weight: 30 },
    { id: "quality", label: "Chất lượng triển khai", weight: 25 },
    { id: "delivery", label: "Tiến độ và trách nhiệm", weight: 25 },
    { id: "collaboration", label: "Hợp tác và giao tiếp", weight: 20 },
  ] },
  product: { label: "Đánh giá sản phẩm", version: 1, criteria: [
    { id: "craft", label: "Năng lực chuyên môn", weight: 30 },
    { id: "quality", label: "Chất lượng đầu ra", weight: 25 },
    { id: "delivery", label: "Tiến độ và trách nhiệm", weight: 25 },
    { id: "collaboration", label: "Hợp tác với đội ngũ", weight: 20 },
  ] },
};

export function templateForDepartment(department: string) {
  if (department === "Công nghệ thông tin") return "technology";
  if (department === "Sản phẩm") return "product";
  return "general";
}

export function assessmentError(templateId: string, assessment: ProbationAssessment | undefined) {
  const template = probationTemplates[templateId];
  if (!template) return "Không tìm thấy mẫu đánh giá đã giao.";
  if (!assessment) return "Cần hoàn tất biểu mẫu đánh giá.";
  if (!["pass", "fail"].includes(assessment.outcome) || assessment.scores.length !== template.criteria.length || new Set(assessment.scores.map((item) => item.id)).size !== template.criteria.length) return "Biểu mẫu đánh giá chưa đầy đủ.";
  for (const criterion of template.criteria) {
    const row = assessment.scores.find((item) => item.id === criterion.id);
    if (!row || !Number.isInteger(row.score) || row.score < 1 || row.score > 5 || row.comment.trim().length < 8) return `Cần chấm điểm và nhận xét tối thiểu 8 ký tự cho ${criterion.label}.`;
  }
  if (assessment.evidence.trim().length < 10) return "Căn cứ tổng hợp cần ít nhất 10 ký tự.";
  return null;
}

export function weightedScore(templateId: string, scores: ProbationScore[]) {
  const template = probationTemplates[templateId];
  if (!template) return 0;
  return template.criteria.reduce((sum, criterion) => sum + criterion.weight * (scores.find((item) => item.id === criterion.id)?.score ?? 0), 0) / 100;
}
