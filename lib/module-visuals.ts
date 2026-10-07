export type ModuleVisual = {
  asset: string;
  alt: string;
  accent: string;
};

export const moduleVisuals: Record<string, ModuleVisual> = {
  onboarding: {
    asset: "/assets/ohriise/01_onboarding_welcome-new-employee_hero-empty-state.png",
    alt: "Minh họa onboarding nhân viên mới",
    accent: "#00c9d2",
  },
  profile: {
    asset: "/assets/ohriise/02_employee-profile_records-management_form-ui.png",
    alt: "Minh họa hồ sơ nhân sự",
    accent: "#1265e8",
  },
  employees: {
    asset: "/assets/ohriise/02_employee-profile_records-management_form-ui.png",
    alt: "Minh họa quản lý hồ sơ nhân sự",
    accent: "#1265e8",
  },
  contracts: {
    asset: "/assets/ohriise/03_contract-signing_document-approval_workflow.png",
    alt: "Minh họa hợp đồng và ký kết",
    accent: "#00bfe8",
  },
  "hr-contracts": {
    asset: "/assets/ohriise/03_contract-signing_document-approval_workflow.png",
    alt: "Minh họa quản lý hợp đồng",
    accent: "#00bfe8",
  },
  organization: {
    asset: "/assets/ohriise/04_team-org-chart_structure-management_hierarchy.png",
    alt: "Minh họa cấu trúc tổ chức",
    accent: "#00d2c8",
  },
  attendance: {
    asset: "/assets/ohriise/05_attendance-qr-checkin_office-timekeeping.png",
    alt: "Minh họa chấm công oHRiise",
    accent: "#1265e8",
  },
  "ai-wfh": {
    asset: "/assets/ohriise/06_wfh-monitoring_ai-activity-review_remote-work.png",
    alt: "Minh họa WFH Intelligence",
    accent: "#00d2c8",
  },
  wfh: {
    asset: "/assets/ohriise/06_wfh-monitoring_ai-activity-review_remote-work.png",
    alt: "Minh họa làm việc từ xa",
    accent: "#00d2c8",
  },
  leave: {
    asset: "/assets/ohriise/07_leave-management_calendar-request_time-off.png",
    alt: "Minh họa quản lý nghỉ phép",
    accent: "#72e600",
  },
  schedule: {
    asset: "/assets/ohriise/08_shift-scheduling_work-calendar_team-planning.png",
    alt: "Minh họa lịch và ca làm việc",
    accent: "#00bfe8",
  },
  "team-calendar": {
    asset: "/assets/ohriise/08_shift-scheduling_work-calendar_team-planning.png",
    alt: "Minh họa lịch đội ngũ",
    accent: "#00bfe8",
  },
  "ai-cv": {
    asset: "/assets/ohriise/09_ai-recruitment_cv-jd-matching_candidate-ranking.png",
    alt: "Minh họa AI tuyển dụng",
    accent: "#00d2c8",
  },
  performance: {
    asset: "/assets/ohriise/11_performance-kpi_employee-evaluation_review.png",
    alt: "Minh họa đánh giá hiệu suất",
    accent: "#72e600",
  },
  reports: {
    asset: "/assets/ohriise/12_hr-analytics_people-dashboard_reporting.png",
    alt: "Minh họa báo cáo và phân tích nhân sự",
    accent: "#00bfe8",
  },
  payslip: {
    asset: "/assets/ohriise/13_payslip-payroll_finance-salary-management.png",
    alt: "Minh họa phiếu lương",
    accent: "#1265e8",
  },
  notifications: {
    asset: "/assets/ohriise/14_notifications_alert-center_announcements.png",
    alt: "Minh họa trung tâm thông báo",
    accent: "#00c9d2",
  },
  permissions: {
    asset: "/assets/ohriise/15_rbac-security_permission-management_admin-control.png",
    alt: "Minh họa quản trị quyền truy cập",
    accent: "#1265e8",
  },
  "admin-overview": {
    asset: "/assets/ohriise/15_rbac-security_permission-management_admin-control.png",
    alt: "Minh họa quản trị hệ thống",
    accent: "#1265e8",
  },
  offboarding: {
    asset: "/assets/ohriise/16_offboarding_exit-asset-recovery_account-deactivation.png",
    alt: "Minh họa quy trình offboarding",
    accent: "#00d2c8",
  },
  "offboarding-status": {
    asset: "/assets/ohriise/16_offboarding_exit-asset-recovery_account-deactivation.png",
    alt: "Minh họa trạng thái offboarding",
    accent: "#00d2c8",
  },
};

export function visualForModule(moduleId: string) {
  return moduleVisuals[moduleId];
}
