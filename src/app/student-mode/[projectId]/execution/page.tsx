"use client";

import { useParams, useRouter } from "next/navigation";

function Phase({
  title,
  reason,
  components,
}: {
  title: string;
  reason: string;
  components: string[];
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded p-5">
      <h2 className="font-semibold text-lg">{title}</h2>
      <p className="text-sm text-zinc-400 mt-1">{reason}</p>

      <ul className="mt-3 space-y-1 text-sm">
        {components.map((c) => (
          <li key={c}>• {c}</li>
        ))}
      </ul>
    </div>
  );
}

export default function ExecutionPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold">Execution Plan</h1>
        <p className="text-zinc-400 mt-1">
          Build order and dependency phases
        </p>

        <div className="mt-8 space-y-6">
          <Phase
            title="Phase 1 – Foundation"
            reason="Core data and APIs must exist before services can function"
            components={["Primary Database", "Backend API"]}
          />

          <Phase
            title="Phase 2 – Application Logic"
            reason="Business logic depends on stable backend services"
            components={["User Service", "Order Service"]}
          />

          <Phase
            title="Phase 3 – Client Layer"
            reason="Frontend integrates once APIs are stable"
            components={["Frontend App"]}
          />
        </div>

        <button
          onClick={() => router.push(`/student-mode/${projectId}/risks`)}
          className="mt-6 p-3 bg-indigo-600 hover:bg-indigo-700 rounded font-semibold w-full"
        >
          View Risk Analysis →
        </button>

        <button
          onClick={() => router.push(`/student-mode/${projectId}/canvas`)}
          className="mt-4 px-4 py-2 text-sm text-zinc-400 hover:text-white transition"
        >
          ← Back to Canvas
        </button>
      </div>
    </div>
  );
}
