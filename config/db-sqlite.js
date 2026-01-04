import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// SQLite for quick deployment (development only)
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.NODE_ENV === 'production' ? ':memory:' : './database.sqlite',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite Database connected successfully');

    const syncOptions = { alter: false };
    await sequelize.sync(syncOptions);
    console.log('All models synced with database');

    return sequelize;
  } catch (error) {
    console.error('SQLite connection error:', error.message);
    process.exit(1);
  }
};

export { sequelize, connectDB };
export default connectDB;