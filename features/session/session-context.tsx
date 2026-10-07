"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { getPersona, personas } from "@/lib/authorization/personas";
import { can, fieldVisibility } from "@/lib/authorization/engine";
import type { Action, PersonaId } from "@/lib/authorization/types";

type SessionContextValue = {
  session: ReturnType<typeof getPersona>;
  personas: typeof personas;
  setPersona: (id: PersonaId) => void;
  can: (resource: string, action?: Action) => boolean;
  fieldVisibility: (field: string) => ReturnType<typeof fieldVisibility>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [personaId, setPersonaId] = useState<PersonaId>("employee");
  const session = useMemo(() => getPersona(personaId), [personaId]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      personas,
      setPersona: setPersonaId,
      can: (resource, action = "view") => can(session, resource, action),
      fieldVisibility: (field) => fieldVisibility(session, field),
    }),
    [session],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider");
  return context;
}
