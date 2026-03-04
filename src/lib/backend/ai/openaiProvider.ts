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
 * @returns Raw JSON string from OpenAI
 * @throws Error if API call fails
 */
export async function callOpenAI(
  systemPrompt: string,
  userPrompt: string
): Promise<{ content: string; tokens?: number }> {
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
        max_tokens: AI_CONFIG.MAX_TOKENS,
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
      throw new Error("OpenAI returned empty response");
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
