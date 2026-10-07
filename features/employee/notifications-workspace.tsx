"use client";

import { useMemo, useState } from "react";
import { Bell, Check, CheckCheck, FileText, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { notifications as seedNotifications } from "./mock-data";
import { EmptyState, StatusPill, WorkspaceHeader } from "./workspace-frame";

export function NotificationsWorkspace() {
  const [items, setItems] = useState(seedNotifications);
  const [tab, setTab] = useState("Tất cả");
  const visible = useMemo(() => tab === "Chưa đọc" ? items.filter((item) => item.unread) : items, [items, tab]);

  function markAll() {
    setItems((current) => current.map((item) => ({ ...item, unread: false })));
    toast.success("Đã đánh dấu tất cả là đã đọc.");
  }

  return (
    <div className="page-stack">
      <WorkspaceHeader eyebrow="NOTIFICATION CENTER" title="Thông báo" description="Cập nhật phê duyệt, hợp đồng và vận hành liên quan tới bạn." action={<button className="secondary-button" onClick={markAll}><CheckCheck size={15} strokeWidth={1.5} /> Đánh dấu đã đọc</button>} />
      <section className="notifications-layout">
        <article className="panel notifications-main"><div className="notification-tabs">{["Tất cả", "Chưa đọc"].map((item) => <button className={tab === item ? "is-active" : ""} onClick={() => setTab(item)} key={item}>{item}{item === "Chưa đọc" && <b>{items.filter((entry) => entry.unread).length}</b>}</button>)}</div>{visible.length ? <div className="notification-list">{visible.map((item) => <button key={item.id} className={item.unread ? "unread" : ""} onClick={() => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, unread: false } : entry))}><span className={`notification-icon ${item.tone}`}>{item.category === "Phê duyệt" ? <Check size={16} strokeWidth={1.5} /> : item.category === "Chấm công" ? <ShieldAlert size={16} strokeWidth={1.5} /> : <FileText size={16} strokeWidth={1.5} />}</span><div><span>{item.category}</span><strong>{item.title}</strong><p>{item.message}</p></div><time>{item.time}</time>{item.unread && <i />}</button>)}</div> : <EmptyState title="Không có thông báo chưa đọc" description="Các cập nhật mới sẽ xuất hiện tại đây." />}</article>
        <aside className="panel notification-settings"><div className="panel-heading compact"><div><span className="eyebrow">KÊNH NHẬN</span><h3>Tùy chọn cá nhân</h3></div><Bell size={18} strokeWidth={1.5} /></div><div className="channel-list"><label><div><strong>Thông báo trong ứng dụng</strong><span>Tất cả cập nhật nghiệp vụ</span></div><input type="checkbox" defaultChecked /></label><label><div><strong>Email</strong><span>Phê duyệt và tài liệu quan trọng</span></div><input type="checkbox" defaultChecked /></label><label><div><strong>Push notification</strong><span>Nhắc việc có thời hạn</span></div><input type="checkbox" /></label></div><StatusPill tone="neutral">Cài đặt cá nhân</StatusPill></aside>
      </section>
    </div>
  );
}
