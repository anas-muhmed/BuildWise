import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  // You can inspect body.canvas here when you switch to real AI.
  console.log("[mock-ai] canvas payload size:", JSON.stringify(body).length);

  // MOCK data (expandable)
  const response = {
    healthScore: 72, // total (0-100)
    breakdown: {
      security: 65,
      performance: 78,
      cost: 73
    },
    suggestions: [
      {
        id: "s1",
        title: "Add a cache layer (Redis)",
        detail: "Place Redis between Backend and DB to reduce DB load for repeat reads.",
        action: { type: "add", component: "Cache", meta: { engine: "Redis" } }
      },
      {
        id: "s2",
        title: "Put a Load Balancer in front of Backend",
        detail: "Distribute traffic and improve availability for scaling.",
        action: { type: "add", component: "LoadBalancer" }
      },
      {
        id: "s3",
        title: "Enable Auth Service (OAuth)",
        detail: "Protect APIs with a centralized authentication microservice.",
        action: { type: "add", component: "Auth" }
      }
    ]
  };

  return NextResponse.json(response);
}
