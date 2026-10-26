"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { hrToday, initialHrState } from "./hr-demo-data";
import type { HrCandidate, HrCase, HrContract, HrEmployee, HrPolicy, HrRequisition, HrState, PunchMethod, TimesheetSnapshot } from "./hr-demo-data";
import { applyOrganizationCommand } from "./organization-model";
import type { OrganizationCommand, OrganizationResult } from "./organization-model";
import type { EffectiveSession } from "@/lib/authorization/types";
import { applyAssetCommand, normalizeAssetHandovers } from "./asset-model";
import type { AssetCommand, AssetResult } from "./asset-model";
import { applyAttendanceConfirmation, applyAttendanceResolution, closeTimesheetPeriod, normalizeAttendanceSnapshot, openTimesheetPeriod, reviewAttendanceExplanation, reopenTimesheetPeriod, submitAttendanceExplanation } from "./attendance-model";
import type { AttendanceCommand, AttendanceConfirmationCommand, AttendanceConfirmationResult, AttendanceExplanationResult, AttendanceResult } from "./attendance-model";
import { demoBusinessDate, demoBusinessNow } from "@/lib/demo-clock";
import { effectiveContractStatus, recordPaperSignature, verifyPaperSignature } from "./contract-model";
import { canCreateEmployee, nextEmployeeId } from "./employee-model";
import { disableIsDue, offboardingChangeBlocker, offboardingInputError } from "./offboarding-model";
import type { OffboardingDetails } from "./offboarding-model";
import { useWfhDemo } from "@/features/wfh/wfh-demo-context";
import { useDemoData } from "@/features/demo/demo-data-context";
import { useSession } from "@/features/session/session-context";
import { canAccessScopedRecord } from "@/lib/authorization/engine";
import { personaEmployeeIds } from "@/lib/authorization/demo-identity";
import { assignProbationReview, decideProbationReview, evaluateProbationReview, saveProbationDraft as saveProbationDraftModel } from "./probation-model";
import type { ProbationResult } from "./probation-model";
import type { ProbationAssessment } from "./probation-template";
import { completeOnboardingAccountTask } from "./onboarding-model";
import { recordSelfPunch } from "./self-punch-model";

type HrContextValue = HrState & {
  createEmployee: (input: Omit<HrEmployee, "id" | "initials">) => string | null;
  updateEmployee: (id: string, patch: Partial<Pick<HrEmployee, "name" | "email" | "employmentType" | "startDate" | "status" | "phone" | "address">>) => void;
  createContract: (input: Omit<HrContract, "id" | "version">) => string;
  markContractSigned: (id: string, evidence: string) => boolean;
  verifyContract: (id: string, actor: string, evidence: string) => boolean;
  applyAssetAction: (command: AssetCommand) => AssetResult;
  resolveAttendance: (command: AttendanceCommand) => AttendanceResult;
  punchAttendance: (kind: "check-in" | "check-out", method?: PunchMethod) => { ok: true } | { ok: false; error: string };
  confirmAttendance: (command: AttendanceConfirmationCommand) => AttendanceConfirmationResult;
  submitAttendanceExplanation: (attendanceId: string, expectedVersion: number, text: string) => AttendanceExplanationResult;
  reviewAttendanceExplanation: (explanationId: string, decision: "confirmed" | "rejected", reason: string) => AttendanceExplanationResult;
  assignProbation: (employeeId: string, dueAt: string, templateId?: string) => ProbationResult;
  saveProbationDraft: (reviewId: string, expectedVersion: number, assessment: ProbationAssessment) => ProbationResult;
  evaluateProbation: (reviewId: string, expectedVersion: number, outcome: "pass" | "fail", evidence: string, assessment?: ProbationAssessment) => ProbationResult;
  decideProbation: (reviewId: string, expectedVersion: number, decision: "activate" | "offboard", reason: string) => ProbationResult;
  openPeriod: (id: string) => boolean;
  closePeriod: (id: string, actor: string, leaveDates: TimesheetSnapshot["leaveDates"]) => boolean;
  reopenPeriod: (id: string, reason: string) => boolean;
  recordExport: (period: string, branch: string, count: number, snapshotVersion: number) => string | null;
  adjustLeave: (employeeId: string, days: number, reason: string) => void;
  createCase: (employeeId: string, kind: HrCase["kind"], details?: OffboardingDetails) => string | null;
  changeOffboarding: (caseId: string, action: "cancel" | "reschedule", reason: string, details?: OffboardingDetails) => boolean;
  completeCaseTask: (caseId: string, taskId: string, note: string) => boolean;
  completeAccountOnboarding: (caseId: string, accountId: string, note: string) => boolean;
  completeAccountOffboarding: (caseId: string, note: string) => boolean;
  savePolicyDraft: (input: Pick<HrPolicy, "group" | "name" | "value" | "scope" | "effectiveAt">) => string;
  publishPolicy: (id: string) => void;
  createRequisition: (input: Omit<HrRequisition, "id" | "createdAt" | "status">) => string;
  createCandidate: (input: Omit<HrCandidate, "id" | "updatedAt" | "stage" | "note">) => string;
  updateCandidate: (id: string, patch: Partial<Pick<HrCandidate, "stage" | "note">>) => void;
  convertCandidate: (id: string) => string | null;
  updateOrganization: (command: OrganizationCommand, session: EffectiveSession) => { ok: true; id: string } | { ok: false; error: string };
  resetHrDemo: () => void;
};

const key = "ohriise-hr-demo-v3";
const HrContext = createContext<HrContextValue | null>(null);
const event = (text: string, employee?: HrEmployee) => ({ id: crypto.randomUUID(), at: demoBusinessNow().toISOString(), employeeId: employee?.id, branch: employee?.branch ?? "Toàn công ty", department: employee?.department ?? "Nhân sự", actor: "HR · phiên demo", text });

export function HrDemoProvider({ children }: { children: React.ReactNode }) {
  const { store: wfhStore } = useWfhDemo();
  const { requests: businessRequests } = useDemoData();
  const { session, can } = useSession();
  const [data, setData] = useState<HrState>(() => {
    if (typeof window === "undefined") return initialHrState;
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        const parsed: HrState = JSON.parse(stored);
        if (Array.isArray(parsed.employees) && Array.isArray(parsed.attendance) && Array.isArray(parsed.contracts) && Array.isArray(parsed.assets)) {
          const legacy = !parsed.organization?.departments || !parsed.organization?.teams || !parsed.organization?.changes;
          if (!legacy) return normalizeHrSnapshot(parsed);
          const departments = [...initialHrState.organization.departments];
          for (const person of parsed.employees) {
            if (!departments.some((item) => item.name === person.department && item.branch === person.branch)) {
              departments.push({ id: `DEPT-MIG-${departments.length + 1}`, code: `MIG-${departments.length + 1}`, name: person.department, branch: person.branch, description: "Đơn vị từ dữ liệu demo trước đây.", status: "active", effectiveAt: hrToday() });
            }
          }
          return normalizeHrSnapshot({ ...parsed, employees: parsed.employees.map((item) => ({ ...item, primaryTeamId: item.primaryTeamId ?? initialHrState.employees.find((seed) => seed.id === item.id)?.primaryTeamId })), organization: { ...initialHrState.organization, departments } });
        }
      }
    } catch { /* Ignore an invalid previous demo snapshot. */ }
    return initialHrState;
  });
  const assetState = useRef(data);
  useEffect(() => { assetState.current = data; }, [data]);
  useEffect(() => { window.localStorage.setItem(key, JSON.stringify(data)); }, [data]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== key || !event.newValue) return;
      try {
        const parsed = normalizeHrSnapshot(JSON.parse(event.newValue) as HrState);
        if (Array.isArray(parsed.employees) && Array.isArray(parsed.contracts)) setData((current) => JSON.stringify(current) === JSON.stringify(parsed) ? current : parsed);
      } catch { /* Preserve the current valid snapshot. */ }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  function createEmployee(input: Omit<HrEmployee, "id" | "initials">) {
    const current = assetState.current;
    if (!canCreateEmployee(current.employees, input)) return null;
    const id = nextEmployeeId(current.employees);
    const initials = input.name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase();
    const employee = { ...input, email: input.email.trim(), id, initials };
    const state = { ...current, employees: [employee, ...current.employees], activities: [event(`Tạo hồ sơ nhân sự ${employee.name}.`, employee), ...current.activities] };
    assetState.current = state; setData(state);
    return id;
  }
  function updateEmployee(id: string, patch: Partial<Pick<HrEmployee, "name" | "email" | "employmentType" | "startDate" | "status" | "phone" | "address">>) {
    if (patch.status === "inactive" && data.employees.find((item) => item.id === id)?.status !== "inactive") return; // Employment end is recorded only by the offboarding account task.
    if (patch.status === "active" && data.employees.find((item) => item.id === id)?.status === "probation" && !data.probationReviews.some((item) => item.employeeId === id && item.status === "activated")) return;
    setData((current) => { const person = current.employees.find((item) => item.id === id); if (!person) return current; return { ...current, employees: current.employees.map((item) => item.id === id ? { ...item, ...patch } : item), activities: [event(`Cập nhật hồ sơ ${person.name}.`, person), ...current.activities] }; });
  }
  function createContract(input: Omit<HrContract, "id" | "version">) {
    const id = `HD-${Date.now().toString(36).toUpperCase()}`;
    setData((current) => { const person = current.employees.find((item) => item.id === input.employeeId); return { ...current, contracts: [{ ...input, id, version: 1 }, ...current.contracts], activities: [event(`Tạo hợp đồng nháp ${id} cho ${person?.name ?? input.employeeId}.`, person), ...current.activities] }; });
    return id;
  }
  function markContractSigned(id: string, evidence: string) {
    const current = assetState.current; const contract = current.contracts.find((item) => item.id === id);
    const changed = contract && recordPaperSignature(contract, evidence, demoBusinessNow().toISOString());
    if (!changed) return false;
    const next = { ...current, contracts: current.contracts.map((item) => item.id === id ? changed : item), activities: [event(`Ghi nhận tham chiếu bản ký giấy ngoài hệ thống cho ${id}.`, current.employees.find((person) => person.id === contract.employeeId)), ...current.activities] };
    assetState.current = next; setData(next); return true;
  }
  function verifyContract(id: string, actor: string, evidence: string) {
    const current = assetState.current; const contract = current.contracts.find((item) => item.id === id);
    const changed = contract && verifyPaperSignature(contract, actor, evidence, demoBusinessNow().toISOString(), hrToday());
    if (!changed) return false;
    const next = { ...current, contracts: current.contracts.map((item) => item.id === id ? changed : item), activities: [event(`Xác minh bản ký giấy ${id}; hiệu lực nghiệp vụ từ ${contract.startsAt}.`, current.employees.find((item) => item.id === contract.employeeId)), ...current.activities] };
    assetState.current = next; setData(next); return true;
  }
  function applyAssetAction(command: AssetCommand): AssetResult {
    const result = applyAssetCommand(assetState.current, command);
    if (!result.ok) return result;
    const person = assetState.current.employees.find((item) => item.id === ("employeeId" in command ? command.employeeId : assetState.current.assets.find((item) => item.id === command.assetId)?.holderId));
    const next = { ...assetState.current, assets: result.assets, assetHandovers: result.assetHandovers, activities: [event(`${result.message} ${command.assetId}`, person), ...assetState.current.activities] };
    assetState.current = next;
    setData(next);
    return result;
  }
  function resolveAttendance(command: AttendanceCommand): AttendanceResult {
    if (!can("attendance-monitoring", "edit")) return { ok: false, error: "Không có quyền đối soát công." };
    const result = applyAttendanceResolution(assetState.current, command);
    if (!result.ok) return result;
    const person = assetState.current.employees.find((item) => item.id === result.adjustment.employeeId);
    const next = { ...assetState.current, ...result.state, activities: [event(`Ngoại lệ công ${result.adjustment.attendanceId}: ${result.adjustment.resolution}. ${result.adjustment.reason}`, person), ...assetState.current.activities] };
    assetState.current = next;
    setData(next);
    return result;
  }
  function punchAttendance(kind: "check-in" | "check-out", method: PunchMethod = "manual"): { ok: true } | { ok: false; error: string } {
    const employeeId = personaEmployeeIds[session.id];
    if (!employeeId || !can("attendance", "create")) return { ok: false, error: "Persona này không được tự điểm danh." };
    const day = demoBusinessDate();
    if (businessRequests.some((item) => item.type === "WFH" && item.employeeId === employeeId && item.date === day && item.status === "approved")) return { ok: false, error: "Ngày này đã có kế hoạch WFH; dùng phiên WFH để ghi công." };
    const current = assetState.current;
    const result = recordSelfPunch(current, { employeeId, kind, at: demoBusinessNow().toISOString(), businessDate: day, method });
    if (!result.ok) return result;
    const person = current.employees.find((item) => item.id === employeeId);
    const methodName = { manual: "thủ công", gps: "GPS", card: "thẻ từ", fingerprint: "vân tay", face: "khuôn mặt" }[method];
    const next = { ...current, attendance: result.state.attendance, selfPunches: result.state.selfPunches, activities: [event(`${kind === "check-in" ? "Check-in" : "Check-out"} mô phỏng bằng ${methodName} ngày ${day}; chưa xác thực vị trí hoặc thiết bị.`, person), ...current.activities] };
    assetState.current = next; setData(next); return { ok: true };
  }
  function confirmAttendance(command: AttendanceConfirmationCommand): AttendanceConfirmationResult {
    if (command.decision === "exception" ? !can("attendance-monitoring", "approve") : command.actorId !== personaEmployeeIds[session.id]) return { ok: false, error: "Không có quyền phản hồi bản ghi công này." };
    const result = applyAttendanceConfirmation(assetState.current, command);
    if (!result.ok) return result;
    const person = assetState.current.employees.find((item) => item.id === result.confirmation.employeeId);
    const next = { ...assetState.current, attendanceConfirmations: result.state.attendanceConfirmations, activities: [event(`Phản hồi công ${command.attendanceId}: ${command.decision}. ${command.reason.trim()}`, person), ...assetState.current.activities] };
    assetState.current = next; setData(next);
    return result;
  }
  function submitAttendanceExplanationAction(attendanceId: string, expectedVersion: number, text: string): AttendanceExplanationResult {
    const actorId = personaEmployeeIds[session.id] ?? "";
    const result = submitAttendanceExplanation(assetState.current, { attendanceId, employeeId: actorId, expectedVersion, actorId, text, at: demoBusinessNow().toISOString() });
    if (!result.ok) return result;
    const person = assetState.current.employees.find((item) => item.id === actorId);
    const next = { ...assetState.current, attendanceExplanations: result.state.attendanceExplanations, activities: [event(`Giải trình công ${attendanceId}: đã gửi cho quản lý trực tiếp.`, person), ...assetState.current.activities] };
    assetState.current = next; setData(next); return result;
  }
  function reviewAttendanceExplanationAction(explanationId: string, decision: "confirmed" | "rejected", reason: string): AttendanceExplanationResult {
    if (!can("team", "view")) return { ok: false, error: "Không có quyền xác nhận giải trình của đội ngũ." };
    const result = reviewAttendanceExplanation(assetState.current, { explanationId, actorId: personaEmployeeIds[session.id] ?? "", decision, reason, at: demoBusinessNow().toISOString() });
    if (!result.ok) return result;
    const person = assetState.current.employees.find((item) => item.id === result.explanation.employeeId);
    const next = { ...assetState.current, attendanceExplanations: result.state.attendanceExplanations, activities: [event(`Quản lý ${decision === "confirmed" ? "xác nhận" : "từ chối"} giải trình công ${result.explanation.attendanceId}. ${reason.trim()}`, person), ...assetState.current.activities] };
    assetState.current = next; setData(next); return result;
  }
  function assignProbation(employeeId: string, dueAt: string, templateId?: string): ProbationResult {
    const current = assetState.current; const person = current.employees.find((item) => item.id === employeeId);
    if (!can("probation", "approve") || !person || !canAccessScopedRecord(session, { employeeId, branch: person.branch, department: person.department })) return { ok: false, error: "Chỉ HR phụ trách mới được giao đánh giá trong phạm vi này." };
    const result = assignProbationReview(current, { employeeId, dueAt, templateId, actorId: personaEmployeeIds[session.id] ?? `demo-persona:${session.id}`, actor: session.label, at: demoBusinessNow().toISOString(), businessDate: demoBusinessDate() });
    if (!result.ok) return result;
    const next = { ...current, probationReviews: result.state.probationReviews, activities: [event(`Giao đánh giá thử việc ${result.review.id} cho quản lý ${result.review.managerId}.`, person), ...current.activities] };
    assetState.current = next; setData(next); return result;
  }
  function saveProbationDraft(reviewId: string, expectedVersion: number, assessment: ProbationAssessment): ProbationResult {
    if (!can("probation", "edit")) return { ok: false, error: "Không có quyền lưu đánh giá thử việc." };
    const current = assetState.current;
    const result = saveProbationDraftModel(current, { reviewId, expectedVersion, actorId: personaEmployeeIds[session.id] ?? "", assessment });
    if (!result.ok) return result;
    const next = { ...current, probationReviews: result.state.probationReviews };
    assetState.current = next; setData(next); return result;
  }
  function evaluateProbation(reviewId: string, expectedVersion: number, outcome: "pass" | "fail", evidence: string, assessment?: ProbationAssessment): ProbationResult {
    if (!can("probation", "edit")) return { ok: false, error: "Không có quyền đánh giá thử việc." };
    const current = assetState.current; const result = evaluateProbationReview(current, { reviewId, expectedVersion, actorId: personaEmployeeIds[session.id] ?? "", outcome, evidence, assessment, at: demoBusinessNow().toISOString() });
    if (!result.ok) return result;
    const person = current.employees.find((item) => item.id === result.review.employeeId);
    const next = { ...current, probationReviews: result.state.probationReviews, activities: [event(`Quản lý nộp đánh giá thử việc ${reviewId}: ${outcome}.`, person), ...current.activities] };
    assetState.current = next; setData(next); return result;
  }
  function decideProbation(reviewId: string, expectedVersion: number, decision: "activate" | "offboard", reason: string): ProbationResult {
    const current = assetState.current; const review = current.probationReviews.find((item) => item.id === reviewId); const person = current.employees.find((item) => item.id === review?.employeeId);
    if (!can("probation", "approve") || !person || !canAccessScopedRecord(session, { employeeId: person.id, branch: person.branch, department: person.department })) return { ok: false, error: "Không có quyền quyết định trong phạm vi này." };
    const result = decideProbationReview(current, { reviewId, expectedVersion, actorId: personaEmployeeIds[session.id] ?? `demo-persona:${session.id}`, actor: session.label, decision, reason, at: demoBusinessNow().toISOString(), businessDate: demoBusinessDate() });
    if (!result.ok) return result;
    const next = { ...current, employees: result.state.employees, probationReviews: result.state.probationReviews, activities: [event(`HR quyết định thử việc ${reviewId}: ${decision}. ${reason.trim()}`, person), ...current.activities] };
    assetState.current = next; setData(next); return result;
  }
  function openPeriod(id: string) {
    if (!can("timesheets", "approve") || session.effectiveScope !== "company") return false;
    const result = openTimesheetPeriod(assetState.current.periods, id);
    if (!result.ok) return false;
    const next = { ...assetState.current, periods: result.periods, activities: [event(`Mở kỳ công ${id} để đối soát.`), ...assetState.current.activities] };
    assetState.current = next; setData(next); return true;
  }
  function closePeriod(id: string, actor: string, leaveDates: TimesheetSnapshot["leaveDates"]) {
    if (!can("timesheets", "approve") || session.effectiveScope !== "company") return false;
    const result = closeTimesheetPeriod(assetState.current, id, actor, demoBusinessNow().toISOString(), demoBusinessDate(), leaveDates, wfhStore.sessions, businessRequests);
    if (!result.ok) return false;
    const next = { ...assetState.current, periods: result.periods, activities: [event(`Chốt kỳ công ${id} v${result.snapshot?.version}; snapshot ${result.snapshot?.rows.length} bản ghi.`, undefined), ...assetState.current.activities] };
    assetState.current = next;
    setData(next);
    return true;
  }
  function reopenPeriod(id: string, reason: string) {
    if (!can("timesheets", "approve") || session.effectiveScope !== "company") return false;
    const result = reopenTimesheetPeriod(assetState.current.periods, id, reason);
    if (!result.ok) return false;
    const next = { ...assetState.current, periods: result.periods, activities: [event(`Mở lại kỳ công ${id}: ${reason.trim()}`), ...assetState.current.activities] };
    assetState.current = next;
    setData(next);
    return true;
  }
  function recordExport(period: string, branch: string, count: number, snapshotVersion: number) {
    if (!can("timesheets", "export") || (session.effectiveScope === "branch" && branch !== session.branch)) return null;
    const currentPeriod = assetState.current.periods.find((item) => item.id === period);
    const snapshot = currentPeriod?.snapshots?.at(-1);
    const snapshotPeople = new Set([...(snapshot?.rows ?? []).map((item) => item.employeeId), ...(snapshot?.leaveDates ?? []).map((item) => item.employeeId), ...(snapshot?.wfhDays ?? []).map((item) => item.employeeId)]);
    if (!snapshot || snapshot.version !== snapshotVersion || !["closed", "exported"].includes(currentPeriod?.status ?? "") || count < 0 || count > snapshotPeople.size) return null;
    const id = `EXP-DEMO-${Date.now().toString(36).toUpperCase()}`;
    const next: HrState = { ...assetState.current, exports: [{ id, period, branch, at: demoBusinessNow().toISOString(), count, status: "exported", errors: 0, snapshotVersion }, ...assetState.current.exports], periods: assetState.current.periods.map((item) => item.id === period ? { ...item, status: "exported" } : item), activities: [event(`Xuất CSV nội bộ ${count} nhân sự kỳ ${period} v${snapshotVersion} (${branch}); chưa truyền sang MISA.`), ...assetState.current.activities] };
    assetState.current = next;
    setData(next);
    return id;
  }
  function adjustLeave(employeeId: string, days: number, reason: string) {
    if (!reason.trim() || days === 0) return;
    setData((current) => { const person = current.employees.find((item) => item.id === employeeId); if (!person) return current; return { ...current, leaveAdjustments: { ...current.leaveAdjustments, [employeeId]: (current.leaveAdjustments[employeeId] ?? 0) + days }, activities: [event(`Điều chỉnh ${days > 0 ? "+" : ""}${days} ngày phép cho ${person.name}: ${reason.trim()}`, person), ...current.activities] }; });
  }
  function createCase(employeeId: string, kind: HrCase["kind"], details?: OffboardingDetails) {
    const current = assetState.current;
    const person = current.employees.find((item) => item.id === employeeId);
    if (!person || person.status === "inactive" || current.cases.some((item) => item.employeeId === employeeId && item.kind === kind && !item.completedAt && !item.cancelledAt)) return null;
    if (kind === "offboarding" && (!details || offboardingInputError(details, hrToday()))) return null;
    const id = `${kind === "onboarding" ? "ON" : "OFF"}-${Date.now().toString(36).toUpperCase()}`;
    const ownerTasks = kind === "onboarding" ? [["profile", "Xác nhận hồ sơ và cơ cấu", "HR"], ["contract", "Xác minh hợp đồng", "HR"], ["account", "Cấp tài khoản và quyền cơ bản", "System Admin"], ["leave", "Thiết lập phép và ca làm", "HR"], ["asset", "Bàn giao tài sản", "IT"]] : [["documents", "Xác nhận hồ sơ thôi việc", "HR"], ["handover", "Bàn giao công việc", "Quản lý trực tiếp"], ["asset", "Thu hồi tài sản", "IT"], ["account", "Phối hợp khóa tài khoản", "System Admin"]];
    const next: HrCase = { id, employeeId, kind, startedAt: hrToday(), ...(kind === "offboarding" && details ? { ...details, disableAt: new Date(details.disableAt).toISOString(), reason: details.reason.trim(), sourceReference: details.sourceReference.trim() } : {}), tasks: ownerTasks.map(([taskId, label, owner]) => ({ id: taskId, label, owner, deadline: details?.lastWorkingDay || hrToday() })) };
    const state = { ...current, cases: [next, ...current.cases], probationReviews: kind === "offboarding" ? current.probationReviews.map((item) => item.employeeId === employeeId && item.status === "offboarding-required" ? { ...item, status: "offboarding-started" as const, offboardingCaseId: id, version: item.version + 1 } : item) : current.probationReviews, activities: [event(`Khởi tạo ${kind} ${id}.`, person), ...current.activities] };
    assetState.current = state; setData(state);
    return id;
  }
  function changeOffboarding(caseId: string, action: "cancel" | "reschedule", reason: string, details?: OffboardingDetails) {
    const current = assetState.current;
    const selected = current.cases.find((item) => item.id === caseId);
    if (!selected || offboardingChangeBlocker(selected) || reason.trim().length < 8 || (action === "reschedule" && (!details || offboardingInputError(details, hrToday())))) return false;
    const timestamp = demoBusinessNow().toISOString();
    const updated: HrCase = action === "cancel" ? { ...selected, cancelledAt: timestamp, cancelReason: reason.trim() } : { ...selected, ...details, disableAt: new Date(details!.disableAt).toISOString(), reason: details!.reason.trim(), sourceReference: details!.sourceReference.trim(), tasks: selected.tasks.map((task) => ({ ...task, deadline: details!.lastWorkingDay })) };
    const person = current.employees.find((item) => item.id === selected.employeeId);
    const state = { ...current, cases: current.cases.map((item) => item.id === caseId ? updated : item), probationReviews: action === "cancel" ? current.probationReviews.map((item) => item.offboardingCaseId === caseId ? { ...item, status: "offboarding-required" as const, offboardingCaseId: undefined, version: item.version + 1 } : item) : current.probationReviews, activities: [event(`Offboarding ${caseId}: ${action === "cancel" ? "hủy" : "đổi lịch"}. ${reason.trim()}`, person), ...current.activities] };
    assetState.current = state; setData(state); return true;
  }
  function completeCaseTask(caseId: string, taskId: string, note: string) {
    const current = assetState.current;
    const selected = current.cases.find((item) => item.id === caseId); if (!selected || !note.trim() || selected.completedAt || selected.cancelledAt) return false;
    if (taskId === "account") return false; // Only the Admin account workflow records the result.
    if (taskId === "contract" && !current.contracts.some((item) => item.employeeId === selected.employeeId && effectiveContractStatus(item, hrToday()) === "active")) return false;
    if (taskId === "asset" && (selected.kind === "onboarding" ? !current.assets.some((item) => item.holderId === selected.employeeId && item.status === "assigned" && current.assetHandovers.some((entry) => entry.assetId === item.id && entry.employeeId === selected.employeeId && entry.acknowledgedAt && !entry.returnedAt)) : current.assets.some((item) => item.holderId === selected.employeeId))) return false;
    if (!selected.tasks.some((task) => task.id === taskId && !task.doneAt)) return false;
    const timestamp = demoBusinessNow().toISOString();
    const person = current.employees.find((item) => item.id === selected.employeeId);
    const cases = current.cases.map((item) => { if (item.id !== caseId) return item; const tasks = item.tasks.map((task) => task.id === taskId ? { ...task, doneAt: timestamp, note: note.trim() } : task); return { ...item, tasks, completedAt: tasks.every((task) => task.doneAt) ? timestamp : undefined }; });
    const doneCase = cases.find((item) => item.id === caseId);
    const state = { ...current, cases, employees: selected.kind === "offboarding" && doneCase?.completedAt ? current.employees.map((item) => item.id === selected.employeeId ? { ...item, status: "inactive" as const } : item) : current.employees, activities: [event(`${selected.kind === "onboarding" ? "Onboarding" : "Offboarding"} ${caseId}: hoàn tất ${taskId}. ${note.trim()}`, person), ...current.activities] };
    assetState.current = state; setData(state);
    return true;
  }
  function completeAccountOffboarding(caseId: string, note: string) {
    const current = assetState.current;
    const selected = current.cases.find((item) => item.id === caseId && item.kind === "offboarding" && !item.completedAt && !item.cancelledAt);
    if (!selected || !disableIsDue(selected, demoBusinessNow().toISOString()) || note.trim().length < 8 || selected.tasks.some((task) => task.id !== "account" && !task.doneAt) || current.assets.some((asset) => asset.holderId === selected.employeeId)) return false;
    const accountTask = selected.tasks.find((task) => task.id === "account");
    if (!accountTask || accountTask.doneAt) return false;
    const timestamp = demoBusinessNow().toISOString();
    const state = { ...current, cases: current.cases.map((item) => item.id !== caseId ? item : { ...item, tasks: item.tasks.map((task) => task.id === "account" ? { ...task, doneAt: timestamp, note: note.trim() } : task), completedAt: timestamp }), employees: current.employees.map((item) => item.id === selected.employeeId ? { ...item, status: "inactive" as const } : item), activities: [event(`Offboarding ${caseId}: Admin xác nhận vô hiệu hóa tài khoản. ${note.trim()}`, current.employees.find((item) => item.id === selected.employeeId)), ...current.activities] };
    assetState.current = state; setData(state);
    return true;
  }
  function completeAccountOnboarding(caseId: string, accountId: string, note: string) {
    const current = assetState.current;
    const selected = current.cases.find((item) => item.id === caseId);
    const person = current.employees.find((item) => item.id === selected?.employeeId);
    const result = completeOnboardingAccountTask(current, { caseId, employeeId: selected?.employeeId ?? "", accountId, actorId: `demo-admin:${session.id}`, note, at: demoBusinessNow().toISOString() });
    if (!result.ok) return false;
    const next = { ...current, cases: result.state.cases, activities: [event(`Onboarding ${caseId}: Admin kích hoạt tài khoản ${accountId}. ${note.trim()}`, person), ...current.activities] };
    assetState.current = next; setData(next); return true;
  }
  function savePolicyDraft(input: Pick<HrPolicy, "group" | "name" | "value" | "scope" | "effectiveAt">) {
    const versions = data.policies.filter((item) => item.group === input.group && item.name === input.name);
    const version = Math.max(0, ...versions.map((item) => item.version)) + 1;
    const id = `POL-${Date.now().toString(36).toUpperCase()}`;
    setData((current) => ({ ...current, policies: [{ ...input, id, version, status: "draft", updatedAt: hrToday() }, ...current.policies], activities: [event(`Lưu bản nháp chính sách ${input.name} v${version}.`), ...current.activities] }));
    return id;
  }
  function publishPolicy(id: string) {
    setData((current) => { const target = current.policies.find((item) => item.id === id); if (!target || target.status !== "draft") return current; const scheduled = target.effectiveAt > hrToday(); return { ...current, policies: current.policies.map((item) => item.id === id ? { ...item, status: scheduled ? "scheduled" : "active" } : !scheduled && item.group === target.group && item.name === target.name && item.status === "active" ? { ...item, status: "retired" } : item), activities: [event(`${scheduled ? "Lên lịch" : "Áp dụng"} chính sách ${target.name} v${target.version} từ ${target.effectiveAt}; dữ liệu lịch sử không đổi.`), ...current.activities] }; });
  }
  function createRequisition(input: Omit<HrRequisition, "id" | "createdAt" | "status">) {
    const id = `REQ-${Date.now().toString(36).toUpperCase()}`;
    setData((current) => ({ ...current, requisitions: [{ ...input, id, createdAt: hrToday(), status: "open" }, ...current.requisitions], activities: [event(`Tạo vị trí tuyển dụng ${id}: ${input.title}.`), ...current.activities] }));
    return id;
  }
  function createCandidate(input: Omit<HrCandidate, "id" | "updatedAt" | "stage" | "note">) {
    const id = `CV-${Date.now().toString(36).toUpperCase()}`;
    setData((current) => ({ ...current, candidates: [{ ...input, id, updatedAt: hrToday(), stage: "new", note: "" }, ...current.candidates], activities: [event(`Tiếp nhận ứng viên ${input.name} cho ${input.requisitionId}.`), ...current.activities] }));
    return id;
  }
  function updateCandidate(id: string, patch: Partial<Pick<HrCandidate, "stage" | "note">>) {
    setData((current) => { const candidate = current.candidates.find((item) => item.id === id); if (!candidate) return current; return { ...current, candidates: current.candidates.map((item) => item.id === id ? { ...item, ...patch, updatedAt: hrToday() } : item), activities: [event(`Cập nhật ứng viên ${candidate.name}: ${patch.stage ?? "ghi chú HR"}.`), ...current.activities] }; });
  }
  function convertCandidate(id: string) {
    const snapshot = assetState.current;
    const candidate = snapshot.candidates.find((item) => item.id === id); const requisition = snapshot.requisitions.find((item) => item.id === candidate?.requisitionId);
    if (!candidate || !requisition || candidate.stage !== "offer" || candidate.employeeId || snapshot.employees.some((item) => item.email.toLowerCase() === candidate.email.toLowerCase())) return null;
    const employeeId = nextEmployeeId(snapshot.employees); const person: HrEmployee = { id: employeeId, name: candidate.name, initials: candidate.name.trim().split(/\s+/).slice(-2).map((item) => item[0]).join("").toUpperCase(), email: candidate.email, branch: requisition.branch, department: requisition.department, position: requisition.title, employmentType: "Toàn thời gian", startDate: hrToday(), status: "probation", phone: "", address: "" };
    const current = assetState.current;
    const state = { ...current, employees: [person, ...current.employees], candidates: current.candidates.map((item) => item.id === id ? { ...item, stage: "hired" as const, employeeId, updatedAt: hrToday() } : item), activities: [event(`Chuyển ứng viên ${candidate.name} thành hồ sơ ${employeeId}; cần tiếp tục onboarding.`, person), ...current.activities] };
    assetState.current = state; setData(state);
    return employeeId;
  }
  function updateOrganization(command: OrganizationCommand, session: EffectiveSession) {
    const result: OrganizationResult = applyOrganizationCommand(data, command, session);
    if (!result.ok) return { ok: false as const, error: result.error };
    setData(result.state);
    return { ok: true as const, id: result.id };
  }
  function resetHrDemo() { assetState.current = initialHrState; setData(initialHrState); }

  return <HrContext.Provider value={{ ...data, createEmployee, updateEmployee, createContract, markContractSigned, verifyContract, applyAssetAction, resolveAttendance, punchAttendance, confirmAttendance, submitAttendanceExplanation: submitAttendanceExplanationAction, reviewAttendanceExplanation: reviewAttendanceExplanationAction, assignProbation, saveProbationDraft, evaluateProbation, decideProbation, openPeriod, closePeriod, reopenPeriod, recordExport, adjustLeave, createCase, changeOffboarding, completeCaseTask, completeAccountOnboarding, completeAccountOffboarding, savePolicyDraft, publishPolicy, createRequisition, createCandidate, updateCandidate, convertCandidate, updateOrganization, resetHrDemo }}>{children}</HrContext.Provider>;
}

export function useHrDemo() { const context = useContext(HrContext); if (!context) throw new Error("useHrDemo must be used inside HrDemoProvider"); return context; }

function normalizeHrSnapshot(snapshot: HrState): HrState {
  const addedPeople = initialHrState.employees.filter((item) => ["OH-0001", "OH-0301", "OH-0302"].includes(item.id) && !snapshot.employees.some((person) => person.id === item.id));
  const baseReview = initialHrState.probationReviews[0];
  const needsReview = snapshot.employees.some((item) => item.id === baseReview.employeeId && item.status === "probation") && !snapshot.probationReviews?.some((item) => item.employeeId === baseReview.employeeId);
  return {
    ...snapshot,
    employees: [...snapshot.employees.map((item) => item.employmentType === "Thử việc" ? { ...item, employmentType: "Toàn thời gian" } : item), ...addedPeople],
    assetHandovers: normalizeAssetHandovers(snapshot.assets, snapshot.assetHandovers),
    ...normalizeAttendanceSnapshot(snapshot),
    shiftAssignments: [...(snapshot.shiftAssignments ?? []), ...initialHrState.shiftAssignments.filter((seed) => !(snapshot.shiftAssignments ?? []).some((item) => item.id === seed.id))],
    selfPunches: Array.isArray(snapshot.selfPunches) ? snapshot.selfPunches : [],
    probationReviews: [...(Array.isArray(snapshot.probationReviews) ? snapshot.probationReviews : []), ...(needsReview ? [baseReview] : [])],
    organization: { ...snapshot.organization, teams: snapshot.organization.teams.map((team) => team.id === "TEAM-DP" ? { ...team, memberIds: [...new Set([...team.memberIds, ...addedPeople.filter((person) => person.primaryTeamId === team.id).map((person) => person.id)])] } : team) },
    contracts: snapshot.contracts.map((item) => item.type === "Không xác định thời hạn" ? { ...item, endsAt: null } : item),
    policies: snapshot.policies.map((item) => item.status === "active" && item.effectiveAt > hrToday() ? { ...item, status: "scheduled" } : item),
  };
}
