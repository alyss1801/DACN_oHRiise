"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useHrDemo } from "@/features/hr/hr-demo-context";
import { useLeaveDemo } from "@/features/leave/leave-demo-context";
import { useDemoData } from "@/features/demo/demo-data-context";
import { useWfhDemo } from "@/features/wfh/wfh-demo-context";
import { useDemoClock } from "@/features/demo/demo-clock-context";
import { useSession } from "@/features/session/session-context";
import { personaEmployeeIds } from "@/lib/authorization/demo-identity";
import { StatusPill, WorkspaceHeader } from "@/features/employee/workspace-frame";

export function TeamOverviewWorkspace({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { session } = useSession();
  const { businessDate } = useDemoClock();
  const { employees, attendance, attendanceExplanations, probationReviews, reviewAttendanceExplanation } = useHrDemo();
  const { store: leaveStore } = useLeaveDemo();
  const { requests } = useDemoData();
  const { store: wfhStore } = useWfhDemo();
  const selfId = personaEmployeeIds[session.id];
  const reports = employees.filter((item) => item.managerId === selfId && item.status !== "inactive");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [selectedExplanationId, setSelectedExplanationId] = useState("");
  const [reviewReason, setReviewReason] = useState("");
  const stateOf = (employeeId: string) => {
    if (leaveStore.requests.some((item) => item.employeeId === employeeId && (item.status === "approved" || item.status === "cancellation-pending") && item.from <= businessDate && item.to >= businessDate)) return "Nghỉ phép";
    const plan = requests.find((item) => item.type === "WFH" && item.employeeId === employeeId && item.date === businessDate && item.status === "approved");
    if (plan) return wfhStore.sessions.some((item) => item.requestId === plan.id && item.checkInAt) ? "WFH · có phiên" : "WFH · kế hoạch";
    const row = attendance.find((item) => item.employeeId === employeeId && item.date === businessDate);
    return row ? row.issue === "none" ? "Có bản ghi công" : "Công có ngoại lệ" : "Chưa có bản ghi";
  };
  const visible = reports.filter((item) => (!query || `${item.name} ${item.id} ${item.position}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"))) && (!status || stateOf(item.id) === status));
  const assignedLeave = leaveStore.requests.filter((item) => item.managerId === selfId && item.status === "manager-pending");
  const assignedProbation = probationReviews.filter((item) => item.managerId === selfId && item.status === "assigned");
  const pendingExplanations = attendanceExplanations.filter((item) => item.managerId === selfId && item.status === "submitted");
  const selectedExplanation = pendingExplanations.find((item) => item.id === selectedExplanationId);
  function decideExplanation(decision: "confirmed" | "rejected") {
    if (!selectedExplanation) return;
    const result = reviewAttendanceExplanation(selectedExplanation.id, decision, reviewReason);
    if (!result.ok) { toast.error(result.error); return; }
    setSelectedExplanationId(""); setReviewReason(""); toast.success(decision === "confirmed" ? "Đã xác nhận căn cứ; HR cần đối soát công." : "Đã trả giải trình về HR cùng lý do.");
  }
  const statuses = [...new Set(reports.map((item) => stateOf(item.id)))];
  return <div className="page-stack hr-core"><WorkspaceHeader title="Đội ngũ trực tiếp" subtitle={`${reports.length} nhân sự`} />
    <div className="hr-demo-note"><strong>Nguồn dữ liệu chung</strong><span>Trạng thái lấy từ công, nghỉ phép và WFH demo cùng employee ID. Không suy ra đang online, GPS hay có mặt thực tế từ kế hoạch/thiết bị chưa kết nối.</span></div>
    <section className="home-core-facts"><article className="panel"><span>Nhân sự trực tiếp</span><strong>{reports.length}</strong><small>Quan hệ quản lý trong hồ sơ HR</small></article><article className="panel"><span>Đơn nghỉ chờ tôi</span><strong>{assignedLeave.length}</strong><button className="row-action" onClick={() => onNavigate("approvals/leave")}>Xử lý đơn <ArrowRight size={14} /></button></article><article className="panel"><span>Thử việc chờ đánh giá</span><strong>{assignedProbation.length}</strong><button className="row-action" onClick={() => onNavigate("team-probation")}>Mở đánh giá <ArrowRight size={14} /></button></article></section>
    {pendingExplanations.length > 0 && <section className="panel hr-directory">
      <div className="hr-core-heading"><div><h2>Giải trình công chờ tôi xác nhận · {pendingExplanations.length}</h2><p>Chỉ nhận bản ghi của nhân sự có tuyến quản lý trực tiếp tới bạn lúc nộp.</p></div></div>
      <div className="hr-task-list">{pendingExplanations.map((item) => { const row = attendance.find((entry) => entry.id === item.attendanceId); const person = employees.find((entry) => entry.id === item.employeeId); return <button key={item.id} className={selectedExplanationId === item.id ? "selected" : ""} onClick={() => { setSelectedExplanationId(item.id); setReviewReason(""); }}><span><strong>{person?.name ?? item.employeeId} · {row?.date ?? "—"}</strong><small>{row?.issue ?? "Ngoại lệ công"} · {item.text}</small></span><ArrowRight size={14} /></button>; })}</div>
      {selectedExplanation && <div className="self-attendance-detail"><h3>Giải trình của {employees.find((item) => item.id === selectedExplanation.employeeId)?.name}</h3><p>{selectedExplanation.text}</p><label>Căn cứ xác nhận / từ chối<textarea rows={2} value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} placeholder="Tối thiểu 8 ký tự" /></label><div className="hr-detail-actions"><button className="secondary-button" disabled={reviewReason.trim().length < 8} onClick={() => decideExplanation("rejected")}>Không xác nhận</button><button className="primary-button" disabled={reviewReason.trim().length < 8} onClick={() => decideExplanation("confirmed")}>Xác nhận cho HR</button></div></div>}
    </section>}
    <section className="panel hr-directory"><div className="hr-directory-tools"><label><span>Tìm nhân sự</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên, mã hoặc chức danh" /></label><select aria-label="Trạng thái hôm nay" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Mọi trạng thái</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select><button className="secondary-button" onClick={() => onNavigate("team-calendar")}>Lịch đội ngũ</button></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Nhân sự</th><th>Chức danh</th><th>Chi nhánh</th><th>Giai đoạn</th><th>Ngày {businessDate}</th><th /></tr></thead><tbody>{visible.map((person) => <tr key={person.id}><td><strong>{person.name}</strong><small>{person.id}</small></td><td>{person.position}</td><td>{person.branch}</td><td>{person.status === "probation" ? "Thử việc" : "Đang làm việc"}</td><td><StatusPill tone={stateOf(person.id).includes("ngoại lệ") ? "warning" : "blue"}>{stateOf(person.id)}</StatusPill></td><td>{probationReviews.some((item) => item.employeeId === person.id && item.managerId === selfId) && <button className="row-action" onClick={() => onNavigate(`team-probation/${probationReviews.find((item) => item.employeeId === person.id && item.managerId === selfId)?.id}`)}>Đánh giá <ArrowRight size={14} /></button>}</td></tr>)}</tbody></table></div>{!visible.length && <p className="hr-empty">Không có nhân sự trực tiếp phù hợp bộ lọc.</p>}</section>
  </div>;
}
