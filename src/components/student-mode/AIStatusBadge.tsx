/**
 * AI Status Badge
 * Shows whether real AI or mock is being used
 */

export default function AIStatusBadge({ source }: { source?: "ai" | "mock" }) {
  // Always show - default to mock if undefined
  const effectiveSource = source || "mock";
  const isAI = effectiveSource === "ai";

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${
        isAI
          ? "bg-green-500/20 text-green-400 border-2 border-green-500"
          : "bg-orange-500/20 text-orange-400 border-2 border-orange-500"
      }`}
      title={isAI ? "Real AI powered by GPT-4-turbo" : "Mock data (fallback)"}
    >
      <span
        className={`w-3 h-3 rounded-full ${
          isAI ? "bg-green-500 shadow-lg shadow-green-500/50 animate-pulse" : "bg-orange-500"
        }`}
      />
      <span className="uppercase tracking-wide">{isAI ? "AI" : "MOCK"}</span>
    </div>
  );
}
