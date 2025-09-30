import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json(); // canvas JSON
  console.log("Received canvas:", body);

  return NextResponse.json({
    healthScore: 72,
    suggestions: [
      "Add a cache layer between backend and DB to reduce load.",
      "Use a load balancer to distribute traffic evenly.",
      "Enable authentication service for better security."
    ]
  });
}
