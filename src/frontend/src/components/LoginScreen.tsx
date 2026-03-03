import { Button } from "@/components/ui/button";
import { BarChart3, CheckSquare, Flame, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const features = [
  {
    icon: CheckSquare,
    title: "Daily Checklists",
    desc: "Create recurring tasks that auto-populate each day",
  },
  {
    icon: Flame,
    title: "Streak Tracking",
    desc: "Build momentum with daily completion streaks",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "Visualize your habits with charts and a calendar heatmap",
  },
];

export function LoginScreen() {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Top gradient accent */}
      <div
        className="absolute inset-x-0 top-0 h-64 opacity-40 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, oklch(0.55 0.12 265 / 0.3), transparent 70%)",
        }}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        {/* Logo mark */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center mb-6 shadow-lg"
        >
          <CheckSquare className="h-10 w-10 text-primary-foreground" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-display font-black text-foreground tracking-tight mb-2">
            DailyDo
          </h1>
          <p className="text-muted-foreground text-base max-w-xs mx-auto">
            Build better habits one day at a time
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="w-full max-w-sm flex flex-col gap-3 mb-10"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex items-center gap-4 p-3.5 bg-card rounded-xl border border-border"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon className="h-4.5 w-4.5 text-primary h-[18px] w-[18px]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {f.title}
                </p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="w-full max-w-sm"
        >
          <Button
            className="w-full h-14 text-base font-bold rounded-2xl shadow-lg"
            onClick={login}
            disabled={isLoggingIn || isInitializing}
            data-ocid="login.primary_button"
          >
            {isLoggingIn || isInitializing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting…
              </>
            ) : (
              "Sign In to Continue"
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Syncs across all your devices via Internet Identity
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 pb-safe">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Built with ❤️ using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
