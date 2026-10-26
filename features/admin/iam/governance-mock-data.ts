import type { AccessReview, TemporaryDelegation } from "./types";

// Separate, in-memory demonstration data. No server authorization is implied.
export const initialAccessReviews: AccessReview[] = [
  {
    id: "review-q4-hcm", title: "Rà soát quyền quý IV · HCM-Q1", reviewerId: "user-1",
    branch: "HCM-Q1", department: "", dueDate: "2026-10-30", createdAt: "2026-10-14", status: "open",
    items: [
      { id: "r1", accountId: "user-2", templateId: "tpl-team-lead" },
      { id: "r2", accountId: "user-3", templateId: "tpl-employee" },
      { id: "r3", accountId: "user-6", templateId: "tpl-hr-branch" },
    ],
  },
  {
    id: "review-hr", title: "Chứng nhận quyền nhân sự", reviewerId: "user-1",
    branch: "", department: "Nhân sự", dueDate: "2026-10-24", createdAt: "2026-10-10", status: "open",
    items: [
      { id: "r5", accountId: "user-6", templateId: "tpl-hr-branch", decision: "keep" },
      { id: "r6", accountId: "user-9", templateId: "tpl-employee" },
    ],
  },
  {
    id: "review-q3", title: "Rà soát quyền quý III · HN-CG", reviewerId: "user-1",
    branch: "HN-CG", department: "", dueDate: "2026-09-30", createdAt: "2026-09-03", status: "completed",
    items: [
      { id: "r8", accountId: "user-7", templateId: "tpl-employee", decision: "keep" },
      { id: "r9", accountId: "user-8", templateId: "tpl-employee", decision: "revoke", note: "Offboarding; cần xác minh trước khi thu hồi." },
    ],
  },
];

export const initialTemporaryDelegations: TemporaryDelegation[] = [
  { id: "delegation-1", fromId: "user-2", toId: "user-3", permissionCode: "leave.approve", scope: { type: "team", target: "Sản phẩm" }, startsAt: "2026-10-16", endsAt: "2026-10-26", reason: "Thay mặt duyệt nghỉ phép trong thời gian công tác.", approverId: "user-1", status: "approved", createdAt: "2026-10-14", decidedAt: "2026-10-15" },
  { id: "delegation-2", fromId: "user-1", toId: "user-6", permissionCode: "employee.read", scope: { type: "branch", target: "HCM-Q1" }, startsAt: "2026-10-21", endsAt: "2026-10-28", reason: "Hỗ trợ rà soát hồ sơ nhân sự chi nhánh.", approverId: "user-2", status: "pending", createdAt: "2026-10-17" },
  { id: "delegation-3", fromId: "user-4", toId: "user-5", permissionCode: "reports.view", scope: { type: "team", target: "Data Platform" }, startsAt: "2026-09-21", endsAt: "2026-09-29", reason: "Bàn giao báo cáo tháng 9.", approverId: "user-1", status: "approved", createdAt: "2026-09-19", decidedAt: "2026-09-20" },
];
