import { useState, useRef, useEffect } from 'react';
import { queryChat } from '@/lib/api';
import type { ChatMessage } from '@/types';
import { Brain, Send, User, Loader2 } from 'lucide-react';

const suggestedQuestions = [
  'Why was john.smith flagged?',
  'What are today\'s critical alerts?',
  'Show suspicious exports this week',
];

export function AIChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const response = await queryChat(userMessage.content, sessionId ?? undefined);
      setSessionId(response.session_id);

      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI assistant failed to respond.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggested = (q: string) => {
    setInput(q);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] rounded-xl border border-[rgba(245,245,240,0.06)] bg-[#0A0A0A] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[rgba(245,245,240,0.06)]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#BF5AF2] to-[#0A84FF] flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[#F5F5F0]">AI Investigation Assistant</h2>
          <p className="text-[10px] text-[#8A8A93]">Powered by Gemini LLM + RAG</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
          <span className="text-[10px] text-[#30D158]">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
        {error && (
          <div className="rounded-xl border border-[#FF3B30] bg-[#290000] p-3 text-sm text-[#FFCCCC]">
            {error}
          </div>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === 'assistant'
                  ? 'bg-gradient-to-br from-[#BF5AF2] to-[#0A84FF]'
                  : 'bg-[#111111] border border-[rgba(245,245,240,0.08)]'
              }`}
            >
              {msg.role === 'assistant' ? (
                <Brain className="w-3.5 h-3.5 text-white" />
              ) : (
                <User className="w-3.5 h-3.5 text-[#8A8A93]" />
              )}
            </div>
            <div
              className={`max-w-[70%] rounded-xl px-4 py-3 ${
                msg.role === 'assistant'
                  ? 'bg-[#111111] border border-[rgba(245,245,240,0.06)]'
                  : 'bg-[#0A84FF]/10 border border-[#0A84FF]/20'
              }`}
            >
              <p className="text-xs text-[#F5F5F0] whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              <span className="text-[9px] text-[#5A5A63] mt-2 block">
                {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#BF5AF2] to-[#0A84FF] flex items-center justify-center flex-shrink-0">
              <Brain className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-[#111111] border border-[rgba(245,245,240,0.06)] rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 text-[#BF5AF2] animate-spin" />
                <span className="text-xs text-[#8A8A93]">Analyzing threat data...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 2 && (
        <div className="px-5 py-2 flex flex-wrap gap-2">
          {suggestedQuestions.map(q => (
            <button
              key={q}
              onClick={() => handleSuggested(q)}
              className="text-[11px] px-3 py-1.5 rounded-full bg-[#111111] border border-[rgba(245,245,240,0.08)] text-[#8A8A93] hover:text-[#F5F5F0] hover:border-[#0A84FF]/30 transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-5 py-3 border-t border-[rgba(245,245,240,0.06)]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about threats, users, or anomalies..."
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#111111] border border-[rgba(245,245,240,0.08)] text-sm text-[#F5F5F0] placeholder:text-[#5A5A63] focus:outline-none focus:border-[#0A84FF] transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            aria-label="Send question"
            className="p-2.5 rounded-lg bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
