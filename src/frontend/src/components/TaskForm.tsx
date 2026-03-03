import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Variant_Weekly_Daily_Custom } from "../backend.d";
import type { Task } from "../backend.d";
import type { TaskFormData } from "../hooks/useQueries";
import { today } from "../hooks/useQueries";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

export function TaskForm({
  task,
  onSubmit,
  onCancel,
  isPending,
}: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [timeOfDay, setTimeOfDay] = useState(task?.timeOfDay ?? "09:00");
  const [repeatType, setRepeatType] = useState<Variant_Weekly_Daily_Custom>(
    task?.repeatType ?? Variant_Weekly_Daily_Custom.Daily,
  );
  const [repeatDays, setRepeatDays] = useState<number[]>(
    task?.repeatDays.map((d) => Number(d)) ?? [],
  );
  const [repeatInterval, setRepeatInterval] = useState(
    task?.repeatInterval ? Number(task.repeatInterval) : 2,
  );
  const [startDate, setStartDate] = useState(task?.startDate ?? today());
  const [endDate, setEndDate] = useState(task?.endDate ?? "");
  const [titleError, setTitleError] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setTimeOfDay(task.timeOfDay);
      setRepeatType(task.repeatType);
      setRepeatDays(task.repeatDays.map((d) => Number(d)));
      setRepeatInterval(Number(task.repeatInterval));
      setStartDate(task.startDate);
      setEndDate(task.endDate ?? "");
    }
  }, [task]);

  const toggleDay = (day: number) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError("Task title is required");
      return;
    }
    setTitleError("");

    const data: TaskFormData = {
      title: title.trim(),
      description: description.trim(),
      timeOfDay,
      repeatType,
      repeatDays: repeatDays.map((d) => BigInt(d)),
      repeatInterval: BigInt(repeatInterval),
      startDate,
      endDate: endDate.trim() || null,
    };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="task-title" className="text-sm font-semibold">
          Task Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="task-title"
          data-ocid="task_form.title.input"
          placeholder="e.g. Morning meditation"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (e.target.value.trim()) setTitleError("");
          }}
          autoFocus
          className="h-11"
        />
        {titleError && (
          <p
            className="text-xs text-destructive"
            data-ocid="task_form.title.error_state"
          >
            {titleError}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="task-description" className="text-sm font-semibold">
          Description{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="task-description"
          data-ocid="task_form.description.textarea"
          placeholder="Add notes about this habit..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="resize-none min-h-[80px]"
        />
      </div>

      {/* Time */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="task-time" className="text-sm font-semibold">
          Time
        </Label>
        <Input
          id="task-time"
          data-ocid="task_form.time.input"
          type="time"
          value={timeOfDay}
          onChange={(e) => setTimeOfDay(e.target.value)}
          className="h-11"
        />
      </div>

      {/* Repeat Type */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-semibold">Repeat</Label>
        <div
          className="grid grid-cols-3 gap-1.5 p-1 bg-muted rounded-xl"
          data-ocid="task_form.repeat_type.select"
        >
          {(
            [
              Variant_Weekly_Daily_Custom.Daily,
              Variant_Weekly_Daily_Custom.Weekly,
              Variant_Weekly_Daily_Custom.Custom,
            ] as Variant_Weekly_Daily_Custom[]
          ).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setRepeatType(type)}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${
                repeatType === type
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly day picker */}
      {repeatType === Variant_Weekly_Daily_Custom.Weekly && (
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold">Days of Week</Label>
          <div className="grid grid-cols-7 gap-1">
            {DAY_LABELS.map((day, idx) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(idx)}
                className={`flex flex-col items-center justify-center aspect-square rounded-lg text-xs font-semibold transition-all ${
                  repeatDays.includes(idx)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {day[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom interval */}
      {repeatType === Variant_Weekly_Daily_Custom.Custom && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="repeat-interval" className="text-sm font-semibold">
            Every how many days?
          </Label>
          <div className="flex items-center gap-3">
            <Input
              id="repeat-interval"
              type="number"
              min={1}
              max={365}
              value={repeatInterval}
              onChange={(e) =>
                setRepeatInterval(
                  Math.max(1, Number.parseInt(e.target.value) || 1),
                )
              }
              className="h-11 w-28"
            />
            <span className="text-muted-foreground text-sm">days</span>
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="start-date" className="text-sm font-semibold">
            Start Date
          </Label>
          <Input
            id="start-date"
            data-ocid="task_form.start_date.input"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-11"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="end-date" className="text-sm font-semibold">
            End Date{" "}
            <span className="text-muted-foreground font-normal">(opt)</span>
          </Label>
          <Input
            id="end-date"
            data-ocid="task_form.end_date.input"
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-11"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-11"
          onClick={onCancel}
          data-ocid="task_form.cancel_button"
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 h-11 font-semibold"
          disabled={isPending}
          data-ocid="task_form.save_button"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : task ? (
            "Update Task"
          ) : (
            "Add Task"
          )}
        </Button>
      </div>
    </form>
  );
}
