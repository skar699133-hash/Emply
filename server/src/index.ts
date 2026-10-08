import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { db } from './db/connection.js';
import { runSeed } from './db/seed.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import aiRoutes from './routes/ai.routes.js';
import requestsRoutes from './routes/requests.routes.js';
import leaveRoutes from './routes/leave.routes.js';
import managerRoutes from './routes/manager.routes.js';
import hrRoutes from './routes/hr.routes.js';
import adminRoutes from './routes/admin.routes.js';
import policyRoutes from './routes/policy.routes.js';
import notificationRoutes from './routes/notification.routes.js';

const app = express();

// Middleware
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'EMPLY AI Workplace Operations & HR Platform',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/notifications', notificationRoutes);

// Error Handler
app.use(errorHandler);

// Server startup
async function startServer() {
  try {
    console.log('Connecting to database...');
    await db.init();
    await runSeed();

    app.listen(config.port, () => {
      console.log(`=======================================================`);
      console.log(`  EMPLY WORKPLACE AI PLATFORM BACKEND STARTED`);
      console.log(`  Listening on: http://localhost:${config.port}`);
      console.log(`  Health Check: http://localhost:${config.port}/api/health`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Fatal server startup error:', error);
    process.exit(1);
  }
}

startServer();
