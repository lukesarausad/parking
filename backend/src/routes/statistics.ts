import { Router, Request, Response } from 'express';
import { DataService } from '../services/dataService';

export const statisticsRouter = Router();

statisticsRouter.get('/today', async (req: Request, res: Response) => {
  try {
    const dataService: DataService = req.app.get('dataService');
    const statistics = await dataService.getStatistics();
    res.json(statistics);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

statisticsRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    const dataService: DataService = req.app.get('dataService');
    const statistics = await dataService.getStatistics();

    // Return a simplified summary
    res.json({
      totalCitations: statistics.totalCitations,
      totalRevenue: statistics.totalRevenue,
      activeOfficers: statistics.activeOfficers,
      averageFine: statistics.averageFine,
    });
  } catch (error) {
    console.error('Error fetching statistics summary:', error);
    res.status(500).json({ error: 'Failed to fetch statistics summary' });
  }
});

statisticsRouter.get('/violations', async (req: Request, res: Response) => {
  try {
    const dataService: DataService = req.app.get('dataService');
    const statistics = await dataService.getStatistics();
    res.json(statistics.topViolationTypes);
  } catch (error) {
    console.error('Error fetching violation statistics:', error);
    res.status(500).json({ error: 'Failed to fetch violation statistics' });
  }
});

statisticsRouter.get('/neighborhoods', async (req: Request, res: Response) => {
  try {
    const dataService: DataService = req.app.get('dataService');
    const statistics = await dataService.getStatistics();
    res.json(statistics.topNeighborhoods);
  } catch (error) {
    console.error('Error fetching neighborhood statistics:', error);
    res.status(500).json({ error: 'Failed to fetch neighborhood statistics' });
  }
});

statisticsRouter.get('/hourly', async (req: Request, res: Response) => {
  try {
    const dataService: DataService = req.app.get('dataService');
    const statistics = await dataService.getStatistics();
    res.json(statistics.hourlyDistribution);
  } catch (error) {
    console.error('Error fetching hourly distribution:', error);
    res.status(500).json({ error: 'Failed to fetch hourly distribution' });
  }
});
