"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, FileText } from "lucide-react";
import { useHrDemo } from "@/features/hr/hr-demo-context";
import { useLeaveDemo } from "@/features/leave/leave-demo-context";
import { useSession } from "@/features/session/session-context";
import { useDemoData } from "@/features/demo/demo-data-context";
import { useWfhDemo } from "@/features/wfh/wfh-demo-context";
import { personaEmployeeIds } from "@/lib/authorization/demo-identity";
import { EmptyState, StatusPill, WorkspaceHeader } from "./workspace-frame";

type Notice = { id: string; category: string; title: string; message: string; route: string; at: string; tone: string };
const readKey = (persona: string) => `ohriise-notification-read-v1-${persona}`;

export function NotificationsWorkspace({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { session, can } = useSession();
  const { store } = useLeaveDemo();
  const { requests } = useDemoData();
  const { store: wfhStore } = useWfhDemo();
  const { cases, assets, contracts, employees, attendance, attendanceExplanations } = useHrDemo();
  const [readIds, setReadIds] = useState<string[]>([]);
  const [tab, setTab] = useState("Tất cả");
  const selfId = personaEmployeeIds[session.id];
  useEffect(() => {
    let restored: string[] = [];
    try { const saved = JSON.parse(window.localStorage.getItem(readKey(session.id)) ?? "[]"); if (Array.isArray(saved)) restored = saved; } catch { /* Keep empty receipt list. */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Read receipts are browser-only.
    setReadIds(restored);
    const sync = (event: StorageEvent) => { if (event.key !== readKey(session.id)) return; try { const saved = JSON.parse(event.newValue ?? "[]"); setReadIds(Array.isArray(saved) ? saved : []); } catch { setReadIds([]); } };
    window.addEventListener("storage", sync); return () => window.removeEventListener("storage", sync);
  }, [session.id]);
  const notices: Notice[] = [];
  for (const request of store.requests) {
    const person = employees.find((item) => item.id === request.employeeId);
    if (selfId === request.employeeId) notices.push({ id: `leave-owner-${request.id}-${request.status}`, category: "Nghỉ phép", title: `Đơn ${request.id} · ${request.status === "approved" ? "Đã duyệt" : request.status === "rejected" ? "Từ chối" : request.status === "cancelled" ? "Đã hủy" : "Đang xử lý"}`, message: `${request.from} – ${request.to} · ${request.days} ngày.`, route: "leave", at: request.events.at(-1)?.at ?? request.submittedAt, tone: "blue" });
    if (selfId === request.managerId && request.status === "manager-pending") notices.push({ id: `leave-manager-${request.id}`, category: "Cần xử lý", title: `Duyệt đơn nghỉ của ${person?.name ?? request.employeeId}`, message: `${request.from} – ${request.to} · ${request.days} ngày.`, route: "approvals/leave", at: request.submittedAt, tone: "amber" });
    if (selfId === request.hrReviewerId && (request.status === "hr-pending" || request.status === "cancellation-pending")) notices.push({ id: `leave-hr-${request.id}-${request.status}`, category: "Cần xử lý", title: `${request.status === "cancellation-pending" ? "Xử lý hủy" : "Duyệt cấp cuối"} · ${person?.name ?? request.employeeId}`, message: `Đơn ${request.id} · ${request.days} ngày.`, route: "hr-leave", at: request.events.at(-1)?.at ?? request.submittedAt, tone: "amber" });
  }
  for (const asset of assets.filter((item) => item.holderId === selfId && item.status === "awaiting_receipt")) notices.push({ id: `asset-receipt-${asset.id}-${asset.version ?? 1}`, category: "Tài sản", title: `Xác nhận nhận ${asset.name}`, message: `${asset.id} · chờ bạn xác nhận bàn giao.`, route: "profile", at: `${asset.assignedAt ?? "2026-10-20"}T09:00:00+07:00`, tone: "blue" });
  for (const item of requests.filter((entry) => entry.type === "WFH")) {
    const person = employees.find((entry) => entry.id === item.employeeId);
    const wfhSession = wfhStore.sessions.find((entry) => entry.requestId === item.id);
    if (person && item.approverId === selfId && item.status === "pending") notices.push({ id: `wfh-approval-${item.id}`, category: "Cần xử lý", title: `Duyệt kế hoạch WFH của ${person.name}`, message: `${item.id} · ${item.date}.`, route: "approvals", at: `${item.date}T09:00:00+07:00`, tone: "amber" });
    if (item.employeeId === selfId && item.status === "approved" && !wfhSession?.reportSubmittedAt) notices.push({ id: `wfh-report-${item.id}-${wfhSession?.checkOutAt ? "ended" : "open"}`, category: "WFH", title: wfhSession?.checkOutAt ? "Nộp báo cáo WFH" : "Theo dõi phiên WFH", message: `${item.id} · ${item.date}. Đơn đã duyệt chưa tự tính công.`, route: `ai-wfh/${item.id}`, at: `${item.date}T09:00:00+07:00`, tone: "blue" });
  }
  for (const item of requests.filter((entry) => entry.type === "Đăng ký OT" || entry.type === "Điều chỉnh chấm công")) {
    const label = item.type === "Đăng ký OT" ? "OT" : "Điều chỉnh công";
    if (item.approverId === selfId && item.status === "pending") notices.push({ id: `time-approval-${item.id}`, category: "Cần xử lý", title: `Duyệt ${label} của ${item.employee}`, message: `${item.date} · ${item.id}.`, route: "approvals", at: `${item.date}T09:00:00+07:00`, tone: "amber" });
    if (item.employeeId === selfId && item.status !== "pending") notices.push({ id: `time-owner-${item.id}-${item.status}`, category: label, title: `${label}: ${item.status === "hr-review" ? "Chờ HR đối soát" : item.status === "approved" ? "Đã duyệt" : "Từ chối"}`, message: `${item.date} · ${item.id}.`, route: "approvals", at: `${item.date}T09:00:00+07:00`, tone: "blue" });
    if (item.type === "Điều chỉnh chấm công" && item.status === "hr-review" && can("attendance-monitoring", "edit")) notices.push({ id: `time-hr-${item.id}`, category: "Cần xử lý", title: `Đối soát công của ${item.employee}`, message: `${item.date} · ${item.id}.`, route: `attendance-monitoring/exceptions/${item.date.slice(0, 7)}/all/${item.attendanceId}`, at: `${item.date}T09:00:00+07:00`, tone: "amber" });
  }
  for (const row of attendance.filter((item) => item.issue !== "none")) {
    const explanation = attendanceExplanations.find((item) => item.attendanceId === row.id && item.attendanceVersion === (row.version ?? 1));
    if (selfId === row.employeeId && row.resolution === "explanation") notices.push({ id: `attendance-explanation-${row.id}-${row.version ?? 1}-${explanation?.status ?? "requested"}`, category: "Công", title: explanation ? explanation.status === "submitted" ? "Giải trình đang chờ quản lý" : "Quản lý đã xử lý giải trình" : "HR yêu cầu giải trình công", message: `${row.date} · ${row.id}.`, route: `attendance/${row.id}`, at: explanation?.reviewedAt ?? explanation?.submittedAt ?? `${row.date}T09:00:00+07:00`, tone: "amber" });
    if (selfId && explanation?.managerId === selfId && explanation.status === "submitted") notices.push({ id: `attendance-manager-${explanation.id}`, category: "Cần xử lý", title: `Xác nhận giải trình công của ${employees.find((person) => person.id === row.employeeId)?.name ?? row.employeeId}`, message: `${row.date} · ${row.id}.`, route: "team", at: explanation.submittedAt, tone: "amber" });
  }
  for (const item of cases.filter((entry) => entry.kind === "offboarding" && !entry.completedAt && !entry.cancelledAt)) {
    if (item.employeeId === selfId) notices.push({ id: `offboarding-self-${item.id}`, category: "Vòng đời", title: "Theo dõi bàn giao nghỉ việc", message: `Hồ sơ ${item.id} · ${item.tasks.filter((task) => !task.doneAt).length} nhiệm vụ còn mở.`, route: "offboarding-status", at: `${item.startedAt}T09:00:00+07:00`, tone: "amber" });
    if (session.id === "system-admin") notices.push({ id: `offboarding-admin-${item.id}-${item.tasks.filter((task) => task.doneAt).length}`, category: "Tác vụ tài khoản", title: `Kiểm tra offboarding ${item.id}`, message: `Ngày cuối ${item.lastWorkingDay ?? "chưa xác định"}; xử lý sau khi đủ điều kiện.`, route: "access/account-tasks/offboarding", at: `${item.startedAt}T09:00:00+07:00`, tone: "amber" });
  }
  if (session.id === "system-admin") for (const item of cases.filter((entry) => entry.kind === "onboarding" && !entry.completedAt && !entry.cancelledAt && entry.tasks.some((task) => task.id === "account" && !task.doneAt))) notices.push({ id: `onboarding-admin-${item.id}`, category: "Tác vụ tài khoản", title: `Cấp tài khoản cho ${employees.find((person) => person.id === item.employeeId)?.name ?? item.employeeId}`, message: `${item.id} · tạo hoặc kích hoạt tài khoản đúng nhân sự.`, route: "access/account-tasks/onboarding", at: `${item.startedAt}T09:00:00+07:00`, tone: "amber" });
  for (const item of contracts.filter((entry) => entry.employeeId === selfId && entry.document !== "verified")) notices.push({ id: `contract-self-${item.id}-${item.document}`, category: "Hợp đồng", title: `Hợp đồng ${item.id} cần hoàn thiện`, message: item.document === "missing" ? "HR chưa ghi nhận bản ký giấy." : "Bản ký giấy đang chờ HR xác minh.", route: "contracts", at: `${item.startsAt}T09:00:00+07:00`, tone: "blue" });
  notices.sort((a, b) => b.at.localeCompare(a.at));
  const visible = tab === "Chưa đọc" ? notices.filter((item) => !readIds.includes(item.id)) : notices;
  const unread = notices.filter((item) => !readIds.includes(item.id)).length;
  const mark = (ids: string[]) => { const next = [...new Set([...readIds, ...ids])]; setReadIds(next); window.localStorage.setItem(readKey(session.id), JSON.stringify(next)); };
  return <div className="page-stack"><WorkspaceHeader eyebrow="THÔNG BÁO TRONG ỨNG DỤNG" title="Thông báo" description="Chỉ hiện công việc và trạng thái liên quan persona demo hiện tại." action={<button className="secondary-button" disabled={!unread} onClick={() => mark(notices.map((item) => item.id))}><CheckCheck size={15} /> Đánh dấu đã đọc</button>} /><section className="notifications-layout"><article className="panel notifications-main"><div className="notification-tabs">{["Tất cả", "Chưa đọc"].map((item) => <button className={tab === item ? "is-active" : ""} onClick={() => setTab(item)} key={item}>{item}{item === "Chưa đọc" && <b>{unread}</b>}</button>)}</div>{visible.length ? <div className="notification-list">{visible.map((item) => <button key={item.id} className={!readIds.includes(item.id) ? "unread" : ""} onClick={() => { mark([item.id]); onNavigate(item.route); }}><span className={`notification-icon ${item.tone}`}><FileText size={16} /></span><div><span>{item.category}</span><strong>{item.title}</strong><p>{item.message}</p></div><time>{new Date(item.at).toLocaleDateString("vi-VN")}</time>{!readIds.includes(item.id) && <i />}</button>)}</div> : <EmptyState title="Không có thông báo phù hợp" description="Khi có công việc liên quan, thông báo sẽ xuất hiện tại đây." />}</article><aside className="panel notification-settings"><div className="panel-heading compact"><div><span className="eyebrow">KÊNH NHẬN</span><h3>Phạm vi demo</h3></div><Bell size={18} /></div><p>Trạng thái đọc lưu trong trình duyệt và đồng bộ giữa các tab cùng origin.</p><StatusPill tone="neutral">In-app cục bộ</StatusPill><p>Email và push chưa cấu hình; hệ thống không gửi tin ra ngoài.</p></aside></section></div>;
}
