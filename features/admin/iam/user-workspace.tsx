"use client";

import { useMemo, useState } from "react";
import { Activity, ArrowDownAZ, ChevronLeft, ChevronRight, Download, ExternalLink, Filter, KeyRound, LockKeyhole, Pencil, Plus, Search, ShieldCheck, UserRoundCog, X } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/features/session/session-context";
import { cn } from "@/lib/utils";
import { useIam } from "./iam-context";
import { useHrDemo } from "@/features/hr/hr-demo-context";
import { permissionCatalog, scopeLabels } from "./mock-data";
import { BackButton, Person, ScopeLabel, StatusChip, TemplateChip, statusLabels } from "./iam-ui";
import type { Account, AccountStatus } from "./types";

export function UserWorkspace({ moduleId, onNavigate }: { moduleId: string; onNavigate: (id: string) => void }) {
  const parts = moduleId.split("/");
  const accountId = parts[2];
  if (accountId && accountId !== "new") return <UserProfile accountId={accountId} edit={parts[3] === "edit"} onNavigate={onNavigate} />;
  if (accountId === "new") return <AccountEditor onNavigate={onNavigate} />;
  return <UserDirectory onNavigate={onNavigate} />;
}

function UserDirectory({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { accounts, templates, effectivePermissions } = useIam();
  const { can } = useSession();
  const [query, setQuery] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({ branch: "", department: "", team: "", position: "", level: "", employmentType: "", template: "", permission: "", scope: "", custom: "", admin: "", status: "", login: "", auth: "", mfa: "" });
  const setFilter = (key: string, value: string) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1); };
  const options = (key: keyof Account) => Array.from(new Set(accounts.map((item) => String(item[key] ?? "")))).filter(Boolean);
  const visible = useMemo(() => accounts.filter((account) => {
    const haystack = `${account.name} ${account.email} ${account.employeeCode}`.toLocaleLowerCase("vi");
    if (!haystack.includes(query.toLocaleLowerCase("vi"))) return false;
    if (filters.branch && account.branch !== filters.branch) return false;
    if (filters.department && account.department !== filters.department) return false;
    if (filters.team && account.team !== filters.team) return false;
    if (filters.position && account.position !== filters.position) return false;
    if (filters.level && account.level !== filters.level) return false;
    if (filters.employmentType && account.employmentType !== filters.employmentType) return false;
    if (filters.status && account.status !== filters.status) return false;
    if (filters.template && !account.templateIds.includes(filters.template)) return false;
    if (filters.permission && !effectivePermissions(account).some((item) => item.code === filters.permission && item.allowed)) return false;
    if (filters.scope && account.scope.type !== filters.scope) return false;
    if (filters.custom === "yes" && Object.keys(account.overrides).length === 0) return false;
    if (filters.custom === "no" && Object.keys(account.overrides).length > 0) return false;
    if (filters.admin === "yes" && !account.templateIds.includes("tpl-system-admin")) return false;
    if (filters.admin === "no" && account.templateIds.includes("tpl-system-admin")) return false;
    if (filters.login === "yes" && !account.lastLogin) return false;
    if (filters.login === "no" && account.lastLogin) return false;
    if (filters.auth && account.authMethod !== filters.auth) return false;
    if (filters.mfa === "yes" && !account.mfa) return false;
    if (filters.mfa === "no" && account.mfa) return false;
    return true;
  }).sort((a, b) => sort === "recent" ? (b.lastLogin ?? "").localeCompare(a.lastLogin ?? "") : sort === "code" ? a.employeeCode.localeCompare(b.employeeCode) : a.name.localeCompare(b.name, "vi")), [accounts, effectivePermissions, filters, query, sort]);
  const perPage = 8;
  const pageCount = Math.max(1, Math.ceil(visible.length / perPage));
  const currentPage = Math.min(page, pageCount);
  const paged = visible.slice((currentPage - 1) * perPage, currentPage * perPage);
  const activeFilters = Object.entries(filters).filter(([, value]) => value);
  const counts = { active: accounts.filter((item) => item.status === "active").length, locked: accounts.filter((item) => item.status === "locked").length, pending: accounts.filter((item) => item.status === "pending").length };

  function exportCsv() {
    const rows = ["employee_code,name,email,branch,department,status", ...visible.map((item) => [item.employeeCode, item.name, item.email, item.branch, item.department, statusLabels[item.status]].join(","))];
    const url = URL.createObjectURL(new Blob([`\ufeff${rows.join("\n")}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "danh-sach-tai-khoan-ohriise.csv"; anchor.click(); URL.revokeObjectURL(url);
    toast.success(`Đã xuất ${visible.length} tài khoản.`);
  }

  const select = (filterKey: string, label: string, values: Array<string | { value: string; label: string }>) => <label key={filterKey}><span>{label}</span><select value={filters[filterKey]} onChange={(event) => setFilter(filterKey, event.target.value)}><option value="">Tất cả</option>{values.map((item) => typeof item === "string" ? <option key={item}>{item}</option> : <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>;

  return <>
    <section className="iam-section-head"><div><span className="eyebrow">DANH BẠ TÀI KHOẢN</span><h2>Quản lý tài khoản</h2></div><div><button className="secondary-button" onClick={() => onNavigate("access/users/new")}><Plus size={15} /> Thêm tài khoản</button>{can("accounts", "export") && <button className="primary-button" onClick={exportCsv}><Download size={15} /> Xuất danh sách</button>}</div></section>
    <section className="iam-summary-strip"><div><span>Tổng tài khoản</span><strong>{accounts.length}</strong></div><div><span>Đang hoạt động</span><strong>{counts.active}</strong></div><div><span>Tạm khóa</span><strong>{counts.locked}</strong></div><div><span>Chưa kích hoạt</span><strong>{counts.pending}</strong></div></section>
    <section className="panel iam-directory">
      <div className="iam-directory-toolbar"><div className="iam-search"><Search size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Tìm tên, email hoặc mã nhân viên..." /></div><button className={cn("secondary-button", advanced && "is-active")} onClick={() => setAdvanced((value) => !value)}><Filter size={15} /> Bộ lọc nâng cao {activeFilters.length > 0 && <b>{activeFilters.length}</b>}</button><label className="iam-sort"><ArrowDownAZ size={15} /><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="name">Tên A–Z</option><option value="code">Mã nhân viên</option><option value="recent">Đăng nhập gần nhất</option></select></label></div>
      {advanced && <div className="iam-filter-grid">
        {select("branch", "Chi nhánh", options("branch"))}{select("department", "Phòng ban", options("department"))}{select("team", "Team / Dự án", options("team"))}{select("position", "Chức danh", options("position"))}{select("level", "Cấp bậc", options("level"))}{select("employmentType", "Loại hình nhân sự", options("employmentType"))}
        {select("template", "Vai trò / Mẫu quyền", templates.map((item) => ({ value: item.id, label: item.name })))}{select("permission", "Quyền cụ thể", permissionCatalog.map((item) => ({ value: item.code, label: item.name })))}{select("scope", "Phạm vi truy cập", Object.entries(scopeLabels).map(([value, label]) => ({ value, label })))}{select("custom", "Quyền tùy chỉnh", [{ value: "yes", label: "Có quyền tùy chỉnh" }, { value: "no", label: "Không có" }])}{select("admin", "Quản trị hệ thống", [{ value: "yes", label: "Có quyền quản trị" }, { value: "no", label: "Không có" }])}{select("status", "Trạng thái", Object.entries(statusLabels).map(([value, label]) => ({ value, label })))}
        {select("login", "Lịch sử đăng nhập", [{ value: "yes", label: "Đã đăng nhập" }, { value: "no", label: "Chưa từng đăng nhập" }])}{select("auth", "Phương thức đăng nhập", options("authMethod"))}{select("mfa", "MFA", [{ value: "yes", label: "Đã bật" }, { value: "no", label: "Chưa bật" }])}
      </div>}
      {activeFilters.length > 0 && <div className="iam-filter-chips">{activeFilters.map(([key, value]) => <button key={key} onClick={() => setFilter(key, "")}>{templates.find((item) => item.id === value)?.name ?? permissionCatalog.find((item) => item.code === value)?.name ?? scopeLabels[value as keyof typeof scopeLabels] ?? statusLabels[value as AccountStatus] ?? value}<X size={13} /></button>)}<button className="clear" onClick={() => setFilters(Object.fromEntries(Object.keys(filters).map((key) => [key, ""])))}>Xóa bộ lọc</button></div>}
      <div className="iam-result-meta"><strong>{visible.length} kết quả</strong><span>Hiển thị {(currentPage - 1) * perPage + (visible.length ? 1 : 0)}–{Math.min(currentPage * perPage, visible.length)} trên {visible.length}</span></div>
      <div className="iam-table-scroll"><table className="iam-table"><thead><tr><th>Nhân sự</th><th>Mã nhân viên</th><th>Chi nhánh</th><th>Phòng ban</th><th>Vai trò hiện tại</th><th>Phạm vi truy cập</th><th>Trạng thái</th><th>Đăng nhập gần nhất</th></tr></thead><tbody>{paged.map((account) => <tr key={account.id} tabIndex={0} onClick={() => onNavigate(`access/users/${account.id}`)} onKeyDown={(event) => { if (event.key === "Enter") onNavigate(`access/users/${account.id}`); }}><td><Person account={account} /></td><td className="mono">{account.employeeCode}</td><td>{account.branch}</td><td>{account.department}</td><td><span className="iam-chip-wrap">{account.templateIds.map((id) => templates.find((item) => item.id === id)).filter(Boolean).map((item) => <TemplateChip key={item!.id} template={item!} />)}</span></td><td><ScopeLabel scope={account.scope} /></td><td><StatusChip status={account.status} /></td><td>{account.lastLogin ?? "Chưa đăng nhập"}</td></tr>)}</tbody></table></div>
      {paged.length === 0 && <div className="iam-no-results">Không có tài khoản phù hợp với bộ lọc hiện tại.</div>}
      <footer className="iam-pagination"><button disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={15} /> Trước</button><span>Trang {currentPage} / {pageCount}</span><button disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Sau <ChevronRight size={15} /></button></footer>
    </section>
  </>;
}

function UserProfile({ accountId, edit, onNavigate }: { accountId: string; edit: boolean; onNavigate: (id: string) => void }) {
  const { accounts, templates, auditEvents, effectivePermissions, startAssignment, updateAccount } = useIam();
  const [tab, setTab] = useState("overview");
  const [criticalAction, setCriticalAction] = useState<"lock" | "activate" | null>(null);
  const account = accounts.find((item) => item.id === accountId);
  if (!account) return <div className="iam-no-results">Không tìm thấy tài khoản.</div>;
  if (edit) return <AccountEditor account={account} onNavigate={onNavigate} />;
  const effective = effectivePermissions(account);
  const assignedTemplates = account.templateIds.map((id) => templates.find((item) => item.id === id)).filter(Boolean);
  const userEvents = auditEvents.filter((item) => item.accountId === account.id);
  const tabs = [{ id: "overview", label: "Tổng quan" }, { id: "employee", label: "Thông tin nhân sự" }, { id: "access", label: "Quyền & phạm vi" }, { id: "security", label: "Bảo mật tài khoản" }, { id: "activity", label: "Lịch sử hoạt động" }];
  const manage = () => { startAssignment(account.id); onNavigate(`access/assignments/${account.id}`); };

  function confirmCritical() {
    if (!criticalAction) return;
    const updated = updateAccount(accountId, { status: criticalAction === "lock" ? "locked" : "active" });
    if (!updated) { toast.error("Tài khoản đang trong luồng onboarding hoặc chưa đủ điều kiện; xử lý ở Tác vụ tài khoản."); return; }
    toast.success("Đã cập nhật trạng thái tài khoản trong demo cục bộ; không tác động phiên đăng nhập thật.");
    setCriticalAction(null);
  }

  return <>
    <BackButton onClick={() => onNavigate("access/users")}>Danh sách tài khoản</BackButton>
    <section className="iam-profile-hero panel"><Person account={account} /><div className="iam-profile-id"><span className="mono">{account.employeeCode}</span><StatusChip status={account.status} /></div><div className="iam-profile-actions"><button className="secondary-button" onClick={() => onNavigate(`access/users/${account.id}/edit`)}><Pencil size={15} /> Chỉnh sửa tài khoản</button><button className="primary-button" onClick={manage}><ShieldCheck size={15} /> Quản lý quyền</button></div></section>
    <nav className="iam-profile-tabs">{tabs.map((item) => <button key={item.id} className={tab === item.id ? "is-active" : ""} onClick={() => setTab(item.id)}>{item.label}</button>)}</nav>
    {tab === "overview" && <div className="iam-profile-grid"><section className="panel"><div className="iam-panel-head"><div><span className="eyebrow">THÔNG TIN TÀI KHOẢN</span><h3>Tổng quan định danh</h3></div><UserRoundCog size={18} /></div><dl className="iam-definition-grid"><Fact label="Họ và tên" value={account.name} /><Fact label="Mã nhân viên" value={account.employeeCode} /><Fact label="Email công ty" value={account.email} /><Fact label="Trạng thái" value={statusLabels[account.status]} /><Fact label="Loại hình nhân sự" value={account.employmentType} /><Fact label="Chi nhánh" value={account.branch} /><Fact label="Phòng ban" value={account.department} /><Fact label="Team" value={account.team} /><Fact label="Chức danh" value={account.position} /><Fact label="Quản lý trực tiếp" value={account.manager} /><Fact label="Ngày tạo tài khoản" value={account.createdAt} /><Fact label="Đăng nhập gần nhất" value={account.lastLogin ?? "Chưa đăng nhập"} /></dl></section><aside className="panel iam-access-summary"><div className="iam-panel-head"><div><span className="eyebrow">ACCESS SUMMARY</span><h3>Quyền truy cập hiện tại</h3></div><ShieldCheck size={18} /></div><div className="iam-summary-list"><div><span>Mẫu quyền áp dụng</span><strong>{assignedTemplates.map((item) => item!.name).join(" · ")}</strong></div><div><span>Quyền gán trực tiếp</span><strong>{Object.values(account.overrides).filter((value) => value === "allow").length}</strong></div><div><span>Phạm vi dữ liệu</span><strong><ScopeLabel scope={account.scope} /></strong></div><div><span>Quyền hiệu lực</span><strong>{effective.filter((item) => item.allowed).length}</strong></div></div><button className="primary-button wide" onClick={manage}>Quản lý quyền</button></aside></div>}
    {tab === "employee" && <section className="panel"><div className="iam-sensitive-note"><LockKeyhole size={18} /><div><strong>Dữ liệu được phân tách theo chính sách</strong><p>Quản trị hệ thống không mặc định được xem lương, ngân hàng, hợp đồng riêng tư hoặc dữ liệu y tế. Các trường nhạy cảm chỉ hiển thị khi có quyền HR riêng.</p></div></div><div className="iam-info-sections"><InfoSection title="Thông tin cơ bản" items={["Họ tên", account.name, "Email công việc", account.email, "Ngày bắt đầu", account.startDate]} /><InfoSection title="Thông tin công việc" items={["Chức danh", account.position, "Cấp bậc", account.level, "Loại hình", account.employmentType]} /><InfoSection title="Cơ cấu tổ chức" items={["Chi nhánh", account.branch, "Phòng ban", account.department, "Team", account.team, "Quản lý", account.manager]} /></div><button className="text-button" onClick={() => onNavigate("employees")}><ExternalLink size={14} /> Mở hồ sơ nhân sự chính thức</button></section>}
    {tab === "access" && <section className="panel"><div className="iam-panel-head"><div><span className="eyebrow">QUYỀN & PHẠM VI</span><h3>Nguồn quyền hiệu lực</h3></div><button className="primary-button" onClick={manage}><Pencil size={15} /> Chỉnh sửa phân quyền</button></div><div className="iam-assigned-templates">{assignedTemplates.map((template) => <article key={template!.id}><TemplateChip template={template!} /><strong>{template!.description}</strong><span>{template!.permissionCodes.length} quyền · Nguồn: Mẫu quyền</span></article>)}</div><div className="iam-effective-list">{effective.filter((item) => item.allowed || item.override === "deny").map((item) => { const permission = permissionCatalog.find((p) => p.code === item.code)!; return <div key={item.code}><span><strong>{permission.name}</strong><code>{item.code}</code></span><span>{item.allowed ? "Cho phép" : "Từ chối"}<small>Nguồn: {item.override !== "inherit" ? "Gán trực tiếp" : item.sources.join(", ") || "Mặc định hệ thống"}</small></span></div>; })}</div></section>}
    {tab === "security" && <section className="panel"><div className="iam-panel-head"><div><span className="eyebrow">BẢO MẬT TÀI KHOẢN</span><h3>Đăng nhập và phiên hoạt động</h3></div><KeyRound size={18} /></div><dl className="iam-definition-grid"><Fact label="Phương thức đăng nhập" value={account.authMethod} /><Fact label="MFA" value={account.mfa ? "Đã bật" : "Chưa bật"} /><Fact label="Đổi mật khẩu gần nhất" value={account.passwordChangedAt} /><Fact label="Khóa tài khoản" value={account.status === "locked" ? "Đang khóa" : "Không"} /><Fact label="Phiên đang hoạt động" value={String(account.activeSessions)} /><Fact label="Đăng nhập thất bại" value={String(account.failedLogins)} /></dl><div className="iam-security-actions"><button onClick={() => setCriticalAction(account.status === "locked" ? "activate" : "lock")}>{account.status === "locked" ? "Kích hoạt lại" : "Tạm khóa tài khoản"}</button></div><p className="hr-muted">Đặt lại mật khẩu và thu hồi phiên chưa khả dụng vì demo không có dịch vụ đăng nhập.</p>{criticalAction && <div className="iam-inline-confirm"><LockKeyhole size={20} /><div><strong>Xác nhận thao tác bảo mật</strong><p>Chỉ đổi trạng thái IAM cục bộ. Không gửi email, đặt mật khẩu hay thu hồi phiên đăng nhập thật.</p></div><button className="secondary-button" onClick={() => setCriticalAction(null)}>Hủy</button><button className="primary-button" onClick={confirmCritical}>Xác nhận</button></div>}</section>}
    {tab === "activity" && <section className="panel"><div className="iam-panel-head"><div><span className="eyebrow">AUDIT TRAIL</span><h3>Lịch sử hoạt động tài khoản</h3></div><Activity size={18} /></div><div className="iam-audit-list">{userEvents.map((event) => <article key={event.id}><span /><div><strong>{event.action}</strong><p>{event.actor} · {event.timestamp}</p></div><div><small>Trước</small><b>{event.previousValue}</b></div><div><small>Sau</small><b>{event.newValue}</b></div></article>)}{userEvents.length === 0 && <p>Chưa có sự kiện nào cho tài khoản này.</p>}</div></section>}
  </>;
}

function AccountEditor({ account, onNavigate }: { account?: Account; onNavigate: (id: string) => void }) {
  const { updateAccount, createAccount, accounts } = useIam();
  const { employees, cases } = useHrDemo();
  const [employeeId, setEmployeeId] = useState("");
  const [status, setStatus] = useState<AccountStatus>(account?.status ?? "pending");
  const candidates = employees.filter((person) => person.status !== "inactive" && !accounts.some((item) => item.employeeId === person.id));
  const activeOffboarding = account && cases.some((item) => item.kind === "offboarding" && item.employeeId === account.employeeId && !item.completedAt && !item.cancelledAt);
  const activeOnboarding = account && cases.some((item) => item.kind === "onboarding" && item.employeeId === account.employeeId && !item.completedAt && !item.cancelledAt && item.tasks.some((task) => task.id === "account" && !task.doneAt));
  const back = account ? `access/users/${account.id}` : "access/users";
  return <>
    <BackButton onClick={() => onNavigate(back)}>{account ? "Hồ sơ tài khoản" : "Danh sách tài khoản"}</BackButton>
    <section className="iam-section-head"><div><span className="eyebrow">THÔNG TIN ĐỊNH DANH</span><h2>{account ? "Chỉnh sửa tài khoản" : "Thêm tài khoản"}</h2></div></section>
    <section className="panel iam-account-form">
      {account ? <><p>Danh tính và cơ cấu lấy từ hồ sơ HR, không sửa tại IAM.</p><label><span>Nhân viên</span><input readOnly value={`${account.name} · ${account.employeeCode}`} /></label><label><span>Email công ty</span><input readOnly value={account.email} /></label><label><span>Chi nhánh / phòng ban</span><input readOnly value={`${account.branch} · ${account.department}`} /></label><label><span>Trạng thái tài khoản</span><select value={status} onChange={(event) => setStatus(event.target.value as AccountStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value} disabled={(value === "inactive" && Boolean(activeOffboarding)) || (value === "active" && Boolean(activeOnboarding))}>{label}</option>)}</select></label>{activeOffboarding && <p>Đang offboarding: dùng Tác vụ tài khoản để vô hiệu hóa đúng giờ và ghi kết quả cho HR.</p>}{activeOnboarding && <p>Đang onboarding: dùng Tác vụ tài khoản để kích hoạt và ghi kết quả cho HR.</p>}</> : <><p>Chỉ tạo tài khoản cho nhân viên đã có hồ sơ HR. Trường hợp service account chưa có flow trong demo.</p><label><span>Nhân viên chưa có tài khoản</span><select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}><option value="">Chọn nhân viên</option>{candidates.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.id} · {person.branch}</option>)}</select></label>{!candidates.length && <p>Tất cả nhân viên đang làm việc trong dữ liệu demo đã có tài khoản.</p>}</>}
      <div className="iam-form-actions"><button className="secondary-button" onClick={() => onNavigate(back)}>Hủy</button><button className="primary-button" disabled={!account && !employeeId} onClick={() => { const id = account ? (updateAccount(account.id, { status }) ? account.id : null) : createAccount(employeeId); if (!id) { toast.error("Không thể lưu tài khoản; kiểm tra hồ sơ hoặc xử lý onboarding/offboarding tại Tác vụ tài khoản."); return; } toast.success(account ? "Đã cập nhật trạng thái tài khoản demo." : "Đã tạo tài khoản chờ kích hoạt."); onNavigate(`access/users/${id}`); }}>Lưu tài khoản</button></div>
    </section>
  </>;
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
function InfoSection({ title, items }: { title: string; items: string[] }) { return <article><h3>{title}</h3><dl>{Array.from({ length: items.length / 2 }, (_, index) => <div key={items[index * 2]}><dt>{items[index * 2]}</dt><dd>{items[index * 2 + 1]}</dd></div>)}</dl></article>; }
