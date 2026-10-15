"use client";

import { FileCheck2, KeyRound, ShieldCheck, UserRoundCog, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { AssignmentWorkspace } from "./assignment-workspace";
import { DeferredView } from "./iam-ui";
import { TemplateWorkspace } from "./template-workspace";
import { UserWorkspace } from "./user-workspace";

const tabs = [
  { id: "access/users", label: "Tài khoản", icon: UserRoundCog },
  { id: "access/templates", label: "Vai trò & mẫu quyền", icon: ShieldCheck },
  { id: "access/assignments", label: "Phân quyền cá nhân", icon: UsersRound },
  { id: "access/reviews", label: "Rà soát truy cập", icon: FileCheck2 },
  { id: "access/delegation", label: "Ủy quyền tạm thời", icon: KeyRound },
];

export function IamWorkspace({ moduleId, onNavigate }: { moduleId: string; onNavigate: (id: string) => void }) {
  const section = moduleId.split("/")[1] ?? "users";
  return <div className="page-stack iam-page">
    <header className="iam-hero">
      <div><span className="eyebrow">IDENTITY & ACCESS MANAGEMENT</span><h2>Người dùng & phân quyền</h2><p>Quản lý định danh, mẫu quyền, quyền cá nhân và phạm vi dữ liệu trong một không gian thống nhất.</p></div>
      <div className="iam-guardrail"><ShieldCheck size={17} /><span>Kiểm tra quyền tại giao diện chỉ hỗ trợ trải nghiệm; backend vẫn phải thực thi ủy quyền độc lập.</span></div>
    </header>
    <nav className="iam-tabs" aria-label="Điều hướng Người dùng và phân quyền">
      {tabs.map((tab) => { const Icon = tab.icon; const active = moduleId === tab.id || moduleId.startsWith(`${tab.id}/`); return <button key={tab.id} className={cn(active && "is-active")} onClick={() => onNavigate(tab.id)}><Icon size={16} /><span>{tab.label}</span></button>; })}
    </nav>
    {section === "users" && <UserWorkspace moduleId={moduleId} onNavigate={onNavigate} />}
    {section === "templates" && <TemplateWorkspace moduleId={moduleId} onNavigate={onNavigate} />}
    {section === "assignments" && <AssignmentWorkspace moduleId={moduleId} onNavigate={onNavigate} />}
    {section === "reviews" && <DeferredView title="Rà soát truy cập" description="Chu kỳ rà soát, chứng nhận quyền và nhắc việc cho quản lý sẽ được triển khai sau." />}
    {section === "delegation" && <DeferredView title="Ủy quyền tạm thời" description="Ủy quyền có thời hạn, quy trình phê duyệt và thu hồi tự động sẽ được triển khai sau." />}
  </div>;
}
