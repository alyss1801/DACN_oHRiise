"use client";

import { useMemo, useState } from "react";
import { Check, Circle, ClipboardCheck, Link2, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FormField, StatusPill, WorkspaceHeader } from "./workspace-frame";

type Task = { id: number; title: string; done: boolean; reference: string };

const seedTasks: Task[] = [
  { id: 1, title: "Hoàn thiện component Date Picker", done: true, reference: "FIG-184" },
  { id: 2, title: "Review luồng onboarding với Product", done: true, reference: "Meeting 14:00" },
  { id: 3, title: "Cập nhật guideline accessibility", done: false, reference: "" },
];

export function DailyReportWorkspace() {
  const [tasks, setTasks] = useState(seedTasks);
  const [newTask, setNewTask] = useState("");
  const [summary, setSummary] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const completed = useMemo(() => tasks.filter((task) => task.done).length, [tasks]);

  function addTask() {
    if (!newTask.trim()) return;
    setTasks((current) => [...current, { id: Date.now(), title: newTask.trim(), done: false, reference: "" }]);
    setNewTask("");
  }

  function submitReport() {
    if (tasks.length === 0 || summary.trim().length < 20) { toast.error("Vui lòng thêm công việc và phần tổng kết ít nhất 20 ký tự."); return; }
    setSubmitted(true); toast.success("Daily Report đã được gửi lúc 17:42.");
  }

  return (
    <div className="page-stack">
      <WorkspaceHeader eyebrow="DAILY REPORT" title="Báo cáo công việc" description="Ghi nhận tiến độ cho ngày WFH đã được phê duyệt." action={submitted ? <StatusPill tone="success"><Check size={13} strokeWidth={1.5} /> Đã gửi 17:42</StatusPill> : undefined} />
      <section className="daily-layout">
        <article className="panel daily-editor">
          <div className="daily-date-head"><div className="calendar-tile"><span>THÁNG 10</span><strong>09</strong></div><div><h3>Thứ Sáu, 09/10/2026</h3><p>WFH · Cả ngày · yêu cầu WFH-2026-095</p></div></div>
          <div className="task-progress"><div><span>Tiến độ hôm nay</span><strong>{completed}/{tasks.length} công việc</strong></div><i><b style={{ width: `${tasks.length ? (completed / tasks.length) * 100 : 0}%` }} /></i></div>
          <div className="task-editor-list">{tasks.map((task) => <div className="task-editor-row" key={task.id}><button aria-label={task.done ? "Đánh dấu chưa hoàn tất" : "Đánh dấu hoàn tất"} onClick={() => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))}>{task.done ? <Check size={14} strokeWidth={2} /> : <Circle size={14} strokeWidth={1.5} />}</button><input value={task.title} onChange={(event) => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, title: event.target.value } : item))} /><div className="task-reference"><Link2 size={13} strokeWidth={1.5} /><input value={task.reference} placeholder="Link / mã việc" onChange={(event) => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, reference: event.target.value } : item))} /></div><button className="remove-task" aria-label="Xóa công việc" onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))}><Trash2 size={14} strokeWidth={1.5} /></button></div>)}</div>
          <div className="add-task-row"><input value={newTask} onChange={(event) => setNewTask(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTask(); } }} placeholder="Thêm đầu việc..." /><button onClick={addTask}><Plus size={15} strokeWidth={1.5} /> Thêm</button></div>
          <FormField label="Tổng kết ngày" hint={`${summary.length}/600 ký tự`} required><textarea maxLength={600} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Kết quả chính, trở ngại và kế hoạch tiếp theo..." /></FormField>
          <button className="primary-button" onClick={submitReport} disabled={submitted}><Send size={15} strokeWidth={1.5} /> {submitted ? "Đã gửi báo cáo" : "Gửi Daily Report"}</button>
        </article>
        <aside className="panel daily-guide"><div className="panel-heading compact"><div><span className="eyebrow">TRẠNG THÁI</span><h3>WFH hôm nay</h3></div><ClipboardCheck size={18} strokeWidth={1.5} /></div><div className="daily-status-list"><div><Check size={14} strokeWidth={1.5} /><span>Yêu cầu WFH</span><strong>Đã duyệt</strong></div><div><Check size={14} strokeWidth={1.5} /><span>Check-in 08:31</span><strong>Hợp lệ</strong></div><div className={submitted ? "done" : "pending"}>{submitted ? <Check size={14} strokeWidth={1.5} /> : <Circle size={14} strokeWidth={1.5} />}<span>Daily Report</span><strong>{submitted ? "Đã gửi" : "Trước 18:00"}</strong></div></div><div className="daily-help"><strong>AI chưa tham gia khi bạn soạn báo cáo.</strong><p>Sau khi gửi, Team Lead có thể dùng AI để đối chiếu bằng chứng. Thiếu bằng chứng không được xem là kết luận vi phạm.</p></div></aside>
      </section>
    </div>
  );
}
