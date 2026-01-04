"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { reasoningQuestions } from "@/lib/student-mode/reasoning";

export default function ReasoningPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  const [state, setState] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/student-mode/reasoning?projectId=${projectId}`)
      .then((r) => r.json())
      .then(setState);
  }, [projectId]);

  useEffect(() => {
    if (state && state.index >= reasoningQuestions.length) {
      router.push(`/student-mode/${projectId}/materialize`);
    }
  }, [state, projectId, router]);

  if (!state) {
    return <div className="text-white p-8">Loading…</div>;
  }

  const q = reasoningQuestions[state.index];

  if (!q) {
    return <div className="text-white p-8">Loading…</div>;
  }

  const answer = async (value: string) => {
    const res = await fetch("/api/student-mode/reasoning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        questionId: q.id,
        answer: value,
      }),
    });

    const updated = await res.json();
    setState(updated);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-xl w-full space-y-6">

        <div className="text-sm text-zinc-500">
          Question {state.index + 1} of {reasoningQuestions.length}
        </div>

        <h1 className="text-2xl font-bold">{q.title}</h1>

        <div className="space-y-3">
          {q.options.map((opt: any) => (
            <button
              key={opt.value}
              onClick={() => answer(opt.value)}
              className="w-full p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-left"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
