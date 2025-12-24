"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, User, Users, Plus, X, Sparkles } from "lucide-react";

const APP_TYPES = ["Food delivery", "E-commerce", "Notes app", "Chat", "Attendance", "Task manager"];
const FEATURES = [
  { id: "auth", label: "Authentication" },
  { id: "crud", label: "CRUD" },
  { id: "notifications", label: "Notifications" },
  { id: "payments", label: "Payments" },
  { id: "search", label: "Search" },
  { id: "realtime", label: "Real-time tracking" }
];
const STRENGTHS = ["Backend", "Frontend", "UI/UX", "Database", "DevOps", "Testing", "Documentation"];

type ProjectMode = "solo" | "team";
type TeamMember = {
  name: string;
  email: string;
  skills: string;
  availableHours: number;
  skillLevel: "beginner" | "intermediate" | "advanced";
  strengths: string[];
  weaknesses: string;
};

export default function StudentNewWizard({ defaultAppType = "Food delivery" }: { defaultAppType?: string }) {
  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") || undefined : undefined;

  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<ProjectMode | null>(null);
  const [title, setTitle] = useState("");
  const [appType, setAppType] = useState(defaultAppType);
  const [skillLevel, setSkillLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(["auth", "crud"]);
  const [storeRawLLMOutput, setStoreRawLLMOutput] = useState(false);
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMember, setNewMember] = useState<TeamMember>({
    name: "", email: "", skills: "", availableHours: 20,
    skillLevel: "beginner", strengths: [], weaknesses: ""
  });
  const [deadline, setDeadline] = useState("");
  const [teamSize, setTeamSize] = useState(2);
  
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toggleFeature(id: string) {
    setSelectedFeatures(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function toggleStrength(strength: string) {
    const updated = { ...newMember };
    if (updated.strengths.includes(strength)) {
      updated.strengths = updated.strengths.filter(s => s !== strength);
    } else {
      updated.strengths = [...updated.strengths, strength];
    }
    setNewMember(updated);
  }

  function addTeamMember() {
    if (!newMember.name || !newMember.email) {
      setErr("Name and email required");
      return;
    }
    setTeamMembers([...teamMembers, newMember]);
    setNewMember({ name: "", email: "", skills: "", availableHours: 20, skillLevel: "beginner", strengths: [], weaknesses: "" });
    setErr(null);
  }

  function removeMember(index: number) {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  }

  // Normalize members payload to backend shape
  function normalizeMembers(membersState: TeamMember[]) {
    return membersState.map(m => {
      const skills = m.skills.split(",").map(s => s.trim()).filter(Boolean);
      const skill_tags = skills.map(s => ({
        name: s,
        level: m.skillLevel || "beginner",
        score: m.skillLevel === "advanced" ? 80 : m.skillLevel === "intermediate" ? 50 : 20
      }));

      return {
        name: m.name,
        email: m.email,
        skill_tags,
        availability_hours_per_week: m.availableHours ?? 0,
        strengths: Array.isArray(m.strengths) ? m.strengths : [],
        weaknesses: m.weaknesses ? [m.weaknesses] : []
      };
    });
  }

  async function handleCreateSolo() {
    setErr(null);
    setLoading(true);
    try {
      console.log('[wizard] teamMembers before normalize:', teamMembers);
      const membersPayload = normalizeMembers(teamMembers || []);
      console.log('[wizard] membersPayload after normalize:', membersPayload);
      const payload = {
        title: title || `${appType} project`,
        appType, skillLevel, selectedFeatures, storeRawLLMOutput, mode: "solo",
        members: membersPayload,
        team_size: Number(teamSize) || 1
      };
      console.log('[wizard] SOLO payload being sent:', payload);
      
      const res = await fetch("/api/student/project/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!data.ok && !data.projectId) throw new Error(data.error || "create failed");
      const projectId = data.projectId || data.project?._id;

      const r = await fetch("/api/student/project/generate-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ projectId })
      });
      
      if (!r.ok) console.warn("generateRoles failed");
      router.push(`/student/${projectId}/proposal`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTeam() {
    setErr(null);
    setLoading(true);
    try {
      console.log('[wizard] teamMembers before normalize:', teamMembers);
      const membersPayload = normalizeMembers(teamMembers || []);
      console.log('[wizard] membersPayload after normalize:', membersPayload);
      const payload = {
        title: title || `${appType} team project`,
        appType, skillLevel: "intermediate", selectedFeatures, storeRawLLMOutput, mode: "team", deadline,
        members: membersPayload,
        team_size: Number(teamSize) || 2
      };
      console.log('[wizard] TEAM payload being sent:', payload);
      
      const res = await fetch("/api/student/project/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!data.ok && !data.projectId) throw new Error(data.error || "create failed");
      const projectId = data.projectId || data.project?._id;

      // Members are now saved in create endpoint, no need for separate distribute call
      router.push(`/student/${projectId}/proposal`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const totalSteps = mode === "team" ? 5 : 4;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Student Mode</h1>
              <p className="text-sm text-zinc-500">Create your learning project</p>
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs uppercase tracking-wider text-zinc-400">Step {step} of {totalSteps}</span>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl border border-white/5 shadow-2xl">
          <div className="px-8 py-10 min-h-[500px] flex flex-col">
            <div className="flex-1">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold text-white tracking-tight mb-2">Choose Your Learning Path</h3>
                    <p className="text-sm text-zinc-400">Select the mode that fits your project</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
                    <button 
                      onClick={() => setMode("solo")} 
                      className={`group relative p-8 rounded-2xl border-2 transition-all duration-300 h-full flex flex-col ${
                        mode === "solo" 
                          ? "border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-green-500/5 shadow-lg shadow-emerald-500/20" 
                          : "border-white/5 bg-zinc-900/50 hover:border-emerald-500/30 hover:bg-zinc-900/80"
                      }`}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
                      <div className="relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center mb-4 mx-auto">
                          <User className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div className="font-bold text-white text-lg mb-2">ENGINE 1: Solo Learning</div>
                        <div className="text-sm text-zinc-400 leading-relaxed">Guided architecture learning path designed for individual students</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => setMode("team")} 
                      className={`group relative p-8 rounded-2xl border-2 transition-all duration-300 h-full flex flex-col ${
                        mode === "team" 
                          ? "border-indigo-500/50 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 shadow-lg shadow-indigo-500/20" 
                          : "border-white/5 bg-zinc-900/50 hover:border-indigo-500/30 hover:bg-zinc-900/80"
                      }`}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
                      <div className="relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4 mx-auto">
                          <Users className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div className="font-bold text-white text-lg mb-2">ENGINE 2: Team Distribution</div>
                        <div className="text-sm text-zinc-400 leading-relaxed">AI-powered team formation with skill-based role allocation</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && mode && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Project Title (Optional)</label>
                    <input 
                      value={title} 
                      onChange={e => setTitle(e.target.value)} 
                      placeholder="e.g., My Food Delivery Platform" 
                      className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-3">App Type</label>
                    <div className="grid grid-cols-3 gap-3">
                      {APP_TYPES.map(t => (
                        <button 
                          key={t} 
                          onClick={() => setAppType(t)} 
                          className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                            appType === t 
                              ? "border-indigo-500/50 bg-indigo-600/20 text-indigo-300" 
                              : "border-white/10 text-zinc-400 hover:border-white/20 hover:bg-white/5"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-3">Features</label>
                    <div className="grid grid-cols-2 gap-3">
                      {FEATURES.map(f => (
                        <button 
                          key={f.id} 
                          onClick={() => toggleFeature(f.id)} 
                          className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                            selectedFeatures.includes(f.id) 
                              ? "border-indigo-500/50 bg-indigo-600/20 text-indigo-300" 
                              : "border-white/10 text-zinc-400 hover:border-white/20 hover:bg-white/5"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {mode === "team" && (
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Deadline (Optional)</label>
                      <input 
                        type="date" 
                        value={deadline} 
                        onChange={e => setDeadline(e.target.value)} 
                        className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                      />
                    </div>
                  )}
                </div>
              )}

              {step === 3 && mode === "solo" && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-white tracking-tight mb-2">Your Skill Level</h3>
                    <p className="text-sm text-zinc-400">Help us tailor the learning experience</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                    {["beginner", "intermediate", "advanced"].map(level => (
                      <button 
                        key={level} 
                        onClick={() => setSkillLevel(level as typeof skillLevel)} 
                        className={`px-6 py-6 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                          skillLevel === level 
                            ? "border-indigo-500/50 bg-indigo-600/20 text-white shadow-lg shadow-indigo-500/20" 
                            : "border-white/10 text-zinc-400 hover:border-white/20 hover:bg-white/5"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && mode === "team" && (
                <div className="space-y-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-white tracking-tight mb-2">Add Team Members</h3>
                    <p className="text-sm text-zinc-400">Build your team with their skills and availability</p>
                  </div>
                  
                  <div className="p-6 bg-white/5 rounded-xl border border-white/10 space-y-4">
                    <input 
                      placeholder="Name" 
                      value={newMember.name} 
                      onChange={e => setNewMember({...newMember, name: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50"
                    />
                    <input 
                      placeholder="Email" 
                      value={newMember.email} 
                      onChange={e => setNewMember({...newMember, email: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50"
                    />
                    <input 
                      placeholder="Skills (React, Node, Python)" 
                      value={newMember.skills} 
                      onChange={e => setNewMember({...newMember, skills: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50"
                    />
                    
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Skill Level</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["beginner", "intermediate", "advanced"].map(level => (
                          <button 
                            key={level} 
                            onClick={() => setNewMember({...newMember, skillLevel: level as typeof newMember.skillLevel})} 
                            className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                              newMember.skillLevel === level 
                                ? "bg-indigo-600/20 border border-indigo-500 text-indigo-300" 
                                : "bg-zinc-900 border border-white/10 text-zinc-400 hover:border-white/20"
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Strengths</label>
                      <div className="flex gap-2 flex-wrap">
                        {STRENGTHS.map(s => (
                          <button 
                            key={s} 
                            onClick={() => toggleStrength(s)} 
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              newMember.strengths.includes(s) 
                                ? "bg-indigo-600/20 border border-indigo-500 text-indigo-300" 
                                : "bg-zinc-900 border border-white/10 text-zinc-400 hover:border-white/20"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <input 
                      placeholder="Weaknesses (what they don't know)" 
                      value={newMember.weaknesses} 
                      onChange={e => setNewMember({...newMember, weaknesses: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50"
                    />
                    <input 
                      type="number" 
                      placeholder="Hours/week" 
                      value={newMember.availableHours} 
                      onChange={e => setNewMember({...newMember, availableHours: parseInt(e.target.value) || 20})} 
                      className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50"
                    />
                    
                    <button 
                      onClick={addTeamMember} 
                      className="w-full px-4 py-3 bg-indigo-600/80 hover:bg-indigo-500 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Member
                    </button>
                  </div>
                  
                  {teamMembers.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm uppercase tracking-wider text-zinc-500 mb-3">Team ({teamMembers.length})</h4>
                      <div className="space-y-2">
                        {teamMembers.map((m, i) => (
                          <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-start justify-between">
                            <div>
                              <div className="font-medium text-white">{m.name} • {m.skillLevel}</div>
                              <div className="text-xs text-zinc-400 mt-1">{m.skills || "No skills"} • {m.availableHours}h/week</div>
                            </div>
                            <button 
                              onClick={() => removeMember(i)} 
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 4 && mode === "team" && (
                <div className="space-y-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-white tracking-tight mb-2">Team Configuration</h3>
                    <p className="text-sm text-zinc-400">Configure how teams will be formed</p>
                  </div>
                  
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Team Size</label>
                    <input 
                      type="number" 
                      value={teamSize} 
                      onChange={e => setTeamSize(parseInt(e.target.value) || 2)} 
                      className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50"
                      min="2" 
                      max={teamMembers.length} 
                    />
                  </div>
                  
                  <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-sm font-medium text-white mb-3">Summary</div>
                    <ul className="text-sm text-zinc-400 space-y-2">
                      <li>• {teamMembers.length} students total</li>
                      <li>• {teamSize} members per team</li>
                      <li>• Approximately {Math.ceil(teamMembers.length / teamSize)} teams will be formed</li>
                    </ul>
                  </div>
                </div>
              )}

              {((step === 4 && mode === "solo") || (step === 5 && mode === "team")) && (
                <div className="space-y-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-white tracking-tight mb-2">Review & Confirm</h3>
                    <p className="text-sm text-zinc-400">Check your project details before creating</p>
                  </div>
                  
                  <div className="p-6 bg-white/5 rounded-xl border border-white/10 space-y-3">
                    <div className="flex items-start justify-between py-2 border-b border-white/5">
                      <span className="text-xs uppercase tracking-wider text-zinc-500">Mode</span>
                      <span className="text-sm font-medium text-white">{mode === "solo" ? "Solo Learning 🧠" : "Team Distribution 🔥"}</span>
                    </div>
                    <div className="flex items-start justify-between py-2 border-b border-white/5">
                      <span className="text-xs uppercase tracking-wider text-zinc-500">App Type</span>
                      <span className="text-sm font-medium text-white">{appType}</span>
                    </div>
                    {mode === "solo" && (
                      <div className="flex items-start justify-between py-2 border-b border-white/5">
                        <span className="text-xs uppercase tracking-wider text-zinc-500">Skill Level</span>
                        <span className="text-sm font-medium text-white capitalize">{skillLevel}</span>
                      </div>
                    )}
                    {mode === "team" && (
                      <div className="flex items-start justify-between py-2 border-b border-white/5">
                        <span className="text-xs uppercase tracking-wider text-zinc-500">Team Structure</span>
                        <span className="text-sm font-medium text-white">{teamMembers.length} members → {Math.ceil(teamMembers.length / teamSize)} teams</span>
                      </div>
                    )}
                    <div className="flex items-start justify-between py-2">
                      <span className="text-xs uppercase tracking-wider text-zinc-500">Features</span>
                      <span className="text-sm font-medium text-white text-right">{selectedFeatures.join(", ")}</span>
                    </div>
                  </div>
                  
                  <label className="flex items-center gap-3 text-sm text-zinc-400 cursor-pointer hover:text-zinc-300 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={storeRawLLMOutput} 
                      onChange={e => setStoreRawLLMOutput(e.target.checked)} 
                      className="w-4 h-4 rounded bg-zinc-900 border-white/10 cursor-pointer"
                    />
                    <span>Save raw AI outputs for debugging (optional)</span>
                  </label>
                </div>
              )}
            </div>

            {err && (
              <div className="mt-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {err}
              </div>
            )}

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
              <div>
                {step > 1 && (
                  <button 
                    onClick={() => setStep(step - 1)} 
                    className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white flex items-center gap-2 hover:bg-white/10 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
              </div>
              <div>
                {step < totalSteps && mode && (
                  <button 
                    onClick={() => {
                      if (step === 3 && mode === "team" && teamMembers.length === 0) {
                        setErr("Add at least one team member");
                        return;
                      }
                      setStep(step + 1);
                      setErr(null);
                    }} 
                    className="px-5 py-2.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 text-white text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!mode && step === 1}
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                {((step === 4 && mode === "solo") || (step === 5 && mode === "team")) && (
                  <button 
                    onClick={mode === "solo" ? handleCreateSolo : handleCreateTeam} 
                    disabled={loading || (mode === "team" && teamMembers.length === 0)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 text-white text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating..." : "Create Project"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
