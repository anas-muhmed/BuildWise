"use client";

import React from "react";

type DiffModalProps = {
  open: boolean;
  onClose: () => void;
  before: {
    nodes: unknown[];
    edges: unknown[];
  };
  after: {
    nodes: unknown[];
    edges: unknown[];
  };
};

/**
 * Diff modal - shows before/after JSON comparison
 */
export default function DiffModal({ open, onClose, before, after }: DiffModalProps) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative max-w-4xl w-full bg-zinc-900 border border-zinc-800 rounded p-4 z-10 max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Proposed Diff Preview</h3>
          <button 
            className="text-zinc-400 hover:text-white" 
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-zinc-400 mb-2">Before (JSON)</div>
            <pre className="max-h-64 overflow-auto text-xs text-zinc-300 bg-zinc-800 p-2 rounded">
              {JSON.stringify(before, null, 2)}
            </pre>
          </div>
          <div>
            <div className="text-xs text-zinc-400 mb-2">After (JSON)</div>
            <pre className="max-h-64 overflow-auto text-xs text-zinc-300 bg-zinc-800 p-2 rounded">
              {JSON.stringify(after, null, 2)}
            </pre>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button 
            onClick={onClose} 
            className="px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
