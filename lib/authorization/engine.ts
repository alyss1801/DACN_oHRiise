import type {
  Action,
  EffectivePermission,
  EffectiveSession,
  FieldVisibility,
  PersonaDefinition,
  ScopeType,
} from "./types";

const scopeOrder: ScopeType[] = [
  "self",
  "assigned",
  "team",
  "department",
  "branch",
  "company",
];

export function intersectScopes(scopes: ScopeType[]): ScopeType {
  return scopes.reduce((narrowest, scope) =>
    scopeOrder.indexOf(scope) < scopeOrder.indexOf(narrowest) ? scope : narrowest,
  scopes[0] ?? "self");
}

export function buildEffectiveSession(persona: PersonaDefinition): EffectiveSession {
  const permissionMap = new Map<string, EffectivePermission>();
  const now = Date.now();

  for (const grant of persona.grants) {
    if (grant.expiresAt && new Date(`${grant.expiresAt}T23:59:59`).getTime() < now) continue;
    const current = permissionMap.get(grant.resource);
    permissionMap.set(grant.resource, {
      resource: grant.resource,
      actions: Array.from(new Set([...(current?.actions ?? []), ...grant.actions])),
      scope: current ? intersectScopes([current.scope, grant.scope]) : grant.scope,
      sources: Array.from(new Set([...(current?.sources ?? []), grant.source])),
      expiresAt: grant.expiresAt ?? current?.expiresAt,
    });
  }

  for (const restriction of persona.restrictions ?? []) {
    const current = permissionMap.get(restriction.resource);
    if (!current) continue;
    permissionMap.set(restriction.resource, {
      ...current,
      actions: current.actions.filter((action) => !restriction.actions.includes(action)),
    });
  }

  return {
    ...persona,
    permissions: Array.from(permissionMap.values()),
    effectiveScope: intersectScopes(persona.scopeConstraints),
  };
}

export function can(session: EffectiveSession, resource: string, action: Action = "view") {
  return session.permissions.some(
    (permission) => permission.resource === resource && permission.actions.includes(action),
  );
}

export function fieldVisibility(
  session: EffectiveSession,
  field: string,
): FieldVisibility {
  return session.sensitiveFields.find((policy) => policy.field === field)?.visibility ?? "hidden";
}

export function canAccessScopedRecord(
  session: EffectiveSession,
  record: { branch?: string; department?: string; team?: string; employeeId?: string },
  currentEmployeeId = "OH-0248",
) {
  if (session.effectiveScope === "company") return true;
  if (session.effectiveScope === "branch") return record.branch === session.branch;
  if (session.effectiveScope === "department") return record.department === session.department;
  if (session.effectiveScope === "team") return record.team === "Data Platform";
  if (session.effectiveScope === "assigned") return record.employeeId === currentEmployeeId;
  return record.employeeId === currentEmployeeId;
}
