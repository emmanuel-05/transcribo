"use client";

import React from "react";
import { cn } from "@/utils/cn";

export interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "5xl" | "7xl" | "full";
  className?: string;
}

const maxWidthStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "5xl": "max-w-5xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
};

export function PageContainer({
  children,
  maxWidth = "7xl",
  className,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "w-full mx-auto px-4 sm:px-6 lg:px-8",
        maxWidthStyles[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
}
