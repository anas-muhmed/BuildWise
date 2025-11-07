// components/generative-ai/InsightsPanel.tsx
"use client";
import React from "react";

// 🎯 LEARNING: Type Union
// activeTab can ONLY be one of these 3 values - TypeScript prevents typos
type TabType = "overview" | "best" | "cost";

interface InsightsPanelProps {
  displayedText: string[];
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  nodeCount: number;  // 🎯 NEW: We'll use this for dynamic cost calculation
  edgeCount: number;  // 🎯 NEW: We'll use this for dynamic cost calculation
}

export default function InsightsPanel({
  displayedText,
  activeTab,
  setActiveTab,
  nodeCount,
  edgeCount,
}: InsightsPanelProps) {
  
  // 🎯 LEARNING: Calculated Values
  // Instead of hard-coded costs, we calculate based on actual architecture
  const calculateCost = () => {
    const baseCost = 0.01;
    const nodeCost = nodeCount * 0.03;
    const edgeCost = edgeCount * 0.005;
    return (baseCost + nodeCost + edgeCost).toFixed(3);
  };

  return (
    <div className="sticky top-6 bg-gradient-to-br from-white to-blue-50/30 border rounded-xl shadow-lg p-5 h-[520px] flex flex-col">
      {/* 🎯 TAB NAVIGATION with AI branding */}
      <div className="flex gap-3 mb-4 border-b pb-2">
        {(["overview", "best", "cost"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/50 scale-105"
                : "text-gray-600 hover:bg-gray-50 hover:scale-102"
            }`}
          >
            {tab === "overview" && "🧠 Overview"}
            {tab === "best" && "⚙️ Best Practices"}
            {tab === "cost" && "💰 Cost View"}
          </button>
        ))}
      </div>

      {/* 🎯 TAB CONTENT - Scrollable area */}
      <div className="overflow-auto flex-1">
        
        {/* OVERVIEW TAB: AI-generated explanations */}
        {activeTab === "overview" && (
          <ul className="space-y-4">
            {displayedText.length === 0 ? (
              <li className="text-sm text-gray-500 italic">
                Generate an architecture to see AI insights...
              </li>
            ) : (
              displayedText.map((text, idx) => (
                <li key={idx} className="flex gap-3 items-start animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed">{text}</div>
                </li>
              ))
            )}
          </ul>
        )}

        {/* BEST PRACTICES TAB: Static recommendations */}
        {activeTab === "best" && (
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-600">✅</span>
              <span>Use rate limiting in API Gateway to prevent abuse and DDoS attacks.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✅</span>
              <span>Enable auto-scaling groups for backend servers to handle traffic spikes.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✅</span>
              <span>Use message queues (Kafka/SQS) for async operations like emails and notifications.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✅</span>
              <span>Monitor metrics via Prometheus + Grafana dashboards for real-time insights.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✅</span>
              <span>Implement circuit breakers to prevent cascading failures across microservices.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✅</span>
              <span>Use CDN for static assets to reduce latency and bandwidth costs.</span>
            </li>
          </ul>
        )}

        {/* COST VIEW TAB: Dynamic calculation based on architecture */}
        {activeTab === "cost" && (
          <div className="text-sm text-gray-700">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="font-semibold text-blue-900">💰 Estimated Monthly Cost</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">${(parseFloat(calculateCost()) * 730).toFixed(2)}</p>
              <p className="text-xs text-blue-600 mt-1">Based on AWS us-east-1 pricing</p>
            </div>

            <table className="w-full mt-3 border text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 border text-left">Component</th>
                  <th className="p-2 border text-right">Cost/hr</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border">Base Infrastructure</td>
                  <td className="p-2 border text-right">$0.01</td>
                </tr>
                <tr>
                  <td className="p-2 border">Services ({nodeCount} nodes)</td>
                  <td className="p-2 border text-right">${(nodeCount * 0.03).toFixed(3)}</td>
                </tr>
                <tr>
                  <td className="p-2 border">Network ({edgeCount} connections)</td>
                  <td className="p-2 border text-right">${(edgeCount * 0.005).toFixed(3)}</td>
                </tr>
                <tr className="font-semibold bg-gray-50">
                  <td className="p-2 border">Total per hour</td>
                  <td className="p-2 border text-right">${calculateCost()}</td>
                </tr>
              </tbody>
            </table>

            <p className="text-xs text-gray-500 mt-3">
              * Estimates include compute, storage, and data transfer. Actual costs may vary based on usage patterns.
            </p>
          </div>
        )}
      </div>

      {/* 🎯 CSS ANIMATION */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.6s ease forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
