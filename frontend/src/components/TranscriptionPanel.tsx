import React, { useState, useEffect } from "react";
import { Loader2, ChevronDown, ChevronRight, Edit3, X, Check } from "lucide-react";
import api from "@/services/api";

interface Segment {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface TranscriptData {
  id: string;
  raw_text: string;
  corrected_text?: string;
  status: string;
  segments: Segment[];
}

interface TranscriptionPanelProps {
  projectId: string;
  audioId: string;
  transcript: TranscriptData;
  onSegmentClick: (start: number) => void;
  activeSegmentId: number | null;
  onTranscriptUpdate: (newTranscript: TranscriptData) => void;
}

export default function TranscriptionPanel({
  projectId,
  audioId,
  transcript,
  onSegmentClick,
  activeSegmentId,
  onTranscriptUpdate,
}: TranscriptionPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Raw Text State
  const [rawText, setRawText] = useState(transcript.raw_text || "");
  const [isEditingRaw, setIsEditingRaw] = useState(false);
  const [isSavingRaw, setIsSavingRaw] = useState(false);

  // Corrected Text State
  const [correctedText, setCorrectedText] = useState(transcript.corrected_text || "");
  const [isEditingCorrected, setIsEditingCorrected] = useState(false);
  const [isSavingCorrected, setIsSavingCorrected] = useState(false);

  const [isCorrectingAI, setIsCorrectingAI] = useState(false);

  useEffect(() => {
    setRawText(transcript.raw_text || "");
    setCorrectedText(transcript.corrected_text || "");
  }, [transcript]);

  const handleSaveRaw = async () => {
    setIsSavingRaw(true);
    try {
      await api.put(`/projects/${projectId}/audios/${audioId}/transcript/save-raw`, {
        raw_text: rawText,
      });
      onTranscriptUpdate({ ...transcript, raw_text: rawText });
      setIsEditingRaw(false);
    } catch (err) {
      console.error("Erreur save raw", err);
    } finally {
      setIsSavingRaw(false);
    }
  };

  const handleSaveCorrected = async () => {
    setIsSavingCorrected(true);
    try {
      await api.put(`/projects/${projectId}/audios/${audioId}/transcript/save`, {
        corrected_text: correctedText,
      });
      onTranscriptUpdate({ ...transcript, corrected_text: correctedText, status: "corrected" });
      setIsEditingCorrected(false);
    } catch (err) {
      console.error("Erreur save corrected", err);
    } finally {
      setIsSavingCorrected(false);
    }
  };

  const handleCorrectAI = async () => {
    setIsCorrectingAI(true);
    try {
      const res = await api.post(`/projects/${projectId}/audios/${audioId}/correct`);
      onTranscriptUpdate(res.data);
      setCorrectedText(res.data.corrected_text);
    } catch (err) {
      console.error("Erreur correction IA", err);
    } finally {
      setIsCorrectingAI(false);
    }
  };

  const renderRawContent = () => {
    if (isEditingRaw) {
      return (
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          className="w-full h-48 p-3 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white text-gray-800 text-sm leading-relaxed resize-none"
        />
      );
    }

    if (!transcript.segments || transcript.segments.length === 0) {
      return (
        <div className="w-full h-48 p-3 border border-gray-200 rounded overflow-y-auto bg-gray-50 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
          {rawText}
        </div>
      );
    }

    return (
      <div className="w-full h-48 p-3 border border-gray-200 rounded overflow-y-auto bg-gray-50 text-gray-800 text-sm leading-relaxed">
        {transcript.segments.map((seg) => (
          <span
            key={seg.id}
            onClick={() => onSegmentClick(seg.start)}
            className={`cursor-pointer transition-colors px-1 rounded ${
              activeSegmentId === seg.id ? "bg-gray-200 font-medium" : "hover:bg-gray-100"
            }`}
          >
            {seg.text}{" "}
          </span>
        ))}
      </div>
    );
  };

  const renderCorrectedContent = () => {
    if (isEditingCorrected) {
      return (
        <textarea
          value={correctedText}
          onChange={(e) => setCorrectedText(e.target.value)}
          placeholder="Modifiez la transcription ici..."
          className="w-full h-48 p-3 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white text-gray-800 text-sm leading-relaxed resize-none"
        />
      );
    }

    return (
      <div className="w-full h-48 p-3 border border-gray-200 rounded overflow-y-auto bg-gray-50 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
        {correctedText || <span className="text-gray-400 italic">Aucune correction pour le moment...</span>}
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden mb-6">
      {/* En-tête Accordéon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between text-gray-900 font-medium hover:bg-gray-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          {isOpen ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronRight size={18} className="text-gray-500" />}
          Transcription
        </span>
      </button>

      {/* Contenu Accordéon */}
      {isOpen && (
        <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-6 border-t border-gray-200">
          {/* Colonne Brute */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Texte brut (source)</h3>
              {!isEditingRaw ? (
                <button
                  onClick={() => setIsEditingRaw(true)}
                  className="py-1 px-2 text-xs rounded bg-transparent hover:bg-gray-100 text-gray-600 transition-colors flex items-center gap-1"
                >
                  <Edit3 size={12} /> Modifier
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditingRaw(false);
                      setRawText(transcript.raw_text);
                    }}
                    className="py-1 px-2 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1"
                  >
                    <X size={12} /> Annuler
                  </button>
                  <button
                    onClick={handleSaveRaw}
                    disabled={isSavingRaw}
                    className="py-1 px-2 text-xs rounded bg-gray-800 text-white hover:bg-gray-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    {isSavingRaw ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Sauvegarder
                  </button>
                </div>
              )}
            </div>
            
            {renderRawContent()}
          </div>

          {/* Colonne Corrigée */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Texte corrigé</h3>
              {!isEditingCorrected ? (
                <div className="flex items-center gap-2">
                  {["raw", "uploaded", "transcribed"].includes(transcript.status) && (
                    <button
                      onClick={handleCorrectAI}
                      disabled={isCorrectingAI || transcript.status === "correcting"}
                      className="py-1 px-2 text-xs rounded bg-gray-800 text-white hover:bg-gray-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {isCorrectingAI || transcript.status === "correcting" ? <Loader2 size={12} className="animate-spin" /> : null}
                      Corriger avec IA
                    </button>
                  )}
                  <button
                    onClick={() => setIsEditingCorrected(true)}
                    className="py-1 px-2 text-xs rounded bg-transparent hover:bg-gray-100 text-gray-600 transition-colors flex items-center gap-1"
                  >
                    <Edit3 size={12} /> Modifier
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditingCorrected(false);
                      setCorrectedText(transcript.corrected_text || "");
                    }}
                    className="py-1 px-2 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1"
                  >
                    <X size={12} /> Annuler
                  </button>
                  <button
                    onClick={handleSaveCorrected}
                    disabled={isSavingCorrected}
                    className="py-1 px-2 text-xs rounded bg-gray-800 text-white hover:bg-gray-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    {isSavingCorrected ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Sauvegarder
                  </button>
                </div>
              )}
            </div>
            
            {renderCorrectedContent()}
          </div>
        </div>
      )}
    </div>
  );
}
