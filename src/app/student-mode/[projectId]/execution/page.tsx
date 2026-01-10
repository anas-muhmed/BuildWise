"use client";

import { useParams, useRouter } from "next/navigation";

export default function ExecutionBlueprintPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-8 pt-12 mb-12">
        <div className="text-center space-y-3 mb-6">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 blur-3xl"></div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent relative">
              Execution Blueprint
            </h1>
          </div>
        </div>
        <p className="text-zinc-400 text-lg text-center">
          This page converts your architecture into a clear, step-by-step build plan.
          No theory. Only execution.
        </p>
      </div>

      {/* Before You Start */}
      <Section title="Before You Start Coding">
        <ul className="list-disc ml-6 space-y-2 text-zinc-300">
          <li>Architecture decisions are now frozen</li>
          <li>Do not add new components unless requirements change</li>
          <li>This plan assumes a small student team or solo developer</li>
        </ul>
      </Section>

      {/* Execution Checklist */}
      <Section title="Execution Checklist (Recommended Order)">
        <Phase
          title="Week 0 – Project Setup"
          items={[
            "Create frontend and backend repositories",
            "Set up environment variables",
            "Initialize database connection",
            "Decide folder and naming conventions",
          ]}
        />

        <Phase
          title="Week 1 – Foundation"
          items={[
            "Design database schema",
            "Create core backend APIs",
            "Add basic validation and error handling",
            "Test APIs using Postman or similar tool",
          ]}
        />

        <Phase
          title="Week 2 – Core Features"
          items={[
            "Build frontend screens",
            "Connect frontend to backend APIs",
            "Handle authentication and user flows",
            "Ensure end-to-end data persistence",
          ]}
        />

        <Phase
          title="Week 3 – Optimization (Optional)"
          items={[
            "Add cache only if performance issues appear",
            "Introduce queues only if async processing is required",
            "Improve logging and error reporting",
          ]}
        />
      </Section>

      {/* What NOT To Do */}
      <Section title="What NOT To Do Yet">
        <ul className="list-disc ml-6 space-y-2 text-red-400">
          <li>Do not add microservices without real scaling needs</li>
          <li>Do not optimize performance without metrics</li>
          <li>Do not introduce complex infrastructure for small projects</li>
        </ul>
      </Section>

      {/* Definition of Done */}
      <Section title="Definition of Done (Student Level)">
        <ul className="list-disc ml-6 space-y-2 text-green-400">
          <li>Core user flow works end-to-end</li>
          <li>Backend APIs are stable and documented</li>
          <li>Database stores and retrieves data correctly</li>
          <li>Architecture matches the designed canvas</li>
        </ul>
      </Section>
    </div>
  );
}

/* ---------- Reusable Components ---------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-5xl mx-auto px-8 mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">{title}</h2>
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/50 rounded-xl p-6">
        {children}
      </div>
    </div>
  );
}

function Phase({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-orange-300 mb-2">{title}</h3>
      <ul className="list-disc ml-6 space-y-1 text-zinc-300">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
