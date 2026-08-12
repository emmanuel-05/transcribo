"use client";

import React from "react";
import { cn } from "@/utils/cn";

export type BadgeVariant =
  | "active"
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "blue"
  | "purple";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; dot: string }> = {
  active: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    dot: "bg-emerald-500",
  },
  success: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    dot: "bg-emerald-500",
  },
  warning: {
    bg: "bg-amber-50 text-amber-700 border-amber-200/60",
    dot: "bg-amber-500",
  },
  danger: {
    bg: "bg-red-50 text-red-700 border-red-200/60",
    dot: "bg-red-500",
  },
  neutral: {
    bg: "bg-gray-100 text-gray-700 border-gray-200",
    dot: "bg-gray-400",
  },
  blue: {
    bg: "bg-blue-50 text-blue-700 border-blue-200/60",
    dot: "bg-blue-500",
  },
  purple: {
    bg: "bg-purple-50 text-purple-700 border-purple-200/60",
    dot: "bg-purple-500",
  },
};

export function Badge({
  children,
  variant = "neutral",
  dot = false,
  className,
}: BadgeProps) {
  const config = variantStyles[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border shrink-0",
        config.bg,
        className
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />}
      {children}
    </span>
  );
}
