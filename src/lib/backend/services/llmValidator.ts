// lib/backend/services/llmValidator.ts
import Ajv from "ajv";

/**
 * 🎯 PHASE 3: LLM Validator - Master's AJV Schema
 * Strict JSON validation for LLM module outputs
 */

const ajv = new Ajv({ allErrors: true, removeAdditional: true });

interface LLMModuleOutput {
  module_name: string;
  nodes: {
    id: string;
    type: string;
    label?: string;
    meta?: Record<string, unknown>;
  }[];
  edges: {
    from: string;
    to: string;
    meta?: Record<string, unknown>;
  }[];
  rationale: string;
  confidence: "low" | "medium" | "high";
}

const moduleSchema = {
  type: "object",
  required: ["module_name", "nodes", "edges", "rationale", "confidence"],
  additionalProperties: false,
  properties: {
    module_name: { type: "string" },
    nodes: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "type"],
        properties: {
          id: { type: "string" },
          type: { type: "string" },
          label: { type: "string", nullable: true },
          meta: { type: "object", nullable: true, required: [] }
        },
        additionalProperties: false
      }
    },
    edges: {
      type: "array",
      items: {
        type: "object",
        required: ["from", "to"],
        properties: {
          from: { type: "string" },
          to: { type: "string" },
          meta: { type: "object", nullable: true, required: [] }
        },
        additionalProperties: false
      }
    },
    rationale: { type: "string" },
    confidence: { type: "string", enum: ["low", "medium", "high"] }
  }
};

const validateModule = ajv.compile(moduleSchema);

export function validateLLMModule(obj: unknown): { 
  valid: boolean; 
  value?: LLMModuleOutput; 
  errors?: unknown[] 
} {
  const valid = validateModule(obj);
  if (!valid) {
    return { valid: false, errors: validateModule.errors || [] };
  }
  // Type assertion after Ajv validation
  return { valid: true, value: obj as unknown as LLMModuleOutput };
}
