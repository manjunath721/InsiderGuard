import { NeuralMesh } from '@/components/NeuralMesh';
import { Activity, AlertTriangle, Shield, Zap } from 'lucide-react';
import { getAccessLogs, getAlerts, getAnomalies, getRiskScores } from '@/lib/api';
import { useEffect, useState } from 'react';

type AnomalyCard = {
  user: string
  type: string
  time: string
  severity: 'critical' | 'high' | 'medium' | 'low'
}

function getSeverityFromScore(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 0.8) return 'critical'
  if (score >= 0.6) return 'high'
  if (score >= 0.4) return 'medium'
  return 'low'
}

function getRelativeTime(date: Date) {
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function HeroSection() {
  const [pulse, setPulse] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);
  const [anomaliesDetected, setAnomaliesDetected] = useState(0);
  const [criticalThreats, setCriticalThreats] = useState(0);
  const [highRiskUsers, setHighRiskUsers] = useState(0);
  const [recentAnomalies, setRecentAnomalies] = useState<AnomalyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadStats() {
      setLoading(true)
      setError(null)
      try {
        const [logs, alerts, anomalies, riskScores] = await Promise.all([
          getAccessLogs(200, 0),
          getAlerts(undefined, undefined, undefined, 100, 0),
          getAnomalies(50, 0),
          getRiskScores(),
        ])

        setTotalEvents(logs.length)
        setAnomaliesDetected(anomalies.length)
        setCriticalThreats(alerts.filter(alert => alert.severity === 'critical').length)
        setHighRiskUsers(new Set(riskScores.filter(score => score.category === 'high' || score.category === 'critical').map(score => score.user_id)).size)

        setRecentAnomalies(anomalies.slice(0, 5).map((log) => ({
          user: log.username,
          type: log.action.replace(/_/g, ' '),
          time: getRelativeTime(new Date(log.created_at)),
          severity: getSeverityFromScore(log.anomaly_score ?? 0),
        })))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard metrics.')
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  return (
    <section className="relative h-[35vh] min-h-[280px] overflow-hidden rounded-xl border border-[rgba(245,245,240,0.06)]">
      {/* 3D Background */}
      <NeuralMesh className="absolute inset-0" />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/90 via-[#050505]/60 to-transparent z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/80 to-transparent z-[1]" />

      {/* Pulse Effect */}
      {pulse && (
        <div className="absolute inset-0 z-[2] pointer-events-none">
          <div className="absolute inset-0 rounded-xl border-2 border-[#FF3B30]/50 animate-ping" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-[3] flex h-full p-6">
        {/* Left Panel - System Status */}
        <div className="flex flex-col justify-end w-72">
          <div className="backdrop-blur-md bg-[#0A0A0A]/60 rounded-xl border border-[rgba(245,245,240,0.08)] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-[#30D158]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8A8A93]">
                System Status
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold text-[#F5F5F0]">98.4%</span>
              <span className="text-xs text-[#30D158]">Secure</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-[#0A84FF]" />
                <span className="text-[11px] text-[#8A8A93]">
                  {loading ? 'Loading...' : `${totalEvents.toLocaleString()} events`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-[#FFCC00]" />
                <span className="text-[11px] text-[#8A8A93]">
                  {loading ? 'Loading...' : `${anomaliesDetected} anomalies`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-[#FF3B30]" />
                <span className="text-[11px] text-[#8A8A93]">
                  {loading ? 'Loading...' : `${criticalThreats} critical`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-[#BF5AF2]" />
                <span className="text-[11px] text-[#8A8A93]">
                  {loading ? 'Loading...' : `${highRiskUsers} high risk`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Live Anomaly Feed */}
        <div className="flex-1 flex flex-col justify-end items-end">
          <div className="backdrop-blur-md bg-[#0A0A0A]/60 rounded-xl border border-[rgba(245,245,240,0.08)] p-4 w-80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8A8A93]">
                Live Anomalies
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] animate-pulse" />
                <span className="text-[10px] text-[#FF3B30] font-medium">LIVE</span>
              </span>
            </div>

            <div className="space-y-2">
              {recentAnomalies.map((anomaly, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-[rgba(245,245,240,0.04)] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        anomaly.severity === 'critical'
                          ? 'bg-[#FF3B30]'
                          : anomaly.severity === 'high'
                          ? 'bg-[#FF9500]'
                          : 'bg-[#FFCC00]'
                      }`}
                    />
                    <span className="text-xs text-[#F5F5F0] group-hover:text-[#0A84FF] transition-colors">
                      {anomaly.user}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-[#8A8A93]">{anomaly.type}</span>
                    <span className="text-[10px] text-[#5A5A63] w-14 text-right">{anomaly.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
