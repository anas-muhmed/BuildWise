// app/generative-ai/[projectId]/intake/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";
import { useRequireAuth } from "@/lib/useRequireAuth";

// ── 5 focused questions that actually drive the AI proposal ────────────────

type Question = {
  id: string;
  label: string;
  subtitle: string;
  type: "multi-select" | "radio" | "tags";
  options: string[];
};

const questions: Question[] = [
  {
    id: "users",
    label: "Who will use this app?",
    subtitle: "This determines authentication complexity, role-based access, and UI patterns",
    type: "multi-select",
    options: ["Students", "Business owners", "General public", "Enterprises", "Developers", "Drivers / Delivery workers"],
  },
  {
    id: "traffic",
    label: "How much traffic do you expect?",
    subtitle: "Directly impacts database choice, caching strategy, and hosting costs",
    type: "radio",
    options: ["Small — under 1K users", "Medium — 1K to 50K users", "Large — 50K+ users"],
  },
  {
    id: "budget",
    label: "What's your budget priority?",
    subtitle: "Affects whether we pick managed services, open-source, or enterprise tools",
    type: "radio",
    options: ["Keep it cheap — minimize monthly costs", "Balanced — reasonable spend for reliability", "Performance first — budget is flexible"],
  },
  {
    id: "features",
    label: "What features must your app have?",
    subtitle: "Each feature maps to specific architecture components and services",
    type: "tags",
    options: ["Real-time tracking", "Payments", "Push notifications", "Chat / Messaging", "File uploads", "Search", "User authentication", "Admin dashboard", "Analytics / Reports"],
  },
  {
    id: "priorities",
    label: "What matters most to you?",
    subtitle: "These priorities guide every trade-off in the architecture proposal",
    type: "multi-select",
    options: ["Speed / Performance", "Low cost", "High reliability", "Real-time updates", "Easy maintenance", "Scalability"],
  },
];

// ── Intake Page ────────────────────────────────────────────────────────────

export default function IntakePage() {
  const { isAuthenticated, isLoading } = useRequireAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [currentStep, setCurrentStep] = useState(0);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [answers, setAnswers] = useState<Record<string, any>>({
    users: [],
    traffic: "",
    budget: "",
    features: [],
    priorities: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [project, setProject] = useState<any>(null);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  useEffect(() => {
    if (!projectId) return;
    const token = localStorage.getItem("token");
    fetch(`/api/generative/projects/${projectId}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
      .then((res) => res.json())
      .then((data) => setProject(data))
      .catch((err) => console.error(err));
  }, [projectId]);

  // Auth guard — after all hooks
  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return null;

  const currentQuestion = questions[currentStep];
  const isLastQuestion = currentStep === questions.length - 1;

  const canProceed = () => {
    const answer = answers[currentQuestion.id];
    if (currentQuestion.type === "multi-select" || currentQuestion.type === "tags") {
      return Array.isArray(answer) && answer.length > 0;
    }
    return !!answer;
  };

  const handleToggle = (option: string) => {
    const current = answers[currentQuestion.id] || [];
    if (current.includes(option)) {
      setAnswers({ ...answers, [currentQuestion.id]: current.filter((o: string) => o !== option) });
    } else {
      setAnswers({ ...answers, [currentQuestion.id]: [...current, option] });
    }
  };

  const handleRadio = (option: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: option });
  };

  const handleNext = async () => {
    if (isLastQuestion) {
      await handleSubmit();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const requirements = {
      app_type: project?.starter_prompt || "web app",
      users: answers.users,
      traffic: answers.traffic.includes("Small") ? "small" : answers.traffic.includes("Medium") ? "medium" : "large",
      budget: answers.budget.includes("cheap") ? "low" : answers.budget.includes("Balanced") ? "medium" : "high",
      must_have_features: answers.features,
      priorities: answers.priorities,
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
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-400">
              Step {currentStep + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium text-zinc-400">
              {Math.round(((currentStep + 1) / questions.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">{currentQuestion.label}</h2>
            <p className="text-sm text-zinc-500 mt-1">{currentQuestion.subtitle}</p>
          </div>

          {/* Multi-Select Chips */}
          {currentQuestion.type === "multi-select" && (
            <div className="flex flex-wrap gap-3">
              {currentQuestion.options.map((option) => {
                const isSelected = answers[currentQuestion.id]?.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => handleToggle(option)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all cursor-pointer ${isSelected
                        ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg scale-105"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          {/* Radio Buttons */}
          {currentQuestion.type === "radio" && (
            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const isSelected = answers[currentQuestion.id] === option;
                return (
                  <button
                    key={option}
                    onClick={() => handleRadio(option)}
                    className={`w-full text-left px-6 py-4 rounded-xl font-medium transition-all border-2 cursor-pointer ${isSelected
                        ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white border-purple-500 shadow-lg"
                        : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:shadow-md"
                      }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tags */}
          {currentQuestion.type === "tags" && (
            <div className="flex flex-wrap gap-3">
              {currentQuestion.options.map((option) => {
                const isSelected = answers[currentQuestion.id]?.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => handleToggle(option)}
                    className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all cursor-pointer ${isSelected
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-105"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                  >
                    {isSelected ? "✓ " : ""}
                    {option}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 0}
            className="px-6 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            ← Back
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:opacity-90 shadow-xl shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            {isSubmitting ? "Generating..." : isLastQuestion ? "Generate Architectures →" : "Next →"}
          </button>
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}
