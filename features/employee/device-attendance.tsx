"use client";

import {
  CheckCircle2,
  CreditCard,
  Fingerprint,
  Radio,
  RefreshCw,
  ShieldCheck,
  Wifi,
} from "lucide-react";
import "./device-attendance.css";

export function DeviceAttendance({
  scanState,
  onScan,
  onReset,
}: {
  scanState: "ready" | "success";
  onScan: () => void;
  onReset: () => void;
}) {
  const scanSuccessful = scanState === "success";

  return (
    <section className="device-attendance-layout" aria-label="Điểm danh bằng thẻ từ hoặc vân tay">
      <article className="panel device-terminal-card">
        <div className="device-terminal-heading">
          <div>
            <h2>Thiết bị chấm công tại văn phòng</h2>
            <p>Quét thẻ nhân viên hoặc vân tay trên terminal được doanh nghiệp cấu hình.</p>
          </div>
          <span className="device-online-status">
            <Wifi size={15} aria-hidden="true" /> Đang kết nối
          </span>
        </div>

        <div className={`attendance-terminal${scanSuccessful ? " is-success" : ""}`}>
          <div className="terminal-topbar">
            <span>oHRiise Access</span>
            <span>HCM-Q1-ENT-02</span>
          </div>
          <div className="terminal-screen">
            {scanSuccessful ? (
              <>
                <span className="terminal-result-icon">
                  <CheckCircle2 size={34} aria-hidden="true" />
                </span>
                <strong>Điểm danh thành công</strong>
                <span>Nguyễn Thu Hà · 08:42</span>
                <small>Vân tay · Cổng chính HCM-Q1</small>
              </>
            ) : (
              <>
                <span className="terminal-signal">
                  <Radio size={28} aria-hidden="true" />
                </span>
                <strong>Sẵn sàng nhận diện</strong>
                <span>Chạm thẻ hoặc đặt ngón tay lên cảm biến</span>
              </>
            )}
          </div>
          <div className="terminal-inputs" aria-hidden="true">
            <div className="terminal-card-reader">
              <CreditCard size={30} />
              <span>RFID / NFC</span>
            </div>
            <div className="terminal-fingerprint-reader">
              <Fingerprint size={50} />
              <span>Vân tay</span>
            </div>
          </div>
        </div>

        <div className="device-terminal-actions">
          <button type="button" className="primary-action" onClick={onScan} disabled={scanSuccessful}>
            <Fingerprint size={17} aria-hidden="true" />
            {scanSuccessful ? "Đã nhận diện" : "Mô phỏng lượt quét"}
          </button>
          {scanSuccessful && (
            <button type="button" className="secondary-action" onClick={onReset}>
              <RefreshCw size={16} aria-hidden="true" /> Quét lượt khác
            </button>
          )}
        </div>
      </article>

      <aside className="device-attendance-sidebar">
        <article className="panel device-integration-card">
          <div className="device-card-title">
            <span className="device-card-icon">
              <ShieldCheck size={20} aria-hidden="true" />
            </span>
            <div>
              <h3>Thông tin thiết bị</h3>
              <p>Đồng bộ với hệ thống oHRiise</p>
            </div>
          </div>
          <dl className="device-metadata-list">
            <div>
              <dt>Mã thiết bị</dt>
              <dd>HCM-Q1-ENT-02</dd>
            </div>
            <div>
              <dt>Vị trí</dt>
              <dd>Cổng chính · Tầng 1</dd>
            </div>
            <div>
              <dt>Kết nối</dt>
              <dd><span className="status-dot" /> Online · LAN</dd>
            </div>
            <div>
              <dt>Đồng bộ gần nhất</dt>
              <dd>Vừa xong</dd>
            </div>
          </dl>
          <div className="device-methods">
            <span><CreditCard size={15} aria-hidden="true" /> Thẻ từ</span>
            <span><Fingerprint size={15} aria-hidden="true" /> Vân tay</span>
          </div>
        </article>

        <article className="panel device-privacy-note">
          <ShieldCheck size={20} aria-hidden="true" />
          <p>oHRiise chỉ nhận sự kiện điểm danh và mã định danh nhân viên; không lưu ảnh hay mẫu vân tay thô.</p>
        </article>
      </aside>

      <article className="panel device-event-card">
        <div className="device-event-heading">
          <div>
            <h3>Lượt quét gần đây</h3>
            <p>Dữ liệu từ thiết bị HCM-Q1-ENT-02</p>
          </div>
          <span>Hôm nay · 07/10</span>
        </div>
        <div className="device-event-list" role="table" aria-label="Lượt quét thẻ từ và vân tay gần đây">
          <div className="device-event-row device-event-header" role="row">
            <span role="columnheader">Thời gian</span>
            <span role="columnheader">Nhân viên</span>
            <span role="columnheader">Phương thức</span>
            <span role="columnheader">Kết quả</span>
          </div>
          {scanSuccessful && (
            <div className="device-event-row is-new" role="row">
              <strong role="cell">08:42</strong>
              <span role="cell">Nguyễn Thu Hà</span>
              <span role="cell"><Fingerprint size={15} aria-hidden="true" /> Vân tay</span>
              <span role="cell"><CheckCircle2 size={15} aria-hidden="true" /> Thành công</span>
            </div>
          )}
          <div className="device-event-row" role="row">
            <strong role="cell">08:31</strong>
            <span role="cell">Trần Minh Khoa</span>
            <span role="cell"><CreditCard size={15} aria-hidden="true" /> Thẻ từ</span>
            <span role="cell"><CheckCircle2 size={15} aria-hidden="true" /> Thành công</span>
          </div>
          <div className="device-event-row" role="row">
            <strong role="cell">08:26</strong>
            <span role="cell">Lê Hoàng Nam</span>
            <span role="cell"><Fingerprint size={15} aria-hidden="true" /> Vân tay</span>
            <span role="cell"><CheckCircle2 size={15} aria-hidden="true" /> Thành công</span>
          </div>
        </div>
      </article>
    </section>
  );
}
