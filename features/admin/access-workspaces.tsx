"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Clock3, Download, Eye, KeyRound, LockKeyhole, Plus, Repeat2, Search, ShieldAlert, ShieldCheck, UserRoundCog, UsersRound, X } from "lucide-react";
import { toast } from "sonner";
import { useDemoData, type AuditEvent } from "@/features/demo/demo-data-context";
import { FormField, StatusPill, WorkflowDialog, WorkspaceHeader } from "@/features/employee/workspace-frame";

export function AccountsWorkspace({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { accounts, selectedAccount: selected, selectAccount, updateAccount, bulkUpdateAccounts, addAccount } = useDemoData();
  const [checked, setChecked] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const visible = useMemo(() => accounts.filter((account) =>
    `${account.name} ${account.email}`.toLowerCase().includes(query.toLowerCase()) &&
    (statusFilter === "all" || account.status === statusFilter) &&
    (templateFilter === "all" || account.template === templateFilter)), [accounts, query, statusFilter, templateFilter]);

  function toggleStatus() {
    updateAccount(selected.id, { status: selected.status === "active" ? "inactive" : "active" });
    toast.success(selected.status === "active" ? "Đã tạm ngừng tài khoản." : "Đã kích hoạt tài khoản.");
  }

  function createAccount() {
    if (name.trim().length < 4 || !email.includes("@")) { toast.error("Vui lòng nhập họ tên và email hợp lệ."); return; }
    addAccount({ name: name.trim(), email: email.trim(), department: "Nhân sự", branch: "HCM-Q1", template: "Employee", status: "active", mfa: false });
    setName(""); setEmail(""); setCreateOpen(false); toast.success("Đã tạo tài khoản chờ thiết lập MFA.");
  }

  function exportCsv() {
    const rows = ["id,name,email,branch,template,status", ...visible.map((item) => [item.id, item.name, item.email, item.branch, item.template, item.status].join(","))];
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "ohriise-accounts.csv"; anchor.click(); URL.revokeObjectURL(url);
    toast.success("Đã xuất danh sách tài khoản CSV.");
  }

  return <div className="page-stack">
    <WorkspaceHeader eyebrow="ACCESS MANAGEMENT" title="Tài khoản người dùng" description="Danh tính, trạng thái, MFA và quyền hiệu lực." action={<div className="header-actions"><button className="secondary-button" onClick={exportCsv}><Download size={15} strokeWidth={1.5} /> CSV</button><button className="primary-button" onClick={() => setCreateOpen(true)}><UserRoundCog size={15} strokeWidth={1.5} /> Thêm tài khoản</button></div>} />
    <section className="account-toolbar"><div className="compact-search"><Search size={14} strokeWidth={1.5} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên hoặc email..." /></div><select className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Tất cả trạng thái</option><option value="active">Hoạt động</option><option value="inactive">Tạm ngừng</option></select><select className="filter-select" value={templateFilter} onChange={(event) => setTemplateFilter(event.target.value)}><option value="all">Tất cả mẫu quyền</option>{Array.from(new Set(accounts.map((item) => item.template))).map((item) => <option key={item}>{item}</option>)}</select>{checked.length > 0 && <div className="bulk-actions"><span>{checked.length} đã chọn</span><button onClick={() => { bulkUpdateAccounts(checked, { template: "Employee" }); toast.success("Đã gán mẫu Employee."); }}>Gán Employee</button><button onClick={() => { bulkUpdateAccounts(checked, { status: "inactive" }); toast.success("Đã tạm ngừng các tài khoản đã chọn."); }}>Tạm ngừng</button></div>}</section>
    <section className="accounts-layout panel"><div className="accounts-table-wrap"><table className="data-table accounts-table"><thead><tr><th><input aria-label="Chọn tất cả tài khoản" type="checkbox" checked={checked.length === visible.length && visible.length > 0} onChange={(event) => setChecked(event.target.checked ? visible.map((item) => item.id) : [])} /></th><th>Tài khoản</th><th>Chi nhánh</th><th>Mẫu quyền</th><th>MFA</th><th>Trạng thái</th></tr></thead><tbody>{visible.map((account) => <tr className={selected.id === account.id ? "selected" : ""} key={account.id}><td><input aria-label={`Chọn ${account.name}`} type="checkbox" checked={checked.includes(account.id)} onChange={() => setChecked((current) => current.includes(account.id) ? current.filter((id) => id !== account.id) : [...current, account.id])} /></td><td><button className="table-person-button" onClick={() => selectAccount(account.id)}><span className="avatar avatar-sm">{account.initials}</span><span><strong>{account.name}</strong><small>{account.email}</small></span></button></td><td>{account.branch}</td><td>{account.template}</td><td>{account.mfa ? <StatusPill tone="success">Đã bật</StatusPill> : <StatusPill tone="warning">Thiếu MFA</StatusPill>}</td><td><StatusPill tone={account.status === "active" ? "success" : "neutral"}>{account.status === "active" ? "Hoạt động" : "Tạm ngừng"}</StatusPill></td></tr>)}</tbody></table></div><aside className="account-drawer"><div className="account-identity"><div className="avatar large">{selected.initials}</div><div><span className="mono">{selected.id}</span><h3>{selected.name}</h3><p>{selected.email}</p></div></div><div className="account-facts"><div><span>Phòng ban</span><strong>{selected.department}</strong></div><div><span>Chi nhánh</span><strong>{selected.branch}</strong></div><div><span>Đăng nhập cuối</span><strong>{selected.lastLogin}</strong></div><div><span>MFA</span><strong>{selected.mfa ? "Đã bật" : "Chưa thiết lập"}</strong></div></div><div className="effective-access-mini"><span className="eyebrow">EFFECTIVE CAPABILITIES</span><div><ShieldCheck size={14} strokeWidth={1.5} /><span>Mẫu quyền</span><strong>{selected.template}</strong></div>{selected.name === "Bùi Thanh Tâm" && <div><UsersRound size={14} strokeWidth={1.5} /><span>Quan hệ</span><strong>Team Lead · Data Platform</strong></div>}<button onClick={() => onNavigate("permissions")}><Eye size={14} strokeWidth={1.5} /> Preview as this account</button></div><div className="account-actions"><button className="secondary-button" onClick={() => toast.success("Đã gửi liên kết đặt lại mật khẩu.")}><KeyRound size={14} strokeWidth={1.5} /> Reset mật khẩu</button><button className="secondary-button" onClick={toggleStatus}>{selected.status === "active" ? "Tạm ngừng" : "Kích hoạt"}</button></div></aside></section>
    <WorkflowDialog open={createOpen} onOpenChange={setCreateOpen} title="Tạo tài khoản" description="Tài khoản mới nhận quyền Employee cơ sở và phải thiết lập MFA." footer={<><button className="secondary-button" onClick={() => setCreateOpen(false)}>Hủy</button><button className="primary-button" onClick={createAccount}>Tạo tài khoản</button></>}><div className="form-grid"><FormField label="Họ và tên" required><input value={name} onChange={(event) => setName(event.target.value)} /></FormField><FormField label="Email công ty" required><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></FormField></div></WorkflowDialog>
  </div>;
}

type MatrixRow = { resource: string; label: string; actions: Record<string, boolean>; sensitive?: boolean; source: "template" | "override" };
const baseMatrix: MatrixRow[] = [
  { resource: "employees", label: "Hồ sơ nhân sự", actions: { view: true, create: true, edit: true, approve: false, export: true }, source: "template" },
  { resource: "contracts", label: "Hợp đồng", actions: { view: true, create: true, edit: true, approve: true, export: false }, source: "template" },
  { resource: "timesheets", label: "Bảng công", actions: { view: true, create: false, edit: true, approve: true, export: true }, source: "template" },
  { resource: "payroll", label: "Dữ liệu lương", actions: { view: true, create: false, edit: false, approve: false, export: false }, source: "override", sensitive: true },
  { resource: "misa", label: "Đồng bộ MISA", actions: { view: true, create: false, edit: false, approve: false, export: false }, source: "template", sensitive: true },
];

export function PermissionsWorkspace() {
  const { selectedAccount, requestAccessChange } = useDemoData();
  const [templates, setTemplates] = useState(["HR Tổng", "HR Chi nhánh", "HR Tuyển dụng", "HR C&B", "HR Operations", "HRBP", "Employee"]);
  const [template, setTemplate] = useState(selectedAccount.template);
  const [matrix, setMatrix] = useState(baseMatrix);
  const [scope, setScope] = useState("Toàn công ty");
  const [fields, setFields] = useState({ CCCD: "visible", "Tài khoản ngân hàng": "masked", "Mức lương": "visible" });
  const [saveOpen, setSaveOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pendingId, setPendingId] = useState("");
  const actions = ["view", "create", "edit", "approve", "export"];

  function toggle(resource: string, action: string) {
    setMatrix((current) => current.map((row) => {
      if (row.resource !== resource) return row;
      const next = { ...row.actions, [action]: !row.actions[action] };
      if (action !== "view" && next[action]) next.view = true;
      if (action === "view" && !next.view) Object.keys(next).forEach((key) => { next[key] = false; });
      return { ...row, actions: next, source: "override" };
    }));
  }

  function save() {
    if (reason.trim().length < 12) { toast.error("Thay đổi quyền nhạy cảm cần lý do ít nhất 12 ký tự."); return; }
    const id = requestAccessChange({ title: `Gán mẫu ${template}`, accountId: selectedAccount.id, account: `${selectedAccount.name} · ${selectedAccount.template}`, requester: "Admin A · Lê Hải Nam", risk: matrix.some((row) => row.sensitive && row.actions.export) ? "Cao" : "Trung bình", reason: reason.trim(), current: `Template: ${selectedAccount.template}`, proposed: `Template: ${template} · scope: ${scope} · salary: ${fields["Mức lương"]}` });
    setPendingId(id); setSaveOpen(false); setReason(""); toast.success("Đã gửi thay đổi để Admin thứ hai duyệt.");
  }

  return <div className="page-stack">
    <WorkspaceHeader eyebrow="EFFECTIVE AUTHORIZATION" title="Quyền & phạm vi" description={`Đang cấu hình cho ${selectedAccount.name} · ${selectedAccount.id}`} action={<button className="primary-button" onClick={() => setSaveOpen(true)}>Lưu thay đổi</button>} />
    {pendingId && <div className="inline-alert warning"><Clock3 size={17} strokeWidth={1.5} /><div><strong>{pendingId} đang chờ Admin thứ hai</strong><p>Admin A không thể tự phê duyệt thay đổi này.</p></div><StatusPill tone="warning">Pending review</StatusPill></div>}
    <section className="permission-layout"><aside className="panel template-list"><span className="eyebrow">PERMISSION TEMPLATES</span>{templates.map((item) => <button className={template === item ? "is-active" : ""} key={item} onClick={() => setTemplate(item)}><div><strong>{item}</strong><span>{item === "Employee" ? "328 tài khoản" : "Mẫu chuyên trách"}</span></div><StatusPill tone={item === "HR Tổng" ? "warning" : "neutral"}>{item === "HR Tổng" ? "Sensitive" : "Standard"}</StatusPill></button>)}<button className="add-template" onClick={() => { const copy = `${template} · Bản sao`; setTemplates((current) => [...current, copy]); setTemplate(copy); toast.success("Đã sao chép mẫu quyền."); }}>Sao chép mẫu</button></aside>
      <article className="panel permission-editor"><div className="permission-editor-head"><div><span className="eyebrow">TEMPLATE</span><h3>{template}</h3><p>Override được đánh dấu amber; quyền phụ thuộc tự động bật View.</p></div><select value={scope} onChange={(event) => setScope(event.target.value)}><option>Toàn công ty</option><option>Chi nhánh</option><option>Phòng ban</option><option>Team</option><option>Được phân công</option></select></div><div className="matrix-scroll"><table className="permission-matrix"><thead><tr><th>Module / capability</th>{actions.map((action) => <th key={action}>{action}</th>)}<th>Nguồn</th></tr></thead><tbody>{matrix.map((row) => <tr key={row.resource}><td><strong>{row.label}</strong>{row.sensitive && <span><ShieldAlert size={11} strokeWidth={1.5} /> Sensitive</span>}</td>{actions.map((action) => <td key={action}><button aria-label={`${row.label}: ${action}`} className={`${row.actions[action] ? "checked" : ""} ${row.source === "override" ? "override" : ""}`} onClick={() => toggle(row.resource, action)}>{row.actions[action] && <Check size={13} strokeWidth={1.5} />}</button></td>)}<td><span className={`source-badge ${row.source}`}>{row.source}</span></td></tr>)}</tbody></table></div><div className="sensitive-policy"><div><LockKeyhole size={16} strokeWidth={1.5} /><strong>Trường nhạy cảm</strong></div>{Object.entries(fields).map(([field, value]) => <label key={field}><span>{field}</span><select value={value} onChange={(event) => setFields((current) => ({ ...current, [field]: event.target.value }))}><option value="visible">Hiển thị</option><option value="masked">Che một phần</option><option value="hidden">Ẩn</option></select></label>)}</div></article>
      <aside className="panel ui-preview"><span className="eyebrow">EFFECTIVE UI PREVIEW</span><h3>{selectedAccount.name}</h3><p>{template} · Scope: {scope}</p><div className="preview-nav">{matrix.filter((row) => row.actions.view).map((row) => <div key={row.resource}><span>{row.sensitive ? <LockKeyhole size={13} strokeWidth={1.5} /> : <Check size={13} strokeWidth={1.5} />}</span>{row.label}<small>{Object.entries(row.actions).filter(([, enabled]) => enabled).map(([action]) => action).join(" · ")}</small></div>)}</div><div className="privacy-note"><Eye size={14} strokeWidth={1.5} /><span>CCCD {fields.CCCD}, ngân hàng {fields["Tài khoản ngân hàng"]}, lương {fields["Mức lương"]}.</span></div></aside>
    </section>
    <WorkflowDialog open={saveOpen} onOpenChange={setSaveOpen} title="Gửi thay đổi quyền" description={`${selectedAccount.name} · ${template} · ${scope}`} footer={<><button className="secondary-button" onClick={() => setSaveOpen(false)}>Hủy</button><button className="primary-button" onClick={save}>Gửi second-admin review</button></>}><div className="warning-box"><AlertTriangle size={18} strokeWidth={1.5} /><div><strong>Thay đổi high-impact</strong><p>Template, export, MISA và trường nhạy cảm phải có lý do và người duyệt độc lập.</p></div></div><div className="dialog-field-gap"><FormField label="Lý do thay đổi" required><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Mô tả nhu cầu nghiệp vụ và thời hạn áp dụng..." /></FormField></div></WorkflowDialog>
  </div>;
}

export function AccessReviewsWorkspace() {
  const { accessReviews, decideAccessReview } = useDemoData();
  const [reviewer, setReviewer] = useState<"Admin A" | "Admin B">("Admin A");
  const items = accessReviews.filter((item) => item.status === "pending");
  function decide(id: string, approved: boolean) { decideAccessReview(id, approved ? "approved" : "rejected", reviewer); toast.success(approved ? "Đã phê duyệt, áp dụng và ghi audit." : "Đã từ chối và ghi audit."); }
  return <div className="page-stack"><WorkspaceHeader eyebrow="TWO-PERSON REVIEW" title="Rà soát truy cập" description="Thay đổi quyền nhạy cảm phải được một Admin khác phê duyệt." action={<button className="secondary-button" onClick={() => setReviewer((value) => value === "Admin A" ? "Admin B" : "Admin A")}><UsersRound size={15} strokeWidth={1.5} /> Đang xem với {reviewer}</button>} /><div className={`reviewer-banner ${reviewer === "Admin A" ? "blocked" : "ready"}`}><span>{reviewer === "Admin A" ? <ShieldAlert size={17} strokeWidth={1.5} /> : <ShieldCheck size={17} strokeWidth={1.5} />}</span><div><strong>{reviewer === "Admin A" ? "Bạn là người tạo các yêu cầu này" : "Bạn có thể thực hiện second-admin review"}</strong><p>{reviewer === "Admin A" ? "Không thể tự phê duyệt. Chuyển sang Admin B để tiếp tục." : "Quyết định sẽ cập nhật account và audit log dùng chung."}</p></div></div><section className="review-queue">{items.length ? items.map((review) => <article className="panel" key={review.id}><div className="review-head"><span className="mono">{review.id}</span><StatusPill tone={review.risk === "Cao" ? "danger" : "warning"}>Risk · {review.risk}</StatusPill></div><h3>{review.title}</h3><p>{review.account}</p><div className="review-meta"><span>Người yêu cầu</span><strong>{review.requester}</strong><span>Lý do</span><strong>{review.reason}</strong></div><div className="review-diff"><div><X size={13} strokeWidth={1.5} /><span>Hiện tại</span><strong>{review.current}</strong></div><div><Check size={13} strokeWidth={1.5} /><span>Đề xuất</span><strong>{review.proposed}</strong></div></div><div className="review-actions"><button className="secondary-button reject" disabled={reviewer === "Admin A"} onClick={() => decide(review.id, false)}>Từ chối</button><button className="primary-button" disabled={reviewer === "Admin A"} onClick={() => decide(review.id, true)}>Phê duyệt</button></div></article>) : <div className="panel compact-empty"><CheckCircle2 size={24} strokeWidth={1.5} /><strong>Không còn yêu cầu chờ duyệt</strong><p>Mọi thay đổi nhạy cảm đã được xử lý và ghi audit.</p></div>}</section></div>;
}

export function AuditWorkspace() {
  const { auditEvents } = useDemoData();
  const [filter, setFilter] = useState("Tất cả");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AuditEvent | null>(null);
  const visible = auditEvents.filter((event) => (filter === "Tất cả" || event.result === filter) && `${event.actor} ${event.action} ${event.target}`.toLowerCase().includes(query.toLowerCase()));
  function exportLog() { const payload = JSON.stringify(visible, null, 2); const url = URL.createObjectURL(new Blob([payload], { type: "application/json" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "ohriise-audit-log.json"; anchor.click(); URL.revokeObjectURL(url); toast.success("Đã xuất audit log."); }
  return <div className="page-stack"><WorkspaceHeader eyebrow="SECURITY AUDIT" title="Nhật ký & cảnh báo" description="Dấu vết dùng chung cho truy cập và thay đổi hệ thống." action={<button className="secondary-button" onClick={exportLog}><Download size={15} strokeWidth={1.5} /> Export signed log</button>} /><section className="audit-toolbar"><div>{["Tất cả", "pending", "blocked", "success", "rejected"].map((item) => <button className={filter === item ? "is-active" : ""} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div><div className="compact-search"><Search size={14} strokeWidth={1.5} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Actor, action hoặc target..." /></div></section><section className="panel audit-list"><div className="audit-header"><span>Thời gian</span><span>Actor</span><span>Action</span><span>Target</span><span>Kết quả</span><span>Source</span></div>{visible.map((event) => <button key={event.id} onClick={() => setSelected(event)}><time>{event.time}<small>{event.date}</small></time><strong>{event.actor}</strong><code>{event.action}</code><span>{event.target}</span><StatusPill tone={event.result === "success" || event.result === "reviewed" ? "success" : event.result === "pending" ? "warning" : "danger"}>{event.result}</StatusPill><code>{event.source}</code></button>)}</section>{selected && <WorkflowDialog open onOpenChange={(open) => !open && setSelected(null)} title={selected.action} description={`${selected.actor} · ${selected.date} ${selected.time}`} footer={<button className="primary-button" onClick={() => setSelected(null)}>Đóng</button>}><div className="audit-detail"><span>Target</span><strong>{selected.target}</strong><span>Source</span><strong>{selected.source}</strong><span>Chi tiết</span><p>{selected.detail}</p></div></WorkflowDialog>}</div>;
}

type Delegation = { id: string; from: string; to: string; capability: string; start: string; end: string; status: "active" | "scheduled" | "expired" };
const delegationSeed: Delegation[] = [
  { id: "DLG-2026-044", from: "Trần Minh Quân", to: "Bùi Thanh Tâm", capability: "Phê duyệt chi phí · Data Platform", start: "2026-10-07", end: "2026-10-16", status: "active" },
  { id: "DLG-2026-045", from: "Nguyễn Thanh Lan", to: "Trương Minh Anh", capability: "Chốt bảng công · HCM-Q1", start: "2026-10-12", end: "2026-10-14", status: "scheduled" },
  { id: "DLG-2026-039", from: "Lê Hoàng Phúc", to: "Võ Minh Anh", capability: "Duyệt WFH · Growth Team", start: "2026-09-21", end: "2026-09-25", status: "expired" },
];

export function DelegationWorkspace() {
  const { addAuditEvent } = useDemoData();
  const [items, setItems] = useState(delegationSeed);
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("Lê Hoàng Vy");
  const [start, setStart] = useState("2026-10-12");
  const [end, setEnd] = useState("2026-10-16");
  const [capability, setCapability] = useState("Duyệt WFH · Data Platform");
  function create() {
    const days = (new Date(end).getTime() - new Date(start).getTime()) / 86400000;
    if (days < 0 || days > 30) { toast.error("Thời hạn ủy quyền phải từ 0 đến 30 ngày."); return; }
    if (items.some((item) => item.to === "Trần Minh Quân" && item.from === to && item.status !== "expired")) { toast.error("Không thể tạo chuỗi ủy quyền đệ quy."); return; }
    const item: Delegation = { id: `DLG-2026-${46 + items.length}`, from: "Trần Minh Quân", to, capability, start, end, status: new Date(start) > new Date("2026-10-07") ? "scheduled" : "active" };
    setItems((current) => [item, ...current]); setOpen(false); addAuditEvent({ actor: "Admin A · Lê Hải Nam", action: "CREATE_DELEGATION", target: item.id, result: "success", source: "Demo session", detail: `${item.from} → ${item.to}, ${item.capability}, ${item.start} – ${item.end}.` }); toast.success("Đã tạo ủy quyền có thời hạn.");
  }
  return <div className="page-stack"><WorkspaceHeader eyebrow="TEMPORARY DELEGATION" title="Ủy quyền tạm thời" description="Quyền có thời hạn, tự hết hạn và không thể ủy quyền tiếp." action={<button className="primary-button" onClick={() => setOpen(true)}><Plus size={15} strokeWidth={1.5} /> Tạo ủy quyền</button>} /><div className="delegation-rule"><Repeat2 size={17} strokeWidth={1.5} /><div><strong>Giới hạn hiện tại: tối đa 30 ngày</strong><p>Nguồn gốc ủy quyền luôn hiển thị trong audit.</p></div></div><section className="panel data-panel"><div className="data-panel-head"><div><span className="eyebrow">DELEGATION REGISTER</span><h3>Đang hoạt động & lịch sử</h3></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Mã</th><th>Người ủy quyền</th><th>Người nhận</th><th>Khả năng</th><th>Thời hạn</th><th>Trạng thái</th><th></th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td className="mono">{item.id}</td><td>{item.from}</td><td><strong>{item.to}</strong></td><td>{item.capability}</td><td className="mono">{item.start} – {item.end}</td><td><StatusPill tone={item.status === "active" ? "success" : item.status === "scheduled" ? "blue" : "neutral"}>{item.status === "active" ? "Hiệu lực" : item.status === "scheduled" ? "Đã lên lịch" : "Đã hết hạn"}</StatusPill></td><td>{item.status !== "expired" && <button className="row-action" onClick={() => { setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "expired" } : entry)); addAuditEvent({ actor: "Admin A · Lê Hải Nam", action: "REVOKE_DELEGATION", target: item.id, result: "success", source: "Demo session", detail: "Thu hồi trước thời hạn." }); toast.success("Đã thu hồi ủy quyền."); }}>Thu hồi</button>}</td></tr>)}</tbody></table></div></section><WorkflowDialog open={open} onOpenChange={setOpen} title="Tạo ủy quyền tạm thời" description="Quyền tự động hết hiệu lực vào cuối ngày kết thúc." footer={<><button className="secondary-button" onClick={() => setOpen(false)}>Hủy</button><button className="primary-button" onClick={create}>Tạo ủy quyền</button></>}><div className="form-grid two-cols"><FormField label="Người ủy quyền"><input value="Trần Minh Quân" disabled /></FormField><FormField label="Người nhận" required><select value={to} onChange={(event) => setTo(event.target.value)}><option>Lê Hoàng Vy</option><option>Bùi Thanh Tâm</option></select></FormField><FormField label="Từ ngày" required><input type="date" value={start} onChange={(event) => setStart(event.target.value)} /></FormField><FormField label="Đến ngày" required><input type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></FormField></div><div className="dialog-field-gap"><FormField label="Khả năng được ủy quyền" required><select value={capability} onChange={(event) => setCapability(event.target.value)}><option>Duyệt WFH · Data Platform</option><option>Duyệt nghỉ phép · Data Platform</option><option>Phê duyệt chi phí · Data Platform</option></select></FormField></div></WorkflowDialog></div>;
}
