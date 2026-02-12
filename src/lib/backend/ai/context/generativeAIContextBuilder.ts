/**
 * STEP 7A: Generative AI Context Builder
 * 
 * Purpose: Translate requirements + description into AI-ready English
 * 
 * This is NOT:
 * - An AI call
 * - A prompt generator
 * - A technology picker
 * 
 * This IS:
 * - A translator (requirements → sentences)
 * - A summarizer (data → narrative)
 * - A constraint enforcer (rules → guardrails)
 */

export interface GenerativeAIContext {
  systemBrief: string;
  constraints: string[];
  priorities: string[];
}

interface RequirementsData {
  users?: string[];
  traffic?: "low" | "medium" | "high";
  budget?: "low" | "medium" | "high";
  team_size?: number;
  must_have_features?: string[];
  priorities?: string[];
}

/**
 * Build AI context from Generative AI inputs
 * 
 * @param input - Project description and requirements
 * @returns Structured English context for AI
 */
export function buildGenerativeAIContext(input: {
  description: string;
  requirements: RequirementsData;
}): GenerativeAIContext {
  const { description, requirements } = input;

  return {
    systemBrief: buildSystemBrief(description, requirements),
    constraints: buildConstraints(requirements),
    priorities: buildPriorities(requirements),
  };
}

/**
 * Build system brief (business-first paragraph)
 * 
 * This answers: "What is this product and under what conditions is it built?"
 */
function buildSystemBrief(
  description: string,
  requirements: RequirementsData
): string {
  const parts: string[] = [];

  // Start with project description
parts.push(`This project is described as: ${description.trim()}.`);


  // Mention primary users
  if (requirements.users && requirements.users.length > 0) {
    const userList = requirements.users.join(", ");
    parts.push(`The primary users are: ${userList}.`);
  }

  // Mention scale and traffic
  if (requirements.traffic === "low") {
    parts.push("It is expected to handle low traffic with a small user base.");
  } else if (requirements.traffic === "medium") {
    parts.push("It is expected to handle medium traffic with a growing user base.");
  } else if (requirements.traffic === "high") {
    parts.push("It is expected to handle high traffic with a large user base, requiring careful scalability planning.");
  }

  // Mention must-have features
  if (requirements.must_have_features && requirements.must_have_features.length > 0) {
    const featureList = requirements.must_have_features.join(", ");
    parts.push(`Required features include: ${featureList}.`);
  }

  // Mention team and budget context
  const teamContext = [];
  if (requirements.team_size) {
    teamContext.push(`a ${requirements.team_size}-person development team`);
  }
  if (requirements.budget) {
    const budgetDesc = 
      requirements.budget === "low" ? "limited budget" :
      requirements.budget === "medium" ? "moderate budget" :
      "flexible budget";
    teamContext.push(budgetDesc);
  }

  if (teamContext.length > 0) {
    parts.push(
      `The system is being built with ${teamContext.join(" and ")}, so architectural decisions must balance scalability with simplicity and cost efficiency.`
    );
  }

  return parts.join(" ");
}

/**
 * Build constraints (hard, non-negotiable limits)
 * 
 * These are the "don't do X" guardrails derived from requirements.
 */
function buildConstraints(requirements: RequirementsData): string[] {
  const constraints: string[] = [];

  // Team size constraints
  if (requirements.team_size && requirements.team_size <= 3) {
    constraints.push(
      "The development team is small, so architectural complexity must be minimized and operational overhead kept low."
    );
  } else if (requirements.team_size && requirements.team_size <= 6) {
    constraints.push(
      "The team size is moderate, allowing some architectural sophistication but still requiring maintainability focus."
    );
  }

  // Budget constraints
  if (requirements.budget === "low") {
    constraints.push(
      "Budget is limited, restricting the use of expensive managed infrastructure and premium services."
    );
  } else if (requirements.budget === "medium") {
    constraints.push(
      "Budget is moderate, allowing selective use of managed services where they provide clear value."
    );
  }

  // Traffic constraints
  if (requirements.traffic === "low") {
    constraints.push(
      "Traffic is expected to remain low, so aggressive scaling infrastructure is unnecessary and wasteful."
    );
  } else if (requirements.traffic === "high") {
    constraints.push(
      "High traffic is expected, so the architecture must be designed for horizontal scalability from the start."
    );
  }

  // Budget + Traffic interaction (helps AI resolve conflicts)
  if (requirements.budget === "low" && requirements.traffic === "high") {
    constraints.push(
      "High traffic must be handled while keeping infrastructure costs controlled."
    );
  }

  // Feature-based constraints
  if (requirements.must_have_features) {
    const hasRealtime = requirements.must_have_features.some(f => 
      f.toLowerCase().includes("real-time") || 
      f.toLowerCase().includes("realtime") ||
      f.toLowerCase().includes("live") ||
      f.toLowerCase().includes("websocket")
    );

    if (hasRealtime) {
      constraints.push(
        "Real-time features are required, so the system must support persistent connections for real-time communication."
      );
    }

    const hasPayments = requirements.must_have_features.some(f =>
      f.toLowerCase().includes("payment") ||
      f.toLowerCase().includes("transaction") ||
      f.toLowerCase().includes("checkout")
    );

    if (hasPayments) {
      constraints.push(
        "Payment processing is required, demanding strict security measures and compliance considerations."
      );
    }

    const hasAuth = requirements.must_have_features.some(f =>
      f.toLowerCase().includes("auth") ||
      f.toLowerCase().includes("login") ||
      f.toLowerCase().includes("user account")
    );

    if (hasAuth) {
      constraints.push(
        "User authentication is required, necessitating secure session management and data protection."
      );
    }
  }

  return constraints;
}

/**
 * Build priorities (optimization goals)
 * 
 * These are the "prefer Y" guidelines for trade-off decisions.
 */
function buildPriorities(requirements: RequirementsData): string[] {
  const priorities: string[] = [];

  // Convert intake priorities to clear sentences
  if (requirements.priorities && requirements.priorities.length > 0) {
    requirements.priorities.forEach(priority => {
      const cleaned = priority.trim();
      
      // Map common priority patterns to clear statements
      let sentence = "";
      if (cleaned.toLowerCase().includes("fast") || cleaned.toLowerCase().includes("quick")) {
        sentence = "Prioritize faster development and time-to-market over long-term optimization.";
      } else if (cleaned.toLowerCase().includes("scalab")) {
        sentence = "Optimize for horizontal scalability and traffic growth.";
      } else if (cleaned.toLowerCase().includes("cost") || cleaned.toLowerCase().includes("cheap")) {
        sentence = "Keep infrastructure costs low and prefer cost-efficient solutions.";
      } else if (cleaned.toLowerCase().includes("reliab") || cleaned.toLowerCase().includes("uptime")) {
        sentence = "Prioritize system reliability and fault tolerance.";
      } else if (cleaned.toLowerCase().includes("maintain") || cleaned.toLowerCase().includes("simple")) {
        sentence = "Optimize for code maintainability and operational simplicity.";
      } else if (cleaned.toLowerCase().includes("secur")) {
        sentence = "Emphasize security and data protection throughout the architecture.";
      } else {
        // Keep as-is if not matching patterns
        sentence = cleaned;
      }
      
      // Deduplication: only add if not already present
      if (!priorities.includes(sentence)) {
        priorities.push(sentence);
      }
    });
  }

  // Add default priorities based on context if none specified
  if (priorities.length === 0) {
    if (requirements.traffic === "high") {
      priorities.push("Optimize for scalability and performance under load.");
    }
    if (requirements.budget === "low") {
      priorities.push("Keep operational costs low and avoid expensive infrastructure.");
    }
    if (requirements.team_size && requirements.team_size <= 3) {
      priorities.push("Prioritize simplicity and ease of maintenance.");
    }
  }

  return priorities;
}

/**
 * Render context as formatted text (for logging/debugging)
 */
export function renderGenerativeContextAsText(context: GenerativeAIContext): string {
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
