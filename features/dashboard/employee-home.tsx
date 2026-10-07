"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Coffee,
  FileText,
  Laptop2,
  MapPin,
  PlaneTakeoff,
  Plus,
  ReceiptText,
  TimerReset,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/features/session/session-context";
import { WorkRhythmChart } from "./work-rhythm-chart";

const dateLabel = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  timeZone: "Asia/Ho_Chi_Minh",
}).format(new Date());

export function EmployeeHome({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { session, can } = useSession();
  const [checkedIn, setCheckedIn] = useState(false);

  function toggleAttendance() {
    setCheckedIn((value) => !value);
    toast.success(checkedIn ? "Đã ghi nhận check-out lúc 17:32." : "Đã check-in tại HCM-Q1 lúc 08:42.");
  }

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div>
          <div className="eyebrow">{dateLabel.toUpperCase()}</div>
          <h2>Chào buổi sáng, Hà.</h2>
          <p>{session.role} · {session.branch}</p>
        </div>
        <button className="primary-button" onClick={() => onNavigate("leave")}><Plus size={16} strokeWidth={1.5} /> Tạo yêu cầu</button>
      </section>

      <section className="bento-grid" aria-label="Tổng quan ngày làm việc">
        <article className="panel today-card">
          <div className="panel-heading">
            <div><span className="eyebrow">TRẠNG THÁI HÔM NAY</span><h3>{checkedIn ? "Đang làm việc" : "Sẵn sàng bắt đầu"}</h3></div>
            <span className={`status-badge ${checkedIn ? "success" : "neutral"}`}><i /> {checkedIn ? "Đã check-in" : "Chưa check-in"}</span>
          </div>
          <div className="today-layout">
            <div className="time-orbit">
              <div className="time-orbit-ring" />
              <strong>{checkedIn ? "08:42" : "--:--"}</strong>
              <span>{checkedIn ? "Bắt đầu ca" : "Chờ ghi nhận"}</span>
            </div>
            <div className="today-details">
              <div><Clock3 size={16} strokeWidth={1.5} /><span>Ca làm việc</span><strong>08:30 — 17:30</strong></div>
              <div><MapPin size={16} strokeWidth={1.5} /><span>Địa điểm</span><strong>Văn phòng HCM-Q1</strong></div>
              <div><Wifi size={16} strokeWidth={1.5} /><span>Kết nối</span><strong>Office network</strong></div>
              <button className={checkedIn ? "secondary-button wide" : "primary-button wide"} onClick={toggleAttendance}>
                {checkedIn ? <TimerReset size={16} strokeWidth={1.5} /> : <Check size={16} strokeWidth={1.5} />}
                {checkedIn ? "Check-out" : "Check-in ngay"}
              </button>
            </div>
          </div>
        </article>

        <article className="panel leave-card">
          <div className="panel-heading compact"><div><span className="eyebrow">PHÉP NĂM 2026</span><h3>Số dư nghỉ phép</h3></div><PlaneTakeoff size={18} strokeWidth={1.5} /></div>
          <div className="leave-metric"><strong>8.5</strong><span>ngày còn lại</span></div>
          <div className="progress-track"><i style={{ width: "54%" }} /></div>
          <div className="metric-row"><span>Đã dùng <b>7 ngày</b></span><span>Chờ duyệt <b>0.5 ngày</b></span></div>
          <button className="text-button" onClick={() => onNavigate("leave")}>Xem chi tiết <ArrowUpRight size={14} strokeWidth={1.5} /></button>
        </article>

        <article className="panel schedule-card">
          <div className="panel-heading compact"><div><span className="eyebrow">TIẾP THEO</span><h3>Lịch hôm nay</h3></div><CalendarDays size={18} strokeWidth={1.5} /></div>
          <div className="schedule-list">
            <div className="schedule-row current"><time>09:30</time><i /><div><strong>Daily Product Sync</strong><span>Google Meet · 30 phút</span></div></div>
            <div className="schedule-row"><time>11:00</time><i /><div><strong>Review design system</strong><span>Phòng Mercury · 45 phút</span></div></div>
            <div className="schedule-row"><time>14:30</time><i /><div><strong>Focus time</strong><span>Không gian tập trung</span></div></div>
          </div>
        </article>

        <article className="panel work-rhythm-card">
          <div className="panel-heading compact"><div><span className="eyebrow">NHỊP LÀM VIỆC</span><h3>7 ngày gần đây</h3></div><span className="delta">+4.2%</span></div>
          <WorkRhythmChart />
          <div className="rhythm-summary"><div><strong>8h 06p</strong><span>Trung bình</span></div><div><strong>96%</strong><span>Đúng giờ</span></div><div><strong>1</strong><span>Ngoại lệ</span></div></div>
        </article>

        <article className="panel quick-card">
          <div className="panel-heading compact"><div><span className="eyebrow">LỐI TẮT</span><h3>Tác vụ thường dùng</h3></div></div>
          <div className="quick-grid">
            <button onClick={() => onNavigate("leave")}><span><PlaneTakeoff size={17} strokeWidth={1.5} /></span>Nghỉ phép</button>
            <button onClick={() => onNavigate("wfh")}><span><Laptop2 size={17} strokeWidth={1.5} /></span>Đăng ký WFH</button>
            <button onClick={() => onNavigate("expenses")}><span><ReceiptText size={17} strokeWidth={1.5} /></span>Khai chi phí</button>
            <button onClick={() => onNavigate("daily-report")}><span><FileText size={17} strokeWidth={1.5} /></span>Daily Report</button>
          </div>
        </article>

        <article className="panel activity-card">
          <div className="panel-heading compact"><div><span className="eyebrow">CẬP NHẬT</span><h3>Việc cần lưu ý</h3></div><span className="count-badge">3</span></div>
          <div className="activity-list">
            <button onClick={() => onNavigate("contracts")}><span className="activity-icon amber"><FileText size={16} strokeWidth={1.5} /></span><div><strong>Hợp đồng sắp đến hạn</strong><p>Phụ lục làm việc kết thúc sau 21 ngày.</p></div><time>08:12</time></button>
            <button onClick={() => onNavigate("leave")}><span className="activity-icon green"><CheckCircle2 size={16} strokeWidth={1.5} /></span><div><strong>Đơn nghỉ phép đã duyệt</strong><p>Trần Minh Quân đã duyệt yêu cầu 12/10.</p></div><time>Hôm qua</time></button>
            {can("approvals") && <button onClick={() => onNavigate("approvals")}><span className="activity-icon blue"><Coffee size={16} strokeWidth={1.5} /></span><div><strong>4 yêu cầu chờ bạn</strong><p>2 WFH, 1 nghỉ phép và 1 chi phí.</p></div><time>Mới</time></button>}
          </div>
        </article>
      </section>
    </div>
  );
}
