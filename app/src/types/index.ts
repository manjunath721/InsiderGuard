export interface AccessLog {
  id: string;
  userId: string;
  username: string;
  role: string;
  department: string;
  timestamp: Date;
  resource: string;
  action: string;
  ipAddress: string;
  location: string;
  device: string;
  recordsAccessed: number;
  sessionDuration: number;
}

export interface Anomaly {
  id: string;
  userId: string;
  username: string;
  type: AnomalyType;
  severity: Severity;
  anomalyScore: number;
  confidence: number;
  timestamp: Date;
  description: string;
  details: AnomalyDetail[];
  status: AnomalyStatus;
}

export type AnomalyType =
  | 'after_hours_access'
  | 'bulk_download'
  | 'new_location'
  | 'new_device'
  | 'privilege_abuse'
  | 'cross_domain_access'
  | 'unusual_api_activity'
  | 'excessive_login_attempts'
  | 'data_exfiltration'
  | 'suspicious_pattern';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type AnomalyStatus = 'open' | 'investigating' | 'resolved';

export interface AnomalyDetail {
  field: string;
  expected: string;
  actual: string;
  riskContribution: number;
}

export interface RiskScore {
  userId: string;
  username: string;
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
  lastUpdated: Date;
  trend: 'up' | 'down' | 'stable';
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskFactor {
  name: string;
  weight: number;
  contribution: number;
}

export interface Alert {
  id: string;
  userId: string;
  username: string;
  severity: Severity;
  riskScore: number;
  title: string;
  description: string;
  status: AlertStatus;
  createdAt: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  recommendations: string[];
}

export type AlertStatus = 'open' | 'investigating' | 'resolved';

export interface UserProfile {
  userId: string;
  username: string;
  role: string;
  department: string;
  baseline: UserBaseline;
  riskScore: RiskScore;
  lastLogin: Date;
  isActive: boolean;
}

export interface UserBaseline {
  normalLoginHours: [number, number];
  avgAccessCount: number;
  avgDownloadVolume: number;
  typicalResources: string[];
  typicalLocations: string[];
  typicalDevices: string[];
  avgSessionDuration: number;
}

export interface Investigation {
  id: string;
  anomalyId: string;
  userId: string;
  username: string;
  summary: string;
  riskExplanation: string;
  rootCause: string;
  recommendations: string[];
  status: InvestigationStatus;
  createdAt: Date;
  completedAt?: Date;
  aiReport?: string;
}

export type InvestigationStatus = 'pending' | 'in_progress' | 'completed';

export interface DashboardStats {
  totalEvents: number;
  anomaliesDetected: number;
  criticalThreats: number;
  highRiskUsers: number;
  openAlerts: number;
  avgRiskScore: number;
  eventsTrend: number;
  anomaliesTrend: number;
}

export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface HeatmapCell {
  hour: number;
  day: string;
  value: number;
  isAnomaly: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}
