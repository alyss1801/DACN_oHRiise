"use client";

import { useState } from "react";
import { CheckCircle2, Goal, MessageSquareText, Sparkles, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { StatusPill, WorkspaceHeader } from "./workspace-frame";

const goals = [
  { name: "Hoàn thiện Employee Design System", progress: 82, due: "18/10/2026", state: "Đúng tiến độ" },
  { name: "Cải thiện usability flow WFH", progress: 68, due: "25/10/2026", state: "Cần cập nhật" },
  { name: "Mentor 02 thành viên Product", progress: 75, due: "31/10/2026", state: "Đúng tiến độ" },
];

export function PerformanceWorkspace() {
  const [period, setPeriod] = useState("Q4/2026");
  return <div className="page-stack">
    <WorkspaceHeader eyebrow="PERFORMANCE" title="Đánh giá hiệu suất" description="Theo dõi mục tiêu, phản hồi và tiến độ đánh giá của bạn." action={<select className="filter-select" value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Kỳ đánh giá"><option>Q4/2026</option><option>Q3/2026</option></select>} />
    <section className="performance-summary">
      <article className="panel performance-score"><span><TrendingUp size={19} /></span><div><small>TIẾN ĐỘ MỤC TIÊU</small><strong>76%</strong><p>+8% so với lần cập nhật trước</p></div></article>
      <article className="panel performance-metric"><Goal size={18} /><span><strong>3/4</strong><small>Mục tiêu đang đúng tiến độ</small></span></article>
      <article className="panel performance-metric"><MessageSquareText size={18} /><span><strong>2</strong><small>Phản hồi mới trong {period}</small></span></article>
      <article className="panel performance-metric"><CheckCircle2 size={18} /><span><strong>18/10</strong><small>Ngày self-review tiếp theo</small></span></article>
    </section>
    <section className="performance-layout">
      <article className="panel performance-goals"><div className="data-panel-head"><div><span className="eyebrow">OBJECTIVES</span><h3>Mục tiêu cá nhân · {period}</h3></div><button className="secondary-button" onClick={() => toast.info("Đã mở biểu mẫu cập nhật tiến độ.")}>Cập nhật tiến độ</button></div>{goals.map((goal) => <div className="performance-goal-row" key={goal.name}><span><Target size={17} /></span><div><p><strong>{goal.name}</strong><small>Hạn {goal.due}</small></p><i><b style={{ width: `${goal.progress}%` }} /></i></div><b>{goal.progress}%</b><StatusPill tone={goal.state === "Đúng tiến độ" ? "success" : "warning"}>{goal.state}</StatusPill></div>)}</article>
      <aside className="panel performance-review"><span className="eyebrow">REVIEW CYCLE</span><h3>Mid-quarter check-in</h3><p>Self-review đang mở. Nội dung của bạn sẽ được chia sẻ với Team Lead sau khi gửi.</p><div><span><Sparkles size={15} /> Gợi ý chuẩn bị</span><ul><li>Kết quả có số liệu hoặc bằng chứng.</li><li>Trở ngại cần Team Lead hỗ trợ.</li><li>Mục tiêu ưu tiên cho 30 ngày tới.</li></ul></div><button className="primary-button wide" onClick={() => toast.success("Đã mở bản self-review nháp.")}>Mở self-review</button></aside>
    </section>
  </div>;
}
