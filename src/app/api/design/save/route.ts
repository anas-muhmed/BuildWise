// app/api/design/save/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { Design } from "@/lib/backend/models/Design";
import { requireAuth } from "@/lib/backend/authMiddleware";

export async function POST(req: Request) {
  try {
    // Step 1: Authenticate user (using middleware!)
    const authResult = requireAuth(req);
    
    // Step 2: Check if it's an error response
    if (authResult instanceof NextResponse) {
      return authResult;  // Return 401 error
    }
    
    // Step 3: Now we have the user data safely
    const user = authResult;  // { id: "123", role: "student" }

    // Step 4: Parse request body (architecture data)
    const body = await req.json();
    const { title, prompt, nodes, edges } = body;

    // Step 5: Validate required fields
    if (!nodes || !Array.isArray(nodes)) {
      return NextResponse.json(
        { error: "Invalid payload: nodes array required" }, 
        { status: 400 }
      );
    }

    // Step 6: Connect to database
    await connectDB();

    // Step 7: Create design document in MongoDB
    const design = await Design.create({
      userId: user.id,  // Link to the authenticated user
      title: title || (prompt ? prompt.slice(0, 50) : "Untitled"),
      prompt,
      nodes,
      edges: edges || [],
    });

    // Step 8: Return saved design
    return NextResponse.json({ 
      success: true,
      design 
    });

  } catch (error) {
    // ✅ PROPER ERROR HANDLING
    console.error("Save design error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Server error while saving design" }, 
      { status: 500 }
    );
  }
}
