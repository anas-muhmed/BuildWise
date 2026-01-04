import { Skill } from "./team-types";

/**
 * Maps architecture node types to required skills
 * Deterministic and teacher-proof
 */
export function skillForNode(type: string): Skill {
  switch (type) {
    case "frontend":
      return "frontend";
    
    case "backend":
    case "auth":
    case "realtime":
    case "api":
      return "backend";
    
    case "database":
    case "read_replica":
      return "database";
    
    case "cache":
    case "queue":
    case "load_balancer":
    case "cdn":
      return "devops";
    
    default:
      return "backend"; // default to backend for unknown types
  }
}
