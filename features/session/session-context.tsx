"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getPersona, personas } from "@/lib/authorization/personas";
import { can, fieldVisibility } from "@/lib/authorization/engine";
import { applyAdminAccess, type AdminAccessProfile } from "@/lib/authorization/admin-access";
import type { Action, PersonaId, ScopeType } from "@/lib/authorization/types";

type SessionContextValue = {
  session: ReturnType<typeof getPersona>;
  personas: typeof personas;
  setPersona: (id: PersonaId) => void;
  setAccessProfiles: (profiles: Partial<Record<PersonaId, AdminAccessProfile>>) => void;
  dataScope: ScopeType;
  availableDataScopes: ScopeType[];
  setDataScope: (scope: ScopeType) => void;
  can: (resource: string, action?: Action) => boolean;
  fieldVisibility: (field: string) => ReturnType<typeof fieldVisibility>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [personaId, setPersonaId] = useState<PersonaId>("employee");
  const [dataScope, setDataScopeState] = useState<ScopeType>("self");
  const [accessProfiles, setAccessProfilesState] = useState<Partial<Record<PersonaId, AdminAccessProfile>>>({});
  const baseSession = useMemo(() => applyAdminAccess(getPersona(personaId), accessProfiles[personaId]), [personaId, accessProfiles]);
  const availableDataScopes = useMemo(() => scopesForPersona(personaId, baseSession.effectiveScope), [baseSession.effectiveScope, personaId]);
  const activeDataScope = availableDataScopes.includes(dataScope) ? dataScope : baseSession.effectiveScope;
  const session = useMemo(() => ({ ...baseSession, effectiveScope: activeDataScope }), [activeDataScope, baseSession]);

  const switchPersona = useCallback((id: PersonaId) => {
    const next = getPersona(id);
    setPersonaId(next.id);
    setDataScopeState(accessProfiles[next.id]?.scope ?? next.effectiveScope);
  }, [accessProfiles]);

  const setAccessProfiles = useCallback((next: Partial<Record<PersonaId, AdminAccessProfile>>) => {
    setAccessProfilesState((current) => JSON.stringify(current) === JSON.stringify(next) ? current : next);
  }, []);

  const setDataScope = useCallback((scope: ScopeType) => {
    if (availableDataScopes.includes(scope)) setDataScopeState(scope);
  }, [availableDataScopes]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      personas,
      setPersona: switchPersona,
      setAccessProfiles,
      dataScope: activeDataScope,
      availableDataScopes,
      setDataScope,
      can: (resource, action = "view") => can(session, resource, action),
      fieldVisibility: (field) => fieldVisibility(session, field),
    }),
    [activeDataScope, availableDataScopes, session, setDataScope, setAccessProfiles, switchPersona],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

function scopesForPersona(personaId: PersonaId, fallback: ScopeType): ScopeType[] {
  if (personaId === "team-lead") return fallback === "team" || fallback === "department" || fallback === "branch" ? ["self", fallback] : [fallback];
  if (personaId === "hr-total") return fallback === "company" ? ["self", "department", "branch", "company"] : fallback === "branch" ? ["self", "branch"] : fallback === "department" ? ["self", "department"] : [fallback];
  return [fallback];
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider");
  return context;
}
