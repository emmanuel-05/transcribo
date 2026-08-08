"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/services/api";
import {
  ArrowLeft, Upload, FileAudio, Clock, Play, Pause,
  Trash2, Mic, FileText, Loader2, Sparkles
} from "lucide-react";

interface AudioFile {
  id: string;
  original_filename: string;
  format: string;
  duration_secs: number | null;
  status: string;
  created_at: string;
}

interface TranscriptData {
  id: string;
  raw_text: string;
  corrected_text: string | null;
  status: string;
  segments: any[];
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
  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<Record<string, TranscriptData>>({});
  const [showTranscriptId, setShowTranscriptId] = useState<string | null>(null);

  /* Glossaire */
  const [showGlossary, setShowGlossary] = useState(false);
  const [glossaryTerms, setGlossaryTerms] = useState<string[]>([]);
  const [newTerm, setNewTerm] = useState("");

  const loadGlossary = async () => {
    try {
      const res = await api.get(`/projects/${id}/glossary`);
      setGlossaryTerms(res.data.terms);
    } catch {}
  };

  const addTerm = async () => {
    if (!newTerm.trim()) return;
    const updated = [...glossaryTerms, newTerm.trim()];
    await api.put(`/projects/${id}/glossary`, { terms: updated });
    setGlossaryTerms(updated);
    setNewTerm("");
  };

  const removeTerm = async (term: string) => {
    const updated = glossaryTerms.filter(t => t !== term);
    await api.put(`/projects/${id}/glossary`, { terms: updated });
    setGlossaryTerms(updated);
  };

  useEffect(() => { fetchMe(); }, []);
  useEffect(() => {
    if (isAuthenticated && id) { loadProject(); loadAudios(); }
  }, [isAuthenticated, id]);
  useEffect(() => {
    if (isAuthenticated && id) {
      loadProject();
      loadAudios();
      loadGlossary();
    }
  }, [isAuthenticated, id]);

  const loadProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data);
    } catch { router.push("/dashboard"); }
  };

  const loadAudios = async () => {
    try {
      const res = await api.get(`/projects/${id}/audios`);
      setAudios(res.data.files);
    } catch (err) { console.error("Erreur chargement audios", err); }
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
    } finally { setUploading(false); }
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
    } catch (err) { console.error("Erreur chargement audio", err); }
  };

  const handleDelete = async (audioId: string, filename: string) => {
    if (!confirm(`Supprimer "${filename}" ?`)) return;
    try {
      await api.delete(`/projects/${id}/audios/${audioId}`);
      await loadAudios();
      if (playingId === audioId) { setPlayingId(null); setAudioUrl(null); }
      const newTranscripts = { ...transcripts };
      delete newTranscripts[audioId];
      setTranscripts(newTranscripts);
      if (showTranscriptId === audioId) setShowTranscriptId(null);
    } catch (err: any) { alert(err.response?.data?.detail || "Erreur"); }
  };

  const handleTranscribe = async (audioId: string) => {
    setTranscribingId(audioId);
    try {
      await api.post(`/projects/${id}/audios/${audioId}/transcribe`);
      // Polling : vérifie toutes les 3 secondes
      const poll = setInterval(async () => {
        try {
          const res = await api.get(`/projects/${id}/audios/${audioId}/transcript`);
          if (res.data && res.data.raw_text) {
            setTranscripts(prev => ({ ...prev, [audioId]: res.data }));
            setTranscribingId(null);
            setShowTranscriptId(audioId);
            clearInterval(poll);
            await loadAudios();
          }
        } catch { /* pas encore prêt */ }
      }, 3000);
      // Timeout après 5 minutes
      setTimeout(() => { clearInterval(poll); setTranscribingId(null); }, 300000);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erreur transcription");
      setTranscribingId(null);
    }
  };

  const loadTranscript = async (audioId: string) => {
    try {
      const res = await api.get(`/projects/${id}/audios/${audioId}/transcript`);
      setTranscripts(prev => ({ ...prev, [audioId]: res.data }));
      setShowTranscriptId(audioId);
    } catch { alert("Aucune transcription trouvée"); }
  };

  const handleCorrect = async (audioId: string) => {
    try {
      await api.post(`/projects/${id}/audios/${audioId}/correct`);
      await loadTranscript(audioId);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erreur correction");
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
      <nav className="bg-white shadow-sm p-4 flex items-center gap-4">
        <button onClick={() => router.push("/dashboard")} className="p-2 hover:bg-gray-100 rounded">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold">{project.name}</h1>
          {project.description && <p className="text-sm text-gray-500">{project.description}</p>}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-8">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={`border-2 border-dashed rounded-lg p-12 text-center mb-8 transition-colors ${
            dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
        >
          <Upload size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-2">Glissez-déposez un fichier audio ici</p>
          <p className="text-gray-400 text-sm mb-4">WAV, MP3, DSS, DS2, FLAC, OGG, M4A, AAC</p>
          <label className="bg-blue-600 text-white px-6 py-2 rounded cursor-pointer hover:bg-blue-700 inline-block">
            Parcourir...
            <input type="file" className="hidden" accept=".wav,.mp3,.dss,.ds2,.flac,.ogg,.m4a,.aac"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUpload(file); }} />
          </label>
        </div>

        {uploading && (
          <div className="bg-blue-50 text-blue-700 p-3 rounded mb-4">Upload en cours...</div>
        )}

        <h2 className="text-lg font-semibold mb-4">Fichiers audio ({audios.length})</h2>
        
        {/* Glossaire */}
        <div className="mb-6">
          <button
            onClick={() => setShowGlossary(!showGlossary)}
            className="text-sm text-purple-600 flex items-center gap-2"
          >
            Glossaire métier ({glossaryTerms.length} termes)
          </button>
          {showGlossary && (
            <div className="bg-white border rounded-lg p-4 mt-2">
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTerm()}
                  placeholder="Ajouter un terme..."
                  className="flex-1 border rounded px-3 py-1 text-sm"
                />
                <button onClick={addTerm} className="bg-purple-600 text-white px-3 py-1 rounded text-sm">
                  Ajouter
                </button>
              </div>
              {glossaryTerms.length === 0 ? (
                <p className="text-gray-400 text-sm">Aucun terme. Ajoutez des mots importants (noms propres, termes techniques).</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {glossaryTerms.map((term) => (
                    <span key={term} className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-sm flex items-center gap-1">
                      {term}
                      <button onClick={() => removeTerm(term)} className="hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {audios.length === 0 && !uploading ? (
          <div className="text-center py-12 text-gray-500">
            <FileAudio size={48} className="mx-auto mb-4 opacity-50" />
            <p>Aucun fichier audio pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {audios.map((audio) => (
              <div key={audio.id}>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <FileAudio size={24} className="text-blue-500" />
                      <div>
                        <p className="font-medium">{audio.original_filename}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span>.{audio.format}</span>
                          <Clock size={12} /> {new Date(audio.created_at).toLocaleString("fr-FR")}
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            audio.status === "uploaded" ? "bg-yellow-100 text-yellow-700" :
                            audio.status === "transcribing" ? "bg-blue-100 text-blue-700" :
                            audio.status === "transcribed" ? "bg-green-100 text-green-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>{audio.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Transcrire */}
                      {audio.status !== "transcribed" && (
                        <button onClick={() => handleTranscribe(audio.id)}
                          disabled={transcribingId === audio.id}
                          className="p-2 hover:bg-purple-50 rounded" title="Transcrire">
                          {transcribingId === audio.id
                            ? <Loader2 size={20} className="text-purple-600 animate-spin" />
                            : <Mic size={20} className="text-purple-600" />}
                        </button>
                      )}

                      {/* Voir transcription */}
                      {audio.status === "transcribed" && (
                        <button onClick={() => loadTranscript(audio.id)}
                          className="p-2 hover:bg-green-50 rounded" title="Voir transcription">
                          <FileText size={20} className="text-green-600" />
                        </button>
                      )}
                      {transcripts[audio.id] && transcripts[audio.id].status === "raw" && (
                        <button onClick={() => handleCorrect(audio.id)}
                          className="p-2 hover:bg-orange-50 rounded" title="Corriger avec IA">
                          <Sparkles size={20} className="text-orange-500" />
                        </button>
                      )}

                      {/* Play */}
                      <button onClick={() => handlePlay(audio.id)}
                        className="p-2 hover:bg-gray-100 rounded" title="Écouter">
                        {playingId === audio.id
                          ? <Pause size={20} className="text-blue-600" />
                          : <Play size={20} className="text-blue-600" />}
                      </button>

                      {/* Delete */}
                      <button onClick={() => handleDelete(audio.id, audio.original_filename)}
                        className="p-2 hover:bg-red-50 rounded" title="Supprimer">
                        <Trash2 size={20} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                  {playingId === audio.id && audioUrl && (
                    <div className="mt-3">
                      <audio controls autoPlay className="w-full" src={audioUrl} />
                    </div>
                  )}
                </div>

                {/* Bloc transcription */}
                {showTranscriptId === audio.id && transcripts[audio.id] && (
                  <div className="bg-white border border-green-200 rounded-lg p-4 mt-2">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-green-800 flex items-center gap-2">
                        <FileText size={18} /> Transcription
                      </h3>
                      <button onClick={() => setShowTranscriptId(null)}
                        className="text-gray-400 hover:text-gray-600">✕</button>
                    </div>

                    {/* Deux colonnes : brute vs corrigée */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Version brute */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                          <span className="w-2 h-2 bg-yellow-400 rounded-full"></span> Brute
                        </h4>
                        <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                          {transcripts[audio.id].raw_text || "En attente..."}
                        </div>
                      </div>

                      {/* Version corrigée */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span> Corrigée
                        </h4>
                        <div className="bg-green-50 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                          {transcripts[audio.id].corrected_text ? (
                            transcripts[audio.id].corrected_text
                          ) : (
                            <span className="text-gray-400 italic">Pas encore corrigée</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Segments (optionnel) */}
                    {transcripts[audio.id].segments?.length > 0 && (
                      <details className="mt-3">
                        <summary className="text-sm text-gray-500 cursor-pointer">
                          {transcripts[audio.id].segments.length} segments
                        </summary>
                        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto text-xs text-gray-600">
                          {transcripts[audio.id].segments.map((seg: any, i: number) => (
                            <div key={i} className="flex gap-2">
                              <span className="text-gray-400 w-16">{seg.start?.toFixed(1)}s</span>
                              <span>{seg.text}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
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