"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Laptop2, Search } from "lucide-react";
import { toast } from "sonner";
import { WorkspaceHeader, StatusPill } from "@/features/employee/workspace-frame";
import { useSession } from "@/features/session/session-context";
import { canAccessScopedRecord } from "@/lib/authorization/engine";
import { personaEmployeeIds } from "@/lib/authorization/demo-identity";
import { demoBusinessNow } from "@/lib/demo-clock";
import { useHrDemo } from "./hr-demo-context";
import type { AssetCommand } from "./asset-model";
import type { HrAsset } from "./hr-demo-data";

const statusLabels: Record<HrAsset["status"], string> = { available: "Sẵn sàng", awaiting_receipt: "Chờ người nhận", assigned: "Đang sử dụng", awaiting_return: "Chờ thu hồi", maintenance: "Bảo trì", retired: "Đã ngừng dùng" };
type Action = "issue" | "transfer" | "request-return" | "complete-return";

export function HrAssetsWorkspace({ moduleId, onNavigate }: { moduleId: string; onNavigate: (id: string) => void }) {
  const { assets, assetHandovers, employees, applyAssetAction } = useHrDemo();
  const { session, can } = useSession();
  const [, slug, id] = moduleId.split("/");
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState(slug === "employee" ? id : "");
  const [action, setAction] = useState<Action | "">("");
  const [target, setTarget] = useState("");
  const [condition, setCondition] = useState("");
  const [accessories, setAccessories] = useState("");
  const [evidence, setEvidence] = useState("");
  const [reason, setReason] = useState("");
  const scopedPeople = employees.filter((person) => canAccessScopedRecord(session, { employeeId: person.id, branch: person.branch, department: person.department }));
  const scoped = assets.filter((item) => session.effectiveScope === "company" || item.branch === session.branch);
  const selected = slug && slug !== "employee" ? scoped.find((item) => item.id === slug) : undefined;
  const visible = scoped.filter((item) => `${item.id} ${item.name} ${item.serial}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")) && (!branch || item.branch === branch) && (!category || item.category === category) && (!status || item.status === status) && (!employeeFilter || item.holderId === employeeFilter));
  const handovers = selected ? assetHandovers.filter((item) => item.assetId === selected.id) : [];
  const openHandover = handovers.find((item) => !item.returnedAt);
  const choose = (next: Action) => { setAction(next); setTarget(""); setCondition(selected?.condition ?? ""); setAccessories(openHandover?.accessories ?? ""); setEvidence(""); setReason(""); };
  const save = () => {
    if (!selected || !can("hr-assets", "edit")) return;
    const common = { assetId: selected.id, actorId: personaEmployeeIds[session.id] ?? session.id, at: demoBusinessNow().toISOString(), expectedVersion: selected.version ?? 1 };
    let command: AssetCommand;
    if (action === "issue" || action === "transfer") command = { ...common, type: action, employeeId: target, condition, accessories, evidence };
    else if (action === "request-return") command = { ...common, type: action, reason };
    else if (action === "complete-return") command = { ...common, type: action, condition, evidence };
    else return;
    const result = applyAssetAction(command);
    if (!result.ok) { toast.error(result.error); return; }
    toast.success(`${result.message} Dữ liệu chỉ lưu trong demo cục bộ.`);
    setAction("");
  };

  if (selected) {
    const holder = employees.find((person) => person.id === selected.holderId);
    return <div className="page-stack hr-core"><button className="hr-back" onClick={() => onNavigate("hr-assets")}><ArrowLeft size={15} /> Danh sách tài sản</button><section className="panel hr-profile-hero"><Laptop2 size={30} /><div><span className="eyebrow">TÀI SẢN · {selected.id}</span><h2>{selected.name}</h2><p>{selected.category} · {selected.serial} · {selected.branch}</p></div><StatusPill tone={selected.status === "available" ? "success" : "blue"}>{statusLabels[selected.status]}</StatusPill></section>
      <section className="hr-case-grid"><article className="panel"><h2>Thông tin bàn giao hiện tại</h2><dl className="hr-profile-facts">{[["Người nhận", holder?.name ?? "Chưa cấp"], ["Ngày lập", openHandover ? new Date(openHandover.issuedAt).toLocaleString("vi-VN") : "—"], ["Người giao", openHandover?.issuedBy ?? "—"], ["Tình trạng khi giao", openHandover?.conditionOut ?? selected.condition], ["Phụ kiện", openHandover?.accessories ?? "—"], ["Xác nhận người nhận", openHandover?.acknowledgedAt ? new Date(openHandover.acknowledgedAt).toLocaleString("vi-VN") : openHandover ? "Chưa xác nhận" : "—"], ["Biên bản / bằng chứng", openHandover?.evidence ?? "—"]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{holder && <button className="secondary-button" onClick={() => onNavigate(`employees/${holder.id}`)}>Mở hồ sơ nhân viên <ArrowRight size={13} /></button>}</article>
        <article className="panel"><h2>Thao tác tài sản</h2><p>Giao nhận và thu hồi là các bước riêng. Người nhận xác nhận trong Hồ sơ cá nhân → Thiết bị.</p>{can("hr-assets", "edit") && <div className="hr-detail-actions">{selected.status === "available" && <button className="secondary-button" onClick={() => choose("issue")}>Lập bàn giao</button>}{selected.status === "assigned" && <><button className="secondary-button" onClick={() => choose("request-return")}>Yêu cầu thu hồi</button><button className="secondary-button" onClick={() => choose("transfer")}>Chuyển giao</button></>}{selected.status === "awaiting_return" && <button className="secondary-button" onClick={() => choose("complete-return")}>Xác nhận nhận lại</button>}</div>}{selected.status === "awaiting_receipt" && <p className="hr-warning">Đang chờ {holder?.name ?? "người nhận"} xác nhận. Không thể cấp trùng.</p>}
          {action && <div className="hr-core-form hr-action-form">{(action === "issue" || action === "transfer") && <label>Nhân viên nhận<select value={target} onChange={(event) => setTarget(event.target.value)}><option value="">Chọn nhân viên</option>{scopedPeople.filter((person) => person.status !== "inactive" && person.id !== selected.holderId).map((person) => <option key={person.id} value={person.id}>{person.name} · {person.branch}</option>)}</select></label>}{action === "request-return" ? <label>Lý do thu hồi<textarea rows={2} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Lý do và ngày bàn giao dự kiến" /></label> : <><label>Tình trạng thiết bị<input value={condition} onChange={(event) => setCondition(event.target.value)} placeholder="Tình trạng kiểm tra" /></label>{action !== "complete-return" && <label>Phụ kiện kèm theo<input value={accessories} onChange={(event) => setAccessories(event.target.value)} placeholder="Sạc, túi, chuột… hoặc Không có" /></label>}<label>Tham chiếu biên bản / bằng chứng<textarea rows={2} value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Mã biên bản hoặc nơi lưu; chưa có upload file trong demo" /></label></>}<div className="hr-detail-actions"><button className="secondary-button" onClick={() => setAction("")}>Hủy</button><button className="primary-button" onClick={save}>Ghi nhận {action === "issue" ? "bàn giao" : action === "transfer" ? "chuyển giao" : action === "request-return" ? "yêu cầu" : "thu hồi"}</button></div></div>}</article></section>
      <section className="panel"><h2>Lịch sử bàn giao</h2><div className="hr-activity-list">{handovers.map((entry) => <div key={entry.id}><i /><span><strong>{employees.find((person) => person.id === entry.employeeId)?.name ?? entry.employeeId} · {entry.returnedAt ? "Đã kết thúc" : entry.returnRequestedAt ? "Chờ trả" : entry.acknowledgedAt ? "Đã nhận" : "Chờ xác nhận"}</strong><small>{new Date(entry.issuedAt).toLocaleString("vi-VN")} · {entry.source === "seed" ? "Bản ghi mẫu; chưa có biên bản gốc" : entry.evidence}{entry.returnedAt ? ` · Trả ${new Date(entry.returnedAt).toLocaleString("vi-VN")} · ${entry.returnEvidence}` : ""}</small></span></div>)}</div></section></div>;
  }
  return <div className="page-stack hr-core"><WorkspaceHeader title="Quản lý tài sản" /><section className="panel hr-directory"><div className="hr-directory-tools"><label className="compact-search"><Search size={15} /><input aria-label="Tìm tài sản" placeholder="Mã, tên hoặc serial" value={query} onChange={(event) => setQuery(event.target.value)} /></label><select aria-label="Danh mục" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Mọi danh mục</option>{[...new Set(scoped.map((item) => item.category))].map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Trạng thái" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Mọi trạng thái</option>{Object.entries(statusLabels).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select><select aria-label="Chi nhánh" value={branch} onChange={(event) => setBranch(event.target.value)}><option value="">Mọi chi nhánh</option>{[...new Set(scoped.map((item) => item.branch))].map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Nhân viên" value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)}><option value="">Mọi nhân viên</option>{scopedPeople.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Mã</th><th>Tài sản</th><th>Danh mục</th><th>Serial</th><th>Người nhận</th><th>Ngày lập</th><th>Trạng thái</th><th>Chi nhánh</th><th /></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td className="mono">{item.id}</td><td><strong>{item.name}</strong><small>{item.condition}</small></td><td>{item.category}</td><td>{item.serial}</td><td>{employees.find((person) => person.id === item.holderId)?.name ?? "Chưa cấp"}</td><td>{item.assignedAt ?? "—"}</td><td><StatusPill tone={item.status === "available" ? "success" : "blue"}>{statusLabels[item.status]}</StatusPill></td><td>{item.branch}</td><td><button className="row-action" onClick={() => onNavigate(`hr-assets/${item.id}`)}>Mở <ArrowRight size={13} /></button></td></tr>)}</tbody></table></div>{!visible.length && <p className="hr-empty">Không có tài sản phù hợp bộ lọc.</p>}</section></div>;
}
