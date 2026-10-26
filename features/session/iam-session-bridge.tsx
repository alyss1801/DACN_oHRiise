"use client";

import { useEffect, useMemo } from "react";
import { useIam } from "@/features/admin/iam/iam-context";
import { personaEmployeeIds } from "@/lib/authorization/demo-identity";
import type { AdminAccessProfile } from "@/lib/authorization/admin-access";
import type { PersonaId } from "@/lib/authorization/types";
import { useSession } from "./session-context";

export function IamSessionBridge() {
  const { personas, setAccessProfiles } = useSession();
  const { accounts, effectivePermissions } = useIam();
  const profiles = useMemo(() => Object.fromEntries(personas.flatMap((persona) => {
    const account = accounts.find((item) => item.employeeId === personaEmployeeIds[persona.id]);
    return account ? [[persona.id, {
      employeeId: account.employeeId,
      status: account.status,
      scope: account.scope.type,
      target: account.scope.target,
      branch: account.branch,
      department: account.department,
      allowedCodes: effectivePermissions(account).filter((permission) => permission.allowed).map((permission) => permission.code),
    }]] : [];
  })) as Partial<Record<PersonaId, AdminAccessProfile>>, [accounts, effectivePermissions, personas]);
  useEffect(() => { setAccessProfiles(profiles); }, [profiles, setAccessProfiles]);
  return null;
}
