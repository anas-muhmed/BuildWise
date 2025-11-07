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

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto pointer-events-auto animate-slideUp"
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
            
            {/* Role Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                🎯 Role & Purpose
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

            {/* Best Practices */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                ⚙️ Best Practices
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

      {/* CSS Animations */}
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
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
