"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : undefined;
  const endItem =
    itemsPerPage && totalItems
      ? Math.min(currentPage * itemsPerPage, totalItems)
      : undefined;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-200/80",
        className
      )}
    >
      {totalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
        <p className="text-xs text-gray-500">
          Affichage de <span className="font-medium text-gray-700">{startItem}</span> à{" "}
          <span className="font-medium text-gray-700">{endItem}</span> sur{" "}
          <span className="font-medium text-gray-700">{totalItems}</span> éléments
        </p>
      ) : (
        <p className="text-xs text-gray-500">
          Page <span className="font-medium text-gray-700">{currentPage}</span> sur{" "}
          <span className="font-medium text-gray-700">{totalPages}</span>
        </p>
      )}

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium flex items-center gap-1 transition-colors"
        >
          <ChevronLeft size={15} />
          <span className="hidden sm:inline">Précédent</span>
        </button>

        <div className="flex items-center gap-1 px-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={cn(
                "w-8 h-8 rounded-xl text-xs font-medium transition-colors",
                currentPage === pageNum
                  ? "bg-gray-900 text-white shadow-xs"
                  : "text-gray-700 hover:bg-gray-100 border border-transparent"
              )}
            >
              {pageNum}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium flex items-center gap-1 transition-colors"
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
