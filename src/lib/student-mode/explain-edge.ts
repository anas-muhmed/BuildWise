import { ArchitectureEdge } from "./types";

export function explainEdge(edge: ArchitectureEdge) {
  const key = `${edge.from}->${edge.to}`;

  const explanations: Record<string, { title: string; explanation: string }> = {
    "frontend->backend": {
      title: "Client → Server Request",
      explanation:
        "The frontend never talks directly to the database. All user actions are sent as HTTP requests to the backend, which validates input, applies business rules, and controls access."
    },
    "backend->database": {
      title: "Server → Database Access",
      explanation:
        "Only the backend communicates with the database. This ensures security, consistency, and prevents users from bypassing business logic."
    },
    "frontend->auth": {
      title: "Authentication Request",
      explanation:
        "Users authenticate through a dedicated auth service before accessing protected resources. This centralizes security and allows for features like SSO and multi-factor authentication."
    },
    "auth->backend": {
      title: "Token Verification",
      explanation:
        "The backend verifies authentication tokens with the auth service to ensure requests come from legitimate users with proper permissions."
    },
    "backend->payment": {
      title: "Payment Processing",
      explanation:
        "Payment operations are handled by a specialized service that complies with financial regulations and provides secure transaction processing."
    },
    "frontend->realtime": {
      title: "Real-time Connection",
      explanation:
        "WebSocket or similar protocol enables instant bidirectional communication for live updates without polling."
    },
    "realtime->backend": {
      title: "Event Propagation",
      explanation:
        "Real-time events are validated and processed by the backend before being broadcast to connected clients."
    },
    "backend->queue": {
      title: "Asynchronous Task Queue",
      explanation:
        "Long-running or failure-prone operations are queued for reliable background processing, preventing request timeouts and enabling retry logic."
    },
    "frontend->lb": {
      title: "Load Balancer Entry",
      explanation:
        "All traffic enters through a load balancer which distributes requests across backend instances for scalability and reliability."
    },
    "lb->backend": {
      title: "Traffic Distribution",
      explanation:
        "The load balancer routes requests to healthy backend instances using algorithms like round-robin or least-connections."
    }
  };

  return (
    explanations[key] || {
      title: "Component Communication",
      explanation:
        "This connection allows controlled data flow between system components."
    }
  );
}
