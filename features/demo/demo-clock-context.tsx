"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { demoBusinessDate, demoBusinessNow, scenarioDate, setDemoClockMode, setDemoScenarioDate } from "@/lib/demo-clock";
import type { DemoClockMode } from "@/lib/demo-clock";

type ClockValue = { mode: DemoClockMode; now: Date; businessDate: string; scenarioDate: string; setMode: (mode: DemoClockMode) => void; setScenarioDate: (date: string) => void };
const ClockContext = createContext<ClockValue | null>(null);
const key = "ohriise-demo-clock-mode-v1";
const dateKey = "ohriise-demo-scenario-date-v1";

export function DemoClockProvider({ children }: { children: React.ReactNode }) {
  const [mode, updateMode] = useState<DemoClockMode>("scenario");
  const [selectedScenarioDate, updateScenarioDate] = useState(scenarioDate);
  const [tick, setTick] = useState(() => new Date());
  useEffect(() => {
    const stored = window.localStorage.getItem(key);
    // Restore the saved mode only after hydration so SSR starts from the same scenario date.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "real" || stored === "scenario") { setDemoClockMode(stored); updateMode(stored); }
    const storedDate = window.localStorage.getItem(dateKey);
    if (storedDate && setDemoScenarioDate(storedDate)) updateScenarioDate(storedDate);
    const timer = window.setInterval(() => setTick(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  function setMode(next: DemoClockMode) {
    setDemoClockMode(next);
    window.localStorage.setItem(key, next);
    updateMode(next);
    setTick(new Date());
  }
  function setScenarioDate(next: string) {
    if (!setDemoScenarioDate(next)) return;
    window.localStorage.setItem(dateKey, next);
    updateScenarioDate(next);
    setTick(new Date());
  }
  const now = mode === "scenario" ? new Date(`${selectedScenarioDate}T${new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(tick)}+07:00`) : tick;
  return <ClockContext.Provider value={{ mode, now, businessDate: mode === "scenario" ? selectedScenarioDate : demoBusinessDate(tick), scenarioDate: selectedScenarioDate, setMode, setScenarioDate }}>{children}</ClockContext.Provider>;
}

export function useDemoClock() {
  const value = useContext(ClockContext);
  if (!value) throw new Error("useDemoClock must be used within DemoClockProvider");
  return value;
}

export { demoBusinessNow };
