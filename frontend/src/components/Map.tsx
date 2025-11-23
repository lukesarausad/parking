import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Citation, OfficerLocation, HeatmapData, SEATTLE_BOUNDS, formatCurrency, formatTimestamp } from '@seattle-parking/shared'

interface MapProps {
  citations: Citation[]
  officers: OfficerLocation[]
  heatmapData: HeatmapData[]
  selectedCitation: Citation | null
  onSelectCitation: (citation: Citation | null) => void
  showHeatmap: boolean
  showOfficers: boolean
}

// Custom marker icons
const citationIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="
    background: #dc3545;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

const selectedIcon = new L.DivIcon({
  className: 'custom-marker selected',
  html: `<div style="
    background: #003DA5;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 4px solid white;
    box-shadow: 0 4px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

const officerIcon = new L.DivIcon({
  className: 'custom-marker officer',
  html: `<div style="
    background: #00843D;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12px;
    font-weight: bold;
  ">O</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

// Component to handle map centering on selected citation
function MapController({ selectedCitation }: { selectedCitation: Citation | null }) {
  const map = useMap()

  useEffect(() => {
    if (selectedCitation) {
      map.flyTo([selectedCitation.location.lat, selectedCitation.location.lng], 16, {
        duration: 0.5,
      })
    }
  }, [selectedCitation, map])

  return null
}

export function Map({
  citations,
  officers,
  heatmapData,
  selectedCitation,
  onSelectCitation,
  showHeatmap,
  showOfficers,
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null)

  // Limit displayed citations for performance
  const displayedCitations = citations.slice(0, 200)

  return (
    <MapContainer
      ref={mapRef}
      center={[SEATTLE_BOUNDS.center.lat, SEATTLE_BOUNDS.center.lng]}
      zoom={13}
      className="h-full w-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController selectedCitation={selectedCitation} />

      {/* Heatmap circles */}
      {showHeatmap &&
        heatmapData.map((point, index) => (
          <Circle
            key={`heatmap-${index}`}
            center={[point.location.lat, point.location.lng]}
            radius={150}
            pathOptions={{
              color: 'transparent',
              fillColor: `rgba(220, 53, 69, ${point.intensity * 0.6})`,
              fillOpacity: point.intensity * 0.6,
            }}
          />
        ))}

      {/* Citation markers */}
      {displayedCitations.map((citation) => (
        <Marker
          key={citation.id}
          position={[citation.location.lat, citation.location.lng]}
          icon={selectedCitation?.id === citation.id ? selectedIcon : citationIcon}
          eventHandlers={{
            click: () => onSelectCitation(citation),
          }}
        >
          <Popup>
            <div className="citation-popup">
              <h3 className="text-seattle-navy">{citation.violationType}</h3>
              <div className="detail-row">
                <span className="text-gray-600">Fine:</span>
                <span className="font-semibold">{formatCurrency(citation.fineAmount)}</span>
              </div>
              <div className="detail-row">
                <span className="text-gray-600">Time:</span>
                <span>{formatTimestamp(new Date(citation.timestamp))}</span>
              </div>
              <div className="detail-row">
                <span className="text-gray-600">Location:</span>
                <span className="text-sm">{citation.location.address || 'N/A'}</span>
              </div>
              {citation.location.neighborhood && (
                <div className="detail-row">
                  <span className="text-gray-600">Neighborhood:</span>
                  <span>{citation.location.neighborhood}</span>
                </div>
              )}
              {citation.vehicleInfo && (
                <div className="detail-row">
                  <span className="text-gray-600">Vehicle:</span>
                  <span>
                    {citation.vehicleInfo.color} {citation.vehicleInfo.make}
                  </span>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Officer markers */}
      {showOfficers &&
        officers.map((officer) => (
          <Marker
            key={officer.id}
            position={[officer.location.lat, officer.location.lng]}
            icon={officerIcon}
          >
            <Popup>
              <div className="citation-popup">
                <h3 className="text-seattle-green">Enforcement Officer</h3>
                <div className="detail-row">
                  <span className="text-gray-600">ID:</span>
                  <span>{officer.id}</span>
                </div>
                <div className="detail-row">
                  <span className="text-gray-600">Last Seen:</span>
                  <span>{formatTimestamp(new Date(officer.lastSeen))}</span>
                </div>
                <div className="detail-row">
                  <span className="text-gray-600">Citations Today:</span>
                  <span className="font-semibold">{officer.citationsToday}</span>
                </div>
                <div className="detail-row">
                  <span className="text-gray-600">Status:</span>
                  <span className={officer.isActive ? 'text-green-600' : 'text-gray-400'}>
                    {officer.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  )
}
