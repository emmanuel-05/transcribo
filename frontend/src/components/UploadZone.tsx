import React, { useCallback } from "react";
import { Upload } from "lucide-react";

interface UploadZoneProps {
  onUpload: (file: File) => void;
  uploading: boolean;
  uploadProgress: number;
}

export default function UploadZone({ onUpload, uploading, uploadProgress }: UploadZoneProps) {
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onUpload(e.dataTransfer.files[0]);
      }
    },
    [onUpload]
  );

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`border-2 border-dashed border-gray-300 rounded p-8 text-center transition-colors
        ${uploading ? "opacity-50 pointer-events-none" : "hover:bg-gray-50 bg-white"}`}
    >
      <Upload size={32} className="mx-auto mb-3 text-gray-400" />
      <p className="text-gray-600 mb-2 font-medium">Glissez un fichier audio ici</p>
      <p className="text-sm text-gray-500 mb-4">WAV, MP3, M4A, OGG, DSS, DS2 (Max 70 Mo)</p>
      
      <label className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 cursor-pointer transition-colors inline-block">
        Parcourir
        <input
          type="file"
          accept=".wav,.mp3,.dss,.ds2,.flac,.ogg,.m4a,.aac"
          className="hidden"
          onChange={(e) => e.target.files && onUpload(e.target.files[0])}
          disabled={uploading}
        />
      </label>

      {uploading && (
        <div className="mt-6 max-w-md mx-auto">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Envoi en cours...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-gray-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
