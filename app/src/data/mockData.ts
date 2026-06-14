import type {
  AccessLog,
  Anomaly,
  Alert,
  AlertStatus,
  UserProfile,
  Investigation,
  DashboardStats,
  TimeSeriesPoint,
  HeatmapCell,
  ChatMessage,
  RiskScore,
  AnomalyDetail,
} from '@/types';

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);

export const mockAccessLogs: AccessLog[] = [
  { id: 'l1', userId: 'u001', username: 'john.smith', role: 'analyst', department: 'Finance', timestamp: hoursAgo(2), resource: '/api/customers', action: 'export', ipAddress: '192.168.1.45', location: 'New York', device: 'Chrome/Windows', recordsAccessed: 50000, sessionDuration: 1800 },
  { id: 'l2', userId: 'u002', username: 'sarah.jones', role: 'manager', department: 'HR', timestamp: hoursAgo(5), resource: '/api/employees', action: 'read', ipAddress: '10.0.0.23', location: 'London', device: 'Safari/MacOS', recordsAccessed: 150, sessionDuration: 900 },
  { id: 'l3', userId: 'u003', username: 'mike.chen', role: 'engineer', department: 'Engineering', timestamp: hoursAgo(8), resource: '/api/repos', action: 'clone', ipAddress: '172.16.0.5', location: 'San Francisco', device: 'Git/CLI', recordsAccessed: 2500, sessionDuration: 3600 },
  { id: 'l4', userId: 'u004', username: 'emma.davis', role: 'analyst', department: 'Marketing', timestamp: hoursAgo(12), resource: '/api/campaigns', action: 'update', ipAddress: '192.168.2.78', location: 'Chicago', device: 'Firefox/Windows', recordsAccessed: 75, sessionDuration: 600 },
  { id: 'l5', userId: 'u001', username: 'john.smith', role: 'analyst', department: 'Finance', timestamp: hoursAgo(14), resource: '/api/transactions', action: 'export', ipAddress: '203.0.113.45', location: 'Unknown', device: 'curl/Linux', recordsAccessed: 150000, sessionDuration: 1200 },
  { id: 'l6', userId: 'u005', username: 'alex.wong', role: 'admin', department: 'IT', timestamp: hoursAgo(18), resource: '/api/users', action: 'modify', ipAddress: '10.0.0.1', location: 'Singapore', device: 'Chrome/MacOS', recordsAccessed: 10, sessionDuration: 300 },
  { id: 'l7', userId: 'u006', username: 'lisa.kim', role: 'engineer', department: 'Engineering', timestamp: hoursAgo(22), resource: '/api/logs', action: 'read', ipAddress: '192.168.3.12', location: 'Seoul', device: 'Edge/Windows', recordsAccessed: 5000, sessionDuration: 2400 },
  { id: 'l8', userId: 'u002', username: 'sarah.jones', role: 'manager', department: 'HR', timestamp: hoursAgo(25), resource: '/api/payroll', action: 'export', ipAddress: '10.0.0.23', location: 'London', device: 'Chrome/Windows', recordsAccessed: 3000, sessionDuration: 1800 },
  { id: 'l9', userId: 'u007', username: 'robert.taylor', role: 'analyst', department: 'Finance', timestamp: hoursAgo(28), resource: '/api/invoices', action: 'read', ipAddress: '198.51.100.22', location: 'Dallas', device: 'Safari/iPad', recordsAccessed: 200, sessionDuration: 450 },
  { id: 'l10', userId: 'u003', username: 'mike.chen', role: 'engineer', department: 'Engineering', timestamp: hoursAgo(32), resource: '/api/secrets', action: 'access', ipAddress: '172.16.0.5', location: 'San Francisco', device: 'Python/script', recordsAccessed: 50, sessionDuration: 60 },
  { id: 'l11', userId: 'u008', username: 'nancy.brown', role: 'manager', department: 'Sales', timestamp: hoursAgo(36), resource: '/api/leads', action: 'export', ipAddress: '192.168.4.89', location: 'Boston', device: 'Chrome/Windows', recordsAccessed: 8000, sessionDuration: 2700 },
  { id: 'l12', userId: 'u009', username: 'david.lee', role: 'analyst', department: 'Finance', timestamp: hoursAgo(40), resource: '/api/reports', action: 'download', ipAddress: '203.0.113.78', location: 'Unknown', device: 'wget/Linux', recordsAccessed: 25000, sessionDuration: 600 },
  { id: 'l13', userId: 'u001', username: 'john.smith', role: 'analyst', department: 'Finance', timestamp: hoursAgo(44), resource: '/api/customers', action: 'read', ipAddress: '192.168.1.45', location: 'New York', device: 'Chrome/Windows', recordsAccessed: 120, sessionDuration: 720 },
  { id: 'l14', userId: 'u010', username: 'grace.wilson', role: 'engineer', department: 'Engineering', timestamp: hoursAgo(48), resource: '/api/database', action: 'query', ipAddress: '10.0.0.56', location: 'Berlin', device: 'DBeaver/Windows', recordsAccessed: 10000, sessionDuration: 5400 },
  { id: 'l15', userId: 'u004', username: 'emma.davis', role: 'analyst', department: 'Marketing', timestamp: hoursAgo(52), resource: '/api/analytics', action: 'read', ipAddress: '192.168.2.78', location: 'Chicago', device: 'Firefox/Windows', recordsAccessed: 300, sessionDuration: 1200 },
  { id: 'l16', userId: 'u006', username: 'lisa.kim', role: 'engineer', department: 'Engineering', timestamp: hoursAgo(56), resource: '/api/config', action: 'modify', ipAddress: '192.168.3.12', location: 'Seoul', device: 'Chrome/MacOS', recordsAccessed: 5, sessionDuration: 180 },
  { id: 'l17', userId: 'u011', username: 'henry.clark', role: 'admin', department: 'IT', timestamp: hoursAgo(60), resource: '/api/firewall', action: 'modify', ipAddress: '10.0.0.2', location: 'Toronto', device: 'SSH/CLI', recordsAccessed: 2, sessionDuration: 900 },
  { id: 'l18', userId: 'u012', username: 'iris.martinez', role: 'analyst', department: 'HR', timestamp: hoursAgo(64), resource: '/api/employees', action: 'export', ipAddress: '198.51.100.55', location: 'Miami', device: 'Chrome/Windows', recordsAccessed: 450, sessionDuration: 600 },
  { id: 'l19', userId: 'u005', username: 'alex.wong', role: 'admin', department: 'IT', timestamp: hoursAgo(68), resource: '/api/backup', action: 'download', ipAddress: '10.0.0.1', location: 'Singapore', device: 'rsync/CLI', recordsAccessed: 500000, sessionDuration: 7200 },
  { id: 'l20', userId: 'u013', username: 'jack.anderson', role: 'manager', department: 'Operations', timestamp: hoursAgo(72), resource: '/api/inventory', action: 'read', ipAddress: '192.168.5.33', location: 'Denver', device: 'Safari/MacOS', recordsAccessed: 1000, sessionDuration: 1800 },
];

const mockAnomalyDetails: Record<string, AnomalyDetail[]> = {
  a1: [
    { field: 'login_hour', expected: '9AM-6PM', actual: '2:30 AM', riskContribution: 25 },
    { field: 'records_accessed', expected: '~100/day', actual: '50,000', riskContribution: 30 },
    { field: 'device', expected: 'Managed laptop', actual: 'Unmanaged device', riskContribution: 20 },
    { field: 'location', expected: 'New York', actual: 'Unknown VPN', riskContribution: 15 },
  ],
  a2: [
    { field: 'access_pattern', expected: 'Normal browsing', actual: 'Bulk export', riskContribution: 35 },
    { field: 'data_volume', expected: '<500 records', actual: '150,000 records', riskContribution: 35 },
    { field: 'ip_reputation', expected: 'Corporate IP', actual: 'Suspicious IP', riskContribution: 15 },
  ],
  a3: [
    { field: 'api_endpoint', expected: '/api/repos', actual: '/api/secrets', riskContribution: 30 },
    { field: 'access_method', expected: 'Git client', actual: 'Python script', riskContribution: 25 },
    { field: 'time_of_access', expected: 'Business hours', actual: 'Off hours', riskContribution: 15 },
  ],
  a4: [
    { field: 'location', expected: 'London', actual: 'Moscow', riskContribution: 20 },
    { field: 'login_time', expected: '9AM GMT', actual: '3AM GMT', riskContribution: 25 },
    { field: 'device', expected: 'Corporate laptop', actual: 'Unknown mobile', riskContribution: 15 },
  ],
  a5: [
    { field: 'records_accessed', expected: '<200 records', actual: '8,000 records', riskContribution: 30 },
    { field: 'session_duration', expected: '<30 min', actual: '45 min continuous', riskContribution: 15 },
    { field: 'resource_type', expected: 'Individual leads', actual: 'Full database export', riskContribution: 20 },
  ],
};

export const mockAnomalies: Anomaly[] = [
  { id: 'a1', userId: 'u001', username: 'john.smith', type: 'after_hours_access', severity: 'critical', anomalyScore: 0.94, confidence: 0.97, timestamp: hoursAgo(2), description: 'User john.smith downloaded 50,000 customer records at 2:30 AM from an unmanaged device in a new location.', details: mockAnomalyDetails.a1, status: 'open' },
  { id: 'a2', userId: 'u001', username: 'john.smith', type: 'data_exfiltration', severity: 'critical', anomalyScore: 0.91, confidence: 0.95, timestamp: hoursAgo(14), description: 'Massive data export detected: 150,000 transaction records downloaded from unknown IP address using curl.', details: mockAnomalyDetails.a2, status: 'investigating' },
  { id: 'a3', userId: 'u003', username: 'mike.chen', type: 'privilege_abuse', severity: 'high', anomalyScore: 0.78, confidence: 0.89, timestamp: hoursAgo(32), description: 'Engineer accessed secrets vault using Python script outside normal workflow patterns.', details: mockAnomalyDetails.a3, status: 'open' },
  { id: 'a4', userId: 'u002', username: 'sarah.jones', type: 'new_location', severity: 'high', anomalyScore: 0.72, confidence: 0.85, timestamp: hoursAgo(25), description: 'Login detected from Moscow, Russia - user typically logs in from London, UK.', details: mockAnomalyDetails.a4, status: 'open' },
  { id: 'a5', userId: 'u008', username: 'nancy.brown', type: 'bulk_download', severity: 'medium', anomalyScore: 0.65, confidence: 0.82, timestamp: hoursAgo(36), description: 'Unusual bulk export of 8,000 lead records in single session - 40x normal volume.', details: mockAnomalyDetails.a5, status: 'resolved' },
  { id: 'a6', userId: 'u009', username: 'david.lee', type: 'new_device', severity: 'medium', anomalyScore: 0.58, confidence: 0.76, timestamp: hoursAgo(40), description: 'Download from unrecognized Linux system using wget - no prior Linux device history.', details: [{ field: 'device_type', expected: 'Windows/Mac', actual: 'Linux/wget', riskContribution: 20 }, { field: 'user_agent', expected: 'Browser', actual: 'Command line', riskContribution: 15 }], status: 'investigating' },
  { id: 'a7', userId: 'u010', username: 'grace.wilson', type: 'unusual_api_activity', severity: 'medium', anomalyScore: 0.55, confidence: 0.71, timestamp: hoursAgo(48), description: 'Extended database query session lasting 90 minutes with 10,000 record access.', details: [{ field: 'session_duration', expected: '<30 min', actual: '90 min', riskContribution: 18 }, { field: 'query_volume', expected: '<1000 rows', actual: '10000 rows', riskContribution: 15 }], status: 'open' },
  { id: 'a8', userId: 'u006', username: 'lisa.kim', type: 'cross_domain_access', severity: 'low', anomalyScore: 0.42, confidence: 0.68, timestamp: hoursAgo(56), description: 'Accessed configuration management system outside normal engineering workflow.', details: [{ field: 'resource_scope', expected: 'Code repos', actual: 'System config', riskContribution: 12 }, { field: 'access_pattern', expected: 'Regular hours', actual: 'Weekend', riskContribution: 10 }], status: 'resolved' },
];

export const mockAlerts: Alert[] = mockAnomalies.map((a) => ({
  id: `al-${a.id}`,
  userId: a.userId,
  username: a.username,
  severity: a.severity,
  riskScore: Math.round(a.anomalyScore * 100),
  title: a.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
  description: a.description,
  status: a.status as AlertStatus,
  createdAt: a.timestamp,
  recommendations: getRecommendations(a.severity),
}));

function getRecommendations(severity: string): string[] {
  const recs: Record<string, string[]> = {
    critical: ['Block account immediately', 'Force password reset', 'Enable MFA', 'Notify SOC team', 'Start forensic investigation'],
    high: ['Restrict access privileges', 'Force MFA re-verification', 'Review recent activity', 'Notify team lead'],
    medium: ['Monitor closely for 24h', 'Send security reminder', 'Review access patterns'],
    low: ['Log for trend analysis', 'Include in weekly report'],
  };
  return recs[severity] || recs.low;
}

export const mockUserProfiles: UserProfile[] = [
  { userId: 'u001', username: 'john.smith', role: 'analyst', department: 'Finance', baseline: { normalLoginHours: [9, 18], avgAccessCount: 45, avgDownloadVolume: 200, typicalResources: ['/api/customers', '/api/reports'], typicalLocations: ['New York'], typicalDevices: ['Chrome/Windows'], avgSessionDuration: 900 }, riskScore: { userId: 'u001', username: 'john.smith', score: 92, level: 'critical', factors: [{ name: 'after_hours', weight: 0.25, contribution: 23 }, { name: 'bulk_download', weight: 0.3, contribution: 27 }, { name: 'unknown_device', weight: 0.2, contribution: 18 }, { name: 'unknown_location', weight: 0.15, contribution: 14 }, { name: 'data_exfiltration', weight: 0.1, contribution: 10 }], lastUpdated: hoursAgo(1), trend: 'up' }, lastLogin: hoursAgo(2), isActive: true },
  { userId: 'u002', username: 'sarah.jones', role: 'manager', department: 'HR', baseline: { normalLoginHours: [8, 17], avgAccessCount: 30, avgDownloadVolume: 150, typicalResources: ['/api/employees', '/api/payroll'], typicalLocations: ['London'], typicalDevices: ['Safari/MacOS'], avgSessionDuration: 600 }, riskScore: { userId: 'u002', username: 'sarah.jones', score: 68, level: 'high', factors: [{ name: 'new_location', weight: 0.3, contribution: 20 }, { name: 'after_hours', weight: 0.25, contribution: 17 }, { name: 'bulk_access', weight: 0.2, contribution: 14 }, { name: 'unusual_device', weight: 0.15, contribution: 10 }, { name: 'pattern_change', weight: 0.1, contribution: 7 }], lastUpdated: hoursAgo(3), trend: 'up' }, lastLogin: hoursAgo(5), isActive: true },
  { userId: 'u003', username: 'mike.chen', role: 'engineer', department: 'Engineering', baseline: { normalLoginHours: [10, 19], avgAccessCount: 80, avgDownloadVolume: 500, typicalResources: ['/api/repos', '/api/logs'], typicalLocations: ['San Francisco'], typicalDevices: ['Git/CLI', 'Chrome/MacOS'], avgSessionDuration: 2400 }, riskScore: { userId: 'u003', username: 'mike.chen', score: 74, level: 'high', factors: [{ name: 'privilege_abuse', weight: 0.35, contribution: 26 }, { name: 'unusual_tool', weight: 0.25, contribution: 18 }, { name: 'off_hours', weight: 0.2, contribution: 15 }, { name: 'sensitive_access', weight: 0.2, contribution: 15 }], lastUpdated: hoursAgo(4), trend: 'stable' }, lastLogin: hoursAgo(8), isActive: true },
  { userId: 'u004', username: 'emma.davis', role: 'analyst', department: 'Marketing', baseline: { normalLoginHours: [9, 17], avgAccessCount: 25, avgDownloadVolume: 100, typicalResources: ['/api/campaigns', '/api/analytics'], typicalLocations: ['Chicago'], typicalDevices: ['Firefox/Windows'], avgSessionDuration: 600 }, riskScore: { userId: 'u004', username: 'emma.davis', score: 18, level: 'low', factors: [{ name: 'normal_pattern', weight: 0.4, contribution: 7 }, { name: 'typical_access', weight: 0.3, contribution: 5 }, { name: 'known_device', weight: 0.3, contribution: 6 }], lastUpdated: hoursAgo(6), trend: 'stable' }, lastLogin: hoursAgo(12), isActive: true },
  { userId: 'u005', username: 'alex.wong', role: 'admin', department: 'IT', baseline: { normalLoginHours: [8, 20], avgAccessCount: 60, avgDownloadVolume: 1000, typicalResources: ['/api/users', '/api/backup', '/api/config'], typicalLocations: ['Singapore'], typicalDevices: ['Chrome/MacOS', 'SSH/CLI'], avgSessionDuration: 1800 }, riskScore: { userId: 'u005', username: 'alex.wong', score: 32, level: 'medium', factors: [{ name: 'large_backup', weight: 0.3, contribution: 10 }, { name: 'extended_session', weight: 0.25, contribution: 8 }, { name: 'admin_privileges', weight: 0.25, contribution: 8 }, { name: 'normal_location', weight: 0.2, contribution: 6 }], lastUpdated: hoursAgo(8), trend: 'down' }, lastLogin: hoursAgo(18), isActive: true },
  { userId: 'u006', username: 'lisa.kim', role: 'engineer', department: 'Engineering', baseline: { normalLoginHours: [9, 18], avgAccessCount: 70, avgDownloadVolume: 800, typicalResources: ['/api/repos', '/api/logs', '/api/database'], typicalLocations: ['Seoul'], typicalDevices: ['Edge/Windows', 'Chrome/MacOS'], avgSessionDuration: 2100 }, riskScore: { userId: 'u006', username: 'lisa.kim', score: 28, level: 'medium', factors: [{ name: 'config_access', weight: 0.3, contribution: 8 }, { name: 'weekend_access', weight: 0.25, contribution: 7 }, { name: 'normal_volume', weight: 0.25, contribution: 7 }, { name: 'known_device', weight: 0.2, contribution: 6 }], lastUpdated: hoursAgo(10), trend: 'stable' }, lastLogin: hoursAgo(22), isActive: true },
];

export const mockInvestigations: Investigation[] = [
  { id: 'inv1', anomalyId: 'a1', userId: 'u001', username: 'john.smith', summary: 'Critical data exfiltration attempt detected', riskExplanation: 'User behavior deviates 4.2 standard deviations from baseline across multiple dimensions: time (off-hours), volume (500x normal), device (unmanaged), and location (unknown).', rootCause: 'Potential compromised credentials or insider threat. The pattern suggests intentional data harvesting using automated tools.', recommendations: ['Immediate account suspension', 'Force credential reset', 'Review data loss prevention logs', 'Interview user and manager', 'Check for malware on registered devices'], status: 'in_progress', createdAt: hoursAgo(2), aiReport: 'ANOMALY CONFIRMED: Critical Risk Score 92/100.\n\nUser john.smith (Finance Dept, Analyst) exhibited highly suspicious behavior:\n\n1. TEMPORAL ANOMALY: Access at 2:30 AM (15.5 hours outside normal window)\n2. VOLUME ANOMALY: 50,000 records (500x daily average of 100)\n3. DEVICE ANOMALY: Unmanaged device not in asset registry\n4. LOCATION ANOMALY: Unknown VPN exit node\n\nCORRELATION: This follows a pattern seen 12 hours earlier with 150,000 transaction records.\n\nRECOMMENDATION: Immediate containment required.' },
  { id: 'inv2', anomalyId: 'a2', userId: 'u001', username: 'john.smith', summary: 'Secondary massive data export from unknown IP', riskExplanation: '150,000 records exported via curl from suspicious IP 203.0.113.45. This IP is not in the corporate whitelist.', rootCause: 'Likely continuation of the same threat actor using different tools and endpoints.', recommendations: ['IP block at firewall', 'Deep packet inspection', 'Review DLP alerts', 'Forensic analysis of exported data scope'], status: 'pending', createdAt: hoursAgo(14) },
  { id: 'inv3', anomalyId: 'a3', userId: 'u003', username: 'mike.chen', summary: 'Secrets vault access via unauthorized script', riskExplanation: 'Engineer used Python script to access secrets management system, bypassing standard Git-based workflows.', rootCause: 'Possible automation attempt or credential harvesting script.', recommendations: ['Revoke secrets access', 'Audit all secrets retrieved', 'Review code repository for hardcoded credentials', 'Security training'], status: 'pending', createdAt: hoursAgo(32) },
  { id: 'inv4', anomalyId: 'a4', userId: 'u002', username: 'sarah.jones', summary: 'Impossible travel alert - London to Moscow', riskExplanation: 'Login from Moscow 5 hours after London login. Physical travel impossible in this timeframe.', rootCause: 'Credential sharing, VPN bypass, or account compromise.', recommendations: ['Force MFA re-verification', 'Check for session hijacking', 'Verify with user', 'Review VPN logs'], status: 'completed', createdAt: hoursAgo(25), completedAt: hoursAgo(5) },
  { id: 'inv5', anomalyId: 'a5', userId: 'u008', username: 'nancy.brown', summary: 'Bulk lead export - 40x normal volume', riskExplanation: '8,000 leads exported in single session. Pattern consistent with data harvesting for competitor.', rootCause: 'User preparing to leave company. Voluntary disclosure confirmed.', recommendations: ['Revoke export privileges', 'Review data handling policy', 'Legal review of data usage'], status: 'completed', createdAt: hoursAgo(36), completedAt: hoursAgo(12) },
];

export const mockDashboardStats: DashboardStats = {
  totalEvents: 2847291,
  anomaliesDetected: 147,
  criticalThreats: 12,
  highRiskUsers: 8,
  openAlerts: 23,
  avgRiskScore: 34.2,
  eventsTrend: 12.5,
  anomaliesTrend: -8.3,
};

export const mockRiskDistribution: RiskScore[] = mockUserProfiles.map(u => u.riskScore);

export function generateTimeSeriesData(): TimeSeriesPoint[] {
  const data: TimeSeriesPoint[] = [];
  for (let i = 30; i >= 0; i--) {
    data.push({
      timestamp: daysAgo(i),
      value: Math.floor(80000 + Math.random() * 40000 + (i < 5 ? 30000 : 0)),
      label: daysAgo(i).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }
  return data;
}

export function generateAnomalyTrend(): TimeSeriesPoint[] {
  const data: TimeSeriesPoint[] = [];
  for (let i = 30; i >= 0; i--) {
    data.push({
      timestamp: daysAgo(i),
      value: Math.floor(2 + Math.random() * 6 + (i < 3 ? 4 : 0)),
      label: daysAgo(i).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }
  return data;
}

export function generateHeatmapData(): HeatmapCell[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const cells: HeatmapCell[] = [];
  for (const day of days) {
    for (let hour = 0; hour < 24; hour++) {
      const isBusinessHours = hour >= 9 && hour <= 18 && day !== 'Sat' && day !== 'Sun';
      const isAnomaly = (hour < 6 || hour > 23) && Math.random() > 0.7;
      cells.push({
        hour,
        day,
        value: isBusinessHours ? Math.floor(20 + Math.random() * 80) : Math.floor(Math.random() * 20),
        isAnomaly,
      });
    }
  }
  return cells;
}

export const mockChatMessages: ChatMessage[] = [
  { id: 'c1', role: 'assistant', content: 'Welcome to InsiderGuard AI Investigation Assistant. I can help you analyze threats, generate reports, and investigate anomalies. What would you like to know?', timestamp: hoursAgo(0.1) },
];

export const mockAIResponses: Record<string, string> = {
  'john': 'ANALYSIS: john.smith\n\nRisk Score: 92/100 (CRITICAL)\n\nKey Findings:\n- 2 critical anomalies in last 24h\n- 500x normal data access volume\n- Off-hours access pattern detected\n- Unknown device and location\n\nRecommended Action: Immediate account suspension and forensic investigation.',
  'critical': 'Today\'s Critical Alerts (3):\n\n1. [CRITICAL] john.smith - 50,000 records at 2:30 AM (Score: 94)\n2. [CRITICAL] john.smith - 150,000 records from unknown IP (Score: 91)\n3. [HIGH] mike.chen - Secrets vault unauthorized access (Score: 78)\n\nAll flagged for immediate SOC review.',
  'suspicious exports': 'Suspicious Exports This Week:\n\n1. john.smith - 50,000 customer records (2h ago)\n2. john.smith - 150,000 transaction records (14h ago)\n3. nancy.brown - 8,000 lead records (36h ago)\n4. david.lee - 25,000 report records (40h ago)\n5. alex.wong - 500,000 backup files (68h ago)\n\nTotal: 733,000 records exported abnormally.',
  'why flagged': 'The user was flagged by our Isolation Forest model because their behavior deviates significantly from their established baseline. Key factors include:\n\n1. After-hours access (+20 risk)\n2. Bulk data download (+40 risk)\n3. New/unmanaged device (+20 risk)\n4. Unknown location/VPN (+20 risk)\n\nCombined risk score: 92/100 (CRITICAL)',
};
