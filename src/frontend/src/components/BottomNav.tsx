import { BarChart3, CheckSquare, ListTodo, Settings } from "lucide-react";
import { motion } from "motion/react";

type Screen = "today" | "tasks" | "stats" | "settings";

const NAV_ITEMS: {
  id: Screen;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  ocid: string;
}[] = [
  { id: "today", label: "Today", icon: CheckSquare, ocid: "nav.today.link" },
  { id: "tasks", label: "Tasks", icon: ListTodo, ocid: "nav.tasks.link" },
  { id: "stats", label: "Stats", icon: BarChart3, ocid: "nav.stats.link" },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    ocid: "nav.settings.link",
  },
];

interface BottomNavProps {
  active: Screen;
  onChange: (screen: Screen) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur-md border-t border-border pb-safe">
      <div className="flex items-center max-w-lg mx-auto px-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon, ocid }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              data-ocid={ocid}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Icon
                className={`h-5 w-5 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-[10px] font-semibold transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export type { Screen };
