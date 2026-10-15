"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { initialAccounts, initialAuditEvents, initialTemplates, permissionCatalog } from "./mock-data";
import type { AccessTemplate, Account, AssignmentDraft, AuditEvent, EffectivePermission, PermissionOverride, TemplateDraft } from "./types";

type IamContextValue = {
  accounts: Account[];
  templates: AccessTemplate[];
  auditEvents: AuditEvent[];
  assignmentDraft: AssignmentDraft | null;
  templateDraft: TemplateDraft | null;
  hasUnsavedDraft: boolean;
  updateAccount: (id: string, patch: Partial<Account>) => void;
  createAccount: (input: Pick<Account, "name" | "email" | "branch" | "department" | "team" | "position" | "status">) => string;
  startAssignment: (accountId: string) => void;
  updateAssignment: (patch: Partial<Pick<AssignmentDraft, "templateIds" | "overrides" | "scope">>) => void;
  discardAssignment: () => void;
  applyAssignment: () => void;
  startTemplateDraft: (templateId?: string, clone?: boolean) => void;
  updateTemplateDraft: (patch: Partial<TemplateDraft>) => void;
  discardTemplateDraft: () => void;
  saveTemplateDraft: () => string | null;
  cloneTemplate: (templateId: string) => string | null;
  toggleTemplateStatus: (templateId: string) => void;
  effectivePermissions: (account: Account, draft?: AssignmentDraft | null) => EffectivePermission[];
};

const IamContext = createContext<IamContextValue | null>(null);

export function IamProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [templates, setTemplates] = useState(initialTemplates);
  const [auditEvents, setAuditEvents] = useState(initialAuditEvents);
  const [assignmentDraft, setAssignmentDraft] = useState<AssignmentDraft | null>(null);
  const [templateDraft, setTemplateDraft] = useState<TemplateDraft | null>(null);

  const updateAccount = useCallback((id: string, patch: Partial<Account>) => {
    setAccounts((current) => current.map((account) => account.id === id ? { ...account, ...patch } : account));
  }, []);

  const createAccount = useCallback((input: Pick<Account, "name" | "email" | "branch" | "department" | "team" | "position" | "status">) => {
    const id = `user-${Date.now().toString(36)}`;
    const employeeCode = `EMP-${String(241 + accounts.length).padStart(5, "0")}`;
    const initials = input.name.split(" ").slice(-2).map((part) => part[0]).join("").toUpperCase();
    const next: Account = { id, employeeCode, initials, ...input, level: "Nhân viên", employmentType: "Toàn thời gian", manager: "Chưa thiết lập", startDate: "15/10/2026", createdAt: "15/10/2026", templateIds: ["tpl-employee"], overrides: {}, scope: { type: "self" }, authMethod: "Mật khẩu oHRiise", mfa: false, passwordChangedAt: "Chưa thiết lập", activeSessions: 0, failedLogins: 0 };
    setAccounts((current) => [...current, next]);
    setTemplates((current) => current.map((template) => template.id === "tpl-employee" ? { ...template, usageCount: template.usageCount + 1 } : template));
    setAuditEvents((current) => [{ id: `audit-${Date.now()}`, accountId: id, actor: "Nguyễn Thu Hà", action: "Tạo tài khoản", timestamp: "15/10/2026 · vừa xong", previousValue: "—", newValue: "Chưa kích hoạt" }, ...current]);
    return id;
  }, [accounts.length]);

  const startAssignment = useCallback((accountId: string) => {
    const account = accounts.find((item) => item.id === accountId);
    if (!account) return;
    setAssignmentDraft({
      accountId,
      templateIds: [...account.templateIds],
      overrides: { ...account.overrides },
      scope: { ...account.scope },
      baselineTemplateIds: [...account.templateIds],
      baselineOverrides: { ...account.overrides },
      baselineScope: { ...account.scope },
    });
  }, [accounts]);

  const updateAssignment = useCallback((patch: Partial<Pick<AssignmentDraft, "templateIds" | "overrides" | "scope">>) => {
    setAssignmentDraft((current) => current ? { ...current, ...patch } : current);
  }, []);

  const discardAssignment = useCallback(() => setAssignmentDraft(null), []);

  const applyAssignment = useCallback(() => {
    setAssignmentDraft((draft) => {
      if (!draft) return null;
      const account = accounts.find((item) => item.id === draft.accountId);
      if (!account) return null;
      setAccounts((current) => current.map((item) => item.id === draft.accountId ? { ...item, templateIds: [...draft.templateIds], overrides: { ...draft.overrides }, scope: { ...draft.scope } } : item));
      setTemplates((current) => current.map((template) => {
        const wasAssigned = account.templateIds.includes(template.id);
        const isAssigned = draft.templateIds.includes(template.id);
        if (wasAssigned === isAssigned) return template;
        return { ...template, usageCount: Math.max(0, template.usageCount + (isAssigned ? 1 : -1)) };
      }));
      const oldTemplates = account.templateIds.join(", ");
      const newTemplates = draft.templateIds.join(", ");
      setAuditEvents((current) => [{ id: `audit-${Date.now()}`, accountId: account.id, actor: "Nguyễn Thu Hà", action: "Cập nhật phân quyền", timestamp: "15/10/2026 · vừa xong", previousValue: `${oldTemplates} · ${account.scope.type}`, newValue: `${newTemplates} · ${draft.scope.type}` }, ...current]);
      return null;
    });
  }, [accounts]);

  const startTemplateDraft = useCallback((templateId?: string, clone = false) => {
    const source = templates.find((item) => item.id === templateId);
    if (!source) {
      setTemplateDraft({ name: "", code: "", description: "", type: "custom", status: "active", permissionCodes: [], lockedCodes: [], scopeCompatibility: ["self"] });
      return;
    }
    setTemplateDraft({
      id: clone ? undefined : source.id,
      sourceId: clone ? source.id : undefined,
      name: clone ? `${source.name} — Bản sao` : source.name,
      code: clone ? `${source.code}_COPY` : source.code,
      description: source.description,
      type: clone ? "custom" : source.type,
      status: source.status,
      permissionCodes: [...source.permissionCodes],
      lockedCodes: [...source.lockedCodes],
      scopeCompatibility: [...source.scopeCompatibility],
    });
  }, [templates]);

  const updateTemplateDraft = useCallback((patch: Partial<TemplateDraft>) => setTemplateDraft((current) => current ? { ...current, ...patch } : current), []);
  const discardTemplateDraft = useCallback(() => setTemplateDraft(null), []);

  const saveTemplateDraft = useCallback(() => {
    if (!templateDraft || !templateDraft.name.trim() || !templateDraft.code.trim()) return null;
    const existing = templateDraft.id ? templates.find((item) => item.id === templateDraft.id) : undefined;
    const id = existing?.id ?? `tpl-${templateDraft.code.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
    const next: AccessTemplate = {
      id,
      name: templateDraft.name.trim(),
      code: templateDraft.code.trim().toUpperCase(),
      description: templateDraft.description.trim(),
      type: templateDraft.type,
      status: templateDraft.status,
      permissionCodes: [...templateDraft.permissionCodes],
      lockedCodes: [...templateDraft.lockedCodes],
      scopeCompatibility: [...templateDraft.scopeCompatibility],
      updatedAt: "15/10/2026",
      version: (existing?.version ?? 0) + 1,
      usageCount: existing?.usageCount ?? 0,
    };
    setTemplates((current) => existing ? current.map((item) => item.id === id ? next : item) : [...current, next]);
    setAuditEvents((current) => [{ id: `audit-${Date.now()}`, templateId: id, actor: "Nguyễn Thu Hà", action: existing ? "Cập nhật mẫu quyền" : "Tạo mẫu quyền", timestamp: "15/10/2026 · vừa xong", previousValue: existing ? `Phiên bản ${existing.version}` : "—", newValue: `Phiên bản ${next.version}` }, ...current]);
    setTemplateDraft(null);
    return id;
  }, [templateDraft, templates]);

  const cloneTemplate = useCallback((templateId: string) => {
    const source = templates.find((item) => item.id === templateId);
    if (!source) return null;
    const id = `tpl-copy-${Date.now().toString(36)}`;
    setTemplates((current) => [...current, { ...source, id, name: `${source.name} — Bản sao`, code: `${source.code}_COPY`, type: "custom", lockedCodes: [], usageCount: 0, version: 1, updatedAt: "15/10/2026" }]);
    return id;
  }, [templates]);

  const toggleTemplateStatus = useCallback((templateId: string) => {
    setTemplates((current) => current.map((item) => item.id === templateId && item.type === "custom" ? { ...item, status: item.status === "active" ? "inactive" : "active", updatedAt: "15/10/2026" } : item));
  }, []);

  const effectivePermissions = useCallback((account: Account, draft?: AssignmentDraft | null) => {
    const templateIds = draft?.accountId === account.id ? draft.templateIds : account.templateIds;
    const overrides = draft?.accountId === account.id ? draft.overrides : account.overrides;
    return permissionCatalog.map((permission) => {
      const sources = templates.filter((template) => templateIds.includes(template.id) && template.permissionCodes.includes(permission.code)).map((template) => template.name);
      const override: PermissionOverride = overrides[permission.code] ?? "inherit";
      const protectedGrant = permission.protected === true && sources.length > 0;
      const allowed = protectedGrant || override === "allow" || (override !== "deny" && sources.length > 0);
      return { code: permission.code, allowed, sources, override, protected: protectedGrant };
    });
  }, [templates]);

  const hasUnsavedDraft = useMemo(() => {
    if (templateDraft) {
      const existing = templateDraft.id ? templates.find((item) => item.id === templateDraft.id) : undefined;
      if (!existing) return Boolean(templateDraft.name || templateDraft.code || templateDraft.description || templateDraft.permissionCodes.length);
      return JSON.stringify({ name: templateDraft.name, code: templateDraft.code, description: templateDraft.description, type: templateDraft.type, status: templateDraft.status, permissionCodes: templateDraft.permissionCodes, lockedCodes: templateDraft.lockedCodes, scopeCompatibility: templateDraft.scopeCompatibility }) !== JSON.stringify({ name: existing.name, code: existing.code, description: existing.description, type: existing.type, status: existing.status, permissionCodes: existing.permissionCodes, lockedCodes: existing.lockedCodes, scopeCompatibility: existing.scopeCompatibility });
    }
    if (!assignmentDraft) return false;
    return JSON.stringify({ t: assignmentDraft.templateIds, o: assignmentDraft.overrides, s: assignmentDraft.scope }) !== JSON.stringify({ t: assignmentDraft.baselineTemplateIds, o: assignmentDraft.baselineOverrides, s: assignmentDraft.baselineScope });
  }, [assignmentDraft, templateDraft, templates]);

  const value = useMemo<IamContextValue>(() => ({ accounts, templates, auditEvents, assignmentDraft, templateDraft, hasUnsavedDraft, updateAccount, createAccount, startAssignment, updateAssignment, discardAssignment, applyAssignment, startTemplateDraft, updateTemplateDraft, discardTemplateDraft, saveTemplateDraft, cloneTemplate, toggleTemplateStatus, effectivePermissions }), [accounts, templates, auditEvents, assignmentDraft, templateDraft, hasUnsavedDraft, updateAccount, createAccount, startAssignment, updateAssignment, discardAssignment, applyAssignment, startTemplateDraft, updateTemplateDraft, discardTemplateDraft, saveTemplateDraft, cloneTemplate, toggleTemplateStatus, effectivePermissions]);
  return <IamContext.Provider value={value}>{children}</IamContext.Provider>;
}

export function useIam() {
  const context = useContext(IamContext);
  if (!context) throw new Error("useIam must be used inside IamProvider");
  return context;
}
