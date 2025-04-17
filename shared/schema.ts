import { pgTable, text, serial, integer, boolean, timestamp, json, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define user roles
export const userRoleEnum = [
  "employee",
  "manager",
  "hr",
  "admin"
] as const;

export type UserRole = typeof userRoleEnum[number];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  role: text("role", { enum: userRoleEnum }).notNull().default("employee"),
  avatar: text("avatar"),
  managerId: text("manager_id"), // Lowercase for consistent PostgreSQL column naming
});

// Define valid goal status options
export const goalStatusEnum = [
  "draft",
  "pending_confirmed",
  "confirmed",
  "in_progress",
  "pending_review", 
  "reviewed",
  "approved",
  "rejected",
  "completed"
] as const;

// Define goal origin options
export const goalOriginEnum = [
  "Self",
  "Manager"
] as const;

export type GoalStatus = typeof goalStatusEnum[number];
export type GoalOrigin = typeof goalOriginEnum[number];

export type GoalComment = {
  text: string;
  timestamp: Date;
};

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  origin: text("origin").notNull().default("selected"),
  startDate: timestamp("start_date").notNull(),
  targetDate: timestamp("target_date").notNull(),
  status: text("status").notNull().default("draft"),
  progress: integer("progress").notNull().default(0),
  managerId: integer("manager_id"), // Optional field to track which manager assigned this goal
  attachments: json("attachments").$type<string[]>().default([]),
  comments: json("comments").$type<GoalComment[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  goalId: integer("goal_id"),  // This field is optional
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  attachments: json("attachments").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const feedbacks = pgTable("feedbacks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  goalId: integer("goal_id"),  // This field is optional
  content: text("content").notNull(),
  source: text("source").notNull(),
  date: timestamp("date").notNull(),
  attachments: json("attachments").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  feedbackGoalStatus: text("feedback_goal_status").default("review"),
});

// Define valid career event types
export const careerEventTypeEnum = [
  "career_start",
  "promotion",
  "planned_promotion",
  "role_change",
  "department_change",
  "other"
] as const;

export type CareerEventType = typeof careerEventTypeEnum[number];

// Define the shape of details in career events
export type CareerEventDetails = {
  responsibilities?: string[];
  achievements?: string[];
  quote?: string;
};

export const careerEvents = pgTable("career_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  eventType: text("event_type", { enum: careerEventTypeEnum }).notNull(),
  date: timestamp("date").notNull(),
  details: json("details").$type<CareerEventDetails>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas with zodResolver for forms
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAchievementSchema = createInsertSchema(achievements).omit({ id: true, createdAt: true });
export const insertFeedbackSchema = createInsertSchema(feedbacks).omit({ id: true, createdAt: true });
export const insertCareerEventSchema = createInsertSchema(careerEvents).omit({ id: true, createdAt: true });

// Export types for use in application
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type Feedback = typeof feedbacks.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

export type CareerEvent = typeof careerEvents.$inferSelect;
export type InsertCareerEvent = z.infer<typeof insertCareerEventSchema>;

// Additional schemas for form validation
export const goalFormSchema = insertGoalSchema.extend({
  startDate: z.coerce.date(),
  targetDate: z.coerce.date(),
  origin: z.enum(goalOriginEnum),
});

export type GoalFormData = z.infer<typeof goalFormSchema>;

// Edit Goal schema for progress updates and comments
export const goalEditSchema = z.object({
  progress: z.number().min(0).max(100),
  comment: z.string().optional(),
});

export type GoalEditData = z.infer<typeof goalEditSchema>;

export const achievementFormSchema = insertAchievementSchema.extend({
  date: z.coerce.date(),
});

export type AchievementFormData = z.infer<typeof achievementFormSchema>;

export const feedbackFormSchema = insertFeedbackSchema.extend({
  date: z.coerce.date(),
});

export type FeedbackFormData = z.infer<typeof feedbackFormSchema>;

// Define IDP Category enum
export const idpCategoryEnum = [
  "Experience",
  "Exposure",
  "Education"
] as const;

export type IdpCategory = typeof idpCategoryEnum[number];

// Define IDP Role enum
export const idpRoleEnum = [
  "Employee",
  "Manager"
] as const;

export type IdpRole = typeof idpRoleEnum[number];

// IDP table (Individual Development Plan)
export const idps = pgTable("idps", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category", { enum: idpCategoryEnum }).notNull(),
  description: text("description"),
  roles: text("roles", { enum: idpRoleEnum }).array().default(["Employee", "Manager"]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertIdpSchema = createInsertSchema(idps).omit({ id: true, createdAt: true });

export type Idp = typeof idps.$inferSelect;
export type InsertIdp = z.infer<typeof insertIdpSchema>;

// Career Roles Table
export const careerRoles = pgTable("career_roles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  successProfiles: json("success_profiles").$type<number[]>().default([]),
  responsibilities: text("responsibilities").array().default([]),
  keyAchievements: text("key_achievements").array().default([]),
  targetUsers: json("target_users").$type<number[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCareerRoleSchema = createInsertSchema(careerRoles).omit({ id: true, createdAt: true });

export type CareerRole = typeof careerRoles.$inferSelect;
export type InsertCareerRole = z.infer<typeof insertCareerRoleSchema>;
