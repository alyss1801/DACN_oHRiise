"use client";

import { useState } from "react";
import { ArrowRight, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { useHrDemo } from "@/features/hr/hr-demo-context";
import { useLeaveDemo } from "@/features/leave/leave-demo-context";
import { useDemoData } from "@/features/demo/demo-data-context";
import { useWfhDemo } from "@/features/wfh/wfh-demo-context";
import { useDemoClock } from "@/features/demo/demo-clock-context";
import { useSession } from "@/features/session/session-context";
import { personaEmployeeIds } from "@/lib/authorization/demo-identity";
import { WorkspaceHeader } from "@/features/employee/workspace-frame";
import { shortDate, teamDay } from "./team-view-model";

export function TeamOverviewWorkspace({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { session } = useSession();
  const { businessDate } = useDemoClock();
  const { employees, attendance, shiftAssignments, selfPunches, attendanceExplanations, probationReviews, reviewAttendanceExplanation } = useHrDemo();
  const { store: leaveStore } = useLeaveDemo();
  const { requests } = useDemoData();
  const { store: wfhStore } = useWfhDemo();
  const selfId = personaEmployeeIds[session.id];
  const reports = employees.filter((item) => item.managerId === selfId && item.status !== "inactive");
  const sources = { attendance, shiftAssignments, selfPunches, leave: leaveStore.requests, requests, wfhSessions: wfhStore.sessions };
  const days = reports.map((person) => ({ person, day: teamDay(person, businessDate, sources) }));
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [selectedExplanationId, setSelectedExplanationId] = useState("");
  const [reviewReason, setReviewReason] = useState("");
  const visible = days.filter(({ person, day }) => (!query || `${person.name} ${person.id} ${person.position}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"))) && (!status || day.kind === status));
  const leavePending = leaveStore.requests.filter((item) => item.managerId === selfId && item.status === "manager-pending");
  const requestPending = requests.filter((item) => item.approverId === selfId && item.status === "pending" && reports.some((person) => person.id === item.employeeId));
  const probationPending = probationReviews.filter((item) => item.managerId === selfId && item.status === "assigned");
  const explanations = attendanceExplanations.filter((item) => item.managerId === selfId && item.status === "submitted");
  const selectedExplanation = explanations.find((item) => item.id === selectedExplanationId);
  const horizon = new Date(`${businessDate}T12:00:00Z`);
  horizon.setUTCDate(horizon.getUTCDate() + 14);
  const until = horizon.toISOString().slice(0, 10);
  const upcoming = [
    ...leaveStore.requests.filter((item) => reports.some((person) => person.id === item.employeeId) && ["approved", "cancellation-pending"].includes(item.status) && item.from >= businessDate && item.from <= until).map((item) => ({ date: item.from, employeeId: item.employeeId, label: "Nghỉ phép", route: `approvals/leave/${item.id}` })),
    ...requests.filter((item) => item.type === "WFH" && item.status === "approved" && reports.some((person) => person.id === item.employeeId) && item.date >= businessDate && item.date <= until).map((item) => ({ date: item.date, employeeId: item.employeeId ?? "", label: "WFH đã duyệt", route: `approvals/inbox/${item.id}` })),
    ...probationPending.filter((item) => item.dueAt >= businessDate && item.dueAt <= until).map((item) => ({ date: item.dueAt, employeeId: item.employeeId, label: "Hạn đánh giá thử việc", route: `team-probation/${item.id}` })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
  const actions = [
    { label: "Đơn nghỉ phép", count: leavePending.length, tone: "rose", route: leavePending[0] ? `approvals/leave/${leavePending[0].id}` : "approvals/leave" },
    { label: "Đăng ký WFH", count: requestPending.filter((item) => item.type === "WFH").length, tone: "blue", route: `approvals/inbox/${requestPending.find((item) => item.type === "WFH")?.id ?? ""}` },
    { label: "Điều chỉnh công", count: requestPending.filter((item) => item.type === "Điều chỉnh chấm công").length + explanations.length, tone: "amber", route: `approvals/inbox/${requestPending.find((item) => item.type === "Điều chỉnh chấm công")?.id ?? ""}` },
    { label: "Đăng ký OT", count: requestPending.filter((item) => item.type === "Đăng ký OT").length, tone: "violet", route: `approvals/inbox/${requestPending.find((item) => item.type === "Đăng ký OT")?.id ?? ""}` },
    { label: "Đổi ca", count: requestPending.filter((item) => item.type === "Đổi ca").length, tone: "cyan", route: `approvals/inbox/${requestPending.find((item) => item.type === "Đổi ca")?.id ?? ""}` },
    { label: "Đánh giá thử việc", count: probationPending.length, tone: "mint", route: probationPending[0] ? `team-probation/${probationPending[0].id}` : "team-probation" },
  ].filter((item) => item.count > 0);
  function decideExplanation(decision: "confirmed" | "rejected") {
    if (!selectedExplanation) return;
    const result = reviewAttendanceExplanation(selectedExplanation.id, decision, reviewReason);
    if (!result.ok) { toast.error(result.error); return; }
    setSelectedExplanationId(""); setReviewReason(""); toast.success(decision === "confirmed" ? "Đã chuyển HR đối soát công." : "Đã từ chối giải trình.");
  }
  const todayLabel = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${businessDate}T12:00:00Z`));
  return <div className="page-stack hr-core team-hub">
    <WorkspaceHeader title="Tổng quan đội ngũ" subtitle={todayLabel} />
    <div className="team-hub-toolbar"><button className="secondary-button" onClick={() => onNavigate("team-calendar")}><CalendarDays size={15} /> Lịch đội ngũ <ArrowRight size={14} /></button></div>
    <section className="team-hub-metrics" aria-label="Tổng quan trong ngày">{[
      { label: "Nhân sự trực tiếp", value: reports.length, tone: "blue" },
      { label: "Văn phòng có bản công", value: days.filter(({ day }) => day.kind === "office" && !!day.checkIn).length, tone: "mint" },
      { label: "WFH đã duyệt", value: days.filter(({ day }) => day.kind === "wfh").length, tone: "cyan" },
      { label: "Nghỉ phép đã duyệt", value: days.filter(({ day }) => day.kind === "leave").length, tone: "amber" },
      { label: "Ngoại lệ công", value: days.filter(({ day }) => !!day.issue).length, tone: "rose" },
    ].map((item) => <article className={`team-hub-metric ${item.tone}`} key={item.label}><span>{item.label}</span><strong>{item.value}</strong></article>)}</section>
    <section className="team-hub-section"><div className="team-hub-section-head"><h2>Việc cần xử lý</h2><span>{actions.reduce((sum, item) => sum + item.count, 0)}</span></div>{actions.length ? <div className="team-hub-actions">{actions.map((item) => <button key={item.label} className={`team-hub-action ${item.tone}`} onClick={() => item.label === "Điều chỉnh công" && !requestPending.some((request) => request.type === "Điều chỉnh chấm công") && explanations[0] ? setSelectedExplanationId(explanations[0].id) : onNavigate(item.route)}><strong>{item.count}</strong><span>{item.label}</span><small>Xem và xử lý <ArrowRight size={13} /></small></button>)}</div> : <div className="team-hub-empty">Không có việc chờ xử lý.</div>}</section>
    {explanations.length > 0 && <section className="panel hr-directory"><div className="team-hub-section-head"><h2>Giải trình công</h2><span>{explanations.length}</span></div><div className="hr-task-list">{explanations.map((item) => { const person = employees.find((entry) => entry.id === item.employeeId); const row = attendance.find((entry) => entry.id === item.attendanceId); return <button key={item.id} className={selectedExplanationId === item.id ? "selected" : ""} onClick={() => { setSelectedExplanationId(item.id); setReviewReason(""); }}><span><strong>{person?.name ?? item.employeeId} · {row?.date ?? "—"}</strong><small>{item.text}</small></span><ArrowRight size={14} /></button>; })}</div>{selectedExplanation && <div className="self-attendance-detail"><h3>{employees.find((item) => item.id === selectedExplanation.employeeId)?.name}</h3><p>{selectedExplanation.text}</p><label>Ghi chú quyết định<textarea rows={2} value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} placeholder="Tối thiểu 8 ký tự" /></label><div className="hr-detail-actions"><button className="secondary-button" disabled={reviewReason.trim().length < 8} onClick={() => decideExplanation("rejected")}>Từ chối</button><button className="primary-button" disabled={reviewReason.trim().length < 8} onClick={() => decideExplanation("confirmed")}>Xác nhận cho HR</button></div></div>}</section>}
    <section className="panel hr-directory"><div className="team-hub-section-head"><h2>Trạng thái hôm nay <small>({shortDate(businessDate)})</small></h2></div><div className="hr-directory-tools"><label className="compact-search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên, mã, chức danh" aria-label="Tìm nhân sự" /></label><select aria-label="Lọc trạng thái" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tất cả trạng thái</option><option value="office">Văn phòng</option><option value="wfh">WFH</option><option value="leave">Nghỉ phép</option><option value="off">Ngày nghỉ</option><option value="unscheduled">Chưa phân ca</option></select></div><div className="table-scroll"><table className="data-table team-hub-table"><thead><tr><th>Nhân sự</th><th>Chức danh</th><th>Trạng thái</th><th>Giờ vào/ra</th><th>Ca làm việc</th><th /></tr></thead><tbody>{visible.map(({ person, day }) => <tr key={person.id}><td><strong>{person.name}</strong><small>{person.id}</small></td><td>{person.position}</td><td><span className={`team-hub-badge ${day.kind}`}>{day.label}</span>{day.issue && <small className="team-hub-issue">Ngoại lệ: {day.issue}</small>}{day.pending.map((item) => <small key={item}>{item}</small>)}</td><td>{day.checkIn ?? "—"} / {day.checkOut ?? "—"}</td><td>{day.detail}</td><td><button className="row-action" onClick={() => onNavigate("team-calendar")}>Xem lịch <ArrowRight size={13} /></button></td></tr>)}</tbody></table></div>{!visible.length && <p className="hr-empty">Không có nhân sự phù hợp.</p>}</section>
    {upcoming.length > 0 && <section className="team-hub-section"><div className="team-hub-section-head"><h2>Mốc sắp tới</h2></div><div className="team-hub-upcoming">{upcoming.map((item) => <button key={`${item.label}-${item.employeeId}-${item.date}`} onClick={() => onNavigate(item.route)}><span><strong>{employees.find((person) => person.id === item.employeeId)?.name}</strong><small>{item.label} · {shortDate(item.date)}</small></span><ArrowRight size={15} /></button>)}</div></section>}
  </div>;
}
