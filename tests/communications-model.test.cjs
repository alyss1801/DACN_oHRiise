/* eslint-disable @typescript-eslint/no-require-imports -- Pure TypeScript domain tests without another runtime dependency. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
Module._extensions[".ts"] = function loadTs(module, filename) { module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename); };
const { getPersona, personas } = require("../lib/authorization/personas.ts");
const { isDeferredModule, navigationFor } = require("../lib/navigation.ts");
const { mailAccount, mailDirectory, mailbox, initialCommunicationStore, sendMail, saveMailDraft, changeMail, channelsFor, canPostChannel, publishAnnouncement } = require("../features/communications/communications-model.ts");

const employees = [
  { id: "OH-0184", name: "Trần Minh Quân", email: "quan.tran@ohriise.vn", initials: "TQ", branch: "HCM-Q1", status: "active" },
  { id: "OH-0248", name: "Nguyễn Thu Hà", email: "ha.nguyen@ohriise.vn", initials: "NH", branch: "HCM-Q1", managerId: "OH-0184", status: "active" },
  { id: "OH-0259", name: "Bùi Thanh Tâm", email: "tam.bui@ohriise.vn", initials: "BT", branch: "HCM-TD", status: "active" },
  { id: "OH-0271", name: "Lê Hoàng Vy", email: "vy.le@ohriise.vn", initials: "LV", branch: "HCM-TD", managerId: "OH-0259", status: "active" },
  { id: "OH-0091", name: "Nguyễn Thanh Lan", email: "lan.nguyen@ohriise.vn", initials: "NL", branch: "HCM-Q1", status: "active" },
  { id: "OH-0266", name: "Võ Thu Linh", email: "linh.vo@ohriise.vn", initials: "TL", branch: "HCM-Q1", managerId: "OH-0091", status: "active" },
];
const at = "2026-10-20T04:00:00.000Z";

test("email is reachable for every personnel persona", () => {
  assert.equal(isDeferredModule("email"), false);
  for (const persona of personas) assert.ok(navigationFor(persona).some((group) => group.items.some((item) => item.id === "email")), persona.id);
});

test("mail stays inside the addressed mailbox; drafts and changes are owner scoped", () => {
  const employee = mailAccount(getPersona("employee"), employees);
  const lead = mailAccount(getPersona("product-lead"), employees);
  const hr = mailAccount(getPersona("hr-total"), employees);
  const directory = mailDirectory(employees);
  assert.equal(sendMail(initialCommunicationStore, employee, directory, { id: "m1", to: "outside@example.com", subject: "Hello", body: "Hello there", at }).ok, false);
  const saved = saveMailDraft(initialCommunicationStore, employee, { id: "d1", to: lead.address, subject: "Tiến độ", body: "Em gửi cập nhật", at });
  assert.equal(saved.ok, true);
  assert.equal(mailbox(saved.store, lead.address, "inbox").some((item) => item.id === "d1"), false);
  const sent = sendMail(saved.store, employee, directory, { id: "m1", draftId: "d1", to: lead.address, subject: "Tiến độ", body: "Em gửi cập nhật", at });
  assert.equal(sent.ok, true);
  assert.equal(mailbox(sent.store, lead.address, "inbox").some((item) => item.id === "d1"), true);
  assert.equal(mailbox(sent.store, hr.address, "inbox").some((item) => item.id === "d1"), false);
  assert.equal(changeMail(sent.store, hr, "d1", "trash").ok, false);
  const removed = changeMail(sent.store, lead, "d1", "trash");
  assert.equal(mailbox(removed.store, lead.address, "inbox").some((item) => item.id === "d1"), false);
  assert.equal(mailbox(removed.store, employee.address, "sent").some((item) => item.id === "d1"), true);
});

test("channel posting follows HR, admin and direct lead permissions; email copies are optional", () => {
  const employeeSession = getPersona("employee");
  const leadSession = getPersona("team-lead");
  const otherLeadSession = getPersona("product-lead");
  const hrSession = getPersona("hr-total");
  const branchHrSession = getPersona("hr-branch");
  const adminSession = getPersona("system-admin");
  const lead = mailAccount(leadSession, employees);
  const leadGroup = channelsFor(leadSession, employees).find((item) => item.id === "group:OH-0259");
  const company = channelsFor(hrSession, employees).find((item) => item.id === "company");
  assert.ok(leadGroup);
  assert.ok(company);
  assert.equal(canPostChannel(leadSession, lead, leadGroup), true);
  assert.equal(canPostChannel(leadSession, lead, company), false);
  assert.equal(canPostChannel(otherLeadSession, mailAccount(otherLeadSession, employees), leadGroup), false);
  assert.equal(canPostChannel(employeeSession, mailAccount(employeeSession, employees), company), false);
  assert.equal(canPostChannel(hrSession, mailAccount(hrSession, employees), company), true);
  assert.equal(canPostChannel(adminSession, mailAccount(adminSession, employees), company), true);
  const otherBranch = channelsFor(branchHrSession, employees).find((item) => item.id === "branch:HCM-TD");
  assert.equal(otherBranch, undefined);
  const denied = publishAnnouncement(initialCommunicationStore, leadSession, lead, company, mailDirectory(employees), { id: "a0", title: "Thông báo", body: "Nội dung gửi toàn công ty", emailCopy: true, at });
  assert.equal(denied.ok, false);
  const posted = publishAnnouncement(initialCommunicationStore, leadSession, lead, leadGroup, mailDirectory(employees), { id: "a1", title: "Lịch họp nhóm", body: "Họp nhóm vào sáng thứ Sáu", emailCopy: true, at });
  assert.equal(posted.ok, true);
  assert.deepEqual(posted.store.announcements[0].recipientKeys.sort(), ["OH-0259", "OH-0271"].sort());
  assert.equal(mailbox(posted.store, "vy.le@ohriise.vn", "inbox").some((item) => item.announcementId === "a1"), true);
  assert.equal(mailbox(posted.store, "ha.nguyen@ohriise.vn", "inbox").some((item) => item.announcementId === "a1"), false);
  const noCopy = publishAnnouncement(posted.store, hrSession, mailAccount(hrSession, employees), company, mailDirectory(employees), { id: "a2", title: "Lịch nghỉ lễ", body: "Vui lòng xem lịch nghỉ lễ mới", emailCopy: false, at });
  assert.equal(noCopy.ok, true);
  assert.equal(noCopy.store.mail.some((item) => item.announcementId === "a2"), false);
});
