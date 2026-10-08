"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Navigation,
  RefreshCw,
  ScanLine,
} from "lucide-react";
import { toast } from "sonner";
import { attendanceLogs } from "./mock-data";
import { DeviceAttendance } from "./device-attendance";
import { StatusPill, WorkspaceHeader } from "./workspace-frame";

type AttendanceTab = "gps" | "qr" | "device" | "schedule";
type CheckState = "idle" | "working" | "done";
type WorkMode = "Văn phòng" | "Remote" | "Nghỉ phép" | "Off";

const tabs: Array<{ id: AttendanceTab; label: string }> = [
  { id: "gps", label: "Điểm danh" },
  { id: "qr", label: "Điểm danh QR" },
  { id: "device", label: "Thẻ từ / vân tay" },
  { id: "schedule", label: "Lịch làm việc" },
];

const qrCells = Array.from({ length: 121 }, (_, index) =>
  [0, 1, 2, 3, 4, 11, 15, 20, 23, 29, 33, 36, 40, 44, 47, 48, 49, 50, 51, 57, 60, 64, 68, 72, 76, 78, 80, 84, 89, 91, 94, 98, 100, 104, 108, 111, 112, 113, 114, 115, 118, 120].includes(index),
);

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

export function AttendanceHubWorkspace() {
  const [activeTab, setActiveTab] = useState<AttendanceTab>("gps");
  const [statusFilter, setStatusFilter] = useState("all");
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [qrVersion, setQrVersion] = useState(1);
  const [deviceScan, setDeviceScan] = useState<"ready" | "success">("ready");
  const [selectedDay, setSelectedDay] = useState(7);
  const visibleLogs = attendanceLogs.filter((log) => statusFilter === "all" || log.status === statusFilter);

  function checkIn() {
    setCheckState("working");
    toast.success("Check-in GPS thành công tại HCM-Q1 lúc 08:42.");
  }

  function checkOut() {
    setCheckState("done");
    toast.success("Check-out thành công. Tổng thời gian: 8h 48p.");
  }

  return (
    <div className="page-stack attendance-workspace">
      <WorkspaceHeader title="Điểm danh" subtitle="Tháng 10/2026 · 96% đúng giờ · 32h/40h" />
      <nav className="module-tabs" aria-label="Chức năng điểm danh">
        {tabs.map((tab) => <button className={activeTab === tab.id ? "is-active" : ""} key={tab.id} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
      </nav>
      {activeTab === "gps" && <GpsAttendance state={checkState} onCheckIn={checkIn} onCheckOut={checkOut} statusFilter={statusFilter} setStatusFilter={setStatusFilter} visibleLogs={visibleLogs} />}
      {activeTab === "qr" && <QrAttendance version={qrVersion} onRefresh={() => { setQrVersion((value) => value + 1); toast.success("Đã làm mới mã QR điểm danh."); }} />}
      {activeTab === "device" && (
        <DeviceAttendance
          scanState={deviceScan}
          onScan={() => {
            setDeviceScan("success");
            toast.success("Đã nhận diện Nguyễn Thu Hà tại thiết bị HCM-Q1-ENT-02 lúc 08:42.");
          }}
          onReset={() => setDeviceScan("ready")}
        />
      )}
      {activeTab === "schedule" && <WorkCalendar selectedDay={selectedDay} onSelectDay={setSelectedDay} />}
    </div>
  );
}

function GpsAttendance({ state, onCheckIn, onCheckOut, statusFilter, setStatusFilter, visibleLogs }: { state: CheckState; onCheckIn: () => void; onCheckOut: () => void; statusFilter: string; setStatusFilter: (value: string) => void; visibleLogs: typeof attendanceLogs }) {
  return <>
    <section className="gps-attendance-layout">
      <article className="panel gps-check-card"><div className="gps-map"><span className="gps-ring ring-one" /><span className="gps-ring ring-two" /><span className="gps-pin"><MapPin size={25} strokeWidth={1.7} /></span><small>HCM-Q1</small></div><div className="gps-check-copy"><span className="eyebrow">GPS VERIFIED · ±12 M</span><h2>{state === "idle" ? "Sẵn sàng điểm danh" : state === "working" ? "Bạn đang trong ca làm việc" : "Đã hoàn tất ca hôm nay"}</h2><p>72 Nguyễn Thị Minh Khai, Quận 3 · nằm trong bán kính văn phòng cho phép.</p><div className="gps-actions"><button className="primary-button" disabled={state !== "idle"} onClick={onCheckIn}><Navigation size={16} strokeWidth={1.5} /> Check-in</button><button className="secondary-button" disabled={state !== "working"} onClick={onCheckOut}><CheckCircle2 size={16} strokeWidth={1.5} /> Check-out</button></div></div></article>
      <aside className="panel gps-session-card"><span className="eyebrow">PHIÊN HÔM NAY</span><div><span>Ca làm việc</span><strong>08:30–17:30</strong></div><div><span>Check-in</span><strong>{state === "idle" ? "Chưa ghi nhận" : "08:42 · GPS"}</strong></div><div><span>Check-out</span><strong>{state === "done" ? "17:30 · GPS" : "Chưa ghi nhận"}</strong></div><StatusPill tone={state === "idle" ? "neutral" : state === "working" ? "blue" : "success"}>{state === "idle" ? "Chưa bắt đầu" : state === "working" ? "Đang làm việc" : "Hoàn tất"}</StatusPill></aside>
    </section>
    <section className="panel data-panel"><div className="data-panel-head"><div><span className="eyebrow">NHẬT KÝ ĐIỂM DANH</span><h3>Tháng 10/2026</h3></div><div className="table-filters"><span className="filter-button"><CalendarDays size={14} strokeWidth={1.5} /> 01–31/10/2026</span><select className="filter-select" aria-label="Lọc trạng thái điểm danh" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Tất cả trạng thái</option><option value="ok">Đúng giờ</option><option value="late">Đi muộn</option><option value="active">Đang làm</option></select></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Ngày</th><th>Check-in</th><th>Check-out</th><th>Tổng giờ</th><th>Hình thức</th><th>Trạng thái</th></tr></thead><tbody>{visibleLogs.map((log) => <tr key={log.date}><td><strong>{log.date}</strong><span>{log.day}</span></td><td className="mono">{log.checkIn}</td><td className="mono">{log.checkOut}</td><td className="mono">{log.total}</td><td>{log.mode}</td><td>{log.status === "late" ? <StatusPill tone="warning"><AlertTriangle size={12} strokeWidth={1.5} /> Muộn 37p</StatusPill> : log.status === "active" ? <StatusPill tone="blue">Đang làm</StatusPill> : <StatusPill tone="success">Đúng giờ</StatusPill>}</td></tr>)}</tbody></table></div></section>
  </>;
}

function QrAttendance({ version, onRefresh }: { version: number; onRefresh: () => void }) {
  return <section className="qr-attendance-layout"><article className="panel qr-scan-card"><div><span className="eyebrow">ĐIỂM DANH QR · OPTIONAL</span><h2>Quét mã tại văn phòng</h2><p>Phương án dự phòng khi định vị GPS không ổn định. Mã thay đổi sau mỗi 60 giây.</p><div className="qr-security-note"><ScanLine size={17} strokeWidth={1.5} /><span>QR chỉ hợp lệ trong mạng nội bộ và bán kính HCM-Q1.</span></div></div><div className="dynamic-qr-card"><div className="demo-qr" aria-label={`Mã QR điểm danh phiên bản ${version}`}>{qrCells.map((filled, index) => <i className={filled !== (version % 2 === 0 && index === 60) ? "filled" : ""} key={index} />)}</div><div className="qr-status"><Clock3 size={14} strokeWidth={1.5} /><span>Hiệu lực 60 giây</span></div><button className="secondary-button" onClick={onRefresh}><RefreshCw size={14} strokeWidth={1.5} /> Làm mới mã</button></div></article></section>;
}

function WorkCalendar({ selectedDay, onSelectDay }: { selectedDay: number; onSelectDay: (day: number) => void }) {
  const selected = workSchedule[selectedDay] ?? { mode: "Văn phòng" as WorkMode, hours: "08:30–17:30", log: "Chưa có log điểm danh" };
  const tone = selected.mode === "Văn phòng" ? "success" : selected.mode === "Remote" ? "blue" : selected.mode === "Nghỉ phép" ? "warning" : "neutral";
  return <section className="work-calendar-shell panel"><aside className="work-calendar-sidebar"><div className="work-calendar-month-head"><button className="icon-button" aria-label="Tháng trước"><ChevronLeft size={17} strokeWidth={1.5} /></button><div><span>THÁNG 10</span><strong>2026</strong></div><button className="icon-button" aria-label="Tháng sau"><ChevronRight size={17} strokeWidth={1.5} /></button></div><div className="work-calendar-legend"><span><i className="office" />Văn phòng</span><span><i className="remote" />Remote</span><span><i className="leave" />Nghỉ phép</span><span><i className="off" />Off</span></div><div className="selected-day-log"><span className="eyebrow">LOG NGÀY {String(selectedDay).padStart(2, "0")}/10</span><h3>{selected.mode}</h3><p>{selected.hours}</p><StatusPill tone={tone}>{selected.mode}</StatusPill><div><Clock3 size={15} strokeWidth={1.5} /><span>{selected.log}</span></div>{selected.mode === "Remote" && <div><Check size={15} strokeWidth={1.5} /><span>Daily Report bắt buộc trước 18:00</span></div>}</div></aside><div className="work-month-calendar"><header><div><h2>Lịch làm việc</h2><p>Bấm vào một ngày để xem ca và log tương ứng.</p></div><button className="filter-button" onClick={() => onSelectDay(7)}>Hôm nay</button></header><div className="work-month-weekdays">{["T2","T3","T4","T5","T6","T7","CN"].map((day) => <span key={day}>{day}</span>)}</div><div className="work-month-grid">{Array.from({ length: 35 }, (_, index) => { const day = index - 2; const active = day > 0 && day <= 31; const entry = workSchedule[day]; const modeClass = entry?.mode === "Văn phòng" ? "office" : entry?.mode === "Remote" ? "remote" : entry?.mode === "Nghỉ phép" ? "leave" : entry?.mode === "Off" ? "off" : ""; return <button disabled={!active} className={`${day === selectedDay ? "is-selected" : ""} ${day === 7 ? "is-today" : ""} ${modeClass}`} key={index} onClick={() => active && onSelectDay(day)}><span>{active ? day : ""}</span>{entry && <small>{entry.mode}</small>}</button>; })}</div></div></section>;
}
