import type { HrEmployee } from "@/features/hr/hr-demo-data";
import type { EffectiveSession, PersonaId } from "@/lib/authorization/types";
import { personaEmployeeIds } from "../../lib/authorization/demo-identity";

export type MailMessage = {
  id: string; from: string; fromName: string; to: string; subject: string; body: string; at: string;
  draftOwner?: string; announcementId?: string; readBy: string[]; starredBy: string[]; archivedBy: string[]; deletedBy: string[];
};
export type Announcement = {
  id: string; channelId: string; actorKey: string; actorName: string; title: string; body: string; at: string;
  recipientKeys: string[]; emailCopy: boolean;
};
export type CommunicationStore = { version: 1; mail: MailMessage[]; announcements: Announcement[] };
export type MailAccount = { key: string; name: string; address: string; initials: string };
export type AnnouncementChannel = { id: string; name: string; audience: string; memberKeys: string[]; kind: "company" | "branch" | "group"; branch?: string; leadId?: string };
export type CommunicationResult = { ok: true; store: CommunicationStore; id: string } | { ok: false; error: string };

const virtualMailboxes: Partial<Record<PersonaId, { name: string; address: string; initials: string }>> = {
  recruiter: { name: "HR Tuyển dụng", address: "recruiter@demo.ohriise.vn", initials: "TD" },
  "system-admin": { name: "System Admin", address: "admin@demo.ohriise.vn", initials: "SA" },
};

const seed = (id: string, from: string, fromName: string, to: string, subject: string, body: string, at: string): MailMessage => ({ id, from, fromName, to, subject, body, at, readBy: [], starredBy: [], archivedBy: [], deletedBy: [] });
export const initialCommunicationStore: CommunicationStore = { version: 1, announcements: [], mail: [
  seed("MAIL-SEED-1", "quan.tran@ohriise.vn", "Trần Minh Quân", "ha.nguyen@ohriise.vn", "Kế hoạch sprint và lịch WFH", "Chào Hà, lịch sprint đã cập nhật. Mình sẽ trao đổi thêm trong buổi họp nhóm.", "2026-10-20T03:24:00.000Z"),
  seed("MAIL-SEED-2", "lan.nguyen@ohriise.vn", "Nguyễn Thanh Lan", "ha.nguyen@ohriise.vn", "Thông tin chính sách Hybrid Working", "Chào Hà, vui lòng xem chính sách WFH hiện hành trong mục Chính sách HR.", "2026-10-20T02:08:00.000Z"),
  seed("MAIL-SEED-3", "vy.le@ohriise.vn", "Lê Hoàng Vy", "tam.bui@ohriise.vn", "Bàn giao trước ngày nghỉ", "Anh Tâm, em đã cập nhật đầu việc và nhờ Linh hỗ trợ trong ngày nghỉ phép.", "2026-10-19T08:30:00.000Z"),
  seed("MAIL-SEED-4", "bao.pham@ohriise.vn", "Phạm Gia Bảo", "lan.nguyen@ohriise.vn", "Hồ sơ thử việc", "Chào chị Lan, em đã gửi thông tin để chuẩn bị đánh giá thử việc.", "2026-10-19T07:10:00.000Z"),
] };

export function mailAccount(session: EffectiveSession, employees: HrEmployee[]): MailAccount {
  const employee = employees.find((item) => item.id === personaEmployeeIds[session.id]);
  if (employee) return { key: employee.id, name: employee.name, address: employee.email.toLowerCase(), initials: employee.initials };
  const fallback = virtualMailboxes[session.id];
  return { key: `persona:${session.id}`, name: fallback?.name ?? session.label, address: fallback?.address ?? `${session.id}@demo.ohriise.vn`, initials: fallback?.initials ?? session.shortLabel };
}

export function mailDirectory(employees: HrEmployee[]) {
  return [...employees.filter((item) => item.status !== "inactive").map((item) => ({ key: item.id, address: item.email.toLowerCase(), name: item.name })),
    ...Object.entries(virtualMailboxes).map(([id, item]) => ({ key: `persona:${id}`, address: item.address, name: item.name }))];
}

export function mailbox(store: CommunicationStore, address: string, folder: "inbox" | "sent" | "draft" | "starred" | "archive" | "trash") {
  const owner = address.toLowerCase();
  return store.mail.filter((item) => {
    const mine = item.to === owner || item.from === owner || item.draftOwner === owner;
    if (!mine) return false;
    const deleted = item.deletedBy.includes(owner);
    if (folder === "trash") return deleted;
    if (deleted) return false;
    if (folder === "starred") return item.starredBy.includes(owner);
    if (folder === "archive") return item.archivedBy.includes(owner);
    if (folder === "draft") return item.draftOwner === owner;
    if (folder === "sent") return item.from === owner && !item.draftOwner && !item.archivedBy.includes(owner);
    return item.to === owner && !item.draftOwner && !item.archivedBy.includes(owner);
  }).sort((a, b) => b.at.localeCompare(a.at));
}

export function sendMail(store: CommunicationStore, actor: MailAccount, directory: ReturnType<typeof mailDirectory>, input: { to: string; subject: string; body: string; at: string; id: string; draftId?: string }): CommunicationResult {
  const recipient = input.to.trim().toLowerCase();
  if (!directory.some((item) => item.address === recipient)) return { ok: false, error: "Chọn địa chỉ trong danh bạ nhân sự demo." };
  if (input.subject.trim().length < 3 || input.body.trim().length < 5) return { ok: false, error: "Cần tiêu đề và nội dung rõ ràng hơn." };
  const draft = input.draftId ? store.mail.find((item) => item.id === input.draftId && item.draftOwner === actor.address) : undefined;
  if (input.draftId && !draft) return { ok: false, error: "Bản nháp không còn thuộc hộp thư này." };
  const message: MailMessage = { id: draft?.id ?? input.id, from: actor.address, fromName: actor.name, to: recipient, subject: input.subject.trim(), body: input.body.trim(), at: input.at, readBy: [actor.address], starredBy: [], archivedBy: [], deletedBy: [] };
  return { ok: true, id: message.id, store: { ...store, mail: [message, ...store.mail.filter((item) => item.id !== draft?.id)] } };
}

export function saveMailDraft(store: CommunicationStore, actor: MailAccount, input: { to: string; subject: string; body: string; at: string; id: string; draftId?: string }): CommunicationResult {
  const old = input.draftId ? store.mail.find((item) => item.id === input.draftId && item.draftOwner === actor.address) : undefined;
  if (input.draftId && !old) return { ok: false, error: "Bản nháp không còn thuộc hộp thư này." };
  const draft: MailMessage = { id: old?.id ?? input.id, from: actor.address, fromName: actor.name, to: input.to.trim().toLowerCase(), subject: input.subject.trim(), body: input.body.trim(), at: input.at, draftOwner: actor.address, readBy: [actor.address], starredBy: old?.starredBy ?? [], archivedBy: [], deletedBy: [] };
  return { ok: true, id: draft.id, store: { ...store, mail: [draft, ...store.mail.filter((item) => item.id !== old?.id)] } };
}

export function changeMail(store: CommunicationStore, actor: MailAccount, id: string, action: "read" | "star" | "archive" | "unarchive" | "trash" | "restore"): CommunicationResult {
  const message = store.mail.find((item) => item.id === id);
  if (!message || ![message.from, message.to, message.draftOwner].includes(actor.address)) return { ok: false, error: "Thư không thuộc hộp thư này." };
  const edit = (list: string[], add: boolean) => add ? [...new Set([...list, actor.address])] : list.filter((item) => item !== actor.address);
  const updated: MailMessage = action === "read" ? { ...message, readBy: edit(message.readBy, true) }
    : action === "star" ? { ...message, starredBy: edit(message.starredBy, !message.starredBy.includes(actor.address)) }
    : action === "archive" || action === "unarchive" ? { ...message, archivedBy: edit(message.archivedBy, action === "archive") }
    : { ...message, deletedBy: edit(message.deletedBy, action === "trash") };
  return { ok: true, id, store: { ...store, mail: store.mail.map((item) => item.id === id ? updated : item) } };
}

const hrPoster = (id: PersonaId) => ["hr-total", "hr-branch", "recruiter", "compensation"].includes(id);
const companyPoster = (id: PersonaId) => id === "system-admin" || hrPoster(id);
export function channelsFor(session: EffectiveSession, employees: HrEmployee[]): AnnouncementChannel[] {
  const active = employees.filter((item) => item.status !== "inactive");
  const actor = mailAccount(session, employees);
  const channels: AnnouncementChannel[] = [{ id: "company", name: "Toàn công ty", audience: `${active.length} nhân sự`, kind: "company", memberKeys: [...active.map((item) => item.id), "persona:recruiter", "persona:system-admin"] }];
  for (const branch of [...new Set(active.map((item) => item.branch))]) channels.push({ id: `branch:${branch}`, name: branch, audience: "Chi nhánh", kind: "branch", branch, memberKeys: active.filter((item) => item.branch === branch).map((item) => item.id) });
  for (const manager of active.filter((item) => active.some((person) => person.managerId === item.id))) channels.push({ id: `group:${manager.id}`, name: `Nhóm ${manager.name}`, audience: "Nhóm trực tiếp", kind: "group", leadId: manager.id, memberKeys: [manager.id, ...active.filter((person) => person.managerId === manager.id).map((item) => item.id)] });
  return channels.filter((channel) => channel.memberKeys.includes(actor.key) || companyPoster(session.id) && (channel.kind !== "group") && (session.id !== "hr-branch" || channel.kind !== "branch" || channel.branch === session.branch));
}

export function canPostChannel(session: EffectiveSession, actor: MailAccount, channel: AnnouncementChannel) {
  const permission = session.permissions.some((item) => item.resource === "notifications" && item.actions.includes("create"));
  if (!permission) return false;
  if (channel.kind === "group") return ["team-lead", "product-lead"].includes(session.id) && channel.leadId === actor.key;
  if (!companyPoster(session.id)) return false;
  return channel.kind !== "branch" || session.id !== "hr-branch" || channel.branch === session.branch;
}

export function publishAnnouncement(store: CommunicationStore, session: EffectiveSession, actor: MailAccount, channel: AnnouncementChannel, directory: ReturnType<typeof mailDirectory>, input: { id: string; title: string; body: string; emailCopy: boolean; at: string }): CommunicationResult {
  if (!canPostChannel(session, actor, channel)) return { ok: false, error: "Bạn không có quyền đăng ở kênh này." };
  if (input.title.trim().length < 3 || input.title.trim().length > 120 || input.body.trim().length < 8 || input.body.trim().length > 3000) return { ok: false, error: "Tiêu đề hoặc nội dung thông báo chưa hợp lệ." };
  const recipientKeys = [...new Set(channel.memberKeys)];
  const announcement: Announcement = { id: input.id, channelId: channel.id, actorKey: actor.key, actorName: actor.name, title: input.title.trim(), body: input.body.trim(), at: input.at, recipientKeys, emailCopy: input.emailCopy };
  const copies: MailMessage[] = input.emailCopy ? recipientKeys.flatMap((key) => {
    const recipient = directory.find((item) => item.key === key);
    return recipient ? [{ id: `${input.id}-${key}`, from: "thongbao@demo.ohriise.vn", fromName: `Thông báo · ${actor.name}`, to: recipient.address, subject: `[${channel.name}] ${announcement.title}`, body: announcement.body, at: input.at, announcementId: input.id, readBy: [], starredBy: [], archivedBy: [], deletedBy: [] }] : [];
  }) : [];
  return { ok: true, id: announcement.id, store: { ...store, announcements: [announcement, ...store.announcements], mail: [...copies, ...store.mail] } };
}
