"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BuilderPage() {
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
