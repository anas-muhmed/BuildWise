export default function NodeExplain({
  title,
  explanation,
}: {
  title: string;
  explanation: string;
}) {
  return (
    <div className="space-y-3">
      <div className="text-xs uppercase text-indigo-400 tracking-wide">
        Why this exists
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-zinc-300 leading-relaxed">
        {explanation}
      </p>
    </div>
  );
}
