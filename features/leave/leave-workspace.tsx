"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { WorkspaceHeader, StatusPill } from "@/features/employee/workspace-frame";
import { useSession } from "@/features/session/session-context";
import { useHrDemo } from "@/features/hr/hr-demo-context";
import { useLeaveDemo } from "./leave-demo-context";
import { effectiveLeaveEntitlement, leaveBalance, leaveDays } from "./leave-model";
import type { LeavePortion, LeaveRequest, LeaveStatus, LeaveType } from "./leave-model";
import { personaEmployeeIds } from "@/lib/authorization/demo-identity";
import { demoBusinessDate } from "@/lib/demo-clock";
import { useDemoData } from "@/features/demo/demo-data-context";

const labels: Record<LeaveStatus, string> = {
  "manager-pending": "Chờ quản lý", "hr-pending": "Chờ HR", approved: "Đã duyệt", rejected: "Từ chối",
  withdrawn: "Đã rút", "cancellation-pending": "Chờ hủy", cancelled: "Đã hủy",
};
const formatDate = (value: string) => value ? new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T00:00:00`)) : "—";

export function LeaveWorkspace({ moduleId, onNavigate, hrView = false }: { moduleId: string; onNavigate: (id: string) => void; hrView?: boolean }) {
  const { session, can } = useSession();
  const { employees, leaveAdjustments, adjustLeave, activities, policies } = useHrDemo();
  const { store, submit, act } = useLeaveDemo();
  const { requests: otherRequests } = useDemoData();
  const selfId = personaEmployeeIds[session.id];
  const me = employees.find((item) => item.id === selfId);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [portion, setPortion] = useState<LeavePortion>("full");
  const [type, setType] = useState<LeaveType>("annual");
  const [reason, setReason] = useState("");
  const [handover, setHandover] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(hrView && moduleId.endsWith("/pending") ? "hr-action" : "");
  const [branch, setBranch] = useState("");
  const [department, setDepartment] = useState("");
  const [selectedId, setSelectedId] = useState(moduleId.split("/")[2] ?? "");
  const [note, setNote] = useState("");
  const [tab, setTab] = useState(moduleId.includes("calendar") ? "calendar" : moduleId.includes("balances") ? "balances" : "requests");
  const [newForm, setNewForm] = useState(moduleId.endsWith("/new"));
  const [month, setMonth] = useState(() => demoBusinessDate().slice(0, 7));
  const [adjustEmployeeId, setAdjustEmployeeId] = useState("");
  const [adjustDays, setAdjustDays] = useState(0);
  const [adjustReason, setAdjustReason] = useState("");
  const people = useMemo(() => new Map(employees.map((item) => [item.id, item])), [employees]);
  const scoped = store.requests.filter((item) => {
    const person = people.get(item.employeeId);
    if (!person) return false;
    if (hrView) return can("hr-leave") && (session.effectiveScope === "company" || (session.effectiveScope === "branch" && person.branch === session.branch));
    return item.employeeId === selfId || item.managerId === selfId;
  });
  const visible = scoped.filter((item) => {
    const person = people.get(item.employeeId);
    return (!query || `${item.id} ${person?.name ?? ""}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")))
      && (!status || (status === "hr-action" ? ["hr-pending", "cancellation-pending"].includes(item.status) : item.status === status)) && (!branch || person?.branch === branch) && (!department || person?.department === department);
  });
  const selected = scoped.find((item) => item.id === selectedId);
  const leavePolicy = effectiveLeaveEntitlement(policies, demoBusinessDate());
  const balance = selfId && leavePolicy ? leaveBalance(store, selfId, leaveAdjustments[selfId] ?? 0, leavePolicy.days, demoBusinessDate().slice(0, 4)) : null;
  const requestPolicy = effectiveLeaveEntitlement(policies, from);
  const requestBalance = selfId && requestPolicy ? leaveBalance(store, selfId, leaveAdjustments[selfId] ?? 0, requestPolicy.days, from.slice(0, 4)) : null;
  const days = leaveDays(from, to, portion);
  const title = hrView ? "Quản lý nghỉ phép" : "Nghỉ phép & phê duyệt";
  const submitRequest = () => {
    if (!me?.managerId || !selfId) { toast.error("Hồ sơ chưa có quản lý trực tiếp để định tuyến đơn."); return; }
    if (me.status === "inactive") { toast.error("Nhân sự đã nghỉ không thể gửi đơn mới."); return; }
    if (otherRequests.some((item) => item.type === "WFH" && (item.employeeId === selfId || item.employee === me.name) && !["rejected"].includes(item.status) && item.date >= from && item.date <= (to || from))) { toast.error("Khoảng ngày này đã có đơn WFH đang hiệu lực hoặc chờ duyệt."); return; }
    const result = submit({ employeeId: selfId, managerId: me.managerId, hrReviewerId: "OH-0091", type, from, to: to || from, portion, reason, handover, adjustment: leaveAdjustments[selfId] ?? 0 });
    if (!result.ok) { toast.error(result.error); return; }
    setNewForm(false); setSelectedId(result.request.id); setTab("requests"); setReason(""); setHandover("");
    toast.success("Đã gửi đơn đến quản lý trực tiếp. Dữ liệu chỉ lưu trong trình duyệt demo.");
  };
  const decide = (item: LeaveRequest, action: Parameters<typeof act>[2]) => {
    if (!selfId) return;
    const result = act(item.id, selfId, action, note);
    if (!result.ok) { toast.error(result.error); return; }
    setNote(""); toast.success(`Đã cập nhật đơn ${item.id} trong dữ liệu demo.`);
  };
  const actionFor = (item: LeaveRequest) => {
    if (item.employeeId === selfId) return item.status === "manager-pending" || item.status === "hr-pending" ? "withdraw" : item.status === "approved" ? "request-cancellation" : null;
    if (item.managerId === selfId && item.status === "manager-pending" && can("approvals", "approve")) return "manager";
    if (item.hrReviewerId === selfId && can("hr-leave", "approve")) return item.status === "hr-pending" ? "hr" : item.status === "cancellation-pending" ? "cancellation" : null;
    return null;
  };

  return <div className="page-stack hr-core leave-workspace">
    <WorkspaceHeader title={title} action={!hrView && me?.managerId && <button className="primary-button" onClick={() => { setNewForm(true); setSelectedId(""); }}><Plus size={15} /> Tạo đơn</button>} />
    {!hrView && balance && <div className="leave-summary"><span>Phép năm <strong>{balance.entitlement + balance.adjustment}</strong></span><span>Đã dùng <strong>{balance.used}</strong></span><span>Đang giữ <strong>{balance.reserved}</strong></span><span>Khả dụng <strong>{balance.available}</strong></span></div>}
    {newForm && !hrView ? <section className="panel leave-form"><div className="hr-core-heading"><div><span className="eyebrow">ĐƠN NGHỈ MỚI</span><h2>Đăng ký nghỉ phép</h2></div><button className="secondary-button" onClick={() => setNewForm(false)}>Đóng</button></div><div className="leave-form-grid">
      <label>Loại nghỉ<select value={type} onChange={(event) => setType(event.target.value as LeaveType)}><option value="annual">Phép năm</option><option value="unpaid">Không lương</option></select></label>
      <label>Từ ngày<input type="date" value={from} onChange={(event) => { setFrom(event.target.value); if (!to || to < event.target.value) setTo(event.target.value); }} /></label>
      <label>Đến ngày<input type="date" min={from} value={to} onChange={(event) => setTo(event.target.value)} disabled={portion !== "full"} /></label>
      <label>Thời lượng<select value={portion} onChange={(event) => { const next = event.target.value as LeavePortion; setPortion(next); if (next !== "full") setTo(from); }}><option value="full">Cả ngày</option><option value="morning">Buổi sáng</option><option value="afternoon">Buổi chiều</option></select></label>
      <label>Người bàn giao<input value={handover} onChange={(event) => setHandover(event.target.value)} placeholder="Tên người nhận việc" /></label>
      <label>Quản lý duyệt<input readOnly value={people.get(me?.managerId ?? "")?.name ?? "Chưa có quản lý"} /></label>
    </div><label>Lý do nghỉ<textarea rows={2} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Nêu lý do để người duyệt xem xét (ít nhất 8 ký tự)" /></label><div className="leave-form-footer"><span>{days} ngày làm việc · {type === "annual" ? `chính sách v${requestPolicy?.version ?? "?"} · dự kiến còn ${requestBalance ? requestBalance.available - days : 0} ngày phép` : "không trừ phép năm"}</span><button className="primary-button" disabled={!days || !requestPolicy || (type === "annual" && !!requestBalance && days > requestBalance.available)} onClick={submitRequest}>Gửi đơn</button></div></section> : null}
    <nav className="hr-core-tabs" aria-label="Chế độ xem nghỉ phép"><button className={tab === "requests" ? "active" : ""} onClick={() => setTab("requests")}>Đơn nghỉ ({scoped.length})</button>{hrView && <><button className={tab === "calendar" ? "active" : ""} onClick={() => setTab("calendar")}>Lịch đã duyệt</button><button className={tab === "balances" ? "active" : ""} onClick={() => setTab("balances")}>Số dư</button><button className={tab === "adjustments" ? "active" : ""} onClick={() => setTab("adjustments")}>Điều chỉnh phép</button></>}</nav>
{tab === "requests" && <section className="panel hr-directory"><div className="hr-directory-tools"><label className="compact-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mã đơn hoặc nhân viên" aria-label="Tìm đơn nghỉ" /></label><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Lọc trạng thái"><option value="">Mọi trạng thái</option>{hrView && <option value="hr-action">Chờ HR xử lý</option>}{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>{hrView && <><select value={branch} onChange={(event) => setBranch(event.target.value)} aria-label="Lọc chi nhánh"><option value="">Mọi chi nhánh</option>{[...new Set(employees.map((item) => item.branch))].map((item) => <option key={item}>{item}</option>)}</select><select value={department} onChange={(event) => setDepartment(event.target.value)} aria-label="Lọc phòng ban"><option value="">Mọi phòng ban</option>{[...new Set(employees.map((item) => item.department))].map((item) => <option key={item}>{item}</option>)}</select></>}</div><div className="table-scroll"><table className="data-table"><thead><tr><th>Mã đơn</th><th>Nhân viên</th><th>Loại</th><th>Ngày nghỉ</th><th>Số ngày</th><th>Bước hiện tại</th><th>Trạng thái</th><th /></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td className="mono">{item.id}</td><td><strong>{people.get(item.employeeId)?.name}</strong><small>{people.get(item.employeeId)?.department}</small></td><td>{item.type === "annual" ? "Phép năm" : "Không lương"}</td><td>{formatDate(item.from)}{item.to !== item.from && ` – ${formatDate(item.to)}`}</td><td>{item.days}</td><td>{item.status === "manager-pending" ? people.get(item.managerId)?.name : item.status === "hr-pending" || item.status === "cancellation-pending" ? people.get(item.hrReviewerId)?.name : "—"}</td><td><StatusPill tone={item.status === "approved" ? "success" : item.status === "rejected" || item.status === "cancelled" ? "neutral" : "warning"}>{labels[item.status]}</StatusPill></td><td><button className="row-action" onClick={() => setSelectedId(item.id)}>Chi tiết</button></td></tr>)}</tbody></table></div>{!visible.length && <p className="hr-empty">Không có đơn phù hợp. {hrView ? "Chờ nhân viên gửi đơn từ màn cá nhân." : "Có thể tạo đơn mới ở phía trên."}</p>}</section>}
    {tab === "calendar" && <section className="panel hr-leave-calendar"><div className="hr-core-heading"><h2>Lịch nghỉ đã duyệt</h2><label>Tháng <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label></div><div className="hr-calendar-grid">{Array.from({ length: new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate() }, (_, index) => { const date = `${month}-${String(index + 1).padStart(2, "0")}`; return <div key={date}><strong>{index + 1}</strong>{scoped.filter((item) => item.status === "approved" && item.from <= date && item.to >= date).map((item) => <button key={item.id} onClick={() => { setSelectedId(item.id); setTab("requests"); }}>{people.get(item.employeeId)?.name}</button>)}</div>; })}</div></section>}
    {tab === "balances" && <section className="panel hr-directory"><div className="table-scroll"><table className="data-table"><thead><tr><th>Nhân viên</th><th>Chi nhánh</th><th>Được cấp</th><th>Điều chỉnh</th><th>Đã dùng</th><th>Đang giữ</th><th>Khả dụng</th></tr></thead><tbody>{employees.filter((item) => session.effectiveScope === "company" || item.branch === session.branch).map((item) => { const row = leaveBalance(store, item.id, leaveAdjustments[item.id] ?? 0, leavePolicy?.days ?? 0, demoBusinessDate().slice(0, 4)); return <tr key={item.id}><td>{item.name}<small>{item.id}</small></td><td>{item.branch}</td><td>{row.entitlement}</td><td>{row.adjustment}</td><td>{row.used}</td><td>{row.reserved}</td><td><strong>{row.available}</strong></td></tr>; })}</tbody></table></div></section>}
    {tab === "adjustments" && hrView && <section className="hr-leave-detail"><article className="panel leave-form"><div className="hr-core-heading"><h2>Điều chỉnh số dư phép</h2></div><label>Nhân viên<select value={adjustEmployeeId} onChange={(event) => setAdjustEmployeeId(event.target.value)}><option value="">Chọn nhân viên</option>{employees.filter((item) => session.effectiveScope === "company" || item.branch === session.branch).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.id}</option>)}</select></label><label>Số ngày (+ cấp bổ sung / − thu hồi)<input type="number" min={-12} max={12} step={0.5} value={adjustDays} onChange={(event) => setAdjustDays(Number(event.target.value))} /></label><label>Lý do<textarea rows={3} value={adjustReason} onChange={(event) => setAdjustReason(event.target.value)} placeholder="Căn cứ điều chỉnh, ít nhất 8 ký tự" /></label><button className="primary-button" disabled={!can("hr-leave", "edit") || !adjustEmployeeId || !adjustDays || adjustReason.trim().length < 8 || leaveBalance(store, adjustEmployeeId, leaveAdjustments[adjustEmployeeId] ?? 0, leavePolicy?.days ?? 0, demoBusinessDate().slice(0, 4)).available + adjustDays < 0} onClick={() => { adjustLeave(adjustEmployeeId, adjustDays, adjustReason); setAdjustDays(0); setAdjustReason(""); toast.success("Đã điều chỉnh số dư phép demo."); }}>Lưu điều chỉnh</button></article><aside className="panel"><span className="eyebrow">AUDIT TRAIL</span><h2>Lịch sử điều chỉnh</h2><div className="hr-activity-list">{activities.filter((item) => item.text.startsWith("Điều chỉnh") && (session.effectiveScope === "company" || item.branch === session.branch)).map((item) => <div key={item.id}><i /><span><strong>{item.text}</strong><small>{new Date(item.at).toLocaleString("vi-VN")}</small></span></div>)}</div></aside></section>}
    {tab === "requests" && selected && <section className="panel leave-detail"><div className="hr-core-heading"><div><span className="eyebrow">{selected.id}</span><h2>{people.get(selected.employeeId)?.name} · {labels[selected.status]}</h2></div><button className="secondary-button" onClick={() => setSelectedId("")}><ArrowLeft size={14} /> Đóng chi tiết</button></div><div className="leave-detail-grid"><p><strong>Thời gian</strong><br />{formatDate(selected.from)} – {formatDate(selected.to)} · {selected.days} ngày {selected.portion !== "full" ? selected.portion === "morning" ? "(sáng)" : "(chiều)" : ""}</p><p><strong>Loại & bàn giao</strong><br />{selected.type === "annual" ? "Phép năm" : "Không lương"} · {selected.handover}</p><p><strong>Lý do</strong><br />{selected.reason}</p><p><strong>Tuyến duyệt snapshot</strong><br />{people.get(selected.managerId)?.name} → {people.get(selected.hrReviewerId)?.name}</p></div><div className="hr-activity-list">{selected.events.map((event, index) => <div key={`${event.at}-${index}`}><i /><span><strong>{event.action}</strong><small>{people.get(event.actorId)?.name ?? event.actorId} · {new Date(event.at).toLocaleString("vi-VN")} · {event.note}</small></span></div>)}</div>{actionFor(selected) && <div className="leave-actions"><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ghi chú quyết định / lý do hủy" aria-label="Ghi chú xử lý đơn" />{actionFor(selected) === "manager" || actionFor(selected) === "hr" ? <><button className="secondary-button" onClick={() => decide(selected, "reject")}>Từ chối</button><button className="primary-button" onClick={() => decide(selected, "approve")}>Duyệt bước này</button></> : actionFor(selected) === "cancellation" ? <><button className="secondary-button" onClick={() => decide(selected, "reject-cancellation")}>Giữ đơn</button><button className="primary-button" onClick={() => decide(selected, "approve-cancellation")}>Chấp nhận hủy</button></> : <button className="secondary-button" onClick={() => decide(selected, actionFor(selected) as "withdraw" | "request-cancellation")}>{actionFor(selected) === "withdraw" ? "Rút đơn" : "Yêu cầu hủy"}</button>}</div>}</section>}
    {!hrView && <p className="leave-disclaimer">Dữ liệu nghỉ phép chỉ lưu trên trình duyệt để mô phỏng. Kiểm tra quyền ở giao diện không phải cơ chế phân quyền backend.</p>}
    {hrView && <button className="text-button" onClick={() => onNavigate("hr-command")}>Về trung tâm HR</button>}
  </div>;
}
