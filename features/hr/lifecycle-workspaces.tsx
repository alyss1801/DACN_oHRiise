"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileCheck2,
  FileText,
  Mail,
  Plus,
  Upload,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { useDemoData } from "@/features/demo/demo-data-context";
import {
  FormField,
  StatusPill,
  WorkspaceHeader,
} from "@/features/employee/workspace-frame";

const onboardingSteps = [
  "Nhân sự",
  "Công việc",
  "Hợp đồng",
  "Tài khoản",
  "Thiết bị",
  "Hoàn tất",
];

export function OnboardingWorkspace() {
  const { addAccount, addAuditEvent } = useDemoData();
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  function next() {
    if (step === onboardingSteps.length - 2) {
      addAccount({
        name: "Nguyễn Văn An",
        email: "an.nguyen@ohriise.vn",
        department: "Công nghệ thông tin",
        branch: "HCM-TD",
        template: "Employee",
        status: "active",
        mfa: false,
      });
      addAuditEvent({
        actor: "Nguyễn Thanh Lan · HR",
        action: "COMPLETE_ONBOARDING",
        target: "Nguyễn Văn An",
        result: "success",
        source: "Demo session",
        detail:
          "Đã tạo hồ sơ, tài khoản, phân bổ phép, hợp đồng chờ ký và giữ chỗ thiết bị.",
      });
      setStep(step + 1);
      setCompleted(true);
      toast.success("Onboarding đã tạo account và các đầu ra liên quan.");
    } else setStep((value) => Math.min(value + 1, onboardingSteps.length - 1));
  }
  return (
    <div className="page-stack">
      <WorkspaceHeader
        eyebrow="HR · ONBOARDING"
        title="Onboarding nhân sự mới"
        description="Một luồng có kiểm soát từ hồ sơ đến tài khoản, phép và thiết bị."
      />
      <section className="panel onboarding-shell">
        <div className="onboarding-stepper">
          {onboardingSteps.map((label, index) => (
            <div
              className={
                index < step || completed
                  ? "done"
                  : index === step
                    ? "active"
                    : ""
              }
              key={label}
            >
              <span>
                {index < step || completed ? (
                  <Check size={13} strokeWidth={2} />
                ) : (
                  index + 1
                )}
              </span>
              <strong>{label}</strong>
              {index < onboardingSteps.length - 1 && <i />}
            </div>
          ))}
        </div>
        <div className="onboarding-content">
          {step === 0 && (
            <StepSection
              title="Thông tin nhân sự"
              description="Tạo danh tính gốc dùng xuyên suốt hệ thống."
            >
              <div className="form-grid two-cols">
                <FormField label="Họ và tên" required>
                  <input defaultValue="Nguyễn Văn An" />
                </FormField>
                <FormField label="Email cá nhân" required>
                  <input type="email" defaultValue="an.nguyen@gmail.com" />
                </FormField>
                <FormField label="Số điện thoại" required>
                  <input defaultValue="090 721 8832" />
                </FormField>
                <FormField label="Ngày bắt đầu" required>
                  <input type="date" defaultValue="2026-10-19" />
                </FormField>
              </div>
            </StepSection>
          )}
          {step === 1 && (
            <StepSection
              title="Thông tin công việc"
              description="Gán vị trí, đơn vị và quan hệ báo cáo."
            >
              <div className="form-grid two-cols">
                <FormField label="Loại hình" required>
                  <select>
                    <option>Toàn thời gian</option>
                    <option>Thử việc</option>
                    <option>Thực tập</option>
                  </select>
                </FormField>
                <FormField label="Chức danh" required>
                  <input defaultValue="Backend Engineer" />
                </FormField>
                <FormField label="Phòng ban" required>
                  <select>
                    <option>Công nghệ thông tin</option>
                  </select>
                </FormField>
                <FormField label="Chi nhánh" required>
                  <select>
                    <option>HCM-TD</option>
                    <option>HCM-Q1</option>
                  </select>
                </FormField>
                <FormField label="Quản lý trực tiếp" required>
                  <select>
                    <option>Bùi Thanh Tâm</option>
                  </select>
                </FormField>
                <FormField label="Team / dự án">
                  <select>
                    <option>Data Platform</option>
                  </select>
                </FormField>
              </div>
            </StepSection>
          )}
          {step === 2 && (
            <StepSection
              title="Thiết lập hợp đồng"
              description="Chọn mẫu và tạo tài liệu chờ ký."
            >
              <div className="template-choice selected">
                <span>
                  <FileText size={18} strokeWidth={1.5} />
                </span>
                <div>
                  <strong>HĐLĐ xác định thời hạn · 36 tháng</strong>
                  <p>Mẫu chuẩn 2026 · phiên bản 4</p>
                </div>
                <Check size={16} strokeWidth={1.5} />
              </div>
              <div className="form-grid two-cols">
                <FormField label="Ngày hiệu lực">
                  <input type="date" defaultValue="2026-10-19" />
                </FormField>
                <FormField label="Nơi làm việc">
                  <select>
                    <option>HCM-TD · Hybrid</option>
                  </select>
                </FormField>
              </div>
            </StepSection>
          )}
          {step === 3 && (
            <StepSection
              title="Tài khoản & quyền"
              description="Tạo tài khoản personnel với quyền Employee cơ sở."
            >
              <div className="generated-preview">
                <div>
                  <span>Email công ty</span>
                  <strong>an.nguyen@ohriise.vn</strong>
                </div>
                <div>
                  <span>Mẫu quyền</span>
                  <strong>Employee</strong>
                </div>
                <div>
                  <span>Trạng thái MFA</span>
                  <strong>Yêu cầu khi đăng nhập đầu</strong>
                </div>
                <div>
                  <span>Phân bổ phép</span>
                  <strong>2.5 ngày còn lại năm 2026</strong>
                </div>
              </div>
            </StepSection>
          )}
          {step === 4 && (
            <StepSection
              title="Thiết bị & chào mừng"
              description="Ghi nhận bàn giao và chuẩn bị giao tiếp ngày đầu."
            >
              <div className="form-grid two-cols">
                <FormField label="Máy tính">
                  <select>
                    <option>MacBook Pro 14-inch · IT-0264</option>
                  </select>
                </FormField>
                <FormField label="Thiết bị khác">
                  <input placeholder="Màn hình, thẻ ra vào..." />
                </FormField>
              </div>
              <label className="policy-check">
                <input type="checkbox" defaultChecked />
                <span>
                  <b>
                    <Check size={12} strokeWidth={2} />
                  </b>
                </span>
                <p>Gửi welcome email vào 08:00 ngày bắt đầu.</p>
              </label>
            </StepSection>
          )}
          {step === 5 && (
            <div className="onboarding-success">
              <span>
                <UserPlus size={25} strokeWidth={1.5} />
              </span>
              <h3>Nguyễn Văn An đã sẵn sàng onboarding</h3>
              <p>Tất cả đầu ra đã được tạo và lưu trong hồ sơ audit.</p>
              <div>
                <StatusPill tone="success">Hồ sơ OH-0329</StatusPill>
                <StatusPill tone="success">Tài khoản chờ kích hoạt</StatusPill>
                <StatusPill tone="warning">Hợp đồng chờ ký</StatusPill>
                <StatusPill tone="blue">Thiết bị đã giữ chỗ</StatusPill>
              </div>
            </div>
          )}
        </div>
        <div className="onboarding-footer">
          <button
            className="secondary-button"
            disabled={step === 0 || completed}
            onClick={() => setStep((value) => value - 1)}
          >
            <ArrowLeft size={15} strokeWidth={1.5} /> Quay lại
          </button>
          {!completed && (
            <button className="primary-button" onClick={next}>
              {step === 4 ? "Hoàn tất onboarding" : "Tiếp tục"}
              <ArrowRight size={15} strokeWidth={1.5} />
            </button>
          )}
          {completed && (
            <button
              className="primary-button"
              onClick={() => toast.success("Welcome email đã được lên lịch.")}
            >
              <Mail size={15} strokeWidth={1.5} /> Xem hồ sơ mới
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function StepSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="step-section">
      <h3>{title}</h3>
      <p>{description}</p>
      <div>{children}</div>
    </div>
  );
}

const contractRows = [
  {
    id: "HDLD-2026-0312",
    employee: "Nguyễn Văn An",
    type: "Xác định thời hạn",
    end: "18/10/2029",
    status: "draft",
  },
  {
    id: "HDLD-2025-0271",
    employee: "Lê Hoàng Vy",
    type: "Xác định thời hạn",
    end: "02/11/2026",
    status: "expiring",
  },
  {
    id: "HDLD-2024-0248",
    employee: "Nguyễn Thu Hà",
    type: "Xác định thời hạn",
    end: "03/03/2027",
    status: "signed",
  },
  {
    id: "HDLD-2023-0184",
    employee: "Trần Minh Quân",
    type: "Không xác định",
    end: "—",
    status: "signed",
  },
];

export function HrContractsWorkspace() {
  const [selected, setSelected] = useState(contractRows[1]);
  const [stage, setStage] = useState(4);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expiringOnly, setExpiringOnly] = useState(false);
  const steps = [
    "Chọn mẫu",
    "Điền dữ liệu",
    "Tạo PDF",
    "Xác nhận ký",
    "Bản scan",
    "Hoàn tất",
  ];
  const visibleContracts = contractRows.filter(
    (contract) =>
      (statusFilter === "all" || contract.status === statusFilter) &&
      (!expiringOnly || contract.status === "expiring"),
  );
  return (
    <div className="page-stack">
      <WorkspaceHeader
        eyebrow="HR · CONTRACTS"
        title="Quản lý hợp đồng"
        description="Vòng đời tài liệu từ mẫu đến bản scan đã ký."
        action={
          <button
            className="primary-button"
            onClick={() => toast.success("Đã tạo hợp đồng nháp.")}
          >
            <Plus size={15} strokeWidth={1.5} /> Tạo hợp đồng
          </button>
        }
      />
      <section className="contracts-layout panel">
        <div className="contract-list">
          <div className="directory-tools">
            <select
              className="filter-select"
              aria-label="Lọc trạng thái hợp đồng"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="draft">Bản nháp</option>
              <option value="expiring">Sắp hết hạn</option>
              <option value="signed">Đã ký</option>
            </select>
            <button
              className={`filter-button${expiringOnly ? " is-active" : ""}`}
              aria-pressed={expiringOnly}
              onClick={() => setExpiringOnly((value) => !value)}
            >
              Sắp hết hạn
            </button>
          </div>
          {visibleContracts.map((contract) => (
            <button
              className={selected.id === contract.id ? "is-active" : ""}
              key={contract.id}
              onClick={() => {
                setSelected(contract);
                setStage(
                  contract.status === "signed"
                    ? 5
                    : contract.status === "draft"
                      ? 1
                      : 4,
                );
              }}
            >
              <span>
                <FileText size={16} strokeWidth={1.5} />
              </span>
              <div>
                <strong>{contract.employee}</strong>
                <p>
                  {contract.id} · hết hạn {contract.end}
                </p>
              </div>
              {contract.status === "signed" ? (
                <StatusPill tone="success">Đã ký</StatusPill>
              ) : contract.status === "expiring" ? (
                <StatusPill tone="warning">Sắp hết hạn</StatusPill>
              ) : (
                <StatusPill tone="neutral">Bản nháp</StatusPill>
              )}
            </button>
          ))}
        </div>
        <article className="contract-workflow">
          <div className="contract-workflow-head">
            <div>
              <span className="eyebrow">{selected.id}</span>
              <h3>{selected.employee}</h3>
              <p>{selected.type}</p>
            </div>
            <button
              className="secondary-button"
              onClick={() => toast.success("Đã chuẩn bị file PDF.")}
            >
              <Download size={15} strokeWidth={1.5} /> PDF
            </button>
          </div>
          <div className="vertical-stepper">
            {steps.map((item, index) => (
              <div
                className={
                  index < stage ? "done" : index === stage ? "active" : ""
                }
                key={item}
              >
                <span>
                  {index < stage ? (
                    <Check size={13} strokeWidth={2} />
                  ) : (
                    index + 1
                  )}
                </span>
                <div>
                  <strong>{item}</strong>
                  <p>
                    {index < stage
                      ? "Đã hoàn tất"
                      : index === stage
                        ? "Đang xử lý"
                        : "Chưa bắt đầu"}
                  </p>
                </div>
                {index === stage && index < 5 && (
                  <button
                    onClick={() => {
                      setStage((value) => value + 1);
                      toast.success(`Đã hoàn tất: ${item}.`);
                    }}
                  >
                    {index === 4 ? (
                      <Upload size={14} strokeWidth={1.5} />
                    ) : (
                      <FileCheck2 size={14} strokeWidth={1.5} />
                    )}{" "}
                    Hoàn tất bước
                  </button>
                )}
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
