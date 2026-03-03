"use client";
import { useAuth } from "@/lib/authContext";
import LoginModal from "@/components/LoginModal";

/**
 * GlobalAuthModal — rendered once in root layout.
 * Opens automatically when any page calls openAuthModal().
 * forceAuth=true means backdrop click won't dismiss it.
 */
export default function GlobalAuthModal() {
    const { authModalOpen, closeAuthModal, isAuthenticated } = useAuth();

    return (
        <LoginModal
            isOpen={authModalOpen && !isAuthenticated}
            onClose={closeAuthModal}
            forceAuth={true}
        />
    );
}
