import { buildEffectiveSession } from "./engine";
import type { PermissionGrant, PersonaDefinition, PersonaId } from "./types";

const grant = (
  resource: string,
  actions: PermissionGrant["actions"],
  scope: PermissionGrant["scope"],
  source: PermissionGrant["source"],
  expiresAt?: string,
): PermissionGrant => ({ resource, actions, scope, source, expiresAt });

const baseEmployee: PermissionGrant[] = [
  grant("home", ["view"], "self", "base"),
  grant("profile", ["view", "edit"], "self", "base"),
  grant("attendance", ["view", "create"], "self", "base"),
  grant("approvals", ["view", "create"], "self", "base"),
  grant("leave", ["view", "create", "edit"], "self", "base"),
  grant("expenses", ["view", "create", "edit"], "self", "base"),
  grant("email", ["view", "create", "edit"], "self", "base"),
  grant("payslip", ["view"], "self", "base"),
  grant("contracts", ["view"], "self", "base"),
  grant("offboarding-status", ["view", "create"], "self", "base"),
  grant("notifications", ["view"], "self", "base"),
  grant("performance", ["view"], "self", "base"),
];

const commonFields = [
  { field: "phone", visibility: "visible" as const },
  { field: "address", visibility: "masked" as const },
  { field: "bankAccount", visibility: "masked" as const },
  { field: "salary", visibility: "hidden" as const },
  { field: "citizenId", visibility: "masked" as const },
];

const definitions: PersonaDefinition[] = [
  {
    id: "employee",
    label: "Nhân viên",
    shortLabel: "NV",
    role: "Product Designer",
    description: "Công việc cá nhân",
    branch: "HCM-Q1",
    department: "Sản phẩm",
    grants: [...baseEmployee, grant("ai-wfh", ["view"], "self", "base"), grant("organization", ["view"], "self", "base")],
    scopeConstraints: ["self"],
    sensitiveFields: commonFields,
  },
  {
    id: "team-lead",
    label: "Team Lead",
    shortLabel: "TL",
    role: "Head of Product",
    description: "Đội ngũ được giao",
    branch: "HCM-Q1",
    department: "Sản phẩm",
    grants: [
      ...baseEmployee,
      grant("team", ["view"], "team", "relationship"),
      grant("probation", ["view", "edit"], "team", "relationship"),
      grant("organization", ["view"], "team", "relationship"),
      grant("approvals", ["view", "approve"], "team", "relationship"),
      grant("team-calendar", ["view"], "team", "relationship"),
      grant("notifications", ["create"], "team", "relationship"),
      grant("ai-wfh", ["view", "edit"], "team", "relationship"),
      grant("expenses.review", ["view", "approve"], "team", "delegation", "2026-10-16"),
    ],
    scopeConstraints: ["team", "branch"],
    sensitiveFields: commonFields,
  },
  {
    id: "hr-total",
    label: "HR",
    shortLabel: "HR",
    role: "HR Operations Lead",
    description: "Quyền do Admin cấp",
    branch: "Toàn công ty",
    department: "Nhân sự",
    grants: [
      ...baseEmployee,
      grant("notifications", ["create"], "company", "template"),
      grant("ai-wfh", ["view"], "self", "base"),
      grant("hr-command", ["view"], "company", "template"),
      grant("hr-leave", ["view", "edit", "approve"], "company", "template"),
      grant("employees", ["view", "create", "edit", "export"], "company", "template"),
      grant("onboarding", ["view", "create", "edit"], "company", "template"),
      grant("probation", ["view", "edit", "approve"], "company", "template"),
      grant("hr-contracts", ["view", "create", "edit", "approve"], "company", "template"),
      grant("organization", ["view", "edit"], "company", "template"),
      grant("offboarding", ["view", "create", "edit", "approve"], "company", "template"),
      grant("hr-assets", ["view", "edit"], "company", "template"),
      grant("hr-policies", ["view", "configure"], "company", "template"),
      grant("attendance-monitoring", ["view", "edit", "approve", "export"], "company", "template"),
      grant("timesheets", ["view", "edit", "approve", "export"], "company", "template"),
      grant("expense-review", ["view", "approve", "export"], "company", "template"),
      grant("reports", ["view", "export"], "company", "template"),
      grant("ai-cv", ["view", "create", "edit"], "company", "template"),
      grant("misa-sync", ["view", "configure"], "company", "override"),
    ],
    scopeConstraints: ["company"],
    sensitiveFields: [
      { field: "phone", visibility: "visible" },
      { field: "address", visibility: "visible" },
      { field: "bankAccount", visibility: "visible" },
      { field: "salary", visibility: "visible" },
      { field: "citizenId", visibility: "visible" },
    ],
  },
  {
    id: "system-admin",
    label: "Admin",
    shortLabel: "AD",
    role: "System Administrator",
    description: "Cấu hình và phân quyền",
    branch: "Toàn công ty",
    department: "Công nghệ thông tin",
    grants: [
      ...baseEmployee,
      grant("notifications", ["create"], "company", "template"),
      grant("ai-wfh", ["view"], "self", "base"),
      grant("admin-overview", ["view"], "company", "template"),
      grant("branches-gps", ["view", "create", "edit", "configure"], "company", "template"),
      grant("accounts", ["view", "create", "edit", "assign", "export"], "company", "template"),
      grant("permissions", ["view", "edit", "configure", "audit"], "company", "template"),
      grant("access-reviews", ["view", "approve", "audit"], "company", "template"),
      grant("delegation", ["view", "create", "edit", "configure", "audit"], "company", "template"),
      grant("catalogs", ["view", "create", "edit", "configure"], "company", "template"),
      grant("email-dlp", ["view", "configure", "audit"], "company", "template"),
      grant("notification-config", ["view", "configure", "audit"], "company", "template"),
      grant("integrations", ["view", "configure", "audit"], "company", "template"),
      grant("audit", ["view", "audit", "export"], "company", "template"),
      grant("ai-governance", ["view", "configure", "audit"], "company", "template"),
    ],
    scopeConstraints: ["company"],
    sensitiveFields: [
      { field: "phone", visibility: "masked" },
      { field: "address", visibility: "hidden" },
      { field: "bankAccount", visibility: "hidden" },
      { field: "salary", visibility: "hidden" },
      { field: "citizenId", visibility: "hidden" },
    ],
  },
];

export const personas = definitions.map(buildEffectiveSession);

export function getPersona(id: PersonaId) {
  return personas.find((persona) => persona.id === id) ?? personas[0];
}
