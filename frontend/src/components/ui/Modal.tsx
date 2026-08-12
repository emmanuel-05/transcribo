"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

const maxWidthStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
  className,
}: ModalProps) {
  // Fermeture avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className={cn(
          "bg-white rounded-2xl border border-gray-200 shadow-2xl w-full p-5 sm:p-6 animate-in zoom-in-95 duration-150 relative overflow-hidden",
          maxWidthStyles[maxWidth],
          className
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          title="Fermer"
        >
          <X size={18} />
        </button>

        {title && (
          <div className="mb-4 pr-6">
            <h3 className="text-base font-semibold text-gray-900 leading-snug">{title}</h3>
            {description && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        <div>{children}</div>
      </div>
    </div>
  );
}
