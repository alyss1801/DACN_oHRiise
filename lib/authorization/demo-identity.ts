import type { PersonaId } from "./types";

// Local demo persona mapping only; never treat this as backend identity verification.
export const personaEmployeeIds: Partial<Record<PersonaId, string>> = {
  employee: "OH-0248",
  "team-lead": "OH-0184",
  "hr-total": "OH-0091",
  "system-admin": "OH-0001",
};
