"use client";

import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "danger" | "outline" | "ghost" | "blue";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950 shadow-xs",
  blue: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-xs",
  secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-xs",
  outline: "bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-100 active:bg-gray-200",
  ghost: "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100",
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: "px-2.5 py-1 text-xs rounded-lg gap-1",
  sm: "px-3 py-1.5 text-xs sm:text-sm rounded-xl gap-1.5",
  md: "px-4 py-2 text-sm rounded-xl gap-2",
  lg: "px-5 py-2.5 text-base rounded-2xl gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      type = "button",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 size={15} className="animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
