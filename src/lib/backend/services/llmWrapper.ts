// src/lib/backend/services/llmWrapper.ts
import Ajv from "ajv";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { AuditModel } from "@/lib/backend/models/Audit";

type LLMCallOptions = {
  projectId: string;
  prompt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validateSchema: any;
  storeRaw?: boolean;
};

/**
 * LLM wrapper that validates output and respects privacy settings
 * @param options - LLM call configuration
 * @returns Validated LLM output
 */
export async function callLLMAndValidate({ 
  projectId, 
  prompt, 
  validateSchema, 
  storeRaw 
}: LLMCallOptions) {
  // This is a wrapper — integrate your provider (OpenAI etc) here.
  // For now, use mock if no provider configured.
  const mockOutput = { 
    nodes: [], 
    edges: [], 
    rationale: "mock response" 
  };

  // Example: if real provider set, call it.
  // const provider = getOpenAIProvider();
  // const llmOutput = await provider.call(prompt);

  const llmOutput = mockOutput; // replace with real call

  // Validate with AJV
  const ajv = new Ajv();
  const validate = ajv.compile(validateSchema);
  const valid = validate(llmOutput);
  
  if (!valid) {
    await AuditModel.create({ 
      projectId, 
      action: "llm_validation_failed", 
      actor: null, 
      details: { errors: validate.errors } 
    });
    throw new Error("LLM output failed validation");
  }

  // Respect privacy flag: if storeRaw === true, persist raw output; otherwise only store structured.
  if (storeRaw) {
    // Save raw LLM output to project's rawLLMOutputs array
    try {
      const proj = await StudentProject.findById(projectId);
      if (proj && proj.storeRawLLMOutput) {
        const rawOutputs = proj.get("rawLLMOutputs") || [];
        rawOutputs.push({ 
          prompt, 
          output: llmOutput, 
          createdAt: new Date() 
        });
        proj.set("rawLLMOutputs", rawOutputs);
        await proj.save();
      }
    } catch (e) {
      console.warn("failed to save raw llm output", e);
    }
  }

  return llmOutput;
}

/**
 * Example schema for architecture generation
 */
export const architectureSchema = {
  type: "object",
  properties: {
    nodes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string" },
          label: { type: "string" }
        },
        required: ["id", "type"]
      }
    },
    edges: {
      type: "array",
      items: {
        type: "object",
        properties: {
          from: { type: "string" },
          to: { type: "string" }
        },
        required: ["from", "to"]
      }
    },
    rationale: { type: "string" }
  },
  required: ["nodes", "edges"]
};
