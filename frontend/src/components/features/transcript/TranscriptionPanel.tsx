"use client";

import React, { useState, useEffect } from "react";
import { Loader2, ChevronDown, ChevronRight, Edit3, X, Check, Sparkles } from "lucide-react";
import { TranscriptData } from "@/types/transcript";
import { Button } from "@/components/ui/Button";

export interface TranscriptionPanelProps {
  transcript: TranscriptData;
  audioFilename: string;
  activeSegmentId: number | null;
  onSegmentClick: (start: number) => void;
  onSaveTranscript: (correctedText: string) => Promise<void>;
  onShowHistory: () => void;
  onGenerateDoc: () => void;
}

export function TranscriptionPanel({
  transcript,
  audioFilename,
  activeSegmentId,
  onSegmentClick,
  onSaveTranscript,
  onShowHistory,
  onGenerateDoc,
}: TranscriptionPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Corrected text edit state
  const [correctedText, setCorrectedText] = useState(
    transcript.corrected_text || transcript.raw_text || ""
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCorrectedText(transcript.corrected_text || transcript.raw_text || "");
  }, [transcript]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveTranscript(correctedText);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const segments = transcript.raw_json?.segments || [];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      {/* En-tête Accordéon */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 sm:px-5 py-3 bg-gray-50/80 flex items-center justify-between text-gray-900 font-semibold hover:bg-gray-100/80 transition-colors border-b border-gray-200"
      >
        <span className="flex items-center gap-2 text-xs sm:text-sm truncate">
          {isOpen ? (
            <ChevronDown size={17} className="text-gray-500 shrink-0" />
          ) : (
            <ChevronRight size={17} className="text-gray-500 shrink-0" />
          )}
          <span className="text-gray-500 uppercase font-mono text-xs">Édition :</span>
          <span className="truncate">{audioFilename}</span>
        </span>
      </button>

      {isOpen && (
        <div className="flex flex-col">
          {/* Barre d'outils */}
          <div className="p-3.5 sm:p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-2">
              <Button size="xs" variant="outline" onClick={onShowHistory}>
                Historique
              </Button>
              <Button size="xs" variant="outline" onClick={onGenerateDoc}>
                Générer DOCX
              </Button>
            </div>
          </div>

          {/* Zone d'édition / Affichage côte-à-côte */}
          <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-5 bg-gray-50/40">
            {/* Colonne 1 : Segments interactifs (Source) */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Texte synchronisé (cliquer pour écouter)
                </h4>
              </div>

              <div className="w-full h-56 p-3.5 border border-gray-200 rounded-xl overflow-y-auto bg-white text-gray-800 text-xs sm:text-sm leading-relaxed shadow-2xs">
                {segments.length === 0 ? (
                  <p className="whitespace-pre-wrap">{transcript.raw_text || "Aucun texte brut."}</p>
                ) : (
                  segments.map((seg, idx) => (
                    <span
                      key={seg.id ?? idx}
                      onClick={() => onSegmentClick(seg.start)}
                      className={`cursor-pointer transition-colors px-1 py-0.5 rounded leading-relaxed inline ${
                        activeSegmentId === seg.id
                          ? "bg-blue-100 text-blue-900 font-semibold"
                          : "hover:bg-gray-100 text-gray-800"
                      }`}
                      title={`Aller à ${Math.floor(seg.start)}s`}
                    >
                      {seg.text}{" "}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Colonne 2 : Texte corrigé (Éditeur) */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Texte corrigé (Export)
                </h4>

                {!isEditing ? (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    leftIcon={<Edit3 size={12} />}
                  >
                    Modifier
                  </Button>
                ) : (
                  <div className="flex gap-1.5">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setCorrectedText(transcript.corrected_text || transcript.raw_text || "");
                      }}
                      leftIcon={<X size={12} />}
                    >
                      Annuler
                    </Button>
                    <Button
                      size="xs"
                      variant="primary"
                      onClick={handleSave}
                      isLoading={isSaving}
                      leftIcon={<Check size={12} />}
                    >
                      Sauvegarder
                    </Button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <textarea
                  value={correctedText}
                  onChange={(e) => setCorrectedText(e.target.value)}
                  placeholder="Modifiez la transcription ici..."
                  className="w-full h-56 p-3.5 border border-gray-300 rounded-xl focus:ring-1 focus:ring-gray-400 outline-none bg-white text-gray-900 text-xs sm:text-sm leading-relaxed resize-none shadow-2xs"
                />
              ) : (
                <div className="w-full h-56 p-3.5 border border-gray-200 rounded-xl overflow-y-auto bg-white text-gray-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-2xs">
                  {correctedText || (
                    <span className="text-gray-400 italic">Aucune correction pour le moment...</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
