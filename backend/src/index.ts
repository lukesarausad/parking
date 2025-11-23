import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { officersRouter } from './routes/officers';
import { zonesRouter } from './routes/zones';
import { DataService, ParkingZone } from './services/dataService';

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
app.use('/api/officers', officersRouter); // Legacy compatibility
app.use('/api/zones', zonesRouter); // New risk zones API

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    realDataLoaded: dataService.isRealDataLoaded(),
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
    message: 'Connected to Seattle Parking Intelligence',
    realDataLoaded: dataService.isRealDataLoaded(),
  }));

  // Send current parking zones immediately
  sendCurrentZones(ws);
});

async function sendCurrentZones(ws: WebSocket) {
  try {
    const zones = await dataService.getParkingZones();
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'zones_update',
        timestamp: new Date().toISOString(),
        data: zones,
      }));
    }
  } catch (error) {
    console.error('Error sending initial zones:', error);
  }
}

// Broadcast function for live updates
function broadcastZones(zones: ParkingZone[]) {
  const message = JSON.stringify({
    type: 'zones_update',
    timestamp: new Date().toISOString(),
    data: zones,
  });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Live zone updates (risk scores change based on time of day)
let updateInterval: NodeJS.Timeout;

async function startLiveUpdates() {
  // Initial data fetch
  await dataService.initialize();

  // Broadcast zone updates every 60 seconds (risk scores may change with time)
  updateInterval = setInterval(async () => {
    try {
      const zones = await dataService.getParkingZones();
      broadcastZones(zones);
    } catch (error) {
      console.error('Error broadcasting zone updates:', error);
    }
  }, 60000); // Update every minute
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
  console.log(`🚗 Seattle Parking Intelligence API running on port ${PORT}`);
  console.log(`📡 WebSocket available at ws://localhost:${PORT}/ws/live-updates`);
  startLiveUpdates();
});

export { app, server };
