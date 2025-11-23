import { Statistics, formatCurrency } from '@seattle-parking/shared'
import { FileText, DollarSign, Users, TrendingUp } from 'lucide-react'

interface StatsDashboardProps {
  statistics: Statistics | null
  loading: boolean
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  subValue?: string
  color: string
}) {
  return (
    <div className="stats-card bg-white rounded-lg p-3 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 truncate">{label}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
          {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
        </div>
      </div>
    </div>
  )
}

export function StatsDashboard({ statistics, loading }: StatsDashboardProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Today's Statistics</h2>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-lg p-3 h-20 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (!statistics) {
    return (
      <div className="text-center py-4 text-gray-500">
        No statistics available
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-700">Today's Statistics</h2>

      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={FileText}
          label="Total Citations"
          value={statistics.totalCitations.toLocaleString()}
          color="bg-red-500"
        />
        <StatCard
          icon={DollarSign}
          label="Revenue"
          value={formatCurrency(statistics.totalRevenue)}
          color="bg-green-500"
        />
        <StatCard
          icon={Users}
          label="Active Officers"
          value={statistics.activeOfficers.toString()}
          color="bg-seattle-blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Fine"
          value={formatCurrency(statistics.averageFine)}
          color="bg-orange-500"
        />
      </div>

      {/* Top violations */}
      {statistics.topViolationTypes.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-semibold text-gray-600 mb-2">Top Violations</h3>
          <div className="space-y-1">
            {statistics.topViolationTypes.slice(0, 3).map((v, i) => (
              <div key={v.type} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-4">{i + 1}.</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-seattle-blue rounded-full"
                    style={{ width: `${v.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 truncate max-w-[100px]">
                  {v.type}
                </span>
                <span className="text-xs font-medium">{v.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
