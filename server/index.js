import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDb, getDbStatus } from './db.js';
import authRoutes from './routes/auth.js';
import negotiationRoutes from './routes/negotiations.js';
import settingsRoutes from './routes/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/negotiations', negotiationRoutes);
app.use('/api/settings', settingsRoutes);

// Health check & DB diagnostics endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getDbStatus();
  return res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'DealMind Backend API',
    database: dbStatus,
  });
});

// Serve frontend static build if dist/ exists (production / Railway deployment)
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // Express 5 compatible SPA fallback
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Start server
async function startServer() {
  console.log('🚀 Starting DealMind API Server...');
  await initDb();

  app.listen(PORT, () => {
    console.log(`🌐 DealMind API Server running on port ${PORT} (http://localhost:${PORT})`);
    console.log(`📡 Health & DB Status: http://localhost:${PORT}/api/health`);
  });
}

startServer();
