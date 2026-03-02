"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { distributeTeamHours } from "@/lib/backend/services/distributionEngineV2";
import {
    saveTeamSetup,
    saveDistributionResult,
    defaultRoles,
    ALL_SKILLS,
} from "@/lib/student-mode/team-store";
import { RosterMember, RoleDefinition } from "@/lib/student-mode/team-types";
import StepFooter from "@/components/student-mode/StepFooter";

// ─── Role-Skill Mapping (used by the algorithm) ────────────────────────────
const ROLE_SKILL_MAP: Record<string, string[]> = {
    "Backend Developer": ["backend"],
    "Frontend Developer": ["frontend"],
    "DevOps Engineer": ["devops"],
    "Database Admin": ["database"],
    "Security Engineer": ["security"],
    "Mobile Developer": ["mobile"],
    "ML Engineer": ["ml"],
    "QA Engineer": ["qa"],
};

// ─── Small helper components ────────────────────────────────────────────────
function SkillBadge({ skill, selected, onClick }: { skill: { value: string; label: string; color: string }; selected: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={selected ? { borderColor: skill.color, backgroundColor: skill.color + "22", color: skill.color } : {}}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${selected
                    ? "scale-105"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
                }`}
        >
            {skill.label}
        </button>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function TeamSetupPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const router = useRouter();

    // Roster state
    const [roster, setRoster] = useState<RosterMember[]>([]);
    const [newName, setNewName] = useState("");
    const [newSkills, setNewSkills] = useState<string[]>([]);
    const [newCapacity, setNewCapacity] = useState(20);
    const [nameError, setNameError] = useState("");

    // Roles & tasks state
    const [roles, setRoles] = useState<RoleDefinition[]>(defaultRoles());

    // Running state
    const [running, setRunning] = useState(false);
    const [distributed, setDistributed] = useState(false);

    // ── Roster actions ───
    const addMember = () => {
        if (!newName.trim()) { setNameError("Name is required"); return; }
        if (newSkills.length === 0) { setNameError("Pick at least one skill"); return; }
        setNameError("");
        const member: RosterMember = {
            userId: `u-${Date.now()}`,
            name: newName.trim(),
            skills: newSkills,
            capacity: newCapacity,
        };
        setRoster(prev => [...prev, member]);
        setNewName("");
        setNewSkills([]);
        setNewCapacity(20);
    };

    const removeMember = (userId: string) =>
        setRoster(prev => prev.filter(m => m.userId !== userId));

    const toggleSkill = (skill: string) =>
        setNewSkills(prev =>
            prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
        );

    // ── Task actions ───
    const addTask = (roleIdx: number) => {
        setRoles(prev => {
            const updated = [...prev];
            updated[roleIdx] = {
                ...updated[roleIdx],
                tasks: [...updated[roleIdx].tasks, { title: "", estimatedHours: 2 }],
            };
            return updated;
        });
    };

    const updateTask = useCallback(
        (roleIdx: number, taskIdx: number, field: "title" | "estimatedHours", value: string | number) => {
            setRoles(prev => {
                const updated = JSON.parse(JSON.stringify(prev));
                updated[roleIdx].tasks[taskIdx][field] = value;
                return updated;
            });
        },
        []
    );

    const removeTask = (roleIdx: number, taskIdx: number) => {
        setRoles(prev => {
            const updated = [...prev];
            updated[roleIdx] = {
                ...updated[roleIdx],
                tasks: updated[roleIdx].tasks.filter((_, i) => i !== taskIdx),
            };
            return updated;
        });
    };

    // ── Run distribution ───
    const handleDistribute = () => {
        if (roster.length === 0) return;
        setRunning(true);

        const result = distributeTeamHours({
            roles: roles.map(r => ({
                title: r.title,
                tasks: r.tasks.filter(t => t.title.trim()),
            })),
            roster,
            roleSkillMap: ROLE_SKILL_MAP,
        });

        const setupData = { roster, roles };
        saveTeamSetup(projectId, setupData);
        saveDistributionResult(projectId, result);

        setRunning(false);
        setDistributed(true);

        setTimeout(() => router.push(`/student-mode/${projectId}/team`), 600);
    };

    const canDistribute = roster.length > 0;

    return (
        <div className="min-h-screen bg-black text-white pb-32">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-xl border-b border-zinc-800 px-8 py-5">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
                        Team Setup
                    </h1>
                    <p className="text-zinc-500 text-sm mt-0.5">
                        Define your team, their skills, and available hours — then let the algorithm distribute the work
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-8 pt-8 space-y-10">

                {/* ── SECTION 1: Roster ─────────────────────────────────────────── */}
                <section>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400 font-bold text-sm">1</div>
                        <h2 className="text-xl font-semibold">Team Roster</h2>
                        <span className="ml-auto text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-full">{roster.length} member{roster.length !== 1 ? "s" : ""}</span>
                    </div>

                    {/* Add member form */}
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 mb-4 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Member Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => { setNewName(e.target.value); setNameError(""); }}
                                    onKeyDown={e => e.key === "Enter" && addMember()}
                                    placeholder="e.g. Alice"
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">
                                    Weekly Capacity — <span className="text-violet-400 font-semibold">{newCapacity}h</span>
                                </label>
                                <input
                                    type="range"
                                    min={5} max={40} step={5}
                                    value={newCapacity}
                                    onChange={e => setNewCapacity(Number(e.target.value))}
                                    className="w-full mt-2 accent-violet-500"
                                />
                                <div className="flex justify-between text-xs text-zinc-600 mt-1">
                                    <span>5h</span><span>20h</span><span>40h</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-zinc-400 mb-2.5 uppercase tracking-wide">Skills</label>
                            <div className="flex flex-wrap gap-2">
                                {ALL_SKILLS.map(s => (
                                    <SkillBadge
                                        key={s.value}
                                        skill={s}
                                        selected={newSkills.includes(s.value)}
                                        onClick={() => toggleSkill(s.value)}
                                    />
                                ))}
                            </div>
                        </div>

                        {nameError && <p className="text-red-400 text-sm">{nameError}</p>}

                        <button
                            onClick={addMember}
                            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                        >
                            + Add Member
                        </button>
                    </div>

                    {/* Roster list */}
                    {roster.length > 0 && (
                        <div className="space-y-2">
                            {roster.map((m) => (
                                <div
                                    key={m.userId}
                                    className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3 group hover:border-violet-500/30 transition-all"
                                >
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-sky-600 flex items-center justify-center text-sm font-bold shrink-0">
                                        {m.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold truncate">{m.name}</div>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {m.skills.map(sk => {
                                                const s = ALL_SKILLS.find(a => a.value === sk);
                                                return (
                                                    <span key={sk} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: (s?.color || "#6366f1") + "22", color: s?.color || "#6366f1" }}>
                                                        {s?.label || sk}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="text-xs text-zinc-500 shrink-0">{m.capacity}h/wk</div>
                                    <button
                                        onClick={() => removeMember(m.userId)}
                                        className="text-zinc-600 hover:text-red-400 transition-colors text-lg opacity-0 group-hover:opacity-100 shrink-0"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ── SECTION 2: Roles & Tasks ──────────────────────────────────── */}
                <section>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-full bg-sky-600/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold text-sm">2</div>
                        <h2 className="text-xl font-semibold">Roles & Tasks</h2>
                        <span className="ml-2 text-xs text-zinc-500">Edit tasks or leave defaults</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {roles.map((role, roleIdx) => (
                            <div key={roleIdx} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 hover:border-sky-500/30 transition-all">
                                <div className="font-semibold text-sky-400 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-sky-400 inline-block"></span>
                                    {role.title}
                                </div>
                                <div className="space-y-2 mb-3">
                                    {role.tasks.map((task, taskIdx) => (
                                        <div key={taskIdx} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={task.title}
                                                onChange={e => updateTask(roleIdx, taskIdx, "title", e.target.value)}
                                                placeholder="Task title"
                                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500 transition-colors min-w-0"
                                            />
                                            <input
                                                type="number"
                                                min={1} max={40}
                                                value={task.estimatedHours}
                                                onChange={e => updateTask(roleIdx, taskIdx, "estimatedHours", Number(e.target.value))}
                                                className="w-16 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-2 text-sm text-center text-white focus:outline-none focus:border-sky-500 transition-colors"
                                            />
                                            <span className="text-xs text-zinc-600 self-center">h</span>
                                            <button
                                                onClick={() => removeTask(roleIdx, taskIdx)}
                                                className="text-zinc-600 hover:text-red-400 transition-colors text-sm px-1"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => addTask(roleIdx)}
                                    className="text-xs text-sky-500 hover:text-sky-400 transition-colors"
                                >
                                    + Add task
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── SECTION 3: Run ────────────────────────────────────────────── */}
                <section>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm">3</div>
                        <h2 className="text-xl font-semibold">Run Distribution</h2>
                    </div>

                    <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
                        {!canDistribute ? (
                            <p className="text-zinc-500 text-sm mb-4">
                                ⬆ Add at least one team member to run the algorithm.
                            </p>
                        ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm text-zinc-300">Ready to distribute!</p>
                                    <p className="text-xs text-zinc-500">
                                        {roster.length} member{roster.length !== 1 ? "s" : ""} · {roles.reduce((s, r) => s + r.tasks.filter(t => t.title.trim()).length, 0)} tasks across {roles.length} roles
                                    </p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleDistribute}
                            disabled={!canDistribute || running || distributed}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${distributed
                                    ? "bg-emerald-600 text-white scale-[1.01]"
                                    : canDistribute
                                        ? "bg-gradient-to-r from-violet-600 to-sky-600 hover:from-violet-500 hover:to-sky-500 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-violet-500/25"
                                        : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                                }`}
                        >
                            {distributed
                                ? "✓ Distribution complete! Redirecting..."
                                : running
                                    ? "Running algorithm..."
                                    : "⚡ Distribute Now"}
                        </button>

                        <p className="text-xs text-zinc-600 mt-3 text-center">
                            Uses the Greedy Best-Fit algorithm — skill scoring + capacity-aware task packing
                        </p>
                    </div>
                </section>

            </div>

            <StepFooter projectId={projectId} currentStep="team-setup" canContinue={distributed} />
        </div>
    );
}
