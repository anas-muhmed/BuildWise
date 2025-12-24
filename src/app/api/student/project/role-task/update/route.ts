// POST /api/student/project/role-task/update
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { requireRoleOrThrow } from "@/lib/backend/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await requireRoleOrThrow(req, ["student", "teacher", "admin"]);
    await connectDB();

    const body = await req.json();
    const { projectId, roleId, taskId, done } = body;

    if (!projectId || !roleId || !taskId || typeof done !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields: projectId, roleId, taskId, done" },
        { status: 400 }
      );
    }

    const project = await StudentProject.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId.toString() !== user.userId && user.role !== "admin" && user.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find role and task
    const role = project.roles?.find((r: any) => r.id === roleId);
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const task = role.tasks?.find((t: any) => t.id === taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Update task status
    task.done = done;

    // Check if milestone should be marked done (all tasks in milestone complete)
    if (task.milestoneId) {
      const allTasksInMilestone = project.roles
        ?.flatMap((r: any) => r.tasks || [])
        .filter((t: any) => t.milestoneId === task.milestoneId);
      
      const allDone = allTasksInMilestone?.every((t: any) => t.done);
      
      const milestone = project.milestones?.find((m: any) => m.id === task.milestoneId);
      if (milestone) {
        milestone.done = allDone || false;
      }
    }

    await project.save();

    return NextResponse.json({ 
      ok: true, 
      task: { id: task.id, done: task.done },
      milestone: task.milestoneId 
        ? { id: task.milestoneId, done: project.milestones?.find((m: any) => m.id === task.milestoneId)?.done }
        : null
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    return NextResponse.json({ error: error.message || "Server error" }, { status: error.status || 500 });
  }
}
