"use client";

import { ArrowLeft, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { scopeLabels } from "./mock-data";
import type { Account, AccountStatus, AccessTemplate, DataScope } from "./types";

export const statusLabels: Record<AccountStatus, string> = {
  active: "Đang hoạt động",
  locked: "Tạm khóa",
  pending: "Chưa kích hoạt",
  inactive: "Ngừng hoạt động",
};

export function StatusChip({ status }: { status: AccountStatus }) {
  return <span className={cn("iam-status", status)}><i />{statusLabels[status]}</span>;
}

export function Person({ account, compact = false }: { account: Account; compact?: boolean }) {
  return <span className="iam-person"><span className={cn("iam-avatar", compact && "compact")}>{account.initials}</span><span><strong>{account.name}</strong><small>{compact ? `${account.department} · ${account.employeeCode}` : account.email}</small></span></span>;
}

export function TemplateChip({ template }: { template: AccessTemplate }) {
  return <span className={cn("iam-template-chip", template.type)}>{template.name}</span>;
}

export function ScopeLabel({ scope }: { scope: DataScope }) {
  return <span>{scopeLabels[scope.type]}{scope.target ? ` · ${scope.target}` : ""}</span>;
}

export function BackButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button className="iam-back" onClick={onClick}><ArrowLeft size={15} />{children}</button>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="iam-empty"><span><ShieldCheck size={23} /></span><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function DeferredView({ title, description }: { title: string; description: string }) {
  return <section className="iam-deferred panel"><div className="iam-deferred-icon"><Clock3 size={24} /></div><span className="eyebrow">LỘ TRÌNH SẢN PHẨM</span><h2>Sắp phát triển: {title}</h2><p>{description}</p><div><CheckCircle2 size={16} /><span>Kiến trúc điều hướng đã sẵn sàng. Quy trình nghiệp vụ sẽ được bổ sung ở giai đoạn tiếp theo.</span></div></section>;
}

export function accessPath(id: string) {
  return `/admin/${id}`;
}
