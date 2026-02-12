/**
 * STEP 4: Student Mode Context Builder
 * 
 * Purpose: Translate /define + /reasoning data into AI-ready English
 * 
 * This is NOT:
 * - An AI call
 * - A prompt generator
 * - A decision maker
 * 
 * This IS:
 * - A translator (enums → sentences)
 * - A summarizer (data → narrative)
 * - A constraint enforcer (rules → guardrails)
 */

export interface StudentModeAIContext {
  systemBrief: string;
  constraints: string[];
  priorities: string[];
}

interface DefinitionData {
  name: string;
  goal: string;
  audience: string;
}

interface ReasoningData {
  system_type?: string;
  user_load?: string;
  data_sensitivity?: string;
  realtime?: string;
  failure?: string;
  deployment?: string;
  team?: string;
}

/**
 * Build AI context from student inputs
 * 
 * @param input - Definition and reasoning data
 * @returns Structured English context for AI
 */
export function buildStudentModeContext(input: {
  definition: DefinitionData;
  reasoning: ReasoningData;
}): StudentModeAIContext {
  const { definition, reasoning } = input;

  return {
    systemBrief: buildSystemBrief(definition, reasoning),
    constraints: buildConstraints(reasoning),
    priorities: buildPriorities(reasoning),
  };
}

/**
 * Build system brief (paragraph format)
 * 
 * This is the "story" of the project that anchors AI's mindset.
 */
function buildSystemBrief(
  definition: DefinitionData,
  reasoning: ReasoningData
): string {
  const parts: string[] = [];

  // Start with project identity
  parts.push(
    `This project is a ${reasoning.system_type === "transactional" 
      ? "transactional web application" 
      : reasoning.system_type === "informational" 
      ? "informational web application" 
      : "communication-focused web application"
    } named "${definition.name}".`
  );

  // Add purpose and audience
  parts.push(
    `Its purpose is: ${definition.goal}. The primary audience is: ${definition.audience}.`
  );

  // Add scale context
  const scaleText = 
    reasoning.user_load === "low_users"
      ? "It targets a very small number of users"
      : reasoning.user_load === "medium_users"
      ? "It targets a moderate number of users"
      : "It targets a high volume of users";
  
  parts.push(scaleText + ".");

  // Add realtime requirement
  if (reasoning.realtime === "no_realtime") {
    parts.push("The system does not require real-time updates.");
  } else if (reasoning.realtime === "polling") {
    parts.push("Polling-based updates are acceptable; true real-time is not required.");
  } else {
    parts.push("The system requires real-time updates.");
  }

  // Add data sensitivity context
  if (reasoning.data_sensitivity === "no_sensitive") {
    parts.push(
      "The system handles non-sensitive data, allowing the design to prioritize simplicity over advanced security."
    );
  } else if (reasoning.data_sensitivity === "auth_only") {
    parts.push(
      "The system handles user authentication, requiring secure session management but no payment data."
    );
  } else {
    parts.push(
      "The system handles sensitive data including payments or personal information, requiring strict security measures."
    );
  }

  // Add design philosophy
  parts.push(
    "The goal is to prioritize clarity, maintainability, and ease of development over premature optimization."
  );

  return parts.join(" ");
}

/**
 * Build constraints (hard limits AI must respect)
 * 
 * These are the "don't do X" guardrails.
 */
function buildConstraints(reasoning: ReasoningData): string[] {
  const constraints: string[] = [];

  // Team experience constraint
  if (reasoning.team === "beginners") {
    constraints.push(
      "The development team consists of beginners, so architectural complexity must be minimized and patterns must be standard."
    );
  } else if (reasoning.team === "mixed") {
    constraints.push(
      "The team has mixed experience levels, so the architecture should balance learning opportunities with practical delivery."
    );
  } else {
    constraints.push(
      "The team is experienced, allowing for more sophisticated architectural patterns when justified."
    );
  }

  // Scale constraint
  if (reasoning.user_load === "low_users") {
    constraints.push(
      "Expected user load is very low, so aggressive scaling infrastructure is unnecessary and wasteful."
    );
  } else if (reasoning.user_load === "medium_users") {
    constraints.push(
      "Expected user load is moderate, so the architecture should support horizontal scaling without over-engineering."
    );
  }

  // Deployment constraint
  if (reasoning.deployment === "single_server") {
    constraints.push(
      "Deployment will be on a single server, so distributed system patterns (message queues, load balancers) are not applicable."
    );
  } else if (reasoning.deployment === "learning") {
    constraints.push(
      "The team is still learning deployment, so the architecture must prioritize simple, well-documented deployment processes."
    );
  }

  // Failure tolerance constraint
  if (reasoning.failure === "stop_all") {
    constraints.push(
      "The system can tolerate full downtime during failures, so complex failover mechanisms are not required."
    );
  } else if (reasoning.failure === "partial_fail") {
    constraints.push(
      "Partial failures are acceptable, so graceful degradation is preferred over expensive high-availability setups."
    );
  }

  // Realtime constraint
  if (reasoning.realtime === "no_realtime") {
    constraints.push(
      "Real-time updates are not required, so WebSocket infrastructure and complex state synchronization can be avoided."
    );
  }

  return constraints;
}

/**
 * Build priorities (optimization goals)
 * 
 * These are the "prefer Y" guidelines.
 */
function buildPriorities(reasoning: ReasoningData): string[] {
  const priorities: string[] = [];

  // Always prioritize these for student mode
  priorities.push("Ease of understanding and code readability");
  priorities.push("Maintainability and debuggability");
  priorities.push("Clear separation of concerns");

  // Add context-specific priorities
  if (reasoning.team === "beginners" || reasoning.deployment === "learning") {
    priorities.push("Low operational overhead and simple deployment");
  }

  if (reasoning.data_sensitivity !== "no_sensitive") {
    priorities.push("Security best practices and data protection");
  }

  if (reasoning.user_load === "low_users") {
    priorities.push("Development speed over premature optimization");
  }

  if (reasoning.system_type === "transactional") {
    priorities.push("Data consistency and reliability");
  }

  return priorities;
}

/**
 * Render context as formatted text (for logging/debugging)
 */
export function renderContextAsText(context: StudentModeAIContext): string {
  const lines: string[] = [];

  lines.push("SYSTEM BRIEF:");
  lines.push(context.systemBrief);
  lines.push("");

  lines.push("CONSTRAINTS:");
  context.constraints.forEach(c => lines.push(`- ${c}`));
  lines.push("");

  lines.push("DESIGN PRIORITIES:");
  context.priorities.forEach(p => lines.push(`- ${p}`));

  return lines.join("\n");
}
