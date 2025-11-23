import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { OfficerLocation, SEATTLE_BOUNDS, formatTimestamp } from '@seattle-parking/shared'

interface MapProps {
  officers: OfficerLocation[]
}

// Custom officer marker icon
function createOfficerIcon(isActive: boolean) {
  return new L.DivIcon({
    className: 'custom-marker officer',
    html: `<div style="
      background: ${isActive ? '#00843D' : '#9CA3AF'};
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

// Component to fit bounds to officers
function MapBounds({ officers }: { officers: OfficerLocation[] }) {
  const map = useMap()

  useEffect(() => {
    if (officers.length > 0) {
      const bounds = L.latLngBounds(
        officers.map(o => [o.location.lat, o.location.lng])
      )
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [officers.length]) // Only re-fit when count changes

  return null
}

export function Map({ officers }: MapProps) {
  return (
    <MapContainer
      center={[SEATTLE_BOUNDS.center.lat, SEATTLE_BOUNDS.center.lng]}
      zoom={13}
      className="h-full w-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapBounds officers={officers} />

      {/* Officer markers */}
      {officers.map((officer) => (
        <Marker
          key={officer.id}
          position={[officer.location.lat, officer.location.lng]}
          icon={createOfficerIcon(officer.isActive)}
        >
          <Popup>
            <div className="min-w-[180px]">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${officer.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="font-semibold">
                  {officer.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Officer ID:</span>
                  <span className="font-medium">{officer.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last seen:</span>
                  <span>{formatTimestamp(new Date(officer.lastSeen))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Citations today:</span>
                  <span className="font-medium">{officer.citationsToday}</span>
                </div>
                {officer.location.neighborhood && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Area:</span>
                    <span>{officer.location.neighborhood}</span>
                  </div>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
