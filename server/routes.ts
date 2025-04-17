import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGoalSchema, insertAchievementSchema, insertFeedbackSchema, insertIdpSchema, insertCareerRoleSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { setupAuth } from "./auth";
import cors from "cors";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup CORS
  app.use(cors({
    origin: 'http://localhost:5001', // Your frontend URL
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  // Setup authentication
  setupAuth(app);
  
  // Setup multer for file uploads
  const uploadDir = path.join(process.cwd(), "uploads");
  
  // Ensure upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
      },
    }),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  });

  // API Routes are now protected by authentication middleware
  
  // Get user by ID
  app.get("/api/users/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Don't send password to client
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  
  // Get career events for a user
  app.get("/api/career-events", async (req, res) => {
    const userId = req.user!.id;
    const events = await storage.getCareerEvents(userId);
    res.json(events);
  });
  
  // Get all goals for a user
  app.get("/api/goals", async (req, res) => {
    const userId = req.user!.id;
    const goals = await storage.getGoals(userId);
    res.json(goals);
  });
  
  // Get a specific goal
  app.get("/api/goals/:id", async (req, res) => {
    const goalId = parseInt(req.params.id);
    const goal = await storage.getGoal(goalId);
    
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }
    
    res.json(goal);
  });
  
  // Create a new goal with file upload support
  app.post("/api/goals", upload.array("attachments", 5), async (req, res) => {
    try {
      // Log diagnostic information
      console.log("GOAL DATA RECEIVED:", {
        currentUserId: req.user!.id,
        userRole: req.user!.role,
        origin: req.body.origin,
        submittedUserId: req.body.userId,
        submittedManagerId: req.body.managerId
      });
      
      // Default to the current user's ID
      let userId = req.user!.id;
      let managerId = null;
      
      // Manager-assigned goals for reportees
      if (req.body.origin === 'Manager' && req.body.userId) {
        const reporteeId = parseInt(req.body.userId);
        
        // Only allow valid numeric IDs that are different from current user
        if (!isNaN(reporteeId) && reporteeId !== req.user!.id) {
          userId = reporteeId;
          managerId = req.user!.id; // Set the current manager as the delegator
          console.log(`Manager ${req.user!.id} assigning goal to reportee ${reporteeId}`);
        }
      }
      
      const files = req.files as Express.Multer.File[];
      const fileNames = files && files.length > 0 ? files.map(file => file.filename) : [];
      
      // Parse date strings
      const startDate = typeof req.body.startDate === 'string' ? 
        new Date(req.body.startDate) : req.body.startDate;
        
      const targetDate = typeof req.body.targetDate === 'string' ? 
        new Date(req.body.targetDate) : req.body.targetDate;
      
      // Parse progress string
      const progress = typeof req.body.progress === 'string' ? 
        parseFloat(req.body.progress) : req.body.progress;
      
      // Create goal data object
      const goalData = insertGoalSchema.parse({
        userId,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        origin: req.body.origin || "Self",
        startDate,
        targetDate,
        status: req.body.status || "draft",
        progress: progress || 0,
        managerId, // Will be null for self-assigned goals
        attachments: fileNames
      });
      
      console.log("Creating goal with data:", {
        userId: goalData.userId,
        managerId: goalData.managerId,
        title: goalData.title,
        origin: goalData.origin
      });
      
      // Create the goal in the database
      const goal = await storage.createGoal(goalData);
      
      // Return success response
      res.status(201).json(goal);
    } catch (error: any) {
      console.error("Error creating goal:", error);
      res.status(400).json({ 
        message: "Invalid goal data", 
        error: error.message || String(error) 
      });
    }
  });
  
  // Update a goal
  app.put("/api/goals/:id", async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      const goal = await storage.getGoal(goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      const updatedGoal = await storage.updateGoal(goalId, req.body);
      res.json(updatedGoal);
    } catch (error) {
      res.status(400).json({ message: "Invalid goal data", error });
    }
  });
  
  // Get achievements for a user
  app.get("/api/achievements", async (req, res) => {
    const userId = req.user!.id;
    const achievements = await storage.getAchievements(userId);
    res.json(achievements);
  });
  
  // Get achievements for a specific goal
  app.get("/api/goals/:id/achievements", async (req, res) => {
    const goalId = parseInt(req.params.id);
    const achievements = await storage.getAchievementsByGoal(goalId);
    res.json(achievements);
  });
  
  // Add a new achievement with file upload
  app.post("/api/achievements", upload.array("attachments", 5), async (req, res) => {
    try {
      const userId = req.user!.id;
      const files = req.files as Express.Multer.File[];
      
      // Get file names from uploaded files
      const fileNames = files && files.length > 0 ? files.map(file => file.filename) : [];
      
      // Parse goal ID if present
      let goalId = undefined;
      if (req.body.goalId && req.body.goalId !== 'none') {
        const parsedId = parseInt(req.body.goalId);
        if (!isNaN(parsedId)) {
          goalId = parsedId;
        }
      }
      
      // Create achievement data object
      const achievementData = insertAchievementSchema.parse({
        ...req.body,
        userId,
        goalId,
        date: new Date(req.body.date),
        // Store file names as JSON array, as expected by the database schema
        attachments: fileNames.length > 0 ? fileNames : []
      });
      
      // Create the achievement in the database
      const achievement = await storage.createAchievement(achievementData);
      
      // Return success response
      res.status(201).json(achievement);
    } catch (error: any) {
      console.error("Error creating achievement:", error);
      res.status(400).json({ 
        message: "Invalid achievement data", 
        error: error.message || String(error) 
      });
    }
  });
  
  // Get feedbacks for a user
  app.get("/api/feedbacks", async (req, res) => {
    const userId = req.user!.id;
    const feedbacks = await storage.getFeedbacks(userId);
    res.json(feedbacks);
  });
  
  // Get feedbacks for a specific goal
  app.get("/api/goals/:id/feedbacks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const goalId = parseInt(req.params.id);
    const feedbacks = await storage.getFeedbacksByGoal(goalId);
    res.json(feedbacks);
  });
  
  // Get reportees for a manager
  app.get("/api/reportees", async (req, res) => {
    if (!req.user || (req.user.role !== "manager" && req.user.role !== "admin" && req.user.id !== 1)) {
      return res.status(403).json({ message: "Unauthorized. Manager role or specific access required." });
    }
    
    const managerId = req.user.id;
    const reportees = await storage.getReportsByManagerId(managerId);
    res.json(reportees);
  });
  
  // Get all goals of reportees for a manager
  app.get("/api/reportees/goals", async (req, res) => {
    if (!req.user || (req.user.role !== "manager" && req.user.role !== "admin" && req.user.id !== 1)) {
      return res.status(403).json({ message: "Unauthorized. Manager role or specific access required." });
    }
    
    const managerId = req.user.id;
    const reporteeGoals = await storage.getReporteeGoals(managerId);
    res.json(reporteeGoals);
  });
  
  // Add a new feedback with file upload
  app.post("/api/feedbacks", upload.array("attachments", 5), async (req, res) => {
    try {
      const userId = req.user!.id;
      const files = req.files as Express.Multer.File[];
      
      // Get file names from uploaded files
      const fileNames = files && files.length > 0 ? files.map(file => file.filename) : [];
      
      // Parse goal ID if present
      let goalId = undefined;
      if (req.body.goalId && req.body.goalId !== 'none') {
        const parsedId = parseInt(req.body.goalId);
        if (!isNaN(parsedId)) {
          goalId = parsedId;
        }
      }
      
      // Create feedback data object
      const feedbackData = insertFeedbackSchema.parse({
        ...req.body,
        userId,
        goalId,
        date: new Date(req.body.date),
        // Store file names as JSON array, as expected by the database schema
        attachments: fileNames.length > 0 ? fileNames : []
      });
      
      // Create the feedback in the database
      const feedback = await storage.createFeedback(feedbackData);
      
      // Return success response
      res.status(201).json(feedback);
    } catch (error: any) {
      console.error("Error creating feedback:", error);
      res.status(400).json({ 
        message: "Invalid feedback data", 
        error: error.message || String(error) 
      });
    }
  });

  // IDP Routes
  
  // Get all IDPs
  app.get("/api/idps", async (req, res) => {
    try {
      const idps = await storage.getIdps();
      res.json(idps);
    } catch (error) {
      console.error("Error fetching IDPs:", error);
      res.status(500).json({ message: "Failed to fetch IDPs" });
    }
  });
  
  // Get IDPs by category
  app.get("/api/idps/category/:category", async (req, res) => {
    try {
      const category = req.params.category;
      const idps = await storage.getIdpsByCategory(category);
      res.json(idps);
    } catch (error) {
      console.error(`Error fetching IDPs for category ${req.params.category}:`, error);
      res.status(500).json({ message: "Failed to fetch IDPs by category" });
    }
  });
  
  // Get a specific IDP
  app.get("/api/idps/:id", async (req, res) => {
    try {
      const idpId = parseInt(req.params.id);
      const idp = await storage.getIdp(idpId);
      
      if (!idp) {
        return res.status(404).json({ message: "IDP not found" });
      }
      
      res.json(idp);
    } catch (error) {
      console.error("Error fetching IDP:", error);
      res.status(500).json({ message: "Failed to fetch IDP" });
    }
  });
  
  // Create a new IDP (admin only)
  app.post("/api/idps", async (req, res) => {
    try {
      // Only allow admins or HR to create IDPs
      if (!req.user || (req.user.role !== "admin" && req.user.role !== "hr")) {
        return res.status(403).json({ message: "Unauthorized. Admin or HR role required." });
      }
      
      const idpData = insertIdpSchema.parse({
        name: req.body.name,
        category: req.body.category,
        description: req.body.description
      });
      
      const idp = await storage.createIdp(idpData);
      res.status(201).json(idp);
    } catch (error: any) {
      console.error("Error creating IDP:", error);
      res.status(400).json({ 
        message: "Invalid IDP data", 
        error: error.message || String(error) 
      });
    }
  });

  // Career Roles Routes
  
  // Get all career roles
  app.get("/api/career-roles", async (req, res) => {
    try {
      const roles = await storage.getCareerRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching career roles:", error);
      res.status(500).json({ message: "Failed to fetch career roles" });
    }
  });
  
  // Get a specific career role
  app.get("/api/career-roles/:id", async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      const role = await storage.getCareerRole(roleId);
      
      if (!role) {
        return res.status(404).json({ message: "Career role not found" });
      }
      
      res.json(role);
    } catch (error) {
      console.error("Error fetching career role:", error);
      res.status(500).json({ message: "Failed to fetch career role" });
    }
  });
  
  // Create a new career role (admin only)
  app.post("/api/career-roles", async (req, res) => {
    try {
      // Only allow admins or HR to create career roles
      if (!req.user || (req.user.role !== "admin" && req.user.role !== "hr")) {
        return res.status(403).json({ message: "Unauthorized. Admin or HR role required." });
      }
      
      // Parse and validate the career role data
      const roleData = insertCareerRoleSchema.parse({
        title: req.body.title,
        responsibilities: req.body.responsibilities || [],
        successProfiles: req.body.successProfiles || [],
        keyAchievements: req.body.keyAchievements || [],
        targetUsers: req.body.targetUsers || []
      });
      
      // Create the career role
      const newRole = await storage.createCareerRole(roleData);
      res.status(201).json(newRole);
    } catch (error: any) {
      console.error("Error creating career role:", error);
      res.status(400).json({ 
        message: "Invalid career role data", 
        error: error.message || String(error) 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
