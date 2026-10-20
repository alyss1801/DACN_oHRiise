"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { hrToday, initialHrState } from "./hr-demo-data";
import type { HrAttendance, HrCandidate, HrCase, HrContract, HrEmployee, HrPolicy, HrRequisition, HrState } from "./hr-demo-data";

type HrContextValue = HrState & {
  createEmployee: (input: Omit<HrEmployee, "id" | "initials">) => string;
  updateEmployee: (id: string, patch: Partial<HrEmployee>) => void;
  createContract: (input: Omit<HrContract, "id" | "version">) => string;
  markContractSigned: (id: string) => void;
  verifyContract: (id: string) => void;
  assignAsset: (assetId: string, employeeId: string, condition: string) => void;
  returnAsset: (assetId: string, condition: string) => void;
  transferAsset: (assetId: string, employeeId: string, condition: string) => void;
  resolveAttendance: (id: string, resolution: HrAttendance["resolution"], reason: string, correctionIn?: string, correctionOut?: string) => void;
  closePeriod: (id: string, actor: string) => boolean;
  reopenPeriod: (id: string, reason: string) => void;
  recordExport: (period: string, branch: string, count: number) => string;
  adjustLeave: (employeeId: string, days: number, reason: string) => void;
  createCase: (employeeId: string, kind: HrCase["kind"], lastWorkingDay?: string) => string;
  completeCaseTask: (caseId: string, taskId: string, note: string) => boolean;
  savePolicyDraft: (input: Pick<HrPolicy, "group" | "name" | "value" | "scope" | "effectiveAt">) => string;
  publishPolicy: (id: string) => void;
  createRequisition: (input: Omit<HrRequisition, "id" | "createdAt" | "status">) => string;
  createCandidate: (input: Omit<HrCandidate, "id" | "updatedAt" | "stage" | "note">) => string;
  updateCandidate: (id: string, patch: Partial<Pick<HrCandidate, "stage" | "note">>) => void;
  convertCandidate: (id: string) => string | null;
  resetHrDemo: () => void;
};

const key = "ohriise-hr-demo-v3";
const HrContext = createContext<HrContextValue | null>(null);
const event = (text: string, employee?: HrEmployee) => ({ id: crypto.randomUUID(), at: new Date().toISOString(), employeeId: employee?.id, branch: employee?.branch ?? "Toàn công ty", department: employee?.department ?? "Nhân sự", actor: "HR · phiên demo", text });

export function HrDemoProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<HrState>(() => {
    if (typeof window === "undefined") return initialHrState;
    try { const stored = window.localStorage.getItem(key); if (stored) { const parsed: HrState = JSON.parse(stored); if (Array.isArray(parsed.employees) && Array.isArray(parsed.attendance) && Array.isArray(parsed.contracts) && Array.isArray(parsed.assets)) return parsed; } } catch { /* Ignore an invalid previous demo snapshot. */ }
    return initialHrState;
  });
  useEffect(() => { window.localStorage.setItem(key, JSON.stringify(data)); }, [data]);

  function createEmployee(input: Omit<HrEmployee, "id" | "initials">) {
    const id = `OH-${String(Date.now()).slice(-5)}`;
    const initials = input.name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase();
    const employee = { ...input, id, initials };
    setData((current) => ({ ...current, employees: [employee, ...current.employees], activities: [event(`Tạo hồ sơ nhân sự ${employee.name}.`, employee), ...current.activities] }));
    return id;
  }
  function updateEmployee(id: string, patch: Partial<HrEmployee>) {
    setData((current) => { const person = current.employees.find((item) => item.id === id); if (!person) return current; return { ...current, employees: current.employees.map((item) => item.id === id ? { ...item, ...patch } : item), activities: [event(`Cập nhật hồ sơ ${person.name}.`, person), ...current.activities] }; });
  }
  function createContract(input: Omit<HrContract, "id" | "version">) {
    const id = `HD-${Date.now().toString(36).toUpperCase()}`;
    setData((current) => { const person = current.employees.find((item) => item.id === input.employeeId); return { ...current, contracts: [{ ...input, id, version: 1 }, ...current.contracts], activities: [event(`Tạo hợp đồng nháp ${id} cho ${person?.name ?? input.employeeId}.`, person), ...current.activities] }; });
    return id;
  }
  function markContractSigned(id: string) { setData((current) => { const contract = current.contracts.find((item) => item.id === id); if (!contract || contract.status !== "draft") return current; return { ...current, contracts: current.contracts.map((item) => item.id === id ? { ...item, document: "paper-signed" } : item), activities: [event(`Ghi nhận bản ký giấy ngoài hệ thống cho ${id}.`, current.employees.find((person) => person.id === contract.employeeId)), ...current.activities] }; }); }
  function verifyContract(id: string) {
    setData((current) => { const contract = current.contracts.find((item) => item.id === id); if (!contract || contract.document === "missing") return current; const person = current.employees.find((item) => item.id === contract.employeeId); return { ...current, contracts: current.contracts.map((item) => item.id === id ? { ...item, document: "verified", status: "active" } : item), activities: [event(`Xác minh bản ký giấy và kích hoạt ${id}.`, person), ...current.activities] }; });
  }
  function assignAsset(assetId: string, employeeId: string, condition: string) {
    setData((current) => { const asset = current.assets.find((item) => item.id === assetId); const person = current.employees.find((item) => item.id === employeeId); if (!asset || asset.status !== "available" || !person) return current; return { ...current, assets: current.assets.map((item) => item.id === assetId ? { ...item, holderId: employeeId, assignedAt: hrToday(), condition, branch: person.branch, status: "assigned" } : item), activities: [event(`Cấp tài sản ${assetId} cho ${person.name}; tình trạng: ${condition}.`, person), ...current.activities] }; });
  }
  function returnAsset(assetId: string, condition: string) {
    setData((current) => { const asset = current.assets.find((item) => item.id === assetId); if (!asset || asset.status !== "assigned") return current; const person = current.employees.find((item) => item.id === asset.holderId); return { ...current, assets: current.assets.map((item) => item.id === assetId ? { ...item, holderId: undefined, assignedAt: undefined, condition, status: "available" } : item), activities: [event(`Thu hồi tài sản ${assetId} từ ${person?.name ?? "nhân sự"}; tình trạng: ${condition}.`, person), ...current.activities] }; });
  }
  function transferAsset(assetId: string, employeeId: string, condition: string) {
    setData((current) => { const asset = current.assets.find((item) => item.id === assetId); const next = current.employees.find((item) => item.id === employeeId); const previous = current.employees.find((item) => item.id === asset?.holderId); if (!asset || asset.status !== "assigned" || !next || next.id === asset.holderId) return current; return { ...current, assets: current.assets.map((item) => item.id === assetId ? { ...item, holderId: employeeId, assignedAt: hrToday(), condition, branch: next.branch } : item), activities: [event(`Chuyển giao tài sản ${assetId} từ ${previous?.name ?? "nhân sự"} sang ${next.name}; tình trạng: ${condition}.`, next), ...current.activities] }; });
  }
  function resolveAttendance(id: string, resolution: HrAttendance["resolution"], reason: string, correctionIn?: string, correctionOut?: string) {
    setData((current) => { const row = current.attendance.find((item) => item.id === id); if (!row || row.issue === "none" || !reason.trim()) return current; const person = current.employees.find((item) => item.id === row.employeeId); return { ...current, attendance: current.attendance.map((item) => item.id === id ? { ...item, resolution, reason: reason.trim(), correctionIn, correctionOut } : item), activities: [event(`${resolution === "approved" ? "Chấp nhận" : resolution === "rejected" ? "Từ chối" : "Yêu cầu giải trình"} ngoại lệ công ${row.date} của ${person?.name ?? row.employeeId}: ${reason.trim()}`, person), ...current.activities] }; });
  }
  function closePeriod(id: string, actor: string) {
    if (data.attendance.some((item) => item.date.startsWith(id) && item.issue !== "none" && item.resolution !== "approved")) return false;
    setData((current) => ({ ...current, periods: current.periods.map((item) => item.id === id ? { ...item, status: "closed", closedAt: hrToday(), closedBy: actor } : item), activities: [event(`Chốt kỳ công ${id} sau đối soát ngoại lệ.`), ...current.activities] }));
    return true;
  }
  function reopenPeriod(id: string, reason: string) {
    if (!reason.trim()) return;
    setData((current) => ({ ...current, periods: current.periods.map((item) => item.id === id && item.status !== "reconciling" ? { ...item, status: "reconciling", reopenReason: reason.trim() } : item), activities: [event(`Mở lại kỳ công ${id}: ${reason.trim()}`), ...current.activities] }));
  }
  function recordExport(period: string, branch: string, count: number) {
    const id = `EXP-DEMO-${Date.now().toString(36).toUpperCase()}`;
    setData((current) => ({ ...current, exports: [{ id, period, branch, at: new Date().toISOString(), count, status: "exported", errors: 0 }, ...current.exports], periods: current.periods.map((item) => item.id === period ? { ...item, status: "exported" } : item), activities: [event(`Xuất ${count} bản ghi công kỳ ${period} (${branch}); chưa truyền sang MISA.`), ...current.activities] }));
    return id;
  }
  function adjustLeave(employeeId: string, days: number, reason: string) {
    if (!reason.trim() || days === 0) return;
    setData((current) => { const person = current.employees.find((item) => item.id === employeeId); if (!person) return current; return { ...current, leaveAdjustments: { ...current.leaveAdjustments, [employeeId]: (current.leaveAdjustments[employeeId] ?? 0) + days }, activities: [event(`Điều chỉnh ${days > 0 ? "+" : ""}${days} ngày phép cho ${person.name}: ${reason.trim()}`, person), ...current.activities] }; });
  }
  function createCase(employeeId: string, kind: HrCase["kind"], lastWorkingDay?: string) {
    const id = `${kind === "onboarding" ? "ON" : "OFF"}-${Date.now().toString(36).toUpperCase()}`;
    const ownerTasks = kind === "onboarding" ? [["profile", "Xác nhận hồ sơ và cơ cấu", "HR"], ["contract", "Xác minh hợp đồng", "HR"], ["account", "Cấp tài khoản và quyền cơ bản", "System Admin"], ["leave", "Thiết lập phép và ca làm", "HR"], ["asset", "Bàn giao tài sản", "IT"]] : [["documents", "Xác nhận hồ sơ thôi việc", "HR"], ["handover", "Bàn giao công việc", "Quản lý trực tiếp"], ["asset", "Thu hồi tài sản", "IT"], ["account", "Phối hợp khóa tài khoản", "System Admin"]];
    const next: HrCase = { id, employeeId, kind, startedAt: hrToday(), lastWorkingDay, tasks: ownerTasks.map(([taskId, label, owner]) => ({ id: taskId, label, owner, deadline: lastWorkingDay || hrToday() })) };
    setData((current) => ({ ...current, cases: [next, ...current.cases], activities: [event(`Khởi tạo ${kind} ${id}.`, current.employees.find((item) => item.id === employeeId)), ...current.activities] }));
    return id;
  }
  function completeCaseTask(caseId: string, taskId: string, note: string) {
    const selected = data.cases.find((item) => item.id === caseId); if (!selected || !note.trim() || selected.completedAt) return false;
    if (taskId === "contract" && !data.contracts.some((item) => item.employeeId === selected.employeeId && item.status === "active" && item.document === "verified")) return false;
    if (taskId === "asset" && (selected.kind === "onboarding" ? !data.assets.some((item) => item.holderId === selected.employeeId) : data.assets.some((item) => item.holderId === selected.employeeId))) return false;
    if (taskId === "account" && selected.kind === "offboarding" && ((selected.lastWorkingDay ?? "9999") > hrToday() || selected.tasks.some((task) => task.id !== "account" && !task.doneAt))) return false;
    if (!selected.tasks.some((task) => task.id === taskId && !task.doneAt)) return false;
    setData((current) => { const person = current.employees.find((item) => item.id === selected.employeeId); const cases = current.cases.map((item) => { if (item.id !== caseId) return item; const tasks = item.tasks.map((task) => task.id === taskId ? { ...task, doneAt: new Date().toISOString(), note: note.trim() } : task); return { ...item, tasks, completedAt: tasks.every((task) => task.doneAt) ? new Date().toISOString() : undefined }; }); const doneCase = cases.find((item) => item.id === caseId); return { ...current, cases, employees: selected.kind === "offboarding" && doneCase?.completedAt ? current.employees.map((item) => item.id === selected.employeeId ? { ...item, status: "inactive" as const } : item) : current.employees, activities: [event(`${selected.kind === "onboarding" ? "Onboarding" : "Offboarding"} ${caseId}: hoàn tất ${taskId}. ${note.trim()}`, person), ...current.activities] }; });
    return true;
  }
  function savePolicyDraft(input: Pick<HrPolicy, "group" | "name" | "value" | "scope" | "effectiveAt">) {
    const versions = data.policies.filter((item) => item.group === input.group && item.name === input.name);
    const version = Math.max(0, ...versions.map((item) => item.version)) + 1;
    const id = `POL-${Date.now().toString(36).toUpperCase()}`;
    setData((current) => ({ ...current, policies: [{ ...input, id, version, status: "draft", updatedAt: hrToday() }, ...current.policies], activities: [event(`Lưu bản nháp chính sách ${input.name} v${version}.`), ...current.activities] }));
    return id;
  }
  function publishPolicy(id: string) {
    setData((current) => { const target = current.policies.find((item) => item.id === id); if (!target || target.status !== "draft") return current; return { ...current, policies: current.policies.map((item) => item.id === id ? { ...item, status: "active" } : item.group === target.group && item.name === target.name && item.status === "active" ? { ...item, status: "retired" } : item), activities: [event(`Áp dụng chính sách ${target.name} v${target.version} từ ${target.effectiveAt}; dữ liệu lịch sử không đổi.`), ...current.activities] }; });
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
    const candidate = data.candidates.find((item) => item.id === id); const requisition = data.requisitions.find((item) => item.id === candidate?.requisitionId);
    if (!candidate || !requisition || candidate.stage !== "offer" || candidate.employeeId || data.employees.some((item) => item.email.toLowerCase() === candidate.email.toLowerCase())) return null;
    const employeeId = `OH-${String(Date.now()).slice(-5)}`; const person: HrEmployee = { id: employeeId, name: candidate.name, initials: candidate.name.trim().split(/\s+/).slice(-2).map((item) => item[0]).join("").toUpperCase(), email: candidate.email, branch: requisition.branch, department: requisition.department, position: requisition.title, employmentType: "Thử việc", startDate: hrToday(), status: "probation", phone: "", address: "" };
    setData((current) => ({ ...current, employees: [person, ...current.employees], candidates: current.candidates.map((item) => item.id === id ? { ...item, stage: "hired", employeeId, updatedAt: hrToday() } : item), activities: [event(`Chuyển ứng viên ${candidate.name} thành hồ sơ ${employeeId}; cần tiếp tục onboarding.`, person), ...current.activities] }));
    return employeeId;
  }
  function resetHrDemo() { setData(initialHrState); }

  return <HrContext.Provider value={{ ...data, createEmployee, updateEmployee, createContract, markContractSigned, verifyContract, assignAsset, returnAsset, transferAsset, resolveAttendance, closePeriod, reopenPeriod, recordExport, adjustLeave, createCase, completeCaseTask, savePolicyDraft, publishPolicy, createRequisition, createCandidate, updateCandidate, convertCandidate, resetHrDemo }}>{children}</HrContext.Provider>;
}

export function useHrDemo() { const context = useContext(HrContext); if (!context) throw new Error("useHrDemo must be used inside HrDemoProvider"); return context; }
