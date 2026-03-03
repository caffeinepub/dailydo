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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Clock, ListTodo, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Task } from "../backend.d";
import { Variant_Weekly_Daily_Custom } from "../backend.d";
import {
  useAllTasks,
  useDeleteTask,
  useUpdateTaskActive,
} from "../hooks/useQueries";
import { TaskSheet } from "./TaskSheet";

const REPEAT_LABEL: Record<Variant_Weekly_Daily_Custom, string> = {
  [Variant_Weekly_Daily_Custom.Daily]: "Daily",
  [Variant_Weekly_Daily_Custom.Weekly]: "Weekly",
  [Variant_Weekly_Daily_Custom.Custom]: "Custom",
};

const REPEAT_COLOR: Record<Variant_Weekly_Daily_Custom, string> = {
  [Variant_Weekly_Daily_Custom.Daily]: "bg-primary/10 text-primary",
  [Variant_Weekly_Daily_Custom.Weekly]: "bg-accent/20 text-accent-foreground",
  [Variant_Weekly_Daily_Custom.Custom]:
    "bg-secondary text-secondary-foreground",
};

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h < 12 ? "AM" : "PM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

interface TaskRowProps {
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggleActive: (task: Task, active: boolean) => void;
  isToggling: boolean;
}

function TaskRow({
  task,
  index,
  onEdit,
  onDelete,
  onToggleActive,
  isToggling,
}: TaskRowProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: "hidden" }}
      transition={{ duration: 0.2 }}
      className={`flex items-center gap-3 p-4 bg-card rounded-xl border transition-all ${
        !task.isActive
          ? "opacity-60 border-border"
          : "border-border hover:border-primary/20"
      }`}
      data-ocid={`tasks.item.${index}`}
    >
      {/* Left bar */}
      <div
        className={`shrink-0 w-1 h-10 rounded-full ${
          task.isActive ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className={`font-semibold text-sm truncate ${!task.isActive ? "line-through text-muted-foreground" : "text-foreground"}`}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTime(task.timeOfDay)}
          </span>
          <span
            className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md font-medium ${REPEAT_COLOR[task.repeatType]}`}
          >
            <RefreshCw className="h-2.5 w-2.5" />
            {REPEAT_LABEL[task.repeatType]}
          </span>
          {task.endDate && (
            <span className="text-xs text-muted-foreground">
              Until {task.endDate}
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <Switch
          checked={task.isActive}
          onCheckedChange={(val) => onToggleActive(task, val)}
          disabled={isToggling}
          aria-label="Toggle task active"
          data-ocid={`tasks.toggle.${index}`}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(task)}
          data-ocid={`tasks.edit_button.${index}`}
          aria-label="Edit task"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(task)}
          data-ocid={`tasks.delete_button.${index}`}
          aria-label="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

export function TasksScreen() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [deletingTask, setDeletingTask] = useState<Task | undefined>();

  const { data: tasks = [], isLoading } = useAllTasks();
  const deleteTask = useDeleteTask();
  const updateActive = useUpdateTaskActive();

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

  const handleToggleActive = async (task: Task, isActive: boolean) => {
    try {
      await updateActive.mutateAsync({ task: { ...task, isActive }, isActive });
    } catch {
      toast.error("Failed to update task");
    }
  };

  const activeTasks = tasks.filter((t) => t.isActive);
  const pausedTasks = tasks.filter((t) => !t.isActive);
  const sortedTasks = [...activeTasks, ...pausedTasks];

  return (
    <>
      <div className="flex flex-col min-h-full">
        {/* Header */}
        <header className="px-5 pt-6 pb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              All Tasks
            </p>
            <h1 className="text-2xl font-display font-bold text-foreground">
              My Tasks
            </h1>
          </div>
          <Button
            onClick={() => {
              setEditingTask(undefined);
              setSheetOpen(true);
            }}
            className="h-10 gap-1.5 font-semibold"
            data-ocid="tasks.add_button"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </header>

        {/* Stats bar */}
        {!isLoading && tasks.length > 0 && (
          <div className="px-5 pb-4">
            <div className="flex gap-3">
              <div className="flex-1 py-3 px-4 bg-card rounded-xl border text-center">
                <p className="text-2xl font-display font-bold text-primary">
                  {activeTasks.length}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Active</p>
              </div>
              <div className="flex-1 py-3 px-4 bg-card rounded-xl border text-center">
                <p className="text-2xl font-display font-bold text-muted-foreground">
                  {pausedTasks.length}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Paused</p>
              </div>
              <div className="flex-1 py-3 px-4 bg-card rounded-xl border text-center">
                <p className="text-2xl font-display font-bold text-foreground">
                  {tasks.length}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Total</p>
              </div>
            </div>
          </div>
        )}

        {/* Task list */}
        <section className="flex-1 px-5 pb-24 flex flex-col gap-2.5">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </>
          ) : tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center gap-3 py-16 text-center"
              data-ocid="tasks.empty_state"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ListTodo className="h-8 w-8 text-primary" />
              </div>
              <p className="font-display font-bold text-lg text-foreground">
                No tasks yet
              </p>
              <p className="text-sm text-muted-foreground">
                Tap "Add Task" to create your first habit
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {sortedTasks.map((task, i) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  index={i + 1}
                  onEdit={(t) => {
                    setEditingTask(t);
                    setSheetOpen(true);
                  }}
                  onDelete={setDeletingTask}
                  onToggleActive={handleToggleActive}
                  isToggling={updateActive.isPending}
                />
              ))}
            </AnimatePresence>
          )}
        </section>
      </div>

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
