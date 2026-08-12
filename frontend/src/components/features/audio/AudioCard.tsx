"use client";

import React from "react";
import { FileAudio, Play, Trash2, Edit3, Loader2 } from "lucide-react";
import { AudioFile } from "@/types/audio";
import { formatDate } from "@/utils/formatters";

export interface AudioCardProps {
  audio: AudioFile;
  isActive: boolean;
  onPlay: (audio: AudioFile) => void;
  onTranscribe: (id: string) => void;
  onEdit: (audio: AudioFile) => void;
  onDelete: (id: string, name: string) => void;
  isTranscribing?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string, checked: boolean) => void;
}

export function AudioCard({
  audio,
  isActive,
  onPlay,
  onTranscribe,
  onEdit,
  onDelete,
  isTranscribing = false,
  isSelected = false,
  onToggleSelect,
}: AudioCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "uploaded":
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 rounded-full text-[11px] font-medium">
            À transcrire
          </span>
        );
      case "transcribing":
      case "correcting":
      case "converting":
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200/60 px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1">
            <Loader2 size={11} className="animate-spin" /> En cours...
          </span>
        );
      case "transcribed":
      case "corrected":
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full text-[11px] font-medium">
            Terminé
          </span>
        );
      case "error":
        return (
          <span className="bg-red-50 text-red-700 border border-red-200/60 px-2 py-0.5 rounded-full text-[11px] font-medium">
            Erreur
          </span>
        );
      default:
        return (
          <span className="bg-gray-50 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full text-[11px] font-medium">
            {status}
          </span>
        );
    }
  };

  return (
    <div
      className={`border-b border-gray-100 last:border-b-0 py-2.5 px-4 flex items-center justify-between gap-4 transition-colors ${
        isActive ? "bg-blue-50/40" : "bg-white hover:bg-gray-50/70"
      }`}
    >
      <div className="flex items-center gap-3 overflow-hidden flex-1">
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onToggleSelect(audio.id, e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0 cursor-pointer"
          />
        )}
        <div className="text-gray-400 shrink-0">
          <FileAudio size={16} />
        </div>
        <div className="flex items-center gap-3 truncate w-full">
          <span
            className="font-medium text-gray-900 text-xs sm:text-sm truncate max-w-[180px] sm:max-w-[240px]"
            title={audio.original_filename}
          >
            {audio.original_filename}
          </span>
          <span className="text-[11px] text-gray-400 uppercase shrink-0 font-mono">
            {audio.format}
          </span>
          <span className="text-[11px] text-gray-400 shrink-0 hidden md:inline">
            {formatDate(audio.created_at)}
          </span>
          <div className="shrink-0">{getStatusBadge(audio.status)}</div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {["uploaded", "error"].includes(audio.status) && (
          <button
            type="button"
            onClick={() => onTranscribe(audio.id)}
            disabled={isTranscribing}
            className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 font-medium"
            title="Lancer la transcription"
          >
            Transcrire
          </button>
        )}

        {["transcribed", "corrected"].includes(audio.status) && (
          <button
            type="button"
            onClick={() => onEdit(audio)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            title="Ouvrir la transcription"
          >
            <Edit3 size={15} />
          </button>
        )}

        <button
          type="button"
          onClick={() => onPlay(audio)}
          className={`p-1.5 rounded-lg transition-colors ${
            isActive
              ? "bg-blue-600 text-white"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          }`}
          title="Écouter l'audio"
        >
          <Play size={15} />
        </button>

        <button
          type="button"
          onClick={() => onDelete(audio.id, audio.original_filename)}
          className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          title="Supprimer le fichier"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
