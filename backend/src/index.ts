import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { citationsRouter } from './routes/citations';
import { statisticsRouter } from './routes/statistics';
import { heatmapRouter } from './routes/heatmap';
import { officersRouter } from './routes/officers';
import { DataService } from './services/dataService';
import { LiveUpdate } from '@seattle-parking/shared';

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const app = express();
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server, path: '/ws/live-updates' });

// Middleware
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// Initialize data service
const dataService = new DataService();

// Make data service available to routes
app.set('dataService', dataService);

// API Routes
app.use('/api/citations', citationsRouter);
app.use('/api/statistics', statisticsRouter);
app.use('/api/heatmap', heatmapRouter);
app.use('/api/officers', officersRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// WebSocket connection handling
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  clients.add(ws);

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });

  // Send initial connection confirmation
  ws.send(JSON.stringify({
    type: 'connected',
    timestamp: new Date().toISOString(),
    message: 'Connected to Seattle Parking Tracker live updates'
  }));
});

// Broadcast function for live updates
export function broadcastUpdate(update: LiveUpdate) {
  const message = JSON.stringify(update);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Simulate live updates (in production, this would be triggered by real data)
let updateInterval: NodeJS.Timeout;

async function startLiveUpdates() {
  // Initial data fetch
  await dataService.initialize();

  // Periodic updates every 30 seconds
  updateInterval = setInterval(async () => {
    try {
      const stats = await dataService.getStatistics();
      const recentCitations = await dataService.getCitations({
        limit: 5,
        from: new Date(Date.now() - 5 * 60 * 1000).toISOString() // Last 5 minutes
      });

      // Broadcast stats update
      broadcastUpdate({
        type: 'stats_update',
        timestamp: new Date(),
        data: stats
      });

      // Broadcast any new citations
      recentCitations.citations.forEach(citation => {
        broadcastUpdate({
          type: 'citation',
          timestamp: new Date(),
          data: citation
        });
      });
    } catch (error) {
      console.error('Error fetching live updates:', error);
    }
  }, 30000);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  clearInterval(updateInterval);
  wss.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚗 Seattle Parking Tracker API running on port ${PORT}`);
  console.log(`📡 WebSocket available at ws://localhost:${PORT}/ws/live-updates`);
  startLiveUpdates();
});

export { app, server };
