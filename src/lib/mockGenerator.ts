// lib/mockGenerator.ts
// 🎯 This file contains MOCK DATA GENERATION logic
// It's a PURE UTILITY - no React, no state, just input → output

// 🎯 LEARNING: Import types for type safety
import { Node, Edge } from "@/components/generative-ai/ArchitectureCanvas";

// 🎯 LEARNING: Define the return type for clarity
export interface MockArchitecture {
  nodes: Node[];
  edges: Edge[];
  explanations: string[];
}

/**
 * 🎯 HELPER: Add slight Y-position randomization for organic look
 * @param y - Base Y position
 * @returns Y position with ±10px random offset
 */
function randomizeY(y: number): number {
  return y + Math.floor(Math.random() * 20 - 10); // ±10px variation
}

/**
 * 🎯 PURE FUNCTION: Generates mock architecture based on user prompt
 * 
 * @param prompt - The user's input text describing what they want to build
 * @returns MockArchitecture object with nodes, edges, and explanations
 * 
 * 🎯 LEARNING: Why is this a "pure function"?
 * - Same input always gives same output (predictable)
 * - No side effects (doesn't modify anything outside itself)
 * - No dependencies on external state (self-contained)
 * - Easy to test (just call it and check the result!)
 */
export function generateMockFromPrompt(prompt: string): MockArchitecture {
  const text = prompt.toLowerCase();
  
  // 🎯 PATTERN MATCHING: Check for food delivery keywords
  if (text.includes("food") || text.includes("delivery") || text.includes("swiggy")) {
    return {
      nodes: [
        { id: "frontend", label: "MOBILE APP", x: 120, y: randomizeY(80) },
        { id: "loadbalancer", label: "LOAD BALANCER", x: 320, y: randomizeY(60) },
        { id: "api-gateway", label: "API GATEWAY", x: 520, y: randomizeY(60) },
        { id: "user-service", label: "USER SERVICE", x: 320, y: randomizeY(160) },
        { id: "restaurant-service", label: "RESTAURANT SERVICE", x: 520, y: randomizeY(160) },
        { id: "order-service", label: "ORDER SERVICE", x: 320, y: randomizeY(240) },
        { id: "payment-service", label: "PAYMENT SERVICE", x: 520, y: randomizeY(240) },
        { id: "db", label: "DATABASE", x: 320, y: randomizeY(340) },
        { id: "cache", label: "REDIS CACHE", x: 520, y: randomizeY(340) },
      ],
      edges: [
        { source: "frontend", target: "loadbalancer" },
        { source: "loadbalancer", target: "api-gateway" },
        { source: "api-gateway", target: "user-service" },
        { source: "api-gateway", target: "restaurant-service" },
        { source: "api-gateway", target: "order-service" },
        { source: "order-service", target: "payment-service" },
        { source: "order-service", target: "db" },
        { source: "restaurant-service", target: "cache" },
      ],
      explanations: [
        "Load Balancer distributes requests across backend servers to handle peak demand efficiently.",
        "API Gateway secures and routes client requests to appropriate microservices.",
        "Redis Cache improves performance by reducing redundant database queries.",
        "Microservices isolate failures: payment or order issues don't crash the entire system.",
      ],
    };
  }
  
  // 🎯 DEFAULT: Generic 3-tier architecture for any other prompt
  return {
    nodes: [
      { id: "frontend", label: "FRONTEND", x: 120, y: randomizeY(100) },
      { id: "backend", label: "BACKEND", x: 320, y: randomizeY(180) },
      { id: "db", label: "DATABASE", x: 520, y: randomizeY(260) },
    ],
    edges: [
      { source: "frontend", target: "backend" },
      { source: "backend", target: "db" },
    ],
    explanations: [
      "Frontend communicates with backend via REST APIs.",
      "Backend connects to Database for persistent storage.",
    ],
  };
}
