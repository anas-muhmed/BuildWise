/**
 * AI Status Badge
 * Shows whether real AI or mock is being used
 */

export default function AIStatusBadge({ source }: { source?: "ai" | "mock" }) {
  if (!source) return null;

  const isAI = source === "ai";

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
        isAI
          ? "bg-green-950 text-green-400 border border-green-800"
          : "bg-zinc-800 text-zinc-400 border border-zinc-700"
      }`}
      title={isAI ? "Real AI powered by GPT-4-turbo" : "Mock data (fallback)"}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isAI ? "bg-green-500 animate-pulse" : "bg-zinc-500"
        }`}
      />
      <span>{isAI ? "AI Active" : "Mock"}</span>
    </div>
  );
}
