import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { 
  type User, 
  type Goal, 
  type GoalFormData,
  type Achievement,
  type AchievementFormData,
  type Feedback,
  type FeedbackFormData,
  type CareerEvent,
  type Idp,
  type InsertIdp
} from "@shared/schema";

// Type for reportee goals data structure
export type ReporteeGoalsData = { user: User; goals: Goal[] };

// User data hooks
export function useUser() {
  return useQuery<User>({
    queryKey: ["/api/user"],
  });
}

export function useUserById(userId: number) {
  return useQuery<User>({
    queryKey: ["/api/users", userId],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(`/api/users/${queryKey[1]}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch user");
      }
      return res.json();
    },
    enabled: !!userId,
  });
}

// Career events hooks
export function useCareerEvents() {
  return useQuery<CareerEvent[]>({
    queryKey: ["/api/career-events"],
  });
}

// Goals hooks
export function useGoals() {
  return useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });
}

export function useGoal(id: number) {
  return useQuery<Goal>({
    queryKey: ["/api/goals", id],
    enabled: !!id,
  });
}

export function useAddGoal() {
  return useMutation({
    mutationFn: async (formData: FormData | GoalFormData) => {
      let res;
      
      if (formData instanceof FormData) {
        // If it's FormData (for file uploads)
        res = await fetch("/api/goals", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
      } else {
        // If it's regular JSON data
        res = await apiRequest("POST", "/api/goals", formData);
      }
      
      if (!res.ok) {
        throw new Error("Failed to add goal");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });
}

export function useUpdateGoal() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Goal> }) => {
      const res = await apiRequest("PUT", `/api/goals/${id}`, data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals", variables.id] });
    },
  });
}

// Achievements hooks
export function useAchievements() {
  return useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });
}

export function useGoalAchievements(goalId: number) {
  return useQuery<Achievement[]>({
    queryKey: ["/api/goals", goalId, "achievements"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(`/api/goals/${queryKey[1]}/achievements`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch achievements");
      }
      return res.json();
    },
    enabled: !!goalId,
  });
}

export function useAddAchievement() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/achievements", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to add achievement");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      // We don't know the goal ID here, so we invalidate all goal achievements
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });
}

// Feedbacks hooks
export function useFeedbacks() {
  return useQuery<Feedback[]>({
    queryKey: ["/api/feedbacks"],
  });
}

export function useGoalFeedbacks(goalId: number) {
  return useQuery<Feedback[]>({
    queryKey: ["/api/goals", goalId, "feedbacks"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(`/api/goals/${queryKey[1]}/feedbacks`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch feedbacks");
      }
      return res.json();
    },
    enabled: !!goalId,
  });
}

export function useAddFeedback() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/feedbacks", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to add feedback");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedbacks"] });
      // We don't know the goal ID here, so we invalidate all goal feedbacks
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });
}

// Manager reportee hooks
export function useReportees() {
  return useQuery<User[]>({
    queryKey: ["/api/reportees"],
  });
}

export function useReporteeGoals() {
  return useQuery<ReporteeGoalsData[]>({
    queryKey: ["/api/reportees/goals"],
  });
}

// IDP hooks
export function useIdps() {
  return useQuery<Idp[]>({
    queryKey: ["/api/idps"],
  });
}

export function useIdpsByCategory(category: string) {
  return useQuery<Idp[]>({
    queryKey: ["/api/idps/category", category],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(`/api/idps/category/${queryKey[1]}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch IDPs by category");
      }
      return res.json();
    },
    enabled: !!category,
  });
}

export function useIdp(id: number) {
  return useQuery<Idp>({
    queryKey: ["/api/idps", id],
    enabled: !!id,
  });
}

export function useAddIdp() {
  return useMutation({
    mutationFn: async (data: InsertIdp) => {
      const res = await apiRequest("POST", "/api/idps", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/idps"] });
    },
  });
}
