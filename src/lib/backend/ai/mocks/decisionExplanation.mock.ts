/**
 * Mock Decision Explanations
 * Used when USE_REAL_AI=false
 */

type DecisionExplanationResponse = {
  explanation: string;
  tradeoffs: {
    benefits: string[];
    costs: string[];
  };
  scoreDelta: number;
  tip: string;
};

const MOCK_EXPLANATIONS: Record<string, DecisionExplanationResponse> = {
  ADD_CACHE: {
    explanation:
      "Adding a caching layer (like Redis) stores frequently accessed data in memory, dramatically reducing database load and improving response times. This is essential for read-heavy applications.",
    tradeoffs: {
      benefits: [
        "90% faster read operations",
        "Reduces database load",
        "Better user experience with instant responses",
      ],
      costs: [
        "Cache invalidation complexity",
        "Additional server costs ($10-50/month)",
        "Potential stale data issues",
      ],
    },
    scoreDelta: 12,
    tip: "Start with a 1GB cache instance - it's cheaper than scaling your database.",
  },
  
  ADD_QUEUE: {
    explanation:
      "Message queues (like RabbitMQ or SQS) decouple services by handling tasks asynchronously. Perfect for background jobs like sending emails, processing payments, or generating reports.",
    tradeoffs: {
      benefits: [
        "Better fault tolerance",
        "Handles traffic spikes gracefully",
        "Services can scale independently",
      ],
      costs: [
        "Increased system complexity",
        "Delayed processing (not real-time)",
        "Requires message handling logic",
      ],
    },
    scoreDelta: 10,
    tip: "Use queues for anything that doesn't need an immediate response to the user.",
  },
  
  USE_MICROSERVICES: {
    explanation:
      "Splitting your monolith into microservices allows teams to work independently and scale services based on demand. However, this comes with significant operational overhead.",
    tradeoffs: {
      benefits: [
        "Independent deployment and scaling",
        "Technology flexibility per service",
        "Better fault isolation",
      ],
      costs: [
        "Much higher complexity",
        "Distributed system debugging challenges",
        "Requires DevOps expertise",
      ],
    },
    scoreDelta: 8,
    tip: "Only use microservices if you have 5+ engineers - otherwise stick with a modular monolith.",
  },
  
  ADD_READ_REPLICA: {
    explanation:
      "Database read replicas clone your primary database and handle read queries, distributing the load. Great for analytics queries and reporting without impacting your main app.",
    tradeoffs: {
      benefits: [
        "Distributes read load across servers",
        "Can run heavy analytics queries safely",
        "Improves availability",
      ],
      costs: [
        "Replication lag (data may be seconds behind)",
        "Doubled storage costs",
        "Eventual consistency concerns",
      ],
    },
    scoreDelta: 6,
    tip: "Read replicas are your first step when your database CPU hits 70%.",
  },
};

export function getDecisionExplanationMock(decisionId: string): DecisionExplanationResponse {
  return (
    MOCK_EXPLANATIONS[decisionId] || {
      explanation: "This decision modifies your architecture configuration.",
      tradeoffs: {
        benefits: ["Improves system capability"],
        costs: ["Increases complexity"],
      },
      scoreDelta: 5,
      tip: "Consider your team size and experience level before implementing.",
    }
  );
}
