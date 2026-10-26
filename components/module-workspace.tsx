"use client";

import { ArrowLeft, Check, Eye, EyeOff, LockKeyhole, Plus, ShieldAlert, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/features/session/session-context";
import { can } from "@/lib/authorization/engine";
import { isDeferredModule } from "@/lib/navigation";
import { WorkspaceHeader } from "@/features/employee/workspace-frame";
import { SelfAttendanceWorkspace } from "@/features/employee/self-attendance-workspace";
import { ContractWorkspace } from "@/features/employee/contract-workspace";
import { NotificationsWorkspace } from "@/features/employee/notifications-workspace";
import { PayslipWorkspace } from "@/features/employee/payslip-workspace";
import { PerformanceWorkspace } from "@/features/employee/performance-workspace";
import { ProfileWorkspace } from "@/features/employee/profile-workspace";
import { OffboardingStatusWorkspace } from "@/features/employee/schedule-workspace";
import { EmailWorkspace } from "@/features/email/email-workspace";
import { ApprovalMiniappWorkspace } from "@/features/team/approval-miniapp-workspace";
import { TeamCalendarWorkspace } from "@/features/team/team-calendar-workspace";
import { TeamOverviewWorkspace } from "@/features/team/team-overview-workspace";
import { WfhWorkspace } from "@/features/wfh/wfh-workspace";
import { OrganizationWorkspace } from "@/features/hr/organization-workspace";
import { ExpenseReviewWorkspace } from "@/features/hr/operations-workspaces";
import { AuditWorkspace } from "@/features/admin/access-workspaces";
import { AdminOverviewWorkspace, CatalogsWorkspace, EmailDlpWorkspace, IntegrationsWorkspace, NotificationConfigWorkspace } from "@/features/admin/system-workspaces";
import { BranchWorkspace } from "@/features/admin/branch-workspace";
import { AiStatusWorkspace } from "@/features/admin/ai-status-workspace";
import { IamWorkspace } from "@/features/admin/iam/iam-workspace";
import { HrCommandWorkspace } from "@/features/hr/hr-command-workspace";
import { HrPeopleWorkspace } from "@/features/hr/hr-people-core";
import { HrAttendanceWorkspace } from "@/features/hr/hr-attendance-core";
import { HrTimesheetWorkspace } from "@/features/hr/hr-timesheet-core";
import { HrMisaWorkspace } from "@/features/hr/hr-misa-core";
import { LeaveWorkspace } from "@/features/leave/leave-workspace";
import { HrContractsCore } from "@/features/hr/hr-contracts-core";
import { HrCaseWorkspace } from "@/features/hr/hr-cases-core";
import { ProbationWorkspace } from "@/features/hr/probation-workspace";
import { HrAssetsWorkspace } from "@/features/hr/hr-assets-core";
import { HrPolicyWorkspace } from "@/features/hr/hr-policy-core";
import { HrRecruitmentWorkspace } from "@/features/hr/hr-recruitment-core";
import { HrAnalyticsWorkspace } from "@/features/hr/hr-analytics-core";

const moduleCopy: Record<string, { eyebrow: string; title: string; description: string; action?: string }> = {
  profile: { eyebrow: "HỒ SƠ CÁ NHÂN", title: "Thông tin của Nguyễn Thu Hà", description: "Thông tin được hiển thị theo chính sách trường nhạy cảm.", action: "Cập nhật hồ sơ" },
  attendance: { eyebrow: "CHẤM CÔNG", title: "Nhật ký thời gian", description: "Theo dõi check-in, lịch làm việc và các ngoại lệ cần bổ sung.", action: "Tạo điều chỉnh" },
  leave: { eyebrow: "NGHỈ PHÉP", title: "Yêu cầu của tôi", description: "Số dư, lịch sử và trạng thái phê duyệt được cập nhật tức thời.", action: "Tạo đơn nghỉ" },
  expenses: { eyebrow: "CHI PHÍ", title: "Đề nghị thanh toán", description: "Chi phí công cụ và phần mềm phục vụ công việc.", action: "Tạo đề nghị" },
  contracts: { eyebrow: "HỢP ĐỒNG", title: "Hồ sơ hợp đồng", description: "Theo dõi vòng đời hợp đồng và bản ký đã hoàn tất." },
  team: { eyebrow: "ĐỘI NGŨ", title: "Data Platform", description: "Tình trạng làm việc và các tín hiệu cần Team Lead lưu ý." },
  approvals: { eyebrow: "PHÊ DUYỆT", title: "Hộp thư tập trung", description: "Duyệt yêu cầu với ngữ cảnh đội ngũ, lịch và dữ liệu liên quan.", action: "Xem yêu cầu tiếp theo" },
  "team-calendar": { eyebrow: "ĐỘI NGŨ", title: "Lịch năng lực đội ngũ", description: "Ngày nghỉ, WFH và lịch quan trọng trong phạm vi đội." },
  "ai-wfh": { eyebrow: "WFH", title: "WFH & báo cáo ngày", description: "Đơn được duyệt, phiên làm việc và báo cáo trong cùng dữ liệu demo." },
  employees: { eyebrow: "NHÂN SỰ", title: "Hồ sơ nhân sự", description: "Danh bạ nhân sự theo phạm vi dữ liệu hiệu lực.", action: "Thêm nhân sự" },
  onboarding: { eyebrow: "NHÂN SỰ", title: "Onboarding", description: "Điều phối dữ liệu, hợp đồng, tài khoản và thiết bị cho nhân sự mới.", action: "Bắt đầu onboarding" },
  "hr-contracts": { eyebrow: "NHÂN SỰ", title: "Quản lý hợp đồng", description: "Vòng đời hợp đồng từ mẫu đến bản ký hoàn tất.", action: "Tạo hợp đồng" },
  organization: { eyebrow: "TỔ CHỨC", title: "Cấu trúc tổ chức", description: "Phòng ban, vị trí, quan hệ báo cáo và nhóm dự án." },
  timesheets: { eyebrow: "VẬN HÀNH", title: "Bảng công tháng", description: "Đối soát và chốt snapshot để xuất CSV nội bộ.", action: "Kiểm tra ngoại lệ" },
  reports: { eyebrow: "BÁO CÁO", title: "People analytics", description: "Báo cáo nhân sự theo đúng phạm vi được ủy quyền." },
  "misa-sync": { eyebrow: "DỮ LIỆU NỘI BỘ", title: "CSV công nội bộ", description: "MISA chưa triển khai; chỉ tải dữ liệu từ snapshot đã chốt.", action: "Mở bảng công" },
  "ai-cv": { eyebrow: "AI · DECISION SUPPORT", title: "AI CV Intelligence", description: "Phân tích CV có bằng chứng, khoảng trống và câu hỏi xác minh.", action: "Phân tích CV" },
  "admin-overview": { eyebrow: "HỆ THỐNG", title: "Tình trạng vận hành", description: "Sức khỏe dịch vụ, tài khoản và cảnh báo bảo mật." },
  accounts: { eyebrow: "QUẢN TRỊ TRUY CẬP", title: "Tài khoản người dùng", description: "Danh tính, trạng thái, MFA và quyền hiệu lực.", action: "Thêm tài khoản" },
  permissions: { eyebrow: "QUẢN TRỊ TRUY CẬP", title: "Quyền & phạm vi", description: "Template, override, delegation và quy trình hai người duyệt.", action: "Tạo mẫu quyền" },
  integrations: { eyebrow: "HỆ THỐNG", title: "Tích hợp", description: "SMTP, FCM, thiết bị chấm công và kết nối doanh nghiệp." },
  audit: { eyebrow: "BẢO MẬT", title: "Nhật ký & cảnh báo", description: "Mọi thay đổi nhạy cảm đều có nguồn, lý do và người phê duyệt." },
  "ai-governance": { eyebrow: "AI GOVERNANCE", title: "Mô hình & chính sách AI", description: "Phiên bản, ngưỡng tin cậy, retention và lịch sử thay đổi.", action: "Cấu hình chính sách" },
  notifications: { eyebrow: "CẬP NHẬT", title: "Trung tâm thông báo", description: "Phê duyệt, hợp đồng, chấm công và thông báo hệ thống." },
};

export function ModuleWorkspace({ moduleId, onHome, onNavigate }: { moduleId: string; onHome: () => void; onNavigate: (id: string) => void }) {
  const { session, fieldVisibility } = useSession();
  const isAccessWorkspace = moduleId.startsWith("access/");
  const hrModuleId = moduleId.split("/")[0];
  const resolvedModuleId = isAccessWorkspace
    ? "accounts"
    : moduleId.startsWith("hr-probation") || moduleId.startsWith("team-probation")
    ? "probation"
    : ["hr-command", "employees", "attendance-monitoring", "timesheets", "misa-sync", "hr-leave", "hr-contracts", "onboarding", "offboarding", "hr-assets", "hr-policies", "ai-cv"].includes(hrModuleId)
    ? hrModuleId
    : moduleId === "schedule"
    ? "attendance"
    : moduleId.startsWith("attendance/")
    ? "attendance"
    : moduleId.startsWith("approvals/") || moduleId === "wfh" || moduleId === "leave" || moduleId === "expenses"
      ? "approvals"
      : moduleId === "daily-report" || moduleId.startsWith("ai-wfh-") || moduleId.startsWith("ai-wfh/")
        ? "ai-wfh"
      : moduleId;
  const copy = moduleCopy[resolvedModuleId] ?? { eyebrow: "oHRiise", title: "Không gian làm việc", description: "Module đang được xây dựng." };
  const permission = session.permissions.find((item) => item.resource === resolvedModuleId);

  if (isDeferredModule(moduleId) || isDeferredModule(resolvedModuleId)) {
    return <div className="page-stack"><WorkspaceHeader title="Chức năng chưa mở trong demo lõi" description="Luồng này còn dùng dữ liệu minh họa riêng hoặc chưa có tích hợp thực. Các nghiệp vụ HRM đang hoạt động vẫn truy cập được từ menu chính." action={<button className="secondary-button" onClick={onHome}><ArrowLeft size={15} /> Về trang chính</button>} /></div>;
  }

  if (!permission || !can(session, resolvedModuleId)) {
    return <AccessDenied onHome={onHome} />;
  }

  if (isAccessWorkspace) return <IamWorkspace moduleId={moduleId} onNavigate={onNavigate} />;

  if (resolvedModuleId === "hr-command") return <HrCommandWorkspace onNavigate={onNavigate} />;
  if (resolvedModuleId === "employees") return <HrPeopleWorkspace moduleId={moduleId} onNavigate={onNavigate} />;
  if (resolvedModuleId === "attendance-monitoring") return <HrAttendanceWorkspace key={moduleId} moduleId={moduleId} onNavigate={onNavigate} />;
  if (resolvedModuleId === "timesheets") return <HrTimesheetWorkspace moduleId={moduleId} onNavigate={onNavigate} />;
  if (resolvedModuleId === "misa-sync") return <HrMisaWorkspace moduleId={moduleId} onNavigate={onNavigate} />;
  if (resolvedModuleId === "hr-leave") return <LeaveWorkspace key={moduleId} moduleId={moduleId} onNavigate={onNavigate} hrView />;
  if (resolvedModuleId === "hr-contracts") return <HrContractsCore moduleId={moduleId} onNavigate={onNavigate} />;
  if (resolvedModuleId === "onboarding" || resolvedModuleId === "offboarding") return <HrCaseWorkspace kind={resolvedModuleId} moduleId={moduleId} onNavigate={onNavigate} />;
  if (resolvedModuleId === "probation") return <ProbationWorkspace moduleId={moduleId} onNavigate={onNavigate} hrView={moduleId.startsWith("hr-")} />;
  if (resolvedModuleId === "hr-assets") return <HrAssetsWorkspace moduleId={moduleId} onNavigate={onNavigate} />;
  if (resolvedModuleId === "hr-policies") return <HrPolicyWorkspace moduleId={moduleId} onNavigate={onNavigate} />;
  if (resolvedModuleId === "ai-cv") return <HrRecruitmentWorkspace moduleId={moduleId} onNavigate={onNavigate} />;
  if (resolvedModuleId === "reports") return <HrAnalyticsWorkspace onNavigate={onNavigate} />;

  if (resolvedModuleId === "profile") return <ProfileWorkspace />;
  if (moduleId === "schedule") return <SelfAttendanceWorkspace key={moduleId} mode="schedule" onNavigate={onNavigate} />;
  if (resolvedModuleId === "attendance") return <SelfAttendanceWorkspace key={moduleId} mode="attendance" initialRecordId={moduleId.split("/")[1]} onNavigate={onNavigate} />;
  if (moduleId === "email") return <EmailWorkspace onNavigate={onNavigate} />;
  if (moduleId === "contracts") return <ContractWorkspace />;
  if (moduleId === "offboarding-status") return <OffboardingStatusWorkspace />;
  if (moduleId === "payslip") return <PayslipWorkspace />;
  if (moduleId === "performance") return <PerformanceWorkspace />;
  if (moduleId === "notifications") return <NotificationsWorkspace onNavigate={onNavigate} />;
  if (moduleId === "team") return <TeamOverviewWorkspace onNavigate={onNavigate} />;
  if (moduleId === "leave" || moduleId.startsWith("approvals/leave")) return <LeaveWorkspace key={moduleId} moduleId={moduleId} onNavigate={onNavigate} />;
  if (resolvedModuleId === "approvals") return <ApprovalMiniappWorkspace key={moduleId} initialTemplate={moduleId.split("/")[1]} initialRequestId={moduleId.split("/")[2]} onNavigate={onNavigate} />;
  if (moduleId === "team-calendar") return <TeamCalendarWorkspace onNavigate={onNavigate} />;
  if (resolvedModuleId === "ai-wfh") return <WfhWorkspace moduleId={moduleId} onNavigate={onNavigate} />;
  if (moduleId === "organization") return <OrganizationWorkspace onNavigate={onNavigate} />;
  if (moduleId === "expense-review") return <ExpenseReviewWorkspace />;
  if (moduleId === "admin-overview") return <AdminOverviewWorkspace onNavigate={onNavigate} />;
  if (moduleId === "branches-gps") return <BranchWorkspace />;
  if (moduleId === "catalogs") return <CatalogsWorkspace />;
  if (moduleId === "email-dlp") return <EmailDlpWorkspace />;
  if (moduleId === "notification-config") return <NotificationConfigWorkspace />;
  if (moduleId === "integrations") return <IntegrationsWorkspace />;
  if (moduleId === "audit") return <AuditWorkspace />;
  if (moduleId === "ai-governance") return <AiStatusWorkspace />;

  return (
    <div className="page-stack">
      <WorkspaceHeader
        title={copy.title}
        action={copy.action ? <button className="primary-button" onClick={() => toast.success(`${copy.action}: luồng demo đã sẵn sàng.`)}><Plus size={16} strokeWidth={1.5} /> {copy.action}</button> : undefined}
      />

      <section className="workspace-grid">
        <article className="panel workspace-primary">
          <div className="workspace-placeholder-head"><div><span className="eyebrow">TRẠNG THÁI MODULE</span><h3>Nền tảng quyền đã được kết nối</h3></div><span className="status-badge success"><i /> Có quyền truy cập</span></div>
          <div className="permission-demo">
            <div><span>Hành động hiệu lực</span><div>{permission.actions.map((action) => <b key={action}><Check size={13} strokeWidth={1.5} />{action}</b>)}</div></div>
            <div><span>Nguồn cấp quyền</span><div>{permission.sources.map((source) => <b key={source} className={source === "delegation" ? "delegated" : ""}>{source}</b>)}</div></div>
            <div><span>Phạm vi module</span><strong>{permission.scope}</strong></div>
            {permission.expiresAt && <div><span>Ủy quyền tạm thời</span><strong>Đến {new Intl.DateTimeFormat("vi-VN").format(new Date(permission.expiresAt))}</strong></div>}
          </div>
          <div className="build-note"><Sparkles size={18} strokeWidth={1.5} /><div><strong>Đang triển khai theo từng workflow</strong><p>Foundation này giữ app luôn chạy được; màn hình nghiệp vụ chi tiết sẽ tiếp tục được thêm theo thứ tự trong blueprint.</p></div></div>
        </article>
        <aside className="panel access-card">
          <span className="eyebrow">EFFECTIVE ACCESS</span>
          <h3>{session.label}</h3>
          <p>{session.description}</p>
          <div className="access-list">
            <AccessRow label="Số điện thoại" value={fieldVisibility("phone")} />
            <AccessRow label="Tài khoản ngân hàng" value={fieldVisibility("bankAccount")} />
            <AccessRow label="Mức lương" value={fieldVisibility("salary")} />
            <AccessRow label="CCCD" value={fieldVisibility("citizenId")} />
          </div>
        </aside>
      </section>
    </div>
  );
}

function AccessRow({ label, value }: { label: string; value: "visible" | "masked" | "hidden" }) {
  const Icon = value === "visible" ? Eye : value === "masked" ? LockKeyhole : EyeOff;
  const labels = { visible: "Hiển thị", masked: "Che một phần", hidden: "Ẩn" };
  return <div><span>{label}</span><strong className={value}><Icon size={14} strokeWidth={1.5} />{labels[value]}</strong></div>;
}

function AccessDenied({ onHome }: { onHome: () => void }) {
  return <div className="denied-state"><div className="denied-icon"><ShieldAlert size={24} strokeWidth={1.5} /></div><span className="eyebrow">ACCESS CONTROL</span><h2>Không có quyền truy cập</h2><p>Module này không nằm trong quyền hiệu lực của persona hiện tại. Nội dung nhạy cảm chưa được tải.</p><button className="secondary-button" onClick={onHome}><ArrowLeft size={16} strokeWidth={1.5} /> Quay về tổng quan</button></div>;
}
