"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function MaterializePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [graph, setGraph] = useState<any>(null);

  useEffect(() => {
    fetch("/api/student-mode/materialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    })
      .then((res) => res.json())
      .then((data) => {
        setGraph(data);
        setLoading(false);
      });
  }, [projectId]);

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Generating architecture…</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
      <div className="max-w-xl w-full space-y-6 text-center">

        <h1 className="text-2xl font-bold">Initial Architecture Generated</h1>

        <div className="bg-zinc-900 border border-zinc-800 rounded p-4 text-left">
          <pre className="text-sm text-zinc-300">
            {JSON.stringify(graph, null, 2)}
          </pre>
        </div>

        <button
          onClick={() => router.push(`/student-mode/${projectId}/canvas`)}
          className="w-full p-4 bg-indigo-600 hover:bg-indigo-700 rounded font-semibold"
        >
          Open Architecture Canvas →
        </button>
      </div>
    </div>
  );
}
