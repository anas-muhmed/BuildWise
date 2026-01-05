"use client";

import { useParams, useRouter } from "next/navigation";

function RiskCard({
  title,
  component,
  issue,
  mitigation,
}: {
  title: string;
  component: string;
  issue: string;
  mitigation: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded p-5">
      <h2 className="font-semibold text-lg">{title}</h2>
      <p className="text-sm text-zinc-400 mt-1">
        Affected: {component}
      </p>

      <p className="mt-3 text-sm">
        <span className="text-red-400">Risk:</span> {issue}
      </p>

      <p className="mt-2 text-sm">
        <span className="text-green-400">Mitigation:</span> {mitigation}
      </p>
    </div>
  );
}

export default function RiskAnalysisPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold">Risk & Bottleneck Analysis</h1>
        <p className="text-zinc-400 mt-1">
          Potential failure points and mitigation strategies
        </p>

        <div className="mt-8 space-y-6">
          <RiskCard
            title="Single Database Dependency"
            component="Primary Database"
            issue="Database failure causes total system outage"
            mitigation="Add read replicas and regular backups"
          />

          <RiskCard
            title="Backend API Bottleneck"
            component="Backend API"
            issue="All services depend on a single API layer"
            mitigation="Introduce service-level separation or caching"
          />

          <RiskCard
            title="Frontend Release Dependency"
            component="Frontend App"
            issue="Frontend blocked until backend APIs stabilize"
            mitigation="Use API contracts and mock services"
          />
        </div>

        <button
          onClick={() => router.push(`/student-mode/${projectId}/execution`)}
          className="mt-8 px-4 py-2 text-sm text-zinc-400 hover:text-white transition"
        >
          ← Back to Execution Plan
        </button>
      </div>
    </div>
  );
}
