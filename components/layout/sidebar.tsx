"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { useSession } from "@/features/session/session-context";
import { navigationFor } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SidebarProps = {
  activeId: string;
  onNavigate: (id: string) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onSignOut: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

export function Sidebar({ activeId, onNavigate, mobileOpen, onMobileClose, onSignOut, collapsed, onToggleCollapsed }: SidebarProps) {
  const { session, personas, setPersona } = useSession();
  const groups = navigationFor(session);

  function navigate(id: string) {
    onNavigate(id);
    onMobileClose();
  }

  return (
    <>
      <button className={cn("sidebar-scrim", mobileOpen && "is-open")} onClick={onMobileClose} aria-label="Đóng điều hướng" />
      <aside className={cn("sidebar", collapsed && "is-collapsed", mobileOpen && "is-open")}>
        <div className="sidebar-brand-row">
          <BrandMark compact={collapsed} />
          <button className="sidebar-collapse-button" onClick={onToggleCollapsed} aria-label={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"} title={collapsed ? "Mở rộng" : "Thu gọn"}>{collapsed ? <PanelLeftOpen size={17} strokeWidth={1.5} /> : <PanelLeftClose size={17} strokeWidth={1.5} />}</button>
          <button className="icon-button mobile-only" onClick={onMobileClose} aria-label="Đóng menu"><X size={18} strokeWidth={1.5} /></button>
        </div>

        <div className="workspace-chip">
          <div className="workspace-monogram">OC</div>
          <div><strong>oHRiise Company</strong><span>Production workspace</span></div>
          <ChevronDown size={14} strokeWidth={1.5} />
        </div>

        <nav className="sidebar-nav" aria-label="Điều hướng chính">
          {groups.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-group-label">{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} className={cn("nav-item", activeId === item.id && "is-active")} onClick={() => navigate(item.id)} aria-label={item.label} title={collapsed ? item.label : undefined}>
                    <Icon size={17} strokeWidth={1.5} />
                    <span>{item.label}</span>
                    {item.badge && <b>{item.badge}</b>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="persona-trigger">
                <div className="avatar">{session.shortLabel}</div>
                <div className="persona-copy"><strong>Nguyễn Thu Hà</strong><span>{session.label}</span></div>
                <ChevronDown size={15} strokeWidth={1.5} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="persona-menu" side="right" sideOffset={12} align="end">
                <div className="persona-menu-head">
                  <span>CHẾ ĐỘ DEMO</span>
                  <p>Chuyển ngữ cảnh để kiểm tra quyền hiệu lực.</p>
                </div>
                {personas.map((persona) => (
                  <DropdownMenu.Item key={persona.id} className="persona-option" onSelect={() => setPersona(persona.id)}>
                    <div className="avatar avatar-sm">{persona.shortLabel}</div>
                    <div><strong>{persona.label}</strong><span>{persona.description}</span></div>
                    {persona.id === session.id && <Check size={15} strokeWidth={1.5} />}
                  </DropdownMenu.Item>
                ))}
                <DropdownMenu.Separator className="menu-separator" />
                <DropdownMenu.Item className="persona-option sign-out-option" onSelect={onSignOut}>
                  <LogOut size={16} strokeWidth={1.5} /><strong>Đăng xuất</strong>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </aside>
    </>
  );
}
