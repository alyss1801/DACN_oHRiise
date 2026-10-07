"use client";

import { useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "next-themes";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Toaster } from "sonner";
import { CommandMenu } from "./command-menu";
import { LoginScreen } from "./login-screen";
import { ModuleWorkspace } from "./module-workspace";
import { Sidebar } from "./layout/sidebar";
import { TopBar } from "./layout/top-bar";
import { EmployeeHome } from "@/features/dashboard/employee-home";
import { DemoDataProvider } from "@/features/demo/demo-data-context";
import { ModuleVisualProvider } from "@/features/employee/workspace-frame";
import { SessionProvider, useSession } from "@/features/session/session-context";
import { navigationFor } from "@/lib/navigation";
import { visualForModule } from "@/lib/module-visuals";

export function ProductDemo({ initialModule = "home" }: { initialModule?: string }) {
  const [signedIn, setSignedIn] = useState(false);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <DemoDataProvider>
        <SessionProvider>
          {signedIn ? <AuthenticatedProduct initialModule={initialModule} onSignOut={() => setSignedIn(false)} /> : <LoginScreen onSignIn={() => setSignedIn(true)} />}
          <Toaster theme="light" position="bottom-right" richColors closeButton />
        </SessionProvider>
      </DemoDataProvider>
    </ThemeProvider>
  );
}

function AuthenticatedProduct({ initialModule, onSignOut }: { initialModule: string; onSignOut: () => void }) {
  const { session } = useSession();
  const [activeId, setActiveId] = useState(normalizeModuleId(initialModule));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const visibleItems = useMemo(() => navigationFor(session).flatMap((group) => group.items), [session]);
  const activeTitle = visibleItems.find((item) => item.id === activeId)?.label ?? "Truy cập bị giới hạn";
  const moduleVisual = visualForModule(activeId);

  useEffect(() => {
    // Restore the per-tab shell preference after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebarCollapsed(window.sessionStorage.getItem("ohriise-sidebar-collapsed") === "1");
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    function onPopState() {
      const id = new URLSearchParams(window.location.search).get("module") ?? "home";
      setActiveId(normalizeModuleId(id));
    }
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  function navigate(id: string) {
    const nextId = normalizeModuleId(id);
    setActiveId(nextId);
    const nextUrl = nextId === "home" ? "/" : `/?module=${encodeURIComponent(nextId)}`;
    window.history.pushState({ module: nextId }, "", nextUrl);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current;
      window.sessionStorage.setItem("ohriise-sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className={`app-shell${sidebarCollapsed ? " sidebar-is-collapsed" : ""}`}>
      <Sidebar activeId={activeId} onNavigate={navigate} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} onSignOut={onSignOut} collapsed={sidebarCollapsed} onToggleCollapsed={toggleSidebar} />
      <div className="app-main">
        <TopBar title={activeTitle} visual={moduleVisual} onMenu={() => setMobileOpen(true)} onCommand={() => setCommandOpen(true)} onNavigate={navigate} />
        <main className="page-content">
          <AnimatePresence initial={false}>
            {moduleVisual && !reduceMotion && <motion.div className="module-transition" key={`visual-${activeId}`} aria-hidden="true" initial={{ opacity: 1 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: .14, delay: .48 }}>
              <motion.div className="module-transition-sweep" initial={{ opacity: 0, scaleX: .2 }} animate={{ opacity: [0, .92, 0], scaleX: [0.2, 1, 1.12] }} transition={{ duration: .4, times: [0, .42, 1], ease: "easeOut" }} />
              <motion.div className="module-transition-asset" initial={{ opacity: 0, scale: .94, y: 8 }} animate={{ opacity: [0, 1, 1, 0], scale: [.94, 1, .62, .42], x: [0, 0, "-22vw", "-31vw"], y: [8, 0, -76, -128] }} transition={{ duration: .56, times: [0, .28, .76, 1], ease: [0.2, .75, .25, 1] }}><Image src={moduleVisual.asset} alt="" width={260} height={195} priority /></motion.div>
            </motion.div>}
          </AnimatePresence>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div className="route-stage" key={activeId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: reduceMotion ? 0 : 0.22, delay: moduleVisual && !reduceMotion ? .16 : 0, ease: [0.2, 0.75, 0.25, 1] }}>
              <ModuleVisualProvider moduleId={activeId}>{activeId === "home" ? <EmployeeHome onNavigate={navigate} /> : <ModuleWorkspace moduleId={activeId} onHome={() => navigate("home")} onNavigate={navigate} />}</ModuleVisualProvider>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} onNavigate={navigate} />
    </div>
  );
}

function normalizeModuleId(id: string) {
  if (id === "schedule") return "attendance";
  if (id === "wfh" || id === "leave" || id === "expenses") return "approvals";
  return id;
}
