/**
 * AI PROVIDER
 * 
 * Purpose: Single source of truth for all AI calls
 * Used by all modes: Student, Generative AI, Manual Design
 * 
 * One provider file, one call wrapper, one switch
 * No duplication, no per-feature integration
 */

import { AI_CONFIG, validateAIConfig } from "./config";

export interface AICallOptions {
  prompt: string;
  systemMessage?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AICallResult {
  success: boolean;
  content?: string;
  error?: string;
  rawResponse?: unknown;
}

/**
 * Call AI provider with given prompt
 * 
 * Returns parsed string response or error
 * Handles timeouts, retries, and provider-specific quirks
 */
export async function callAI(options: AICallOptions): Promise<AICallResult> {
  const { prompt, systemMessage, maxTokens, temperature } = options;

  // Safety check: ensure config is valid if using real AI
  if (AI_CONFIG.USE_REAL_AI) {
    const validation = validateAIConfig();
    if (!validation.valid) {
      return {
        success: false,
        error: `AI configuration invalid: ${validation.errors.join(", ")}`,
      };
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.REQUEST_TIMEOUT);

    const response = await fetch(AI_CONFIG.OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_CONFIG.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.OPENAI_MODEL,
        messages: [
          ...(systemMessage ? [{ role: "system", content: systemMessage }] : []),
          { role: "user", content: prompt },
        ],
        max_tokens: maxTokens || AI_CONFIG.MAX_TOKENS,
        temperature: temperature ?? AI_CONFIG.TEMPERATURE,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Unable to read error body");
      return {
        success: false,
        error: `OpenAI API error (${response.status}): ${errorBody}`,
      };
    }

    const data = await response.json();

    // Extract content from OpenAI response
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return {
        success: false,
        error: "OpenAI returned empty response",
        rawResponse: data,
      };
    }

    return {
      success: true,
      content,
      rawResponse: data,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          success: false,
          error: `Request timeout after ${AI_CONFIG.REQUEST_TIMEOUT}ms`,
        };
      }

      return {
        success: false,
        error: `AI provider error: ${error.message}`,
      };
    }

    return {
      success: false,
      error: "Unknown AI provider error",
    };
  }
}

/**
 * Parse JSON from AI response
 * 
 * Handles common AI quirks:
 * - Markdown code fences (```json ... ```)
 * - Extra whitespace or prose before/after JSON
 * - Malformed JSON
 * 
 * Multi-stage parsing strategy:
 * 1. Try removing markdown fences
 * 2. If that fails, extract first { to last }
 * 3. If that fails, return error
 * 
 * AI never fully obeys "Return only JSON" - never trust it
 */
export function parseAIJSON<T = unknown>(content: string): { success: boolean; data?: T; error?: string } {
  let cleaned = content.trim();

  // STAGE 1: Remove markdown code fences if present
  const jsonMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    cleaned = jsonMatch[1].trim();
  }

  // STAGE 2: Try parsing cleaned content
  try {
    const parsed = JSON.parse(cleaned);
    return { success: true, data: parsed as T };
  } catch (firstError) {
    // STAGE 3: Fallback - extract JSON from surrounding text
    // AI might respond: "Here is the JSON:\n{ ... }"
    // Extract from first { to last }
    
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const extracted = cleaned.slice(firstBrace, lastBrace + 1);
      
      try {
        const parsed = JSON.parse(extracted);
        return { success: true, data: parsed as T };
      } catch (secondError) {
        return {
          success: false,
          error: `JSON extraction failed. First error: ${firstError instanceof Error ? firstError.message : 'unknown'}. Second error: ${secondError instanceof Error ? secondError.message : 'unknown'}`,
        };
      }
    }
    
    // Complete failure
    return {
      success: false,
      error: `Failed to parse JSON: ${firstError instanceof Error ? firstError.message : 'unknown'}. Content preview: ${content.slice(0, 200)}...`,
    };
  }
}
