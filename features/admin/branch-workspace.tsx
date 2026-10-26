"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { WorkspaceHeader } from "@/features/employee/workspace-frame";
import { useHrDemo } from "@/features/hr/hr-demo-context";
import { hrDate, hrToday } from "@/features/hr/hr-demo-data";

type BranchInfo = { code: string; name: string; address: string; timezone: string; status: "active" | "inactive" };
type AttendanceLocation = { id: string; branch: string; name: string; latitude: number; longitude: number; radius: number; effectiveAt: string; status: "active" | "inactive" };
type Registry = { version: 1; branches: BranchInfo[]; locations: AttendanceLocation[] };
const storageKey = "ohriise-branch-registry-demo-v1";
const seed: Registry = { version: 1, branches: [
  { code: "HCM-Q1", name: "Văn phòng HCM-Q1", address: "Chưa cấu hình địa chỉ", timezone: "Asia/Ho_Chi_Minh", status: "active" },
  { code: "HCM-TD", name: "Văn phòng HCM-TD", address: "Chưa cấu hình địa chỉ", timezone: "Asia/Ho_Chi_Minh", status: "active" },
  { code: "HN-CG", name: "Văn phòng HN-CG", address: "Chưa cấu hình địa chỉ", timezone: "Asia/Ho_Chi_Minh", status: "active" },
], locations: [] };

export function BranchWorkspace() {
  const { employees, organization } = useHrDemo();
  const [registry, setRegistry] = useState(seed);
  const [hydrated, setHydrated] = useState(false);
  const [selectedCode, setSelectedCode] = useState("HCM-Q1");
  const [name, setName] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [location, setLocation] = useState({ name: "", latitude: "", longitude: "", radius: "180", effectiveAt: hrToday() });
  useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
      if (parsed?.version === 1 && Array.isArray(parsed.branches) && Array.isArray(parsed.locations)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore local demo snapshot after hydration.
        setRegistry(parsed);
      }
    } catch { /* Keep seed. */ }
    setHydrated(true);
    const sync = (event: StorageEvent) => { if (event.key !== storageKey || !event.newValue) return; try { const parsed = JSON.parse(event.newValue); if (parsed?.version === 1 && Array.isArray(parsed.branches) && Array.isArray(parsed.locations)) setRegistry(parsed); } catch { /* Keep last valid snapshot. */ } };
    window.addEventListener("storage", sync); return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => { if (hydrated) window.localStorage.setItem(storageKey, JSON.stringify(registry)); }, [hydrated, registry]);
  const codes = [...new Set([...organization.departments.map((item) => item.branch), ...employees.map((item) => item.branch)])].sort();
  const branches = codes.map((code) => registry.branches.find((item) => item.code === code) ?? { code, name: `Chi nhánh ${code}`, address: "Chưa cấu hình địa chỉ", timezone: "Asia/Ho_Chi_Minh", status: "active" as const });
  const selected = branches.find((item) => item.code === selectedCode) ?? branches[0];
  const locations = registry.locations.filter((item) => item.branch === selected?.code);
  const select = (item: BranchInfo) => { setSelectedCode(item.code); setName(null); setAddress(null); };
  const saveBranch = () => { if (!selected || (name ?? selected.name).trim().length < 3 || (address ?? selected.address).trim().length < 5) { toast.error("Cần tên và địa chỉ chi nhánh rõ ràng."); return; } setRegistry((current) => ({ ...current, branches: [...current.branches.filter((item) => item.code !== selected.code), { ...selected, name: (name ?? selected.name).trim(), address: (address ?? selected.address).trim() }] })); setName(null); setAddress(null); toast.success("Đã lưu thông tin chi nhánh trong demo cục bộ."); };
  const latitude = Number(location.latitude), longitude = Number(location.longitude), radius = Number(location.radius);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(location.effectiveAt) && !Number.isNaN(new Date(`${location.effectiveAt}T12:00:00Z`).getTime()) && new Date(`${location.effectiveAt}T12:00:00Z`).toISOString().slice(0, 10) === location.effectiveAt;
  const validLocation = selected && location.name.trim().length >= 3 && location.latitude.trim() && location.longitude.trim() && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180 && Number.isFinite(radius) && radius > 0 && radius <= 5000 && validDate;
  const addLocation = () => { if (!validLocation || !selected) return; const entry: AttendanceLocation = { id: `LOC-${crypto.randomUUID()}`, branch: selected.code, name: location.name.trim(), latitude, longitude, radius, effectiveAt: location.effectiveAt, status: "active" }; setRegistry((current) => ({ ...current, locations: [entry, ...current.locations] })); setLocation({ name: "", latitude: "", longitude: "", radius: "180", effectiveAt: hrToday() }); toast.success("Đã tạo địa điểm chấm công demo; không thay đổi sự kiện công cũ."); };
  return <div className="page-stack hr-core branch-workspace"><WorkspaceHeader eyebrow="SYSTEM ADMIN · ĐỊA ĐIỂM" title="Chi nhánh và vị trí chấm công" description="Mã chi nhánh lấy từ cơ cấu HR; headcount tính từ hồ sơ nhân viên. GPS chưa được xác thực bằng thiết bị thật." /><div className="branch-workspace-grid"><section className="panel"><h2>Chi nhánh ({branches.length})</h2><div className="hr-task-list">{branches.map((item) => <button key={item.code} className={selected?.code === item.code ? "selected" : ""} onClick={() => select(item)}><span><strong>{item.name}</strong><small>{item.code} · {employees.filter((person) => person.branch === item.code && person.status !== "inactive").length} nhân sự đang làm</small></span></button>)}</div></section><section className="panel branch-workspace-detail"><h2>{selected?.name ?? "Chọn chi nhánh"}</h2><p>Mã: {selected?.code} · Múi giờ: {selected?.timezone}</p><div className="hr-form-grid"><label>Tên chi nhánh<input value={name ?? selected?.name ?? ""} onChange={(event) => setName(event.target.value)} /></label><label>Địa chỉ<input value={address ?? selected?.address ?? ""} onChange={(event) => setAddress(event.target.value)} /></label></div><button className="secondary-button" onClick={saveBranch}>Lưu thông tin</button><h3>Địa điểm chấm công ({locations.length})</h3>{locations.map((item) => <div className="branch-location-row" key={item.id}><strong>{item.name}</strong><span>{item.latitude}, {item.longitude} · bán kính {item.radius} m · từ {hrDate(item.effectiveAt)}</span><span>{item.status === "active" ? "Đang cấu hình" : "Đã ngừng"}</span><button className="row-action" onClick={() => setRegistry((current) => ({ ...current, locations: current.locations.map((entry) => entry.id === item.id ? { ...entry, status: entry.status === "active" ? "inactive" : "active" } : entry) }))}>{item.status === "active" ? "Ngừng dùng" : "Kích hoạt"}</button></div>)}{!locations.length && <p>Chưa cấu hình vị trí GPS cho chi nhánh này.</p>}<div className="hr-form-grid"><label>Tên vị trí<input value={location.name} onChange={(event) => setLocation({ ...location, name: event.target.value })} placeholder="Ví dụ: Sảnh văn phòng" /></label><label>Vĩ độ<input type="number" min={-90} max={90} step="any" value={location.latitude} onChange={(event) => setLocation({ ...location, latitude: event.target.value })} /></label><label>Kinh độ<input type="number" min={-180} max={180} step="any" value={location.longitude} onChange={(event) => setLocation({ ...location, longitude: event.target.value })} /></label><label>Bán kính (m)<input type="number" min={1} max={5000} value={location.radius} onChange={(event) => setLocation({ ...location, radius: event.target.value })} /></label><label>Hiệu lực từ<input type="date" value={location.effectiveAt} onChange={(event) => setLocation({ ...location, effectiveAt: event.target.value })} /></label></div><button className="primary-button" disabled={!validLocation} onClick={addLocation}>Thêm vị trí</button></section></div></div>;
}
