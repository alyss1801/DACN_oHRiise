"use client";

import { Bot, ShieldCheck } from "lucide-react";
import { StatusPill, WorkspaceHeader } from "@/features/employee/workspace-frame";
import { demoIntegrations } from "@/lib/demo-integrations";

export function AiStatusWorkspace() {
  const adapters = demoIntegrations.filter((item) => item.id.startsWith("ai-"));
  return <div className="page-stack">
    <WorkspaceHeader eyebrow="AI GOVERNANCE" title="Trạng thái AI" description="Minh bạch năng lực demo; chưa có engine, phiên bản model hoặc health check production." />
    <section className="integration-cards">{adapters.map((item) => <article className="panel" key={item.id}><div className="integration-card-head"><span><Bot size={19} strokeWidth={1.5} /></span><StatusPill tone="neutral">{item.state}</StatusPill></div><h3>{item.name}</h3><p>{item.detail}</p><div><span>Phiên bản / lần chạy</span><strong>Chưa có dữ liệu từ adapter</strong></div></article>)}</section>
    <div className="privacy-note"><ShieldCheck size={16} strokeWidth={1.5} /><span>Ứng viên và WFH trong demo chỉ có dữ liệu mẫu hoặc ghi chú do người dùng nhập. Quyết định nghiệp vụ luôn do người có quyền thực hiện; chưa có phân tích tự động.</span></div>
  </div>;
}
