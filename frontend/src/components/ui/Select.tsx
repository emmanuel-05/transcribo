"use client";

import React, { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  icon?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, icon, id, ...props }, ref) => {
    return (
      <div className="flex items-center gap-1.5 bg-gray-50/80 border border-gray-200 rounded-xl px-2.5 py-1 sm:py-1.5">
        {icon && <span className="text-gray-500 shrink-0">{icon}</span>}
        <select
          id={id}
          ref={ref}
          className={cn(
            "bg-transparent text-xs sm:text-sm text-gray-700 outline-none cursor-pointer pr-1",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

Select.displayName = "Select";
