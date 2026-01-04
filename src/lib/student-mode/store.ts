import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data', 'student-mode');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read from disk
function loadFromDisk<T>(filename: string): Map<string, T> {
  const filepath = path.join(DATA_DIR, filename);
  if (fs.existsSync(filepath)) {
    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    return new Map(Object.entries(data));
  }
  return new Map();
}

// Helper to save to disk
function saveToDisk<T>(filename: string, map: Map<string, T>) {
  const filepath = path.join(DATA_DIR, filename);
  const data = Object.fromEntries(map);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
}

export type ProjectDefinition = {
  projectId: string;
  name: string;
  goal: string;
  audience: "customers" | "admins" | "both";
};

// Project Definition Store with disk persistence
const projectDefinitionMap = loadFromDisk<ProjectDefinition>('projects.json');
export const projectDefinitionStore = {
  get: (key: string) => projectDefinitionMap.get(key),
  set: (key: string, value: ProjectDefinition) => {
    projectDefinitionMap.set(key, value);
    saveToDisk('projects.json', projectDefinitionMap);
  },
  has: (key: string) => projectDefinitionMap.has(key),
};

// Reasoning Store with disk persistence
const reasoningMap = loadFromDisk<any>('reasoning.json');
export const reasoningStore = {
  get: (key: string) => reasoningMap.get(key),
  set: (key: string, value: any) => {
    reasoningMap.set(key, value);
    saveToDisk('reasoning.json', reasoningMap);
  },
  has: (key: string) => reasoningMap.has(key),
};

// Architecture Store with disk persistence
// Stores: { baseArchitecture, activeDecisions, architecture (computed) }
const architectureMap = loadFromDisk<any>('architecture.json');
export const architectureStore = {
  get: (key: string) => architectureMap.get(key),
  set: (key: string, value: any) => {
    architectureMap.set(key, value);
    saveToDisk('architecture.json', architectureMap);
  },
  has: (key: string) => architectureMap.has(key),
};

// Saved Designs Store with disk persistence
// Stores array of SavedDesign per projectId
const savedDesignsMap = loadFromDisk<any[]>('saved-designs.json');
export const savedDesignsStore = {
  get: (projectId: string) => savedDesignsMap.get(projectId) || [],
  add: (projectId: string, design: any) => {
    const existing = savedDesignsMap.get(projectId) || [];
    existing.push(design);
    savedDesignsMap.set(projectId, existing);
    saveToDisk('saved-designs.json', savedDesignsMap);
  },
  getById: (projectId: string, designId: string) => {
    const designs = savedDesignsMap.get(projectId) || [];
    return designs.find((d: any) => d.id === designId);
  },
};
