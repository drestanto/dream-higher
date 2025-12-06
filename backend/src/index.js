import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import productRoutes from './routes/products.js';
import transactionRoutes from './routes/transactions.js';
import analyticsRoutes from './routes/analytics.js';
import aiRoutes from './routes/ai.js';

dotenv.config();

const app = express();

export const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Cleanup old audio files every 10 minutes
const AUDIO_MAX_AGE_MINUTES = 30;
const CLEANUP_INTERVAL_MINUTES = 10;

function cleanupOldAudioFiles() {
  const audioDir = path.join(__dirname, '../public/audio');

  if (!fs.existsSync(audioDir)) return;

  const files = fs.readdirSync(audioDir);
  const now = Date.now();
  let deletedCount = 0;

  files.forEach(file => {
    const filePath = path.join(audioDir, file);
    try {
      const stats = fs.statSync(filePath);
      const ageMinutes = (now - stats.mtimeMs) / 1000 / 60;

      if (ageMinutes > AUDIO_MAX_AGE_MINUTES) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    } catch (err) {
      // Ignore errors (file might be in use)
    }
  });

  if (deletedCount > 0) {
    console.log(`Cleaned up ${deletedCount} old audio file(s)`);
  }
}

// Run cleanup on start and every 10 minutes
cleanupOldAudioFiles();
setInterval(cleanupOldAudioFiles, CLEANUP_INTERVAL_MINUTES * 60 * 1000);

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
