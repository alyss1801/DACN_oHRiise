"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Filter, KeyRound, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useIam } from "./iam-context";
import { permissionCatalog, scopeLabels } from "./mock-data";
import { BackButton, EmptyState, Person, ScopeLabel } from "./iam-ui";
import type { TemporaryDelegation } from "./types";

const base = "access/delegation";
const today = () => new Date().toISOString().slice(0, 10);
const dateLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("vi-VN");
type DisplayStatus = "pending" | "scheduled" | "active" | "expired" | "rejected" | "revoked";
const stateLabels: Record<DisplayStatus, string> = { pending: "Chờ phê duyệt", scheduled: "Sắp hiệu lực", active: "Đang hiệu lực", expired: "Hết hạn", rejected: "Đã từ chối", revoked: "Đã thu hồi" };
function displayStatus(item: TemporaryDelegation): DisplayStatus {
  if (item.status !== "approved") return item.status;
  if (item.endsAt < today()) return "expired";
  return item.startsAt > today() ? "scheduled" : "active";
}

export function DelegationWorkspace({ moduleId, onNavigate }: { moduleId: string; onNavigate: (id: string) => void }) {
  const part = moduleId.split("/")[2];
  if (part === "new") return <NewDelegation onNavigate={onNavigate} />;
  if (part) return <DelegationDetail id={part} onNavigate={onNavigate} />;
  return <DelegationDirectory onNavigate={onNavigate} />;
}

function DelegationDirectory({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { temporaryDelegations, accounts } = useIam();
  const [query, setQuery] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [filters, setFilters] = useState({ status: "", branch: "", department: "", fromId: "", toId: "", permission: "", scope: "", startsFrom: "", endsTo: "" });
  const setFilter = (key: keyof typeof filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const visible = useMemo(() => temporaryDelegations.filter((item) => {
    const from = accounts.find((account) => account.id === item.fromId);
    const to = accounts.find((account) => account.id === item.toId);
    const permission = permissionCatalog.find((entry) => entry.code === item.permissionCode);
    if (!`${from?.name ?? ""} ${to?.name ?? ""} ${permission?.name ?? ""} ${item.reason}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"))) return false;
    if (filters.status && displayStatus(item) !== filters.status) return false;
    if (filters.branch && to?.branch !== filters.branch) return false;
    if (filters.department && to?.department !== filters.department) return false;
    if (filters.fromId && item.fromId !== filters.fromId) return false;
    if (filters.toId && item.toId !== filters.toId) return false;
    if (filters.permission && item.permissionCode !== filters.permission) return false;
    if (filters.scope && item.scope.type !== filters.scope) return false;
    if (filters.startsFrom && item.startsAt < filters.startsFrom) return false;
    if (filters.endsTo && item.endsAt > filters.endsTo) return false;
    return true;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [temporaryDelegations, accounts, filters, query]);
  const selected = Object.entries(filters).filter(([, value]) => value);
  const select = (key: keyof typeof filters, label: string, choices: { value: string; label: string }[]) => <label key={key}><span>{label}</span><select value={filters[key]} onChange={(event) => setFilter(key, event.target.value)}><option value="">Tất cả</option>{choices.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</select></label>;
  const personChoices = accounts.map((item) => ({ value: item.id, label: item.name }));
  const counts = { active: temporaryDelegations.filter((item) => displayStatus(item) === "active").length, pending: temporaryDelegations.filter((item) => displayStatus(item) === "pending").length, ending: temporaryDelegations.filter((item) => displayStatus(item) === "active" && item.endsAt <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)).length };
  return <>
    <section className="iam-section-head"><div><span className="eyebrow">TIME-BOUND ACCESS</span><h2>Ủy quyền tạm thời</h2><p>Theo dõi yêu cầu, thời hạn và trạng thái quyền được ủy quyền trong dữ liệu demo.</p></div><button className="primary-button" onClick={() => onNavigate(`${base}/new`)}><Plus size={15} /> Tạo yêu cầu</button></section>
    <section className="iam-summary-strip"><div><span>Tổng yêu cầu</span><strong>{temporaryDelegations.length}</strong></div><div><span>Đang hiệu lực</span><strong>{counts.active}</strong></div><div><span>Chờ phê duyệt</span><strong>{counts.pending}</strong></div><div><span>Hết hạn trong 7 ngày</span><strong>{counts.ending}</strong></div></section>
    <section className="panel iam-directory"><div className="iam-directory-toolbar"><div className="iam-search"><Search size={16} /><input aria-label="Tìm ủy quyền" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm người, quyền hoặc lý do..." /></div><button className="secondary-button" aria-expanded={advanced} onClick={() => setAdvanced((value) => !value)}><Filter size={15} /> Bộ lọc chi tiết {selected.length > 0 && <b>{selected.length}</b>}</button></div>
      {advanced && <div className="iam-filter-grid iam-governance-filters">
        {select("status", "Trạng thái", Object.entries(stateLabels).map(([value, label]) => ({ value, label })))}
        {select("branch", "Chi nhánh người nhận", [...new Set(accounts.map((item) => item.branch))].map((value) => ({ value, label: value })))}
        {select("department", "Phòng ban người nhận", [...new Set(accounts.map((item) => item.department))].map((value) => ({ value, label: value })))}
        {select("fromId", "Người ủy quyền", personChoices)}{select("toId", "Người nhận", personChoices)}
        {select("permission", "Quyền được ủy quyền", permissionCatalog.map((item) => ({ value: item.code, label: item.name })))}
        {select("scope", "Phạm vi", Object.entries(scopeLabels).map(([value, label]) => ({ value, label })))}
        <label><span>Bắt đầu từ</span><input type="date" value={filters.startsFrom} onChange={(event) => setFilter("startsFrom", event.target.value)} /></label>
        <label><span>Kết thúc trước</span><input type="date" value={filters.endsTo} onChange={(event) => setFilter("endsTo", event.target.value)} /></label>
      </div>}
      {selected.length > 0 && <div className="iam-filter-chips">{selected.map(([key, value]) => <button key={key} onClick={() => setFilter(key as keyof typeof filters, "")}>{key === "fromId" || key === "toId" ? accounts.find((item) => item.id === value)?.name : key === "permission" ? permissionCatalog.find((item) => item.code === value)?.name : stateLabels[value as DisplayStatus] ?? scopeLabels[value as keyof typeof scopeLabels] ?? value}<X size={13} /></button>)}<button className="clear" onClick={() => setFilters({ status: "", branch: "", department: "", fromId: "", toId: "", permission: "", scope: "", startsFrom: "", endsTo: "" })}>Xóa bộ lọc</button></div>}
      <div className="iam-result-meta"><strong>{visible.length} yêu cầu</strong><span>Trạng thái hiệu lực được tính theo ngày</span></div><div className="iam-governance-list">{visible.map((item) => { const status = displayStatus(item); const from = accounts.find((person) => person.id === item.fromId); const to = accounts.find((person) => person.id === item.toId); return <button key={item.id} className="iam-governance-row" onClick={() => onNavigate(`${base}/${item.id}`)}><span className="iam-governance-icon"><KeyRound size={18} /></span><span className="iam-governance-main"><strong>{permissionCatalog.find((entry) => entry.code === item.permissionCode)?.name ?? item.permissionCode}</strong><small>{from?.name ?? "—"} → {to?.name ?? "—"} · {to?.branch ?? "—"}</small></span><span className="iam-governance-period"><strong>{dateLabel(item.startsAt)} – {dateLabel(item.endsAt)}</strong><small><ScopeLabel scope={item.scope} /></small></span><span className={`iam-governance-state ${status === "active" ? "done" : status === "rejected" || status === "revoked" ? "late" : ""}`}>{stateLabels[status]}</span><ChevronRight size={16} /></button>; })}</div>
      {visible.length === 0 && <EmptyState title="Không có ủy quyền phù hợp" description="Thử điều chỉnh từ khóa, trạng thái hoặc khoảng thời gian." />}
    </section>
  </>;
}

function NewDelegation({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { accounts, effectivePermissions, temporaryDelegations, createDelegation } = useIam();
  const [fromId, setFromId] = useState(""); const [toId, setToId] = useState(""); const [permissionCode, setPermissionCode] = useState("");
  const [startsAt, setStartsAt] = useState(today()); const [endsAt, setEndsAt] = useState(""); const [reason, setReason] = useState(""); const [approverId, setApproverId] = useState("");
  const from = accounts.find((item) => item.id === fromId);
  const allowed = from ? effectivePermissions(from).filter((item) => item.allowed && !permissionCatalog.find((entry) => entry.code === item.code)?.protected && !item.code.startsWith("admin.")).map((item) => permissionCatalog.find((entry) => entry.code === item.code)!).filter(Boolean) : [];
  const maxEnd = startsAt ? new Date(new Date(`${startsAt}T12:00:00`).getTime() + 30 * 86400000).toISOString().slice(0, 10) : "";
  const overlapping = temporaryDelegations.some((item) => item.toId === toId && item.permissionCode === permissionCode && (item.status === "pending" || item.status === "approved") && item.startsAt <= endsAt && item.endsAt >= startsAt);
  const valid = Boolean(from && toId && fromId !== toId && permissionCode && allowed.some((item) => item.code === permissionCode) && startsAt >= today() && endsAt >= startsAt && endsAt <= maxEnd && reason.trim().length >= 10 && approverId && approverId !== fromId && approverId !== toId && !overlapping);
  const submit = () => { if (!valid || !from) return; const id = createDelegation({ fromId, toId, permissionCode, scope: { ...from.scope }, startsAt, endsAt, reason: reason.trim(), approverId }); toast.success("Đã tạo yêu cầu ủy quyền trong dữ liệu demo."); onNavigate(`${base}/${id}`); };
  return <><BackButton onClick={() => onNavigate(base)}>Danh sách ủy quyền</BackButton><section className="iam-section-head"><div><span className="eyebrow">YÊU CẦU MỚI</span><h2>Tạo ủy quyền tạm thời</h2><p>Chọn một quyền người ủy quyền hiện có. Phạm vi giữ nguyên, không mở rộng vượt quyền nguồn.</p></div></section>
    <section className="panel iam-governance-form"><div className="iam-governance-form-grid"><label><span>Người ủy quyền *</span><select value={fromId} onChange={(event) => { setFromId(event.target.value); setPermissionCode(""); }}><option value="">Chọn người ủy quyền</option>{accounts.filter((item) => item.status === "active").map((item) => <option key={item.id} value={item.id}>{item.name} · {item.department}</option>)}</select></label><label><span>Người nhận *</span><select value={toId} onChange={(event) => setToId(event.target.value)}><option value="">Chọn người nhận</option>{accounts.filter((item) => item.status === "active" && item.id !== fromId).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.department}</option>)}</select></label><label><span>Quyền ủy quyền *</span><select value={permissionCode} onChange={(event) => setPermissionCode(event.target.value)}><option value="">Chọn quyền có thể ủy quyền</option>{allowed.map((item) => <option key={item.code} value={item.code}>{item.name} · {item.module}</option>)}</select></label><label><span>Phạm vi giữ nguyên</span><div className="iam-governance-readonly">{from ? <ScopeLabel scope={from.scope} /> : "Chọn người ủy quyền trước"}</div></label><label><span>Bắt đầu *</span><input type="date" min={today()} value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label><label><span>Kết thúc * (tối đa 30 ngày)</span><input type="date" min={startsAt} max={maxEnd} value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></label><label><span>Người phê duyệt *</span><select value={approverId} onChange={(event) => setApproverId(event.target.value)}><option value="">Chọn người phê duyệt</option>{accounts.filter((item) => item.status === "active" && item.id !== fromId && item.id !== toId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="wide"><span>Lý do nghiệp vụ * (ít nhất 10 ký tự)</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Nêu bối cảnh và công việc cần bàn giao..." rows={3} /></label></div>
      {overlapping && <p className="iam-governance-warning">Người nhận đã có yêu cầu cùng quyền trùng khoảng thời gian. Vui lòng đổi thời gian hoặc người nhận.</p>}
      <div className="iam-governance-preview"><strong>Luồng xử lý demo</strong><p>Tạo yêu cầu → phê duyệt trong trang chi tiết → tự hiển thị “Sắp hiệu lực”, “Đang hiệu lực” hoặc “Hết hạn” theo ngày. Không cấp quyền thật ở backend.</p></div><div className="iam-form-actions"><button className="secondary-button" onClick={() => onNavigate(base)}>Hủy</button><button className="primary-button" disabled={!valid} onClick={submit}>Gửi yêu cầu phê duyệt</button></div>
    </section>
  </>;
}

function DelegationDetail({ id, onNavigate }: { id: string; onNavigate: (id: string) => void }) {
  const { temporaryDelegations, accounts, auditEvents, decideDelegation } = useIam();
  const [pendingAction, setPendingAction] = useState<"approved" | "rejected" | "revoked" | null>(null);
  const item = temporaryDelegations.find((entry) => entry.id === id);
  if (!item) return <><BackButton onClick={() => onNavigate(base)}>Danh sách ủy quyền</BackButton><EmptyState title="Không tìm thấy yêu cầu" description="Đường dẫn này không tồn tại trong dữ liệu demo." /></>;
  const from = accounts.find((person) => person.id === item.fromId); const to = accounts.find((person) => person.id === item.toId); const approver = accounts.find((person) => person.id === item.approverId);
  const permission = permissionCatalog.find((entry) => entry.code === item.permissionCode); const status = displayStatus(item);
  const events = auditEvents.filter((event) => event.delegationId === id);
  const apply = () => { if (!pendingAction) return; decideDelegation(id, pendingAction); toast.success(pendingAction === "approved" ? "Đã phê duyệt yêu cầu demo." : pendingAction === "rejected" ? "Đã từ chối yêu cầu demo." : "Đã thu hồi ủy quyền demo."); setPendingAction(null); };
  return <><BackButton onClick={() => onNavigate(base)}>Danh sách ủy quyền</BackButton><section className="iam-section-head"><div><span className="eyebrow">CHI TIẾT ỦY QUYỀN</span><h2>{permission?.name ?? item.permissionCode}</h2><p>Mã quyền: {item.permissionCode} · Yêu cầu ngày {dateLabel(item.createdAt)}</p></div><span className={`iam-governance-state ${status === "active" ? "done" : status === "revoked" || status === "rejected" ? "late" : ""}`}>{stateLabels[status]}</span></section>
    <section className="panel iam-governance-detail"><div><span>Người ủy quyền</span>{from ? <Person account={from} /> : "Tài khoản đã xóa"}</div><div><span>Người nhận</span>{to ? <Person account={to} /> : "Tài khoản đã xóa"}</div><div><span>Phạm vi dữ liệu</span><strong><ScopeLabel scope={item.scope} /></strong></div><div><span>Thời gian</span><strong>{dateLabel(item.startsAt)} – {dateLabel(item.endsAt)}</strong></div><div><span>Người phê duyệt</span><strong>{approver?.name ?? "—"}</strong></div><div><span>Lý do</span><strong>{item.reason}</strong></div></section>
    <section className="panel iam-governance-close"><div><strong>Kiểm soát thời hạn</strong><p>Quyền demo chỉ được xem là hiệu lực sau phê duyệt và trong khoảng ngày đã chọn. Hết hạn tự đổi trạng thái hiển thị; backend phải tự kiểm tra và thu hồi quyền thật.</p></div><div className="iam-governance-actions">{item.status === "pending" && <><button className="secondary-button" onClick={() => setPendingAction("rejected")}>Từ chối</button><button className="primary-button" onClick={() => setPendingAction("approved")}>Phê duyệt</button></>}{item.status === "approved" && status !== "expired" && <button className="secondary-button" onClick={() => setPendingAction("revoked")}>Thu hồi sớm</button>}</div></section>
    {pendingAction && <section className="iam-inline-confirm"><KeyRound size={20} /><div><strong>{pendingAction === "approved" ? "Xác nhận phê duyệt?" : pendingAction === "rejected" ? "Xác nhận từ chối?" : "Xác nhận thu hồi sớm?"}</strong><p>Thao tác chỉ cập nhật trạng thái trong phiên demo và được ghi vào lịch sử.</p></div><button className="secondary-button" onClick={() => setPendingAction(null)}>Hủy</button><button className="primary-button" onClick={apply}>Xác nhận</button></section>}
    <section className="panel iam-governance-audit"><span className="eyebrow">LỊCH SỬ DEMO</span>{events.length ? events.map((event) => <div key={event.id}><strong>{event.action}</strong><span>{event.actor} · {event.timestamp}</span></div>) : <p>Yêu cầu được khởi tạo từ dữ liệu mẫu, chưa có thao tác mới.</p>}</section>
  </>;
}
