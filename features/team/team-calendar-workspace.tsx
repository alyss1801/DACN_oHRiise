"use client";

import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { WorkspaceHeader } from "@/features/employee/workspace-frame";
import { useSession } from "@/features/session/session-context";
import { useLeaveDemo } from "@/features/leave/leave-demo-context";
import { useHrDemo } from "@/features/hr/hr-demo-context";
import { useDemoData } from "@/features/demo/demo-data-context";
import { useWfhDemo } from "@/features/wfh/wfh-demo-context";
import { useDemoClock } from "@/features/demo/demo-clock-context";
import { personaEmployeeIds } from "@/lib/authorization/demo-identity";
import { isoWeek, shortDate, teamDay } from "./team-view-model";

const weekdayLabels = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
function moveDate(date: string, days: number) { const next = new Date(`${date}T12:00:00Z`); next.setUTCDate(next.getUTCDate() + days); return next.toISOString().slice(0, 10); }
function moveMonth(date: string, months: number) { const next = new Date(`${date.slice(0, 7)}-01T12:00:00Z`); next.setUTCMonth(next.getUTCMonth() + months); return next.toISOString().slice(0, 10); }

export function TeamCalendarWorkspace({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { businessDate } = useDemoClock();
  const { session } = useSession();
  const { employees, organization, attendance, shiftAssignments, selfPunches } = useHrDemo();
  const { store: leaveStore } = useLeaveDemo();
  const { requests } = useDemoData();
  const { store: wfhStore } = useWfhDemo();
  const selfId = personaEmployeeIds[session.id];
  const reports = employees.filter((item) => item.managerId === selfId && item.status !== "inactive");
  const sources = { attendance, shiftAssignments, selfPunches, leave: leaveStore.requests, requests, wfhSessions: wfhStore.sessions };
  const [mode, setMode] = useState<"week" | "month">("week");
  const [anchor, setAnchor] = useState(businessDate);
  const [branch, setBranch] = useState("");
  const [teamId, setTeamId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<{ employeeId: string; date: string } | null>(null);
  const dates = isoWeek(anchor);
  const visiblePeople = reports.filter((item) => (!branch || item.branch === branch) && (!teamId || item.primaryTeamId === teamId) && (!employeeId || item.id === employeeId));
  const selectedPerson = reports.find((item) => item.id === selected?.employeeId);
  const selectedDay = selectedPerson && selected ? teamDay(selectedPerson, selected.date, sources) : null;
  const month = anchor.slice(0, 7);
  const first = new Date(`${month}-01T12:00:00Z`);
  const dayCount = new Date(first.getUTCFullYear(), first.getUTCMonth() + 1, 0).getDate();
  const monthDays = Array.from({ length: dayCount }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`);
  const monthPadding = (first.getUTCDay() + 6) % 7;
  function openDay(personId: string, date: string) { setSelected({ employeeId: personId, date }); }
  function detailRoute() {
    if (!selectedDay) return;
    if (selectedDay.leaveId) onNavigate(`approvals/leave/${selectedDay.leaveId}`);
    else if (selectedDay.wfhId) onNavigate(`approvals/inbox/${selectedDay.wfhId}`);
  }
  const navDate = (step: number) => { setAnchor((current) => mode === "week" ? moveDate(current, step * 7) : moveMonth(current, step)); setSelected(null); };
  return <div className="page-stack hr-core team-calendar"><WorkspaceHeader title="Lịch đội ngũ" subtitle={`${reports.length} nhân sự trực tiếp`} />
    <section className="panel team-calendar-main"><div className="team-calendar-tools"><div className="team-calendar-period"><button className="icon-button" aria-label="Kỳ trước" onClick={() => navDate(-1)}><ChevronLeft size={16} /></button><strong>{mode === "week" ? `${shortDate(dates[0])} – ${shortDate(dates[6])}` : new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(first)}</strong><button className="icon-button" aria-label="Kỳ sau" onClick={() => navDate(1)}><ChevronRight size={16} /></button><button className="secondary-button" onClick={() => { setAnchor(businessDate); setSelected(null); }}>Hôm nay</button></div><div className="team-calendar-toggle" role="group" aria-label="Kiểu lịch"><button className={mode === "week" ? "active" : ""} onClick={() => { setMode("week"); setSelected(null); }}>Tuần</button><button className={mode === "month" ? "active" : ""} onClick={() => { setMode("month"); setSelected(null); }}>Tháng</button></div></div>
      <div className="team-calendar-filters"><select value={teamId} onChange={(event) => setTeamId(event.target.value)} aria-label="Lọc nhóm"><option value="">Tất cả nhóm</option>{organization.teams.filter((item) => reports.some((person) => person.primaryTeamId === item.id)).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><select value={branch} onChange={(event) => setBranch(event.target.value)} aria-label="Lọc chi nhánh"><option value="">Tất cả chi nhánh</option>{[...new Set(reports.map((item) => item.branch))].map((item) => <option key={item}>{item}</option>)}</select><select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} aria-label="Lọc nhân sự"><option value="">Tất cả nhân sự</option>{reports.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Lọc trạng thái"><option value="">Tất cả trạng thái</option><option value="office">Văn phòng</option><option value="wfh">WFH</option><option value="leave">Nghỉ phép</option><option value="off">Ngày nghỉ</option><option value="unscheduled">Chưa phân ca</option></select></div>
      <div className="team-calendar-legend"><span className="office">Văn phòng</span><span className="wfh">WFH</span><span className="leave">Nghỉ phép</span><span className="pending">Chờ duyệt</span><span className="off">Ngày nghỉ</span></div>
      {mode === "week" ? <div className="team-calendar-scroll"><div className="team-calendar-grid"><div className="team-calendar-colhead">Nhân sự</div>{dates.map((date, index) => <div className={`team-calendar-colhead ${date === businessDate ? "today" : ""}`} key={date}>{weekdayLabels[index]}<small>{shortDate(date)}</small></div>)}{visiblePeople.map((person) => <div className="team-calendar-row" key={person.id}><div className="team-calendar-person"><b>{person.initials}</b><span><strong>{person.name}</strong><small>{person.position}</small></span></div>{dates.map((date) => { const day = teamDay(person, date, sources); return <button key={date} className={`team-calendar-cell ${day.kind} ${selected?.employeeId === person.id && selected.date === date ? "selected" : ""}`} disabled={!!status && day.kind !== status} onClick={() => openDay(person.id, date)}><strong>{day.label}</strong><small>{day.kind === "office" ? day.attendance ? `${day.attendance.plannedIn}–${day.attendance.plannedOut}` : day.detail : day.detail}</small>{day.pending.length > 0 && <em>{day.pending.join(" · ")}</em>}</button>; })}</div>)}</div></div> : <div className="team-month-grid">{weekdayLabels.map((item) => <strong className="team-month-weekday" key={item}>{item}</strong>)}{Array.from({ length: monthPadding }, (_, index) => <div className="team-month-empty" key={`blank-${index}`} />)}{monthDays.map((date) => { const entries = visiblePeople.map((person) => ({ person, day: teamDay(person, date, sources) })).filter(({ day }) => !status || day.kind === status); const counts = { office: entries.filter(({ day }) => day.kind === "office").length, wfh: entries.filter(({ day }) => day.kind === "wfh").length, leave: entries.filter(({ day }) => day.kind === "leave").length, pending: entries.filter(({ day }) => day.pending.length > 0).length }; return <button key={date} className={`team-month-day ${date === businessDate ? "today" : ""}`} onClick={() => { setAnchor(date); setMode("week"); setSelected(null); }}><strong>{Number(date.slice(-2))}</strong><span>{counts.office > 0 && <small className="office">{counts.office} VP</small>}{counts.wfh > 0 && <small className="wfh">{counts.wfh} WFH</small>}{counts.leave > 0 && <small className="leave">{counts.leave} phép</small>}{counts.pending > 0 && <small className="pending">{counts.pending} chờ</small>}</span></button>; })}</div>}
      {!visiblePeople.length && <p className="hr-empty">Không có nhân sự phù hợp.</p>}
    </section>
    {selectedPerson && selectedDay && selected && <section className="panel team-calendar-detail"><div><span className="eyebrow">{weekdayLabels[(new Date(`${selected.date}T12:00:00Z`).getUTCDay() + 6) % 7]} · {shortDate(selected.date)}</span><h2>{selectedPerson.name}</h2><p>{selectedPerson.position} · {selectedPerson.id}</p></div><div className="team-calendar-detail-facts"><span className={`team-hub-badge ${selectedDay.kind}`}>{selectedDay.label}</span><span>{selectedDay.detail}</span><span>Vào/ra: {selectedDay.checkIn ?? "—"} / {selectedDay.checkOut ?? "—"}</span>{selectedDay.issue && <span>Ngoại lệ công: {selectedDay.issue}</span>}{selectedDay.pending.map((item) => <span key={item}>{item}</span>)}</div>{(selectedDay.leaveId || selectedDay.wfhId) && <button className="row-action" onClick={detailRoute}>Mở hồ sơ liên quan <ArrowRight size={14} /></button>}</section>}
  </div>;
}
