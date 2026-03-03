import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  Flame,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Task } from "../backend.d";
import { Variant_Weekly_Daily_Custom } from "../backend.d";
import {
  today,
  useCompletionsForDate,
  useDeleteTask,
  useMarkTaskComplete,
  useStreakInfo,
  useTasksForDate,
  useUnmarkTaskComplete,
} from "../hooks/useQueries";
import { TaskSheet } from "./TaskSheet";

const REPEAT_LABEL: Record<Variant_Weekly_Daily_Custom, string> = {
  [Variant_Weekly_Daily_Custom.Daily]: "Daily",
  [Variant_Weekly_Daily_Custom.Weekly]: "Weekly",
  [Variant_Weekly_Daily_Custom.Custom]: "Custom",
};

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h < 12 ? "AM" : "PM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function ProgressBar({
  completed,
  total,
}: { completed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const allDone = total > 0 && completed === total;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-foreground">
          {completed} / {total} tasks
        </span>
        <span
          className={`font-bold ${allDone ? "text-success" : "text-muted-foreground"}`}
        >
          {pct}%
        </span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${allDone ? "bg-success" : "bg-primary"}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <AnimatePresence>
        {allDone && total > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className="celebrate-pop mt-1 py-3 px-4 rounded-xl bg-success/10 border border-success/20 text-center"
            data-ocid="today.success_state"
          >
            <p className="text-success font-semibold text-sm">
              🎉 All done for today! Amazing work!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  isCompleted: boolean;
  index: number;
  onToggle: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function TaskCard({
  task,
  isCompleted,
  index,
  onToggle,
  onEdit,
  onDelete,
}: TaskCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className={`relative flex items-center gap-3 p-4 bg-card rounded-xl border transition-all ${
        isCompleted
          ? "border-success/30 bg-success/5"
          : "border-border hover:border-primary/20"
      }`}
      data-ocid={`today.task.item.${index}`}
    >
      {/* Left accent bar */}
      <div
        className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-colors ${
          isCompleted ? "bg-success" : "bg-primary/30"
        }`}
      />

      {/* Checkbox */}
      <button
        type="button"
        onClick={onToggle}
        data-ocid={`today.task.checkbox.${index}`}
        aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          isCompleted
            ? "bg-success border-success"
            : "border-muted-foreground/50 hover:border-primary"
        }`}
      >
        <AnimatePresence>
          {isCompleted && (
            <motion.svg
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              role="img"
              aria-label="Completed"
            >
              <title>Completed</title>
              <path
                d="M2 6L5 9L10 3"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </button>

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <p
          className={`font-semibold text-sm truncate transition-all ${
            isCompleted
              ? "line-through text-muted-foreground"
              : "text-foreground"
          }`}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTime(task.timeOfDay)}
          </span>
          <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
            <RefreshCw className="h-2.5 w-2.5" />
            {REPEAT_LABEL[task.repeatType]}
          </span>
        </div>
      </div>

      {/* Three-dot menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            data-ocid={`today.task.edit_button.${index}`}
            aria-label="Task options"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={() => onEdit(task)}
            data-ocid={`today.task.edit_button.${index}`}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(task)}
            className="text-destructive focus:text-destructive"
            data-ocid={`today.task.delete_button.${index}`}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}

export function TodayScreen() {
  const date = today();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [deletingTask, setDeletingTask] = useState<Task | undefined>();

  const { data: tasks = [], isLoading: tasksLoading } = useTasksForDate(date);
  const { data: completions = [], isLoading: completionsLoading } =
    useCompletionsForDate(date);
  const { data: streakInfo } = useStreakInfo();

  const markComplete = useMarkTaskComplete();
  const unmarkComplete = useUnmarkTaskComplete();
  const deleteTask = useDeleteTask();

  const completedIds = new Set(completions.map((c) => c.taskId));

  const handleToggle = async (task: Task) => {
    const isCompleted = completedIds.has(task.id);
    if (isCompleted) {
      await unmarkComplete.mutateAsync({ taskId: task.id, date });
    } else {
      await markComplete.mutateAsync({ taskId: task.id, date });
    }
  };

  const handleDelete = async () => {
    if (!deletingTask) return;
    try {
      await deleteTask.mutateAsync(deletingTask.id);
      toast.success("Task deleted");
      setDeletingTask(undefined);
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const isLoading = tasksLoading || completionsLoading;

  return (
    <>
      <div className="flex flex-col min-h-full">
        {/* Header */}
        <header className="px-5 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Today
              </p>
              <h1 className="text-2xl font-display font-bold text-foreground leading-tight">
                {formatDate(new Date())}
              </h1>
            </div>
            {streakInfo && Number(streakInfo.currentStreak) > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-2 bg-streak/10 rounded-xl border border-streak/20"
              >
                <Flame className="h-4 w-4 text-streak" />
                <span className="text-streak font-bold text-sm">
                  {Number(streakInfo.currentStreak)}
                </span>
              </motion.div>
            )}
          </div>
        </header>

        {/* Progress */}
        <section className="px-5 pb-5">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full rounded-full" />
            </div>
          ) : (
            <ProgressBar completed={completedIds.size} total={tasks.length} />
          )}
        </section>

        {/* Task list */}
        <section className="flex-1 px-5 pb-24 flex flex-col gap-2.5">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </>
          ) : tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center gap-3 py-16 text-center"
              data-ocid="today.empty_state"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <p className="font-display font-bold text-lg text-foreground">
                No tasks for today
              </p>
              <p className="text-sm text-muted-foreground">
                Tap the + button to add your first habit
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {tasks.map((task, i) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isCompleted={completedIds.has(task.id)}
                  index={i + 1}
                  onToggle={() => handleToggle(task)}
                  onEdit={(t) => {
                    setEditingTask(t);
                    setSheetOpen(true);
                  }}
                  onDelete={setDeletingTask}
                />
              ))}
            </AnimatePresence>
          )}
        </section>
      </div>

      {/* FAB */}
      <button
        type="button"
        data-ocid="today.add_button"
        onClick={() => {
          setEditingTask(undefined);
          setSheetOpen(true);
        }}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 flex items-center justify-center transition-all z-40"
        aria-label="Add task"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Task Sheet */}
      <TaskSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingTask(undefined);
        }}
        task={editingTask}
      />

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deletingTask}
        onOpenChange={(open) => !open && setDeletingTask(undefined)}
      >
        <AlertDialogContent data-ocid="delete_confirm.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingTask?.title}" and all its
              completion history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="delete_confirm.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="delete_confirm.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
