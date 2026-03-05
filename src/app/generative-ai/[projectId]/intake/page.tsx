"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";
import { useRequireAuth } from "@/lib/useRequireAuth";
import {
  Sparkles, Users, Zap, Shield, CreditCard, MessageSquare,
  Search, Bell, Upload, Lock, ArrowRight, ArrowLeft, CheckCircle2
} from "lucide-react";

// ── 3 Architecture-Driving Questions ────────────────────────────────────────

const SCALE_OPTIONS = [
  { id: "small", label: "Small", detail: "< 1,000 users", description: "Personal project, internal tool, or MVP", icon: "🏠" },
  { id: "medium", label: "Medium", detail: "1K – 100K users", description: "Growing startup or mid-size platform", icon: "🏢" },
  { id: "large", label: "Large", detail: "100K+ users", description: "High-traffic platform requiring serious scale", icon: "🏙️" },
];

const INTEGRATION_OPTIONS = [
  { id: "auth", label: "User Authentication", icon: <Lock className="w-4 h-4" />, color: "text-blue-400" },
  { id: "payments", label: "Payments", icon: <CreditCard className="w-4 h-4" />, color: "text-green-400" },
  { id: "realtime", label: "Real-time / WebSockets", icon: <Zap className="w-4 h-4" />, color: "text-amber-400" },
  { id: "file-storage", label: "File / Media Storage", icon: <Upload className="w-4 h-4" />, color: "text-pink-400" },
  { id: "search", label: "Search / Filtering", icon: <Search className="w-4 h-4" />, color: "text-cyan-400" },
  { id: "notifications", label: "Push Notifications", icon: <Bell className="w-4 h-4" />, color: "text-purple-400" },
  { id: "chat", label: "Chat / Messaging", icon: <MessageSquare className="w-4 h-4" />, color: "text-rose-400" },
  { id: "analytics", label: "Analytics / Dashboard", icon: <Users className="w-4 h-4" />, color: "text-indigo-400" },
];

const PRIORITY_OPTIONS = [
  { id: "ship-fast", label: "Ship Fast", detail: "Get to market quickly, iterate later", icon: "🚀", gradient: "from-amber-500 to-orange-500" },
  { id: "scale-big", label: "Scale Big", detail: "Built to handle growth from day one", icon: "📈", gradient: "from-blue-500 to-indigo-500" },
  { id: "keep-cheap", label: "Keep It Cheap", detail: "Minimize infrastructure costs", icon: "💰", gradient: "from-emerald-500 to-teal-500" },
  { id: "max-security", label: "Maximum Security", detail: "Data protection and compliance first", icon: "🔒", gradient: "from-purple-500 to-violet-500" },
];

// ── Intake Page ─────────────────────────────────────────────────────────────

export default function IntakePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const [project, setProject] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [scale, setScale] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<string[]>([]);
  const [priority, setPriority] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load project
  useEffect(() => {
    if (!projectId) return;
    const token = localStorage.getItem("token");
    fetch(`/api/generative/projects/${projectId}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    })
      .then(res => res.json())
      .then(data => setProject(data))
      .catch(console.error);
  }, [projectId]);

  const totalSteps = 3;

  const canProceed = () => {
    if (currentStep === 0) return !!scale;
    if (currentStep === 1) return integrations.length > 0;
    if (currentStep === 2) return !!priority;
    return false;
  };

  const toggleIntegration = (id: string) => {
    setIntegrations(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const requirements = {
      app_type: project?.starter_prompt || "web app",
      scale,
      integrations,
      priority,
      // Map to existing schema fields for backward compatibility
      traffic: scale === "small" ? "small" : scale === "medium" ? "medium" : "large",
      budget: priority === "keep-cheap" ? "low" : priority === "scale-big" ? "high" : "medium",
      must_have_features: integrations.map(id => {
        const opt = INTEGRATION_OPTIONS.find(o => o.id === id);
        return opt?.label || id;
      }),
      priorities: [PRIORITY_OPTIONS.find(o => o.id === priority)?.label || ""],
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/generative/projects/${projectId}/requirements`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ requirements }),
      });

      if (!res.ok) throw new Error("Failed to save requirements");
      router.push(`/generative-ai/${projectId}/proposal`);
    } catch (error) {
      console.error(error);
      alert("Failed to save. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === totalSteps - 1) {
      await handleSubmit();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  if (!project) {
    return (
      <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Smart Intake">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-zinc-400">Loading project...</div>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  return (
    <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Smart Intake">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Step {currentStep + 1} of {totalSteps}</span>
            <span className="text-zinc-600">{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Question 1: Scale */}
        {currentStep === 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">How big will this get?</h2>
              <p className="text-zinc-500">This determines whether we design a monolith, services, or serverless architecture.</p>
            </div>
            <div className="space-y-3">
              {SCALE_OPTIONS.map((opt) => {
                const isSelected = scale === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setScale(opt.id)}
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer group
                      ${isSelected
                        ? "bg-purple-500/10 border-purple-500 shadow-lg shadow-purple-500/10"
                        : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/70"
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{opt.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-white text-lg">{opt.label}</h3>
                          <span className={`text-sm px-2 py-0.5 rounded-full ${isSelected ? "bg-purple-500/20 text-purple-300" : "bg-zinc-800 text-zinc-500"}`}>
                            {opt.detail}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400 mt-0.5">{opt.description}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-6 h-6 text-purple-400 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Question 2: Integrations */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">What does your app need?</h2>
              <p className="text-zinc-500">Each selection adds a dedicated module to your architecture. Pick all that apply.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {INTEGRATION_OPTIONS.map((opt) => {
                const isSelected = integrations.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleIntegration(opt.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                      ${isSelected
                        ? "bg-zinc-800/80 border-purple-500/60 shadow-lg shadow-purple-500/5"
                        : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-600"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`${opt.color}`}>{opt.icon}</div>
                      <span className={`font-medium text-sm ${isSelected ? "text-white" : "text-zinc-300"}`}>
                        {opt.label}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-400 ml-auto" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-zinc-600 text-center">
              Selected: {integrations.length} integration{integrations.length !== 1 ? "s" : ""} → {integrations.length} module{integrations.length !== 1 ? "s" : ""} in your architecture
            </p>
          </div>
        )}

        {/* Question 3: Priority */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">What matters most?</h2>
              <p className="text-zinc-500">This drives every trade-off decision in your architecture.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {PRIORITY_OPTIONS.map((opt) => {
                const isSelected = priority === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setPriority(opt.id)}
                    className={`text-left p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer
                      ${isSelected
                        ? "bg-zinc-800/80 border-purple-500 shadow-xl shadow-purple-500/10 scale-[1.02]"
                        : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/70"
                      }`}
                  >
                    <span className="text-3xl block mb-3">{opt.icon}</span>
                    <h3 className="font-bold text-white text-lg mb-1">{opt.label}</h3>
                    <p className="text-sm text-zinc-400">{opt.detail}</p>
                    {isSelected && (
                      <div className="mt-3 flex items-center gap-1.5 text-purple-400 text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4">
          <button
            onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:opacity-90 shadow-xl shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : currentStep === totalSteps - 1 ? (
              <>
                <Sparkles className="w-4 h-4" /> Generate Architecture <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Next <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}
