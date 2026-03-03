import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Bell, ChevronRight, Info, LogOut, Palette, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type Theme = "light" | "dark" | "system";

function truncatePrincipal(p: string) {
  if (p.length <= 20) return p;
  return `${p.slice(0, 10)}…${p.slice(-6)}`;
}

function applyTheme(theme: Theme) {
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

export function SettingsScreen() {
  const { identity, clear } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "";

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("dailydo-theme") as Theme) || "system";
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return Notification.permission === "granted";
  });

  useEffect(() => {
    localStorage.setItem("dailydo-theme", theme);
    applyTheme(theme);
  }, [theme]);

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === "granted");
    } else {
      setNotificationsEnabled(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          Preferences
        </p>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Settings
        </h1>
      </header>

      <div className="flex-1 px-5 pb-24 flex flex-col gap-5">
        {/* Account Section */}
        <section className="bg-card rounded-xl border overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Account
            </span>
          </div>
          <div className="p-4 flex flex-col gap-4">
            {principal && (
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">
                  Internet Identity Principal
                </Label>
                <p className="text-sm font-mono font-medium text-foreground break-all">
                  {truncatePrincipal(principal)}
                </p>
              </div>
            )}
            <Separator />
            <Button
              variant="destructive"
              className="w-full h-11 font-semibold gap-2"
              onClick={clear}
              data-ocid="settings.logout_button"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="bg-card rounded-xl border overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Appearance
            </span>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold text-foreground">
                  Theme
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose your preferred appearance
                </p>
              </div>
              <Select
                value={theme}
                onValueChange={(val) => setTheme(val as Theme)}
              >
                <SelectTrigger
                  className="w-32 h-9"
                  data-ocid="settings.theme.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-card rounded-xl border overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Notifications
            </span>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label
                  htmlFor="notifications-toggle"
                  className="text-sm font-semibold text-foreground"
                >
                  Task Reminders
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {Notification.permission === "denied"
                    ? "Blocked in browser settings"
                    : "Get notified at task time"}
                </p>
              </div>
              <Switch
                id="notifications-toggle"
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
                disabled={Notification.permission === "denied"}
                data-ocid="settings.notifications.toggle"
              />
            </div>
            {Notification.permission === "denied" && (
              <p className="text-xs text-destructive mt-3">
                Notifications are blocked. Enable them in your browser settings
                to receive task reminders.
              </p>
            )}
          </div>
        </section>

        {/* About Section */}
        <section className="bg-card rounded-xl border overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              About
            </span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">App Name</span>
              <span className="text-sm font-semibold text-foreground">
                DailyDo
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Version</span>
              <span className="text-sm font-semibold text-foreground">
                1.0.0
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Platform</span>
              <span className="text-sm font-semibold text-foreground">
                Internet Computer
              </span>
            </div>
          </div>
        </section>

        {/* PWA Install hint */}
        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/15">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Install as App
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Open in Chrome → tap menu → "Add to Home Screen"
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </div>
    </div>
  );
}
