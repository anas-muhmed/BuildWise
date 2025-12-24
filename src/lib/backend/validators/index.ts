// src/lib/backend/validators/index.ts
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { ModuleJsonSchema } from "./module.schema";

const ajv = new Ajv({ allErrors: true, removeAdditional: true });
addFormats(ajv);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateModule = (data: any) => {
  const validate = ajv.compile(ModuleJsonSchema);
  const valid = validate(data);
  return { valid: !!valid, errors: validate.errors };
};
