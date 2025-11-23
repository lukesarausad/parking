import { Router, Request, Response } from 'express';
import { DataService } from '../services/dataService';
import { CitationsQuery } from '@seattle-parking/shared';

export const citationsRouter = Router();

citationsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const dataService: DataService = req.app.get('dataService');

    const query: CitationsQuery = {
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      type: req.query.type as string | undefined,
      neighborhood: req.query.neighborhood as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 100,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
    };

    const result = await dataService.getCitations(query);
    res.json(result);
  } catch (error) {
    console.error('Error fetching citations:', error);
    res.status(500).json({ error: 'Failed to fetch citations' });
  }
});

citationsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const dataService: DataService = req.app.get('dataService');
    const { citations } = await dataService.getCitations({ limit: 1000 });

    const citation = citations.find(c => c.id === req.params.id);
    if (!citation) {
      return res.status(404).json({ error: 'Citation not found' });
    }

    res.json(citation);
  } catch (error) {
    console.error('Error fetching citation:', error);
    res.status(500).json({ error: 'Failed to fetch citation' });
  }
});
