import { useState } from 'react';
import {
  Shield,
  Bell,
  Brain,
  Database,
  Lock,
} from 'lucide-react';

interface SettingToggleProps {
  icon: typeof Shield;
  label: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}

function SettingToggle({ icon: Icon, label, description, enabled, onChange }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-[rgba(245,245,240,0.04)] last:border-0">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#111111] border border-[rgba(245,245,240,0.06)] flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-[#8A8A93]" />
        </div>
        <div>
          <div className="text-sm font-medium text-[#F5F5F0]">{label}</div>
          <div className="text-[11px] text-[#8A8A93] mt-0.5">{description}</div>
        </div>
      </div>
      <button
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          enabled ? 'bg-[#0A84FF]' : 'bg-[#1a1a1a]'
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-5.5 left-0' : 'left-0.5'
          }`}
          style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  );
}

interface SettingSliderProps {
  icon: typeof Shield;
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit?: string;
}

function SettingSlider({ icon: Icon, label, description, value, min, max, step, onChange, unit }: SettingSliderProps) {
  return (
    <div className="py-4 border-b border-[rgba(245,245,240,0.04)] last:border-0">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-[#111111] border border-[rgba(245,245,240,0.06)] flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-[#8A8A93]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-[#F5F5F0]">{label}</div>
            <div className="text-sm font-semibold text-[#0A84FF]">
              {value}{unit}
            </div>
          </div>
          <div className="text-[11px] text-[#8A8A93] mt-0.5">{description}</div>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#1a1a1a] accent-[#0A84FF]"
      />
    </div>
  );
}

export function SettingsSection() {
  const [settings, setSettings] = useState({
    realTimeMonitoring: true,
    autoBlockCritical: false,
    emailAlerts: true,
    slackNotifications: true,
    aiReports: true,
    logRetention: 90,
    anomalyThreshold: 0.7,
    riskScoreThreshold: 75,
    scanFrequency: 5,
    mfaRequired: true,
    ipWhitelisting: false,
    dataEncryption: true,
  });

  const updateSetting = (key: string, value: boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Detection Settings */}
      <div className="rounded-xl border border-[rgba(245,245,240,0.06)] bg-[#0A0A0A] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-[#0A84FF]" />
          <h2 className="text-sm font-semibold text-[#F5F5F0]">Detection Settings</h2>
        </div>

        <SettingToggle
          icon={Shield}
          label="Real-time Monitoring"
          description="Continuously monitor all access events in real-time"
          enabled={settings.realTimeMonitoring}
          onChange={() => updateSetting('realTimeMonitoring', !settings.realTimeMonitoring)}
        />
        <SettingToggle
          icon={Lock}
          label="Auto-block Critical Threats"
          description="Automatically block accounts with critical risk scores"
          enabled={settings.autoBlockCritical}
          onChange={() => updateSetting('autoBlockCritical', !settings.autoBlockCritical)}
        />
        <SettingSlider
          icon={Brain}
          label="Anomaly Detection Threshold"
          description="Minimum anomaly score to trigger an alert (0.0 - 1.0)"
          value={settings.anomalyThreshold}
          min={0}
          max={1}
          step={0.05}
          onChange={v => updateSetting('anomalyThreshold', v)}
        />
        <SettingSlider
          icon={Shield}
          label="Risk Score Threshold"
          description="Minimum risk score to flag a user for review (0 - 100)"
          value={settings.riskScoreThreshold}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={v => updateSetting('riskScoreThreshold', v)}
        />
      </div>

      {/* Notification Settings */}
      <div className="rounded-xl border border-[rgba(245,245,240,0.06)] bg-[#0A0A0A] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-[#FF9500]" />
          <h2 className="text-sm font-semibold text-[#F5F5F0]">Notifications</h2>
        </div>

        <SettingToggle
          icon={Bell}
          label="Email Alerts"
          description="Receive email notifications for critical threats"
          enabled={settings.emailAlerts}
          onChange={() => updateSetting('emailAlerts', !settings.emailAlerts)}
        />
        <SettingToggle
          icon={Bell}
          label="Slack Notifications"
          description="Send alerts to configured Slack channels"
          enabled={settings.slackNotifications}
          onChange={() => updateSetting('slackNotifications', !settings.slackNotifications)}
        />
        <SettingSlider
          icon={Database}
          label="Scan Frequency"
          description="How often to run ML detection scans (minutes)"
          value={settings.scanFrequency}
          min={1}
          max={60}
          step={1}
          unit=" min"
          onChange={v => updateSetting('scanFrequency', v)}
        />
      </div>

      {/* AI Settings */}
      <div className="rounded-xl border border-[rgba(245,245,240,0.06)] bg-[#0A0A0A] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-[#BF5AF2]" />
          <h2 className="text-sm font-semibold text-[#F5F5F0]">AI Configuration</h2>
        </div>

        <SettingToggle
          icon={Brain}
          label="AI Investigation Reports"
          description="Enable automatic AI-generated investigation reports"
          enabled={settings.aiReports}
          onChange={() => updateSetting('aiReports', !settings.aiReports)}
        />
        <SettingSlider
          icon={Database}
          label="Log Retention"
          description="Number of days to retain access logs"
          value={settings.logRetention}
          min={7}
          max={365}
          step={7}
          unit=" days"
          onChange={v => updateSetting('logRetention', v)}
        />
      </div>

      {/* Security Settings */}
      <div className="rounded-xl border border-[rgba(245,245,240,0.06)] bg-[#0A0A0A] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-[#30D158]" />
          <h2 className="text-sm font-semibold text-[#F5F5F0]">Security</h2>
        </div>

        <SettingToggle
          icon={Lock}
          label="Require MFA"
          description="Enforce multi-factor authentication for all users"
          enabled={settings.mfaRequired}
          onChange={() => updateSetting('mfaRequired', !settings.mfaRequired)}
        />
        <SettingToggle
          icon={Shield}
          label="IP Whitelisting"
          description="Restrict access to whitelisted IP addresses only"
          enabled={settings.ipWhitelisting}
          onChange={() => updateSetting('ipWhitelisting', !settings.ipWhitelisting)}
        />
        <SettingToggle
          icon={Lock}
          label="Data Encryption"
          description="Encrypt all stored access logs and user data"
          enabled={settings.dataEncryption}
          onChange={() => updateSetting('dataEncryption', !settings.dataEncryption)}
        />
      </div>
    </div>
  );
}
