export type ManualDesignNode = {
  id: string;
  type: string;
  config?: {
    name?: string;
    tech?: string;
    notes?: string;
    cpu?: string;
    ram?: string;
  };
};

export type ManualDesignEdge = {
  id: string;
  fromId: string;
  toId: string;
};

export interface ManualDesignContext {
  systemBrief: string;
  constraints: string[];
  priorities: string[];
}

export interface ManualDesignContextInput {
  nodes: ManualDesignNode[];
  edges: ManualDesignEdge[];
  metadata?: {
    title?: string;
    prompt?: string;
  };
}

const TYPE_LABELS: Record<string, string> = {
  frontend: "frontend",
  backend: "backend",
  database: "database",
  loadbalancer: "load balancer",
  apigateway: "API gateway",
  auth: "auth",
  cache: "cache",
  messaging: "message queue",
  storage: "object storage",
};

function labelForType(type: string) {
  return TYPE_LABELS[type.toLowerCase()] || type;
}

function countByType(nodes: ManualDesignNode[]) {
  const counts: Record<string, number> = {};
  for (const n of nodes) {
    const key = n.type.toLowerCase();
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function summarizeComponents(nodes: ManualDesignNode[]) {
  if (nodes.length === 0) return "No components are present in the canvas.";

  const counts = countByType(nodes);
  const parts = Object.entries(counts)
    .map(([type, count]) => `${count} ${labelForType(type)}${count > 1 ? "s" : ""}`)
    .join(", ");

  return `The canvas currently contains ${parts}.`;
}

function summarizeConnections(nodes: ManualDesignNode[], edges: ManualDesignEdge[]) {
  if (nodes.length === 0) return "No connections exist because the canvas is empty.";
  if (edges.length === 0) return "No connections are currently defined between components.";
  return `There are ${edges.length} connection${edges.length > 1 ? "s" : ""} between components.`;
}

export function buildManualDesignContext(input: ManualDesignContextInput): ManualDesignContext {
  const { nodes, edges, metadata } = input;
  const counts = countByType(nodes);

  const parts: string[] = [];

  if (metadata?.title) {
    parts.push(`This manual design is titled: ${metadata.title}.`);
  }

  if (metadata?.prompt) {
    parts.push(`The design prompt is: ${metadata.prompt}.`);
  }

  parts.push(summarizeComponents(nodes));
  parts.push(summarizeConnections(nodes, edges));

  const systemBrief = parts.join(" ");

  const constraints: string[] = [];

  if (nodes.length === 0) {
    constraints.push("No components have been placed yet.");
  }

  if ((counts.frontend || 0) > 0 && (counts.backend || 0) === 0) {
    constraints.push("A frontend exists without any backend service.");
  }

  if ((counts.backend || 0) > 0 && (counts.database || 0) === 0) {
    constraints.push("A backend exists without a database.");
  }

  if ((counts.database || 0) > 0 && (counts.backend || 0) === 0) {
    constraints.push("A database exists without a backend service.");
  }

  if ((counts.loadbalancer || 0) > 0 && (counts.backend || 0) < 2) {
    constraints.push("A load balancer is present but only one backend is defined.");
  }

  if ((counts.apigateway || 0) > 0 && (counts.backend || 0) === 0) {
    constraints.push("An API gateway is present without backend services behind it.");
  }

  if (edges.length === 0 && nodes.length > 0) {
    constraints.push("Components are not connected, so no data flow is defined.");
  }

  if ((counts.backend || 0) > 0 && (counts.apigateway || 0) === 0 && (counts.loadbalancer || 0) === 0) {
    constraints.push("Backend services appear to be directly exposed without traffic management.");
  }

  const priorities: string[] = [];

  if (nodes.length <= 3) {
    priorities.push("Maintain simplicity and avoid unnecessary infrastructure.");
  }

  if ((counts.loadbalancer || 0) > 0 || (counts.apigateway || 0) > 0) {
    priorities.push("Avoid over-engineering unless there is clear scale or security need.");
  }

  if ((counts.backend || 0) === 1 && (counts.database || 0) === 1) {
    priorities.push("Improve reliability without a major redesign.");
  }

  if (priorities.length === 0) {
    priorities.push("Focus on stability and clarity of the existing architecture.");
  }

  return { systemBrief, constraints, priorities };
}

export function renderManualDesignContextAsText(context: ManualDesignContext): string {
  const lines: string[] = [];
  lines.push(context.systemBrief);

  if (context.constraints.length > 0) {
    lines.push("\nConstraints:");
    for (const c of context.constraints) {
      lines.push(`- ${c}`);
    }
  }

  if (context.priorities.length > 0) {
    lines.push("\nPriorities:");
    for (const p of context.priorities) {
      lines.push(`- ${p}`);
    }
  }

  return lines.join("\n");
}
