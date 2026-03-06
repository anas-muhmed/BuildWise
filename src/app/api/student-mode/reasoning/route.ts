import { NextRequest, NextResponse } from "next/server";
import { reasoningStore } from "@/lib/student-mode/store";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");

  if (!projectId) {
    console.warn("[reasoning] GET request missing projectId");
    // Return default state instead of 400 error
    return NextResponse.json({ projectId: null, index: 0, answers: {} });
  }

  let state = reasoningStore.get(projectId);

  if (!state) {
    console.log("[reasoning] Creating new state for projectId:", projectId);
    state = { projectId, index: 0, answers: {} };
    reasoningStore.set(projectId, state);
  }

  return NextResponse.json(state);
}

export async function POST(req: NextRequest) {
  const { projectId, questionId, answer } = await req.json();

  if (!projectId || !questionId || !answer) {
    console.warn("[reasoning] POST request invalid input:", { projectId, questionId, hasAnswer: !!answer });
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  let state = reasoningStore.get(projectId);

  if (!state) {
    console.log("[reasoning] POST creating new state for projectId:", projectId);
    state = { projectId, index: 0, answers: {} };
    reasoningStore.set(projectId, state);
  }

  state.answers[questionId] = answer;
  state.index += 1;

  reasoningStore.set(projectId, state);
  console.log("[reasoning] Updated state:", { projectId, questionId, index: state.index });

  return NextResponse.json(state);
}
