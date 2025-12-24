"use client";

import React, { useState } from "react";
import DiffModal from "./DiffModal";
import { Button } from "@/components/ui/button";

type Node = {
  id: string;
  type: string;
  label?: string;
  position?: { x: number; y: number };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: any;
};

type Edge = {
  from: string;
  to: string;
  label?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: any;
};

type ModuleCanvasProposeProps = {
  projectId: string;
  moduleId: string;
  currentNodes: Node[];
  currentEdges: Edge[];
  draftNodes: Node[];
  draftEdges: Edge[];
  onProposeSuccess?: () => void;
};

/**
 * Component for proposing edits to a module
 * Shows Preview Diff and Propose Edits buttons
 */
export default function ModuleCanvasPropose({ 
  projectId, 
  moduleId, 
  currentNodes, 
  currentEdges,
  draftNodes,
  draftEdges,
  onProposeSuccess
}: ModuleCanvasProposeProps) {
  const [showDiff, setShowDiff] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const token = typeof window !== "undefined" 
    ? localStorage.getItem("token") || undefined 
    : undefined;

  function computeDiff() {
    // Simple diff: send the whole nodes/edges as patch; server will dedupe/replace by id
    return { nodes: draftNodes, edges: draftEdges };
  }

  async function handlePropose() {
    setLoading(true);
    setError(null);
    
    try {
      const diff = computeDiff();
      const res = await fetch(
        `/api/generative/projects/${projectId}/modules/${moduleId}/propose`, 
        {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json", 
            ...(token ? { Authorization: `Bearer ${token}` } : {}) 
          },
          body: JSON.stringify({ diff })
        }
      );
      
      const j = await res.json();
      
      if (!j.ok) {
        setError(j.error || "propose failed");
        return;
      }
      
      setShowDiff(false);
      onProposeSuccess?.();
      
      // Show success message
      alert("Proposed edits submitted successfully!");
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err?.message || "Failed to propose edits");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => setShowDiff(true)}
          disabled={loading}
        >
          Preview Diff
        </Button>
        <Button 
          onClick={handlePropose}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {loading ? "Proposing..." : "Propose Edits"}
        </Button>
      </div>

      {error && (
        <div className="mt-2 text-xs text-red-500">
          {error}
        </div>
      )}

      {showDiff && (
        <DiffModal
          open={showDiff}
          onClose={() => setShowDiff(false)}
          before={{ nodes: currentNodes, edges: currentEdges }}
          after={{ nodes: draftNodes, edges: draftEdges }}
        />
      )}
    </div>
  );
}
