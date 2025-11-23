import { RefreshCw, Menu, X, Wifi, WifiOff } from 'lucide-react'

interface HeaderProps {
  isConnected: boolean
  onRefresh: () => void
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export function Header({ isConnected, onRefresh, sidebarOpen, onToggleSidebar }: HeaderProps) {
  return (
    <header className="bg-seattle-navy text-white px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-seattle-blue rounded-full flex items-center justify-center font-bold text-lg">
              P
            </div>
            <div>
              <h1 className="text-xl font-bold">Seattle Parking Tracker</h1>
              <p className="text-xs text-gray-300">Real-time enforcement monitoring</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Live status indicator */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi size={16} className="text-green-400 live-indicator" />
                <span className="text-sm text-green-400">Live</span>
              </>
            ) : (
              <>
                <WifiOff size={16} className="text-yellow-400" />
                <span className="text-sm text-yellow-400">Offline</span>
              </>
            )}
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-3 py-2 bg-seattle-blue hover:bg-blue-700 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  )
}
