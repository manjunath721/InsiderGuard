import { useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getRiskScores, getAnomalies, getAccessLogs, type RiskScorePayload, type AccessLogPayload } from '@/lib/api';
import { getRiskLevelColor } from '@/ml/engine';
import { AlertTriangle, Clock, MapPin } from 'lucide-react';

const categories = [
  { name: 'Critical', key: 'critical', color: '#FF3B30' },
  { name: 'High', key: 'high', color: '#FF9500' },
  { name: 'Medium', key: 'medium', color: '#FFCC00' },
  { name: 'Low', key: 'low', color: '#30D158' },
];

function getSeverityFromScore(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 0.8) return 'critical'
  if (score >= 0.6) return 'high'
  if (score >= 0.4) return 'medium'
  return 'low'
}

function formatTime(date: string) {
  const dt = new Date(date)
  return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function buildHeatmapData(logs: AccessLogPayload[]) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const data: { day: string; hour: number; value: number; isAnomaly: boolean }[] = []
  const counts = new Map<string, number>()

  logs.forEach(log => {
    const date = new Date(log.created_at)
    const day = days[date.getDay() === 0 ? 6 : date.getDay() - 1]
    const hour = date.getHours()
    const key = `${day}-${hour}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })

  days.forEach(day => {
    for (let hour = 0; hour < 24; hour += 1) {
      const key = `${day}-${hour}`
      data.push({
        day,
        hour,
        value: counts.get(key) ?? 0,
        isAnomaly: false,
      })
    }
  })

  return data
}

function AnomalyTimeline({ anomalies }: { anomalies: { id: number; username: string; action: string; created_at: string; anomaly_score: number | null }[] }) {
  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-semibold text-[#F5F5F0] mb-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-[#FFCC00]" />
        Recent Anomalies
      </h3>
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2 pr-1">
        {anomalies.slice(0, 8).map((anomaly) => {
          const severity = getSeverityFromScore(anomaly.anomaly_score ?? 0)
          return (
            <div
              key={anomaly.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-[#0A0A0A] border border-[rgba(245,245,240,0.06)] hover:border-[rgba(245,245,240,0.12)] hover:bg-[#111111] transition-all duration-200 cursor-pointer group"
            >
              <div
                className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                style={{ backgroundColor: getRiskLevelColor(severity) }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#F5F5F0] group-hover:text-[#0A84FF] transition-colors truncate">
                    {anomaly.username}
                  </span>
                  <span className="text-[10px] text-[#5A5A63] ml-2 flex-shrink-0">
                    {formatTime(anomaly.created_at)}
                  </span>
                </div>
                <p className="text-[11px] text-[#8A8A93] mt-0.5 truncate">
                  {anomaly.action.replace(/_/g, ' ')}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                    style={{
                      backgroundColor: `${getRiskLevelColor(severity)}20`,
                      color: getRiskLevelColor(severity),
                    }}
                  >
                    {severity.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-[#5A5A63]">
                    Score: {Math.round((anomaly.anomaly_score ?? 0) * 100)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

function BehavioralHeatmap({ logs }: { logs: AccessLogPayload[] }) {
  const heatmapData = useMemo(() => buildHeatmapData(logs), [logs]);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = [0, 4, 8, 12, 16, 20];

  const getCellColor = (value: number, isAnomaly: boolean) => {
    if (isAnomaly) return '#FF3B30';
    if (value === 0) return '#0a0a0a';
    const intensity = Math.min(1, value / 100);
    const r = Math.round(255 * intensity);
    const g = Math.round(200 * intensity * 0.6);
    const b = Math.round(50 * intensity * 0.2);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-semibold text-[#F5F5F0] mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-[#BF5AF2]" />
        Activity Heatmap
      </h3>

      <div className="flex-1 overflow-hidden">
        {/* Hour Labels */}
        <div className="flex ml-8 mb-1">
          {hours.map(h => (
            <div key={h} className="flex-1 text-[9px] text-[#5A5A63] text-center">
              {h}:00
            </div>
          ))}
        </div>

        {/* Heatmap Grid */}
        <div className="space-y-1">
          {days.map(day => (
            <div key={day} className="flex items-center gap-1">
              <span className="w-7 text-[9px] text-[#5A5A63] text-right">{day}</span>
              <div className="flex-1 flex gap-px">
                {Array.from({ length: 24 }, (_, hour) => {
                  const cell = heatmapData.find(c => c.day === day && c.hour === hour);
                  return (
                    <div
                      key={hour}
                      className="flex-1 h-5 rounded-sm transition-all duration-200 hover:ring-1 hover:ring-[#0A84FF] cursor-pointer"
                      style={{
                        backgroundColor: getCellColor(cell?.value || 0, cell?.isAnomaly || false),
                      }}
                      title={`${day} ${hour}:00 - Activity: ${cell?.value || 0}${cell?.isAnomaly ? ' (ANOMALY)' : ''}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-3">
          <span className="text-[9px] text-[#5A5A63]">Low</span>
          <div className="flex gap-px">
            {[0, 20, 40, 60, 80, 100].map(v => (
              <div
                key={v}
                className="w-4 h-2.5 rounded-sm"
                style={{ backgroundColor: getCellColor(v, false) }}
              />
            ))}
          </div>
          <span className="text-[9px] text-[#5A5A63]">High</span>
          <div className="flex items-center gap-1 ml-3">
            <div className="w-2 h-2.5 rounded-sm bg-[#FF3B30]" />
            <span className="text-[9px] text-[#FF3B30]">Anomaly</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskDistribution({ riskScores }: { riskScores: RiskScorePayload[] }) {
  const riskData = categories.map(item => ({
    name: item.name,
    value: riskScores.filter(score => score.category === item.key).length,
    color: item.color,
  }))

  const avgRiskScore = riskScores.length
    ? Math.round(riskScores.reduce((sum, score) => sum + score.score, 0) / riskScores.length)
    : 0

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-semibold text-[#F5F5F0] mb-4 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[#0A84FF]" />
        Risk Distribution
      </h3>

      <div className="flex-1 flex items-center">
        <div className="w-48 h-48 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111111',
                  border: '1px solid rgba(245,245,240,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#F5F5F0',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center Score */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-[#F5F5F0]">{avgRiskScore}</span>
            <span className="text-[9px] text-[#8A8A93] uppercase tracking-wider">Avg Risk</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 ml-4">
          {riskData.map(item => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-[#8A8A93]">{item.name}</span>
              </div>
              <span className="text-xs font-semibold text-[#F5F5F0]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ThreatAnalytics() {
  const [riskScores, setRiskScores] = useState<RiskScorePayload[]>([])
  const [anomalyLogs, setAnomalyLogs] = useState<AccessLogPayload[]>([])
  const [accessLogs, setAccessLogs] = useState<AccessLogPayload[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true)
      setError(null)
      try {
        const [scores, anomalies, logs] = await Promise.all([
          getRiskScores(),
          getAnomalies(100, 0),
          getAccessLogs(200, 0),
        ])
        setRiskScores(scores)
        setAnomalyLogs(anomalies)
        setAccessLogs(logs)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load threat analytics.')
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [])

  if (error) {
    return (
      <div className="rounded-xl border border-[#FF3B30] bg-[#290000] p-6 text-sm text-[#FFCCCC]">
        {error}
      </div>
    )
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Risk Distribution */}
      <div className="rounded-xl border border-[rgba(245,245,240,0.06)] bg-[#0A0A0A] p-5 hover:border-[rgba(245,245,240,0.12)] transition-all duration-200">
        <RiskDistribution riskScores={riskScores} />
      </div>

      {/* Anomaly Timeline */}
      <div className="rounded-xl border border-[rgba(245,245,240,0.06)] bg-[#0A0A0A] p-5 hover:border-[rgba(245,245,240,0.12)] transition-all duration-200">
        <AnomalyTimeline anomalies={anomalyLogs} />
      </div>

      {/* Behavioral Heatmap */}
      <div className="rounded-xl border border-[rgba(245,245,240,0.06)] bg-[#0A0A0A] p-5 hover:border-[rgba(245,245,240,0.12)] transition-all duration-200">
        <BehavioralHeatmap logs={accessLogs} />
      </div>
    </section>
  );
}
