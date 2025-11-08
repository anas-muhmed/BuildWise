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
  nodeCount?: number; // Optional since we calculate from nodes.length
  edgeCount: number;
  nodes: Node[];  // 🎯 TIER 1: Need actual nodes for type-specific pricing
}

export default function InsightsPanel({
  displayedText,
  activeTab,
  setActiveTab,
  edgeCount,
  nodes,
}: InsightsPanelProps) {
  
  // 🎯 PHASE 4: Monthly/Hourly toggle state
  const [costView, setCostView] = React.useState<"hourly" | "monthly">("monthly");
  
  // 🎯 TIER 1 + PHASE 2: Enhanced Cost Calculation with More Realistic Rates
  const calculateEnhancedCost = () => {
    let totalCost = 0.005; // Reduced base infrastructure
    
    // Node-specific pricing based on component type (adjusted to realistic AWS pricing)
    nodes.forEach((node) => {
      const label = node.label.toUpperCase();
      if (label.includes("DATABASE")) totalCost += 0.035; // $0.035/hr = ~$25/mo (realistic RDS)
      else if (label.includes("CACHE") || label.includes("REDIS")) totalCost += 0.02; // ~$15/mo (ElastiCache)
      else if (label.includes("LOAD BALANCER") || label.includes("GATEWAY")) totalCost += 0.018; // ~$13/mo (ALB)
      else if (label.includes("SERVICE")) totalCost += 0.012; // ~$9/mo (ECS/Lambda)
      else totalCost += 0.008; // Generic compute (EC2 t3.micro)
    });
    
    // Network costs (connections) - reduced to realistic data transfer rates
    totalCost += edgeCount * 0.002;
    
    return totalCost;
  };

  // 🎯 PHASE 3: Dynamic AI Health Score Calculation (based on node count & diversity)
  const calculateHealthScores = () => {
    // Speed Score: More comprehensive calculation
    const hasCache = nodes.some(n => n.label.includes("CACHE"));
    const hasLoadBalancer = nodes.some(n => n.label.includes("LOAD BALANCER"));
    const hasCDN = nodes.some(n => n.label.includes("CDN"));
    const connectionDensity = nodes.length > 0 ? edgeCount / nodes.length : 0;
    
    let speedScore = 50; // Base score
    speedScore += hasCache ? 20 : 0;
    speedScore += hasLoadBalancer ? 15 : 0;
    speedScore += hasCDN ? 10 : 0;
    speedScore += connectionDensity < 2 ? 5 : 0; // Bonus for not being over-connected
    speedScore = Math.min(100, speedScore);

    // Security Score: Based on architecture patterns
    const hasGateway = nodes.some(n => n.label.includes("GATEWAY"));
    const serviceCount = nodes.filter(n => n.label.includes("SERVICE")).length;
    const hasMicroservices = serviceCount > 1;
    const hasAuth = nodes.some(n => n.label.includes("AUTH") || n.label.includes("USER"));
    
    let securityScore = 40; // Base score
    securityScore += hasGateway ? 25 : 0;
    securityScore += hasMicroservices ? 15 : 0;
    securityScore += hasAuth ? 10 : 0;
    securityScore += serviceCount >= 3 ? 10 : 0; // Well-separated concerns
    securityScore = Math.min(100, securityScore);

    // Cost Efficiency: Based on node count and monthly cost
    const monthlyCost = calculateEnhancedCost() * 730;
    const nodeEfficiency = nodes.length > 0 ? Math.max(0, 100 - (nodes.length * 8)) : 0;
    const costScore = Math.max(0, Math.min(100, nodeEfficiency - (monthlyCost * 1.5)));

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

      {/* 🎯 TAB CONTENT - Scrollable area with fade transition */}
      <div className="overflow-auto flex-1">
        
        {/* OVERVIEW TAB: AI-generated explanations */}
        {activeTab === "overview" && (
          <ul className="space-y-4 animate-fadeIn">
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
          <ul className="space-y-3 text-sm text-gray-700 animate-fadeIn">
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
          <div className="text-sm text-gray-700 animate-fadeIn">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-blue-900">💰 Estimated Cost</p>
                {/* PHASE 4: Toggle Switch */}
                <div className="flex items-center gap-2 bg-white rounded-full p-1 shadow-sm">
                  <button
                    onClick={() => setCostView("hourly")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      costView === "hourly"
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-600 hover:text-blue-600"
                    }`}
                  >
                    Hourly
                  </button>
                  <button
                    onClick={() => setCostView("monthly")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      costView === "monthly"
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-600 hover:text-blue-600"
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {costView === "hourly" 
                  ? `$${calculateCost()}/hr`
                  : `$${(parseFloat(calculateCost()) * 730).toFixed(2)}/mo`
                }
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Based on AWS us-east-1 pricing {costView === "monthly" && "(730 hrs/month)"}
              </p>
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

            {/* PHASE 4: Cost Breakdown Graph */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">📊 Cost Distribution</h3>
              {(() => {
                const dbCost = nodes.filter(n => n.label.includes("DATABASE")).length * 0.035;
                const cacheCost = nodes.filter(n => n.label.includes("CACHE") || n.label.includes("REDIS")).length * 0.02;
                const serviceCost = nodes.filter(n => n.label.includes("SERVICE")).length * 0.012;
                const lbCost = nodes.filter(n => n.label.includes("LOAD BALANCER") || n.label.includes("GATEWAY")).length * 0.025;
                const networkCost = edgeCount * 0.005;
                const totalCost = parseFloat(calculateCost());
                
                return (
                  <div className="space-y-2">
                    {dbCost > 0 && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-700">💾 Database</span>
                          <span className="font-medium text-gray-800">${(costView === "hourly" ? dbCost : dbCost * 730).toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(dbCost / totalCost) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {cacheCost > 0 && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-700">⚡ Cache</span>
                          <span className="font-medium text-gray-800">${(costView === "hourly" ? cacheCost : cacheCost * 730).toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(cacheCost / totalCost) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {serviceCost > 0 && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-700">⚙️ Services</span>
                          <span className="font-medium text-gray-800">${(costView === "hourly" ? serviceCost : serviceCost * 730).toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(serviceCost / totalCost) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {lbCost > 0 && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-700">🌐 Load Balancer</span>
                          <span className="font-medium text-gray-800">${(costView === "hourly" ? lbCost : lbCost * 730).toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(lbCost / totalCost) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {networkCost > 0 && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-700">🔗 Network</span>
                          <span className="font-medium text-gray-800">${(costView === "hourly" ? networkCost : networkCost * 730).toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gray-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(networkCost / totalCost) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* HEALTH SCORE TAB: AI-powered architecture analysis */}
        {activeTab === "health" && (
          <div className="text-sm space-y-4 animate-fadeIn">
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
                  <span className={`text-xs font-bold ${
                    healthScores.speedScore >= 80 ? 'text-green-600' : 
                    healthScores.speedScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>{healthScores.speedScore}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      healthScores.speedScore >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                      healthScores.speedScore >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      'bg-gradient-to-r from-red-400 to-red-600'
                    }`}
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
                  <span className={`text-xs font-bold ${
                    healthScores.securityScore >= 80 ? 'text-green-600' : 
                    healthScores.securityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>{healthScores.securityScore}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      healthScores.securityScore >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                      healthScores.securityScore >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      'bg-gradient-to-r from-red-400 to-red-600'
                    }`}
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
                  <span className={`text-xs font-bold ${
                    healthScores.costScore >= 80 ? 'text-green-600' : 
                    healthScores.costScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>{healthScores.costScore.toFixed(0)}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      healthScores.costScore >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                      healthScores.costScore >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      'bg-gradient-to-r from-red-400 to-red-600'
                    }`}
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

      {/* 🎯 CSS ANIMATIONS */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.6s ease forwards;
        }
        .animate-fadeIn {
          animation: fadeInTab 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInTab {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
