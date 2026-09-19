import express from 'express';
import cors from 'cors';
import { initDb, getDbStatus } from '../server/db.js';
import authRoutes from '../server/routes/auth.js';
import negotiationRoutes from '../server/routes/negotiations.js';
import settingsRoutes from '../server/routes/settings.js';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));

// Database initialization middleware for serverless cold starts
let dbInitPromise = null;
app.use(async (req, res, next) => {
  try {
    if (!dbInitPromise) {
      dbInitPromise = initDb().catch(err => {
        console.error('Serverless DB init error:', err);
        dbInitPromise = null;
        return false;
      });
    }
    const success = await dbInitPromise;
    if (!success) {
      dbInitPromise = null; // Allow retry on subsequent requests
    }
  } catch (err) {
    dbInitPromise = null;
    console.error('Database initialization middleware error:', err);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/negotiations', negotiationRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (req, res) => {
  const dbStatus = getDbStatus();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'DealMind Vercel Serverless API',
    database: dbStatus,
  });
});

export default app;
