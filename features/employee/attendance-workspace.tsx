"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileUp,
  MapPin,
  Plus,
  TimerReset,
} from "lucide-react";
import { toast } from "sonner";
import { useDemoData } from "@/features/demo/demo-data-context";
import { attendanceLogs } from "./mock-data";
import {
  FormField,
  StatusPill,
  WorkflowDialog,
  WorkspaceHeader,
} from "./workspace-frame";

export function AttendanceWorkspace({
  onNavigate,
}: {
  onNavigate: (id: string) => void;
}) {
  const { addBusinessRequest } = useDemoData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [eventDate, setEventDate] = useState("05/10/2026");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const visibleLogs = attendanceLogs.filter(
    (log) => statusFilter === "all" || log.status === statusFilter,
  );

  function submitAdjustment() {
    if (reason.trim().length < 10) {
      toast.error("Vui lòng mô tả vấn đề ít nhất 10 ký tự.");
      return;
    }
    addBusinessRequest({
      idPrefix: "ATT-2026",
      type: "Điều chỉnh chấm công",
      employee: "Nguyễn Thu Hà",
      initials: "NH",
      date: eventDate,
      detail: `Check-in muộn · ${reason}`,
    });
    setSubmitted(true);
    setDialogOpen(false);
    setReason("");
    toast.success("Đã gửi yêu cầu điều chỉnh chấm công.");
  }

  return (
    <div className="page-stack">
      <WorkspaceHeader
        eyebrow="CHẤM CÔNG"
        title="Chấm công"
        description="Theo dõi thời gian làm việc và lịch sử điểm danh của bạn."
        action={
          <button
            className="primary-button"
            onClick={() => setDialogOpen(true)}
          >
            <Plus size={16} strokeWidth={1.5} /> Tạo điều chỉnh
          </button>
        }
      />
      <nav className="module-tabs" aria-label="Chức năng chấm công">{[["overview","Tổng quan"],["history","Lịch sử điểm danh"],["adjustment","Đơn điều chỉnh"],["wfh","Làm việc từ xa"],["schedule","Quản lý ca"]].map(([id,label]) => <button className={activeTab === id ? "is-active" : ""} key={id} onClick={() => { setActiveTab(id); if (id === "adjustment") setDialogOpen(true); else if (id === "wfh") onNavigate("wfh"); else if (id === "schedule") onNavigate("schedule"); else window.requestAnimationFrame(() => document.getElementById(id === "history" ? "attendance-history" : "attendance-overview")?.scrollIntoView({ behavior: "smooth", block: "start" })); }}>{label}</button>)}</nav>
      <section className="attendance-overview" id="attendance-overview">
        <article className="panel attendance-live">
          <div className="panel-heading compact">
            <div>
              <span className="eyebrow">HÔM NAY · 07/10</span>
              <h3>Ca hành chính</h3>
            </div>
            <StatusPill tone="success">Đang làm việc</StatusPill>
          </div>
          <div className="attendance-times">
            <div>
              <span>Check-in</span>
              <strong>08:42</strong>
              <small>
                <MapPin size={12} strokeWidth={1.5} /> HCM-Q1 · hợp lệ
              </small>
            </div>
            <i />
            <div>
              <span>Thời gian hiện tại</span>
              <strong>14:36</strong>
              <small>
                <Clock3 size={12} strokeWidth={1.5} /> Đã làm 4h 54p
              </small>
            </div>
            <i />
            <div>
              <span>Check-out</span>
              <strong>--:--</strong>
              <small>Dự kiến 17:30</small>
            </div>
          </div>
        </article>
        <article className="panel attendance-stat">
          <span className="eyebrow">THÁNG 10</span>
          <strong>96%</strong>
          <p>Tỷ lệ đúng giờ</p>
          <div>
            <span>4 ngày đúng giờ</span>
            <span>1 ngoại lệ</span>
          </div>
        </article>
        <article className="panel attendance-stat">
          <span className="eyebrow">TỔNG GIỜ</span>
          <strong>32h 00p</strong>
          <p>Trên 40h kế hoạch</p>
          <div className="mini-progress">
            <i style={{ width: "80%" }} />
          </div>
        </article>
      </section>
      {submitted && (
        <div className="inline-alert success">
          <CheckCircle2 size={17} strokeWidth={1.5} />
          <div>
            <strong>Yêu cầu ngày 05/10 đang chờ duyệt</strong>
            <p>Team Lead sẽ xem log chấm công và phần giải trình của bạn.</p>
          </div>
          <StatusPill tone="warning">Chờ duyệt</StatusPill>
        </div>
      )}
      <section className="attendance-insights">
        <article className="panel attendance-calendar-card"><div className="data-panel-head"><div><span className="eyebrow">LỊCH ĐIỂM DANH</span><h3>Tháng 10/2026</h3></div><span className="filter-button">Hôm nay</span></div><div className="mini-calendar-weekdays">{["T2","T3","T4","T5","T6","T7","CN"].map((day) => <span key={day}>{day}</span>)}</div><div className="mini-calendar-grid">{Array.from({ length: 35 }, (_, index) => { const day = index - 2; const active = day > 0 && day <= 31; const tone = [2,3,6,7].includes(day) ? "present" : day === 4 ? "late" : day === 5 ? "wfh" : ""; return <span className={`${active ? "" : "is-muted"} ${tone} ${day === 7 ? "is-today" : ""}`} key={index}>{active ? day : ""}</span>; })}</div><div className="calendar-legend"><span><i className="present" />Có mặt</span><span><i className="late" />Đi muộn</span><span><i className="wfh" />WFH</span><span><i />Chưa điểm danh</span></div></article>
        <article className="panel weekly-hours-card"><div className="data-panel-head"><div><span className="eyebrow">THỐNG KÊ GIỜ LÀM</span><h3>Tuần này</h3></div><strong>32h / 40h</strong></div><div className="weekly-bars">{[["T2",72],["T3",88],["T4",78],["T5",69],["T6",54],["T7",0],["CN",0]].map(([day,value]) => <div key={day}><span><i style={{ height: `${value}%` }} /></span><small>{day}</small></div>)}</div><div className="weekly-summary"><span><b>8h 12p</b> Trung bình/ngày</span><span><b>96%</b> Đúng giờ</span><span><b>0h</b> Làm thêm</span></div></article>
      </section>
      <section className="panel data-panel" id="attendance-history">
        <div className="data-panel-head">
          <div>
            <span className="eyebrow">NHẬT KÝ CHI TIẾT</span>
            <h3>Tháng 10/2026</h3>
          </div>
          <div className="table-filters">
            <span className="filter-button" aria-label="Khoảng thời gian">
              <CalendarDays size={14} strokeWidth={1.5} /> 01–31/10/2026
            </span>
            <select
              className="filter-select"
              aria-label="Lọc trạng thái chấm công"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ok">Đúng giờ</option>
              <option value="late">Đi muộn</option>
              <option value="active">Đang làm</option>
            </select>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Tổng giờ</th>
                <th>Hình thức</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {visibleLogs.map((log) => (
                <tr key={log.date}>
                  <td>
                    <strong>{log.date}</strong>
                    <span>{log.day}</span>
                  </td>
                  <td className="mono">{log.checkIn}</td>
                  <td className="mono">{log.checkOut}</td>
                  <td className="mono">{log.total}</td>
                  <td>{log.mode}</td>
                  <td>
                    {log.status === "late" ? (
                      <StatusPill tone="warning">
                        <AlertTriangle size={12} strokeWidth={1.5} /> Muộn 37p
                      </StatusPill>
                    ) : log.status === "active" ? (
                      <StatusPill tone="blue">Đang làm</StatusPill>
                    ) : (
                      <StatusPill tone="success">Đúng giờ</StatusPill>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="workflow-shortcuts">
        <button onClick={() => onNavigate("wfh")}>
          <span>
            <MapPin size={17} strokeWidth={1.5} />
          </span>
          <div>
            <strong>Đăng ký làm việc tại nhà</strong>
            <p>Kiểm tra chính sách và gửi yêu cầu WFH.</p>
          </div>
        </button>
        <button onClick={() => onNavigate("ai-wfh-session")}>
          <span>
            <TimerReset size={17} strokeWidth={1.5} />
          </span>
          <div>
            <strong>Daily Report</strong>
            <p>Báo cáo bắt buộc cho ngày WFH đã duyệt.</p>
          </div>
        </button>
      </section>
      <WorkflowDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Điều chỉnh chấm công"
        description="Chọn sự kiện có vấn đề và cung cấp ngữ cảnh để Team Lead xem xét."
        footer={
          <>
            <button
              className="secondary-button"
              onClick={() => setDialogOpen(false)}
            >
              Hủy
            </button>
            <button className="primary-button" onClick={submitAdjustment}>
              Gửi yêu cầu
            </button>
          </>
        }
      >
        <div className="form-grid">
          <FormField label="Ngày cần điều chỉnh" required>
            <select
              value={eventDate}
              onChange={(event) => setEventDate(event.target.value)}
            >
              <option>05/10/2026</option>
              <option>02/10/2026</option>
            </select>
          </FormField>
          <FormField label="Loại vấn đề" required>
            <select>
              <option>Check-in muộn do lỗi ghi nhận</option>
              <option>Thiếu check-out</option>
              <option>Sai địa điểm</option>
            </select>
          </FormField>
          <FormField label="Giải trình" hint="Tối thiểu 10 ký tự." required>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Mô tả thời điểm và nguyên nhân..."
            />
          </FormField>
          <FormField label="Bằng chứng (không bắt buộc)">
            <label className="upload-zone">
              <FileUp size={18} strokeWidth={1.5} />
              <span>Chọn ảnh hoặc tài liệu</span>
              <small>PNG, JPG, PDF · tối đa 10 MB</small>
              <input
                className="sr-only"
                type="file"
                accept="image/png,image/jpeg,application/pdf"
                onChange={(event) =>
                  event.target.files?.[0] &&
                  toast.success(`Đã đính kèm ${event.target.files[0].name}.`)
                }
              />
            </label>
          </FormField>
        </div>
      </WorkflowDialog>
    </div>
  );
}
