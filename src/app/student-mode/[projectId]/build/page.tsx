"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    COMPONENTS,
    ComponentId,
    ArchComponent,
    getRequirements,
    scoreBuild,
} from "@/lib/student-mode/component-catalog";
import { saveBuild, loadBuild } from "@/lib/student-mode/build-store";
import StepFooter from "@/components/student-mode/StepFooter";
import { useRequireAuth } from "@/lib/useRequireAuth";

// ── Category colour map ─────────────────────────────────────────────────────
const CAT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    Frontend: { bg: "bg-blue-900/20", border: "border-blue-700/40", text: "text-blue-400" },
    Backend: { bg: "bg-violet-900/20", border: "border-violet-700/40", text: "text-violet-400" },
    Database: { bg: "bg-emerald-900/20", border: "border-emerald-700/40", text: "text-emerald-400" },
    Infrastructure: { bg: "bg-sky-900/20", border: "border-sky-700/40", text: "text-sky-400" },
    Security: { bg: "bg-red-900/20", border: "border-red-700/40", text: "text-red-400" },
    Observability: { bg: "bg-amber-900/20", border: "border-amber-700/40", text: "text-amber-400" },
};

// ── Status badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: "required" | "recommended" | "optional" | "none" }) {
    const map = {
        required: "bg-red-900/40 text-red-300 border-red-600/40",
        recommended: "bg-amber-900/40 text-amber-300 border-amber-600/40",
        optional: "bg-zinc-800/60 text-zinc-400 border-zinc-600/40",
        none: "bg-zinc-800/40 text-zinc-600 border-zinc-700/20",
    };
    const labels = { required: "REQUIRED", recommended: "RECOMMENDED", optional: "OPTIONAL", none: "OPTIONAL" };
    return (
        <span className={`text-xs px-1.5 py-0.5 rounded border font-semibold tracking-wide ${map[status]}`}>
            {labels[status]}
        </span>
    );
}

// ── Component card ──────────────────────────────────────────────────────────
function ComponentCard({
    component,
    status,
    selected,
    risky,
    onToggle,
}: {
    component: ArchComponent;
    status: "required" | "recommended" | "optional" | "none";
    selected: boolean;
    risky: boolean;
    onToggle: () => void;
}) {
    const cat = CAT_COLORS[component.category];
    return (
        <button
            onClick={onToggle}
            className={`group w-full text-left rounded-2xl border p-4 transition-all duration-200 relative overflow-hidden ${selected
                ? risky
                    ? "bg-amber-900/20 border-amber-500/60 shadow-lg shadow-amber-500/10"
                    : "bg-violet-900/20 border-violet-500/60 shadow-lg shadow-violet-500/10 scale-[1.01]"
                : "bg-zinc-900/50 border-zinc-800/60 hover:border-zinc-600 hover:bg-zinc-900/70"
                }`}
        >
            {/* Selected checkmark */}
            {selected && (
                <div className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${risky ? "bg-amber-500 text-black" : "bg-violet-500 text-white"}`}>
                    {risky ? "⚠" : "✓"}
                </div>
            )}

            <div className="flex items-start gap-3 pr-6">
                <span className="text-2xl shrink-0 mt-0.5">{component.icon}</span>
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm text-white">{component.name}</span>
                        <StatusBadge status={status} />
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">{component.description}</p>
                    {selected && (
                        <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed border-t border-zinc-800 pt-1.5">
                            ⚠ {component.tradeOff}
                        </p>
                    )}
                </div>
            </div>

            {/* Category tag */}
            <div className={`mt-2.5 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${cat.bg} ${cat.border} ${cat.text}`}>
                {component.category}
            </div>
        </button>
    );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function BuildPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const { isAuthenticated, isLoading } = useRequireAuth();
    if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
    if (!isAuthenticated) return null;

    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [selected, setSelected] = useState<Set<ComponentId>>(new Set());
    const [loading, setLoading] = useState(true);
    const [expandedTip, setExpandedTip] = useState<ComponentId | null>(null);

    // Load reasoning answers + any prior build
    useEffect(() => {
        fetch(`/api/student-mode/reasoning?projectId=${projectId}`)
            .then((r) => r.json())
            .then((data) => {
                setAnswers(data?.answers || {});
                // Restore prior selections
                const prior = loadBuild(projectId);
                if (prior?.selectedIds?.length) {
                    setSelected(new Set(prior.selectedIds));
                }
            })
            .finally(() => setLoading(false));
    }, [projectId]);

    // Requirements derived from answers
    const reqs = useMemo(() => getRequirements(answers), [answers]);

    // Status for every component
    const statusMap = useMemo(() => {
        const m: Record<ComponentId, "required" | "recommended" | "optional" | "none"> = {} as any;
        for (const c of COMPONENTS) m[c.id] = "none";
        for (const r of reqs.required) m[r.id] = "required";
        for (const r of reqs.recommended) if (m[r.id] !== "required") m[r.id] = "recommended";
        return m;
    }, [reqs]);

    // Risky components currently selected
    const riskyIds = useMemo(
        () => new Set(reqs.risky.map((r) => r.id)),
        [reqs]
    );

    // Live build score
    const buildScore = useMemo(
        () => scoreBuild([...selected], reqs),
        [selected, reqs]
    );

    const canContinue = buildScore.missingRequired.length === 0 && buildScore.mutuallyMissing.length === 0;

    function toggle(id: ComponentId) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    // Save whenever selection changes
    useEffect(() => {
        if (loading) return;
        saveBuild(projectId, {
            selectedIds: [...selected],
            score: buildScore.score,
            savedAt: Date.now(),
        });
    }, [selected, buildScore.score, projectId, loading]);

    // Group by category
    const byCategory = useMemo(() => {
        const cats: Record<string, ArchComponent[]> = {};
        for (const c of COMPONENTS) {
            if (!cats[c.category]) cats[c.category] = [];
            cats[c.category].push(c);
        }
        return cats;
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="flex items-center gap-3 text-zinc-400">
                    <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    Loading your requirements...
                </div>
            </div>
        );
    }

    const scoreColor = buildScore.score >= 80 ? "#10b981" : buildScore.score >= 60 ? "#3b82f6" : buildScore.score >= 40 ? "#f59e0b" : "#ef4444";

    return (
        <div className="min-h-screen bg-black text-white pb-32">

            {/* Sticky header */}
            <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-zinc-800">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                            Design Your Architecture
                        </h1>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Select the components your system needs — required ones are flagged from your requirements
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-violet-400">{selected.size}</div>
                            <div className="text-xs text-zinc-600">selected</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold" style={{ color: scoreColor }}>{buildScore.score}</div>
                            <div className="text-xs text-zinc-600">design score</div>
                        </div>
                        {buildScore.missingRequired.length > 0 && (
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-400">{buildScore.missingRequired.length}</div>
                                <div className="text-xs text-zinc-600">still needed</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pt-6 flex gap-6">

                {/* ── Left: Component Palette ────────────────────────────────── */}
                <div className="flex-1 min-w-0 space-y-8">

                    {Object.entries(byCategory).map(([category, components]) => {
                        const cat = CAT_COLORS[category];
                        return (
                            <section key={category}>
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-4 text-sm font-semibold ${cat.bg} ${cat.border} ${cat.text}`}>
                                    {category}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {components.map((c) => (
                                        <ComponentCard
                                            key={c.id}
                                            component={c}
                                            status={statusMap[c.id]}
                                            selected={selected.has(c.id)}
                                            risky={riskyIds.has(c.id) && selected.has(c.id)}
                                            onToggle={() => toggle(c.id)}
                                        />
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>

                {/* ── Right: Requirements & Validation Sidebar ─────────────── */}
                <div className="w-80 shrink-0 space-y-4 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">

                    {/* Requirements checklist */}
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
                        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-red-900/30 border border-red-700/40 flex items-center justify-center text-red-400 text-xs">!</span>
                            Required by Your Answers
                        </h2>
                        <div className="space-y-2">
                            {reqs.required.map((r) => {
                                const isCovered = selected.has(r.id);
                                const comp = COMPONENTS.find((c) => c.id === r.id)!;
                                return (
                                    <div
                                        key={r.id}
                                        onClick={() => toggle(r.id)}
                                        className={`flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all ${isCovered
                                            ? "bg-emerald-900/20 border border-emerald-700/30"
                                            : "bg-red-900/20 border border-red-700/30 hover:bg-red-900/30"
                                            }`}
                                    >
                                        <span className={`text-base shrink-0 mt-0.5 ${isCovered ? "text-emerald-400" : "text-red-400"}`}>
                                            {isCovered ? "✓" : "✗"}
                                        </span>
                                        <div className="min-w-0">
                                            <div className={`text-sm font-medium ${isCovered ? "text-emerald-300" : "text-red-300"}`}>
                                                {comp?.icon} {comp?.name}
                                            </div>
                                            <div className="text-xs text-zinc-600 mt-0.5 leading-relaxed">{r.reason}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Recommended */}
                    {reqs.recommended.length > 0 && (
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
                            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-amber-900/30 border border-amber-700/40 flex items-center justify-center text-amber-400 text-xs">★</span>
                                Recommended
                            </h2>
                            <div className="space-y-2">
                                {reqs.recommended.map((r) => {
                                    const isCovered = selected.has(r.id);
                                    const comp = COMPONENTS.find((c) => c.id === r.id)!;
                                    return (
                                        <div
                                            key={r.id}
                                            onClick={() => toggle(r.id)}
                                            className={`flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all ${isCovered
                                                ? "bg-emerald-900/20 border border-emerald-700/30"
                                                : "bg-zinc-800/40 border border-zinc-700/30 hover:bg-zinc-800/60"
                                                }`}
                                        >
                                            <span className={`text-base shrink-0 mt-0.5 ${isCovered ? "text-emerald-400" : "text-zinc-500"}`}>
                                                {isCovered ? "✓" : "○"}
                                            </span>
                                            <div className="min-w-0">
                                                <div className={`text-sm font-medium ${isCovered ? "text-emerald-300" : "text-zinc-400"}`}>
                                                    {comp?.icon} {comp?.name}
                                                </div>
                                                <div className="text-xs text-zinc-600 mt-0.5 leading-relaxed">{r.reason}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Validation warnings */}
                    {(buildScore.mutuallyMissing.length > 0 || buildScore.riskyIncluded.length > 0) && (
                        <div className="bg-amber-900/20 border border-amber-700/40 rounded-2xl p-5">
                            <h2 className="text-sm font-bold text-amber-300 mb-3">⚠ Design Warnings</h2>
                            <div className="space-y-2">
                                {buildScore.mutuallyMissing.map((m) => {
                                    const needs = COMPONENTS.find((c) => c.id === m.needsAlso)!;
                                    return (
                                        <div key={`${m.component}-${m.needsAlso}`} className="text-xs text-amber-200/80 leading-relaxed">
                                            • {m.reason}
                                            <button
                                                onClick={() => toggle(m.needsAlso)}
                                                className="ml-1 underline text-amber-400 hover:text-amber-300"
                                            >
                                                Add {needs?.name}
                                            </button>
                                        </div>
                                    );
                                })}
                                {buildScore.riskyIncluded
                                    .filter((id) => {
                                        // Only show risky warning if the mutually-required pair is missing
                                        return buildScore.mutuallyMissing.some((m) => m.component === id);
                                    })
                                    .map((id) => {
                                        const r = reqs.risky.find((x) => x.id === id)!;
                                        return (
                                            <div key={id} className="text-xs text-amber-200/80 leading-relaxed">
                                                • {r?.reason}
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    {/* Score summary */}
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
                        <h2 className="text-sm font-bold text-white mb-3">Design Score</h2>
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                className="w-14 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-black shrink-0"
                                style={{ borderColor: scoreColor, color: scoreColor, backgroundColor: scoreColor + "15" }}
                            >
                                {buildScore.score}
                            </div>
                            <div className="text-xs text-zinc-500">
                                {buildScore.score >= 80 ? "Strong architecture choice 🏆" :
                                    buildScore.score >= 60 ? "Good — a few gaps to fill" :
                                        buildScore.score >= 40 ? "Needs required components" :
                                            "Missing critical components"}
                            </div>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${buildScore.score}%`, backgroundColor: scoreColor }}
                            />
                        </div>
                        {buildScore.missingRequired.length > 0 && (
                            <p className="text-xs text-red-400 mt-2">
                                {buildScore.missingRequired.length} required component{buildScore.missingRequired.length > 1 ? "s" : ""} missing — check the checklist above.
                            </p>
                        )}
                        {canContinue && (
                            <p className="text-xs text-emerald-400 mt-2">
                                ✅ All required components satisfied. Ready to proceed!
                            </p>
                        )}
                    </div>

                    {/* What you've built */}
                    {selected.size > 0 && (
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
                            <h2 className="text-sm font-bold text-white mb-3">Your Architecture ({selected.size})</h2>
                            <div className="space-y-1.5">
                                {[...selected].map((id) => {
                                    const c = COMPONENTS.find((x) => x.id === id)!;
                                    if (!c) return null;
                                    return (
                                        <div key={id} className="flex items-center justify-between text-xs">
                                            <span className="text-zinc-300">{c.icon} {c.name}</span>
                                            <button
                                                onClick={() => toggle(id)}
                                                className="text-zinc-600 hover:text-red-400 transition-colors ml-2"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Gating notice */}
            {!canContinue && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-red-900/90 border border-red-600/50 text-red-200 text-xs px-5 py-2.5 rounded-full backdrop-blur-xl shadow-xl z-10">
                    🚫 Add all REQUIRED components to continue
                </div>
            )}

            <StepFooter projectId={projectId} currentStep="build" canContinue={canContinue} />
        </div>
    );
}
