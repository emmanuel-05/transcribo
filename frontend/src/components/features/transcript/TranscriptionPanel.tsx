"use client";

import React, { useState, useEffect, useRef, memo, useMemo } from "react";
import {
  FileAudio,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  ChevronDown,
  ChevronRight,
  History,
  FileText,
  X,
  Loader2,
  Check,
  Save,
} from "lucide-react";
import { TranscriptData, TranscriptSegment } from "@/types/transcript";
import { Button } from "@/components/ui/Button";
import { formatSecondsToTime } from "@/utils/formatters";

// Composant de segment individuel mémoïsé pour la synchronisation fluide audio-texte
interface SegmentItemProps {
  segment: TranscriptSegment;
  isActive: boolean;
  onClick: (start: number) => void;
}

const SegmentItem = memo(function SegmentItem({
  segment,
  isActive,
  onClick,
}: SegmentItemProps) {
  return (
    <span
      onClick={() => onClick(segment.start)}
      className={`cursor-pointer transition-colors px-1.5 py-0.5 rounded leading-relaxed inline text-xs sm:text-sm ${
        isActive
          ? "bg-blue-100 text-blue-900 font-semibold ring-1 ring-blue-300"
          : "hover:bg-gray-100 text-gray-800"
      }`}
      title={`Cliquer pour écouter à ${formatSecondsToTime(segment.start)}`}
    >
      {segment.text}{" "}
    </span>
  );
});

export interface TranscriptionPanelProps {
  transcript: TranscriptData;
  audioFilename: string;
  audioStreamUrl?: string;
  externalTime?: number;
  activeSegmentId: number | null;
  glossaryTerms?: string[];
  isCorrecting?: boolean;
  onTimeUpdate?: (currentTime: number) => void;
  onSegmentClick: (start: number) => void;
  onValidateRaw: (rawText: string) => Promise<void>;
  onSaveTranscript: (correctedText: string) => Promise<void>;
  onCorrectTranscript: () => Promise<void>;
  onShowHistory: () => void;
  onGenerateDoc: () => void;
  onClose?: () => void;
}

export function TranscriptionPanel({
  transcript,
  audioFilename,
  audioStreamUrl,
  externalTime,
  activeSegmentId,
  glossaryTerms = [],
  isCorrecting = false,
  onTimeUpdate,
  onSegmentClick,
  onValidateRaw,
  onSaveTranscript,
  onCorrectTranscript,
  onShowHistory,
  onGenerateDoc,
  onClose,
}: TranscriptionPanelProps) {
  // 1. État de repli (Accordéon)
  const [isOpen, setIsOpen] = useState(true);

  // 2. État du lecteur audio intégré (thème clair)
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // 3. État du texte dans la zone d'édition
  const initialText = useMemo(() => {
    return transcript.corrected_text || transcript.raw_text || "";
  }, [transcript]);

  const [textValue, setTextValue] = useState(initialText);
  const [isValidating, setIsValidating] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [hasJustValidated, setHasJustValidated] = useState(false);

  // Synchronisation lors de mises à jour extérieures (restauration version, nouvelle transcription)
  useEffect(() => {
    setTextValue(transcript.corrected_text || transcript.raw_text || "");
  }, [transcript]);

  // Synchronisation temporelle audio sur clic segment
  useEffect(() => {
    if (externalTime !== undefined && audioRef.current) {
      audioRef.current.currentTime = externalTime;
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  }, [externalTime]);

  // Détection du statut réel
  const isLLMCorrected = transcript.status === "corrected" || Boolean(transcript.corrected_text);
  const isValidated =
    transcript.status === "validated" || isLLMCorrected || hasJustValidated;
  const isDirty = textValue !== initialText;

  // Calculs métadonnées en direct
  const wordCount = useMemo(() => {
    const trimmed = textValue.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [textValue]);

  const charCount = textValue.length;
  const activeGlossaryCount = glossaryTerms.filter((t) => Boolean(t.trim())).length;
  const segments = transcript.raw_json?.segments || [];

  // Contrôles lecteur audio
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      setCurrentTime(current);
      if (duration > 0) {
        setProgress((current / duration) * 100);
      }
      if (onTimeUpdate) {
        onTimeUpdate(current);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current && duration > 0) {
      const newTime = (parseFloat(e.target.value) / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress(parseFloat(e.target.value));
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      if (duration > 0) {
        setProgress((newTime / duration) * 100);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  // Action : Valider la transcription brute
  const handleValidateRaw = async () => {
    setIsValidating(true);
    try {
      await onValidateRaw(textValue);
      setHasJustValidated(true);
    } finally {
      setIsValidating(false);
    }
  };

  // Action : Enregistrer une modification manuelle (post-validation ou post-IA)
  const handleSaveManualEdit = async () => {
    setIsSavingEdit(true);
    try {
      await onSaveTranscript(textValue);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Action : Déclencher la correction LLM
  const handleTriggerLLM = async () => {
    if (!isValidated) return;
    if (isDirty) {
      if (isLLMCorrected) {
        await handleSaveManualEdit();
      } else {
        await handleValidateRaw();
      }
    }
    await onCorrectTranscript();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8 transition-all">
      {/* 1. EN-TÊTE ACCORDÉON SOBRE ET CLAIR (REPLIABLE) */}
      <div className="px-5 py-3.5 bg-gray-50/80 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 select-none">
        {/* Clic pour déplier/replier tout le bloc */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 cursor-pointer group flex-1 min-w-[240px]"
        >
          <div className="text-gray-500 group-hover:text-gray-900 transition-colors">
            {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>

          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileAudio size={16} />
          </div>

          <div className="truncate">
            {/* Métadonnées simples */}
            <div className="flex items-center gap-3 text-xs text-gray-500 font-mono mt-0.5">
              <span>{wordCount} mots</span>
              <span>•</span>
              <span>{charCount} car.</span>
              {activeGlossaryCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-purple-600 font-medium">
                    {activeGlossaryCount} terme(s) glossaire
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Boutons d'action dans l'en-tête (Historique, DOCX, Fermer) */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="xs"
            variant="outline"
            onClick={onShowHistory}
            leftIcon={<History size={13} />}
          >
            Historique
          </Button>

          <Button
            size="xs"
            variant="outline"
            onClick={onGenerateDoc}
            leftIcon={<FileText size={13} />}
          >
            Exporter DOCX
          </Button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg transition-colors ml-1"
              title="Fermer la session d'édition"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 2. CONTENU DU BLOC UNIQUE (REPLIABLE) */}
      {isOpen && (
        <div className="flex flex-col">
          {/* LECTEUR AUDIO INTÉGRÉ AU FORMAT CLAIR ET SOBRE (si URL disponible) */}
          {audioStreamUrl && (
            <div className="p-3 sm:p-4 bg-white border-b border-gray-100 flex flex-col gap-2.5">
              <audio
                ref={audioRef}
                src={audioStreamUrl}
                onTimeUpdate={handleAudioTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                  <Volume2 size={14} className="text-blue-600" />
                  <span>Lecteur audio</span>
                </div>
                <div className="text-xs font-mono text-gray-500">
                  {formatSecondsToTime(currentTime)} / {formatSecondsToTime(duration)}
                </div>
              </div>

              {/* Barre de progression claire */}
              <div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={progress}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                  title="Positionner la lecture"
                />
              </div>

              {/* Contrôles lecteur clairs */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSkip(-5)}
                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-xs flex items-center gap-0.5"
                    title="Reculer de 5 secondes"
                  >
                    <RotateCcw size={13} />
                    <span className="text-[10px]">-5s</span>
                  </button>

                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white flex items-center justify-center transition-colors shadow-2xs focus:outline-none"
                    title={isPlaying ? "Pause" : "Lecture"}
                  >
                    {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSkip(5)}
                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-xs flex items-center gap-0.5"
                    title="Avancer de 5 secondes"
                  >
                    <FastForward size={13} />
                    <span className="text-[10px]">+5s</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 hidden sm:inline">Vitesse :</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.1"
                    value={playbackRate}
                    onChange={(e) => {
                      const newRate = parseFloat(e.target.value);
                      setPlaybackRate(newRate);
                      if (audioRef.current) audioRef.current.playbackRate = newRate;
                    }}
                    className="w-16 sm:w-20 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                    title="Vitesse de lecture"
                  />
                  <span className="text-xs text-gray-600 font-mono font-medium min-w-[2rem] text-right">
                    {playbackRate.toFixed(1)}x
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* DISPOSITION CÔTE-À-CÔTE (2 COLONNES) : GAUCHE (Segments synchronisés) / DROITE (Zone d'édition) */}
          <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 bg-gray-50/30">
            {/* COLONNE GAUCHE (5/12) : TEXTE SYNCHRONISÉ */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 size={13} className="text-blue-600" />
                  <span>Texte synchronisé</span>
                </h4>
              </div>

              <div className="w-full h-80 p-3.5 border border-gray-200 rounded-xl overflow-y-auto bg-white text-gray-800 text-xs sm:text-sm leading-relaxed shadow-2xs scroll-smooth">
                {segments.length === 0 ? (
                  <p className="whitespace-pre-wrap text-gray-600">
                    {transcript.raw_text || "Aucun texte brut disponible."}
                  </p>
                ) : (
                  segments.map((seg, idx) => (
                    <SegmentItem
                      key={seg.id ?? idx}
                      segment={seg}
                      isActive={activeSegmentId === seg.id}
                      onClick={onSegmentClick}
                    />
                  ))
                )}
              </div>
            </div>

            {/* COLONNE DROITE (7/12) : ZONE D'ÉDITION DU TEXTE & ACTIONS */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Zone d'édition
                  </h4>

                  {isLLMCorrected ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-gray-500 "> Corrigé IA</span>
                  ) : isValidated ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={10} /> Validé
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertCircle size={10} /> Édition brute
                    </span>
                  )}

                  {isDirty && (
                    <span className="text-[10px] text-amber-600 italic">
                      (modifications non validées)
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-gray-400 font-mono">
                  {wordCount} mots | {charCount} car.
                </div>
              </div>

              {/* Textarea d'édition */}
              <div className="relative flex-1">
                <textarea
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  placeholder="Éditez librement la transcription ici..."
                  className="w-full h-80 p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white text-gray-900 text-xs sm:text-sm leading-relaxed resize-none shadow-2xs font-sans transition-all"
                />
              </div>

              {/* Barre d'actions claire sous l'éditeur */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 ">
                {/* Côté gauche : Sauvegarde retouches manuelles */}
                <div>
                  {isLLMCorrected && isDirty ? (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={handleSaveManualEdit}
                      isLoading={isSavingEdit}
                      leftIcon={<Save size={12} />}
                    >
                      Enregistrer retouches
                    </Button>
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">
                      {isValidated
                        ? "Transcription validée "
                        : "Validez la transcription brute pour activer l'IA"}
                    </span>
                  )}
                </div>

                {/* Côté droit : Les 2 boutons du workflow */}
                <div className="flex items-center gap-2">
                  {/* Bouton 1 : Valider la transcription brute */}
                  <Button
                    size="xs"
                    variant={isValidated && !isDirty ? "outline" : "primary"}
                    onClick={handleValidateRaw}
                    isLoading={isValidating}
                    disabled={isValidating || isCorrecting}
                    leftIcon={isValidated && !isDirty ? <Check size={13} className="text-emerald-600" /> : <CheckCircle2 size={13} />}
                    className={isValidated && !isDirty ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100" : ""}
                  >
                    {isValidated && !isDirty
                      ? "Validée"
                      : isDirty
                      ? "Valider modifications"
                      : "Valider la transcription brute"}
                  </Button>

                  {/* Bouton 2 : Corriger avec l'IA (LLM) */}
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={handleTriggerLLM}
                    isLoading={isCorrecting}
                    disabled={!isValidated || isCorrecting || isValidating}
                    className={`font-medium transition-all ${
                      isValidated
                        ? "bg-gray-500 text-white hover:bg-gray-600 shadow-2xs"
                        : "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200"
                    }`}
                    title={
                      isValidated
                        ? "Corriger avec le LLM et le glossaire"
                        : "Validez d'abord la transcription brute"
                    }
                  >
                    {isCorrecting ? (
                      <>
                        <Loader2 size={12} className="animate-spin mr-1" />
                        Correction en cours...
                      </>
                    ) : (
                      `Corriger IA${activeGlossaryCount > 0 ? ` (${activeGlossaryCount})` : ""}`
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
