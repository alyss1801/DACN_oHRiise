"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Check, ChevronRight, Clock3, FileQuestion, Laptop2, ReceiptText, Repeat2, X } from "lucide-react";
import { toast } from "sonner";
import { useDemoData, type BusinessRequestType } from "@/features/demo/demo-data-context";
import { FormField, StatusPill, WorkflowDialog, WorkspaceHeader } from "@/features/employee/workspace-frame";

const filters: Array<"Tất cả" | BusinessRequestType> = ["Tất cả", "WFH", "Nghỉ phép", "Chi phí", "Điều chỉnh chấm công", "Đổi ca"];

export function ApprovalsWorkspace() {
  const { requests, decideBusinessRequest } = useDemoData();
  const [selectedId, setSelectedId] = useState(requests.find((item) => item.status === "pending")?.id ?? requests[0]?.id ?? "");
  const [filter, setFilter] = useState<(typeof filters)[number]>("Tất cả");
  const [decision, setDecision] = useState<"approve" | "reject" | "clarify" | null>(null);
  const [note, setNote] = useState("");
  const visible = useMemo(() => filter === "Tất cả" ? requests : requests.filter((item) => item.type === filter), [filter, requests]);
  const selected = requests.find((item) => item.id === selectedId) ?? visible[0];

  function submitDecision() {
    if (!selected || !decision) return;
    if ((decision === "reject" || decision === "clarify") && note.trim().length < 8) {
      toast.error("Cần nhập nội dung ít nhất 8 ký tự.");
      return;
    }
    if (decision === "clarify") toast.success("Đã gửi yêu cầu bổ sung thông tin cho nhân viên.");
    else {
      decideBusinessRequest(selected.id, decision === "approve" ? "approved" : "rejected", note);
      toast.success(decision === "approve" ? "Đã phê duyệt yêu cầu." : "Đã từ chối và gửi lý do cho nhân viên.");
    }
    setDecision(null);
    setNote("");
  }

  return (
    <div className="page-stack">
      <WorkspaceHeader eyebrow="APPROVAL INBOX" title="Hộp thư phê duyệt" description="Xử lý yêu cầu với đầy đủ ngữ cảnh đội ngũ, chính sách và audit." />
      <section className="approval-layout panel">
        <div className="approval-master">
          <div className="approval-filters">{filters.map((item) => <button className={filter === item ? "is-active" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>
          <div className="approval-list">{visible.map((request) => <button className={selected?.id === request.id ? "is-active" : ""} key={request.id} onClick={() => setSelectedId(request.id)}><div className="avatar avatar-sm">{request.initials}</div><div><span>{request.type} · {request.submitted}</span><strong>{request.employee}</strong><p>{request.detail}</p></div>{request.status === "pending" || request.status === "hr-review" ? <ChevronRight size={15} strokeWidth={1.5} /> : <StatusPill tone={request.status === "approved" ? "success" : "danger"}>{request.status === "approved" ? "Đã duyệt" : "Từ chối"}</StatusPill>}</button>)}</div>
        </div>
        {selected ? <article className="approval-detail">
          <div className="approval-detail-head"><div><span className="eyebrow">{selected.id}</span><h3>{selected.type} · {selected.employee}</h3><p>Gửi {selected.submitted}</p></div>{selected.status === "pending" ? <StatusPill tone="warning"><Clock3 size={12} strokeWidth={1.5} /> Chờ bạn duyệt</StatusPill> : <StatusPill tone={selected.status === "approved" ? "success" : selected.status === "rejected" ? "danger" : "blue"}>{selected.status === "approved" ? "Đã duyệt" : selected.status === "rejected" ? "Đã từ chối" : "HR review"}</StatusPill>}</div>
          <div className="approval-person"><div className="avatar">{selected.initials}</div><div><strong>{selected.employee}</strong><span>Data Platform · HCM-Q1</span></div></div>
          <div className="approval-facts"><div><span>Ngày áp dụng</span><strong>{selected.date}</strong></div><div><span>Loại yêu cầu</span><strong>{selected.type}</strong></div><div className="wide"><span>Nội dung</span><strong>{selected.detail}</strong></div></div>
          {selected.type === "Nghỉ phép" && <Context icon={CalendarDays} title="Ngữ cảnh năng lực" copy="01 thành viên WFH, không có người nghỉ trùng. Năng lực còn lại 80%." />}
          {selected.type === "WFH" && <Context icon={Laptop2} title="Chính sách WFH" copy="Nhân viên còn 01 ngày WFH trong tuần. Không có cuộc họp onsite bắt buộc." />}
          {selected.type === "Chi phí" && <Context icon={ReceiptText} title="Ngữ cảnh chi phí" copy="Công cụ thuộc danh mục hợp lệ; sau bước này HR kiểm tra chính sách và hạn mức." />}
          {selected.type === "Điều chỉnh chấm công" && <Context icon={FileQuestion} title="Đối chiếu attendance log" copy="Gateway không ghi nhận check-out. Bằng chứng đính kèm lúc 17:34, GPS thuộc HCM-Q1." />}
          {selected.type === "Đổi ca" && <Context icon={Repeat2} title="Ngữ cảnh ca làm việc" copy="Đồng nghiệp đã xác nhận nhận ca. Không trùng lịch nghỉ hoặc sự kiện bắt buộc của đội ngũ." />}
          {selected.note && <div className="decision-note"><strong>Ghi chú quyết định</strong><p>{selected.note}</p></div>}
          {selected.status === "pending" && <div className="approval-actions"><button className="text-button" onClick={() => setDecision("clarify")}><FileQuestion size={15} strokeWidth={1.5} /> Yêu cầu bổ sung</button><button className="secondary-button reject" onClick={() => setDecision("reject")}><X size={15} strokeWidth={1.5} /> Từ chối</button><button className="primary-button" onClick={() => setDecision("approve")}><Check size={15} strokeWidth={1.5} /> Phê duyệt</button></div>}
        </article> : <div className="compact-empty"><strong>Không có yêu cầu phù hợp</strong><p>Thử chọn bộ lọc khác.</p></div>}
      </section>
      {selected && <WorkflowDialog open={decision !== null} onOpenChange={(open) => !open && setDecision(null)} title={decision === "approve" ? "Xác nhận phê duyệt" : decision === "clarify" ? "Yêu cầu bổ sung" : "Từ chối yêu cầu"} description={`${selected.id} · ${selected.employee}`} footer={<><button className="secondary-button" onClick={() => setDecision(null)}>Hủy</button><button className={decision === "approve" ? "primary-button" : "secondary-button reject"} onClick={submitDecision}>{decision === "approve" ? "Phê duyệt" : decision === "clarify" ? "Gửi yêu cầu" : "Gửi lý do từ chối"}</button></>}><FormField label={decision === "approve" ? "Ghi chú (không bắt buộc)" : "Nội dung"} required={decision !== "approve"}><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Thêm ngữ cảnh rõ ràng cho nhân viên..." /></FormField></WorkflowDialog>}
    </div>
  );
}

function Context({ icon: Icon, title, copy }: { icon: typeof CalendarDays; title: string; copy: string }) {
  return <div className="team-context"><div><Icon size={16} strokeWidth={1.5} /><strong>{title}</strong></div><p>{copy}</p></div>;
}
