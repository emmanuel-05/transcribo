"use client";

import React from "react";
import { Folder, Calendar, Trash2 } from "lucide-react";
import { Project } from "@/types/project";
import { formatDate } from "@/utils/formatters";

export interface ProjectCardProps {
  project: Project;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

export function ProjectCard({
  project,
  isSelected = false,
  onToggleSelect,
  onOpen,
  onDelete,
}: ProjectCardProps) {
  const formattedDate = formatDate(project.created_at);

  return (
    <div
      className={`w-full bg-white/95 backdrop-blur-md rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden group min-h-[160px] ${
        isSelected
          ? "border-blue-300 ring-2 ring-blue-500/80 shadow-md bg-blue-50/10"
          : "border-gray-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)] hover:border-gray-300/80"
      }`}
    >
      {/* Zone de contenu */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Header : Checkbox + Icône Dossier + Titre */}
          <div className="flex items-start gap-2.5">
            {onToggleSelect && (
              <div className="pt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleSelect(project.id);
                  }}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  aria-label={`Sélectionner ${project.name}`}
                />
              </div>
            )}
            <div className="p-1.5 rounded-lg bg-gray-100/90 text-gray-600 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <Folder size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="text-sm font-semibold text-gray-900 truncate tracking-tight leading-snug"
                title={project.name}
              >
                {project.name}
              </h3>
            </div>
          </div>

          {/* Description optionnelle */}
          {project.description && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed pl-0.5">
              {project.description}
            </p>
          )}
        </div>

        {/* Date de création */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-normal mt-3 pt-1">
          <Calendar size={12} className="text-gray-400 shrink-0" />
          <span>Créé le {formattedDate}</span>
        </div>
      </div>

      {/* Pied de carte */}
      <div className="bg-gray-50/80 px-3.5 py-2.5 border-t border-gray-100/80 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpen(project.id)}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs px-3 py-1.5 rounded-lg shadow-xs hover:shadow transition-all flex items-center gap-1"
        >
          Ouvrir
        </button>
        <button
          type="button"
          onClick={() => onDelete(project.id, project.name)}
          className="text-red-500 hover:text-red-600 hover:bg-red-50/80 border border-red-200/80 hover:border-red-300 font-medium text-xs px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
          title="Supprimer le projet"
        >
          <Trash2 size={13} />
          Supprimer
        </button>
      </div>
    </div>
  );
}
