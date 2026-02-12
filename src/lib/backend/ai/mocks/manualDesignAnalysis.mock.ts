import { ManualDesignEdge, ManualDesignNode } from "../context/manualDesignContextBuilder";
import { ManualDesignAnalysisResponse, ManualDesignFinding } from "../prompts/manualDesignAnalysis.prompt";

/**
 * SCORING PHILOSOPHY (Normalized and Documented)
 * 
 * Start with perfect score (100) and deduct for real problems.
 * 
 * CRITICAL ISSUES (Architecture Completeness):
 * - Frontend without backend: -20 (cannot function)
 * - Backend without database: -20 (data layer missing)
 * - Database without backend: -15 (orphaned resource)
 * - No connections between components: -25 (no data flow)
 * 
 * SECURITY ISSUES:
 * - Backend directly exposed (no gateway/LB): -15 (security risk)
 * - No auth component when sensitive data implied: -10 (future deduction when we detect this)
 * 
 * PERFORMANCE/SCALABILITY ISSUES:
 * - Single backend + single DB only: -5 (acceptable but note limits)
 * - No cache in read-heavy system: -5 (future deduction when we detect patterns)
 * 
 * COST/OVERENGINEERING ISSUES:
 * - Load balancer with <2 backends: -10 (wasted infrastructure)
 * - API gateway with no services: -10 (premature complexity)
 * 
 * FINAL SCORE = 100 - (sum of all deductions)
 */

const SCORING_RULES = {
  // Critical issues
  FRONTEND_WITHOUT_BACKEND: 20,
  BACKEND_WITHOUT_DATABASE: 20,
  DATABASE_WITHOUT_BACKEND: 15,
  NO_CONNECTIONS: 25,
  
  // Security
  BACKEND_EXPOSED: 15,
  
  // Performance
  SINGLE_INSTANCE_ONLY: 5,
  
  // Cost
  WASTED_LOAD_BALANCER: 10,
  WASTED_API_GATEWAY: 10,
};

function countByType(nodes: ManualDesignNode[]) {
  const counts: Record<string, number> = {};
  for (const n of nodes) {
    const key = n.type.toLowerCase();
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function finding(
  type: ManualDesignFinding["type"],
  title: string,
  description: string,
  impact: ManualDesignFinding["impact"],
  recommendation: string
): ManualDesignFinding {
  return { type, title, description, impact, recommendation };
}

export function getManualDesignAnalysisMock(
  nodes: ManualDesignNode[],
  edges: ManualDesignEdge[]
): ManualDesignAnalysisResponse {
  const counts = countByType(nodes);
  const findings: ManualDesignFinding[] = [];
  
  // Start with perfect score
  let deductions = 0;

  // CRITICAL ISSUES
  if (nodes.length === 0) {
    findings.push(
      finding(
        "issue",
        "Canvas is empty",
        "No components are present, so the system has no defined structure.",
        "high",
        "Add at least a frontend, backend, and database if applicable."
      )
    );
    deductions += SCORING_RULES.NO_CONNECTIONS;
  }

  if ((counts.frontend || 0) > 0 && (counts.backend || 0) === 0) {
    findings.push(
      finding(
        "issue",
        "Frontend without backend",
        "The frontend has no backend service to handle business logic or APIs.",
        "high",
        "Add a backend service and connect it to the frontend."
      )
    );
    deductions += SCORING_RULES.FRONTEND_WITHOUT_BACKEND;
  }

  if ((counts.backend || 0) > 0 && (counts.database || 0) === 0) {
    findings.push(
      finding(
        "issue",
        "Backend without database",
        "A backend exists but there is no data store connected.",
        "medium",
        "Add a database or data store and connect it to the backend."
      )
    );
    deductions += SCORING_RULES.BACKEND_WITHOUT_DATABASE;
  }

  if ((counts.database || 0) > 0 && (counts.backend || 0) === 0) {
    findings.push(
      finding(
        "issue",
        "Database without backend",
        "Data storage exists without a backend layer to manage access.",
        "medium",
        "Add a backend service to mediate access to the database."
      )
    );
    deductions += SCORING_RULES.DATABASE_WITHOUT_BACKEND;
  }

  if (edges.length === 0 && nodes.length > 0) {
    findings.push(
      finding(
        "issue",
        "No connections between components",
        "Components exist but nothing is wired together.",
        "high",
        "Connect components to define data flow."
      )
    );
    deductions += SCORING_RULES.NO_CONNECTIONS;
  }

  // COST/OVERENGINEERING WARNINGS
  if ((counts.loadbalancer || 0) > 0 && (counts.backend || 0) < 2) {
    findings.push(
      finding(
        "warning",
        "Load balancer may be unnecessary",
        "A load balancer is present but there is only one backend instance.",
        "low",
        "Consider removing it until multiple backends are required."
      )
    );
    deductions += SCORING_RULES.WASTED_LOAD_BALANCER;
  }

  if ((counts.apigateway || 0) > 0 && (counts.backend || 0) === 0) {
    findings.push(
      finding(
        "warning",
        "API gateway without services",
        "The gateway has no backend services behind it.",
        "medium",
        "Add backend services or remove the gateway for now."
      )
    );
    deductions += SCORING_RULES.WASTED_API_GATEWAY;
  }

  // SECURITY SUGGESTIONS
  if ((counts.backend || 0) > 0 && (counts.apigateway || 0) === 0 && (counts.loadbalancer || 0) === 0) {
    findings.push(
      finding(
        "suggestion",
        "Backend exposure risk",
        "Backend services appear directly exposed without traffic management.",
        "medium",
        "If this is public traffic, consider adding a gateway or load balancer."
      )
    );
    deductions += SCORING_RULES.BACKEND_EXPOSED;
  }

  // PERFORMANCE NOTES (informational, minimal deduction)
  if ((counts.backend || 0) === 1 && (counts.database || 0) === 1 && edges.length > 0) {
    findings.push(
      finding(
        "suggestion",
        "Single-instance architecture",
        "Current architecture uses single instances, which is acceptable for initial deployments but limits scalability.",
        "low",
        "Plan for horizontal scaling if traffic grows beyond expectations."
      )
    );
    deductions += SCORING_RULES.SINGLE_INSTANCE_ONLY;
  }

  // Calculate final scores (start at 100, subtract deductions)
  const overall = Math.max(0, 100 - deductions);

  // Breakdown scores based on specific issue types
  const securityDeduction = findings.some(f => f.title.includes("exposure")) ? SCORING_RULES.BACKEND_EXPOSED : 0;
  const performanceDeduction = findings.some(f => f.title.includes("Single-instance")) ? SCORING_RULES.SINGLE_INSTANCE_ONLY : 0;
  const costDeduction = 
    (findings.some(f => f.title.includes("Load balancer")) ? SCORING_RULES.WASTED_LOAD_BALANCER : 0) +
    (findings.some(f => f.title.includes("API gateway without")) ? SCORING_RULES.WASTED_API_GATEWAY : 0);

  const score = {
    overall,
    security: Math.max(0, overall - securityDeduction),
    performance: Math.max(0, overall - performanceDeduction),
    cost: Math.max(0, overall - costDeduction),
  };

  const assumptions = [
    "No additional components exist outside the current canvas.",
    "The current design represents the intended initial architecture.",
    "Traffic patterns and scale requirements are assumed to match visible infrastructure."
  ];

  return { score, findings, assumptions };
}
