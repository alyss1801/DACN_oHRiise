"use client";

import { useState } from "react";
import { CreditCard, Fingerprint, MapPin, ScanFace } from "lucide-react";
import type { HrAttendance, HrSelfPunch, PunchMethod } from "@/features/hr/hr-demo-data";

type Method = Exclude<PunchMethod, "manual">;

const methods = [
  { id: "gps", label: "GPS", icon: MapPin },
  { id: "card", label: "Thẻ từ", icon: CreditCard },
  { id: "fingerprint", label: "Vân tay", icon: Fingerprint },
  { id: "face", label: "Khuôn mặt", icon: ScanFace },
] as const;

const methodLabels: Record<PunchMethod, string> = {
  manual: "thủ công",
  gps: "GPS",
  card: "thẻ từ",
  fingerprint: "vân tay",
  face: "khuôn mặt",
};

const timeLabel = (value: string) => new Date(value).toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" });
const dateLabel = (value: string) => new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T12:00:00Z`));

export function AttendanceMethods({ date, branch, punch, row, blocked, periodOpen, onPunch, onNavigate }: {
  date: string;
  branch: string;
  punch?: HrSelfPunch;
  row?: HrAttendance;
  blocked: boolean;
  periodOpen: boolean;
  onPunch: (kind: "check-in" | "check-out", method: PunchMethod) => void;
  onNavigate: (id: string) => void;
}) {
  const [selected, setSelected] = useState<Method>("gps");
  const active = methods.find((method) => method.id === selected)!;
  const Icon = active.icon;
  const isDevice = selected !== "gps";
  const canCheckIn = periodOpen && !blocked && !row && !punch;
  const canCheckOut = periodOpen && !blocked && !row && !!punch && !punch.checkOutAt;

  return <section className="panel attendance-methods">
    <div className="hr-core-heading"><div><h2>Chấm công · {dateLabel(date)}</h2></div></div>
    <div className="attendance-method-grid" role="group" aria-label="Chọn phương thức chấm công">
      {methods.map((method) => { const MethodIcon = method.icon; return <button type="button" key={method.id} className={selected === method.id ? "selected" : ""} aria-pressed={selected === method.id} onClick={() => setSelected(method.id)}><MethodIcon size={22} strokeWidth={1.7} /><span>{method.label}</span></button>; })}
    </div>
    <div className="attendance-method-detail">
      <div className="attendance-method-symbol"><Icon size={36} strokeWidth={1.5} /></div>
      <div className="attendance-method-copy">
        <h3>{isDevice ? `Chấm công bằng ${active.label.toLowerCase()}` : "Chấm công GPS"}</h3>
        <p>{isDevice ? `Mô phỏng lượt nhận diện ${active.label.toLowerCase()} tại thiết bị của chi nhánh ${branch}.` : `Mô phỏng điểm danh theo vị trí tại chi nhánh ${branch}.`}</p>
        <small>Demo cục bộ: chưa xác thực vị trí, thẻ hoặc sinh trắc học thật.</small>
      </div>
      <div className="attendance-method-actions">
        <button type="button" className="primary-button" disabled={!canCheckIn} onClick={() => onPunch("check-in", selected)}>Check-in</button>
        <button type="button" className="secondary-button" disabled={!canCheckOut} onClick={() => onPunch("check-out", selected)}>Check-out</button>
      </div>
    </div>
    <div className="attendance-session-status">
      <div><span>Check-in</span><strong>{punch ? `${timeLabel(punch.checkInAt)} · ${methodLabels[punch.checkInMethod ?? "manual"]}` : row ? "Đã có bản ghi công" : "Chưa ghi nhận"}</strong></div>
      <div><span>Check-out</span><strong>{punch?.checkOutAt ? `${timeLabel(punch.checkOutAt)} · ${methodLabels[punch.checkOutMethod ?? "manual"]}` : "Chưa ghi nhận"}</strong></div>
    </div>
    {blocked && <p className="attendance-method-alert">Ngày này đã có nghỉ phép hoặc WFH được duyệt; không thể điểm danh văn phòng.</p>}
    {!periodOpen && <p className="attendance-method-alert">Kỳ công chưa mở hoặc đã chốt; liên hệ HR.</p>}
    <div className="attendance-method-links"><button type="button" className="row-action" onClick={() => onNavigate("approvals/adjustment")}>Điều chỉnh Clock-in/out</button><button type="button" className="row-action" onClick={() => onNavigate("approvals/overtime")}>Đăng ký OT</button></div>
  </section>;
}
