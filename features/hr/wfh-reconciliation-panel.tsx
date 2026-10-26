"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useDemoData } from "@/features/demo/demo-data-context";
import { useLeaveDemo } from "@/features/leave/leave-demo-context";
import { useSession } from "@/features/session/session-context";
import { useWfhDemo } from "@/features/wfh/wfh-demo-context";
import { canAccessScopedRecord } from "@/lib/authorization/engine";
import { personaEmployeeIds } from "@/lib/authorization/demo-identity";
import { StatusPill } from "@/features/employee/workspace-frame";
import { approvedLeaveDates } from "./attendance-model";
import { useHrDemo } from "./hr-demo-context";

const time = (stamp?: string) => stamp ? new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" }).format(new Date(stamp)) : "—";

export function WfhReconciliationPanel({ month, branch, department }: { month: string; branch: string; department: string }) {
  const { employees, attendance, periods } = useHrDemo();
  const { store: leaveStore } = useLeaveDemo();
  const { requests } = useDemoData();
  const { store, review } = useWfhDemo();
  const { session, can } = useSession();
  const [status, setStatus] = useState("pending");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [reason, setReason] = useState("");
  const period = periods.find((item) => item.id === month);
  const leaveDates = approvedLeaveDates(leaveStore.requests, month);
  const scoped = store.sessions.filter((item) => {
    const person = employees.find((entry) => entry.id === item.employeeId);
    return item.date.startsWith(`${month}-`) && person && canAccessScopedRecord(session, { employeeId: person.id, managerId: person.managerId, branch: person.branch, department: person.department }) && (!branch || person.branch === branch) && (!department || person.department === department);
  });
  if (!scoped.length) return null;
  const visible = scoped.filter((item) => (status === "all" || (status === "pending" ? !item.review : item.review?.decision === status)) && (!query || `${item.requestId} ${item.employeeId} ${employees.find((person) => person.id === item.employeeId)?.name ?? ""}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"))));
  const selected = scoped.find((item) => item.requestId === selectedId && !item.review);
  const conflict = selected && (attendance.some((row) => row.employeeId === selected.employeeId && row.date === selected.date) || leaveDates.some((leave) => leave.employeeId === selected.employeeId && leave.date === selected.date));
  function decide(decision: "confirmed" | "excluded") {
    if (!selected || !can("timesheets", "edit")) return;
    const request = requests.find((item) => item.id === selected.requestId);
    const result = review(request, { requestId: selected.requestId, employeeId: selected.employeeId, expectedVersion: selected.version, decision, actorId: personaEmployeeIds[session.id] ?? `demo-persona:${session.id}`, actor: session.label, reason, periodStatus: period?.status, hasRawAttendance: attendance.some((row) => row.employeeId === selected.employeeId && row.date === selected.date), hasApprovedLeave: leaveDates.some((leave) => leave.employeeId === selected.employeeId && leave.date === selected.date) });
    if (!result.ok) { toast.error(result.error); return; }
    setSelectedId(""); setReason("");
    toast.success(decision === "confirmed" ? "Đã xác nhận phiên WFH cho snapshot kỳ công demo." : "Đã loại phiên WFH khỏi kỳ công demo.");
  }
  return <section className="panel hr-directory hr-wfh-reconciliation" aria-label="Đối soát WFH"><div className="hr-core-heading"><div><h2>Đối soát phiên WFH ({scoped.filter((item) => !item.review).length} chờ)</h2><p>Chỉ phiên có check-out, báo cáo và HR xác nhận mới vào snapshot. Không cộng trùng công gốc hoặc nghỉ phép.</p></div></div>
    <div className="hr-directory-tools"><label><span>Tìm phiên</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mã đơn, mã hoặc tên nhân sự" /></label><label><span>Trạng thái</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="pending">Chờ đối soát</option><option value="confirmed">Đã xác nhận</option><option value="excluded">Đã loại</option><option value="all">Tất cả</option></select></label></div>
    <div className="table-scroll"><table className="data-table"><thead><tr><th>Đơn / ngày</th><th>Nhân sự</th><th>Phiên</th><th>Báo cáo</th><th>Đối soát</th><th /></tr></thead><tbody>{visible.map((item) => { const person = employees.find((entry) => entry.id === item.employeeId); return <tr key={item.requestId}><td><strong>{item.requestId}</strong><small>{item.date}</small></td><td>{person?.name ?? item.employeeId}<small>{item.employeeId} · {person?.branch}</small></td><td>{time(item.checkInAt)}–{time(item.checkOutAt)}</td><td>{item.reportSubmittedAt ? "Đã nộp" : "Chưa nộp"}</td><td><StatusPill tone={item.review?.decision === "confirmed" ? "success" : "warning"}>{item.review?.decision === "confirmed" ? "Đã xác nhận" : item.review?.decision === "excluded" ? "Đã loại" : "Chờ HR"}</StatusPill></td><td><button className="row-action" onClick={() => { setSelectedId(item.requestId); setReason(""); }}>Chi tiết</button></td></tr>; })}</tbody></table></div>
    {!visible.length && <p className="hr-empty">Không có phiên WFH phù hợp kỳ và bộ lọc.</p>}
    {selected && <div className="hr-attendance-detail"><div className="hr-core-heading"><div><h3>{selected.requestId} · {employees.find((item) => item.id === selected.employeeId)?.name}</h3><p>{selected.date} · vào {time(selected.checkInAt)} · ra {time(selected.checkOutAt)} · {selected.reportSubmittedAt ? `nộp báo cáo ${time(selected.reportSubmittedAt)}` : "chưa nộp báo cáo"}</p></div><button className="secondary-button" onClick={() => setSelectedId("")}>Đóng</button></div><p>Chỉ hiển thị trạng thái nộp; nội dung báo cáo WFH không nằm trong bảng công. Quyết định HR cần có căn cứ riêng.</p>{conflict && <p className="hr-demo-note">Đã có công gốc hoặc nghỉ phép cùng ngày. Không thể cộng thêm công WFH; cần đối soát và loại phiên trùng.</p>}{can("timesheets", "edit") && period?.status === "reconciling" && <><label>Lý do / căn cứ đối soát *<textarea rows={2} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Tối thiểu 8 ký tự" /></label><div className="hr-detail-actions"><button className="secondary-button" disabled={reason.trim().length < 8} onClick={() => decide("excluded")}>Loại khỏi công</button><button className="primary-button" disabled={reason.trim().length < 8 || !selected.checkOutAt || !selected.reportSubmittedAt || Boolean(conflict) || requests.find((item) => item.id === selected.requestId)?.status !== "approved"} onClick={() => decide("confirmed")}>Xác nhận công WFH</button></div></>}</div>}
    {selectedId && !selected && scoped.find((item) => item.requestId === selectedId)?.review && <p className="hr-demo-note">Quyết định đã lưu: {scoped.find((item) => item.requestId === selectedId)?.review?.reason}. Muốn thay đổi sau khi chốt cần quy trình điều chỉnh kỳ; demo chưa hỗ trợ sửa quyết định WFH.</p>}
  </section>;
}
