"use client";

import React, { useCallback, useState } from "react";
import { CheckCircle, Edit, HelpCircle, XCircle, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";

/**
 * ModuleInsights
 *
 * Props:
 * - projectId: string
 * - module: Module (shape from backend)
 * - snapshot?: Snapshot | null
 * - mock?: boolean (dev-only)
 * - onApproved?: (snapshot) => void  // called when approve returns a new snapshot
 * - onModified?: () => void
 * - onRejected?: () => void
 *
 * Notes:
 * - Uses fetch to call PATCH /modules/:id/approve and PATCH /modules/:id (for reject)
 * - Explain uses a mock call if server endpoint not present
 */

type Confidence = "high" | "medium" | "low";

interface Module {
  _id: string;
  name: string;
  description?: string;
  order?: number;
  status?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodes?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  edges?: any[];
  rationale?: string;
  ai_feedback?: {
    confidence?: Confidence;
    alternatives?: string[];
    resources?: string[];
    teachingTips?: string[];
    conflicts?: { code: string; message: string; resolution?: string }[];
    raw_llm_output?: string;
  };
}

interface Props {
  projectId: string;
  module: Module;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  snapshot?: any | null;
  mock?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onApproved?: (snapshot: any) => void;
  onModified?: () => void;
  onRejected?: () => void;
}

export default function ModuleInsights({ projectId, module, snapshot, mock = false, onApproved, onModified, onRejected }: Props) {
  const [loading, setLoading] = useState(false);
  const [explainText, setExplainText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const confidenceColor = (c?: Confidence) => {
    if (c === "high") return "bg-green-700 text-green-200";
    if (c === "medium") return "bg-yellow-800 text-yellow-200";
    return "bg-red-800 text-red-200";
  };

  const handleApprove = useCallback(async () => {
    if (!module) return;
    setLoading(true);
    setError(null);
    try {
      if (mock) {
        // Simulate snapshot creation
        const fakeSnapshot = { version: (snapshot?.version || 0) + 1, nodes: module.nodes || [], edges: module.edges || [], modules: [module._id] };
        setTimeout(() => {
          setLoading(false);
          onApproved?.(fakeSnapshot);
        }, 600);
        return;
      }

      const token = localStorage.getItem("token");
      const res = await fetch(`/api/generative/projects/${projectId}/modules/${module._id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "Approve failed");
      onApproved?.(j.snapshot);
    } catch (err: unknown) {
      console.error("Approve error", err);
      setError(String((err as Error)?.message || err));
    } finally {
      setLoading(false);
    }
  }, [projectId, module, mock, onApproved, snapshot]);

  const handleReject = useCallback(async () => {
    if (!module) return;
    const confirmReject = confirm(`Override module "${module.name}"? This will mark it for manual revision.`);
    if (!confirmReject) return;
    setLoading(true);
    setError(null);
    try {
      if (mock) {
        setTimeout(() => {
          setLoading(false);
          onRejected?.();
        }, 450);
        return;
      }
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/generative/projects/${projectId}/modules/${module._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "rejected" })
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "Reject failed");
      onRejected?.();
    } catch (err: unknown) {
      console.error("Reject error", err);
      setError(String((err as Error)?.message || err));
    } finally {
      setLoading(false);
    }
  }, [projectId, module, mock, onRejected]);

  const handleExplain = useCallback(async () => {
    if (!module) return;
    setLoading(true);
    setError(null);
    try {
      if (mock) {
        // quick canned explanation
        setExplainText(
          `Why "${module.name}"? Because this module handles ${module.nodes?.length || "N"} core components. For beginners: implement a REST API, connect to DB. For advanced: add idempotency and retries.`
        );
        setLoading(false);
        return;
      }
      // call explain endpoint (implement server-side if you want richer content)
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/generative/projects/${projectId}/modules/${module._id}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "Explain failed");
      setExplainText(j.explanation || JSON.stringify(j));
    } catch (err: unknown) {
      console.error("Explain error", err);
      setError(String((err as Error)?.message || err));
    } finally {
      setLoading(false);
    }
  }, [projectId, module, mock]);

  const handleModify = useCallback(() => {
    onModified?.();
  }, [onModified]);

  // conflict list (if LLM or merge engine produced conflicts)
  const conflicts = module?.ai_feedback?.conflicts || [];

  return (
    <aside className="h-full p-5 bg-zinc-900/60 backdrop-blur-sm border-l border-zinc-800/30 overflow-auto">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{module?.name || "Module"}</h3>
          <p className="text-xs text-zinc-400 mt-1">Step {module?.order || "?"} — review details</p>
        </div>
        <div className="text-right">
          <div className={clsx("px-3 py-1 rounded-full text-xs font-medium", confidenceColor(module?.ai_feedback?.confidence))}>
            {module?.ai_feedback?.confidence || "unknown"}
          </div>
        </div>
      </div>

      {/* Rationale */}
      <section className="mb-4">
        <h4 className="text-sm font-medium text-zinc-200 mb-2">Why this module?</h4>
        <p className="text-sm text-zinc-300 leading-relaxed">{module?.rationale || module?.ai_feedback?.raw_llm_output || "No rationale provided."}</p>
      </section>

      {/* Alternatives & Resources */}
      <section className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-zinc-200">Alternatives</h4>
        </div>
        <div className="space-y-2">
          {(module?.ai_feedback?.alternatives || []).length === 0 && <div className="text-xs text-zinc-500">No alternatives suggested.</div>}
          {(module?.ai_feedback?.alternatives || []).map((a: string, i: number) => (
            <div key={i} className="text-sm text-zinc-300 bg-zinc-800/40 p-2 rounded">{a}</div>
          ))}
        </div>

        <div className="mt-3">
          <h4 className="text-sm font-medium text-zinc-200 mb-2">Resources</h4>
          {(module?.ai_feedback?.resources || []).length === 0 && <div className="text-xs text-zinc-500">No resources.</div>}
          <ul className="space-y-2">
            {(module?.ai_feedback?.resources || []).map((r: string, i: number) => (
              <li key={i}><a className="text-sm text-indigo-300 hover:underline" target="_blank" rel="noreferrer" href={r}>{r}</a></li>
            ))}
          </ul>
        </div>
      </section>

      {/* Teaching tips */}
      <section className="mb-4">
        <h4 className="text-sm font-medium text-zinc-200 mb-2">Teaching tips</h4>
        <div className="text-sm text-zinc-300">{module?.ai_feedback?.teachingTips || "No specific tips — suggest breaking the module into 2 small tasks."}</div>
      </section>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <section className="mb-4">
          <h4 className="text-sm font-medium text-zinc-200 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-yellow-400" /> Conflicts</h4>
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {conflicts.map((c: any, i: number) => (
              <div key={i} className="p-2 rounded bg-zinc-800/40 text-sm">
                <div className="font-medium text-zinc-200">{c.code}</div>
                <div className="text-xs text-zinc-400">{c.message}</div>
                {c.resolution && <div className="text-xs text-zinc-300 mt-1">Fix: {c.resolution}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Explain output */}
      {explainText && (
        <section className="mb-4">
          <h4 className="text-sm font-medium text-zinc-200 mb-2">Explain — expanded</h4>
          <div className="text-sm text-zinc-300 whitespace-pre-wrap">{explainText}</div>
        </section>
      )}

      {/* Error */}
      {error && <div className="mb-4 text-sm text-red-400">{String(error)}</div>}

      {/* Actions */}
      <div className="mt-4 sticky bottom-6 bg-transparent pt-3">
        <div className="flex items-center gap-2">
          <Button onClick={handleApprove} disabled={loading || module?.status === "approved"} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-4 h-4 mr-2" /> {module?.status === "approved" ? "Accepted" : "Accept Decision"}
          </Button>

          <Button variant="outline" onClick={handleModify} disabled={loading}>
            <Edit className="w-4 h-4 mr-2" /> Modify
          </Button>

          <Button variant="outline" onClick={handleExplain} disabled={loading}>
            <HelpCircle className="w-4 h-4 mr-2" /> Explain
          </Button>

          <Button variant="outline" onClick={handleReject} disabled={loading} className="text-red-500">
            <XCircle className="w-4 h-4 mr-2" /> Override
          </Button>
        </div>
      </div>
    </aside>
  );
}
