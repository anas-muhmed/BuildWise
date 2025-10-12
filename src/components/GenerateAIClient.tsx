// components/GenerateAIClient.tsx
"use client";
import React, { useState, useMemo, useEffect } from "react";

// Data models
type Node = { id: string; label: string; x: number; y: number };
type Edge = { source: string; target: string };

export default function GenerateAIClient() {
  // State
  const [prompt, setPrompt] = useState(
    "I want to build a scalable food delivery app like Swiggy"
  );
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [explanations, setExplanations] = useState<string[]>([]);
  const [displayedText, setDisplayedText] = useState<string[]>([]);

  // Enhanced mock AI generator with more patterns
  function generateMockFromPrompt(text: string) {
    const t = text.toLowerCase();
    
    if (t.includes("video") || t.includes("streaming") || t.includes("youtube") || t.includes("netflix")) {
      return {
        nodes: [
          { id: "frontend", label: "FRONTEND", x: 120, y: 80 },
          { id: "cdn", label: "CDN (CloudFront)", x: 320, y: 40 },
          { id: "api-gateway", label: "API GATEWAY", x: 320, y: 120 },
          { id: "auth", label: "AUTH SERVICE", x: 520, y: 80 },
          { id: "video-service", label: "VIDEO SERVICE", x: 320, y: 200 },
          { id: "transcoding", label: "TRANSCODING", x: 120, y: 200 },
          { id: "storage", label: "OBJECT STORAGE (S3)", x: 520, y: 200 },
          { id: "db", label: "DATABASE", x: 320, y: 320 },
          { id: "cache", label: "REDIS CACHE", x: 520, y: 320 },
        ],
        edges: [
          { source: "frontend", target: "cdn" },
          { source: "frontend", target: "api-gateway" },
          { source: "api-gateway", target: "auth" },
          { source: "api-gateway", target: "video-service" },
          { source: "video-service", target: "transcoding" },
          { source: "video-service", target: "storage" },
          { source: "video-service", target: "db" },
          { source: "video-service", target: "cache" },
        ],
        explanations: [
          "CDN (Content Delivery Network) is crucial for video streaming - it caches video chunks globally to reduce latency from 2000ms to under 50ms for users worldwide. Without CDN, all users would hit your origin server causing crashes.",
          "Transcoding Service converts uploaded videos into multiple formats (720p, 1080p, 4K) and codecs (H.264, H.265) - essential because users have different devices and internet speeds. A single 4K video becomes 8-10 different versions.",
          "Object Storage (like AWS S3) is designed for massive file storage - much cheaper than database storage ($0.02/GB vs $1/GB). It can handle petabytes of video content with 99.999999999% durability.",
          "Redis Cache stores video metadata and user preferences - reduces database load by 80% during peak traffic. When 1M users browse videos simultaneously, cache prevents database from crashing.",
          "API Gateway handles rate limiting (prevent abuse), authentication, and request routing. Without it, malicious users could spam your video upload endpoint and crash your system.",
        ],
      };
    }
    
    if (t.includes("food") || t.includes("delivery") || t.includes("swiggy") || t.includes("zomato")) {
      return {
        nodes: [
          { id: "frontend", label: "MOBILE APP", x: 120, y: 80 },
          { id: "loadbalancer", label: "LOAD BALANCER", x: 320, y: 60 },
          { id: "api-gateway", label: "API GATEWAY", x: 520, y: 60 },
          { id: "user-service", label: "USER SERVICE", x: 320, y: 160 },
          { id: "restaurant-service", label: "RESTAURANT SERVICE", x: 520, y: 160 },
          { id: "order-service", label: "ORDER SERVICE", x: 320, y: 240 },
          { id: "payment-service", label: "PAYMENT SERVICE", x: 520, y: 240 },
          { id: "notification", label: "NOTIFICATION", x: 120, y: 240 },
          { id: "location-service", label: "LOCATION SERVICE", x: 120, y: 320 },
          { id: "db", label: "DATABASE", x: 320, y: 340 },
          { id: "cache", label: "REDIS CACHE", x: 520, y: 340 },
        ],
        edges: [
          { source: "frontend", target: "loadbalancer" },
          { source: "loadbalancer", target: "api-gateway" },
          { source: "api-gateway", target: "user-service" },
          { source: "api-gateway", target: "restaurant-service" },
          { source: "api-gateway", target: "order-service" },
          { source: "order-service", target: "payment-service" },
          { source: "order-service", target: "notification" },
          { source: "user-service", target: "location-service" },
          { source: "order-service", target: "db" },
          { source: "restaurant-service", target: "cache" },
        ],
        explanations: [
          "Load Balancer distributes traffic across multiple server instances - essential during lunch rush when 100K+ users order simultaneously. Without it, a single server would crash under 10K concurrent requests.",
          "Microservices architecture isolates failures - if payment service goes down, users can still browse restaurants. Swiggy processes 40M orders/month; monolithic architecture would be impossible to scale.",
          "Location Service uses geospatial indexing to find nearby restaurants within 5km radius in under 50ms. Critical for delivery time estimation and driver assignment algorithms.",
          "Redis Cache stores restaurant menus and availability - prevents database overload during peak hours. Menu queries are 99% cached, reducing database load from 50K to 500 queries/second.",
          "Notification Service sends real-time updates via WebSocket for order tracking. Push notifications increase user retention by 88% and reduce customer service calls by 60%.",
        ],
      };
    }
    
    if (t.includes("chat") || t.includes("message") || t.includes("whatsapp") || t.includes("real-time")) {
      return {
        nodes: [
          { id: "frontend", label: "MOBILE APP", x: 120, y: 120 },
          { id: "websocket", label: "WEBSOCKET GATEWAY", x: 320, y: 80 },
          { id: "message-broker", label: "MESSAGE BROKER", x: 520, y: 80 },
          { id: "api-gateway", label: "API GATEWAY", x: 320, y: 160 },
          { id: "auth", label: "AUTH SERVICE", x: 520, y: 160 },
          { id: "chat-service", label: "CHAT SERVICE", x: 320, y: 240 },
          { id: "media-service", label: "MEDIA SERVICE", x: 120, y: 240 },
          { id: "encryption", label: "ENCRYPTION", x: 520, y: 240 },
          { id: "db", label: "MESSAGE DB", x: 320, y: 320 },
          { id: "cache", label: "REDIS CACHE", x: 120, y: 320 },
        ],
        edges: [
          { source: "frontend", target: "websocket" },
          { source: "websocket", target: "message-broker" },
          { source: "frontend", target: "api-gateway" },
          { source: "api-gateway", target: "auth" },
          { source: "api-gateway", target: "chat-service" },
          { source: "chat-service", target: "media-service" },
          { source: "chat-service", target: "encryption" },
          { source: "chat-service", target: "db" },
          { source: "chat-service", target: "cache" },
        ],
        explanations: [
          "WebSocket Gateway maintains persistent connections for real-time messaging - HTTP polling would consume 100x more bandwidth. WhatsApp handles 100B messages/day using WebSocket architecture.",
          "Message Broker (Apache Kafka) ensures message delivery even during server failures. Messages are queued and retried automatically - critical for business communications where message loss means revenue loss.",
          "End-to-end Encryption protects user privacy - messages are encrypted on sender device and only decrypted on receiver device. Even the platform cannot read messages, ensuring GDPR compliance.",
          "Redis Cache stores active user sessions and recent message history - enables instant message loading when users open chat. Reduces database queries by 95% for active conversations.",
          "Media Service handles file uploads, image compression, and video thumbnails. Automatically compresses images by 70% without quality loss to save bandwidth for users on slow networks.",
        ],
      };
    }
    
    if (t.includes("ecommerce") || t.includes("e-commerce") || t.includes("payment") || t.includes("order") || t.includes("amazon") || t.includes("shopping")) {
      return {
        nodes: [
          { id: "frontend", label: "WEB/MOBILE APP", x: 120, y: 100 },
          { id: "cdn", label: "CDN", x: 120, y: 40 },
          { id: "api-gateway", label: "API GATEWAY", x: 320, y: 100 },
          { id: "auth", label: "AUTH SERVICE", x: 520, y: 60 },
          { id: "product", label: "PRODUCT SERVICE", x: 320, y: 180 },
          { id: "inventory", label: "INVENTORY SERVICE", x: 120, y: 180 },
          { id: "payment", label: "PAYMENT SERVICE", x: 520, y: 180 },
          { id: "order", label: "ORDER SERVICE", x: 320, y: 280 },
          { id: "recommendation", label: "ML RECOMMENDATIONS", x: 120, y: 280 },
          { id: "search", label: "SEARCH ENGINE", x: 520, y: 280 },
          { id: "main-db", label: "MAIN DATABASE", x: 320, y: 360 },
          { id: "analytics-db", label: "ANALYTICS DB", x: 520, y: 360 },
        ],
        edges: [
          { source: "frontend", target: "cdn" },
          { source: "frontend", target: "api-gateway" },
          { source: "api-gateway", target: "auth" },
          { source: "api-gateway", target: "product" },
          { source: "api-gateway", target: "order" },
          { source: "product", target: "inventory" },
          { source: "order", target: "payment" },
          { source: "product", target: "recommendation" },
          { source: "product", target: "search" },
          { source: "order", target: "main-db" },
          { source: "recommendation", target: "analytics-db" },
        ],
        explanations: [
          "CDN serves product images and static assets from 200+ global locations - reduces page load time from 3s to 300ms. Amazon found that 100ms delay decreases sales by 1%, so CDN is revenue-critical.",
          "Separate Inventory Service prevents overselling during flash sales - uses database locks and real-time stock updates. During Black Friday, prevents selling 1000 units when only 100 are available.",
          "ML Recommendation Engine analyzes user behavior to suggest products - increases sales by 35% on average. Amazon generates 35% revenue from recommendations using collaborative filtering algorithms.",
          "Search Engine (Elasticsearch) enables fast product discovery across millions of items. Handles complex queries like 'red wireless headphones under $100' in under 50ms with typo tolerance and autocomplete.",
          "Payment Service integrates multiple gateways (Stripe, PayPal, UPI) for global coverage. Redundancy ensures 99.9% payment success rate - payment failures directly impact revenue conversion.",
        ],
      };
    }

    if (t.includes("social") || t.includes("media") || t.includes("facebook") || t.includes("instagram") || t.includes("twitter")) {
      return {
        nodes: [
          { id: "frontend", label: "MOBILE/WEB APP", x: 120, y: 100 },
          { id: "cdn", label: "GLOBAL CDN", x: 320, y: 40 },
          { id: "api-gateway", label: "API GATEWAY", x: 320, y: 120 },
          { id: "auth", label: "AUTH SERVICE", x: 520, y: 80 },
          { id: "user-service", label: "USER SERVICE", x: 120, y: 200 },
          { id: "post-service", label: "POST SERVICE", x: 320, y: 200 },
          { id: "feed-service", label: "FEED ALGORITHM", x: 520, y: 200 },
          { id: "media-processing", label: "MEDIA PROCESSING", x: 120, y: 280 },
          { id: "notification", label: "NOTIFICATION", x: 320, y: 280 },
          { id: "analytics", label: "ANALYTICS", x: 520, y: 280 },
          { id: "main-db", label: "USER DATABASE", x: 320, y: 360 },
          { id: "graph-db", label: "GRAPH DATABASE", x: 520, y: 360 },
        ],
        edges: [
          { source: "frontend", target: "cdn" },
          { source: "frontend", target: "api-gateway" },
          { source: "api-gateway", target: "auth" },
          { source: "api-gateway", target: "user-service" },
          { source: "api-gateway", target: "post-service" },
          { source: "post-service", target: "feed-service" },
          { source: "post-service", target: "media-processing" },
          { source: "feed-service", target: "notification" },
          { source: "user-service", target: "analytics" },
          { source: "user-service", target: "main-db" },
          { source: "feed-service", target: "graph-db" },
        ],
        explanations: [
          "Graph Database stores relationships between users for friend suggestions and feed ranking. Facebook's social graph has 3B+ users with 200B+ connections - traditional SQL databases cannot handle this relationship complexity efficiently.",
          "Feed Algorithm Service ranks posts using ML models considering 1000+ signals like user interests, post engagement, and recency. Instagram's algorithm processes 50M+ posts daily to personalize each user's feed.",
          "Media Processing automatically resizes images for different devices and compresses videos. Handles 4B photos uploaded daily on Facebook - original files would require 100x more storage and bandwidth.",
          "Real-time Notification System delivers push notifications within 100ms globally using WebSocket connections. Critical for user engagement - delayed notifications reduce user activity by 40%.",
          "Analytics Service tracks user behavior for content optimization and ad targeting. Processes 5TB+ data daily to understand user preferences and improve recommendation algorithms continuously.",
        ],
      };
    }
    
    // Default simple web app with meaningful explanations
    return {
      nodes: [
        { id: "frontend", label: "FRONTEND", x: 120, y: 120 },
        { id: "api-gateway", label: "API GATEWAY", x: 320, y: 80 },
        { id: "backend", label: "BACKEND SERVICE", x: 320, y: 200 },
        { id: "cache", label: "REDIS CACHE", x: 120, y: 280 },
        { id: "db", label: "DATABASE", x: 520, y: 260 },
      ],
      edges: [
        { source: "frontend", target: "api-gateway" },
        { source: "api-gateway", target: "backend" },
        { source: "backend", target: "cache" },
        { source: "backend", target: "db" },
      ],
      explanations: [
        "API Gateway acts as single entry point for all client requests - handles authentication, rate limiting, and request routing. Prevents direct database access and provides centralized logging for security monitoring.",
        "Redis Cache stores frequently accessed data in memory - reduces database queries by 80% and improves response time from 200ms to 5ms. Essential for user sessions and application performance.",
        "Database uses ACID transactions to ensure data consistency - critical for financial applications where data corruption can cause monetary losses. Includes automated backups and replication for disaster recovery.",
      ],
    };
  }

  // Generate handler with enhanced UX
  async function handleGenerate() {
    setLoading(true);
    setDisplayedText([]);
    setNodes([]);
    setEdges([]);
    
    // Simulate realistic AI processing time
    await new Promise((r) => setTimeout(r, 800));
    
    const mock = generateMockFromPrompt(prompt);
    setNodes(mock.nodes);
    setEdges(mock.edges);
    setExplanations(mock.explanations);
    setLoading(false);
  }

  // Enhanced typing effect for explanations
  useEffect(() => {
    if (!loading && explanations.length > 0) {
      let idx = 0;
      const interval = setInterval(() => {
        setDisplayedText((prev) => [...prev, explanations[idx]]);
        idx++;
        if (idx >= explanations.length) clearInterval(interval);
      }, 600); // Slightly faster for better UX
      return () => clearInterval(interval);
    }
  }, [loading, explanations]);

  // Compute node centers for drawing edges
  const nodeCenters = useMemo(() => {
    const map = new Map<string, { cx: number; cy: number }>();
    nodes.forEach((n) => map.set(n.id, { cx: n.x + 60, cy: n.y + 20 }));
    return map;
  }, [nodes]);

  // Enhanced export function
  const exportDesign = () => {
    const designData = {
      metadata: {
        title: prompt.slice(0, 50) + "...",
        generated: new Date().toISOString(),
        nodeCount: nodes.length,
        edgeCount: edges.length,
      },
      architecture: { nodes, edges },
      analysis: { explanations },
    };
    
    const blob = new Blob([JSON.stringify(designData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `buildwise-design-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear with confirmation for better UX
  const clearDesign = () => {
    if (nodes.length > 0) {
      if (confirm("Are you sure you want to clear the current design?")) {
        setNodes([]);
        setEdges([]);
        setExplanations([]);
        setDisplayedText([]);
      }
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Side - Input & Canvas */}
      <div className="col-span-8">
        {/* Enhanced Input Section */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
            placeholder="Describe your application architecture (e.g., scalable food delivery platform)"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating...
              </span>
            ) : (
              "✨ Generate Design"
            )}
          </button>
          
          {/* Enhanced Sample Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setPrompt("Simple chat app with real-time messages")}
              className="text-sm text-slate-600 px-3 py-2 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-200"
            >
              💬 Chat App
            </button>
            <button
              onClick={() => setPrompt("Scalable e-commerce platform with payments and orders")}
              className="text-sm text-slate-600 px-3 py-2 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all duration-200"
            >
              🛒 E-commerce
            </button>
            <button
              onClick={() => setPrompt("Food delivery app like Swiggy with real-time tracking")}
              className="text-sm text-slate-600 px-3 py-2 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-all duration-200"
            >
              🍔 Food Delivery
            </button>
          </div>
        </div>

        {/* Enhanced Canvas */}
        <div
          className="relative w-full h-[520px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-lg overflow-hidden"
          style={{
            backgroundImage:
              "linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg,#e5e7eb 1px, transparent 1px)",
            backgroundSize: "32px 32px, 32px 32px",
          }}
        >
          {/* Enhanced SVG Edges with Arrows */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {edges.map((e, i) => {
              const src = nodeCenters.get(e.source);
              const tgt = nodeCenters.get(e.target);
              if (!src || !tgt) return null;
              const midX = (src.cx + tgt.cx) / 2;
              const path = `M ${src.cx} ${src.cy} Q ${midX} ${
                (src.cy + tgt.cy) / 2
              } ${tgt.cx} ${tgt.cy}`;
              return (
                <path
                  key={i}
                  d={path}
                  stroke="url(#gradient)"
                  strokeWidth={3}
                  fill="none"
                  strokeLinecap="round"
                  opacity={0.8}
                  markerEnd="url(#arrowhead)"
                />
              );
            })}
            <defs>
              {/* Gradient for connections */}
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              
              {/* Arrow marker definition */}
              <marker
                id="arrowhead"
                markerWidth="12"
                markerHeight="10"
                refX="10"
                refY="5"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path
                  d="M0,0 L0,10 L12,5 z"
                  fill="url(#gradient)"
                  stroke="none"
                />
              </marker>
            </defs>
          </svg>

          {/* Enhanced Nodes */}
          {nodes.map((n, index) => (
            <div
              key={n.id}
              className="absolute bg-white border-2 border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm font-semibold transition-all duration-300 hover:scale-110 hover:shadow-xl hover:border-blue-400 cursor-pointer"
              style={{
                left: n.x,
                top: n.y,
                minWidth: 120,
                textAlign: "center",
                animation: `nodeAppear 0.6s ease forwards`,
                animationDelay: `${index * 0.1}s`,
                transform: "scale(0)",
              }}
            >
              {n.label}
            </div>
          ))}

          {/* Enhanced Placeholder */}
          {nodes.length === 0 && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
              <div className="text-6xl mb-4">🏗️</div>
              <div className="text-lg font-medium">Your generated architecture will appear here</div>
              <div className="text-sm mt-2">Describe your app and click &quot;Generate Design&quot;</div>
            </div>
          )}

          {/* Enhanced Loader */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
              </div>
              <p className="mt-4 text-gray-700 font-medium text-lg">
                🤖 Analyzing architecture patterns...
              </p>
              <p className="text-sm text-gray-500 mt-1">
                This may take a few seconds
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Right Side - Explanations */}
      <div className="col-span-4">
        <div className="sticky top-6 bg-white border border-gray-200 rounded-xl p-6 h-[520px] overflow-auto shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Architecture Insights</h3>
          </div>

          {loading && (
            <div className="text-sm text-gray-500 mb-4 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                Analyzing generated architecture...
              </div>
            </div>
          )}

          {!loading && displayedText.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm text-gray-500">
                No insights yet — generate a design to see AI explanations about architectural decisions and best practices.
              </p>
            </div>
          )}

          <ul className="space-y-4">
            {displayedText.map((text, idx) => (
              <li
                key={idx}
                className="flex gap-3 items-start opacity-0 animate-fade-in"
                style={{
                  animation: `fadeInUp 0.8s ease forwards`,
                  animationDelay: `${idx * 0.2}s`,
                }}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-200 flex items-center justify-center font-bold text-blue-700 flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="text-sm text-gray-700 leading-relaxed">{text}</div>
              </li>
            ))}
          </ul>

          {/* Enhanced Footer */}
          {(nodes.length > 0 || explanations.length > 0) && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between gap-3">
                <button
                  onClick={exportDesign}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  📥 Export JSON
                </button>
                <button
                  onClick={clearDesign}
                  className="flex-1 px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  🗑️ Clear
                </button>
              </div>
              <div className="mt-3 text-xs text-gray-400 text-center">
                {nodes.length} components • {edges.length} connections
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes nodeAppear {
          from {
            opacity: 0;
            transform: scale(0) rotate(180deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        
        .animate-fade-in {
          animation: fadeInUp 0.8s ease forwards;
        }
      `}</style>
    </div>
  );
}

