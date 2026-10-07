"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Download,
  FileCheck2,
  RefreshCw,
  Search,
  ServerCog,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import {
  StatusPill,
  WorkflowDialog,
  WorkspaceHeader,
} from "@/features/employee/workspace-frame";
import { useSession } from "@/features/session/session-context";

const attendanceRows = [
  {
    name: "Võ Thu Linh",
    initials: "TL",
    branch: "HCM-Q1",
    checkIn: "09:12",
    issue: "Đi muộn 42 phút",
    status: "open",
  },
  {
    name: "Phạm Gia Bảo",
    initials: "GB",
    branch: "HCM-TD",
    checkIn: "--:--",
    issue: "Thiếu check-in",
    status: "open",
  },
  {
    name: "Lê Hoàng Đức",
    initials: "LĐ",
    branch: "HN-CG",
    checkIn: "08:19",
    issue: "GPS ngoài bán kính",
    status: "review",
  },
  {
    name: "Nguyễn Thu Hà",
    initials: "NH",
    branch: "HCM-Q1",
    checkIn: "08:42",
    issue: "Không có",
    status: "ok",
  },
];

export function AttendanceMonitoringWorkspace() {
  const { can } = useSession();
  const [query, setQuery] = useState("");
  const visible = attendanceRows.filter((row) =>
    row.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="page-stack">
      <WorkspaceHeader
        eyebrow="HR · ATTENDANCE"
        title="Giám sát chấm công"
        description="Theo dõi hiện diện, ngoại lệ và dữ liệu chuẩn bị bảng công."
        action={can("attendance-monitoring", "export") ? (
          <button
            className="secondary-button"
            onClick={() => toast.success("Đã xuất danh sách ngoại lệ CSV.")}
          >
            <Download size={15} strokeWidth={1.5} /> Xuất ngoại lệ
          </button>
        ) : undefined}
      />
      <section className="ops-metrics">
        <Metric
          label="ĐÃ CHECK-IN"
          value="284"
          note="86.6% lực lượng"
          tone="success"
        />
        <Metric
          label="WFH HÔM NAY"
          value="31"
          note="9.5% lực lượng"
          tone="blue"
        />
        <Metric label="NGHỈ PHÉP" value="8" note="Đã được duyệt" />
        <Metric
          label="NGOẠI LỆ"
          value="5"
          note="3 mục chưa xử lý"
          tone="warning"
        />
      </section>
      <section className="panel data-panel">
        <div className="data-panel-head">
          <div>
            <span className="eyebrow">NGOẠI LỆ HÔM NAY</span>
            <h3>07/10/2026</h3>
          </div>
          <div className="compact-search">
            <Search size={14} strokeWidth={1.5} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm nhân viên..."
            />
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Chi nhánh</th>
                <th>Check-in</th>
                <th>Ngoại lệ</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.name}>
                  <td>
                    <div className="table-person">
                      <span className="avatar avatar-sm">{row.initials}</span>
                      <strong>{row.name}</strong>
                    </div>
                  </td>
                  <td>{row.branch}</td>
                  <td className="mono">{row.checkIn}</td>
                  <td>{row.issue}</td>
                  <td>
                    {row.status === "ok" ? (
                      <StatusPill tone="success">Hợp lệ</StatusPill>
                    ) : row.status === "review" ? (
                      <StatusPill tone="blue">Đang xem xét</StatusPill>
                    ) : (
                      <StatusPill tone="warning">
                        <AlertTriangle size={12} strokeWidth={1.5} /> Cần xử lý
                      </StatusPill>
                    )}
                  </td>
                  <td>
                    <button
                      className="row-action"
                      onClick={() => toast.info(`Đã mở log của ${row.name}.`)}
                    >
                      Chi tiết <ArrowUpRight size={13} strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  value: string;
  note: string;
  tone?: string;
}) {
  return (
    <article className={`panel ops-metric ${tone}`}>
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

export function TimesheetsWorkspace() {
  const { can } = useSession();
  const canClose = can("timesheets", "approve");
  const [closed, setClosed] = useState(false);
  const [dialog, setDialog] = useState(false);
  return (
    <div className="page-stack">
      <WorkspaceHeader
        eyebrow="HR · TIMESHEET"
        title="Chốt bảng công tháng 09"
        description="Kiểm tra ngoại lệ trước khi khóa dữ liệu đầu vào cho MISA AMIS."
        action={canClose ? (
          <button
            className="primary-button"
            disabled={closed}
            onClick={() => setDialog(true)}
          >
            <FileCheck2 size={15} strokeWidth={1.5} />{" "}
            {closed ? "Đã chốt" : "Chốt bảng công"}
          </button>
        ) : (
          <StatusPill tone="neutral">Chỉ xem</StatusPill>
        )}
      />
      <section className="timesheet-progress panel">
        <div className="close-status">
          <span className={closed ? "done" : "active"}>
            {closed ? (
              <Check size={16} strokeWidth={2} />
            ) : (
              <Clock3 size={16} strokeWidth={1.5} />
            )}
          </span>
          <div>
            <strong>
              {closed
                ? "Bảng công đã được khóa"
                : "Sẵn sàng chốt sau khi xử lý 3 ngoại lệ"}
            </strong>
            <p>
              {closed
                ? "Hoàn tất lúc 10:42 · 07/10/2026 bởi Nguyễn Thanh Lan"
                : "Dữ liệu đến 30/09/2026 · cập nhật lần cuối 09:18"}
            </p>
          </div>
        </div>
        <div className="timesheet-checks">
          <div>
            <CheckCircle2 size={15} strokeWidth={1.5} />
            <span>328 nhân sự đã tổng hợp</span>
            <strong>Hoàn tất</strong>
          </div>
          <div>
            <CheckCircle2 size={15} strokeWidth={1.5} />
            <span>31 ngày WFH đối chiếu</span>
            <strong>Hoàn tất</strong>
          </div>
          <div>
            <AlertTriangle size={15} strokeWidth={1.5} />
            <span>3 ngoại lệ được HR xác nhận</span>
            <strong>{closed ? "Đã chấp nhận" : "Cần xem"}</strong>
          </div>
          <div>
            <CheckCircle2 size={15} strokeWidth={1.5} />
            <span>Overtime đã Team Lead xác nhận</span>
            <strong>Hoàn tất</strong>
          </div>
        </div>
      </section>
      <section className="panel data-panel">
        <div className="data-panel-head">
          <div>
            <span className="eyebrow">TỔNG HỢP THEO CHI NHÁNH</span>
            <h3>Tháng 09/2026</h3>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Chi nhánh</th>
                <th>Nhân sự</th>
                <th>Giờ công</th>
                <th>OT</th>
                <th>Ngoại lệ</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["HCM-Q1", "126", "20.136h", "184h", "1"],
                ["HCM-TD", "98", "15.624h", "142h", "1"],
                ["HN-CG", "76", "12.112h", "96h", "1"],
                ["DN-HC", "28", "4.462h", "31h", "0"],
              ].map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, index) => (
                    <td className={index > 0 ? "mono" : ""} key={index}>
                      {cell}
                    </td>
                  ))}
                  <td>
                    <StatusPill tone={closed ? "success" : "blue"}>
                      {closed ? "Đã khóa" : "Sẵn sàng"}
                    </StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <WorkflowDialog
        open={dialog}
        onOpenChange={setDialog}
        title="Xác nhận chốt bảng công"
        description="Sau khi chốt, dữ liệu tháng 09 chỉ có thể mở lại bởi người có quyền cấu hình."
        footer={
          <>
            <button
              className="secondary-button"
              onClick={() => setDialog(false)}
            >
              Hủy
            </button>
            <button
              className="primary-button"
              onClick={() => {
                setClosed(true);
                setDialog(false);
                toast.success("Đã chốt bảng công tháng 09/2026.");
              }}
            >
              Xác nhận chốt
            </button>
          </>
        }
      >
        <div className="warning-box">
          <ShieldAlert size={18} strokeWidth={1.5} />
          <div>
            <strong>3 ngoại lệ sẽ được ghi nhận là đã chấp nhận</strong>
            <p>
              Quyết định và người thực hiện được lưu vào audit log trước khi
              đồng bộ MISA.
            </p>
          </div>
        </div>
      </WorkflowDialog>
    </div>
  );
}

const expenseReviewSeed = [
  {
    id: "EXP-2610-045",
    employee: "Trần Minh Khoa",
    branch: "HCM-Q1",
    title: "JetBrains All Products Pack",
    amount: "4.850.000 ₫",
    lead: "Đã duyệt",
    status: "pending",
  },
  {
    id: "EXP-2610-041",
    employee: "Nguyễn Thu Hà",
    branch: "HCM-Q1",
    title: "Figma Professional · tháng 9",
    amount: "386.000 ₫",
    lead: "Đã duyệt",
    status: "pending",
  },
  {
    id: "EXP-2610-038",
    employee: "Võ Thu Linh",
    branch: "HCM-TD",
    title: "Notion AI · tháng 9",
    amount: "245.000 ₫",
    lead: "Đã duyệt",
    status: "approved",
  },
];

export function ExpenseReviewWorkspace() {
  const [rows, setRows] = useState(expenseReviewSeed);
  const [branch, setBranch] = useState("all");
  const pending = rows.filter((row) => row.status === "pending");
  const visibleRows = rows.filter(
    (row) => branch === "all" || row.branch === branch,
  );
  return (
    <div className="page-stack">
      <WorkspaceHeader
        eyebrow="HR · POLICY REVIEW"
        title="Duyệt chi phí"
        description="Xác nhận chính sách và hạn mức sau bước phê duyệt của Team Lead."
      />
      <section className="panel data-panel">
        <div className="data-panel-head">
          <div>
            <span className="eyebrow">CHỜ HR XỬ LÝ</span>
            <h3>{pending.length} đề nghị</h3>
          </div>
          <select
            className="filter-select"
            aria-label="Lọc chi nhánh"
            value={branch}
            onChange={(event) => setBranch(event.target.value)}
          >
            <option value="all">Tất cả chi nhánh</option>
            <option>HCM-Q1</option>
            <option>HCM-TD</option>
          </select>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Nhân viên</th>
                <th>Nội dung</th>
                <th>Số tiền</th>
                <th>Team Lead</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id}>
                  <td className="mono">{row.id}</td>
                  <td>
                    <strong>{row.employee}</strong>
                  </td>
                  <td>{row.title}</td>
                  <td className="mono">{row.amount}</td>
                  <td>{row.lead}</td>
                  <td>
                    {row.status === "approved" ? (
                      <StatusPill tone="success">Đã xác nhận</StatusPill>
                    ) : (
                      <StatusPill tone="warning">Chờ HR</StatusPill>
                    )}
                  </td>
                  <td>
                    {row.status === "pending" && (
                      <button
                        className="row-action"
                        onClick={() => {
                          setRows((current) =>
                            current.map((item) =>
                              item.id === row.id
                                ? { ...item, status: "approved" }
                                : item,
                            ),
                          );
                          toast.success(`Đã xác nhận ${row.id}.`);
                        }}
                      >
                        Xác nhận <Check size={13} strokeWidth={1.5} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="boundary-note">
        <CircleDollarSign size={17} strokeWidth={1.5} />
        <div>
          <strong>Ranh giới nghiệp vụ</strong>
          <p>
            HR chỉ xác nhận chính sách/hạn mức. Thanh toán được thực hiện bởi hệ
            thống tài chính bên ngoài.
          </p>
        </div>
      </div>
    </div>
  );
}

export function MisaSyncWorkspace() {
  const [syncing, setSyncing] = useState(false);
  const [success, setSuccess] = useState(false);
  function sync() {
    setSyncing(true);
    window.setTimeout(() => {
      setSyncing(false);
      setSuccess(true);
      toast.success("Đồng bộ MISA AMIS hoàn tất.");
    }, 700);
  }
  return (
    <div className="page-stack">
      <WorkspaceHeader
        eyebrow="PAYROLL INPUT · INTEGRATION"
        title="Đồng bộ MISA AMIS"
        description="Gửi dữ liệu đầu vào đã chốt; oHRiise không thực hiện tính lương."
        action={
          <button className="primary-button" disabled={syncing} onClick={sync}>
            <RefreshCw
              className={syncing ? "spin" : ""}
              size={15}
              strokeWidth={1.5}
            />{" "}
            {syncing ? "Đang đồng bộ..." : "Đồng bộ lại"}
          </button>
        }
      />
      <section className="integration-hero panel">
        <div className="integration-status">
          <span className={success ? "success" : "warning"}>
            <ServerCog size={25} strokeWidth={1.5} />
          </span>
          <div>
            <div className="eyebrow">MISA AMIS · PRODUCTION</div>
            <h3>
              {success
                ? "Kết nối hoạt động bình thường"
                : "Lần đồng bộ gần nhất có cảnh báo"}
            </h3>
            <p>
              {success
                ? "Hoàn tất lúc 10:48 · 328/328 bản ghi"
                : "Thành công gần nhất 09:02 · 07/10/2026"}
            </p>
          </div>
          <StatusPill tone={success ? "success" : "warning"}>
            {success ? "Healthy" : "Retry required"}
          </StatusPill>
        </div>
        <div className="sync-pipeline">
          <Pipeline label="Bảng công" count="328" state="ready" />
          <i />
          <Pipeline label="Nghỉ phép" count="46" state="ready" />
          <i />
          <Pipeline label="Overtime" count="31" state="ready" />
          <i />
          <Pipeline
            label="MISA AMIS"
            count={success ? "328" : "325"}
            state={success ? "ready" : "warning"}
          />
        </div>
      </section>
      {!success && (
        <div className="inline-alert warning">
          <AlertTriangle size={17} strokeWidth={1.5} />
          <div>
            <strong>3 bản ghi chưa đồng bộ do mã nhân viên không khớp</strong>
            <p>Dữ liệu chốt không bị thay đổi. Chỉnh mapping rồi thử lại.</p>
          </div>
          <button className="secondary-button" onClick={sync}>
            Thử lại
          </button>
        </div>
      )}
      <section className="panel data-panel">
        <div className="data-panel-head">
          <div>
            <span className="eyebrow">LỊCH SỬ ĐỒNG BỘ</span>
            <h3>30 ngày gần đây</h3>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Loại</th>
                <th>Bản ghi</th>
                <th>Người thực hiện</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono">07/10/2026 09:02</td>
                <td>Bảng công tháng 09</td>
                <td>325 / 328</td>
                <td>Nguyễn Thanh Lan</td>
                <td>
                  <StatusPill tone="warning">Có cảnh báo</StatusPill>
                </td>
              </tr>
              <tr>
                <td className="mono">01/10/2026 08:12</td>
                <td>Phiếu lương tháng 09</td>
                <td>328 / 328</td>
                <td>Hệ thống</td>
                <td>
                  <StatusPill tone="success">Thành công</StatusPill>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Pipeline({
  label,
  count,
  state,
}: {
  label: string;
  count: string;
  state: string;
}) {
  return (
    <div>
      <span className={state}>
        <Check size={13} strokeWidth={2} />
      </span>
      <strong>{label}</strong>
      <small>{count} bản ghi</small>
    </div>
  );
}

export function ReportsWorkspace() {
  const { can } = useSession();
  const [range, setRange] = useState("6 tháng");
  const [branch, setBranch] = useState("all");
  const [department, setDepartment] = useState("all");
  const scopeLabel = `${branch === "all" ? "Toàn công ty" : branch} · ${department === "all" ? "Tất cả phòng ban" : department}`;
  return (
    <div className="page-stack">
      <WorkspaceHeader
        eyebrow="HR · REPORTING"
        title="People analytics"
        description={`Báo cáo ${scopeLabel.toLowerCase()} trong ${range}.`}
        action={can("reports", "export") ? (
          <button
            className="secondary-button"
            onClick={() => toast.success("Đã tạo file báo cáo XLSX.")}
          >
            <Download size={15} strokeWidth={1.5} /> Xuất báo cáo
          </button>
        ) : undefined}
      />
      <div className="report-filters">
        <select
          className="filter-select"
          aria-label="Khoảng báo cáo"
          value={range}
          onChange={(event) => setRange(event.target.value)}
        >
          <option>6 tháng</option>
          <option>12 tháng</option>
        </select>
        <select
          className="filter-select"
          aria-label="Chi nhánh báo cáo"
          value={branch}
          onChange={(event) => setBranch(event.target.value)}
        >
          <option value="all">Tất cả chi nhánh</option>
          <option>HCM-Q1</option>
          <option>HCM-TD</option>
          <option>HN-CG</option>
          <option>DN-HC</option>
        </select>
        <select
          className="filter-select"
          aria-label="Phòng ban báo cáo"
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
        >
          <option value="all">Tất cả phòng ban</option>
          <option>Công nghệ thông tin</option>
          <option>Sản phẩm</option>
          <option>Nhân sự</option>
        </select>
      </div>
      <section className="reports-grid">
        <article className="panel headcount-chart">
          <div className="panel-heading compact">
            <div>
              <span className="eyebrow">HEADCOUNT TREND</span>
              <h3>Quy mô nhân sự</h3>
            </div>
            <strong>
              328 <small>+7.2%</small>
            </strong>
          </div>
          <div className="bar-chart">
            {[62, 68, 65, 76, 81, 88, 92, 96, 90, 100, 97, 104].map(
              (height, index) => (
                <i key={index} style={{ height: `${height}%` }}>
                  <span>{index + 1}</span>
                </i>
              ),
            )}
          </div>
        </article>
        <article className="panel report-breakdown">
          <span className="eyebrow">THEO CHI NHÁNH</span>
          {[
            ["HCM-Q1", 126, 38],
            ["HCM-TD", 98, 30],
            ["HN-CG", 76, 23],
            ["DN-HC", 28, 9],
          ].map(([name, count, percent]) => (
            <div key={name}>
              <p>
                <span>{name}</span>
                <strong>{count}</strong>
              </p>
              <i>
                <b style={{ width: `${percent}%` }} />
              </i>
            </div>
          ))}
        </article>
        <article className="panel turnover-card">
          <span className="eyebrow">TURNOVER · 12 THÁNG</span>
          <strong>8.4%</strong>
          <p>Giảm 1.2 điểm % so với kỳ trước</p>
          <svg viewBox="0 0 300 90">
            <path
              d="M0 65 C35 70 50 36 82 42 S136 72 169 46 S225 18 300 29"
              fill="none"
              stroke="#00c9c8"
              strokeWidth="2"
            />
          </svg>
        </article>
        <article className="panel payroll-report">
          <span className="eyebrow">PAYROLL COST · IMPORTED</span>
          <strong>5.82 tỷ ₫</strong>
          <p>Dữ liệu tháng 09 từ MISA AMIS</p>
          <div className="boundary-note compact">
            <CircleDollarSign size={15} strokeWidth={1.5} />
            <p>
              Chỉ là metric báo cáo, không phải kết quả tính lương của oHRiise.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
