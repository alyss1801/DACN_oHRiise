"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useHrDemo } from "@/features/hr/hr-demo-context";
import type { PunchMethod } from "@/features/hr/hr-demo-data";
import { effectiveAttendanceTime, latestAttendanceConfirmation, latestAttendanceExplanation } from "@/features/hr/attendance-model";
import { useLeaveDemo } from "@/features/leave/leave-demo-context";
import { effectiveLeaveEntitlement, leaveBalance } from "@/features/leave/leave-model";
import { useWfhDemo } from "@/features/wfh/wfh-demo-context";
import { useDemoData } from "@/features/demo/demo-data-context";
import { useSession } from "@/features/session/session-context";
import { personaEmployeeIds } from "@/lib/authorization/demo-identity";
import { demoBusinessNow } from "@/lib/demo-clock";
import { useDemoClock } from "@/features/demo/demo-clock-context";
import { StatusPill, WorkspaceHeader } from "./workspace-frame";
import { AttendanceMethods } from "./attendance-methods";

const issueLabel: Record<string, string> = { none: "Hợp lệ", late: "Đi trễ", "missing-in": "Thiếu giờ vào", "missing-out": "Thiếu giờ ra", "outside-gps": "Ngoài vị trí", duplicate: "Trùng sự kiện", "shift-mismatch": "Lệch ca" };
const dateLabel = (date: string) => new Intl.DateTimeFormat("vi-VN").format(new Date(`${date}T12:00:00Z`));

export function SelfAttendanceWorkspace({ mode, initialRecordId, onNavigate }: { mode: "attendance" | "schedule"; initialRecordId?: string; onNavigate: (id: string) => void }) {
  const { session } = useSession();
  const clock = useDemoClock();
  const { employees, attendance, shiftAssignments, selfPunches, attendanceAdjustments, attendanceConfirmations, attendanceExplanations, periods, leaveAdjustments, policies, punchAttendance, confirmAttendance, submitAttendanceExplanation } = useHrDemo();
  const { store: leaveStore } = useLeaveDemo();
  const { store: wfhStore } = useWfhDemo();
  const { requests } = useDemoData();
  const selfId = personaEmployeeIds[session.id];
  const person = employees.find((item) => item.id === selfId);
  const [month, setMonth] = useState(attendance.find((item) => item.id === initialRecordId)?.date.slice(0, 7) ?? clock.businessDate.slice(0, 7));
  const [selectedId, setSelectedId] = useState(initialRecordId ?? "");
  const [selectedDay, setSelectedDay] = useState("");
  const [reason, setReason] = useState("");
  const period = periods.find((item) => item.id === month);
  const rows = attendance.filter((item) => item.employeeId === selfId && item.date.startsWith(`${month}-`)).sort((a, b) => b.date.localeCompare(a.date));
  const ownLeave = leaveStore.requests.filter((item) => item.employeeId === selfId && (item.status === "approved" || item.status === "cancellation-pending") && item.from <= `${month}-31` && item.to >= `${month}-01`);
  const ownWfh = requests.filter((item) => item.type === "WFH" && item.employeeId === selfId && item.date.startsWith(`${month}-`));
  const today = clock.businessDate;
  const todayPunch = selfPunches.find((item) => item.employeeId === selfId && item.date === today);
  const todayRow = attendance.find((item) => item.employeeId === selfId && item.date === today);
  const punchBlocked = leaveStore.requests.some((item) => item.employeeId === selfId && ["approved", "cancellation-pending"].includes(item.status) && item.from <= today && item.to >= today) || requests.some((item) => item.type === "WFH" && item.employeeId === selfId && item.date === today && item.status === "approved");
  const selected = rows.find((item) => item.id === selectedId);
  const confirmation = selected ? latestAttendanceConfirmation(attendanceConfirmations, selected) : undefined;
  const explanation = selected ? latestAttendanceExplanation(attendanceExplanations, selected) : undefined;
  const leavePolicy = effectiveLeaveEntitlement(policies, `${month}-01`);
  const balance = selfId && leavePolicy ? leaveBalance(leaveStore, selfId, leaveAdjustments[selfId] ?? 0, leavePolicy.days, month.slice(0, 4)) : null;
  const daysInMonth = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`);
  const dayStatus = (date: string) => {
    const row = rows.find((item) => item.date === date);
    const wfh = ownWfh.find((item) => item.date === date && item.status === "approved");
    if (row && ownLeave.some((item) => item.from <= date && item.to >= date)) return "Cần đối soát · phép/công gốc";
    if (row && wfh) return "Cần đối soát · WFH/công gốc";
    if (ownLeave.some((item) => item.from <= date && item.to >= date)) return "Nghỉ phép đã duyệt";
    if (wfh) { const linked = wfhStore.sessions.find((item) => item.requestId === wfh.id); return linked?.review?.decision === "confirmed" ? "WFH · đã xác nhận công" : linked?.reportSubmittedAt ? "WFH · chờ HR đối soát" : "WFH · kế hoạch/phiên"; }
    if (row) return row.issue === "none" ? "Có bản ghi công" : `Ngoại lệ · ${issueLabel[row.issue]}`;
    const assigned = shiftAssignments.find((item) => item.employeeId === selfId && item.date === date);
    if (assigned) {
      const swap = requests.find((item) => item.type === "Đổi ca" && item.employeeId === selfId && item.date === date && item.status === "approved" && item.shiftAssignmentId === assigned.id && item.shiftStart && item.shiftEnd);
      return swap ? `Đổi ca đã duyệt · ${swap.shiftStart}–${swap.shiftEnd}` : `${assigned.shift} · ${assigned.plannedIn}–${assigned.plannedOut}`;
    }
    return new Date(`${date}T12:00:00Z`).getUTCDay() % 6 === 0 ? "Ngày nghỉ lịch" : "Chưa có bản ghi";
  };
  function respond(decision: "confirmed" | "disputed") {
    if (!selfId || !selected || selected.employeeId !== selfId) return;
    const result = confirmAttendance({ attendanceId: selected.id, employeeId: selfId, expectedVersion: selected.version ?? 1, decision, actorId: selfId, actor: person?.name ?? selfId, reason, at: demoBusinessNow().toISOString() });
    if (!result.ok) { toast.error(result.error); return; }
    setReason(""); toast.success(decision === "confirmed" ? "Đã xác nhận bản đối soát công." : "Đã gửi tranh chấp; HR cần đối soát lại trước khi chốt kỳ.");
  }
  function submitExplanation() {
    if (!selected) return;
    const result = submitAttendanceExplanation(selected.id, selected.version ?? 1, reason);
    if (!result.ok) { toast.error(result.error); return; }
    setReason(""); toast.success("Đã gửi giải trình đến quản lý trực tiếp; HR sẽ đối soát sau khi quản lý xác nhận.");
  }
  function punch(kind: "check-in" | "check-out", method: PunchMethod) {
    if (punchBlocked) { toast.error("Ngày này đã có nghỉ phép hoặc WFH; không điểm danh tại văn phòng."); return; }
    const result = punchAttendance(kind, method);
    if (!result.ok) { toast.error(result.error); return; }
    toast.success(kind === "check-in" ? "Đã lưu check-in mô phỏng trong demo cục bộ." : "Đã lưu check-out và tạo bản ghi công để HR đối soát.");
  }
  return <div className="page-stack hr-core self-attendance"><WorkspaceHeader title={mode === "attendance" ? "Chấm công & công của tôi" : "Lịch & quỹ thời gian"} />
    <nav className="hr-core-tabs" aria-label="Công và lịch cá nhân"><button className={mode === "attendance" ? "active" : ""} aria-pressed={mode === "attendance"} onClick={() => onNavigate("attendance")}>Điểm danh & bản ghi</button><button className={mode === "schedule" ? "active" : ""} aria-pressed={mode === "schedule"} onClick={() => onNavigate("schedule")}>Lịch & quỹ</button></nav>
    {person && mode === "attendance" && <AttendanceMethods date={today} branch={person.branch} punch={todayPunch} row={todayRow} blocked={punchBlocked} periodOpen={periods.find((item) => item.id === today.slice(0, 7))?.status === "reconciling"} onPunch={punch} onNavigate={onNavigate} />}
    <section className="panel hr-timesheet-controls"><label>Kỳ công <select value={month} onChange={(event) => { setMonth(event.target.value); setSelectedId(""); setSelectedDay(""); }}>{periods.map((item) => <option key={item.id} value={item.id}>{item.id.slice(5)}/{item.id.slice(0, 4)}</option>)}</select></label><span>{period?.status === "reconciling" ? "Đang đối soát" : period?.status === "closed" ? "Đã chốt snapshot" : period?.status === "exported" ? "Đã xuất CSV nội bộ" : "Chưa mở kỳ"}</span></section>
    {!person && <section className="panel"><p>Persona này chưa liên kết hồ sơ nhân sự demo. Không hiển thị bản ghi của người khác.</p></section>}
    {person && mode === "attendance" && <><section className="panel hr-directory"><div className="hr-core-heading self-attendance-heading"><div><h2>{rows.length} bản ghi công</h2></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Ngày</th><th>Ca</th><th>Vào / ra gốc</th><th>Vào / ra hiệu lực</th><th>Trạng thái</th><th>Phản hồi</th><th /></tr></thead><tbody>{rows.map((row) => { const response = latestAttendanceConfirmation(attendanceConfirmations, row); return <tr key={row.id}><td>{dateLabel(row.date)}</td><td>{row.shift}</td><td>{row.events.find((item) => item.kind === "check-in")?.at ?? "—"} / {row.events.find((item) => item.kind === "check-out")?.at ?? "—"}</td><td>{effectiveAttendanceTime(row, attendanceAdjustments, "check-in") ?? "—"} / {effectiveAttendanceTime(row, attendanceAdjustments, "check-out") ?? "—"}</td><td><StatusPill tone={row.issue === "none" ? "success" : row.resolution === "approved" ? "blue" : "warning"}>{row.issue === "none" ? "Hợp lệ" : `${issueLabel[row.issue]} · ${row.resolution === "approved" ? "HR đã xử lý" : "Chờ HR"}`}</StatusPill></td><td>{response?.decision === "confirmed" ? "Đã xác nhận" : response?.decision === "disputed" ? "Đang tranh chấp" : response?.decision === "exception" ? "HR ghi ngoại lệ" : row.issue === "none" ? "—" : "Chưa phản hồi"}</td><td>{row.issue !== "none" && <button className="row-action" onClick={() => { setSelectedId(row.id); setReason(""); }}>Chi tiết</button>}</td></tr>; })}</tbody></table></div>{!rows.length && <p className="hr-empty">Không có bản ghi công trong kỳ này.</p>}</section>
      {selected && <section className="panel self-attendance-detail"><div className="hr-core-heading"><div><h2>{issueLabel[selected.issue]} · {dateLabel(selected.date)}</h2><p>Giá trị hiệu lực: {effectiveAttendanceTime(selected, attendanceAdjustments, "check-in") ?? "—"}–{effectiveAttendanceTime(selected, attendanceAdjustments, "check-out") ?? "—"}. Sự kiện gốc không bị sửa.</p></div><button className="secondary-button" onClick={() => setSelectedId("")}>Đóng</button></div>{selected.resolution === "explanation" ? explanation ? <p>Giải trình đã gửi: {explanation.text} · {explanation.status === "submitted" ? "Chờ quản lý trực tiếp" : explanation.status === "confirmed" ? "Quản lý đã xác nhận; chờ HR đối soát" : "Quản lý không xác nhận; HR cần xem căn cứ"}. {explanation.reviewReason}</p> : period?.status !== "reconciling" ? <p>Kỳ công đã đóng; không thể gửi giải trình mới.</p> : <><p>HR đang chờ giải trình của bạn. Quản lý trực tiếp sẽ xác nhận trước khi HR đối soát.</p><label>Nội dung giải trình<textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Nêu giờ làm việc và căn cứ đối chiếu (tối thiểu 10 ký tự)" /></label><button className="primary-button" disabled={reason.trim().length < 10} onClick={submitExplanation}>Gửi giải trình</button></> : confirmation ? <p>Phản hồi đã lưu: {confirmation.decision === "confirmed" ? "Đã xác nhận" : confirmation.decision === "disputed" ? "Đang tranh chấp" : "Ngoại lệ HR"} · {confirmation.actor} · {confirmation.reason || "Không ghi chú"}.</p> : selected.resolution !== "approved" ? <p>HR chưa hoàn tất đối soát; hãy kiểm tra lại sau.</p> : period?.status !== "reconciling" ? <p>Kỳ đã đóng; không thể thêm phản hồi vào snapshot cũ.</p> : <><p>Hãy đối chiếu giờ công. Nếu không đồng ý, nêu lý do để HR xử lý trước khi chốt kỳ.</p><label>Lý do khi tranh chấp<textarea rows={2} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Tối thiểu 8 ký tự nếu có tranh chấp" /></label><div className="hr-detail-actions"><button className="secondary-button" disabled={reason.trim().length < 8} onClick={() => respond("disputed")}>Tôi không đồng ý</button><button className="primary-button" onClick={() => respond("confirmed")}>Xác nhận kết quả</button></div></>}</section>}</>}
    {person && mode === "schedule" && <><section className="panel self-attendance-funds"><div><span>Phép năm khả dụng</span><strong>{balance?.available ?? 0} ngày</strong><small>{balance?.used ?? 0} đã dùng · {balance?.reserved ?? 0} đang giữ</small></div><div><span>Đơn WFH đã duyệt trong kỳ</span><strong>{ownWfh.filter((item) => item.status === "approved").length}</strong><small>Chưa đồng nghĩa với ngày công</small></div><div><span>Phiên WFH HR xác nhận</span><strong>{wfhStore.sessions.filter((item) => item.employeeId === selfId && item.date.startsWith(`${month}-`) && item.review?.decision === "confirmed").length}</strong><small>Chốt kỳ mới thành snapshot</small></div><div><span>OT đã được duyệt trong kỳ</span><strong>{requests.filter((item) => item.type === "Đăng ký OT" && item.employeeId === selfId && item.date.startsWith(`${month}-`) && item.status === "approved").reduce((sum, item) => sum + (item.overtimeHours ?? 0), 0)} giờ</strong><small>Kế hoạch OT; chưa tự tính công/lương/phép bù</small></div></section><section className="panel self-attendance-calendar"><div className="hr-core-heading"><div><h2>Lịch nghiệp vụ · {month}</h2></div></div><div className="self-attendance-days">{calendarDays.map((date) => { const status = dayStatus(date); return <button key={date} className={date === selectedDay ? "selected" : ""} onClick={() => setSelectedDay(date)}><strong>{date.slice(-2)}</strong><span>{status}</span></button>; })}</div>{selectedDay && <div className="self-attendance-day-detail"><strong>{dateLabel(selectedDay)}</strong><p>{dayStatus(selectedDay)}</p>{rows.find((item) => item.date === selectedDay) && <button className="row-action" onClick={() => onNavigate(`attendance/${rows.find((item) => item.date === selectedDay)?.id}`)}>Mở bản ghi công</button>}</div>}</section></>}
  </div>;
}
