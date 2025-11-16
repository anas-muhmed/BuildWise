import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { Design } from "@/lib/backend/models/Design";
import { getAuthUser } from "@/lib/backend/authMiddleware";
import { AdminLog } from "@/lib/backend/models/AdminLog";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = getAuthUser(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const user = authResult;

  await connectDB();

  //Validate id
  const { id } = params;
  if (!id || id.length !== 24) {
    return NextResponse.json({ error: "invalid design ID" }, { status: 400 });
  }
  try{
    const design=await Design.findById(id);
     if (!design) {
      return NextResponse.json(
        { error: "Design not found" },
        { status: 404 }
      );
    }
    const isOwner = design.userId.toString() === user.id;
    const isAdmin = user.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to delete this design" },
        { status: 403 }
      );
    }
    await Design.findByIdAndDelete(id);

        return NextResponse.json(
      {
        success: true,
        message: "Design deleted successfully",
        deletedBy: user.role === "admin" ? "admin" : "owner",
      },
      { status: 200 }
    );

  }catch(error){
    console.error("Error deleting design:",error);
    return NextResponse.json(
        {error:"Failed to delete design"},
        {status:500}
    );
  }
}
