import { useState } from 'react';
import {
  Shield,
  Users,
  FileText,
  Bell,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', icon: Shield, label: 'Dashboard' },
  { id: 'users', icon: Users, label: 'Users' },
  { id: 'logs', icon: FileText, label: 'Access Logs' },
  { id: 'alerts', icon: Bell, label: 'Alerts' },
  { id: 'ai', icon: Brain, label: 'AI Assistant' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#050505] border-r border-[rgba(245,245,240,0.06)] z-50 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[64px]' : 'w-[200px]'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[rgba(245,245,240,0.06)]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0A84FF] to-[#BF5AF2] flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-semibold text-[#F5F5F0] tracking-tight whitespace-nowrap">
              InsiderGuard
            </h1>
            <p className="text-[10px] text-[#5A5A63] uppercase tracking-wider whitespace-nowrap">
              AI Security
            </p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                isActive
                  ? 'bg-[#111111] text-[#0A84FF]'
                  : 'text-[#8A8A93] hover:text-[#F5F5F0] hover:bg-[#0a0a0a]'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-[#0A84FF] rounded-r-full" />
              )}
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#0A84FF]' : ''}`} />
              {!collapsed && (
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0A84FF] animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-[rgba(245,245,240,0.06)]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-[#5A5A63] hover:text-[#F5F5F0] hover:bg-[#0a0a0a] transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
