import {
  Bell,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FileText,
  Gauge,
  Goal,
  Home,
  HeartPulse,
  IdCard,
  LayoutList,
  Laptop2,
  Network,
  MapPinned,
  MailWarning,
  Mail,
  LibraryBig,
  LogOut,
  ReceiptText,
  UserRoundCog,
  UsersRound,
  WalletCards,
  Send,
  type LucideIcon,
} from "lucide-react";
import type { EffectiveSession } from "./authorization/types";
import { can } from "./authorization/engine";

export type NavItem = {
  id: string;
  label: string;
  resource: string;
  icon: LucideIcon;
  badge?: string;
  children?: NavSubItem[];
};

export type NavSubItem = {
  id: string;
  label: string;
  badge?: string;
};

export type NavGroup = { label: string; items: NavItem[] };

const registry: NavGroup[] = [
  {
    label: "Cá nhân",
    items: [
      { id: "home", label: "Tổng quan", resource: "home", icon: Home },
      { id: "profile", label: "Hồ sơ của tôi", resource: "profile", icon: IdCard },
      { id: "attendance", label: "Chấm công", resource: "attendance", icon: Clock3 },
      { id: "schedule", label: "Lịch & Quỹ thời gian", resource: "attendance", icon: CalendarDays },
      { id: "approvals", label: "Yêu cầu & phê duyệt", resource: "approvals", icon: FileCheck2 },
    ],
  },
  {
    label: "Công việc",
    items: [
      { id: "email", label: "Email", resource: "email", icon: Mail, badge: "2" },
      { id: "performance", label: "Đánh giá hiệu suất", resource: "performance", icon: Goal },
      { id: "contracts", label: "Hợp đồng", resource: "contracts", icon: FileText },
      { id: "payslip", label: "Phiếu lương", resource: "payslip", icon: WalletCards },
      { id: "offboarding-status", label: "Trạng thái nghỉ việc", resource: "offboarding-status", icon: LogOut },
    ],
  },
  {
    label: "Đội ngũ",
    items: [
      { id: "team", label: "Tổng quan đội ngũ", resource: "team", icon: UsersRound },
      { id: "team-probation", label: "Đánh giá thử việc", resource: "probation", icon: FileCheck2 },
      { id: "team-calendar", label: "Lịch đội ngũ", resource: "team-calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Nhân sự",
    items: [
      { id: "hr-command", label: "Trung tâm HR", resource: "hr-command", icon: HeartPulse },
      { id: "employees", label: "Hồ sơ nhân sự", resource: "employees", icon: UsersRound },
      { id: "onboarding", label: "Onboarding", resource: "onboarding", icon: BriefcaseBusiness },
      { id: "hr-probation", label: "Thử việc", resource: "probation", icon: FileCheck2 },
      { id: "hr-contracts", label: "Quản lý hợp đồng", resource: "hr-contracts", icon: FileText },
      { id: "organization", label: "Tổ chức", resource: "organization", icon: Network },
      { id: "offboarding", label: "Offboarding", resource: "offboarding", icon: LogOut },
      { id: "hr-assets", label: "Tài sản nhân sự", resource: "hr-assets", icon: Laptop2 },
      { id: "attendance-monitoring", label: "Giám sát chấm công", resource: "attendance-monitoring", icon: Clock3 },
      { id: "hr-leave", label: "Quản lý nghỉ phép", resource: "hr-leave", icon: CalendarDays },
      { id: "timesheets", label: "Bảng công", resource: "timesheets", icon: LayoutList },
      { id: "expense-review", label: "Duyệt chi phí", resource: "expense-review", icon: ReceiptText },
      { id: "reports", label: "Báo cáo", resource: "reports", icon: Gauge },
      { id: "misa-sync", label: "CSV công nội bộ", resource: "misa-sync", icon: CircleDollarSign },
      { id: "hr-policies", label: "Chính sách HR", resource: "hr-policies", icon: LibraryBig },
    ],
  },
  {
    label: "Làm việc từ xa",
    items: [
      { id: "ai-cv", label: "AI CV Intelligence", resource: "ai-cv", icon: Bot },
      {
        id: "ai-wfh",
        label: "WFH & báo cáo ngày",
        resource: "ai-wfh",
        icon: Laptop2,
        children: [
          { id: "ai-wfh-overview", label: "Đơn & phiên WFH" },
          { id: "ai-wfh-session", label: "Phiên làm việc của tôi" },
          { id: "ai-wfh-history", label: "Lịch sử báo cáo" },
        ],
      },
    ],
  },
  {
    label: "Quản trị hệ thống",
    items: [
      { id: "admin-overview", label: "Tình trạng hệ thống", resource: "admin-overview", icon: Gauge },
      { id: "branches-gps", label: "Chi nhánh & GPS", resource: "branches-gps", icon: MapPinned },
      { id: "access/users", label: "Người dùng & phân quyền", resource: "accounts", icon: UserRoundCog },
      { id: "catalogs", label: "Danh mục hệ thống", resource: "catalogs", icon: LibraryBig },
      { id: "email-dlp", label: "Email & DLP", resource: "email-dlp", icon: MailWarning },
      { id: "notification-config", label: "Hạ tầng thông báo", resource: "notification-config", icon: Send },
      { id: "integrations", label: "Tích hợp", resource: "integrations", icon: Building2 },
      { id: "audit", label: "Nhật ký & cảnh báo", resource: "audit", icon: FileCheck2 },
      { id: "ai-governance", label: "Quản trị AI", resource: "ai-governance", icon: Bot },
    ],
  },
  {
    label: "Cập nhật",
    items: [{ id: "notifications", label: "Thông báo", resource: "notifications", icon: Bell, badge: "3" }],
  },
];

// Optional showcase modules remain in the repository, but are not part of the
// active HRM demo until their data and workflows are connected to the core model.
export const deferredModules = new Set(["performance", "payslip", "expense-review", "ai-cv", "email-dlp", "notification-config", "catalogs"]);

export function isDeferredModule(id: string) {
  return deferredModules.has(id);
}

export function navigationFor(session: EffectiveSession) {
  return registry
    .map((group) => ({ ...group, items: group.items.filter((item) => !isDeferredModule(item.id) && can(session, item.resource) && (item.id !== "team-probation" || ["team-lead", "product-lead"].includes(session.id)) && (item.id !== "hr-probation" || ["hr-total", "hr-branch"].includes(session.id))).map((item) => item.id === "notifications" ? { ...item, badge: undefined } : item) }))
    .filter((group) => group.items.length > 0);
}
