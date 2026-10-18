"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, ClipboardCheck, Filter, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useIam } from "./iam-context";
import { BackButton, EmptyState, Person, TemplateChip } from "./iam-ui";
import type { AccessReview, ReviewDecision } from "./types";

const base = "access/reviews";
const today = () => new Date().toISOString().slice(0, 10);
const dateLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("vi-VN");
const reviewState = (review: AccessReview) => review.status === "completed" ? "Đã hoàn tất" : review.dueDate < today() ? "Quá hạn" : "Đang rà soát";

export function ReviewWorkspace({ moduleId, onNavigate }: { moduleId: string; onNavigate: (id: string) => void }) {
  const part = moduleId.split("/")[2];
  if (part === "new") return <NewReview onNavigate={onNavigate} />;
  if (part) return <ReviewDetail id={part} onNavigate={onNavigate} />;
  return <ReviewDirectory onNavigate={onNavigate} />;
}

function ReviewDirectory({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { accessReviews, accounts, templates } = useIam();
  const [query, setQuery] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [filters, setFilters] = useState({ status: "", branch: "", department: "", reviewer: "", template: "", decision: "", dueFrom: "", dueTo: "" });
  const setFilter = (key: keyof typeof filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const options = (key: "branch" | "department") => [...new Set(accounts.map((item) => item[key]))].sort();
  const visible = useMemo(() => accessReviews.filter((review) => {
    const reviewer = accounts.find((item) => item.id === review.reviewerId);
    if (!`${review.title} ${reviewer?.name ?? ""}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"))) return false;
    if (filters.status && (filters.status === "overdue" ? review.status === "completed" || review.dueDate >= today() : filters.status !== review.status || (filters.status === "open" && review.dueDate < today()))) return false;
    if (filters.branch && review.branch !== filters.branch) return false;
    if (filters.department && review.department !== filters.department) return false;
    if (filters.reviewer && review.reviewerId !== filters.reviewer) return false;
    if (filters.template && !review.items.some((item) => item.templateId === filters.template)) return false;
    if (filters.decision && !review.items.some((item) => (item.decision ?? "pending") === filters.decision)) return false;
    if (filters.dueFrom && review.dueDate < filters.dueFrom) return false;
    if (filters.dueTo && review.dueDate > filters.dueTo) return false;
    return true;
  }).sort((a, b) => a.status === b.status ? a.dueDate.localeCompare(b.dueDate) : a.status === "open" ? -1 : 1), [accessReviews, accounts, filters, query]);
  const selected = Object.entries(filters).filter(([, value]) => value);
  const select = (key: keyof typeof filters, label: string, choices: { value: string; label: string }[]) => <label key={key}><span>{label}</span><select value={filters[key]} onChange={(event) => setFilter(key, event.target.value)}><option value="">Tất cả</option>{choices.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</select></label>;
  const plain = (values: string[]) => values.map((value) => ({ value, label: value }));
  const counts = { open: accessReviews.filter((item) => item.status === "open").length, overdue: accessReviews.filter((item) => item.status === "open" && item.dueDate < today()).length, pending: accessReviews.flatMap((item) => item.status === "open" ? item.items : []).filter((item) => !item.decision).length };
  return <>
    <section className="iam-section-head"><div><span className="eyebrow">ACCESS CERTIFICATION</span><h2>Rà soát truy cập</h2><p>Chứng nhận quyền theo đợt, ghi nhận quyết định và theo dõi các đề xuất thu hồi.</p></div><button className="primary-button" onClick={() => onNavigate(`${base}/new`)}><Plus size={15} /> Tạo đợt rà soát</button></section>
    <section className="iam-summary-strip"><div><span>Tổng đợt</span><strong>{accessReviews.length}</strong></div><div><span>Đang rà soát</span><strong>{counts.open}</strong></div><div><span>Quá hạn</span><strong>{counts.overdue}</strong></div><div><span>Quyền chờ quyết định</span><strong>{counts.pending}</strong></div></section>
    <section className="panel iam-directory"><div className="iam-directory-toolbar"><div className="iam-search"><Search size={16} /><input aria-label="Tìm đợt rà soát" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên đợt hoặc người rà soát..." /></div><button className="secondary-button" aria-expanded={advanced} onClick={() => setAdvanced((value) => !value)}><Filter size={15} /> Bộ lọc chi tiết {selected.length > 0 && <b>{selected.length}</b>}</button></div>
      {advanced && <div className="iam-filter-grid iam-governance-filters">
        {select("status", "Trạng thái", [{ value: "open", label: "Đang rà soát" }, { value: "overdue", label: "Quá hạn" }, { value: "completed", label: "Đã hoàn tất" }])}
        {select("branch", "Chi nhánh", plain(options("branch")))}{select("department", "Phòng ban", plain(options("department")))}
        {select("reviewer", "Người rà soát", accounts.map((item) => ({ value: item.id, label: item.name })))}
        {select("template", "Mẫu quyền", templates.map((item) => ({ value: item.id, label: item.name })))}
        {select("decision", "Quyết định", [{ value: "pending", label: "Chưa quyết định" }, { value: "keep", label: "Giữ quyền" }, { value: "revoke", label: "Đề xuất thu hồi" }])}
        <label><span>Hạn từ ngày</span><input type="date" value={filters.dueFrom} onChange={(event) => setFilter("dueFrom", event.target.value)} /></label>
        <label><span>Hạn đến ngày</span><input type="date" value={filters.dueTo} onChange={(event) => setFilter("dueTo", event.target.value)} /></label>
      </div>}
      {selected.length > 0 && <div className="iam-filter-chips">{selected.map(([key, value]) => <button key={key} onClick={() => setFilter(key as keyof typeof filters, "")}>{key === "reviewer" ? accounts.find((item) => item.id === value)?.name : key === "template" ? templates.find((item) => item.id === value)?.name : value}<X size={13} /></button>)}<button className="clear" onClick={() => setFilters({ status: "", branch: "", department: "", reviewer: "", template: "", decision: "", dueFrom: "", dueTo: "" })}>Xóa bộ lọc</button></div>}
      <div className="iam-result-meta"><strong>{visible.length} đợt rà soát</strong><span>Quyết định được lưu trong phiên demo</span></div>
      <div className="iam-governance-list">{visible.map((review) => { const done = review.items.filter((item) => item.decision).length; const reviewer = accounts.find((item) => item.id === review.reviewerId); return <button key={review.id} className="iam-governance-row" onClick={() => onNavigate(`${base}/${review.id}`)}><span className="iam-governance-icon"><ClipboardCheck size={18} /></span><span className="iam-governance-main"><strong>{review.title}</strong><small>{review.branch || "Mọi chi nhánh"} · {review.department || "Mọi phòng ban"} · {reviewer?.name ?? "Chưa xác định"}</small></span><span className="iam-governance-progress"><strong>{done}/{review.items.length}</strong><small>quyền đã xử lý</small><i style={{ width: `${review.items.length ? done / review.items.length * 100 : 0}%` }} /></span><span className={`iam-governance-state ${review.status === "completed" ? "done" : review.dueDate < today() ? "late" : ""}`}>{reviewState(review)}<small>Hạn {dateLabel(review.dueDate)}</small></span><ChevronRight size={16} /></button>; })}</div>
      {visible.length === 0 && <EmptyState title="Không có đợt phù hợp" description="Thử thay đổi từ khóa hoặc xóa bớt bộ lọc." />}
    </section>
  </>;
}

function NewReview({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { accounts, templates, createAccessReview } = useIam();
  const [title, setTitle] = useState("");
  const [reviewerId, setReviewerId] = useState("");
  const [branch, setBranch] = useState("");
  const [department, setDepartment] = useState("");
  const [dueDate, setDueDate] = useState("");
  const candidates = accounts.filter((item) => item.status === "active" && (!branch || item.branch === branch) && (!department || item.department === department));
  const items = candidates.flatMap((account) => account.templateIds.filter((id) => id !== "tpl-employee").map((templateId) => ({ id: `${account.id}-${templateId}`, accountId: account.id, templateId })));
  const create = () => {
    if (!title.trim() || !reviewerId || !dueDate || dueDate < today() || !items.length) return;
    const id = createAccessReview({ title: title.trim(), reviewerId, branch, department, dueDate, items });
    toast.success("Đã tạo đợt rà soát trong dữ liệu demo."); onNavigate(`${base}/${id}`);
  };
  return <><BackButton onClick={() => onNavigate(base)}>Danh sách rà soát</BackButton><section className="iam-section-head"><div><span className="eyebrow">ĐỢT RÀ SOÁT MỚI</span><h2>Thiết lập phạm vi rà soát</h2><p>Các quyền từ mẫu đang gán cho tài khoản hoạt động được chụp làm danh sách cần chứng nhận.</p></div></section>
    <section className="panel iam-governance-form"><div className="iam-governance-form-grid"><label><span>Tên đợt rà soát *</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Rà soát quyền quý IV" /></label><label><span>Người rà soát *</span><select value={reviewerId} onChange={(event) => setReviewerId(event.target.value)}><option value="">Chọn người rà soát</option>{accounts.filter((item) => item.status === "active").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>Chi nhánh</span><select value={branch} onChange={(event) => setBranch(event.target.value)}><option value="">Tất cả chi nhánh</option>{[...new Set(accounts.map((item) => item.branch))].map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Phòng ban</span><select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">Tất cả phòng ban</option>{[...new Set(accounts.map((item) => item.department))].map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Hạn hoàn tất *</span><input type="date" min={today()} value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label></div><div className="iam-governance-preview"><strong>{candidates.length} tài khoản · {items.length} quyền trong phạm vi</strong><p>{items.length ? `Bao gồm ${[...new Set(items.map((item) => templates.find((template) => template.id === item.templateId)?.name))].filter(Boolean).join(", ")}.` : "Chưa có quyền từ mẫu nào trong phạm vi đã chọn. Hãy mở rộng bộ lọc."}</p></div><div className="iam-form-actions"><button className="secondary-button" onClick={() => onNavigate(base)}>Hủy</button><button className="primary-button" disabled={!title.trim() || !reviewerId || !dueDate || dueDate < today() || !items.length} onClick={create}>Tạo đợt rà soát</button></div></section>
  </>;
}

function ReviewDetail({ id, onNavigate }: { id: string; onNavigate: (id: string) => void }) {
  const { accessReviews, accounts, templates, decideReviewItem, completeAccessReview } = useIam();
  const review = accessReviews.find((item) => item.id === id);
  const [query, setQuery] = useState("");
  const [decisionFilter, setDecisionFilter] = useState("");
  const [templateFilter, setTemplateFilter] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);
  if (!review) return <><BackButton onClick={() => onNavigate(base)}>Danh sách rà soát</BackButton><EmptyState title="Không tìm thấy đợt rà soát" description="Đường dẫn này không tồn tại trong dữ liệu demo." /></>;
  const visible = review.items.filter((item) => { const account = accounts.find((person) => person.id === item.accountId); return `${account?.name ?? ""} ${account?.employeeCode ?? ""}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")) && (!decisionFilter || (item.decision ?? "pending") === decisionFilter) && (!templateFilter || item.templateId === templateFilter); });
  const decided = review.items.filter((item) => item.decision).length;
  const revokes = review.items.filter((item) => item.decision === "revoke").length;
  const record = (itemId: string, decision: ReviewDecision) => { decideReviewItem(id, itemId, decision, notes[itemId] ?? review.items.find((item) => item.id === itemId)?.note ?? ""); toast.success(decision === "keep" ? "Đã ghi nhận giữ quyền." : "Đã ghi nhận đề xuất thu hồi."); };
  return <><BackButton onClick={() => onNavigate(base)}>Danh sách rà soát</BackButton><section className="iam-section-head"><div><span className="eyebrow">CHI TIẾT RÀ SOÁT</span><h2>{review.title}</h2><p>Người rà soát: {accounts.find((item) => item.id === review.reviewerId)?.name ?? "—"} · Hạn {dateLabel(review.dueDate)} · {reviewState(review)}</p></div></section>
    <section className="iam-summary-strip"><div><span>Tổng quyền</span><strong>{review.items.length}</strong></div><div><span>Đã quyết định</span><strong>{decided}</strong></div><div><span>Chờ xử lý</span><strong>{review.items.length - decided}</strong></div><div><span>Đề xuất thu hồi</span><strong>{revokes}</strong></div></section>
    <section className="panel iam-directory"><div className="iam-directory-toolbar"><div className="iam-search"><Search size={16} /><input aria-label="Tìm nhân sự trong đợt" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm nhân sự hoặc mã nhân viên..." /></div><select className="filter-select" aria-label="Lọc theo quyết định" value={decisionFilter} onChange={(event) => setDecisionFilter(event.target.value)}><option value="">Mọi quyết định</option><option value="pending">Chưa quyết định</option><option value="keep">Giữ quyền</option><option value="revoke">Đề xuất thu hồi</option></select><select className="filter-select" aria-label="Lọc theo mẫu quyền" value={templateFilter} onChange={(event) => setTemplateFilter(event.target.value)}><option value="">Mọi mẫu quyền</option>{[...new Set(review.items.map((item) => item.templateId))].map((templateId) => <option key={templateId} value={templateId}>{templates.find((item) => item.id === templateId)?.name ?? templateId}</option>)}</select></div><div className="iam-result-meta"><strong>{visible.length} quyền phù hợp</strong><button className="text-button" onClick={() => { setQuery(""); setDecisionFilter(""); setTemplateFilter(""); }}>Xóa bộ lọc</button></div>
      <div className="iam-review-items">{visible.map((item) => { const account = accounts.find((person) => person.id === item.accountId); const template = templates.find((entry) => entry.id === item.templateId); return <article key={item.id}><div className="iam-review-item-main"><div>{account ? <Person account={account} compact /> : <strong>Tài khoản không còn tồn tại</strong>}<span>{account?.branch} · {account?.department}</span></div><div>{template ? <TemplateChip template={template} /> : <span>Mẫu quyền đã xóa</span>}<small>{template?.description}</small></div><span className={`iam-governance-state ${item.decision === "keep" ? "done" : item.decision === "revoke" ? "late" : ""}`}>{item.decision === "keep" ? "Giữ quyền" : item.decision === "revoke" ? "Đề xuất thu hồi" : "Chờ quyết định"}</span></div><div className="iam-review-item-actions"><label><span>Ghi chú quyết định</span><input disabled={review.status === "completed"} value={notes[item.id] ?? item.note ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Lý do hoặc bối cảnh (khuyến nghị khi thu hồi)" /></label>{review.status === "open" && <div><button className="secondary-button" onClick={() => record(item.id, "keep")}><Check size={14} /> Giữ quyền</button><button className="secondary-button" onClick={() => record(item.id, "revoke")}>Đề xuất thu hồi</button></div>}</div></article>; })}</div>{visible.length === 0 && <EmptyState title="Không có quyền phù hợp" description="Thử đổi bộ lọc trong đợt rà soát." />}</section>
    <section className="panel iam-governance-close"><div><strong>{review.status === "completed" ? "Đợt rà soát đã hoàn tất" : `Đã xử lý ${decided}/${review.items.length} quyền`}</strong><p>Đề xuất thu hồi chỉ là kết quả rà soát trong demo, không tự thay đổi phân quyền tài khoản hay quyền ở backend.</p></div>{review.status === "open" && <button className="primary-button" disabled={decided !== review.items.length} onClick={() => setConfirm(true)}>Hoàn tất rà soát</button>}</section>
    {confirm && <section className="iam-inline-confirm"><ClipboardCheck size={20} /><div><strong>Xác nhận hoàn tất đợt rà soát?</strong><p>{revokes} đề xuất thu hồi cần được xử lý riêng trong trang Phân quyền cá nhân.</p></div><button className="secondary-button" onClick={() => setConfirm(false)}>Quay lại</button><button className="primary-button" onClick={() => { if (completeAccessReview(id)) { setConfirm(false); toast.success("Đã hoàn tất rà soát và lưu lịch sử demo."); } }}>Xác nhận hoàn tất</button></section>}
  </>;
}
