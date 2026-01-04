"use client";
import React from "react";

interface Node {
  id: string;
  type: string;
  data: { label: string };
}

interface InsightsPanelProps {
  displayedText: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  nodeCount: number;
  edgeCount: number;
  nodes: Node[];
}

export default function InsightsPanel({
  displayedText,
  activeTab,
  setActiveTab,
  nodeCount,
  edgeCount,
  nodes,
}: InsightsPanelProps) {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "components", label: "Components" },
    { id: "best-practices", label: "Best Practices" },
  ];

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Architecture Summary</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>Total Components: {nodeCount}</p>
                <p>Total Connections: {edgeCount}</p>
              </div>
            </div>
            
            {displayedText.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Insights</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  {displayedText.map((text, idx) => (
                    <p key={idx} className="animate-fade-in">
                      {text}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "components" && (
          <div className="space-y-3">
            <h3 className="font-semibold mb-2">System Components</h3>
            {nodes.length > 0 ? (
              nodes.map((node) => (
                <div key={node.id} className="border rounded-lg p-3">
                  <div className="text-xs text-gray-500 uppercase mb-1">
                    {node.type}
                  </div>
                  <div className="font-medium">{node.data.label}</div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">No components yet</p>
            )}
          </div>
        )}

        {activeTab === "best-practices" && (
          <div className="space-y-3">
            <h3 className="font-semibold mb-2">Recommended Best Practices</h3>
            <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
              <li>Implement proper error handling and logging</li>
              <li>Use caching layers for improved performance</li>
              <li>Apply security best practices (encryption, auth)</li>
              <li>Design for scalability and fault tolerance</li>
              <li>Monitor system health and metrics</li>
              <li>Implement CI/CD pipelines</li>
              <li>Document APIs and system architecture</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
