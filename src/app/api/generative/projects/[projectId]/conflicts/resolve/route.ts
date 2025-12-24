// src/app/api/generative/projects/[projectId]/conflicts/resolve/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { resolveConflictService } from "@/lib/backend/services/conflictResolver";
import { requireRoleOrThrow } from "@/lib/backend/auth";
import nodemailer from "nodemailer";

async function sendNotificationEmail({ toList, subject, text }: { toList: string[], subject: string, text: string }) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.ALERT_FROM || `BuildWise <noreply@yourdomain.com>`;

  if (!host || !user || !pass) {
    console.warn("[notify] SMTP not configured — skipping email send.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  await transporter.sendMail({
    from,
    to: toList.join(","),
    subject,
    text
  });
}

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    await connectDB();
    
    // throws 401/403 if not allowed
    const user = requireRoleOrThrow(req, ["admin", "teacher"]);

    const { projectId } = params;
    const body = await req.json();
    const { conflictId, action, params: p } = body;

    const result = await resolveConflictService({ projectId, conflictId, action, params: p, actor: user.userId });
    if (!result.ok) return NextResponse.json({ ok: false, error: result.message || "resolve failed" }, { status: 400 });

    // Email notification to watchers (configure recipients via env)
    const notifyList = (process.env.RESOLVE_NOTIFY || "").split(",").map(s => s.trim()).filter(Boolean);
    if (notifyList.length > 0) {
      const subject = `BuildWise: Conflict resolved in project ${projectId}`;
      const text = `User ${user.userId} resolved conflict ${conflictId} with action ${action} in project ${projectId}.\n\nAudit: ${JSON.stringify(result.audit || {}, null, 2)}`;
      await sendNotificationEmail({ toList: notifyList, subject, text }).catch(e => console.error("email error", e));
    }

    return NextResponse.json({ ok: true, snapshot: result.snapshot, audit: result.audit });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("resolve route error", err);
    const status = err?.status || 500;
    return NextResponse.json({ ok: false, error: err?.message || "Failed to resolve conflict" }, { status });
  }
}
