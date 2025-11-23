const API_BASE = '/api'

// Types for the new Parking Intelligence API
export interface ParkingZone {
  id: string
  name: string
  location: { lat: number; lng: number }
  neighborhood: string
  riskScore: number
  peakHours: string[]
  avgOccupancy: number
  enforcementLevel: 'low' | 'medium' | 'high'
  lastUpdated: string
}

export interface HourlyPattern {
  hour: number
  riskScore: number
  avgOccupancy: number
}

export interface NeighborhoodStats {
  name: string
  totalSpaces: number
  avgRiskScore: number
  peakHour: number
  enforcementLevel: 'low' | 'medium' | 'high'
}

export interface ZonesResponse {
  zones: ParkingZone[]
  realDataLoaded: boolean
  timestamp: string
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export const api = {
  // Parking Zones (new)
  getZones: async (): Promise<ZonesResponse> => {
    return fetchJson<ZonesResponse>(`${API_BASE}/zones`)
  },

  getHourlyPatterns: async (): Promise<HourlyPattern[]> => {
    return fetchJson<HourlyPattern[]>(`${API_BASE}/zones/patterns`)
  },

  getNeighborhoodStats: async (): Promise<NeighborhoodStats[]> => {
    return fetchJson<NeighborhoodStats[]>(`${API_BASE}/zones/neighborhoods`)
  },

  getRiskAtLocation: async (lat: number, lng: number): Promise<{
    riskScore: number
    nearestZone: string
    advice: string
  }> => {
    return fetchJson(`${API_BASE}/zones/risk?lat=${lat}&lng=${lng}`)
  },

  // Health
  checkHealth: async (): Promise<{
    status: string
    timestamp: string
    version: string
    realDataLoaded: boolean
  }> => {
    return fetchJson(`${API_BASE}/health`)
  },
}

export default api
