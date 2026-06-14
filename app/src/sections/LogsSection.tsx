import { useEffect, useState } from 'react';
import { getAccessLogs, type AccessLogPayload } from '@/lib/api';
import { Search, Download } from 'lucide-react';

type AccessLogView = Omit<AccessLogPayload, 'created_at'> & { timestamp: Date };

export function LogsSection() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [logs, setLogs] = useState<AccessLogView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, actionFilter]);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      setError(null);
      try {
        const offset = (currentPage - 1) * itemsPerPage;
        const data = await getAccessLogs(
          itemsPerPage,
          offset,
          debouncedSearch || undefined,
          actionFilter !== 'all' ? actionFilter : undefined
        );
        setLogs(data.map(log => ({ ...log, timestamp: new Date(log.created_at) })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load access logs.');
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, [debouncedSearch, actionFilter, currentPage]);

  const actions = ['all', 'Read', 'Write', 'Download', 'Delete'];
  const hasNextPage = logs.length === itemsPerPage;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5A63]" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#111111] border border-[rgba(245,245,240,0.08)] text-sm text-[#F5F5F0] placeholder:text-[#5A5A63] focus:outline-none focus:border-[#0A84FF]"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-[#111111] border border-[rgba(245,245,240,0.08)] p-1">
            {actions.map(a => (
              <button
                key={a}
                onClick={() => setActionFilter(a)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                  actionFilter === a
                    ? 'bg-[#0A84FF] text-white'
                    : 'text-[#8A8A93] hover:text-[#F5F5F0]'
                }`}
              >
                {a === 'all' ? 'All' : a}
              </button>
            ))}
          </div>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111111] border border-[rgba(245,245,240,0.08)] text-[11px] text-[#8A8A93] hover:text-[#F5F5F0] transition-colors">
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-[#FF3B30] bg-[#290000] p-4 text-sm text-[#FFCCCC]">
          {error}
        </div>
      )}
      {loading && (
        <div className="rounded-xl border border-[rgba(245,245,240,0.06)] bg-[#0A0A0A] p-6 text-sm text-[#8A8A93]">
          Loading access logs...
        </div>
      )}

      <div className="rounded-xl border border-[rgba(245,245,240,0.06)] bg-[#0A0A0A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(245,245,240,0.06)]">
                {['Timestamp', 'User', 'Role', 'Department', 'Resource', 'Action', 'IP Address', 'Location', 'Device', 'Records', 'Duration'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold text-[#5A5A63] uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr
                  key={log.id}
                  className="border-b border-[rgba(245,245,240,0.04)] hover:bg-[#111111] transition-colors"
                >
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-[11px] text-[#8A8A93] font-mono">
                      {log.timestamp.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-xs font-medium text-[#F5F5F0]">{log.username}</span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-[11px] text-[#8A8A93] capitalize">{log.role}</span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-[11px] text-[#8A8A93]">{log.department}</span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-[11px] text-[#0A84FF] font-mono">{log.resource}</span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        log.action.toLowerCase() === 'export' || log.action.toLowerCase() === 'download'
                          ? 'bg-[rgba(255,59,48,0.15)] text-[#FF3B30]'
                          : log.action.toLowerCase() === 'modify' || log.action.toLowerCase() === 'delete'
                          ? 'bg-[rgba(255,149,0,0.15)] text-[#FF9500]'
                          : 'bg-[rgba(10,132,255,0.15)] text-[#0A84FF]'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-[11px] text-[#8A8A93] font-mono">{log.ip_address}</span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-[11px] text-[#8A8A93]">{log.location}</span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-[11px] text-[#8A8A93]">{log.device}</span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className={`text-[11px] font-mono ${log.records_accessed > 10000 ? 'text-[#FF3B30]' : 'text-[#8A8A93]'}`}>
                      {log.records_accessed.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-[11px] text-[#8A8A93] font-mono">
                      {Math.round(log.session_duration / 60)}m
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between pt-4">
        <span className="text-xs text-[#8A8A93]">
          Page {currentPage}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg bg-[#111111] border border-[rgba(245,245,240,0.08)] text-xs text-[#8A8A93] hover:text-[#F5F5F0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={!hasNextPage}
            className="px-3 py-1.5 rounded-lg bg-[#111111] border border-[rgba(245,245,240,0.08)] text-xs text-[#8A8A93] hover:text-[#F5F5F0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
