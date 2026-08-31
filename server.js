import app from './app.js';
import db from './models/index.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Authenticate database connection
    await db.sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Sync database (in production you would use migrations instead of sync)
    await db.sequelize.sync({ alter: true });
    console.log('Database synced.');

    // Start listening
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();
