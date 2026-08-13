"use client";

import React from "react";
import { PlayCircle, Loader2, Trash2, CheckSquare, Square, X } from "lucide-react";
import { AudioFile } from "@/types/audio";
import { AudioCard } from "./AudioCard";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/Button";

export interface AudioListProps {
  audios: AudioFile[];
  allAudiosCount: number;
  activeAudio: AudioFile | null;
  playingAudioId?: string;
  selectedAudios?: string[];
  onToggleSelectAudio?: (id: string, checked: boolean) => void;
  onSelectAllAudios?: (checked: boolean) => void;
  onClearSelection?: () => void;
  onPlayAudio: (audio: AudioFile) => void;
  onTranscribeAudio: (id: string) => void;
  onEditTranscript: (audio: AudioFile) => void;
  onDeleteAudio: (id: string, name: string) => void;
  onTranscribeAll?: () => void;
  onTranscribeSelected?: () => void;
  onDeleteAll?: () => void;
  onDeleteSelected?: () => void;
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
  playingAudioId,
  selectedAudios = [],
  onToggleSelectAudio,
  onSelectAllAudios,
  onClearSelection,
  onPlayAudio,
  onTranscribeAudio,
  onEditTranscript,
  onDeleteAudio,
  onTranscribeAll,
  onTranscribeSelected,
  onDeleteAll,
  onDeleteSelected,
  isTranscribingAll = false,
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
}: AudioListProps) {
  // Nombre de fichiers non transcrits parmi tous les fichiers
  const pendingCount = audios.filter((a) => ["uploaded", "error"].includes(a.status)).length;

  // Nombre de fichiers non transcrits parmi la sélection
  const selectedPendingCount = audios.filter(
    (a) => selectedAudios.includes(a.id) && ["uploaded", "error"].includes(a.status)
  ).length;

  const isAllSelected = audios.length > 0 && audios.every((a) => selectedAudios.includes(a.id));
  const hasSelection = selectedAudios.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* En-tête de la liste avec actions groupées */}
      <div className="p-3.5 sm:p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
        {/* Côté gauche : Master Checkbox + Titre + Compteur */}
        <div className="flex items-center gap-2.5">
          {onSelectAllAudios && audios.length > 0 && (
            <button
              type="button"
              onClick={() => onSelectAllAudios(!isAllSelected)}
              className="text-gray-500 hover:text-gray-900 transition-colors"
              title={isAllSelected ? "Tout désélectionner" : "Tout sélectionner"}
            >
              {isAllSelected ? (
                <CheckSquare size={16} className="text-blue-600" />
              ) : (
                <Square size={16} />
              )}
            </button>
          )}

          <h3 className="text-sm font-semibold text-gray-900">Fichiers Audio</h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
            {allAudiosCount}
          </span>

          {hasSelection && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              {selectedAudios.length} sélectionné(s)
            </span>
          )}
        </div>

        {/* Côté droit : Boutons d'actions (Selon qu'une sélection est active ou non) */}
        <div className="flex items-center gap-2 flex-wrap">
          {hasSelection ? (
            /* ACTIONS SUR LA SÉLECTION */
            <>
              {/* Transcrire la sélection */}
              {onTranscribeSelected && (
                <Button
                  size="xs"
                  variant="primary"
                  onClick={onTranscribeSelected}
                  disabled={isTranscribingAll || selectedPendingCount === 0}
                  isLoading={isTranscribingAll}
                  leftIcon={<PlayCircle size={13} />}
                  title={
                    selectedPendingCount === 0
                      ? "Tous les fichiers sélectionnés sont déjà transcrits"
                      : `Transcrire les ${selectedPendingCount} fichier(s) sélectionné(s) non transcrits`
                  }
                >
                  Transcrire la sélection ({selectedPendingCount})
                </Button>
              )}

              {/* Supprimer la sélection */}
              {onDeleteSelected && (
                <button
                  type="button"
                  onClick={onDeleteSelected}
                  className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                  title="Supprimer les fichiers sélectionnés"
                >
                  <Trash2 size={13} />
                  <span>Supprimer ({selectedAudios.length})</span>
                </button>
              )}

              {/* Annuler la sélection */}
              {onClearSelection && (
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg transition-colors"
                  title="Désélectionner tout"
                >
                  <X size={15} />
                </button>
              )}
            </>
          ) : (
            /* ACTIONS GLOBALES (TOUT TRANSCRIRE / TOUT SUPPRIMER) */
            <>
              {/* Tout transcrire (sauf ceux déjà transcrits) */}
              {onTranscribeAll && pendingCount > 0 && (
                <button
                  type="button"
                  onClick={onTranscribeAll}
                  disabled={isTranscribingAll}
                  className="bg-gray-900 text-white hover:bg-gray-800 text-xs font-medium px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-2xs"
                  title={`Lance la transcription des ${pendingCount} fichier(s) non encore transcrits`}
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

              {/* Tout supprimer */}
              {onDeleteAll && audios.length > 0 && (
                <button
                  type="button"
                  onClick={onDeleteAll}
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50 text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                  title="Supprimer tous les fichiers audio du projet"
                >
                  <Trash2 size={13} />
                  <span className="hidden sm:inline">Tout supprimer</span>
                </button>
              )}
            </>
          )}
        </div>
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
              isPlaying={playingAudioId === audio.id}
              isSelected={selectedAudios.includes(audio.id)}
              onToggleSelect={onToggleSelectAudio}
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
