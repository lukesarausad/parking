import { useState, useEffect, useCallback } from 'react'
import { Map } from './components/Map'
import { Header } from './components/Header'
import { useWebSocket } from './hooks/useWebSocket'
import { api, ParkingZone } from './services/api'

function App() {
  const [zones, setZones] = useState<ParkingZone[]>([])
  const [realDataLoaded, setRealDataLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // WebSocket connection for live updates
  const { lastUpdate, isConnected } = useWebSocket()

  // Fetch parking zones
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.getZones()
      setZones(response.zones)
      setRealDataLoaded(response.realDataLoaded)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to fetch parking zones. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle WebSocket updates
  useEffect(() => {
    if (lastUpdate && lastUpdate.type === 'zones_update') {
      setZones(lastUpdate.data as ParkingZone[])
    }
  }, [lastUpdate])

  // Calculate stats
  const highRiskCount = zones.filter(z => z.enforcementLevel === 'high').length
  const avgRisk = zones.length > 0
    ? Math.round(zones.reduce((sum, z) => sum + z.riskScore, 0) / zones.length)
    : 0

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header
        isConnected={isConnected}
        onRefresh={fetchData}
        highRiskZones={highRiskCount}
        avgRiskScore={avgRisk}
        realDataLoaded={realDataLoaded}
        loading={loading}
      />

      <main className="flex-1 relative">
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
            {error}
          </div>
        )}

        {!realDataLoaded && !loading && (
          <div className="absolute top-4 left-4 z-[1000] bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded-lg shadow text-sm max-w-xs">
            <strong>Note:</strong> Using baseline risk estimates. Real-time data unavailable.
          </div>
        )}

        <Map zones={zones} />
      </main>
    </div>
  )
}

export default App
