"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useHrDemo } from "@/features/hr/hr-demo-context";
import { useSession } from "@/features/session/session-context";
import { can } from "@/lib/authorization/engine";
import { demoBusinessNow } from "@/lib/demo-clock";
import { changeMail, channelsFor, initialCommunicationStore, mailAccount, mailDirectory, publishAnnouncement, saveMailDraft, sendMail } from "./communications-model";
import type { CommunicationResult, CommunicationStore } from "./communications-model";

const storageKey = "ohriise-communications-demo-v1";
type Value = {
  store: CommunicationStore;
  account: ReturnType<typeof mailAccount>;
  directory: ReturnType<typeof mailDirectory>;
  channels: ReturnType<typeof channelsFor>;
  send: (input: { to: string; subject: string; body: string; draftId?: string }) => CommunicationResult;
  saveDraft: (input: { to: string; subject: string; body: string; draftId?: string }) => CommunicationResult;
  changeMail: (id: string, action: "read" | "star" | "archive" | "unarchive" | "trash" | "restore") => CommunicationResult;
  publish: (channelId: string, title: string, body: string, emailCopy: boolean) => CommunicationResult;
  resetCommunicationsDemo: () => void;
};
const Context = createContext<Value | null>(null);

function readStore(): CommunicationStore {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "null") as CommunicationStore | null;
    if (parsed?.version === 1 && Array.isArray(parsed.mail) && Array.isArray(parsed.announcements)) return parsed;
  } catch { /* Keep the initial demo store. */ }
  return initialCommunicationStore;
}

export function CommunicationsProvider({ children }: { children: React.ReactNode }) {
  const { employees } = useHrDemo();
  const { session } = useSession();
  const account = mailAccount(session, employees);
  const directory = mailDirectory(employees);
  const channels = channelsFor(session, employees);
  const [store, setStore] = useState<CommunicationStore>(initialCommunicationStore);
  const current = useRef(store);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const restored = readStore();
    current.current = restored;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore browser-only demo state after hydration.
    setStore(restored);
    setHydrated(true);
    function sync(event: StorageEvent) {
      if (event.key !== storageKey) return;
      const next = readStore();
      current.current = next;
      setStore(next);
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => { if (hydrated) { const serialized = JSON.stringify(store); if (window.localStorage.getItem(storageKey) !== serialized) window.localStorage.setItem(storageKey, serialized); } }, [hydrated, store]);
  function commit(result: CommunicationResult) {
    if (result.ok) { current.current = result.store; setStore(result.store); }
    return result;
  }
  const value: Value = {
    store, account, directory, channels,
    send: (input) => can(session, "email", "create") ? commit(sendMail(current.current, account, directory, { ...input, id: `MAIL-${crypto.randomUUID()}`, at: demoBusinessNow().toISOString() })) : { ok: false, error: "Không có quyền gửi thư." },
    saveDraft: (input) => can(session, "email", "create") ? commit(saveMailDraft(current.current, account, { ...input, id: `DRAFT-${crypto.randomUUID()}`, at: demoBusinessNow().toISOString() })) : { ok: false, error: "Không có quyền lưu bản nháp." },
    changeMail: (id, action) => can(session, "email", "edit") ? commit(changeMail(current.current, account, id, action)) : { ok: false, error: "Không có quyền thao tác thư." },
    publish: (channelId, title, body, emailCopy) => {
      const channel = channels.find((item) => item.id === channelId);
      return channel ? commit(publishAnnouncement(current.current, session, account, channel, directory, { id: `ANN-${crypto.randomUUID()}`, title, body, emailCopy, at: demoBusinessNow().toISOString() })) : { ok: false, error: "Kênh thông báo không còn khả dụng." };
    },
    resetCommunicationsDemo: () => { current.current = initialCommunicationStore; setStore(initialCommunicationStore); window.localStorage.setItem(storageKey, JSON.stringify(initialCommunicationStore)); },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useCommunications() {
  const value = useContext(Context);
  if (!value) throw new Error("useCommunications must be used within CommunicationsProvider");
  return value;
}
