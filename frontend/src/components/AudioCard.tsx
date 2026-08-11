import React from "react";
import { FileAudio, Download, Play, Trash2, Edit3, Loader2 } from "lucide-react";

interface AudioFile {
  id: string;
  original_filename: string;
  format: string;
  status: string;
  created_at: string;
}

interface AudioCardProps {
  audio: AudioFile;
  isActive: boolean;
  onPlay: (audio: AudioFile) => void;
  onTranscribe: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isTranscribing?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string, checked: boolean) => void;
}

export default function AudioCard({
  audio,
  isActive,
  onPlay,
  onTranscribe,
  onEdit,
  onDelete,
  isTranscribing = false,
  isSelected = false,
  onToggleSelect
}: AudioCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "uploaded":
        return <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded text-xs">À transcrire</span>;
      case "transcribing":
      case "correcting":
        return (
          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs flex items-center gap-1">
            <Loader2 size={12} className="animate-spin" /> En cours...
          </span>
        );
      case "transcribed":
      case "corrected":
        return <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-medium">Terminé</span>;
      case "error":
        return <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-xs">Erreur</span>;
      default:
        return <span className="bg-gray-50 text-gray-700 px-2 py-0.5 rounded text-xs">{status}</span>;
    }
  };

  return (
    <div className={`border-b border-gray-100 last:border-b-0 py-2 px-4 flex items-center justify-between gap-4 transition-colors ${isActive ? "bg-gray-50" : "bg-white hover:bg-gray-50"}`}>
      <div className="flex items-center gap-3 overflow-hidden flex-1">
        {onToggleSelect && (
          <input 
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onToggleSelect(audio.id, e.target.checked)}
            className="rounded border-gray-300 text-gray-800 focus:ring-gray-400 shrink-0 cursor-pointer"
          />
        )}
        <div className="text-gray-400 shrink-0">
          <FileAudio size={16} />
        </div>
        <div className="flex items-center gap-3 truncate w-full">
          <span className="font-medium text-gray-900 text-sm truncate max-w-[200px]" title={audio.original_filename}>{audio.original_filename}</span>
          <span className="text-xs text-gray-400 uppercase shrink-0">{audio.format}</span>
          <span className="text-xs text-gray-400 shrink-0">
            {new Date(audio.created_at).toLocaleDateString("fr-FR")}
          </span>
          <div className="shrink-0">
            {getStatusBadge(audio.status)}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-1 shrink-0">
        {["uploaded", "error"].includes(audio.status) && (
          <button
            onClick={() => onTranscribe(audio.id)}
            disabled={isTranscribing}
            className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Lancer la transcription"
          >
            Transcrire
          </button>
        )}

        {["transcribed", "corrected"].includes(audio.status) && (
          <button
            onClick={() => onEdit(audio.id)}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            title="Éditer la transcription"
          >
            <Edit3 size={16} />
          </button>
        )}

        <button
          onClick={() => onPlay(audio)}
          className={`p-1.5 rounded transition-colors ${isActive ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}`}
          title="Écouter l'audio"
        >
          <Play size={16} />
        </button>

        <button
          onClick={() => onDelete(audio.id)}
          className="p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
          title="Supprimer"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
