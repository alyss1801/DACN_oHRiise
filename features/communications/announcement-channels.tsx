"use client";

import { useState } from "react";
import { Hash, Mail, Megaphone, Send } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/features/session/session-context";
import { FormField, WorkflowDialog } from "@/features/employee/workspace-frame";
import { canPostChannel } from "./communications-model";
import { useCommunications } from "./communications-context";

const postedAt = (value: string) => new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

export function AnnouncementChannels({ channelId, onSelect, selectedAnnouncementId }: { channelId?: string; onSelect: (id: string) => void; selectedAnnouncementId?: string }) {
  const { session } = useSession();
  const { store, account, channels, publish } = useCommunications();
  const [composeOpen, setComposeOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [emailCopy, setEmailCopy] = useState(false);
  const channel = channels.find((item) => item.id === channelId) ?? channels[0];
  const posts = store.announcements.filter((item) => item.channelId === channel?.id && (item.recipientKeys.includes(account.key) || item.actorKey === account.key));
  const canPublish = !!channel && canPostChannel(session, account, channel);
  function submit() {
    if (!channel) return;
    const result = publish(channel.id, title, body, emailCopy);
    if (!result.ok) { toast.error(result.error); return; }
    setComposeOpen(false); setTitle(""); setBody(""); setEmailCopy(false);
    toast.success(emailCopy ? "Đã đăng thông báo và tạo bản sao email demo." : "Đã đăng thông báo.");
  }
  return <section className="panel announcement-shell" aria-label="Kênh thông báo"><div className="announcement-heading"><div><span className="eyebrow">KÊNH</span><h2>Thông báo theo nhóm</h2></div><span>{channels.length} kênh</span></div><div className="announcement-layout"><nav className="announcement-nav" aria-label="Danh sách kênh">{channels.map((item) => <button key={item.id} className={item.id === channel?.id ? "active" : ""} onClick={() => onSelect(item.id)}><Hash size={14} /><span>{item.name}</span><small>{store.announcements.filter((post) => post.channelId === item.id && (post.recipientKeys.includes(account.key) || post.actorKey === account.key)).length}</small></button>)}</nav><div className="announcement-content">{channel ? <><header><div><h3><Megaphone size={17} /> {channel.name}</h3><small>{channel.audience} · {channel.memberKeys.length} người nhận · {channel.kind === "group" ? "Trưởng nhóm đăng" : "Admin và HR đăng"}</small></div>{canPublish && <button className="primary-button" onClick={() => setComposeOpen(true)}><Send size={14} /> Đăng thông báo</button>}</header><div className="announcement-posts">{posts.length ? posts.map((post) => <article key={post.id} className={post.id === selectedAnnouncementId ? "selected" : ""}><div><strong>{post.title}</strong><time>{postedAt(post.at)}</time></div><small>{post.actorName}</small><p>{post.body}</p>{post.emailCopy && <span className="announcement-email-tag"><Mail size={12} /> Có bản sao trong email demo</span>}</article>) : <div className="announcement-empty">Kênh này chưa có thông báo.</div>}</div></> : <div className="announcement-empty">Chưa có kênh dành cho tài khoản này.</div>}</div></div>
    <WorkflowDialog open={composeOpen} onOpenChange={setComposeOpen} title={`Đăng vào ${channel?.name ?? "kênh"}`} description={`${channel?.memberKeys.length ?? 0} người nhận trong kênh`} footer={<><button className="secondary-button" onClick={() => setComposeOpen(false)}>Hủy</button><button className="primary-button" onClick={submit}><Send size={14} /> Đăng thông báo</button></>}><div className="form-grid"><FormField label="Tiêu đề" required><input value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder="Tiêu đề thông báo" /></FormField><FormField label="Nội dung" required><textarea rows={5} value={body} maxLength={3000} onChange={(event) => setBody(event.target.value)} placeholder="Nội dung gửi tới kênh" /></FormField><label className="announcement-email-option"><input type="checkbox" checked={emailCopy} onChange={(event) => setEmailCopy(event.target.checked)} /><span>Gửi kèm bản sao vào email demo của người nhận</span></label></div></WorkflowDialog>
  </section>;
}
