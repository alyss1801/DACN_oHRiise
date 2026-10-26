"use client";

import { useState } from "react";
import { toast } from "sonner";
import { WorkspaceHeader } from "@/features/employee/workspace-frame";
import { useHrDemo } from "@/features/hr/hr-demo-context";
import { hrDate } from "@/features/hr/hr-demo-data";
import { useSession } from "@/features/session/session-context";
import { demoBusinessDate, demoBusinessNow } from "@/lib/demo-clock";
import { disableIsDue, scheduledDisableAt } from "@/features/hr/offboarding-model";
import { useIam } from "./iam-context";

type TaskKind = "onboarding" | "offboarding";

export function AccountTasksWorkspace({ initialKind = "onboarding", onNavigate }: { initialKind?: TaskKind; onNavigate: (id: string) => void }) {
  const { accounts, createAccount, completeOnboardingAccount, completeOffboardingAccount } = useIam();
  const { cases, employees, assets } = useHrDemo();
  const { can } = useSession();
  const [kind, setKind] = useState<TaskKind>(initialKind);
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("");
  const [readiness, setReadiness] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(false);

  const rows = cases
    .filter((item) => !item.completedAt && !item.cancelledAt && item.tasks.some((task) => task.id === "account" && !task.doneAt))
    .map((item) => {
      const person = employees.find((entry) => entry.id === item.employeeId);
      const account = accounts.find((entry) => entry.employeeId === item.employeeId);
      const blockers = item.kind === "onboarding" ? [
        !person || person.status === "inactive" ? "Hồ sơ nhân sự không còn hoạt động" : "",
        !account ? "Cần tạo tài khoản IAM trước" : !["pending", "active"].includes(account.status) ? "Tài khoản cần chờ kích hoạt hoặc đang hoạt động" : "",
      ].filter(Boolean) : [
        !account ? "Chưa có tài khoản IAM" : account.status === "inactive" ? "IAM đã vô hiệu nhưng checklist chưa đồng bộ" : "",
        !disableIsDue(item, demoBusinessNow().toISOString()) ? `Chưa đến giờ khóa (${scheduledDisableAt(item) ? new Date(scheduledDisableAt(item)!).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "chưa xác định"})` : "",
        item.tasks.some((task) => task.id !== "account" && !task.doneAt) ? "Checklist bàn giao chưa hoàn tất" : "",
        assets.some((asset) => asset.holderId === item.employeeId) ? "Còn tài sản chưa thu hồi" : "",
      ].filter(Boolean);
      return { item, person, account, blockers };
    });
  const visible = rows.filter(({ item, person, blockers }) =>
    item.kind === kind &&
    `${person?.name ?? ""} ${person?.id ?? ""} ${item.id}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")) &&
    (!branch || person?.branch === branch) &&
    (!readiness || (readiness === "ready" ? blockers.length === 0 : blockers.length > 0)),
  );
  const selected = rows.find(({ item }) => item.id === selectedId && item.kind === kind);
  const readyToAct = selected && selected.blockers.length === 0 && note.trim().length >= 8 && can("accounts", "edit");

  function provision() {
    if (!selected || selected.item.kind !== "onboarding" || selected.account || !can("accounts", "create")) return;
    const id = createAccount(selected.item.employeeId);
    if (!id) { toast.error("Không thể tạo tài khoản; kiểm tra nhân sự hoặc tài khoản trùng."); return; }
    toast.success("Đã tạo tài khoản chờ kích hoạt cho đúng nhân sự trong demo.");
  }

  function submit() {
    if (!selected || !readyToAct) return;
    const success = selected.item.kind === "onboarding"
      ? completeOnboardingAccount(selected.item.id, note)
      : completeOffboardingAccount(selected.item.id, note);
    if (!success) { toast.error("Điều kiện đã thay đổi. Vui lòng kiểm tra lại tài khoản và checklist."); return; }
    toast.success(selected.item.kind === "onboarding" ? "Đã kích hoạt IAM và hoàn tất bước tài khoản onboarding trong demo." : "Đã ghi nhận vô hiệu hóa IAM và hoàn tất offboarding trong demo.");
    setSelectedId(""); setNote(""); setConfirm(false);
  }

  return <div className="page-stack iam-account-tasks">
    <WorkspaceHeader eyebrow="SYSTEM ADMIN · VÒNG ĐỜI TÀI KHOẢN" title="Tác vụ tài khoản" description={`${rows.filter((row) => row.item.kind === kind).length} hồ sơ ${kind === "onboarding" ? "chờ cấp/kích hoạt" : "chờ vô hiệu hóa"} · ngày nghiệp vụ ${hrDate(demoBusinessDate())}.`} />
    <nav className="hr-core-tabs" aria-label="Loại tác vụ tài khoản">
      <button className={kind === "onboarding" ? "active" : ""} aria-pressed={kind === "onboarding"} onClick={() => { setKind("onboarding"); setSelectedId(""); setConfirm(false); }}>Cấp tài khoản ({rows.filter((row) => row.item.kind === "onboarding").length})</button>
      <button className={kind === "offboarding" ? "active" : ""} aria-pressed={kind === "offboarding"} onClick={() => { setKind("offboarding"); setSelectedId(""); setConfirm(false); }}>Khóa theo lịch ({rows.filter((row) => row.item.kind === "offboarding").length})</button>
    </nav>
    <section className="panel hr-directory">
      <div className="hr-directory-tools">
        <input aria-label="Tìm tác vụ tài khoản" placeholder="Tên, mã nhân viên hoặc mã quy trình" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select aria-label="Lọc chi nhánh" value={branch} onChange={(event) => setBranch(event.target.value)}><option value="">Mọi chi nhánh</option>{[...new Set(rows.filter((row) => row.item.kind === kind).map(({ person }) => person?.branch).filter((value): value is string => Boolean(value)))].map((value) => <option key={value}>{value}</option>)}</select>
        <select aria-label="Lọc mức sẵn sàng" value={readiness} onChange={(event) => setReadiness(event.target.value)}><option value="">Mọi trạng thái</option><option value="ready">Sẵn sàng</option><option value="blocked">Có điều kiện chặn</option></select>
      </div>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>Nhân viên</th><th>Chi nhánh</th><th>{kind === "onboarding" ? "Bắt đầu" : "Ngày cuối"}</th><th>{kind === "onboarding" ? "Việc còn lại" : "Khóa dự kiến"}</th><th>Tài khoản</th><th>Điều kiện</th><th /></tr></thead><tbody>{visible.map(({ item, person, account, blockers }) => <tr key={item.id}><td><strong>{person?.name ?? item.employeeId}</strong><small>{item.id} · {item.employeeId}</small></td><td>{person?.branch ?? "—"}</td><td>{item.kind === "onboarding" ? hrDate(person?.startDate ?? item.startedAt) : item.lastWorkingDay ? hrDate(item.lastWorkingDay) : "Chưa xác định"}</td><td>{item.kind === "onboarding" ? `${item.tasks.filter((task) => !task.doneAt && task.id !== "account").length} bước HR/IT` : scheduledDisableAt(item) ? new Date(scheduledDisableAt(item)!).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "Chưa xác định"}</td><td>{account?.status ?? "Chưa có"}</td><td>{blockers.length ? <span className="hr-warning">{blockers.join(" · ")}</span> : <span>Sẵn sàng</span>}</td><td><button className="row-action" onClick={() => { setSelectedId(item.id); setNote(""); setConfirm(false); }}>Xử lý</button></td></tr>)}</tbody></table></div>
      {!visible.length && <p className="hr-empty">Không có tác vụ phù hợp bộ lọc.</p>}
    </section>
    {selected && <section className="panel iam-task-detail">
      <div><span className="eyebrow">{selected.item.id}</span><h3>{selected.person?.name ?? selected.item.employeeId}</h3><p>{selected.account?.email ?? selected.person?.email ?? "Chưa có email"} · {selected.person?.branch ?? "—"}</p></div>
      <div><strong>{kind === "onboarding" ? "Cấp quyền bản thân tối thiểu" : "Điều kiện trước khi vô hiệu hóa"}</strong>{selected.blockers.length ? <ul>{selected.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul> : <p>{kind === "onboarding" ? "Tài khoản đã gắn đúng nhân sự. Kích hoạt sẽ cập nhật checklist HR; các bước khác vẫn do HR/IT phụ trách." : "Đã đến giờ khóa, bàn giao hoàn tất và không còn tài sản đang giữ."}</p>}
        {!selected.account && kind === "onboarding" && <button className="secondary-button" disabled={!can("accounts", "create") || !selected.person || selected.person.status === "inactive"} onClick={provision}>Tạo tài khoản chờ kích hoạt</button>}
        {selected.account && <button className="secondary-button" onClick={() => onNavigate(`access/users/${selected.account!.id}`)}>Mở tài khoản IAM</button>}
      </div>
      <label>Ghi chú / bằng chứng xác nhận<textarea rows={3} value={note} onChange={(event) => { setNote(event.target.value); setConfirm(false); }} placeholder="Ghi số phiếu hoặc căn cứ xử lý (tối thiểu 8 ký tự)" /></label>
      {confirm ? <div className="hr-inline-confirm"><div><strong>{kind === "onboarding" ? "Kích hoạt tài khoản demo?" : "Vô hiệu hóa tài khoản demo?"}</strong><p>IAM và checklist HR cùng ghi kết quả trong phiên trình duyệt này.</p></div><button className="secondary-button" onClick={() => setConfirm(false)}>Hủy</button><button className="primary-button" onClick={submit}>Xác nhận</button></div> : <button className="primary-button" disabled={!readyToAct} onClick={() => setConfirm(true)}>{kind === "onboarding" ? "Kích hoạt và ghi checklist" : "Vô hiệu hóa tài khoản"}</button>}
    </section>}
  </div>;
}
