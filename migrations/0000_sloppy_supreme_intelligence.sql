CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"goal_id" integer,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"date" timestamp NOT NULL,
	"attachments" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "career_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"event_type" text NOT NULL,
	"date" timestamp NOT NULL,
	"details" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "career_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"success_profiles" json DEFAULT '[]'::json,
	"responsibilities" text[] DEFAULT '{}',
	"key_achievements" text[] DEFAULT '{}',
	"target_users" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedbacks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"goal_id" integer,
	"content" text NOT NULL,
	"source" text NOT NULL,
	"date" timestamp NOT NULL,
	"attachments" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"feedback_goal_status" text DEFAULT 'review'
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"origin" text DEFAULT 'selected' NOT NULL,
	"start_date" timestamp NOT NULL,
	"target_date" timestamp NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"manager_id" integer,
	"attachments" json DEFAULT '[]'::json,
	"comments" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idps" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"roles" text[] DEFAULT '{"Employee","Manager"}',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"title" text NOT NULL,
	"department" text NOT NULL,
	"role" text DEFAULT 'employee' NOT NULL,
	"avatar" text,
	"manager_id" text,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
