import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { Design } from "@/lib/backend/models/Design";
import { getAuthUser } from "@/lib/backend/authMiddleware";

export async function GET(req: NextRequest) {
  try {
    const authResult = getAuthUser(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    // ========================================
    // Pagination & Search Parameters
    // ========================================
    const url = new URL(req.url);
    
    // Get page number (default: 1, minimum: 1)
    const page = Math.max(Number(url.searchParams.get("page") || "1"), 1);
    
    // Get limit per page (default: 20, max: 100)
    const limit = Math.min(Number(url.searchParams.get("limit") || "20"), 100);
    
    // Get search query (optional)
    const searchQuery = (url.searchParams.get("q") || "").trim();
    
    // Get status filter (optional: pending, verified, flagged)
    const statusFilter = url.searchParams.get("status");

    // ========================================
    // Build Filter Query
    // ========================================
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { deleted: { $ne: true } }; // Exclude soft-deleted designs
    
    // Add search filter (title or prompt)
    if (searchQuery) {
      filter.$or = [
        { title: { $regex: searchQuery, $options: "i" } },      // Case-insensitive search in title
        { prompt: { $regex: searchQuery, $options: "i" } },     // Case-insensitive search in prompt
      ];
    }
    
    // Add status filter
    if (statusFilter && ["pending", "verified", "flagged"].includes(statusFilter)) {
      filter.status = statusFilter;
    }

    // ========================================
    // Execute Queries
    // ========================================
    // Get total count for pagination metadata
    const total = await Design.countDocuments(filter);
    
    // Fetch paginated designs
    const designs = await Design.find(filter)
      .sort({ createdAt: -1 })              // Newest first
      .skip((page - 1) * limit)             // Skip previous pages
      .limit(limit)                         // Limit results per page
      .populate("userId", "name email")     // Get user details
      .lean();                              // Return plain objects

    // ========================================
    // Return with Pagination Metadata
    // ========================================
    return NextResponse.json({
      success: true,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
      designs,
    });
      } catch (error) {
    console.error("Admin designs error:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Server error while fetching designs" },
      { status: 500 }
    );
  }
}