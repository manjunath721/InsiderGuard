import { useEffect, useState } from 'react';
import { getUsers, getRiskScores, type UserSummary, type RiskScorePayload } from '@/lib/api';
import { getRiskLevelColor } from '@/ml/engine';
import { MapPin, Monitor, Clock, TrendingUp, TrendingDown, Minus, Search } from 'lucide-react';

interface UserProfileView {
  userId: string
  username: string
  role: string
  department: string
  baseline: {
    normalLoginHours: [number, number]
    avgAccessCount: number
    avgDownloadVolume: number
    typicalResources: string[]
    typicalLocations: string[]
    typicalDevices: string[]
    avgSessionDuration: number
  }
  riskScore: {
    score: number
    level: 'low' | 'medium' | 'high' | 'critical'
    factors: { name: string; contribution: number }[]
    trend: 'up' | 'down' | 'stable'
  }
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 76) return 'critical'
  if (score >= 51) return 'high'
  if (score >= 26) return 'medium'
  return 'low'
}

export function UsersSection() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserProfileView[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfileView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUsers() {
      setLoading(true)
      setError(null)
      try {
        const [userProfiles, riskScores] = await Promise.all([getUsers(), getRiskScores()])

        const riskMap = new Map<number, RiskScorePayload>()
        riskScores.forEach(score => {
          const existing = riskMap.get(score.user_id)
          if (!existing || new Date(score.created_at) > new Date(existing.created_at)) {
            riskMap.set(score.user_id, score)
          }
        })

        const mapped = userProfiles.map((u) => {
          const latestRisk = riskMap.get(u.id)
          const score = latestRisk?.score ?? 25
          const level = latestRisk?.category as 'low' | 'medium' | 'high' | 'critical' ?? getRiskLevel(score)
          const trend: 'up' | 'down' | 'stable' = score > 60 ? 'up' : score < 30 ? 'down' : 'stable'

          return {
            userId: u.id.toString(),
            username: u.username,
            role: u.role ?? 'User',
            department: 'Corporate Security',
            baseline: {
              normalLoginHours: [9, 18],
              avgAccessCount: 32,
              avgDownloadVolume: 8500,
              typicalResources: ['HR portal', 'Finance DB', 'Audit logs'],
              typicalLocations: ['New York', 'Chicago', 'Remote VPN'],
              typicalDevices: ['Windows 11', 'MacOS', 'iPhone'],
              avgSessionDuration: 3600,
            },
            riskScore: {
              score,
              level,
              factors: latestRisk?.factors.slice(0, 3).map((factor: any) => ({
                name: factor.name ?? 'unknown',
                contribution: typeof factor.contribution === 'number' ? factor.contribution : 8,
              })) ?? [
                { name: 'behavioral_shift', contribution: 12 },
                { name: 'suspicious_access', contribution: 10 },
                { name: 'anomaly_count', contribution: 8 },
              ],
              trend,
            },
          }
        })

        setUsers(mapped)
        if (!selectedUser && mapped.length > 0) {
          setSelectedUser(mapped[0])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users.')
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filtered = users.filter(u =>
    !search || u.username.toLowerCase().includes(search.toLowerCase()) || u.department.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedUsers = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5A63]" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#111111] border border-[rgba(245,245,240,0.08)] text-sm text-[#F5F5F0] placeholder:text-[#5A5A63] focus:outline-none focus:border-[#0A84FF]"
          />
        </div>
        <div className="text-xs text-[#8A8A93]">
          {filtered.length} users monitored
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[#FF3B30] bg-[#290000] p-4 text-sm text-[#FFCCCC]">
          {error}
        </div>
      )}
      {loading && (
        <div className="rounded-xl border border-[rgba(245,245,240,0.06)] bg-[#0A0A0A] p-6 text-sm text-[#8A8A93]">
          Loading user profiles...
        </div>
      )}

      {/* User Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {paginatedUsers.map(user => (
          <div
            key={user.userId}
            className={`rounded-xl border p-5 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 ${
              selectedUser?.userId === user.userId
                ? 'border-[#0A84FF]/40 bg-[#0A0A0A]'
                : 'border-[rgba(245,245,240,0.06)] bg-[#0A0A0A] hover:border-[rgba(245,245,240,0.12)]'
            }`}
            onClick={() => setSelectedUser(selectedUser?.userId === user.userId ? null : user)}
          >
            {/* User Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                  style={{
                    backgroundColor: `${getRiskLevelColor(user.riskScore.level)}20`,
                    color: getRiskLevelColor(user.riskScore.level),
                  }}
                >
                  {user.username.split('.').map(n => n[0].toUpperCase()).join('')}
                </div>
                <div>
                  <div className="text-sm font-medium text-[#F5F5F0]">{user.username}</div>
                  <div className="text-[10px] text-[#8A8A93]">{user.department} - {user.role}</div>
                </div>
              </div>
              <div
                className="text-lg font-bold"
                style={{ color: getRiskLevelColor(user.riskScore.level) }}
              >
                {user.riskScore.score}
              </div>
            </div>

            {/* Risk Factors */}
            <div className="space-y-1.5 mb-4">
              {user.riskScore.factors.slice(0, 3).map(factor => (
                <div key={factor.name} className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8A8A93] capitalize">{factor.name.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 rounded-full bg-[#1a1a1a]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, factor.contribution * 3)}%`,
                          backgroundColor: getRiskLevelColor(user.riskScore.level),
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-[#5A5A63] w-6 text-right">+{factor.contribution}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Baseline Info */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[rgba(245,245,240,0.06)]">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-[#5A5A63]" />
                <span className="text-[10px] text-[#8A8A93]">
                  {user.baseline.normalLoginHours[0]}:00-{user.baseline.normalLoginHours[1]}:00
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Monitor className="w-3 h-3 text-[#5A5A63]" />
                <span className="text-[10px] text-[#8A8A93]">{user.baseline.typicalDevices[0]}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-[#5A5A63]" />
                <span className="text-[10px] text-[#8A8A93]">{user.baseline.typicalLocations[0]}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {user.riskScore.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-[#FF3B30]" />
                ) : user.riskScore.trend === 'down' ? (
                  <TrendingDown className="w-3 h-3 text-[#30D158]" />
                ) : (
                  <Minus className="w-3 h-3 text-[#8A8A93]" />
                )}
                <span className="text-[10px] text-[#8A8A93] capitalize">{user.riskScore.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-[rgba(245,245,240,0.06)]">
          <div className="text-xs text-[#8A8A93]">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} users
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-[#111111] border border-[rgba(245,245,240,0.08)] text-xs text-[#8A8A93] hover:text-[#F5F5F0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-[#8A8A93]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg bg-[#111111] border border-[rgba(245,245,240,0.08)] text-xs text-[#8A8A93] hover:text-[#F5F5F0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Selected User Detail */}
      {selectedUser && (
        <div className="rounded-xl border border-[#0A84FF]/30 bg-[#0A0A0A] p-6">
          <h3 className="text-sm font-semibold text-[#F5F5F0] mb-4">Detailed Profile: {selectedUser.username}</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <span className="text-[10px] text-[#5A5A63] uppercase tracking-wider font-semibold">Normal Login Hours</span>
              <p className="text-xs text-[#F5F5F0]">{selectedUser.baseline.normalLoginHours[0]}:00 - {selectedUser.baseline.normalLoginHours[1]}:00</p>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] text-[#5A5A63] uppercase tracking-wider font-semibold">Avg Daily Access</span>
              <p className="text-xs text-[#F5F5F0]">{selectedUser.baseline.avgAccessCount} requests</p>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] text-[#5A5A63] uppercase tracking-wider font-semibold">Avg Download Volume</span>
              <p className="text-xs text-[#F5F5F0]">{selectedUser.baseline.avgDownloadVolume.toLocaleString()} records</p>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] text-[#5A5A63] uppercase tracking-wider font-semibold">Avg Session Duration</span>
              <p className="text-xs text-[#F5F5F0]">{Math.round(selectedUser.baseline.avgSessionDuration / 60)} minutes</p>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] text-[#5A5A63] uppercase tracking-wider font-semibold">Typical Resources</span>
              <div className="flex flex-wrap gap-1">
                {selectedUser.baseline.typicalResources.map(r => (
                  <span key={r} className="text-[10px] px-2 py-0.5 rounded bg-[#111111] text-[#8A8A93]">{r}</span>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] text-[#5A5A63] uppercase tracking-wider font-semibold">Typical Locations</span>
              <div className="flex flex-wrap gap-1">
                {selectedUser.baseline.typicalLocations.map(l => (
                  <span key={l} className="text-[10px] px-2 py-0.5 rounded bg-[#111111] text-[#8A8A93]">{l}</span>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] text-[#5A5A63] uppercase tracking-wider font-semibold">Known Devices</span>
              <div className="flex flex-wrap gap-1">
                {selectedUser.baseline.typicalDevices.map(d => (
                  <span key={d} className="text-[10px] px-2 py-0.5 rounded bg-[#111111] text-[#8A8A93]">{d}</span>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] text-[#5A5A63] uppercase tracking-wider font-semibold">Risk Trend</span>
              <p className={`text-xs font-semibold ${selectedUser.riskScore.trend === 'up' ? 'text-[#FF3B30]' : selectedUser.riskScore.trend === 'down' ? 'text-[#30D158]' : 'text-[#8A8A93]'}`}>
                {selectedUser.riskScore.trend.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
