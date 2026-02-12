/**
 * GENERATIVE AI RESPONSE VALIDATOR
 * 
 * Purpose: Runtime validation of AI responses before they reach the UI
 * Prevents silent failures when USE_REAL_AI = true
 * 
 * This validator:
 * - Checks required fields exist
 * - Validates enum values (category, confidence)
 * - Validates array structures
 * - Validates module dependencies
 * - Rejects incomplete shapes
 * 
 * If AI returns wrong structure: return 500, log exact failure
 * No silent acceptance
 */

export interface ArchitecturalDecision {
  category: string;
  choice: string;
  reasoning: string;
  alternatives: string[];
  confidence: "high" | "medium" | "low";
}

export interface ArchitectureModule {
  name: string;
  responsibility: string;
  depends_on: string[];
}

export interface GenerativeAIArchitectureResponse {
  decisions: ArchitecturalDecision[];
  architecture: {
    modules: ArchitectureModule[];
  };
  assumptions: string[];
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

const VALID_CATEGORIES = ["authentication", "database", "hosting", "cache", "messaging", "storage", "other"];
const VALID_CONFIDENCE = ["high", "medium", "low"];

export function validateGenerativeAIResponse(
  response: unknown
): ValidationResult<GenerativeAIArchitectureResponse> {
  const errors: string[] = [];

  if (!isObject(response)) {
    return { success: false, errors: ["Response is not an object"] };
  }

  // Check required top-level fields exist
  if (!("decisions" in response)) {
    errors.push("Missing required field: decisions");
  }
  if (!("architecture" in response)) {
    errors.push("Missing required field: architecture");
  }
  if (!("assumptions" in response)) {
    errors.push("Missing required field: assumptions");
  }

  // Validate decisions
  if (!isArray(response.decisions)) {
    errors.push("Missing or invalid 'decisions' field");
  } else {
    if (response.decisions.length === 0) {
      errors.push("decisions array cannot be empty");
    }

    response.decisions.forEach((decision, idx) => {
      if (!isObject(decision)) {
        errors.push(`decisions[${idx}] is not an object`);
        return;
      }

      // Check required fields exist
      if (!("category" in decision)) {
        errors.push(`decisions[${idx}] missing required field: category`);
      } else {
        if (!isString(decision.category)) {
          errors.push(`decisions[${idx}].category must be string`);
        } else if (decision.category.trim() === "") {
          errors.push(`decisions[${idx}].category cannot be empty`);
        } else if (!VALID_CATEGORIES.includes(decision.category)) {
          errors.push(`decisions[${idx}].category must be one of: ${VALID_CATEGORIES.join(", ")} (got: ${decision.category})`);
        }
      }

      if (!("choice" in decision)) {
        errors.push(`decisions[${idx}] missing required field: choice`);
      } else if (!isString(decision.choice) || decision.choice.trim() === "") {
        errors.push(`decisions[${idx}].choice must be non-empty string`);
      }

      if (!("reasoning" in decision)) {
        errors.push(`decisions[${idx}] missing required field: reasoning`);
      } else if (!isString(decision.reasoning) || decision.reasoning.trim() === "") {
        errors.push(`decisions[${idx}].reasoning must be non-empty string`);
      }

      if (!("alternatives" in decision)) {
        errors.push(`decisions[${idx}] missing required field: alternatives`);
      } else if (!isArray(decision.alternatives)) {
        errors.push(`decisions[${idx}].alternatives must be array`);
      }

      if (!("confidence" in decision)) {
        errors.push(`decisions[${idx}] missing required field: confidence`);
      } else if (!VALID_CONFIDENCE.includes(decision.confidence as string)) {
        errors.push(`decisions[${idx}].confidence must be one of: ${VALID_CONFIDENCE.join(", ")} (got: ${decision.confidence})`);
      }
    });
  }

  // Validate architecture
  if (!isObject(response.architecture)) {
    errors.push("Missing or invalid 'architecture' field");
  } else {
    const arch = response.architecture;

    if (!("modules" in arch)) {
      errors.push("architecture missing required field: modules");
    } else if (!isArray(arch.modules)) {
      errors.push("architecture.modules must be an array");
    } else {
      if (arch.modules.length === 0) {
        errors.push("architecture.modules array cannot be empty");
      }

      // Collect all module names for dependency validation
      const moduleNames = new Set<string>();
      arch.modules.forEach((module) => {
        if (isObject(module) && isString(module.name)) {
          moduleNames.add(module.name);
        }
      });

      arch.modules.forEach((module, idx) => {
        if (!isObject(module)) {
          errors.push(`architecture.modules[${idx}] is not an object`);
          return;
        }

        if (!("name" in module)) {
          errors.push(`modules[${idx}] missing required field: name`);
        } else if (!isString(module.name) || module.name.trim() === "") {
          errors.push(`modules[${idx}].name must be non-empty string`);
        }

        if (!("responsibility" in module)) {
          errors.push(`modules[${idx}] missing required field: responsibility`);
        } else if (!isString(module.responsibility) || module.responsibility.trim() === "") {
          errors.push(`modules[${idx}].responsibility must be non-empty string`);
        }

        if (!("depends_on" in module)) {
          errors.push(`modules[${idx}] missing required field: depends_on`);
        } else if (!isArray(module.depends_on)) {
          errors.push(`modules[${idx}].depends_on must be array`);
        } else {
          // Validate each dependency references a valid module
          module.depends_on.forEach((dep, depIdx) => {
            if (!isString(dep)) {
              errors.push(`modules[${idx}].depends_on[${depIdx}] must be string`);
            } else if (dep.trim() === "") {
              errors.push(`modules[${idx}].depends_on[${depIdx}] cannot be empty`);
            } else if (!moduleNames.has(dep)) {
              errors.push(`modules[${idx}].depends_on[${depIdx}] references unknown module: ${dep}`);
            }
          });
        }
      });
    }
  }

  // Validate assumptions
  if (!isArray(response.assumptions)) {
    errors.push("Missing or invalid 'assumptions' field");
  } else if (response.assumptions.length === 0) {
    errors.push("assumptions array cannot be empty (AI must document what it assumes)");
  } else {
    response.assumptions.forEach((assumption, idx) => {
      if (!isString(assumption)) {
        errors.push(`assumptions[${idx}] must be string`);
      } else if (assumption.trim() === "") {
        errors.push(`assumptions[${idx}] cannot be empty`);
      }
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: response as GenerativeAIArchitectureResponse,
  };
}
