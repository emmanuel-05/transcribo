"use client";

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, X, RotateCcw, FastForward } from "lucide-react";
import { formatSecondsToTime } from "@/utils/formatters";

export interface AudioPlayerProps {
  url: string;
  onTimeUpdate?: (currentTime: number) => void;
  title?: string;
  externalTime?: number;
  onClose?: () => void;
}

export function AudioPlayer({
  url,
  onTimeUpdate,
  title,
  externalTime,
  onClose,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Synchronisation avec les clics sur les segments de transcription
  useEffect(() => {
    if (externalTime !== undefined && audioRef.current) {
      audioRef.current.currentTime = externalTime;
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  }, [externalTime]);

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

  const handleTimeUpdate = () => {
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

  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  }, [url]);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl z-50 bg-white/95 backdrop-blur-md text-gray-900 border border-gray-200 rounded-2xl p-3.5 sm:p-4 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="flex items-center justify-between mb-2 gap-3">
        <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate max-w-md">
          {title || "Lecture audio"}
        </p>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-gray-500 tracking-wider">
            {formatSecondsToTime(currentTime)} / {formatSecondsToTime(duration)}
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Fermer le lecteur"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="mb-2.5">
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

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
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
            className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white flex items-center justify-center transition-transform hover:scale-105 shadow-xs focus:outline-none"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
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
            className="w-16 sm:w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
            title="Vitesse de lecture"
          />
          <span className="text-xs text-gray-700 font-mono font-medium min-w-[2.2rem] text-right">
            {playbackRate.toFixed(1)}x
          </span>
        </div>
      </div>
    </div>
  );
}
