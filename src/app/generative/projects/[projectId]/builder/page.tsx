// src/app/generative/projects/[projectId]/builder/page.tsx
// Server component wrapper that redirects to the actual builder route

import React from "react";
import { redirect } from "next/navigation";
import { getAuthUserFromRequest } from "@/lib/backend/auth";
import { connectDB } from "@/lib/backend/mongodb";
import { ProjectModel } from "@/lib/backend/models/Project";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

// Server component: runs on server, inspects request JWT, loads project minimal data, passes props to client
export default async function BuilderPage({ params }: PageProps) {
  const { projectId } = await params;
  
  // Get auth from special Next.js headers - this is a simplified approach
  // In production, you'd use middleware or server actions for proper request access
  const { cookies, headers } = await import('next/headers');
  const cookieStore = await cookies();
  const headersList = await headers();
  
  // Try to get token from Authorization header or cookie
  const authHeader = headersList.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  // Fallback to cookie if no header
  if (!token) {
    token = cookieStore.get('token')?.value || null;
  }
  
  // Create a minimal Request object for auth helper
  const mockRequest = {
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === 'authorization' && token) {
          return `Bearer ${token}`;
        }
        return null;
      }
    }
  } as Request;
  
  const authUser = getAuthUserFromRequest(mockRequest);
  
  // Require login for builder access
  if (!authUser) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-2">Unauthorized</h2>
          <p className="text-sm text-zinc-400 mb-4">
            You must be logged in to view the architecture builder.
          </p>
          <a 
            href="/login" 
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Load project to check permissions
  await connectDB();
  const project = await ProjectModel.findById(projectId).lean();
  
  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-2">Project not found</h2>
          <p className="text-sm text-zinc-400">
            The requested project does not exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  // Redirect to the actual builder route which is a client component
  // The actual builder is at /generative-ai-v2/[projectId]/builder
  redirect(`/generative-ai-v2/${projectId}/builder`);
}
