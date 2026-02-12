/**
 * MANUAL DESIGN RESPONSE VALIDATOR
 * 
 * Purpose: Runtime validation of AI responses before they reach the UI
 * Prevents silent failures when USE_REAL_AI = true
 * 
 * This validator:
 * - Checks required fields exist
 * - Validates enum values (type, impact)
 * - Validates number ranges (scores 0-100)
 * - Validates array structures
 * - Rejects incomplete shapes
 * 
 * If AI returns wrong structure: return 500, log exact failure
 * No silent acceptance
 */

export interface ManualDesignFinding {
  type: "issue" | "suggestion" | "warning";
  title: string;
  description: string;
  impact: "low" | "medium" | "high";
  recommendation: string;
}

export interface ManualDesignAnalysisResponse {
  score: {
    overall: number;
    security: number;
    performance: number;
    cost: number;
  };
  findings: ManualDesignFinding[];
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

function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateManualDesignResponse(
  response: unknown
): ValidationResult<ManualDesignAnalysisResponse> {
  const errors: string[] = [];

  // Root level validation
  if (!isObject(response)) {
    return { success: false, errors: ["Response is not an object"] };
  }

  // Check required top-level fields exist
  if (!("score" in response)) {
    errors.push("Missing required field: 'score'");
  }
  if (!("findings" in response)) {
    errors.push("Missing required field: 'findings'");
  }
  if (!("assumptions" in response)) {
    errors.push("Missing required field: 'assumptions'");
  }

  // Early exit if top-level structure is wrong
  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Validate score
  if (!isObject(response.score)) {
    errors.push("'score' must be an object");
  } else {
    const score = response.score;
    
    // Check all score fields exist
    if (!("overall" in score)) errors.push("score.overall is required");
    if (!("security" in score)) errors.push("score.security is required");
    if (!("performance" in score)) errors.push("score.performance is required");
    if (!("cost" in score)) errors.push("score.cost is required");
    
    // Validate they're numbers and in valid range
    if (!isNumber(score.overall)) {
      errors.push("score.overall must be number");
    } else if (score.overall < 0 || score.overall > 100) {
      errors.push("score.overall must be between 0-100");
    }
    
    if (!isNumber(score.security)) {
      errors.push("score.security must be number");
    } else if (score.security < 0 || score.security > 100) {
      errors.push("score.security must be between 0-100");
    }
    
    if (!isNumber(score.performance)) {
      errors.push("score.performance must be number");
    } else if (score.performance < 0 || score.performance > 100) {
      errors.push("score.performance must be between 0-100");
    }
    
    if (!isNumber(score.cost)) {
      errors.push("score.cost must be number");
    } else if (score.cost < 0 || score.cost > 100) {
      errors.push("score.cost must be between 0-100");
    }
  }

  // Validate findings
  if (!isArray(response.findings)) {
    errors.push("'findings' must be an array");
  } else {
    response.findings.forEach((finding, idx) => {
      if (!isObject(finding)) {
        errors.push(`findings[${idx}] is not an object`);
        return;
      }
      
      // Check required fields exist
      if (!("type" in finding)) {
        errors.push(`findings[${idx}].type is required`);
      }
      if (!("title" in finding)) {
        errors.push(`findings[${idx}].title is required`);
      }
      if (!("description" in finding)) {
        errors.push(`findings[${idx}].description is required`);
      }
      if (!("impact" in finding)) {
        errors.push(`findings[${idx}].impact is required`);
      }
      if (!("recommendation" in finding)) {
        errors.push(`findings[${idx}].recommendation is required`);
      }
      
      // Validate enum values
      if (!["issue", "suggestion", "warning"].includes(finding.type as string)) {
        errors.push(`findings[${idx}].type must be one of: issue, suggestion, warning (got: ${finding.type})`);
      }
      
      if (!isString(finding.title)) {
        errors.push(`findings[${idx}].title must be string`);
      } else if (finding.title.trim() === "") {
        errors.push(`findings[${idx}].title cannot be empty`);
      }
      
      if (!isString(finding.description)) {
        errors.push(`findings[${idx}].description must be string`);
      } else if (finding.description.trim() === "") {
        errors.push(`findings[${idx}].description cannot be empty`);
      }
      
      if (!["low", "medium", "high"].includes(finding.impact as string)) {
        errors.push(`findings[${idx}].impact must be one of: low, medium, high (got: ${finding.impact})`);
      }
      
      if (!isString(finding.recommendation)) {
        errors.push(`findings[${idx}].recommendation must be string`);
      } else if (finding.recommendation.trim() === "") {
        errors.push(`findings[${idx}].recommendation cannot be empty`);
      }
    });
  }

  // Validate assumptions
  if (!isArray(response.assumptions)) {
    errors.push("'assumptions' must be an array");
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
    data: response as unknown as ManualDesignAnalysisResponse,
  };
}
