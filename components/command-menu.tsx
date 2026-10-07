"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import { useSession } from "@/features/session/session-context";
import { useDemoData } from "@/features/demo/demo-data-context";
import { navigationFor } from "@/lib/navigation";

export function CommandMenu({ open, onOpenChange, onNavigate }: { open: boolean; onOpenChange: (open: boolean) => void; onNavigate: (id: string) => void }) {
  const { session, can } = useSession();
  const { accounts, requests, selectAccount } = useDemoData();
  const groups = navigationFor(session);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="command-dialog" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">Tìm kiếm oHRiise</Dialog.Title>
          <Command label="Tìm kiếm oHRiise">
            <div className="command-input-wrap"><Search size={17} strokeWidth={1.5} /><Command.Input placeholder="Tìm module, tác vụ hoặc cài đặt..." autoFocus /></div>
            <Command.List>
              <Command.Empty>Không tìm thấy mục phù hợp với quyền hiện tại.</Command.Empty>
              {groups.map((group) => (
                <Command.Group key={group.label} heading={group.label}>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return <Command.Item key={item.id} value={`${item.label} ${group.label}`} onSelect={() => { onNavigate(item.id); onOpenChange(false); }}><Icon size={16} strokeWidth={1.5} /><span>{item.label}</span><small>Mở</small></Command.Item>;
                  })}
                </Command.Group>
              ))}
              {can("accounts") && <Command.Group heading="Tài khoản"><Command.Item value="Nguyễn Thanh Lan HR Tổng account" onSelect={() => { selectAccount(accounts[0].id); onNavigate("accounts"); onOpenChange(false); }}><Search size={16} strokeWidth={1.5} /><span>{accounts[0].name} · {accounts[0].id}</span><small>Mở</small></Command.Item></Command.Group>}
              {can("approvals") && <Command.Group heading="Yêu cầu"><Command.Item value={`${requests.find((item) => item.status === "pending")?.id ?? ""} approval request`} onSelect={() => { onNavigate("approvals"); onOpenChange(false); }}><Search size={16} strokeWidth={1.5} /><span>{requests.filter((item) => item.status === "pending").length} yêu cầu chờ duyệt</span><small>Mở</small></Command.Item></Command.Group>}
              {can("ai-cv") && <Command.Group heading="Ứng viên"><Command.Item value="Nguyễn Văn An Backend Engineer candidate" onSelect={() => { onNavigate("ai-cv"); onOpenChange(false); }}><Search size={16} strokeWidth={1.5} /><span>Nguyễn Văn An · Backend Engineer</span><small>91 điểm</small></Command.Item></Command.Group>}
            </Command.List>
            <div className="command-footer"><span><kbd>↑↓</kbd> di chuyển</span><span><kbd>↵</kbd> mở</span><span><kbd>esc</kbd> đóng</span></div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
