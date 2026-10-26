"use client";

import { useState } from "react";
import { Eye, EyeOff, Info, Landmark, WalletCards } from "lucide-react";
import { useSession } from "@/features/session/session-context";
import { WorkspaceHeader } from "./workspace-frame";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export function PayslipWorkspace() {
  const { fieldVisibility, can, session } = useSession();
  const [revealed, setRevealed] = useState(false);
  const [month, setMonth] = useState("09/2026");
  const canReveal = can("payslip", "view");
  const display = (amount: number) => revealed && canReveal ? money.format(amount) : "•••••••• ₫";

  if (session.id !== "employee") return <div className="page-stack"><WorkspaceHeader eyebrow="PAYSLIP" title="Phiếu lương của tôi" description="Dữ liệu mẫu chỉ có cho nhân viên Nguyễn Thu Hà." /><section className="panel"><p>Chưa có phiếu lương minh họa liên kết với hồ sơ của persona này. Không hiển thị phiếu của người khác.</p></section></div>;

  return (
    <div className="page-stack">
      <WorkspaceHeader eyebrow="PAYSLIP" title="Phiếu lương của tôi" description="Phiếu lương minh họa cục bộ; chưa kết nối MISA hoặc có tệp PDF." action={<div className="payslip-actions"><select value={month} onChange={(event) => setMonth(event.target.value)}><option>09/2026</option><option>08/2026</option><option>07/2026</option></select></div>} />
      <section className="payslip-layout">
        <article className="panel payslip-main"><div className="payslip-head"><div><span className="eyebrow">THỰC NHẬN · {month}</span><strong>{display(28745000)}</strong><p>Chuyển khoản ngày 30/09/2026</p></div><button className="icon-button" disabled={!canReveal} onClick={() => setRevealed((value) => !value)} aria-label={revealed ? "Ẩn số tiền" : "Hiện số tiền"}>{revealed ? <EyeOff size={17} strokeWidth={1.5} /> : <Eye size={17} strokeWidth={1.5} />}</button></div><div className="payslip-sections"><div><h3>Thu nhập</h3><Row label="Lương theo hợp đồng" value={display(30000000)} /><Row label="Phụ cấp" value={display(1800000)} /><Row label="Hỗ trợ làm việc" value={display(500000)} /><Row label="Tổng thu nhập" value={display(32300000)} total /></div><div><h3>Khấu trừ</h3><Row label="Bảo hiểm bắt buộc" value={display(3150000)} /><Row label="Thuế TNCN" value={display(405000)} /><Row label="Tổng khấu trừ" value={display(3555000)} total /></div></div></article>
        <aside className="panel payslip-side"><div className="panel-heading compact"><div><span className="eyebrow">TÀI KHOẢN NHẬN · MINH HỌA</span><h3>Techcombank</h3></div><Landmark size={18} strokeWidth={1.5} /></div><div className="bank-card"><span>NGUYEN THU HA</span><strong>{fieldVisibility("bankAccount") === "visible" ? "1903 8372 6520 18" : "1903 •••• •••• 18"}</strong></div><div className="sync-source"><WalletCards size={16} strokeWidth={1.5} /><div><strong>Nguồn: dữ liệu mẫu</strong><p>MISA AMIS: chưa triển khai tích hợp</p></div></div><div className="boundary-note compact"><Info size={15} strokeWidth={1.5} /><p>Số liệu chỉ dùng minh họa UI, không phải phiếu đã phát hành hay kết quả tính lương.</p></div></aside>
      </section>
    </div>
  );
}

function Row({ label, value, total }: { label: string; value: string; total?: boolean }) { return <div className={total ? "payslip-row total" : "payslip-row"}><span>{label}</span><strong>{value}</strong></div>; }
