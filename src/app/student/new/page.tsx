"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import StudentNewWizard from "@/components/student/StudentNewWizard";

export default function StudentNewPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#0d0d0d]">
        <StudentNewWizard />
      </div>
    </ProtectedRoute>
  );
}
