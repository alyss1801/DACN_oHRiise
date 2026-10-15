import type { AccessTemplate, Account, AuditEvent, PermissionDefinition, ScopeType } from "./types";

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
  { code: "admin.accounts.manage", module: "Quản trị tài khoản", name: "Quản lý tài khoản", description: "Tạo, khóa và cập nhật định danh kỹ thuật.", protected: true },
  { code: "admin.permissions.assign", module: "Quản trị tài khoản", name: "Phân quyền tài khoản", description: "Gán mẫu quyền và quyền cá nhân.", dependency: "admin.accounts.manage", protected: true },
  { code: "admin.system.configure", module: "Cấu hình hệ thống", name: "Cấu hình hệ thống", description: "Quản lý cấu hình vận hành hệ thống.", protected: true },
];

export const initialTemplates: AccessTemplate[] = [
  template("tpl-employee", "Employee", "EMPLOYEE", "Quyền nền tảng bắt buộc cho mọi tài khoản.", "system", ["employee.self.read", "attendance.self.read", "leave.self.request"], ["employee.self.read", "attendance.self.read", "leave.self.request"], ["self"], 36),
  template("tpl-team-lead", "Team Lead", "TEAM_LEAD", "Quản lý đội ngũ, phê duyệt và xem báo cáo team.", "system", ["employee.read", "attendance.read", "attendance.adjust", "leave.read", "leave.approve", "reports.view"], ["employee.read", "leave.approve"], ["team", "department"], 8),
  template("tpl-hr-branch", "HR Branch", "HR_BRANCH", "Vận hành nhân sự theo phạm vi chi nhánh.", "system", ["employee.read", "employee.update", "attendance.read", "contract.read", "recruitment.candidate.read", "reports.view"], ["employee.read"], ["branch"], 24),
  template("tpl-hr-head", "HR Head", "HR_HEAD", "Điều hành nghiệp vụ nhân sự trên toàn công ty.", "system", ["employee.read", "employee.update", "employee.export", "attendance.read", "attendance.export", "leave.read", "leave.approve", "contract.read", "contract.update", "recruitment.candidate.read", "reports.view", "reports.export"], ["employee.read"], ["department", "branch", "company"], 3),
  template("tpl-system-admin", "System Admin", "SYSTEM_ADMIN", "Quản trị định danh và cấu hình kỹ thuật, không mặc định xem dữ liệu HR nhạy cảm.", "system", ["admin.accounts.manage", "admin.permissions.assign", "admin.system.configure", "integration.configure", "reports.view"], ["admin.accounts.manage", "admin.permissions.assign", "admin.system.configure"], ["company"], 2),
  template("tpl-project-reviewer", "Project Reviewer", "PROJECT_REVIEWER", "Rà soát tiến độ dự án và báo cáo liên quan.", "custom", ["project.read", "reports.view"], [], ["team", "department"], 5),
  template("tpl-recruitment-assistant", "Recruitment Assistant", "RECRUITMENT_ASSISTANT", "Hỗ trợ tuyển dụng và đánh giá ứng viên.", "custom", ["recruitment.candidate.read", "recruitment.ai.evaluate"], [], ["branch", "company"], 4),
  template("tpl-attendance-supervisor", "Attendance Supervisor", "ATTENDANCE_SUPERVISOR", "Theo dõi và điều chỉnh dữ liệu chấm công.", "custom", ["attendance.read", "attendance.adjust", "attendance.export"], [], ["department", "branch"], 6),
];

function template(id: string, name: string, code: string, description: string, type: AccessTemplate["type"], permissionCodes: string[], lockedCodes: string[], scopeCompatibility: ScopeType[], usageCount: number): AccessTemplate {
  return { id, name, code, description, type, status: "active", permissionCodes, lockedCodes, scopeCompatibility, updatedAt: "14/10/2026", version: 1, usageCount };
}

const names = [
  "Nguyễn Văn An", "Trần Thị Bích", "Lê Văn Cường", "Phạm Thu Dung", "Hoàng Minh Đức", "Vũ Ngọc Anh",
  "Đặng Hải Nam", "Bùi Khánh Linh", "Đỗ Quang Huy", "Hồ Thị Mai", "Ngô Tuấn Kiệt", "Dương Thanh Hà",
  "Lý Gia Bảo", "Mai Thùy Trang", "Trịnh Quốc Khánh", "Phan Hoài An", "Tạ Minh Châu", "Cao Đức Long",
  "Lương Mỹ Duyên", "Chu Nhật Minh", "Võ Thành Công", "Đinh Bảo Ngọc", "Kiều Anh Tú", "Quách Thu Hương",
  "Nguyễn Gia Hân", "Trần Hoàng Phúc", "Lê Quỳnh Như", "Phạm Công Thành", "Hoàng Yến Nhi", "Vũ Trung Kiên",
  "Đặng Phương Thảo", "Bùi Đức Anh", "Đỗ Hồng Nhung", "Hồ Minh Khang", "Ngô Bảo Trâm", "Dương Quốc Việt",
];
const departments = ["Engineering", "Human Resources", "Product", "Finance", "Operations", "Customer Success", "Sales"];
const branches = ["TP.HCM", "Hà Nội", "Đà Nẵng"];
const teams = ["Engineering A", "Data Platform", "People Operations", "Product Growth", "Finance Core", "Customer Care", "Sales Enterprise"];
const positions = ["Software Engineer", "HR Generalist", "Product Designer", "Finance Executive", "Operations Specialist", "Customer Success Executive", "Sales Executive"];
const levels = ["Junior", "Middle", "Senior", "Lead"];
const employmentTypes = ["Toàn thời gian", "Thử việc", "Hợp đồng", "Cộng tác viên"];

export const initialAccounts: Account[] = names.map((name, index) => {
  const department = departments[index % departments.length];
  const branch = branches[index % branches.length];
  const baseTemplates = ["tpl-employee"];
  if (index === 0 || index === 2 || index % 11 === 0) baseTemplates.push("tpl-team-lead");
  if (index === 1 || index === 5 || index % 13 === 0) baseTemplates.push("tpl-hr-branch");
  if (index === 7 || index === 20) baseTemplates.push("tpl-hr-head");
  if (index === 8 || index === 30) baseTemplates.push("tpl-system-admin");
  if (index % 9 === 0) baseTemplates.push("tpl-project-reviewer");
  if (index % 10 === 0) baseTemplates.push("tpl-recruitment-assistant");
  const employeeCode = `EMP-${String(241 + index).padStart(5, "0")}`;
  const initials = name.split(" ").slice(-2).map((part) => part[0]).join("").toUpperCase();
  const statuses: Account["status"][] = ["active", "active", "active", "locked", "pending", "inactive"];
  return {
    id: `user-${index + 1}`,
    employeeCode,
    name,
    initials,
    email: `nhan.su${index + 1}@ohriise.vn`,
    branch,
    department,
    team: teams[index % teams.length],
    position: positions[index % positions.length],
    level: levels[index % levels.length],
    employmentType: employmentTypes[index % employmentTypes.length],
    manager: index % 3 === 0 ? "Lê Minh Quân" : "Nguyễn Thu Hà",
    startDate: `${String((index % 27) + 1).padStart(2, "0")}/0${(index % 9) + 1}/202${2 + (index % 4)}`,
    createdAt: `${String((index % 27) + 1).padStart(2, "0")}/01/2026`,
    status: statuses[index % statuses.length],
    templateIds: Array.from(new Set(baseTemplates)),
    overrides: (index === 0 ? { "reports.export": "allow" } : index % 8 === 0 ? { "project.read": "allow" } : {}) as Account["overrides"],
    scope: index === 0 ? { type: "team", target: "Engineering A" } : department === "Human Resources" ? { type: "branch", target: branch } : { type: index % 4 === 0 ? "department" : "self", target: index % 4 === 0 ? department : undefined },
    authMethod: index % 5 === 0 ? "Microsoft SSO" : "Mật khẩu oHRiise",
    mfa: index % 3 !== 0,
    lastLogin: index % 7 === 0 ? undefined : `${String(15 - (index % 7)).padStart(2, "0")}/10/2026 · ${String(8 + (index % 9)).padStart(2, "0")}:24`,
    passwordChangedAt: "03/09/2026",
    activeSessions: index % 4,
    failedLogins: index % 5 === 0 ? 2 : 0,
  };
});

export const initialAuditEvents: AuditEvent[] = [
  { id: "audit-1", accountId: "user-1", actor: "Lê Minh Quân", action: "Gán mẫu Team Lead", timestamp: "14/10/2026 · 16:42", previousValue: "Employee", newValue: "Employee + Team Lead" },
  { id: "audit-2", accountId: "user-1", actor: "System", action: "Tạo tài khoản", timestamp: "05/01/2026 · 09:10", previousValue: "—", newValue: "Đang hoạt động" },
  { id: "audit-3", templateId: "tpl-hr-branch", actor: "Nguyễn Thu Hà", action: "Cập nhật mẫu quyền", timestamp: "13/10/2026 · 11:08", previousValue: "Phiên bản 1", newValue: "Phiên bản 2" },
];
