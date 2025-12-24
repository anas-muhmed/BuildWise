import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/db";
import { ModuleModel } from "@/lib/backend/models/Module";

/**
 * POST /api/generative/projects/[projectId]/modules/reorder
 * 
 * Body: { order: string[] } - array of module IDs in new order
 * 
 * Updates the `order` field for each module to match array index.
 * Returns updated modules sorted by new order.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { order } = body as { order: string[] };

    if (!Array.isArray(order) || order.length === 0) {
      return NextResponse.json({ error: "Invalid order array" }, { status: 400 });
    }

    // Update each module's order field to match its position in the array
    const updatePromises = order.map((moduleId, index) =>
      ModuleModel.findByIdAndUpdate(
        moduleId,
        { order: index },
        { new: true }
      )
    );

    const updatedModules = await Promise.all(updatePromises);

    // Filter out any null results (modules that weren't found)
    const validModules = updatedModules.filter(Boolean);

    return NextResponse.json({
      success: true,
      modules: validModules.sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
    });
  } catch (error) {
    console.error("Reorder modules error:", error);
    return NextResponse.json(
      { error: "Failed to reorder modules" },
      { status: 500 }
    );
  }
}
