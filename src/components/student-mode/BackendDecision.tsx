export default function BackendDecision({
  projectId,
  value,
  onSelect,
  onConstraintError,
}: {
  projectId: string;
  value?: string;
  onSelect: (v: string) => void;
  onConstraintError: (error: { message: string; affectedNodeType?: string; fixes?: any[] } | null) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-300">
        Backend Architecture
      </h3>

      {["monolith", "microservices"].map(option => (
        <button
          key={option}
          onClick={async () => {
            const res = await fetch("/api/student-mode/decisions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                projectId,
                key: "backendType",
                value: option,
              }),
            });

            const data = await res.json();

            if (!res.ok) {
              onConstraintError({
                message: data.error,
                affectedNodeType: data.affectedNodeType,
                fixes: data.fixes,
              });
              return;
            }

            onConstraintError(null);
            onSelect(option);
          }}
          className={`w-full p-3 rounded border text-left transition ${
            value === option
              ? "border-indigo-500 bg-indigo-950"
              : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"
          }`}
        >
          <div className="font-medium">
            {option === "monolith" ? "Monolith" : "Microservices"}
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            {option === "monolith"
              ? "Simple, fast to build"
              : "Scalable, complex"}
          </div>
        </button>
      ))}
    </div>
  );
}
