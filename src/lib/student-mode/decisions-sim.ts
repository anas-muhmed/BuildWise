import { DecisionDefinition } from "./decision-types";

export const DECISIONS: DecisionDefinition[] = [
  {
    id: "ADD_CACHE",
    label: "Add Caching Layer",
    effect: {
      addNodes: [{ type: "cache", label: "Redis Cache" }],
      scoreDelta: 12,
      constraintsUnlocked: ["performance"],
      constraintsLocked: ["simplicity"],
      explanation:
        "Caching improves read performance by storing frequently accessed data in memory, but adds operational complexity for cache invalidation and consistency."
    }
  },
  {
    id: "ADD_QUEUE",
    label: "Add Message Queue",
    effect: {
      addNodes: [{ type: "queue", label: "Message Queue" }],
      scoreDelta: 10,
      constraintsUnlocked: ["scalability"],
      constraintsLocked: ["latency"],
      explanation:
        "Message queues decouple services and improve scalability through async processing, but increase complexity and introduce potential latency in request handling."
    }
  },
  {
    id: "USE_MICROSERVICES",
    label: "Switch to Microservices",
    effect: {
      addNodes: [
        { type: "backend", label: "User Service" },
        { type: "backend", label: "Order Service" }
      ],
      removeNodes: ["backend"],
      scoreDelta: 8,
      constraintsUnlocked: ["scalability"],
      constraintsLocked: ["simplicity"],
      explanation:
        "Microservices enable independent scaling and deployment of services, but significantly increase operational complexity with distributed systems challenges."
    }
  },
  {
    id: "ADD_READ_REPLICA",
    label: "Add Read Replica",
    effect: {
      addNodes: [{ type: "database", label: "Read Replica" }],
      scoreDelta: 6,
      constraintsUnlocked: ["performance"],
      explanation:
        "Read replicas distribute query load and reduce primary database stress, but introduce replication lag and eventual consistency concerns."
    }
  }
];
