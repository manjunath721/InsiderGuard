import type { AccessLog, Anomaly, RiskScore, RiskFactor, RiskLevel, Severity, UserBaseline } from '@/types';

// ============================================
// Isolation Forest Implementation
// ============================================

interface IsolationTree {
  left: IsolationTree | null;
  right: IsolationTree | null;
  splitAttr: number;
  splitValue: number;
  size: number;
}

interface FeatureVector {
  features: number[];
  log: AccessLog;
}

function extractFeatures(log: AccessLog, baseline?: UserBaseline): number[] {
  const hour = log.timestamp.getHours();
  const isBusinessHours = hour >= 9 && hour <= 18 ? 1 : 0;
  const isWeekend = log.timestamp.getDay() === 0 || log.timestamp.getDay() === 6 ? 1 : 0;
  const recordsLog = Math.log10(log.recordsAccessed + 1);
  const sessionLog = Math.log10(log.sessionDuration + 1);

  let deviceDeviation = 0;
  let locationDeviation = 0;
  let hourDeviation = 0;

  if (baseline) {
    deviceDeviation = baseline.typicalDevices.includes(log.device) ? 0 : 1;
    locationDeviation = baseline.typicalLocations.includes(log.location) ? 0 : 1;
    const [startHour, endHour] = baseline.normalLoginHours;
    hourDeviation = (hour >= startHour && hour <= endHour) ? 0 : 1;
  }

  return [
    hour / 24,
    isBusinessHours,
    isWeekend,
    recordsLog / 6,
    sessionLog / 4,
    deviceDeviation,
    locationDeviation,
    hourDeviation,
    log.action === 'export' || log.action === 'download' ? 1 : 0,
    log.recordsAccessed > 10000 ? 1 : 0,
  ];
}

function buildIsolationTree(data: FeatureVector[], height: number, maxHeight: number): IsolationTree | null {
  if (data.length <= 1 || height >= maxHeight) {
    return {
      left: null,
      right: null,
      splitAttr: 0,
      splitValue: 0,
      size: data.length,
    };
  }

  const numFeatures = data[0].features.length;
  const splitAttr = Math.floor(Math.random() * numFeatures);
  const values = data.map(d => d.features[splitAttr]);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const splitValue = minVal + Math.random() * (maxVal - minVal);

  const left = data.filter(d => d.features[splitAttr] < splitValue);
  const right = data.filter(d => d.features[splitAttr] >= splitValue);

  return {
    left: buildIsolationTree(left, height + 1, maxHeight),
    right: buildIsolationTree(right, height + 1, maxHeight),
    splitAttr,
    splitValue,
    size: data.length,
  };
}

function pathLength(featureVector: number[], tree: IsolationTree | null, currentDepth: number): number {
  if (!tree || tree.size <= 1) {
    return currentDepth + (tree?.size === 1 ? 0 : 0);
  }
  if (!tree.left && !tree.right) {
    return currentDepth + c(tree.size);
  }
  if (featureVector[tree.splitAttr] < tree.splitValue) {
    return pathLength(featureVector, tree.left, currentDepth + 1);
  }
  return pathLength(featureVector, tree.right, currentDepth + 1);
}

function c(n: number): number {
  if (n <= 1) return 0;
  return 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1) / n);
}

export class IsolationForest {
  private trees: IsolationTree[] = [];
  private numTrees: number;
  private subsampleSize: number;

  constructor(numTrees = 100, subsampleSize = 256) {
    this.numTrees = numTrees;
    this.subsampleSize = subsampleSize;
  }

  fit(logs: AccessLog[], baselines?: Map<string, UserBaseline>): void {
    const vectors: FeatureVector[] = logs.map(log => ({
      features: extractFeatures(log, baselines?.get(log.userId)),
      log,
    }));

    this.trees = [];
    for (let i = 0; i < this.numTrees; i++) {
      const sample = this.subsample(vectors);
      const maxHeight = Math.ceil(Math.log2(this.subsampleSize));
      this.trees.push(buildIsolationTree(sample, 0, maxHeight)!);
    }
  }

  private subse(vectors: FeatureVector[]): FeatureVector[] {
    const shuffled = [...vectors].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(this.subsampleSize, shuffled.length));
  }

  private subsample = this.subse;

  anomalyScore(log: AccessLog, baseline?: UserBaseline): number {
    const features = extractFeatures(log, baseline);
    const avgPathLength = this.trees.reduce((sum, tree) => sum + pathLength(features, tree, 0), 0) / this.trees.length;
    const expectedPath = c(this.subsampleSize);
    const score = Math.pow(2, -avgPathLength / expectedPath);
    return Math.min(1, Math.max(0, score));
  }

  anomalyScores(logs: AccessLog[], baselines?: Map<string, UserBaseline>): Map<string, number> {
    const scores = new Map<string, number>();
    for (const log of logs) {
      scores.set(log.id, this.anomalyScore(log, baselines?.get(log.userId)));
    }
    return scores;
  }
}

// ============================================
// Risk Scoring Engine
// ============================================

const RISK_WEIGHTS: Record<string, number> = {
  after_hours_access: 20,
  bulk_download: 40,
  new_location: 20,
  new_device: 20,
  privilege_abuse: 35,
  cross_domain_access: 15,
  unusual_api_activity: 18,
  excessive_login_attempts: 25,
  data_exfiltration: 45,
  suspicious_pattern: 12,
};

const SEVERITY_MULTIPLIERS: Record<Severity, number> = {
  critical: 2.0,
  high: 1.5,
  medium: 1.0,
  low: 0.5,
};

export function calculateRiskScore(
  anomalyType: string,
  severity: Severity,
  anomalyScore: number,
  confidence: number,
  additionalFactors: { name: string; contribution: number }[] = []
): RiskScore {
  const baseWeight = RISK_WEIGHTS[anomalyType] || 10;
  const severityMult = SEVERITY_MULTIPLIERS[severity] || 1;

  let totalScore = baseWeight * severityMult * anomalyScore * confidence;

  const factors: RiskFactor[] = [
    { name: anomalyType, weight: baseWeight / 100, contribution: baseWeight * severityMult * anomalyScore },
    { name: 'severity_adjustment', weight: 0.15, contribution: (severityMult - 1) * 20 },
    { name: 'confidence', weight: 0.1, contribution: confidence * 10 },
  ];

  for (const factor of additionalFactors) {
    totalScore += factor.contribution;
    factors.push({ name: factor.name, weight: 0.05, contribution: factor.contribution });
  }

  totalScore = Math.min(100, Math.max(0, totalScore));

  let level: RiskLevel = 'low';
  if (totalScore >= 76) level = 'critical';
  else if (totalScore >= 51) level = 'high';
  else if (totalScore >= 26) level = 'medium';

  return {
    userId: '',
    username: '',
    score: Math.round(totalScore),
    level,
    factors,
    lastUpdated: new Date(),
    trend: 'stable',
  };
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 76) return 'critical';
  if (score >= 51) return 'high';
  if (score >= 26) return 'medium';
  return 'low';
}

export function getSeverityColor(severity: Severity): string {
  const colors: Record<Severity, string> = {
    critical: '#FF3B30',
    high: '#FF9500',
    medium: '#FFCC00',
    low: '#30D158',
  };
  return colors[severity];
}

export function getRiskLevelColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    critical: '#FF3B30',
    high: '#FF9500',
    medium: '#FFCC00',
    low: '#30D158',
  };
  return colors[level];
}

// ============================================
// Behavioral Baseline
// ============================================

export function buildUserBaseline(logs: AccessLog[]): UserBaseline {
  const loginHours = logs.map(l => l.timestamp.getHours());
  const minHour = Math.min(...loginHours);
  const maxHour = Math.max(...loginHours);

  const records = logs.map(l => l.recordsAccessed);
  const avgRecords = records.reduce((a, b) => a + b, 0) / records.length;

  const resources = [...new Set(logs.map(l => l.resource))];
  const locations = [...new Set(logs.map(l => l.location))];
  const devices = [...new Set(logs.map(l => l.device))];

  const sessions = logs.map(l => l.sessionDuration);
  const avgSession = sessions.reduce((a, b) => a + b, 0) / sessions.length;

  return {
    normalLoginHours: [Math.max(0, minHour - 1), Math.min(23, maxHour + 1)],
    avgAccessCount: logs.length,
    avgDownloadVolume: Math.round(avgRecords),
    typicalResources: resources.slice(0, 5),
    typicalLocations: locations.slice(0, 3),
    typicalDevices: devices.slice(0, 3),
    avgSessionDuration: Math.round(avgSession),
  };
}

// ============================================
// Explainable AI
// ============================================

export function generateAIReport(anomaly: Anomaly): string {
  const severityLabel = anomaly.severity.toUpperCase();
  const details = anomaly.details.map(d =>
    `- ${d.field}: Expected "${d.expected}", Got "${d.actual}" (+${d.riskContribution} risk)`
  ).join('\n');

  return `${severityLabel} ANOMALY DETECTED\n\n` +
    `User: ${anomaly.username}\n` +
    `Type: ${anomaly.type.replace(/_/g, ' ').toUpperCase()}\n` +
    `Risk Score: ${Math.round(anomaly.anomalyScore * 100)}/100\n` +
    `Confidence: ${Math.round(anomaly.confidence * 100)}%\n\n` +
    `DEVIATION ANALYSIS:\n${details}\n\n` +
    `SUMMARY:\n${anomaly.description}\n\n` +
    `RECOMMENDED ACTIONS:\n` +
    getRecommendations(anomaly.severity).map((r, i) => `${i + 1}. ${r}`).join('\n');
}

function getRecommendations(severity: Severity): string[] {
  const recs: Record<Severity, string[]> = {
    critical: ['Immediate account suspension', 'Force credential reset', 'Enable MFA lockdown', 'Notify SOC L3 team', 'Initiate forensic timeline'],
    high: ['Restrict data access privileges', 'Force MFA re-verification', 'Alert direct manager', '24-hour monitoring'],
    medium: ['Add to watchlist', 'Send security awareness reminder', 'Review in next shift'],
    low: ['Log for pattern analysis', 'No immediate action needed'],
  };
  return recs[severity];
}

// ============================================
// Pattern Detection
// ============================================

export function detectPatterns(logs: AccessLog[]): { type: string; confidence: number; description: string }[] {
  const patterns: { type: string; confidence: number; description: string }[] = [];

  // Time clustering
  const hourGroups = new Map<number, number>();
  for (const log of logs) {
    const h = log.timestamp.getHours();
    hourGroups.set(h, (hourGroups.get(h) || 0) + 1);
  }
  const offHours = [...hourGroups.entries()].filter(([h]) => h < 6 || h > 22);
  if (offHours.length > 3) {
    patterns.push({
      type: 'off_hours_clustering',
      confidence: Math.min(0.95, offHours.reduce((s, [, c]) => s + c, 0) / logs.length),
      description: `Detected ${offHours.length} distinct off-hours access windows`,
    });
  }

  // Volume escalation
  const volumes = logs.map(l => l.recordsAccessed).sort((a, b) => a - b);
  if (volumes.length > 3) {
    const recent = volumes.slice(-3);
    const earlier = volumes.slice(0, 3);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    if (recentAvg > earlierAvg * 5) {
      patterns.push({
        type: 'volume_escalation',
        confidence: Math.min(0.9, 1 - earlierAvg / recentAvg),
        description: `Data access volume increased ${(recentAvg / earlierAvg).toFixed(1)}x in recent sessions`,
      });
    }
  }

  // Location hopping
  const uniqueLocs = new Set(logs.map(l => l.location));
  if (uniqueLocs.size > 3) {
    patterns.push({
      type: 'location_hopping',
      confidence: Math.min(0.85, uniqueLocs.size * 0.15),
      description: `Access from ${uniqueLocs.size} different locations detected`,
    });
  }

  return patterns;
}

// ============================================
// Model Evaluation Metrics
// ============================================

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  confusionMatrix: [number, number, number, number]; // TP, FP, TN, FN
}

export function calculateMetrics(trueLabels: boolean[], predictedLabels: boolean[]): ModelMetrics {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (let i = 0; i < trueLabels.length; i++) {
    if (trueLabels[i] && predictedLabels[i]) tp++;
    else if (!trueLabels[i] && predictedLabels[i]) fp++;
    else if (!trueLabels[i] && !predictedLabels[i]) tn++;
    else fn++;
  }

  const accuracy = (tp + tn) / (tp + fp + tn + fn);
  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

  // Simplified ROC-AUC (trapezoidal approximation)
  const rocAuc = 0.5 + (recall - fp / (fp + tn)) * 0.5;

  return { accuracy, precision, recall, f1Score, rocAuc, confusionMatrix: [tp, fp, tn, fn] };
}

// Pre-computed demo metrics
export const demoModelMetrics: ModelMetrics = {
  accuracy: 0.943,
  precision: 0.917,
  recall: 0.889,
  f1Score: 0.903,
  rocAuc: 0.961,
  confusionMatrix: [165, 15, 2845, 21],
};
