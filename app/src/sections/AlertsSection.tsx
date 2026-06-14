import { useEffect, useState } from 'react';
import { getAlerts, type AlertPayload } from '@/lib/api';
import { getRiskLevelColor } from '@/ml/engine';
import type { Severity, AlertStatus } from '@/types';
import {
  AlertTriangle,
  ShieldAlert,
  Shield,
  Info,
  CheckCircle2,
  Clock,
  User,
  Search,
  Eye,
} from 'lucide-react';

const severityIcons: Record<Severity, typeof AlertTriangle> = {
  critical: ShieldAlert,
  high: AlertTriangle,
  medium: Shield,
  low: Info,
};

type AlertView = AlertPayload & { createdAt: Date }

export function AlertsSection() {
  const [filter, setFilter] = useState<'all' | Severity>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AlertStatus>('all');
  const [search, setSearch] = useState('');
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAlerts() {
      setLoading(true)
      setError(null)
      try {
        const data = await getAlerts(statusFilter !== 'all' ? statusFilter : undefined, filter !== 'all' ? filter : undefined, search || undefined)
        setAlerts(data.map((alert) => ({
          ...alert,
          createdAt: new Date(alert.created_at),
        })))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load alerts.')
      } finally {
        setLoading(false)
      }
    }

    loadAlerts()
  }, [filter, statusFilter, search])

  const filtered = alerts.filter(a => {
    if (filter !== 'all' && a.severity !== filter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search && !a.username.toLowerCase().includes(search.toLowerCase()) && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true
  })

  const stats = {
    total: alerts.length,
    open: alerts.filter(a => a.status === 'open').length,
    investigating: alerts.filter(a => a.status === 'investigating').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Alerts', value: stats.total, icon: Shield, color: '#0A84FF' },
          { label: 'Open', value: stats.open, icon: AlertTriangle, color: '#FF3B30' },
          { label: 'Investigating', value: stats.investigating, icon: Clock, color: '#FF9500' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: '#30D158' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-[rgba(245,245,240,0.06)] bg-[#0A0A0A] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-lg font-bold text-[#F5F5F0]">{s.value}</div>
              <div className="text-[10px] text-[#8A8A93] uppercase tracking-wider">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5A63]" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#111111] border border-[rgba(245,245,240,0.08)] text-sm text-[#F5F5F0] placeholder:text-[#5A5A63] focus:outline-none focus:border-[#0A84FF]"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-[#111111] border border-[rgba(245,245,240,0.08)] p-1">
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                filter === s
                  ? 'bg-[#0A84FF] text-white'
                  : 'text-[#8A8A93] hover:text-[#F5F5F0]'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-[#111111] border border-[rgba(245,245,240,0.08)] p-1">
          {(['all', 'open', 'investigating', 'resolved'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                statusFilter === s
                  ? 'bg-[#BF5AF2] text-white'
                  : 'text-[#8A8A93] hover:text-[#F5F5F0]'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[#FF3B30] bg-[#290000] p-4 text-sm text-[#FFCCCC]">
          {error}
        </div>
      )}
      {loading && (
        <div className="rounded-xl border border-[rgba(245,245,240,0.06)] bg-[#0A0A0A] p-6 text-sm text-[#8A8A93]">
          Loading alerts...
        </div>
      )}

      {/* Alerts Table */}
      <div className="rounded-xl border border-[rgba(245,245,240,0.06)] bg-[#0A0A0A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(245,245,240,0.06)]">
                {['Alert', 'User', 'Severity', 'Risk Score', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#5A5A63] uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(alert => {
                const Icon = severityIcons[alert.severity];
                const isExpanded = expandedAlert === alert.id;
                return (
                  <>
                    <tr
                      key={alert.id}
                      className="border-b border-[rgba(245,245,240,0.04)] hover:bg-[#111111] transition-colors cursor-pointer"
                      onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 flex-shrink-0" style={{ color: getSevColor(alert.severity) }} />
                          <div>
                            <div className="text-xs font-medium text-[#F5F5F0]">{alert.title}</div>
                            <div className="text-[10px] text-[#8A8A93] truncate max-w-[200px]">{alert.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-[#5A5A63]" />
                          <span className="text-xs text-[#8A8A93]">{alert.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            backgroundColor: `${getSevColor(alert.severity)}20`,
                            color: getSevColor(alert.severity),
                          }}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${alert.riskScore}%`,
                                backgroundColor: getRiskLevelColor(alert.riskScore >= 76 ? 'critical' : alert.riskScore >= 51 ? 'high' : alert.riskScore >= 26 ? 'medium' : 'low'),
                              }}
                            />
                          </div>
                          <span className="text-[11px] font-medium text-[#F5F5F0]">{alert.riskScore}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            alert.status === 'open'
                              ? 'bg-[rgba(255,59,48,0.15)] text-[#FF3B30]'
                              : alert.status === 'investigating'
                              ? 'bg-[rgba(255,149,0,0.15)] text-[#FF9500]'
                              : 'bg-[rgba(48,209,88,0.15)] text-[#30D158]'
                          }`}
                        >
                          {alert.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] text-[#5A5A63]">
                          {alert.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="p-1.5 rounded-md hover:bg-[rgba(245,245,240,0.06)] transition-colors">
                          <Eye className="w-3.5 h-3.5 text-[#8A8A93]" />
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${alert.id}-expanded`}>
                        <td colSpan={7} className="px-4 py-4 bg-[#080808]">
                          <div className="space-y-3">
                            <p className="text-xs text-[#8A8A93]">{alert.description}</p>
                            <div>
                              <span className="text-[10px] font-semibold text-[#5A5A63] uppercase tracking-wider">Recommendations:</span>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {alert.recommendations.map((rec, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] px-2.5 py-1 rounded-md bg-[#111111] border border-[rgba(245,245,240,0.06)] text-[#8A8A93]"
                                  >
                                    {rec}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getSevColor(severity: Severity): string {
  const colors: Record<Severity, string> = {
    critical: '#FF3B30',
    high: '#FF9500',
    medium: '#FFCC00',
    low: '#30D158',
  };
  return colors[severity];
}
