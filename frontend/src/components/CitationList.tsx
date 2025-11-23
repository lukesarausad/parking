import { Citation, formatCurrency, formatTimestamp } from '@seattle-parking/shared'
import { MapPin, Clock, DollarSign, Car } from 'lucide-react'

interface CitationListProps {
  citations: Citation[]
  selectedCitation: Citation | null
  onSelectCitation: (citation: Citation | null) => void
  loading: boolean
}

function CitationCard({
  citation,
  isSelected,
  onClick,
}: {
  citation: Citation
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`p-3 border-b border-gray-100 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-seattle-blue/10 border-l-4 border-l-seattle-blue'
          : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <span
          className={`text-sm font-medium ${
            isSelected ? 'text-seattle-navy' : 'text-gray-800'
          }`}
        >
          {citation.violationType}
        </span>
        <span className="text-sm font-bold text-red-600">
          {formatCurrency(citation.fineAmount)}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Clock size={10} />
          {formatTimestamp(new Date(citation.timestamp))}
        </span>
        {citation.location.neighborhood && (
          <span className="flex items-center gap-1">
            <MapPin size={10} />
            {citation.location.neighborhood}
          </span>
        )}
      </div>

      {isSelected && citation.vehicleInfo && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Car size={12} />
            <span>
              {citation.vehicleInfo.color} {citation.vehicleInfo.make}
              {citation.vehicleInfo.plate && ` (${citation.vehicleInfo.plate})`}
            </span>
          </div>
          {citation.location.address && (
            <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
              <MapPin size={12} />
              <span className="truncate">{citation.location.address}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function CitationList({
  citations,
  selectedCitation,
  onSelectCitation,
  loading,
}: CitationListProps) {
  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Citations</h2>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-2">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-700">Recent Citations</h2>
          <span className="text-xs text-gray-400">{citations.length} shown</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {citations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <DollarSign size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No citations found</p>
          </div>
        ) : (
          citations.slice(0, 50).map((citation) => (
            <CitationCard
              key={citation.id}
              citation={citation}
              isSelected={selectedCitation?.id === citation.id}
              onClick={() =>
                onSelectCitation(selectedCitation?.id === citation.id ? null : citation)
              }
            />
          ))
        )}
      </div>
    </div>
  )
}
