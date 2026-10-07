"use client";

import { useState } from "react";
import { CalendarDays, Check, Clock3, QrCode, RefreshCw, Repeat2, TimerReset, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useDemoData } from "@/features/demo/demo-data-context";
import { FormField, StatusPill, WorkflowDialog, WorkspaceHeader } from "./workspace-frame";

const week = [
  { day: "Thứ Hai", date: "12/10", shift: "08:30–17:30", mode: "Văn phòng", active: true },
  { day: "Thứ Ba", date: "13/10", shift: "08:30–17:30", mode: "WFH", active: true },
  { day: "Thứ Tư", date: "14/10", shift: "08:30–17:30", mode: "Văn phòng", active: true },
  { day: "Thứ Năm", date: "15/10", shift: "08:30–17:30", mode: "Văn phòng", active: true },
  { day: "Thứ Sáu", date: "16/10", shift: "08:30–17:30", mode: "Văn phòng", active: true },
  { day: "Thứ Bảy", date: "17/10", shift: "—", mode: "Nghỉ", active: false },
  { day: "Chủ Nhật", date: "18/10", shift: "—", mode: "Nghỉ", active: false },
];

const qrCells = Array.from({ length: 121 }, (_, index) =>
  [0, 1, 2, 3, 4, 11, 15, 20, 23, 29, 33, 36, 40, 44, 47, 48, 49, 50, 51, 57, 60, 64, 68, 72, 76, 78, 80, 84, 89, 91, 94, 98, 100, 104, 108, 111, 112, 113, 114, 115, 118, 120].includes(index),
);

export function ScheduleWorkspace({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { addBusinessRequest } = useDemoData();
  const [swapOpen, setSwapOpen] = useState(false);
  const [targetDate, setTargetDate] = useState("14/10/2026");
  const [colleague, setColleague] = useState("Lê Hoàng Đức");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [qrVersion, setQrVersion] = useState(1);

  function submitSwap() {
    if (!confirmed) {
      toast.error("Cần xác nhận đồng nghiệp đã đồng ý nhận ca.");
      return;
    }
    if (reason.trim().length < 8) {
      toast.error("Vui lòng nhập lý do ít nhất 8 ký tự.");
      return;
    }
    const id = addBusinessRequest({
      idPrefix: "SHIFT-2026",
      type: "Đổi ca",
      employee: "Nguyễn Thu Hà",
      initials: "NH",
      date: targetDate,
      detail: `${targetDate} · đổi với ${colleague} · ${reason.trim()}`,
    });
    setRequestId(id);
    setSwapOpen(false);
    setReason("");
    toast.success("Đã gửi yêu cầu đổi ca tới Team Lead.");
  }

  return (
    <div className="page-stack">
      <WorkspaceHeader
        eyebrow="LỊCH LÀM VIỆC"
        title="Ca làm việc của tôi"
        description="Theo dõi ca được phân công, QR check-in và yêu cầu đổi ca có xác nhận."
        action={<button className="primary-button" onClick={() => setSwapOpen(true)}><Repeat2 size={15} strokeWidth={1.5} /> Yêu cầu đổi ca</button>}
      />

      <section className="schedule-workspace-grid">
        <article className="panel schedule-week-card">
          <div className="panel-heading compact"><div><span className="eyebrow">TUẦN 12–18/10</span><h3>Ca hành chính · 40 giờ</h3></div><CalendarDays size={18} strokeWidth={1.5} /></div>
          <div className="schedule-week-list">
            {week.map((item) => <div key={item.date} className={!item.active ? "is-off" : ""}><span><strong>{item.day}</strong><small>{item.date}</small></span><b>{item.shift}</b><StatusPill tone={item.mode === "WFH" ? "blue" : item.active ? "success" : "neutral"}>{item.mode}</StatusPill></div>)}
          </div>
        </article>

        <article className="panel dynamic-qr-card">
          <div className="panel-heading compact"><div><span className="eyebrow">DYNAMIC QR</span><h3>Check-in HCM-Q1</h3></div><QrCode size={18} strokeWidth={1.5} /></div>
          <div className="demo-qr" aria-label={`Mã QR check-in phiên bản ${qrVersion}`}>{qrCells.map((filled, index) => <i className={filled !== (qrVersion % 2 === 0 && index === 60) ? "filled" : ""} key={index} />)}</div>
          <div className="qr-status"><Clock3 size={14} strokeWidth={1.5} /><span>Hiệu lực 60 giây · chỉ dùng trong bán kính GPS</span></div>
          <button className="secondary-button" onClick={() => { setQrVersion((value) => value + 1); toast.success("Đã làm mới mã QR check-in."); }}><RefreshCw size={14} strokeWidth={1.5} /> Làm mới mã</button>
        </article>

        <article className="panel comp-leave-card">
          <span className="eyebrow">NGHỈ BÙ · LIÊN KẾT OT</span>
          <div className="comp-flow"><div><TimerReset size={18} strokeWidth={1.5} /><span><strong>06 giờ OT</strong><small>Team Lead đã xác nhận</small></span></div><i /><div><Check size={18} strokeWidth={1.5} /><span><strong>0.75 ngày</strong><small>Tín dụng nghỉ bù khả dụng</small></span></div></div>
          <button className="text-button" onClick={() => onNavigate("leave")}>Dùng tín dụng nghỉ bù</button>
        </article>
      </section>

      {requestId && <div className="inline-alert success"><Check size={17} strokeWidth={1.5} /><div><strong>{requestId} đang chờ duyệt</strong><p>Team Lead thấy xác nhận đồng nghiệp và ngữ cảnh lịch đội ngũ.</p></div><StatusPill tone="warning">Chờ duyệt</StatusPill></div>}

      <WorkflowDialog open={swapOpen} onOpenChange={setSwapOpen} title="Yêu cầu đổi ca" description="Đồng nghiệp xác nhận trước, sau đó Team Lead phê duyệt trong Approval Inbox." footer={<><button className="secondary-button" onClick={() => setSwapOpen(false)}>Hủy</button><button className="primary-button" onClick={submitSwap}>Gửi yêu cầu</button></>}>
        <div className="form-grid two-cols">
          <FormField label="Ca cần đổi" required><select value={targetDate} onChange={(event) => setTargetDate(event.target.value)}><option>14/10/2026</option><option>15/10/2026</option><option>16/10/2026</option></select></FormField>
          <FormField label="Đổi với" required><select value={colleague} onChange={(event) => setColleague(event.target.value)}><option>Lê Hoàng Đức</option><option>Võ Minh Anh</option><option>Phạm Gia Bảo</option></select></FormField>
        </div>
        <FormField label="Lý do" required><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Mô tả lý do và phương án bàn giao..." /></FormField>
        <label className="policy-check"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span><b><Check size={12} strokeWidth={2} /></b></span><p><UsersRound size={14} strokeWidth={1.5} /> {colleague} đã xác nhận có thể nhận ca.</p></label>
      </WorkflowDialog>
    </div>
  );
}

export function OffboardingStatusWorkspace() {
  return (
    <div className="page-stack">
      <WorkspaceHeader eyebrow="EMPLOYMENT STATUS" title="Trạng thái nghỉ việc" description="Theo dõi thông báo và checklist bàn giao nếu có quy trình offboarding." />
      <section className="panel offboarding-self-empty">
        <span><Check size={24} strokeWidth={1.5} /></span>
        <h3>Không có quy trình nghỉ việc đang hoạt động</h3>
        <p>Hợp đồng và tài khoản của bạn đang ở trạng thái bình thường. Khi HR khởi tạo quy trình, ngày làm việc cuối, bàn giao và thu hồi thiết bị sẽ xuất hiện tại đây.</p>
        <div><StatusPill tone="success">Hợp đồng hiệu lực</StatusPill><StatusPill tone="success">Tài khoản hoạt động</StatusPill></div>
      </section>
    </div>
  );
}
