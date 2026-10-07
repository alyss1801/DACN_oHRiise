"use client";

import type { Action } from "@/lib/authorization/types";
import { useSession } from "./session-context";

export function Can({ resource, action = "view", children, fallback = null }: { resource: string; action?: Action; children: React.ReactNode; fallback?: React.ReactNode }) {
  const { can } = useSession();
  return can(resource, action) ? children : fallback;
}
