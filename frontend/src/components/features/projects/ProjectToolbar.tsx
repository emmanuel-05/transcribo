"use client";

import React from "react";
import { Plus, Trash2, ArrowUpDown, CheckSquare, Square } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { SortOption } from "@/types/project";

export interface ProjectToolbarProps {
  totalCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  selectedCount: number;
  isAllSelected: boolean;
  hasProjects: boolean;
  onToggleSelectAll: () => void;
  onOpenCreate: () => void;
  onOpenBatchDelete: () => void;
}

const sortOptions = [
  { value: "date_desc", label: "Date : Plus récent" },
  { value: "date_asc", label: "Date : Plus ancien" },
  { value: "name_asc", label: "Nom : A → Z" },
  { value: "name_desc", label: "Nom : Z → A" },
];

export function ProjectToolbar({
  totalCount,
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  selectedCount,
  isAllSelected,
  hasProjects,
  onToggleSelectAll,
  onOpenCreate,
  onOpenBatchDelete,
}: ProjectToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Ligne 1 : Titre + Compteur + Boutons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
            Mes projets
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
            {totalCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={onOpenBatchDelete}
              className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Trash2 size={14} />
              Supprimer la sélection ({selectedCount})
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCreate}
            className="bg-gray-900 text-white px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 hover:bg-gray-800 transition-colors shadow-xs"
          >
            <Plus size={15} />
            Nouveau projet
          </button>
        </div>
      </div>

      {/* Ligne 2 : Recherche + Tri + Tout sélectionner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Rechercher un projet..."
          className="max-w-md"
        />

        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          <Select
            options={sortOptions}
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            icon={<ArrowUpDown size={13} />}
          />

          {hasProjects && (
            <button
              type="button"
              onClick={onToggleSelectAll}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title={
                isAllSelected
                  ? "Tout désélectionner sur cette page"
                  : "Tout sélectionner sur cette page"
              }
            >
              {isAllSelected ? (
                <CheckSquare size={15} className="text-blue-600" />
              ) : (
                <Square size={15} className="text-gray-400" />
              )}
              <span className="hidden sm:inline">Tout sélectionner</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
