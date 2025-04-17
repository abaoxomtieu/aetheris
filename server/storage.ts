import { 
  users, type User, type InsertUser,
  goals, type Goal, type InsertGoal,
  achievements, type Achievement, type InsertAchievement,
  feedbacks, type Feedback, type InsertFeedback,
  careerEvents, type CareerEvent, type InsertCareerEvent,
  idps, type Idp, type InsertIdp,
  careerRoles, type CareerRole, type InsertCareerRole
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";

const scryptAsync = promisify(scrypt);

// Function to hash passwords for user creation
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getReportsByManagerId(managerId: number): Promise<User[]>;
  
  // Goal operations
  getGoals(userId: number): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
  getReporteeGoals(managerId: number): Promise<{ user: User; goals: Goal[] }[]>;
  
  // Achievement operations
  getAchievements(userId: number): Promise<Achievement[]>;
  getAchievementsByGoal(goalId: number): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  
  // Feedback operations
  getFeedbacks(userId: number): Promise<Feedback[]>;
  getFeedbacksByGoal(goalId: number): Promise<Feedback[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  
  // Career event operations
  getCareerEvents(userId: number): Promise<CareerEvent[]>;
  createCareerEvent(event: InsertCareerEvent): Promise<CareerEvent>;
  
  // IDP operations
  getIdps(): Promise<Idp[]>;
  getIdpsByCategory(category: string): Promise<Idp[]>;
  getIdp(id: number): Promise<Idp | undefined>;
  createIdp(idp: InsertIdp): Promise<Idp>;
  
  // Career Role operations
  getCareerRoles(): Promise<CareerRole[]>;
  getCareerRole(id: number): Promise<CareerRole | undefined>;
  createCareerRole(role: InsertCareerRole): Promise<CareerRole>;
  
  // Session store for authentication
  sessionStore: session.Store;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private goals: Map<number, Goal>;
  private achievements: Map<number, Achievement>;
  private feedbacks: Map<number, Feedback>;
  private careerEvents: Map<number, CareerEvent>;
  
  // Session store for authentication
  public sessionStore: session.Store;
  
  // Counters for generating IDs
  private userCounter: number;
  private goalCounter: number;
  private achievementCounter: number;
  private feedbackCounter: number;
  private careerEventCounter: number;
  
  constructor() {
    this.users = new Map();
    this.goals = new Map();
    this.achievements = new Map();
    this.feedbacks = new Map();
    this.careerEvents = new Map();
    
    // Initialize memory store for sessions
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    this.userCounter = 1;
    this.goalCounter = 1;
    this.achievementCounter = 1;
    this.feedbackCounter = 1;
    this.careerEventCounter = 1;
    
    // Initialize with dummy data
    this.initializeDummyData();
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "employee", // Default role to employee
      avatar: insertUser.avatar || null 
    };
    this.users.set(id, user);
    return user;
  }
  
  // Goal operations
  async getGoals(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values())
      .filter(goal => goal.userId === userId)
      .sort((a, b) => new Date(b.targetDate).getTime() - new Date(a.targetDate).getTime());
  }
  
  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }
  
  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = this.goalCounter++;
    const now = new Date();
    const goal: Goal = {
      ...insertGoal,
      id,
      createdAt: now,
      updatedAt: now,
      status: insertGoal.status || "draft",
      progress: insertGoal.progress || 0,
      origin: insertGoal.origin || "self", // Default origin to 'self'
      attachments: insertGoal.attachments || null,
      comments: insertGoal.comments || null
    };
    this.goals.set(id, goal);
    return goal;
  }
  
  async updateGoal(id: number, updates: Partial<Goal>): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;
    
    const updatedGoal: Goal = {
      ...goal,
      ...updates,
      updatedAt: new Date(),
    };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }
  
  async deleteGoal(id: number): Promise<boolean> {
    return this.goals.delete(id);
  }
  
  // Achievement operations
  async getAchievements(userId: number): Promise<Achievement[]> {
    return Array.from(this.achievements.values())
      .filter(achievement => achievement.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async getAchievementsByGoal(goalId: number): Promise<Achievement[]> {
    return Array.from(this.achievements.values())
      .filter(achievement => achievement.goalId === goalId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const id = this.achievementCounter++;
    const achievement: Achievement = {
      ...insertAchievement,
      id,
      createdAt: new Date(),
      goalId: insertAchievement.goalId || null,
      attachments: insertAchievement.attachments || null
    };
    this.achievements.set(id, achievement);
    return achievement;
  }
  
  // Feedback operations
  async getFeedbacks(userId: number): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values())
      .filter(feedback => feedback.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async getFeedbacksByGoal(goalId: number): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values())
      .filter(feedback => feedback.goalId === goalId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const id = this.feedbackCounter++;
    const feedback: Feedback = {
      ...insertFeedback,
      id,
      createdAt: new Date(),
      goalId: insertFeedback.goalId || null,
      attachments: insertFeedback.attachments || null
    };
    this.feedbacks.set(id, feedback);
    return feedback;
  }
  
  // Career event operations
  async getCareerEvents(userId: number): Promise<CareerEvent[]> {
    return Array.from(this.careerEvents.values())
      .filter((event) => event.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async createCareerEvent(insertEvent: InsertCareerEvent): Promise<CareerEvent> {
    const id = this.careerEventCounter++;
    const event: CareerEvent = {
      ...insertEvent,
      id,
      createdAt: new Date(),
      details: insertEvent.details || {},
      description: insertEvent.description || null
    };
    this.careerEvents.set(id, event);
    return event;
  }
  
  // Manager-specific operations
  async getReportsByManagerId(managerId: number): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.managerId === managerId);
  }
  
  async getReporteeGoals(managerId: number): Promise<{ user: User; goals: Goal[] }[]> {
    const reportees = await this.getReportsByManagerId(managerId);
    const result: { user: User; goals: Goal[] }[] = [];
    
    for (const reportee of reportees) {
      const goals = await this.getGoals(reportee.id);
      result.push({ user: reportee, goals });
    }
    
    return result;
  }
  
  // IDP operations
  async getIdps(): Promise<Idp[]> {
    // For MemStorage, this method would fetch IDPs from the database directly
    // Since we're just implementing interface compatibility, we'll return an empty array
    return [];
  }
  
  async getIdpsByCategory(category: string): Promise<Idp[]> {
    // For MemStorage, this would filter IDPs by category
    // Since we're just implementing interface compatibility, we'll return an empty array
    return [];
  }
  
  async getIdp(id: number): Promise<Idp | undefined> {
    // For MemStorage, this would return a specific IDP
    // Since we're just implementing interface compatibility, we'll return undefined
    return undefined;
  }
  
  async createIdp(idp: InsertIdp): Promise<Idp> {
    // For MemStorage, this would create a new IDP
    // Since we're just implementing interface compatibility, we'll throw an error
    throw new Error("IDPs can only be created in the database storage");
  }
  
  // Career Role operations
  async getCareerRoles(): Promise<CareerRole[]> {
    // For MemStorage, this method would fetch Career Roles from the database directly
    // Since we're just implementing interface compatibility, we'll return an empty array
    return [];
  }
  
  async getCareerRole(id: number): Promise<CareerRole | undefined> {
    // For MemStorage, this would return a specific Career Role
    // Since we're just implementing interface compatibility, we'll return undefined
    return undefined;
  }
  
  async createCareerRole(role: InsertCareerRole): Promise<CareerRole> {
    // For MemStorage, this would create a new Career Role
    // Since we're just implementing interface compatibility, we'll throw an error
    throw new Error("Career Roles can only be created in the database storage");
  }
  
  // Initialize with dummy data for demonstration
  private initializeDummyData() {
    // Create sample users with different roles
    const users: Partial<User>[] = [
      {
        id: this.userCounter++,
        username: "johndoe",
        // Using a pre-hashed password for 'password123'
        password: "efe83936d47a5c1e71a9f901d3aba0bcc4c0996f2e88a552bd04d27c9cb69ed81bb4b79ce0db38c63a5f4356adfb3d102d38f52347f8671c457c8e7a7a53abfe.d19841878db2cd67c016290326cfcd16",
        fullName: "John Doe",
        title: "Global Learning Head",
        department: "Learning & Development",
        role: "admin", // Admin role
        avatar: null,
      },
      {
        id: this.userCounter++,
        username: "manager",
        // Using a pre-hashed password for 'manager123'
        password: "8e1c6cfb8cb63937428d586ee62ad6a8ab07bc7fa1b68c12348f7d37c53196cb6d21e24fbceeeb620cc90a769cdb33f9eebad80361f3e91cd78f91db3e34c87a.1bc467b68e9fa28a1a9ae0e0eba395da",
        fullName: "Sarah Manager",
        title: "Regional Manager",
        department: "Learning & Development",
        role: "manager", // Manager role
        avatar: null,
      },
      {
        id: this.userCounter++,
        username: "employee",
        // Using a pre-hashed password for 'employee123'
        password: "cdb0bc32a7cf252fa6da2e6254702ef72872da1f0f0a31183b48ff4d30aadcce9b5abe3211fb9fe1f15f67ee79bb86551755dcb0b545a004fd3538906f22b5bc.1c92f31a3de46be67c074595a64f29fc",
        fullName: "Alex Employee",
        title: "Learning Specialist",
        department: "Learning & Development",
        role: "employee", // Employee role
        avatar: null,
      },
      {
        id: this.userCounter++,
        username: "hr",
        // Using a pre-hashed password for 'hr123'
        password: "bd8bcefb9818c4056c8a5fa5bea98e58a71ec5ea1c29b2521244cb33e8e9f3e5f08da4ba8861b8d2cdd8deca59c1c30ff5424cdce0fd8c389a8d83f5b47c9f2c.b3d98a27ad41b14b8eaed6e4c8b803f4",
        fullName: "Taylor HR",
        title: "HR Specialist",
        department: "Human Resources",
        role: "hr", // HR role
        avatar: null,
      }
    ];

    // Add all users to the map
    users.forEach(user => {
      if (user.id) {
        this.users.set(user.id, user as User);
      }
    });

    // Use the first user (admin) for the rest of the data
    const user = users[0] as User;
    
    // Create career progression events
    const careerEvents: InsertCareerEvent[] = [
      {
        userId: user.id,
        title: "Joined as Team Lead",
        description: "Started journey with the company as a Learning & Development team lead",
        eventType: "career_start",
        date: new Date("2020-01-15"),
        details: {
          responsibilities: [
            "Led team of 5 L&D specialists",
            "Responsible for new hire training programs",
            "Developed leadership onboarding curriculum"
          ],
          quote: "Excited to start my journey with this amazing company and contribute to developing our talent."
        }
      },
      {
        userId: user.id,
        title: "Promotion to Learning & Development Director",
        description: "Promoted to lead the APAC region's learning and development initiatives",
        eventType: "promotion",
        date: new Date("2022-06-15"),
        details: {
          responsibilities: [
            "Led learning strategy for 8 countries in APAC",
            "Managed team of 12 L&D specialists",
            "$1.2M annual budget responsibility"
          ],
          achievements: [
            "Reduced training costs by 22% while improving outcomes",
            "Launched virtual training platform with 95% adoption",
            "Recipient of 'Innovation in L&D' company award"
          ]
        }
      },
      {
        userId: user.id,
        title: "Promotion to Global Learning Head",
        description: "Took on leadership of worldwide learning initiatives and strategy",
        eventType: "promotion",
        date: new Date("2025-01-15"),
        details: {
          achievements: [
            "Led global learning initiative across 12 countries",
            "Improved training effectiveness by 35%",
            "Developed new leadership curriculum"
          ]
        }
      }
    ];
    
    careerEvents.forEach(event => {
      const id = this.careerEventCounter++;
      this.careerEvents.set(id, {
        ...event,
        id,
        createdAt: new Date(),
        details: event.details || {},
        description: event.description || null
      });
    });
    
    // Create goals with different statuses
    const goals: InsertGoal[] = [
      {
        userId: user.id,
        title: "Leadership Development Program",
        description: "Design and implement a comprehensive leadership development program for senior managers across departments",
        category: "Leadership",
        startDate: new Date("2022-06-01"),
        targetDate: new Date("2022-11-15"),
        status: "completed",
        progress: 100,
      },
      {
        userId: user.id,
        title: "Cross-Functional Training Framework",
        description: "Develop a comprehensive cross-functional training framework to improve team versatility and operational flexibility",
        category: "Training",
        startDate: new Date("2021-05-01"),
        targetDate: new Date("2021-12-31"),
        status: "pending_review",
        progress: 85,
      },
      {
        userId: user.id,
        title: "Global Mentorship Program",
        description: "Design and launch a global mentorship program to connect leaders across regions",
        category: "Leadership",
        startDate: new Date("2024-05-15"),
        targetDate: new Date("2025-03-31"),
        status: "in_progress",
        progress: 60,
      },
      {
        userId: user.id,
        title: "Digital Learning Platform Implementation",
        description: "Implement a new digital learning platform to support remote and hybrid training delivery",
        category: "Technical Skills",
        startDate: new Date("2024-11-01"),
        targetDate: new Date("2025-02-15"),
        status: "confirmed",
        progress: 40,
      },
      {
        userId: user.id,
        title: "Executive Coaching Certification",
        description: "Obtain professional certification in executive coaching to enhance leadership development capabilities",
        category: "Professional Development",
        startDate: new Date("2023-05-15"),
        targetDate: new Date("2023-12-15"),
        status: "draft",
        progress: 10,
      },
      {
        userId: user.id,
        title: "Learning Analytics Dashboard",
        description: "Develop a comprehensive dashboard to track learning outcomes and ROI across all training programs",
        category: "Project Management",
        startDate: new Date("2023-04-01"),
        targetDate: new Date("2023-08-31"),
        status: "approved",
        progress: 95,
      }
    ];
    
    goals.forEach(goal => {
      const id = this.goalCounter++;
      const now = new Date();
      this.goals.set(id, {
        ...goal,
        id,
        createdAt: now,
        updatedAt: now,
        status: goal.status || "draft",
        progress: goal.progress || 0,
        origin: goal.origin || "self", // Default origin to 'self'
        attachments: goal.attachments || null,
        comments: goal.comments || null
      });
    });
    
    // Add some achievements
    const achievements: InsertAchievement[] = [
      // Recent achievements (last 30 days)
      {
        userId: user.id,
        goalId: 3,
        title: "Global Mentorship Program Launch",
        description: "Successfully launched the first phase of the global mentorship program with 50 participants",
        date: new Date(new Date().setDate(new Date().getDate() - 5)), // 5 days ago
        attachments: ["Mentorship_Program_Launch.pdf"],
      },
      {
        userId: user.id,
        goalId: 4,
        title: "Digital Learning Platform Assessment",
        description: "Completed vendor assessment for the new digital learning platform",
        date: new Date(new Date().setDate(new Date().getDate() - 15)), // 15 days ago
        attachments: ["Vendor_Assessment.xlsx"],
      },
      {
        userId: user.id,
        goalId: 6,
        title: "Analytics Dashboard Prototype",
        description: "Developed initial prototype of the learning analytics dashboard",
        date: new Date(new Date().setDate(new Date().getDate() - 25)), // 25 days ago
        attachments: ["Dashboard_Prototype.png"],
      },
      
      // Quarterly achievements (last 90 days but more than 30 days ago)
      {
        userId: user.id,
        goalId: 5,
        title: "Coaching Framework Documentation",
        description: "Created comprehensive documentation for the executive coaching framework",
        date: new Date(new Date().setDate(new Date().getDate() - 45)), // 45 days ago
        attachments: ["Coaching_Framework.pdf"],
      },
      {
        userId: user.id,
        goalId: 3,
        title: "Mentorship Program Design",
        description: "Finalized design of the global mentorship program structure and guidelines",
        date: new Date(new Date().setDate(new Date().getDate() - 70)), // 70 days ago
        attachments: ["Mentorship_Guidelines.pdf"],
      },
      
      // Yearly achievements (more than 90 days ago)
      {
        userId: user.id,
        goalId: 1,
        title: "Leadership Program Development",
        description: "Completed the design phase of the leadership program with excellent feedback",
        date: new Date("2022-08-15"),
        attachments: ["Leadership_Program_v1.pdf"],
      },
      {
        userId: user.id,
        goalId: 1,
        title: "Program Implementation",
        description: "Successfully rolled out the leadership program to all senior managers",
        date: new Date("2022-11-10"),
        attachments: ["Program_Evaluation.pdf"],
      },
      {
        userId: user.id,
        goalId: 2,
        title: "Cross-Functional Framework Blueprint",
        description: "Developed comprehensive blueprint for the cross-functional training framework",
        date: new Date("2021-07-22"),
        attachments: ["CF_Training_Blueprint.pdf"],
      }
    ];
    
    achievements.forEach(achievement => {
      const id = this.achievementCounter++;
      this.achievements.set(id, {
        ...achievement,
        id,
        createdAt: new Date(),
        goalId: achievement.goalId || null,
        attachments: achievement.attachments || null
      });
    });
    
    // Add some feedbacks
    const feedbacks: InsertFeedback[] = [
      // Recent feedback (last 30 days)
      {
        userId: user.id,
        goalId: 3,
        content: "The mentorship program launch exceeded our expectations. John's leadership in this initiative has been exemplary.",
        source: "Emily Rodriguez, VP of Talent Management",
        date: new Date(new Date().setDate(new Date().getDate() - 3)), // 3 days ago
        attachments: ["Mentorship_Feedback.pdf"],
      },
      {
        userId: user.id,
        goalId: 4,
        content: "The vendor assessment for the digital learning platform was thorough and well-structured. Looking forward to the implementation phase.",
        source: "David Williams, CTO",
        date: new Date(new Date().setDate(new Date().getDate() - 12)), // 12 days ago
        attachments: [],
      },
      
      // Quarterly feedback (last 90 days but more than 30 days ago)
      {
        userId: user.id,
        goalId: 6,
        content: "The learning analytics dashboard prototype shows great promise. The executive team is excited about the potential insights we'll gain.",
        source: "Jennifer Lee, CEO",
        date: new Date(new Date().setDate(new Date().getDate() - 40)), // 40 days ago
        attachments: ["Dashboard_Feedback.pdf"],
      },
      {
        userId: user.id,
        goalId: 5,
        content: "The executive coaching framework documentation is comprehensive. This will be a valuable resource for our leadership development initiatives.",
        source: "Robert Chen, Board Member",
        date: new Date(new Date().setDate(new Date().getDate() - 65)), // 65 days ago
        attachments: [],
      },
      
      // Yearly feedback (more than 90 days ago)
      {
        userId: user.id,
        goalId: 1,
        content: "John's leadership program has transformed our management approach. The content was exceptional and the delivery was outstanding.",
        source: "Sarah Johnson, Chief Operations Officer",
        date: new Date("2022-11-20"),
        attachments: ["Leadership_Feedback.pdf"],
      },
      {
        userId: user.id,
        goalId: 2,
        content: "The cross-functional training framework shows great promise. Looking forward to the final version.",
        source: "Michael Chen, HR Director",
        date: new Date("2021-09-10"),
        attachments: [],
      }
    ];
    
    feedbacks.forEach(feedback => {
      const id = this.feedbackCounter++;
      this.feedbacks.set(id, {
        ...feedback,
        id,
        createdAt: new Date(),
        goalId: feedback.goalId || null,
        attachments: feedback.attachments || null
      });
    });
  }
}

// Database storage implementation using Drizzle ORM
export class DatabaseStorage implements IStorage {
  // Session store for authentication
  public sessionStore: session.Store;
  
  constructor() {
    // Initialize PostgreSQL session store
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      // Use the DATABASE_URL environment variable provided by Replit
      conObject: {
        connectionString: "postgresql://postgres:250203@localhost:5432/aetheris_1",
      },
      createTableIfMissing: true,
      tableName: 'session',
    })
  }
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<Usx3er> {
    // Ensure role is set with a default value of "employee"
    const userToInsert = {
      ...insertUser,
      role: insertUser.role || "employee"
    };
    const [user] = await db.insert(users).values(userToInsert).returning();
    return user;
  }

  // Goal operations
  async getGoals(userId: number): Promise<Goal[]> {
    const result = await db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId))
      .orderBy(desc(goals.targetDate));
    return result;
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal;
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const now = new Date();
    const values = {
      ...insertGoal,
      createdAt: now,
      updatedAt: now,
      status: insertGoal.status || "draft",
      progress: insertGoal.progress || 0,
      origin: insertGoal.origin || "self", // Default origin to 'self'
      attachments: insertGoal.attachments || null,
      comments: insertGoal.comments || null
    };
    const [goal] = await db.insert(goals).values(values).returning();
    return goal;
  }

  async updateGoal(id: number, updates: Partial<Goal>): Promise<Goal | undefined> {
    // Make sure we're updating with the current timestamp
    const values = {
      ...updates,
      updatedAt: new Date(),
    };
    
    const [updatedGoal] = await db
      .update(goals)
      .set(values)
      .where(eq(goals.id, id))
      .returning();
    
    return updatedGoal;
  }

  async deleteGoal(id: number): Promise<boolean> {
    const result = await db.delete(goals).where(eq(goals.id, id));
    return result.count > 0;
  }

  // Achievement operations
  async getAchievements(userId: number): Promise<Achievement[]> {
    const result = await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.date));
    return result;
  }

  async getAchievementsByGoal(goalId: number): Promise<Achievement[]> {
    const result = await db
      .select()
      .from(achievements)
      .where(eq(achievements.goalId, goalId))
      .orderBy(desc(achievements.date));
    return result;
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const values = {
      ...insertAchievement,
      createdAt: new Date(),
    };
    const [achievement] = await db.insert(achievements).values(values).returning();
    return achievement;
  }

  // Feedback operations
  async getFeedbacks(userId: number): Promise<Feedback[]> {
    const result = await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.userId, userId))
      .orderBy(desc(feedbacks.date));
    return result;
  }

  async getFeedbacksByGoal(goalId: number): Promise<Feedback[]> {
    const result = await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.goalId, goalId))
      .orderBy(desc(feedbacks.date));
    return result;
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const values = {
      ...insertFeedback,
      createdAt: new Date(),
    };
    const [feedback] = await db.insert(feedbacks).values(values).returning();
    return feedback;
  }

  // Career event operations
  async getCareerEvents(userId: number): Promise<CareerEvent[]> {
    const result = await db
      .select()
      .from(careerEvents)
      .where(eq(careerEvents.userId, userId))
      .orderBy(desc(careerEvents.date));
    return result;
  }

  async createCareerEvent(insertEvent: InsertCareerEvent): Promise<CareerEvent> {
    const values = {
      ...insertEvent,
      createdAt: new Date(),
    };
    const [event] = await db.insert(careerEvents).values(values).returning();
    return event;
  }
  
  // Manager-specific operations
  async getReportsByManagerId(managerId: number): Promise<User[]> {
    // Cast the managerId to a string since it's stored as text in the database
    const managerIdStr = String(managerId);
    return await db
      .select()
      .from(users)
      .where(eq(users.managerId, managerIdStr));
  }
  
  async getReporteeGoals(managerId: number): Promise<{ user: User; goals: Goal[] }[]> {
    const reportees = await this.getReportsByManagerId(managerId);
    const result: { user: User; goals: Goal[] }[] = [];
    
    for (const reportee of reportees) {
      const goals = await this.getGoals(reportee.id);
      result.push({ user: reportee, goals });
    }
    
    return result;
  }
  
  // IDP operations
  async getIdps(): Promise<Idp[]> {
    return await db
      .select()
      .from(idps)
      .orderBy(idps.name);
  }
  
  async getIdpsByCategory(category: string): Promise<Idp[]> {
    return await db
      .select()
      .from(idps)
      .where(eq(idps.category, category))
      .orderBy(idps.name);
  }
  
  async getIdp(id: number): Promise<Idp | undefined> {
    const [idp] = await db
      .select()
      .from(idps)
      .where(eq(idps.id, id));
    return idp;
  }
  
  async createIdp(insertIdp: InsertIdp): Promise<Idp> {
    const [idp] = await db
      .insert(idps)
      .values(insertIdp)
      .returning();
    return idp;
  }
  
  // Career Role operations
  async getCareerRoles(): Promise<CareerRole[]> {
    return await db
      .select()
      .from(careerRoles)
      .orderBy(careerRoles.title);
  }

  async getCareerRole(id: number): Promise<CareerRole | undefined> {
    const [role] = await db
      .select()
      .from(careerRoles)
      .where(eq(careerRoles.id, id));
    return role;
  }

  async createCareerRole(insertRole: InsertCareerRole): Promise<CareerRole> {
    const [role] = await db
      .insert(careerRoles)
      .values(insertRole)
      .returning();
    return role;
  }
}

// Use DatabaseStorage for production, MemStorage can be used for development
export const storage = new DatabaseStorage();