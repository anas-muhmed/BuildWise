import { ConstraintResult } from "./types";

export function checkBackendConstraints(
  backendType: "monolith" | "microservices",
  context: {
    teamSize: number;
    experienceLevel: "beginner" | "intermediate";
  }
): ConstraintResult {
  if (backendType === "microservices" && context.teamSize < 3) {
    return {
      allowed: false,
      violation: {
        reason: "Microservices need at least 3 developers to manage services, APIs, and deployments.",
        affectedNodeType: "backend",
        fixes: [
          {
            id: "change-to-monolith",
            label: "Change to Monolith",
            description: "Small teams work better with unified codebases",
            action: {
              type: 'UPDATE_DECISION',
              payload: {
                key: 'backendType',
                value: 'monolith',
              },
            },
          },
        ],
      }
    };
  }

  if (backendType === "microservices" && context.experienceLevel === "beginner") {
    return {
      allowed: false,
      violation: {
        reason: "Microservices add operational complexity not suitable for beginners.",
        affectedNodeType: "backend",
        fixes: [
          {
            id: "change-to-monolith",
            label: "Change to Monolith",
            description: "Simpler architecture for learning",
            action: {
              type: 'UPDATE_DECISION',
              payload: {
                key: 'backendType',
                value: 'monolith',
              },
            },
          },
        ],
      }
    };
  }

  return { allowed: true };
}
