"use client";

import React from "react";
import { FolderOpen } from "lucide-react";
import { Project } from "@/types/project";
import { ProjectCard } from "./ProjectCard";

export interface ProjectGridProps {
  projects: Project[];
  isLoading: boolean;
  searchQuery?: string;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onOpenProject: (id: string) => void;
  onDeleteProject: (id: string, name: string) => void;
  onClearSearch?: () => void;
  onCreateNew?: () => void;
}

export function ProjectGrid({
  projects,
  isLoading,
  searchQuery,
  selectedIds,
  onToggleSelect,
  onOpenProject,
  onDeleteProject,
  onClearSearch,
  onCreateNew,
}: ProjectGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-44 bg-gray-200/60 rounded-xl border border-gray-200/60"
          />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 bg-white/70 backdrop-blur-md rounded-2xl border border-dashed border-gray-300 text-gray-500">
        <FolderOpen size={44} className="mx-auto mb-3 text-gray-400" />
        {searchQuery ? (
          <>
            <p className="text-base font-medium text-gray-700">Aucun projet trouvé</p>
            <p className="text-xs text-gray-400 mt-1">
              Aucun projet ne correspond à "{searchQuery}".
            </p>
            {onClearSearch && (
              <button
                type="button"
                onClick={onClearSearch}
                className="mt-3 text-xs text-blue-600 hover:underline"
              >
                Effacer la recherche
              </button>
            )}
          </>
        ) : (
          <>
            <p className="text-base font-medium text-gray-700">Aucun projet pour le moment</p>
            <p className="text-xs text-gray-400 mt-1">
              Cliquez sur "Nouveau projet" pour commencer une transcription.
            </p>
            {onCreateNew && (
              <button
                type="button"
                onClick={onCreateNew}
                className="mt-4 bg-gray-900 text-white text-xs font-medium px-3.5 py-2 rounded-xl hover:bg-gray-800 transition-colors shadow-xs"
              >
                Créer un projet
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          isSelected={selectedIds.includes(project.id)}
          onToggleSelect={onToggleSelect}
          onOpen={onOpenProject}
          onDelete={onDeleteProject}
        />
      ))}
    </div>
  );
}
