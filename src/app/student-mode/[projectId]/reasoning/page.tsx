"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { reasoningQuestions } from "@/lib/student-mode/reasoning";
import StepFooter from "@/components/student-mode/StepFooter";

// ─── Live score computation from answers ──────────────────────────────────────
//  We compute scores purely from the answer map — no backend call needed.
//  Each answer shifts one or more dimensions up or down.

type Scores = {
  security: number;
  scalability: number;
  simplicity: number;
  costEfficiency: number;
};

const BASE: Scores = { security: 50, scalability: 50, simplicity: 70, costEfficiency: 70 };

const IMPACT: Record<string, Partial<Scores>> = {
  // system_type
  transactional: { security: +10, scalability: +5, simplicity: -5, costEfficiency: -5 },
  informational: { security: 0, scalability: +5, simplicity: +10, costEfficiency: +5 },
  communication: { security: +5, scalability: +10, simplicity: -10, costEfficiency: -10 },
  // user_load
  low_users: { scalability: -10, simplicity: +10, costEfficiency: +10 },
  medium_users: { scalability: +5, simplicity: 0, costEfficiency: 0 },
  high_users: { scalability: +20, simplicity: -10, costEfficiency: -15 },
  // data_sensitivity
  no_sensitive: { security: 0, costEfficiency: +5 },
  auth_only: { security: +15, costEfficiency: -5 },
  payments: { security: +25, simplicity: -10, costEfficiency: -10 },
  // realtime
  no_realtime: { simplicity: +10, costEfficiency: +5 },
  polling: { simplicity: +5, scalability: +5, costEfficiency: 0 },
  realtime: { scalability: +10, simplicity: -15, costEfficiency: -10 },
  // failure
  stop_all: { simplicity: +10, scalability: -10, costEfficiency: +10 },
  partial_fail: { scalability: +5, simplicity: -5, costEfficiency: -5 },
  self_heal: { scalability: +15, simplicity: -15, costEfficiency: -15 },
  // deployment
  single_server: { simplicity: +15, scalability: -15, costEfficiency: +10 },
  cloud_scaling: { scalability: +15, simplicity: -10, costEfficiency: -10 },
  learning: { simplicity: +5, scalability: 0, costEfficiency: +5 },
  // team
  beginners: { simplicity: +10, scalability: -5, costEfficiency: +5 },
  mixed: { simplicity: 0, scalability: +5, costEfficiency: 0 },
  experienced: { simplicity: -5, scalability: +10, costEfficiency: -5 },
};

function computeScores(answers: Record<string, string>): Scores {
  const s = { ...BASE };
  for (const val of Object.values(answers)) {
    const impact = IMPACT[val] || {};
    for (const [k, delta] of Object.entries(impact)) {
      (s as any)[k] = Math.min(100, Math.max(0, (s as any)[k] + delta));
    }
  }
  return s;
}

// ─── Trade-off message per answer ─────────────────────────────────────────────
const TRADEOFFS: Record<string, string> = {
  transactional: "Transactional systems need strong consistency — expect more complexity.",
  informational: "Read-heavy workloads are simpler and cheaper to scale.",
  communication: "Real-time messaging demands websockets and message queues.",
  low_users: "Low load = simple, cheap architecture. Perfect for MVPs.",
  medium_users: "Medium scale — a well-designed monolith can serve you well.",
  high_users: "High traffic demands horizontal scaling, caching, and CDN.",
  no_sensitive: "No sensitive data — fewer compliance requirements.",
  auth_only: "Add JWT or OAuth. Not too complex, still secure.",
  payments: "Payment data requires PCI compliance, encryption, and audit logs.",
  no_realtime: "No real-time needs — REST APIs are sufficient. Keeps it simple.",
  polling: "Polling adds server load but avoids websocket complexity.",
  realtime: "Real-time needs WebSockets or Server-Sent Events. More infra required.",
  stop_all: "Acceptable downtime — can use simpler, single-server deployments.",
  partial_fail: "Graceful degradation requires circuit breakers or fallback logic.",
  self_heal: "Self-healing needs health checks, orchestration (Kubernetes), and redundancy.",
  single_server: "Single server is cheap but is a single point of failure.",
  cloud_scaling: "Cloud scaling allows elasticity but increases cost and ops complexity.",
  learning: "Great for learning — start simple, scale when needed.",
  beginners: "Keep it simple. Microservices are hard for beginners to maintain.",
  mixed: "Mixed skills — balance complexity with what the team can sustain.",
  experienced: "Experienced team can handle distributed systems and complex deployments.",
};

// ─── Live Score Bar ───────────────────────────────────────────────────────────
function LiveBar({
  label, value, color, prevValue,
}: { label: string; value: number; color: string; prevValue?: number }) {
  const delta = prevValue !== undefined ? value - prevValue : 0;
  return (
    <div>
      <div className="flex justify-between items-center text-xs mb-1">
        <span className="text-zinc-400">{label}</span>
        <div className="flex items-center gap-2">
          {delta !== 0 && (
            <span
              className={`text-xs font-bold transition-opacity ${delta > 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
          <span className="font-bold tabular-nums" style={{ color }}>{value}</span>
        </div>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReasoningPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  const [state, setState] = useState<any>(null);
  const [prevScores, setPrevScores] = useState<Scores | null>(null);
  const [lastTradeoff, setLastTradeoff] = useState<string>("");
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    fetch(`/api/student-mode/reasoning?projectId=${projectId}`)
      .then((r) => r.json())
      .then(setState);
  }, [projectId]);

  // Auto-materialize when all questions answered
  useEffect(() => {
    if (state && state.index >= reasoningQuestions.length) {
      fetch("/api/student-mode/materialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      }).then(() => router.push(`/student-mode/${projectId}/canvas`));
    }
  }, [state, projectId, router]);

  const currentScores = useMemo(
    () => computeScores(state?.answers || {}),
    [state?.answers]
  );

  const answer = async (value: string) => {
    setPrevScores(currentScores);
    setLastTradeoff(TRADEOFFS[value] || "");
    setFlash(true);
    setTimeout(() => setFlash(false), 1200);

    const res = await fetch("/api/student-mode/reasoning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, questionId: q?.id, answer: value }),
    });
    const updated = await res.json();
    setState(updated);
  };

  if (!state) return <div className="text-white p-8">Loading…</div>;

  const q = reasoningQuestions[state.index];
  if (!q) return <div className="text-white p-8">Loading…</div>;

  const progress = Math.round((state.index / reasoningQuestions.length) * 100);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row pb-24">

      {/* ── Left: Question ────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="max-w-xl w-full space-y-8">

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-zinc-500 mb-2">
              <span>Question {state.index + 1} of {reasoningQuestions.length}</span>
              <span>{progress}% complete</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-900/30 border border-violet-500/30 rounded-full text-xs text-violet-400">
              <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
              Architecture Decision
            </div>
            <h1 className="text-3xl font-bold leading-tight">{q.title}</h1>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {q.options.map((opt: any, idx: number) => (
              <button
                key={opt.value}
                onClick={() => answer(opt.value)}
                className="group w-full p-5 bg-zinc-900/50 hover:bg-violet-900/20 border border-zinc-700/50 hover:border-violet-500/50 rounded-xl text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-500/10"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 group-hover:bg-violet-900/40 flex items-center justify-center text-zinc-400 group-hover:text-violet-400 font-bold text-sm transition-all shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="text-zinc-300 group-hover:text-white transition-colors">{opt.label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Trade-off message */}
          {lastTradeoff && (
            <div
              className={`p-4 bg-sky-900/20 border border-sky-700/40 rounded-xl text-sm text-sky-300 transition-all duration-500 ${flash ? "opacity-100 translate-y-0" : "opacity-70"}`}
            >
              💡 {lastTradeoff}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Live Score Panel ────────────────────────────────────────── */}
      <div className="lg:w-80 lg:min-h-screen border-t lg:border-t-0 lg:border-l border-zinc-800 bg-zinc-900/30 p-6 flex flex-col gap-6">

        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Live Architecture Score</div>
          <div className="text-xs text-zinc-600">Updates with every decision</div>
        </div>

        <div className="space-y-5">
          <LiveBar label="🔐 Security" value={currentScores.security} color="#ef4444" prevValue={prevScores?.security} />
          <LiveBar label="🚀 Scalability" value={currentScores.scalability} color="#3b82f6" prevValue={prevScores?.scalability} />
          <LiveBar label="✨ Simplicity" value={currentScores.simplicity} color="#8b5cf6" prevValue={prevScores?.simplicity} />
          <LiveBar label="💰 Cost Efficiency" value={currentScores.costEfficiency} color="#f59e0b" prevValue={prevScores?.costEfficiency} />
        </div>

        {/* Overall indicator */}
        <div className="border-t border-zinc-800 pt-4">
          <div className="text-xs text-zinc-500 mb-2">Overall Balance</div>
          {(() => {
            const avg = Math.round(
              (currentScores.security + currentScores.scalability + currentScores.simplicity + currentScores.costEfficiency) / 4
            );
            const color = avg >= 70 ? "#10b981" : avg >= 50 ? "#f59e0b" : "#ef4444";
            return (
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black border-2 shrink-0"
                  style={{ borderColor: color, color, backgroundColor: color + "15" }}
                >
                  {avg}
                </div>
                <div className="text-xs text-zinc-500">
                  {avg >= 70 ? "Well balanced architecture" : avg >= 50 ? "Some trade-offs to consider" : "Heavy trade-offs detected"}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Decisions so far */}
        {Object.keys(state?.answers || {}).length > 0 && (
          <div className="border-t border-zinc-800 pt-4">
            <div className="text-xs text-zinc-500 mb-3">Decisions so far</div>
            <div className="space-y-1.5">
              {Object.entries(state.answers).map(([k, v]: [string, any]) => (
                <div key={k} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 truncate">{k.replace(/_/g, " ")}</span>
                  <span className="text-violet-400 font-medium ml-2 shrink-0">
                    {v.toString().replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <StepFooter projectId={projectId} currentStep="reasoning" canContinue={false} />
    </div>
  );
}
