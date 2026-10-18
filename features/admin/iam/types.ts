export type AccountStatus = "active" | "locked" | "pending" | "inactive";
export type TemplateType = "system" | "custom";
export type ScopeType = "self" | "team" | "department" | "branch" | "company";
export type PermissionOverride = "inherit" | "allow" | "deny";

export type PermissionDefinition = {
  code: string;
  module: string;
  name: string;
  description: string;
  dependency?: string;
  protected?: boolean;
};

export type AccessTemplate = {
  id: string;
  name: string;
  code: string;
  description: string;
  type: TemplateType;
  status: "active" | "inactive";
  permissionCodes: string[];
  lockedCodes: string[];
  scopeCompatibility: ScopeType[];
  updatedAt: string;
  version: number;
  usageCount: number;
};

export type DataScope = {
  type: ScopeType;
  target?: string;
};

export type Account = {
  id: string;
  employeeCode: string;
  name: string;
  initials: string;
  email: string;
  branch: string;
  department: string;
  team: string;
  position: string;
  level: string;
  employmentType: string;
  manager: string;
  startDate: string;
  createdAt: string;
  status: AccountStatus;
  templateIds: string[];
  overrides: Record<string, PermissionOverride>;
  scope: DataScope;
  authMethod: string;
  mfa: boolean;
  lastLogin?: string;
  passwordChangedAt: string;
  activeSessions: number;
  failedLogins: number;
};

export type AuditEvent = {
  id: string;
  accountId?: string;
  templateId?: string;
  delegationId?: string;
  actor: string;
  action: string;
  timestamp: string;
  previousValue: string;
  newValue: string;
};

export type AssignmentDraft = {
  accountId: string;
  templateIds: string[];
  overrides: Record<string, PermissionOverride>;
  scope: DataScope;
  baselineTemplateIds: string[];
  baselineOverrides: Record<string, PermissionOverride>;
  baselineScope: DataScope;
};

export type TemplateDraft = Omit<AccessTemplate, "id" | "updatedAt" | "version" | "usageCount"> & {
  id?: string;
  sourceId?: string;
};

export type EffectivePermission = {
  code: string;
  allowed: boolean;
  sources: string[];
  override: PermissionOverride;
  protected: boolean;
};

export type ReviewDecision = "keep" | "revoke";
export type AccessReviewItem = {
  id: string;
  accountId: string;
  templateId: string;
  decision?: ReviewDecision;
  note?: string;
};
export type AccessReview = {
  id: string;
  title: string;
  reviewerId: string;
  branch: string;
  department: string;
  dueDate: string;
  createdAt: string;
  status: "open" | "completed";
  items: AccessReviewItem[];
};

export type TemporaryDelegation = {
  id: string;
  fromId: string;
  toId: string;
  permissionCode: string;
  scope: DataScope;
  startsAt: string;
  endsAt: string;
  reason: string;
  approverId: string;
  status: "pending" | "approved" | "rejected" | "revoked";
  createdAt: string;
  decidedAt?: string;
};
