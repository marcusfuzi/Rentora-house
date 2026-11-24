import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import propertyRoutes from './routes/property.routes.js';
import enquiryRoutes from './routes/enquiry.routes.js';
import visitRoutes from './routes/visit.routes.js';
import favouriteRoutes from './routes/favourite.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import reportRoutes from './routes/report.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import adminRoutes from './routes/admin.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import { seedDatabaseIfEmpty } from './utils/seedData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
await connectDB();

// Core Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve Static Frontend Assets & Uploads
app.use(express.static(path.join(__dirname, '../public')));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'RENTORA – Smart Rental Marketplace',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/favourites', favouriteRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Single Page Application Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Rentora Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Auto-seed initial data if DB is empty
await seedDatabaseIfEmpty();

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  RENTORA SERVER RUNNING ON: http://localhost:${PORT}`);
  console.log(`  MongoDB: ${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rentora'}`);
  console.log(`======================================================\n`);
});
