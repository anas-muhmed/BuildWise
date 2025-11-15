import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import Design from "@/lib/backend/models/Design";
import { requireAuth } from "@/lib/backend/authMiddleware";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Step 1: Check authentication
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const user = authResult;

  // Step 2: Connect to database
  await connectDB();

  // Step 3: Validate the design ID
  const { id } = params;
  if (!id || id.length !== 24) {
    return NextResponse.json(
      { error: "Invalid design ID" },
      { status: 400 }
    );
  }

  try {
    // Step 4: Find the design
    const design = await Design.findById(id);

    if (!design) {
      return NextResponse.json(
        { error: "Design not found" },
        { status: 404 }
      );
    }

    // Step 5: Check ownership or admin role
    // User can delete if: (they own it) OR (they are admin)
    const isOwner = design.userId.toString() === user.id;
    const isAdmin = user.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to delete this design" },
        { status: 403 }
      );
    }

    // Step 6: Delete the design
    await Design.findByIdAndDelete(id);

    // Step 7: Return success
    return NextResponse.json(
      {
        success: true,
        message: "Design deleted successfully",
        deletedBy: user.role === "admin" ? "admin" : "owner",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting design:", error);
    return NextResponse.json(
      { error: "Failed to delete design" },
      { status: 500 }
    );
  }
}
