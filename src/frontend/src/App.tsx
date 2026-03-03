import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { BottomNav, type Screen } from "./components/BottomNav";
import { LoginScreen } from "./components/LoginScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { StatsScreen } from "./components/StatsScreen";
import { TasksScreen } from "./components/TasksScreen";
import { TodayScreen } from "./components/TodayScreen";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

// Apply stored theme on mount
function applyStoredTheme() {
  const theme = localStorage.getItem("dailydo-theme") || "system";
  const root = document.documentElement;
  if (theme === "system") {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    root.classList.toggle("dark", prefersDark);
  } else {
    root.classList.toggle("dark", theme === "dark");
  }
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [activeScreen, setActiveScreen] = useState<Screen>("today");

  // Apply theme on mount
  useEffect(() => {
    applyStoredTheme();

    // Listen to system preference changes
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const theme = localStorage.getItem("dailydo-theme") || "system";
      if (theme === "system") applyStoredTheme();
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Loading state
  if (isInitializing) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading DailyDo…</p>
        </div>
      </div>
    );
  }

  // Auth gate
  if (!identity) {
    return (
      <>
        <LoginScreen />
        <Toaster richColors position="top-center" />
      </>
    );
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case "today":
        return <TodayScreen />;
      case "tasks":
        return <TasksScreen />;
      case "stats":
        return <StatsScreen />;
      case "settings":
        return <SettingsScreen />;
    }
  };

  return (
    <>
      <div className="min-h-dvh bg-background max-w-lg mx-auto relative">
        <main className="pb-20">{renderScreen()}</main>
        <BottomNav active={activeScreen} onChange={setActiveScreen} />
      </div>
      <Toaster richColors position="top-center" />

      {/* Footer (only visible on wider screens in settings) */}
      <div className="hidden">
        <footer>
          <p>
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Built with ❤️ using caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}
