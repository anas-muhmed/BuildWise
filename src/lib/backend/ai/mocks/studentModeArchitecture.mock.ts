/**
 * STEP 3: Contract-Valid Mock
 * 
 * Purpose: Prove the response contract works with UI
 * This is NOT intelligence. This is shape validation.
 * 
 * When real AI arrives, we replace this file's logic.
 * The contract stays the same.
 */

export interface ArchitectureNode {
  id: string;
  label: string;
  type: string;
  reason: string;
}

export interface ArchitectureEdge {
  from: string;
  to: string;
  label?: string;
  type: "request" | "data" | "event";
}

export interface Tradeoff {
  decision: string;
  pros: string[];
  cons: string[];
}

export interface AIArchitectureResponse {
  architecture: {
    nodes: ArchitectureNode[];
    edges: ArchitectureEdge[];
  };
  reasoning: {
    overview: string;
    tradeoffs: Tradeoff[];
    assumptions: string[];
  };
}

/**
 * Contract-valid mock response
 * 
 * This represents: "If AI behaved perfectly, this is what it would return."
 */
export function getStudentModeArchitectureMock(): AIArchitectureResponse {
  return {
    architecture: {
      nodes: [
        {
          id: "frontend",
          label: "Frontend Application",
          type: "frontend",
          reason: "Provides the visual layer students interact with. Handles user input and displays data clearly."
        },
        {
          id: "backend",
          label: "Backend API",
          type: "backend",
          reason: "Centralizes application logic. Separates concerns from frontend. Makes code easier to debug and test."
        },
        {
          id: "auth",
          label: "Authentication Service",
          type: "auth",
          reason: "Security-critical operations isolated from other code. Protects user data. Industry standard practice."
        },
        {
          id: "database",
          label: "Database",
          type: "database",
          reason: "Stores user data, projects, and application state permanently. Survives server restarts."
        }
      ],
      edges: [
        {
          from: "frontend",
          to: "backend",
          label: "API calls",
          type: "request"
        },
        {
          from: "backend",
          to: "auth",
          label: "Verify identity",
          type: "request"
        },
        {
          from: "backend",
          to: "database",
          label: "Read/Write data",
          type: "data"
        }
      ]
    },
    reasoning: {
      overview: "This architecture follows a simple three-tier pattern suitable for beginner teams. The frontend handles what users see, the backend handles logic and security, and the database handles storage. Each piece has one clear job, making it easier to understand, build, and fix. We avoid complex patterns like microservices because your team is learning — simplicity beats premature optimization.",
      
      tradeoffs: [
        {
          decision: "Single backend service",
          pros: [
            "Simpler development and debugging",
            "Fewer moving parts to manage",
            "Easier deployment for small teams"
          ],
          cons: [
            "Limited independent scaling",
            "All code shares same runtime",
            "Cannot use different languages per service"
          ]
        },
        {
          decision: "Separate authentication service",
          pros: [
            "Security logic isolated from business logic",
            "Easier to audit and test",
            "Can be reused across projects"
          ],
          cons: [
            "Adds network latency for auth checks",
            "One more service to deploy and monitor"
          ]
        },
        {
          decision: "File storage separated from database",
          pros: [
            "Database stays fast and focused",
            "Easier to scale storage independently",
            "Standard industry practice"
          ],
          cons: [
            "More infrastructure to set up",
            "Slightly more complex backup strategy"
          ]
        }
      ],
      
      assumptions: [
        "Traffic remains low initially (hundreds, not thousands of concurrent users)",
        "No real-time features required (chat, live updates)",
        "Budget constraints limit infrastructure complexity",
        "Team is learning — simplicity is a feature, not a compromise",
        "Performance can be optimized later based on real usage data"
      ]
    }
  };
}
