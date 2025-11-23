import { useState, useEffect, useCallback } from 'react'
import { Citation, Statistics, OfficerLocation, HeatmapData } from '@seattle-parking/shared'
import { Map } from './components/Map'
import { StatsDashboard } from './components/StatsDashboard'
import { FilterPanel } from './components/FilterPanel'
import { CitationList } from './components/CitationList'
import { Header } from './components/Header'
import { useWebSocket } from './hooks/useWebSocket'
import { api } from './services/api'

export interface Filters {
  timeRange: 'hour' | 'today' | 'week'
  violationType: string
  neighborhood: string
  showHeatmap: boolean
  showOfficers: boolean
}

function App() {
  const [citations, setCitations] = useState<Citation[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [officers, setOfficers] = useState<OfficerLocation[]>([])
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([])
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [filters, setFilters] = useState<Filters>({
    timeRange: 'today',
    violationType: '',
    neighborhood: '',
    showHeatmap: true,
    showOfficers: true,
  })

  // WebSocket connection for live updates
  const { lastUpdate, isConnected } = useWebSocket()

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Calculate time range
      const now = new Date()
      let from: Date

      switch (filters.timeRange) {
        case 'hour':
          from = new Date(now.getTime() - 60 * 60 * 1000)
          break
        case 'week':
          from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        default:
          from = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      }

      // Fetch all data in parallel
      const [citationsRes, statsRes, officersRes, heatmapRes] = await Promise.all([
        api.getCitations({
          from: from.toISOString(),
          to: now.toISOString(),
          type: filters.violationType || undefined,
          neighborhood: filters.neighborhood || undefined,
          limit: 500,
        }),
        api.getStatistics(),
        filters.showOfficers ? api.getActiveOfficers() : Promise.resolve([]),
        filters.showHeatmap ? api.getHeatmapData() : Promise.resolve([]),
      ])

      setCitations(citationsRes.citations)
      setStatistics(statsRes)
      setOfficers(officersRes)
      setHeatmapData(heatmapRes)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to fetch data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle WebSocket updates
  useEffect(() => {
    if (lastUpdate) {
      if (lastUpdate.type === 'citation') {
        setCitations(prev => [lastUpdate.data as Citation, ...prev.slice(0, 499)])
      } else if (lastUpdate.type === 'stats_update') {
        setStatistics(prev => prev ? { ...prev, ...lastUpdate.data } : null)
      } else if (lastUpdate.type === 'officer_location') {
        const updatedOfficer = lastUpdate.data as OfficerLocation
        setOfficers(prev => {
          const index = prev.findIndex(o => o.id === updatedOfficer.id)
          if (index >= 0) {
            const newOfficers = [...prev]
            newOfficers[index] = updatedOfficer
            return newOfficers
          }
          return [updatedOfficer, ...prev]
        })
      }
    }
  }, [lastUpdate])

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header
        isConnected={isConnected}
        onRefresh={fetchData}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-96' : 'w-0'
          } transition-all duration-300 overflow-hidden flex flex-col bg-white border-r border-gray-200`}
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Stats Dashboard */}
            <div className="p-4 border-b border-gray-200">
              <StatsDashboard statistics={statistics} loading={loading} />
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-gray-200">
              <FilterPanel filters={filters} onFiltersChange={setFilters} />
            </div>

            {/* Citation List */}
            <div className="flex-1 overflow-hidden">
              <CitationList
                citations={citations}
                selectedCitation={selectedCitation}
                onSelectCitation={setSelectedCitation}
                loading={loading}
              />
            </div>
          </div>
        </aside>

        {/* Main Map Area */}
        <main className="flex-1 relative">
          {error && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
              {error}
            </div>
          )}

          <Map
            citations={citations}
            officers={officers}
            heatmapData={heatmapData}
            selectedCitation={selectedCitation}
            onSelectCitation={setSelectedCitation}
            showHeatmap={filters.showHeatmap}
            showOfficers={filters.showOfficers}
          />
        </main>
      </div>
    </div>
  )
}

export default App
