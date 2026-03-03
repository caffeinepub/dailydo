import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import type { Task } from "../backend.d";
import type { TaskFormData } from "../hooks/useQueries";
import { useCreateTask, useUpdateTask } from "../hooks/useQueries";
import { TaskForm } from "./TaskForm";

interface TaskSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
}

export function TaskSheet({ open, onOpenChange, task }: TaskSheetProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const isPending = createTask.isPending || updateTask.isPending;

  const handleSubmit = async (data: TaskFormData) => {
    try {
      if (task) {
        await updateTask.mutateAsync({ id: task.id, data });
        toast.success("Task updated!");
      } else {
        await createTask.mutateAsync(data);
        toast.success("Task created!");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] rounded-t-2xl px-0"
        data-ocid="task_form.dialog"
      >
        <SheetHeader className="px-5 pb-3 border-b border-border">
          <SheetTitle className="text-lg font-display font-bold">
            {task ? "Edit Task" : "New Task"}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(92dvh-60px)]">
          <div className="px-5 py-4">
            <TaskForm
              task={task}
              onSubmit={handleSubmit}
              onCancel={() => onOpenChange(false)}
              isPending={isPending}
            />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
