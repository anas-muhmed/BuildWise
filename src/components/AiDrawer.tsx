// components/AiDrawer.tsx
"use client";
import React, { useState, useImperativeHandle, forwardRef, useEffect } from "react";

type Suggestion = {
  id: string;
  title: string;
  detail?: string;
  action?: { type: string; component?: string; meta?: any };
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
    healthScore: number;
    breakdown: { security: number; performance: number; cost: number };
    suggestions: Suggestion[];
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
      const res = await fetch("/api/mock-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canvas }),
      });
      const json = await res.json();
      setData(json);
      
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
    if (typingStage === 'suggestions' && data?.suggestions) {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < data.suggestions.length) {
          setVisibleSuggestions(currentIndex + 1);
          currentIndex++;
        } else {
          clearInterval(interval);
        }
      }, 800); // Show each suggestion with 800ms delay
      
      return () => clearInterval(interval);
    }
  }, [typingStage, data]);

  const handleAdd = (suggestion: Suggestion) => {
    if (suggestion.action) onAddSuggestion(suggestion.action);
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
          {/* Invisible backdrop for closing */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={onClose}
          />
          
          {/* Panel */}
          <div className={`fixed right-0 top-0 h-full w-[420px] bg-white shadow-xl transform transition-transform duration-500 ease-in-out z-50 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}>
            <div className="p-6 h-full overflow-y-auto">
              <div className="flex items-start justify-between mb-6">
                <h3 className="text-xl font-semibold">🤖 AI Analysis</h3>
                <button
                  onClick={() => {
                    onClose();
                    setData(null);
                  }}
                  className="px-3 py-1 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ✕ Close
                </button>
              </div>

              {loading ? (
                <div className="mt-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <TypingText text="Analyzing your canvas architecture and components..." />
                </div>
              ) : !data ? (
                <div className="mt-6">
                  <p className="text-sm text-gray-600">
                    Analyzing canvas components and architecture...
                  </p>
                </div>
              ) : (
                <>
                  {/* Health ring + breakdown */}
                  <div className="mt-6 flex gap-4 items-center">
                    <div className="w-28 h-28 flex items-center justify-center">
                      <HealthRing value={data.healthScore} size={112} />
                    </div>

                    <div className="flex-1">
                      <MetricBar label="Security" value={data.breakdown.security} />
                      <MetricBar label="Performance" value={data.breakdown.performance} />
                      <MetricBar label="Cost" value={data.breakdown.cost} />
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className="mt-6 space-y-3">
                    {data.suggestions.slice(0, visibleSuggestions).map((s, index) => (
                      <div
                        key={s.id}
                        className={`border rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-500 ${
                          index === visibleSuggestions - 1 ? 'animate-fadeIn' : ''
                        }`}
                        style={{
                          animation: index === visibleSuggestions - 1 ? 'slideInUp 0.6s ease-out' : 'none'
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{s.title}</p>
                            {s.detail && (
                              <p className="text-sm text-gray-600 mt-1">
                                {s.detail}
                              </p>
                            )}
                          </div>
                          <div className="ml-3">
                            <button
                              onClick={() => handleAdd(s)}
                              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            >
                              + Add to Canvas
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => analyze()}
                      className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      🔄 Re-run
                    </button>
                    <button
                      onClick={() => {
                        setData(null);
                        onClose();
                      }}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </>
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
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value));
  const offset = circumference - (pct / 100) * circumference;

  return (
    <svg width={size} height={size} className="block">
      <defs>
        <linearGradient id="grad" x1="0%" x2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>

      <g transform={`translate(${size / 2}, ${size / 2})`}>
        <circle
          r={radius}
          fill="none"
          stroke="#e6e6e6"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <circle
          r={radius}
          fill="none"
          stroke="url(#grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform="rotate(-90)"
        />
        <text
          x="0"
          y="4"
          textAnchor="middle"
          fontSize="18"
          fontWeight={700}
          fill="#111827"
        >
          {Math.round(pct)}
        </text>
        <text
          x="0"
          y="22"
          textAnchor="middle"
          fontSize="10"
          fill="#6b7280"
        >
          Score
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
    }, 30); // Adjust speed here
    
    return () => clearInterval(timer);
  }, [text]);
  
  return (
    <p className="text-sm text-gray-600">
      {displayedText}
      <span className="animate-pulse">|</span>
    </p>
  );
}

/* --- Metric Bar Component --- */
function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded">
        <div
          className="h-2 rounded bg-gradient-to-r from-violet-600 to-sky-400"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

AiDrawer.displayName = 'AiDrawer';
export default AiDrawer;