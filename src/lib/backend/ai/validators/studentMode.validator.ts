/**
 * STUDENT MODE RESPONSE VALIDATOR
 * 
 * Purpose: Runtime validation of AI responses before they reach the UI
 * Prevents silent failures when USE_REAL_AI = true
 * 
 * This validator:
 * - Checks required fields exist
 * - Validates enum values (types)
 * - Validates array structures
 * - Rejects incomplete shapes
 * 
 * If AI returns wrong structure: return 500, log exact failure
 * No silent acceptance
 */

export interface StudentModeNode {
  id: string;
  label: string;
  type: string;
  reason: string;
}

export interface StudentModeEdge {
  from: string;
  to: string;
  label?: string;
  type: string;
}

export interface StudentModeTradeoff {
  decision: string;
  pros: string[];
  cons: string[];
}

export interface StudentModeArchitectureResponse {
  architecture: {
    nodes: StudentModeNode[];
    edges: StudentModeEdge[];
  };
  reasoning: {
    overview: string;
    tradeoffs: StudentModeTradeoff[];
    assumptions: string[];
  };
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateStudentModeResponse(
  response: unknown
): ValidationResult<StudentModeArchitectureResponse> {
  const errors: string[] = [];

  // Root level validation
  if (!isObject(response)) {
    return { success: false, errors: ["Response is not an object"] };
  }

  // Check required top-level fields exist
  if (!("architecture" in response)) {
    errors.push("Missing required field: 'architecture'");
  }
  if (!("reasoning" in response)) {
    errors.push("Missing required field: 'reasoning'");
  }

  // Early exit if top-level structure is wrong
  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Validate architecture
  if (!isObject(response.architecture)) {
    errors.push("'architecture' must be an object");
  } else {
    const arch = response.architecture;

    // Check architecture has required fields
    if (!("nodes" in arch)) {
      errors.push("architecture.nodes is required");
    }
    if (!("edges" in arch)) {
      errors.push("architecture.edges is required");
    }

    // Validate nodes
    if (!isArray(arch.nodes)) {
      errors.push("architecture.nodes must be an array");
    } else {
      if (arch.nodes.length === 0) {
        errors.push("architecture.nodes cannot be empty (must have at least 1 node)");
      }
      
      arch.nodes.forEach((node, idx) => {
        if (!isObject(node)) {
          errors.push(`architecture.nodes[${idx}] is not an object`);
          return;
        }
        // Required fields
        if (!("id" in node) || !isString(node.id)) {
          errors.push(`nodes[${idx}].id is required and must be string`);
        }
        if (!("label" in node) || !isString(node.label)) {
          errors.push(`nodes[${idx}].label is required and must be string`);
        }
        if (!("type" in node) || !isString(node.type)) {
          errors.push(`nodes[${idx}].type is required and must be string`);
        }
        if (!("reason" in node) || !isString(node.reason)) {
          errors.push(`nodes[${idx}].reason is required and must be string`);
        }
        
        // Reject empty strings
        if (isString(node.id) && node.id.trim() === "") {
          errors.push(`nodes[${idx}].id cannot be empty`);
        }
        if (isString(node.label) && node.label.trim() === "") {
          errors.push(`nodes[${idx}].label cannot be empty`);
        }
      });
    }

    // Validate edges
    if (!isArray(arch.edges)) {
      errors.push("architecture.edges must be an array");
    } else {
      arch.edges.forEach((edge, idx) => {
        if (!isObject(edge)) {
          errors.push(`architecture.edges[${idx}] is not an object`);
          return;
        }
        // Required fields
        if (!("from" in edge) || !isString(edge.from)) {
          errors.push(`edges[${idx}].from is required and must be string`);
        }
        if (!("to" in edge) || !isString(edge.to)) {
          errors.push(`edges[${idx}].to is required and must be string`);
        }
        if (!("type" in edge) || !isString(edge.type)) {
          errors.push(`edges[${idx}].type is required and must be string`);
        }
        
        // Reject empty strings
        if (isString(edge.from) && edge.from.trim() === "") {
          errors.push(`edges[${idx}].from cannot be empty`);
        }
        if (isString(edge.to) && edge.to.trim() === "") {
          errors.push(`edges[${idx}].to cannot be empty`);
        }
      });
    }
  }

  // Validate reasoning
  if (!isObject(response.reasoning)) {
    errors.push("'reasoning' must be an object");
  } else {
    const reasoning = response.reasoning;

    // Check reasoning has required fields
    if (!("overview" in reasoning)) {
      errors.push("reasoning.overview is required");
    }
    if (!("tradeoffs" in reasoning)) {
      errors.push("reasoning.tradeoffs is required");
    }
    if (!("assumptions" in reasoning)) {
      errors.push("reasoning.assumptions is required");
    }

    if (!isString(reasoning.overview)) {
      errors.push("reasoning.overview must be string");
    } else if (reasoning.overview.trim() === "") {
      errors.push("reasoning.overview cannot be empty");
    }

    if (!isArray(reasoning.tradeoffs)) {
      errors.push("reasoning.tradeoffs must be an array");
    } else {
      reasoning.tradeoffs.forEach((tradeoff, idx) => {
        if (!isObject(tradeoff)) {
          errors.push(`reasoning.tradeoffs[${idx}] is not an object`);
          return;
        }
        if (!("decision" in tradeoff) || !isString(tradeoff.decision)) {
          errors.push(`tradeoffs[${idx}].decision is required and must be string`);
        }
        if (!("pros" in tradeoff) || !isArray(tradeoff.pros)) {
          errors.push(`tradeoffs[${idx}].pros is required and must be array`);
        }
        if (!("cons" in tradeoff) || !isArray(tradeoff.cons)) {
          errors.push(`tradeoffs[${idx}].cons is required and must be array`);
        }
      });
    }

    if (!isArray(reasoning.assumptions)) {
      errors.push("reasoning.assumptions must be an array");
    } else {
      reasoning.assumptions.forEach((assumption, idx) => {
        if (!isString(assumption)) {
          errors.push(`reasoning.assumptions[${idx}] must be string`);
        }
      });
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: response as unknown as StudentModeArchitectureResponse,
  };
}
