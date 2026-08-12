"use client";

import React from "react";
import { cn } from "@/utils/cn";

export interface StickyHeaderProps {
  children: React.ReactNode;
  className?: string;
  topOffset?: string;
}

export function StickyHeader({
  children,
  className,
  topOffset = "top-0",
}: StickyHeaderProps) {
  return (
    <header
      className={cn(
        "sticky z-20 bg-white/85 backdrop-blur-md border-b border-gray-200/80 shadow-xs",
        topOffset,
        className
      )}
    >
      {children}
    </header>
  );
}
