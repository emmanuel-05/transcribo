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
  onDownload: (id: string, format: string) => void;
  onDelete: (id: string) => void;
  isTranscribing?: boolean;
}

export default function AudioCard({
  audio,
  isActive,
  onPlay,
  onTranscribe,
  onEdit,
  onDownload,
  onDelete,
  isTranscribing = false
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
    <div className={`border rounded p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${isActive ? "border-gray-400 bg-gray-50" : "border-gray-200 bg-white"}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded text-gray-500">
          <FileAudio size={20} />
        </div>
        <div>
          <h3 className="font-medium text-gray-900 text-sm">{audio.original_filename}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500 uppercase">{audio.format}</span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-500">
              {new Date(audio.created_at).toLocaleString("fr-FR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </span>
            <span className="text-gray-300">•</span>
            {getStatusBadge(audio.status)}
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        {["uploaded", "error"].includes(audio.status) && (
          <button
            onClick={() => onTranscribe(audio.id)}
            disabled={isTranscribing}
            className="text-sm px-3 py-1 rounded bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Transcrire
          </button>
        )}

        {["transcribed", "corrected"].includes(audio.status) && (
          <button
            onClick={() => onEdit(audio.id)}
            className="text-sm px-3 py-1 rounded bg-gray-800 text-white hover:bg-gray-700 transition-colors flex items-center gap-1"
          >
            <Edit3 size={14} /> Éditer
          </button>
        )}

        <button
          onClick={() => onPlay(audio)}
          className={`text-sm px-3 py-1 rounded transition-colors flex items-center gap-1 ${isActive ? "bg-gray-200 text-gray-900 font-medium" : "bg-transparent text-gray-600 hover:bg-gray-100 border border-transparent"}`}
        >
          <Play size={14} /> Écouter
        </button>

        <button
          onClick={() => onDownload(audio.id, audio.format)}
          className="text-sm px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded transition-colors"
          title="Télécharger"
        >
          <Download size={16} />
        </button>

        <button
          onClick={() => onDelete(audio.id)}
          className="text-sm px-2 py-1 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
          title="Supprimer"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
