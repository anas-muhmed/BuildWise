// components/AiDrawer.tsx
"use client";
import React, { useState, useImperativeHandle, forwardRef, useEffect } from "react";

type Finding = {
  type: "issue" | "suggestion" | "warning";
  title: string;
  description: string;
  impact: "low" | "medium" | "high";
  recommendation: string;
};

const AiDrawer = forwardRef<
  { analyze: () => void },
  {
    isOpen: boolean;
    onClose: () => void;
    getCanvasJson: () => any;
    onAddSuggestion: (action: any) => void;
  }
>(({ isOpen, onClose, getCanvasJson, onAddSuggestion }, ref) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    score: { overall: number; security: number; performance: number; cost: number };
    findings: Finding[];
    assumptions: string[];
  } | null>(null);
  
  // Typing animation state
  const [typingStage, setTypingStage] = useState<'none' | 'analyzing' | 'suggestions'>('none');
  const [visibleSuggestions, setVisibleSuggestions] = useState<number>(0);

  const analyze = async () => {
    setLoading(true);
    setTypingStage('analyzing');
    setVisibleSuggestions(0);
    
    try {
      const canvas = getCanvasJson ? getCanvasJson() : { nodes: [] };
      const token = localStorage.getItem("token");
      
      const res = await fetch("/api/ai/reason", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          mode: "manual",
          intent: "analysis",
          canvas,
        }),
      });
      const json = await res.json();
      setData(json.data ?? null);
      
      // Start typing animation
      setTimeout(() => {
        setTypingStage('suggestions');
      }, 500);
      
    } catch (e) {
      console.error("AI analyze error", e);
    } finally {
      setLoading(false);
    }
  };

  // Typing effect for suggestions
  useEffect(() => {
    if (typingStage === 'suggestions' && data?.findings) {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < data.findings.length) {
          setVisibleSuggestions(currentIndex + 1);
          currentIndex++;
        } else {
          clearInterval(interval);
        }
      }, 800);
      
      return () => clearInterval(interval);
    }
  }, [typingStage, data]);

  const handleAdd = (action: any) => {
    if (action) onAddSuggestion(action);
  };

  // Expose analyze function to parent
  useImperativeHandle(ref, () => ({
    analyze
  }));

  return (
    <>
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
      {/* Slide-over Panel */}
      {isOpen && (
        <>
          {/* Dark backdrop for closing */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" 
            onClick={onClose}
          />
          
          {/* Panel - Dark theme matching canvas */}
          <div className={`fixed right-0 top-0 h-full w-[480px] bg-zinc-900 border-l border-zinc-800 shadow-2xl transform transition-transform duration-300 ease-out z-50 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">🤖</span>
                    AI Analysis
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1">Architecture insights & suggestions</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    setData(null);
                  }}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Close panel"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-zinc-800 border-t-blue-500"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl">🧠</span>
                      </div>
                    </div>
                    <div className="mt-6 text-center">
                      <TypingText text="Analyzing your canvas architecture and components..." />
                    </div>
                  </div>
                ) : !data ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-zinc-500">
                      <div className="text-5xl mb-4">📊</div>
                      <p className="text-sm">Click "Analyze" to start</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Health Score Card */}
                    <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 p-6">
                      <div className="flex items-center gap-6">
                        <div className="flex-shrink-0">
                          <HealthRing value={data.score.overall} size={120} />
                        </div>
                        <div className="flex-1 space-y-3">
                          <MetricBar label="Security" value={data.score.security} />
                          <MetricBar label="Performance" value={data.score.performance} />
                          <MetricBar label="Cost" value={data.score.cost} />
                        </div>
                      </div>
                    </div>

                    {/* Suggestions Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                        Findings ({data.findings.length})
                      </h4>
                      <div className="space-y-3">
                        {data.findings.slice(0, visibleSuggestions).map((f, index) => (
                          <div
                            key={`${f.type}-${f.title}-${index}`}
                            className={`bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 hover:border-zinc-600 transition-all duration-500 ${
                              index === visibleSuggestions - 1 ? 'animate-fadeIn' : ''
                            }`}
                            style={{
                              animation: index === visibleSuggestions - 1 ? 'slideInUp 0.6s ease-out' : 'none'
                            }}
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                    f.type === "issue" ? "border-red-500/40 text-red-400" :
                                    f.type === "warning" ? "border-amber-500/40 text-amber-400" :
                                    "border-blue-500/40 text-blue-400"
                                  }`}>
                                    {f.type.toUpperCase()}
                                  </span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                    f.impact === "high" ? "border-red-500/40 text-red-400" :
                                    f.impact === "medium" ? "border-amber-500/40 text-amber-400" :
                                    "border-zinc-600 text-zinc-400"
                                  }`}>
                                    {f.impact.toUpperCase()} IMPACT
                                  </span>
                                </div>
                                <p className="font-medium text-white text-sm mb-1">{f.title}</p>
                                <p className="text-sm text-zinc-400 leading-relaxed">
                                  {f.description}
                                </p>
                                <p className="text-xs text-zinc-500 mt-2">
                                  Recommendation: {f.recommendation}
                                </p>
                              </div>
                              {f.type === "suggestion" && (
                                <button
                                  onClick={() => handleAdd({ type: "apply", title: f.title, recommendation: f.recommendation })}
                                  className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 hover:border-blue-500/50 transition-colors"
                                >
                                  Apply
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              {data && (
                <div className="border-t border-zinc-800 p-4 bg-zinc-900/50">
                  <div className="flex gap-2">
                    <button
                      onClick={() => analyze()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Re-analyze
                    </button>
                    <button
                      onClick={() => {
                        setData(null);
                        onClose();
                      }}
                      className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors font-medium text-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
});

/* --- Health Ring Component --- */
function HealthRing({ value, size = 100 }: { value: number; size?: number }) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value));
  const offset = circumference - (pct / 100) * circumference;

  // Color based on score
  const getColor = () => {
    if (pct >= 80) return { from: '#10b981', to: '#06b6d4' }; // green to cyan
    if (pct >= 60) return { from: '#3b82f6', to: '#8b5cf6' }; // blue to purple
    if (pct >= 40) return { from: '#f59e0b', to: '#f97316' }; // orange
    return { from: '#ef4444', to: '#dc2626' }; // red
  };

  const colors = getColor();

  return (
    <svg width={size} height={size} className="block">
      <defs>
        <linearGradient id={`grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.from} />
          <stop offset="100%" stopColor={colors.to} />
        </linearGradient>
      </defs>

      <g transform={`translate(${size / 2}, ${size / 2})`}>
        {/* Background circle */}
        <circle
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Progress circle */}
        <circle
          r={radius}
          fill="none"
          stroke={`url(#grad-${size})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform="rotate(-90)"
        />
        {/* Score text */}
        <text
          x="0"
          y="8"
          textAnchor="middle"
          fontSize="24"
          fontWeight={700}
          fill="#ffffff"
        >
          {Math.round(pct)}
        </text>
        <text
          x="0"
          y="24"
          textAnchor="middle"
          fontSize="11"
          fill="#71717a"
          fontWeight={500}
        >
          SCORE
        </text>
      </g>
    </svg>
  );
}

/* --- Typing Text Component --- */
function TypingText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    let index = 0;
    setDisplayedText("");
    
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 30);
    
    return () => clearInterval(timer);
  }, [text]);
  
  return (
    <p className="text-sm text-zinc-400">
      {displayedText}
      <span className="animate-pulse text-blue-400">▊</span>
    </p>
  );
}

/* --- Metric Bar Component --- */
function MetricBar({ label, value }: { label: string; value: number }) {
  // Color based on value
  const getColor = () => {
    if (value >= 80) return 'from-green-500 to-emerald-400';
    if (value >= 60) return 'from-blue-500 to-cyan-400';
    if (value >= 40) return 'from-orange-500 to-amber-400';
    return 'from-red-500 to-rose-400';
  };

  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-zinc-400 font-medium">{label}</span>
        <span className="font-semibold text-white">{value}%</span>
      </div>
      <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getColor()} transition-all duration-500`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

AiDrawer.displayName = 'AiDrawer';
export default AiDrawer;