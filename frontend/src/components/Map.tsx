import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet'
import { SEATTLE_BOUNDS } from '@seattle-parking/shared'
import { ParkingZone } from '../services/api'

interface MapProps {
  zones: ParkingZone[]
}

// Get color based on risk score
function getRiskColor(riskScore: number): string {
  if (riskScore >= 70) return '#dc2626' // red-600
  if (riskScore >= 50) return '#f97316' // orange-500
  if (riskScore >= 30) return '#eab308' // yellow-500
  return '#22c55e' // green-500
}

function getEnforcementLabel(level: 'low' | 'medium' | 'high'): string {
  switch (level) {
    case 'high':
      return 'High Enforcement'
    case 'medium':
      return 'Moderate Enforcement'
    default:
      return 'Lower Enforcement'
  }
}

export function Map({ zones }: MapProps) {
  return (
    <MapContainer
      center={[SEATTLE_BOUNDS.center.lat, SEATTLE_BOUNDS.center.lng]}
      zoom={12}
      className="h-full w-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Risk zone circles */}
      {zones.map((zone) => (
        <CircleMarker
          key={zone.id}
          center={[zone.location.lat, zone.location.lng]}
          radius={Math.max(15, zone.riskScore / 3)} // Size based on risk
          pathOptions={{
            color: getRiskColor(zone.riskScore),
            fillColor: getRiskColor(zone.riskScore),
            fillOpacity: 0.4,
            weight: 2,
          }}
        >
          <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
            <div className="font-semibold">{zone.name}</div>
            <div className="text-sm">Risk Score: {zone.riskScore}</div>
          </Tooltip>

          <Popup>
            <div className="min-w-[220px]">
              <h3 className="font-bold text-lg mb-2" style={{ color: getRiskColor(zone.riskScore) }}>
                {zone.name}
              </h3>

              {/* Risk score meter */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Risk Score</span>
                  <span className="font-bold" style={{ color: getRiskColor(zone.riskScore) }}>
                    {zone.riskScore}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${zone.riskScore}%`,
                      backgroundColor: getRiskColor(zone.riskScore),
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Enforcement:</span>
                  <span
                    className="font-medium"
                    style={{ color: getRiskColor(zone.riskScore) }}
                  >
                    {getEnforcementLabel(zone.enforcementLevel)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Peak Hours:</span>
                  <span>{zone.peakHours.join(', ')}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Avg Occupancy:</span>
                  <span>{Math.round(zone.avgOccupancy)}%</span>
                </div>
              </div>

              {/* Advice section */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  {zone.riskScore >= 70 && (
                    <span className="text-red-600 font-medium">
                      High risk! Consider a parking garage or moving to a lower-risk area.
                    </span>
                  )}
                  {zone.riskScore >= 40 && zone.riskScore < 70 && (
                    <span className="text-yellow-600 font-medium">
                      Moderate risk. Set a timer and watch for enforcement.
                    </span>
                  )}
                  {zone.riskScore < 40 && (
                    <span className="text-green-600 font-medium">
                      Lower risk area. Still check signage and time limits.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* Legend */}
      <div className="leaflet-bottom leaflet-right">
        <div className="leaflet-control bg-white rounded-lg shadow-lg p-3 m-4">
          <h4 className="font-semibold text-sm mb-2">Risk Level</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600" />
              <span>High (70+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>Medium (50-69)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Low (30-49)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Minimal (&lt;30)</span>
            </div>
          </div>
        </div>
      </div>
    </MapContainer>
  )
}
