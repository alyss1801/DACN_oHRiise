"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type BusinessRequestType = "WFH" | "Nghỉ phép" | "Chi phí" | "Điều chỉnh chấm công" | "Đăng ký OT" | "Đổi ca";
export type BusinessRequestStatus = "pending" | "approved" | "rejected" | "hr-review";
export type WfhReportStatus = "not-required" | "draft" | "required" | "submitted";

export type BusinessRequest = {
  id: string;
  type: BusinessRequestType;
  employee: string;
  initials: string;
  submitted: string;
  detail: string;
  date: string;
  status: BusinessRequestStatus;
  note?: string;
};

export type DemoAccount = {
  id: string;
  initials: string;
  name: string;
  email: string;
  department: string;
  branch: string;
  template: string;
  status: "active" | "inactive";
  mfa: boolean;
  lastLogin: string;
};

export type AccessReview = {
  id: string;
  title: string;
  accountId: string;
  account: string;
  requester: string;
  time: string;
  risk: "Cao" | "Trung bình";
  reason: string;
  current: string;
  proposed: string;
  status: "pending" | "approved" | "rejected";
};

export type AuditEvent = {
  id: string;
  time: string;
  date: string;
  actor: string;
  action: string;
  target: string;
  result: "success" | "reviewed" | "pending" | "blocked" | "rejected";
  source: string;
  detail: string;
};

const initialRequests: BusinessRequest[] = [
  { id: "WFH-2026-092", type: "WFH", employee: "Nguyễn Thu Hà", initials: "NH", submitted: "02/10/2026", detail: "Cả ngày · Tập trung hoàn thiện design system", date: "02/10/2026", status: "approved" },
  { id: "WFH-2026-087", type: "WFH", employee: "Nguyễn Thu Hà", initials: "NH", submitted: "25/09/2026", detail: "Cả ngày · Làm việc tại nhà theo lịch nhóm", date: "25/09/2026", status: "approved" },
  { id: "WFH-2026-104", type: "WFH", employee: "Bùi Thanh Tâm", initials: "BT", submitted: "12 phút trước", detail: "Hoàn thiện ETL mapping và review PR #184", date: "09/10/2026", status: "pending" },
  { id: "LV-2026-191", type: "Nghỉ phép", employee: "Lê Hoàng Vy", initials: "LV", submitted: "42 phút trước", detail: "Nghỉ phép năm · 1 ngày", date: "15/10/2026", status: "pending" },
  { id: "EXP-2610-045", type: "Chi phí", employee: "Trần Minh Khoa", initials: "TK", submitted: "Hôm qua", detail: "JetBrains All Products Pack · 4.850.000 ₫", date: "06/10/2026", status: "pending" },
  { id: "ATT-2026-088", type: "Điều chỉnh chấm công", employee: "Võ Thu Linh", initials: "TL", submitted: "Hôm qua", detail: "Thiếu check-out ngày 05/10 · có ảnh xác nhận", date: "05/10/2026", status: "pending" },
  { id: "OT-2026-041", type: "Đăng ký OT", employee: "Nguyễn Thu Hà", initials: "NH", submitted: "Hôm qua", detail: "2 giờ · Hoàn thiện bàn giao design system", date: "08/10/2026", status: "pending" },
];

const initialAccounts: DemoAccount[] = [
  { id: "OH-0091", initials: "NL", name: "Nguyễn Thanh Lan", email: "lan.nguyen@ohriise.vn", department: "Nhân sự", branch: "HCM-Q1", template: "HR Tổng", status: "active", mfa: true, lastLogin: "07/10 · 10:31" },
  { id: "OH-0184", initials: "TQ", name: "Trần Minh Quân", email: "quan.tran@ohriise.vn", department: "Sản phẩm", branch: "HCM-Q1", template: "Employee", status: "active", mfa: true, lastLogin: "07/10 · 09:52" },
  { id: "OH-0248", initials: "NH", name: "Nguyễn Thu Hà", email: "ha.nguyen@ohriise.vn", department: "Sản phẩm", branch: "HCM-Q1", template: "Employee", status: "active", mfa: false, lastLogin: "07/10 · 08:37" },
  { id: "OH-0259", initials: "BT", name: "Bùi Thanh Tâm", email: "tam.bui@ohriise.vn", department: "Công nghệ thông tin", branch: "HCM-TD", template: "Employee + Team Lead", status: "active", mfa: true, lastLogin: "07/10 · 08:24" },
  { id: "OH-0137", initials: "PL", name: "Phạm Thanh Long", email: "long.pham@ohriise.vn", department: "Kinh doanh", branch: "HN-CG", template: "Employee", status: "inactive", mfa: false, lastLogin: "29/09 · 17:18" },
];

const initialReviews: AccessReview[] = [
  { id: "AR-2026-018", title: "Cấp quyền export payroll", accountId: "OH-0091", account: "Nguyễn Thanh Lan · HR Tổng", requester: "Admin A · Lê Hải Nam", time: "07/10 · 09:41", risk: "Cao", reason: "Đối soát báo cáo chi phí lương quý III.", current: "view · masked", proposed: "view + export · visible", status: "pending" },
  { id: "AR-2026-017", title: "Bật đồng bộ MISA", accountId: "OH-0248", account: "Nguyễn Thu Hà · Employee", requester: "Admin A · Lê Hải Nam", time: "06/10 · 16:22", risk: "Cao", reason: "Hỗ trợ xử lý dữ liệu chốt công có thời hạn.", current: "no access", proposed: "view + configure · company", status: "pending" },
];

const initialAudit: AuditEvent[] = [
  { id: "AUD-1042", time: "10:42:18", date: "07/10/2026", actor: "Admin B · Mai Anh", action: "APPROVE_SENSITIVE_PERMISSION", target: "AR-2026-016", result: "success", source: "10.20.14.8", detail: "Phê duyệt sau khi đối chiếu lý do và phạm vi." },
  { id: "AUD-1031", time: "10:31:04", date: "07/10/2026", actor: "Nguyễn Thanh Lan", action: "EXPORT_EMPLOYEE_LIST", target: "HCM-Q1 · 126 records", result: "success", source: "10.20.8.42", detail: "Xuất danh sách trong phạm vi chi nhánh được cấp." },
  { id: "AUD-0948", time: "09:48:29", date: "07/10/2026", actor: "Admin A · Lê Hải Nam", action: "READ_PROTECTED_MAILBOX", target: "payroll@ohriise.vn", result: "reviewed", source: "10.20.14.7", detail: "Truy cập có lý do và đã được ghi nhận." },
  { id: "AUD-0941", time: "09:41:12", date: "07/10/2026", actor: "Admin A · Lê Hải Nam", action: "REQUEST_PERMISSION_CHANGE", target: "AR-2026-018", result: "pending", source: "10.20.14.7", detail: "Yêu cầu quyền nhạy cảm đang chờ Admin thứ hai." },
  { id: "AUD-0857", time: "08:57:31", date: "07/10/2026", actor: "Unknown", action: "LOGIN_FAILED", target: "admin@ohriise.vn", result: "blocked", source: "103.92.24.18", detail: "Chặn sau nhiều lần đăng nhập sai và phát cảnh báo." },
];

type NewBusinessRequest = Omit<BusinessRequest, "id" | "submitted" | "status"> & { idPrefix: string };

type DemoDataContextValue = {
  wfhReportStatus: WfhReportStatus;
  setWfhReportStatus: (status: WfhReportStatus) => void;
  requests: BusinessRequest[];
  addBusinessRequest: (request: NewBusinessRequest) => string;
  updateBusinessRequest: (id: string, patch: Pick<BusinessRequest, "date" | "detail">) => void;
  cancelBusinessRequest: (id: string) => void;
  decideBusinessRequest: (id: string, status: "approved" | "rejected", note?: string) => void;
  accounts: DemoAccount[];
  selectedAccount: DemoAccount;
  selectAccount: (id: string) => void;
  addAccount: (account: Omit<DemoAccount, "id" | "initials" | "lastLogin">) => void;
  updateAccount: (id: string, patch: Partial<DemoAccount>) => void;
  bulkUpdateAccounts: (ids: string[], patch: Partial<DemoAccount>) => void;
  accessReviews: AccessReview[];
  requestAccessChange: (input: Omit<AccessReview, "id" | "time" | "status">) => string;
  decideAccessReview: (id: string, status: "approved" | "rejected", reviewer: string) => void;
  auditEvents: AuditEvent[];
  addAuditEvent: (event: Omit<AuditEvent, "id" | "time" | "date">) => void;
};

const DemoDataContext = createContext<DemoDataContextValue | null>(null);

export function DemoDataProvider({ children }: { children: React.ReactNode }) {
  const [wfhReportStatus, setWfhReportStatus] = useState<WfhReportStatus>("required");
  const [requests, setRequests] = useState(initialRequests);
  const [accounts, setAccounts] = useState(initialAccounts);
  const [selectedAccountId, setSelectedAccountId] = useState(initialAccounts[0].id);
  const [accessReviews, setAccessReviews] = useState(initialReviews);
  const [auditEvents, setAuditEvents] = useState(initialAudit);

  function addAuditEvent(event: Omit<AuditEvent, "id" | "time" | "date">) {
    const now = new Date();
    setAuditEvents((current) => [{
      ...event,
      id: `AUD-${Date.now()}`,
      time: new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(now),
      date: new Intl.DateTimeFormat("vi-VN").format(now),
    }, ...current]);
  }

  function addBusinessRequest(request: NewBusinessRequest) {
    const id = `${request.idPrefix}-${String(Date.now()).slice(-6)}`;
    setRequests((current) => [{ ...request, id, submitted: "Vừa xong", status: "pending" }, ...current]);
    return id;
  }

  function updateBusinessRequest(id: string, patch: Pick<BusinessRequest, "date" | "detail">) {
    setRequests((current) => current.map((request) => request.id === id && request.status === "pending" ? { ...request, ...patch } : request));
  }

  function cancelBusinessRequest(id: string) {
    setRequests((current) => current.filter((request) => request.id !== id || request.status !== "pending"));
  }

  function decideBusinessRequest(id: string, status: "approved" | "rejected", note?: string) {
    setRequests((current) => current.map((request) => request.id === id ? { ...request, status, note } : request));
    addAuditEvent({ actor: "Trần Minh Quân · Team Lead", action: status === "approved" ? "APPROVE_REQUEST" : "REJECT_REQUEST", target: id, result: status === "approved" ? "success" : "rejected", source: "Demo session", detail: note || "Quyết định được ghi nhận từ Approval Inbox." });
  }

  function updateAccount(id: string, patch: Partial<DemoAccount>) {
    setAccounts((current) => current.map((account) => account.id === id ? { ...account, ...patch } : account));
  }

  function addAccount(account: Omit<DemoAccount, "id" | "initials" | "lastLogin">) {
    const words = account.name.trim().split(/\s+/);
    const initials = `${words.at(-2)?.[0] ?? ""}${words.at(-1)?.[0] ?? ""}`.toUpperCase();
    const created: DemoAccount = { ...account, id: `OH-${String(300 + accounts.length).padStart(4, "0")}`, initials, lastLogin: "Chưa đăng nhập" };
    setAccounts((current) => [created, ...current]);
    setSelectedAccountId(created.id);
    addAuditEvent({ actor: "Admin A · Lê Hải Nam", action: "CREATE_ACCOUNT", target: created.id, result: "success", source: "Demo session", detail: `Tạo tài khoản ${created.email}.` });
  }

  function bulkUpdateAccounts(ids: string[], patch: Partial<DemoAccount>) {
    setAccounts((current) => current.map((account) => ids.includes(account.id) ? { ...account, ...patch } : account));
  }

  function requestAccessChange(input: Omit<AccessReview, "id" | "time" | "status">) {
    const id = `AR-2026-${String(19 + accessReviews.length).padStart(3, "0")}`;
    const review: AccessReview = { ...input, id, time: "Vừa xong", status: "pending" };
    setAccessReviews((current) => [review, ...current]);
    addAuditEvent({ actor: input.requester, action: "REQUEST_PERMISSION_CHANGE", target: id, result: "pending", source: "Demo session", detail: input.reason });
    return id;
  }

  function decideAccessReview(id: string, status: "approved" | "rejected", reviewer: string) {
    const review = accessReviews.find((item) => item.id === id);
    if (!review) return;
    setAccessReviews((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    if (status === "approved") {
      const template = review.proposed.match(/Template: ([^·]+)/)?.[1]?.trim();
      if (template) updateAccount(review.accountId, { template });
    }
    addAuditEvent({ actor: reviewer, action: status === "approved" ? "APPROVE_SENSITIVE_PERMISSION" : "REJECT_SENSITIVE_PERMISSION", target: id, result: status === "approved" ? "success" : "rejected", source: "Demo session", detail: `${review.proposed}. Lý do gốc: ${review.reason}` });
  }

  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) ?? accounts[0];
  const value = useMemo<DemoDataContextValue>(() => ({
    wfhReportStatus,
    setWfhReportStatus,
    requests,
    addBusinessRequest,
    updateBusinessRequest,
    cancelBusinessRequest,
    decideBusinessRequest,
    accounts,
    selectedAccount,
    selectAccount: setSelectedAccountId,
    addAccount,
    updateAccount,
    bulkUpdateAccounts,
    accessReviews,
    requestAccessChange,
    decideAccessReview,
    auditEvents,
    addAuditEvent,
  // Functions intentionally close over the latest demo state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [wfhReportStatus, requests, accounts, selectedAccount, accessReviews, auditEvents]);

  return <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>;
}

export function useDemoData() {
  const context = useContext(DemoDataContext);
  if (!context) throw new Error("useDemoData must be used inside DemoDataProvider");
  return context;
}
