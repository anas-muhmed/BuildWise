import { NextRequest, NextResponse } from "next/server";
import { reasoningStore, architectureStore, projectDefinitionStore } from "@/lib/student-mode/store";
import { getStudentModeArchitectureMock } from "@/lib/backend/ai/mocks/studentModeArchitecture.mock";
import { buildStudentModeContext, renderContextAsText } from "@/lib/backend/ai/context/studentModeContextBuilder";

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }

    const reasoning = reasoningStore.get(projectId);

    if (!reasoning) {
      return NextResponse.json(
        { error: "Reasoning not completed" },
        { status: 404 }
      );
    }

    const definition = projectDefinitionStore.get(projectId);

    if (!definition) {
      console.log(`No definition found for ${projectId}, using defaults`);
      // Use defaults for testing without full flow
      const defaultDefinition = {
        name: "Test Project",
        goal: "Test application for architecture generation",
        audience: "Students and learners",
      };

      const aiContext = buildStudentModeContext({
        definition: defaultDefinition,
        reasoning: reasoning.answers,
      });

      console.log("=== AI CONTEXT (Student Mode) ===");
      console.log(renderContextAsText(aiContext));
      console.log("=================================");

      const mockResponse = getStudentModeArchitectureMock();
      const architecture = mockResponse.architecture;

      architectureStore.set(projectId, {
        baseArchitecture: architecture,
        activeDecisions: [],
        architecture: architecture,
      });

      return NextResponse.json(mockResponse);
    }

    // Build AI context from student inputs (English, not raw data)
    const aiContext = buildStudentModeContext({
      definition: {
        name: definition.name,
        goal: definition.goal,
        audience: definition.audience,
      },
      reasoning: reasoning.answers,
    });

    // Log context for validation (master's checkpoint)
    console.log("=== AI CONTEXT (Student Mode) ===");
    console.log(renderContextAsText(aiContext));
    console.log("=================================");

    // Use contract-valid mock (later: pass aiContext to real AI)
    const mockResponse = getStudentModeArchitectureMock();
    const architecture = mockResponse.architecture;

    // Store as BASE architecture with empty decisions
    architectureStore.set(projectId, {
      baseArchitecture: architecture,
      activeDecisions: [],
      architecture: architecture, // initially same as base
    });

    // Return full contract (architecture + reasoning)
    return NextResponse.json(mockResponse);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Materialization failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const state = architectureStore.get(projectId);

  // If no state found, return mock data for testing
  if (!state) {
    console.log(`No state found for ${projectId}, returning mock data`);
    const mockResponse = getStudentModeArchitectureMock();
    return NextResponse.json({
      architecture: mockResponse.architecture,
      reasoning: mockResponse.reasoning
    });
  }

  // Return full contract (architecture + reasoning)
  const mockResponse = getStudentModeArchitectureMock();
  return NextResponse.json({
    architecture: state.architecture || state.baseArchitecture || state,
    reasoning: mockResponse.reasoning
  });
}
