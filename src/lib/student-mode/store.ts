// In-memory store — works on Vercel serverless (no filesystem)
// Client-side localStorage handles the real persistence for student mode

export type ProjectDefinition = {
  projectId: string;
  name: string;
  goal: string;
  audience: "customers" | "admins" | "both";
};

const projectDefinitionMap = new Map<string, ProjectDefinition>();
export const projectDefinitionStore = {
  get: (key: string) => projectDefinitionMap.get(key),
  set: (key: string, value: ProjectDefinition) => {
    projectDefinitionMap.set(key, value);
  },
  has: (key: string) => projectDefinitionMap.has(key),
  clear: () => projectDefinitionMap.clear(),
};

const reasoningMap = new Map<string, any>();
export const reasoningStore = {
  get: (key: string) => reasoningMap.get(key),
  set: (key: string, value: any) => {
    reasoningMap.set(key, value);
  },
  has: (key: string) => reasoningMap.has(key),
  clear: () => reasoningMap.clear(),
};

const architectureMap = new Map<string, any>();
export const architectureStore = {
  get: (key: string) => architectureMap.get(key),
  set: (key: string, value: any) => {
    architectureMap.set(key, value);
  },
  has: (key: string) => architectureMap.has(key),
  clear: () => architectureMap.clear(),
};

const savedDesignsMap = new Map<string, any[]>();
export const savedDesignsStore = {
  get: (projectId: string) => savedDesignsMap.get(projectId) || [],
  add: (projectId: string, design: any) => {
    const existing = savedDesignsMap.get(projectId) || [];
    existing.push(design);
    savedDesignsMap.set(projectId, existing);
  },
  getById: (projectId: string, designId: string) => {
    const designs = savedDesignsMap.get(projectId) || [];
    return designs.find((d: any) => d.id === designId);
  },
};
