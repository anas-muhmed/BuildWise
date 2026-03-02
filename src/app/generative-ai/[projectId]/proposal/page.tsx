"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ProposalPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/`);
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-zinc-400">Redirecting...</p>
    </div>
  );
}
