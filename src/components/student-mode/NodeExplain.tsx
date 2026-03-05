import AIStatusBadge from "./AIStatusBadge";

export default function NodeExplain({
  title,
  explanation,
  source,
}: {
  title: string;
  explanation: string;
  source?: "ai" | "mock";
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase text-indigo-400 tracking-wide">
          Why this exists
        </div>
        <AIStatusBadge source={source} />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-zinc-300 leading-relaxed">
        {explanation}
      </p>
    </div>
  );
}
