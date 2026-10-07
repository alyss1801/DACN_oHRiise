"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  FileUp,
  Plus,
  ReceiptText,
  WalletCards,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useDemoData } from "@/features/demo/demo-data-context";
import { expenseHistory } from "./mock-data";
import {
  FormField,
  StatusPill,
  WorkflowDialog,
  WorkspaceHeader,
} from "./workspace-frame";

type ExpenseRow =
  | (typeof expenseHistory)[number]
  | {
      id: string;
      title: string;
      category: string;
      amount: number;
      submitted: string;
      status: "lead-review";
    };
const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export function ExpenseWorkspace() {
  const { addBusinessRequest } = useDemoData();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Phần mềm");
  const [amount, setAmount] = useState("");
  const [rows, setRows] = useState<ExpenseRow[]>(expenseHistory);
  const [statusFilter, setStatusFilter] = useState("all");
  const submittedTotal = useMemo(
    () =>
      rows
        .filter((row) => row.status !== "rejected")
        .reduce((sum, row) => sum + row.amount, 0),
    [rows],
  );
  const visibleRows = useMemo(
    () =>
      rows.filter(
        (row) => statusFilter === "all" || row.status === statusFilter,
      ),
    [rows, statusFilter],
  );

  function submitExpense() {
    const numericAmount = Number(amount);
    if (
      title.trim().length < 5 ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      toast.error("Vui lòng nhập nội dung và số tiền hợp lệ.");
      return;
    }
    addBusinessRequest({
      idPrefix: "EXP-2610",
      type: "Chi phí",
      employee: "Nguyễn Thu Hà",
      initials: "NH",
      date: "07/10/2026",
      detail: `${title.trim()} · ${money.format(numericAmount)}`,
    });
    setRows((current) => [
      {
        id: `EXP-2610-${String(42 + current.length).padStart(3, "0")}`,
        title: title.trim(),
        category,
        amount: numericAmount,
        submitted: "07/10/2026",
        status: "lead-review",
      },
      ...current,
    ]);
    setTitle("");
    setAmount("");
    setOpen(false);
    toast.success("Đã gửi đề nghị chi phí tới Team Lead.");
  }

  return (
    <div className="page-stack">
      <WorkspaceHeader
        eyebrow="EXPENSE CLAIM"
        title="Đề nghị chi phí"
        description="Chi phí công cụ, phần mềm và thiết bị phục vụ công việc."
        action={
          <button className="primary-button" onClick={() => setOpen(true)}>
            <Plus size={16} strokeWidth={1.5} /> Tạo đề nghị
          </button>
        }
      />
      <section className="expense-overview">
        <article className="panel expense-total">
          <span className="eyebrow">ĐÃ GỬI NĂM 2026</span>
          <strong>{money.format(submittedTotal)}</strong>
          <p>Không bao gồm đề nghị bị từ chối.</p>
        </article>
        <article className="panel expense-flow">
          <div>
            <span className="flow-step done">
              <CheckCircle2 size={14} strokeWidth={1.5} />
            </span>
            <p>
              <strong>Nhân viên gửi</strong>
              <small>Biên nhận + lý do</small>
            </p>
          </div>
          <i />
          <div>
            <span className="flow-step active">
              <Clock3 size={14} strokeWidth={1.5} />
            </span>
            <p>
              <strong>Team Lead</strong>
              <small>Kiểm tra công việc</small>
            </p>
          </div>
          <i />
          <div>
            <span className="flow-step">
              <WalletCards size={14} strokeWidth={1.5} />
            </span>
            <p>
              <strong>HR review</strong>
              <small>Chính sách & hạn mức</small>
            </p>
          </div>
        </article>
      </section>
      <section className="panel data-panel">
        <div className="data-panel-head">
          <div>
            <span className="eyebrow">ĐỀ NGHỊ GẦN ĐÂY</span>
            <h3>Lịch sử chi phí</h3>
          </div>
          <select
            className="filter-select"
            aria-label="Lọc trạng thái chi phí"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="lead-review">Team Lead duyệt</option>
            <option value="hr-review">HR review</option>
            <option value="paid">Hoàn tất</option>
            <option value="rejected">Từ chối</option>
          </select>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Nội dung</th>
                <th>Danh mục</th>
                <th>Số tiền</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id}>
                  <td className="mono">{row.id}</td>
                  <td>
                    <strong>{row.title}</strong>
                  </td>
                  <td>{row.category}</td>
                  <td className="mono">{money.format(row.amount)}</td>
                  <td>{row.submitted}</td>
                  <td>
                    {row.status === "paid" ? (
                      <StatusPill tone="success">
                        <CheckCircle2 size={12} strokeWidth={1.5} /> Hoàn tất
                      </StatusPill>
                    ) : row.status === "rejected" ? (
                      <StatusPill tone="danger">
                        <XCircle size={12} strokeWidth={1.5} /> Từ chối
                      </StatusPill>
                    ) : row.status === "lead-review" ? (
                      <StatusPill tone="warning">
                        <Clock3 size={12} strokeWidth={1.5} /> Team Lead duyệt
                      </StatusPill>
                    ) : (
                      <StatusPill tone="blue">
                        <Clock3 size={12} strokeWidth={1.5} /> HR review
                      </StatusPill>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="boundary-note">
        <ReceiptText size={17} strokeWidth={1.5} />
        <div>
          <strong>oHRiise không thực hiện giải ngân.</strong>
          <p>
            Sau khi HR xác nhận chính sách, việc thanh toán được chuyển sang hệ
            thống tài chính phù hợp.
          </p>
        </div>
      </div>
      <WorkflowDialog
        open={open}
        onOpenChange={setOpen}
        title="Tạo đề nghị chi phí"
        description="Đính kèm chứng từ rõ ràng để rút ngắn thời gian xử lý."
        footer={
          <>
            <button className="secondary-button" onClick={() => setOpen(false)}>
              Hủy
            </button>
            <button className="primary-button" onClick={submitExpense}>
              Gửi đề nghị
            </button>
          </>
        }
      >
        <div className="form-grid two-cols">
          <FormField label="Nội dung chi phí" required>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ví dụ: Figma Professional tháng 10"
            />
          </FormField>
          <FormField label="Danh mục" required>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option>Phần mềm</option>
              <option>Thiết bị</option>
              <option>Công cụ làm việc</option>
              <option>Chi phí công tác</option>
            </select>
          </FormField>
          <FormField label="Số tiền (VND)" required>
            <input
              inputMode="numeric"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value.replace(/\D/g, ""))
              }
              placeholder="0"
            />
          </FormField>
          <FormField label="Ngày phát sinh" required>
            <input type="date" defaultValue="2026-10-07" />
          </FormField>
        </div>
        <FormField label="Chứng từ" required>
          <label className="upload-zone">
            <FileUp size={18} strokeWidth={1.5} />
            <span>Tải hóa đơn / biên nhận</span>
            <small>PNG, JPG, PDF · tối đa 10 MB</small>
            <input
              className="sr-only"
              type="file"
              accept="image/png,image/jpeg,application/pdf"
              onChange={(event) =>
                event.target.files?.[0] &&
                toast.success(`Đã đính kèm ${event.target.files[0].name}.`)
              }
            />
          </label>
        </FormField>
        <FormField label="Ghi chú">
          <textarea placeholder="Thông tin giúp người duyệt hiểu mục đích chi phí..." />
        </FormField>
      </WorkflowDialog>
    </div>
  );
}
