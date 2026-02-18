import { NextRequest, NextResponse } from "next/server";
import { reasoningStore } from "@/lib/student-mode/store";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  let state = reasoningStore.get(projectId);

  if (!state) {
    state = { projectId, index: 0, answers: {} };
    reasoningStore.set(projectId, state);
  }

  return NextResponse.json(state);
}

export async function POST(req: NextRequest) {
  const { projectId, questionId, answer } = await req.json();

  if (!projectId || !questionId || !answer) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const state = reasoningStore.get(projectId);

  if (!state) {
    return NextResponse.json({ error: "State not found" }, { status: 404 });
  }

  state.answers[questionId] = answer;
  state.index += 1;

  reasoningStore.set(projectId, state);

  return NextResponse.json(state);
}
