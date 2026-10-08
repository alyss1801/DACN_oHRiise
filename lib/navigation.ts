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
  IdCard,
  LayoutList,
  Network,
  MapPinned,
  MailWarning,
  Mail,
  LibraryBig,
  LogOut,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UserRoundCog,
  UsersRound,
  WalletCards,
  Repeat2,
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
      { id: "attendance", label: "Điểm danh", resource: "attendance", icon: Clock3 },
      { id: "schedule", label: "Lịch & Quỹ thời gian", resource: "attendance", icon: CalendarDays },
      { id: "approvals", label: "Phê duyệt", resource: "approvals", icon: FileCheck2, badge: "5" },
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
      { id: "team-calendar", label: "Lịch đội ngũ", resource: "team-calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Nhân sự",
    items: [
      { id: "employees", label: "Hồ sơ nhân sự", resource: "employees", icon: UsersRound },
      { id: "onboarding", label: "Onboarding", resource: "onboarding", icon: BriefcaseBusiness },
      { id: "hr-contracts", label: "Quản lý hợp đồng", resource: "hr-contracts", icon: FileText },
      { id: "organization", label: "Tổ chức", resource: "organization", icon: Network },
      { id: "offboarding", label: "Offboarding", resource: "offboarding", icon: LogOut },
      { id: "attendance-monitoring", label: "Giám sát chấm công", resource: "attendance-monitoring", icon: Clock3 },
      { id: "timesheets", label: "Bảng công", resource: "timesheets", icon: LayoutList },
      { id: "expense-review", label: "Duyệt chi phí", resource: "expense-review", icon: ReceiptText },
      { id: "reports", label: "Báo cáo", resource: "reports", icon: Gauge },
      { id: "misa-sync", label: "Đồng bộ MISA", resource: "misa-sync", icon: CircleDollarSign },
    ],
  },
  {
    label: "Không gian AI",
    items: [
      { id: "ai-cv", label: "AI CV Intelligence", resource: "ai-cv", icon: Bot },
      {
        id: "ai-wfh",
        label: "AI WFH",
        resource: "ai-wfh",
        icon: Sparkles,
        badge: "1",
        children: [
          { id: "ai-wfh-overview", label: "Tổng quan WFH" },
          { id: "ai-wfh-session", label: "Phiên làm việc của tôi", badge: "1" },
          { id: "ai-wfh-history", label: "Lịch sử & đánh giá AI" },
        ],
      },
    ],
  },
  {
    label: "Quản trị hệ thống",
    items: [
      { id: "admin-overview", label: "Tình trạng hệ thống", resource: "admin-overview", icon: Gauge },
      { id: "branches-gps", label: "Chi nhánh & GPS", resource: "branches-gps", icon: MapPinned },
      { id: "accounts", label: "Tài khoản", resource: "accounts", icon: UserRoundCog },
      { id: "permissions", label: "Quyền & phạm vi", resource: "permissions", icon: ShieldCheck, badge: "2" },
      { id: "access-reviews", label: "Rà soát truy cập", resource: "access-reviews", icon: FileCheck2, badge: "2" },
      { id: "delegation", label: "Ủy quyền tạm thời", resource: "delegation", icon: Repeat2 },
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

export function navigationFor(session: EffectiveSession) {
  return registry
    .map((group) => ({ ...group, items: group.items.filter((item) => can(session, item.resource)) }))
    .filter((group) => group.items.length > 0);
}
