"use client";

import { useState } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, MapPin, Navigation, RefreshCw, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { attendanceLogs } from "./mock-data";
import { DeviceAttendance } from "./device-attendance";
import { StatusPill, WorkspaceHeader } from "./workspace-frame";
import "./attendance-center-workspace.css";

type AttendanceTab = "gps" | "history" | "qr" | "device";
type CheckState = "idle" | "working" | "done";

const tabs: Array<{ id: AttendanceTab; label: string }> = [
  { id: "gps", label: "Điểm danh" },
  { id: "history", label: "Lịch sử điểm danh" },
  { id: "qr", label: "Điểm danh QR" },
  { id: "device", label: "Thẻ từ / vân tay" },
];

const qrCells = Array.from({ length: 121 }, (_, index) =>
  [0, 1, 2, 3, 4, 11, 15, 20, 23, 29, 33, 36, 40, 44, 47, 48, 49, 50, 51, 57, 60, 64, 68, 72, 76, 78, 80, 84, 89, 91, 94, 98, 100, 104, 108, 111, 112, 113, 114, 115, 118, 120].includes(index),
);

export function AttendanceCenterWorkspace() {
  const [activeTab, setActiveTab] = useState<AttendanceTab>("gps");
  const [statusFilter, setStatusFilter] = useState("all");
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [qrVersion, setQrVersion] = useState(1);
  const [deviceScan, setDeviceScan] = useState<"ready" | "success">("ready");
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
      {activeTab === "gps" && <GpsAttendance state={checkState} onCheckIn={checkIn} onCheckOut={checkOut} />}
      {activeTab === "history" && <AttendanceHistory statusFilter={statusFilter} setStatusFilter={setStatusFilter} visibleLogs={visibleLogs} />}
      {activeTab === "qr" && <QrAttendance version={qrVersion} onRefresh={() => { setQrVersion((value) => value + 1); toast.success("Đã làm mới mã QR điểm danh."); }} />}
      {activeTab === "device" && <DeviceAttendance scanState={deviceScan} onScan={() => { setDeviceScan("success"); toast.success("Đã nhận diện Nguyễn Thu Hà tại thiết bị HCM-Q1-ENT-02 lúc 08:42."); }} onReset={() => setDeviceScan("ready")} />}
    </div>
  );
}

function GpsAttendance({ state, onCheckIn, onCheckOut }: { state: CheckState; onCheckIn: () => void; onCheckOut: () => void }) {
  return (
    <section className="gps-attendance-layout">
      <article className="panel gps-check-card">
        <div className="gps-map"><span className="gps-ring ring-one" /><span className="gps-ring ring-two" /><span className="gps-pin"><MapPin size={25} strokeWidth={1.7} /></span><small>HCM-Q1</small></div>
        <div className="gps-check-copy">
          <span className="eyebrow">GPS VERIFIED · ±12 M</span>
          <h2>{state === "idle" ? "Sẵn sàng điểm danh" : state === "working" ? "Bạn đang trong ca làm việc" : "Đã hoàn tất ca hôm nay"}</h2>
          <p>72 Nguyễn Thị Minh Khai, Quận 3 · nằm trong bán kính văn phòng cho phép.</p>
          <div className="gps-actions"><button className="primary-button" disabled={state !== "idle"} onClick={onCheckIn}><Navigation size={16} strokeWidth={1.5} /> Check-in</button><button className="secondary-button" disabled={state !== "working"} onClick={onCheckOut}><CheckCircle2 size={16} strokeWidth={1.5} /> Check-out</button></div>
        </div>
      </article>
      <aside className="panel gps-session-card">
        <span className="eyebrow">PHIÊN HÔM NAY</span>
        <div><span>Ca làm việc</span><strong>08:30–17:30</strong></div>
        <div><span>Check-in</span><strong>{state === "idle" ? "Chưa ghi nhận" : "08:42 · GPS"}</strong></div>
        <div><span>Check-out</span><strong>{state === "done" ? "17:30 · GPS" : "Chưa ghi nhận"}</strong></div>
        <StatusPill tone={state === "idle" ? "neutral" : state === "working" ? "blue" : "success"}>{state === "idle" ? "Chưa bắt đầu" : state === "working" ? "Đang làm việc" : "Hoàn tất"}</StatusPill>
      </aside>
    </section>
  );
}

function AttendanceHistory({ statusFilter, setStatusFilter, visibleLogs }: { statusFilter: string; setStatusFilter: (value: string) => void; visibleLogs: typeof attendanceLogs }) {
  return (
    <section className="panel data-panel attendance-history-panel">
      <div className="data-panel-head">
        <div><h2>Lịch sử điểm danh</h2><p>Toàn bộ lượt check-in và check-out trong tháng.</p></div>
        <div className="table-filters"><span className="filter-button"><CalendarDays size={14} strokeWidth={1.5} /> 01–31/10/2026</span><select className="filter-select" aria-label="Lọc trạng thái điểm danh" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Tất cả trạng thái</option><option value="ontime">Đúng giờ</option><option value="late">Đi muộn</option><option value="active">Đang làm</option></select></div>
      </div>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>Ngày</th><th>Check-in</th><th>Check-out</th><th>Tổng giờ</th><th>Hình thức</th><th>Trạng thái</th></tr></thead><tbody>{visibleLogs.map((log) => <tr key={log.date}><td><strong>{log.date}</strong><span>{log.day}</span></td><td className="mono">{log.checkIn}</td><td className="mono">{log.checkOut}</td><td className="mono">{log.total}</td><td>{log.mode}</td><td>{log.status === "late" ? <StatusPill tone="warning"><AlertTriangle size={12} strokeWidth={1.5} /> Muộn 37p</StatusPill> : log.status === "active" ? <StatusPill tone="blue">Đang làm</StatusPill> : <StatusPill tone="success">Đúng giờ</StatusPill>}</td></tr>)}</tbody></table></div>
    </section>
  );
}

function QrAttendance({ version, onRefresh }: { version: number; onRefresh: () => void }) {
  return <section className="qr-attendance-layout"><article className="panel qr-scan-card"><div><span className="eyebrow">ĐIỂM DANH QR · OPTIONAL</span><h2>Quét mã tại văn phòng</h2><p>Phương án dự phòng khi định vị GPS không ổn định. Mã thay đổi sau mỗi 60 giây.</p><div className="qr-security-note"><ScanLine size={17} strokeWidth={1.5} /><span>QR chỉ hợp lệ trong mạng nội bộ và bán kính HCM-Q1.</span></div></div><div className="dynamic-qr-card"><div className="demo-qr" aria-label={`Mã QR điểm danh phiên bản ${version}`}>{qrCells.map((filled, index) => <i className={filled !== (version % 2 === 0 && index === 60) ? "filled" : ""} key={index} />)}</div><div className="qr-status"><Clock3 size={14} strokeWidth={1.5} /><span>Hiệu lực 60 giây</span></div><button className="secondary-button" onClick={onRefresh}><RefreshCw size={14} strokeWidth={1.5} /> Làm mới mã</button></div></article></section>;
}
