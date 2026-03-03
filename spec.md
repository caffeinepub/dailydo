# DailyDo

## Current State
Bare project scaffold only -- no App.tsx, no backend, no components. Previous build attempt failed during code generation.

## Requested Changes (Diff)

### Add
- Full Motoko backend with task management and completion tracking
- React frontend PWA with all screens: Today, Tasks, Stats, Settings

**Backend data model:**
- Task: id, owner, title, description, timeOfDay (HH:MM), repeatType (Daily/Weekly/Custom), repeatDays (weekday bitmask), repeatInterval (for custom), startDate, endDate (optional), isActive, createdAt
- TaskCompletion: id, taskId, completionDate (YYYY-MM-DD), completedAt (timestamp)
- StreakInfo: computed from completion history

**Backend API:**
- createTask, updateTask, deleteTask, getTasks
- getTasksForDate(date) -- returns tasks relevant for a given date based on repeat rules
- markTaskComplete(taskId, date), unmarkTaskComplete(taskId, date)
- getCompletionsForDate(date), getCompletionsForRange(startDate, endDate)
- getStreakInfo -- returns currentStreak, longestStreak
- getWeeklyStats -- returns last 7 days completion percentage per day
- getMonthlyStats -- returns per-task completion rate over last 30 days

**Frontend screens:**

1. **Today Screen (Home)** -- animated progress bar (completed/total + %), task list for today with checkbox, task title, scheduled time, repeat badge, edit/delete actions; streak badge in header; "All done!" celebration when 100%

2. **Tasks Screen** -- full task list with add FAB, edit/delete per task, active/paused toggle

3. **Add/Edit Task Screen (modal or sheet)** -- fields: title, description, time picker, repeat type selector (Daily/Weekly/Custom), day-of-week picker for Weekly, interval input for Custom, start date, end date (optional)

4. **Stats Screen** -- two tabs: "Overview" (streak cards, SVG bar chart last 7 days, calendar heatmap) and "By Task" (30-day completion % per task)

5. **Settings Screen** -- notification permission toggle, theme switcher (light/dark/system), account info, logout

- Internet Identity authentication (authorization component)
- PWA manifest and service worker for installability

### Modify
- Nothing (new project)

### Remove
- Nothing

## Implementation Plan
1. Select authorization component
2. Generate Motoko backend with tasks, completions, streak, and stats APIs
3. Build frontend: auth gate, bottom nav, Today/Tasks/Stats/Settings screens, Add/Edit task modal, all wired to backend
4. Deploy
