import type { AccessTemplate, Account, AuditEvent, PermissionDefinition, ScopeType } from "./types";
import { initialHrState } from "@/features/hr/hr-demo-data";
import type { HrEmployee } from "@/features/hr/hr-demo-data";

export const scopeLabels: Record<ScopeType, string> = {
  self: "Bản thân",
  team: "Team được quản lý",
  department: "Phòng ban",
  branch: "Chi nhánh",
  company: "Toàn công ty",
};

export const permissionCatalog: PermissionDefinition[] = [
  { code: "employee.self.read", module: "Hồ sơ nhân sự", name: "Xem hồ sơ cá nhân", description: "Xem hồ sơ nhân sự của chính mình.", protected: true },
  { code: "employee.read", module: "Hồ sơ nhân sự", name: "Xem hồ sơ nhân sự", description: "Xem hồ sơ trong phạm vi dữ liệu được cấp." },
  { code: "employee.update", module: "Hồ sơ nhân sự", name: "Cập nhật hồ sơ", description: "Cập nhật thông tin công việc không nhạy cảm.", dependency: "employee.read" },
  { code: "employee.export", module: "Hồ sơ nhân sự", name: "Xuất danh sách nhân sự", description: "Xuất dữ liệu nhân sự đã được phép xem.", dependency: "employee.read" },
  { code: "attendance.self.read", module: "Chấm công", name: "Xem chấm công cá nhân", description: "Xem dữ liệu chấm công của bản thân.", protected: true },
  { code: "attendance.read", module: "Chấm công", name: "Xem bảng công", description: "Xem bảng công theo phạm vi dữ liệu." },
  { code: "attendance.adjust", module: "Chấm công", name: "Điều chỉnh chấm công", description: "Tạo và xử lý điều chỉnh chấm công.", dependency: "attendance.read" },
  { code: "attendance.export", module: "Chấm công", name: "Xuất bảng công", description: "Xuất bảng công đã được cho phép.", dependency: "attendance.read" },
  { code: "leave.self.request", module: "Nghỉ phép", name: "Tạo đơn nghỉ", description: "Tạo và theo dõi đơn nghỉ của bản thân.", protected: true },
  { code: "leave.read", module: "Nghỉ phép", name: "Xem đơn nghỉ", description: "Xem yêu cầu nghỉ trong phạm vi dữ liệu." },
  { code: "leave.approve", module: "Nghỉ phép", name: "Phê duyệt nghỉ phép", description: "Phê duyệt hoặc từ chối yêu cầu nghỉ.", dependency: "leave.read" },
  { code: "schedule.manage", module: "Ca làm việc", name: "Quản lý ca làm việc", description: "Sắp xếp và điều chỉnh ca làm việc." },
  { code: "contract.read", module: "Hợp đồng", name: "Xem hợp đồng", description: "Xem metadata hợp đồng trong phạm vi được cấp." },
  { code: "contract.update", module: "Hợp đồng", name: "Cập nhật hợp đồng", description: "Cập nhật vòng đời hợp đồng.", dependency: "contract.read" },
  { code: "recruitment.candidate.read", module: "Tuyển dụng", name: "Xem ứng viên", description: "Xem hồ sơ ứng viên trong phạm vi tuyển dụng." },
  { code: "recruitment.ai.evaluate", module: "Tuyển dụng", name: "Đánh giá ứng viên bằng AI", description: "Sử dụng gợi ý AI có human-in-the-loop.", dependency: "recruitment.candidate.read" },
  { code: "recruitment.candidate.export", module: "Tuyển dụng", name: "Xuất dữ liệu ứng viên", description: "Xuất danh sách ứng viên được phép xem.", dependency: "recruitment.candidate.read" },
  { code: "project.read", module: "Dự án", name: "Xem dự án", description: "Xem dữ liệu và tài liệu dự án được phân công." },
  { code: "reports.view", module: "Báo cáo", name: "Xem báo cáo", description: "Xem báo cáo tổng hợp trong phạm vi dữ liệu." },
  { code: "reports.export", module: "Báo cáo", name: "Xuất báo cáo", description: "Xuất báo cáo đã được cho phép.", dependency: "reports.view" },
  { code: "integration.configure", module: "Tích hợp", name: "Cấu hình tích hợp", description: "Quản lý kết nối dịch vụ doanh nghiệp." },
  { code: "team.manage", module: "Đội ngũ", name: "Quản lý đội ngũ", description: "Xem đội ngũ, lịch và đánh giá thử việc trong phạm vi được giao." },
  { code: "announcement.post.team", module: "Thông báo", name: "Đăng trong kênh nhóm", description: "Đăng thông báo cho nhóm trực tiếp." },
  { code: "announcement.post.company", module: "Thông báo", name: "Đăng thông báo chung", description: "Đăng thông báo theo phạm vi HR hoặc Admin được cấp." },
  { code: "hr.command.view", module: "Nhân sự", name: "Trung tâm HR", description: "Xem công việc và chỉ số HR trong phạm vi được cấp." },
  { code: "hr.employee.manage", module: "Nhân sự", name: "Hồ sơ nhân sự", description: "Xem và cập nhật hồ sơ nhân sự." },
  { code: "hr.onboarding.manage", module: "Nhân sự", name: "Onboarding", description: "Khởi tạo và xử lý onboarding." },
  { code: "hr.probation.manage", module: "Nhân sự", name: "Thử việc", description: "Giao, đánh giá và quyết định thử việc." },
  { code: "hr.contract.manage", module: "Nhân sự", name: "Quản lý hợp đồng", description: "Theo dõi và xử lý hợp đồng." },
  { code: "hr.organization.manage", module: "Nhân sự", name: "Tổ chức", description: "Cập nhật cơ cấu tổ chức trong phạm vi được cấp." },
  { code: "hr.offboarding.manage", module: "Nhân sự", name: "Offboarding", description: "Khởi tạo và xử lý quy trình nghỉ việc." },
  { code: "hr.assets.manage", module: "Nhân sự", name: "Tài sản nhân sự", description: "Theo dõi và bàn giao tài sản." },
  { code: "hr.attendance.manage", module: "Nhân sự", name: "Giám sát chấm công", description: "Đối soát chấm công theo phạm vi." },
  { code: "hr.leave.manage", module: "Nhân sự", name: "Quản lý nghỉ phép", description: "Xử lý đơn phép ở bước HR." },
  { code: "hr.timesheets.manage", module: "Nhân sự", name: "Bảng công", description: "Đối soát và chốt bảng công." },
  { code: "hr.expense.approve", module: "Nhân sự", name: "Duyệt chi phí", description: "Xử lý đề nghị chi phí." },
  { code: "hr.misa.configure", module: "Nhân sự", name: "CSV công nội bộ", description: "Cấu hình xuất dữ liệu công." },
  { code: "hr.policies.manage", module: "Nhân sự", name: "Chính sách HR", description: "Cập nhật chính sách nhân sự." },
  { code: "hr.recruitment.manage", module: "Nhân sự", name: "Tuyển dụng", description: "Theo dõi và xử lý ứng viên." },
  { code: "admin.accounts.manage", module: "Quản trị tài khoản", name: "Quản lý tài khoản", description: "Tạo, khóa và cập nhật định danh kỹ thuật.", protected: true },
  { code: "admin.permissions.assign", module: "Quản trị tài khoản", name: "Phân quyền tài khoản", description: "Gán mẫu quyền và quyền cá nhân.", dependency: "admin.accounts.manage", protected: true },
  { code: "admin.system.configure", module: "Cấu hình hệ thống", name: "Cấu hình hệ thống", description: "Quản lý cấu hình vận hành hệ thống.", protected: true },
];

export const initialTemplates: AccessTemplate[] = [
  template("tpl-employee", "Employee", "EMPLOYEE", "Quyền nền tảng bắt buộc cho mọi tài khoản.", "system", ["employee.self.read", "attendance.self.read", "leave.self.request"], ["employee.self.read", "attendance.self.read", "leave.self.request"], ["self"], 9),
  template("tpl-team-lead", "Team Lead", "TEAM_LEAD", "Đội ngũ và phê duyệt theo phạm vi được cấp.", "system", ["team.manage", "announcement.post.team", "employee.read", "attendance.read", "leave.read", "leave.approve", "reports.view"], ["team.manage"], ["team", "department"], 2),
  template("tpl-hr", "HR", "HR", "Một vai trò HR; quyền và phạm vi cấu hình riêng cho từng tài khoản.", "system", ["announcement.post.company", "hr.command.view", "hr.employee.manage", "hr.onboarding.manage", "hr.probation.manage", "hr.contract.manage", "hr.organization.manage", "hr.offboarding.manage", "hr.assets.manage", "hr.attendance.manage", "hr.leave.manage", "hr.timesheets.manage", "hr.expense.approve", "hr.misa.configure", "hr.policies.manage", "hr.recruitment.manage", "employee.read", "employee.update", "employee.export", "attendance.read", "attendance.adjust", "attendance.export", "leave.read", "leave.approve", "contract.read", "contract.update", "recruitment.candidate.read", "reports.view", "reports.export"], ["hr.command.view"], ["department", "branch", "company"], 2),
  template("tpl-system-admin", "Admin", "ADMIN", "Quản trị định danh, quyền và cấu hình hệ thống.", "system", ["admin.accounts.manage", "admin.permissions.assign", "admin.system.configure", "integration.configure", "announcement.post.company", "reports.view"], ["admin.accounts.manage", "admin.permissions.assign", "admin.system.configure"], ["company"], 1),
  template("tpl-project-reviewer", "Project Reviewer", "PROJECT_REVIEWER", "Rà soát tiến độ dự án và báo cáo liên quan.", "custom", ["project.read", "reports.view"], [], ["team", "department"], 0),
  template("tpl-recruitment-assistant", "Recruitment Assistant", "RECRUITMENT_ASSISTANT", "Hỗ trợ tuyển dụng và đánh giá ứng viên.", "custom", ["recruitment.candidate.read", "recruitment.ai.evaluate"], [], ["branch", "company"], 0),
  template("tpl-attendance-supervisor", "Attendance Supervisor", "ATTENDANCE_SUPERVISOR", "Theo dõi và điều chỉnh dữ liệu chấm công.", "custom", ["attendance.read", "attendance.adjust", "attendance.export"], [], ["department", "branch"], 0),
];

function template(id: string, name: string, code: string, description: string, type: AccessTemplate["type"], permissionCodes: string[], lockedCodes: string[], scopeCompatibility: ScopeType[], usageCount: number): AccessTemplate {
  return { id, name, code, description, type, status: "active", permissionCodes, lockedCodes, scopeCompatibility, updatedAt: "14/10/2026", version: 1, usageCount };
}

export function accountFromEmployee(person: HrEmployee, people: HrEmployee[], index: number, status: Account["status"] = "pending"): Account {
  const templateIds = ["tpl-employee"];
  if (person.id === "OH-0184" || person.id === "OH-0259") templateIds.push("tpl-team-lead");
  if (person.id === "OH-0091" || person.id === "OH-0266") templateIds.push("tpl-hr");
  if (person.id === "OH-0001") templateIds.push("tpl-system-admin");
  const scope: Account["scope"] = person.id === "OH-0091" || person.id === "OH-0001" ? { type: "company" } : person.id === "OH-0266" ? { type: "branch", target: person.branch } : templateIds.includes("tpl-team-lead") ? { type: "team", target: person.primaryTeamId ?? person.department } : { type: "self" };
  return { id: `user-${index}`, employeeId: person.id, employeeCode: person.id, name: person.name, initials: person.initials, email: person.email, branch: person.branch, department: person.department, team: person.primaryTeamId ?? "—", position: person.position, level: "—", employmentType: person.employmentType, manager: people.find((item) => item.id === person.managerId)?.name ?? "Chưa gán", startDate: person.startDate, createdAt: person.startDate, status, templateIds, overrides: {}, scope, authMethod: "Demo cục bộ", mfa: false, passwordChangedAt: "Chưa thiết lập", activeSessions: 0, failedLogins: 0 };
}

export const initialAccounts: Account[] = initialHrState.employees.map((person, index, people) => accountFromEmployee(person, people, index + 1, person.id === "OH-0218" ? "pending" : "active"));

export const initialAuditEvents: AuditEvent[] = [
  { id: "audit-1", accountId: "user-2", actor: "Dữ liệu mẫu", action: "Gán mẫu Team Lead", timestamp: "14/10/2026 · 16:42", previousValue: "Employee", newValue: "Employee + Team Lead" },
  { id: "audit-2", accountId: "user-1", actor: "Dữ liệu mẫu", action: "Tạo tài khoản HR", timestamp: "05/01/2026 · 09:10", previousValue: "—", newValue: "Đang hoạt động" },
  { id: "audit-3", templateId: "tpl-hr", actor: "Nguyễn Thu Hà", action: "Cập nhật mẫu quyền", timestamp: "13/10/2026 · 11:08", previousValue: "Phiên bản 1", newValue: "Phiên bản 2" },
];
