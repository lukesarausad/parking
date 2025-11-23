import { RefreshCw, Wifi, WifiOff, AlertTriangle, MapPin, Database } from 'lucide-react'

interface HeaderProps {
  isConnected: boolean
  onRefresh: () => void
  highRiskZones: number
  avgRiskScore: number
  realDataLoaded: boolean
  loading: boolean
}

export function Header({
  isConnected,
  onRefresh,
  highRiskZones,
  avgRiskScore,
  realDataLoaded,
  loading,
}: HeaderProps) {
  // Determine risk level color
  const getRiskColor = (score: number) => {
    if (score >= 60) return 'text-red-400'
    if (score >= 40) return 'text-yellow-400'
    return 'text-green-400'
  }

  return (
    <header className="bg-seattle-navy text-white px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-seattle-blue rounded-full flex items-center justify-center font-bold text-lg">
            P
          </div>
          <div>
            <h1 className="text-xl font-bold">Seattle Parking Intelligence</h1>
            <p className="text-xs text-gray-300">Real-time enforcement risk analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          {/* High risk zones */}
          <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
            <AlertTriangle size={16} className="text-red-400" />
            <span className="text-sm">
              <span className="font-bold text-red-400">{highRiskZones}</span>
              <span className="text-gray-300"> high risk</span>
            </span>
          </div>

          {/* Average risk score */}
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
            <MapPin size={16} className={getRiskColor(avgRiskScore)} />
            <span className="text-sm">
              <span className={`font-bold ${getRiskColor(avgRiskScore)}`}>{avgRiskScore}</span>
              <span className="text-gray-300 hidden sm:inline"> avg risk</span>
            </span>
          </div>

          {/* Data source indicator */}
          <div className="hidden md:flex items-center gap-2">
            <Database size={14} className={realDataLoaded ? 'text-green-400' : 'text-yellow-400'} />
            <span className="text-xs text-gray-400">
              {realDataLoaded ? 'Live data' : 'Baseline'}
            </span>
          </div>

          {/* Connection status */}
          <div className="flex items-center gap-1">
            {isConnected ? (
              <Wifi size={16} className="text-green-400" />
            ) : (
              <WifiOff size={16} className="text-yellow-400" />
            )}
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-seattle-blue hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  )
}
