import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, TrendingUp, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import {
  useCompletionsForRange,
  useMonthlyTaskStats,
  useStreakInfo,
  useWeeklyStats,
} from "../hooks/useQueries";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDateRange(daysBack: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

function getDayAbbr(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────

interface BarChartProps {
  data: { date: string; completed: number; total: number }[];
}

function BarChart({ data }: BarChartProps) {
  const chartH = 120;
  const barWidth = 28;
  const gap = 10;
  const chartW = data.length * (barWidth + gap) - gap;

  return (
    <div className="overflow-x-auto">
      <svg
        width={chartW + 24}
        height={chartH + 36}
        className="block mx-auto"
        aria-label="Weekly progress bar chart"
        role="img"
      >
        {/* Y axis lines */}
        {[0, 50, 100].map((pct) => (
          <g key={pct}>
            <line
              x1={0}
              y1={chartH - (pct / 100) * chartH}
              x2={chartW + 24}
              y2={chartH - (pct / 100) * chartH}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
            <text
              x={-2}
              y={chartH - (pct / 100) * chartH + 4}
              fontSize={9}
              fill="currentColor"
              fillOpacity={0.4}
              textAnchor="end"
            >
              {pct}%
            </text>
          </g>
        ))}

        {data.map((bar, i) => {
          const pct = bar.total === 0 ? 0 : (bar.completed / bar.total) * 100;
          const barH = Math.max(4, (pct / 100) * chartH);
          const x = i * (barWidth + gap) + 14;
          const y = chartH - barH;

          const fill =
            pct === 100
              ? "oklch(0.62 0.17 145)"
              : pct > 0
                ? "oklch(0.78 0.14 85)"
                : "oklch(0.577 0.245 27.325)";

          return (
            <g key={bar.date} data-ocid={`stats.chart_point.${i + 1}`}>
              {/* Background bar */}
              <rect
                x={x}
                y={0}
                width={barWidth}
                height={chartH}
                rx={6}
                fill="currentColor"
                fillOpacity={0.06}
              />
              {/* Filled bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={6}
                fill={fill}
              />
              {/* Day label */}
              <text
                x={x + barWidth / 2}
                y={chartH + 18}
                fontSize={10}
                fill="currentColor"
                fillOpacity={0.6}
                textAnchor="middle"
                fontWeight="600"
              >
                {getDayAbbr(bar.date)}
              </text>
              {/* Pct label on hover */}
              {pct > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  fontSize={8}
                  fill="currentColor"
                  fillOpacity={0.6}
                  textAnchor="middle"
                >
                  {Math.round(pct)}%
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Calendar Heatmap ────────────────────────────────────────────────────────

const DOW_HEADERS = ["M", "T", "W", "T", "F", "S", "S"];

interface CalendarProps {
  completionsByDate: Map<string, { completed: number; total: number }>;
  year: number;
  month: number; // 0-based
}

function CalendarHeatmap({ completionsByDate, year, month }: CalendarProps) {
  const firstDay = new Date(year, month, 1);
  // Monday-first offset (Mon=0..Sun=6)
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DOW_HEADERS.map((h) => (
          <div
            key={h}
            className="text-center text-xs font-semibold text-muted-foreground py-1"
          >
            {h}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) {
            // biome-ignore lint/suspicious/noArrayIndexKey: calendar grid positions are positional
            return <div key={idx} className="aspect-square" />;
          }
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const stat = completionsByDate.get(dateStr);
          const pct = stat && stat.total > 0 ? stat.completed / stat.total : 0;
          const isToday = dateStr === today;
          const isFuture = dateStr > today;

          let bg = "bg-muted";
          if (!isFuture && stat?.total) {
            if (pct === 1) bg = "bg-success";
            else if (pct > 0) bg = "bg-warning";
            else bg = "bg-destructive/40";
          }

          return (
            <div
              key={dateStr}
              title={`${dateStr}: ${stat ? `${stat.completed}/${stat.total}` : "no data"}`}
              className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-semibold transition-all ${bg} ${
                isToday
                  ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                  : ""
              } ${isFuture ? "opacity-30" : ""}`}
            >
              <span
                className={
                  pct === 1 && !isFuture
                    ? "text-success-foreground"
                    : "text-foreground/70"
                }
              >
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Stats Screen ────────────────────────────────────────────────────────

export function StatsScreen() {
  const { data: streak, isLoading: streakLoading } = useStreakInfo();
  const { data: weekly = [], isLoading: weeklyLoading } = useWeeklyStats();
  const { data: monthly = [], isLoading: monthlyLoading } =
    useMonthlyTaskStats();

  const now = new Date();
  const { start: rangeStart, end: rangeEnd } = getDateRange(30);
  const { data: rangeCompletions = [] } = useCompletionsForRange(
    rangeStart,
    rangeEnd,
  );

  // Build completions-by-date map for heatmap
  const completionsByDate = useMemo(() => {
    const map = new Map<string, { completed: number; total: number }>();
    // Use weekly stats for what we have
    for (const w of weekly) {
      map.set(w.date, {
        completed: Number(w.completed),
        total: Number(w.total),
      });
    }
    // Also compute from range completions (group by date)
    const completionDates = new Map<string, Set<string>>();
    for (const c of rangeCompletions) {
      const set = completionDates.get(c.completionDate) || new Set();
      set.add(c.taskId);
      completionDates.set(c.completionDate, set);
    }
    return map;
  }, [weekly, rangeCompletions]);

  // Sort weekly data chronologically
  const sortedWeekly = useMemo(
    () =>
      [...weekly]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((w) => ({
          date: w.date,
          completed: Number(w.completed),
          total: Number(w.total),
        })),
    [weekly],
  );

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          Analytics
        </p>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Your Progress
        </h1>
      </header>

      <section className="flex-1 px-5 pb-24">
        <Tabs defaultValue="overview">
          <TabsList className="w-full mb-5 h-11">
            <TabsTrigger
              value="overview"
              className="flex-1 text-sm font-semibold"
              data-ocid="stats.overview.tab"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="by-task"
              className="flex-1 text-sm font-semibold"
              data-ocid="stats.by_task.tab"
            >
              By Task
            </TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ── */}
          <TabsContent value="overview" className="flex flex-col gap-5">
            {/* Streak cards */}
            {streakLoading ? (
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-2 p-4 bg-card rounded-xl border"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-streak/15 flex items-center justify-center">
                      <Flame className="h-4 w-4 text-streak" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Current
                    </span>
                  </div>
                  <p className="text-3xl font-display font-bold text-streak">
                    {Number(streak?.currentStreak ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">day streak</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="flex flex-col gap-2 p-4 bg-card rounded-xl border"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Trophy className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Best
                    </span>
                  </div>
                  <p className="text-3xl font-display font-bold text-primary">
                    {Number(streak?.longestStreak ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">day record</p>
                </motion.div>
              </div>
            )}

            {/* Bar chart */}
            <div className="bg-card rounded-xl border p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="font-display font-bold text-sm">Last 7 Days</h3>
              </div>
              {weeklyLoading ? (
                <Skeleton className="h-40 w-full rounded-lg" />
              ) : sortedWeekly.length === 0 ? (
                <div className="h-40 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">No data yet</p>
                </div>
              ) : (
                <BarChart data={sortedWeekly} />
              )}
              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 justify-center flex-wrap">
                {[
                  { color: "bg-success", label: "100%" },
                  { color: "bg-warning", label: "Partial" },
                  { color: "bg-destructive/40", label: "Missed" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-sm ${l.color}`} />
                    <span className="text-xs text-muted-foreground">
                      {l.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar heatmap */}
            <div className="bg-card rounded-xl border p-4">
              <h3 className="font-display font-bold text-sm mb-1">
                {now.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Monthly completion heatmap
              </p>
              <CalendarHeatmap
                completionsByDate={completionsByDate}
                year={now.getFullYear()}
                month={now.getMonth()}
              />
              <div className="flex items-center gap-4 mt-3 justify-center flex-wrap">
                {[
                  { color: "bg-success", label: "All done" },
                  { color: "bg-warning", label: "Partial" },
                  { color: "bg-destructive/40", label: "Missed" },
                  { color: "bg-muted", label: "No tasks" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-sm ${l.color}`} />
                    <span className="text-xs text-muted-foreground">
                      {l.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── By Task Tab ── */}
          <TabsContent value="by-task" className="flex flex-col gap-3">
            {monthlyLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </>
            ) : monthly.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center gap-3 py-16 text-center"
                data-ocid="stats.by_task.empty_state"
              >
                <p className="font-display font-bold text-lg text-foreground">
                  No task data yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Complete tasks to see per-task analytics
                </p>
              </div>
            ) : (
              monthly.map((stat, i) => {
                const pct =
                  Number(stat.totalDays) === 0
                    ? 0
                    : Math.round(
                        (Number(stat.completedDays) / Number(stat.totalDays)) *
                          100,
                      );
                return (
                  <motion.div
                    key={stat.taskId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex flex-col gap-2.5 p-4 bg-card rounded-xl border"
                    data-ocid={`stats.item.${i + 1}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm truncate pr-2 text-foreground">
                        {stat.taskTitle}
                      </p>
                      <span
                        className={`text-sm font-bold shrink-0 ${
                          pct >= 80
                            ? "text-success"
                            : pct >= 50
                              ? "text-warning"
                              : "text-destructive"
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {Number(stat.completedDays)} / {Number(stat.totalDays)}{" "}
                      days in last 30 days
                    </p>
                  </motion.div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
