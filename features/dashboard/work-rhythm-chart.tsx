"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { day: "T2", hours: 7.2 }, { day: "T3", hours: 8.1 }, { day: "T4", hours: 7.7 },
  { day: "T5", hours: 8.4 }, { day: "T6", hours: 8.2 }, { day: "T7", hours: 8.8 }, { day: "CN", hours: 8.6 },
];

export function WorkRhythmChart() {
  return (
    <div className="chart-wrap" aria-label="Biểu đồ giờ làm việc 7 ngày">
      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={data} margin={{ top: 10, right: 4, bottom: 0, left: 4 }}>
          <defs><linearGradient id="workRhythmFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00c9c8" stopOpacity={0.24} /><stop offset="100%" stopColor="#00c9c8" stopOpacity={0} /></linearGradient></defs>
          <Tooltip contentStyle={{ background: "#101725", border: "1px solid rgba(148,163,184,.18)", borderRadius: 10, fontSize: 10 }} formatter={(value) => [`${value} giờ`, "Thời gian"]} labelStyle={{ color: "#94a3b8" }} />
          <Area type="monotone" dataKey="hours" stroke="#00c9c8" strokeWidth={1.25} fill="url(#workRhythmFill)" animationDuration={500} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="chart-labels">{data.map((item) => <span key={item.day}>{item.day}</span>)}</div>
    </div>
  );
}
