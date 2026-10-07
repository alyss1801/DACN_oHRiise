"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { createContext } from "react";
import { X } from "lucide-react";
import { BrandPageDivider } from "@/components/brand-page-divider";
import { cn } from "@/lib/utils";

const ModuleVisualContext = createContext("home");

export function ModuleVisualProvider({ moduleId, children }: { moduleId: string; children: React.ReactNode }) {
  return <ModuleVisualContext.Provider value={moduleId}>{children}</ModuleVisualContext.Provider>;
}

export function WorkspaceHeader({ title, subtitle, action }: {
  eyebrow?: string;
  title: string;
  description?: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="module-action-strip" aria-label={`Tác vụ ${title}`}>
      <BrandPageDivider />
      {(subtitle || action) && <div className="module-action-row">{subtitle && <p>{subtitle}</p>}{action && <div className="module-intro-action">{action}</div>}</div>}
    </section>
  );
}

export function StatusPill({ tone = "neutral", children }: { tone?: "neutral" | "success" | "warning" | "danger" | "blue"; children: React.ReactNode }) {
  return <span className={cn("workflow-status", tone)}>{children}</span>;
}

export function FormField({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="form-field">
      <span>{label}{required && <i>*</i>}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function WorkflowDialog({ open, onOpenChange, title, description, children, footer }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="workflow-dialog">
          <div className="workflow-dialog-head">
            <div><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{description}</Dialog.Description></div>
            <Dialog.Close className="icon-button" aria-label="Đóng"><X size={17} strokeWidth={1.5} /></Dialog.Close>
          </div>
          <div className="workflow-dialog-body">{children}</div>
          <div className="workflow-dialog-footer">{footer}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="compact-empty"><strong>{title}</strong><p>{description}</p></div>;
}
