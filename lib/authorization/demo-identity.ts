import type { PersonaId } from "./types";

// Local demo persona mapping only; never treat this as backend identity verification.
export const personaEmployeeIds: Partial<Record<PersonaId, string>> = {
  employee: "OH-0248",
  "product-lead": "OH-0184",
  "team-lead": "OH-0259",
  "hr-total": "OH-0091",
  "hr-branch": "OH-0266",
  compensation: "OH-0266", // The same demo employee can carry an additional C&B role.
};
