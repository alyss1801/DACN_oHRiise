"use client";

import { useState } from "react";
import { FileText, ShieldCheck } from "lucide-react";
import { useHrDemo } from "@/features/hr/hr-demo-context";
import { hrContractEnd, hrDate, hrToday } from "@/features/hr/hr-demo-data";
import { effectiveContractStatus } from "@/features/hr/contract-model";
import { personaEmployeeIds } from "@/lib/authorization/demo-identity";
import { useSession } from "@/features/session/session-context";
import { StatusPill, WorkspaceHeader } from "./workspace-frame";
import { ContractDocumentViewer } from "./contract-document-viewer";

export function ContractWorkspace() {
  const [selectedId, setSelectedId] = useState("");
  const { session } = useSession();
  const { employees, contracts } = useHrDemo();
  const employeeId = personaEmployeeIds[session.id];
  const person = employees.find((item) => item.id === employeeId);
  const own = contracts.filter((item) => item.employeeId === employeeId).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const current = own.find((item) => effectiveContractStatus(item, hrToday()) === "active");
  const selected = own.find((item) => item.id === selectedId) ?? null;

  return <div className="page-stack">
    <WorkspaceHeader title="Hợp đồng lao động" action={current && <button type="button" className="primary-button" onClick={() => setSelectedId(current.id)}>Xem hợp đồng</button>} />
    {person && <section className="contract-layout">
      <article className="panel contract-hero"><div className="contract-icon"><FileText size={24} strokeWidth={1.5} /></div><div><span className="eyebrow">{current ? "HỢP ĐỒNG HIỆU LỰC" : "CHƯA CÓ HỢP ĐỒNG HIỆU LỰC"}</span><h3>{current?.type ?? "Đang chờ HR hoàn tất hồ sơ"}</h3><p className="mono">{current ? `${current.id} · Phiên bản ${current.version}` : person.id}</p></div>{current && <StatusPill tone="success">{current.document === "verified" ? "Đã xác minh bản ký" : "Chờ xác minh bản ký"}</StatusPill>}{current && <div className="contract-dates"><div><span>Ngày bắt đầu</span><strong>{hrDate(current.startsAt)}</strong></div><i /><div><span>Ngày kết thúc</span><strong>{hrContractEnd(current.endsAt)}</strong></div></div>}</article>
      <aside className="panel contract-side"><span className="eyebrow">THÔNG TIN CÔNG VIỆC</span><div className="contract-fields"><div><span>Nhân viên</span><strong>{person.name} · {person.id}</strong></div><div><span>Chức danh</span><strong>{person.position}</strong></div><div><span>Phòng ban</span><strong>{person.department}</strong></div><div><span>Chi nhánh</span><strong>{person.branch}</strong></div><div><span>Loại hình</span><strong>{person.employmentType}</strong></div></div></aside>
    </section>}
    {!person && <section className="panel"><p>Persona này chưa liên kết hồ sơ nhân viên demo. Admin kỹ thuật không mặc nhiên xem hợp đồng HR.</p></section>}
    {person && <section className="panel lifecycle-panel"><div className="data-panel-head"><div><span className="eyebrow">LỊCH SỬ HỢP ĐỒNG</span><h3>{own.length} bản ghi của tôi</h3></div><FileText size={18} strokeWidth={1.5} /></div>{own.map((item) => <div className="catalog-row contract-history-row" key={item.id}><span className="mono">{item.id}</span><strong>{item.type}</strong><span>{hrDate(item.startsAt)} – {hrContractEnd(item.endsAt)}</span><StatusPill tone={effectiveContractStatus(item, hrToday()) === "active" ? "success" : "neutral"}>{item.document === "verified" ? (effectiveContractStatus(item, hrToday()) === "scheduled" ? "Đã xác minh · chờ hiệu lực" : effectiveContractStatus(item, hrToday()) === "expired" ? "Đã hết hạn" : "Đang hiệu lực") : item.document === "paper-signed" ? "Chờ HR xác minh" : "Thiếu bản ký"}</StatusPill><button type="button" onClick={() => setSelectedId(item.id)}>Xem hợp đồng</button></div>)}{!own.length && <p>Chưa có hợp đồng trong dữ liệu demo.</p>}</section>}
    <div className="privacy-note contract-privacy"><ShieldCheck size={16} strokeWidth={1.5} /><span>Bản xem được dựng từ dữ liệu demo; không phải bản hợp đồng giấy đã ký.</span></div>
    <ContractDocumentViewer contract={selected} employee={person ?? null} ownerName={employees.find((item) => item.id === selected?.ownerId)?.name} open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelectedId(""); }} />
  </div>;
}
