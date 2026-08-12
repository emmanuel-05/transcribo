"use client";

import React, { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-gray-400 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={id}
            ref={ref}
            className={cn(
              "w-full border bg-white text-gray-900 rounded-xl text-xs sm:text-sm transition-all outline-none",
              leftIcon ? "pl-9" : "pl-3",
              rightIcon ? "pr-9" : "pr-3",
              "py-2 sm:py-2.5",
              error
                ? "border-red-300 focus:ring-1 focus:ring-red-400"
                : "border-gray-300 focus:ring-1 focus:ring-gray-400",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center">{rightIcon}</div>
          )}
        </div>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
