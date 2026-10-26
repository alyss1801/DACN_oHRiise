import type { HrAsset, HrAssetHandover, HrEmployee, HrState } from "./hr-demo-data";

export type AssetCommand =
  | { type: "issue" | "transfer"; assetId: string; employeeId: string; actorId: string; condition: string; accessories: string; evidence: string; at: string; expectedVersion: number }
  | { type: "acknowledge"; assetId: string; employeeId: string; at: string; expectedVersion: number }
  | { type: "request-return"; assetId: string; actorId: string; reason: string; at: string; expectedVersion: number }
  | { type: "complete-return"; assetId: string; actorId: string; condition: string; evidence: string; at: string; expectedVersion: number };
export type AssetResult = { ok: true; assets: HrAsset[]; assetHandovers: HrAssetHandover[]; message: string } | { ok: false; error: string };
type AssetState = Pick<HrState, "assets" | "assetHandovers" | "employees">;

export function applyAssetCommand(state: AssetState, command: AssetCommand): AssetResult {
  const asset = state.assets.find((item) => item.id === command.assetId);
  if (!asset) return { ok: false, error: "Không tìm thấy tài sản." };
  if ((asset.version ?? 1) !== command.expectedVersion) return { ok: false, error: "Tài sản đã thay đổi. Tải lại trước khi thao tác." };
  const open = state.assetHandovers.find((item) => item.assetId === asset.id && !item.returnedAt);
  if (state.assetHandovers.filter((item) => item.assetId === asset.id && !item.returnedAt).length > 1) return { ok: false, error: "Có nhiều bàn giao chưa đóng; cần đối soát dữ liệu." };
  const replace = (next: HrAsset, handovers: HrAssetHandover[], message: string): AssetResult => ({ ok: true, assets: state.assets.map((item) => item.id === asset.id ? { ...next, version: command.expectedVersion + 1 } : item), assetHandovers: handovers, message });
  if (command.type === "issue" || command.type === "transfer") {
    const person: HrEmployee | undefined = state.employees.find((item) => item.id === command.employeeId);
    if (!person || person.status === "inactive") return { ok: false, error: "Người nhận không có hồ sơ đang làm việc." };
    if (!command.actorId || !command.condition.trim() || !command.accessories.trim() || command.evidence.trim().length < 8) return { ok: false, error: "Cần người giao, tình trạng, phụ kiện và tham chiếu biên bản ít nhất 8 ký tự." };
    if (command.type === "issue" && (asset.status !== "available" || open)) return { ok: false, error: "Tài sản chưa sẵn sàng hoặc còn một bàn giao mở." };
    if (command.type === "transfer" && (asset.status !== "assigned" || !open?.acknowledgedAt || open.employeeId === person.id)) return { ok: false, error: "Chỉ chuyển giao tài sản đã nhận cho người khác." };
    const closed = command.type === "transfer" && open ? state.assetHandovers.map((item) => item.id === open.id ? { ...item, returnedAt: command.at, returnedBy: command.actorId, conditionIn: command.condition.trim(), returnEvidence: command.evidence.trim() } : item) : state.assetHandovers;
    const next: HrAssetHandover = { id: `AH-${crypto.randomUUID()}`, assetId: asset.id, employeeId: person.id, issuedAt: command.at, issuedBy: command.actorId, conditionOut: command.condition.trim(), accessories: command.accessories.trim(), evidence: command.evidence.trim(), source: "demo" };
    const assignedAt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(command.at));
    return replace({ ...asset, status: "awaiting_receipt", holderId: person.id, assignedAt, condition: command.condition.trim(), branch: person.branch }, [next, ...closed], command.type === "issue" ? "Đã lập bàn giao; chờ người nhận xác nhận." : "Đã chuyển giao; chờ người mới xác nhận.");
  }
  if (command.type === "acknowledge") {
    if (asset.status !== "awaiting_receipt" || !open || open.employeeId !== command.employeeId || open.acknowledgedAt) return { ok: false, error: "Chỉ người nhận được xác nhận bàn giao đang chờ." };
    return replace({ ...asset, status: "assigned" }, state.assetHandovers.map((item) => item.id === open.id ? { ...item, acknowledgedAt: command.at } : item), "Người nhận đã xác nhận bàn giao.");
  }
  if (command.type === "request-return") {
    if (asset.status !== "assigned" || !open?.acknowledgedAt || command.reason.trim().length < 8) return { ok: false, error: "Cần tài sản đang sử dụng và lý do thu hồi ít nhất 8 ký tự." };
    return replace({ ...asset, status: "awaiting_return" }, state.assetHandovers.map((item) => item.id === open.id ? { ...item, returnRequestedAt: command.at, returnReason: command.reason.trim() } : item), "Đã yêu cầu thu hồi; chưa hoàn tất bàn giao trả.");
  }
  if (asset.status !== "awaiting_return" || !open?.returnRequestedAt || !command.actorId || !command.condition.trim() || command.evidence.trim().length < 8) return { ok: false, error: "Cần xác nhận nhận lại, tình trạng và tham chiếu biên bản." };
  return replace({ ...asset, status: "available", holderId: undefined, assignedAt: undefined, condition: command.condition.trim() }, state.assetHandovers.map((item) => item.id === open.id ? { ...item, returnedAt: command.at, returnedBy: command.actorId, conditionIn: command.condition.trim(), returnEvidence: command.evidence.trim() } : item), "Đã nhận lại tài sản và đóng bàn giao.");
}

export function normalizeAssetHandovers(assets: HrAsset[], handovers?: HrAssetHandover[]): HrAssetHandover[] {
  if (Array.isArray(handovers)) return handovers;
  return assets.filter((item) => item.holderId).map((item) => ({ id: `handover-legacy-${item.id}`, assetId: item.id, employeeId: item.holderId!, issuedAt: `${item.assignedAt ?? "2026-10-20"}T09:00:00+07:00`, issuedBy: "fixture", conditionOut: item.condition, accessories: "Không ghi trong dữ liệu cũ", evidence: "Bản ghi cũ; chưa có biên bản gốc", acknowledgedAt: `${item.assignedAt ?? "2026-10-20"}T09:00:00+07:00`, source: "seed" }));
}
