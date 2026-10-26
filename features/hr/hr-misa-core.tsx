"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/features/session/session-context";
import { WorkspaceHeader } from "@/features/employee/workspace-frame";
import { canAccessScopedRecord } from "@/lib/authorization/engine";
import { useHrDemo } from "./hr-demo-context";
import { internalTimesheetCsv, prepareInternalTimesheetRows } from "./internal-timesheet-export";

export function HrMisaWorkspace({ onNavigate }: { moduleId: string; onNavigate: (id: string) => void }) {
  const { employees, periods, exports, recordExport } = useHrDemo();
  const { can, session } = useSession();
  const [periodId, setPeriodId] = useState("2026-09");
  const [branch, setBranch] = useState("");
  const [confirm, setConfirm] = useState(false);
  const period = periods.find((item) => item.id === periodId);
  const snapshot = period?.status !== "reconciling" ? period?.snapshots?.at(-1) : undefined;
  const scoped = employees.filter((person) => canAccessScopedRecord(session, { employeeId: person.id, branch: person.branch, department: person.department }));
  const scopedIds = new Set(scoped.map((person) => person.id));
  const rows = snapshot ? prepareInternalTimesheetRows(snapshot, employees, periodId, branch).filter((row) => scopedIds.has(row.employeeId)) : [];
  const history = exports.filter((item) => item.period === periodId && (!branch || item.branch === branch));
  const download = () => {
    if (!snapshot || !can("timesheets", "export") || rows.some((row) => row.unresolved > 0)) return;
    const id = recordExport(periodId, branch || "Toàn công ty", rows.length, snapshot.version);
    if (!id) { toast.error("Snapshot đã thay đổi; kiểm tra lại kỳ công."); return; }
    const url = URL.createObjectURL(new Blob([internalTimesheetCsv(rows)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `oHRiise-cong-noi-bo-${periodId}-v${snapshot.version}.csv`; link.click(); URL.revokeObjectURL(url);
    setConfirm(false); toast.success(`Đã tải CSV nội bộ từ snapshot v${snapshot.version}.`);
  };
  return <div className="page-stack hr-core"><WorkspaceHeader title="Xuất dữ liệu công nội bộ" /><div className="hr-demo-note"><strong>MISA · Chưa triển khai</strong><span>Không có API, job đồng bộ hoặc biên nhận từ MISA. Bản CSV chỉ phục vụ đối soát nội bộ trong demo.</span></div>
    <section className="panel hr-timesheet-controls"><label>Kỳ công <select value={periodId} onChange={(event) => { setPeriodId(event.target.value); setConfirm(false); }}>{periods.map((item) => <option key={item.id} value={item.id}>{item.id.slice(5)}/{item.id.slice(0, 4)}</option>)}</select></label><label>Chi nhánh <select value={branch} onChange={(event) => { setBranch(event.target.value); setConfirm(false); }}><option value="">Mọi chi nhánh trong phạm vi</option>{[...new Set(scoped.map((person) => person.branch))].map((item) => <option key={item}>{item}</option>)}</select></label><span>{snapshot ? `Snapshot v${snapshot.version} · ${snapshot.rows.length} công gốc · ${snapshot.wfhDays?.length ?? 0} WFH` : "Chưa có snapshot đã chốt"}</span><button className="secondary-button" onClick={() => onNavigate(`timesheets/${periodId}`)}>Mở bảng công</button></section>
    <section className="panel hr-directory"><div className="hr-core-heading"><div><h2>{rows.length} nhân sự trong bản xuất</h2><p>{snapshot ? "Dữ liệu lấy từ snapshot đóng, không tính lại theo công, WFH hoặc đơn nghỉ mới." : "Chốt kỳ sau khi đối soát để tạo bản xuất bất biến."}</p></div>{can("timesheets", "export") && <button className="primary-button" disabled={!snapshot || !rows.length || rows.some((row) => row.unresolved > 0)} onClick={() => setConfirm(true)}><Download size={14} /> Xuất CSV nội bộ</button>}</div><div className="table-scroll"><table className="data-table"><thead><tr><th>Mã nhân viên</th><th>Họ tên</th><th>Chi nhánh</th><th>Ngày công hợp lệ</th><th>Trong đó WFH</th><th>Nghỉ đã duyệt</th><th>Ngoại lệ</th><th>Snapshot</th></tr></thead><tbody>{rows.map((row) => <tr key={row.employeeId}><td className="mono">{row.employeeId}</td><td>{row.name}</td><td>{row.branch}</td><td>{row.validDays}</td><td>{row.confirmedWfhDays}</td><td>{row.approvedLeaveDays}</td><td>{row.unresolved}</td><td>v{row.snapshotVersion}</td></tr>)}</tbody></table></div>{!rows.length && <p className="hr-empty">Chưa có dữ liệu xuất trong kỳ và phạm vi này.</p>}</section>
    {confirm && <section className="panel hr-inline-confirm"><div><strong>Tải CSV từ snapshot v{snapshot?.version}?</strong><p>{rows.length} nhân sự · kỳ {periodId} · {branch || "phạm vi hiện tại"}. Tệp chỉ tải về máy bạn.</p></div><button className="secondary-button" onClick={() => setConfirm(false)}>Hủy</button><button className="primary-button" onClick={download}>Xác nhận tải</button></section>}
    <section className="panel hr-directory"><div className="hr-core-heading"><h2>Lịch sử tải CSV demo</h2></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Mã phiên</th><th>Thời gian</th><th>Kỳ</th><th>Phạm vi</th><th>Nhân sự</th><th>Snapshot</th><th>Kết quả</th></tr></thead><tbody>{history.map((item) => <tr key={item.id}><td className="mono">{item.id}</td><td>{new Date(item.at).toLocaleString("vi-VN")}</td><td>{item.period}</td><td>{item.branch}</td><td>{item.count}</td><td>{item.snapshotVersion ? `v${item.snapshotVersion}` : "Bản mẫu cũ"}</td><td>{item.status === "partial-demo" ? "Fixture có lỗi" : "Đã tải CSV nội bộ"}</td></tr>)}</tbody></table></div>{!history.length && <p className="hr-empty">Chưa có bản xuất được ghi nhận.</p>}</section>
  </div>;
}
