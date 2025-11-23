import axios from 'axios';
import NodeCache from 'node-cache';
import {
  Citation,
  CitationsQuery,
  CitationsResponse,
  Statistics,
  HeatmapData,
  OfficerLocation,
  SEATTLE_NEIGHBORHOODS,
  VIOLATION_TYPES,
  FINE_AMOUNTS,
  SEATTLE_BOUNDS,
  isWithinSeattleBounds,
  anonymizePlate,
} from '@seattle-parking/shared';

// Seattle Open Data API endpoints
const SEATTLE_DATA_API = 'https://data.seattle.gov/resource';
const PARKING_TRANSACTIONS_DATASET = 'gg89-k5p6';
const BLOCKFACE_DATASET = 'kqdm-4wfs';

interface RawParkingTransaction {
  objectid?: string;
  transactionid?: string;
  occupancydatetime?: string;
  paidoccupancy?: string;
  blockfacename?: string;
  sideofstreet?: string;
  elementkey?: string;
  parkingspaceid?: string;
  parkingcategory?: string;
  paidparkingarea?: string;
  paidparkingsubarea?: string;
  parkingtimelimitcategory?: string;
  longitude?: string;
  latitude?: string;
}

export class DataService {
  private cache: NodeCache;
  private apiKey: string | undefined;

  constructor() {
    this.cache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 minute cache
    this.apiKey = process.env.SEATTLE_OPEN_DATA_API_KEY;
  }

  async initialize(): Promise<void> {
    console.log('Initializing DataService...');
    // Pre-fetch initial data
    await this.fetchParkingTransactions();
    console.log('DataService initialized');
  }

  private async fetchFromSeattleAPI<T>(
    dataset: string,
    params: Record<string, string | number> = {}
  ): Promise<T[]> {
    const url = `${SEATTLE_DATA_API}/${dataset}.json`;

    try {
      const response = await axios.get<T[]>(url, {
        params: {
          ...params,
          ...(this.apiKey && { '$$app_token': this.apiKey }),
        },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching from Seattle API (${dataset}):`, error);
      return [];
    }
  }

  private async fetchParkingTransactions(limit = 1000): Promise<RawParkingTransaction[]> {
    const cacheKey = `transactions_${limit}`;
    const cached = this.cache.get<RawParkingTransaction[]>(cacheKey);
    if (cached) return cached;

    const data = await this.fetchFromSeattleAPI<RawParkingTransaction>(
      PARKING_TRANSACTIONS_DATASET,
      {
        $limit: limit,
        $order: 'occupancydatetime DESC',
      }
    );

    this.cache.set(cacheKey, data);
    return data;
  }

  // Generate simulated citations based on parking transaction patterns
  private generateCitationsFromTransactions(
    transactions: RawParkingTransaction[],
    query: CitationsQuery
  ): Citation[] {
    const citations: Citation[] = [];
    const now = new Date();
    const fromDate = query.from ? new Date(query.from) : new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const toDate = query.to ? new Date(query.to) : now;

    // Use real transaction data to create realistic citation locations
    transactions.forEach((tx, index) => {
      if (!tx.latitude || !tx.longitude) return;

      const lat = parseFloat(tx.latitude);
      const lng = parseFloat(tx.longitude);

      if (!isWithinSeattleBounds(lat, lng)) return;

      // Simulate citations at ~15% of parking locations (realistic rate)
      if (Math.random() > 0.15) return;

      const violationType = VIOLATION_TYPES[Math.floor(Math.random() * VIOLATION_TYPES.length)];
      const neighborhood = this.getNeighborhood(lat, lng);

      // Generate timestamp within range
      const timestamp = new Date(
        fromDate.getTime() + Math.random() * (toDate.getTime() - fromDate.getTime())
      );

      // Filter by violation type if specified
      if (query.type && violationType !== query.type) return;

      // Filter by neighborhood if specified
      if (query.neighborhood && neighborhood !== query.neighborhood) return;

      citations.push({
        id: `CIT-${Date.now()}-${index}`,
        timestamp,
        location: {
          lat,
          lng,
          address: tx.blockfacename || 'Unknown Address',
          neighborhood,
        },
        violationType,
        fineAmount: FINE_AMOUNTS[violationType] || 47,
        officerId: `OFF-${Math.floor(Math.random() * 50) + 1}`,
        vehicleInfo: {
          make: ['Toyota', 'Honda', 'Ford', 'Tesla', 'Subaru', 'BMW', 'Audi'][
            Math.floor(Math.random() * 7)
          ],
          color: ['Black', 'White', 'Silver', 'Blue', 'Red', 'Gray'][
            Math.floor(Math.random() * 6)
          ],
          plate: anonymizePlate(`ABC${Math.floor(Math.random() * 10000)}`),
        },
        meterNumber: tx.elementkey || undefined,
        blockface: tx.blockfacename || undefined,
      });
    });

    // Sort by timestamp descending
    citations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return citations;
  }

  private getNeighborhood(lat: number, lng: number): string {
    // Approximate neighborhood boundaries for Seattle
    const neighborhoods: Record<string, { lat: [number, number]; lng: [number, number] }> = {
      'Downtown': { lat: [47.598, 47.615], lng: [-122.345, -122.325] },
      'Capitol Hill': { lat: [47.615, 47.635], lng: [-122.330, -122.305] },
      'University District': { lat: [47.650, 47.680], lng: [-122.320, -122.290] },
      'Ballard': { lat: [47.665, 47.695], lng: [-122.400, -122.370] },
      'Fremont': { lat: [47.645, 47.665], lng: [-122.365, -122.340] },
      'Queen Anne': { lat: [47.625, 47.650], lng: [-122.375, -122.345] },
      'South Lake Union': { lat: [47.620, 47.635], lng: [-122.345, -122.330] },
      'Pioneer Square': { lat: [47.598, 47.605], lng: [-122.340, -122.325] },
      'International District': { lat: [47.595, 47.605], lng: [-122.330, -122.315] },
      'First Hill': { lat: [47.605, 47.620], lng: [-122.330, -122.310] },
      'Belltown': { lat: [47.610, 47.620], lng: [-122.355, -122.340] },
      'Wallingford': { lat: [47.650, 47.670], lng: [-122.345, -122.320] },
      'Green Lake': { lat: [47.670, 47.690], lng: [-122.345, -122.320] },
      'Columbia City': { lat: [47.555, 47.575], lng: [-122.295, -122.275] },
      'West Seattle': { lat: [47.535, 47.575], lng: [-122.410, -122.370] },
      'Beacon Hill': { lat: [47.560, 47.590], lng: [-122.315, -122.295] },
    };

    for (const [name, bounds] of Object.entries(neighborhoods)) {
      if (
        lat >= bounds.lat[0] && lat <= bounds.lat[1] &&
        lng >= bounds.lng[0] && lng <= bounds.lng[1]
      ) {
        return name;
      }
    }

    return SEATTLE_NEIGHBORHOODS[Math.floor(Math.random() * SEATTLE_NEIGHBORHOODS.length)];
  }

  async getCitations(query: CitationsQuery): Promise<CitationsResponse> {
    const cacheKey = `citations_${JSON.stringify(query)}`;
    const cached = this.cache.get<CitationsResponse>(cacheKey);
    if (cached) return cached;

    const transactions = await this.fetchParkingTransactions(2000);
    const allCitations = this.generateCitationsFromTransactions(transactions, query);

    const limit = query.limit || 100;
    const offset = query.offset || 0;
    const citations = allCitations.slice(offset, offset + limit);

    const response: CitationsResponse = {
      citations,
      total: allCitations.length,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    };

    this.cache.set(cacheKey, response, 60); // Cache for 1 minute
    return response;
  }

  async getStatistics(): Promise<Statistics> {
    const cacheKey = 'statistics';
    const cached = this.cache.get<Statistics>(cacheKey);
    if (cached) return cached;

    const { citations, total } = await this.getCitations({ limit: 1000 });

    // Calculate violation type distribution
    const violationCounts = new Map<string, number>();
    citations.forEach(c => {
      violationCounts.set(c.violationType, (violationCounts.get(c.violationType) || 0) + 1);
    });

    const topViolationTypes = Array.from(violationCounts.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / citations.length) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate neighborhood distribution
    const neighborhoodCounts = new Map<string, number>();
    citations.forEach(c => {
      const name = c.location.neighborhood || 'Unknown';
      neighborhoodCounts.set(name, (neighborhoodCounts.get(name) || 0) + 1);
    });

    const topNeighborhoods = Array.from(neighborhoodCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate hourly distribution
    const hourlyCounts = new Array(24).fill(0);
    citations.forEach(c => {
      const hour = new Date(c.timestamp).getHours();
      hourlyCounts[hour]++;
    });

    const hourlyDistribution = hourlyCounts.map((count, hour) => ({ hour, count }));

    // Calculate totals
    const totalRevenue = citations.reduce((sum, c) => sum + c.fineAmount, 0);
    const averageFine = citations.length > 0 ? totalRevenue / citations.length : 0;

    // Estimate active officers (unique officer IDs from recent citations)
    const recentOfficerIds = new Set(
      citations
        .filter(c => new Date(c.timestamp) > new Date(Date.now() - 2 * 60 * 60 * 1000))
        .map(c => c.officerId)
        .filter(Boolean)
    );

    const statistics: Statistics = {
      totalCitations: total,
      totalRevenue,
      activeOfficers: recentOfficerIds.size || Math.floor(Math.random() * 20) + 10,
      topViolationTypes,
      topNeighborhoods,
      hourlyDistribution,
      averageFine,
    };

    this.cache.set(cacheKey, statistics, 120); // Cache for 2 minutes
    return statistics;
  }

  async getHeatmapData(date?: string, neighborhood?: string): Promise<HeatmapData[]> {
    const cacheKey = `heatmap_${date}_${neighborhood}`;
    const cached = this.cache.get<HeatmapData[]>(cacheKey);
    if (cached) return cached;

    const { citations } = await this.getCitations({
      limit: 500,
      neighborhood,
    });

    // Group citations by grid cells
    const gridSize = 0.002; // ~200m grid cells
    const gridCounts = new Map<string, { lat: number; lng: number; count: number }>();

    citations.forEach(c => {
      const gridLat = Math.floor(c.location.lat / gridSize) * gridSize;
      const gridLng = Math.floor(c.location.lng / gridSize) * gridSize;
      const key = `${gridLat},${gridLng}`;

      const existing = gridCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        gridCounts.set(key, { lat: gridLat + gridSize / 2, lng: gridLng + gridSize / 2, count: 1 });
      }
    });

    // Normalize to intensity values
    const maxCount = Math.max(...Array.from(gridCounts.values()).map(g => g.count), 1);

    const heatmapData: HeatmapData[] = Array.from(gridCounts.values()).map(g => ({
      location: { lat: g.lat, lng: g.lng },
      intensity: g.count / maxCount,
      citationCount: g.count,
      timeRange: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date(),
      },
    }));

    this.cache.set(cacheKey, heatmapData, 300); // Cache for 5 minutes
    return heatmapData;
  }

  async getActiveOfficers(): Promise<OfficerLocation[]> {
    const cacheKey = 'active_officers';
    const cached = this.cache.get<OfficerLocation[]>(cacheKey);
    if (cached) return cached;

    const { citations } = await this.getCitations({ limit: 200 });

    // Group recent citations by officer
    const officerMap = new Map<string, { citations: Citation[] }>();
    citations
      .filter(c => c.officerId && new Date(c.timestamp) > new Date(Date.now() - 4 * 60 * 60 * 1000))
      .forEach(c => {
        const existing = officerMap.get(c.officerId!);
        if (existing) {
          existing.citations.push(c);
        } else {
          officerMap.set(c.officerId!, { citations: [c] });
        }
      });

    const officers: OfficerLocation[] = Array.from(officerMap.entries()).map(([id, data]) => {
      const latestCitation = data.citations[0];
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      return {
        id,
        lastSeen: new Date(latestCitation.timestamp),
        location: latestCitation.location,
        citationsToday: data.citations.length,
        isActive: new Date(latestCitation.timestamp) > twoHoursAgo,
      };
    });

    this.cache.set(cacheKey, officers, 60); // Cache for 1 minute
    return officers;
  }
}
