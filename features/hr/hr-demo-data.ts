import { demoBusinessDate } from "@/lib/demo-clock";
import type { ProbationAssessment } from "./probation-template";

export type HrEmployee = {
  id: string; name: string; initials: string; email: string; branch: string; department: string;
  position: string; managerId?: string; primaryTeamId?: string; employmentType: string; startDate: string;
  status: "active" | "probation" | "inactive"; phone: string; address: string;
};
export type HrContract = {
  id: string; employeeId: string; type: string; startsAt: string; endsAt: string | null;
  status: "draft" | "scheduled" | "active" | "expired"; document: "missing" | "paper-signed" | "verified";
  ownerId: string; version: number; note: string; signedAt?: string; signedEvidence?: string; verifiedAt?: string; verifiedBy?: string; verificationEvidence?: string;
};
export type HrAsset = {
  id: string; name: string; category: string; serial: string; branch: string;
  holderId?: string; assignedAt?: string; condition: string; status: "available" | "awaiting_receipt" | "assigned" | "awaiting_return" | "maintenance" | "retired"; version?: number;
};
export type HrAssetHandover = { id: string; assetId: string; employeeId: string; issuedAt: string; issuedBy: string; conditionOut: string; accessories: string; evidence: string; acknowledgedAt?: string; returnRequestedAt?: string; returnReason?: string; returnedAt?: string; returnedBy?: string; conditionIn?: string; returnEvidence?: string; source: "seed" | "demo" };
export type AttendanceEvent = { kind: "check-in" | "check-out"; at: string; method: "GPS" | "QR" | "WFH" | "DEMO"; note?: string };
export type PunchMethod = "manual" | "gps" | "card" | "fingerprint" | "face";
export type HrSelfPunch = { id: string; employeeId: string; date: string; checkInAt: string; checkOutAt?: string; source: "demo-manual"; checkInMethod?: PunchMethod; checkOutMethod?: PunchMethod };
export type HrAttendance = {
  id: string; employeeId: string; date: string; shift: string; plannedIn: string; plannedOut: string;
  events: AttendanceEvent[]; issue: "none" | "late" | "missing-in" | "missing-out" | "outside-gps" | "duplicate" | "shift-mismatch";
  resolution: "open" | "explanation" | "approved" | "rejected";
  version?: number; correctionIn?: string; correctionOut?: string; reason?: string; // Legacy snapshot fields, migrated to adjustments.
};
export type HrAttendanceAdjustment = { id: string; attendanceId: string; employeeId: string; at: string; actor: string; resolution: HrAttendance["resolution"]; reason: string; correctionIn?: string; correctionOut?: string; version: number; source: "demo" | "legacy" };
export type HrAttendanceConfirmation = { id: string; attendanceId: string; employeeId: string; attendanceVersion: number; decision: "confirmed" | "disputed" | "exception"; actorId: string; actor: string; at: string; reason: string };
export type HrAttendanceExplanation = { id: string; attendanceId: string; employeeId: string; attendanceVersion: number; managerId: string; text: string; submittedAt: string; status: "submitted" | "confirmed" | "rejected"; reviewedAt?: string; reviewReason?: string };
export type HrShiftAssignment = { id: string; employeeId: string; date: string; shift: string; plannedIn: string; plannedOut: string };
export type HrActivity = { id: string; at: string; employeeId?: string; branch: string; department: string; actor: string; text: string };
export type TimesheetSnapshot = { version: number; at: string; actor: string; leaveDates: { employeeId: string; date: string; portion: "full" | "morning" | "afternoon"; branch?: string }[]; wfhDays?: { requestId: string; employeeId: string; branch: string; date: string; checkInAt: string; checkOutAt: string; reportSubmittedAt: string; reviewedAt: string; reviewedBy: string }[]; rows: { attendanceId: string; employeeId: string; branch: string; date: string; effectiveIn: string | null; effectiveOut: string | null; issue: HrAttendance["issue"]; resolution: HrAttendance["resolution"]; confirmation?: "confirmed" | "exception"; confirmedBy?: string; confirmedAt?: string }[] };
export type TimesheetPeriod = { id: string; status: "reconciling" | "closed" | "exported"; version?: number; snapshots?: TimesheetSnapshot[]; closedAt?: string; closedBy?: string; reopenReason?: string };
export type HrExport = { id: string; period: string; branch: string; at: string; count: number; status: "partial-demo" | "exported"; errors: number; snapshotVersion?: number };
export type HrTask = { id: string; label: string; owner: string; deadline: string; doneAt?: string; note?: string };
export type HrCase = { id: string; employeeId: string; kind: "onboarding" | "offboarding"; startedAt: string; lastWorkingDay?: string; disableAt?: string; sourceType?: "employee-request" | "employer-decision" | "contract-expiry" | "other"; reason?: string; sourceReference?: string; tasks: HrTask[]; completedAt?: string; cancelledAt?: string; cancelReason?: string };
export type HrProbationReview = { id: string; employeeId: string; managerId: string; dueAt: string; status: "assigned" | "evaluated" | "activated" | "offboarding-required" | "offboarding-started"; version: number; assignedAt: string; assignedBy: string; templateId?: string; templateVersion?: number; draft?: ProbationAssessment; assessment?: ProbationAssessment; outcome?: "pass" | "fail"; evidence?: string; evaluatedAt?: string; decidedAt?: string; decidedBy?: string; decisionReason?: string; offboardingCaseId?: string };
export type HrPolicy = { id: string; group: string; name: string; value: string; scope: string; effectiveAt: string; version: number; status: "draft" | "scheduled" | "active" | "retired"; updatedAt: string };
export type HrRequisition = { id: string; title: string; department: string; branch: string; status: "open" | "closed"; createdAt: string; criteria: string };
export type HrCandidate = { id: string; name: string; email: string; requisitionId: string; experience: string; skills: string; cvSummary: string; stage: "new" | "screening" | "interview" | "assessment" | "offer" | "hired" | "rejected"; note: string; updatedAt: string; employeeId?: string };
export type OrgDepartment = { id: string; code: string; name: string; parentId?: string; branch: string; managerId?: string; description: string; status: "active" | "inactive"; effectiveAt: string };
export type OrgTeam = { id: string; code: string; name: string; type: "functional" | "project"; departmentId: string; leadId?: string; memberIds: string[]; description: string; startsAt: string; endsAt?: string; status: "active" | "closed" };
export type OrgTransferRow = { employeeId: string; before: { branch: string; department: string; teamId?: string; managerId?: string; position: string }; after: { branch: string; department: string; teamId?: string; managerId?: string; position: string } };
export type OrgChange = { id: string; at: string; effectiveAt: string; actor: string; branch: string; kind: string; entityId: string; summary: string; employeeIds?: string[]; transfers?: OrgTransferRow[]; pendingRequestIds?: string[] };
export type OrgData = { departments: OrgDepartment[]; teams: OrgTeam[]; changes: OrgChange[] };
export type HrState = {
  employees: HrEmployee[]; contracts: HrContract[]; assets: HrAsset[]; assetHandovers: HrAssetHandover[]; attendance: HrAttendance[]; shiftAssignments: HrShiftAssignment[]; selfPunches: HrSelfPunch[]; attendanceAdjustments: HrAttendanceAdjustment[]; attendanceConfirmations: HrAttendanceConfirmation[]; attendanceExplanations: HrAttendanceExplanation[];
  activities: HrActivity[]; periods: TimesheetPeriod[]; exports: HrExport[];
  leaveAdjustments: Record<string, number>; cases: HrCase[]; probationReviews: HrProbationReview[]; policies: HrPolicy[]; requisitions: HrRequisition[]; candidates: HrCandidate[]; organization: OrgData;
};
export const initialHrState: HrState = {
  employees: [
    { id: "OH-0091", name: "Nguyễn Thanh Lan", initials: "NL", email: "lan.nguyen@ohriise.vn", branch: "HCM-Q1", department: "Nhân sự", position: "HR Operations Lead", employmentType: "Toàn thời gian", startDate: "2022-03-04", status: "active", phone: "090 000 0091", address: "TP. Hồ Chí Minh" },
    { id: "OH-0184", name: "Trần Minh Quân", initials: "TQ", email: "quan.tran@ohriise.vn", branch: "HCM-Q1", department: "Sản phẩm", position: "Head of Product", employmentType: "Toàn thời gian", startDate: "2023-02-12", status: "active", phone: "090 000 0184", address: "TP. Hồ Chí Minh" },
    { id: "OH-0248", name: "Nguyễn Thu Hà", initials: "NH", email: "ha.nguyen@ohriise.vn", branch: "HCM-Q1", department: "Sản phẩm", position: "Product Designer", managerId: "OH-0184", employmentType: "Toàn thời gian", startDate: "2024-03-04", status: "active", phone: "090 000 0248", address: "TP. Hồ Chí Minh" },
    { id: "OH-0259", name: "Bùi Thanh Tâm", initials: "BT", email: "tam.bui@ohriise.vn", branch: "HCM-TD", department: "Công nghệ thông tin", position: "Data Engineer", primaryTeamId: "TEAM-DP", employmentType: "Toàn thời gian", startDate: "2024-07-08", status: "active", phone: "090 000 0259", address: "TP. Hồ Chí Minh" },
    { id: "OH-0271", name: "Lê Hoàng Vy", initials: "LV", email: "vy.le@ohriise.vn", branch: "HCM-TD", department: "Công nghệ thông tin", position: "Data Analyst", managerId: "OH-0259", primaryTeamId: "TEAM-DP", employmentType: "Toàn thời gian", startDate: "2025-05-20", status: "active", phone: "090 000 0271", address: "TP. Hồ Chí Minh" },
    { id: "OH-0266", name: "Võ Thu Linh", initials: "TL", email: "linh.vo@ohriise.vn", branch: "HCM-Q1", department: "Nhân sự", position: "HR Generalist", managerId: "OH-0091", primaryTeamId: "TEAM-HR", employmentType: "Toàn thời gian", startDate: "2025-01-13", status: "active", phone: "090 000 0266", address: "TP. Hồ Chí Minh" },
    { id: "OH-0204", name: "Lê Hoàng Đức", initials: "LĐ", email: "duc.le@ohriise.vn", branch: "HN-CG", department: "Kinh doanh", position: "Sales Executive", employmentType: "Toàn thời gian", startDate: "2023-11-06", status: "active", phone: "090 000 0204", address: "Hà Nội" },
    { id: "OH-0137", name: "Phạm Thanh Long", initials: "PL", email: "long.pham@ohriise.vn", branch: "HN-CG", department: "Kinh doanh", position: "Sales Executive", employmentType: "Toàn thời gian", startDate: "2022-08-01", status: "active", phone: "090 000 0137", address: "Hà Nội" },
    { id: "OH-0218", name: "Phạm Gia Bảo", initials: "GB", email: "bao.pham@ohriise.vn", branch: "HCM-TD", department: "Công nghệ thông tin", position: "Software Engineer", managerId: "OH-0259", primaryTeamId: "TEAM-PE", employmentType: "Toàn thời gian", startDate: "2026-10-01", status: "probation", phone: "090 000 0218", address: "TP. Hồ Chí Minh" },
    { id: "OH-0301", name: "Trần Minh Anh", initials: "MA", email: "anh.tran@ohriise.vn", branch: "HCM-TD", department: "Công nghệ thông tin", position: "Data Engineer", managerId: "OH-0259", primaryTeamId: "TEAM-DP", employmentType: "Toàn thời gian", startDate: "2026-10-06", status: "probation", phone: "090 000 0301", address: "TP. Hồ Chí Minh" },
    { id: "OH-0302", name: "Ngô Khánh Linh", initials: "KL", email: "linh.ngo@ohriise.vn", branch: "HCM-TD", department: "Công nghệ thông tin", position: "Data Analyst", managerId: "OH-0259", primaryTeamId: "TEAM-DP", employmentType: "Toàn thời gian", startDate: "2025-07-14", status: "active", phone: "090 000 0302", address: "TP. Hồ Chí Minh" },
  ],
  organization: {
    departments: [
      { id: "DEPT-HR", code: "HR", name: "Nhân sự", branch: "HCM-Q1", managerId: "OH-0091", description: "Vận hành nhân sự và chính sách lao động.", status: "active", effectiveAt: "2022-03-04" },
      { id: "DEPT-PROD", code: "PROD", name: "Sản phẩm", branch: "HCM-Q1", managerId: "OH-0184", description: "Thiết kế và phát triển trải nghiệm sản phẩm.", status: "active", effectiveAt: "2023-02-12" },
      { id: "DEPT-IT", code: "IT", name: "Công nghệ thông tin", branch: "HCM-TD", managerId: "OH-0259", description: "Nền tảng kỹ thuật, dữ liệu và hạ tầng.", status: "active", effectiveAt: "2024-07-08" },
      { id: "DEPT-SALES", code: "SALES", name: "Kinh doanh", branch: "HN-CG", description: "Kinh doanh và chăm sóc khách hàng doanh nghiệp.", status: "active", effectiveAt: "2023-11-06" },
    ],
    teams: [
      { id: "TEAM-HR", code: "HR-OPS", name: "HR Operations", type: "functional", departmentId: "DEPT-HR", leadId: "OH-0091", memberIds: ["OH-0091", "OH-0266"], description: "Điều phối vận hành nhân sự.", startsAt: "2025-01-01", status: "active" },
      { id: "TEAM-DP", code: "DATA-PLAT", name: "Data Platform", type: "functional", departmentId: "DEPT-IT", leadId: "OH-0259", memberIds: ["OH-0259", "OH-0271", "OH-0301", "OH-0302"], description: "Dữ liệu và nền tảng phân tích.", startsAt: "2025-01-01", status: "active" },
      { id: "TEAM-PE", code: "PROD-ENG", name: "Product Engineering", type: "project", departmentId: "DEPT-IT", memberIds: ["OH-0218"], description: "Phát triển tính năng sản phẩm.", startsAt: "2026-10-01", status: "active" },
    ],
    changes: [],
  },
  contracts: [
    { id: "HD-2026-091", employeeId: "OH-0248", type: "Xác định thời hạn", startsAt: "2025-11-06", endsAt: "2026-11-05", status: "active", document: "verified", ownerId: "OH-0091", version: 2, note: "Sắp đến hạn gia hạn." },
    { id: "HD-2026-092", employeeId: "OH-0184", type: "Không xác định thời hạn", startsAt: "2023-02-12", endsAt: null, status: "active", document: "verified", ownerId: "OH-0091", version: 1, note: "Bản giấy đã đối chiếu." },
    { id: "HD-2026-093", employeeId: "OH-0266", type: "Xác định thời hạn", startsAt: "2025-12-01", endsAt: "2026-11-30", status: "active", document: "paper-signed", ownerId: "OH-0091", version: 1, note: "Chờ HR xác minh bản giấy." },
    { id: "HD-2026-094", employeeId: "OH-0218", type: "Thử việc", startsAt: "2026-10-01", endsAt: "2026-11-30", status: "draft", document: "missing", ownerId: "OH-0091", version: 1, note: "Chờ bổ sung bản ký." },
    { id: "HD-2026-095", employeeId: "OH-0137", type: "Xác định thời hạn", startsAt: "2025-11-01", endsAt: "2026-10-31", status: "active", document: "verified", ownerId: "OH-0091", version: 1, note: "Đang chuẩn bị kết thúc quan hệ lao động." },
  ],
  assets: [
    { id: "IT-0238", name: "MacBook Pro 14-inch", category: "Máy tính", serial: "MBP-DEMO-238", branch: "HCM-Q1", holderId: "OH-0248", assignedAt: "2024-03-04", condition: "Tốt", status: "assigned" },
    { id: "IT-0191", name: "ThinkPad T14", category: "Máy tính", serial: "T14-DEMO-191", branch: "HCM-Q1", holderId: "OH-0184", assignedAt: "2023-02-12", condition: "Tốt", status: "assigned" },
    { id: "IT-0307", name: "Dell Latitude 7440", category: "Máy tính", serial: "DL-DEMO-307", branch: "HN-CG", holderId: "OH-0137", assignedAt: "2024-02-08", condition: "Cần kiểm tra", status: "assigned" },
    { id: "IT-0412", name: "MacBook Air M3", category: "Máy tính", serial: "MBA-DEMO-412", branch: "HCM-TD", condition: "Mới", status: "available" },
  ],
  assetHandovers: [
    { id: "handover-seed-238", assetId: "IT-0238", employeeId: "OH-0248", issuedAt: "2024-03-04T09:00:00+07:00", issuedBy: "fixture", conditionOut: "Tốt", accessories: "Không ghi trong dữ liệu mẫu", evidence: "Bản ghi mẫu; chưa có biên bản gốc", acknowledgedAt: "2024-03-04T09:00:00+07:00", source: "seed" },
    { id: "handover-seed-191", assetId: "IT-0191", employeeId: "OH-0184", issuedAt: "2023-02-12T09:00:00+07:00", issuedBy: "fixture", conditionOut: "Tốt", accessories: "Không ghi trong dữ liệu mẫu", evidence: "Bản ghi mẫu; chưa có biên bản gốc", acknowledgedAt: "2023-02-12T09:00:00+07:00", source: "seed" },
    { id: "handover-seed-307", assetId: "IT-0307", employeeId: "OH-0137", issuedAt: "2024-02-08T09:00:00+07:00", issuedBy: "fixture", conditionOut: "Cần kiểm tra", accessories: "Không ghi trong dữ liệu mẫu", evidence: "Bản ghi mẫu; chưa có biên bản gốc", acknowledgedAt: "2024-02-08T09:00:00+07:00", source: "seed" },
  ],
  attendance: seedAttendance(),
  shiftAssignments: seedShifts(),
  selfPunches: [],
  attendanceAdjustments: [],
  attendanceConfirmations: [],
  attendanceExplanations: [],
  activities: [
    { id: "act-1", at: "2026-10-20T09:15:00+07:00", employeeId: "OH-0266", branch: "HCM-Q1", department: "Nhân sự", actor: "Hệ thống demo", text: "Phát hiện check-in muộn của Võ Thu Linh." },
    { id: "act-2", at: "2026-10-19T15:30:00+07:00", employeeId: "OH-0248", branch: "HCM-Q1", department: "Sản phẩm", actor: "Nguyễn Thanh Lan", text: "Đánh dấu hợp đồng Nguyễn Thu Hà sắp đến hạn." },
  ],
  periods: [{ id: "2026-10", status: "reconciling" }, { id: "2026-09", status: "reconciling", reopenReason: "Đối soát 2 bản ghi lỗi sau lần xuất demo trước." }],
  exports: [{ id: "EXP-DEMO-091", period: "2026-09", branch: "Toàn công ty", at: "2026-10-03T09:02:00+07:00", count: 7, status: "partial-demo", errors: 2 }],
  leaveAdjustments: {},
  cases: [
    { id: "ON-2026-018", kind: "onboarding", employeeId: "OH-0218", startedAt: "2026-10-01", tasks: [
      { id: "profile", label: "Xác nhận hồ sơ và cơ cấu", owner: "HR", deadline: "2026-10-02", doneAt: "2026-10-01", note: "Hồ sơ thử việc đã tạo." },
      { id: "contract", label: "Xác minh hợp đồng", owner: "HR", deadline: "2026-10-22" },
      { id: "account", label: "Cấp tài khoản và quyền cơ bản", owner: "System Admin", deadline: "2026-10-22" },
      { id: "leave", label: "Thiết lập phép và ca làm", owner: "HR", deadline: "2026-10-23", doneAt: "2026-10-02", note: "Phép năm và ca hành chính demo." },
      { id: "asset", label: "Bàn giao tài sản", owner: "IT", deadline: "2026-10-24" },
    ] },
    { id: "OFF-2026-018", kind: "offboarding", employeeId: "OH-0137", startedAt: "2026-10-18", lastWorkingDay: "2026-10-31", disableAt: "2026-10-31T11:00:00.000Z", sourceType: "other", reason: "Fixture demo cũ chưa lưu lý do nguồn", sourceReference: "Fixture demo; không có tệp gốc", tasks: [
      { id: "documents", label: "Xác nhận hồ sơ thôi việc", owner: "HR", deadline: "2026-10-22", doneAt: "2026-10-19", note: "Đơn đã được xác nhận." },
      { id: "handover", label: "Bàn giao công việc", owner: "Quản lý trực tiếp", deadline: "2026-10-27" },
      { id: "asset", label: "Thu hồi tài sản", owner: "IT", deadline: "2026-10-30" },
      { id: "account", label: "Phối hợp khóa tài khoản", owner: "System Admin", deadline: "2026-10-31" },
    ] },
  ],
  probationReviews: [{ id: "PR-2026-0218", employeeId: "OH-0218", managerId: "OH-0259", dueAt: "2026-10-30", status: "assigned", version: 1, assignedAt: "2026-10-19T03:00:00.000Z", assignedBy: "Nguyễn Thanh Lan", templateId: "technology", templateVersion: 1 }],
  policies: [
    { id: "POL-ATT-01", group: "Chấm công", name: "Ngưỡng đi trễ (phút)", value: "15", scope: "Toàn công ty", effectiveAt: "2026-11-01", version: 2, status: "scheduled", updatedAt: "2026-10-10" },
    { id: "POL-ATT-02", group: "Chấm công", name: "Phương thức hợp lệ", value: "QR, GPS, WFH", scope: "Toàn công ty", effectiveAt: "2026-11-01", version: 1, status: "scheduled", updatedAt: "2026-10-10" },
    { id: "POL-LEAVE-01", group: "Nghỉ phép", name: "Phép năm được cấp", value: "12", scope: "Toàn công ty", effectiveAt: "2026-01-01", version: 1, status: "active", updatedAt: "2025-12-20" },
    { id: "POL-SHIFT-01", group: "Ca làm việc", name: "Ca hành chính", value: "08:30–17:30 · nghỉ 60 phút", scope: "Toàn công ty", effectiveAt: "2026-01-01", version: 1, status: "active", updatedAt: "2025-12-20" },
    { id: "POL-APPROVAL-01", group: "Phê duyệt", name: "Tuyến duyệt nghỉ phép", value: "Team Lead → HR", scope: "Toàn công ty", effectiveAt: "2026-01-01", version: 1, status: "active", updatedAt: "2025-12-20" },
    { id: "POL-WFH-01", group: "WFH", name: "Báo cáo cuối ngày", value: "Bắt buộc trước 18:00", scope: "Toàn công ty", effectiveAt: "2026-10-01", version: 1, status: "active", updatedAt: "2026-09-20" },
    { id: "POL-WFH-QUOTA-01", group: "WFH", name: "Quỹ WFH tháng (ngày)", value: "4", scope: "Toàn công ty", effectiveAt: "2026-01-01", version: 1, status: "active", updatedAt: "2025-12-20" },
    { id: "POL-CONTRACT-01", group: "Hợp đồng", name: "Cảnh báo hết hạn", value: "30 ngày", scope: "Toàn công ty", effectiveAt: "2026-01-01", version: 1, status: "active", updatedAt: "2025-12-20" },
  ],
  requisitions: [
    { id: "REQ-2026-041", title: "Backend Engineer", department: "Công nghệ thông tin", branch: "HCM-TD", status: "open", createdAt: "2026-09-28", criteria: "TypeScript, Node.js, SQL; kinh nghiệm API và hệ thống sản phẩm" },
    { id: "REQ-2026-039", title: "Product Designer", department: "Sản phẩm", branch: "HCM-Q1", status: "open", createdAt: "2026-10-04", criteria: "Figma, nghiên cứu người dùng, thiết kế hệ thống" },
  ],
  candidates: [
    { id: "CV-001", name: "Nguyễn Văn An", email: "an@example.com", requisitionId: "REQ-2026-041", experience: "5 năm backend", skills: "TypeScript, Node.js, PostgreSQL", cvSummary: "Tóm tắt do HR nhập cho demo; chưa có tệp CV hoặc phân tích AI.", stage: "screening", note: "Cần xác minh dự án production trong phỏng vấn.", updatedAt: "2026-10-18" },
    { id: "CV-002", name: "Trần Minh Khoa", email: "khoa@example.com", requisitionId: "REQ-2026-041", experience: "4 năm backend", skills: "Java, Kafka, SQL", cvSummary: "Thông tin minh họa do HR nhập; chưa có tệp CV.", stage: "interview", note: "Đã đặt lịch phỏng vấn kỹ thuật bên ngoài demo.", updatedAt: "2026-10-19" },
    { id: "CV-003", name: "Mai Thu Trang", email: "trang@example.com", requisitionId: "REQ-2026-039", experience: "3 năm thiết kế sản phẩm", skills: "Figma, Design System, UX Research", cvSummary: "Thông tin minh họa do HR nhập; chưa có tệp CV.", stage: "new", note: "", updatedAt: "2026-10-20" },
  ],
};

function seedAttendance(): HrAttendance[] {
  const people = ["OH-0091", "OH-0184", "OH-0248", "OH-0259", "OH-0271", "OH-0266", "OH-0204", "OH-0218", "OH-0301", "OH-0302"];
  const rows: HrAttendance[] = [];
  for (let index = 1; index <= 50; index += 1) {
    const month = index <= 30 ? "09" : "10";
    const day = index <= 30 ? index : index - 30;
    const date = `2026-${month}-${String(day).padStart(2, "0")}`;
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    for (const employeeId of people) {
      if (employeeId === "OH-0218" && month === "09") continue; // Joined in October.
      if (employeeId === "OH-0301" && (month === "09" || month === "10" && day < 6)) continue;
      if (employeeId === "OH-0271" && month === "10" && day === 20) continue; // Approved leave in the shared request store.
      if (employeeId === "OH-0302" && month === "10" && day === 20) continue; // Approved WFH in the shared request store.
      const exception = month === "10" && day === 20 ? ({ "OH-0184": "missing-out", "OH-0218": "missing-in", "OH-0266": "late", "OH-0204": "outside-gps" } as Record<string, HrAttendance["issue"]>)[employeeId] : month === "09" && day === 30 && ["OH-0266", "OH-0248"].includes(employeeId) ? "missing-out" : month === "09" && day === 29 && employeeId === "OH-0248" ? "late" : undefined;
      const issue = exception ?? "none";
      const events: AttendanceEvent[] = issue === "missing-in" ? [{ kind: "check-out", at: "17:32", method: "QR" }] : [
        { kind: "check-in", at: issue === "late" ? "09:12" : "08:28", method: employeeId === "OH-0204" ? "GPS" : "QR", note: issue === "outside-gps" ? "Ngoài vùng cho phép · dữ liệu demo" : undefined },
        ...(issue === "missing-out" ? [] : [{ kind: "check-out" as const, at: "17:34", method: "QR" as const }]),
      ];
      rows.push({ id: `${employeeId}-${date}`, employeeId, date, shift: "Hành chính", plannedIn: "08:30", plannedOut: "17:30", events, issue, resolution: issue === "none" ? "approved" : "open" });
    }
  }
  return rows;
}

function seedShifts(): HrShiftAssignment[] {
  const people = ["OH-0248", "OH-0271", "OH-0218", "OH-0301", "OH-0302"];
  const rows: HrShiftAssignment[] = [];
  for (let day = 19; day <= 30; day += 1) {
    const date = `2026-10-${day}`;
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    for (const employeeId of people) rows.push({ id: `SHIFT-${employeeId}-${date}`, employeeId, date, shift: "Hành chính", plannedIn: "08:30", plannedOut: "17:30" });
  }
  return rows;
}

export const hrDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("vi-VN");
export const hrToday = () => demoBusinessDate();
export const hrContractEnd = (value: string | null) => value ? hrDate(value) : "Không xác định thời hạn";
export const effectivePolicyStatus = (policy: HrPolicy, today = hrToday(), allPolicies: HrPolicy[] = []): HrPolicy["status"] => {
  if (policy.status === "draft" || policy.status === "retired") return policy.status;
  if (policy.effectiveAt > today) return "scheduled";
  const newer = allPolicies.some((item) => item.id !== policy.id && item.group === policy.group && item.name === policy.name && item.status !== "draft" && item.status !== "retired" && item.effectiveAt <= today && (item.effectiveAt > policy.effectiveAt || (item.effectiveAt === policy.effectiveAt && item.version > policy.version)));
  return newer ? "retired" : "active";
};
