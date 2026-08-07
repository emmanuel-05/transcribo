"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/services/api";
import { ArrowLeft, Upload, FileAudio, Clock, Play, Pause } from "lucide-react";

interface AudioFile {
  id: string;
  original_filename: string;
  format: string;
  duration_secs: number | null;
  status: string;
  created_at: string;
}

export default function ProjectPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, fetchMe } = useAuthStore();
  const [project, setProject] = useState<any>(null);
  const [audios, setAudios] = useState<AudioFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    if (isAuthenticated && id) {
      loadProject();
      loadAudios();
    }
  }, [isAuthenticated, id]);

  const loadProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data);
    } catch {
      router.push("/dashboard");
    }
  };

  const loadAudios = async () => {
    try {
      const res = await api.get(`/projects/${id}/audios`);
      setAudios(res.data.files);
    } catch (err) {
      console.error("Erreur chargement audios", err);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.post(`/projects/${id}/audios`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await loadAudios();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [id]);

  const handlePlay = async (audioId: string) => {
    if (playingId === audioId) {
      setPlayingId(null);
      setAudioUrl(null);
      return;
    }
    try {
      const res = await api.get(`/projects/${id}/audios/${audioId}/url`);
      setAudioUrl(res.data.url);
      setPlayingId(audioId);
    } catch (err) {
      console.error("Erreur chargement audio", err);
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barre de navigation */}
      <nav className="bg-white shadow-sm p-4 flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-gray-500">{project.description}</p>
          )}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-8">
        {/* Zone d'upload */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          className={`border-2 border-dashed rounded-lg p-12 text-center mb-8 transition-colors ${
            dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
        >
          <Upload size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-2">
            Glissez-déposez un fichier audio ici
          </p>
          <p className="text-gray-400 text-sm mb-4">
            Formats : WAV, MP3, DSS, DS2, FLAC, OGG, M4A, AAC
          </p>
          <label className="bg-blue-600 text-white px-6 py-2 rounded cursor-pointer hover:bg-blue-700 inline-block">
            Parcourir...
            <input
              type="file"
              className="hidden"
              accept=".wav,.mp3,.dss,.ds2,.flac,.ogg,.m4a,.aac"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
          </label>
        </div>

        {/* Indicateur d'upload */}
        {uploading && (
          <div className="bg-blue-50 text-blue-700 p-3 rounded mb-4">
            Upload en cours...
          </div>
        )}

        {/* Liste des fichiers */}
        <h2 className="text-lg font-semibold mb-4">
          Fichiers audio ({audios.length})
        </h2>

        {audios.length === 0 && !uploading ? (
          <div className="text-center py-12 text-gray-500">
            <FileAudio size={48} className="mx-auto mb-4 opacity-50" />
            <p>Aucun fichier audio pour le moment.</p>
            <p className="text-sm">Uploadez votre premier fichier.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {audios.map((audio) => (
              <div key={audio.id} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <FileAudio size={24} className="text-blue-500" />
                    <div>
                      <p className="font-medium">{audio.original_filename}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>.{audio.format}</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />{" "}
                          {new Date(audio.created_at).toLocaleString("fr-FR")}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            audio.status === "uploaded"
                              ? "bg-yellow-100 text-yellow-700"
                              : audio.status === "transcribed"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {audio.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePlay(audio.id)}
                    className="p-2 hover:bg-gray-100 rounded"
                    title={playingId === audio.id ? "Arrêter" : "Écouter"}
                  >
                    {playingId === audio.id ? (
                      <Pause size={20} className="text-blue-600" />
                    ) : (
                      <Play size={20} className="text-blue-600" />
                    )}
                  </button>
                </div>
                {playingId === audio.id && audioUrl && (
                  <div className="mt-3">
                    <audio controls autoPlay className="w-full" src={audioUrl}>
                      Votre navigateur ne supporte pas l'élément audio.
                    </audio>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}