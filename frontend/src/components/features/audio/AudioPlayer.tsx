"use client";

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { formatSecondsToTime } from "@/utils/formatters";

export interface AudioPlayerProps {
  url: string;
  onTimeUpdate?: (currentTime: number) => void;
  title?: string;
  externalTime?: number;
}

export function AudioPlayer({
  url,
  onTimeUpdate,
  title,
  externalTime,
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
    <div className="bg-white/95 backdrop-blur-md border border-gray-200/80 rounded-2xl p-4 mb-6 shadow-sm">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {title && <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 truncate">{title}</p>}

      <div className="mb-3">
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          onChange={handleSeek}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
          title="Avancer / Reculer"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center shadow-xs focus:outline-none"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
          </button>
          <div className="text-xs text-gray-500 font-mono tracking-wider">
            {formatSecondsToTime(currentTime)} / {formatSecondsToTime(duration)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="speed-range" className="text-xs text-gray-500 hidden sm:inline">
            Vitesse :
          </label>
          <input
            id="speed-range"
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
            className="w-20 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
            title="Vitesse de lecture"
          />
          <span className="text-xs text-gray-700 font-mono font-medium min-w-[2.5rem] text-right">
            {playbackRate.toFixed(1)}x
          </span>
        </div>
      </div>
    </div>
  );
}
