"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Pencil,
  Plus,
  Trash2,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { useDemoData } from "@/features/demo/demo-data-context";
import { leaveHistory } from "./mock-data";
import {
  FormField,
  StatusPill,
  WorkflowDialog,
  WorkspaceHeader,
} from "./workspace-frame";

type LeaveRow =
  | (typeof leaveHistory)[number]
  | {
      id: string;
      type: string;
      range: string;
      duration: string;
      status: "pending";
      approver: string;
    };

export function LeaveWorkspace() {
  const { addBusinessRequest, updateBusinessRequest, cancelBusinessRequest } = useDemoData();
  const [open, setOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [type, setType] = useState("Nghỉ phép năm");
  const [date, setDate] = useState("2026-10-15");
  const [duration, setDuration] = useState("1 ngày");
  const [reason, setReason] = useState("");
  const [editingId, setEditingId] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [requests, setRequests] = useState<LeaveRow[]>(leaveHistory);
  const pendingDays = useMemo(
    () =>
      requests
        .filter((item) => item.status === "pending")
        .reduce(
          (sum, item) => sum + (item.duration.startsWith("0.5") ? 0.5 : 1),
          0,
        ),
    [requests],
  );

  function submitLeave() {
    if (reason.trim().length < 8) {
      toast.error("Vui lòng nhập lý do ít nhất 8 ký tự.");
      return;
    }
    const range = new Intl.DateTimeFormat("vi-VN").format(
      new Date(`${date}T00:00:00`),
    );
    const detail = `${type} · ${duration} · ${reason}`;
    if (editingId) {
      updateBusinessRequest(editingId, { date: range, detail });
      setRequests((current) => current.map((item) => item.id === editingId ? { ...item, type, range, duration } : item));
      toast.success("Đã cập nhật đơn nghỉ phép đang chờ duyệt.");
    } else {
      const id = addBusinessRequest({ idPrefix: "LV-2026", type: "Nghỉ phép", employee: "Nguyễn Thu Hà", initials: "NH", date: range, detail });
      setRequests((current) => [{ id, type, range, duration, status: "pending", approver: "Trần Minh Quân" }, ...current]);
      toast.success("Đã gửi đơn nghỉ phép.");
    }
    setEditingId("");
    setReason("");
    setOpen(false);
  }

  return (
    <div className="page-stack">
      <WorkspaceHeader
        eyebrow="NGHỈ PHÉP"
        title="Nghỉ phép"
        description="Quản lý đơn nghỉ phép và theo dõi số dư phép của bạn."
        action={
          <button className="primary-button" onClick={() => { setEditingId(""); setReason(""); setOpen(true); }}>
            <Plus size={16} strokeWidth={1.5} /> Tạo đơn nghỉ
          </button>
        }
      />
      <nav className="module-tabs" aria-label="Chức năng nghỉ phép">{[["overview","Tổng quan"],["requests","Đơn của tôi"],["calendar","Lịch nghỉ"],["policy","Chính sách phép"]].map(([id,label]) => <button className={activeTab === id ? "is-active" : ""} key={id} onClick={() => { setActiveTab(id); if (id === "policy") setPolicyOpen(true); else window.requestAnimationFrame(() => document.getElementById(id === "requests" ? "leave-requests" : id === "calendar" ? "leave-calendar" : "leave-overview")?.scrollIntoView({ behavior: "smooth", block: "start" })); }}>{label}</button>)}</nav>
      <section className="leave-overview-grid" id="leave-overview">
        <article className="panel leave-balance-main">
          <div>
            <span className="eyebrow">PHÉP NĂM 2026</span>
            <strong>8.5</strong>
            <p>ngày khả dụng</p>
          </div>
          <div
            className="leave-ring"
            style={{ "--progress": "55%" } as React.CSSProperties}
          >
            <span>15.5</span>
            <small>tổng ngày</small>
          </div>
          <div className="balance-breakdown">
            <span>
              <i className="used" />
              Đã dùng <b>7 ngày</b>
            </span>
            <span>
              <i className="pending" />
              Đang chờ <b>{pendingDays} ngày</b>
            </span>
          </div>
        </article>
        <article className="panel leave-context">
          <div className="panel-heading compact">
            <div>
              <span className="eyebrow">LỊCH ĐỘI NGŨ</span>
              <h3>7 ngày tới</h3>
            </div>
            <UsersRound size={18} strokeWidth={1.5} />
          </div>
          <div className="team-away">
            <div>
              <span className="avatar avatar-sm">LĐ</span>
              <div>
                <strong>Lê Hoàng Đức</strong>
                <p>Nghỉ phép · 12/10</p>
              </div>
            </div>
            <div>
              <span className="avatar avatar-sm">VA</span>
              <div>
                <strong>Võ Minh Anh</strong>
                <p>WFH · 13/10</p>
              </div>
            </div>
          </div>
          <small>Không có xung đột nhân sự với ngày 15/10 bạn đang chọn.</small>
        </article>
        <article className="panel leave-policy">
          <span className="eyebrow">CHÍNH SÁCH</span>
          <h3>Thời hạn báo trước</h3>
          <strong>02 ngày</strong>
          <p>cho yêu cầu nghỉ phép năm từ 01 ngày.</p>
          <button className="text-button" onClick={() => setPolicyOpen(true)}>
            Xem chính sách đầy đủ
          </button>
        </article>
      </section>
      <section className="leave-planning" id="leave-calendar">
        <article className="panel leave-calendar-card"><div className="data-panel-head"><div><span className="eyebrow">LỊCH NGHỈ PHÉP</span><h3>Tháng 10/2026</h3></div><span className="filter-button">Hôm nay</span></div><div className="mini-calendar-weekdays">{["T2","T3","T4","T5","T6","T7","CN"].map((day) => <span key={day}>{day}</span>)}</div><div className="mini-calendar-grid leave-calendar-grid">{Array.from({ length: 35 }, (_, index) => { const day = index - 2; const active = day > 0 && day <= 31; const tone = day >= 14 && day <= 16 ? "leave" : day === 7 ? "is-today" : ""; return <span className={`${active ? "" : "is-muted"} ${tone}`} key={index}>{active ? day : ""}</span>; })}</div><div className="calendar-legend"><span><i className="leave" />Nghỉ đã duyệt</span><span><i className="upcoming" />Nghỉ sắp tới</span><span><i className="holiday" />Ngày lễ</span></div></article>
        <aside className="panel leave-type-balances"><div className="panel-heading compact"><div><span className="eyebrow">LOẠI NGHỈ PHÉP</span><h3>Số dư năm 2026</h3></div><CalendarDays size={18} /></div>{[["Phép năm","8.5 / 15.5 ngày",55],["Phép bệnh","3 / 3 ngày",100],["Phép cá nhân","1 / 3 ngày",33],["Phép không lương","0 / 10 ngày",0]].map(([label,value,progress]) => <div key={String(label)}><p><strong>{label}</strong><span>{value}</span></p><i><b style={{ width: `${progress}%` }} /></i></div>)}</aside>
      </section>
      <section className="panel data-panel" id="leave-requests">
        <div className="data-panel-head">
          <div>
            <span className="eyebrow">YÊU CẦU GẦN ĐÂY</span>
            <h3>Lịch sử nghỉ phép</h3>
          </div>
          <span className="filter-button" aria-label="Năm báo cáo">
            <CalendarDays size={14} strokeWidth={1.5} /> Năm 2026
          </span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã yêu cầu</th>
                <th>Loại nghỉ</th>
                <th aria-label="Thao tác"></th>
                <th>Thời gian</th>
                <th>Thời lượng</th>
                <th>Người duyệt</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((item) => (
                <tr key={item.id}>
                  <td className="mono">{item.id}</td>
                  <td>
                    <strong>{item.type}</strong>
                  </td>
                  <td>{item.status === "pending" && <div className="table-row-actions"><button aria-label={`Sửa ${item.id}`} onClick={() => { setEditingId(item.id); setType(item.type); setDuration(item.duration); setReason("Điều chỉnh thời gian nghỉ"); setOpen(true); }}><Pencil size={13} strokeWidth={1.5} /></button><button aria-label={`Hủy ${item.id}`} onClick={() => { cancelBusinessRequest(item.id); setRequests((current) => current.filter((request) => request.id !== item.id)); toast.success("Đã hủy đơn; số dư tạm giữ được hoàn lại."); }}><Trash2 size={13} strokeWidth={1.5} /></button></div>}</td>
                  <td>{item.range}</td>
                  <td>{item.duration}</td>
                  <td>{item.approver}</td>
                  <td>
                    {item.status === "pending" ? (
                      <StatusPill tone="warning">
                        <Clock3 size={12} strokeWidth={1.5} /> Chờ duyệt
                      </StatusPill>
                    ) : (
                      <StatusPill tone="success">
                        <CheckCircle2 size={12} strokeWidth={1.5} /> Đã duyệt
                      </StatusPill>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <WorkflowDialog
        open={open}
        onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) setEditingId(""); }}
        title={editingId ? "Cập nhật đơn nghỉ phép" : "Tạo đơn nghỉ phép"}
        description="Số dư tạm tính sẽ được giữ khi yêu cầu được gửi."
        footer={
          <>
            <button className="secondary-button" onClick={() => { setOpen(false); setEditingId(""); }}>
              Hủy
            </button>
            <button className="primary-button" onClick={submitLeave}>
              {editingId ? "Lưu thay đổi" : "Gửi đơn nghỉ"}
            </button>
          </>
        }
      >
        <div className="form-grid two-cols">
          <FormField label="Loại nghỉ" required>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option>Nghỉ phép năm</option>
              <option>Nghỉ không lương</option>
              <option>Nghỉ ốm</option>
            </select>
          </FormField>
          <FormField label="Ngày nghỉ" required>
            <input
              type="date"
              min="2026-10-08"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </FormField>
          <FormField label="Thời lượng" required>
            <select
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
            >
              <option>1 ngày</option>
              <option>0.5 ngày · Buổi sáng</option>
              <option>0.5 ngày · Buổi chiều</option>
            </select>
          </FormField>
          <FormField label="Người duyệt">
            <input value="Trần Minh Quân · Team Lead" disabled />
          </FormField>
        </div>
        <FormField
          label="Lý do"
          hint="Không đưa thông tin y tế nhạy cảm nếu không cần thiết."
          required
        >
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Mô tả ngắn gọn lý do nghỉ..."
          />
        </FormField>
      </WorkflowDialog>
      <WorkflowDialog
        open={policyOpen}
        onOpenChange={setPolicyOpen}
        title="Chính sách nghỉ phép năm"
        description="Áp dụng cho nhân viên toàn thời gian từ ngày hiệu lực hợp đồng."
        footer={
          <button
            className="primary-button"
            onClick={() => setPolicyOpen(false)}
          >
            Đã hiểu
          </button>
        }
      >
        <div className="policy-detail">
          <p>
            <strong>Báo trước:</strong> tối thiểu 02 ngày làm việc với đơn từ 01
            ngày.
          </p>
          <p>
            <strong>Đơn khẩn cấp:</strong> có thể gửi trong ngày và cần nêu rõ
            lý do để Team Lead xem xét.
          </p>
          <p>
            <strong>Hủy đơn:</strong> đơn đang chờ duyệt có thể được hủy trước
            ngày nghỉ.
          </p>
        </div>
      </WorkflowDialog>
    </div>
  );
}
