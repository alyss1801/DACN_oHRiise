"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  CalendarDays,
  Check,
  ChevronRight,
  FileClock,
  FileQuestion,
  Laptop2,
  ReceiptText,
  Search,
  Send,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useDemoData, type BusinessRequestType } from "@/features/demo/demo-data-context";
import { FormField, StatusPill, WorkflowDialog, WorkspaceHeader } from "@/features/employee/workspace-frame";
import { useSession } from "@/features/session/session-context";
import { can } from "@/lib/authorization/engine";

type ApprovalView = "create" | "center";
type RequestCategory = "all" | "attendance" | "finance" | "timeoff";
type RequestTemplate = {
  id: "adjustment" | "expense" | "wfh" | "leave";
  label: string;
  description: string;
  category: Exclude<RequestCategory, "all">;
  type: BusinessRequestType;
  prefix: string;
  icon: LucideIcon;
  tone: string;
};

const requestTemplates: RequestTemplate[] = [
  { id: "adjustment", label: "Điều chỉnh Clock-in/out", description: "Bổ sung hoặc sửa thời gian điểm danh", category: "attendance", type: "Điều chỉnh chấm công", prefix: "ATT-2026", icon: FileClock, tone: "violet" },
  { id: "expense", label: "Xin chi tiền", description: "Đề nghị thanh toán chi phí công việc", category: "finance", type: "Chi phí", prefix: "EXP-2026", icon: Banknote, tone: "pink" },
  { id: "wfh", label: "Đơn WFH", description: "Đăng ký làm việc từ xa", category: "timeoff", type: "WFH", prefix: "WFH-2026", icon: Laptop2, tone: "cyan" },
  { id: "leave", label: "Đơn nghỉ phép", description: "Nghỉ phép năm, nghỉ bệnh hoặc nghỉ khác", category: "timeoff", type: "Nghỉ phép", prefix: "LV-2026", icon: CalendarDays, tone: "blue" },
];

export function ApprovalCenterWorkspace() {
  const { session } = useSession();
  const { requests, addBusinessRequest, decideBusinessRequest } = useDemoData();
  const canApprove = can(session, "approvals", "approve");
  const [view, setView] = useState<ApprovalView>("create");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<RequestCategory>("all");
  const [template, setTemplate] = useState<RequestTemplate | null>(null);
  const [requestDate, setRequestDate] = useState("10/10/2026");
  const [requestDetail, setRequestDetail] = useState("");
  const [requestOption, setRequestOption] = useState("Cả ngày");
  const [amount, setAmount] = useState("");
  const centerRequests = useMemo(() => canApprove ? requests : requests.filter((item) => item.employee === "Nguyễn Thu Hà"), [canApprove, requests]);
  const [selectedId, setSelectedId] = useState(centerRequests[0]?.id ?? "");
  const [decision, setDecision] = useState<"approve" | "reject" | "clarify" | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const selected = centerRequests.find((item) => item.id === selectedId) ?? centerRequests[0];
  const visibleTemplates = requestTemplates.filter((item) => (category === "all" || item.category === category) && `${item.label} ${item.description}`.toLowerCase().includes(query.toLowerCase()));

  function openRequest(item: RequestTemplate) {
    setTemplate(item);
    setRequestDate("10/10/2026");
    setRequestDetail("");
    setRequestOption(item.id === "adjustment" ? "Thiếu check-out" : item.id === "leave" ? "Phép năm" : "Cả ngày");
    setAmount("");
  }

  function submitRequest() {
    if (!template) return;
    if (requestDetail.trim().length < 5) {
      toast.error("Vui lòng nhập nội dung yêu cầu rõ ràng hơn.");
      return;
    }
    if (template.id === "expense" && !amount.trim()) {
      toast.error("Vui lòng nhập số tiền đề nghị.");
      return;
    }
    const detail = template.id === "expense"
      ? `${requestDetail.trim()} · ${amount} ₫`
      : `${requestOption} · ${requestDetail.trim()}`;
    const id = addBusinessRequest({ idPrefix: template.prefix, type: template.type, employee: "Nguyễn Thu Hà", initials: "NH", date: requestDate, detail });
    setTemplate(null);
    setSelectedId(id);
    setView("center");
    toast.success(`${template.label} đã được gửi phê duyệt.`);
  }

  function submitDecision() {
    if (!selected || !decision) return;
    if (decision !== "approve" && decisionNote.trim().length < 8) {
      toast.error("Cần nhập nội dung ít nhất 8 ký tự.");
      return;
    }
    if (decision === "clarify") toast.success("Đã gửi yêu cầu bổ sung thông tin.");
    else decideBusinessRequest(selected.id, decision === "approve" ? "approved" : "rejected", decisionNote);
    setDecision(null);
    setDecisionNote("");
  }

  return <div className="page-stack approval-center-workspace">
    <WorkspaceHeader title="Phê duyệt" subtitle={`${centerRequests.filter((item) => item.status === "pending").length} yêu cầu đang chờ · ${canApprove ? "Phạm vi đội ngũ" : "Yêu cầu của tôi"}`} />
    <nav className="approval-top-tabs"><button className={view === "create" ? "is-active" : ""} onClick={() => setView("create")}>Gửi yêu cầu</button><button className={view === "center" ? "is-active" : ""} onClick={() => setView("center")}>Trung tâm phê duyệt <b>{centerRequests.filter((item) => item.status === "pending").length}</b></button></nav>
    {view === "create" ? <RequestCatalog query={query} setQuery={setQuery} category={category} setCategory={setCategory} visibleTemplates={visibleTemplates} openRequest={openRequest} /> : <ApprovalCenter requests={centerRequests} selected={selected} selectedId={selectedId} setSelectedId={setSelectedId} canApprove={canApprove} setDecision={setDecision} />}

    <WorkflowDialog open={template !== null} onOpenChange={(open) => !open && setTemplate(null)} title={template?.label ?? "Gửi yêu cầu"} description="Yêu cầu sẽ được chuyển đến người phê duyệt theo đúng phạm vi." footer={<><button className="secondary-button" onClick={() => setTemplate(null)}>Hủy</button><button className="primary-button" onClick={submitRequest}><Send size={15} strokeWidth={1.5} /> Gửi yêu cầu</button></>}>
      <div className="form-grid two-cols"><FormField label="Ngày áp dụng" required><input value={requestDate} onChange={(event) => setRequestDate(event.target.value)} /></FormField>{template?.id === "expense" ? <FormField label="Số tiền đề nghị" required><input inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="4.850.000" /></FormField> : <FormField label={template?.id === "adjustment" ? "Loại điều chỉnh" : template?.id === "leave" ? "Loại nghỉ" : "Thời lượng"} required><select value={requestOption} onChange={(event) => setRequestOption(event.target.value)}>{template?.id === "adjustment" ? <><option>Thiếu check-in</option><option>Thiếu check-out</option><option>Sai thời gian</option></> : template?.id === "leave" ? <><option>Phép năm</option><option>Nghỉ bệnh</option><option>Nghỉ không lương</option></> : <><option>Cả ngày</option><option>Buổi sáng</option><option>Buổi chiều</option></>}</select></FormField>}</div>
      <div className="dialog-field-gap"><FormField label={template?.id === "expense" ? "Mục đích chi" : template?.id === "wfh" ? "Kế hoạch công việc" : "Nội dung / lý do"} required><textarea value={requestDetail} onChange={(event) => setRequestDetail(event.target.value)} placeholder="Mô tả thông tin để người duyệt có đủ ngữ cảnh..." /></FormField></div>
    </WorkflowDialog>
    {selected && <WorkflowDialog open={decision !== null} onOpenChange={(open) => !open && setDecision(null)} title={decision === "approve" ? "Xác nhận phê duyệt" : decision === "clarify" ? "Yêu cầu bổ sung" : "Từ chối yêu cầu"} description={`${selected.id} · ${selected.employee}`} footer={<><button className="secondary-button" onClick={() => setDecision(null)}>Hủy</button><button className={decision === "approve" ? "primary-button" : "secondary-button reject"} onClick={submitDecision}>{decision === "approve" ? "Phê duyệt" : decision === "clarify" ? "Gửi yêu cầu" : "Gửi lý do từ chối"}</button></>}><FormField label={decision === "approve" ? "Ghi chú (không bắt buộc)" : "Nội dung"} required={decision !== "approve"}><textarea value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} placeholder="Thêm ngữ cảnh rõ ràng cho nhân viên..." /></FormField></WorkflowDialog>}
  </div>;
}

function RequestCatalog({ query, setQuery, category, setCategory, visibleTemplates, openRequest }: { query: string; setQuery: (value: string) => void; category: RequestCategory; setCategory: (value: RequestCategory) => void; visibleTemplates: RequestTemplate[]; openRequest: (item: RequestTemplate) => void }) {
  return <section className="request-catalog"><div className="approval-search"><Search size={17} strokeWidth={1.5} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm loại yêu cầu..." /></div><div className="request-suggestions"><h2>Đề xuất</h2><div>{requestTemplates.slice(0, 2).map((item) => <RequestTile key={item.id} item={item} onClick={() => openRequest(item)} />)}</div></div><div className="request-library panel"><aside><span>Tất cả yêu cầu</span>{[{ id: "all", label: "Tất cả" }, { id: "attendance", label: "Điểm danh" }, { id: "finance", label: "Tài chính" }, { id: "timeoff", label: "WFH & nghỉ phép" }].map((item) => <button className={category === item.id ? "is-active" : ""} key={item.id} onClick={() => setCategory(item.id as RequestCategory)}>{item.label}</button>)}</aside><div className="request-library-content"><header><div><span className="eyebrow">REQUEST CATALOG</span><h2>{category === "all" ? "Tất cả yêu cầu" : category === "attendance" ? "Điểm danh" : category === "finance" ? "Tài chính" : "WFH & nghỉ phép"}</h2></div><span>{visibleTemplates.length} biểu mẫu</span></header><div className="request-tile-grid">{visibleTemplates.map((item) => <RequestTile key={item.id} item={item} onClick={() => openRequest(item)} />)}</div></div></div></section>;
}

function RequestTile({ item, onClick }: { item: RequestTemplate; onClick: () => void }) {
  const Icon = item.icon;
  return <button className="request-tile" onClick={onClick}><span className={item.tone}><Icon size={20} strokeWidth={1.6} /></span><div><strong>{item.label}</strong><small>{item.description}</small></div><ChevronRight size={16} strokeWidth={1.5} /></button>;
}

function ApprovalCenter({ requests, selected, selectedId, setSelectedId, canApprove, setDecision }: { requests: ReturnType<typeof useDemoData>["requests"]; selected: ReturnType<typeof useDemoData>["requests"][number] | undefined; selectedId: string; setSelectedId: (id: string) => void; canApprove: boolean; setDecision: (value: "approve" | "reject" | "clarify") => void }) {
  return <section className="approval-layout panel"><div className="approval-master"><div className="approval-center-filter"><div><Search size={15} strokeWidth={1.5} /><span>Việc cần làm</span></div><StatusPill tone="warning">{requests.filter((item) => item.status === "pending").length}</StatusPill></div><div className="approval-list">{requests.map((request) => <button className={selectedId === request.id ? "is-active" : ""} key={request.id} onClick={() => setSelectedId(request.id)}><div className="avatar avatar-sm">{request.initials}</div><div><span>{request.type} · {request.submitted}</span><strong>{request.employee}</strong><p>{request.detail}</p></div>{request.status === "pending" ? <ChevronRight size={15} strokeWidth={1.5} /> : <StatusPill tone={request.status === "approved" ? "success" : request.status === "rejected" ? "danger" : "blue"}>{request.status === "approved" ? "Đã duyệt" : request.status === "rejected" ? "Từ chối" : "HR review"}</StatusPill>}</button>)}</div></div>{selected ? <article className="approval-detail"><div className="approval-detail-head"><div><span className="eyebrow">{selected.id}</span><h3>{selected.type} · {selected.employee}</h3><p>Gửi {selected.submitted}</p></div><StatusPill tone={selected.status === "pending" ? "warning" : selected.status === "approved" ? "success" : selected.status === "rejected" ? "danger" : "blue"}>{selected.status === "pending" ? "Chờ phê duyệt" : selected.status === "approved" ? "Đã duyệt" : selected.status === "rejected" ? "Đã từ chối" : "HR review"}</StatusPill></div><div className="approval-person"><div className="avatar">{selected.initials}</div><div><strong>{selected.employee}</strong><span>Data Platform · HCM-Q1</span></div></div><div className="approval-facts"><div><span>Ngày áp dụng</span><strong>{selected.date}</strong></div><div><span>Loại yêu cầu</span><strong>{selected.type}</strong></div><div className="wide"><span>Nội dung</span><strong>{selected.detail}</strong></div></div><RequestContext type={selected.type} />{selected.note && <div className="decision-note"><strong>Ghi chú quyết định</strong><p>{selected.note}</p></div>}{canApprove && selected.status === "pending" && <div className="approval-actions"><button className="text-button" onClick={() => setDecision("clarify")}><FileQuestion size={15} strokeWidth={1.5} /> Yêu cầu bổ sung</button><button className="secondary-button reject" onClick={() => setDecision("reject")}><X size={15} strokeWidth={1.5} /> Từ chối</button><button className="primary-button" onClick={() => setDecision("approve")}><Check size={15} strokeWidth={1.5} /> Phê duyệt</button></div>}</article> : <div className="compact-empty"><strong>Chưa có yêu cầu</strong><p>Yêu cầu mới sẽ xuất hiện tại đây.</p></div>}</section>;
}

function RequestContext({ type }: { type: BusinessRequestType }) {
  const data = type === "Nghỉ phép" ? { icon: CalendarDays, title: "Ngữ cảnh nghỉ phép", copy: "Còn 12 ngày phép · không trùng lịch nghỉ trong nhóm." } : type === "WFH" ? { icon: Laptop2, title: "Chính sách WFH", copy: "Còn 01 ngày WFH trong tuần · Daily Report bắt buộc." } : type === "Chi phí" ? { icon: ReceiptText, title: "Ngữ cảnh chi phí", copy: "Yêu cầu sẽ qua Team Lead trước khi HR kiểm tra hạn mức." } : { icon: FileClock, title: "Đối chiếu điểm danh", copy: "Log GPS và gateway được đính kèm để người duyệt đối chiếu." };
  const Icon = data.icon;
  return <div className="team-context"><div><Icon size={16} strokeWidth={1.5} /><strong>{data.title}</strong></div><p>{data.copy}</p></div>;
}
