"use client";

import { useParams } from "next/navigation";

export default function BuilderPreviewPage() {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Architecture Materialization</h1>
        <p className="text-zinc-400">Project: {projectId}</p>
        <p className="text-zinc-500 text-sm">Module 3 — Coming Soon</p>
      </div>
    </div>
  );
}
