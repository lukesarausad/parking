import { VIOLATION_TYPES, SEATTLE_NEIGHBORHOODS } from '@seattle-parking/shared'
import { Clock, Tag, MapPin, Layers, Users } from 'lucide-react'
import type { Filters } from '../App'

interface FilterPanelProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <Layers size={16} />
        Filters
      </h2>

      {/* Time Range */}
      <div>
        <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
          <Clock size={12} />
          Time Range
        </label>
        <div className="flex gap-1">
          {(['hour', 'today', 'week'] as const).map((range) => (
            <button
              key={range}
              onClick={() => onFiltersChange({ ...filters, timeRange: range })}
              className={`flex-1 px-2 py-1.5 text-xs rounded-md transition-colors ${
                filters.timeRange === range
                  ? 'bg-seattle-blue text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range === 'hour' ? 'Last Hour' : range === 'today' ? 'Today' : 'This Week'}
            </button>
          ))}
        </div>
      </div>

      {/* Violation Type */}
      <div>
        <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
          <Tag size={12} />
          Violation Type
        </label>
        <select
          value={filters.violationType}
          onChange={(e) => onFiltersChange({ ...filters, violationType: e.target.value })}
          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-seattle-blue focus:border-transparent"
        >
          <option value="">All Violations</option>
          {VIOLATION_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Neighborhood */}
      <div>
        <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
          <MapPin size={12} />
          Neighborhood
        </label>
        <select
          value={filters.neighborhood}
          onChange={(e) => onFiltersChange({ ...filters, neighborhood: e.target.value })}
          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-seattle-blue focus:border-transparent"
        >
          <option value="">All Neighborhoods</option>
          {SEATTLE_NEIGHBORHOODS.map((neighborhood) => (
            <option key={neighborhood} value={neighborhood}>
              {neighborhood}
            </option>
          ))}
        </select>
      </div>

      {/* Toggle options */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.showHeatmap}
            onChange={(e) => onFiltersChange({ ...filters, showHeatmap: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-seattle-blue focus:ring-seattle-blue"
          />
          <Layers size={14} className="text-gray-500" />
          <span className="text-sm text-gray-700">Show Heatmap</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.showOfficers}
            onChange={(e) => onFiltersChange({ ...filters, showOfficers: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-seattle-green focus:ring-seattle-green"
          />
          <Users size={14} className="text-gray-500" />
          <span className="text-sm text-gray-700">Show Officers</span>
        </label>
      </div>
    </div>
  )
}
