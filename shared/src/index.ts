// Core data types for Seattle Parking Tracker

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  neighborhood?: string;
}

export interface Citation {
  id: string;
  timestamp: Date;
  location: Location;
  violationType: string;
  fineAmount: number;
  officerId?: string;
  vehicleInfo?: {
    make?: string;
    color?: string;
    plate?: string; // Anonymized - last digits hidden
  };
  meterNumber?: string;
  blockface?: string;
}

export interface OfficerLocation {
  id: string;
  lastSeen: Date;
  location: Location;
  citationsToday: number;
  isActive: boolean;
}

export interface ParkingTransaction {
  id: string;
  timestamp: Date;
  location: Location;
  meterNumber: string;
  blockface?: string;
  amount: number;
  duration: number; // minutes
  paymentMethod: 'coin' | 'card' | 'phone';
  occupancyStatus?: 'paid' | 'expired' | 'vacant';
}

export interface HeatmapData {
  location: Location;
  intensity: number; // 0-1 scale
  citationCount: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface Statistics {
  totalCitations: number;
  totalRevenue: number;
  activeOfficers: number;
  topViolationTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  topNeighborhoods: Array<{
    name: string;
    count: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    count: number;
  }>;
  averageFine: number;
}

// API Request/Response types
export interface CitationsQuery {
  from?: string;
  to?: string;
  type?: string;
  neighborhood?: string;
  limit?: number;
  offset?: number;
}

export interface CitationsResponse {
  citations: Citation[];
  total: number;
  page: number;
  pageSize: number;
}

export interface HeatmapQuery {
  date?: string;
  neighborhood?: string;
  resolution?: 'low' | 'medium' | 'high';
}

export interface LiveUpdate {
  type: 'citation' | 'officer_location' | 'stats_update';
  timestamp: Date;
  data: Citation | OfficerLocation | Partial<Statistics>;
}

// Seattle-specific neighborhoods
export const SEATTLE_NEIGHBORHOODS = [
  'Downtown',
  'Capitol Hill',
  'University District',
  'Ballard',
  'Fremont',
  'Queen Anne',
  'South Lake Union',
  'Pioneer Square',
  'International District',
  'First Hill',
  'Belltown',
  'Wallingford',
  'Green Lake',
  'Columbia City',
  'West Seattle',
  'Beacon Hill',
  'Central District',
  'Madison Park',
  'Montlake',
  'Ravenna',
] as const;

export type SeattleNeighborhood = (typeof SEATTLE_NEIGHBORHOODS)[number];

// Violation types based on Seattle parking regulations
export const VIOLATION_TYPES = [
  'Expired Meter',
  'No Parking Zone',
  'Street Cleaning',
  'Fire Hydrant',
  'Handicap Zone',
  'Loading Zone',
  'Double Parking',
  'Overtime Parking',
  'No Permit',
  'Residential Zone',
  'Bus Zone',
  'Crosswalk',
  'Yellow Curb',
  'Blocking Driveway',
  'Snow Emergency',
] as const;

export type ViolationType = (typeof VIOLATION_TYPES)[number];

// Fine amounts by violation type (approximate Seattle rates)
export const FINE_AMOUNTS: Record<string, number> = {
  'Expired Meter': 47,
  'No Parking Zone': 47,
  'Street Cleaning': 65,
  'Fire Hydrant': 250,
  'Handicap Zone': 450,
  'Loading Zone': 47,
  'Double Parking': 47,
  'Overtime Parking': 47,
  'No Permit': 65,
  'Residential Zone': 65,
  'Bus Zone': 250,
  'Crosswalk': 250,
  'Yellow Curb': 47,
  'Blocking Driveway': 47,
  'Snow Emergency': 65,
};

// Seattle map bounds
export const SEATTLE_BOUNDS = {
  north: 47.7341,
  south: 47.4955,
  east: -122.2244,
  west: -122.4359,
  center: {
    lat: 47.6062,
    lng: -122.3321,
  },
};

// Utility functions
export function anonymizePlate(plate: string): string {
  if (plate.length <= 3) return '***';
  return plate.slice(0, -3) + '***';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function isWithinSeattleBounds(lat: number, lng: number): boolean {
  return (
    lat >= SEATTLE_BOUNDS.south &&
    lat <= SEATTLE_BOUNDS.north &&
    lng >= SEATTLE_BOUNDS.west &&
    lng <= SEATTLE_BOUNDS.east
  );
}
