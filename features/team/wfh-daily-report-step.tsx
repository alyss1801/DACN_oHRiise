"use client";

import { useMemo, useState } from "react";
import { Check, Circle, ClipboardCheck, Info, Link2, Plus, Save, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDemoData } from "@/features/demo/demo-data-context";
import { FormField, StatusPill } from "@/features/employee/workspace-frame";

type Task = { id: number; title: string; done: boolean; reference: string };

const seedTasks: Task[] = [
  { id: 1, title: "Hoàn thiện component Date Picker", done: true, reference: "FIG-184" },
  { id: 2, title: "Review luồng onboarding với Product", done: true, reference: "Meeting 14:00" },
  { id: 3, title: "Cập nhật guideline accessibility", done: false, reference: "" },
];

export function WfhDailyReportStep() {
  const { wfhReportStatus, setWfhReportStatus } = useDemoData();
  const [tasks, setTasks] = useState(seedTasks);
  const [newTask, setNewTask] = useState("");
  const [summary, setSummary] = useState("");
  const completed = useMemo(() => tasks.filter((task) => task.done).length, [tasks]);
  const submitted = wfhReportStatus === "submitted";

  function addTask() {
    if (!newTask.trim() || submitted) return;
    setTasks((current) => [...current, { id: Date.now(), title: newTask.trim(), done: false, reference: "" }]);
    setNewTask("");
  }

  function saveDraft() {
    if (submitted) return;
    setWfhReportStatus("draft");
    toast.success("Đã lưu nháp Daily Report trong phiên WFH.");
  }

  function submitReport() {
    if (tasks.length === 0 || summary.trim().length < 20) {
      toast.error("Vui lòng thêm công việc và phần tổng kết ít nhất 20 ký tự.");
      return;
    }
    setWfhReportStatus("submitted");
    toast.success("Daily Report đã được gắn vào phiên WFH lúc 17:42.");
  }

  return (
    <section className="daily-layout wfh-daily-report-step">
      <article className="panel daily-editor">
        <header className="wfh-step-heading">
          <div><span>Bước 4 trong phiên WFH</span><h2>Khai báo Daily Report</h2><p>Tổng kết công việc để bổ sung ngữ cảnh cho bước đánh giá AI.</p></div>
          <StatusPill tone={submitted ? "success" : wfhReportStatus === "draft" ? "blue" : "warning"}>{submitted ? "Đã nộp" : wfhReportStatus === "draft" ? "Bản nháp" : "Cần nộp"}</StatusPill>
        </header>
        <div className="daily-date-head"><div className="calendar-tile"><span>THÁNG 10</span><strong>07</strong></div><div><h3>Thứ Tư, 07/10/2026</h3><p>WFH · Cả ngày · WFH-2026-095</p></div></div>
        <div className="task-progress"><div><span>Tiến độ hôm nay</span><strong>{completed}/{tasks.length} công việc</strong></div><i><b style={{ width: `${tasks.length ? (completed / tasks.length) * 100 : 0}%` }} /></i></div>
        <div className="task-editor-list">{tasks.map((task) => <div className="task-editor-row" key={task.id}><button disabled={submitted} aria-label={task.done ? "Đánh dấu chưa hoàn tất" : "Đánh dấu hoàn tất"} onClick={() => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))}>{task.done ? <Check size={14} strokeWidth={2} /> : <Circle size={14} strokeWidth={1.5} />}</button><input disabled={submitted} value={task.title} onChange={(event) => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, title: event.target.value } : item))} /><div className="task-reference"><Link2 size={13} strokeWidth={1.5} /><input disabled={submitted} value={task.reference} placeholder="Link / mã việc" onChange={(event) => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, reference: event.target.value } : item))} /></div><button disabled={submitted} className="remove-task" aria-label="Xóa công việc" onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))}><Trash2 size={14} strokeWidth={1.5} /></button></div>)}</div>
        {!submitted && <div className="add-task-row"><input value={newTask} onChange={(event) => setNewTask(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTask(); } }} placeholder="Thêm đầu việc..." /><button onClick={addTask}><Plus size={15} strokeWidth={1.5} /> Thêm</button></div>}
        <FormField label="Tổng kết ngày" hint={`${summary.length}/600 ký tự`} required><textarea disabled={submitted} maxLength={600} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Kết quả chính, trở ngại và kế hoạch tiếp theo..." /></FormField>
        <div className="daily-submit-row">
          <details className="report-rights-note">
            <summary><Info size={15} strokeWidth={1.5} /> AI không tham gia khi bạn soạn báo cáo</summary>
            <p>Sau khi gửi, AI chỉ đối chiếu báo cáo với nhiều nguồn tín hiệu. Thiếu screenshot hoặc tín hiệu màn hình không được xem là kết luận vi phạm.</p>
          </details>
          {!submitted && <div className="wfh-report-actions"><button className="secondary-button" onClick={saveDraft}><Save size={15} strokeWidth={1.5} /> Lưu nháp</button><button className="primary-button" onClick={submitReport}><Send size={15} strokeWidth={1.5} /> Gửi Daily Report</button></div>}
        </div>
      </article>
      <aside className="panel daily-guide"><div className="panel-heading compact"><div><h3>Tiến trình WFH</h3></div><ClipboardCheck size={18} strokeWidth={1.5} /></div><div className="daily-status-list"><div><Check size={14} strokeWidth={1.5} /><span>Đơn WFH</span><strong>Đã duyệt</strong></div><div><Check size={14} strokeWidth={1.5} /><span>Check-in 08:31</span><strong>Hợp lệ</strong></div><div><Check size={14} strokeWidth={1.5} /><span>Phiên WFH</span><strong>Đã kết thúc</strong></div><div className={submitted ? "done" : "pending"}>{submitted ? <Check size={14} strokeWidth={1.5} /> : <Circle size={14} strokeWidth={1.5} />}<span>Daily Report</span><strong>{submitted ? "Đã gửi" : wfhReportStatus === "draft" ? "Đang soạn" : "Trước 18:00"}</strong></div></div><div className="wfh-ai-boundary"><Info size={16} strokeWidth={1.5} /><p>AI tạo nhận định tham khảo kèm bằng chứng và độ tin cậy. Team Lead là người xem xét và quyết định.</p></div></aside>
    </section>
  );
}
