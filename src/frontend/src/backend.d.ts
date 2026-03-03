import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface WeeklyStats {
    total: bigint;
    date: string;
    completed: bigint;
}
export interface StreakInfo {
    longestStreak: bigint;
    currentStreak: bigint;
}
export interface TaskCompletion {
    completedAt: bigint;
    completionDate: string;
    taskId: string;
}
export interface Task {
    id: string;
    repeatDays: Array<bigint>;
    title: string;
    repeatType: Variant_Weekly_Daily_Custom;
    endDate?: string;
    repeatInterval: bigint;
    createdAt: bigint;
    description: string;
    isActive: boolean;
    timeOfDay: string;
    startDate: string;
}
export interface MonthlyTaskStats {
    completedDays: bigint;
    taskTitle: string;
    totalDays: bigint;
    taskId: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_Weekly_Daily_Custom {
    Weekly = "Weekly",
    Daily = "Daily",
    Custom = "Custom"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createTask(title: string, description: string, timeOfDay: string, repeatType: Variant_Weekly_Daily_Custom, repeatDays: Array<bigint>, repeatInterval: bigint, startDate: string, endDate: string | null): Promise<Task>;
    deleteTask(id: string): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompletionsForDate(date: string): Promise<Array<TaskCompletion>>;
    getCompletionsForRange(startDate: string, endDate: string): Promise<Array<TaskCompletion>>;
    getMonthlyTaskStats(): Promise<Array<MonthlyTaskStats>>;
    getStreakInfo(): Promise<StreakInfo>;
    getTasks(): Promise<Array<Task>>;
    getTasksForDate(date: string): Promise<Array<Task>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWeeklyStats(): Promise<Array<WeeklyStats>>;
    isCallerAdmin(): Promise<boolean>;
    markTaskComplete(taskId: string, date: string): Promise<{
        __kind__: "ok";
        ok: TaskCompletion;
    } | {
        __kind__: "err";
        err: string;
    }>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    unmarkTaskComplete(taskId: string, date: string): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateTask(id: string, title: string, description: string, timeOfDay: string, repeatType: Variant_Weekly_Daily_Custom, repeatDays: Array<bigint>, repeatInterval: bigint, startDate: string, endDate: string | null): Promise<{
        __kind__: "ok";
        ok: Task;
    } | {
        __kind__: "err";
        err: string;
    }>;
}
