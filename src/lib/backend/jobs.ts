// src/lib/backend/jobs.ts
import { getLatestMockSnapshot } from "@/lib/backend/mocks/genai-v2-mock";
import { getProjectById, updateProject } from "./projects";
import { saveSnapshot } from "./snapshots";

interface SnapshotNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  meta: Record<string, unknown>;
}

interface SnapshotEdge {
  source: string;
  target: string;
  label: string;
}

function normalizeSnapshot(raw: Record<string, unknown>) {
  const s = { ...raw };
  // Remove mock _id - let MongoDB generate it
  delete s._id;
  s.version = s.version ?? Date.now();
  s.nodes = ((s.nodes || []) as unknown[]).map((n: unknown) => {
    const node = n as Record<string, unknown>;
    return {
      id: String(node.id ?? node._id ?? `node-${Math.floor(Math.random()*1e9)}`),
      label: node.label ?? node.name ?? "node",
      type: node.type ?? "service",
      x: typeof node.x === "number" ? node.x : 0,
      y: typeof node.y === "number" ? node.y : 0,
      meta: (node.meta as Record<string, unknown>) || {}
    } as SnapshotNode;
  });
  s.edges = ((s.edges || []) as unknown[]).map((e: unknown) => {
    const edge = e as Record<string, unknown>;
    return {
      source: edge.source ?? edge.from ?? edge.fromId,
      target: edge.target ?? edge.to ?? edge.toId,
      label: edge.label ?? ((edge.meta as Record<string, unknown>)?.protocol) ?? ""
    } as SnapshotEdge;
  }).filter((e: SnapshotEdge) => e.source && e.target);
  s.modules = s.modules || [];
  s.rationale = s.rationale || "";
  s.ai_feedback = s.ai_feedback || { confidence: "medium" };
  return s;
}

// Simple "enqueue" for local development: calls generator immediately.
// In production switch this to a real queue (bull/bee).
export async function enqueueSnapshotJob(projectId: string) {
  console.log('[job] enqueueSnapshotJob start', projectId);

  try {
    // Load project if needed
    const project = await getProjectById(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }
    const title = (project as Record<string, unknown>).title as string;
    const members = (project as Record<string, unknown>).members as unknown[] || [];
    console.log('[job] project loaded:', title || projectId, 'with', members.length, 'members');

    // Use mock generator
    const raw = getLatestMockSnapshot();

    if (!raw) {
      throw new Error('mock generator returned empty');
    }
    console.log('[job] raw snapshot generated, keys:', Object.keys(raw));

    const normalized = normalizeSnapshot(raw as unknown as Record<string, unknown>);
    console.log('[job] normalized snapshot, nodes:', (normalized.nodes as SnapshotNode[])?.length, 'edges:', (normalized.edges as SnapshotEdge[])?.length);

    // Respect privacy opt-in: only store raw LLM output if user opted in
    const privacy_opt_in = (project as Record<string, unknown>).privacy_opt_in as boolean;
    if (!privacy_opt_in) {
      // Remove raw LLM output if privacy_opt_in is false
      if (normalized.ai_feedback && typeof normalized.ai_feedback === 'object') {
        const feedback = normalized.ai_feedback as Record<string, unknown>;
        delete feedback.raw_llm_output;
      }
    }

    // Persist snapshot
    const saved = await saveSnapshot(projectId, normalized);

    console.log('[job] snapshot saved', saved._id, 'version', saved.version);

    // Return saved doc for caller
    return saved;
  } catch (err) {
    console.error('[job] snapshot generation failed for', projectId, err);
    // Optionally persist failure to project doc
    await updateProject(projectId, { status: 'snapshot_failed', lastError: String(err) }).catch(()=>{});
    throw err;
  }
}