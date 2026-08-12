"use client";

import React from "react";
import { PlayCircle, Loader2 } from "lucide-react";
import { AudioFile } from "@/types/audio";
import { AudioCard } from "./AudioCard";
import { Pagination } from "@/components/ui/Pagination";

export interface AudioListProps {
  audios: AudioFile[];
  allAudiosCount: number;
  activeAudio: AudioFile | null;
  onPlayAudio: (audio: AudioFile) => void;
  onTranscribeAudio: (id: string) => void;
  onEditTranscript: (audio: AudioFile) => void;
  onDeleteAudio: (id: string, name: string) => void;
  onTranscribeAll?: () => void;
  isTranscribingAll?: boolean;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function AudioList({
  audios,
  allAudiosCount,
  activeAudio,
  onPlayAudio,
  onTranscribeAudio,
  onEditTranscript,
  onDeleteAudio,
  onTranscribeAll,
  isTranscribingAll,
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
}: AudioListProps) {
  const pendingCount = audios.filter((a) => ["uploaded", "error"].includes(a.status)).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* En-tête de la liste */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Fichiers Audio</h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
            {allAudiosCount}
          </span>
        </div>

        {onTranscribeAll && pendingCount > 0 && (
          <button
            type="button"
            onClick={onTranscribeAll}
            disabled={isTranscribingAll}
            className="bg-gray-900 text-white hover:bg-gray-800 text-xs font-medium px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isTranscribingAll ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Transcription en cours...
              </>
            ) : (
              <>
                <PlayCircle size={13} />
                Tout transcrire ({pendingCount})
              </>
            )}
          </button>
        )}
      </div>

      {/* Liste des audios */}
      {audios.length === 0 ? (
        <div className="p-8 text-center text-gray-500 text-xs sm:text-sm">
          Aucun fichier audio dans ce projet pour le moment.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {audios.map((audio) => (
            <AudioCard
              key={audio.id}
              audio={audio}
              isActive={activeAudio?.id === audio.id}
              onPlay={onPlayAudio}
              onTranscribe={onTranscribeAudio}
              onEdit={onEditTranscript}
              onDelete={onDeleteAudio}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-3 bg-gray-50/50 border-t border-gray-100">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={allAudiosCount}
            itemsPerPage={pageSize}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
