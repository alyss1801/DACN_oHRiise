"use client";

import { FileText, ShieldCheck } from "lucide-react";
import { useHrDemo } from "@/features/hr/hr-demo-context";
import { hrContractEnd, hrDate, hrToday } from "@/features/hr/hr-demo-data";
import { effectiveContractStatus } from "@/features/hr/contract-model";
import { personaEmployeeIds } from "@/lib/authorization/demo-identity";
import { useSession } from "@/features/session/session-context";
import { StatusPill, WorkspaceHeader } from "./workspace-frame";

export function ContractWorkspace() {
  const { session } = useSession();
  const { employees, contracts } = useHrDemo();
  const employeeId = personaEmployeeIds[session.id];
  const person = employees.find((item) => item.id === employeeId);
  const own = contracts.filter((item) => item.employeeId === employeeId).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const current = own.find((item) => effectiveContractStatus(item, hrToday()) === "active");

  return <div className="page-stack">
    <WorkspaceHeader eyebrow="HỢP ĐỒNG CÁ NHÂN" title="Hợp đồng lao động" description="Cùng dữ liệu hợp đồng mà HR đang quản lý · demo cục bộ." />
    {person && <section className="contract-layout">
      <article className="panel contract-hero"><div className="contract-icon"><FileText size={24} strokeWidth={1.5} /></div><div><span className="eyebrow">{current ? "HỢP ĐỒNG HIỆU LỰC" : "CHƯA CÓ HỢP ĐỒNG HIỆU LỰC"}</span><h3>{current?.type ?? "Đang chờ HR hoàn tất hồ sơ"}</h3><p className="mono">{current ? `${current.id} · Phiên bản ${current.version}` : person.id}</p></div>{current && <StatusPill tone="success">{current.document === "verified" ? "Đã xác minh bản ký" : "Chờ xác minh bản ký"}</StatusPill>}{current && <div className="contract-dates"><div><span>Ngày bắt đầu</span><strong>{hrDate(current.startsAt)}</strong></div><i /><div><span>Ngày kết thúc</span><strong>{hrContractEnd(current.endsAt)}</strong></div></div>}</article>
      <aside className="panel contract-side"><span className="eyebrow">THÔNG TIN CÔNG VIỆC</span><div className="contract-fields"><div><span>Nhân viên</span><strong>{person.name} · {person.id}</strong></div><div><span>Chức danh</span><strong>{person.position}</strong></div><div><span>Phòng ban</span><strong>{person.department}</strong></div><div><span>Chi nhánh</span><strong>{person.branch}</strong></div><div><span>Loại hình</span><strong>{person.employmentType}</strong></div></div></aside>
    </section>}
    {!person && <section className="panel"><p>Persona này chưa liên kết hồ sơ nhân viên demo. Admin kỹ thuật không mặc nhiên xem hợp đồng HR.</p></section>}
    {person && <section className="panel lifecycle-panel"><div className="data-panel-head"><div><span className="eyebrow">LỊCH SỬ HỢP ĐỒNG</span><h3>{own.length} bản ghi của tôi</h3></div><FileText size={18} strokeWidth={1.5} /></div>{own.map((item) => <div className="catalog-row" key={item.id}><span className="mono">{item.id}</span><strong>{item.type}</strong><span>{hrDate(item.startsAt)} – {hrContractEnd(item.endsAt)}</span><StatusPill tone={effectiveContractStatus(item, hrToday()) === "active" ? "success" : "neutral"}>{item.document === "verified" ? (effectiveContractStatus(item, hrToday()) === "scheduled" ? "Đã xác minh · chờ hiệu lực" : effectiveContractStatus(item, hrToday()) === "expired" ? "Đã hết hạn" : "Đang hiệu lực") : item.document === "paper-signed" ? "Chờ HR xác minh" : "Thiếu bản ký"}</StatusPill></div>)}{!own.length && <p>Chưa có hợp đồng trong dữ liệu demo.</p>}</section>}
    <div className="privacy-note contract-privacy"><ShieldCheck size={16} strokeWidth={1.5} /><span>Demo chỉ lưu trạng thái đối chiếu bản giấy trong trình duyệt; chưa có tệp hợp đồng để tải hoặc kiểm tra quyền tải phía server.</span></div>
  </div>;
}
