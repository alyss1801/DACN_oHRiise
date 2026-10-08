"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getPersona, personas } from "@/lib/authorization/personas";
import { can, fieldVisibility } from "@/lib/authorization/engine";
import type { Action, PersonaId, ScopeType } from "@/lib/authorization/types";

type SessionContextValue = {
  session: ReturnType<typeof getPersona>;
  personas: typeof personas;
  setPersona: (id: PersonaId) => void;
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
  const baseSession = useMemo(() => getPersona(personaId), [personaId]);
  const availableDataScopes = useMemo(() => scopesForPersona(personaId, baseSession.effectiveScope), [baseSession.effectiveScope, personaId]);
  const activeDataScope = availableDataScopes.includes(dataScope) ? dataScope : baseSession.effectiveScope;
  const session = useMemo(() => ({ ...baseSession, effectiveScope: activeDataScope }), [activeDataScope, baseSession]);

  const switchPersona = useCallback((id: PersonaId) => {
    const next = getPersona(id);
    setPersonaId(id);
    setDataScopeState(next.effectiveScope);
  }, []);

  const setDataScope = useCallback((scope: ScopeType) => {
    if (availableDataScopes.includes(scope)) setDataScopeState(scope);
  }, [availableDataScopes]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      personas,
      setPersona: switchPersona,
      dataScope: activeDataScope,
      availableDataScopes,
      setDataScope,
      can: (resource, action = "view") => can(session, resource, action),
      fieldVisibility: (field) => fieldVisibility(session, field),
    }),
    [activeDataScope, availableDataScopes, session, setDataScope, switchPersona],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

function scopesForPersona(personaId: PersonaId, fallback: ScopeType): ScopeType[] {
  if (personaId === "team-lead") return ["self", "team"];
  if (personaId === "hr-branch") return ["self", "branch"];
  if (personaId === "hr-total") return ["self", "department", "branch", "company"];
  return [fallback];
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider");
  return context;
}
