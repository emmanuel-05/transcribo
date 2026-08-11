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

interface TranscriptVersionItem {
  id: string;
  version_number: number;
  source: string;
  content: string;
  created_at: string | null;
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
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<Record<string, TranscriptData>>({});
  const [showTranscriptId, setShowTranscriptId] = useState<string | null>(null);

  /* État pour l'éditeur à deux colonnes */
  const [editRawText, setEditRawText] = useState("");
  const [editCorrectedText, setEditCorrectedText] = useState("");
  const [savingRaw, setSavingRaw] = useState(false);
  const [savingCorrected, setSavingCorrected] = useState(false);
  const [correctingLLM, setCorrectingLLM] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  /* État pour la modale d'historique des versions */
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyAudioId, setHistoryAudioId] = useState<string | null>(null);
  const [versions, setVersions] = useState<TranscriptVersionItem[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

  /* Glossaire */
  const [showGlossary, setShowGlossary] = useState(false);
  const [glossaryTerms, setGlossaryTerms] = useState<string[]>([]);
  const [newTerm, setNewTerm] = useState("");

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

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
    setLoadingAudioId(audioId);
    try {
      const res = await api.get(`/projects/${id}/audios/${audioId}/url`);
      setAudioUrl(res.data.url);
      setPlayingId(audioId);
    } catch (err: any) {
      console.error("Erreur chargement audio", err);
      alert(err.response?.data?.detail || "Erreur lors du chargement ou de la conversion de l'audio");
    } finally {
      setLoadingAudioId(null);
    }
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
      const poll = setInterval(async () => {
        try {
          const res = await api.get(`/projects/${id}/audios/${audioId}/transcript`);
          if (res.data && res.data.raw_text) {
            setTranscripts(prev => ({ ...prev, [audioId]: res.data }));
            setEditRawText(res.data.raw_text || "");
            setEditCorrectedText(res.data.corrected_text || "");
            setTranscribingId(null);
            setShowTranscriptId(audioId);
            clearInterval(poll);
            await loadAudios();
          }
        } catch { /* pas encore prêt */ }
      }, 3000);
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
      setEditRawText(res.data.raw_text || "");
      setEditCorrectedText(res.data.corrected_text || "");
      setShowTranscriptId(audioId);
    } catch { alert("Aucune transcription trouvée"); }
  };

  /* Sauvegarde de la transcription brute */
  const handleSaveRaw = async (audioId: string) => {
    setSavingRaw(true);
    try {
      await api.put(`/projects/${id}/audios/${audioId}/transcript/save-raw`, {
        raw_text: editRawText,
      });
      setTranscripts(prev => ({
        ...prev,
        [audioId]: { ...prev[audioId], raw_text: editRawText },
      }));
      showNotification("Transcription brute sauvegardée avec succès !");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erreur de sauvegarde de la version brute");
    } finally {
      setSavingRaw(false);
    }
  };

  /* Sauvegarde de la transcription corrigée */
  const handleSaveCorrected = async (audioId: string) => {
    setSavingCorrected(true);
    try {
      await api.put(`/projects/${id}/audios/${audioId}/transcript/save`, {
        corrected_text: editCorrectedText,
      });
      setTranscripts(prev => ({
        ...prev,
        [audioId]: { ...prev[audioId], corrected_text: editCorrectedText, status: "corrected" },
      }));
      showNotification("Transcription corrigée sauvegardée avec succès !");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erreur de sauvegarde de la version corrigée");
    } finally {
      setSavingCorrected(false);
    }
  };

  /* Correction automatique par le LLM (Groq LLaMA 3.3 70B) */
  const handleCorrectLLM = async (audioId: string) => {
    setCorrectingLLM(true);
    try {
      const res = await api.post(`/projects/${id}/audios/${audioId}/correct`);
      setEditCorrectedText(res.data.corrected_text || "");
      setTranscripts(prev => ({
        ...prev,
        [audioId]: {
          ...prev[audioId],
          corrected_text: res.data.corrected_text,
          status: res.data.status,
        },
      }));
      showNotification("Correction automatique par IA effectuée !");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erreur lors de la correction par l'IA");
    } finally {
      setCorrectingLLM(false);
    }
  };

  /* Ouverture de la modale d'historique */
  const openHistoryModal = async (audioId: string) => {
    setHistoryAudioId(audioId);
    setShowHistoryModal(true);
    setLoadingVersions(true);
    try {
      const res = await api.get(`/projects/${id}/audios/${audioId}/transcript/versions`);
      setVersions(res.data);
    } catch (err: any) {
      alert("Erreur lors du chargement de l'historique des versions");
    } finally {
      setLoadingVersions(false);
    }
  };

  /* Restauration d'une version spécifique */
  const handleRestoreVersion = async (versionId: string) => {
    if (!historyAudioId) return;
    setRestoringVersionId(versionId);
    try {
      const res = await api.post(
        `/projects/${id}/audios/${historyAudioId}/transcript/restore/${versionId}`
      );
      setEditCorrectedText(res.data.corrected_text);
      setTranscripts(prev => ({
        ...prev,
        [historyAudioId]: {
          ...prev[historyAudioId],
          corrected_text: res.data.corrected_text,
          status: "corrected",
        },
      }));
      showNotification("Version restaurée avec succès !");
      setShowHistoryModal(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erreur lors de la restauration de la version");
    } finally {
      setRestoringVersionId(null);
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

      <main className="max-w-5xl mx-auto p-8">
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
          <div className="space-y-4">
            {audios.map((audio) => (
              <div key={audio.id}>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
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

                      {/* Voir / Éditer la transcription */}
                      {audio.status === "transcribed" && (
                        <button onClick={() => loadTranscript(audio.id)}
                          className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded font-medium text-sm transition-colors flex items-center gap-1.5" title="Ouvrir l'éditeur">
                          <FileText size={18} />
                          <span>Éditer transcription</span>
                        </button>
                      )}

                      {/* Play */}
                      <button onClick={() => handlePlay(audio.id)}
                        disabled={loadingAudioId === audio.id}
                        className="p-2 hover:bg-gray-100 rounded disabled:opacity-50" title={loadingAudioId === audio.id ? "Conversion/Chargement en cours..." : "Écouter"}>
                        {loadingAudioId === audio.id ? (
                          <Loader2 size={20} className="text-blue-600 animate-spin" />
                        ) : playingId === audio.id ? (
                          <Pause size={20} className="text-blue-600" />
                        ) : (
                          <Play size={20} className="text-blue-600" />
                        )}
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

                {/* ÉDITEUR DOUBLE COLONNE */}
                {showTranscriptId === audio.id && transcripts[audio.id] && (
                  <div className="bg-white border border-gray-300 rounded-xl p-6 shadow-md mt-3 space-y-5">
                    {/* Message de confirmation de sauvegarde */}
                    {notification && (
                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg p-3 text-sm flex items-center justify-between font-medium">
                        <span>✅ {notification}</span>
                        <button onClick={() => setNotification(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
                      </div>
                    )}

                    {/* Entête Éditeur */}
                    <div className="flex justify-between items-center border-b pb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                          <FileText size={20} className="text-blue-600" />
                          Éditeur de transcription
                        </h3>
                        <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-gray-100 text-gray-700">
                          {transcripts[audio.id].status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openHistoryModal(audio.id)}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium text-sm rounded-lg transition-colors border border-gray-300"
                        >
                          Historique des versions
                        </button>
                        <button
                          onClick={() => setShowTranscriptId(null)}
                          className="text-gray-400 hover:text-gray-700 px-2 py-1 text-lg font-bold"
                          title="Fermer l'éditeur"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Grille 2 Colonnes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Colonne Gauche : Brute */}
                      <div className="flex flex-col space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-amber-400 rounded-full inline-block"></span>
                            Transcription BRUTE (raw_text)
                          </label>
                          <span className="text-xs text-gray-400 font-mono">{editRawText.length} caract.</span>
                        </div>
                        <textarea
                          value={editRawText}
                          onChange={(e) => setEditRawText(e.target.value)}
                          rows={14}
                          className="w-full p-4 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y leading-relaxed font-mono bg-gray-50/50"
                          placeholder="Transcription brute..."
                        />
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => handleSaveRaw(audio.id)}
                            disabled={savingRaw}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow transition-colors disabled:opacity-50"
                          >
                            {savingRaw ? "Sauvegarde en cours..." : "Sauvegarder la brute"}
                          </button>
                        </div>
                      </div>

                      {/* Colonne Droite : Corrigée */}
                      <div className="flex flex-col space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span>
                            Transcription CORRIGÉE (corrected_text)
                          </label>
                          <span className="text-xs text-gray-400 font-mono">{editCorrectedText.length} caract.</span>
                        </div>
                        <textarea
                          value={editCorrectedText}
                          onChange={(e) => setEditCorrectedText(e.target.value)}
                          rows={14}
                          className="w-full p-4 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-y leading-relaxed bg-emerald-50/20"
                          placeholder="La version corrigée s'affichera ici après correction IA ou édition manuelle..."
                        />
                        <div className="flex justify-between items-center pt-1">
                          <button
                            onClick={() => handleCorrectLLM(audio.id)}
                            disabled={correctingLLM}
                            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm rounded-lg shadow transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {correctingLLM ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Correction IA en cours...</span>
                              </>
                            ) : (
                              <span>Corriger avec IA</span>
                            )}
                          </button>
                          <button
                            onClick={() => handleSaveCorrected(audio.id)}
                            disabled={savingCorrected}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow transition-colors disabled:opacity-50"
                          >
                            {savingCorrected ? "Sauvegarde en cours..." : "Sauvegarder la corrigée"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Segments (optionnel) */}
                    {transcripts[audio.id].segments?.length > 0 && (
                      <details className="mt-4 border-t pt-3">
                        <summary className="text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700">
                          Afficher les {transcripts[audio.id].segments.length} segments horodatés (diarisation)
                        </summary>
                        <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto text-xs text-gray-600 font-mono bg-gray-50 p-3 rounded-lg border">
                          {transcripts[audio.id].segments.map((seg: any, i: number) => (
                            <div key={i} className="flex gap-3">
                              <span className="text-gray-400 font-semibold w-16">{seg.start?.toFixed(1)}s</span>
                              {seg.speaker !== undefined && (
                                <span className="text-purple-600 font-semibold w-20">Locuteur {seg.speaker}</span>
                              )}
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

      {/* MODALE HISTORIQUE DES VERSIONS */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 max-h-[85vh] flex flex-col shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Historique des versions</h3>
                <p className="text-xs text-gray-500 mt-0.5">Toutes les versions sauvegardées et restaurables pour ce fichier audio</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {loadingVersions ? (
                <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-2">
                  <Loader2 size={24} className="animate-spin text-purple-600" />
                  <p className="text-sm">Chargement de l'historique des versions...</p>
                </div>
              ) : versions.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <p>Aucune version disponible dans l'historique.</p>
                </div>
              ) : (
                versions.map((ver) => (
                  <div
                    key={ver.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-white hover:border-gray-300 transition-colors shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                          Version {ver.version_number}
                        </span>
                        <span className="text-xs font-semibold uppercase px-2.5 py-0.5 rounded bg-gray-200 text-gray-700">
                          {ver.source}
                        </span>
                        {ver.created_at && (
                          <span className="text-xs text-gray-400">
                            {new Date(ver.created_at).toLocaleString("fr-FR")}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRestoreVersion(ver.id)}
                        disabled={restoringVersionId === ver.id}
                        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-lg transition-colors shadow-sm disabled:opacity-50"
                      >
                        {restoringVersionId === ver.id ? "Restauration..." : "Restaurer cette version"}
                      </button>
                    </div>
                    <div className="bg-white border rounded p-3 text-xs text-gray-700 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap font-mono">
                      {ver.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t pt-4 mt-4 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium text-sm rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}