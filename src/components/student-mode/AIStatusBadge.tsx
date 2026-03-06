/**
 * AI Status Badge
 * Shows whether real AI or mock is being used
 * Displays as a small dot for internal reference only
 */

export default function AIStatusBadge({ source }: { source?: "ai" | "mock" }) {
  // Always show - default to mock if undefined
  const effectiveSource = source || "mock";
  const isAI = effectiveSource === "ai";

  return (
    <div
      className={`inline-flex items-center justify-center w-3 h-3 rounded-full ${
        isAI
          ? "bg-green-500 shadow-md shadow-green-500/50 animate-pulse"
          : "bg-orange-500 shadow-md shadow-orange-500/50"
      }`}
      title={isAI ? "AI (GPT-4)" : "Mock (dev)"}
    />
  );
}
