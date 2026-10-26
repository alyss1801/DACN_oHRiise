"use client";

import { useState } from "react";
import { Archive, FileText, Inbox, MailPlus, RotateCcw, Search, Send, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCommunications } from "@/features/communications/communications-context";
import { mailbox } from "@/features/communications/communications-model";
import type { MailMessage } from "@/features/communications/communications-model";
import { FormField, WorkflowDialog, WorkspaceHeader } from "@/features/employee/workspace-frame";

const folders = [
  { id: "inbox", label: "Hộp thư đến", icon: Inbox },
  { id: "starred", label: "Gắn sao", icon: Star },
  { id: "sent", label: "Đã gửi", icon: Send },
  { id: "draft", label: "Bản nháp", icon: FileText },
  { id: "archive", label: "Lưu trữ", icon: Archive },
  { id: "trash", label: "Thùng rác", icon: Trash2 },
] as const;
type Folder = (typeof folders)[number]["id"];
const mailTime = (at: string) => new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(at));

export function EmailWorkspace() {
  const { store, account, directory, send, saveDraft, changeMail } = useCommunications();
  const [folder, setFolder] = useState<Folder>("inbox");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [draftId, setDraftId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const all = mailbox(store, account.address, folder);
  const visible = all.filter((item) => `${item.fromName} ${item.to} ${item.subject} ${item.body}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")));
  const selected = visible.find((item) => item.id === selectedId) ?? visible[0];
  const unread = mailbox(store, account.address, "inbox").filter((item) => !item.readBy.includes(account.address)).length;

  function startCompose(message?: MailMessage, mode?: "reply" | "forward" | "draft") {
    setDraftId(mode === "draft" ? message?.id ?? "" : "");
    setRecipient(mode === "draft" ? message?.to ?? "" : mode === "reply" ? message?.from === account.address ? message.to : message?.from ?? "" : "");
    setSubject(mode === "draft" ? message?.subject ?? "" : message ? `${mode === "forward" ? "Fwd:" : "Re:"} ${message.subject.replace(/^(Re:|Fwd:)\s*/i, "")}` : "");
    setBody(mode === "draft" ? message?.body ?? "" : mode === "forward" ? `\n\n----------\n${message?.fromName}: ${message?.body ?? ""}` : "");
    setComposeOpen(true);
  }
  function openMessage(message: MailMessage) {
    setSelectedId(message.id);
    if (message.draftOwner) { startCompose(message, "draft"); return; }
    if (message.to === account.address && !message.readBy.includes(account.address)) changeMail(message.id, "read");
  }
  function updateMessage(id: string, action: "star" | "archive" | "unarchive" | "trash" | "restore") {
    const result = changeMail(id, action);
    if (!result.ok) { toast.error(result.error); return; }
    if (action !== "star") setSelectedId("");
  }
  function submit() {
    const result = send({ to: recipient, subject, body, draftId: draftId || undefined });
    if (!result.ok) { toast.error(result.error); return; }
    setComposeOpen(false); setDraftId(""); setFolder("sent"); setSelectedId(result.id);
    toast.success("Đã gửi trong hộp thư demo nội bộ.");
  }
  function keepDraft() {
    const result = saveDraft({ to: recipient, subject, body, draftId: draftId || undefined });
    if (!result.ok) { toast.error(result.error); return; }
    setComposeOpen(false); setFolder("draft"); setSelectedId(result.id); setDraftId("");
    toast.success("Đã lưu bản nháp.");
  }
  return <div className="email-app page-stack">
    <WorkspaceHeader title="Email" subtitle={account.address} action={<button className="primary-button" onClick={() => startCompose()}><MailPlus size={16} /> Soạn thư</button>} />
    <section className="mail-shell">
      <aside className="mailbox-sidebar"><button className="mail-compose" onClick={() => startCompose()}><MailPlus size={16} /><span>Thư mới</span></button><nav aria-label="Thư mục email">{folders.map((item) => { const Icon = item.icon; const count = item.id === "inbox" ? unread : item.id === "draft" ? mailbox(store, account.address, "draft").length : 0; return <button className={folder === item.id ? "is-active" : ""} key={item.id} onClick={() => { setFolder(item.id); setSelectedId(""); }}><Icon size={16} /><span>{item.label}</span>{count > 0 && <b>{count}</b>}</button>; })}</nav><p className="mail-demo-scope">Thư chỉ lưu và trao đổi trong bản demo này.</p></aside>
      <div className="message-column"><div className="mail-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm thư" aria-label="Tìm thư" /></div><div className="message-list">{visible.length ? visible.map((message) => <button className={`${selected?.id === message.id ? "is-active" : ""}${message.to === account.address && !message.readBy.includes(account.address) ? " is-unread" : ""}`} key={message.id} onClick={() => openMessage(message)}><span className="avatar avatar-sm">{message.fromName.split(" ").slice(-2).map((word) => word[0]).join("").toUpperCase()}</span><div><p><strong>{folder === "sent" ? directory.find((item) => item.address === message.to)?.name ?? message.to : message.fromName}</strong><time>{mailTime(message.at)}</time></p><h3>{message.subject || "(Chưa có tiêu đề)"}</h3><small>{message.body || "Bản nháp"}</small></div><Star className={message.starredBy.includes(account.address) ? "is-starred" : ""} size={15} onClick={(event) => { event.stopPropagation(); updateMessage(message.id, "star"); }} /></button>) : <div className="mail-empty"><strong>Chưa có thư</strong><p>Chọn thư mục khác hoặc soạn thư mới.</p></div>}</div></div>
      <article className="thread-view">{selected ? <><div className="thread-toolbar"><span>{folder === "draft" ? "BẢN NHÁP" : "EMAIL NỘI BỘ"}</span><div>{folder === "trash" ? <button aria-label="Khôi phục thư" onClick={() => updateMessage(selected.id, "restore")}><RotateCcw size={16} /></button> : <>{folder === "archive" ? <button aria-label="Bỏ lưu trữ" onClick={() => updateMessage(selected.id, "unarchive")}><RotateCcw size={16} /></button> : folder !== "draft" && <button aria-label="Lưu trữ" onClick={() => updateMessage(selected.id, "archive")}><Archive size={16} /></button>}<button aria-label="Chuyển vào thùng rác" onClick={() => updateMessage(selected.id, "trash")}><Trash2 size={16} /></button></>}</div></div><header><span className="eyebrow">{mailTime(selected.at)}</span><h2>{selected.subject || "(Chưa có tiêu đề)"}</h2><div><span className="avatar">{selected.fromName.split(" ").slice(-2).map((word) => word[0]).join("").toUpperCase()}</span><p><strong>{selected.fromName}</strong><small>{selected.from} → {selected.to || "Chưa chọn người nhận"}</small></p></div></header><div className="message-body"><p>{selected.body || "Chưa có nội dung."}</p></div>{folder !== "draft" && folder !== "trash" && <div className="thread-reply">{!selected.announcementId && <button className="secondary-button" onClick={() => startCompose(selected, "reply")}>Trả lời</button>}<button className="text-button inline" onClick={() => startCompose(selected, "forward")}>Chuyển tiếp</button></div>}{folder === "draft" && <div className="thread-reply"><button className="secondary-button" onClick={() => startCompose(selected, "draft")}>Tiếp tục soạn</button></div>}</> : <div className="mail-empty"><strong>Chọn một email để đọc</strong></div>}</article>
    </section>
    <WorkflowDialog open={composeOpen} onOpenChange={setComposeOpen} title="Soạn email" description="Chỉ gửi giữa các hộp thư trong bản demo; không gửi ra dịch vụ email ngoài." footer={<><button className="secondary-button" onClick={keepDraft}>Lưu nháp</button><button className="primary-button" onClick={submit}><Send size={15} /> Gửi</button></>}><div className="form-grid"><FormField label="Người nhận" required><input type="email" list="mail-directory" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="ten@ohriise.vn" /><datalist id="mail-directory">{directory.filter((item) => item.address !== account.address).map((item) => <option key={item.key} value={item.address}>{item.name}</option>)}</datalist></FormField><FormField label="Tiêu đề" required><input value={subject} onChange={(event) => setSubject(event.target.value)} /></FormField><FormField label="Nội dung" required><textarea className="mail-compose-body" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Nhập nội dung email" /></FormField></div></WorkflowDialog>
  </div>;
}
