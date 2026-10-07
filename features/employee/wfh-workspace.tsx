"use client";

import { useState, type FormEvent } from "react";
import { CalendarDays, Check, CheckCircle2, Clock3, Eye, FileClock, Info, Laptop2, LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useDemoData } from "@/features/demo/demo-data-context";
import { FormField, StatusPill, WorkspaceHeader } from "./workspace-frame";

export function WfhWorkspace({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { requests: allRequests, addBusinessRequest } = useDemoData();
  const [date, setDate] = useState("2026-10-09");
  const [session, setSession] = useState("Cả ngày");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const requests = allRequests.filter((request) => request.employee === "Nguyễn Thu Hà" && request.type === "WFH");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (reason.trim().length < 15) { toast.error("Vui lòng mô tả kế hoạch làm việc ít nhất 15 ký tự."); return; }
    if (!confirmed) { toast.error("Bạn cần xác nhận chính sách WFH trước khi gửi."); return; }
    const formatted = new Intl.DateTimeFormat("vi-VN").format(new Date(`${date}T00:00:00`));
    addBusinessRequest({ idPrefix: "WFH-2026", type: "WFH", employee: "Nguyễn Thu Hà", initials: "NH", date: formatted, detail: `${session} · ${reason}` });
    setReason(""); setConfirmed(false);
    toast.success("Đã gửi yêu cầu WFH tới Team Lead.");
  }

  return (
    <div className="page-stack">
      <WorkspaceHeader eyebrow="WORK FROM HOME" title="Đăng ký làm việc tại nhà" description="Kiểm tra chính sách, gửi kế hoạch và theo dõi phê duyệt." />
      <section className="wfh-layout">
        <form className="panel workflow-form-card" onSubmit={submit}>
          <div className="form-card-head"><span><Laptop2 size={18} strokeWidth={1.5} /></span><div><h3>Yêu cầu WFH mới</h3><p>Team Lead sẽ nhận được kế hoạch và lịch đội ngũ.</p></div></div>
          <div className="form-grid two-cols"><FormField label="Ngày WFH" required><input type="date" value={date} min="2026-10-08" onChange={(event) => setDate(event.target.value)} /></FormField><FormField label="Thời lượng" required><select value={session} onChange={(event) => setSession(event.target.value)}><option>Cả ngày</option><option>Buổi sáng</option><option>Buổi chiều</option></select></FormField></div>
          <FormField label="Kế hoạch làm việc" hint={`${reason.length}/300 ký tự · mô tả đầu việc chính trong ngày.`} required><textarea maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ví dụ: Hoàn thiện component library và review prototype cùng Product team..." /></FormField>
          <label className="policy-check"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span><b><Check size={12} strokeWidth={1.5} /></b></span><p>Tôi đã đọc chính sách WFH và cam kết gửi Daily Report trước 18:00.</p></label>
          <button className="primary-button wide" type="submit">Gửi yêu cầu WFH</button>
        </form>
        <aside className="panel policy-card"><div className="panel-heading compact"><div><span className="eyebrow">CHÍNH SÁCH ÁP DỤNG</span><h3>WFH · Khối văn phòng</h3></div><ShieldCheck size={18} strokeWidth={1.5} /></div><div className="policy-list"><div><span>01</span><p>Đăng ký trước ít nhất <strong>01 ngày làm việc</strong>.</p></div><div><span>02</span><p>Tối đa <strong>02 ngày WFH</strong> mỗi tuần.</p></div><div><span>03</span><p>Check-in đúng ca và gửi <strong>Daily Report trước 18:00</strong>.</p></div><div><span>04</span><p>Duy trì kết nối trong giờ làm và tham gia Daily Meeting.</p></div></div><div className="privacy-note"><Info size={16} strokeWidth={1.5} /><span>Ảnh bằng chứng được làm mờ nội dung nhạy cảm và lưu 30 ngày theo chính sách.</span></div></aside>
      </section>
      <section className="panel wfh-awareness" aria-labelledby="wfh-awareness-title">
        <header>
          <div><span className="eyebrow">MINH BẠCH GIÁM SÁT</span><h3 id="wfh-awareness-title">Quyền riêng tư trong phiên WFH</h3><p>Chỉ thu thập tín hiệu công việc trong phiên đã được duyệt và khi bạn chủ động bắt đầu ca.</p></div>
          <StatusPill tone="success"><ShieldCheck size={13} strokeWidth={1.5} /> Bảo vệ đang áp dụng</StatusPill>
        </header>
        <div className="wfh-awareness-grid">
          <div><Eye size={18} strokeWidth={1.5} /><span><strong>Dữ liệu được ghi nhận</strong><small>Ứng dụng công việc, mốc thời gian và ảnh đã làm mờ; không ghi phím hoặc nội dung cá nhân.</small></span></div>
          <div><FileClock size={18} strokeWidth={1.5} /><span><strong>Lưu giữ 30 ngày</strong><small>Dữ liệu tự động hết hạn theo chính sách. Mọi lượt xem đều có audit log.</small></span></div>
          <div><LockKeyhole size={18} strokeWidth={1.5} /><span><strong>Quyền truy cập giới hạn</strong><small>Chỉ reviewer được phân công và HR có thẩm quyền mới xem bằng chứng.</small></span></div>
        </div>
        <div className="wfh-own-session">
          <div><span className="eyebrow">PHIÊN GẦN NHẤT CỦA BẠN</span><strong>02/10/2026 · WFH cả ngày</strong><small>08:31–17:46 · 6 tín hiệu công việc · không có vấn đề chờ làm rõ</small></div>
          <StatusPill tone="success"><CheckCircle2 size={13} strokeWidth={1.5} /> Báo cáo đã gửi</StatusPill>
          <button className="secondary-button" onClick={() => onNavigate("daily-report")}>Xem Daily Report</button>
        </div>
      </section>
      <section className="panel data-panel"><div className="data-panel-head"><div><span className="eyebrow">LỊCH SỬ YÊU CẦU</span><h3>WFH gần đây</h3></div></div><div className="request-list">{requests.map((request) => <div className="request-row" key={request.id}><div className="request-date"><CalendarDays size={16} strokeWidth={1.5} /><div><strong>{request.date}</strong><span>{request.detail.split(" · ")[0]}</span></div></div><div className="request-reason"><strong>{request.detail.split(" · ").slice(1).join(" · ")}</strong><span className="mono">{request.id}</span></div>{request.status === "pending" ? <StatusPill tone="warning"><Clock3 size={12} strokeWidth={1.5} /> Chờ duyệt</StatusPill> : request.status === "approved" ? <StatusPill tone="success"><CheckCircle2 size={12} strokeWidth={1.5} /> Đã duyệt</StatusPill> : <StatusPill tone="danger">Đã từ chối</StatusPill>}{request.status === "approved" && <button className="text-button inline" onClick={() => onNavigate("daily-report")}>Mở Daily Report</button>}</div>)}</div></section>
    </div>
  );
}
