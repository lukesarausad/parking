import { RefreshCw, Wifi, WifiOff, Users } from 'lucide-react'

interface HeaderProps {
  isConnected: boolean
  onRefresh: () => void
  activeOfficers: number
  totalOfficers: number
  loading: boolean
}

export function Header({ isConnected, onRefresh, activeOfficers, totalOfficers, loading }: HeaderProps) {
  return (
    <header className="bg-seattle-navy text-white px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-seattle-blue rounded-full flex items-center justify-center font-bold text-lg">
            P
          </div>
          <div>
            <h1 className="text-xl font-bold">Seattle Parking Tracker</h1>
            <p className="text-xs text-gray-300">Real-time enforcement officer locations</p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* Officer count */}
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
            <Users size={18} className="text-green-400" />
            <span className="text-sm">
              <span className="font-bold text-green-400">{activeOfficers}</span>
              <span className="text-gray-300 hidden sm:inline"> / {totalOfficers} officers</span>
            </span>
          </div>

          {/* Live status indicator */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi size={16} className="text-green-400 live-indicator" />
                <span className="text-sm text-green-400 hidden sm:inline">Live</span>
              </>
            ) : (
              <>
                <WifiOff size={16} className="text-yellow-400" />
                <span className="text-sm text-yellow-400 hidden sm:inline">Offline</span>
              </>
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
