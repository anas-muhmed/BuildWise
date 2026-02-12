/**
 * Admin Projects API
 * 
 * Purpose: View all projects across users
 * 
 * GET: List all projects with owner info
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/backend/adminMiddleware";
import { connectDB } from "@/lib/backend/db";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  const authCheck = requireAdmin(req);
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    await connectDB();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database not connected");
    }

    // Get all projects from GenAIV2 collection
    const projectsCollection = db.collection("genai_v2");
    const projects = await projectsCollection
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "owner"
          }
        },
        {
          $unwind: {
            path: "$owner",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            title: 1,
            description: 1,
            userId: 1,
            createdAt: 1,
            updatedAt: 1,
            owner: {
              _id: 1,
              name: 1,
              email: 1,
              role: 1
            },
            snapshotCount: { $size: { $ifNull: ["$snapshots", []] } }
          }
        },
        { $sort: { createdAt: -1 } }
      ])
      .toArray();

    return NextResponse.json({ projects });
  } catch (error: any) {
    console.error("Admin projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
