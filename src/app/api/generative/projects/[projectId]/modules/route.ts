// app/api/generative/projects/[id]/modules/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { Module } from "@/lib/backend/models/Module";
import { AuditLog } from "@/lib/backend/models/DraftProject";
import { validateLLMModule } from "@/lib/backend/services/llmValidator";
import { getAuthUser } from "@/lib/backend/authMiddleware";

/**
 * 🎯 PHASE 3: Module API Routes - Master's Implementation
 * POST - Create module draft from LLM result or manual body
 * GET - List all modules for a project
 */

// POST /api/generative/projects/:projectId/modules
// Create module draft from LLM result or manual body
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user || user instanceof NextResponse) {
      return user || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const projectId = resolvedParams.id;
    const userId = user.id;
    const body = await req.json();

    await connectDB();

    // if request has llm_output, validate; else expect body nodes/edges
    if (body.llm_output) {
      const validation = validateLLMModule(body.llm_output);
      if (!validation.valid) {
        return NextResponse.json({ 
          ok: false, 
          error: 'LLM output validation failed', 
          details: validation.errors 
        }, { status: 400 });
      }
      
      const llm = body.llm_output;
      const moduleDoc = await Module.create({
        project_id: projectId,
        name: llm.module_name,
        description: body.description || '',
        nodes: llm.nodes,
        edges: llm.edges,
        rationale: llm.rationale,
        status: 'proposed',
        created_by: userId,
        order: body.order || 0,
        ai_feedback: {
          confidence: llm.confidence,
          raw: body.llm_output
        }
      });
      
      await AuditLog.create({ 
        project_id: projectId, 
        action: 'module_created', 
        by: userId, 
        reason: 'created from LLM', 
        metadata: { module_id: moduleDoc._id.toString() }
      });
      
      return NextResponse.json({ ok: true, module: moduleDoc });
    } else {
      // manual module creation
      const { name, nodes, edges, rationale, order } = body;
      
      if (!name || !nodes || !edges || !rationale) {
        return NextResponse.json({ 
          ok: false, 
          error: 'Missing required fields: name, nodes, edges, rationale' 
        }, { status: 400 });
      }
      
      const moduleDoc = await Module.create({
        project_id: projectId,
        name,
        description: body.description || '',
        nodes,
        edges,
        rationale,
        status: 'proposed',
        created_by: userId,
        order: order || 0
      });
      
      await AuditLog.create({ 
        project_id: projectId, 
        action: 'module_created', 
        by: userId, 
        reason: 'manual', 
        metadata: { module_id: moduleDoc._id.toString() }
      });
      
      return NextResponse.json({ ok: true, module: moduleDoc });
    }
  } catch (err) {
    console.error('[modules POST]', err);
    return NextResponse.json({ 
      ok: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// GET /api/generative/projects/:projectId/modules
// List all modules for a project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user || user instanceof NextResponse) {
      return user || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    await connectDB();

    const modules = await Module.find({ project_id: projectId })
      .sort({ order: 1, created_at: 1 })
      .lean();
    
    return NextResponse.json({ ok: true, modules });
  } catch (err) {
    console.error('[modules GET]', err);
    return NextResponse.json({ 
      ok: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
