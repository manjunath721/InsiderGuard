import { Search, Bell, Shield } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  userName?: string | null;
}

export function Header({ title, subtitle, userName }: HeaderProps) {
  return (
    <header className="flex items-center justify-between py-4 px-6 border-b border-[rgba(245,245,240,0.06)]">
      <div>
        <h1 className="text-xl font-semibold text-[#F5F5F0] tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-[#5A5A63] mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-[11px] text-[#8A8A93]">Signed in as</p>
          <p className="text-sm font-semibold text-[#F5F5F0]">{userName ?? 'Analyst'}</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5A63]" />
          <input
            type="text"
            placeholder="Search users, alerts, logs..."
            className="w-64 pl-9 pr-4 py-2 rounded-lg bg-[#111111] border border-[rgba(245,245,240,0.08)] text-sm text-[#F5F5F0] placeholder:text-[#5A5A63] focus:outline-none focus:border-[#0A84FF] transition-colors"
          />
        </div>

        <button className="relative p-2 rounded-lg text-[#8A8A93] hover:text-[#F5F5F0] hover:bg-[#111111] transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-[#FF3B30]" />
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(48,209,88,0.12)] border border-[rgba(48,209,88,0.2)]">
          <Shield className="w-3.5 h-3.5 text-[#30D158]" />
          <span className="text-xs font-medium text-[#30D158]">Secure</span>
        </div>
      </div>
    </header>
  );
}
