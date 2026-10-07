"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  Banknote,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  FileClock,
  FileQuestion,
  Inbox,
  Laptop2,
  ListChecks,
  ReceiptText,
  Search,
  Send,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  useDemoData,
  type BusinessRequest,
  type BusinessRequestStatus,
  type BusinessRequestType,
} from "@/features/demo/demo-data-context";
import { FormField, StatusPill, WorkflowDialog, WorkspaceHeader } from "@/features/employee/workspace-frame";
import { useSession } from "@/features/session/session-context";
import { can } from "@/lib/authorization/engine";

type ApprovalView = "create" | "center" | "analytics" | "data";
type CenterFolder = "todo" | "done" | "cc" | "sent";
type RequestCategory = "all" | "attendance" | "finance" | "timeoff";

type RequestTemplate = {
  id: "adjustment" | "expense" | "wfh" | "leave";
  label: string;
  shortLabel: string;
  description: string;
  category: Exclude<RequestCategory, "all">;
  type: BusinessRequestType;
  prefix: string;
  icon: LucideIcon;
  tone: string;
};

const requestTemplates: RequestTemplate[] = [
  { id: "adjustment", label: "Điều chỉnh Clock-in/out", shortLabel: "Điều chỉnh", description: "Bổ sung hoặc sửa thời gian điểm danh", category: "attendance", type: "Điều chỉnh chấm công", prefix: "ATT-2026", icon: FileClock, tone: "violet" },
  { id: "expense", label: "Xin chi tiền", shortLabel: "Kinh phí", description: "Đề nghị duyệt kinh phí hoặc hoàn ứng", category: "finance", type: "Chi phí", prefix: "EXP-2026", icon: Banknote, tone: "pink" },
  { id: "wfh", label: "Đơn WFH", shortLabel: "Remote", description: "Đăng ký làm việc từ xa", category: "timeoff", type: "WFH", prefix: "WFH-2026", icon: Laptop2, tone: "cyan" },
  { id: "leave", label: "Đơn nghỉ phép", shortLabel: "Nghỉ phép", description: "Phép năm, nghỉ bệnh hoặc nghỉ khác", category: "timeoff", type: "Nghỉ phép", prefix: "LV-2026", icon: CalendarDays, tone: "blue" },
];

const supportedTypes = requestTemplates.map((item) => item.type);

export function ApprovalMiniappWorkspace() {
  const { session } = useSession();
  const { requests, addBusinessRequest, decideBusinessRequest } = useDemoData();
  const canApprove = can(session, "approvals", "approve");
  const scopedRequests = useMemo(
    () => canApprove ? requests : requests.filter((item) => item.employee === "Nguyễn Thu Hà"),
    [canApprove, requests],
  );
  const approvalRequests = useMemo(
    () => scopedRequests.filter((item) => supportedTypes.includes(item.type)),
    [scopedRequests],
  );
  const pendingCount = approvalRequests.filter((item) => item.status === "pending").length;

  const [view, setView] = useState<ApprovalView>("create");
  const [folder, setFolder] = useState<CenterFolder>(canApprove ? "todo" : "sent");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<RequestCategory>("all");
  const [template, setTemplate] = useState<RequestTemplate | null>(null);
  const [requestDate, setRequestDate] = useState("10/10/2026");
  const [requestDetail, setRequestDetail] = useState("");
  const [requestOption, setRequestOption] = useState("Cả ngày");
  const [amount, setAmount] = useState("");
  const [selectedId, setSelectedId] = useState(approvalRequests[0]?.id ?? "");
  const [decision, setDecision] = useState<"approve" | "reject" | "clarify" | null>(null);
  const [decisionNote, setDecisionNote] = useState("");

  const visibleTemplates = requestTemplates.filter((item) => (
    (category === "all" || item.category === category)
    && `${item.label} ${item.description}`.toLowerCase().includes(query.toLowerCase())
  ));

  const selected = approvalRequests.find((item) => item.id === selectedId) ?? approvalRequests[0];

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
    const id = addBusinessRequest({
      idPrefix: template.prefix,
      type: template.type,
      employee: "Nguyễn Thu Hà",
      initials: "NH",
      date: requestDate,
      detail,
    });
    setTemplate(null);
    setSelectedId(id);
    setFolder("sent");
    setView("center");
    toast.success(`${template.label} đã được gửi vào luồng phê duyệt.`);
  }

  function submitDecision() {
    if (!selected || !decision) return;
    if (decision !== "approve" && decisionNote.trim().length < 8) {
      toast.error("Cần nhập nội dung ít nhất 8 ký tự.");
      return;
    }
    if (decision === "clarify") {
      toast.success("Đã gửi yêu cầu bổ sung thông tin.");
    } else {
      decideBusinessRequest(selected.id, decision === "approve" ? "approved" : "rejected", decisionNote);
      toast.success(decision === "approve" ? "Đã phê duyệt yêu cầu." : "Đã từ chối yêu cầu.");
    }
    setDecision(null);
    setDecisionNote("");
  }

  function openRecord(id: string) {
    setSelectedId(id);
    setFolder("sent");
    setView("center");
  }

  return (
    <div className="page-stack approval-miniapp-workspace">
      <WorkspaceHeader title="Phê duyệt" subtitle={`${pendingCount} yêu cầu đang chờ · ${approvalRequests.length} hồ sơ trong phạm vi`} />

      <nav className="approval-top-tabs approval-miniapp-tabs" aria-label="Điều hướng miniapp Phê duyệt">
        <MiniappTab active={view === "create"} icon={Send} label="Gửi yêu cầu" onClick={() => setView("create")} />
        <MiniappTab active={view === "center"} icon={Inbox} label="Trung tâm phê duyệt" count={pendingCount} onClick={() => setView("center")} />
        <MiniappTab active={view === "analytics"} icon={BarChart3} label="Chẩn đoán hiệu quả" onClick={() => setView("analytics")} />
        <MiniappTab active={view === "data"} icon={Database} label="Quản lý dữ liệu" onClick={() => setView("data")} />
      </nav>

      {view === "create" && (
        <RequestCatalog
          query={query}
          setQuery={setQuery}
          category={category}
          setCategory={setCategory}
          visibleTemplates={visibleTemplates}
          openRequest={openRequest}
        />
      )}
      {view === "center" && (
        <ApprovalCenter
          requests={approvalRequests}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          folder={folder}
          setFolder={setFolder}
          canApprove={canApprove}
          setDecision={setDecision}
        />
      )}
      {view === "analytics" && <ApprovalAnalytics requests={approvalRequests} />}
      {view === "data" && <ApprovalDataManager requests={approvalRequests} onOpen={openRecord} />}

      <WorkflowDialog
        open={template !== null}
        onOpenChange={(open) => !open && setTemplate(null)}
        title={template?.label ?? "Gửi yêu cầu"}
        description="Yêu cầu sẽ tự động đi đúng tuyến phê duyệt theo loại hồ sơ."
        footer={<><button className="secondary-button" onClick={() => setTemplate(null)}>Hủy</button><button className="primary-button" onClick={submitRequest}><Send size={15} strokeWidth={1.5} /> Gửi yêu cầu</button></>}
      >
        <div className="form-grid two-cols">
          <FormField label="Ngày áp dụng" required><input value={requestDate} onChange={(event) => setRequestDate(event.target.value)} /></FormField>
          {template?.id === "expense" ? (
            <FormField label="Số tiền đề nghị" required><input inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="4.850.000" /></FormField>
          ) : (
            <FormField label={template?.id === "adjustment" ? "Loại điều chỉnh" : template?.id === "leave" ? "Loại nghỉ" : "Thời lượng"} required>
              <select value={requestOption} onChange={(event) => setRequestOption(event.target.value)}>
                {template?.id === "adjustment" ? <><option>Thiếu check-in</option><option>Thiếu check-out</option><option>Sai thời gian</option></> : template?.id === "leave" ? <><option>Phép năm</option><option>Nghỉ bệnh</option><option>Nghỉ không lương</option></> : <><option>Cả ngày</option><option>Buổi sáng</option><option>Buổi chiều</option></>}
              </select>
            </FormField>
          )}
        </div>
        <div className="dialog-field-gap">
          <FormField label={template?.id === "expense" ? "Mục đích chi" : template?.id === "wfh" ? "Kế hoạch công việc" : "Nội dung / lý do"} required>
            <textarea value={requestDetail} onChange={(event) => setRequestDetail(event.target.value)} placeholder="Mô tả đủ thông tin để người duyệt ra quyết định..." />
          </FormField>
        </div>
      </WorkflowDialog>

      {selected && (
        <WorkflowDialog
          open={decision !== null}
          onOpenChange={(open) => !open && setDecision(null)}
          title={decision === "approve" ? "Xác nhận phê duyệt" : decision === "clarify" ? "Yêu cầu bổ sung" : "Từ chối yêu cầu"}
          description={`${selected.id} · ${selected.employee}`}
          footer={<><button className="secondary-button" onClick={() => setDecision(null)}>Hủy</button><button className={decision === "approve" ? "primary-button" : "secondary-button reject"} onClick={submitDecision}>{decision === "approve" ? "Phê duyệt" : decision === "clarify" ? "Gửi yêu cầu" : "Gửi lý do từ chối"}</button></>}
        >
          <FormField label={decision === "approve" ? "Ghi chú (không bắt buộc)" : "Nội dung"} required={decision !== "approve"}>
            <textarea value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} placeholder="Thêm ngữ cảnh rõ ràng cho nhân viên..." />
          </FormField>
        </WorkflowDialog>
      )}
    </div>
  );
}

function MiniappTab({ active, icon: Icon, label, count, onClick }: { active: boolean; icon: LucideIcon; label: string; count?: number; onClick: () => void }) {
  return <button className={active ? "is-active" : ""} onClick={onClick}><Icon size={16} strokeWidth={1.6} /><span>{label}</span>{count !== undefined && <b>{count}</b>}</button>;
}

function RequestCatalog({ query, setQuery, category, setCategory, visibleTemplates, openRequest }: { query: string; setQuery: (value: string) => void; category: RequestCategory; setCategory: (value: RequestCategory) => void; visibleTemplates: RequestTemplate[]; openRequest: (item: RequestTemplate) => void }) {
  return (
    <section className="request-catalog">
      <div className="approval-search"><Search size={17} strokeWidth={1.5} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm loại yêu cầu..." /></div>
      <div className="request-suggestions"><h2>Đề xuất</h2><div>{requestTemplates.slice(0, 2).map((item) => <RequestTile key={item.id} item={item} onClick={() => openRequest(item)} />)}</div></div>
      <div className="request-library panel">
        <aside>
          <span>Tất cả yêu cầu</span>
          {[{ id: "all", label: "Tất cả" }, { id: "attendance", label: "Điểm danh" }, { id: "finance", label: "Tài chính" }, { id: "timeoff", label: "WFH & nghỉ phép" }].map((item) => <button className={category === item.id ? "is-active" : ""} key={item.id} onClick={() => setCategory(item.id as RequestCategory)}>{item.label}</button>)}
        </aside>
        <div className="request-library-content">
          <header><div><h2>{category === "all" ? "Tất cả yêu cầu" : category === "attendance" ? "Điểm danh" : category === "finance" ? "Tài chính" : "WFH & nghỉ phép"}</h2></div><span>{visibleTemplates.length} biểu mẫu</span></header>
          <div className="request-tile-grid">{visibleTemplates.map((item) => <RequestTile key={item.id} item={item} onClick={() => openRequest(item)} />)}</div>
        </div>
      </div>
    </section>
  );
}

function RequestTile({ item, onClick }: { item: RequestTemplate; onClick: () => void }) {
  const Icon = item.icon;
  return <button className="request-tile" onClick={onClick}><span className={item.tone}><Icon size={20} strokeWidth={1.6} /></span><div><strong>{item.label}</strong><small>{item.description}</small></div><ChevronRight size={16} strokeWidth={1.5} /></button>;
}

function ApprovalCenter({ requests, selectedId, setSelectedId, folder, setFolder, canApprove, setDecision }: { requests: BusinessRequest[]; selectedId: string; setSelectedId: (id: string) => void; folder: CenterFolder; setFolder: (folder: CenterFolder) => void; canApprove: boolean; setDecision: (value: "approve" | "reject" | "clarify") => void }) {
  const folders = [
    { id: "todo" as const, label: "Việc cần làm", icon: Inbox, count: requests.filter((item) => item.status === "pending").length },
    { id: "done" as const, label: "Xong", icon: CheckCircle2, count: requests.filter((item) => item.status === "approved" || item.status === "rejected").length },
    { id: "cc" as const, label: "Đã CC", icon: ListChecks, count: requests.filter((item) => item.status === "hr-review").length },
    { id: "sent" as const, label: "Đã gửi", icon: Send, count: requests.filter((item) => item.employee === "Nguyễn Thu Hà").length },
  ];
  const folderRequests = requests.filter((item) => {
    if (folder === "todo") return item.status === "pending";
    if (folder === "done") return item.status === "approved" || item.status === "rejected";
    if (folder === "cc") return item.status === "hr-review";
    return item.employee === "Nguyễn Thu Hà";
  });
  const selected = folderRequests.find((item) => item.id === selectedId) ?? folderRequests[0];

  return (
    <section className="approval-center-shell panel">
      <aside className="approval-folder-nav">
        <div className="approval-folder-search"><Search size={16} strokeWidth={1.5} /><span>Tìm kiếm</span></div>
        {folders.map((item) => {
          const Icon = item.icon;
          return <button key={item.id} className={folder === item.id ? "is-active" : ""} onClick={() => setFolder(item.id)}><Icon size={17} strokeWidth={1.5} /><span>{item.label}</span><b>{item.count}</b></button>;
        })}
      </aside>

      <div className="approval-record-list">
        <header><strong>{folders.find((item) => item.id === folder)?.label}</strong><span>{folderRequests.length} hồ sơ</span></header>
        <div>
          {folderRequests.map((request) => <ApprovalRecordCard key={request.id} request={request} active={selected?.id === request.id} onClick={() => setSelectedId(request.id)} />)}
          {folderRequests.length === 0 && <div className="approval-empty"><CheckCircle2 size={34} strokeWidth={1.3} /><strong>Không có nội dung</strong><span>Hồ sơ phù hợp sẽ xuất hiện tại đây.</span></div>}
        </div>
      </div>

      {selected ? (
        <ApprovalRecordDetail request={selected} canApprove={canApprove} setDecision={setDecision} />
      ) : (
        <div className="approval-empty approval-empty-detail"><FileQuestion size={42} strokeWidth={1.3} /><strong>Chọn một hồ sơ</strong><span>Chi tiết và luồng phê duyệt sẽ hiển thị tại đây.</span></div>
      )}
    </section>
  );
}

function ApprovalRecordCard({ request, active, onClick }: { request: BusinessRequest; active: boolean; onClick: () => void }) {
  return (
    <button className={`approval-record-card${active ? " is-active" : ""}`} onClick={onClick}>
      <div><strong>{displayType(request.type)}</strong><RequestStatus status={request.status} /></div>
      <p>{request.detail}</p>
      <footer><span className="avatar avatar-sm">{request.initials}</span><span>{request.employee}</span><time>{request.submitted}</time></footer>
    </button>
  );
}

function ApprovalRecordDetail({ request, canApprove, setDecision }: { request: BusinessRequest; canApprove: boolean; setDecision: (value: "approve" | "reject" | "clarify") => void }) {
  return (
    <article className="approval-record-detail">
      <header>
        <div><span>{request.id}</span><h2>{displayType(request.type)}</h2></div>
        <RequestStatus status={request.status} />
      </header>
      <div className="approval-requester"><span className="avatar">{request.initials}</span><div><strong>{request.employee}</strong><span>Sản phẩm · HCM-Q1 · gửi {request.submitted}</span></div></div>
      <div className="approval-detail-tabs"><button className="is-active">Chi tiết</button><button>Hồ sơ phê duyệt</button><button>Nhận xét</button></div>
      <section className="approval-detail-section">
        <h3>Chi tiết yêu cầu</h3>
        <dl>
          <div><dt>Ngày áp dụng</dt><dd>{request.date}</dd></div>
          <div><dt>Loại yêu cầu</dt><dd>{displayType(request.type)}</dd></div>
          <div><dt>Nội dung</dt><dd>{request.detail}</dd></div>
        </dl>
      </section>
      <RequestContext type={request.type} />
      <ApprovalProcess request={request} />
      {request.note && <div className="decision-note"><strong>Ghi chú quyết định</strong><p>{request.note}</p></div>}
      {canApprove && request.status === "pending" && (
        <footer className="approval-actions approval-detail-actions">
          <button className="text-button" onClick={() => setDecision("clarify")}><FileQuestion size={15} strokeWidth={1.5} /> Yêu cầu bổ sung</button>
          <button className="secondary-button reject" onClick={() => setDecision("reject")}><X size={15} strokeWidth={1.5} /> Từ chối</button>
          <button className="primary-button" onClick={() => setDecision("approve")}><Check size={15} strokeWidth={1.5} /> Phê duyệt</button>
        </footer>
      )}
    </article>
  );
}

function ApprovalProcess({ request }: { request: BusinessRequest }) {
  const finalLabel = request.type === "Chi phí" ? "Tài chính kiểm tra hạn mức" : "Quản lý trực tiếp phê duyệt";
  return (
    <section className="approval-process">
      <h3>Hồ sơ phê duyệt</h3>
      <div className="approval-process-step is-complete"><i><Check size={12} /></i><div><strong>Gửi yêu cầu</strong><span>{request.employee} · {request.submitted}</span></div><small>Đã gửi</small></div>
      <div className={`approval-process-step${request.status === "pending" ? " is-current" : request.status === "approved" || request.status === "hr-review" ? " is-complete" : " is-rejected"}`}><i>{request.status === "approved" || request.status === "hr-review" ? <Check size={12} /> : <Clock3 size={12} />}</i><div><strong>{finalLabel}</strong><span>Trần Minh Quân · Team Lead</span></div><small>{statusLabel(request.status)}</small></div>
    </section>
  );
}

function ApprovalAnalytics({ requests }: { requests: BusinessRequest[] }) {
  const pending = requests.filter((item) => item.status === "pending").length;
  const completed = requests.filter((item) => item.status === "approved" || item.status === "rejected").length;
  const approved = requests.filter((item) => item.status === "approved").length;
  const completionRate = requests.length ? Math.round((completed / requests.length) * 100) : 0;
  const approvalRate = completed ? Math.round((approved / completed) * 100) : 0;

  return (
    <section className="approval-analytics">
      <div className="approval-metric-grid">
        <MetricCard label="Tổng hồ sơ" value={String(requests.length)} note="Cùng một nguồn dữ liệu" />
        <MetricCard label="Đang chờ" value={String(pending)} note="Cần tiếp tục xử lý" tone="warning" />
        <MetricCard label="Đã hoàn tất" value={`${completionRate}%`} note={`${completed}/${requests.length} hồ sơ`} tone="success" />
        <MetricCard label="Tỷ lệ phê duyệt" value={`${approvalRate}%`} note="Trên hồ sơ đã xử lý" tone="blue" />
      </div>
      <div className="approval-diagnostics-grid">
        <article className="panel workflow-health-panel">
          <header><div><h2>Sức khỏe từng luồng</h2><p>Số liệu đọc trực tiếp từ kho yêu cầu dùng chung.</p></div><BarChart3 size={20} strokeWidth={1.5} /></header>
          <div className="workflow-health-list">{requestTemplates.map((template) => {
            const records = requests.filter((item) => item.type === template.type);
            const done = records.filter((item) => item.status !== "pending").length;
            const rate = records.length ? Math.round((done / records.length) * 100) : 0;
            const Icon = template.icon;
            return <div key={template.id}><span className={template.tone}><Icon size={17} strokeWidth={1.5} /></span><div><strong>{template.label}</strong><small>{records.length} hồ sơ · {records.length - done} đang chờ</small><i><b style={{ width: `${rate}%` }} /></i></div><em>{rate}%</em></div>;
          })}</div>
        </article>
        <aside className="panel approval-bottleneck-panel">
          <ListChecks size={22} strokeWidth={1.5} />
          <h2>Điểm cần chú ý</h2>
          <strong>{pending > 0 ? `${pending} hồ sơ đang chờ xử lý` : "Không có hồ sơ tồn"}</strong>
          <p>{pending > 0 ? "Ưu tiên hồ sơ chấm công và nghỉ phép có ngày áp dụng gần nhất." : "Các luồng đang được xử lý đầy đủ."}</p>
          <div><span>Nguồn dữ liệu</span><b>Approval workspace</b></div>
          <div><span>Luồng đang theo dõi</span><b>4</b></div>
        </aside>
      </div>
    </section>
  );
}

function MetricCard({ label, value, note, tone = "" }: { label: string; value: string; note: string; tone?: string }) {
  return <article className={`panel approval-metric-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function ApprovalDataManager({ requests, onOpen }: { requests: BusinessRequest[]; onOpen: (id: string) => void }) {
  const [type, setType] = useState<"all" | BusinessRequestType>("all");
  const [status, setStatus] = useState<"all" | BusinessRequestStatus>("all");
  const [query, setQuery] = useState("");
  const visible = requests.filter((item) => (
    (type === "all" || item.type === type)
    && (status === "all" || item.status === status)
    && `${item.id} ${item.employee} ${item.detail}`.toLowerCase().includes(query.toLowerCase())
  ));

  return (
    <section className="approval-data-shell panel">
      <aside className="approval-data-sidebar">
        <header><Database size={18} strokeWidth={1.5} /><strong>Bảng chi tiết</strong></header>
        <button className={type === "all" ? "is-active" : ""} onClick={() => setType("all")}><span>Tất cả luồng</span><b>{requests.length}</b></button>
        {requestTemplates.map((template) => <button key={template.id} className={type === template.type ? "is-active" : ""} onClick={() => setType(template.type)}><span>{template.shortLabel}</span><b>{requests.filter((item) => item.type === template.type).length}</b></button>)}
      </aside>
      <div className="approval-data-content">
        <header className="approval-data-toolbar">
          <div><h2>{type === "all" ? "Tất cả dữ liệu phê duyệt" : displayType(type)}</h2><span>{visible.length} bản ghi</span></div>
          <div><label><Search size={15} strokeWidth={1.5} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã, người gửi..." /></label><select value={status} onChange={(event) => setStatus(event.target.value as "all" | BusinessRequestStatus)}><option value="all">Tất cả trạng thái</option><option value="pending">Chờ phê duyệt</option><option value="approved">Đã duyệt</option><option value="rejected">Từ chối</option><option value="hr-review">HR review</option></select></div>
        </header>
        <div className="approval-data-table-wrap">
          <table className="approval-data-table">
            <thead><tr><th>Request No.</th><th>Trạng thái</th><th>Quy trình</th><th>Người gửi</th><th>Ngày áp dụng</th><th>Gửi lúc</th></tr></thead>
            <tbody>{visible.map((request) => <tr key={request.id} onClick={() => onOpen(request.id)}><td><button>{request.id}</button></td><td><RequestStatus status={request.status} /></td><td>{displayType(request.type)}</td><td><span className="approval-table-person"><i className="avatar avatar-sm">{request.initials}</i>{request.employee}</span></td><td>{request.date}</td><td>{request.submitted}</td></tr>)}</tbody>
          </table>
          {visible.length === 0 && <div className="approval-empty"><Database size={36} strokeWidth={1.3} /><strong>Không có bản ghi</strong><span>Hãy đổi bộ lọc để xem dữ liệu khác.</span></div>}
        </div>
      </div>
    </section>
  );
}

function RequestStatus({ status }: { status: BusinessRequestStatus }) {
  return <StatusPill tone={status === "pending" ? "warning" : status === "approved" ? "success" : status === "rejected" ? "danger" : "blue"}>{statusLabel(status)}</StatusPill>;
}

function statusLabel(status: BusinessRequestStatus) {
  if (status === "pending") return "Chờ phê duyệt";
  if (status === "approved") return "Đã phê duyệt";
  if (status === "rejected") return "Đã từ chối";
  return "HR review";
}

function displayType(type: BusinessRequestType) {
  if (type === "WFH") return "Đơn WFH";
  if (type === "Chi phí") return "Đề nghị chi tiền";
  if (type === "Điều chỉnh chấm công") return "Điều chỉnh Clock-in/out";
  return type;
}

function RequestContext({ type }: { type: BusinessRequestType }) {
  const data = type === "Nghỉ phép"
    ? { icon: CalendarDays, title: "Ngữ cảnh nghỉ phép", copy: "Còn 12 ngày phép · không trùng lịch nghỉ trong nhóm." }
    : type === "WFH"
      ? { icon: Laptop2, title: "Chính sách WFH", copy: "Daily Report được gắn với ngày làm việc từ xa sau khi đơn được duyệt." }
      : type === "Chi phí"
        ? { icon: ReceiptText, title: "Ngữ cảnh kinh phí", copy: "Yêu cầu đi qua quản lý trực tiếp trước bước kiểm tra hạn mức." }
        : { icon: FileClock, title: "Đối chiếu điểm danh", copy: "Log GPS và thời gian thiết bị được đính kèm để đối chiếu." };
  const Icon = data.icon;
  return <div className="team-context"><div><Icon size={16} strokeWidth={1.5} /><strong>{data.title}</strong></div><p>{data.copy}</p></div>;
}
