import { db } from './server/db';
import { 
  users, goals, achievements, feedbacks, careerEvents, idps, careerRoles 
} from '@shared/schema';
import { hashPassword } from './server/storage';

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Create sample users with different roles
    const sampleUsers = [
      {
        username: "johndoe",
        password: await hashPassword("password123"),
        fullName: "John Doe",
        title: "Global Learning Head",
        department: "Learning & Development",
        role: "admin",
        avatar: null,
      },
      {
        username: "manager",
        password: await hashPassword("manager123"),
        fullName: "Sarah Manager",
        title: "Regional Manager",
        department: "Learning & Development",
        role: "manager",
        avatar: null,
      },
      {
        username: "employee",
        password: await hashPassword("employee123"),
        fullName: "Alex Employee",
        title: "Learning Specialist",
        department: "Learning & Development",
        role: "employee",
        avatar: null,
      },
      {
        username: "hr",
        password: await hashPassword("hr123"),
        fullName: "Taylor HR",
        title: "HR Specialist",
        department: "Human Resources",
        role: "hr",
        avatar: null,
      }
    ];

    // Insert users and get their IDs
    const insertedUsers = await Promise.all(
      sampleUsers.map(user => db.insert(users).values(user).returning())
    );
    console.log('Users created successfully');

    // Use the first user (admin) for the rest of the data
    const adminUser = insertedUsers[0][0];

    // Create career events
    const careerEventsData = [
      {
        userId: adminUser.id,
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
        userId: adminUser.id,
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
      }
    ];

    await db.insert(careerEvents).values(careerEventsData);
    console.log('Career events created successfully');

    // Create goals
    const goalsData = [
      {
        userId: adminUser.id,
        title: "Leadership Development Program",
        description: "Design and implement a comprehensive leadership development program for senior managers across departments",
        category: "Leadership",
        startDate: new Date("2022-06-01"),
        targetDate: new Date("2022-11-15"),
        status: "completed",
        progress: 100,
      },
      {
        userId: adminUser.id,
        title: "Cross-Functional Training Framework",
        description: "Develop a comprehensive cross-functional training framework to improve team versatility and operational flexibility",
        category: "Training",
        startDate: new Date("2021-05-01"),
        targetDate: new Date("2021-12-31"),
        status: "pending_review",
        progress: 85,
      }
    ];

    const insertedGoals = await Promise.all(
      goalsData.map(goal => db.insert(goals).values(goal).returning())
    );
    console.log('Goals created successfully');

    // Create achievements
    const achievementsData = [
      {
        userId: adminUser.id,
        goalId: insertedGoals[0][0].id,
        title: "Leadership Program Development",
        description: "Completed the design phase of the leadership program with excellent feedback",
        date: new Date("2022-08-15"),
        attachments: ["Leadership_Program_v1.pdf"],
      },
      {
        userId: adminUser.id,
        goalId: insertedGoals[1][0].id,
        title: "Cross-Functional Framework Blueprint",
        description: "Developed comprehensive blueprint for the cross-functional training framework",
        date: new Date("2021-07-22"),
        attachments: ["CF_Training_Blueprint.pdf"],
      }
    ];

    await db.insert(achievements).values(achievementsData);
    console.log('Achievements created successfully');

    // Create feedbacks
    const feedbacksData = [
      {
        userId: adminUser.id,
        goalId: insertedGoals[0][0].id,
        content: "John's leadership program has transformed our management approach. The content was exceptional and the delivery was outstanding.",
        source: "Sarah Johnson, Chief Operations Officer",
        date: new Date("2022-11-20"),
        attachments: ["Leadership_Feedback.pdf"],
      },
      {
        userId: adminUser.id,
        goalId: insertedGoals[1][0].id,
        content: "The cross-functional training framework shows great promise. Looking forward to the final version.",
        source: "Michael Chen, HR Director",
        date: new Date("2021-09-10"),
        attachments: [],
      }
    ];

    await db.insert(feedbacks).values(feedbacksData);
    console.log('Feedbacks created successfully');

    // Create IDPs
    const idpsData = [
      {
        name: "Leadership Shadowing Program",
        category: "Exposure",
        description: "Shadow senior leaders in cross-functional meetings to understand strategic decision making",
        roles: ["Employee", "Manager"]
      },
      {
        name: "Product Management Certification",
        category: "Education",
        description: "Complete a certified product management course to understand customer-centric development",
        roles: ["Employee", "Manager"]
      }
    ];

    await db.insert(idps).values(idpsData);
    console.log('IDPs created successfully');

    // Create career roles
    const careerRolesData = [
      {
        title: "Senior Learning & Development Specialist",
        responsibilities: [
          "Design and implement learning programs",
          "Develop training materials",
          "Evaluate training effectiveness"
        ],
        successProfiles: [1, 2],
        keyAchievements: [
          "Successfully launched 3 major training programs",
          "Improved training completion rates by 40%"
        ],
        targetUsers: [1, 2]
      },
      {
        title: "Learning & Development Manager",
        responsibilities: [
          "Lead L&D team",
          "Develop learning strategy",
          "Manage training budget"
        ],
        successProfiles: [1, 2],
        keyAchievements: [
          "Reduced training costs by 25%",
          "Increased employee satisfaction by 30%"
        ],
        targetUsers: [1, 2]
      }
    ];

    await db.insert(careerRoles).values(careerRolesData);
    console.log('Career roles created successfully');

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

// Run the seeding function
seedDatabase(); 