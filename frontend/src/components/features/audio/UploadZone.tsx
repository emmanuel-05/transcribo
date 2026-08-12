"use client";

import React, { useCallback, useState } from "react";
import { Upload, Loader2 } from "lucide-react";

export interface UploadZoneProps {
  onUpload: (files: File[]) => void;
  uploading: boolean;
  uploadProgress: number;
}

export function UploadZone({ onUpload, uploading, uploadProgress }: UploadZoneProps) {
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
      className={`h-full flex flex-col md:flex-row items-center justify-between p-4 border-2 border-dashed rounded-2xl transition-all bg-white/90 backdrop-blur-md shadow-xs ${
        isDragging
          ? "border-blue-500 bg-blue-50/40"
          : "border-gray-300/80 hover:border-gray-400"
      }`}
    >
      <div className="flex items-center gap-3.5 mb-3 md:mb-0">
        <div className="bg-gray-100/80 p-2.5 rounded-xl text-gray-600 flex items-center justify-center shrink-0">
          <Upload size={20} />
        </div>
        <div>
          <p className="text-xs sm:text-sm text-gray-900 font-semibold">
            Glissez vos fichiers audio ici
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Formats : WAV, MP3, M4A, OGG, DSS, FLAC, AAC (Max 70 Mo)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3.5 w-full md:w-auto justify-end">
        {uploading && (
          <div className="flex items-center gap-2 text-xs font-mono text-gray-600">
            <Loader2 size={13} className="animate-spin text-blue-600" />
            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span>{uploadProgress}%</span>
          </div>
        )}

        <label
          className={`cursor-pointer bg-gray-900 text-white px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors shrink-0 shadow-xs ${
            uploading ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          Parcourir
          <input
            type="file"
            className="hidden"
            multiple
            accept=".wav,.mp3,.dss,.ds2,.flac,.m4a,.ogg,.aac"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onUpload(Array.from(e.target.files));
                e.target.value = "";
              }
            }}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}
