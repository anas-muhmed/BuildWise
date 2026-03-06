/**
 * STEP 6: AI Reasoning Endpoint with Feature Flag
 * 
 * Purpose: Single source of truth for all AI reasoning
 * 
 * One API. One contract. One switch.
 * Mock today, real AI tomorrow, UI never knows.
 */

import { NextRequest, NextResponse } from "next/server";
import { reasoningStore, projectDefinitionStore } from "@/lib/student-mode/store";
import { buildStudentModeContext, renderContextAsText } from "@/lib/backend/ai/context/studentModeContextBuilder";
import { buildStudentModeArchitecturePrompt } from "@/lib/backend/ai/prompts/studentModeArchitecture.prompt";
import { getStudentModeArchitectureMock } from "@/lib/backend/ai/mocks/studentModeArchitecture.mock";
import { buildManualDesignContext, renderManualDesignContextAsText } from "@/lib/backend/ai/context/manualDesignContextBuilder";
import { buildManualDesignAnalysisPrompt } from "@/lib/backend/ai/prompts/manualDesignAnalysis.prompt";
import { getManualDesignAnalysisMock } from "@/lib/backend/ai/mocks/manualDesignAnalysis.mock";
import { AI_CONFIG, validateAIConfig } from "@/lib/backend/ai/config";
import { callOpenAI } from "@/lib/backend/ai/openaiProvider";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/backend/ai/rateLimiter";
import { getAuthUserFromRequest } from "@/lib/backend/auth";
import { connectDB } from "@/lib/backend/db";
import { AIRequestLog } from "@/lib/backend/models/AIRequestLog";

/**
 * Log AI request for admin observability
 * Fire-and-forget - don't block the response
 */
async function logAIRequest(data: {
  userId: string;
  mode: "student" | "generative" | "manual";
  intent: string;
  success: boolean;
  validationPassed: boolean;
  errorMessage?: string;
  durationMs?: number;
}) {
  try {
    console.log("📊 Logging AI request:", { userId: data.userId, mode: data.mode, success: data.success });
    await connectDB();
    await AIRequestLog.create({
      ...data,
      timestamp: new Date(),
    });
    console.log("✅ AI request logged successfully");
  } catch (error) {
    // Log error but don't throw - logging failure shouldn't break the request
    console.error("❌ Failed to log AI request:", error);
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Log AI configuration status
    console.log(`AI Mode: ${AI_CONFIG.USE_REAL_AI ? "REAL AI" : "MOCK"}`);
    if (AI_CONFIG.USE_REAL_AI) {
      const configCheck = validateAIConfig();
      if (!configCheck.valid) {
        console.error("AI config errors:", configCheck.errors);
        return NextResponse.json(
          { error: "AI provider not configured", details: configCheck.errors },
          { status: 500 }
        );
      }
    }

    // STEP A: Parse request
    const { mode, intent, projectId, canvas, metadata, context } = await req.json();

    // Rate limiting (only when using real AI to prevent cost explosion)
    if (AI_CONFIG.USE_REAL_AI) {
      const authUser = getAuthUserFromRequest(req);
      const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
      const rateLimitId = getRateLimitIdentifier(authUser?.userId || null, ipAddress);

      // Determine endpoint type for rate limit
      let endpoint: "student-architecture" | "manual-analysis" | "generative-architecture";
      if (mode === "manual") {
        endpoint = "manual-analysis";
      } else if (mode === "student") {
        endpoint = "student-architecture";
      } else {
        endpoint = "generative-architecture";
      }

      const rateLimit = checkRateLimit(rateLimitId, endpoint);
      
      if (!rateLimit.allowed) {
        console.warn(`Rate limit exceeded for ${rateLimitId} on ${endpoint}`);
        return NextResponse.json(
          { 
            error: "Rate limit exceeded", 
            details: `Too many requests. Try again in ${Math.ceil((rateLimit.resetAt - Date.now()) / 1000)}s`,
            limit: rateLimit.limit,
            resetAt: rateLimit.resetAt,
          },
          { 
            status: 429,
            headers: {
              "X-RateLimit-Limit": rateLimit.limit.toString(),
              "X-RateLimit-Remaining": rateLimit.remaining.toString(),
              "X-RateLimit-Reset": rateLimit.resetAt.toString(),
            },
          }
        );
      }

      console.log(`Rate limit check passed: ${rateLimitId} (${rateLimit.remaining}/${rateLimit.limit} remaining)`);
    }

    // Manual Design (analysis) pipeline
    if (mode === "manual") {
      if (intent !== "analysis") {
        return NextResponse.json(
          { error: "Only 'analysis' intent supported for manual mode" },
          { status: 400 }
        );
      }

      const nodes = canvas?.nodes ?? canvas?.droppedComponents ?? [];
      const edges = canvas?.edges ?? [];

      console.log("🔍 API RECEIVED CANVAS DATA:");
      console.log("  Canvas object keys:", Object.keys(canvas || {}));
      console.log("  Nodes/Components count:", nodes.length);
      console.log("  Edges count:", edges.length);
      console.log("  Nodes data:", JSON.stringify(nodes, null, 2));
      console.log("  Context:", context || "(none)");

      const manualContext = buildManualDesignContext({
        nodes,
        edges,
        metadata: {
          ...(metadata || {}),
          projectRequirements: context || "",
        },
      });

      console.log("=== MANUAL DESIGN CONTEXT ===");
      console.log(renderManualDesignContextAsText(manualContext));
      console.log("==============================");

      const prompt = buildManualDesignAnalysisPrompt(manualContext);

      console.log("📝 PROMPT BEING SENT TO AI:");
      console.log(prompt);
      console.log("==============================");

      let aiResponse;
      if (!AI_CONFIG.USE_REAL_AI) {
        // Mock mode
        console.log("[manual-design] Using mock analysis");
        aiResponse = getManualDesignAnalysisMock(nodes, edges);
      } else {
        // Real AI mode with JSON mode enabled
        try {
          console.log("[manual-design] ✅ Attempting real AI call...");
          
          const systemPrompt = "You are a senior software architect reviewing system designs. Provide constructive, concise feedback in JSON format.";
          const aiResult = await callOpenAI(systemPrompt, prompt, 1200); // Higher limit for detailed findings
          
          // Parse AI response (already validated as JSON by callOpenAI)
          aiResponse = JSON.parse(aiResult.content);
          
          console.log("[manual-design] ✅✅✅ Real AI analysis generated!");
          console.log("  Findings count:", aiResponse.findings?.length || 0);
          console.log("  Overall score:", aiResponse.score?.overall || 0);
        } catch (error) {
          console.error("========================================");
          console.error("[manual-design] ❌❌❌ AI CALL FAILED!");
          console.error("  Error:", error instanceof Error ? error.message : String(error));
          console.error("  Falling back to mock analysis");
          console.error("========================================");
          
          // Log failed request
          const authUser = getAuthUserFromRequest(req);
          if (authUser) {
            logAIRequest({
              userId: authUser.userId,
              mode: "manual",
              intent: "analysis",
              success: false,
              validationPassed: false,
              errorMessage: error instanceof Error ? error.message : String(error),
              durationMs: Date.now() - startTime,
            });
          }
          
          // Fallback to mock
          aiResponse = getManualDesignAnalysisMock(nodes, edges);
        }
      }

      // Log successful request
      const authUser = getAuthUserFromRequest(req);
      console.log("👤 Auth user for logging:", authUser ? `${authUser.userId} (${authUser.role})` : "NONE");
      if (authUser) {
        logAIRequest({
          userId: authUser.userId,
          mode: "manual",
          intent: "analysis",
          success: true,
          validationPassed: true,
          durationMs: Date.now() - startTime,
        });
      } else {
        console.warn("⚠️ Cannot log AI request: No authenticated user found");
      }

      return NextResponse.json({
        ok: true,
        data: {
          ...aiResponse,
          source: AI_CONFIG.USE_REAL_AI ? 'ai' : 'mock',
        },
      });
    }

    // Guards: Keep scope tight for student mode
    if (mode !== "student") {
      return NextResponse.json(
        { error: "Only 'student' mode supported for now" },
        { status: 400 }
      );
    }

    if (intent !== "architecture") {
      return NextResponse.json(
        { error: "Only 'architecture' intent supported for now" },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId required" },
        { status: 400 }
      );
    }

    // STEP B: Fetch data (from existing system)
    const reasoning = reasoningStore.get(projectId);

    if (!reasoning) {
      return NextResponse.json(
        { error: "Reasoning not completed" },
        { status: 404 }
      );
    }

    const definition = projectDefinitionStore.get(projectId);

    // Use defaults if definition missing (for testing without full flow)
    const finalDefinition = definition ?? {
      name: "Test Project",
      goal: "Test application for architecture generation",
      audience: "Students and learners",
    };

    if (!definition) {
      console.log(`No definition found for ${projectId}, using defaults`);
    }

    // STEP C: Build context (Step 4)
    const aiContext = buildStudentModeContext({
      definition: {
        name: finalDefinition.name,
        goal: finalDefinition.goal,
        audience: finalDefinition.audience,
      },
      reasoning: reasoning.answers,
    });

    // Log context for validation
    console.log("=== AI CONTEXT (from /api/ai/reason) ===");
    console.log(renderContextAsText(aiContext));
    console.log("========================================");

    // STEP D: Build prompt (Step 5)
    const prompt = buildStudentModeArchitecturePrompt(aiContext);

    // STEP E: Feature flag switch (this is the core)
    let aiResponse;

    if (!AI_CONFIG.USE_REAL_AI) {
      // Mock mode
      console.log("[student-mode] Using mock architecture");
      aiResponse = getStudentModeArchitectureMock();
    } else {
      // Real AI mode with JSON mode enabled
      try {
        console.log("[student-mode] ✅ Attempting real AI call...");
        
        const systemPrompt = "You are an expert software architect helping students design their first production systems. Generate clean, educational architectures in JSON format.";
        const aiResult = await callOpenAI(systemPrompt, prompt, 1200); // Higher limit for modules + reasoning
        
        // Parse AI response (already validated as JSON by callOpenAI)
        aiResponse = JSON.parse(aiResult.content);
        
        console.log("[student-mode] ✅✅✅ Real AI architecture generated!");
        console.log("  Nodes:", aiResponse.architecture?.nodes?.length || 0);
      } catch (error) {
        console.error("========================================");
        console.error("[student-mode] ❌❌❌ AI CALL FAILED!");
        console.error("  Error:", error instanceof Error ? error.message : String(error));
        console.error("  Falling back to mock architecture");
        console.error("========================================");
        
        // Log failed request
        const authUser = getAuthUserFromRequest(req);
        if (authUser) {
          logAIRequest({
            userId: authUser.userId,
            mode: "student",
            intent: "architecture",
            success: false,
            validationPassed: false,
            errorMessage: error instanceof Error ? error.message : String(error),
            durationMs: Date.now() - startTime,
          });
        }
        
        // Fallback to mock
        aiResponse = getStudentModeArchitectureMock();
      }
    }

    // Log successful request
    const authUser = getAuthUserFromRequest(req);
    console.log("👤 Auth user for logging:", authUser ? `${authUser.userId} (${authUser.role})` : "NONE");
    if (authUser) {
      logAIRequest({
        userId: authUser.userId,
        mode: "student",
        intent: "architecture",
        success: true,
        validationPassed: true,
        durationMs: Date.now() - startTime,
      });
    } else {
      console.warn("⚠️ Cannot log AI request: No authenticated user found");
    }

    // STEP F: Return response (full contract)
    return NextResponse.json({
      ok: true,
      data: aiResponse,
    });

  } catch (err) {
    console.error("AI reasoning failed:", err);
    return NextResponse.json(
      { error: "AI reasoning failed" },
      { status: 500 }
    );
  }
}
