"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { reasoningQuestions } from "@/lib/student-mode/reasoning";
import StepFooter from "@/components/student-mode/StepFooter";

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
      // Auto-materialize and redirect to canvas
      fetch("/api/student-mode/materialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      }).then(() => {
        router.push(`/student-mode/${projectId}/canvas`);
      });
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
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 pb-24">
      <div className="max-w-2xl w-full space-y-8">

        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-full text-sm text-zinc-400">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            Question {state.index + 1} of {reasoningQuestions.length}
          </div>
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-2xl"></div>
            <h1 className="text-3xl font-bold text-white relative leading-tight">{q.title}</h1>
          </div>
        </div>

        <div className="space-y-3">
          {q.options.map((opt: any, index: number) => (
            <button
              key={opt.value}
              onClick={() => answer(opt.value)}
              className="group relative w-full p-5 bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 hover:from-purple-900/20 hover:to-blue-900/20 border border-zinc-700/50 hover:border-purple-500/50 rounded-xl text-left transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10"
            >
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-400 font-bold flex-shrink-0 group-hover:scale-110 transition-transform">
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="text-zinc-300 group-hover:text-white transition-colors">{opt.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <StepFooter projectId={projectId} currentStep="reasoning" canContinue={false} />
    </div>
  );
}
