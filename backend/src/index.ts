import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { officersRouter } from './routes/officers';
import { DataService } from './services/dataService';
import { LiveUpdate, OfficerLocation } from '@seattle-parking/shared';

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

// API Routes - only officers endpoint needed
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

  // Send current officer locations immediately
  sendCurrentOfficers(ws);
});

async function sendCurrentOfficers(ws: WebSocket) {
  try {
    const officers = await dataService.getActiveOfficers();
    officers.forEach(officer => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'officer_location',
          timestamp: new Date().toISOString(),
          data: officer
        }));
      }
    });
  } catch (error) {
    console.error('Error sending initial officers:', error);
  }
}

// Broadcast function for live updates
function broadcastUpdate(update: LiveUpdate) {
  const message = JSON.stringify(update);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Live officer position updates
let updateInterval: NodeJS.Timeout;
let previousOfficers: Map<string, OfficerLocation> = new Map();

async function startLiveUpdates() {
  // Initial data fetch
  await dataService.initialize();

  // Broadcast officer position updates every 10 seconds
  updateInterval = setInterval(async () => {
    try {
      const officers = await dataService.getActiveOfficers();

      // Broadcast each officer's updated location
      officers.forEach(officer => {
        const prev = previousOfficers.get(officer.id);

        // Only broadcast if position changed or status changed
        if (!prev ||
            prev.location.lat !== officer.location.lat ||
            prev.location.lng !== officer.location.lng ||
            prev.isActive !== officer.isActive ||
            prev.citationsToday !== officer.citationsToday) {

          broadcastUpdate({
            type: 'officer_location',
            timestamp: new Date(),
            data: officer
          });
        }

        previousOfficers.set(officer.id, officer);
      });
    } catch (error) {
      console.error('Error broadcasting officer updates:', error);
    }
  }, 10000); // Update every 10 seconds
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
