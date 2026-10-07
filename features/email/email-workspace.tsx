"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Archive, Bot, ChevronLeft, Download, FileText, Inbox, MailPlus, Paperclip, Search, Send, Star, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/features/session/session-context";
import { FormField, StatusPill, WorkflowDialog, WorkspaceHeader } from "@/features/employee/workspace-frame";

type MailMessage = {
  id: number;
  sender: string;
  initials: string;
  subject: string;
  preview: string;
  time: string;
  mailbox: "inbox" | "sent" | "draft";
  unread?: boolean;
  starred?: boolean;
  attachment?: string;
  body: string[];
};

const seedMessages: MailMessage[] = [
  { id: 1, sender: "Trần Minh Quân", initials: "TQ", subject: "Kế hoạch sprint 42 và lịch WFH", preview: "Mình đã cập nhật các đầu việc ưu tiên cho tuần tới...", time: "10:24", mailbox: "inbox", unread: true, starred: true, body: ["Chào Hà,", "Mình đã cập nhật các đầu việc ưu tiên cho sprint 42. Ngày WFH thứ Ba đã được ghi nhận; vui lòng hoàn tất Daily Report trước 18:00.", "Cảm ơn bạn."] },
  { id: 2, sender: "HR Operations", initials: "HR", subject: "Phụ lục Hybrid Working 2026", preview: "Tài liệu chính sách đã được cập nhật...", time: "09:08", mailbox: "inbox", unread: true, attachment: "Hybrid-Working-2026.pdf", body: ["Chào bạn,", "Tài liệu chính sách Hybrid Working 2026 đã được cập nhật. Vui lòng đọc và xác nhận trước ngày 15/10."] },
  { id: 3, sender: "Lê Hoàng Đức", initials: "LĐ", subject: "Re: Xác nhận đổi ca 14/10", preview: "Mình xác nhận có thể nhận ca này...", time: "Hôm qua", mailbox: "inbox", body: ["Chào Hà,", "Mình xác nhận có thể nhận ca ngày 14/10. Bạn cứ gửi yêu cầu để Team Lead phê duyệt nhé."] },
  { id: 4, sender: "talent@candidate.vn", initials: "TA", subject: "Ứng tuyển Senior Backend Engineer", preview: "Em gửi CV ứng tuyển vị trí REQ-2026-041...", time: "06/10", mailbox: "inbox", attachment: "Nguyen-Van-An-CV.pdf", body: ["Chào đội ngũ tuyển dụng oHRiise,", "Em gửi CV ứng tuyển vị trí Senior Backend Engineer. Mong nhận được phản hồi từ công ty."] },
  { id: 5, sender: "Nguyễn Thu Hà", initials: "NH", subject: "Design review · Employee Home", preview: "Tổng hợp thay đổi sau phiên review...", time: "05/10", mailbox: "sent", body: ["Chào team,", "Mình gửi tổng hợp thay đổi sau phiên review Employee Home và các trạng thái responsive."] },
  { id: 6, sender: "Bản nháp", initials: "DR", subject: "Góp ý onboarding checklist", preview: "Bổ sung bước xác nhận thiết bị...", time: "04/10", mailbox: "draft", body: ["Bổ sung bước xác nhận thiết bị trước ngày bắt đầu..."] },
];

const folders = [
  { id: "inbox", label: "Hộp thư đến", icon: Inbox },
  { id: "starred", label: "Đã gắn sao", icon: Star },
  { id: "sent", label: "Đã gửi", icon: Send },
  { id: "draft", label: "Bản nháp", icon: FileText },
] as const;

export function EmailWorkspace({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { session, can } = useSession();
  const [folder, setFolder] = useState<(typeof folders)[number]["id"]>("inbox");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState(seedMessages);
  const [selectedId, setSelectedId] = useState(1);
  const [composeOpen, setComposeOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const canUseRecruitingAi = can("ai-cv", "create");
  const isHr = session.department === "Nhân sự";

  const visible = useMemo(() => messages.filter((message) => {
    const inFolder = folder === "starred" ? message.starred : message.mailbox === folder;
    return inFolder && `${message.sender} ${message.subject} ${message.preview}`.toLowerCase().includes(query.toLowerCase());
  }), [folder, messages, query]);
  const selected = messages.find((message) => message.id === selectedId) ?? visible[0];

  function openMessage(id: number) {
    setSelectedId(id);
    setMessages((current) => current.map((message) => message.id === id ? { ...message, unread: false } : message));
  }

  function sendMessage() {
    if (!recipient.includes("@") || subject.trim().length < 3 || body.trim().length < 5) {
      toast.error("Vui lòng nhập người nhận, tiêu đề và nội dung hợp lệ.");
      return;
    }
    setMessages((current) => [{ id: Date.now(), sender: "Nguyễn Thu Hà", initials: "NH", subject: subject.trim(), preview: body.trim(), time: "Vừa xong", mailbox: "sent", body: [body.trim()] }, ...current]);
    setComposeOpen(false); setRecipient(""); setSubject(""); setBody("");
    toast.success("Email đã được gửi và lưu trong thư đã gửi.");
  }

  return (
    <div className="email-app page-stack">
      <WorkspaceHeader eyebrow="OHRIISE MAIL" title="Email doanh nghiệp" description="Trao đổi nội bộ, HR và tuyển dụng trong cùng ngữ cảnh công việc." action={<button className="primary-button" onClick={() => setComposeOpen(true)}><MailPlus size={16} strokeWidth={1.5} /> Soạn thư</button>} />
      <section className="mail-shell">
        <aside className="mailbox-sidebar">
          <button className="mail-compose" onClick={() => setComposeOpen(true)}><MailPlus size={16} strokeWidth={1.5} /><span>Thư mới</span></button>
          <nav aria-label="Thư mục email">{folders.map((item) => { const Icon = item.icon; const count = item.id === "inbox" ? messages.filter((message) => message.mailbox === "inbox" && message.unread).length : item.id === "draft" ? 1 : 0; return <button className={folder === item.id ? "is-active" : ""} key={item.id} onClick={() => setFolder(item.id)}><Icon size={16} strokeWidth={1.5} /><span>{item.label}</span>{count > 0 && <b>{count}</b>}</button>; })}</nav>
          {isHr && <div className="shared-mailbox"><span>SHARED MAILBOX</span><button onClick={() => toast.info("Đã chuyển sang HR Shared Mailbox.")}><UsersRound size={15} strokeWidth={1.5} /><strong>HR Shared</strong><b>12</b></button></div>}
          <div className="mail-storage"><span>2.4 GB / 15 GB</span><i><b /></i><small>Lưu trữ email doanh nghiệp</small></div>
        </aside>

        <div className="message-column">
          <div className="mail-search"><Search size={16} strokeWidth={1.5} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm người gửi, tiêu đề, nội dung..." /></div>
          <div className="message-list">{visible.length ? visible.map((message) => <button className={`${selected?.id === message.id ? "is-active" : ""}${message.unread ? " is-unread" : ""}`} key={message.id} onClick={() => openMessage(message.id)}><span className="avatar avatar-sm">{message.initials}</span><div><p><strong>{message.sender}</strong><time>{message.time}</time></p><h3>{message.subject}</h3><small>{message.preview}</small>{message.attachment && <em><Paperclip size={12} strokeWidth={1.5} /> {message.attachment}</em>}</div><Star className={message.starred ? "is-starred" : ""} size={15} strokeWidth={1.5} onClick={(event) => { event.stopPropagation(); setMessages((current) => current.map((item) => item.id === message.id ? { ...item, starred: !item.starred } : item)); }} /></button>) : <div className="mail-empty"><Image src="/assets/ohriise/14_notifications_alert-center_announcements.png" alt="" width={150} height={112} /><strong>Không có email phù hợp</strong><p>Thử thư mục hoặc từ khóa khác.</p></div>}</div>
        </div>

        <article className="thread-view">
          {selected ? <><div className="thread-toolbar"><button aria-label="Quay lại danh sách"><ChevronLeft size={17} strokeWidth={1.5} /></button><div><button aria-label="Lưu trữ" onClick={() => toast.success("Đã lưu trữ email.")}><Archive size={16} strokeWidth={1.5} /></button><button aria-label="Xóa" onClick={() => { setMessages((current) => current.filter((message) => message.id !== selected.id)); toast.success("Đã chuyển email vào thùng rác."); }}><Trash2 size={16} strokeWidth={1.5} /></button></div></div><header><span className="eyebrow">THREAD · {selected.time}</span><h2>{selected.subject}</h2><div><span className="avatar">{selected.initials}</span><p><strong>{selected.sender}</strong><small>đến Nguyễn Thu Hà · ha.nguyen@ohriise.vn</small></p><StatusPill tone={selected.unread ? "blue" : "neutral"}>{selected.unread ? "Chưa đọc" : "Đã đọc"}</StatusPill></div></header><div className="message-body">{selected.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>{selected.attachment && <div className="attachment-card"><FileText size={22} strokeWidth={1.5} /><div><strong>{selected.attachment}</strong><span>PDF · 1.8 MB</span></div><button aria-label="Tải tệp" onClick={() => toast.success("Đã chuẩn bị tệp đính kèm.")}><Download size={16} strokeWidth={1.5} /></button>{canUseRecruitingAi && selected.attachment.toLowerCase().includes("cv") && <button className="send-to-ai" onClick={() => onNavigate("ai-cv")}><Bot size={15} strokeWidth={1.5} /> Mở trong AI CV</button>}</div>}<div className="thread-reply"><button className="secondary-button" onClick={() => { setRecipient(selected.sender); setSubject(`Re: ${selected.subject}`); setComposeOpen(true); }}>Trả lời</button><button className="text-button inline" onClick={() => toast.info("Đã mở chế độ chuyển tiếp.")}>Chuyển tiếp</button></div></> : <div className="mail-empty"><Image src="/assets/ohriise/14_notifications_alert-center_announcements.png" alt="" width={160} height={120} /><strong>Chọn một email để đọc</strong><p>Nội dung và tệp đính kèm sẽ hiển thị tại đây.</p></div>}
        </article>
      </section>

      <WorkflowDialog open={composeOpen} onOpenChange={setComposeOpen} title="Soạn email" description="Thư được gửi qua hộp thư công ty của bạn." footer={<><button className="secondary-button" onClick={() => { setComposeOpen(false); toast.success("Đã lưu bản nháp."); }}>Lưu nháp</button><button className="primary-button" onClick={sendMessage}><Send size={15} strokeWidth={1.5} /> Gửi email</button></>}>
        <div className="form-grid"><FormField label="Người nhận" required><input type="email" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="ten@ohriise.vn" /></FormField><FormField label="Tiêu đề" required><input value={subject} onChange={(event) => setSubject(event.target.value)} /></FormField><FormField label="Nội dung" required><textarea className="mail-compose-body" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Nhập nội dung email..." /></FormField><FormField label="Tệp đính kèm"><label className="upload-zone"><Paperclip size={17} strokeWidth={1.5} /><span>Chọn tệp đính kèm</span><input className="sr-only" type="file" onChange={(event) => event.target.files?.[0] && toast.success(`Đã đính kèm ${event.target.files[0].name}.`)} /></label></FormField></div>
      </WorkflowDialog>
    </div>
  );
}
