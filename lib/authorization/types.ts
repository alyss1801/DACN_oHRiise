export type Action =
  | "view"
  | "create"
  | "edit"
  | "approve"
  | "export"
  | "configure"
  | "assign"
  | "audit";

export type ScopeType =
  | "self"
  | "assigned"
  | "team"
  | "department"
  | "branch"
  | "company";

export type PermissionSource =
  | "base"
  | "template"
  | "override"
  | "relationship"
  | "delegation";

export type FieldVisibility = "visible" | "masked" | "hidden";

export type PermissionGrant = {
  resource: string;
  actions: Action[];
  scope: ScopeType;
  source: PermissionSource;
  expiresAt?: string;
};

export type PermissionRestriction = {
  resource: string;
  actions: Action[];
};

export type SensitiveFieldPolicy = {
  field: string;
  visibility: FieldVisibility;
};

export type PersonaId =
  | "employee"
  | "team-lead"
  | "hr-total"
  | "system-admin";

export type PersonaDefinition = {
  id: PersonaId;
  label: string;
  shortLabel: string;
  role: string;
  description: string;
  branch: string;
  department: string;
  scopeTarget?: string;
  grants: PermissionGrant[];
  restrictions?: PermissionRestriction[];
  scopeConstraints: ScopeType[];
  sensitiveFields: SensitiveFieldPolicy[];
};

export type EffectivePermission = {
  resource: string;
  actions: Action[];
  scope: ScopeType;
  sources: PermissionSource[];
  expiresAt?: string;
};

export type EffectiveSession = PersonaDefinition & {
  permissions: EffectivePermission[];
  effectiveScope: ScopeType;
};
