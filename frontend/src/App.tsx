import { useState, useEffect, useCallback } from 'react'
import { OfficerLocation } from '@seattle-parking/shared'
import { Map } from './components/Map'
import { Header } from './components/Header'
import { useWebSocket } from './hooks/useWebSocket'
import { api } from './services/api'

function App() {
  const [officers, setOfficers] = useState<OfficerLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // WebSocket connection for live updates
  const { lastUpdate, isConnected } = useWebSocket()

  // Fetch officer locations
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const officersRes = await api.getActiveOfficers(true) // Include all officers
      setOfficers(officersRes)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to fetch officer locations. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Handle WebSocket updates
  useEffect(() => {
    if (lastUpdate && lastUpdate.type === 'officer_location') {
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
  }, [lastUpdate])

  const activeCount = officers.filter(o => o.isActive).length

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header
        isConnected={isConnected}
        onRefresh={fetchData}
        activeOfficers={activeCount}
        totalOfficers={officers.length}
        loading={loading}
      />

      <main className="flex-1 relative">
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
            {error}
          </div>
        )}

        <Map officers={officers} />
      </main>
    </div>
  )
}

export default App
