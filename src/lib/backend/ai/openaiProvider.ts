/**
 * OPENAI PROVIDER
 * 
 * Single responsibility: Call OpenAI API and return raw text.
 * No validation, no business logic — just the API call.
 * 
 * Uses native fetch (no SDK dependency needed).
 * Supports JSON mode for guaranteed valid JSON output.
 */

import { AI_CONFIG } from "./config";

interface OpenAIMessage {
  role: "system" | "user";
  content: string;
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call OpenAI API with JSON mode enabled
 * 
 * @param systemPrompt - System instructions (role + constraints)
 * @param userPrompt - User content (project context)
 * @param maxTokens - Optional token limit override (defaults to AI_CONFIG.MAX_TOKENS)
 * @returns Raw JSON string from OpenAI
 * @throws Error if API call fails
 */
export async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens?: number
): Promise<{ content: string; tokens?: number }> {
  const effectiveMaxTokens = maxTokens ?? AI_CONFIG.MAX_TOKENS;
  
  console.log("========================================");
  console.log("[OpenAI] API CALL INITIATED");
  console.log("[OpenAI] Config check:");
  console.log("  - USE_REAL_AI:", AI_CONFIG.USE_REAL_AI);
  console.log("  - API Key exists:", !!AI_CONFIG.OPENAI_API_KEY);
  console.log("  - API Key length:", AI_CONFIG.OPENAI_API_KEY?.length || 0);
  console.log("  - Model:", AI_CONFIG.OPENAI_MODEL);
  console.log("  - Max tokens:", effectiveMaxTokens, maxTokens ? "(custom)" : "(default)");
  console.log("  - Timeout:", AI_CONFIG.REQUEST_TIMEOUT);
  console.log("========================================");
  
  if (!AI_CONFIG.OPENAI_API_KEY) {
    console.error("[OpenAI] FATAL: API key not configured!");
    throw new Error("OpenAI API key not configured");
  }
  
  const messages: OpenAIMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_CONFIG.REQUEST_TIMEOUT);

  try {
    const response = await fetch(AI_CONFIG.OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_CONFIG.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.OPENAI_MODEL,
        messages,
        temperature: AI_CONFIG.TEMPERATURE,
        max_tokens: effectiveMaxTokens,
        response_format: { type: "json_object" }, // Forces valid JSON output
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
      throw new Error(
        `OpenAI API error (${response.status}): ${error.error?.message || JSON.stringify(error)}`
      );
    }

    const data: OpenAIResponse = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("[OpenAI] ERROR: Empty response from API");
      throw new Error("OpenAI returned empty response");
    }

    console.log("[OpenAI] ✅ SUCCESS! Response received");
    console.log("[OpenAI] Tokens used:", data.usage?.total_tokens || "unknown");
    console.log("[OpenAI] Content length:", content.length, "chars");
    console.log("========================================");

    // Validate JSON before returning (catch malformed responses early)
    if (content.length > 5000) {
      console.warn("[OpenAI] ⚠ WARNING: Response is very large (", content.length, "chars) - may be truncated or malformed");
    }
    
    try {
      JSON.parse(content); // Validate it's actually valid JSON
    } catch (parseError) {
      console.error("[OpenAI] ❌ INVALID JSON received from API!");
      console.error("[OpenAI] Content preview:", content.substring(0, 500));
      console.error("[OpenAI] Parse error:", parseError instanceof Error ? parseError.message : String(parseError));
      throw new Error("OpenAI returned invalid JSON: " + (parseError instanceof Error ? parseError.message : "Unknown parse error"));
    }

    return {
      content,
      tokens: data.usage?.total_tokens,
    };
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`OpenAI request timed out after ${AI_CONFIG.REQUEST_TIMEOUT}ms`);
    }

    throw error;
  }
}
