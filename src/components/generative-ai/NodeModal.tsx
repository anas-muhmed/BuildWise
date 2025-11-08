// components/generative-ai/NodeModal.tsx
"use client";
import React from "react";
import { Node, Edge } from "./ArchitectureCanvas";
import { FiX, FiCopy, FiCheck, FiArrowRight, FiArrowLeft } from "react-icons/fi";

interface NodeModalProps {
  node: Node;
  edges: Edge[];
  onClose: () => void;
}

export default function NodeModal({ node, edges, onClose }: NodeModalProps) {
  const [copied, setCopied] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(true);

  // 🎯 PHASE 3: Slide animation on mount
  React.useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [node.id]); // Re-animate when node changes

  // 🎯 LEARNING: Calculate connections
  // Find all edges where this node is source or target
  const incomingConnections = edges.filter(e => e.target === node.id).map(e => e.source);
  const outgoingConnections = edges.filter(e => e.source === node.id).map(e => e.target);

  // 🎯 LEARNING: Copy to clipboard handler
  const handleCopy = () => {
    navigator.clipboard.writeText(node.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 🎯 LEARNING: Get role description based on node type
  const getRoleDescription = (label: string) => {
    const roles: Record<string, string> = {
      "MOBILE APP": "User-facing client application for iOS and Android platforms",
      "FRONTEND": "User interface layer handling presentation and user interactions",
      "LOAD BALANCER": "Distributes incoming traffic across multiple backend servers for high availability",
      "API GATEWAY": "Single entry point for all client requests, handles routing and security",
      "BACKEND": "Server-side application processing business logic and data operations",
      "USER SERVICE": "Manages user authentication, profiles, and account operations",
      "RESTAURANT SERVICE": "Handles restaurant listings, menus, and availability",
      "ORDER SERVICE": "Processes order creation, tracking, and fulfillment",
      "PAYMENT SERVICE": "Securely handles payment processing and transaction management",
      "DATABASE": "Persistent data storage for application state and records",
      "REDIS CACHE": "In-memory data store for high-speed data access and session management",
    };
    return roles[label] || "Core component in the system architecture";
  };

  // 🎯 LEARNING: Get technical best practices
  const getBestPractices = (label: string) => {
    const practices: Record<string, string[]> = {
      "MOBILE APP": [
        "Implement offline-first architecture",
        "Use efficient caching strategies",
        "Optimize bundle size and lazy load features",
      ],
      "LOAD BALANCER": [
        "Use health checks for backend servers",
        "Implement sticky sessions for stateful apps",
        "Configure auto-scaling policies",
      ],
      "API GATEWAY": [
        "Implement rate limiting and throttling",
        "Use JWT tokens for authentication",
        "Enable request/response logging",
      ],
      "DATABASE": [
        "Implement proper indexing strategy",
        "Use read replicas for scaling reads",
        "Regular backup and disaster recovery plan",
      ],
      "REDIS CACHE": [
        "Set appropriate TTL for cached data",
        "Use Redis Cluster for high availability",
        "Implement cache invalidation strategy",
      ],
    };
    return practices[label] || [
      "Follow single responsibility principle",
      "Implement proper error handling",
      "Add monitoring and logging",
    ];
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal - PHASE 3: Added slide animation on node change */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto pointer-events-auto ${isAnimating ? 'animate-modalSlide' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium opacity-90 mb-1">Component Details</div>
                <h2 className="text-2xl font-bold">{node.label}</h2>
                <p className="text-sm opacity-75 mt-1">ID: {node.id}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            
            {/* Role Section with Icon */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <span>Role & Purpose</span>
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {getRoleDescription(node.label)}
              </p>
            </div>

            {/* Connections Section */}
            <div className="grid grid-cols-2 gap-4">
              {/* Incoming */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <FiArrowLeft className="text-blue-600" />
                  Incoming ({incomingConnections.length})
                </h4>
                {incomingConnections.length > 0 ? (
                  <ul className="space-y-2">
                    {incomingConnections.map((conn, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                        {conn.toUpperCase()}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">No incoming connections</p>
                )}
              </div>

              {/* Outgoing */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <FiArrowRight className="text-green-600" />
                  Outgoing ({outgoingConnections.length})
                </h4>
                {outgoingConnections.length > 0 ? (
                  <ul className="space-y-2">
                    {outgoingConnections.map((conn, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        {conn.toUpperCase()}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">No outgoing connections</p>
                )}
              </div>
            </div>

            {/* 🎯 TIER 1 + PHASE 4: Connection Mini-Graph (Responsive) */}
            {(incomingConnections.length > 0 || outgoingConnections.length > 0) && (
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-lg">🔗</span>
                  <span>Connection Flow Diagram</span>
                </h3>
                
                {/* SVG Mini-Graph - PHASE 4: Responsive with preserveAspectRatio */}
                <svg 
                  width="100%" 
                  height="200" 
                  viewBox="0 0 400 200" 
                  className="bg-white rounded border hidden md:block"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Define arrowhead marker */}
                  <defs>
                    <marker
                      id="arrowhead-mini"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill="#2563eb" />
                    </marker>
                  </defs>

                  {/* Draw incoming connections (top section) */}
                  {incomingConnections.slice(0, 3).map((conn, idx) => {
                    const x = 50 + idx * 110;
                    const y = 30;
                    return (
                      <g key={`in-${idx}`}>
                        {/* Incoming node box */}
                        <rect
                          x={x}
                          y={y}
                          width="90"
                          height="30"
                          rx="4"
                          fill="#dbeafe"
                          stroke="#3b82f6"
                          strokeWidth="1"
                        />
                        <text
                          x={x + 45}
                          y={y + 18}
                          fontSize="10"
                          fill="#1e40af"
                          textAnchor="middle"
                          fontWeight="500"
                        >
                          {conn.substring(0, 12).toUpperCase()}
                        </text>
                        
                        {/* Arrow down to center node */}
                        <line
                          x1={x + 45}
                          y1={y + 30}
                          x2={200}
                          y2={90}
                          stroke="#2563eb"
                          strokeWidth="2"
                          markerEnd="url(#arrowhead-mini)"
                        />
                      </g>
                    );
                  })}

                  {/* Center node (selected node) */}
                  <rect
                    x="130"
                    y="90"
                    width="140"
                    height="40"
                    rx="6"
                    fill="#3b82f6"
                    stroke="#1e40af"
                    strokeWidth="2"
                  />
                  <text
                    x="200"
                    y="110"
                    fontSize="12"
                    fill="white"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {node.label}
                  </text>
                  <text
                    x="200"
                    y="122"
                    fontSize="8"
                    fill="#dbeafe"
                    textAnchor="middle"
                  >
                    (You are here)
                  </text>

                  {/* Draw outgoing connections (bottom section) */}
                  {outgoingConnections.slice(0, 3).map((conn, idx) => {
                    const x = 50 + idx * 110;
                    const y = 160;
                    return (
                      <g key={`out-${idx}`}>
                        {/* Arrow from center to outgoing node */}
                        <line
                          x1={200}
                          y1={130}
                          x2={x + 45}
                          y2={y}
                          stroke="#10b981"
                          strokeWidth="2"
                          markerEnd="url(#arrowhead-mini)"
                        />
                        
                        {/* Outgoing node box */}
                        <rect
                          x={x}
                          y={y}
                          width="90"
                          height="30"
                          rx="4"
                          fill="#d1fae5"
                          stroke="#10b981"
                          strokeWidth="1"
                        />
                        <text
                          x={x + 45}
                          y={y + 18}
                          fontSize="10"
                          fill="#047857"
                          textAnchor="middle"
                          fontWeight="500"
                        >
                          {conn.substring(0, 12).toUpperCase()}
                        </text>
                      </g>
                    );
                  })}

                  {/* Show "+" if more than 3 connections */}
                  {incomingConnections.length > 3 && (
                    <text x="370" y="50" fontSize="10" fill="#6b7280">
                      +{incomingConnections.length - 3} more
                    </text>
                  )}
                  {outgoingConnections.length > 3 && (
                    <text x="370" y="175" fontSize="10" fill="#6b7280">
                      +{outgoingConnections.length - 3} more
                    </text>
                  )}
                </svg>

                {/* PHASE 4: Mobile-friendly stacked view */}
                <div className="md:hidden space-y-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-blue-900 mb-2">📥 Incoming Connections</h4>
                    {incomingConnections.length > 0 ? (
                      <ul className="space-y-1">
                        {incomingConnections.map((conn, idx) => (
                          <li key={idx} className="text-xs text-gray-700 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            {conn.toUpperCase()}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500 italic">None</p>
                    )}
                  </div>
                  
                  <div className="bg-indigo-100 rounded-lg p-3 border-2 border-indigo-400">
                    <h4 className="text-xs font-semibold text-indigo-900 text-center">{node.label}</h4>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-green-900 mb-2">📤 Outgoing Connections</h4>
                    {outgoingConnections.length > 0 ? (
                      <ul className="space-y-1">
                        {outgoingConnections.map((conn, idx) => (
                          <li key={idx} className="text-xs text-gray-700 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            {conn.toUpperCase()}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500 italic">None</p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-2 text-center hidden md:block">
                  Blue arrows = incoming data | Green arrows = outgoing data
                </p>
              </div>
            )}

            {/* Best Practices with Icon */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">⚙️</span>
                <span>Best Practices</span>
              </h3>
              <ul className="space-y-2">
                {getBestPractices(node.label).map((practice, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-700">
                    <span className="text-green-500 mt-1">✓</span>
                    <span className="text-sm leading-relaxed">{practice}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                {copied ? (
                  <>
                    <FiCheck size={18} />
                    Copied!
                  </>
                ) : (
                  <>
                    <FiCopy size={18} />
                    Copy Component ID
                  </>
                )}
              </button>
              
              <button
                onClick={onClose}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations - PHASE 3: Added modalSlide */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes modalSlide {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        .animate-modalSlide {
          animation: modalSlide 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </>
  );
}
