import { SavedDesign } from "./saved-design-types";
import { DECISIONS } from "./decisions-sim";

export type ComparisonResult = {
  addedDecisions: string[];
  removedDecisions: string[];
  scoreDelta: number;
  explanation: string;
};

export function compareVersions(
  versionA: SavedDesign,
  versionB: SavedDesign
): ComparisonResult {
  const decisionsA = new Set(versionA.decisions);
  const decisionsB = new Set(versionB.decisions);

  const addedDecisions = versionB.decisions.filter(d => !decisionsA.has(d));
  const removedDecisions = versionA.decisions.filter(d => !decisionsB.has(d));
  
  const scoreDelta = versionB.score - versionA.score;

  // Generate explanation
  const explanation = generateExplanation(addedDecisions, removedDecisions, scoreDelta);

  return {
    addedDecisions,
    removedDecisions,
    scoreDelta,
    explanation,
  };
}

function generateExplanation(
  added: string[],
  removed: string[],
  scoreDelta: number
): string {
  const parts: string[] = [];

  if (added.length > 0) {
    const names = added.map(id => {
      const decision = DECISIONS.find(d => d.id === id);
      return decision?.label || id;
    }).join(", ");
    parts.push(`introduces ${names}`);
  }

  if (removed.length > 0) {
    const names = removed.map(id => {
      const decision = DECISIONS.find(d => d.id === id);
      return decision?.label || id;
    }).join(", ");
    parts.push(`removes ${names}`);
  }

  if (scoreDelta > 0) {
    parts.push(`improving overall score by ${scoreDelta} points`);
  } else if (scoreDelta < 0) {
    parts.push(`decreasing overall score by ${Math.abs(scoreDelta)} points`);
  }

  if (parts.length === 0) {
    return "No significant changes between versions.";
  }

  return `Version B ${parts.join(", ")}.`;
}
