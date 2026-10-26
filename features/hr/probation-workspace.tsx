"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/features/session/session-context";
import { canAccessScopedRecord } from "@/lib/authorization/engine";
import { personaEmployeeIds } from "@/lib/authorization/demo-identity";
import { StatusPill, WorkspaceHeader } from "@/features/employee/workspace-frame";
import { useHrDemo } from "./hr-demo-context";
import { hrDate, hrToday } from "./hr-demo-data";
import { effectiveContractStatus } from "./contract-model";
import { assessmentError, probationTemplates, templateForDepartment, weightedScore, type ProbationAssessment, type ProbationScore } from "./probation-template";

const labels = { assigned: "Chờ đánh giá", evaluated: "Đã gửi HR", activated: "Đã hoàn thành", "offboarding-required": "Chờ offboarding", "offboarding-started": "Đang offboarding" };
const remaining = (dueAt: string) => Math.round((new Date(`${dueAt}T12:00:00Z`).getTime() - new Date(`${hrToday()}T12:00:00Z`).getTime()) / 86_400_000);

export function ProbationWorkspace({ moduleId, onNavigate, hrView }: { moduleId: string; onNavigate: (id: string) => void; hrView: boolean }) {
  const id = moduleId.split("/")[1];
  return id ? <ProbationDetail key={id} id={id} onNavigate={onNavigate} hrView={hrView} /> : <ProbationList onNavigate={onNavigate} hrView={hrView} />;
}

function ProbationList({ onNavigate, hrView }: { onNavigate: (id: string) => void; hrView: boolean }) {
  const { employees, probationReviews, assignProbation } = useHrDemo();
  const { session, can } = useSession();
  const selfId = personaEmployeeIds[session.id];
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("");
  const [status, setStatus] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [creating, setCreating] = useState(false);
  const scoped = probationReviews.filter((item) => { const person = employees.find((entry) => entry.id === item.employeeId); return person && (hrView ? canAccessScopedRecord(session, { employeeId: person.id, branch: person.branch, department: person.department }) : item.managerId === selfId); });
  const sorted = [...scoped].sort((a, b) => (a.status === "assigned" ? 0 : 1) - (b.status === "assigned" ? 0 : 1) || a.dueAt.localeCompare(b.dueAt));
  const visible = sorted.filter((item) => { const person = employees.find((entry) => entry.id === item.employeeId); return (!query || `${person?.name ?? ""} ${person?.id ?? ""} ${item.id}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"))) && (!branch || person?.branch === branch) && (!status || item.status === status); });
  const candidates = hrView ? employees.filter((item) => item.status === "probation" && item.managerId && canAccessScopedRecord(session, { employeeId: item.id, branch: item.branch, department: item.department }) && !probationReviews.some((entry) => entry.employeeId === item.id && ["assigned", "evaluated", "offboarding-required", "offboarding-started"].includes(entry.status))) : [];
  function assign() {
    const result = assignProbation(candidateId, dueAt, templateId || templateForDepartment(employees.find((item) => item.id === candidateId)?.department ?? ""));
    if (!result.ok) { toast.error(result.error); return; }
    setCreating(false); setCandidateId(""); setDueAt(""); setTemplateId(""); toast.success("Đã giao đánh giá cho quản lý trực tiếp."); onNavigate(`hr-probation/${result.review.id}`);
  }
  const active = employees.filter((item) => item.status === "probation" && (hrView ? canAccessScopedRecord(session, { employeeId: item.id, branch: item.branch, department: item.department }) : item.managerId === selfId)).length;
  const nearDue = scoped.filter((item) => item.status === "assigned" && remaining(item.dueAt) <= 14).length;
  return <div className="page-stack hr-core probation-hub"><WorkspaceHeader title="Đánh giá thử việc" subtitle={hrView ? "Theo dõi giao việc và quyết định" : "Nhân sự trong phạm vi quản lý"} action={hrView && can("probation", "edit") ? <button className="primary-button" onClick={() => setCreating((value) => !value)}>Giao đánh giá</button> : undefined} />
    <section className="probation-metrics">{[
      { label: "Đang thử việc", count: active },
      { label: "Sắp đến hạn / quá hạn", count: nearDue },
      { label: hrView ? "Chờ quản lý đánh giá" : "Chờ tôi đánh giá", count: scoped.filter((item) => item.status === "assigned").length },
      { label: "Đã gửi HR", count: scoped.filter((item) => item.status === "evaluated").length },
      { label: "Đã hoàn thành", count: scoped.filter((item) => item.status === "activated" || item.status === "offboarding-started").length },
    ].map((item) => <article className="panel" key={item.label}><strong>{item.count}</strong><span>{item.label}</span></article>)}</section>
    {creating && <section className="panel hr-core-form"><h2>Giao nhiệm vụ đánh giá</h2><div className="hr-form-grid"><label>Nhân sự thử việc<select value={candidateId} onChange={(event) => setCandidateId(event.target.value)}><option value="">Chọn nhân sự có quản lý</option>{candidates.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.id} · {employees.find((manager) => manager.id === item.managerId)?.name}</option>)}</select></label><label>Hạn đánh giá<input type="date" min={hrToday()} value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label><label>Mẫu đánh giá<select value={templateId} onChange={(event) => setTemplateId(event.target.value)}><option value="">Theo phòng ban</option>{Object.entries(probationTemplates).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label></div><div className="hr-detail-actions"><button className="secondary-button" onClick={() => setCreating(false)}>Hủy</button><button className="primary-button" disabled={!candidateId || !dueAt} onClick={assign}>Giao cho quản lý</button></div>{!candidates.length && <p className="hr-empty">Không còn nhân sự thử việc đủ điều kiện trong phạm vi.</p>}</section>}
    <section className="panel hr-directory"><div className="hr-directory-tools"><label className="compact-search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên, mã nhân sự hoặc đánh giá" aria-label="Tìm đánh giá" /></label><select aria-label="Chi nhánh" value={branch} onChange={(event) => setBranch(event.target.value)}><option value="">Mọi chi nhánh</option>{[...new Set(scoped.map((item) => employees.find((person) => person.id === item.employeeId)?.branch).filter(Boolean))].map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Trạng thái" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Mọi trạng thái</option>{Object.entries(labels).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Nhân sự</th><th>Ngày bắt đầu</th><th>Hạn đánh giá</th><th>Còn lại</th><th>Người đánh giá</th><th>Trạng thái</th><th /></tr></thead><tbody>{visible.map((item) => { const person = employees.find((entry) => entry.id === item.employeeId); const left = remaining(item.dueAt); return <tr key={item.id}><td><strong>{person?.name}</strong><small>{item.employeeId} · {person?.position}</small></td><td>{person?.startDate ? hrDate(person.startDate) : "—"}</td><td>{hrDate(item.dueAt)}</td><td className={left < 0 && item.status === "assigned" ? "probation-overdue" : ""}>{item.status === "assigned" ? left < 0 ? `Quá ${-left} ngày` : `${left} ngày` : "—"}</td><td>{employees.find((entry) => entry.id === item.managerId)?.name ?? item.managerId}</td><td><StatusPill tone={item.status === "activated" ? "success" : item.status === "assigned" ? "warning" : "blue"}>{labels[item.status]}</StatusPill></td><td><button className="row-action" onClick={() => onNavigate(`${hrView ? "hr" : "team"}-probation/${item.id}`)}>{item.status === "assigned" && !hrView ? "Đánh giá" : "Chi tiết"} <ArrowRight size={14} /></button></td></tr>; })}</tbody></table></div>{!visible.length && <p className="hr-empty">Không có đánh giá phù hợp.</p>}</section>
  </div>;
}

function ProbationDetail({ id, onNavigate, hrView }: { id: string; onNavigate: (id: string) => void; hrView: boolean }) {
  const { employees, probationReviews, contracts, cases, saveProbationDraft, evaluateProbation, decideProbation } = useHrDemo();
  const { session, can } = useSession();
  const selfId = personaEmployeeIds[session.id];
  const review = probationReviews.find((item) => item.id === id);
  const person = employees.find((item) => item.id === review?.employeeId);
  const templateId = review?.templateId ?? "general";
  const template = probationTemplates[templateId] ?? probationTemplates.general;
  const [outcome, setOutcome] = useState<"pass" | "fail">(review?.draft?.outcome ?? "pass");
  const [scores, setScores] = useState<ProbationScore[]>(review?.draft?.scores ?? []);
  const [evidence, setEvidence] = useState(review?.draft?.evidence ?? "");
  const [decision, setDecision] = useState<"activate" | "offboard">("activate");
  const [reason, setReason] = useState("");
  if (!review || !person || (hrView ? !canAccessScopedRecord(session, { employeeId: person.id, branch: person.branch, department: person.department }) : review.managerId !== selfId)) return <p className="hr-empty">Không tìm thấy đánh giá trong phạm vi được cấp.</p>;
  const contractReady = contracts.some((item) => item.employeeId === person.id && effectiveContractStatus(item, hrToday()) === "active");
  const onboardingReady = cases.some((item) => item.employeeId === person.id && item.kind === "onboarding" && item.completedAt);
  const assessment = (): ProbationAssessment => ({ outcome, scores, evidence, updatedAt: new Date().toISOString() });
  const formError = assessmentError(templateId, assessment());
  const editable = review.status === "assigned" && review.managerId === selfId && can("probation", "edit") && !hrView;
  function updateScore(id: string, patch: Partial<ProbationScore>) {
    setScores((current) => { const old = current.find((item) => item.id === id) ?? { id, score: 0, comment: "" }; return [...current.filter((item) => item.id !== id), { ...old, ...patch }]; });
  }
  function saveDraft() { const result = saveProbationDraft(review!.id, review!.version, assessment()); if (!result.ok) { toast.error(result.error); return; } toast.success("Đã lưu bản nháp đánh giá."); }
  function submitEvaluation() { const result = evaluateProbation(review!.id, review!.version, outcome, evidence, assessment()); if (!result.ok) { toast.error(result.error); return; } toast.success("Đã gửi đánh giá cho HR."); }
  function submitDecision() { const result = decideProbation(review!.id, review!.version, decision, reason); if (!result.ok) { toast.error(result.error); return; } setReason(""); toast.success("Đã lưu quyết định HR."); }
  const shownAssessment = review.assessment ?? review.draft;
  return <div className="page-stack hr-core probation-hub"><button className="hr-back" onClick={() => onNavigate(hrView ? "hr-probation" : "team-probation")}><ArrowLeft size={15} /> Danh sách thử việc</button><WorkspaceHeader title={person.name} subtitle={`${person.id} · ${person.position} · ${person.branch}`} /><section className="panel probation-hero"><div><span className="eyebrow">{review.id}</span><h2>{person.name}</h2><p>Bắt đầu {hrDate(person.startDate)} · Hạn đánh giá {hrDate(review.dueAt)} · Quản lý {employees.find((item) => item.id === review.managerId)?.name}</p></div><StatusPill tone={review.status === "activated" ? "success" : "warning"}>{labels[review.status]}</StatusPill></section>
    <section className="panel probation-form"><div className="team-hub-section-head"><div><h2>Biểu mẫu đánh giá thử việc</h2><p>{template.label} · phiên bản {review.templateVersion ?? template.version}</p></div>{shownAssessment && <strong>{weightedScore(templateId, shownAssessment.scores).toFixed(1)}/5</strong>}</div>{template.criteria.map((criterion) => { const row = (editable ? scores : shownAssessment?.scores ?? []).find((item) => item.id === criterion.id); return <div className="probation-criterion" key={criterion.id}><div><strong>{criterion.label}</strong><small>{criterion.weight}%</small></div>{editable ? <><select aria-label={`Điểm ${criterion.label}`} value={row?.score ?? 0} onChange={(event) => updateScore(criterion.id, { score: Number(event.target.value) })}><option value={0}>Chọn điểm</option>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}/5</option>)}</select><textarea aria-label={`Nhận xét ${criterion.label}`} rows={2} value={row?.comment ?? ""} onChange={(event) => updateScore(criterion.id, { comment: event.target.value })} placeholder="Nhận xét cụ thể" /></> : <><span>{row?.score ?? "—"}/5</span><p>{row?.comment ?? "Chưa có nhận xét"}</p></>}</div>; })}
      {editable ? <div className="probation-conclusion"><label>Đề xuất<select value={outcome} onChange={(event) => setOutcome(event.target.value as "pass" | "fail")}><option value="pass">Tiếp tục làm việc</option><option value="fail">Không tiếp tục</option></select></label><label>Căn cứ tổng hợp<textarea rows={3} value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Kết quả công việc và căn cứ đề xuất" /></label><div className="hr-detail-actions"><button className="secondary-button" onClick={saveDraft}>Lưu nháp</button><button className="primary-button" disabled={!!formError} onClick={submitEvaluation}>Gửi HR duyệt</button></div>{formError && <small>{formError}</small>}</div> : review.status === "assigned" ? <p className="hr-empty">Đang chờ quản lý trực tiếp đánh giá.</p> : <div className="probation-conclusion"><strong>{review.outcome === "pass" ? "Đề xuất tiếp tục" : "Đề xuất không tiếp tục"}</strong><p>{review.evidence}</p><small>Nộp {review.evaluatedAt ? new Date(review.evaluatedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—"}</small></div>}</section>
    {hrView && <section className="panel hr-core-form"><h2>Quyết định HR</h2>{review.status === "evaluated" && can("probation", "approve") ? <><div className="hr-form-grid"><label>Quyết định<select value={decision} onChange={(event) => setDecision(event.target.value as "activate" | "offboard")}><option value="activate">Tiếp tục làm việc</option><option value="offboard">Không tiếp tục · mở offboarding</option></select></label><label>Lý do quyết định<textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Tối thiểu 8 ký tự" /></label></div>{decision === "activate" && <div className="probation-readiness"><span>Onboarding: {onboardingReady ? "Hoàn tất" : "Chưa hoàn tất"}</span><span>Hợp đồng: {contractReady ? "Đã xác minh" : "Chưa đủ điều kiện"}</span>{(!contractReady || !onboardingReady) && <div><button className="row-action" onClick={() => onNavigate(`onboarding/${cases.find((item) => item.employeeId === person.id && item.kind === "onboarding")?.id ?? ""}`)}>Mở onboarding</button><button className="row-action" onClick={() => onNavigate(`hr-contracts/new/${person.id}`)}>Mở hợp đồng</button></div>}</div>}<button className="primary-button" disabled={reason.trim().length < 8 || (decision === "activate" && (!contractReady || !onboardingReady))} onClick={submitDecision}>Ghi quyết định HR</button></> : review.status === "offboarding-required" ? <><p>{review.decisionReason}</p><button className="primary-button" onClick={() => onNavigate(`offboarding/new/${person.id}`)}>Mở offboarding <ArrowRight size={14} /></button></> : review.status === "offboarding-started" ? <button className="secondary-button" onClick={() => onNavigate(`offboarding/${review.offboardingCaseId}`)}>Mở quy trình offboarding</button> : review.status === "activated" ? <p>Đã chuyển sang giai đoạn làm việc với mã nhân sự {person.id}.</p> : <p>Chờ quản lý gửi đánh giá.</p>}</section>}
    <section className="panel probation-history"><h2>Lịch sử hồ sơ</h2><p>Giao đánh giá · {hrDate(review.assignedAt.slice(0, 10))} · {review.assignedBy}</p>{review.draft && <p>Lưu nháp · {new Date(review.draft.updatedAt).toLocaleString("vi-VN")}</p>}{review.evaluatedAt && <p>Quản lý nộp đánh giá · {new Date(review.evaluatedAt).toLocaleString("vi-VN")}</p>}{review.decidedAt && <p>HR quyết định · {new Date(review.decidedAt).toLocaleString("vi-VN")} · {review.decidedBy} · {review.decisionReason}</p>}</section>
  </div>;
}
