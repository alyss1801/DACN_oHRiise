"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3, FileText, Play, Save } from "lucide-react";
import { toast } from "sonner";
import { useDemoData } from "@/features/demo/demo-data-context";
import type { BusinessRequest } from "@/features/demo/demo-data-context";
import { useHrDemo } from "@/features/hr/hr-demo-context";
import { useSession } from "@/features/session/session-context";
import { StatusPill, WorkspaceHeader } from "@/features/employee/workspace-frame";
import { canAccessScopedRecord } from "@/lib/authorization/engine";
import { personaEmployeeIds } from "@/lib/authorization/demo-identity";
import { useDemoClock } from "@/features/demo/demo-clock-context";
import { useWfhDemo } from "./wfh-demo-context";
import type { WfhSession } from "./wfh-model";

const dateLabel = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Intl.DateTimeFormat("vi-VN").format(new Date(`${date}T12:00:00Z`)) : date;
const timeLabel = (date?: string) => date ? new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" }).format(new Date(date)) : "—";
function stateLabel(request: BusinessRequest, session?: WfhSession) {
  if (session?.review?.decision === "confirmed") return "HR đã xác nhận công WFH";
  if (session?.review?.decision === "excluded") return "HR loại khỏi bảng công";
  if (request.status === "pending") return "Chờ duyệt kế hoạch";
  if (request.status === "rejected") return "Đã từ chối";
  if (request.status !== "approved") return "Đang xử lý";
  if (!session) return "Đã duyệt · chưa bắt đầu";
  if (session.reportSubmittedAt) return "Đã nộp báo cáo";
  if (session.checkOutAt) return "Chờ nộp báo cáo";
  return "Đang trong phiên";
}

export function WfhWorkspace({ moduleId, onNavigate }: { moduleId: string; onNavigate: (id: string) => void }) {
  const { session: persona } = useSession();
  const clock = useDemoClock();
  const { employees, periods } = useHrDemo();
  const { requests } = useDemoData();
  const { store, run } = useWfhDemo();
  const selfId = personaEmployeeIds[persona.id];
  const visible = requests.filter((item) => {
    if (item.type !== "WFH") return false;
    const person = employees.find((entry) => entry.id === item.employeeId || entry.name === item.employee);
    return person && canAccessScopedRecord(persona, { employeeId: person.id, managerId: person.managerId, branch: person.branch, department: person.department, team: person.primaryTeamId });
  }).sort((a, b) => b.date.localeCompare(a.date));
  const selectedId = moduleId.split("/")[1];
  const selected = visible.find((item) => item.id === selectedId);
  return <div className="page-stack hr-core wfh-core"><WorkspaceHeader title="WFH & báo cáo ngày" action={<button className="primary-button" onClick={() => onNavigate("approvals/wfh/new")}>Tạo đơn WFH</button>} />
    {selected ? <><button className="hr-back" onClick={() => onNavigate("ai-wfh")}><ArrowLeft size={15} /> Tất cả đơn WFH</button><WfhDetail key={selected.id} request={selected} session={store.sessions.find((item) => item.requestId === selected.id)} selfId={selfId} businessDate={clock.businessDate} periodStatus={periods.find((item) => item.id === selected.date.slice(0, 7))?.status} run={run} onNavigate={onNavigate} /></> : <section className="panel hr-directory"><div className="hr-core-heading"><h2>Đơn và phiên WFH ({visible.length})</h2></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Mã đơn</th><th>Nhân sự</th><th>Ngày</th><th>Kế hoạch</th><th>Trạng thái</th><th /></tr></thead><tbody>{visible.map((item) => { const linked = store.sessions.find((entry) => entry.requestId === item.id); return <tr key={item.id}><td className="mono">{item.id}</td><td>{item.employee}</td><td>{dateLabel(item.date)}</td><td>{item.detail}</td><td><StatusPill tone={linked?.review?.decision === "confirmed" ? "success" : linked?.review?.decision === "excluded" ? "neutral" : linked?.reportSubmittedAt ? "success" : item.status === "rejected" ? "neutral" : "warning"}>{stateLabel(item, linked)}</StatusPill></td><td><button className="row-action" onClick={() => onNavigate(`ai-wfh/${item.id}`)}>Mở <ArrowRight size={14} /></button></td></tr>; })}</tbody></table></div>{!visible.length && <p className="hr-empty">Chưa có đơn WFH trong phạm vi hiện tại. Hãy tạo đơn và chờ người quản lý duyệt.</p>}</section>}
  </div>;
}

function WfhDetail({ request, session, selfId, businessDate, periodStatus, run, onNavigate }: { request: BusinessRequest; session?: WfhSession; selfId?: string; businessDate: string; periodStatus: "reconciling" | "closed" | "exported" | undefined; run: ReturnType<typeof useWfhDemo>["run"]; onNavigate: (id: string) => void }) {
  const [draft, setDraft] = useState(session?.reportDraft ?? "");
  const owner = !!selfId && request.employeeId === selfId;
  function action(kind: "check-in" | "check-out" | "save-report" | "submit-report") {
    if (!selfId) return;
    const result = run(request, { action: kind, requestId: request.id, employeeId: selfId, expectedVersion: session?.version ?? 0, periodStatus, reportText: draft });
    if (!result.ok) { toast.error(result.error); return; }
    toast.success(kind === "check-in" ? "Đã bắt đầu phiên WFH demo." : kind === "check-out" ? "Đã kết thúc phiên; hãy nộp báo cáo ngày." : kind === "save-report" ? "Đã lưu nháp báo cáo cục bộ." : "Đã nộp báo cáo ngày trong demo.");
  }
  return <section className="panel wfh-detail"><div className="hr-core-heading"><div><span className="eyebrow">{request.id} · {request.employee}</span><h2>WFH ngày {dateLabel(request.date)}</h2></div><StatusPill tone={session?.reportSubmittedAt ? "success" : "warning"}>{stateLabel(request, session)}</StatusPill></div><p>{request.detail}</p><div className="wfh-session-facts"><div><Clock3 size={16} /><span>Bắt đầu</span><strong>{timeLabel(session?.checkInAt)}</strong></div><div><Clock3 size={16} /><span>Kết thúc</span><strong>{timeLabel(session?.checkOutAt)}</strong></div><div><FileText size={16} /><span>Nộp báo cáo</span><strong>{timeLabel(session?.reportSubmittedAt)}</strong></div></div>
    {request.status !== "approved" && <p className="hr-empty">Chờ quyết định đơn WFH trước khi mở phiên. <button className="row-action" onClick={() => onNavigate("approvals")}>Mở đơn</button></p>}
    {request.status === "approved" && !session && owner && <button className="primary-button" disabled={businessDate !== request.date || periodStatus !== "reconciling"} title={periodStatus !== "reconciling" ? "Kỳ công không còn mở" : businessDate !== request.date ? "Chỉ bắt đầu vào đúng ngày được duyệt" : undefined} onClick={() => action("check-in")}><Play size={15} /> Bắt đầu phiên</button>}
    {session && <><label className="wfh-report-field"><span>Báo cáo công việc trong ngày</span><textarea rows={5} value={draft} disabled={!owner || Boolean(session.reportSubmittedAt) || Boolean(session.review) || periodStatus !== "reconciling"} onChange={(event) => setDraft(event.target.value)} placeholder="Công việc đã hoàn thành, vướng mắc và việc tiếp theo..." /></label>{session.reportSubmittedAt && <p>Đã nộp bản báo cáo cuối cùng; không thể sửa đè. Nội dung lưu trong trình duyệt demo.</p>}{session.review && <p>HR đối soát: {session.review.decision === "confirmed" ? "xác nhận vào bảng công" : "loại khỏi bảng công"} · {session.review.reason}</p>}{owner && !session.reportSubmittedAt && !session.review && periodStatus === "reconciling" && <div className="hr-toolbar-actions"><button className="secondary-button" onClick={() => action("save-report")}><Save size={15} /> Lưu nháp</button>{!session.checkOutAt ? <button className="primary-button" disabled={businessDate !== request.date} onClick={() => action("check-out")}><Check size={15} /> Kết thúc phiên</button> : <button className="primary-button" disabled={draft.trim().length < 10} onClick={() => action("submit-report")}><FileText size={15} /> Nộp báo cáo</button>}</div>}</>}
  </section>;
}
