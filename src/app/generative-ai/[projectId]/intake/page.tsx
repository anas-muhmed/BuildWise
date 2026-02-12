// app/generative-ai/[id]/intake/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";

// 🎯 MASTER PLAN: Phase 1 - Smart Intake (conversational + structured)
// Q1: Target users → Q2: Traffic → Q3: Budget/Team → Q4: Features → Q5: Priorities

type Question = {
  id: string;
  label: string;
  type: "multi-select" | "radio" | "dropdown" | "slider" | "tags";
  options?: string[];
  helper?: string;
};

const questions: Question[] = [
  {
    id: "users",
    label: "Primary users",
    type: "multi-select",
    options: ["Students", "Business owners", "General public", "Enterprises", "Developers", "Drivers/Delivery workers"],
    helper: "Affects authentication, access control, and UI complexity"
  },
  {
    id: "traffic",
    label: "Expected traffic level",
    type: "radio",
    options: ["Small (< 1K users)", "Medium (1K-50K users)", "Large (50K+ users)"],
    helper: "Determines database, caching, and infrastructure choices"
  },
  {
    id: "budget",
    label: "Budget tier",
    type: "radio",
    options: ["Low (minimize costs)", "Medium (balanced)", "High (performance first)"],
    helper: "Affects cloud provider and service selection"
  },
  {
    id: "team_size",
    label: "Team size",
    type: "slider",
    helper: "Determines architecture complexity and tooling"
  },
  {
    id: "features",
    label: "Must-have features",
    type: "tags",
    options: ["Real-time tracking", "Payments", "Notifications", "Chat/Messaging", "File uploads", "Search", "Authentication", "Admin dashboard", "Analytics"],
    helper: "Core features that drive architecture decisions"
  },
  {
    id: "priorities",
    label: "Top priorities",
    type: "multi-select",
    options: ["Speed/Performance", "Low cost", "High reliability", "Real-time updates", "Easy maintenance", "Scalability"],
    helper: "Guides technology selection and trade-offs"
  }
];

export default function IntakePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [currentStep, setCurrentStep] = useState(0);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [answers, setAnswers] = useState<Record<string, any>>({
    users: [],
    traffic: "",
    budget: "",
    team_size: 2,
    features: [],
    priorities: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [project, setProject] = useState<any>(null);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // Load project details
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`/api/generative/projects/${projectId}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    })
      .then(res => res.json())
      .then(data => setProject(data))
      .catch(err => console.error(err));
  }, [projectId]);

  const currentQuestion = questions[currentStep];
  const isLastQuestion = currentStep === questions.length - 1;
  const canProceed = () => {
    const answer = answers[currentQuestion.id];
    if (currentQuestion.type === "multi-select" || currentQuestion.type === "tags") {
      return Array.isArray(answer) && answer.length > 0;
    }
    if (currentQuestion.type === "slider") {
      return answer > 0;
    }
    return !!answer;
  };

  const handleMultiSelect = (option: string) => {
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

  const handleSlider = (value: number) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
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

    // Normalize answers into structured requirements
    const requirements = {
      app_type: project?.starter_prompt || "web app",
      users: answers.users,
      traffic: answers.traffic.includes("Small") ? "small" : 
               answers.traffic.includes("Medium") ? "medium" : "large",
      budget: answers.budget.includes("Low") ? "low" :
              answers.budget.includes("Medium") ? "medium" : "high",
      team_size: answers.team_size,
      must_have_features: answers.features,
      priorities: answers.priorities
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/generative/projects/${projectId}/requirements`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ requirements })
      });

      if (!res.ok) throw new Error("Failed to save requirements");

      // Move to Phase 2 (Stack Proposal)
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
                {Math.round(((currentStep + 1) / questions.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">
                {currentQuestion.label}
              </h2>
              {currentQuestion.helper && (
                <p className="text-sm text-zinc-500 mt-1">
                  {currentQuestion.helper}
                </p>
              )}
            </div>

            {/* Multi-Select Chips */}
            {currentQuestion.type === "multi-select" && (
              <div className="flex flex-wrap gap-3">
                {currentQuestion.options?.map(option => {
                  const isSelected = answers[currentQuestion.id]?.includes(option);
                  return (
                    <button
                      key={option}
                      onClick={() => handleMultiSelect(option)}
                      className={`px-6 py-3 rounded-xl font-medium transition-all cursor-pointer ${
                        isSelected
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
                {currentQuestion.options?.map(option => {
                  const isSelected = answers[currentQuestion.id] === option;
                  return (
                    <button
                      key={option}
                      onClick={() => handleRadio(option)}
                      className={`w-full text-left px-6 py-4 rounded-xl font-medium transition-all border-2 cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white border-purple-500 shadow-lg"
                          : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:shadow-md"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Slider */}
            {currentQuestion.type === "slider" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-zinc-400">Team size:</span>
                  <span className="text-3xl font-bold text-purple-400">{answers.team_size}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={answers.team_size}
                  onChange={(e) => handleSlider(parseInt(e.target.value))}
                  className="w-full h-3 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs text-zinc-500 mt-2">
                  <span>Solo (1)</span>
                  <span>Small (5)</span>
                  <span>Large (20+)</span>
                </div>
              </div>
            )}

            {/* Tags Input */}
            {currentQuestion.type === "tags" && (
              <div className="flex flex-wrap gap-3">
                {currentQuestion.options?.map(option => {
                  const isSelected = answers[currentQuestion.id]?.includes(option);
                  return (
                    <button
                      key={option}
                      onClick={() => handleMultiSelect(option)}
                      className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-105"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {isSelected ? "✓ " : ""}{option}
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
              {isSubmitting ? "Saving..." : isLastQuestion ? "Generate Architecture →" : "Next →"}
            </button>
          </div>
      </div>
    </DashboardLayoutWrapper>
  );
}
