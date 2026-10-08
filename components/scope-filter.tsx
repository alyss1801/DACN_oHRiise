"use client";

import { useSession } from "@/features/session/session-context";
import type { ScopeType } from "@/lib/authorization/types";

const scopeLabels: Record<ScopeType, string> = {
  self: "Bản thân",
  assigned: "Được phân công",
  team: "Đội ngũ",
  department: "Phòng ban",
  branch: "Chi nhánh",
  company: "Toàn công ty",
};

export function ScopeFilter() {
  const { dataScope, availableDataScopes, setDataScope } = useSession();
  if (availableDataScopes.length < 2) return null;

  return (
    <label className="page-scope-filter">
      <span>Phạm vi dữ liệu</span>
      <select value={dataScope} onChange={(event) => setDataScope(event.target.value as ScopeType)} aria-label="Chọn phạm vi dữ liệu">
        {availableDataScopes.map((scope) => <option value={scope} key={scope}>{scopeLabels[scope]}</option>)}
      </select>
    </label>
  );
}
