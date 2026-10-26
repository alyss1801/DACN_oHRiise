import { buildEffectiveSession } from "./engine";
import type { Action, EffectiveSession, PermissionGrant, PersonaId, ScopeType } from "./types";

export type AdminAccessProfile = {
  employeeId: string;
  status: "active" | "locked" | "pending" | "inactive";
  scope: ScopeType;
  target?: string;
  branch: string;
  department: string;
  allowedCodes: string[];
};

const moduleCodes: Record<string, string> = {
  team: "team.manage", "team-calendar": "team.manage", probation: "hr.probation.manage",
  "hr-command": "hr.command.view", employees: "hr.employee.manage", onboarding: "hr.onboarding.manage",
  "hr-contracts": "hr.contract.manage", organization: "hr.organization.manage", offboarding: "hr.offboarding.manage",
  "hr-assets": "hr.assets.manage", "attendance-monitoring": "hr.attendance.manage", "hr-leave": "hr.leave.manage",
  timesheets: "hr.timesheets.manage", "expense-review": "hr.expense.approve", "misa-sync": "hr.misa.configure",
  "hr-policies": "hr.policies.manage", "ai-cv": "hr.recruitment.manage", reports: "reports.view",
  "admin-overview": "admin.accounts.manage", accounts: "admin.accounts.manage", permissions: "admin.permissions.assign",
  "access-reviews": "admin.permissions.assign", delegation: "admin.permissions.assign", "branches-gps": "admin.system.configure",
  catalogs: "admin.system.configure", "email-dlp": "admin.system.configure", "notification-config": "admin.system.configure",
  audit: "admin.system.configure", "ai-governance": "admin.system.configure", integrations: "integration.configure",
};

function requiredCode(id: PersonaId, grant: PermissionGrant, action: Action): string | null {
  if (grant.source === "base") return null;
  if (grant.resource === "notifications" && action === "create") return id === "team-lead" ? "announcement.post.team" : "announcement.post.company";
  if (grant.resource === "approvals" && action === "approve") return "leave.approve";
  if (grant.resource === "ai-wfh" && action === "edit") return "team.manage";
  if (grant.resource === "probation" && id === "team-lead") return "team.manage";
  if (grant.resource === "reports" && action === "export") return "reports.export";
  return moduleCodes[grant.resource] ?? null;
}

export function applyAdminAccess(base: EffectiveSession, profile?: AdminAccessProfile): EffectiveSession {
  if (!profile) return base;
  const allowed = new Set(profile.status === "active" ? profile.allowedCodes : []);
  const grants = base.grants.flatMap((grant) => {
    const actions = grant.actions.filter((action) => { const code = requiredCode(base.id, grant, action); return code === null || allowed.has(code); });
    return actions.length ? [{ ...grant, actions, scope: grant.source === "base" ? grant.scope : profile.scope }] : [];
  });
  return buildEffectiveSession({ ...base, branch: profile.scope === "branch" ? profile.target ?? profile.branch : profile.branch, department: profile.scope === "department" ? profile.target ?? profile.department : profile.department, grants, scopeConstraints: [profile.scope], scopeTarget: profile.target });
}
