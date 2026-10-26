"use client";

import { ArrowRight, CalendarDays, ClipboardCheck, FileText, Laptop2 } from "lucide-react";
import { useSession } from "@/features/session/session-context";
import { useDemoClock } from "@/features/demo/demo-clock-context";
import { useLeaveDemo } from "@/features/leave/leave-demo-context";
import { effectiveLeaveEntitlement, leaveBalance } from "@/features/leave/leave-model";
import { useHrDemo } from "@/features/hr/hr-demo-context";
import { useDemoData } from "@/features/demo/demo-data-context";
import { useWfhDemo } from "@/features/wfh/wfh-demo-context";
import { personaEmployeeIds } from "@/lib/authorization/demo-identity";
import { canAccessScopedRecord } from "@/lib/authorization/engine";
import { StatusPill, WorkspaceHeader } from "@/features/employee/workspace-frame";

export function EmployeeHome({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { session, can } = useSession();
  const { businessDate } = useDemoClock();
  const { store: leaveStore } = useLeaveDemo();
  const { employees, attendance, selfPunches, attendanceConfirmations, attendanceExplanations, leaveAdjustments, contracts, cases, probationReviews, assets, periods, policies } = useHrDemo();
  const { requests } = useDemoData();
  const { store: wfhStore } = useWfhDemo();
  const selfId = personaEmployeeIds[session.id];
  const person = employees.find((item) => item.id === selfId);
  const todayRow = attendance.find((item) => item.employeeId === selfId && item.date === businessDate);
  const todayLeave = leaveStore.requests.find((item) => item.employeeId === selfId && (item.status === "approved" || item.status === "cancellation-pending") && item.from <= businessDate && item.to >= businessDate);
  const todayPlan = requests.find((item) => item.type === "WFH" && item.employeeId === selfId && item.date === businessDate && item.status === "approved");
  const todayWfh = wfhStore.sessions.find((item) => item.requestId === todayPlan?.id);
  const leavePolicy = effectiveLeaveEntitlement(policies, businessDate);
  const leave = selfId && leavePolicy ? leaveBalance(leaveStore, selfId, leaveAdjustments[selfId] ?? 0, leavePolicy.days, businessDate.slice(0, 4)) : null;
  const ownCases = cases.filter((item) => item.employeeId === selfId && !item.completedAt && !item.cancelledAt);
  const ownContracts = contracts.filter((item) => item.employeeId === selfId).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const ownedAssets = assets.filter((item) => item.holderId === selfId);
  const managerTasks = selfId && can("approvals", "approve") ? leaveStore.requests.filter((item) => item.managerId === selfId && item.status === "manager-pending") : [];
  const managerTimeTasks = selfId && can("approvals", "approve") ? requests.filter((item) => ["Đăng ký OT", "Điều chỉnh chấm công"].includes(item.type) && item.approverId === selfId && item.status === "pending") : [];
  const hrAttendanceTasks = can("attendance-monitoring", "edit") ? requests.filter((item) => item.type === "Điều chỉnh chấm công" && item.status === "hr-review" && employees.some((person) => person.id === item.employeeId && canAccessScopedRecord(session, { employeeId: person.id, branch: person.branch, department: person.department }))) : [];
  const hrTasks = selfId && can("hr-leave", "approve") ? leaveStore.requests.filter((item) => item.hrReviewerId === selfId && (item.status === "hr-pending" || item.status === "cancellation-pending")) : [];
  const probationManagerTasks = selfId && can("probation", "edit") ? probationReviews.filter((item) => item.managerId === selfId && item.status === "assigned") : [];
  const probationHrTasks = can("probation", "approve") ? probationReviews.filter((item) => item.status === "evaluated" && employees.some((person) => person.id === item.employeeId && canAccessScopedRecord(session, { employeeId: person.id, branch: person.branch, department: person.department }))) : [];
  const pendingOwnConfirmations = attendance.filter((item) => item.employeeId === selfId && item.issue !== "none" && item.resolution === "approved" && periods.find((period) => period.id === item.date.slice(0, 7))?.status === "reconciling" && !attendanceConfirmations.some((entry) => entry.attendanceId === item.id && entry.attendanceVersion === (item.version ?? 1)));
  const pendingOwnExplanations = attendance.filter((item) => item.employeeId === selfId && item.resolution === "explanation" && !attendanceExplanations.some((entry) => entry.attendanceId === item.id && entry.attendanceVersion === (item.version ?? 1)));
  const managerExplanations = attendanceExplanations.filter((item) => item.managerId === selfId && item.status === "submitted");
  const todayStatus = todayLeave ? "Nghỉ phép đã duyệt" : todayWfh?.review?.decision === "confirmed" ? "WFH · HR đã xác nhận" : todayWfh?.reportSubmittedAt ? "WFH · chờ HR đối soát" : todayWfh?.checkOutAt ? "WFH · chờ nộp báo cáo" : todayWfh ? "WFH · đang trong phiên" : todayPlan ? "WFH · kế hoạch đã duyệt" : todayRow ? todayRow.issue === "none" ? "Có bản ghi công" : "Công có ngoại lệ" : selfPunches.some((item) => item.employeeId === selfId && item.date === businessDate && !item.checkOutAt) ? "Đang làm · check-in demo" : "Chưa có bản ghi demo";
  const tasks = [
    ...(managerTasks.length ? [{ title: `${managerTasks.length} đơn nghỉ chờ quản lý`, detail: "Đúng tuyến duyệt được chụp lúc gửi đơn.", route: "approvals/leave" }] : []),
    ...(managerTimeTasks.length ? [{ title: `${managerTimeTasks.length} đơn OT/điều chỉnh chờ tôi`, detail: "Xem bản công hoặc kế hoạch OT trước khi xác nhận.", route: "approvals" }] : []),
    ...(hrAttendanceTasks.length ? [{ title: `${hrAttendanceTasks.length} đơn điều chỉnh chờ HR`, detail: "Quản lý đã xác nhận; cần đối soát giờ vào/ra.", route: `attendance-monitoring/exceptions/${hrAttendanceTasks[0].date.slice(0, 7)}/all/${hrAttendanceTasks[0].attendanceId}` }] : []),
    ...(hrTasks.length ? [{ title: `${hrTasks.length} đơn nghỉ chờ HR`, detail: "Kiểm tra số dư và bước duyệt cuối.", route: "hr-leave/pending" }] : []),
    ...(probationManagerTasks.length ? [{ title: `${probationManagerTasks.length} đánh giá thử việc chờ tôi`, detail: "Nộp nhận xét có căn cứ cho HR.", route: "team-probation" }] : []),
    ...(probationHrTasks.length ? [{ title: `${probationHrTasks.length} đánh giá thử việc chờ HR`, detail: "Quyết định tiếp tục hoặc offboarding.", route: "hr-probation" }] : []),
    ...(pendingOwnConfirmations.length ? [{ title: `${pendingOwnConfirmations.length} bản công chờ tôi xác nhận`, detail: "Kiểm tra kết quả HR trước khi chốt kỳ.", route: "attendance" }] : []),
    ...(pendingOwnExplanations.length ? [{ title: `${pendingOwnExplanations.length} ngoại lệ công cần giải trình`, detail: "Gửi căn cứ cho quản lý trực tiếp trước khi HR đối soát.", route: `attendance/${pendingOwnExplanations[0].id}` }] : []),
    ...(managerExplanations.length ? [{ title: `${managerExplanations.length} giải trình công chờ tôi`, detail: "Xác nhận hoặc từ chối có lý do để HR tiếp tục đối soát.", route: "team" }] : []),
    ...(todayWfh?.checkOutAt && !todayWfh.reportSubmittedAt ? [{ title: "Nộp báo cáo WFH", detail: "Báo cáo sau phiên làm việc là căn cứ HR đối soát.", route: `ai-wfh/${todayPlan?.id}` }] : []),
    ...ownCases.flatMap((item) => item.kind === "onboarding" && item.tasks.some((task) => task.id === "asset" && !task.doneAt) ? [{ title: "Xác nhận tài sản được bàn giao", detail: `Quy trình ${item.id} đang chờ hoàn tất.`, route: "profile" }] : []),
  ];
  return <div className="page-stack hr-core home-core"><WorkspaceHeader title="Tổng quan" action={can("approvals", "create") ? <button className="primary-button" onClick={() => onNavigate("approvals/leave/new")}>Tạo đơn nghỉ</button> : undefined} />
    <section className="home-core-facts" aria-label="Tình trạng cá nhân"><article className="panel"><span>Ngày {businessDate}</span><strong>{person ? todayStatus : "Không có hồ sơ nhân sự tự thân"}</strong>{person && <button className="row-action" onClick={() => onNavigate("attendance")}>Xem công của tôi <ArrowRight size={14} /></button>}</article><article className="panel"><span>Phép năm khả dụng</span><strong>{leave ? `${leave.available} ngày` : "—"}</strong><small>{leave ? `${leave.used} đã dùng · ${leave.reserved} đang giữ` : "Chỉ hiện khi persona liên kết nhân sự"}</small>{person && <button className="row-action" onClick={() => onNavigate("approvals/leave")}>Xem đơn nghỉ <ArrowRight size={14} /></button>}</article><article className="panel"><span>Việc cần tôi xử lý</span><strong>{tasks.length}</strong><small>{tasks.length ? "Từ đúng đơn, phiên và hồ sơ được giao" : "Hiện không có tác vụ cá nhân"}</small></article></section>
    <section className="panel home-core-focus"><div className="hr-core-heading"><div><h2>Việc tiếp theo</h2></div></div>{tasks.length ? <div className="home-core-task-list">{tasks.map((item) => <button key={`${item.title}-${item.route}`} onClick={() => onNavigate(item.route)}><ClipboardCheck size={17} /><span><strong>{item.title}</strong><small>{item.detail}</small></span><ArrowRight size={15} /></button>)}</div> : <p className="hr-empty">Chưa có việc cá nhân đang chờ.</p>}</section>
    {person ? <section className="panel home-core-focus"><div className="hr-core-heading"><div><h2>Hành trình nhân sự</h2><p>{person.id} · {person.position} · {person.department} · {person.branch}</p></div><StatusPill tone={person.status === "inactive" ? "neutral" : "success"}>{person.status === "probation" ? "Thử việc" : person.status === "inactive" ? "Đã nghỉ" : "Đang làm việc"}</StatusPill></div><div className="home-core-links"><button onClick={() => onNavigate("profile")}><ClipboardCheck size={16} /><span>Hồ sơ và nhiệm vụ</span><strong>{ownCases.length} quy trình mở</strong></button><button onClick={() => onNavigate("contracts")}><FileText size={16} /><span>Hợp đồng</span><strong>{ownContracts[0]?.id ?? "Chưa có"}</strong></button><button onClick={() => onNavigate("profile")}><Laptop2 size={16} /><span>Tài sản đang giữ</span><strong>{ownedAssets.length}</strong></button><button onClick={() => onNavigate("schedule")}><CalendarDays size={16} /><span>Lịch & quỹ thời gian</span><strong>Kỳ {businessDate.slice(0, 7)}</strong></button></div></section> : <section className="panel home-core-focus"><h2>Không có hồ sơ cá nhân trong bộ seed</h2><p>Persona quản trị chỉ có quyền nghiệp vụ được cấp; không tự thấy công, phép hoặc hồ sơ nhạy cảm của nhân viên.</p>{can("admin-overview") && <button className="primary-button" onClick={() => onNavigate("admin-overview")}>Mở quản trị hệ thống</button>}</section>}
  </div>;
}
