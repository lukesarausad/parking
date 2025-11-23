import {
  Citation,
  CitationsQuery,
  CitationsResponse,
  Statistics,
  OfficerLocation,
  HeatmapData,
} from '@seattle-parking/shared'

const API_BASE = '/api'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

export const api = {
  // Citations
  getCitations: async (query: CitationsQuery = {}): Promise<CitationsResponse> => {
    const queryString = buildQueryString({
      from: query.from,
      to: query.to,
      type: query.type,
      neighborhood: query.neighborhood,
      limit: query.limit,
      offset: query.offset,
    })
    return fetchJson<CitationsResponse>(`${API_BASE}/citations${queryString}`)
  },

  getCitation: async (id: string): Promise<Citation> => {
    return fetchJson<Citation>(`${API_BASE}/citations/${id}`)
  },

  // Statistics
  getStatistics: async (): Promise<Statistics> => {
    return fetchJson<Statistics>(`${API_BASE}/statistics/today`)
  },

  getStatisticsSummary: async (): Promise<{
    totalCitations: number
    totalRevenue: number
    activeOfficers: number
    averageFine: number
  }> => {
    return fetchJson(`${API_BASE}/statistics/summary`)
  },

  getViolationStats: async (): Promise<Statistics['topViolationTypes']> => {
    return fetchJson(`${API_BASE}/statistics/violations`)
  },

  getNeighborhoodStats: async (): Promise<Statistics['topNeighborhoods']> => {
    return fetchJson(`${API_BASE}/statistics/neighborhoods`)
  },

  getHourlyDistribution: async (): Promise<Statistics['hourlyDistribution']> => {
    return fetchJson(`${API_BASE}/statistics/hourly`)
  },

  // Officers
  getActiveOfficers: async (includeInactive = false): Promise<OfficerLocation[]> => {
    const queryString = includeInactive ? '?all=true' : ''
    return fetchJson<OfficerLocation[]>(`${API_BASE}/officers/active${queryString}`)
  },

  getOfficer: async (id: string): Promise<OfficerLocation> => {
    return fetchJson<OfficerLocation>(`${API_BASE}/officers/${id}`)
  },

  // Heatmap
  getHeatmapData: async (date?: string, neighborhood?: string): Promise<HeatmapData[]> => {
    const queryString = buildQueryString({ date, neighborhood })
    return fetchJson<HeatmapData[]>(`${API_BASE}/heatmap${queryString}`)
  },

  // Health
  checkHealth: async (): Promise<{ status: string; timestamp: string; version: string }> => {
    return fetchJson(`${API_BASE}/health`)
  },
}

export default api
