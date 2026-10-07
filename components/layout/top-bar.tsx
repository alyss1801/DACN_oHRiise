"use client";

import Image from "next/image";
import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSession } from "@/features/session/session-context";
import type { ModuleVisual } from "@/lib/module-visuals";

export function TopBar({ title, visual, onMenu, onCommand, onNavigate }: { title: string; visual?: ModuleVisual; onMenu: () => void; onCommand: () => void; onNavigate: (id: string) => void }) {
  const { session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="topbar">
      <div className="topbar-title-wrap">
        <button className="icon-button mobile-menu-button" onClick={onMenu} aria-label="Mở menu"><Menu size={19} strokeWidth={1.5} /></button>
        {visual && <span className="topbar-module-visual" style={{ "--module-accent": visual.accent } as React.CSSProperties} aria-hidden="true"><i /><Image src={visual.asset} alt="" width={96} height={72} priority /></span>}
        <strong className="topbar-module-title">{title}</strong>
      </div>
      <div className="topbar-actions">
        <div className="scope-chip"><span>Phạm vi</span><strong>{scopeLabel[session.effectiveScope]}</strong></div>
        <button className="search-trigger" onClick={onCommand}><Search size={15} strokeWidth={1.5} /><span>Tìm kiếm</span><kbd>⌘ K</kbd></button>
        <button className="icon-button" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label="Đổi giao diện">
          {resolvedTheme === "dark" ? <Sun size={17} strokeWidth={1.5} /> : <Moon size={17} strokeWidth={1.5} />}
        </button>
        <button className="icon-button notification-button" onClick={() => onNavigate("notifications")} aria-label="Thông báo"><Bell size={17} strokeWidth={1.5} /><i /></button>
      </div>
    </header>
  );
}

const scopeLabel = {
  self: "Bản thân",
  assigned: "Được phân công",
  team: "Đội ngũ",
  department: "Phòng ban",
  branch: "Chi nhánh",
  company: "Toàn công ty",
};
