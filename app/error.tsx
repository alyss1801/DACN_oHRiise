"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="fatal-state">
      <AlertTriangle size={28} strokeWidth={1.5} />
      <h1>Không thể tải không gian làm việc</h1>
      <p>Dữ liệu demo hiện tại vẫn được giữ. Hãy thử tải lại phần giao diện này.</p>
      <button className="primary-button" onClick={reset}><RefreshCw size={15} strokeWidth={1.5} /> Thử lại</button>
    </main>
  );
}
