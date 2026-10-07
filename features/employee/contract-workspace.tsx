"use client";

import { Check, Download, FileCheck2, FileText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { StatusPill, WorkspaceHeader } from "./workspace-frame";

export function ContractWorkspace() {
  return (
    <div className="page-stack">
      <WorkspaceHeader eyebrow="EMPLOYMENT CONTRACT" title="Hợp đồng lao động" description="Thông tin hợp đồng và tài liệu đã ký của bạn." action={<button className="secondary-button" onClick={() => toast.success("Đã chuẩn bị bản hợp đồng PDF.")}><Download size={15} strokeWidth={1.5} /> Tải bản PDF</button>} />
      <section className="contract-layout">
        <article className="panel contract-hero"><div className="contract-icon"><FileText size={24} strokeWidth={1.5} /></div><div><span className="eyebrow">HỢP ĐỒNG HIỆU LỰC</span><h3>Hợp đồng lao động xác định thời hạn</h3><p className="mono">HDLD-2024-0248 · Phiên bản 02</p></div><StatusPill tone="success"><Check size={12} strokeWidth={1.5} /> Đã ký</StatusPill><div className="contract-dates"><div><span>Ngày hiệu lực</span><strong>04/03/2024</strong></div><i /><div><span>Ngày kết thúc</span><strong>03/03/2027</strong></div><i /><div><span>Thời hạn còn lại</span><strong>1 năm 4 tháng</strong></div></div></article>
        <aside className="panel contract-side"><span className="eyebrow">THÔNG TIN CÔNG VIỆC</span><div className="contract-fields"><div><span>Chức danh</span><strong>Product Designer</strong></div><div><span>Phòng ban</span><strong>Sản phẩm</strong></div><div><span>Nơi làm việc</span><strong>HCM-Q1 · Hybrid</strong></div><div><span>Loại hình</span><strong>Toàn thời gian</strong></div></div></aside>
      </section>
      <section className="panel lifecycle-panel"><div className="data-panel-head"><div><span className="eyebrow">VÒNG ĐỜI TÀI LIỆU</span><h3>Lịch sử hợp đồng</h3></div><FileCheck2 size={18} strokeWidth={1.5} /></div><div className="lifecycle"><div className="done"><span><Check size={13} strokeWidth={2} /></span><div><strong>Tạo từ mẫu hợp đồng</strong><p>HR Operations · 28/02/2024 09:18</p></div></div><div className="done"><span><Check size={13} strokeWidth={2} /></span><div><strong>Hoàn tất dữ liệu nhân sự</strong><p>Nguyễn Thanh Lan · 29/02/2024 14:22</p></div></div><div className="done"><span><Check size={13} strokeWidth={2} /></span><div><strong>Xác nhận ký bản cứng</strong><p>Hai bên hoàn tất · 04/03/2024 10:30</p></div></div><div className="done"><span><Check size={13} strokeWidth={2} /></span><div><strong>Tải lên bản scan đã ký</strong><p>HR Operations · 04/03/2024 15:06</p></div></div></div></section>
      <div className="privacy-note contract-privacy"><ShieldCheck size={16} strokeWidth={1.5} /><span>Tài liệu hợp đồng được phân quyền độc lập. Mọi lượt tải xuống đều được ghi vào nhật ký truy cập.</span></div>
    </div>
  );
}
