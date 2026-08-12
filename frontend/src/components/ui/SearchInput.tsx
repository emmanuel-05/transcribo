"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/utils/cn";

export interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Rechercher...",
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative flex-1", className)}>
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-8 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-300 focus:border-transparent outline-none transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
          title="Effacer la recherche"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
