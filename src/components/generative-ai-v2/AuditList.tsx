"use client";

import React, { useEffect, useState } from "react";
import * as api from "@/lib/frontend/api";

/**
 * Simple admin Audit list UI
 */

export default function AuditList({ projectId }: { projectId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [audits, setAudits] = useState<any[]>([]);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") || undefined : undefined;

  useEffect(() => {
    (async () => {
      try {
        const res = await api.fetchAudits(projectId, token);
        if (res.ok) setAudits(res.audits || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [projectId, token]);

  if (!audits.length) return <div className="p-4 text-xs text-zinc-400">No audit events yet.</div>;

  return (
    <div className="p-4 space-y-3">
      {audits.map(a => (
        <div key={a._id} className="p-3 bg-zinc-900 border border-zinc-800 rounded">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white font-medium">{a.action}</div>
              <div className="text-xs text-zinc-400">{a.actor || "unknown"}</div>
            </div>
            <div className="text-xs text-zinc-500">{new Date(a.createdAt).toLocaleString()}</div>
          </div>
          <pre className="mt-2 text-xs text-zinc-300 max-h-36 overflow-auto whitespace-pre-wrap">{JSON.stringify(a.details || {}, null, 2)}</pre>
        </div>
      ))}
    </div>
  );
}
