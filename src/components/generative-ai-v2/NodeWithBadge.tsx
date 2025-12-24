"use client";

import React from "react";

type NodeWithBadgeProps = {
  data: {
    label: string;
    status?: string;
    author?: string;
  };
};

/**
 * Node renderer for React Flow nodes with status badge
 * Expects node.data to contain:
 *  - label: string
 *  - status: 'proposed' | 'approved' | 'modified'
 *  - author: string (userId or name)
 */
export default function NodeWithBadge({ data }: NodeWithBadgeProps) {
  const { label, status, author } = data;
  
  const statusColor = 
    status === "approved" 
      ? "bg-emerald-500 text-white" 
      : status === "proposed" 
      ? "bg-yellow-500 text-black" 
      : status === "modified"
      ? "bg-indigo-500 text-white"
      : "bg-zinc-500 text-white";
  
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded p-2 min-w-[160px] shadow-lg">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="text-sm font-medium text-white">{label}</div>
          {author && (
            <div className="text-xs text-zinc-400">by {author}</div>
          )}
        </div>
        {status && (
          <div className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
