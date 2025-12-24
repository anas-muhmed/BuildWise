import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSnapshotPoll } from "@/hooks/useSnapshotPoll";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface BuilderStatusPanelProps {
  projectId: string;
  externalSnapshot?: any;
  onSnapshotUpdate?: (snapshot: any) => void;
}

export default function BuilderStatusPanel({ projectId, externalSnapshot, onSnapshotUpdate }: BuilderStatusPanelProps) {
  const router = useRouter();
  const { status, snapshot: polledSnapshot, error, startPolling, attempts } = useSnapshotPoll(projectId);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Use external snapshot if provided, otherwise use polled snapshot
  const snapshot = externalSnapshot ?? polledSnapshot;

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/student/project/${projectId}/seed`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      
      if (data.ok) {
        startPolling();
        // Notify parent to clear cached snapshot
        if (onSnapshotUpdate) onSnapshotUpdate(null);
      } else {
        alert(`Regeneration failed: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Regenerate error:", err);
      alert("Failed to regenerate. Check console.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const openEditor = () => {
    if (!snapshot) {
      alert("Snapshot not ready");
      return;
    }
    // Store snapshot in sessionStorage for instant editor bootstrap
    sessionStorage.setItem(`snapshot:${projectId}`, JSON.stringify(snapshot));
    router.push(`/student/${projectId}/builder`);
  };

  // Three explicit states: snapshot_missing, pending, ready
  const displayState = status === "idle" || status === "error" ? "snapshot_missing" : status;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
      <h4 className="text-lg font-semibold text-white">Ready to build?</h4>
      
      {/* State: snapshot_missing */}
      {displayState === "snapshot_missing" && (
        <div className="p-3 rounded bg-amber-900/20 border border-amber-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-amber-400 font-medium mb-1">Snapshot not created</p>
            <p className="text-amber-300/80 text-xs">
              Click Regenerate to create the initial scaffold.
            </p>
            {error && (
              <p className="text-red-400 text-xs mt-2">Error: {error}</p>
            )}
          </div>
        </div>
      )}

      {/* State: pending */}
      {displayState === "pending" && (
        <div className="p-3 rounded bg-blue-900/20 border border-blue-800 flex items-start gap-3">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin mt-0.5 flex-shrink-0" />
          <div className="text-sm flex-1">
            <p className="text-blue-400 font-medium mb-1">Preparing builder...</p>
            <p className="text-blue-300/80 text-xs mb-2">
              Generating architecture snapshot
            </p>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-blue-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min((attempts / 25) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1">Attempt {attempts}/25</p>
          </div>
        </div>
      )}

      {/* State: ready */}
      {displayState === "ready" && (
        <div className="p-3 rounded bg-green-900/20 border border-green-800 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-green-400 font-medium">Snapshot ready</p>
            <p className="text-green-300/80 text-xs">
              Your architecture is ready to edit.
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <button 
          disabled={displayState !== "ready"} 
          onClick={openEditor}
          title={displayState !== "ready" ? "Snapshot not ready. Regenerate or check logs." : ""}
          className="w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors"
        >
          Open Editor
        </button>
        
        <button 
          onClick={handleRegenerate}
          disabled={isRegenerating || displayState === "pending"}
          className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800/50 text-zinc-300 text-sm font-medium rounded hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRegenerating ? "Regenerating..." : "Regenerate"}
        </button>
      </div>

      {/* Debug logs link (dev only) */}
      {process.env.NODE_ENV === "development" && (
        <div className="pt-2 border-t border-zinc-800">
          <a 
            href={`/api/student/project/${projectId}/logs`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-500 hover:text-zinc-400 underline"
          >
            View generation logs →
          </a>
        </div>
      )}
    </div>
  );
}
