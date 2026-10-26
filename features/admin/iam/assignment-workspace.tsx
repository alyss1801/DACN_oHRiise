"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, ChevronDown, ChevronRight, GripVertical, LockKeyhole, Search, ShieldCheck, Trash2, UserRoundPlus, UsersRound, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIam } from "./iam-context";
import { permissionCatalog, scopeLabels } from "./mock-data";
import { BackButton, Person, StatusChip, TemplateChip } from "./iam-ui";
import type { PermissionOverride, ScopeType } from "./types";

export function AssignmentWorkspace({ moduleId, onNavigate }: { moduleId: string; onNavigate: (id: string) => void }) {
  const parts = moduleId.split("/");
  const accountId = parts[2];
  const mode = parts[3];
  if (accountId && mode === "review") return <AssignmentReview accountId={accountId} onNavigate={onNavigate} />;
  if (accountId && mode === "saved") return <AssignmentSuccess accountId={accountId} onNavigate={onNavigate} />;
  return <AssignmentEditor accountId={accountId} onNavigate={onNavigate} />;
}

function AssignmentEditor({ accountId, onNavigate }: { accountId?: string; onNavigate: (id: string) => void }) {
  const { accounts, templates, assignmentDraft, startAssignment, updateAssignment, discardAssignment, effectivePermissions } = useIam();
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [templateQuery, setTemplateQuery] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [templateFilter, setTemplateFilter] = useState("");
  const [activeModule, setActiveModule] = useState("Hồ sơ nhân sự");
  const [employeeDragOver, setEmployeeDragOver] = useState(false);
  const [templateDragOver, setTemplateDragOver] = useState(false);
  const [expandedPreview, setExpandedPreview] = useState(false);
  useEffect(() => {
    if (accountId && assignmentDraft?.accountId !== accountId) startAssignment(accountId);
    // Direct routes hydrate their staged assignment from the shared store.
  }, [accountId, assignmentDraft?.accountId, startAssignment]);
  const account = accounts.find((item) => item.id === (assignmentDraft?.accountId ?? accountId));
  const employeeResults = accounts.filter((item) => `${item.name} ${item.employeeCode} ${item.department}`.toLocaleLowerCase("vi").includes(employeeQuery.toLocaleLowerCase("vi")) && (!employeeFilter || item.department === employeeFilter));
  const library = templates.filter((item) => item.status === "active" && `${item.name} ${item.description}`.toLocaleLowerCase("vi").includes(templateQuery.toLocaleLowerCase("vi")) && (!templateFilter || item.type === templateFilter));
  const assigned = assignmentDraft ? assignmentDraft.templateIds.map((id) => templates.find((item) => item.id === id)).filter(Boolean) : [];
  const effective = account ? effectivePermissions(account, assignmentDraft) : [];
  const modules = Array.from(new Set(permissionCatalog.map((item) => item.module)));
  const changedCount = assignmentDraft ? countChanges(assignmentDraft) : 0;

  const selectAccount = (id: string) => { startAssignment(id); onNavigate(`access/assignments/${id}`); };
  const addTemplate = (id: string) => {
    if (!assignmentDraft) { toast.info("Hãy chọn tài khoản trước."); return; }
    if (assignmentDraft.templateIds.includes(id)) { toast.info("Mẫu quyền đã được áp dụng cho tài khoản này."); return; }
    updateAssignment({ templateIds: [...assignmentDraft.templateIds, id] });
    toast.success("Đã thêm mẫu vào thay đổi chưa lưu.");
  };
  const removeTemplate = (id: string) => {
    if (!assignmentDraft || id === "tpl-employee") return;
    updateAssignment({ templateIds: assignmentDraft.templateIds.filter((item) => item !== id) });
  };
  const setOverride = (code: string, value: PermissionOverride) => {
    if (!assignmentDraft) return;
    const permission = effective.find((item) => item.code === code);
    if (permission?.protected && value === "deny") { toast.error("Quyền nền tảng được bảo vệ không thể bị từ chối."); return; }
    updateAssignment({ overrides: { ...assignmentDraft.overrides, [code]: value } });
  };

  return <>
    <section className="iam-section-head"><div><span className="eyebrow">VISUAL ACCESS BUILDER</span><h2>Phân quyền cá nhân</h2></div>{account && <span className="iam-unsaved-state">{changedCount ? `${changedCount} thay đổi chưa lưu` : "Đã đồng bộ"}</span>}</section>
    <section className="iam-assignment-workbench">
      <aside className="panel iam-employee-picker"><div className="iam-panel-head"><div><span className="eyebrow">DANH BẠ</span><h3>Chọn tài khoản</h3></div><UsersRound size={18} /></div><div className="iam-search compact"><Search size={15} /><input value={employeeQuery} onChange={(e) => setEmployeeQuery(e.target.value)} placeholder="Tìm nhân sự..." /></div><select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}><option value="">Tất cả phòng ban</option>{Array.from(new Set(accounts.map((item) => item.department))).map((item) => <option key={item}>{item}</option>)}</select><div className="iam-employee-list">{employeeResults.map((item) => <button key={item.id} draggable onDragStart={(event) => { event.dataTransfer.setData("text/ohriise-user", item.id); event.dataTransfer.effectAllowed = "copy"; }} className={cn(account?.id === item.id && "is-active")} onClick={() => selectAccount(item.id)}><GripVertical size={14} /><Person account={item} compact /><span className="iam-chip-wrap">{item.templateIds.slice(0, 2).map((id) => templates.find((template) => template.id === id)).filter(Boolean).map((template) => <TemplateChip key={template!.id} template={template!} />)}</span></button>)}</div></aside>
      <main className="panel iam-assignment-canvas" onDragOver={(event) => { if (event.dataTransfer.types.includes("text/ohriise-user")) { event.preventDefault(); setEmployeeDragOver(true); } }} onDragLeave={() => setEmployeeDragOver(false)} onDrop={(event) => { const id = event.dataTransfer.getData("text/ohriise-user"); if (id) selectAccount(id); setEmployeeDragOver(false); }}>
        {!account || !assignmentDraft ? <div className={cn("iam-account-dropzone", employeeDragOver && "is-over")}><UserRoundPlus size={30} /><h3>Chọn hoặc kéo một tài khoản vào đây</h3><p>Danh tính được chọn sẽ tải mẫu quyền, quyền tùy chỉnh và phạm vi dữ liệu hiện tại.</p></div> : <>
          <div className="iam-selected-account"><Person account={account} /><div><span className="mono">{account.employeeCode}</span><span>{account.department} · {account.branch}</span></div><StatusChip status={account.status} /></div>
          <div className="iam-canvas-section-head"><div><span className="eyebrow">MẪU QUYỀN ĐÃ ÁP DỤNG</span><h3>{assigned.length} mẫu quyền</h3></div><span>Kéo thả hoặc nhấn “Áp dụng”</span></div>
          <div className={cn("iam-template-dropzone", templateDragOver && "is-over")} onDragOver={(event) => { if (event.dataTransfer.types.includes("text/ohriise-template")) { event.preventDefault(); setTemplateDragOver(true); } }} onDragLeave={() => setTemplateDragOver(false)} onDrop={(event) => { event.preventDefault(); addTemplate(event.dataTransfer.getData("text/ohriise-template")); setTemplateDragOver(false); }}>
            {assigned.map((template) => <article key={template!.id}><span className="iam-drag-handle"><GripVertical size={15} /></span><span><strong>{template!.name}</strong><small>{template!.permissionCodes.length} quyền · {template!.type === "system" ? "Hệ thống" : "Tùy chỉnh"}</small></span><button disabled={template!.id === "tpl-employee"} title={template!.id === "tpl-employee" ? "Quyền Employee nền tảng không thể gỡ" : "Gỡ mẫu quyền"} onClick={() => removeTemplate(template!.id)}>{template!.id === "tpl-employee" ? <LockKeyhole size={15} /> : <Trash2 size={15} />}</button></article>)}
            <div className="iam-drop-hint"><GripVertical size={17} /> Kéo mẫu quyền vào đây</div>
          </div>
        </>}
      </main>
      <aside className="panel iam-template-library"><div className="iam-panel-head"><div><span className="eyebrow">BUILDING BLOCKS</span><h3>Thư viện mẫu quyền</h3></div><ShieldCheck size={18} /></div><div className="iam-search compact"><Search size={15} /><input value={templateQuery} onChange={(e) => setTemplateQuery(e.target.value)} placeholder="Tìm mẫu quyền..." /></div><select value={templateFilter} onChange={(e) => setTemplateFilter(e.target.value)}><option value="">Tất cả mẫu</option><option value="system">Hệ thống</option><option value="custom">Tùy chỉnh</option></select><div className="iam-library-list">{library.map((template) => { const applied = assignmentDraft?.templateIds.includes(template.id); return <article key={template.id} draggable onDragStart={(event) => { event.dataTransfer.setData("text/ohriise-template", template.id); event.dataTransfer.effectAllowed = "copy"; }}><div><GripVertical size={14} /><TemplateChip template={template} /></div><strong>{template.name}</strong><p>{template.description}</p><footer><span>{template.permissionCodes.length} quyền</span><button disabled={applied} onClick={() => addTemplate(template.id)}>{applied ? <><Check size={13} /> Đã áp dụng</> : "Áp dụng"}</button></footer></article>; })}</div></aside>
    </section>
    {account && assignmentDraft && <>
      <section className="panel iam-override-editor"><div className="iam-panel-head"><div><span className="eyebrow">INDIVIDUAL OVERRIDES</span><h3>Tùy chỉnh quyền cá nhân</h3><p>Chỉ ảnh hưởng đến {account.name}; không thay đổi mẫu quyền hoặc tài khoản khác.</p></div></div><div className="iam-module-pills">{modules.map((module) => <button key={module} className={activeModule === module ? "is-active" : ""} onClick={() => setActiveModule(module)}>{module}</button>)}</div><div className="iam-override-table"><div className="head"><span>Quyền</span><span>Nguồn kế thừa</span><span>Quyền cá nhân</span><span>Kết quả</span></div>{permissionCatalog.filter((item) => item.module === activeModule).map((permission) => { const result = effective.find((item) => item.code === permission.code)!; return <div key={permission.code}><span><strong>{permission.name}</strong><code>{permission.code}</code>{permission.dependency && <small>Yêu cầu: {permission.dependency}</small>}</span><span>{result.sources.length ? result.sources.join(", ") : "Không có"}</span><span><select value={assignmentDraft.overrides[permission.code] ?? "inherit"} onChange={(e) => setOverride(permission.code, e.target.value as PermissionOverride)}><option value="inherit">Kế thừa</option><option value="allow">Cho phép</option><option value="deny" disabled={result.protected}>Từ chối</option></select>{result.protected && <small><LockKeyhole size={11} /> Được bảo vệ</small>}</span><span className={result.allowed ? "allowed" : "denied"}>{result.allowed ? "Cho phép" : "Từ chối"}</span></div>; })}</div></section>
      <section className="iam-scope-preview-grid"><article className="panel iam-scope-editor"><div className="iam-panel-head"><div><span className="eyebrow">DATA SCOPE</span><h3>Phạm vi dữ liệu</h3></div></div><p>Quyền chức năng và phạm vi dữ liệu được đánh giá độc lập.</p><div className="iam-scope-options">{Object.entries(scopeLabels).map(([value, label]) => <label key={value} className={assignmentDraft.scope.type === value ? "selected" : ""}><input type="radio" name="scope" value={value} checked={assignmentDraft.scope.type === value} onChange={() => updateAssignment({ scope: { type: value as ScopeType, target: value === "self" || value === "company" ? undefined : account[value === "team" ? "team" : value === "department" ? "department" : "branch"] } })} /><span>{label}</span></label>)}</div>{!(["self", "company"] as string[]).includes(assignmentDraft.scope.type) && <label className="iam-scope-target"><span>{assignmentDraft.scope.type === "team" ? "Team cụ thể" : assignmentDraft.scope.type === "department" ? "Phòng ban cụ thể" : "Chi nhánh cụ thể"}</span><select value={assignmentDraft.scope.target} onChange={(e) => updateAssignment({ scope: { ...assignmentDraft.scope, target: e.target.value } })}>{Array.from(new Set(accounts.map((item) => item[assignmentDraft.scope.type === "team" ? "team" : assignmentDraft.scope.type === "department" ? "department" : "branch"]))).map((item) => <option key={item}>{item}</option>)}</select></label>}</article>
        <article className="panel iam-effective-preview"><div className="iam-panel-head"><div><span className="eyebrow">EFFECTIVE ACCESS</span><h3>Quyền truy cập thực tế</h3></div><span className="iam-preview-badge">Chưa lưu</span></div><div className="iam-effective-metrics"><div><strong>{effective.filter((item) => item.allowed).length}</strong><span>Quyền hiệu lực</span></div><div><strong>{effective.filter((item) => item.sources.length).length}</strong><span>Kế thừa</span></div><div><strong>{effective.filter((item) => item.override === "allow").length}</strong><span>Gán trực tiếp</span></div><div><strong>{effective.filter((item) => item.override === "deny").length}</strong><span>Từ chối</span></div></div><div className={cn("iam-effective-detail", expandedPreview && "expanded")}>{effective.filter((item) => item.allowed || item.override === "deny").map((item) => <div key={item.code}><span className={item.allowed ? "allowed" : "denied"}>{item.allowed ? <Check size={13} /> : <X size={13} />}</span><span><code>{item.code}</code><small>Nguồn: {item.override !== "inherit" ? "Quyền cá nhân" : item.sources.join(", ") || "Không có"} · {scopeLabels[assignmentDraft.scope.type]}</small></span></div>)}</div><button className="text-button" onClick={() => setExpandedPreview((value) => !value)}>{expandedPreview ? <ChevronDown size={14} /> : <ChevronRight size={14} />} {expandedPreview ? "Thu gọn" : "Xem toàn bộ quyền"}</button></article>
      </section>
      <div className="iam-sticky-actions"><div><strong>{changedCount} thay đổi chưa lưu</strong><span>Các thay đổi chỉ nằm trong bản nháp của {account.name}.</span></div><button className="secondary-button" onClick={() => { discardAssignment(); startAssignment(account.id); toast.info("Đã hủy các thay đổi chưa lưu."); }}>Hủy thay đổi</button><button className="secondary-button" disabled={!changedCount} onClick={() => onNavigate(`access/assignments/${account.id}/review`)}>Xem thay đổi</button><button className="primary-button" disabled={!changedCount} onClick={() => onNavigate(`access/assignments/${account.id}/review`)}>Lưu phân quyền</button></div>
    </>}
  </>;
}

function AssignmentReview({ accountId, onNavigate }: { accountId: string; onNavigate: (id: string) => void }) {
  const { accounts, templates, assignmentDraft, startAssignment, applyAssignment } = useIam();
  useEffect(() => {
    if (!assignmentDraft || assignmentDraft.accountId !== accountId) startAssignment(accountId);
    // Restore a reviewable draft for direct links.
  }, [accountId, assignmentDraft, startAssignment]);
  const account = accounts.find((item) => item.id === accountId);
  if (!account || !assignmentDraft) return <div className="iam-no-results">Đang chuẩn bị bản đối chiếu…</div>;
  const added = assignmentDraft.templateIds.filter((id) => !assignmentDraft.baselineTemplateIds.includes(id));
  const removed = assignmentDraft.baselineTemplateIds.filter((id) => !assignmentDraft.templateIds.includes(id));
  const overrideChanges = Object.entries(assignmentDraft.overrides).filter(([code, value]) => assignmentDraft.baselineOverrides[code] !== value);
  const scopeChanged = JSON.stringify(assignmentDraft.scope) !== JSON.stringify(assignmentDraft.baselineScope);
  const elevated = added.some((id) => id === "tpl-system-admin") || overrideChanges.some(([code, value]) => value === "allow" && code.startsWith("admin."));
  return <>
    <BackButton onClick={() => onNavigate(`access/assignments/${account.id}`)}>Quay lại chỉnh sửa</BackButton>
    <section className="iam-section-head"><div><span className="eyebrow">REVIEW & APPLY</span><h2>Xác nhận thay đổi quyền truy cập</h2></div><Person account={account} compact /></section>
    {elevated && <div className="iam-impact-banner danger"><AlertTriangle size={20} /><div><strong>Cảnh báo quyền nâng cao</strong><p>Thay đổi bao gồm quyền quản trị. Hãy xác minh nguyên tắc đặc quyền tối thiểu trước khi áp dụng.</p></div></div>}
    <section className="iam-review-changes panel"><h3>Thay đổi đang chờ xác nhận</h3><div className="iam-review-change-grid"><ReviewGroup title="Mẫu quyền được thêm" values={added.map((id) => templates.find((item) => item.id === id)?.name ?? id)} tone="added" /><ReviewGroup title="Mẫu quyền bị gỡ" values={removed.map((id) => templates.find((item) => item.id === id)?.name ?? id)} tone="removed" /><ReviewGroup title="Quyền cá nhân" values={overrideChanges.map(([code, value]) => `${code} → ${value === "allow" ? "Cho phép" : value === "deny" ? "Từ chối" : "Kế thừa"}`)} tone="direct" /><ReviewGroup title="Phạm vi dữ liệu" values={scopeChanged ? [`${scopeLabels[assignmentDraft.baselineScope.type]}${assignmentDraft.baselineScope.target ? ` · ${assignmentDraft.baselineScope.target}` : ""} → ${scopeLabels[assignmentDraft.scope.type]}${assignmentDraft.scope.target ? ` · ${assignmentDraft.scope.target}` : ""}`] : []} tone="scope" /></div></section>
    <section className="iam-apply-checks panel"><div><CheckCircle2 size={18} /><span>Mẫu Employee nền tảng vẫn được bảo toàn.</span></div><div><CheckCircle2 size={18} /><span>Quyền cá nhân chỉ áp dụng cho {account.name}.</span></div><div><CheckCircle2 size={18} /><span>Sự kiện kiểm toán sẽ được tạo sau khi xác nhận.</span></div></section>
    <div className="iam-review-actions"><button className="secondary-button" onClick={() => onNavigate(`access/assignments/${account.id}`)}>Quay lại chỉnh sửa</button><button className="primary-button" disabled={countChanges(assignmentDraft) === 0} onClick={() => { applyAssignment(); toast.success("Đã áp dụng phân quyền và ghi nhận lịch sử."); onNavigate(`access/assignments/${account.id}/saved`); }}>Xác nhận & áp dụng</button></div>
  </>;
}

function AssignmentSuccess({ accountId, onNavigate }: { accountId: string; onNavigate: (id: string) => void }) {
  const { accounts } = useIam();
  const account = accounts.find((item) => item.id === accountId);
  return <section className="panel iam-success-state"><span><CheckCircle2 size={30} /></span><small className="eyebrow">ĐÃ ĐỒNG BỘ</small><h2>Phân quyền đã được áp dụng</h2><p>Quyền hiệu lực, bộ lọc vai trò và lịch sử hoạt động của {account?.name ?? "tài khoản"} đã được cập nhật trong shared demo store.</p><div><button className="secondary-button" onClick={() => onNavigate(`access/users/${accountId}`)}>Xem hồ sơ tài khoản</button><button className="primary-button" onClick={() => { if (account) { onNavigate(`access/assignments/${account.id}`); } }}>Tiếp tục chỉnh sửa quyền</button></div></section>;
}

function ReviewGroup({ title, values, tone }: { title: string; values: string[]; tone: string }) { return <article className={tone}><h4>{title}<span>{values.length}</span></h4>{values.length ? values.map((value) => <div key={value}>{value}</div>) : <p>Không có thay đổi.</p>}</article>; }

function countChanges(draft: NonNullable<ReturnType<typeof useIam>["assignmentDraft"]>) {
  const templateChanges = new Set([...draft.templateIds.filter((id) => !draft.baselineTemplateIds.includes(id)), ...draft.baselineTemplateIds.filter((id) => !draft.templateIds.includes(id))]).size;
  const overrideChanges = new Set([...Object.keys(draft.overrides), ...Object.keys(draft.baselineOverrides)]).size - Object.keys(draft.overrides).filter((code) => draft.overrides[code] === draft.baselineOverrides[code]).length;
  const scopeChange = JSON.stringify(draft.scope) === JSON.stringify(draft.baselineScope) ? 0 : 1;
  return templateChanges + Math.max(0, overrideChanges) + scopeChange;
}
