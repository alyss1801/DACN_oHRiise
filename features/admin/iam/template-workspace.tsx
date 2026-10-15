"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronRight, Copy, Eye, LockKeyhole, Pencil, Plus, Search, ShieldCheck, ToggleLeft, ToggleRight, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIam } from "./iam-context";
import { permissionCatalog, scopeLabels } from "./mock-data";
import { BackButton, EmptyState, TemplateChip } from "./iam-ui";
import type { ScopeType } from "./types";

export function TemplateWorkspace({ moduleId, onNavigate }: { moduleId: string; onNavigate: (id: string) => void }) {
  const parts = moduleId.split("/");
  const templateId = parts[2];
  const mode = parts[3];
  if (!templateId) return <TemplateDirectory onNavigate={onNavigate} />;
  if (templateId === "new" || mode === "edit") return <TemplateEditor templateId={templateId === "new" ? undefined : templateId} review={mode === "review" || parts[3] === "review" || parts[4] === "review"} onNavigate={onNavigate} />;
  if (mode === "review") return <TemplateEditor templateId={templateId} review onNavigate={onNavigate} />;
  return <TemplateDetail templateId={templateId} onNavigate={onNavigate} />;
}

function TemplateDirectory({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { templates, startTemplateDraft } = useIam();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const visible = templates.filter((item) => `${item.name} ${item.code} ${item.description}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")) && (!type || item.type === type));
  return <>
    <section className="iam-section-head"><div><span className="eyebrow">THƯ VIỆN MẪU QUYỀN</span><h2>Vai trò & mẫu quyền</h2><p>Tạo các khối quyền có thể tái sử dụng và theo dõi tác động trên tài khoản.</p></div><button className="primary-button" onClick={() => { startTemplateDraft(); onNavigate("access/templates/new"); }}><Plus size={15} /> Tạo mẫu quyền</button></section>
    <section className="panel iam-template-directory"><div className="iam-directory-toolbar"><div className="iam-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm tên hoặc mã mẫu quyền..." /></div><select className="filter-select" value={type} onChange={(e) => setType(e.target.value)}><option value="">Tất cả loại mẫu</option><option value="system">Mẫu hệ thống</option><option value="custom">Mẫu tùy chỉnh</option></select><span>{visible.length} mẫu quyền</span></div><div className="iam-template-grid">{visible.map((template) => <button key={template.id} onClick={() => onNavigate(`access/templates/${template.id}`)}><div className="iam-template-card-top"><span className={cn("iam-template-symbol", template.type)}><ShieldCheck size={18} /></span><TemplateChip template={template} /></div><h3>{template.name}</h3><p>{template.description}</p><div className="iam-template-card-stats"><span><strong>{template.permissionCodes.length}</strong> quyền</span><span><strong>{template.usageCount}</strong> tài khoản</span><span><strong>v{template.version}</strong> phiên bản</span></div><footer><span>Cập nhật {template.updatedAt}</span><span className={cn("iam-template-state", template.status)}>{template.status === "active" ? "Đang dùng" : "Tạm tắt"}</span></footer></button>)}</div>{visible.length === 0 && <EmptyState title="Không tìm thấy mẫu quyền" description="Thử thay đổi từ khóa hoặc bộ lọc loại mẫu." />}</section>
  </>;
}

function TemplateDetail({ templateId, onNavigate }: { templateId: string; onNavigate: (id: string) => void }) {
  const { templates, accounts, auditEvents, startTemplateDraft, cloneTemplate, toggleTemplateStatus } = useIam();
  const template = templates.find((item) => item.id === templateId);
  if (!template) return <EmptyState title="Không tìm thấy mẫu quyền" description="Mẫu quyền có thể đã được thay đổi trong phiên demo." />;
  const assigned = accounts.filter((account) => account.templateIds.includes(template.id));
  const modules = Array.from(new Set(template.permissionCodes.map((code) => permissionCatalog.find((item) => item.code === code)?.module).filter(Boolean)));
  const events = auditEvents.filter((item) => item.templateId === template.id);
  return <>
    <BackButton onClick={() => onNavigate("access/templates")}>Thư viện mẫu quyền</BackButton>
    <section className="iam-template-detail-hero panel"><span className={cn("iam-template-symbol", template.type)}><ShieldCheck size={22} /></span><div><span className="mono">{template.code} · v{template.version}</span><h2>{template.name}</h2><p>{template.description}</p></div><div className="iam-profile-actions"><button className="secondary-button" onClick={() => { const id = cloneTemplate(template.id); if (id) { toast.success("Đã nhân bản mẫu quyền."); onNavigate(`access/templates/${id}`); } }}><Copy size={15} /> Nhân bản mẫu</button><button className="primary-button" onClick={() => { startTemplateDraft(template.id); onNavigate(`access/templates/${template.id}/edit`); }}><Pencil size={15} /> Chỉnh sửa mẫu</button></div></section>
    <section className="iam-template-facts"><div><span>Loại mẫu</span><strong>{template.type === "system" ? "Hệ thống" : "Tùy chỉnh"}</strong></div><div><span>Quyền được chọn</span><strong>{template.permissionCodes.length}</strong></div><div><span>Tài khoản áp dụng</span><strong>{template.usageCount}</strong></div><div><span>Phạm vi tương thích</span><strong>{template.scopeCompatibility.map((item) => scopeLabels[item]).join(", ")}</strong></div></section>
    <div className="iam-profile-grid"><section className="panel"><div className="iam-panel-head"><div><span className="eyebrow">PERMISSION CATALOG</span><h3>Quyền trong mẫu</h3></div><span className={cn("iam-template-state", template.status)}>{template.status === "active" ? "Đang dùng" : "Tạm tắt"}</span></div><div className="iam-permission-groups">{modules.map((module) => <article key={module}><h4>{module}</h4>{template.permissionCodes.filter((code) => permissionCatalog.find((item) => item.code === code)?.module === module).map((code) => { const permission = permissionCatalog.find((item) => item.code === code)!; return <div key={code}><Check size={15} /><span><strong>{permission.name}</strong><code>{permission.code}</code></span>{template.lockedCodes.includes(code) && <small><LockKeyhole size={12} /> Được bảo vệ</small>}</div>; })}</article>)}</div></section><aside className="page-stack"><section className="panel"><div className="iam-panel-head"><div><span className="eyebrow">TÀI KHOẢN SỬ DỤNG</span><h3>{template.usageCount} tài khoản</h3></div><UsersRound size={18} /></div><div className="iam-mini-people">{assigned.slice(0, 5).map((account) => <button key={account.id} onClick={() => onNavigate(`access/users/${account.id}`)}><span className="iam-avatar compact">{account.initials}</span><span><strong>{account.name}</strong><small>{account.department}</small></span><ChevronRight size={14} /></button>)}</div><button className="text-button" onClick={() => onNavigate("access/users")}><Eye size={14} /> Xem tài khoản đang sử dụng</button></section>{template.type === "custom" && <section className="panel iam-template-toggle"><div><strong>Trạng thái mẫu</strong><p>Tạm tắt ngăn gán mới; quyền đã lưu của tài khoản vẫn được giữ trong bản demo.</p></div><button onClick={() => toggleTemplateStatus(template.id)}>{template.status === "active" ? <ToggleRight size={30} /> : <ToggleLeft size={30} />} {template.status === "active" ? "Đang bật" : "Đang tắt"}</button></section>}<section className="panel"><span className="eyebrow">LỊCH SỬ KIỂM TOÁN</span><div className="iam-compact-audit">{events.length ? events.map((event) => <div key={event.id}><strong>{event.action}</strong><span>{event.actor} · {event.timestamp}</span></div>) : <p>Chưa có thay đổi được ghi nhận.</p>}</div></section></aside></div>
  </>;
}

function TemplateEditor({ templateId, review, onNavigate }: { templateId?: string; review: boolean; onNavigate: (id: string) => void }) {
  const { templates, accounts, templateDraft, startTemplateDraft, updateTemplateDraft, discardTemplateDraft, saveTemplateDraft } = useIam();
  useEffect(() => {
    if (!templateDraft) startTemplateDraft(templateId);
    // Draft initialization is required for direct deep links.
  }, [startTemplateDraft, templateDraft, templateId]);
  const [activeModule, setActiveModule] = useState(permissionCatalog[0].module);
  const source = templates.find((item) => item.id === (templateDraft?.id ?? templateId));
  const modules = Array.from(new Set(permissionCatalog.map((item) => item.module)));
  const affected = source?.usageCount ?? 0;
  const changes = useMemo(() => {
    if (!templateDraft) return { added: [], removed: [], unchanged: [] };
    const baseline = source?.permissionCodes ?? [];
    return { added: templateDraft.permissionCodes.filter((code) => !baseline.includes(code)), removed: baseline.filter((code) => !templateDraft.permissionCodes.includes(code)), unchanged: templateDraft.permissionCodes.filter((code) => baseline.includes(code)) };
  }, [source, templateDraft]);
  if (!templateDraft) return <div className="iam-no-results">Đang chuẩn bị trình chỉnh sửa…</div>;
  const routeBase = templateId ? `access/templates/${templateId}` : "access/templates/new";

  if (review) return <>
    <BackButton onClick={() => onNavigate(`${routeBase}${templateId ? "/edit" : ""}`)}>Quay lại chỉnh sửa</BackButton>
    <section className="iam-section-head"><div><span className="eyebrow">REVIEW & APPLY</span><h2>Xác nhận thay đổi mẫu quyền</h2><p>Đối chiếu tác động trước khi cập nhật quyền hiệu lực của các tài khoản liên quan.</p></div></section>
    {affected > 0 && <div className="iam-impact-banner"><AlertTriangle size={20} /><div><strong>Thay đổi này có thể ảnh hưởng đến {affected} tài khoản.</strong><p>Các tài khoản dùng chung mẫu sẽ nhận phiên bản mới sau khi xác nhận.</p></div></div>}
    <section className="iam-review-grid"><article className="panel"><h3>Thông tin mẫu</h3><dl className="iam-definition-grid"><div><dt>Tên mẫu</dt><dd>{templateDraft.name}</dd></div><div><dt>Mã mẫu</dt><dd className="mono">{templateDraft.code}</dd></div><div><dt>Loại</dt><dd>{templateDraft.type === "system" ? "Hệ thống" : "Tùy chỉnh"}</dd></div><div><dt>Phạm vi</dt><dd>{templateDraft.scopeCompatibility.map((item) => scopeLabels[item]).join(", ")}</dd></div></dl></article><article className="panel iam-review-diff"><DiffList title="Quyền được thêm" codes={changes.added} tone="added" /><DiffList title="Quyền bị gỡ" codes={changes.removed} tone="removed" /><DiffList title="Không thay đổi" codes={changes.unchanged} tone="same" /></article></section>
    {source?.type === "system" && <div className="iam-protected-note"><LockKeyhole size={18} /><span>Các quyền nền tảng được khóa vẫn được giữ nguyên. Mẫu System Admin không thể mất quyền quản trị thiết yếu.</span></div>}
    <div className="iam-review-actions"><button className="secondary-button" onClick={() => onNavigate(`${routeBase}${templateId ? "/edit" : ""}`)}>Quay lại chỉnh sửa</button><button className="primary-button" onClick={() => { const id = saveTemplateDraft(); if (id) { toast.success("Đã lưu mẫu quyền và cập nhật quyền hiệu lực."); onNavigate(`access/templates/${id}`); } }}>Xác nhận & lưu mẫu</button></div>
  </>;

  const togglePermission = (code: string) => {
    if (templateDraft.lockedCodes.includes(code)) return;
    const selected = templateDraft.permissionCodes.includes(code);
    let next = selected ? templateDraft.permissionCodes.filter((item) => item !== code) : [...templateDraft.permissionCodes, code];
    const permission = permissionCatalog.find((item) => item.code === code);
    if (!selected && permission?.dependency && !next.includes(permission.dependency)) next = [...next, permission.dependency];
    updateTemplateDraft({ permissionCodes: next });
  };
  const affectedUsers = source ? accounts.filter((account) => account.templateIds.includes(source.id)).slice(0, 4) : [];
  return <>
    <BackButton onClick={() => { discardTemplateDraft(); onNavigate(templateId ? `access/templates/${templateId}` : "access/templates"); }}>Thư viện mẫu quyền</BackButton>
    <section className="iam-section-head"><div><span className="eyebrow">TEMPLATE BUILDER</span><h2>{templateId ? `Chỉnh sửa ${source?.name ?? "mẫu quyền"}` : "Tạo mẫu quyền"}</h2><p>Thiết lập thông tin, quyền chức năng và phạm vi dữ liệu tương thích.</p></div><div className="iam-stepper"><span className="done">1 · Thông tin</span><span className="active">2 · Chọn quyền</span><span>3 · Xem trước</span></div></section>
    {affected > 0 && <div className="iam-impact-banner compact"><AlertTriangle size={18} /><span>Thay đổi có thể ảnh hưởng đến <strong>{affected} tài khoản</strong> đang dùng mẫu này.</span></div>}
    <section className="iam-template-editor-layout">
      <aside className="panel iam-template-metadata"><span className="eyebrow">THÔNG TIN MẪU</span><label><span>Tên mẫu quyền</span><input value={templateDraft.name} onChange={(e) => updateTemplateDraft({ name: e.target.value })} placeholder="Ví dụ: Project Reviewer" /></label><label><span>Mã mẫu</span><input className="mono" value={templateDraft.code} disabled={templateDraft.type === "system" && Boolean(templateId)} onChange={(e) => updateTemplateDraft({ code: e.target.value.toUpperCase().replace(/\s+/g, "_") })} /></label><label><span>Mô tả</span><textarea rows={5} value={templateDraft.description} onChange={(e) => updateTemplateDraft({ description: e.target.value })} /></label><label><span>Loại mẫu</span><select value={templateDraft.type} disabled={Boolean(templateId)} onChange={(e) => updateTemplateDraft({ type: e.target.value as "system" | "custom" })}><option value="custom">Tùy chỉnh</option><option value="system">Hệ thống</option></select></label><label><span>Trạng thái</span><select value={templateDraft.status} onChange={(e) => updateTemplateDraft({ status: e.target.value as "active" | "inactive" })}><option value="active">Đang hoạt động</option><option value="inactive">Tạm tắt</option></select></label></aside>
      <section className="panel iam-catalog-editor"><div className="iam-catalog-nav">{modules.map((module) => <button key={module} className={activeModule === module ? "is-active" : ""} onClick={() => setActiveModule(module)}>{module}<span>{templateDraft.permissionCodes.filter((code) => permissionCatalog.find((item) => item.code === code)?.module === module).length}</span></button>)}</div><div className="iam-catalog-list"><div className="iam-panel-head"><div><span className="eyebrow">DANH MỤC QUYỀN</span><h3>{activeModule}</h3></div><span>{permissionCatalog.filter((item) => item.module === activeModule).length} quyền</span></div>{permissionCatalog.filter((item) => item.module === activeModule).map((permission) => { const selected = templateDraft.permissionCodes.includes(permission.code); const locked = templateDraft.lockedCodes.includes(permission.code); return <label key={permission.code} className={cn(selected && "selected", locked && "locked")}><input type="checkbox" checked={selected} disabled={locked} onChange={() => togglePermission(permission.code)} /><span className="iam-checkbox">{selected && <Check size={14} />}</span><span><strong>{permission.name}{locked && <LockKeyhole size={13} />}</strong><code>{permission.code}</code><small>{permission.description}</small>{permission.dependency && <em>Yêu cầu: {permission.dependency}</em>}</span></label>; })}</div></section>
      <aside className="panel iam-selection-summary"><span className="eyebrow">TÓM TẮT</span><strong className="iam-big-number">{templateDraft.permissionCodes.length}</strong><p>quyền đã chọn trong {new Set(templateDraft.permissionCodes.map((code) => permissionCatalog.find((item) => item.code === code)?.module)).size} module.</p><h4>Phạm vi tương thích</h4><div className="iam-scope-checks">{Object.entries(scopeLabels).map(([value, label]) => <label key={value}><input type="checkbox" checked={templateDraft.scopeCompatibility.includes(value as ScopeType)} onChange={(e) => updateTemplateDraft({ scopeCompatibility: e.target.checked ? [...templateDraft.scopeCompatibility, value as ScopeType] : templateDraft.scopeCompatibility.filter((item) => item !== value) })} />{label}</label>)}</div>{affectedUsers.length > 0 && <><h4>Tài khoản bị ảnh hưởng</h4><div className="iam-affected-users">{affectedUsers.map((account) => <span key={account.id}>{account.name}</span>)}</div></>}<button className="primary-button wide" disabled={!templateDraft.name || !templateDraft.code || templateDraft.permissionCodes.length === 0} onClick={() => onNavigate(`${routeBase}/review`)}>Xem trước thay đổi</button></aside>
    </section>
  </>;
}

function DiffList({ title, codes, tone }: { title: string; codes: string[]; tone: string }) { return <section className={tone}><h4>{title}<span>{codes.length}</span></h4>{codes.slice(0, 8).map((code) => <div key={code}><code>{code}</code><span>{permissionCatalog.find((item) => item.code === code)?.name}</span></div>)}{codes.length === 0 && <p>Không có thay đổi.</p>}</section>; }
