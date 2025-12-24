// src/app/api/student/project/distribute/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { requireRoleOrThrow } from "@/lib/backend/auth";
import { distributeTeamHours } from "@/lib/backend/services/distributionEngineV2";
import { AuditModel } from "@/lib/backend/models/Audit";

export async function POST(req: NextRequest) {
  try {
    const user = await requireRoleOrThrow(req, ["student", "teacher", "admin"]);
    await connectDB();

    const body = await req.json();
    const { projectId, roster, roleSkillMap } = body;

    if (!projectId) return NextResponse.json({ ok: false, error: "projectId required" }, { status: 400 });
    
    const project = await StudentProject.findById(projectId);
    if (!project) return NextResponse.json({ ok: false, error: "project not found" }, { status: 404 });

    // only owner or teacher/admin can distribute
    if (String(project.userId) !== String(user.userId) && !["teacher", "admin"].includes(user.role)) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const roles = project.roles || [];
    const inputRoster = Array.isArray(roster) ? roster : [];

    // run hours-aware engine
    const result = distributeTeamHours({ roles, roster: inputRoster, roleSkillMap: roleSkillMap || {} });

    // persist assignments in project.roles[].assignments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newRoles = roles.map((r: any) => {
      const membersForRole = result.assignments.filter(a => a.primaryRole === r.title);
      return { ...r, assignments: membersForRole };
    });

    project.roles = newRoles as typeof project.roles;
    await project.save();

    // write audit
    try {
      const audit = await AuditModel.create({
        projectId,
        conflictId: null,
        action: "distribute_team_hours_v2",
        actor: user.userId,
        details: {
          roster: inputRoster,
          roleSkillMap: roleSkillMap || {},
          assignments: result.assignments,
          warnings: result.warnings || [],
          timestamp: new Date().toISOString()
        }
      });

      return NextResponse.json({ ok: true, result, project, audit });
    } catch (auditErr) {
      console.error("audit write failed", auditErr);
      return NextResponse.json({ ok: true, result, project, warning: "distribution succeeded but audit failed" });
    }
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    console.error("distribute hours error", error);
    return NextResponse.json({ ok: false, error: error.message || "internal" }, { status: error.status || 500 });
  }
}
