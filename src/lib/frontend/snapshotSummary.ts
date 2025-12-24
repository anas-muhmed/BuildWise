// Helper functions to generate plain-English summaries from snapshot data

export function moduleSummary(node: any) {
  const t = node.type ?? node.meta?.language ?? 'component';
  const name = node.label || node.id;
  const extras = [];
  if (node.meta?.engine) extras.push(node.meta.engine);
  if (node.meta?.provider) extras.push(node.meta.provider);
  return `${name} — ${t}${extras.length ? ' (' + extras.join(', ') + ')' : ''}`;
}

export function fullPlainSummary(snapshot: any) {
  if (!snapshot) return '';
  const client = snapshot.nodes?.find((n: any) => n.type === 'client')?.label || 'Client';
  const backend = snapshot.nodes?.find((n: any) => n.type === 'backend' || n.type === 'service')?.label || 'Backend';
  const dbs = snapshot.nodes?.filter((n: any) => n.type === 'database').map((d: any) => d.label).join(', ');
  return `Recommended: ${client} → ${backend}. Databases: ${dbs || 'none specified'}. Confidence: ${snapshot.ai_feedback?.confidence || 'unknown'}.`;
}
