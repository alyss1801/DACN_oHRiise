import type { AccessReview, TemporaryDelegation } from "./types";

// Separate, in-memory demonstration data. No server authorization is implied.
export const initialAccessReviews: AccessReview[] = [
  {
    id: "review-q4-hcm", title: "Rà soát quyền quý IV · TP.HCM", reviewerId: "user-8",
    branch: "TP.HCM", department: "", dueDate: "2026-10-30", createdAt: "2026-10-14", status: "open",
    items: [
      { id: "r1", accountId: "user-1", templateId: "tpl-team-lead" },
      { id: "r2", accountId: "user-4", templateId: "tpl-employee" },
      { id: "r3", accountId: "user-10", templateId: "tpl-project-reviewer" },
      { id: "r4", accountId: "user-13", templateId: "tpl-employee" },
    ],
  },
  {
    id: "review-hr", title: "Chứng nhận quyền nhân sự", reviewerId: "user-2",
    branch: "", department: "Human Resources", dueDate: "2026-10-24", createdAt: "2026-10-10", status: "open",
    items: [
      { id: "r5", accountId: "user-2", templateId: "tpl-hr-branch", decision: "keep" },
      { id: "r6", accountId: "user-9", templateId: "tpl-system-admin" },
      { id: "r7", accountId: "user-16", templateId: "tpl-employee" },
    ],
  },
  {
    id: "review-q3", title: "Rà soát quyền quý III · Hà Nội", reviewerId: "user-8",
    branch: "Hà Nội", department: "", dueDate: "2026-09-30", createdAt: "2026-09-03", status: "completed",
    items: [
      { id: "r8", accountId: "user-2", templateId: "tpl-employee", decision: "keep" },
      { id: "r9", accountId: "user-5", templateId: "tpl-employee", decision: "revoke", note: "Chuyển bộ phận, cần xác minh trước khi thu hồi." },
    ],
  },
];

export const initialTemporaryDelegations: TemporaryDelegation[] = [
  { id: "delegation-1", fromId: "user-1", toId: "user-3", permissionCode: "leave.approve", scope: { type: "team", target: "Engineering A" }, startsAt: "2026-10-16", endsAt: "2026-10-26", reason: "Thay mặt duyệt nghỉ phép trong thời gian công tác.", approverId: "user-8", status: "approved", createdAt: "2026-10-14", decidedAt: "2026-10-15" },
  { id: "delegation-2", fromId: "user-2", toId: "user-3", permissionCode: "employee.read", scope: { type: "branch", target: "Hà Nội" }, startsAt: "2026-10-21", endsAt: "2026-10-28", reason: "Hỗ trợ rà soát hồ sơ nhân sự chi nhánh.", approverId: "user-8", status: "pending", createdAt: "2026-10-17" },
  { id: "delegation-3", fromId: "user-1", toId: "user-3", permissionCode: "reports.view", scope: { type: "team", target: "Engineering A" }, startsAt: "2026-09-21", endsAt: "2026-09-29", reason: "Bàn giao báo cáo tháng 9.", approverId: "user-8", status: "approved", createdAt: "2026-09-19", decidedAt: "2026-09-20" },
  { id: "delegation-4", fromId: "user-8", toId: "user-10", permissionCode: "reports.view", scope: { type: "department", target: "Finance" }, startsAt: "2026-10-12", endsAt: "2026-10-22", reason: "Hỗ trợ tổng hợp báo cáo tài chính.", approverId: "user-9", status: "revoked", createdAt: "2026-10-10", decidedAt: "2026-10-15" },
];
