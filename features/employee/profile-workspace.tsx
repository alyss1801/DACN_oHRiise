"use client";

import { useState } from "react";
import {
  Award,
  BadgeCheck,
  Building2,
  Camera,
  Clock3,
  Edit3,
  Eye,
  EyeOff,
  GraduationCap,
  IdCard,
  Landmark,
  Laptop2,
  Mail,
  MapPin,
  Monitor,
  PackageCheck,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRound,
  type LucideIcon,
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
  "Chứng chỉ & bằng cấp",
  "Thiết bị",
];

type ProfileRecord = {
  id: string;
  title: string;
  organization: string;
  detail: string;
  period: string;
};

type RecordKind = "education" | "certificate";

type AssignedDevice = {
  id: string;
  name: string;
  category: string;
  serial: string;
  issued: string;
  status: "Đã cấp" | "Đang cấp" | "Đang xử lý";
  note: string;
};

const initialEducation: ProfileRecord[] = [
  { id: "edu-1", title: "Đại học Khoa học Tự nhiên TP.HCM", organization: "Cử nhân Công nghệ Thông tin", detail: "Chuyên ngành Đồ họa số", period: "2015 – 2019" },
  { id: "edu-2", title: "Đại học Kiến trúc TP.HCM", organization: "Chứng nhận Thiết kế trải nghiệm", detail: "UX Research & Interaction Design", period: "2020 – 2021" },
];

const initialCertificates: ProfileRecord[] = [
  { id: "cert-1", title: "Google UX Design Professional", organization: "Google Career Certificates", detail: "Credential ID · GUX-2025-248", period: "08/2025 · Không thời hạn" },
  { id: "cert-2", title: "Professional Scrum Master I", organization: "Scrum.org", detail: "Credential ID · PSM-982184", period: "03/2024 · Không thời hạn" },
];

const initialDevices: AssignedDevice[] = [
  { id: "IT-0238", name: "MacBook Pro 14-inch", category: "Máy tính làm việc", serial: "C02X•••H7Q6", issued: "04/03/2024", status: "Đã cấp", note: "Thiết bị chính · MDM đang hoạt động" },
  { id: "IT-0412", name: "LG UltraFine 27-inch", category: "Màn hình", serial: "LG27•••884", issued: "04/03/2024", status: "Đã cấp", note: "Làm việc tại HCM-Q1" },
  { id: "REQ-1082", name: "YubiKey 5 NFC", category: "Thiết bị bảo mật", serial: "Chờ gán serial", issued: "Dự kiến 10/10/2026", status: "Đang cấp", note: "IT đang chuẩn bị bàn giao" },
];

export function ProfileWorkspace() {
  const { session, fieldVisibility } = useSession();
  const [section, setSection] = useState(sections[0]);
  const [editOpen, setEditOpen] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(true);
  const [phone, setPhone] = useState("090 315 8826");
  const [address, setAddress] = useState(
    "72 Nguyễn Thị Minh Khai, Quận 3, TP.HCM",
  );
  const [photoName, setPhotoName] = useState("");
  const [education, setEducation] = useState(initialEducation);
  const [certificates, setCertificates] = useState(initialCertificates);
  const [recordEditor, setRecordEditor] = useState<{ kind: RecordKind; item?: ProfileRecord } | null>(null);
  const [recordDraft, setRecordDraft] = useState<Omit<ProfileRecord, "id">>({ title: "", organization: "", detail: "", period: "" });
  const [devices, setDevices] = useState(initialDevices);
  const [deviceRequestOpen, setDeviceRequestOpen] = useState(false);
  const [deviceId, setDeviceId] = useState(initialDevices[0].id);
  const [deviceRequestType, setDeviceRequestType] = useState("Báo thiết bị hư");
  const [deviceNote, setDeviceNote] = useState("");

  const mask = (field: string, value: string) => {
    if (!detailsVisible) return "••••••••";
    const visibility = fieldVisibility(field);
    if (visibility === "hidden") return "Không được phép xem";
    if (visibility === "masked")
      return value.replace(/[0-9A-Za-zÀ-ỹ](?=.{4})/g, "•");
    return value;
  };

  const privateValue = (value: string) => detailsVisible ? value : "••••••••";

  function saveProfile() {
    setEditOpen(false);
    toast.success("Đã cập nhật thông tin liên hệ.");
  }

  function openRecordEditor(kind: RecordKind, item?: ProfileRecord) {
    setRecordEditor({ kind, item });
    setRecordDraft(item ? { title: item.title, organization: item.organization, detail: item.detail, period: item.period } : { title: "", organization: "", detail: "", period: "" });
  }

  function saveRecord() {
    if (!recordEditor || !recordDraft.title.trim() || !recordDraft.organization.trim()) {
      toast.error("Vui lòng nhập tên và đơn vị cấp.");
      return;
    }
    const update = (items: ProfileRecord[]) => recordEditor.item
      ? items.map((item) => item.id === recordEditor.item?.id ? { ...item, ...recordDraft } : item)
      : [...items, { id: `${recordEditor.kind}-${Date.now()}`, ...recordDraft }];
    if (recordEditor.kind === "education") setEducation(update);
    else setCertificates(update);
    toast.success(recordEditor.item ? "Đã cập nhật thông tin." : "Đã thêm thông tin mới.");
    setRecordEditor(null);
  }

  function removeRecord(kind: RecordKind, id: string) {
    if (kind === "education") setEducation((items) => items.filter((item) => item.id !== id));
    else setCertificates((items) => items.filter((item) => item.id !== id));
    toast.success("Đã xóa mục khỏi hồ sơ.");
  }

  function submitDeviceRequest() {
    if (!deviceNote.trim()) {
      toast.error("Vui lòng mô tả tình trạng thiết bị.");
      return;
    }
    setDevices((items) => items.map((item) => item.id === deviceId ? { ...item, status: "Đang xử lý", note: `${deviceRequestType} · IT đã tiếp nhận` } : item));
    setDeviceRequestOpen(false);
    setDeviceNote("");
    toast.success("Yêu cầu thiết bị đã được gửi tới IT.");
  }

  return (
    <div className="page-stack">
      <WorkspaceHeader
        eyebrow="HỒ SƠ CÁ NHÂN"
        title="Hồ sơ của tôi"
        description="Quản lý thông tin cá nhân, công việc và các tài liệu liên quan."
        action={
          <div className="header-actions profile-header-actions">
            <button className="secondary-button" onClick={() => setDetailsVisible((value) => !value)} aria-pressed={detailsVisible}>
              {detailsVisible ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
              {detailsVisible ? "Ẩn thông tin" : "Hiện thông tin"}
            </button>
            <button className="primary-button" onClick={() => setEditOpen(true)}>
              <Edit3 size={16} strokeWidth={1.5} /> Cập nhật hồ sơ
            </button>
          </div>
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
                <Info label="Ngày sinh" value={privateValue("18/04/1997")} sensitive={!detailsVisible} />
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
                  value={privateValue("Nguyễn Minh Anh · 091 882 4410")}
                  sensitive={!detailsVisible}
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
                <Info label="Chủ tài khoản" value={privateValue("NGUYEN THU HA")} sensitive={!detailsVisible} />
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
          {section === "Chứng chỉ & bằng cấp" && (
            <div className="profile-records-section">
              <SectionTitle icon={Award} title="Chứng chỉ & bằng cấp" subtitle="Lịch sử học tập và chứng nhận chuyên môn trong một nơi." />
              <div className="profile-record-grid">
                <RecordTimeline icon={GraduationCap} title="Bằng cấp" items={education} onAdd={() => openRecordEditor("education")} onEdit={(item) => openRecordEditor("education", item)} onRemove={(id) => removeRecord("education", id)} />
                <RecordTimeline icon={Award} title="Chứng chỉ chuyên môn" items={certificates} onAdd={() => openRecordEditor("certificate")} onEdit={(item) => openRecordEditor("certificate", item)} onRemove={(id) => removeRecord("certificate", id)} />
              </div>
            </div>
          )}
          {section === "Thiết bị" && (
            <div className="profile-devices-section">
              <div className="profile-section-head">
                <SectionTitle icon={Laptop2} title="Thiết bị được cấp" subtitle="Thiết bị đang sử dụng và các yêu cầu cấp phát đang xử lý." />
                <button className="secondary-button" onClick={() => setDeviceRequestOpen(true)}><RefreshCw size={15} strokeWidth={1.5} /> Báo hư / đổi thiết bị</button>
              </div>
              <div className="profile-device-list">
                {devices.map((device) => <DeviceRow key={device.id} device={device} onRequest={() => { setDeviceId(device.id); setDeviceRequestOpen(true); }} />)}
              </div>
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
      <WorkflowDialog
        open={recordEditor !== null}
        onOpenChange={(open) => !open && setRecordEditor(null)}
        title={`${recordEditor?.item ? "Chỉnh sửa" : "Thêm"} ${recordEditor?.kind === "education" ? "bằng cấp" : "chứng chỉ"}`}
        description="Thông tin được hiển thị theo thứ tự thời gian trong hồ sơ của bạn."
        footer={<><button className="secondary-button" onClick={() => setRecordEditor(null)}>Hủy</button><button className="primary-button" onClick={saveRecord}>Lưu thông tin</button></>}
      >
        <div className="form-grid two-cols">
          <FormField label={recordEditor?.kind === "education" ? "Trường / cơ sở đào tạo" : "Tên chứng chỉ"} required><input value={recordDraft.title} onChange={(event) => setRecordDraft((draft) => ({ ...draft, title: event.target.value }))} /></FormField>
          <FormField label={recordEditor?.kind === "education" ? "Bằng cấp / chương trình" : "Đơn vị cấp"} required><input value={recordDraft.organization} onChange={(event) => setRecordDraft((draft) => ({ ...draft, organization: event.target.value }))} /></FormField>
          <FormField label="Thời gian"><input value={recordDraft.period} onChange={(event) => setRecordDraft((draft) => ({ ...draft, period: event.target.value }))} placeholder="Ví dụ: 2020 – 2024" /></FormField>
          <FormField label="Chi tiết"><input value={recordDraft.detail} onChange={(event) => setRecordDraft((draft) => ({ ...draft, detail: event.target.value }))} placeholder="Chuyên ngành hoặc mã chứng nhận" /></FormField>
        </div>
      </WorkflowDialog>
      <WorkflowDialog
        open={deviceRequestOpen}
        onOpenChange={setDeviceRequestOpen}
        title="Báo hư / đổi thiết bị"
        description="Yêu cầu sẽ được chuyển tới IT và cập nhật trong danh sách cấp phát."
        footer={<><button className="secondary-button" onClick={() => setDeviceRequestOpen(false)}>Hủy</button><button className="primary-button" onClick={submitDeviceRequest}>Gửi yêu cầu</button></>}
      >
        <div className="form-grid">
          <FormField label="Thiết bị" required><select value={deviceId} onChange={(event) => setDeviceId(event.target.value)}>{devices.map((device) => <option key={device.id} value={device.id}>{device.name} · {device.id}</option>)}</select></FormField>
          <FormField label="Loại yêu cầu" required><select value={deviceRequestType} onChange={(event) => setDeviceRequestType(event.target.value)}><option>Báo thiết bị hư</option><option>Đổi thiết bị</option><option>Bổ sung phụ kiện</option></select></FormField>
          <FormField label="Mô tả tình trạng" required><textarea value={deviceNote} onChange={(event) => setDeviceNote(event.target.value)} placeholder="Mô tả lỗi hoặc lý do cần đổi thiết bị..." /></FormField>
        </div>
      </WorkflowDialog>
    </div>
  );
}

function RecordTimeline({ icon: Icon, title, items, onAdd, onEdit, onRemove }: { icon: LucideIcon; title: string; items: ProfileRecord[]; onAdd: () => void; onEdit: (item: ProfileRecord) => void; onRemove: (id: string) => void }) {
  return <article className="profile-record-card">
    <header><div><span><Icon size={17} strokeWidth={1.5} /></span><h4>{title}</h4></div><button className="record-add-button" onClick={onAdd}><Plus size={14} strokeWidth={1.7} /> Thêm</button></header>
    <div className="profile-timeline">
      {items.map((item) => <div className="profile-timeline-item" key={item.id}><i /><div><strong>{item.title}</strong><span>{item.organization}</span><small>{item.detail}</small><time>{item.period}</time></div><div className="record-row-actions"><button onClick={() => onEdit(item)} aria-label={`Sửa ${item.title}`} title="Chỉnh sửa"><Edit3 size={14} strokeWidth={1.5} /></button><button onClick={() => onRemove(item.id)} aria-label={`Xóa ${item.title}`} title="Xóa"><Trash2 size={14} strokeWidth={1.5} /></button></div></div>)}
    </div>
  </article>;
}

function DeviceRow({ device, onRequest }: { device: AssignedDevice; onRequest: () => void }) {
  const Icon = device.category === "Màn hình" ? Monitor : device.category === "Thiết bị bảo mật" ? PackageCheck : Laptop2;
  return <article className="profile-device-row"><span className="device-icon"><Icon size={20} strokeWidth={1.5} /></span><div className="device-copy"><strong>{device.name}</strong><span>{device.category} · <b>{device.id}</b></span><small>{device.note}</small></div><div className="device-meta"><span>Serial</span><strong>{device.serial}</strong><small>{device.issued}</small></div><StatusPill tone={device.status === "Đã cấp" ? "success" : device.status === "Đang xử lý" ? "blue" : "warning"}>{device.status === "Đang cấp" && <Clock3 size={14} strokeWidth={1.5} />}{device.status}</StatusPill><button className="device-row-action" onClick={onRequest} aria-label={`Tạo yêu cầu cho ${device.name}`}><RefreshCw size={14} strokeWidth={1.5} /></button></article>;
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
