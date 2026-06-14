import { useEffect, useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { getAccessLogs, getAlerts, type AccessLogPayload, type AlertPayload } from '@/lib/api';
import { TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { demoModelMetrics } from '@/ml/engine';

function buildTimeSeries(logs: AccessLogPayload[], days = 30) {
  const buckets = new Map<string, number>()
  const now = new Date()
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now)
    date.setDate(now.getDate() - i)
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    buckets.set(label, 0)
  }

  logs.forEach(log => {
    const date = new Date(log.created_at)
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (buckets.has(label)) {
      buckets.set(label, buckets.get(label)! + 1)
    }
  })

  return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }))
}

function buildAlertTrend(alerts: AlertPayload[], days = 30) {
  const buckets = new Map<string, number>()
  const now = new Date()
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now)
    date.setDate(now.getDate() - i)
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    buckets.set(label, 0)
  }

  alerts.forEach(alert => {
    const date = new Date(alert.created_at)
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (buckets.has(label)) {
      buckets.set(label, buckets.get(label)! + 1)
    }
  })

  return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }))
}

const severityColors = {
  Critical: '#FF3B30',
  High: '#FF9500',
  Medium: '#FFCC00',
  Low: '#30D158',
}

export function TrendsSection() {
  const metrics = demoModelMetrics;
  const [logs, setLogs] = useState<AccessLogPayload[]>([])
  const [alerts, setAlerts] = useState<AlertPayload[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTrends() {
      setLoading(true)
      setError(null)
      try {
        const [logsData, alertsData] = await Promise.all([
          getAccessLogs(200, 0),
          getAlerts(undefined, undefined, undefined, 100, 0),
        ])
        setLogs(logsData)
        setAlerts(alertsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trend data.')
      } finally {
        setLoading(false)
      }
    }

    loadTrends()
  }, [])

  const eventData = useMemo(() => buildTimeSeries(logs), [logs])
  const anomalyData = useMemo(() => buildAlertTrend(alerts), [alerts])
  const severityDistribution = useMemo(() => [
    { name: 'Critical', count: alerts.filter(a => a.severity === 'critical').length, color: severityColors.Critical },
    { name: 'High', count: alerts.filter(a => a.severity === 'high').length, color: severityColors.High },
    { name: 'Medium', count: alerts.filter(a => a.severity === 'medium').length, color: severityColors.Medium },
    { name: 'Low', count: alerts.filter(a => a.severity === 'low').length, color: severityColors.Low },
  ], [alerts])

  return (
    <div className="space-y-4">
      {/* Model Performance */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Accuracy', value: metrics.accuracy, icon: TrendingUp },
          { label: 'Precision', value: metrics.precision, icon: Activity },
          { label: 'Recall', value: metrics.recall, icon: AlertTriangle },
          { label: 'F1 Score', value: metrics.f1Score, icon: TrendingUp },
        ].map(m => (
          <div key={m.label} className="rounded-xl border border-[rgba(245,245,240,0.06)] bg-[#0A0A0A] p-4">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className="w-4 h-4 text-[#0A84FF]" />
              <span className="text-[10px] text-[#8A8A93] uppercase tracking-wider">{m.label}</span>
            </div>
            <div className="text-2xl font-bold text-[#F5F5F0]">{(m.value * 100).toFixed(1)}%</div>
            <div className="w-full h-1.5 rounded-full bg-[#1a1a1a] mt-2">
              <div
                className="h-full rounded-full bg-[#0A84FF] transition-all"
                style={{ width: `${m.value * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Event Volume Chart */}
        <div className="rounded-xl border border-[rgba(245,245,240,0.06)] bg-[#0A0A0A] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#F5F5F0] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0A84FF]" />
              Event Volume (30 Days)
            </h3>
            <span className="text-[10px] text-[#5A5A63]">Daily</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={eventData}>
                <defs>
                  <linearGradient id="eventGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0A84FF" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#0A84FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,245,240,0.04)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#5A5A63', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(245,245,240,0.06)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#5A5A63', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(245,245,240,0.06)' }}
                  tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111111',
                    border: '1px solid rgba(245,245,240,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F5F5F0',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#0A84FF"
                  strokeWidth={2}
                  fill="url(#eventGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Anomaly Trend Chart */}
        <div className="rounded-xl border border-[rgba(245,245,240,0.06)] bg-[#0A0A0A] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#F5F5F0] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FFCC00]" />
              Anomaly Trend (30 Days)
            </h3>
            <span className="text-[10px] text-[#5A5A63]">Daily Count</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={anomalyData}>
                <defs>
                  <linearGradient id="anomalyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFCC00" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#FFCC00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,245,240,0.04)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#5A5A63', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(245,245,240,0.06)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#5A5A63', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(245,245,240,0.06)' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111111',
                    border: '1px solid rgba(245,245,240,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F5F5F0',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#FFCC00"
                  strokeWidth={2}
                  fill="url(#anomalyGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Severity Distribution Bar Chart */}
      <div className="rounded-xl border border-[rgba(245,245,240,0.06)] bg-[#0A0A0A] p-5">
        <h3 className="text-sm font-semibold text-[#F5F5F0] mb-4">Alert Severity Distribution</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={severityDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,245,240,0.04)" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#8A8A93', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(245,245,240,0.06)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#5A5A63', fontSize: 10 }}
                axisLine={{ stroke: 'rgba(245,245,240,0.06)' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111111',
                  border: '1px solid rgba(245,245,240,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#F5F5F0',
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {severityDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confusion Matrix */}
      <div className="rounded-xl border border-[rgba(245,245,240,0.06)] bg-[#0A0A0A] p-5">
        <h3 className="text-sm font-semibold text-[#F5F5F0] mb-4">Confusion Matrix</h3>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          {[
            { label: 'True Positive', value: metrics.confusionMatrix[0], color: '#30D158' },
            { label: 'False Positive', value: metrics.confusionMatrix[1], color: '#FF9500' },
            { label: 'True Negative', value: metrics.confusionMatrix[2], color: '#0A84FF' },
            { label: 'False Negative', value: metrics.confusionMatrix[3], color: '#FF3B30' },
          ].map(cell => (
            <div
              key={cell.label}
              className="rounded-lg p-4 text-center"
              style={{ backgroundColor: `${cell.color}10`, border: `1px solid ${cell.color}30` }}
            >
              <div className="text-2xl font-bold" style={{ color: cell.color }}>{cell.value}</div>
              <div className="text-[10px] text-[#8A8A93] mt-1">{cell.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
