import Image from "next/image";

export default function Loading() {
  return (
    <main className="app-loading" aria-label="Đang tải oHRiise">
      <div className="loading-sidebar" />
      <div className="loading-content">
        <div className="loading-brand-visual"><Image src="/assets/ohriise/01_onboarding_welcome-new-employee_hero-empty-state.png" alt="" width={220} height={165} priority /><div><strong>Đang chuẩn bị không gian oHRiise</strong><span>Đồng bộ quyền và dữ liệu công việc…</span></div></div>
        <div className="skeleton skeleton-title" />
        <div className="skeleton-grid">
          <div className="skeleton skeleton-card wide" />
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
        </div>
      </div>
    </main>
  );
}
