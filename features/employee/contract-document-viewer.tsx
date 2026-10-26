"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { HrContract, HrEmployee } from "@/features/hr/hr-demo-data";
import { hrContractEnd, hrDate } from "@/features/hr/hr-demo-data";

const documentStatus = {
  missing: "Chưa có bản ký",
  "paper-signed": "Đã ghi nhận bản ký giấy, chờ xác minh",
  verified: "HR đã xác minh bản ký giấy",
} as const;

function DocumentField({ label, value }: { label: string; value?: string | null }) {
  return <div><dt>{label}</dt><dd>{value?.trim() || "Chưa có dữ liệu"}</dd></div>;
}

export function ContractDocumentViewer({ contract, employee, ownerName, open, onOpenChange }: {
  contract: HrContract | null;
  employee: HrEmployee | null;
  ownerName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!contract || !employee) return null;

  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="dialog-overlay" />
      <Dialog.Content className="contract-document-dialog">
        <div className="contract-document-toolbar">
          <div><Dialog.Title>Xem hợp đồng {contract.id}</Dialog.Title><Dialog.Description>Bản dựng từ dữ liệu hợp đồng demo</Dialog.Description></div>
          <Dialog.Close className="icon-button" aria-label="Đóng hợp đồng"><X size={19} /></Dialog.Close>
        </div>
        <div className="contract-document-scroll">
          <article className="contract-document-sheet" aria-label={`Toàn bộ hợp đồng demo ${contract.id}`}>
            <div className="contract-document-brand"><strong>oHRiise</strong><span>BẢN DỰNG DEMO · KHÔNG PHẢI TỆP ĐÃ KÝ</span></div>
            <header className="contract-document-title"><p>HỒ SƠ HỢP ĐỒNG LAO ĐỘNG</p><h2>{contract.type}</h2><span>Số {contract.id} · Phiên bản {contract.version}</span></header>
            <section className="contract-document-section"><h3>1. Thông tin các bên</h3><dl className="contract-document-fields"><DocumentField label="Đơn vị quản lý" value="oHRiise Company (demo)" /><DocumentField label="Người lao động" value={employee.name} /><DocumentField label="Mã nhân sự" value={employee.id} /><DocumentField label="Email" value={employee.email} /><DocumentField label="Điện thoại" value={employee.phone} /><DocumentField label="Địa chỉ" value={employee.address} /></dl></section>
            <section className="contract-document-section"><h3>2. Nội dung công việc và thời hạn</h3><dl className="contract-document-fields"><DocumentField label="Loại hợp đồng" value={contract.type} /><DocumentField label="Loại hình làm việc" value={employee.employmentType} /><DocumentField label="Chức danh" value={employee.position} /><DocumentField label="Phòng ban" value={employee.department} /><DocumentField label="Chi nhánh" value={employee.branch} /><DocumentField label="Ngày bắt đầu" value={hrDate(contract.startsAt)} /><DocumentField label="Ngày kết thúc" value={hrContractEnd(contract.endsAt)} /><DocumentField label="Người phụ trách hồ sơ" value={ownerName ?? contract.ownerId} /></dl></section>
            <section className="contract-document-section"><h3>3. Thông tin hồ sơ và bản ký</h3><dl className="contract-document-fields"><DocumentField label="Tình trạng tài liệu" value={documentStatus[contract.document]} /><DocumentField label="Ngày ghi nhận bản ký" value={contract.signedAt ? new Date(contract.signedAt).toLocaleDateString("vi-VN") : undefined} /><DocumentField label="Tham chiếu bản ký" value={contract.signedEvidence} /><DocumentField label="Ngày HR xác minh" value={contract.verifiedAt ? new Date(contract.verifiedAt).toLocaleDateString("vi-VN") : undefined} /><DocumentField label="Người xác minh" value={contract.verifiedBy} /><DocumentField label="Căn cứ xác minh" value={contract.verificationEvidence} /><DocumentField label="Ghi chú" value={contract.note} /></dl></section>
            <section className="contract-document-section"><h3>4. Điều khoản chưa có trong dữ liệu demo</h3><p>Hồ sơ hiện chưa lưu mức lương, thời giờ làm việc, chế độ phúc lợi, điều khoản chi tiết hoặc nội dung chữ ký. Các thông tin này cần được đối chiếu với bản hợp đồng gốc trước khi sử dụng cho nghiệp vụ.</p></section>
            <footer className="contract-document-footer"><span>Đại diện đơn vị<br /><small>Chưa có chữ ký trong demo</small></span><span>Người lao động<br /><small>Chưa có chữ ký trong demo</small></span></footer>
          </article>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
