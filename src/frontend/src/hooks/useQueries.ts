import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Variant_Weekly_Daily_Custom } from "../backend.d";
import type { Task } from "../backend.d";
import { useActor } from "./useActor";

export const today = () => new Date().toISOString().split("T")[0];

// ─── Query keys ──────────────────────────────────────────────────────────────

export const QUERY_KEYS = {
  tasksForDate: (date: string) => ["tasksForDate", date],
  completionsForDate: (date: string) => ["completionsForDate", date],
  allTasks: ["allTasks"],
  streakInfo: ["streakInfo"],
  weeklyStats: ["weeklyStats"],
  monthlyTaskStats: ["monthlyTaskStats"],
  completionsForRange: (start: string, end: string) => [
    "completionsForRange",
    start,
    end,
  ],
};

// ─── Today screen queries ─────────────────────────────────────────────────────

export function useTasksForDate(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: QUERY_KEYS.tasksForDate(date),
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTasksForDate(date);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCompletionsForDate(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: QUERY_KEYS.completionsForDate(date),
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCompletionsForDate(date);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── All tasks ────────────────────────────────────────────────────────────────

export function useAllTasks() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: QUERY_KEYS.allTasks,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTasks();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Streak & stats ───────────────────────────────────────────────────────────

export function useStreakInfo() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: QUERY_KEYS.streakInfo,
    queryFn: async () => {
      if (!actor) return { currentStreak: BigInt(0), longestStreak: BigInt(0) };
      return actor.getStreakInfo();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useWeeklyStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: QUERY_KEYS.weeklyStats,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWeeklyStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMonthlyTaskStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: QUERY_KEYS.monthlyTaskStats,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMonthlyTaskStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCompletionsForRange(startDate: string, endDate: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: QUERY_KEYS.completionsForRange(startDate, endDate),
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCompletionsForRange(startDate, endDate);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Task mutations ───────────────────────────────────────────────────────────

export interface TaskFormData {
  title: string;
  description: string;
  timeOfDay: string;
  repeatType: Variant_Weekly_Daily_Custom;
  repeatDays: bigint[];
  repeatInterval: bigint;
  startDate: string;
  endDate: string | null;
}

export function useCreateTask() {
  const { actor } = useActor();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: TaskFormData) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createTask(
        data.title,
        data.description,
        data.timeOfDay,
        data.repeatType,
        data.repeatDays,
        data.repeatInterval,
        data.startDate,
        data.endDate,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.allTasks });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.tasksForDate(today()) });
    },
  });
}

export function useUpdateTask() {
  const { actor } = useActor();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TaskFormData }) => {
      if (!actor) throw new Error("Not authenticated");
      const result = await actor.updateTask(
        id,
        data.title,
        data.description,
        data.timeOfDay,
        data.repeatType,
        data.repeatDays,
        data.repeatInterval,
        data.startDate,
        data.endDate,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.allTasks });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.tasksForDate(today()) });
    },
  });
}

export function useDeleteTask() {
  const { actor } = useActor();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not authenticated");
      const result = await actor.deleteTask(id);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.allTasks });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.tasksForDate(today()) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.streakInfo });
    },
  });
}

export function useMarkTaskComplete() {
  const { actor } = useActor();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, date }: { taskId: string; date: string }) => {
      if (!actor) throw new Error("Not authenticated");
      const result = await actor.markTaskComplete(taskId, date);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async ({ taskId, date }) => {
      // Optimistic update — add the completion
      await qc.cancelQueries({ queryKey: QUERY_KEYS.completionsForDate(date) });
      const prev = qc.getQueryData(QUERY_KEYS.completionsForDate(date));
      qc.setQueryData(
        QUERY_KEYS.completionsForDate(date),
        (
          old:
            | { taskId: string; completionDate: string; completedAt: bigint }[]
            | undefined,
        ) => {
          const completions = old || [];
          if (completions.some((c) => c.taskId === taskId)) return completions;
          return [
            ...completions,
            { taskId, completionDate: date, completedAt: BigInt(Date.now()) },
          ];
        },
      );
      return { prev };
    },
    onError: (_err, { date }, ctx) => {
      if (ctx?.prev !== undefined) {
        qc.setQueryData(QUERY_KEYS.completionsForDate(date), ctx.prev);
      }
    },
    onSettled: (_data, _err, { date }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.completionsForDate(date) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.streakInfo });
    },
  });
}

export function useUnmarkTaskComplete() {
  const { actor } = useActor();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, date }: { taskId: string; date: string }) => {
      if (!actor) throw new Error("Not authenticated");
      const result = await actor.unmarkTaskComplete(taskId, date);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async ({ taskId, date }) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.completionsForDate(date) });
      const prev = qc.getQueryData(QUERY_KEYS.completionsForDate(date));
      qc.setQueryData(
        QUERY_KEYS.completionsForDate(date),
        (old: { taskId: string }[] | undefined) => {
          return (old || []).filter((c) => c.taskId !== taskId);
        },
      );
      return { prev };
    },
    onError: (_err, { date }, ctx) => {
      if (ctx?.prev !== undefined) {
        qc.setQueryData(QUERY_KEYS.completionsForDate(date), ctx.prev);
      }
    },
    onSettled: (_data, _err, { date }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.completionsForDate(date) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.streakInfo });
    },
  });
}

export function useUpdateTaskActive() {
  const { actor } = useActor();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      task,
      isActive,
    }: { task: Task; isActive: boolean }) => {
      if (!actor) throw new Error("Not authenticated");
      const result = await actor.updateTask(
        task.id,
        task.title,
        task.description,
        task.timeOfDay,
        task.repeatType,
        task.repeatDays,
        task.repeatInterval,
        task.startDate,
        task.endDate ?? null,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return { ...result.ok, isActive };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.allTasks });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.tasksForDate(today()) });
    },
  });
}

export { Variant_Weekly_Daily_Custom };
