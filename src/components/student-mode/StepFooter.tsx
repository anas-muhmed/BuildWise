"use client";

import { stepOrder, StudentStep } from "@/lib/student-mode/progress";
import { useRouter } from "next/navigation";

export default function StepFooter({
  projectId,
  currentStep,
  canContinue = true,
}: {
  projectId: string;
  currentStep: StudentStep;
  canContinue?: boolean;
}) {
  const router = useRouter();
  const index = stepOrder.indexOf(currentStep);

  const prev = stepOrder[index - 1];
  const next = stepOrder[index + 1];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-zinc-800 p-6 flex justify-between items-center">
      <button
        disabled={!prev}
        onClick={() => prev && router.push(`/student-mode/${projectId}/${prev}`)}
        className="px-6 py-3 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-lg hover:bg-zinc-800/50"
      >
        ← Back
      </button>

      <div className="flex items-center gap-2">
        {stepOrder.map((step, idx) => (
          <div
            key={step}
            className={`w-2 h-2 rounded-full transition-all ${
              idx <= index
                ? "bg-gradient-to-r from-purple-500 to-blue-500 w-8"
                : "bg-zinc-700"
            }`}
          />
        ))}
      </div>

      <button
        disabled={!canContinue || !next}
        onClick={() => next && router.push(`/student-mode/${projectId}/${next}`)}
        className="group relative px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105 disabled:transform-none"
      >
        Continue →
      </button>
    </div>
  );
}
