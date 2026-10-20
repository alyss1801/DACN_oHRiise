"use client";

import { useState } from "react";
import { Activity, AlertTriangle, ArrowRight, CalendarClock, ClipboardCheck, FileWarning, UsersRound } from "lucide-react";
import { useDemoData } from "@/features/demo/demo-data-context";
import { useSession } from "@/features/session/session-context";
import { canAccessScopedRecord } from "@/lib/authorization/engine";
import { WorkspaceHeader } from "@/features/employee/workspace-frame";
import { useHrDemo } from "./hr-demo-context";
import { hrDate } from "./hr-demo-data";

const day = "2026-10-20";
const isPending = (status: string) => status === "pending" || status === "hr-review";

export function HrCommandWorkspace({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { session } = useSession();
  const { requests } = useDemoData();
  const { employees, attendance, contracts, periods, exports, activities, cases } = useHrDemo();
  const people = employees.filter((person) => canAccessScopedRecord(session, { employeeId: person.id, branch: person.branch, department: person.department }));
  const personIds = new Set(people.map((person) => person.id));
  const rows = attendance.filter((item) => item.date === day && personIds.has(item.employeeId));
  const leaveToday = people.filter((person) => requests.some((request) => request.type === "Nghỉ phép" && request.employee === person.name && request.date === "20/10/2026" && request.status === "approved")).length;
  const pendingRequests = requests.filter((item) => isPending(item.status) && people.some((person) => person.name === item.employee));
  const expiring = contracts.filter((item) => personIds.has(item.employeeId) && item.status === "active" && item.endsAt >= day && item.endsAt <= "2026-11-20");
  const issues = rows.filter((item) => item.issue !== "none" && (item.resolution === "open" || item.resolution === "explanation"));
  const [branch, setBranch] = useState(""); const [department, setDepartment] = useState(""); const [period, setPeriod] = useState("7");
  const filteredActivities = activities.filter((item) => (item.employeeId ? personIds.has(item.employeeId) : session.effectiveScope === "company") && (!branch || item.branch === branch) && (!department || item.department === department) && (period === "all" || new Date(item.at).getTime() >= new Date("2026-10-20T23:59:59+07:00").getTime() - Number(period) * 86400000));
  const metrics = [
    ["Nhân sự trong phạm vi", people.length, "employees"], ["Đang làm việc", people.filter((item) => item.status === "active").length, "employees/active"], ["Thử việc", people.filter((item) => item.status === "probation").length, "employees/probation"],
    ["Đã check-in", rows.filter((item) => item.events.some((event) => event.kind === "check-in")).length, "attendance-monitoring/checked-in"], ["Chưa check-in", rows.filter((item) => !item.events.some((event) => event.kind === "check-in")).length, "attendance-monitoring/missing-in"], ["Đi trễ", rows.filter((item) => item.issue === "late").length, "attendance-monitoring/late"],
    ["Nghỉ có phép", leaveToday, "hr-leave/calendar"], ["Bất thường cần xử lý", issues.length, "attendance-monitoring/exceptions"], ["Yêu cầu chờ xử lý", pendingRequests.length, "hr-leave/pending"], ["Hợp đồng sắp hết hạn", expiring.length, "hr-contracts/expiring"],
  ] as const;
  const actions = [
    { title: "Ngoại lệ công", count: issues.length, route: "attendance-monitoring/exceptions", note: "Kiểm tra sự kiện gốc và lý do điều chỉnh", icon: AlertTriangle },
    { title: "Đơn nghỉ chờ duyệt", count: pendingRequests.filter((item) => item.type === "Nghỉ phép").length, route: "hr-leave/pending", note: "Đối chiếu lịch và số dư phép", icon: CalendarClock },
    { title: "Hợp đồng sắp hạn", count: expiring.length, route: "hr-contracts/expiring", note: "Chuẩn bị hồ sơ gia hạn", icon: FileWarning },
    { title: "Kỳ công đang đối soát", count: periods.filter((item) => item.status === "reconciling").length, route: "timesheets/2026-10", note: "Giải quyết ngoại lệ trước khi chốt", icon: ClipboardCheck },
    { title: "Lỗi xuất MISA demo", count: exports.filter((item) => item.status === "partial-demo").reduce((sum, item) => sum + item.errors, 0), route: "misa-sync/errors", note: "Xem bản ghi thiếu mã hoặc sai mapping", icon: Activity },
    { title: "Onboarding còn nhiệm vụ", count: cases.filter((item) => item.kind === "onboarding" && personIds.has(item.employeeId) && !item.completedAt).length, route: "onboarding", note: "Hợp đồng, tài khoản và tài sản", icon: UsersRound },
    { title: "Offboarding còn nhiệm vụ", count: cases.filter((item) => item.kind === "offboarding" && personIds.has(item.employeeId) && !item.completedAt).length, route: "offboarding", note: "Bàn giao, thu hồi và phối hợp khóa tài khoản", icon: UsersRound },
  ];
  return <div className="page-stack hr-core"><WorkspaceHeader title="Trung tâm điều hành HR" subtitle={`Dữ liệu demo ngày ${hrDate(day)} · ${session.effectiveScope === "company" ? "Toàn công ty" : session.branch}`} />
    <div className="hr-demo-note"><strong>Demo Mode</strong><span>Chỉ số lấy từ cùng bộ dữ liệu nhân sự, công, đơn và hợp đồng. Chưa có backend hay đồng bộ MISA thực.</span></div>
    <section className="hr-command-metrics" aria-label="Chỉ số điều hành">{metrics.map(([label, value, route]) => <button key={label} className="panel" onClick={() => onNavigate(route)}><span>{label}</span><strong>{value}</strong><small>Xem danh sách <ArrowRight size={12} /></small></button>)}</section>
    <section className="hr-command-columns"><article className="panel"><div className="hr-core-heading"><div><span className="eyebrow">HR ACTION CENTER</span><h2>Công việc cần xử lý</h2></div><strong>{actions.reduce((sum, item) => sum + item.count, 0)} việc</strong></div><div className="hr-action-list">{actions.map((item) => { const Icon = item.icon; return <button key={item.title} onClick={() => onNavigate(item.route)}><span className="hr-action-icon"><Icon size={18} /></span><span><strong>{item.title}</strong><small>{item.note}</small></span><b>{item.count}</b><ArrowRight size={15} /></button>; })}</div></article>
    <article className="panel"><div className="hr-core-heading"><div><span className="eyebrow">ACTIVITY</span><h2>Hoạt động gần đây</h2></div></div><div className="hr-activity-filters"><select aria-label="Lọc thời gian" value={period} onChange={(event) => setPeriod(event.target.value)}><option value="7">7 ngày</option><option value="30">30 ngày</option><option value="all">Toàn bộ</option></select><select aria-label="Lọc chi nhánh" value={branch} onChange={(event) => setBranch(event.target.value)}><option value="">Mọi chi nhánh</option>{[...new Set(people.map((item) => item.branch))].map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Lọc phòng ban" value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">Mọi phòng ban</option>{[...new Set(people.map((item) => item.department))].map((item) => <option key={item}>{item}</option>)}</select></div><div className="hr-activity-list">{filteredActivities.map((item) => <div key={item.id}><i /><span><strong>{item.text}</strong><small>{item.actor} · {new Date(item.at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</small></span></div>)}{!filteredActivities.length && <p>Không có hoạt động phù hợp bộ lọc.</p>}</div></article></section>
  </div>;
}
