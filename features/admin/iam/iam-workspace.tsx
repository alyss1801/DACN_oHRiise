"use client";

import { FileCheck2, KeyRound, ShieldCheck, UserRoundCog, UsersRound, UserRoundX } from "lucide-react";
import { cn } from "@/lib/utils";
import { AssignmentWorkspace } from "./assignment-workspace";
import { DelegationWorkspace } from "./delegation-workspace";
import { ReviewWorkspace } from "./review-workspace";
import { TemplateWorkspace } from "./template-workspace";
import { UserWorkspace } from "./user-workspace";
import { AccountTasksWorkspace } from "./account-tasks-workspace";

const tabs = [
  { id: "access/users", label: "Tài khoản", icon: UserRoundCog },
  { id: "access/account-tasks", label: "Tác vụ tài khoản", icon: UserRoundX },
  { id: "access/templates", label: "Vai trò & mẫu quyền", icon: ShieldCheck },
  { id: "access/assignments", label: "Phân quyền cá nhân", icon: UsersRound },
  { id: "access/reviews", label: "Rà soát truy cập", icon: FileCheck2 },
  { id: "access/delegation", label: "Ủy quyền tạm thời", icon: KeyRound },
];

export function IamWorkspace({ moduleId, onNavigate }: { moduleId: string; onNavigate: (id: string) => void }) {
  const section = moduleId.split("/")[1] ?? "users";
  return <div className="page-stack iam-page">
    <nav className="iam-tabs" aria-label="Điều hướng Người dùng và phân quyền">
      {tabs.map((tab) => { const Icon = tab.icon; const active = moduleId === tab.id || moduleId.startsWith(`${tab.id}/`); return <button key={tab.id} className={cn(active && "is-active")} onClick={() => onNavigate(tab.id)}><Icon size={16} /><span>{tab.label}</span></button>; })}
    </nav>
    {section === "users" && <UserWorkspace moduleId={moduleId} onNavigate={onNavigate} />}
    {section === "account-tasks" && <AccountTasksWorkspace key={moduleId} initialKind={moduleId.split("/")[2] === "offboarding" ? "offboarding" : "onboarding"} onNavigate={onNavigate} />}
    {section === "templates" && <TemplateWorkspace moduleId={moduleId} onNavigate={onNavigate} />}
    {section === "assignments" && <AssignmentWorkspace moduleId={moduleId} onNavigate={onNavigate} />}
    {section === "reviews" && <ReviewWorkspace moduleId={moduleId} onNavigate={onNavigate} />}
    {section === "delegation" && <DelegationWorkspace moduleId={moduleId} onNavigate={onNavigate} />}
  </div>;
}
