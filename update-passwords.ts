import { hashPassword } from './server/auth';
import { db } from './server/db';
import { users } from './shared/schema';
import { eq } from 'drizzle-orm';

async function updatePasswords() {
  try {
    console.log('Starting password update script...');
    
    // Hash the new password
    const newPassword = "password";
    const hashedPassword = await hashPassword(newPassword);
    
    console.log('Password hashed successfully');
    
    // Get all users
    const allUsers = await db.select().from(users);
    
    // Update password for all users
    for (const user of allUsers) {
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, user.id));
      
      console.log(`Updated password for user with ID ${user.id} (${user.username})`);
    }
    
    console.log('Password update completed successfully!');
    console.log('New password for all users is: password');
    
  } catch (error) {
    console.error('Error updating passwords:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
updatePasswords();