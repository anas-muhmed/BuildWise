// app/api/generative/projects/[id]/admin/review/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { ReviewQueue } from "@/lib/backend/models/ReviewQueue";
import { Module } from "@/lib/backend/models/Module";
import { getAuthUser } from "@/lib/backend/authMiddleware";

/**
 * 🎯 PHASE 5: Admin Review Queue API - Master's Implementation
 * GET - List pending conflicts for admin review
 * PATCH - Resolve conflict (approve/reject/manual merge)
 */

// GET /api/generative/projects/:projectId/admin/review
// List pending review items
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user || user instanceof NextResponse) {
      return user || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin role check here
    // if (user.role !== 'admin') return 403;

    const projectId = params.id;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';

    await connectDB();

    const reviewItems = await ReviewQueue.find({
      project_id: projectId,
      status
    })
      .populate('module_id')
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json({ ok: true, items: reviewItems });
  } catch (err) {
    console.error('[admin review GET]', err);
    return NextResponse.json({
      ok: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PATCH /api/generative/projects/:projectId/admin/review
// Resolve a review item
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user || user instanceof NextResponse) {
      return user || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin role check
    // if (user.role !== 'admin') return 403;

    const projectId = params.id;
    const body = await req.json();
    const { review_item_id, resolution, admin_notes } = body;

    if (!review_item_id || !resolution) {
      return NextResponse.json({
        ok: false,
        error: 'Missing review_item_id or resolution'
      }, { status: 400 });
    }

    await connectDB();

    const reviewItem = await ReviewQueue.findOne({
      _id: review_item_id,
      project_id: projectId
    });

    if (!reviewItem) {
      return NextResponse.json({
        ok: false,
        error: 'Review item not found'
      }, { status: 404 });
    }

    // Update review item
    reviewItem.status = 'reviewed';
    reviewItem.reviewed_by = user.id;
    reviewItem.reviewed_at = new Date();
    reviewItem.resolution = resolution;
    if (admin_notes) reviewItem.admin_notes = admin_notes;

    await reviewItem.save();

    // If approved, update module status
    if (resolution === 'approve_module1' || resolution === 'approve_module2') {
      const moduleData = await Module.findById(reviewItem.module_id);
      if (moduleData) {
        moduleData.status = 'approved';
        moduleData.approved_by = user.id;
        await moduleData.save();
      }
    }

    // If rejected, mark module as rejected
    if (resolution === 'reject_both') {
      const moduleData = await Module.findById(reviewItem.module_id);
      if (moduleData) {
        moduleData.status = 'rejected';
        await moduleData.save();
      }
    }

    return NextResponse.json({
      ok: true,
      review_item: reviewItem,
      message: `Review item ${resolution}`
    });
  } catch (err) {
    console.error('[admin review PATCH]', err);
    return NextResponse.json({
      ok: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
