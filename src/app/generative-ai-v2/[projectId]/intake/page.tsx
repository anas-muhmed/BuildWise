// app/generative-ai-v2/[id]/intake/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";

// 🎯 MASTER PLAN: Phase 1 - Smart Intake (conversational + structured)
// Q1: Target users → Q2: Traffic → Q3: Budget/Team → Q4: Features → Q5: Priorities

type Question = {
  id: string;
  text: string;
  type: "multi-select" | "radio" | "dropdown" | "slider" | "tags";
  options?: string[];
  explanation?: string;
};

const questions: Question[] = [
  {
    id: "users",
    text: "Who will use your app?",
    type: "multi-select",
    options: ["Students", "Business owners", "General public", "Enterprises", "Developers", "Drivers/Delivery workers"],
    explanation: "Understanding your users helps us design appropriate authentication, UI complexity, and data models."
  },
  {
    id: "traffic",
    text: "Expected traffic level?",
    type: "radio",
    options: ["Small (< 1K users)", "Medium (1K-50K users)", "Large (50K+ users)"],
    explanation: "This determines database choices, caching strategies, and infrastructure complexity."
  },
  {
    id: "budget",
    text: "Budget tier?",
    type: "radio",
    options: ["Low (minimize costs)", "Medium (balanced)", "High (performance first)"],
    explanation: "Affects cloud provider choices, managed services vs self-hosted, and redundancy levels."
  },
  {
    id: "team_size",
    text: "Team size?",
    type: "slider",
    explanation: "Smaller teams need simpler stacks. Larger teams can handle microservices."
  },
  {
    id: "features",
    text: "Must-have features?",
    type: "tags",
    options: ["Real-time tracking", "Payments", "Notifications", "Chat/Messaging", "File uploads", "Search", "Authentication", "Admin dashboard", "Analytics"],
    explanation: "We'll build your architecture around these core features."
  },
  {
    id: "priorities",
    text: "What matters most?",
    type: "multi-select",
    options: ["Speed/Performance", "Low cost", "High reliability", "Real-time updates", "Easy maintenance", "Scalability"],
    explanation: "These priorities guide our technology recommendations and trade-off decisions."
  }
];

export default function IntakePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

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
  const [aiFollowUp, setAiFollowUp] = useState<string | null>(null);

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
      // Check if AI needs follow-up question
      const needsFollowUp = await checkAIFollowUp();
      if (needsFollowUp) {
        // AI asked clarifying question - show it
        return;
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const checkAIFollowUp = async () => {
    // Call AI to check if current answer needs clarification
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/generative/ai/validate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ 
          question: currentQuestion.id, 
          answer: answers[currentQuestion.id],
          context: answers
        })
      });
      const data = await res.json();
      if (data.followup) {
        setAiFollowUp(data.followup);
        return true;
      }
      return false;
    } catch {
      return false;
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
      router.push(`/generative-ai-v2/${projectId}/proposal`);
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
              <h2 className="text-3xl font-bold text-white mb-3">
                {currentQuestion.text}
              </h2>
              {currentQuestion.explanation && (
                <p className="text-zinc-300 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm">
                  💡 {currentQuestion.explanation}
                </p>
              )}
            </div>

            {/* AI Follow-up Question */}
            {aiFollowUp && (
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🤖</div>
                  <div>
                    <p className="font-semibold text-white mb-2">AI needs clarification:</p>
                    <p className="text-zinc-300">{aiFollowUp}</p>
                    <button
                      onClick={() => setAiFollowUp(null)}
                      className="mt-3 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg text-sm font-medium transition-colors cursor-pointer text-zinc-200"
                    >
                      Got it, let me revise
                    </button>
                  </div>
                </div>
              </div>
            )}

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
              {isSubmitting ? "Saving..." : isLastQuestion ? "Generate Proposal →" : "Next →"}
            </button>
          </div>
      </div>
    </DashboardLayoutWrapper>
  );
}
