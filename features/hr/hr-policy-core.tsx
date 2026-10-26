"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Plus } from "lucide-react";
import { toast } from "sonner";
import { StatusPill, WorkspaceHeader } from "@/features/employee/workspace-frame";
import { useSession } from "@/features/session/session-context";
import { useHrDemo } from "./hr-demo-context";
import { effectivePolicyStatus, hrDate, hrToday } from "./hr-demo-data";
import type { HrPolicy } from "./hr-demo-data";

const groups = ["Chấm công", "Ca làm việc", "Nghỉ phép", "Phê duyệt", "WFH", "Hợp đồng", "Mẫu hợp đồng"];
const labels: Record<HrPolicy["status"], string> = { draft: "Bản nháp", scheduled: "Đã lên lịch", active: "Đang áp dụng", retired: "Đã thay thế" };
const tone = (status: HrPolicy["status"]) => status === "active" ? "success" : status === "scheduled" ? "blue" : "neutral";

export function HrPolicyWorkspace({ moduleId, onNavigate }: { moduleId: string; onNavigate: (id: string) => void }) {
  const { policies, activities, savePolicyDraft, publishPolicy } = useHrDemo();
  const { can, session } = useSession();
  const [, slug, sourceId] = moduleId.split("/");
  const original = policies.find((item) => item.id === slug);
  const source = policies.find((item) => item.id === sourceId);
  const [group, setGroup] = useState("");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [form, setForm] = useState({ group: original?.group ?? source?.group ?? "Chấm công", name: original?.name ?? source?.name ?? "", value: original?.value ?? source?.value ?? "", scope: original?.scope ?? source?.scope ?? "Toàn công ty", effectiveAt: original?.effectiveAt ?? hrToday() });
  const editable = can("hr-policies", "configure");
  const visible = policies.filter((item) => (!group || item.group === group) && (!status || effectivePolicyStatus(item, hrToday(), policies) === status) && `${item.name} ${item.value}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")));
  const valid = form.name.trim().length >= 3 && form.value.trim().length >= 1 && form.effectiveAt >= hrToday();

  if (slug === "new" || original) {
    const currentStatus = original ? effectivePolicyStatus(original, hrToday(), policies) : "draft";
    return <div className="page-stack hr-core">
      <button className="hr-back" onClick={() => onNavigate("hr-policies")}><ArrowLeft size={15} /> Thư viện chính sách</button>
      <WorkspaceHeader title={original ? `${original.name} · v${original.version}` : source ? `Phiên bản mới · ${source.name}` : "Tạo bản nháp chính sách"} subtitle="Ngày hiệu lực quyết định trạng thái; kỳ công lịch sử không bị tính lại." />
      <div className="hr-demo-note"><strong>Demo cục bộ</strong><span>Chính sách là cấu hình tham khảo; engine công/phép backend chưa sử dụng dữ liệu này.</span></div>
      <section className="hr-case-grid"><article className="panel"><h2>{original ? "Nội dung chính sách" : "Thông tin bản nháp"}</h2>
        <div className="hr-core-form hr-action-form"><div className="hr-form-grid">
          <label>Nhóm<select disabled={!editable || Boolean(original) || Boolean(source)} value={form.group} onChange={(event) => setForm({ ...form, group: event.target.value })}>{groups.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Tên quy tắc<input disabled={!editable || Boolean(original) || Boolean(source)} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>Giá trị / quy tắc<input disabled={!editable || Boolean(original)} value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} /></label>
          <label>Phạm vi<select disabled={!editable || Boolean(original)} value={form.scope} onChange={(event) => setForm({ ...form, scope: event.target.value })}><option>Toàn công ty</option><option>HCM-Q1</option><option>HCM-TD</option><option>HN-CG</option></select></label>
          <label>Ngày hiệu lực<input disabled={!editable || Boolean(original)} type="date" value={form.effectiveAt} onChange={(event) => setForm({ ...form, effectiveAt: event.target.value })} /></label>
        </div>
        {original && <p>Trạng thái: <StatusPill tone={tone(currentStatus)}>{labels[currentStatus]}</StatusPill></p>}
        {editable && !original && <button className="primary-button" disabled={!valid} onClick={() => { const id = savePolicyDraft(form); toast.success("Đã lưu bản nháp demo."); onNavigate(`hr-policies/${id}`); }}>Lưu bản nháp</button>}
        {editable && original && currentStatus !== "draft" && currentStatus !== "retired" && <button className="secondary-button" onClick={() => onNavigate(`hr-policies/new/${original.id}`)}>Tạo phiên bản mới</button>}
        {editable && original?.status === "draft" && !confirm && <button className="primary-button" onClick={() => setConfirm(true)}>{original.effectiveAt > hrToday() ? "Lên lịch áp dụng" : "Áp dụng"}</button>}
        {confirm && original && <div className="hr-inline-confirm"><div><strong>Xác nhận phiên bản v{original.version}?</strong><p>{original.effectiveAt > hrToday() ? `Sẽ có hiệu lực từ ${hrDate(original.effectiveAt)}, chưa áp dụng hôm nay.` : "Áp dụng từ hôm nay trong dữ liệu demo."}</p></div><button className="secondary-button" onClick={() => setConfirm(false)}>Hủy</button><button className="primary-button" onClick={() => { publishPolicy(original.id); setConfirm(false); toast.success("Đã cập nhật trạng thái chính sách demo."); }}>Xác nhận</button></div>}
        </div></article>
        <article className="panel"><h2>Lịch sử phiên bản</h2><div className="hr-activity-list">{policies.filter((item) => item.group === form.group && item.name === form.name).sort((a, b) => b.version - a.version).map((item) => <button className="hr-linked-row" key={item.id} onClick={() => onNavigate(`hr-policies/${item.id}`)}><BookOpen size={15} /><span><strong>v{item.version} · {labels[effectivePolicyStatus(item, hrToday(), policies)]}</strong><small>{item.value} · hiệu lực {hrDate(item.effectiveAt)}</small></span><ArrowRight size={14} /></button>)}</div><h2>Hoạt động</h2><div className="hr-activity-list">{activities.filter((item) => Boolean(form.name) && item.text.includes(form.name)).slice(0, 5).map((item) => <div key={item.id}><i /><span><strong>{item.text}</strong><small>{new Date(item.at).toLocaleString("vi-VN")}</small></span></div>)}</div></article>
      </section>
    </div>;
  }

  return <div className="page-stack hr-core"><WorkspaceHeader title="HR Policy Studio" action={editable ? <button className="primary-button" onClick={() => onNavigate("hr-policies/new")}><Plus size={15} /> Tạo bản nháp</button> : undefined} />
    <div className="hr-demo-note"><strong>Demo cục bộ</strong><span>Quy tắc mới không thay đổi bảng công, phép hoặc hợp đồng lịch sử. Ngày hiệu lực tương lai chỉ ở trạng thái đã lên lịch.</span></div>
    <section className="panel hr-directory"><div className="hr-directory-tools"><input aria-label="Tìm chính sách" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên hoặc giá trị quy tắc" /><select aria-label="Nhóm chính sách" value={group} onChange={(event) => setGroup(event.target.value)}><option value="">Mọi nhóm</option>{groups.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Trạng thái" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Mọi trạng thái</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>Nhóm</th><th>Quy tắc</th><th>Giá trị</th><th>Phạm vi</th><th>Hiệu lực</th><th>Phiên bản</th><th>Trạng thái</th><th /></tr></thead><tbody>{visible.map((item) => { const effective = effectivePolicyStatus(item, hrToday(), policies); return <tr key={item.id}><td>{item.group}</td><td><strong>{item.name}</strong></td><td>{item.value}</td><td>{item.scope}</td><td>{hrDate(item.effectiveAt)}</td><td>v{item.version}</td><td><StatusPill tone={tone(effective)}>{labels[effective]}</StatusPill></td><td><button className="row-action" onClick={() => onNavigate(`hr-policies/${item.id}`)}>Mở <ArrowRight size={13} /></button></td></tr>; })}</tbody></table></div>
      {!visible.length && <p className="hr-empty">Không có chính sách phù hợp bộ lọc.</p>}
    </section>
  </div>;
}
