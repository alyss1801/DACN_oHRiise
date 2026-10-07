"use client";

import { ArrowLeft, Check, Eye, EyeOff, LockKeyhole, Plus, ShieldAlert, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/features/session/session-context";
import { can } from "@/lib/authorization/engine";
import { WorkspaceHeader } from "@/features/employee/workspace-frame";
import { AttendanceHubWorkspace } from "@/features/employee/attendance-hub-workspace";
import { ContractWorkspace } from "@/features/employee/contract-workspace";
import { DailyReportWorkspace } from "@/features/employee/daily-report-workspace";
import { NotificationsWorkspace } from "@/features/employee/notifications-workspace";
import { PayslipWorkspace } from "@/features/employee/payslip-workspace";
import { PerformanceWorkspace } from "@/features/employee/performance-workspace";
import { ProfileWorkspace } from "@/features/employee/profile-workspace";
import { OffboardingStatusWorkspace } from "@/features/employee/schedule-workspace";
import { EmailWorkspace } from "@/features/email/email-workspace";
import { ApprovalMiniappWorkspace } from "@/features/team/approval-miniapp-workspace";
import { TeamCalendarWorkspace } from "@/features/team/team-calendar-workspace";
import { TeamOverviewWorkspace } from "@/features/team/team-overview-workspace";
import { WfhAiWorkspace } from "@/features/team/wfh-ai-workspace";
import { AiCvWorkspace } from "@/features/hr/ai-cv-workspace";
import { HrContractsWorkspace, OnboardingWorkspace } from "@/features/hr/lifecycle-workspaces";
import { EmployeesWorkspace, OffboardingWorkspace, OrganizationWorkspace } from "@/features/hr/people-workspaces";
import { AttendanceMonitoringWorkspace, ExpenseReviewWorkspace, MisaSyncWorkspace, ReportsWorkspace, TimesheetsWorkspace } from "@/features/hr/operations-workspaces";
import { AccessReviewsWorkspace, AccountsWorkspace, AuditWorkspace, DelegationWorkspace, PermissionsWorkspace } from "@/features/admin/access-workspaces";
import { AdminOverviewWorkspace, AiGovernanceWorkspace, BranchesWorkspace, CatalogsWorkspace, EmailDlpWorkspace, IntegrationsWorkspace, NotificationConfigWorkspace } from "@/features/admin/system-workspaces";

const moduleCopy: Record<string, { eyebrow: string; title: string; description: string; action?: string }> = {
  profile: { eyebrow: "HỒ SƠ CÁ NHÂN", title: "Thông tin của Nguyễn Thu Hà", description: "Thông tin được hiển thị theo chính sách trường nhạy cảm.", action: "Cập nhật hồ sơ" },
  attendance: { eyebrow: "CHẤM CÔNG", title: "Nhật ký thời gian", description: "Theo dõi check-in, lịch làm việc và các ngoại lệ cần bổ sung.", action: "Tạo điều chỉnh" },
  leave: { eyebrow: "NGHỈ PHÉP", title: "Yêu cầu của tôi", description: "Số dư, lịch sử và trạng thái phê duyệt được cập nhật tức thời.", action: "Tạo đơn nghỉ" },
  expenses: { eyebrow: "CHI PHÍ", title: "Đề nghị thanh toán", description: "Chi phí công cụ và phần mềm phục vụ công việc.", action: "Tạo đề nghị" },
  contracts: { eyebrow: "HỢP ĐỒNG", title: "Hồ sơ hợp đồng", description: "Theo dõi vòng đời hợp đồng và bản ký đã hoàn tất." },
  team: { eyebrow: "ĐỘI NGŨ", title: "Data Platform", description: "Tình trạng làm việc và các tín hiệu cần Team Lead lưu ý." },
  approvals: { eyebrow: "PHÊ DUYỆT", title: "Hộp thư tập trung", description: "Duyệt yêu cầu với ngữ cảnh đội ngũ, lịch và dữ liệu liên quan.", action: "Xem yêu cầu tiếp theo" },
  "team-calendar": { eyebrow: "ĐỘI NGŨ", title: "Lịch năng lực đội ngũ", description: "Ngày nghỉ, WFH và lịch quan trọng trong phạm vi đội." },
  "ai-wfh": { eyebrow: "AI · HUMAN IN THE LOOP", title: "WFH Evidence Review", description: "AI tổng hợp bằng chứng; quyết định cuối cùng luôn thuộc về người quản lý.", action: "Mở mục cần xem xét" },
  employees: { eyebrow: "NHÂN SỰ", title: "Hồ sơ nhân sự", description: "Danh bạ nhân sự theo phạm vi dữ liệu hiệu lực.", action: "Thêm nhân sự" },
  onboarding: { eyebrow: "NHÂN SỰ", title: "Onboarding", description: "Điều phối dữ liệu, hợp đồng, tài khoản và thiết bị cho nhân sự mới.", action: "Bắt đầu onboarding" },
  "hr-contracts": { eyebrow: "NHÂN SỰ", title: "Quản lý hợp đồng", description: "Vòng đời hợp đồng từ mẫu đến bản ký hoàn tất.", action: "Tạo hợp đồng" },
  organization: { eyebrow: "TỔ CHỨC", title: "Cấu trúc tổ chức", description: "Phòng ban, vị trí, quan hệ báo cáo và nhóm dự án." },
  timesheets: { eyebrow: "VẬN HÀNH", title: "Bảng công tháng 10", description: "Chuẩn bị dữ liệu đầu vào trước khi đồng bộ sang MISA AMIS.", action: "Kiểm tra ngoại lệ" },
  reports: { eyebrow: "BÁO CÁO", title: "People analytics", description: "Báo cáo nhân sự theo đúng phạm vi được ủy quyền." },
  "misa-sync": { eyebrow: "TÍCH HỢP", title: "MISA AMIS", description: "Đồng bộ dữ liệu đầu vào; oHRiise không tính lương.", action: "Thử đồng bộ lại" },
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
  const resolvedModuleId = moduleId === "schedule"
    ? "attendance"
    : moduleId === "wfh" || moduleId === "leave" || moduleId === "expenses"
      ? "approvals"
      : moduleId;
  const copy = moduleCopy[resolvedModuleId] ?? { eyebrow: "oHRiise", title: "Không gian làm việc", description: "Module đang được xây dựng." };
  const permission = session.permissions.find((item) => item.resource === resolvedModuleId);

  if (!permission || !can(session, resolvedModuleId)) {
    return <AccessDenied onHome={onHome} />;
  }

  if (resolvedModuleId === "profile") return <ProfileWorkspace />;
  if (resolvedModuleId === "attendance") return <AttendanceHubWorkspace />;
  if (resolvedModuleId === "daily-report") return <DailyReportWorkspace />;
  if (moduleId === "email") return <EmailWorkspace onNavigate={onNavigate} />;
  if (moduleId === "contracts") return <ContractWorkspace />;
  if (moduleId === "offboarding-status") return <OffboardingStatusWorkspace />;
  if (moduleId === "payslip") return <PayslipWorkspace />;
  if (moduleId === "performance") return <PerformanceWorkspace />;
  if (moduleId === "notifications") return <NotificationsWorkspace />;
  if (moduleId === "team") return <TeamOverviewWorkspace onNavigate={onNavigate} />;
  if (resolvedModuleId === "approvals") return <ApprovalMiniappWorkspace />;
  if (moduleId === "team-calendar") return <TeamCalendarWorkspace />;
  if (moduleId === "ai-wfh") return <WfhAiWorkspace />;
  if (moduleId === "employees") return <EmployeesWorkspace />;
  if (moduleId === "onboarding") return <OnboardingWorkspace />;
  if (moduleId === "hr-contracts") return <HrContractsWorkspace />;
  if (moduleId === "organization") return <OrganizationWorkspace />;
  if (moduleId === "offboarding") return <OffboardingWorkspace />;
  if (moduleId === "attendance-monitoring") return <AttendanceMonitoringWorkspace />;
  if (moduleId === "timesheets") return <TimesheetsWorkspace />;
  if (moduleId === "expense-review") return <ExpenseReviewWorkspace />;
  if (moduleId === "misa-sync") return <MisaSyncWorkspace />;
  if (moduleId === "reports") return <ReportsWorkspace />;
  if (moduleId === "ai-cv") return <AiCvWorkspace />;
  if (moduleId === "admin-overview") return <AdminOverviewWorkspace onNavigate={onNavigate} />;
  if (moduleId === "branches-gps") return <BranchesWorkspace />;
  if (moduleId === "accounts") return <AccountsWorkspace onNavigate={onNavigate} />;
  if (moduleId === "permissions") return <PermissionsWorkspace />;
  if (moduleId === "access-reviews") return <AccessReviewsWorkspace />;
  if (moduleId === "delegation") return <DelegationWorkspace />;
  if (moduleId === "catalogs") return <CatalogsWorkspace />;
  if (moduleId === "email-dlp") return <EmailDlpWorkspace />;
  if (moduleId === "notification-config") return <NotificationConfigWorkspace />;
  if (moduleId === "integrations") return <IntegrationsWorkspace />;
  if (moduleId === "audit") return <AuditWorkspace />;
  if (moduleId === "ai-governance") return <AiGovernanceWorkspace />;

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
