"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Building2,
  Camera,
  Edit3,
  EyeOff,
  IdCard,
  Landmark,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/features/session/session-context";
import {
  FormField,
  StatusPill,
  WorkflowDialog,
  WorkspaceHeader,
} from "./workspace-frame";

const sections = [
  "Thông tin cá nhân",
  "Công việc",
  "Liên hệ",
  "Ngân hàng",
  "Chứng chỉ",
  "Thiết bị",
];

export function ProfileWorkspace() {
  const { session, fieldVisibility } = useSession();
  const [section, setSection] = useState(sections[0]);
  const [editOpen, setEditOpen] = useState(false);
  const [phone, setPhone] = useState("090 315 8826");
  const [address, setAddress] = useState(
    "72 Nguyễn Thị Minh Khai, Quận 3, TP.HCM",
  );
  const [photoName, setPhotoName] = useState("");

  const mask = (field: string, value: string) => {
    const visibility = fieldVisibility(field);
    if (visibility === "hidden") return "Không được phép xem";
    if (visibility === "masked")
      return value.replace(/[0-9A-Za-zÀ-ỹ](?=.{4})/g, "•");
    return value;
  };

  function saveProfile() {
    setEditOpen(false);
    toast.success("Đã cập nhật thông tin liên hệ.");
  }

  return (
    <div className="page-stack">
      <WorkspaceHeader
        eyebrow="HỒ SƠ CÁ NHÂN"
        title="Hồ sơ của tôi"
        description="Quản lý thông tin cá nhân, công việc và các tài liệu liên quan."
        action={
          <button className="primary-button" onClick={() => setEditOpen(true)}>
            <Edit3 size={16} strokeWidth={1.5} /> Cập nhật hồ sơ
          </button>
        }
      />
      <section className="profile-layout">
        <aside className="panel profile-summary">
          <div className="profile-photo">
            <span>NH</span>
            <label
              aria-label="Đổi ảnh đại diện"
              title={photoName || "Đổi ảnh đại diện"}
            >
              <Camera size={14} strokeWidth={1.5} />
              <input
                className="sr-only"
                type="file"
                accept="image/png,image/jpeg"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    setPhotoName(file.name);
                    toast.success(`Đã chọn ${file.name} làm ảnh đại diện.`);
                  }
                }}
              />
            </label>
          </div>
          <h3>Nguyễn Thu Hà</h3>
          <p>Product Designer</p>
          <StatusPill tone="success">
            <BadgeCheck size={13} strokeWidth={1.5} /> Đang làm việc
          </StatusPill>
          <div className="profile-meta">
            <div>
              <IdCard size={15} strokeWidth={1.5} />
              <span>Mã nhân viên</span>
              <strong>OH-0248</strong>
            </div>
            <div>
              <Building2 size={15} strokeWidth={1.5} />
              <span>Phòng ban</span>
              <strong>Sản phẩm</strong>
            </div>
            <div>
              <MapPin size={15} strokeWidth={1.5} />
              <span>Chi nhánh</span>
              <strong>{session.branch}</strong>
            </div>
          </div>
          <div className="profile-completion">
            <div>
              <span>Độ hoàn thiện hồ sơ</span>
              <strong>92%</strong>
            </div>
            <i>
              <b />
            </i>
            <small>Bổ sung chứng chỉ chuyên môn để hoàn tất.</small>
          </div>
        </aside>
        <div className="panel profile-detail">
          <div className="profile-tabs" role="tablist">
            {sections.map((item) => (
              <button
                key={item}
                role="tab"
                aria-selected={section === item}
                className={section === item ? "is-active" : ""}
                onClick={() => setSection(item)}
              >
                {item}
              </button>
            ))}
          </div>
          {section === "Thông tin cá nhân" && (
            <div className="info-section">
              <SectionTitle
                icon={UserRound}
                title="Thông tin cơ bản"
                subtitle="Thông tin định danh trong hồ sơ nhân sự."
              />
              <div className="info-grid">
                <Info label="Họ và tên" value="Nguyễn Thu Hà" />
                <Info label="Ngày sinh" value="18/04/1997" />
                <Info label="Giới tính" value="Nữ" />
                <Info
                  label="CCCD"
                  value={mask("citizenId", "079197008826")}
                  sensitive={fieldVisibility("citizenId") !== "visible"}
                />
                <Info label="Quốc tịch" value="Việt Nam" />
                <Info label="Tình trạng hôn nhân" value="Độc thân" />
              </div>
            </div>
          )}
          {section === "Công việc" && (
            <div className="info-section">
              <SectionTitle
                icon={Building2}
                title="Thông tin công việc"
                subtitle="Cơ cấu và quan hệ báo cáo hiện tại."
              />
              <div className="info-grid">
                <Info label="Chức danh" value="Product Designer" />
                <Info label="Phòng ban" value="Sản phẩm" />
                <Info label="Quản lý trực tiếp" value="Trần Minh Quân" />
                <Info label="Ngày vào làm" value="04/03/2024" />
                <Info label="Loại hình" value="Toàn thời gian" />
                <Info label="Nơi làm việc" value="HCM-Q1 · Hybrid" />
              </div>
            </div>
          )}
          {section === "Liên hệ" && (
            <div className="info-section">
              <SectionTitle
                icon={Phone}
                title="Thông tin liên hệ"
                subtitle="Bạn có thể tự cập nhật các trường này."
              />
              <div className="info-grid">
                <Info label="Email công ty" value="ha.nguyen@ohriise.vn" />
                <Info
                  label="Số điện thoại"
                  value={mask("phone", phone)}
                  sensitive={fieldVisibility("phone") !== "visible"}
                />
                <Info
                  label="Địa chỉ"
                  value={mask("address", address)}
                  sensitive={fieldVisibility("address") !== "visible"}
                  wide
                />
                <Info
                  label="Liên hệ khẩn cấp"
                  value="Nguyễn Minh Anh · 091 882 4410"
                  wide
                />
              </div>
            </div>
          )}
          {section === "Ngân hàng" && (
            <div className="info-section">
              <SectionTitle
                icon={Landmark}
                title="Thông tin nhận lương"
                subtitle="Dữ liệu được bảo vệ theo chính sách trường nhạy cảm."
              />
              <div className="info-grid">
                <Info label="Ngân hàng" value="Techcombank" />
                <Info
                  label="Số tài khoản"
                  value={mask("bankAccount", "19038372652018")}
                  sensitive
                />
                <Info label="Chủ tài khoản" value="NGUYEN THU HA" />
                <Info label="Chi nhánh" value="TP. Hồ Chí Minh" />
              </div>
              <div className="privacy-note">
                <ShieldCheck size={16} strokeWidth={1.5} />
                <span>
                  Quyền hiện tại:{" "}
                  <strong>{fieldVisibility("bankAccount")}</strong>. Lượt xem
                  trường nhạy cảm được ghi vào audit log.
                </span>
              </div>
            </div>
          )}
          {(section === "Chứng chỉ" || section === "Thiết bị") && (
            <div className="compact-empty">
              <strong>
                {section === "Chứng chỉ"
                  ? "Google UX Design Professional"
                  : "MacBook Pro 14-inch · IT-0238"}
              </strong>
              <p>
                {section === "Chứng chỉ"
                  ? "Cấp tháng 08/2025 · Không thời hạn"
                  : "Đang sử dụng · bàn giao 04/03/2024"}
              </p>
            </div>
          )}
        </div>
      </section>
      <WorkflowDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Cập nhật thông tin liên hệ"
        description="Thay đổi sẽ được lưu vào lịch sử hồ sơ."
        footer={
          <>
            <button
              className="secondary-button"
              onClick={() => setEditOpen(false)}
            >
              Hủy
            </button>
            <button className="primary-button" onClick={saveProfile}>
              Lưu thay đổi
            </button>
          </>
        }
      >
        <div className="form-grid">
          <FormField label="Email công ty">
            <div className="input-wrap">
              <Mail size={15} strokeWidth={1.5} />
              <input value="ha.nguyen@ohriise.vn" disabled />
            </div>
          </FormField>
          <FormField label="Số điện thoại" required>
            <div className="input-wrap">
              <Phone size={15} strokeWidth={1.5} />
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
          </FormField>
          <FormField label="Địa chỉ hiện tại" required>
            <textarea
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </FormField>
        </div>
      </WorkflowDialog>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof UserRound;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="section-title">
      <span>
        <Icon size={17} strokeWidth={1.5} />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}
function Info({
  label,
  value,
  sensitive,
  wide,
}: {
  label: string;
  value: string;
  sensitive?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "info-item wide" : "info-item"}>
      <span>
        {label}
        {sensitive && <EyeOff size={12} strokeWidth={1.5} />}
      </span>
      <strong>{value}</strong>
    </div>
  );
}
