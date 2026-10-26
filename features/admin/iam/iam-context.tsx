"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { accountFromEmployee, initialAccounts, initialAuditEvents, initialTemplates, permissionCatalog } from "./mock-data";
import { initialAccessReviews, initialTemporaryDelegations } from "./governance-mock-data";
import { useHrDemo } from "@/features/hr/hr-demo-context";
import { disableIsDue } from "@/features/hr/offboarding-model";
import { demoBusinessDate, demoBusinessNow } from "@/lib/demo-clock";
import { useSession } from "@/features/session/session-context";
import type { AccessReview, AccessTemplate, Account, AssignmentDraft, AuditEvent, EffectivePermission, PermissionOverride, ReviewDecision, TemporaryDelegation, TemplateDraft } from "./types";

type IamContextValue = {
  accounts: Account[];
  templates: AccessTemplate[];
  auditEvents: AuditEvent[];
  accessReviews: AccessReview[];
  temporaryDelegations: TemporaryDelegation[];
  createAccessReview: (input: Omit<AccessReview, "id" | "createdAt" | "status">) => string;
  decideReviewItem: (reviewId: string, itemId: string, decision: ReviewDecision, note: string) => void;
  completeAccessReview: (reviewId: string) => boolean;
  createDelegation: (input: Omit<TemporaryDelegation, "id" | "createdAt" | "status" | "decidedAt">) => string;
  decideDelegation: (id: string, status: "approved" | "rejected" | "revoked") => void;
  assignmentDraft: AssignmentDraft | null;
  templateDraft: TemplateDraft | null;
  hasUnsavedDraft: boolean;
  updateAccount: (id: string, patch: Partial<Account>) => boolean;
  createAccount: (employeeId: string) => string | null;
  completeOnboardingAccount: (caseId: string, note: string) => boolean;
  completeOffboardingAccount: (caseId: string, note: string) => boolean;
  resetIamDemo: () => void;
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
const storageKey = "ohriise-iam-demo-v1";

export function IamProvider({ children }: { children: React.ReactNode }) {
  const { session, can } = useSession();
  const { employees, cases, completeAccountOnboarding, completeAccountOffboarding } = useHrDemo();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [templates, setTemplates] = useState(initialTemplates);
  const [auditEvents, setAuditEvents] = useState(initialAuditEvents);
  const [accessReviews, setAccessReviews] = useState(initialAccessReviews);
  const [temporaryDelegations, setTemporaryDelegations] = useState(initialTemporaryDelegations);
  const [assignmentDraft, setAssignmentDraft] = useState<AssignmentDraft | null>(null);
  const [templateDraft, setTemplateDraft] = useState<TemplateDraft | null>(null);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
      if (parsed?.version === 1 && Array.isArray(parsed.accounts) && parsed.accounts.every((item: Account) => item.employeeId) && Array.isArray(parsed.templates)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore browser-only demo state after hydration.
        setAccounts(parsed.accounts); setTemplates(parsed.templates);
        if (Array.isArray(parsed.auditEvents)) setAuditEvents(parsed.auditEvents);
        if (Array.isArray(parsed.accessReviews)) setAccessReviews(parsed.accessReviews);
        if (Array.isArray(parsed.temporaryDelegations)) setTemporaryDelegations(parsed.temporaryDelegations);
      }
    } catch { /* Preserve the canonical seed if the local snapshot is invalid. */ }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem(storageKey, JSON.stringify({ version: 1, accounts, templates, auditEvents, accessReviews, temporaryDelegations }));
  }, [hydrated, accounts, templates, auditEvents, accessReviews, temporaryDelegations]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== storageKey || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed?.version !== 1 || !Array.isArray(parsed.accounts) || !parsed.accounts.every((item: Account) => item.employeeId) || !Array.isArray(parsed.templates)) return;
        setAccounts(parsed.accounts); setTemplates(parsed.templates);
        if (Array.isArray(parsed.auditEvents)) setAuditEvents(parsed.auditEvents);
        if (Array.isArray(parsed.accessReviews)) setAccessReviews(parsed.accessReviews);
        if (Array.isArray(parsed.temporaryDelegations)) setTemporaryDelegations(parsed.temporaryDelegations);
      } catch { /* Keep the last valid demo snapshot. */ }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const resetIamDemo = useCallback(() => {
    setAccounts(initialAccounts); setTemplates(initialTemplates); setAuditEvents(initialAuditEvents);
    setAccessReviews(initialAccessReviews); setTemporaryDelegations(initialTemporaryDelegations);
    setAssignmentDraft(null); setTemplateDraft(null);
  }, []);
  const visibleAccounts = useMemo(() => accounts.map((account) => {
    const person = employees.find((item) => item.id === account.employeeId);
    return person ? { ...account, name: person.name, initials: person.initials, email: person.email, employeeCode: person.id, branch: person.branch, department: person.department, position: person.position, employmentType: person.employmentType, startDate: person.startDate, manager: employees.find((item) => item.id === person.managerId)?.name ?? "Chưa gán", team: person.primaryTeamId ?? "—" } : account;
  }), [accounts, employees]);

  const createAccessReview = useCallback((input: Omit<AccessReview, "id" | "createdAt" | "status">) => {
    const id = `review-${crypto.randomUUID()}`;
    setAccessReviews((current) => [{ ...input, id, createdAt: demoBusinessDate(), status: "open" }, ...current]);
    setAuditEvents((current) => [{ id: `audit-${crypto.randomUUID()}`, actor: "Quản trị viên (demo)", action: "Tạo đợt rà soát truy cập", timestamp: new Date().toLocaleString("vi-VN"), previousValue: "—", newValue: input.title }, ...current]);
    return id;
  }, []);

  const decideReviewItem = useCallback((reviewId: string, itemId: string, decision: ReviewDecision, note: string) => {
    setAccessReviews((current) => current.map((review) => review.id === reviewId && review.status === "open" ? { ...review, items: review.items.map((item) => item.id === itemId ? { ...item, decision, note: note.trim() } : item) } : review));
  }, []);

  const completeAccessReview = useCallback((reviewId: string) => {
    const review = accessReviews.find((item) => item.id === reviewId);
    if (!review || review.status !== "open" || review.items.some((item) => !item.decision)) return false;
    setAccessReviews((current) => current.map((item) => item.id === reviewId ? { ...item, status: "completed" } : item));
    setAuditEvents((current) => [{ id: `audit-${crypto.randomUUID()}`, actor: "Quản trị viên (demo)", action: "Hoàn tất rà soát truy cập", timestamp: new Date().toLocaleString("vi-VN"), previousValue: "Đang rà soát", newValue: `${review.title} · ${review.items.filter((item) => item.decision === "revoke").length} đề xuất thu hồi` }, ...current]);
    return true;
  }, [accessReviews]);

  const createDelegation = useCallback((input: Omit<TemporaryDelegation, "id" | "createdAt" | "status" | "decidedAt">) => {
    const id = `delegation-${crypto.randomUUID()}`;
    setTemporaryDelegations((current) => [{ ...input, id, status: "pending", createdAt: demoBusinessDate() }, ...current]);
    setAuditEvents((current) => [{ id: `audit-${crypto.randomUUID()}`, delegationId: id, accountId: input.toId, actor: "Quản trị viên (demo)", action: "Tạo yêu cầu ủy quyền", timestamp: new Date().toLocaleString("vi-VN"), previousValue: "—", newValue: input.permissionCode }, ...current]);
    return id;
  }, []);

  const decideDelegation = useCallback((id: string, status: "approved" | "rejected" | "revoked") => {
    const target = temporaryDelegations.find((item) => item.id === id);
    if (!target || (status === "revoked" ? target.status !== "approved" : target.status !== "pending")) return;
    setTemporaryDelegations((current) => current.map((item) => item.id === id ? { ...item, status, decidedAt: demoBusinessDate() } : item));
    setAuditEvents((current) => [{ id: `audit-${crypto.randomUUID()}`, delegationId: id, accountId: target.toId, actor: "Quản trị viên (demo)", action: status === "approved" ? "Phê duyệt ủy quyền" : status === "rejected" ? "Từ chối ủy quyền" : "Thu hồi ủy quyền", timestamp: new Date().toLocaleString("vi-VN"), previousValue: target.status, newValue: status }, ...current]);
  }, [temporaryDelegations]);

  const updateAccount = useCallback((id: string, patch: Partial<Account>) => {
    const currentAccount = accounts.find((item) => item.id === id);
    if (!currentAccount || !can("accounts", "edit")) return false;
    if (patch.status === "inactive" && cases.some((item) => item.kind === "offboarding" && item.employeeId === currentAccount.employeeId && !item.completedAt && !item.cancelledAt)) return false; // Use the Admin account task so HR and IAM agree.
    if (patch.status === "active" && cases.some((item) => item.kind === "onboarding" && item.employeeId === currentAccount.employeeId && !item.completedAt && !item.cancelledAt && item.tasks.some((task) => task.id === "account" && !task.doneAt))) return false;
    if (patch.status && patch.status !== "inactive" && employees.some((item) => item.id === currentAccount.employeeId && item.status === "inactive")) return false;
    setAccounts((current) => current.map((account) => account.id === id ? { ...account, ...patch } : account));
    if (patch.status && patch.status !== currentAccount.status) setAuditEvents((current) => [{ id: `audit-${crypto.randomUUID()}`, accountId: id, actor: session.label, action: "Đổi trạng thái tài khoản demo", timestamp: demoBusinessNow().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }), previousValue: currentAccount.status, newValue: patch.status! }, ...current]);
    return true;
  }, [accounts, can, cases, employees, session.label]);

  const completeOffboardingAccount = useCallback((caseId: string, note: string) => {
    if (!can("accounts", "edit")) return false;
    const currentCase = cases.find((item) => item.id === caseId && item.kind === "offboarding" && !item.completedAt && !item.cancelledAt);
    const account = accounts.find((item) => item.employeeId === currentCase?.employeeId);
    if (!currentCase || !account || account.status === "inactive" || !disableIsDue(currentCase, demoBusinessNow().toISOString()) || currentCase.tasks.some((task) => task.id !== "account" && !task.doneAt) || note.trim().length < 8) return false;
    if (!completeAccountOffboarding(caseId, note)) return false;
    setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, status: "inactive", activeSessions: 0 } : item));
    setAuditEvents((current) => [{ id: `audit-${crypto.randomUUID()}`, accountId: account.id, actor: session.label, action: "Vô hiệu hóa theo offboarding", timestamp: demoBusinessNow().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }), previousValue: account.status, newValue: `inactive · ${caseId} · ${note.trim()}` }, ...current]);
    return true;
  }, [accounts, can, cases, completeAccountOffboarding, session.label]);

  const completeOnboardingAccount = useCallback((caseId: string, note: string) => {
    if (!can("accounts", "edit") || note.trim().length < 8) return false;
    const selected = cases.find((item) => item.id === caseId && item.kind === "onboarding" && !item.completedAt && !item.cancelledAt && item.tasks.some((task) => task.id === "account" && !task.doneAt));
    const person = employees.find((item) => item.id === selected?.employeeId);
    const account = accounts.find((item) => item.employeeId === selected?.employeeId);
    if (!selected || !person || person.status === "inactive" || !account || !["pending", "active"].includes(account.status)) return false;
    if (!completeAccountOnboarding(caseId, account.id, note)) return false;
    setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, status: "active" } : item));
    setAuditEvents((current) => [{ id: `audit-${crypto.randomUUID()}`, accountId: account.id, actor: session.label, action: "Kích hoạt theo onboarding", timestamp: demoBusinessNow().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }), previousValue: account.status, newValue: `active · ${caseId} · ${note.trim()}` }, ...current]);
    return true;
  }, [accounts, can, cases, completeAccountOnboarding, employees, session.label]);

  const createAccount = useCallback((employeeId: string) => {
    if (!can("accounts", "create")) return null;
    const person = employees.find((item) => item.id === employeeId);
    if (!person || person.status === "inactive" || accounts.some((item) => item.employeeId === employeeId)) return null;
    const id = `user-${crypto.randomUUID()}`;
    const next = { ...accountFromEmployee(person, employees, accounts.length + 1), id };
    setAccounts((current) => [...current, next]);
    setTemplates((current) => current.map((template) => template.id === "tpl-employee" ? { ...template, usageCount: template.usageCount + 1 } : template));
    setAuditEvents((current) => [{ id: `audit-${crypto.randomUUID()}`, accountId: id, actor: "System Admin · demo", action: "Tạo tài khoản", timestamp: new Date().toLocaleString("vi-VN"), previousValue: "—", newValue: "Chờ kích hoạt" }, ...current]);
    return id;
  }, [accounts, can, employees]);

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
      setAuditEvents((current) => [{ id: `audit-${crypto.randomUUID()}`, accountId: account.id, actor: session.label, action: "Cập nhật phân quyền", timestamp: demoBusinessNow().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }), previousValue: `${oldTemplates} · ${account.scope.type}`, newValue: `${newTemplates} · ${draft.scope.type}` }, ...current]);
      return null;
    });
  }, [accounts, session.label]);

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
      updatedAt: demoBusinessDate(),
      version: (existing?.version ?? 0) + 1,
      usageCount: existing?.usageCount ?? 0,
    };
    setTemplates((current) => existing ? current.map((item) => item.id === id ? next : item) : [...current, next]);
    setAuditEvents((current) => [{ id: `audit-${crypto.randomUUID()}`, templateId: id, actor: session.label, action: existing ? "Cập nhật mẫu quyền" : "Tạo mẫu quyền", timestamp: demoBusinessNow().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }), previousValue: existing ? `Phiên bản ${existing.version}` : "—", newValue: `Phiên bản ${next.version}` }, ...current]);
    setTemplateDraft(null);
    return id;
  }, [session.label, templateDraft, templates]);

  const cloneTemplate = useCallback((templateId: string) => {
    const source = templates.find((item) => item.id === templateId);
    if (!source) return null;
    const id = `tpl-copy-${Date.now().toString(36)}`;
    setTemplates((current) => [...current, { ...source, id, name: `${source.name} — Bản sao`, code: `${source.code}_COPY`, type: "custom", lockedCodes: [], usageCount: 0, version: 1, updatedAt: demoBusinessDate() }]);
    return id;
  }, [templates]);

  const toggleTemplateStatus = useCallback((templateId: string) => {
    setTemplates((current) => current.map((item) => item.id === templateId && item.type === "custom" ? { ...item, status: item.status === "active" ? "inactive" : "active", updatedAt: demoBusinessDate() } : item));
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

  const value = useMemo<IamContextValue>(() => ({ accounts: visibleAccounts, templates, auditEvents, accessReviews, temporaryDelegations, createAccessReview, decideReviewItem, completeAccessReview, createDelegation, decideDelegation, assignmentDraft, templateDraft, hasUnsavedDraft, updateAccount, createAccount, completeOnboardingAccount, completeOffboardingAccount, resetIamDemo, startAssignment, updateAssignment, discardAssignment, applyAssignment, startTemplateDraft, updateTemplateDraft, discardTemplateDraft, saveTemplateDraft, cloneTemplate, toggleTemplateStatus, effectivePermissions }), [visibleAccounts, templates, auditEvents, accessReviews, temporaryDelegations, createAccessReview, decideReviewItem, completeAccessReview, createDelegation, decideDelegation, assignmentDraft, templateDraft, hasUnsavedDraft, updateAccount, createAccount, completeOnboardingAccount, completeOffboardingAccount, resetIamDemo, startAssignment, updateAssignment, discardAssignment, applyAssignment, startTemplateDraft, updateTemplateDraft, discardTemplateDraft, saveTemplateDraft, cloneTemplate, toggleTemplateStatus, effectivePermissions]);
  return <IamContext.Provider value={value}>{children}</IamContext.Provider>;
}

export function useIam() {
  const context = useContext(IamContext);
  if (!context) throw new Error("useIam must be used inside IamProvider");
  return context;
}
