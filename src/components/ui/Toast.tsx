import React, { useEffect } from "react";

export interface ToastProps {
  message: string;
  type?: "error" | "success" | "info";
  onClose: () => void;
  duration?: number;
}

const typeStyles = {
  error: "bg-red-600 text-white border-red-400",
  success: "bg-green-600 text-white border-green-400",
  info: "bg-blue-600 text-white border-blue-400",
};

export default function Toast({ message, type = "info", onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded-lg shadow-lg border ${typeStyles[type]} animate-in fade-in duration-200`}
      role="alert"
      aria-live="assertive"
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-4 text-white/80 hover:text-white font-bold text-lg"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}
