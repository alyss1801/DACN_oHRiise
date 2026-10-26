"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, UsersRound } from "lucide-react";
import { WorkspaceHeader } from "@/features/employee/workspace-frame";
import { useSession } from "@/features/session/session-context";
import { useLeaveDemo } from "@/features/leave/leave-demo-context";
import { useHrDemo } from "@/features/hr/hr-demo-context";
import { personaEmployeeIds } from "@/lib/authorization/demo-identity";
import { demoBusinessDate } from "@/lib/demo-clock";

export function TeamCalendarWorkspace({ onNavigate }: { onNavigate: (id: string) => void }) {
  const today = demoBusinessDate();
  const [monthOffset, setMonthOffset] = useState(0);
  const { session } = useSession();
  const { store } = useLeaveDemo();
  const { employees } = useHrDemo();
  const selfId = personaEmployeeIds[session.id];
  const date = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1 + monthOffset, 1);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const label = new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(date);
  const firstOffset = (date.getDay() + 6) % 7;
  const totalDays = new Date(year, month, 0).getDate();
  const days = Array.from({ length: Math.ceil((firstOffset + totalDays) / 7) * 7 }, (_, index) => index < firstOffset || index >= firstOffset + totalDays ? null : index - firstOffset + 1);
  const teamRequests = store.requests.filter((item) => item.managerId === selfId && item.status !== "rejected" && item.status !== "withdrawn" && item.status !== "cancelled");
  const inMonth = teamRequests.filter((item) => item.from.slice(0, 7) <= prefix && item.to.slice(0, 7) >= prefix);
  return <div className="page-stack"><WorkspaceHeader eyebrow="TEAM CALENDAR" title="Lịch nghỉ đội ngũ" description="Đơn nghỉ được gửi tới bạn; dữ liệu WFH chưa nối vào lịch demo." /><section className="panel calendar-panel"><div className="calendar-head"><div><button className="icon-button" aria-label="Tháng trước" onClick={() => setMonthOffset((value) => value - 1)}><ChevronLeft size={16} strokeWidth={1.5} /></button><h3>{label}</h3><button className="icon-button" aria-label="Tháng sau" onClick={() => setMonthOffset((value) => value + 1)}><ChevronRight size={16} strokeWidth={1.5} /></button></div><div className="calendar-legends"><span><i className="amber" />Đã duyệt</span><span><i className="rose" />Đang duyệt / chờ hủy</span></div></div><div className="calendar-weekdays">{["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{days.map((day, index) => { const iso = day ? `${prefix}-${String(day).padStart(2, "0")}` : ""; const entries = teamRequests.filter((item) => day && item.from <= iso && item.to >= iso); return <div className={iso === today ? "today" : day ? "" : "muted"} key={index}>{day && <><span>{day}</span>{entries.map((item) => <button className={item.status === "approved" ? "amber" : "rose"} key={item.id} onClick={() => onNavigate("leave")}>{employees.find((person) => person.id === item.employeeId)?.name ?? item.employeeId}{item.status === "approved" ? " · phép" : " · chờ"}</button>)}</>}</div>; })}</div></section><div className="inline-alert"><UsersRound size={17} strokeWidth={1.5} /><div><strong>{inMonth.length} đơn nghỉ trong tháng</strong><p>Chỉ gồm đơn thuộc tuyến duyệt của bạn. Lịch này không suy diễn năng lực làm việc hay WFH.</p></div></div></div>;
}
