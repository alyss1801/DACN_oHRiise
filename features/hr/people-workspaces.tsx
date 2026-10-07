"use client";

import { useMemo, useState } from "react";
import { Building2, Check, ChevronDown, ChevronRight, Circle, EyeOff, FileText, Laptop2, MapPin, Network, Plus, Search, ShieldCheck, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/features/session/session-context";
import { canAccessScopedRecord } from "@/lib/authorization/engine";
import { FormField, StatusPill, WorkflowDialog, WorkspaceHeader } from "@/features/employee/workspace-frame";

const employees = [
  { id: "OH-0184", initials: "TQ", name: "Trần Minh Quân", title: "Head of Product", department: "Sản phẩm", branch: "HCM-Q1", status: "active", email: "quan.tran@ohriise.vn", phone: "090 882 4410", citizenId: "079190008812", bank: "19037725110912" },
  { id: "OH-0248", initials: "NH", name: "Nguyễn Thu Hà", title: "Product Designer", department: "Sản phẩm", branch: "HCM-Q1", status: "active", email: "ha.nguyen@ohriise.vn", phone: "090 315 8826", citizenId: "079197008826", bank: "19038372652018" },
  { id: "OH-0259", initials: "BT", name: "Bùi Thanh Tâm", title: "Data Engineer", department: "Công nghệ thông tin", branch: "HCM-TD", status: "active", email: "tam.bui@ohriise.vn", phone: "091 330 7822", citizenId: "079195006632", bank: "060128624501" },
  { id: "OH-0271", initials: "LV", name: "Lê Hoàng Vy", title: "Data Analyst", department: "Công nghệ thông tin", branch: "HCM-TD", status: "active", email: "vy.le@ohriise.vn", phone: "098 661 3901", citizenId: "079198012731", bank: "19038374002911" },
  { id: "OH-0137", initials: "PL", name: "Phạm Thanh Long", title: "Sales Executive", department: "Kinh doanh", branch: "HN-CG", status: "inactive", email: "long.pham@ohriise.vn", phone: "096 332 1810", citizenId: "001191003882", bank: "102882610042" },
];

export function EmployeesWorkspace() {
  const { session, fieldVisibility, can } = useSession();
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("Tất cả");
  const [selectedId, setSelectedId] = useState(employees[0].id);
  const [detailTab, setDetailTab] = useState("Tổng quan");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const filtered = useMemo(() => employees.filter((employee) =>
    canAccessScopedRecord(session, { branch: employee.branch, department: employee.department, employeeId: employee.id }) &&
    (department === "Tất cả" || employee.department === department) &&
    `${employee.name} ${employee.id} ${employee.department}`.toLowerCase().includes(query.toLowerCase())), [department, query, session]);
  const selected = filtered.find((employee) => employee.id === selectedId) ?? filtered[0] ?? employees[0];
  const secure = (field: string, value: string) => fieldVisibility(field) === "visible" ? value : fieldVisibility(field) === "masked" ? `${value.slice(0, 4)} •••• ${value.slice(-4)}` : "Không được phép xem";

  return (
    <div className="page-stack">
      <WorkspaceHeader eyebrow="HR · EMPLOYEE DIRECTORY" title="Hồ sơ nhân sự" description={`${session.description} · ${filtered.length} hồ sơ trong phạm vi hiện tại.`} action={can("employees", "create") ? <button className="primary-button" onClick={() => setDrawerOpen(true)}><Plus size={15} strokeWidth={1.5} /> Thêm nhân sự</button> : <StatusPill tone="neutral">Chỉ được xem</StatusPill>} />
      <section className="directory-layout panel">
        <div className="directory-master">
          <div className="directory-tools">
            <div className="compact-search"><Search size={14} strokeWidth={1.5} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên, mã nhân viên, phòng ban..." /></div>
            <select className="filter-select" value={department} onChange={(event) => setDepartment(event.target.value)}><option>Tất cả</option><option>Sản phẩm</option><option>Công nghệ thông tin</option><option>Kinh doanh</option></select>
          </div>
          <div className="employee-list">{filtered.map((employee) => <button className={selected.id === employee.id ? "is-active" : ""} key={employee.id} onClick={() => setSelectedId(employee.id)}><div className="avatar">{employee.initials}</div><div><strong>{employee.name}</strong><span>{employee.id} · {employee.title}</span></div><StatusPill tone={employee.status === "active" ? "success" : "neutral"}>{employee.status === "active" ? "Hoạt động" : "Ngừng"}</StatusPill></button>)}</div>
        </div>
        <article className="employee-detail">
          <div className="employee-detail-hero"><div className="avatar large">{selected.initials}</div><div><span className="mono">{selected.id}</span><h3>{selected.name}</h3><p>{selected.title} · {selected.department}</p></div>{can("employees", "edit") && <button className="secondary-button" onClick={() => toast.success("Đã mở chế độ chỉnh sửa hồ sơ.")}>Chỉnh sửa</button>}</div>
          <div className="employee-detail-tabs" role="tablist">{["Tổng quan", "Hợp đồng", "Thiết bị", "Lịch sử"].map((tab) => <button role="tab" aria-selected={detailTab === tab} className={detailTab === tab ? "is-active" : ""} key={tab} onClick={() => setDetailTab(tab)}>{tab}</button>)}</div>
          {detailTab === "Tổng quan" && <div className="employee-info-grid"><Info label="Email công ty" value={selected.email} /><Info label="Số điện thoại" value={secure("phone", selected.phone)} sensitive /><Info label="Chi nhánh" value={selected.branch} /><Info label="Quản lý trực tiếp" value="Trần Minh Quân" /><Info label="CCCD" value={secure("citizenId", selected.citizenId)} sensitive /><Info label="Tài khoản ngân hàng" value={secure("bankAccount", selected.bank)} sensitive /></div>}
          {detailTab === "Hợp đồng" && <div className="detail-tab-panel"><FileText size={18} strokeWidth={1.5} /><div><strong>HĐLĐ xác định thời hạn</strong><p>Hiệu lực đến 03/03/2027 · bản scan đã ký</p></div><StatusPill tone="success">Đang hiệu lực</StatusPill></div>}
          {detailTab === "Thiết bị" && <div className="detail-tab-panel"><Laptop2 size={18} strokeWidth={1.5} /><div><strong>MacBook Pro 14-inch · IT-0238</strong><p>Bàn giao 04/03/2024 · tình trạng tốt</p></div><StatusPill tone="blue">Đang sử dụng</StatusPill></div>}
          {detailTab === "Lịch sử" && <div className="detail-timeline"><p><b>07/10/2026</b> HR xem hồ sơ trong phạm vi {session.effectiveScope}.</p><p><b>01/10/2026</b> Cập nhật thông tin ngân hàng.</p><p><b>04/03/2024</b> Khởi tạo hồ sơ nhân sự.</p></div>}
          <div className="effective-scope-note"><ShieldCheck size={16} strokeWidth={1.5} /><div><strong>Dữ liệu theo phạm vi: {session.effectiveScope}</strong><p>Các trường nhạy cảm được đánh giá độc lập với quyền xem hồ sơ.</p></div></div>
        </article>
      </section>
      <WorkflowDialog open={drawerOpen} onOpenChange={setDrawerOpen} title="Khởi tạo hồ sơ nhân sự" description="Bước đầu của quy trình onboarding có kiểm soát." footer={<><button className="secondary-button" onClick={() => setDrawerOpen(false)}>Hủy</button><button className="primary-button" onClick={() => { setDrawerOpen(false); toast.success("Đã tạo bản nháp hồ sơ nhân sự."); }}>Tạo bản nháp</button></>}>
        <div className="form-grid two-cols"><FormField label="Họ và tên" required><input placeholder="Nguyễn Văn An" /></FormField><FormField label="Email công ty" required><input type="email" placeholder="an.nguyen@ohriise.vn" /></FormField><FormField label="Phòng ban" required><select><option>Công nghệ thông tin</option><option>Sản phẩm</option><option>Nhân sự</option></select></FormField><FormField label="Chi nhánh" required><select><option>HCM-Q1</option><option>HCM-TD</option><option>HN-CG</option></select></FormField></div>
      </WorkflowDialog>
    </div>
  );
}

function Info({ label, value, sensitive }: { label: string; value: string; sensitive?: boolean }) { return <div><span>{label}{sensitive && <EyeOff size={11} strokeWidth={1.5} />}</span><strong>{value}</strong></div>; }

const departments = [
  { name: "Ban Giám đốc", lead: "Đặng Quốc Hùng", count: 4, children: [] },
  { name: "Nhân sự", lead: "Nguyễn Thanh Lan", count: 12, children: ["HR Operations", "Talent Acquisition", "C&B"] },
  { name: "Công nghệ thông tin", lead: "Phan Đức Minh", count: 86, children: ["Data Platform", "Product Engineering", "Infrastructure"] },
  { name: "Kinh doanh", lead: "Trần Quốc Duy", count: 64, children: ["Enterprise Sales", "SMB Sales"] },
  { name: "Vận hành & Logistics", lead: "Võ Anh Tuấn", count: 41, children: ["Warehouse", "Fulfillment"] },
];

export function OrganizationWorkspace() {
  const [expanded, setExpanded] = useState<string[]>(["Công nghệ thông tin", "Nhân sự"]);
  return <div className="page-stack"><WorkspaceHeader eyebrow="ORGANIZATION" title="Cấu trúc tổ chức" description="Phòng ban, tuyến báo cáo và quan hệ Team Lead theo phạm vi công ty." action={<button className="primary-button" onClick={() => toast.success("Đã tạo bản nháp phòng ban mới.")}><Plus size={15} strokeWidth={1.5} /> Thêm đơn vị</button>} /><section className="org-layout"><article className="panel org-tree"><div className="org-root"><span><Building2 size={18} strokeWidth={1.5} /></span><div><strong>oHRiise Company</strong><p>328 nhân sự · 4 chi nhánh</p></div></div><div className="org-branches">{departments.map((department) => <div className="org-node" key={department.name}><button onClick={() => setExpanded((current) => current.includes(department.name) ? current.filter((item) => item !== department.name) : [...current, department.name])}>{department.children.length ? expanded.includes(department.name) ? <ChevronDown size={14} strokeWidth={1.5} /> : <ChevronRight size={14} strokeWidth={1.5} /> : <Circle size={7} strokeWidth={1.5} />}<span><Network size={15} strokeWidth={1.5} /></span><div><strong>{department.name}</strong><small>{department.lead} · {department.count} nhân sự</small></div></button>{expanded.includes(department.name) && department.children.map((child) => <div className="org-child" key={child}><i /><span><UsersRound size={13} strokeWidth={1.5} /></span><div><strong>{child}</strong><small>Team / function</small></div></div>)}</div>)}</div></article><aside className="panel org-insight"><span className="eyebrow">TỔNG QUAN</span><div className="org-stat"><strong>10</strong><span>phòng ban</span></div><div className="org-stat"><strong>23</strong><span>đội / dự án</span></div><div className="org-stat"><strong>18</strong><span>Team Lead</span></div><div className="privacy-note"><MapPin size={15} strokeWidth={1.5} /><span>Cấu trúc đang hiển thị toàn công ty. HR Chi nhánh chỉ thấy đơn vị thuộc chi nhánh được cấp.</span></div></aside></section></div>;
}

export function OffboardingWorkspace() {
  const [checks, setChecks] = useState([true, false, false]);
  const items = ["Thu hồi tài sản", "Xác nhận bàn giao", "Vô hiệu hóa tài khoản"];
  return <div className="page-stack"><WorkspaceHeader eyebrow="EMPLOYEE LIFECYCLE" title="Offboarding" description="Theo dõi bàn giao, tài sản và trạng thái tài khoản — không mở rộng sang quyết toán kế toán." action={<button className="primary-button" onClick={() => toast.success("Đã tạo hồ sơ offboarding nháp.")}><Plus size={15} strokeWidth={1.5} /> Tạo hồ sơ</button>} /><section className="offboarding-layout"><article className="panel offboarding-case"><div className="case-head"><div className="avatar">PL</div><div><span className="mono">OFF-2026-018</span><h3>Phạm Thanh Long</h3><p>Sales Executive · HN-CG</p></div><StatusPill tone="warning">Đang bàn giao</StatusPill></div><div className="case-facts"><div><span>Ngày làm việc cuối</span><strong>16/10/2026</strong></div><div><span>Lý do</span><strong>Nghỉ việc tự nguyện</strong></div><div><span>Thời hạn báo trước</span><strong>Đã xác nhận</strong></div><div><span>Người phụ trách</span><strong>Nguyễn Thanh Lan</strong></div></div><div className="offboarding-checklist">{items.map((item, index) => <button key={item} onClick={() => setChecks((current) => current.map((value, itemIndex) => itemIndex === index ? !value : value))}><span className={checks[index] ? "done" : ""}>{checks[index] ? <Check size={14} strokeWidth={2} /> : index + 1}</span><div><strong>{item}</strong><p>{index === 0 ? "MacBook Pro, thẻ ra vào và khóa bảo mật" : index === 1 ? "Tài liệu, khách hàng và công việc đang mở" : "Thực hiện sau ngày làm việc cuối"}</p></div><StatusPill tone={checks[index] ? "success" : "neutral"}>{checks[index] ? "Hoàn tất" : "Chưa hoàn tất"}</StatusPill></button>)}</div></article><aside className="panel offboarding-side"><span className="eyebrow">TIẾN ĐỘ</span><strong>{checks.filter(Boolean).length}/3</strong><p>hạng mục hoàn tất</p><div className="progress-track"><i style={{ width: `${checks.filter(Boolean).length / 3 * 100}%` }} /></div><div className="boundary-note compact"><Laptop2 size={15} strokeWidth={1.5} /><p>Tài khoản chỉ được vô hiệu hóa sau ngày làm việc cuối và khi bàn giao được xác nhận.</p></div></aside></section></div>;
}
