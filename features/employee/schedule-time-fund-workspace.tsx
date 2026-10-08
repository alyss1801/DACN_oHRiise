"use client";

import { useState } from "react";
import { CalendarCheck2, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, History, House } from "lucide-react";
import { StatusPill, WorkspaceHeader } from "./workspace-frame";
import "./schedule-time-fund-workspace.css";

type ScheduleView = "calendar" | "fund";
type WorkMode = "Văn phòng" | "Remote" | "Nghỉ phép" | "Off";

const workSchedule: Record<number, { mode: WorkMode; hours: string; log: string }> = {
  1: { mode: "Văn phòng", hours: "08:30–17:30", log: "Ca hành chính · HCM-Q1" },
  2: { mode: "Văn phòng", hours: "08:30–17:30", log: "Check-in 08:28 · Check-out 17:34" },
  3: { mode: "Remote", hours: "08:30–17:30", log: "WFH đã duyệt · Daily Report hoàn tất" },
  4: { mode: "Off", hours: "—", log: "Ngày nghỉ theo lịch" },
  5: { mode: "Off", hours: "—", log: "Ngày nghỉ theo lịch" },
  6: { mode: "Văn phòng", hours: "08:30–17:30", log: "Check-in 08:35 · Check-out 17:31" },
  7: { mode: "Văn phòng", hours: "08:30–17:30", log: "Check-in 08:42 · đang làm việc" },
  8: { mode: "Remote", hours: "08:30–17:30", log: "WFH cả ngày · đã phê duyệt" },
  9: { mode: "Nghỉ phép", hours: "Cả ngày", log: "Phép năm · LV-2026-191" },
  10: { mode: "Văn phòng", hours: "08:30–17:30", log: "Ca hành chính · HCM-Q1" },
  11: { mode: "Off", hours: "—", log: "Ngày nghỉ theo lịch" },
  12: { mode: "Off", hours: "—", log: "Ngày nghỉ theo lịch" },
  13: { mode: "Văn phòng", hours: "08:30–17:30", log: "Ca hành chính · HCM-Q1" },
  14: { mode: "Remote", hours: "08:30–17:30", log: "WFH dự kiến · chờ xác nhận" },
  15: { mode: "Văn phòng", hours: "08:30–17:30", log: "Ca hành chính · HCM-Q1" },
  16: { mode: "Văn phòng", hours: "08:30–17:30", log: "Ca hành chính · HCM-Q1" },
  17: { mode: "Văn phòng", hours: "08:30–17:30", log: "Ca hành chính · HCM-Q1" },
  18: { mode: "Off", hours: "—", log: "Ngày nghỉ theo lịch" },
  19: { mode: "Off", hours: "—", log: "Ngày nghỉ theo lịch" },
};

const fundMetrics = [
  { label: "Nghỉ phép", value: "8.5 ngày", note: "Phép năm còn khả dụng", icon: CalendarCheck2, tone: "blue" },
  { label: "Phép bù OT", value: "1.5 ngày", note: "Đã tích lũy", icon: CalendarDays, tone: "green" },
  { label: "Quỹ làm việc WFH", value: "2/4 ngày", note: "Đã sử dụng trong tháng", icon: House, tone: "cyan" },
  { label: "Giờ OT", value: "12 giờ", note: "Đã xác nhận trong tháng", icon: Clock3, tone: "violet" },
];

const fundHistory = [
  { date: "05/10", event: "WFH đã sử dụng", value: "−1 ngày", tone: "cyan" },
  { date: "03/10", event: "OT được xác nhận", value: "+4 giờ", tone: "violet" },
  { date: "01/10", event: "Cộng phép bù OT", value: "+0.5 ngày", tone: "green" },
  { date: "28/09", event: "Sử dụng phép năm", value: "−0.5 ngày", tone: "blue" },
];

export function ScheduleTimeFundWorkspace() {
  const [view, setView] = useState<ScheduleView>("calendar");
  const [selectedDay, setSelectedDay] = useState(7);

  return (
    <div className="page-stack schedule-fund-workspace">
      <WorkspaceHeader title="Lịch & Quỹ thời gian" subtitle="Tháng 10/2026 · Ca hành chính · 8.5 ngày phép còn lại" />
      <nav className="module-tabs" aria-label="Lịch và quỹ thời gian">
        <button className={view === "calendar" ? "is-active" : ""} onClick={() => setView("calendar")}>Lịch làm việc</button>
        <button className={view === "fund" ? "is-active" : ""} onClick={() => setView("fund")}>Quỹ thời gian & Quyền lợi</button>
      </nav>
      {view === "calendar" ? <WorkCalendar selectedDay={selectedDay} onSelectDay={setSelectedDay} /> : <TimeFund />}
    </div>
  );
}

function WorkCalendar({ selectedDay, onSelectDay }: { selectedDay: number; onSelectDay: (day: number) => void }) {
  const selected = workSchedule[selectedDay] ?? { mode: "Văn phòng" as WorkMode, hours: "08:30–17:30", log: "Chưa có log điểm danh" };
  const tone = selected.mode === "Văn phòng" ? "success" : selected.mode === "Remote" ? "blue" : selected.mode === "Nghỉ phép" ? "warning" : "neutral";

  return (
    <section className="work-calendar-shell panel">
      <aside className="work-calendar-sidebar">
        <div className="work-calendar-month-head"><button className="icon-button" aria-label="Tháng trước"><ChevronLeft size={17} strokeWidth={1.5} /></button><div><span>THÁNG 10</span><strong>2026</strong></div><button className="icon-button" aria-label="Tháng sau"><ChevronRight size={17} strokeWidth={1.5} /></button></div>
        <div className="work-calendar-legend"><span><i className="office" />Văn phòng</span><span><i className="remote" />Remote</span><span><i className="leave" />Nghỉ phép</span><span><i className="off" />Off</span></div>
        <div className="selected-day-log"><span className="eyebrow">LOG NGÀY {String(selectedDay).padStart(2, "0")}/10</span><h3>{selected.mode}</h3><p>{selected.hours}</p><StatusPill tone={tone}>{selected.mode}</StatusPill><div><Clock3 size={15} strokeWidth={1.5} /><span>{selected.log}</span></div>{selected.mode === "Remote" && <div><Check size={15} strokeWidth={1.5} /><span>Daily Report bắt buộc trước 18:00</span></div>}</div>
      </aside>
      <div className="work-month-calendar">
        <header><div><h2>Lịch làm việc</h2><p>Bấm vào một ngày để xem ca và trạng thái làm việc.</p></div><button className="filter-button" onClick={() => onSelectDay(7)}>Hôm nay</button></header>
        <div className="work-month-weekdays">{["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => <span key={day}>{day}</span>)}</div>
        <div className="work-month-grid">{Array.from({ length: 35 }, (_, index) => { const day = index - 2; const active = day > 0 && day <= 31; const entry = workSchedule[day]; const modeClass = entry?.mode === "Văn phòng" ? "office" : entry?.mode === "Remote" ? "remote" : entry?.mode === "Nghỉ phép" ? "leave" : entry?.mode === "Off" ? "off" : ""; return <button disabled={!active} className={`${day === selectedDay ? "is-selected" : ""} ${day === 7 ? "is-today" : ""} ${modeClass}`} key={index} onClick={() => active && onSelectDay(day)}><span>{active ? day : ""}</span>{entry && <small>{entry.mode}</small>}</button>; })}</div>
      </div>
    </section>
  );
}

function TimeFund() {
  return (
    <section className="time-fund-layout">
      <div className="time-fund-grid">
        {fundMetrics.map((metric) => { const Icon = metric.icon; return <article className={`panel time-fund-card ${metric.tone}`} key={metric.label}><div><span>{metric.label}</span><i><Icon size={19} strokeWidth={1.5} /></i></div><strong>{metric.value}</strong><p>{metric.note}</p></article>; })}
      </div>
      <aside className="panel time-fund-rule"><CalendarCheck2 size={22} strokeWidth={1.5} /><div><h3>Quy đổi phép bù OT</h3><p>Thời gian làm thêm được xác nhận nhưng không nằm trong đơn OT sẽ được đối soát và cộng dồn thành phép bù theo chính sách doanh nghiệp.</p></div></aside>
      <article className="panel time-fund-history">
        <header><div><h2>Lịch sử biến động</h2><p>Các khoản cộng, trừ quỹ được lưu theo từng nghiệp vụ đã duyệt.</p></div><span><History size={16} strokeWidth={1.5} /> Tháng 10/2026</span></header>
        <div className="time-fund-history-list">{fundHistory.map((item) => <div key={`${item.date}-${item.event}`}><time>{item.date}</time><span><i className={item.tone} />{item.event}</span><strong>{item.value}</strong></div>)}</div>
      </article>
    </section>
  );
}
