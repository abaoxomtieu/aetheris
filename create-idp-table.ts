import { db } from './server/db';
import { idps } from './shared/schema';
import { eq } from 'drizzle-orm';

async function createIdpTable() {
  try {
    console.log('Creating IDP table in the database...');
    
    // First check if the roles column exists
    try {
      await db.execute(`SELECT roles FROM idps LIMIT 1;`);
      console.log('Roles column already exists, skipping column creation');
    } catch (error) {
      // If the column doesn't exist, add it
      console.log('Adding roles column to idps table');
      await db.execute(`
        ALTER TABLE idps
        ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT '{"Employee", "Manager"}';
      `);
      console.log('Roles column added successfully');
    }
    
    console.log('IDP table created successfully');
    
    // Insert sample data
    const sampleIdps = [
      {
        name: "Leadership Shadowing Program",
        category: "Exposure",
        description: "Shadow senior leaders in cross-functional meetings to understand strategic decision making"
      },
      {
        name: "Product Management Certification",
        category: "Education",
        description: "Complete a certified product management course to understand customer-centric development"
      },
      {
        name: "Lead Quarterly Planning Session",
        category: "Experience",
        description: "Lead the team's quarterly planning session to develop strategic planning skills"
      },
      {
        name: "Industry Conference Attendance",
        category: "Exposure",
        description: "Attend industry conferences to network and learn about emerging trends"
      },
      {
        name: "Technical Skills Workshop",
        category: "Education",
        description: "Complete workshops on emerging technologies relevant to department needs"
      },
      {
        name: "Cross-functional Project Lead",
        category: "Experience", 
        description: "Lead a project with members from multiple departments to develop collaboration skills"
      }
    ];
    
    // Insert each sample IDP if it doesn't already exist
    for (const idp of sampleIdps) {
      // Check if IDP with this name already exists
      const existingIdp = await db.select().from(idps).where(eq(idps.name, idp.name));
      
      if (existingIdp.length === 0) {
        // Only insert if it doesn't exist
        await db.insert(idps).values({
          name: idp.name,
          category: idp.category as any, // Type assertion needed because of enum
          description: idp.description,
          roles: ["Employee", "Manager"] // Default to both roles
        });
        console.log(`Added IDP: ${idp.name}`);
      } else {
        console.log(`IDP "${idp.name}" already exists, updating roles`);
        
        // Update the roles for existing IDPs
        await db.update(idps)
          .set({ roles: ["Employee", "Manager"] })
          .where(eq(idps.name, idp.name));
      }
    }
    
    console.log('Sample IDP data inserted successfully');
    console.log('Done!');
    
  } catch (error) {
    console.error('Error creating IDP table or inserting data:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
createIdpTable();