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

const label = { assigned: "Chờ quản lý đánh giá", evaluated: "Chờ HR quyết định", activated: "Tiếp tục làm việc", "offboarding-required": "Cần mở offboarding", "offboarding-started": "Đã mở offboarding" };

export function ProbationWorkspace({ moduleId, onNavigate, hrView }: { moduleId: string; onNavigate: (id: string) => void; hrView: boolean }) {
  const id = moduleId.split("/")[1];
  return id ? <ProbationDetail id={id} onNavigate={onNavigate} hrView={hrView} /> : <ProbationList onNavigate={onNavigate} hrView={hrView} />;
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
  const [creating, setCreating] = useState(false);
  const scoped = probationReviews.filter((item) => { const person = employees.find((entry) => entry.id === item.employeeId); return person && (hrView ? canAccessScopedRecord(session, { employeeId: person.id, branch: person.branch, department: person.department }) : item.managerId === selfId); });
  const visible = scoped.filter((item) => { const person = employees.find((entry) => entry.id === item.employeeId); return (!query || `${person?.name ?? ""} ${person?.id ?? ""} ${item.id}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"))) && (!branch || person?.branch === branch) && (!status || item.status === status); });
  const candidates = hrView ? employees.filter((item) => item.status === "probation" && item.managerId && canAccessScopedRecord(session, { employeeId: item.id, branch: item.branch, department: item.department }) && !probationReviews.some((entry) => entry.employeeId === item.id && ["assigned", "evaluated", "offboarding-required", "offboarding-started"].includes(entry.status))) : [];
  function assign() {
    const result = assignProbation(candidateId, dueAt);
    if (!result.ok) { toast.error(result.error); return; }
    setCreating(false); setCandidateId(""); setDueAt(""); toast.success("Đã giao đánh giá cho quản lý trực tiếp."); onNavigate(`hr-probation/${result.review.id}`);
  }
  return <div className="page-stack hr-core"><WorkspaceHeader title={hrView ? "Đánh giá thử việc" : "Thử việc của đội ngũ"} action={hrView && can("probation", "edit") ? <button className="primary-button" onClick={() => setCreating((value) => !value)}>Giao đánh giá</button> : undefined} />

    {creating && <section className="panel hr-core-form"><h2>Giao nhiệm vụ đánh giá</h2><div className="hr-form-grid"><label>Nhân sự thử việc<select value={candidateId} onChange={(event) => setCandidateId(event.target.value)}><option value="">Chọn nhân sự có quản lý</option>{candidates.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.id} · {employees.find((manager) => manager.id === item.managerId)?.name}</option>)}</select></label><label>Hạn đánh giá<input type="date" min={hrToday()} value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label></div><div className="hr-detail-actions"><button className="secondary-button" onClick={() => setCreating(false)}>Hủy</button><button className="primary-button" disabled={!candidateId || !dueAt} onClick={assign}>Giao cho quản lý</button></div>{!candidates.length && <p className="hr-empty">Không có nhân sự thử việc đủ điều kiện trong phạm vi. Kiểm tra quản lý trực tiếp ở hồ sơ/cơ cấu.</p>}</section>}
    <section className="panel hr-directory"><div className="hr-directory-tools"><label><span>Tìm kiếm</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên, mã nhân sự hoặc mã đánh giá" /></label><select aria-label="Chi nhánh" value={branch} onChange={(event) => setBranch(event.target.value)}><option value="">Mọi chi nhánh</option>{[...new Set(scoped.map((item) => employees.find((person) => person.id === item.employeeId)?.branch).filter(Boolean))].map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Trạng thái" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Mọi trạng thái</option>{Object.entries(label).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Nhân sự</th><th>Quản lý trực tiếp</th><th>Hạn</th><th>Kết quả quản lý</th><th>Trạng thái</th><th /></tr></thead><tbody>{visible.map((item) => { const person = employees.find((entry) => entry.id === item.employeeId); return <tr key={item.id}><td><strong>{person?.name}</strong><small>{item.employeeId} · {person?.branch} · {item.id}</small></td><td>{employees.find((entry) => entry.id === item.managerId)?.name ?? item.managerId}</td><td>{hrDate(item.dueAt)}</td><td>{item.outcome === "pass" ? "Đề xuất tiếp tục" : item.outcome === "fail" ? "Đề xuất không tiếp tục" : "Chưa nộp"}</td><td><StatusPill tone={item.status === "activated" ? "success" : item.status === "assigned" ? "warning" : "blue"}>{label[item.status]}</StatusPill></td><td><button className="row-action" onClick={() => onNavigate(`${hrView ? "hr" : "team"}-probation/${item.id}`)}>Mở <ArrowRight size={14} /></button></td></tr>; })}</tbody></table></div>{!visible.length && <p className="hr-empty">Chưa có đánh giá thử việc phù hợp. HR có thể giao đánh giá cho nhân sự đang thử việc.</p>}</section>
  </div>;
}

function ProbationDetail({ id, onNavigate, hrView }: { id: string; onNavigate: (id: string) => void; hrView: boolean }) {
  const { employees, probationReviews, contracts, cases, evaluateProbation, decideProbation } = useHrDemo();
  const { session, can } = useSession();
  const selfId = personaEmployeeIds[session.id];
  const [outcome, setOutcome] = useState<"pass" | "fail">("pass");
  const [evidence, setEvidence] = useState("");
  const [decision, setDecision] = useState<"activate" | "offboard">("activate");
  const [reason, setReason] = useState("");
  const review = probationReviews.find((item) => item.id === id);
  const person = employees.find((item) => item.id === review?.employeeId);
  if (!review || !person || (hrView ? !canAccessScopedRecord(session, { employeeId: person.id, branch: person.branch, department: person.department }) : review.managerId !== selfId)) return <p className="hr-empty">Không tìm thấy đánh giá trong phạm vi được cấp.</p>;
  const contractReady = contracts.some((item) => item.employeeId === person.id && effectiveContractStatus(item, hrToday()) === "active");
  const onboardingReady = cases.some((item) => item.employeeId === person.id && item.kind === "onboarding" && item.completedAt);
  function submitEvaluation() { const result = evaluateProbation(review!.id, review!.version, outcome, evidence); if (!result.ok) { toast.error(result.error); return; } setEvidence(""); toast.success("Đã nộp đánh giá; HR cần ra quyết định."); }
  function submitDecision() { const result = decideProbation(review!.id, review!.version, decision, reason); if (!result.ok) { toast.error(result.error); return; } setReason(""); toast.success(decision === "activate" ? "Nhân sự chuyển sang đang làm việc." : "Đã ghi quyết định; cần mở offboarding với căn cứ giấy."); }
  return <div className="page-stack hr-core"><button className="hr-back" onClick={() => onNavigate(hrView ? "hr-probation" : "team-probation")}><ArrowLeft size={15} /> Danh sách thử việc</button><WorkspaceHeader title={`${person.name} · ${review.id}`} subtitle={`${person.id} · ${person.department} · ${person.branch}`} /><section className="panel hr-profile-hero"><div><span className="eyebrow">GIAI ĐOẠN THỬ VIỆC</span><h2>{person.name}</h2><p>Quản lý: {employees.find((item) => item.id === review.managerId)?.name ?? review.managerId} · hạn {hrDate(review.dueAt)}</p></div><StatusPill tone={review.status === "activated" ? "success" : "warning"}>{label[review.status]}</StatusPill></section>
    <section className="panel hr-core-form"><h2>Đánh giá của quản lý</h2>{review.status === "assigned" ? review.managerId === selfId && can("probation", "edit") ? <><label>Kết quả đề xuất<select value={outcome} onChange={(event) => setOutcome(event.target.value as "pass" | "fail")}><option value="pass">Đề xuất tiếp tục</option><option value="fail">Đề xuất không tiếp tục</option></select></label><label>Căn cứ / công việc đã đánh giá<textarea rows={4} value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Tối thiểu 10 ký tự; không dùng dữ liệu nhạy cảm" /></label><button className="primary-button" disabled={evidence.trim().length < 10} onClick={submitEvaluation}>Nộp đánh giá cho HR</button></> : <p>Đang chờ quản lý trực tiếp nộp nhận xét. HR không tự đánh giá thay.</p> : <><p><strong>{review.outcome === "pass" ? "Đề xuất tiếp tục" : "Đề xuất không tiếp tục"}</strong> · nộp {review.evaluatedAt ? new Date(review.evaluatedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—"}</p><p>{review.evidence}</p></>}</section>
    {hrView && <section className="panel hr-core-form"><h2>Quyết định HR</h2>{review.status === "evaluated" && can("probation", "approve") ? <><div className="hr-form-grid"><label>Nhánh quyết định<select value={decision} onChange={(event) => setDecision(event.target.value as "activate" | "offboard")}><option value="activate">Tiếp tục làm việc</option><option value="offboard">Không tiếp tục · mở offboarding</option></select></label><label>Lý do quyết định<textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Tối thiểu 8 ký tự" /></label></div>{decision === "activate" && <div className="hr-demo-note"><strong>Điều kiện tiếp tục</strong><span>Onboarding {onboardingReady ? "đã xong" : "chưa xong"} · hợp đồng có hiệu lực {contractReady ? "đã xác minh" : "chưa đủ"}. {(!contractReady || !onboardingReady) && <>Mở <button className="row-action" onClick={() => onNavigate(`onboarding/${cases.find((item) => item.employeeId === person.id && item.kind === "onboarding")?.id ?? ""}`)}>onboarding</button> hoặc <button className="row-action" onClick={() => onNavigate(`hr-contracts/new/${person.id}`)}>hợp đồng</button> để hoàn tất.</>}</span></div>}<button className="primary-button" disabled={reason.trim().length < 8 || (decision === "activate" && (!contractReady || !onboardingReady))} onClick={submitDecision}>Ghi quyết định HR</button></> : review.status === "offboarding-required" ? <><p>Quyết định đã lưu: {review.decisionReason}. Cần nhập căn cứ và lịch khóa tài khoản trong offboarding.</p><button className="primary-button" onClick={() => onNavigate(`offboarding/new/${person.id}`)}>Mở offboarding <ArrowRight size={14} /></button></> : review.status === "offboarding-started" ? <button className="secondary-button" onClick={() => onNavigate(`offboarding/${review.offboardingCaseId}`)}>Mở quy trình offboarding</button> : review.status === "activated" ? <p>Đã chuyển giai đoạn làm việc; hồ sơ nhân sự giữ nguyên mã {person.id}.</p> : <p>Chờ quản lý nộp đánh giá trước khi HR quyết định.</p>}</section>}
    {review.decidedAt && <section className="panel"><h2>Dấu vết quyết định</h2><p>{review.decidedBy} · {new Date(review.decidedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} · {review.decisionReason}</p></section>}
  </div>;
}
