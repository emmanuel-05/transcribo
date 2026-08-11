import React, { useRef, useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";

interface AudioPlayerProps {
  url: string;
  onTimeUpdate?: (currentTime: number) => void;
  title?: string;
  externalTime?: number;
}

export default function AudioPlayer({ url, onTimeUpdate, title, externalTime }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Sync with external time clicks
  useEffect(() => {
    if (externalTime !== undefined && audioRef.current) {
      audioRef.current.currentTime = externalTime;
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  }, [externalTime]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

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

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRate = parseFloat(e.target.value);
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
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
    <div className="bg-white border border-gray-200 rounded p-4 mb-6 shadow-sm">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      {title && <p className="text-sm font-medium text-gray-800 mb-2">{title}</p>}
      
      <div className="mb-3">
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          onChange={handleSeek}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-600 focus:outline-none"
          title="Avancer / Reculer"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="text-gray-600 hover:text-gray-900 transition-colors focus:outline-none"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <div className="text-xs text-gray-500 font-mono tracking-wider">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="speed-select" className="text-xs text-gray-500 hidden sm:block">Vitesse :</label>
          <select
            id="speed-select"
            value={playbackRate}
            onChange={handleSpeedChange}
            className="text-xs text-gray-600 bg-transparent border border-gray-200 rounded px-1 py-0.5 focus:outline-none cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="1.75">1.75x</option>
            <option value="2">2x</option>
          </select>
        </div>
      </div>
    </div>
  );
}
