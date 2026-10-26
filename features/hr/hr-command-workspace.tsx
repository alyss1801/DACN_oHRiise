"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight, CalendarClock, ClipboardCheck, FileWarning, UsersRound } from "lucide-react";
import { useLeaveDemo } from "@/features/leave/leave-demo-context";
import { useSession } from "@/features/session/session-context";
import { canAccessScopedRecord } from "@/lib/authorization/engine";
import { WorkspaceHeader } from "@/features/employee/workspace-frame";
import { useHrDemo } from "./hr-demo-context";
import { hrToday } from "./hr-demo-data";
import { demoBusinessNow } from "@/lib/demo-clock";

export function HrCommandWorkspace({ onNavigate }: { onNavigate: (id: string) => void }) {
  const day = hrToday();
  const limit = new Date(`${day}T12:00:00+07:00`);
  limit.setUTCDate(limit.getUTCDate() + 30);
  const expiryLimit = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(limit);
  const { session } = useSession();
  const { store: leaveStore } = useLeaveDemo();
  const { employees, attendance, contracts, periods, activities, cases, probationReviews } = useHrDemo();
  const people = employees.filter((person) => canAccessScopedRecord(session, { employeeId: person.id, branch: person.branch, department: person.department }));
  const personIds = new Set(people.map((person) => person.id));
  const rows = attendance.filter((item) => item.date === day && personIds.has(item.employeeId));
  const leaveToday = people.filter((person) => leaveStore.requests.some((request) => request.employeeId === person.id && request.from <= day && request.to >= day && request.status === "approved")).length;
  const pendingRequests = leaveStore.requests.filter((item) => (item.status === "hr-pending" || item.status === "cancellation-pending") && personIds.has(item.employeeId));
  const expiring = contracts.filter((item) => personIds.has(item.employeeId) && item.status === "active" && item.endsAt && item.endsAt >= day && item.endsAt <= expiryLimit);
  const reconcilingPeriods = periods.filter((item) => item.status === "reconciling").sort((a, b) => b.id.localeCompare(a.id));
  const focusPeriod = reconcilingPeriods[0];
  const issues = attendance.filter((item) => item.date.startsWith(focusPeriod?.id ?? "_") && personIds.has(item.employeeId) && item.issue !== "none" && (item.resolution === "open" || item.resolution === "explanation"));
  const [branch, setBranch] = useState(""); const [department, setDepartment] = useState(""); const [period, setPeriod] = useState("7");
  const [view, setView] = useState<"actions" | "metrics" | "activity">("actions");
  const filteredActivities = activities.filter((item) => (item.employeeId ? personIds.has(item.employeeId) : session.effectiveScope === "company") && (!branch || item.branch === branch) && (!department || item.department === department) && (period === "all" || new Date(item.at).getTime() >= demoBusinessNow().getTime() - Number(period) * 86400000));
  const metrics = [
    ["Nhân sự trong phạm vi", people.length, "employees"], ["Đang làm việc", people.filter((item) => item.status === "active").length, "employees/active"], ["Thử việc", people.filter((item) => item.status === "probation").length, "employees/probation"],
    ["Đã check-in", rows.filter((item) => item.events.some((event) => event.kind === "check-in")).length, "attendance-monitoring/checked-in"], ["Chưa check-in", rows.filter((item) => !item.events.some((event) => event.kind === "check-in")).length, "attendance-monitoring/missing-in"], ["Đi trễ", rows.filter((item) => item.issue === "late").length, "attendance-monitoring/late"],
    ["Nghỉ có phép", leaveToday, "hr-leave/calendar"], ["Bất thường kỳ đang đối soát", issues.length, `attendance-monitoring/exceptions/${focusPeriod?.id ?? day.slice(0, 7)}`], ["Đơn chờ HR xử lý", pendingRequests.length, "hr-leave/pending"], ["Hợp đồng sắp hết hạn", expiring.length, "hr-contracts/expiring"],
  ] as const;
  const actions = [
    { title: `Ngoại lệ công kỳ ${focusPeriod?.id ?? "—"}`, count: issues.length, route: `attendance-monitoring/exceptions/${focusPeriod?.id ?? day.slice(0, 7)}`, note: "Kiểm tra sự kiện gốc và lý do điều chỉnh", icon: AlertTriangle },
    { title: "Đơn nghỉ chờ duyệt", count: pendingRequests.length, route: "hr-leave/pending", note: "Đối chiếu lịch và số dư phép", icon: CalendarClock },
    { title: "Hợp đồng sắp hạn", count: expiring.length, route: "hr-contracts/expiring", note: "Chuẩn bị hồ sơ gia hạn", icon: FileWarning },
    { title: "Kỳ công đang đối soát", count: reconcilingPeriods.length, route: `timesheets/${focusPeriod?.id ?? day.slice(0, 7)}`, note: "Giải quyết ngoại lệ trước khi chốt", icon: ClipboardCheck },
    { title: "Onboarding còn nhiệm vụ", count: cases.filter((item) => item.kind === "onboarding" && personIds.has(item.employeeId) && !item.completedAt).length, route: "onboarding", note: "Hợp đồng, tài khoản và tài sản", icon: UsersRound },
    { title: "Thử việc chờ quyết định HR", count: probationReviews.filter((item) => item.status === "evaluated" && personIds.has(item.employeeId)).length, route: "hr-probation", note: "Đã có nhận xét của quản lý; kiểm tra onboarding/hợp đồng", icon: ClipboardCheck },
    { title: "Offboarding còn nhiệm vụ", count: cases.filter((item) => item.kind === "offboarding" && personIds.has(item.employeeId) && !item.completedAt).length, route: "offboarding", note: "Bàn giao, thu hồi và phối hợp khóa tài khoản", icon: UsersRound },
  ];
  const activeActions = actions.filter((item) => item.count > 0);
  const actionCount = activeActions.length;
  return <div className="page-stack hr-core"><WorkspaceHeader title="Trung tâm điều hành HR" />
    <nav className="hr-core-tabs" aria-label="Chế độ xem điều hành">{([ ["actions", `Cần xử lý (${actionCount})`], ["metrics", "Chỉ số"], ["activity", "Hoạt động"] ] as const).map(([id, label]) => <button key={id} type="button" className={view === id ? "active" : ""} aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}</nav>
{view === "actions" && <section className="panel hr-focus-panel"><div className="hr-core-heading"><div><span className="eyebrow">HR ACTION CENTER</span><h2>Công việc cần xử lý</h2></div><strong>{actionCount} nhóm việc</strong></div><div className="hr-action-list">{activeActions.map((item) => { const Icon = item.icon; return <button key={item.title} onClick={() => onNavigate(item.route)}><span className="hr-action-icon"><Icon size={18} /></span><span><strong>{item.title}</strong><small>{item.note}</small></span><b>{item.count}</b><ArrowRight size={15} /></button>; })}{!activeActions.length && <p className="hr-muted">Không có việc cần xử lý trong phạm vi hiện tại.</p>}</div></section>}
    {view === "metrics" && <><p className="hr-focus-note">Chỉ số từ dữ liệu demo nhân sự, công, đơn và hợp đồng; chưa đồng bộ backend hoặc MISA.</p><section className="hr-command-metrics" aria-label="Chỉ số điều hành">{metrics.map(([label, value, route]) => <button key={label} className="panel" onClick={() => onNavigate(route)}><span>{label}</span><strong>{value}</strong><small>Xem danh sách <ArrowRight size={12} /></small></button>)}</section></>}
    {view === "activity" && <section className="panel hr-focus-panel"><div className="hr-core-heading"><div><span className="eyebrow">ACTIVITY</span><h2>Hoạt động gần đây</h2></div></div><div className="hr-activity-filters"><select aria-label="Lọc thời gian" value={period} onChange={(event) => setPeriod(event.target.value)}><option value="7">7 ngày</option><option value="30">30 ngày</option><option value="all">Toàn bộ</option></select><select aria-label="Lọc chi nhánh" value={branch} onChange={(event) => setBranch(event.target.value)}><option value="">Mọi chi nhánh</option>{[...new Set(people.map((item) => item.branch))].map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Lọc phòng ban" value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">Mọi phòng ban</option>{[...new Set(people.map((item) => item.department))].map((item) => <option key={item}>{item}</option>)}</select></div><div className="hr-activity-list">{filteredActivities.map((item) => <div key={item.id}><i /><span><strong>{item.text}</strong><small>{item.actor} · {new Date(item.at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</small></span></div>)}{!filteredActivities.length && <p>Không có hoạt động phù hợp bộ lọc.</p>}</div></section>}
  </div>;
}
