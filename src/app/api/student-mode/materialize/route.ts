import { NextRequest, NextResponse } from "next/server";
import { reasoningStore, architectureStore, projectDefinitionStore } from "@/lib/student-mode/store";
import { getStudentModeArchitectureMock } from "@/lib/backend/ai/mocks/studentModeArchitecture.mock";
import { buildStudentModeContext, renderContextAsText } from "@/lib/backend/ai/context/studentModeContextBuilder";
import { buildStudentModeArchitecturePrompt } from "@/lib/backend/ai/prompts/studentModeArchitecture.prompt";
import { AI_CONFIG } from "@/lib/backend/ai/config";
import { callOpenAI } from "@/lib/backend/ai/openaiProvider";

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

      return NextResponse.json({
        ...mockResponse,
        source: "mock",
      });
    }

    // Build AI context from student inputs
    const aiContext = buildStudentModeContext({
      definition: {
        name: definition.name,
        goal: definition.goal,
        audience: definition.audience,
      },
      reasoning: reasoning.answers,
    });

    // Log context for validation
    console.log("=== AI CONTEXT (Student Mode) ===");
    console.log(renderContextAsText(aiContext));
    console.log("=================================");

    if (AI_CONFIG.USE_REAL_AI) {
      try {
        console.log("[student-materialize] Using real AI for architecture generation");
        
        const prompt = buildStudentModeArchitecturePrompt(aiContext);
        const systemPrompt = "You are an expert software architect helping students design their first production systems. Generate clean, educational architectures.";
        
        const aiResult = await callOpenAI(systemPrompt, prompt);
        const aiResponse = JSON.parse(aiResult.content);
        
        const architecture = aiResponse.architecture;

        // Store as BASE architecture with empty decisions
        architectureStore.set(projectId, {
          baseArchitecture: architecture,
          activeDecisions: [],
          architecture: architecture,
        });

        console.log("[student-materialize] Real AI architecture generated successfully");
        
        return NextResponse.json({
          ...aiResponse,
          source: "ai",
        });
      } catch (error) {
        console.error("[student-materialize] AI failed, using fallback:", error);
        // Fall through to mock
      }
    }

    console.log("[student-materialize] Using mock architecture");
    const mockResponse = getStudentModeArchitectureMock();
    const architecture = mockResponse.architecture;

    architectureStore.set(projectId, {
      baseArchitecture: architecture,
      activeDecisions: [],
      architecture: architecture,
    });

    return NextResponse.json({
      ...mockResponse,
      source: "mock",
    });
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

  // If no state found, generate AI architecture
  if (!state) {
    console.log(`[student-materialize GET] No state found for ${projectId}, generating with AI...`);
    
    const reasoning = reasoningStore.get(projectId);
    const definition = projectDefinitionStore.get(projectId);
    
    // Build AI context
    const aiContext = buildStudentModeContext({
      definition: definition || {
        name: "Student Project",
        goal: "Build a scalable web application",
        audience: "General users",
      },
      reasoning: reasoning?.answers || {},
    });
    
    if (AI_CONFIG.USE_REAL_AI) {
      try {
        console.log("[student-materialize GET] Using real AI");
        const prompt = buildStudentModeArchitecturePrompt(aiContext);
        const systemPrompt = "You are an expert software architect helping students design production systems. Generate complete, realistic architectures.";
        
        const aiResult = await callOpenAI(systemPrompt, prompt);
        const aiResponse = JSON.parse(aiResult.content);
        
        // Cache the generated architecture
        architectureStore.set(projectId, {
          baseArchitecture: aiResponse.architecture,
          activeDecisions: [],
          architecture: aiResponse.architecture,
        });
        
        return NextResponse.json({
          architecture: aiResponse.architecture,
          reasoning: aiResponse.reasoning,
          source: "ai",
        });
      } catch (error) {
        console.error("[student-materialize GET] AI failed:", error);
      }
    }
    
    // Fallback to mock
    console.log("[student-materialize GET] Using mock");
    const mockResponse = getStudentModeArchitectureMock();
    return NextResponse.json({
      architecture: mockResponse.architecture,
      reasoning: mockResponse.reasoning,
      source: "mock",
    });
  }

  // Return cached architecture
  const mockResponse = getStudentModeArchitectureMock();
  return NextResponse.json({
    architecture: state.architecture || state.baseArchitecture || state,
    reasoning: mockResponse.reasoning
  });
}
