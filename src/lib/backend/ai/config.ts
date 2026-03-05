/**
 * AI PROVIDER CONFIGURATION
 * 
 * Centralized configuration for AI provider settings.
 * Controls mock vs real AI behavior with environment variables.
 * 
 * Usage:
 * - Development: USE_REAL_AI=false (default, uses mocks)
 * - Production:  USE_REAL_AI=true  (requires OPENAI_API_KEY)
 */

export const AI_CONFIG = {
  /**
   * Feature flag: Controls mock vs real AI
   * 
   * false = Use mock (deterministic, offline, free)
   * true  = Use real AI (requires API key)
   * 
   * Set via environment variable: USE_REAL_AI=true
   */
  USE_REAL_AI: process.env.USE_REAL_AI === "true",

  /**
   * OpenAI API configuration
   */
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4-turbo",
  OPENAI_API_URL: "https://api.openai.com/v1/chat/completions",

  /**
   * Safety limits
   * 
   * Temperature: 0.3 for structured output
   * - Architecture decisions must be deterministic
   * - Lower temp = less hallucination, better contract compliance
   */
  MAX_TOKENS: 4000,
  TEMPERATURE: 0.3,
  REQUEST_TIMEOUT: 90000, // 90 seconds (GPT-4-turbo needs more time)
};

/**
 * Validation: Check if AI provider is configured correctly
 */
export function validateAIConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (AI_CONFIG.USE_REAL_AI) {
    if (!AI_CONFIG.OPENAI_API_KEY) {
      errors.push("OPENAI_API_KEY environment variable is required when USE_REAL_AI=true");
    }

    if (AI_CONFIG.OPENAI_API_KEY && !AI_CONFIG.OPENAI_API_KEY.startsWith("sk-")) {
      errors.push("OPENAI_API_KEY appears invalid (should start with 'sk-')");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
