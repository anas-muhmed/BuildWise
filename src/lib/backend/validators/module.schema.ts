// src/lib/backend/validators/module.schema.ts
export const ModuleJsonSchema = {
  type: "object",
  required: ["projectId","name","nodes","edges","order"],
  properties: {
    projectId: { type: "string" },
    name: { type: "string" },
    order: { type: "number" },
    nodes: {
      type: "array",
      items: {
        type: "object",
        required: ["id","type"],
        properties: {
          id: { type: "string" },
          type: { type: "string" },
          label: { type: ["string","null"] },
          meta: { type: ["object","null"] }
        }
      }
    },
    edges: {
      type: "array",
      items: {
        type: "object",
        required: ["from","to"],
        properties: {
          from: { type: "string" },
          to: { type: "string" },
          meta: { type: ["object","null"] }
        }
      }
    },
    rationale: { type: ["string","null"] },
    ai_feedback: { type: ["object","null"] }
  }
};
