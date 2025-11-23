import { Router, Request, Response } from 'express';
import { DataService } from '../services/dataService';

export const zonesRouter = Router();

// Get all parking zones with current risk scores
zonesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const dataService: DataService = req.app.get('dataService');
    const zones = await dataService.getParkingZones();

    res.json({
      zones,
      realDataLoaded: dataService.isRealDataLoaded(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching parking zones:', error);
    res.status(500).json({ error: 'Failed to fetch parking zones' });
  }
});

// Get hourly enforcement patterns
zonesRouter.get('/patterns', async (req: Request, res: Response) => {
  try {
    const dataService: DataService = req.app.get('dataService');
    const patterns = await dataService.getHourlyPatterns();
    res.json(patterns);
  } catch (error) {
    console.error('Error fetching hourly patterns:', error);
    res.status(500).json({ error: 'Failed to fetch hourly patterns' });
  }
});

// Get neighborhood statistics
zonesRouter.get('/neighborhoods', async (req: Request, res: Response) => {
  try {
    const dataService: DataService = req.app.get('dataService');
    const stats = await dataService.getNeighborhoodStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching neighborhood stats:', error);
    res.status(500).json({ error: 'Failed to fetch neighborhood stats' });
  }
});

// Get risk score for a specific location
zonesRouter.get('/risk', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Invalid lat/lng parameters' });
    }

    const dataService: DataService = req.app.get('dataService');
    const risk = await dataService.getRiskAtLocation(lat, lng);
    res.json(risk);
  } catch (error) {
    console.error('Error calculating risk:', error);
    res.status(500).json({ error: 'Failed to calculate risk' });
  }
});
