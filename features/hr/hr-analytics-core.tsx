"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Download, TrendingUp } from "lucide-react";
import { WorkspaceHeader } from "@/features/employee/workspace-frame";
import { useSession } from "@/features/session/session-context";
import { canAccessScopedRecord } from "@/lib/authorization/engine";
import { useHrDemo } from "./hr-demo-context";

function downloadCsv(rows: string[][]) {
  const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "oHRiise-people-analytics-demo.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

type AnalyticsView = "metrics" | "composition" | "trends";

export function HrAnalyticsWorkspace({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { employees, attendance, contracts, cases } = useHrDemo();
  const { session, can } = useSession();
  const [period, setPeriod] = useState("2026-10");
  const [branch, setBranch] = useState("");
  const [department, setDepartment] = useState("");
  const [view, setView] = useState<AnalyticsView>("metrics");
  const scoped = employees.filter((person) => canAccessScopedRecord(session, { employeeId: person.id, branch: person.branch, department: person.department }));
  const people = useMemo(() => scoped.filter((person) => (!branch || person.branch === branch) && (!department || person.department === department)), [scoped, branch, department]);
  const ids = new Set(people.map((person) => person.id));
  const rows = attendance.filter((item) => ids.has(item.employeeId) && item.date.startsWith(period));
  const previous = period === "2026-10" ? "2026-09" : "2026-08";
  const previousRows = attendance.filter((item) => ids.has(item.employeeId) && item.date.startsWith(previous));
  const active = people.filter((person) => person.status !== "inactive");
  const hires = people.filter((person) => person.startDate.startsWith(period));
  const exits = cases.filter((item) => item.kind === "offboarding" && item.completedAt?.startsWith(period) && ids.has(item.employeeId));
  const late = rows.filter((item) => item.issue === "late");
  const absent = rows.filter((item) => item.issue === "missing-in");
  const previousLate = previousRows.filter((item) => item.issue === "late");
  const expiring = contracts.filter((item) => ids.has(item.employeeId) && item.status === "active" && item.endsAt && item.endsAt >= "2026-10-20" && item.endsAt <= "2026-11-20");
  const byDepartment = [...new Set(people.map((person) => person.department))].map((name) => ({ name, count: active.filter((person) => person.department === name).length })).sort((a, b) => b.count - a.count);
  const byType = [...new Set(contracts.filter((item) => ids.has(item.employeeId) && item.status === "active").map((item) => item.type))].map((name) => ({ name, count: contracts.filter((item) => ids.has(item.employeeId) && item.status === "active" && item.type === name).length }));
  const progress = cases.filter((item) => ids.has(item.employeeId));
  const exportRows = [["Chỉ số", "Kỳ", "Giá trị", "Phạm vi"], ...[["Nhân sự hiện tại", active.length], ["Tuyển mới", hires.length], ["Thôi việc hoàn tất", exits.length], ["Đi trễ", late.length], ["Thiếu check-in", absent.length], ["Hợp đồng sắp hạn", expiring.length]].map(([name, value]) => [String(name), period, String(value), `${branch || "Toàn công ty"} / ${department || "Mọi phòng ban"}`])];
  const metrics = [
    ["Nhân sự hiện tại", active.length, "employees"], ["Tuyển mới trong kỳ", hires.length, "employees"],
    ["Thôi việc hoàn tất", exits.length, "offboarding"], ["Tỷ lệ nghỉ việc", active.length + exits.length ? `${(exits.length / (active.length + exits.length) * 100).toFixed(1)}%` : "0%", "offboarding"],
    ["Đi trễ", late.length, "attendance-monitoring/late"], ["Thiếu check-in", absent.length, "attendance-monitoring/missing-in"],
    ["Hợp đồng sắp hạn", expiring.length, "hr-contracts/expiring"], ["Onboarding đang làm", progress.filter((item) => item.kind === "onboarding" && !item.completedAt).length, "onboarding"],
  ];

  return <div className="page-stack hr-core">
    <WorkspaceHeader title="People analytics" action={can("reports", "export") ? <button className="secondary-button" onClick={() => downloadCsv(exportRows)}><Download size={14} /> Xuất CSV</button> : undefined} />
    <section className="panel hr-analytics-filters">
      <label>Kỳ phân tích<select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="2026-10">Tháng 10/2026</option><option value="2026-09">Tháng 09/2026</option></select></label>
      <label>Chi nhánh<select value={branch} onChange={(event) => setBranch(event.target.value)} disabled={session.effectiveScope === "branch"}><option value="">{session.effectiveScope === "branch" ? session.branch : "Mọi chi nhánh"}</option>{[...new Set(scoped.map((person) => person.branch))].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Phòng ban<select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">Mọi phòng ban</option>{[...new Set(scoped.map((person) => person.department))].map((item) => <option key={item}>{item}</option>)}</select></label>
    </section>
    <nav className="hr-core-tabs" aria-label="Chế độ xem phân tích">{([ ["metrics", "Chỉ số"], ["composition", "Cơ cấu"], ["trends", "Xu hướng"] ] as const).map(([id, label]) => <button key={id} type="button" className={view === id ? "active" : ""} aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}</nav>
    {view === "metrics" && <><p className="hr-focus-note">Số liệu demo trong trình duyệt, không phải báo cáo nhân sự thực.</p><section className="hr-analytics-metrics">{metrics.map(([name, value, route]) => <button className="panel" key={name} onClick={() => onNavigate(String(route))}><span>{name}</span><strong>{value}</strong><small>Drill-down <ArrowRight size={12} /></small></button>)}</section></>}
    {view === "composition" && <article className="panel hr-focus-panel"><div className="hr-core-heading"><div><span className="eyebrow">CƠ CẤU</span><h2>Nhân sự theo phòng ban</h2></div></div><div className="hr-analytics-bars">{byDepartment.map((item) => <button key={item.name} onClick={() => setDepartment(item.name)}><span>{item.name}</span><i><b style={{ width: `${item.count / Math.max(active.length, 1) * 100}%` }} /></i><strong>{item.count}</strong></button>)}</div><h2>Hợp đồng đang hiệu lực theo loại</h2><div className="hr-check-list">{byType.map((item) => <div key={item.name}><span>{item.name}</span><strong>{item.count}</strong></div>)}</div></article>}
    {view === "trends" && <article className="panel hr-focus-panel"><div className="hr-core-heading"><div><span className="eyebrow">SO SÁNH KỲ</span><h2>Xu hướng công và vòng đời</h2></div><TrendingUp size={18} /></div><div className="hr-check-list"><div><span>Đi trễ · {period}</span><strong>{late.length}</strong></div><div><span>Đi trễ · {previous}</span><strong>{previousLate.length}</strong></div><div><span>Thiếu check-in · {period}</span><strong>{absent.length}</strong></div><div><span>Ngày có log công · {period}</span><strong>{new Set(rows.map((item) => item.date)).size}</strong></div><div><span>Onboarding đang làm</span><strong>{progress.filter((item) => item.kind === "onboarding" && !item.completedAt).length}</strong></div><div><span>Offboarding đang làm</span><strong>{progress.filter((item) => item.kind === "offboarding" && !item.completedAt).length}</strong></div></div><p className="hr-muted">Kỳ 08/2026 không có log công mẫu. Không ngoại suy số liệu demo thành tỷ lệ doanh nghiệp thực.</p></article>}
  </div>;
}
