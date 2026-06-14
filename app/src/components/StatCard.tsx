import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: ReactNode;
  color: 'critical' | 'high' | 'medium' | 'low' | 'info' | 'purple';
  subtitle?: string;
}

const colorMap = {
  critical: { bg: 'rgba(255,59,48,0.12)', border: 'rgba(255,59,48,0.2)', text: '#FF3B30', glow: 'shadow-[0_0_12px_rgba(255,59,48,0.15)]' },
  high: { bg: 'rgba(255,149,0,0.12)', border: 'rgba(255,149,0,0.2)', text: '#FF9500', glow: 'shadow-[0_0_12px_rgba(255,149,0,0.15)]' },
  medium: { bg: 'rgba(255,204,0,0.12)', border: 'rgba(255,204,0,0.2)', text: '#FFCC00', glow: 'shadow-[0_0_12px_rgba(255,204,0,0.15)]' },
  low: { bg: 'rgba(48,209,88,0.12)', border: 'rgba(48,209,88,0.2)', text: '#30D158', glow: 'shadow-[0_0_12px_rgba(48,209,88,0.15)]' },
  info: { bg: 'rgba(10,132,255,0.12)', border: 'rgba(10,132,255,0.2)', text: '#0A84FF', glow: 'shadow-[0_0_12px_rgba(10,132,255,0.15)]' },
  purple: { bg: 'rgba(191,90,242,0.12)', border: 'rgba(191,90,242,0.2)', text: '#BF5AF2', glow: 'shadow-[0_0_12px_rgba(191,90,242,0.15)]' },
};

export function StatCard({ title, value, trend, icon, color, subtitle }: StatCardProps) {
  const colors = colorMap[color];
  const trendIsPositive = trend !== undefined && trend > 0;
  const trendIsNegative = trend !== undefined && trend < 0;
  const trendIsNeutral = trend !== undefined && trend === 0;

  return (
    <div
      className={`relative rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5 ${colors.glow}`}
      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${colors.text}20` }}
        >
          <div style={{ color: colors.text }}>{icon}</div>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trendIsPositive ? 'text-[#FF3B30]' : trendIsNegative ? 'text-[#30D158]' : 'text-[#8A8A93]'
          }`}>
            {trendIsPositive && <TrendingUp className="w-3 h-3" />}
            {trendIsNegative && <TrendingDown className="w-3 h-3" />}
            {trendIsNeutral && <Minus className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="text-2xl font-bold text-[#F5F5F0] tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>

      <div className="mt-1 text-xs text-[#8A8A93] uppercase tracking-wider font-medium">
        {title}
      </div>

      {subtitle && (
        <div className="mt-2 text-[11px] text-[#5A5A63]">{subtitle}</div>
      )}
    </div>
  );
}
