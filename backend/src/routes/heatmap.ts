import { Router, Request, Response } from 'express';
import { DataService } from '../services/dataService';

export const heatmapRouter = Router();

heatmapRouter.get('/', async (req: Request, res: Response) => {
  try {
    const dataService: DataService = req.app.get('dataService');

    const date = req.query.date as string | undefined;
    const neighborhood = req.query.neighborhood as string | undefined;

    const heatmapData = await dataService.getHeatmapData(date, neighborhood);
    res.json(heatmapData);
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
});
