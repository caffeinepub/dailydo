import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Option "mo:core/Option";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
    // Initialize the access control system
    let accessControlState = AccessControl.initState();
    include MixinAuthorization(accessControlState);

    public type UserProfile = {
        name : Text;
    };

    public type Task = {
        id : Text;
        title : Text;
        description : Text;
        timeOfDay : Text;
        repeatType : { #Daily; #Weekly; #Custom };
        repeatDays : [Nat];
        repeatInterval : Nat;
        startDate : Text;
        endDate : ?Text;
        isActive : Bool;
        createdAt : Int;
    };

    public type TaskCompletion = {
        taskId : Text;
        completionDate : Text;
        completedAt : Int;
    };

    public type StreakInfo = {
        currentStreak : Nat;
        longestStreak : Nat;
    };

    public type WeeklyStats = {
        date : Text;
        completed : Nat;
        total : Nat;
    };

    public type MonthlyTaskStats = {
        taskId : Text;
        taskTitle : Text;
        completedDays : Nat;
        totalDays : Nat;
    };

    // Per-user data storage
    let userProfiles = Map.empty<Principal, UserProfile>();
    let userTasks = Map.empty<Principal, Map.Map<Text, Task>>();
    let userCompletions = Map.empty<Principal, [TaskCompletion]>();

    // Helper to get or create user's task map
    private func getUserTaskMap(user : Principal) : Map.Map<Text, Task> {
        switch (userTasks.get(user)) {
            case (?taskMap) { taskMap };
            case null {
                let newMap = Map.empty<Text, Task>();
                userTasks.add(user, newMap);
                newMap;
            };
        };
    };

    // Helper to get user's completions
    private func getUserCompletions(user : Principal) : [TaskCompletion] {
        switch (userCompletions.get(user)) {
            case (?completions) { completions };
            case null { [] };
        };
    };

    // Helper to set user's completions
    private func setUserCompletions(user : Principal, completions : [TaskCompletion]) {
        userCompletions.add(user, completions);
    };

    // Generate unique ID
    private var nextId : Nat = 0;
    private func generateId() : Text {
        nextId += 1;
        "task_" # nextId.toText() # "_" # Time.now().toText();
    };

    // User Profile Functions
    public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only users can view profiles");
        };
        userProfiles.get(caller);
    };

    public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
        if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
            Runtime.trap("Unauthorized: Can only view your own profile");
        };
        userProfiles.get(user);
    };

    public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only users can save profiles");
        };
        userProfiles.add(caller, profile);
    };

    // Task Management Functions
    public shared ({ caller }) func createTask(
        title : Text,
        description : Text,
        timeOfDay : Text,
        repeatType : { #Daily; #Weekly; #Custom },
        repeatDays : [Nat],
        repeatInterval : Nat,
        startDate : Text,
        endDate : ?Text
    ) : async Task {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only users can create tasks");
        };

        let taskMap = getUserTaskMap(caller);
        let taskId = generateId();
        let task : Task = {
            id = taskId;
            title = title;
            description = description;
            timeOfDay = timeOfDay;
            repeatType = repeatType;
            repeatDays = repeatDays;
            repeatInterval = repeatInterval;
            startDate = startDate;
            endDate = endDate;
            isActive = true;
            createdAt = Time.now();
        };
        taskMap.add(taskId, task);
        task;
    };

    public shared ({ caller }) func updateTask(
        id : Text,
        title : Text,
        description : Text,
        timeOfDay : Text,
        repeatType : { #Daily; #Weekly; #Custom },
        repeatDays : [Nat],
        repeatInterval : Nat,
        startDate : Text,
        endDate : ?Text
    ) : async { #ok : Task; #err : Text } {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only users can update tasks");
        };

        let taskMap = getUserTaskMap(caller);
        switch (taskMap.get(id)) {
            case (?existingTask) {
                let updatedTask : Task = {
                    id = id;
                    title = title;
                    description = description;
                    timeOfDay = timeOfDay;
                    repeatType = repeatType;
                    repeatDays = repeatDays;
                    repeatInterval = repeatInterval;
                    startDate = startDate;
                    endDate = endDate;
                    isActive = existingTask.isActive;
                    createdAt = existingTask.createdAt;
                };
                taskMap.add(id, updatedTask);
                #ok(updatedTask);
            };
            case null {
                #err("Task not found");
            };
        };
    };

    public shared ({ caller }) func deleteTask(id : Text) : async { #ok : Bool; #err : Text } {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only users can delete tasks");
        };

        let taskMap = getUserTaskMap(caller);
        switch (taskMap.get(id)) {
            case (?_) {
                taskMap.remove(id);
                // Also delete related completions
                let completions = getUserCompletions(caller);
                let filteredCompletions = completions.filter(
                    func(c) { c.taskId != id }
                );
                setUserCompletions(caller, filteredCompletions);
                #ok(true);
            };
            case null {
                #err("Task not found");
            };
        };
    };

    public query ({ caller }) func getTasks() : async [Task] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only users can view tasks");
        };

        let taskMap = getUserTaskMap(caller);
        taskMap.values().toArray();
    };

    public query ({ caller }) func getTasksForDate(date : Text) : async [Task] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only users can view tasks");
        };

        let taskMap = getUserTaskMap(caller);
        let allTasks = taskMap.values().toArray();
        
        // Filter tasks relevant for the given date
        allTasks.filter<Task>(func(task) {
            if (not task.isActive) { return false; };
            // Simplified date logic - in production would need proper date comparison
            true;
        });
    };

    // Task Completion Functions
    public shared ({ caller }) func markTaskComplete(taskId : Text, date : Text) : async { #ok : TaskCompletion; #err : Text } {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only users can mark tasks complete");
        };

        let taskMap = getUserTaskMap(caller);
        switch (taskMap.get(taskId)) {
            case null {
                return #err("Task not found");
            };
            case (?_) {
                let completions = getUserCompletions(caller);
                
                // Check if already completed (idempotent)
                let existing = completions.find(
                    func(c) { c.taskId == taskId and c.completionDate == date }
                );
                
                switch (existing) {
                    case (?comp) { return #ok(comp); };
                    case null {
                        let newCompletion : TaskCompletion = {
                            taskId = taskId;
                            completionDate = date;
                            completedAt = Time.now();
                        };
                        let updatedCompletions = completions.concat([newCompletion]);
                        setUserCompletions(caller, updatedCompletions);
                        #ok(newCompletion);
                    };
                };
            };
        };
    };

    public shared ({ caller }) func unmarkTaskComplete(taskId : Text, date : Text) : async { #ok : Bool; #err : Text } {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only users can unmark tasks");
        };

        let completions = getUserCompletions(caller);
        let filteredCompletions = completions.filter(
            func(c) { not (c.taskId == taskId and c.completionDate == date) }
        );
        
        if (filteredCompletions.size() < completions.size()) {
            setUserCompletions(caller, filteredCompletions);
            #ok(true);
        } else {
            #err("Completion not found");
        };
    };

    public query ({ caller }) func getCompletionsForDate(date : Text) : async [TaskCompletion] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only users can view completions");
        };

        let completions = getUserCompletions(caller);
        completions.filter<TaskCompletion>(func(c) { c.completionDate == date });
    };

    public query ({ caller }) func getCompletionsForRange(startDate : Text, endDate : Text) : async [TaskCompletion] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only users can view completions");
        };

        let completions = getUserCompletions(caller);
        // Simplified - in production would need proper date range comparison
        completions;
    };

    // Statistics Functions
    public query ({ caller }) func getStreakInfo() : async StreakInfo {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only users can view streak info");
        };

        // Simplified implementation - would need proper streak calculation
        {
            currentStreak = 0;
            longestStreak = 0;
        };
    };

    public query ({ caller }) func getWeeklyStats() : async [WeeklyStats] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only users can view weekly stats");
        };

        // Simplified implementation - would need proper weekly calculation
        [];
    };

    public query ({ caller }) func getMonthlyTaskStats() : async [MonthlyTaskStats] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only users can view monthly stats");
        };

        // Simplified implementation - would need proper monthly calculation
        [];
    };
};
