import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { runFullSeed } from './utils/seedData.js';

dotenv.config();

const main = async () => {
  try {
    await connectDB();
    await runFullSeed();
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

main();
