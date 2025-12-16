import User from './models/userModel.js';
import { sequelize } from './config/db.js';

async function checkUser() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const user = await User.findOne({ 
      where: { email: 'bobdec15@gmail.com' } 
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User found:', {
      id: user.id,
      email: user.email,
      stripeCustomerId: user.stripeCustomerId,
      subscription: user.subscription,
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUser();
