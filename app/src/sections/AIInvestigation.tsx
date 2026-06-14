import { useState, useEffect, useRef, useCallback } from 'react';
import { getInvestigations, type InvestigationPayload } from '@/lib/api';
import { Brain, FileText, Lock, RotateCcw, Shield, UserX } from 'lucide-react';

const REPLACEMENTS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;\':",./<>?';
const MUTATION_RATE = 0.5;
const RESOLUTION_RATE = 0.05;

interface Letter {
  el: HTMLSpanElement;
  char: string;
  cycleComplete: boolean;
}

function useCyberTypewriter() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<Letter[]>([]);
  const rafRef = useRef<number>(0);
  const isAnimatingRef = useRef(false);

  const animate = useCallback(() => {
    lettersRef.current = lettersRef.current.filter(l => !l.cycleComplete);

    for (const l of lettersRef.current) {
      if (Math.random() < MUTATION_RATE) {
        l.el.innerText = REPLACEMENTS[Math.floor(Math.random() * REPLACEMENTS.length)];
      }
      if (Math.random() < RESOLUTION_RATE) {
        l.el.innerText = l.char;
        l.cycleComplete = true;
      }
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  const resolve = useCallback((text: string) => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous content
    container.innerHTML = '';
    lettersRef.current = [];

    const chars = text.split('');
    for (const char of chars) {
      const span = document.createElement('span');
      span.innerText = char === '\n' ? '\n' : '_';
      span.style.display = char === '\n' ? 'block' : 'inline';
      if (char === '\n') {
        container.appendChild(document.createElement('br'));
      } else {
        container.appendChild(span);
      }
      lettersRef.current.push({ el: span, char, cycleComplete: false });
    }

    if (!isAnimatingRef.current) {
      isAnimatingRef.current = true;
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { containerRef, resolve };
}

export function AIInvestigation() {
  const [investigations, setInvestigations] = useState<InvestigationPayload[]>([]);
  const [selectedInvestigation, setSelectedInvestigation] = useState<InvestigationPayload | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { containerRef, resolve } = useCyberTypewriter();

  const handleInvestigationSelect = (inv: InvestigationPayload) => {
    setSelectedInvestigation(inv);
    setIsTyping(true);
    setTimeout(() => {
      const report = inv.ai_report || generateFallbackReport(inv);
      resolve(report);
      setTimeout(() => setIsTyping(false), 3000);
    }, 100);
  };

  const handleRegenerate = () => {
    if (!selectedInvestigation) return;
    setIsTyping(true);
    const report = selectedInvestigation.ai_report || generateFallbackReport(selectedInvestigation);
    resolve(report);
    setTimeout(() => setIsTyping(false), 3000);
  };

  useEffect(() => {
    async function loadInvestigations() {
      setLoading(true);
      setError(null);
      try {
        const results = await getInvestigations();
        setInvestigations(results);
        if (results.length > 0) {
          handleInvestigationSelect(results[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load investigations.');
      } finally {
        setLoading(false);
      }
    }

    loadInvestigations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function generateFallbackReport(inv: InvestigationPayload): string {
    return `ANOMALY CONFIRMED: ${inv.summary.toUpperCase()}` +
      `\n\nRisk Analysis:\n${inv.risk_explanation}\n\n` +
      `Root Cause:\n${inv.root_cause}\n\n` +
      `Recommended Actions:\n${inv.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
  }

  return (
    <section className="rounded-xl border border-[rgba(245,245,240,0.06)] bg-[#0A0A0A] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(245,245,240,0.06)]">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#BF5AF2]" />
          <h2 className="text-sm font-semibold text-[#F5F5F0]">AI Investigation Terminal</h2>
          {isTyping && (
            <span className="flex items-center gap-1.5 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#BF5AF2] animate-pulse" />
              <span className="text-[10px] text-[#BF5AF2] uppercase tracking-wider">Analyzing</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111111] border border-[rgba(245,245,240,0.08)] text-[11px] text-[#8A8A93] hover:text-[#F5F5F0] hover:border-[rgba(245,245,240,0.15)] transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            Regenerate
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Investigation List */}
        <div className="w-64 border-r border-[rgba(245,245,240,0.06)] p-3 space-y-1.5 max-h-[400px] overflow-y-auto scrollbar-thin">
          {investigations.map(inv => (
            <button
              key={inv.id}
              onClick={() => handleInvestigationSelect(inv)}
              className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                selectedInvestigation?.id === inv.id
                  ? 'bg-[#111111] border border-[#BF5AF2]/30'
                  : 'bg-transparent border border-transparent hover:bg-[#0f0f0f] hover:border-[rgba(245,245,240,0.06)]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#F5F5F0]">{inv.username}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                    inv.status === 'completed'
                      ? 'bg-[rgba(48,209,88,0.15)] text-[#30D158]'
                      : inv.status === 'in_progress'
                      ? 'bg-[rgba(10,132,255,0.15)] text-[#0A84FF]'
                      : 'bg-[rgba(255,204,0,0.15)] text-[#FFCC00]'
                  }`}
                >
                  {inv.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-[10px] text-[#8A8A93] line-clamp-2">{inv.summary}</p>
            </button>
          ))}
        </div>

        {/* Report Display */}
        <div className="flex-1 p-5">
          <div
            ref={containerRef}
            className="font-mono text-xs text-[#8A8A93] leading-relaxed whitespace-pre-wrap min-h-[300px] max-h-[360px] overflow-y-auto scrollbar-thin"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 px-5 py-3 border-t border-[rgba(245,245,240,0.06)] bg-[#080808]">
        <ActionButton icon={<FileText className="w-3.5 h-3.5" />} label="Generate Report" variant="blue" />
        <ActionButton icon={<UserX className="w-3.5 h-3.5" />} label="Block Account" variant="red" />
        <ActionButton icon={<Lock className="w-3.5 h-3.5" />} label="Force MFA Reset" variant="orange" />
        <ActionButton icon={<Shield className="w-3.5 h-3.5" />} label="Restrict Access" variant="purple" />
      </div>
    </section>
  );
}

function ActionButton({ icon, label, variant }: { icon: React.ReactNode; label: string; variant: 'blue' | 'red' | 'orange' | 'purple' }) {
  const styles: Record<string, string> = {
    blue: 'bg-[#0A84FF]/15 text-[#0A84FF] border border-[#0A84FF]/30 hover:bg-[#0A84FF]/25 hover:border-[#0A84FF]/50',
    red: 'bg-[#FF3B30]/15 text-[#FF3B30] border border-[#FF3B30]/30 hover:bg-[#FF3B30]/25 hover:border-[#FF3B30]/50',
    orange: 'bg-[#FF9500]/15 text-[#FF9500] border border-[#FF9500]/30 hover:bg-[#FF9500]/25 hover:border-[#FF9500]/50',
    purple: 'bg-[#BF5AF2]/15 text-[#BF5AF2] border border-[#BF5AF2]/30 hover:bg-[#BF5AF2]/25 hover:border-[#BF5AF2]/50',
  };

  return (
    <button
      type="button"
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${styles[variant]}`}
    >
      {icon}
      {label}
    </button>
  );
}
