// src/lib/frontend/api.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchModules(projectId: string, token?: string): Promise<any> {
  const res = await fetch(`/api/generative/projects/${projectId}/modules`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchLatestSnapshot(projectId: string, token?: string): Promise<any> {
  const res = await fetch(`/api/generative/projects/${projectId}/snapshots?mode=latest`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveModuleEdits(projectId: string, moduleId: string, body: any, token?: string): Promise<any> {
  const res = await fetch(`/api/generative/projects/${projectId}/modules/${moduleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body)
  });
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function approveModule(projectId: string, moduleId: string, token?: string): Promise<any> {
  const res = await fetch(`/api/generative/projects/${projectId}/modules/${moduleId}/approve`, {
    method: "PATCH",
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function rejectModule(projectId: string, moduleId: string, token?: string): Promise<any> {
  const res = await fetch(`/api/generative/projects/${projectId}/modules/${moduleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ status: "rejected" })
  });
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function reorderModules(projectId: string, orderIds: string[], token?: string): Promise<any> {
  const res = await fetch(`/api/generative/projects/${projectId}/modules/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ order: orderIds })
  });
  return res.json();
}

export async function fetchConflicts(projectId: string, token?: string) {
  const res = await fetch(`/api/generative/projects/${projectId}/conflicts`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function resolveConflict(projectId: string, conflictId: string, action: string, params?: any, token?: string) {
  const res = await fetch(`/api/generative/projects/${projectId}/conflicts/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ conflictId, action, params })
  });
  return res.json();
}

export async function fetchModuleById(projectId: string, moduleId: string, token?: string) {
  const res = await fetch(`/api/generative/projects/${projectId}/modules/${moduleId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.json();
}

export async function fetchAudits(projectId: string, token?: string) {
  const res = await fetch(`/api/generative/projects/${projectId}/audits`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function distributeTeam(projectId: string, roster: any[], roleSkillMap?: any, token?: string) {
  const res = await fetch("/api/student/project/distribute", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ projectId, roster, roleSkillMap })
  });
  return res.json();
}

/**
 * Bulk approve or reject modules
 */
export async function bulkApproveModules(
  projectId: string, 
  moduleIds: string[], 
  action: "approve" | "reject", 
  token?: string
) {
  const res = await fetch(`/api/generative/projects/${projectId}/modules/bulk-approve`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      ...(token ? { Authorization: `Bearer ${token}` } : {}) 
    },
    body: JSON.stringify({ moduleIds, action })
  });
  return res.json();
}
