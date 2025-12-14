import User from './models/userModel.js';
import { connectDB } from './config/db.js';

// Simple user check utility
const checkUsers = async () => {
  try {
    await connectDB();
    const users = await User.findAll();
    console.log(`Found ${users.length} users in MySQL database`);
    return users;
  } catch (error) {
    console.error('Error checking users:', error);
  }
};

export default checkUsers;