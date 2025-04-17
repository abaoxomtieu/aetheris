import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, formatString: string = "MMM d, yyyy"): string {
  if (!date) return "";
  return format(new Date(date), formatString);
}

export const statusColors: Record<string, { bg: string, text: string, border: string }> = {
  "in_progress": {
    bg: "#DBEAFE",  // Vibrant blue background
    text: "#2563EB", // Bold blue text
    border: "#60A5FA" // Blue border
  },
  "completed": {
    bg: "#D1FAE5",  // Vibrant green background
    text: "#059669", // Bold green text
    border: "#34D399" // Green border
  },
  "pending_review": {
    bg: "#FEF3C7",  // Light yellow background
    text: "#D97706", // Bold amber text
    border: "#FBBF24" // Yellow border
  },
  "review": {
    bg: "#FEF3C7",  // Light yellow background (for backward compatibility)
    text: "#D97706", // Bold amber text
    border: "#FBBF24" // Yellow border
  },
  "reviewed": {
    bg: "#BFDBFE",  // Vibrant cyan background
    text: "#1D4ED8", // Bold sky blue text
    border: "#3B82F6" // Blue border
  },
  "not_started": {
    bg: "#F3F4F6",  // Light gray background
    text: "#4B5563", // Bold gray text
    border: "#9CA3AF" // Gray border
  },
  "cancelled": {
    bg: "#FEE2E2",  // Light red background
    text: "#DC2626", // Bold red text
    border: "#F87171" // Red border
  },
  "draft": {
    bg: "#F5F5F4",  // Light neutral background
    text: "#57534E", // Bold stone text
    border: "#A8A29E" // Stone border
  },
  "pending_confirmed": {
    bg: "#E0E7FF",  // Vibrant indigo background
    text: "#4F46E5", // Bold indigo text
    border: "#818CF8" // Indigo border
  },
  "confirmed": {
    bg: "#DBEAFE",  // Vibrant blue background
    text: "#2563EB", // Bold blue text
    border: "#60A5FA" // Blue border
  },
  "rejected": {
    bg: "#FFE4E6",  // Light rose background
    text: "#BE123C", // Bold rose text
    border: "#FB7185" // Rose border
  },
  "approved": {
    bg: "#CFFAFE",  // Vibrant cyan background
    text: "#0891B2", // Bold cyan text
    border: "#22D3EE" // Cyan border
  }
};

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function getEventTypeIcon(eventType: string): string {
  switch (eventType) {
    case "promotion":
      return "award";
    case "career_start":
      return "briefcase";
    case "achievement":
      return "trophy";
    case "goal":
      return "flag";
    case "review":
      return "eye";
    default:
      return "star";
  }
}

export function calculateCompletionPercentage(goals: any[]): number {
  if (!goals || goals.length === 0) return 0;
  
  // Calculate the average progress across all goals
  const totalProgress = goals.reduce((sum, goal) => sum + goal.progress, 0);
  return Math.round(totalProgress / goals.length);
}
