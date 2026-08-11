import React, { useCallback, useState } from "react";
import { Upload } from "lucide-react";

interface UploadZoneProps {
  onUpload: (files: File[]) => void;
  uploading: boolean;
  uploadProgress: number;
}

export default function UploadZone({ onUpload, uploading, uploadProgress }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onUpload(Array.from(e.dataTransfer.files));
      }
    },
    [onUpload]
  );

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`h-full flex flex-col md:flex-row items-center justify-between p-4 border-2 border-dashed rounded-lg transition-colors bg-white ${
        isDragging ? "border-gray-500 bg-gray-50" : "border-gray-300 hover:border-gray-400"
      }`}
    >
      <div className="flex items-center gap-4 mb-4 md:mb-0">
        <div className="bg-gray-100 p-2 rounded-full">
          <Upload className="text-gray-500" size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-900 font-medium">Glissez vos fichiers ici</p>
          <p className="text-xs text-gray-500">WAV, MP3, M4A, OGG, DSS, DS2 (Max 70 Mo)</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 w-full md:w-auto justify-end">
        {uploading && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-24 h-2 bg-gray-100 rounded overflow-hidden border border-gray-200">
              <div
                className="h-full bg-gray-600 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            {uploadProgress}%
          </div>
        )}
        <label className={`cursor-pointer bg-gray-800 text-white px-4 py-2 text-sm rounded hover:bg-gray-700 transition-colors shrink-0 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          Parcourir
          <input
            type="file"
            className="hidden"
            multiple
            accept=".wav,.mp3,.dss,.ds2,.flac,.m4a,.ogg,.aac"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onUpload(Array.from(e.target.files));
                e.target.value = '';
              }
            }}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}
