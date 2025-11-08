// components/generative-ai/InsightsPanel.tsx
"use client";
import React from "react";
import { Node } from "./ArchitectureCanvas";

// 🎯 LEARNING: Type Union
// activeTab can ONLY be one of these 4 values - TypeScript prevents typos
type TabType = "overview" | "best" | "cost" | "health";

interface InsightsPanelProps {
  displayedText: string[];
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  nodeCount: number;
  edgeCount: number;
  nodes: Node[];  // 🎯 TIER 1: Need actual nodes for type-specific pricing
}

export default function InsightsPanel({
  displayedText,
  activeTab,
  setActiveTab,
  nodeCount,
  edgeCount,
  nodes,
}: InsightsPanelProps) {
  
  // 🎯 TIER 1: Enhanced Cost Calculation with Node-Type-Specific Rates
  const calculateEnhancedCost = () => {
    let totalCost = 0.01; // Base infrastructure
    
    // Node-specific pricing based on component type
    nodes.forEach((node) => {
      const label = node.label.toUpperCase();
      if (label.includes("DATABASE")) totalCost += 0.05; // $0.05/hr = ~$36/mo
      else if (label.includes("CACHE") || label.includes("REDIS")) totalCost += 0.03; // $22/mo
      else if (label.includes("LOAD BALANCER") || label.includes("GATEWAY")) totalCost += 0.025;
      else if (label.includes("SERVICE")) totalCost += 0.02; // Microservices
      else totalCost += 0.015; // Generic components
    });
    
    // Network costs (connections)
    totalCost += edgeCount * 0.005;
    
    return totalCost;
  };

  // 🎯 TIER 1: AI Health Score Calculation
  const calculateHealthScores = () => {
    // Speed Score: Based on caching and load balancing
    const hasCache = nodes.some(n => n.label.includes("CACHE"));
    const hasLoadBalancer = nodes.some(n => n.label.includes("LOAD BALANCER"));
    const speedScore = 60 + (hasCache ? 20 : 0) + (hasLoadBalancer ? 20 : 0);

    // Security Score: Based on API Gateway and proper service boundaries
    const hasGateway = nodes.some(n => n.label.includes("GATEWAY"));
    const hasMicroservices = nodes.filter(n => n.label.includes("SERVICE")).length > 1;
    const securityScore = 50 + (hasGateway ? 30 : 0) + (hasMicroservices ? 20 : 0);

    // Cost Efficiency: Inverse of monthly cost (lower cost = higher score)
    const monthlyCost = calculateEnhancedCost() * 730;
    const costScore = Math.max(0, Math.min(100, 100 - (monthlyCost * 2)));

    return { speedScore, securityScore, costScore };
  };
  
  const calculateCost = () => {
    return calculateEnhancedCost().toFixed(3);
  };

  const healthScores = calculateHealthScores();

  return (
    <div className="sticky top-6 bg-gradient-to-br from-white to-blue-50/30 border rounded-xl shadow-lg p-5 h-[520px] flex flex-col">
      {/* 🎯 TAB NAVIGATION with AI branding - Color-coded tabs */}
      <div className="flex gap-2 mb-4 border-b pb-2">
        {(["overview", "best", "cost", "health"] as const).map((tab) => {
          // Color-specific gradients for each tab
          const tabColors = {
            overview: activeTab === tab 
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/50" 
              : "text-blue-600 hover:bg-blue-50",
            best: activeTab === tab 
              ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/50" 
              : "text-gray-600 hover:bg-gray-50",
            cost: activeTab === tab 
              ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/50" 
              : "text-amber-600 hover:bg-amber-50",
            health: activeTab === tab 
              ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/50" 
              : "text-green-600 hover:bg-green-50",
          };
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${tabColors[tab]} ${
                activeTab === tab ? "scale-105" : "hover:scale-102"
              }`}
            >
              {tab === "overview" && "🧠 Overview"}
              {tab === "best" && "⚙️ Best Practices"}
              {tab === "cost" && "💰 Cost"}
              {tab === "health" && "📊 Health"}
            </button>
          );
        })}
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
              displayedText.map((text, idx) => {
                // Assign contextual icons based on content keywords
                const getIcon = (text: string) => {
                  if (text.includes("database") || text.includes("storage")) return "💾";
                  if (text.includes("cache") || text.includes("redis")) return "⚡";
                  if (text.includes("gateway") || text.includes("API")) return "🚪";
                  if (text.includes("service") || text.includes("microservice")) return "⚙️";
                  if (text.includes("load balancer") || text.includes("traffic")) return "⚖️";
                  if (text.includes("security") || text.includes("auth")) return "🔒";
                  if (text.includes("user") || text.includes("client")) return "👤";
                  if (text.includes("mobile") || text.includes("frontend")) return "📱";
                  return "📦"; // Default for architecture components
                };
                
                return (
                  <li key={idx} className="flex gap-3 items-start animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-lg flex-shrink-0">
                      {getIcon(text.toLowerCase())}
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed flex-1">{text}</div>
                  </li>
                );
              })
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

        {/* COST VIEW TAB: Enhanced dynamic calculation with node-type rates */}
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
                  <th className="p-2 border text-left">Component Type</th>
                  <th className="p-2 border text-center">Count</th>
                  <th className="p-2 border text-right">Cost/hr</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-blue-50 transition-colors cursor-default">
                  <td className="p-2 border">Base Infrastructure</td>
                  <td className="p-2 border text-center">-</td>
                  <td className="p-2 border text-right">$0.01</td>
                </tr>
                {nodes.filter(n => n.label.includes("DATABASE")).length > 0 && (
                  <tr className="hover:bg-blue-50 transition-colors cursor-default">
                    <td className="p-2 border">💾 Database</td>
                    <td className="p-2 border text-center">{nodes.filter(n => n.label.includes("DATABASE")).length}</td>
                    <td className="p-2 border text-right">${(nodes.filter(n => n.label.includes("DATABASE")).length * 0.05).toFixed(3)}</td>
                  </tr>
                )}
                {nodes.filter(n => n.label.includes("CACHE") || n.label.includes("REDIS")).length > 0 && (
                  <tr className="hover:bg-blue-50 transition-colors cursor-default">
                    <td className="p-2 border">⚡ Cache</td>
                    <td className="p-2 border text-center">{nodes.filter(n => n.label.includes("CACHE") || n.label.includes("REDIS")).length}</td>
                    <td className="p-2 border text-right">${(nodes.filter(n => n.label.includes("CACHE") || n.label.includes("REDIS")).length * 0.03).toFixed(3)}</td>
                  </tr>
                )}
                {nodes.filter(n => n.label.includes("SERVICE")).length > 0 && (
                  <tr className="hover:bg-blue-50 transition-colors cursor-default">
                    <td className="p-2 border">⚙️ Microservices</td>
                    <td className="p-2 border text-center">{nodes.filter(n => n.label.includes("SERVICE")).length}</td>
                    <td className="p-2 border text-right">${(nodes.filter(n => n.label.includes("SERVICE")).length * 0.02).toFixed(3)}</td>
                  </tr>
                )}
                {nodes.filter(n => n.label.includes("LOAD BALANCER") || n.label.includes("GATEWAY")).length > 0 && (
                  <tr className="hover:bg-blue-50 transition-colors cursor-default">
                    <td className="p-2 border">🌐 Load Balancer/Gateway</td>
                    <td className="p-2 border text-center">{nodes.filter(n => n.label.includes("LOAD BALANCER") || n.label.includes("GATEWAY")).length}</td>
                    <td className="p-2 border text-right">${(nodes.filter(n => n.label.includes("LOAD BALANCER") || n.label.includes("GATEWAY")).length * 0.025).toFixed(3)}</td>
                  </tr>
                )}
                <tr className="hover:bg-blue-50 transition-colors cursor-default">
                  <td className="p-2 border">🔗 Network Connections</td>
                  <td className="p-2 border text-center">{edgeCount}</td>
                  <td className="p-2 border text-right">${(edgeCount * 0.005).toFixed(3)}</td>
                </tr>
                <tr className="font-semibold bg-gray-50">
                  <td className="p-2 border">Total per hour</td>
                  <td className="p-2 border text-center">-</td>
                  <td className="p-2 border text-right">${calculateCost()}</td>
                </tr>
              </tbody>
            </table>

            <p className="text-xs text-gray-500 mt-3">
              * Estimates include compute, storage, and data transfer. Actual costs may vary based on usage patterns.
            </p>
          </div>
        )}

        {/* HEALTH SCORE TAB: AI-powered architecture analysis */}
        {activeTab === "health" && (
          <div className="text-sm space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                📊 Architecture Health Score
              </h3>
              <p className="text-xs text-gray-600 mb-4">
                AI-analyzed metrics evaluating your system&apos;s performance, security, and cost efficiency.
              </p>

              {/* Speed Score */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700">⚡ Speed & Performance</span>
                  <span className="text-xs font-bold text-blue-600">{healthScores.speedScore}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${healthScores.speedScore}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {healthScores.speedScore >= 90 ? "Outstanding - Optimized for high throughput" :
                   healthScores.speedScore >= 70 ? "Good - Consider adding caching layer" :
                   "Needs improvement - Add load balancer and cache"}
                </p>
              </div>

              {/* Security Score */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700">🔒 Security & Isolation</span>
                  <span className="text-xs font-bold text-indigo-600">{healthScores.securityScore}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${healthScores.securityScore}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {healthScores.securityScore >= 90 ? "Very High - Well-isolated microservices" :
                   healthScores.securityScore >= 70 ? "Good - API Gateway present" :
                   "Needs improvement - Add API Gateway and service boundaries"}
                </p>
              </div>

              {/* Cost Efficiency Score */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700">💰 Cost Efficiency</span>
                  <span className="text-xs font-bold text-purple-600">{healthScores.costScore.toFixed(0)}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-purple-400 to-purple-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${healthScores.costScore}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {healthScores.costScore >= 80 ? "Optimal - Cost-optimized architecture" :
                   healthScores.costScore >= 60 ? "Good - Reasonable resource allocation" :
                   "High cost - Consider serverless or managed services"}
                </p>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="font-semibold text-yellow-900 text-xs mb-2">💡 AI Recommendations</h4>
              <ul className="space-y-1.5 text-xs text-yellow-800">
                {healthScores.speedScore < 80 && (
                  <li>• Add Redis cache to improve response times by 60-80%</li>
                )}
                {healthScores.securityScore < 80 && (
                  <li>• Implement API Gateway for centralized authentication</li>
                )}
                {healthScores.costScore < 70 && (
                  <li>• Consider auto-scaling policies to optimize resource usage</li>
                )}
                {healthScores.speedScore >= 80 && healthScores.securityScore >= 80 && healthScores.costScore >= 70 ? (
                  <li>✓ Architecture is well-optimized across all dimensions!</li>
                ) : null}
              </ul>
            </div>
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
