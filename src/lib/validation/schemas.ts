// lib/validation/schemas.ts
// Centralized validation schemas for API endpoints

export interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: any;
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates project ID format
 */
export function validateProjectId(id: string): ValidationResult {
  if (!id || typeof id !== "string") {
    return { valid: false, error: "Project ID required" };
  }
  if (id.length < 3 || id.length > 100) {
    return { valid: false, error: "Invalid project ID length" };
  }
  return { valid: true };
}

/**
 * Validates decision payload
 */
export function validateDecisionPayload(body: any): ValidationResult {
  if (!body) {
    return { valid: false, error: "Request body required" };
  }

  const { projectId, decisionId } = body;

  if (!projectId || typeof projectId !== "string") {
    return { valid: false, error: "Valid projectId required" };
  }

  if (!decisionId || typeof decisionId !== "string") {
    return { valid: false, error: "Valid decisionId required" };
  }

  return { valid: true, data: { projectId, decisionId } };
}

/**
 * Validates design save payload
 */
export function validateDesignPayload(body: any): ValidationResult {
  if (!body) {
    return { valid: false, error: "Request body required" };
  }

  const { projectId, components, edges } = body;

  if (!projectId || typeof projectId !== "string") {
    return { valid: false, error: "Valid projectId required" };
  }

  if (!Array.isArray(components)) {
    return { valid: false, error: "Components must be an array" };
  }

  if (!Array.isArray(edges)) {
    return { valid: false, error: "Edges must be an array" };
  }

  return { valid: true, data: { projectId, components, edges } };
}

/**
 * Validates student project payload
 */
export function validateStudentProjectPayload(body: any): ValidationResult {
  if (!body) {
    return { valid: false, error: "Request body required" };
  }

  const { appType, skillLevel } = body;

  if (!appType || typeof appType !== "string") {
    return { valid: false, error: "appType required" };
  }

  if (skillLevel && !["beginner", "intermediate", "advanced"].includes(skillLevel)) {
    return { valid: false, error: "Invalid skillLevel. Must be: beginner, intermediate, or advanced" };
  }

  return { valid: true, data: body };
}

/**
 * Validates version compare payload
 */
export function validateVersionComparePayload(body: any): ValidationResult {
  if (!body) {
    return { valid: false, error: "Request body required" };
  }

  const { projectId, versionAId, versionBId } = body;

  if (!projectId) {
    return { valid: false, error: "projectId required" };
  }

  if (!versionAId || !versionBId) {
    return { valid: false, error: "Both versionAId and versionBId required" };
  }

  return { valid: true, data: { projectId, versionAId, versionBId } };
}

/**
 * Sanitizes user input to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";
  
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim()
    .slice(0, 1000); // Limit length
}

/**
 * Validates and sanitizes user registration
 */
export function validateRegistration(body: any): ValidationResult {
  if (!body) {
    return { valid: false, error: "Request body required" };
  }

  const { name, email, password } = body;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return { valid: false, error: "Valid name required (min 2 characters)" };
  }

  if (!email || !validateEmail(email)) {
    return { valid: false, error: "Valid email required" };
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    return { valid: false, error: "Password must be at least 6 characters" };
  }

  return {
    valid: true,
    data: {
      name: sanitizeString(name),
      email: email.toLowerCase().trim(),
      password, // Don't sanitize password
    },
  };
}

/**
 * Validates login payload
 */
export function validateLogin(body: any): ValidationResult {
  if (!body) {
    return { valid: false, error: "Request body required" };
  }

  const { email, password } = body;

  if (!email || !validateEmail(email)) {
    return { valid: false, error: "Valid email required" };
  }

  if (!password || typeof password !== "string") {
    return { valid: false, error: "Password required" };
  }

  return {
    valid: true,
    data: {
      email: email.toLowerCase().trim(),
      password,
    },
  };
}
