"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { createContext, useContext } from "react";
import { X } from "lucide-react";
import { visualForModule } from "@/lib/module-visuals";
import { cn } from "@/lib/utils";

const ModuleVisualContext = createContext("home");

export function ModuleVisualProvider({ moduleId, children }: { moduleId: string; children: React.ReactNode }) {
  return <ModuleVisualContext.Provider value={moduleId}>{children}</ModuleVisualContext.Provider>;
}

export function WorkspaceHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  const moduleId = useContext(ModuleVisualContext);
  const visual = visualForModule(moduleId);

  return (
    <section className={cn("page-intro module-intro", visual && "has-module-visual")} style={visual ? { "--module-accent": visual.accent } as React.CSSProperties : undefined}>
      <div className="module-intro-copy"><div className="eyebrow">{eyebrow}</div><h2>{title}</h2><p>{description}</p></div>
      {visual && <div className="module-header-visual" aria-hidden="true"><i /><Image src={visual.asset} alt="" width={220} height={165} sizes="(max-width: 680px) 112px, (max-width: 900px) 148px, 210px" /></div>}
      {action && <div className="module-intro-action">{action}</div>}
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
