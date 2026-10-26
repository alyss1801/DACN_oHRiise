import { can } from "@/lib/authorization/engine";
import type { EffectiveSession } from "@/lib/authorization/types";
import { hrToday } from "./hr-demo-data";
import type { HrEmployee, HrState, OrgChange, OrgDepartment, OrgTeam, OrgTransferRow } from "./hr-demo-data";

export type DepartmentInput = Omit<OrgDepartment, "id">;
export type TeamInput = Omit<OrgTeam, "id" | "memberIds">;
export type OrganizationCommand =
  | { type: "department.save"; id?: string; value: DepartmentInput }
  | { type: "department.deactivate"; id: string; effectiveAt: string }
  | { type: "team.save"; id?: string; value: TeamInput; initialMemberIds?: string[] }
  | { type: "team.member"; teamId: string; employeeId: string; action: "add-primary" | "add-additional" | "remove" }
  | { type: "transfer"; employeeIds: string[]; departmentId: string; teamId?: string; teamMode: "primary" | "additional"; managerId?: string; position?: string; effectiveAt: string; reason: string; pendingRequestIds: string[] };

export type OrganizationResult = { ok: true; state: HrState; id: string } | { ok: false; error: string };

const failure = (error: string): OrganizationResult => ({ ok: false, error });
const clean = (value: string) => value.trim();
const uid = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
const departmentPeople = (state: HrState, department: OrgDepartment) => state.employees.filter((person) => person.status !== "inactive" && person.department === department.name && person.branch === department.branch);
const canEditBranch = (session: EffectiveSession, branch: string) => session.effectiveScope === "company" || session.effectiveScope === "branch" && (session.scopeTarget ?? session.branch) === branch;

export function managerIsEligible(state: Pick<HrState, "employees" | "organization">, managerId: string, branch: string) {
  const person = state.employees.find((item) => item.id === managerId);
  return Boolean(person && person.status === "active" && person.branch === branch && (
    /lead|head|manager|trưởng/i.test(person.position) ||
    state.employees.some((item) => item.managerId === managerId) ||
    state.organization.departments.some((item) => item.managerId === managerId) ||
    state.organization.teams.some((item) => item.leadId === managerId)
  ));
}

export function managerWouldCycle(people: HrEmployee[], employeeId: string, managerId?: string) {
  const visited = new Set([employeeId]);
  let current = managerId;
  while (current) {
    if (visited.has(current)) return true;
    visited.add(current);
    current = people.find((item) => item.id === current)?.managerId;
  }
  return false;
}

export function departmentWouldCycle(departments: OrgDepartment[], departmentId: string, parentId?: string) {
  const visited = new Set([departmentId]);
  let current = parentId;
  while (current) {
    if (visited.has(current)) return true;
    visited.add(current);
    current = departments.find((item) => item.id === current)?.parentId;
  }
  return false;
}

function record(state: HrState, organization: HrState["organization"], employees: HrEmployee[], change: Omit<OrgChange, "id" | "at" | "actor">, session: EffectiveSession): OrganizationResult {
  const at = new Date().toISOString();
  const logged: OrgChange = { ...change, id: uid("ORG"), at, actor: session.label };
  return { ok: true, id: change.entityId, state: {
    ...state,
    employees,
    organization: { ...organization, changes: [logged, ...organization.changes] },
    activities: [{ id: uid("ACT"), at, actor: session.label, branch: change.branch, department: "Cơ cấu tổ chức", text: change.summary }, ...state.activities],
  } };
}

function validEffectiveDate(date: string) { return /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= hrToday(); }

export function applyOrganizationCommand(state: HrState, command: OrganizationCommand, session: EffectiveSession): OrganizationResult {
  if (!can(session, "organization", "edit")) return failure("Bạn không có quyền quản trị cơ cấu tổ chức.");
  const organization = state.organization;
  const departments = organization.departments;
  const teams = organization.teams;

  if (command.type === "department.save") {
    const value = { ...command.value, name: clean(command.value.name), code: clean(command.value.code).toUpperCase(), description: clean(command.value.description) };
    const previous = command.id ? departments.find((item) => item.id === command.id) : undefined;
    if (command.id && !previous) return failure("Không tìm thấy phòng ban cần sửa.");
    if (!canEditBranch(session, value.branch) || previous && !canEditBranch(session, previous.branch)) return failure("Phòng ban nằm ngoài phạm vi quản trị của bạn.");
    if (!value.name || !/^[A-Z0-9-]{2,20}$/.test(value.code)) return failure("Cần tên và mã phòng ban 2–20 ký tự (chữ in hoa, số hoặc dấu gạch ngang).");
    if (departments.some((item) => item.id !== command.id && item.code === value.code)) return failure("Mã phòng ban đã tồn tại.");
    if (departments.some((item) => item.id !== command.id && item.branch === value.branch && item.name.toLocaleLowerCase("vi") === value.name.toLocaleLowerCase("vi"))) return failure("Tên phòng ban đã tồn tại trong chi nhánh này.");
    if (!validEffectiveDate(value.effectiveAt)) return failure("Ngày hiệu lực phải là hôm nay hoặc trước đó trong demo.");
    const parent = value.parentId ? departments.find((item) => item.id === value.parentId) : undefined;
    if (value.parentId && (!parent || parent.status !== "active" || parent.branch !== value.branch)) return failure("Đơn vị cấp trên phải hoạt động và cùng chi nhánh.");
    if (command.id && departmentWouldCycle(departments, command.id, value.parentId)) return failure("Không thể tạo quan hệ cha–con vòng lặp.");
    if (value.managerId && !managerIsEligible(state, value.managerId, value.branch)) return failure("Trưởng phòng phải đang hoạt động, cùng chi nhánh và có vai trò quản lý phù hợp.");
    if (previous && previous.branch !== value.branch && (departmentPeople(state, previous).length || teams.some((item) => item.departmentId === previous.id) || departments.some((item) => item.parentId === previous.id))) return failure("Cần xử lý nhân sự, Team và đơn vị con trước khi đổi chi nhánh.");
    if (previous && previous.status === "active" && value.status === "inactive") return failure("Hãy dùng thao tác Ngừng hoạt động để kiểm tra dữ liệu phụ thuộc.");
    if (!previous && value.status === "inactive") return failure("Phòng ban mới phải bắt đầu ở trạng thái hoạt động.");
    const id = previous?.id ?? uid("DEPT");
    const next = { ...organization, departments: previous ? departments.map((item) => item.id === id ? { ...value, id } : item) : [{ ...value, id }, ...departments] };
    const employees = previous && previous.name !== value.name ? state.employees.map((item) => item.department === previous.name && item.branch === previous.branch ? { ...item, department: value.name } : item) : state.employees;
    return record(state, next, employees, { kind: previous ? "department.updated" : "department.created", entityId: id, branch: value.branch, effectiveAt: value.effectiveAt, summary: `${previous ? "Cập nhật" : "Tạo"} phòng ban ${value.name} (${value.code}).` }, session);
  }

  if (command.type === "department.deactivate") {
    const target = departments.find((item) => item.id === command.id);
    if (!target || !canEditBranch(session, target.branch)) return failure("Không tìm thấy phòng ban trong phạm vi quản trị.");
    if (target.status !== "active") return failure("Phòng ban đã ngừng hoạt động.");
    if (!validEffectiveDate(command.effectiveAt)) return failure("Ngày hiệu lực phải là hôm nay hoặc trước đó trong demo.");
    const blockers = [departmentPeople(state, target).length && "còn nhân sự", teams.some((item) => item.departmentId === target.id && item.status === "active") && "còn Team", departments.some((item) => item.parentId === target.id && item.status === "active") && "còn đơn vị con"].filter(Boolean);
    if (blockers.length) return failure(`Chưa thể ngừng hoạt động: ${blockers.join(", ")}. Hãy xử lý dữ liệu phụ thuộc trước.`);
    return record(state, { ...organization, departments: departments.map((item) => item.id === target.id ? { ...item, status: "inactive" } : item) }, state.employees, { kind: "department.deactivated", entityId: target.id, branch: target.branch, effectiveAt: command.effectiveAt, summary: `Ngừng hoạt động phòng ban ${target.name}.` }, session);
  }

  if (command.type === "team.save") {
    const value = { ...command.value, name: clean(command.value.name), code: clean(command.value.code).toUpperCase(), description: clean(command.value.description) };
    const previous = command.id ? teams.find((item) => item.id === command.id) : undefined;
    const department = departments.find((item) => item.id === value.departmentId);
    const oldDepartment = previous && departments.find((item) => item.id === previous.departmentId);
    if (command.id && !previous) return failure("Không tìm thấy Team cần sửa.");
    if (!department || department.status !== "active" || !canEditBranch(session, department.branch) || oldDepartment && !canEditBranch(session, oldDepartment.branch)) return failure("Phòng ban chủ quản không hợp lệ hoặc ngoài phạm vi.");
    if (!value.name || !/^[A-Z0-9-]{2,24}$/.test(value.code)) return failure("Cần tên và mã Team 2–24 ký tự (chữ in hoa, số hoặc dấu gạch ngang).");
    if (teams.some((item) => item.id !== command.id && item.code === value.code)) return failure("Mã Team đã tồn tại.");
    if (!validEffectiveDate(value.startsAt)) return failure("Ngày bắt đầu Team phải là hôm nay hoặc trước đó trong demo.");
    if (value.endsAt && value.endsAt < value.startsAt) return failure("Ngày kết thúc không thể trước ngày bắt đầu.");
    if (value.leadId && !managerIsEligible(state, value.leadId, department.branch)) return failure("Team Lead phải đang hoạt động, cùng chi nhánh chủ quản và có vai trò quản lý phù hợp.");
    if (!previous && value.status === "closed") return failure("Team mới phải bắt đầu ở trạng thái hoạt động.");
    if (previous && previous.status === "active" && value.status === "closed" && (previous.memberIds.length || value.leadId)) return failure("Cần chuyển hoặc loại thành viên và Team Lead trước khi đóng Team.");
    const id = previous?.id ?? uid("TEAM");
    const memberIds = previous?.memberIds ?? [...new Set(command.initialMemberIds ?? [])];
    if (!previous && memberIds.some((id) => { const person = state.employees.find((item) => item.id === id); return !person || person.status === "inactive" || !canEditBranch(session, person.branch); })) return failure("Danh sách thành viên có nhân sự ngoài phạm vi hoặc đã nghỉ việc.");
    const nextMembers = value.leadId && !memberIds.includes(value.leadId) ? [...memberIds, value.leadId] : memberIds;
    const next = { ...organization, teams: previous ? teams.map((item) => item.id === id ? { ...value, id, memberIds: nextMembers } : item) : [{ ...value, id, memberIds: nextMembers }, ...teams] };
    return record(state, next, state.employees, { kind: previous ? "team.updated" : "team.created", entityId: id, branch: department.branch, effectiveAt: value.startsAt, summary: `${previous ? "Cập nhật" : "Tạo"} Team ${value.name} (${value.code})${value.leadId ? ` · Lead: ${state.employees.find((item) => item.id === value.leadId)?.name}` : ""}.` }, session);
  }

  if (command.type === "team.member") {
    const team = teams.find((item) => item.id === command.teamId);
    const department = departments.find((item) => item.id === team?.departmentId);
    const person = state.employees.find((item) => item.id === command.employeeId);
    if (!team || !department || !person || !canEditBranch(session, department.branch) || !canEditBranch(session, person.branch)) return failure("Team hoặc nhân sự nằm ngoài phạm vi quản trị.");
    if (team.status !== "active" || person.status === "inactive") return failure("Chỉ có thể phân bổ vào Team và hồ sơ đang hoạt động.");
    const exists = team.memberIds.includes(person.id);
    if (command.action === "remove" && !exists) return failure("Nhân sự không thuộc Team này.");
    if (command.action === "remove" && team.leadId === person.id) return failure("Hãy đổi Team Lead trước khi loại người này khỏi Team.");
    if (command.action !== "remove" && exists && (command.action === "add-additional" || person.primaryTeamId === team.id)) return failure("Nhân sự đã có vai trò tương ứng trong Team.");
    if (command.action === "add-primary" && person.primaryTeamId && person.primaryTeamId !== team.id && teams.some((item) => item.id === person.primaryTeamId && item.leadId === person.id)) return failure("Cần thay Team Lead ở Team chính cũ trước khi chuyển Team chính.");
    const nextTeams = teams.map((item) => {
      if (item.id === team.id) return { ...item, memberIds: command.action === "remove" ? item.memberIds.filter((id) => id !== person.id) : [...new Set([...item.memberIds, person.id])] };
      if (command.action === "add-primary" && item.id === person.primaryTeamId) return { ...item, memberIds: item.memberIds.filter((id) => id !== person.id) };
      return item;
    });
    const employees = state.employees.map((item) => item.id === person.id ? { ...item, primaryTeamId: command.action === "remove" && item.primaryTeamId === team.id ? undefined : command.action === "add-primary" ? team.id : item.primaryTeamId } : item);
    const summary = command.action === "remove" ? `Loại ${person.name} khỏi Team ${team.name}.` : `Gán ${person.name} vào Team ${team.name}${command.action === "add-primary" ? " (Team chính)" : " (tham gia bổ sung)"}.`;
    return record(state, { ...organization, teams: nextTeams }, employees, { kind: "team.member", entityId: team.id, branch: department.branch, effectiveAt: hrToday(), employeeIds: [person.id], summary }, session);
  }

  const target = departments.find((item) => item.id === command.departmentId);
  const team = command.teamId ? teams.find((item) => item.id === command.teamId) : undefined;
  if (!target || target.status !== "active" || !canEditBranch(session, target.branch)) return failure("Phòng ban đích không hợp lệ hoặc ngoài phạm vi.");
  if (command.teamId && (!team || team.status !== "active")) return failure("Team đích không hoạt động.");
  if (!command.employeeIds.length || new Set(command.employeeIds).size !== command.employeeIds.length) return failure("Hãy chọn ít nhất một nhân sự hợp lệ.");
  if (!clean(command.reason) || clean(command.reason).length < 8) return failure("Lý do điều chuyển cần ít nhất 8 ký tự.");
  if (!validEffectiveDate(command.effectiveAt)) return failure("Ngày hiệu lực phải là hôm nay hoặc trước đó trong demo.");
  const selected = command.employeeIds.map((id) => state.employees.find((item) => item.id === id));
  if (selected.some((item) => !item || item.status === "inactive" || !canEditBranch(session, item.branch))) return failure("Có nhân sự ngoài phạm vi hoặc đã ngừng hoạt động.");
  if (command.managerId && (!managerIsEligible(state, command.managerId, target.branch) || selected.some((item) => item && managerWouldCycle(state.employees, item.id, command.managerId)))) return failure("Quản lý mới không đủ điều kiện hoặc tạo vòng lặp tuyến báo cáo.");
  if (command.teamMode === "primary" && team && selected.some((item) => item?.primaryTeamId && item.primaryTeamId !== team.id && teams.some((entry) => entry.id === item.primaryTeamId && entry.leadId === item.id))) return failure("Cần thay Team Lead ở Team chính cũ trước khi điều chuyển.");
  const people = selected as HrEmployee[];
  if (people.some((item) => item.branch !== target.branch && state.employees.some((report) => report.managerId === item.id && !command.employeeIds.includes(report.id)))) return failure("Cần điều chuyển hoặc đổi quản lý cho cấp dưới trước khi chuyển người quản lý sang chi nhánh khác.");
  if (people.some((item) => item.branch !== target.branch && command.managerId === undefined && item.managerId)) return failure("Khi đổi chi nhánh, cần chọn quản lý mới hoặc bỏ tuyến quản lý cũ.");
  if (people.some((item) => item.department !== target.name && command.managerId === undefined && item.managerId && state.employees.find((entry) => entry.id === item.managerId)?.department !== target.name)) return failure("Khi đổi phòng ban, cần xác nhận quản lý trực tiếp mới.");
  const transfers: OrgTransferRow[] = people.map((item) => ({ employeeId: item.id, before: { branch: item.branch, department: item.department, teamId: item.primaryTeamId, managerId: item.managerId, position: item.position }, after: { branch: target.branch, department: target.name, teamId: team && command.teamMode === "primary" ? team.id : item.primaryTeamId, managerId: command.managerId === undefined ? item.managerId : command.managerId || undefined, position: clean(command.position ?? "") || item.position } }));
  if (transfers.every((row) => row.before.branch === row.after.branch && row.before.department === row.after.department && row.before.teamId === row.after.teamId && row.before.managerId === row.after.managerId && row.before.position === row.after.position) && (!team || people.every((person) => team.memberIds.includes(person.id)))) return failure("Chưa có thay đổi nào để xác nhận.");
  const ids = new Set(people.map((item) => item.id));
  const employees = state.employees.map((item) => {
    if (!ids.has(item.id)) return item;
    const after = transfers.find((row) => row.employeeId === item.id)!.after;
    return { ...item, department: after.department, branch: target.branch, primaryTeamId: after.teamId, managerId: after.managerId, position: after.position };
  });
  const nextTeams = teams.map((item) => {
    const memberIds = command.teamMode === "primary" && item.id !== team?.id ? item.memberIds.filter((id) => !ids.has(id) || !people.some((person) => person.id === id && person.primaryTeamId === item.id)) : item.memberIds;
    return item.id === team?.id ? { ...item, memberIds: [...new Set([...memberIds, ...command.employeeIds])] } : { ...item, memberIds };
  });
  const summary = `Điều chuyển ${people.map((item) => item.name).join(", ")} đến ${target.name}${team ? ` · ${team.name}` : ""}. Lý do: ${clean(command.reason)}. Yêu cầu đang chờ giữ tuyến xử lý hiện tại trong demo.`;
  return record(state, { ...organization, teams: nextTeams }, employees, { kind: "transfer", entityId: target.id, branch: target.branch, effectiveAt: command.effectiveAt, employeeIds: command.employeeIds, pendingRequestIds: command.pendingRequestIds, transfers, summary }, session);
}
