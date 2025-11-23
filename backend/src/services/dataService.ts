import axios from 'axios';
import NodeCache from 'node-cache';
import {
  OfficerLocation,
  SEATTLE_NEIGHBORHOODS,
  SEATTLE_BOUNDS,
} from '@seattle-parking/shared';

// Seattle Open Data API endpoints
const SEATTLE_DATA_API = 'https://data.seattle.gov/resource';
const PARKING_TRANSACTIONS_DATASET = 'gg89-k5p6';

interface RawParkingTransaction {
  longitude?: string;
  latitude?: string;
  blockfacename?: string;
  paidparkingarea?: string;
}

// Simulated officer patrol areas (high enforcement zones in Seattle)
const PATROL_ZONES = [
  { name: 'Downtown', center: { lat: 47.6062, lng: -122.3321 }, radius: 0.015 },
  { name: 'Capitol Hill', center: { lat: 47.6253, lng: -122.3222 }, radius: 0.012 },
  { name: 'University District', center: { lat: 47.6588, lng: -122.3130 }, radius: 0.015 },
  { name: 'Ballard', center: { lat: 47.6792, lng: -122.3859 }, radius: 0.012 },
  { name: 'Fremont', center: { lat: 47.6512, lng: -122.3509 }, radius: 0.010 },
  { name: 'South Lake Union', center: { lat: 47.6280, lng: -122.3375 }, radius: 0.010 },
  { name: 'Pioneer Square', center: { lat: 47.6015, lng: -122.3340 }, radius: 0.008 },
  { name: 'Belltown', center: { lat: 47.6150, lng: -122.3475 }, radius: 0.010 },
  { name: 'Queen Anne', center: { lat: 47.6375, lng: -122.3575 }, radius: 0.012 },
  { name: 'First Hill', center: { lat: 47.6100, lng: -122.3250 }, radius: 0.008 },
];

// Persistent officer state
interface OfficerState {
  id: string;
  zone: typeof PATROL_ZONES[0];
  currentLat: number;
  currentLng: number;
  heading: number; // Direction in radians
  speed: number; // Movement per update
  citationsToday: number;
  lastUpdate: Date;
  shiftStart: Date;
  isOnBreak: boolean;
}

export class DataService {
  private cache: NodeCache;
  private officers: Map<string, OfficerState> = new Map();
  private initialized = false;

  constructor() {
    this.cache = new NodeCache({ stdTTL: 60, checkperiod: 30 });
  }

  async initialize(): Promise<void> {
    console.log('Initializing DataService...');

    // Initialize officers with patrol zones
    this.initializeOfficers();

    // Start officer movement simulation
    this.startOfficerMovement();

    this.initialized = true;
    console.log('DataService initialized with', this.officers.size, 'officers');
  }

  private initializeOfficers(): void {
    // Create 15-25 officers distributed across patrol zones
    const officerCount = Math.floor(Math.random() * 11) + 15;

    for (let i = 1; i <= officerCount; i++) {
      const zone = PATROL_ZONES[i % PATROL_ZONES.length];
      const officerId = `OFF-${String(i).padStart(3, '0')}`;

      // Random position within zone
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * zone.radius;

      this.officers.set(officerId, {
        id: officerId,
        zone,
        currentLat: zone.center.lat + Math.sin(angle) * distance,
        currentLng: zone.center.lng + Math.cos(angle) * distance,
        heading: Math.random() * 2 * Math.PI,
        speed: 0.0001 + Math.random() * 0.0002, // ~10-30m per update
        citationsToday: Math.floor(Math.random() * 15) + 5,
        lastUpdate: new Date(),
        shiftStart: new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000),
        isOnBreak: Math.random() < 0.1, // 10% chance on break
      });
    }
  }

  private startOfficerMovement(): void {
    // Update officer positions every 10 seconds
    setInterval(() => {
      this.updateOfficerPositions();
    }, 10000);
  }

  private updateOfficerPositions(): void {
    const now = new Date();

    this.officers.forEach((officer, id) => {
      // Randomly toggle break status
      if (Math.random() < 0.02) {
        officer.isOnBreak = !officer.isOnBreak;
      }

      // Don't move officers on break
      if (officer.isOnBreak) {
        officer.lastUpdate = now;
        return;
      }

      // Randomly change heading
      if (Math.random() < 0.3) {
        officer.heading += (Math.random() - 0.5) * Math.PI / 2;
      }

      // Calculate new position
      const newLat = officer.currentLat + Math.sin(officer.heading) * officer.speed;
      const newLng = officer.currentLng + Math.cos(officer.heading) * officer.speed;

      // Check if still within zone, if not, turn around
      const distFromCenter = Math.sqrt(
        Math.pow(newLat - officer.zone.center.lat, 2) +
        Math.pow(newLng - officer.zone.center.lng, 2)
      );

      if (distFromCenter > officer.zone.radius) {
        // Turn toward center
        officer.heading = Math.atan2(
          officer.zone.center.lat - officer.currentLat,
          officer.zone.center.lng - officer.currentLng
        );
      } else {
        officer.currentLat = newLat;
        officer.currentLng = newLng;
      }

      // Randomly issue a citation
      if (Math.random() < 0.05) {
        officer.citationsToday++;
      }

      officer.lastUpdate = now;
    });

    // Clear cache so next request gets fresh data
    this.cache.del('active_officers');
  }

  private getNeighborhood(lat: number, lng: number): string {
    const neighborhoods: Record<string, { lat: [number, number]; lng: [number, number] }> = {
      'Downtown': { lat: [47.598, 47.615], lng: [-122.345, -122.325] },
      'Capitol Hill': { lat: [47.615, 47.635], lng: [-122.330, -122.305] },
      'University District': { lat: [47.650, 47.680], lng: [-122.320, -122.290] },
      'Ballard': { lat: [47.665, 47.695], lng: [-122.400, -122.370] },
      'Fremont': { lat: [47.645, 47.665], lng: [-122.365, -122.340] },
      'Queen Anne': { lat: [47.625, 47.650], lng: [-122.375, -122.345] },
      'South Lake Union': { lat: [47.620, 47.635], lng: [-122.345, -122.330] },
      'Pioneer Square': { lat: [47.598, 47.605], lng: [-122.340, -122.325] },
      'First Hill': { lat: [47.605, 47.620], lng: [-122.330, -122.310] },
      'Belltown': { lat: [47.610, 47.620], lng: [-122.355, -122.340] },
    };

    for (const [name, bounds] of Object.entries(neighborhoods)) {
      if (
        lat >= bounds.lat[0] && lat <= bounds.lat[1] &&
        lng >= bounds.lng[0] && lng <= bounds.lng[1]
      ) {
        return name;
      }
    }

    return 'Seattle';
  }

  async getActiveOfficers(): Promise<OfficerLocation[]> {
    const cacheKey = 'active_officers';
    const cached = this.cache.get<OfficerLocation[]>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const officers: OfficerLocation[] = [];

    this.officers.forEach((state) => {
      // Officers are active if not on break and updated recently
      const timeSinceUpdate = now.getTime() - state.lastUpdate.getTime();
      const isActive = !state.isOnBreak && timeSinceUpdate < 60000;

      officers.push({
        id: state.id,
        lastSeen: state.lastUpdate,
        location: {
          lat: state.currentLat,
          lng: state.currentLng,
          neighborhood: state.zone.name,
        },
        citationsToday: state.citationsToday,
        isActive,
      });
    });

    // Sort by active status, then by citations
    officers.sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return b.citationsToday - a.citationsToday;
    });

    this.cache.set(cacheKey, officers, 5); // Short cache for real-time feel
    return officers;
  }

  // Keep these methods for API compatibility but simplified
  async getCitations() {
    return { citations: [], total: 0, page: 1, pageSize: 100 };
  }

  async getStatistics() {
    const officers = await this.getActiveOfficers();
    const activeCount = officers.filter(o => o.isActive).length;
    const totalCitations = officers.reduce((sum, o) => sum + o.citationsToday, 0);

    return {
      totalCitations,
      totalRevenue: totalCitations * 47,
      activeOfficers: activeCount,
      topViolationTypes: [],
      topNeighborhoods: [],
      hourlyDistribution: [],
      averageFine: 47,
    };
  }

  async getHeatmapData() {
    return [];
  }
}
