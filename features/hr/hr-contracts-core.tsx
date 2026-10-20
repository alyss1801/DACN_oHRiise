"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, FileCheck2, FilePlus2, Search } from "lucide-react";
import { toast } from "sonner";
import { WorkspaceHeader, StatusPill } from "@/features/employee/workspace-frame";
import { useSession } from "@/features/session/session-context";
import { canAccessScopedRecord } from "@/lib/authorization/engine";
import { useHrDemo } from "./hr-demo-context";
import { hrDate, hrToday } from "./hr-demo-data";

const base = "hr-contracts";
const documentLabel = { missing: "Thiếu bản ký", "paper-signed": "Chờ xác minh", verified: "Đã xác minh" };
const statusLabel = { draft: "Bản nháp", active: "Đang hiệu lực", expired: "Hết hạn" };

export function HrContractsCore({ moduleId, onNavigate }: { moduleId: string; onNavigate: (id: string) => void }) {
  const [, slug, employeeId] = moduleId.split("/");
  if (slug === "new" || slug === "renew") return <ContractForm sourceId={slug === "renew" ? employeeId : undefined} employeeId={slug === "new" ? employeeId : undefined} onNavigate={onNavigate} />;
  if (slug && slug !== "expiring") return <ContractDetail id={slug} onNavigate={onNavigate} />;
  return <ContractList key={slug ?? "all"} expiringOnly={slug === "expiring"} onNavigate={onNavigate} />;
}

function ContractList({ expiringOnly, onNavigate }: { expiringOnly: boolean; onNavigate: (id: string) => void }) {
  const { contracts, employees } = useHrDemo();
  const { session, can } = useSession();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(expiringOnly ? "expiring" : "");
  const [documentFilter, setDocumentFilter] = useState("");
  const [branch, setBranch] = useState("");
  const [department, setDepartment] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const scoped = contracts.filter((item) => {
    const person = employees.find((entry) => entry.id === item.employeeId);
    return person && canAccessScopedRecord(session, { employeeId: person.id, branch: person.branch, department: person.department });
  });
  const scopedPeople = employees.filter((person) => canAccessScopedRecord(session, { employeeId: person.id, branch: person.branch, department: person.department }));
  const visible = scoped.filter((item) => {
    const person = employees.find((entry) => entry.id === item.employeeId);
    const days = Math.ceil((new Date(item.endsAt).getTime() - new Date(hrToday()).getTime()) / 86400000);
    return `${item.id} ${person?.name ?? ""}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"))
      && (!branch || person?.branch === branch)
      && (!department || person?.department === department)
      && (!documentFilter || item.document === documentFilter)
      && (!status || (status === "expiring" ? item.status === "active" && days >= 0 && days <= 30 : status === "expired" ? item.status === "expired" || days < 0 : item.status === status));
  });
  const extraFilterCount = Number(Boolean(documentFilter)) + Number(Boolean(department));

  return <div className="page-stack hr-core hr-contract-list">
    <WorkspaceHeader title="Vòng đời hợp đồng" subtitle={`${visible.length} hợp đồng trong danh sách`} action={can("hr-contracts", "create") ? <button className="primary-button" onClick={() => onNavigate(`${base}/new`)}><FilePlus2 size={15} /> Tạo hợp đồng</button> : undefined} />
    <p className="hr-contract-caption">Bản ký giấy được HR xác minh thủ công trong demo; chưa có ký số hoặc kho tệp backend.</p>
    <section className="panel hr-directory hr-contract-directory">
      <div className="hr-directory-tools hr-contract-filters">
        <label className="compact-search"><Search size={16} aria-hidden="true" /><input aria-label="Tìm hợp đồng" placeholder="Tìm mã hoặc tên nhân viên" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <select aria-label="Trạng thái hợp đồng" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Mọi trạng thái</option><option value="active">Đang hiệu lực</option><option value="expiring">Sắp hết hạn (30 ngày)</option><option value="expired">Hết hạn</option><option value="draft">Bản nháp</option></select>
        <select aria-label="Chi nhánh" value={branch} onChange={(event) => setBranch(event.target.value)}><option value="">Mọi chi nhánh</option>{[...new Set(scopedPeople.map((item) => item.branch))].map((item) => <option key={item}>{item}</option>)}</select>
        <button type="button" className="secondary-button hr-contract-more" aria-expanded={showMoreFilters} onClick={() => setShowMoreFilters((current) => !current)}>Lọc thêm{extraFilterCount ? ` (${extraFilterCount})` : ""}</button>
      </div>
      {showMoreFilters && <div className="hr-contract-extra-filters"><select aria-label="Tình trạng tài liệu" value={documentFilter} onChange={(event) => setDocumentFilter(event.target.value)}><option value="">Mọi tài liệu</option><option value="missing">Thiếu bản ký</option><option value="paper-signed">Chờ xác minh</option><option value="verified">Đã xác minh</option></select><select aria-label="Phòng ban" value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">Mọi phòng ban</option>{[...new Set(scopedPeople.map((item) => item.department))].map((item) => <option key={item}>{item}</option>)}</select><button type="button" className="hr-contract-clear" disabled={!documentFilter && !department} onClick={() => { setDocumentFilter(""); setDepartment(""); }}>Xóa lọc thêm</button></div>}
      <div className="table-scroll"><table className="data-table hr-contract-table"><thead><tr><th>Hợp đồng</th><th>Nhân viên</th><th>Thời hạn</th><th>Tài liệu</th><th>Trạng thái</th><th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{visible.map((item) => {
        const person = employees.find((entry) => entry.id === item.employeeId);
        const days = Math.ceil((new Date(item.endsAt).getTime() - new Date(hrToday()).getTime()) / 86400000);
        return <tr key={item.id}><td><strong className="hr-contract-id">{item.id}</strong><small>{item.type}</small></td><td><strong>{person?.name}</strong><small>{person?.department} · {person?.branch}</small></td><td><span className="hr-contract-dates">{hrDate(item.startsAt)} – {hrDate(item.endsAt)}</span><small>{days < 0 ? "Đã quá hạn" : `Còn ${days} ngày`}</small></td><td>{documentLabel[item.document]}</td><td><StatusPill tone={item.status === "active" ? "success" : "neutral"}>{statusLabel[item.status]}</StatusPill></td><td><button className="row-action" onClick={() => onNavigate(`${base}/${item.id}`)}>Mở <ArrowRight size={13} /></button></td></tr>;
      })}</tbody></table></div>
      {!visible.length && <p className="hr-empty">Không có hợp đồng phù hợp bộ lọc.</p>}
    </section>
  </div>;
}

function ContractForm({ employeeId, sourceId, onNavigate }: { employeeId?: string; sourceId?: string; onNavigate: (id: string) => void }) {
  const { employees, contracts, createContract } = useHrDemo(); const { session, can } = useSession(); const source = contracts.find((item) => item.id === sourceId);
  const people = employees.filter((person) => canAccessScopedRecord(session, { employeeId: person.id, branch: person.branch, department: person.department }));
  const [form, setForm] = useState({ employeeId: employeeId ?? source?.employeeId ?? people[0]?.id ?? "", type: source?.type ?? "Xác định thời hạn", startsAt: source?.endsAt ?? hrToday(), endsAt: "", note: source ? `Gia hạn từ ${source.id}` : "", template: "Mẫu hợp đồng lao động hiện hành" });
  const [confirm, setConfirm] = useState(false); const allowed = can("hr-contracts", "create") && people.some((item) => item.id === form.employeeId); const valid = allowed && form.startsAt && form.endsAt > form.startsAt && form.note.trim().length >= 3;
  return <div className="page-stack hr-core"><button className="hr-back" onClick={() => onNavigate(source ? `${base}/${source.id}` : base)}><ArrowLeft size={15} /> Quay lại hợp đồng</button><WorkspaceHeader title={source ? `Gia hạn ${source.id}` : "Tạo hợp đồng"} subtitle="Chọn mẫu và thời gian, sau đó tạo bản nháp. Bản ký giấy phải được xác minh riêng." />
    <section className="panel hr-core-form"><div className="hr-form-grid"><label>Nhân viên<select disabled={Boolean(source)} value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })}>{people.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.id}</option>)}</select></label><label>Loại hợp đồng<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Xác định thời hạn</option><option>Không xác định thời hạn</option><option>Thử việc</option><option>Phụ lục hợp đồng</option></select></label><label>Ngày bắt đầu<input type="date" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></label><label>Ngày kết thúc<input type="date" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} /></label><label>Mẫu tài liệu<select value={form.template} onChange={(event) => setForm({ ...form, template: event.target.value })}><option>Mẫu hợp đồng lao động hiện hành</option><option>Mẫu thử việc</option><option>Mẫu phụ lục gia hạn</option></select></label><label>Ghi chú nghiệp vụ<input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Mục đích và thông tin cần kiểm tra" /></label></div><p className="hr-muted">Mẫu chỉ là nhãn tham chiếu demo; hệ thống không tạo văn bản pháp lý.</p>{confirm && <div className="hr-inline-confirm"><div><strong>Xác nhận tạo bản nháp?</strong><p>Hợp đồng chưa có hiệu lực cho đến khi xác minh bản ký giấy.</p></div><button className="secondary-button" onClick={() => setConfirm(false)}>Hủy</button><button className="primary-button" onClick={() => { const id = createContract({ employeeId: form.employeeId, type: form.type, startsAt: form.startsAt, endsAt: form.endsAt, status: "draft", document: "missing", ownerId: "OH-0091", note: `${form.note.trim()} · ${form.template}` }); toast.success("Đã tạo bản nháp hợp đồng demo."); onNavigate(`${base}/${id}`); }}>Xác nhận</button></div>}<div className="hr-form-footer"><span>Ngày kết thúc phải sau ngày bắt đầu; ghi chú tối thiểu 3 ký tự.</span><button className="primary-button" disabled={!valid || confirm} onClick={() => setConfirm(true)}>Tạo bản nháp</button></div></section></div>;
}

function ContractDetail({ id, onNavigate }: { id: string; onNavigate: (id: string) => void }) {
  const { contracts, employees, activities, markContractSigned, verifyContract } = useHrDemo(); const { session, can } = useSession(); const [tab, setTab] = useState("Thông tin"); const [confirm, setConfirm] = useState<"signed" | "verify" | "">("");
  const item = contracts.find((entry) => entry.id === id); const person = employees.find((entry) => entry.id === item?.employeeId);
  if (!item || !person || !canAccessScopedRecord(session, { employeeId: person.id, branch: person.branch, department: person.department })) return <p className="hr-empty">Không tìm thấy hợp đồng trong phạm vi được cấp.</p>;
  const days = Math.ceil((new Date(item.endsAt).getTime() - new Date(hrToday()).getTime()) / 86400000);
  return <div className="page-stack hr-core"><button className="hr-back" onClick={() => onNavigate(base)}><ArrowLeft size={15} /> Danh sách hợp đồng</button><section className="panel hr-profile-hero"><FileCheck2 size={28} /><div><span className="eyebrow">HỢP ĐỒNG · {item.id}</span><h2>{person.name}</h2><p>{item.type} · {person.department} · {person.branch}</p></div><StatusPill tone={item.status === "active" ? "success" : "neutral"}>{statusLabel[item.status]}</StatusPill>{can("hr-contracts", "create") && <button className="secondary-button" onClick={() => onNavigate(`${base}/renew/${id}`)}>Gia hạn</button>}</section>
    {days >= 0 && days <= 30 && <div className="hr-demo-note"><strong>Sắp hết hạn</strong><span>Còn {days} ngày. Gia hạn tạo hợp đồng mới, giữ bản cũ để đối chiếu.</span></div>}
    <nav className="hr-core-tabs" aria-label="Chi tiết hợp đồng">{["Thông tin", "Tài liệu", "Phiên bản", "Timeline"].map((name) => <button className={tab === name ? "active" : ""} onClick={() => setTab(name)} key={name}>{name}</button>)}</nav><section className="panel hr-profile-panel">{tab === "Thông tin" && <dl className="hr-profile-facts">{[["Nhân viên", person.name], ["Bắt đầu", hrDate(item.startsAt)], ["Kết thúc", hrDate(item.endsAt)], ["Còn lại", days < 0 ? "Quá hạn" : `${days} ngày`], ["Loại", item.type], ["Người phụ trách", employees.find((entry) => entry.id === item.ownerId)?.name ?? "HR"], ["Ghi chú", item.note]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}{tab === "Tài liệu" && <><h2>Đối chiếu bản ký giấy</h2><p>Trạng thái: <strong>{documentLabel[item.document]}</strong>. Tài liệu gốc được lưu ngoài bản demo; nút này chỉ ghi nhận xác nhận của HR, không tải tệp hoặc ký số.</p>{item.document === "missing" && can("hr-contracts", "edit") && <button className="secondary-button" onClick={() => setConfirm("signed")}>Ghi nhận bản ký giấy</button>}{item.document === "paper-signed" && can("hr-contracts", "approve") && <button className="primary-button" onClick={() => setConfirm("verify")}>Xác minh và kích hoạt</button>}{item.document === "paper-signed" && !can("hr-contracts", "approve") && <p>Chờ HR Tổng xác minh và kích hoạt.</p>}</>}{tab === "Phiên bản" && <div className="hr-activity-list">{contracts.filter((entry) => entry.employeeId === person.id).sort((a, b) => b.startsAt.localeCompare(a.startsAt)).map((entry) => <div key={entry.id}><i /><span><strong>v{entry.version} · {entry.id} · {entry.type}</strong><small>{hrDate(entry.startsAt)} – {hrDate(entry.endsAt)} · {statusLabel[entry.status]}</small></span></div>)}</div>}{tab === "Timeline" && <div className="hr-activity-list">{activities.filter((entry) => entry.employeeId === person.id && entry.text.includes(id)).map((entry) => <div key={entry.id}><i /><span><strong>{entry.text}</strong><small>{entry.actor} · {new Date(entry.at).toLocaleString("vi-VN")}</small></span></div>)}{!activities.some((entry) => entry.employeeId === person.id && entry.text.includes(id)) && <p>Chưa có sự kiện xử lý mới trong bản demo.</p>}</div>}</section>
    {confirm && <section className="panel hr-inline-confirm"><div><strong>{confirm === "signed" ? "Xác nhận đã nhận bản ký giấy?" : "Xác nhận HR đã đối chiếu bản ký?"}</strong><p>{confirm === "signed" ? "Chỉ cập nhật trạng thái demo, không lưu tệp." : "Hợp đồng sẽ chuyển sang hiệu lực trong dữ liệu demo."}</p></div><button className="secondary-button" onClick={() => setConfirm("")}>Hủy</button><button className="primary-button" onClick={() => { if (confirm === "signed") markContractSigned(id); else verifyContract(id); setConfirm(""); toast.success("Đã cập nhật vòng đời hợp đồng demo."); }}>Xác nhận</button></section>}</div>;
}
