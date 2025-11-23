import { Router, Request, Response } from 'express';
import { DataService } from '../services/dataService';

export const officersRouter = Router();

officersRouter.get('/active', async (req: Request, res: Response) => {
  try {
    const dataService: DataService = req.app.get('dataService');
    const officers = await dataService.getActiveOfficers();

    // Filter to only active officers by default
    const activeOnly = req.query.all !== 'true';
    const result = activeOnly ? officers.filter(o => o.isActive) : officers;

    res.json(result);
  } catch (error) {
    console.error('Error fetching active officers:', error);
    res.status(500).json({ error: 'Failed to fetch active officers' });
  }
});

officersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const dataService: DataService = req.app.get('dataService');
    const officers = await dataService.getActiveOfficers();

    const officer = officers.find(o => o.id === req.params.id);
    if (!officer) {
      return res.status(404).json({ error: 'Officer not found' });
    }

    res.json(officer);
  } catch (error) {
    console.error('Error fetching officer:', error);
    res.status(500).json({ error: 'Failed to fetch officer' });
  }
});
