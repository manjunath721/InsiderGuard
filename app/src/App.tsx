import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import { HeroSection } from '@/sections/HeroSection';
import { ThreatAnalytics } from '@/sections/ThreatAnalytics';
import { AIInvestigation } from '@/sections/AIInvestigation';
import { TrendsSection } from '@/sections/TrendsSection';
import { AlertsSection } from '@/sections/AlertsSection';
import { UsersSection } from '@/sections/UsersSection';
import { LogsSection } from '@/sections/LogsSection';
import { AIChatAssistant } from '@/sections/AIChatAssistant';
import { SettingsSection } from '@/sections/SettingsSection';
import { LoginPage } from '@/pages/Login';
import { useAuth } from '@/context/AuthContext';
import { getAccessLogs, getAlerts, getAnomalies, getRiskScores } from '@/lib/api';
import {
  Shield,
  AlertTriangle,
  Users,
  FileText,
} from 'lucide-react';

function DashboardView() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    anomaliesDetected: 0,
    criticalThreats: 0,
    highRiskUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      setError(null);
      try {
        const [logs, alerts, anomalies, riskScores] = await Promise.all([
          getAccessLogs(200, 0),
          getAlerts(undefined, undefined, undefined, 100, 0),
          getAnomalies(50, 0),
          getRiskScores(),
        ]);

        setStats({
          totalEvents: logs.length,
          anomaliesDetected: anomalies.length,
          criticalThreats: alerts.filter(alert => alert.severity === 'critical').length,
          highRiskUsers: new Set(riskScores.filter(score => score.category === 'high' || score.category === 'critical').map(score => score.user_id)).size,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="space-y-4">
      {/* Hero Section */}
      <HeroSection />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Total Events"
          value={loading ? 'Loading...' : stats.totalEvents.toString()}
          trend={0}
          icon={<FileText className="w-5 h-5" />}
          color="info"
          subtitle="All-time access events"
        />
        <StatCard
          title="Anomalies Detected"
          value={loading ? 'Loading...' : stats.anomaliesDetected.toString()}
          trend={0}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="medium"
          subtitle="By anomaly detection engine"
        />
        <StatCard
          title="Critical Threats"
          value={loading ? 'Loading...' : stats.criticalThreats.toString()}
          icon={<Shield className="w-5 h-5" />}
          color="critical"
          subtitle="Require immediate action"
        />
        <StatCard
          title="High Risk Users"
          value={loading ? 'Loading...' : stats.highRiskUsers.toString()}
          icon={<Users className="w-5 h-5" />}
          color="high"
          subtitle="Above threshold risk score"
        />
      </div>

      {/* Threat Analytics Grid */}
      <ThreatAnalytics />

      {/* Trends & ML Metrics */}
      <TrendsSection />

      {/* AI Investigation Terminal */}
      <AIInvestigation />
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-[#F5F5F0]">
        Loading InsiderGuard...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'users':
        return <UsersSection />;
      case 'logs':
        return <LogsSection />;
      case 'alerts':
        return <AlertsSection />;
      case 'ai':
        return <AIChatAssistant />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <DashboardView />;
    }
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Executive Command Center', subtitle: 'Real-time threat intelligence & anomaly detection' };
      case 'users':
        return { title: 'User Behavioral Analytics', subtitle: 'Monitor user activity & risk profiles' };
      case 'logs':
        return { title: 'Access Log Explorer', subtitle: 'Search and analyze access events' };
      case 'alerts':
        return { title: 'Alert Management', subtitle: 'Track and respond to security alerts' };
      case 'ai':
        return { title: 'AI Investigation Assistant', subtitle: 'Gemini-powered threat analysis & reporting' };
      case 'settings':
        return { title: 'System Configuration', subtitle: 'Configure detection rules & notifications' };
      default:
        return { title: 'Executive Command Center', subtitle: '' };
    }
  };

  const header = getHeaderTitle();

  return (
    <div className="min-h-screen bg-[#050505]">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="ml-[200px] min-h-screen">
        <Header title={header.title} subtitle={header.subtitle} userName={user?.username} />
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
