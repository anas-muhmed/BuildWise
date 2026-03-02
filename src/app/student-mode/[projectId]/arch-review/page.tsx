"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { generateReadinessReport } from "@/lib/backend/services/readinessAnalyzer";
import { loadBuild } from "@/lib/student-mode/build-store";
import { COMPONENTS } from "@/lib/student-mode/component-catalog";
import StepFooter from "@/components/student-mode/StepFooter";

// ─── Types ────────────────────────────────────────────────────────────────────

type Option = {
    id: string;
    label: string;
    consequence: string;
    scoreImpact: number;       // positive = improvement, negative = penalty
    isRecommended?: boolean;
    accepted?: boolean;        // for "accept risk" options
};

type Challenge = {
    checkId: string;
    severity: "critical" | "warning" | "info";
    category: string;
    title: string;
    context: string;           // personalised to the student's decisions
    options: Option[];
    resolved: boolean;
    chosenOptionId: string | null;
};

// ─── Challenge definitions ────────────────────────────────────────────────────
// Maps each readiness check ID to a student-facing challenge with real options.

function buildChallenges(
    checks: ReturnType<typeof generateReadinessReport>["checks"],
    answers: Record<string, string>
): Challenge[] {
    const map: Record<string, Omit<Challenge, "resolved" | "chosenOptionId">> = {
        "auth-missing": {
            checkId: "auth-missing",
            severity: "critical",
            category: "Security",
            title: "No Authentication Layer",
            context: `Your system handles ${answers.data_sensitivity === "payments"
                ? "payment / personal data"
                : "user accounts"
                } but has no auth component. Any user can access any resource.`,
            options: [
                {
                    id: "add-jwt",
                    label: "Add JWT-based auth middleware",
                    consequence: "Lightweight, stateless tokens — works well for REST APIs. Low infra cost.",
                    scoreImpact: 25,
                    isRecommended: true,
                },
                {
                    id: "add-oauth",
                    label: "Integrate OAuth 2.0 (Auth0 / Google)",
                    consequence: "Delegates auth to a trusted provider. Faster dev, higher reliability.",
                    scoreImpact: 28,
                },
                {
                    id: "accept-risk",
                    label: "Accept risk — auth will be added later",
                    consequence: "⚠ Architecture proceeds without auth. Security score penalised.",
                    scoreImpact: -10,
                    accepted: true,
                },
            ],
        },

        "db-public": {
            checkId: "db-public",
            severity: "critical",
            category: "Security",
            title: "Database Exposed to Public Network",
            context: `Your database has no VPC or private subnet flag. ${answers.data_sensitivity === "payments"
                ? "With payment data involved, this is a critical compliance violation (PCI-DSS)."
                : "Anyone who discovers the endpoint could query it directly."
                }`,
            options: [
                {
                    id: "add-vpc",
                    label: "Place DB in a private VPC subnet",
                    consequence: "DB is only accessible from within your cloud network. Industry standard.",
                    scoreImpact: 28,
                    isRecommended: true,
                },
                {
                    id: "add-firewall",
                    label: "Add a security group / firewall rule",
                    consequence: "Still technically public but access-controlled by IP allowlist. Acceptable for small scale.",
                    scoreImpact: 18,
                },
                {
                    id: "accept-risk",
                    label: "Accept risk — development only",
                    consequence: "⚠ Not acceptable for production. Score penalised.",
                    scoreImpact: -15,
                    accepted: true,
                },
            ],
        },

        "db-single": {
            checkId: "db-single",
            severity: "warning",
            category: "Reliability",
            title: "Single Database — No Redundancy",
            context: `You have exactly one database instance. ${answers.failure === "self_heal"
                ? "You specified self-recovery as a requirement — a single DB contradicts that."
                : answers.failure === "partial_fail"
                    ? "You need partial failure tolerance — a single DB is a single point of failure."
                    : "If it goes down, your entire system stops."
                }`,
            options: [
                {
                    id: "add-replica",
                    label: "Add a read replica (primary + replica)",
                    consequence: "Reads scale horizontally. If primary fails, replica promotes. Minimal cost increase.",
                    scoreImpact: 15,
                    isRecommended: true,
                },
                {
                    id: "managed-ha",
                    label: "Use a managed DB with HA (RDS Multi-AZ, Atlas)",
                    consequence: "Fully managed failover. No manual promotion. Higher cost but zero ops burden.",
                    scoreImpact: 18,
                },
                {
                    id: "accept-risk",
                    label: "Accept — single DB is fine for this scale",
                    consequence: `${answers.user_load === "high_users"
                        ? "⚠ Risky given you selected High Users."
                        : "Acceptable for low-traffic systems. Noted."
                        }`,
                    scoreImpact: answers.user_load === "high_users" ? -8 : 0,
                    accepted: true,
                },
            ],
        },

        "realtime-missing": {
            checkId: "realtime-missing",
            severity: "warning",
            category: "Architecture",
            title: "Real-Time Capability Gap",
            context: `You said real-time updates are required but the architecture has no WebSocket, message queue, or pub/sub layer to support this.`,
            options: [
                {
                    id: "add-redis",
                    label: "Add Redis Pub/Sub + Socket.IO",
                    consequence: "Lightweight real-time push. Works for chat, live updates, notifications.",
                    scoreImpact: 15,
                    isRecommended: true,
                },
                {
                    id: "add-queue",
                    label: "Add a message queue (RabbitMQ / SQS)",
                    consequence: "Decouples producers from consumers. Better for events at scale, adds infra complexity.",
                    scoreImpact: 12,
                },
                {
                    id: "downgrade",
                    label: "Downgrade to polling — real-time not critical",
                    consequence: "Simpler architecture. Polling every 5-10s is acceptable for many use cases.",
                    scoreImpact: 5,
                    accepted: true,
                },
            ],
        },

        "monitoring-missing": {
            checkId: "monitoring-missing",
            severity: "warning",
            category: "Observability",
            title: "No Monitoring or Logging",
            context: `Your architecture has no observability layer. ${answers.deployment === "cloud_scaling"
                ? "With cloud scaling, you need metrics to know when to scale and where failures occur."
                : "Without logging, debugging failures in production is nearly impossible."
                }`,
            options: [
                {
                    id: "add-prometheus",
                    label: "Add Prometheus + Grafana (self-hosted, free)",
                    consequence: "Open-source metrics stack. Full control, some setup effort.",
                    scoreImpact: 12,
                    isRecommended: answers.deployment !== "cloud_scaling",
                },
                {
                    id: "add-datadog",
                    label: "Use Datadog or CloudWatch (managed)",
                    consequence: "Zero setup, powerful dashboards, alerting out of the box. Costs per host.",
                    scoreImpact: 14,
                    isRecommended: answers.deployment === "cloud_scaling",
                },
                {
                    id: "accept-risk",
                    label: "No monitoring — acceptable for academic scope",
                    consequence: "Noted. Production systems should never skip this.",
                    scoreImpact: 0,
                    accepted: true,
                },
            ],
        },

        "gateway-missing": {
            checkId: "gateway-missing",
            severity: "info",
            category: "Deployment",
            title: "No API Gateway or Load Balancer",
            context: `Your architecture has ${answers.user_load === "high_users" ? "high expected traffic but" : "multiple components but"
                } no single entry point for routing, rate limiting, or SSL termination.`,
            options: [
                {
                    id: "add-gateway",
                    label: "Add an API Gateway (Kong, AWS API GW)",
                    consequence: "Handles routing, auth, rate limiting, SSL at the edge. Recommended for microservices.",
                    scoreImpact: 8,
                    isRecommended: true,
                },
                {
                    id: "add-nginx",
                    label: "Add Nginx as reverse proxy / load balancer",
                    consequence: "Lightweight, free, battle-tested. Good for monolith or simple setups.",
                    scoreImpact: 7,
                },
                {
                    id: "accept-risk",
                    label: "Proceed without — direct backend access is fine",
                    consequence: "Acceptable for small, internal, or prototype systems.",
                    scoreImpact: 0,
                    accepted: true,
                },
            ],
        },

        "storage-missing": {
            checkId: "storage-missing",
            severity: "warning",
            category: "Cost",
            title: "Missing Object Storage for File Uploads",
            context: "Your system supports file/media uploads but routes them through the backend server. This wastes compute and creates a storage bottleneck.",
            options: [
                {
                    id: "add-s3",
                    label: "Add S3 or compatible object storage (MinIO)",
                    consequence: "Files bypass the backend (pre-signed URLs). Infinitely scalable, low cost.",
                    scoreImpact: 12,
                    isRecommended: true,
                },
                {
                    id: "add-cloud-storage",
                    label: "Use cloud provider storage (GCS / Azure Blob)",
                    consequence: "Fully managed, global CDN integration, pay-per-use.",
                    scoreImpact: 11,
                },
                {
                    id: "accept-risk",
                    label: "Keep files on backend server for now",
                    consequence: "⚠ Doesn't scale. Acceptable only for MVP/prototype.",
                    scoreImpact: -5,
                    accepted: true,
                },
            ],
        },
    };

    return checks
        .filter((c) => map[c.id])                    // only challenges we have defined
        .map((c) => ({
            ...map[c.id],
            resolved: false,
            chosenOptionId: null,
        }));
}

// ─── Score display ────────────────────────────────────────────────────────────

function ScoreMeter({ score }: { score: number }) {
    const color =
        score >= 80 ? "#10b981" : score >= 60 ? "#3b82f6" : score >= 40 ? "#f59e0b" : "#ef4444";
    const label =
        score >= 80 ? "Strong" : score >= 60 ? "Acceptable" : score >= 40 ? "Needs Work" : "Critical";
    return (
        <div className="flex items-center gap-4">
            <div
                className="w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center font-black text-2xl shrink-0"
                style={{ borderColor: color, color, backgroundColor: color + "18" }}
            >
                {score}
                <span className="text-xs font-normal">{label}</span>
            </div>
            <div className="flex-1">
                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                    <span>Readiness Score</span>
                    <span>{score}/100</span>
                </div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${score}%`, backgroundColor: color }}
                    />
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ArchReviewPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [score, setScore] = useState(100);
    const [baseScore, setBaseScore] = useState(100);
    const [activeIdx, setActiveIdx] = useState(0);
    const [allDone, setAllDone] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const reasonRes = await fetch(`/api/student-mode/reasoning?projectId=${projectId}`);
                const reasonData = await reasonRes.json();
                const answers = reasonData?.answers || {};

                // ── Read student's OWN build from localStorage ──────────────
                const buildData = loadBuild(projectId);
                const selectedIds = buildData?.selectedIds ?? [];

                // Convert selected component IDs → nodes for readiness analyzer
                const nodes = selectedIds.map((id) => {
                    const comp = COMPONENTS.find((c) => c.id === id);
                    return {
                        id,
                        type: comp?.type ?? id,
                        label: comp?.name ?? id,
                    };
                });

                // Fallback: if student skipped build step, fetch AI architecture
                let finalNodes = nodes;
                if (finalNodes.length === 0) {
                    const archRes = await fetch(`/api/student-mode/materialize?projectId=${projectId}`);
                    const archResp = await archRes.json();
                    finalNodes = (archResp.architecture || archResp)?.nodes ?? [];
                }

                // Build features from answers for the readiness analyzer
                const features: string[] = [];
                if (answers.data_sensitivity === "payments") features.push("payment");
                if (answers.realtime === "realtime") features.push("real-time", "websocket");
                if (answers.user_load === "high_users") features.push("upload");

                const report = generateReadinessReport(finalNodes, {
                    features,
                    traffic: answers.user_load === "high_users" ? "large"
                        : answers.user_load === "medium_users" ? "medium" : "small",
                });

                setBaseScore(report.overallScore);
                setScore(report.overallScore);
                const chal = buildChallenges(report.checks, answers);
                setChallenges(chal);
                setAllDone(chal.length === 0);
            } catch (e) {
                console.error(e);
                setAllDone(true);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [projectId]);

    const handleChoice = useCallback(
        (challengeIdx: number, option: Option) => {
            setChallenges((prev) => {
                const updated = prev.map((c, i) =>
                    i === challengeIdx
                        ? { ...c, resolved: true, chosenOptionId: option.id }
                        : c
                );
                const allResolved = updated.every((c) => c.resolved);
                setAllDone(allResolved);
                // Move to next unresolved
                if (!allResolved) {
                    const nextIdx = updated.findIndex((c, i) => i > challengeIdx && !c.resolved);
                    if (nextIdx !== -1) setActiveIdx(nextIdx);
                }
                return updated;
            });
            setScore((prev) => Math.min(100, Math.max(0, prev + option.scoreImpact)));
        },
        []
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="flex items-center gap-3 text-zinc-400">
                    <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    Analysing your architecture...
                </div>
            </div>
        );
    }

    // ── No issues found ──────────────────────────────────────────────────────────
    if (challenges.length === 0) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 p-8 pb-28">
                <div className="text-7xl">🏆</div>
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-emerald-400 mb-2">No Issues Detected</h1>
                    <p className="text-zinc-400">Your architecture passed all automated checks. Continue to Team Setup.</p>
                </div>
                <ScoreMeter score={score} />
                <StepFooter projectId={projectId} currentStep="arch-review" canContinue={true} />
            </div>
        );
    }

    const resolved = challenges.filter((c) => c.resolved).length;
    const criticals = challenges.filter((c) => c.severity === "critical");
    const unresolvedCriticals = criticals.filter((c) => !c.resolved).length;
    const canContinue = unresolvedCriticals === 0;

    return (
        <div className="min-h-screen bg-black text-white pb-32">

            {/* ── Sticky header ── */}
            <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-zinc-800 px-6 py-4">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-6 flex-wrap">
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                            Architecture Review
                        </h1>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            The algorithm found {challenges.length} issue{challenges.length > 1 ? "s" : ""} in your design —
                            you must decide what to do about each one.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                        {/* Progress indicator */}
                        <div className="text-center">
                            <div className="text-2xl font-bold text-violet-400">{resolved}/{challenges.length}</div>
                            <div className="text-xs text-zinc-600">resolved</div>
                        </div>
                        {/* Live score */}
                        <div className="text-center">
                            <div
                                className="text-2xl font-bold"
                                style={{
                                    color: score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444",
                                }}
                            >
                                {score}
                            </div>
                            <div className="text-xs text-zinc-600">readiness</div>
                        </div>
                    </div>
                </div>
                {/* Progress bar */}
                <div className="max-w-3xl mx-auto mt-3">
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-orange-500 to-violet-500 rounded-full transition-all duration-500"
                            style={{ width: `${(resolved / challenges.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* ── Challenges ── */}
            <div className="max-w-3xl mx-auto px-6 pt-8 space-y-4">

                {/* Gating notice for criticals */}
                {unresolvedCriticals > 0 && (
                    <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 flex items-start gap-3">
                        <span className="text-xl shrink-0">🚫</span>
                        <div>
                            <div className="font-semibold text-red-400 text-sm">
                                {unresolvedCriticals} critical issue{unresolvedCriticals > 1 ? "s" : ""} must be resolved
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                You cannot proceed to team setup until all critical issues have a decision. Warnings are optional.
                            </p>
                        </div>
                    </div>
                )}

                {challenges.map((challenge, idx) => {
                    const isActive = idx === activeIdx && !challenge.resolved;
                    const isResolved = challenge.resolved;
                    const chosen = challenge.options.find((o) => o.id === challenge.chosenOptionId);

                    const sevColor = {
                        critical: { border: "border-red-700/50", badge: "bg-red-900/30 text-red-400", icon: "🔴" },
                        warning: { border: "border-amber-700/50", badge: "bg-amber-900/30 text-amber-400", icon: "🟡" },
                        info: { border: "border-blue-700/50", badge: "bg-blue-900/30 text-blue-400", icon: "🔵" },
                    }[challenge.severity];

                    return (
                        <div
                            key={challenge.checkId}
                            onClick={() => !isResolved && setActiveIdx(idx)}
                            className={`border rounded-2xl transition-all duration-300 overflow-hidden ${isResolved
                                ? "bg-zinc-900/30 border-zinc-800/60 opacity-75"
                                : isActive
                                    ? `bg-zinc-900/80 ${sevColor.border} shadow-lg`
                                    : `bg-zinc-900/40 ${sevColor.border} cursor-pointer hover:bg-zinc-900/60`
                                }`}
                        >
                            {/* Challenge header */}
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-lg shrink-0">{sevColor.icon}</span>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-white">{challenge.title}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${sevColor.badge}`}>
                                                    {challenge.severity}
                                                </span>
                                                <span className="text-xs text-zinc-600">{challenge.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {isResolved && (
                                        <span className="text-emerald-400 text-xl shrink-0">✓</span>
                                    )}
                                </div>

                                <p className="text-sm text-zinc-400 leading-relaxed">{challenge.context}</p>

                                {/* Resolved state: show what they picked */}
                                {isResolved && chosen && (
                                    <div className="mt-3 p-3 bg-emerald-900/20 border border-emerald-700/30 rounded-xl text-sm">
                                        <span className="text-emerald-400 font-semibold">Your choice: </span>
                                        <span className="text-zinc-300">{chosen.label}</span>
                                        <div className="text-xs text-zinc-500 mt-1">{chosen.consequence}</div>
                                        <div className="text-xs mt-1" style={{
                                            color: chosen.scoreImpact > 0 ? "#10b981" : chosen.scoreImpact < 0 ? "#ef4444" : "#6b7280"
                                        }}>
                                            {chosen.scoreImpact > 0 ? `+${chosen.scoreImpact}` : chosen.scoreImpact} readiness score
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Options — only shown when active and unresolved */}
                            {isActive && !isResolved && (
                                <div className="px-5 pb-5 border-t border-zinc-800/50 pt-4">
                                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
                                        What will you do?
                                    </div>
                                    <div className="space-y-2.5">
                                        {challenge.options.map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleChoice(idx, opt);
                                                }}
                                                className={`group w-full text-left rounded-xl border p-4 transition-all duration-200 hover:scale-[1.01] ${opt.accepted
                                                    ? "bg-zinc-800/40 border-zinc-700/50 hover:border-zinc-500"
                                                    : opt.isRecommended
                                                        ? "bg-violet-900/20 border-violet-600/40 hover:border-violet-500/70 hover:bg-violet-900/30"
                                                        : "bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-500"
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`font-semibold text-sm ${opt.accepted ? "text-zinc-400" : "text-white"
                                                                }`}>
                                                                {opt.label}
                                                            </span>
                                                            {opt.isRecommended && (
                                                                <span className="text-xs bg-violet-900/50 text-violet-300 border border-violet-700/40 px-2 py-0.5 rounded-full">
                                                                    Recommended
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                                                            {opt.consequence}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`text-sm font-bold shrink-0 ${opt.scoreImpact > 0
                                                            ? "text-emerald-400"
                                                            : opt.scoreImpact < 0
                                                                ? "text-red-400"
                                                                : "text-zinc-600"
                                                            }`}
                                                    >
                                                        {opt.scoreImpact > 0
                                                            ? `+${opt.scoreImpact}`
                                                            : opt.scoreImpact < 0
                                                                ? opt.scoreImpact
                                                                : "±0"}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* ── Final Score Summary ── */}
                {allDone && (
                    <div className="bg-gradient-to-br from-violet-900/20 to-emerald-900/20 border border-violet-700/30 rounded-2xl p-6 mt-6">
                        <div className="text-center mb-4">
                            <div className="text-4xl mb-2">
                                {score >= 80 ? "🏆" : score >= 60 ? "✅" : score >= 40 ? "⚠️" : "🔴"}
                            </div>
                            <h2 className="text-xl font-bold text-white">Review Complete</h2>
                            <p className="text-zinc-400 text-sm mt-1">
                                You addressed all {challenges.length} architecture issues.
                            </p>
                        </div>
                        <ScoreMeter score={score} />
                        <div className="grid grid-cols-2 gap-3 mt-4 text-center text-sm">
                            <div className="bg-zinc-900/50 rounded-xl p-3">
                                <div className="text-zinc-500 text-xs mb-1">Started at</div>
                                <div className="font-bold text-zinc-400">{baseScore}</div>
                            </div>
                            <div className="bg-zinc-900/50 rounded-xl p-3">
                                <div className="text-zinc-500 text-xs mb-1">Final score</div>
                                <div
                                    className="font-bold"
                                    style={{ color: score >= baseScore ? "#10b981" : "#ef4444" }}
                                >
                                    {score} {score >= baseScore ? `(+${score - baseScore})` : `(${score - baseScore})`}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <StepFooter
                projectId={projectId}
                currentStep="arch-review"
                canContinue={canContinue}
            />
        </div>
    );
}
