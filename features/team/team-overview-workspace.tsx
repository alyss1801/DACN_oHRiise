"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  UsersRound,
} from "lucide-react";
import {
  StatusPill,
  WorkspaceHeader,
} from "@/features/employee/workspace-frame";

const members = [
  {
    initials: "BT",
    name: "Bùi Thanh Tâm",
    role: "Data Engineer",
    mode: "WFH",
    time: "08:29",
    status: "online",
  },
  {
    initials: "TK",
    name: "Trần Minh Khoa",
    role: "Backend Engineer",
    mode: "Văn phòng",
    time: "08:22",
    status: "online",
  },
  {
    initials: "LV",
    name: "Lê Hoàng Vy",
    role: "Data Analyst",
    mode: "Văn phòng",
    time: "08:44",
    status: "online",
  },
  {
    initials: "GB",
    name: "Phạm Gia Bảo",
    role: "QA Engineer",
    mode: "Nghỉ phép",
    time: "Cả ngày",
    status: "away",
  },
  {
    initials: "TL",
    name: "Võ Thu Linh",
    role: "Business Analyst",
    mode: "Văn phòng",
    time: "09:12",
    status: "late",
  },
];

export function TeamOverviewWorkspace({
  onNavigate,
}: {
  onNavigate: (id: string) => void;
}) {
  const [mode, setMode] = useState("all");
  const visibleMembers = members.filter(
    (member) => mode === "all" || member.mode === mode,
  );
  return (
    <div className="page-stack">
      <WorkspaceHeader
        eyebrow="TEAM WORKSPACE"
        title="Data Platform"
        description="Tình trạng hôm nay, khả năng đáp ứng và việc cần Team Lead xử lý."
        action={
          <button
            className="primary-button"
            onClick={() => onNavigate("approvals")}
          >
            Mở hộp thư duyệt <ArrowUpRight size={15} strokeWidth={1.5} />
          </button>
        }
      />
      <section className="team-metrics">
        <article className="panel team-presence">
          <div className="panel-heading compact">
            <div>
              <span className="eyebrow">HIỆN DIỆN HÔM NAY</span>
              <h3>5 thành viên</h3>
            </div>
            <UsersRound size={18} strokeWidth={1.5} />
          </div>
          <div className="presence-bar">
            <i className="office" style={{ width: "60%" }} />
            <i className="wfh" style={{ width: "20%" }} />
            <i className="away" style={{ width: "20%" }} />
          </div>
          <div className="presence-legend">
            <span>
              <i className="office" />
              Văn phòng <b>3</b>
            </span>
            <span>
              <i className="wfh" />
              WFH <b>1</b>
            </span>
            <span>
              <i className="away" />
              Nghỉ <b>1</b>
            </span>
          </div>
        </article>
        <article className="panel team-action-card warning">
          <span className="eyebrow">CHỜ BẠN XỬ LÝ</span>
          <strong>4</strong>
          <p>2 WFH · 1 nghỉ phép · 1 chi phí</p>
          <button onClick={() => onNavigate("approvals")}>Xem yêu cầu</button>
        </article>
        <article className="panel team-action-card">
          <span className="eyebrow">CẦN XEM XÉT</span>
          <strong>1</strong>
          <p>Bằng chứng WFH có độ tin cậy thấp</p>
          <button onClick={() => onNavigate("ai-wfh")}>Mở AI Review</button>
        </article>
      </section>
      <section className="panel data-panel">
        <div className="data-panel-head">
          <div>
            <span className="eyebrow">TRẠNG THÁI THÀNH VIÊN</span>
            <h3>Thứ Tư, 07/10/2026</h3>
          </div>
          <select
            className="filter-select"
            aria-label="Lọc hình thức làm việc"
            value={mode}
            onChange={(event) => setMode(event.target.value)}
          >
            <option value="all">Tất cả hình thức</option>
            <option value="Văn phòng">Văn phòng</option>
            <option value="WFH">WFH</option>
            <option value="Nghỉ phép">Nghỉ phép</option>
          </select>
        </div>
        <div className="team-member-list">
          {visibleMembers.map((member) => (
            <div key={member.name}>
              <div className="avatar">{member.initials}</div>
              <div>
                <strong>{member.name}</strong>
                <span>{member.role}</span>
              </div>
              <div>
                <strong>{member.mode}</strong>
                <span>Check-in {member.time}</span>
              </div>
              {member.status === "late" ? (
                <StatusPill tone="warning">
                  <AlertTriangle size={12} strokeWidth={1.5} /> Đi muộn
                </StatusPill>
              ) : member.status === "away" ? (
                <StatusPill tone="neutral">
                  <CalendarDays size={12} strokeWidth={1.5} /> Vắng
                </StatusPill>
              ) : (
                <StatusPill tone="success">
                  <CheckCircle2 size={12} strokeWidth={1.5} /> Hoạt động
                </StatusPill>
              )}
            </div>
          ))}
        </div>
      </section>
      <section className="workflow-shortcuts">
        <button onClick={() => onNavigate("team-calendar")}>
          <span>
            <CalendarDays size={17} strokeWidth={1.5} />
          </span>
          <div>
            <strong>Lịch đội ngũ</strong>
            <p>Xem WFH, ngày nghỉ và tải năng lực.</p>
          </div>
        </button>
        <button onClick={() => onNavigate("approvals")}>
          <span>
            <Clock3 size={17} strokeWidth={1.5} />
          </span>
          <div>
            <strong>Phê duyệt tập trung</strong>
            <p>Xử lý yêu cầu theo mức độ ưu tiên.</p>
          </div>
        </button>
      </section>
    </div>
  );
}
