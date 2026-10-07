"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, UsersRound } from "lucide-react";
import { WorkspaceHeader } from "@/features/employee/workspace-frame";

const days = Array.from({ length: 35 }, (_, index) => index < 3 ? null : index - 2);
const events: Record<number, { label: string; tone: string }[]> = { 2: [{ label: "Tâm · WFH", tone: "blue" }], 9: [{ label: "Tâm · WFH", tone: "blue" }], 12: [{ label: "Bảo · Nghỉ phép", tone: "amber" }], 13: [{ label: "Anh · WFH", tone: "blue" }], 15: [{ label: "Vy · Chờ duyệt", tone: "rose" }], 23: [{ label: "Khoa · WFH", tone: "blue" }] };

export function TeamCalendarWorkspace() {
  const [monthOffset, setMonthOffset] = useState(0);
  const date = new Date(2026, 9 + monthOffset, 1);
  const label = new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(date);
  return <div className="page-stack"><WorkspaceHeader eyebrow="TEAM CALENDAR" title="Lịch đội ngũ" description="WFH, nghỉ phép và tín hiệu năng lực của Data Platform." /><section className="panel calendar-panel"><div className="calendar-head"><div><button className="icon-button" aria-label="Tháng trước" onClick={() => setMonthOffset((value) => value - 1)}><ChevronLeft size={16} strokeWidth={1.5} /></button><h3>{label}</h3><button className="icon-button" aria-label="Tháng sau" onClick={() => setMonthOffset((value) => value + 1)}><ChevronRight size={16} strokeWidth={1.5} /></button></div><div className="calendar-legends"><span><i className="blue" />WFH</span><span><i className="amber" />Nghỉ phép</span><span><i className="rose" />Chờ duyệt</span></div></div><div className="calendar-weekdays">{["Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7","CN"].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{days.map((day, index) => <div className={monthOffset === 0 && day === 7 ? "today" : day ? "" : "muted"} key={index}>{day && <><span>{day}</span>{monthOffset === 0 && events[day]?.map((event) => <p className={event.tone} key={event.label}>{event.label}</p>)}</>}</div>)}</div></section><div className={`inline-alert ${monthOffset === 0 ? "success" : ""}`}><UsersRound size={17} strokeWidth={1.5} /><div><strong>{monthOffset === 0 ? "Năng lực đội ngũ tuần này ổn định" : "Không có sự kiện demo trong tháng này"}</strong><p>{monthOffset === 0 ? "Không có ngày nào dưới ngưỡng 70% nhân sự sẵn sàng." : "Quay lại tháng 10/2026 để xem dữ liệu WFH và nghỉ phép."}</p></div></div></div>;
}
