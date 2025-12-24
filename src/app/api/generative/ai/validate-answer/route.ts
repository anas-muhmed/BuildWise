// app/api/generative/ai/validate-answer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/backend/authMiddleware";

// 🎯 MASTER PLAN: AI Answer Validation - Returns follow-up question if answer is ambiguous
// In production, this would call an actual LLM. For now, it's rule-based.

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || user instanceof NextResponse) {
      return user || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { question, answer, context } = body;

    // 🎯 RULE-BASED VALIDATION (Replace with actual LLM in production)
    let followup: string | null = null;

    // Example: If user selects "Students" and "Large traffic" → clarify
    if (question === "traffic" && answer.includes("Large") && 
        context.users?.includes("Students")) {
      followup = "Large traffic with students is unusual. Are you building a campus-wide platform or an external marketplace?";
    }

    // Example: If features include "Real-time tracking" but traffic is "Small"
    if (question === "features" && answer.includes("Real-time tracking") &&
        context.traffic?.includes("Small")) {
      followup = "Real-time tracking for small traffic might be over-engineered. Do you expect growth soon, or is this a pilot?";
    }

    // Example: High budget + solo team
    if (question === "team_size" && answer === 1 && 
        context.budget?.includes("High")) {
      followup = "High budget with solo developer is rare. Are you planning to hire, or do you prefer managed services?";
    }

    return NextResponse.json({ followup });
  } catch (error) {
    console.error("[validate-answer]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
