"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/services/api";
import axios from "axios";
import { toast } from "react-hot-toast";
import { ArrowLeft, Loader2, FileText, History } from "lucide-react";

import UploadZone from "@/components/UploadZone";
import AudioCard from "@/components/AudioCard";
import AudioPlayer from "@/components/AudioPlayer";
import TranscriptionPanel from "@/components/TranscriptionPanel";
import GlossaryPanel from "@/components/GlossaryPanel";
import VersionHistoryModal from "@/components/VersionHistoryModal";

export default function ProjectPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const { isAuthenticated, isLoading: authLoading, fetchMe } = useAuthStore();
  const [project, setProject] = useState<any>(null);
  const [audios, setAudios] = useState<any[]>([]);
  const [glossaryTerms, setGlossaryTerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeAudio, setActiveAudio] = useState<any | null>(null);

  // States for Modals
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  const [showDocModal, setShowDocModal] = useState(false);
  const [docForm, setDocForm] = useState({ expediteur: "", destinataire: "", objet: "" });
  const [docGenerating, setDocGenerating] = useState(false);

  // Transcription State
  const [transcriptData, setTranscriptData] = useState<any>(null);
  const [activeSegmentId, setActiveSegmentId] = useState<number | null>(null);
  const [externalTime, setExternalTime] = useState<number | undefined>(undefined);

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated]);

  const loadProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data);
    } catch (err) {
      toast.error("Projet introuvable");
      router.push("/dashboard");
    }
  };

  const loadAudios = async () => {
    try {
      const res = await api.get(`/projects/${id}/audios`);
      setAudios(res.data.files);
    } catch (err) {
      toast.error("Erreur de chargement des audios");
    }
  };

  const loadGlossary = async () => {
    try {
      const res = await api.get(`/projects/${id}/glossary`);
      setGlossaryTerms(res.data.terms);
    } catch (err) {
      console.error("Glossaire", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadProject();
      loadAudios();
      loadGlossary();
    }
  }, [isAuthenticated, id]);

  // Polling for processing status
  useEffect(() => {
    const hasProcessing = audios.some((a) => a.status === "transcribing" || a.status === "correcting");
    if (!hasProcessing) return;
    const intervalId = setInterval(() => {
      loadAudios();
      if (activeAudio && ["transcribing", "correcting"].includes(activeAudio.status)) {
         loadTranscript(activeAudio.id);
      }
    }, 5000);
    return () => clearInterval(intervalId);
  }, [audios, activeAudio]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const token = localStorage.getItem("access_token");
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/projects/${id}/audios`, formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        }
      });
      toast.success("Fichier uploadé avec succès");
      await loadAudios();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Erreur lors de l'upload");
    } finally { 
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteAudio = async (audioId: string) => {
    if (!confirm("Supprimer ce fichier audio ?")) return;
    try {
      await api.delete(`/projects/${id}/audios/${audioId}`);
      toast.success("Fichier supprimé");
      if (activeAudio?.id === audioId) {
        setActiveAudio(null);
        setTranscriptData(null);
      }
      loadAudios();
    } catch (err) {
      toast.error("Erreur de suppression");
    }
  };

  const loadTranscript = async (audioId: string) => {
    try {
      const res = await api.get(`/projects/${id}/audios/${audioId}/transcript`);
      setTranscriptData(res.data);
    } catch (err) {
      setTranscriptData(null);
    }
  };

  const handleTranscribe = async (audioId: string) => {
    try {
      await api.post(`/projects/${id}/audios/${audioId}/transcribe`);
      toast.success("Transcription lancée");
      loadAudios();
    } catch (err) {
      toast.error("Erreur lors du lancement");
    }
  };

  const handlePlay = async (audio: any) => {
    if (["dss", "ds2"].includes(audio.format.toLowerCase()) && audio.status === "uploaded") {
      toast.error("Veuillez lancer la transcription d'abord pour convertir ce fichier DSS.");
      return;
    }
    try {
      const token = localStorage.getItem("access_token");
      const streamUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/projects/${id}/audios/${audio.id}/stream?token=${token}`;
      setActiveAudio({ ...audio, streamUrl });
      loadTranscript(audio.id);
    } catch (err) {
      toast.error("Erreur pour la lecture");
    }
  };

  const handleEdit = (audioId: string) => {
    const audio = audios.find((a) => a.id === audioId);
    if (audio) {
      setActiveAudio(audio);
      loadTranscript(audio.id);
    }
  };

  const handleDownload = async (audioId: string, format: string) => {
    try {
      const res = await api.get(`/projects/${id}/audios/${audioId}/url`);
      const link = document.createElement("a");
      link.href = res.data.url;
      link.download = `audio.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error("Erreur de téléchargement");
    }
  };

  const handleTimeUpdate = (currentTime: number) => {
    if (!transcriptData?.segments) return;
    const currentSegment = transcriptData.segments.find(
      (s: any) => currentTime >= s.start && currentTime <= s.end
    );
    if (currentSegment && activeSegmentId !== currentSegment.id) {
      setActiveSegmentId(currentSegment.id);
    } else if (!currentSegment) {
      setActiveSegmentId(null);
    }
  };

  const loadVersions = async () => {
    if (!activeAudio) return;
    setShowHistoryModal(true);
    setVersionsLoading(true);
    try {
      const res = await api.get(`/projects/${id}/audios/${activeAudio.id}/transcript/versions`);
      setVersions(res.data);
    } catch (err) {
      toast.error("Erreur chargement historique");
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleGenerateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAudio) return;
    setDocGenerating(true);
    try {
      const res = await api.post(`/projects/${id}/documents/generate`, {
        transcript_id: transcriptData.id,
        expediteur: docForm.expediteur,
        destinataire: docForm.destinataire,
        objet: docForm.objet,
      });
      setShowDocModal(false);
      window.open(res.data.url, "_blank");
    } catch (err) {
      toast.error("Erreur lors de la génération DOCX");
    } finally {
      setDocGenerating(false);
    }
  };

  if (authLoading || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500 text-sm">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      {/* En-tête de projet */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-2 transition-colors"
            >
              <ArrowLeft size={16} /> Retour
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
            {project.description && <p className="text-gray-500 mt-1 text-sm">{project.description}</p>}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Colonne de gauche (Audios & Upload) */}
        <div className="md:col-span-2 space-y-6">
          <UploadZone onUpload={handleUpload} uploading={uploading} uploadProgress={uploadProgress} />
          
          <div className="bg-white border border-gray-200 rounded p-4 shadow-sm">
            <h2 className="font-medium text-gray-900 mb-4 flex items-center justify-between">
              Fichiers Audio
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{audios.length}</span>
            </h2>
            <div className="space-y-3">
              {audios.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">Aucun fichier pour l'instant.</p>
              ) : (
                audios.map((audio) => (
                  <AudioCard
                    key={audio.id}
                    audio={audio}
                    isActive={activeAudio?.id === audio.id}
                    onPlay={handlePlay}
                    onTranscribe={handleTranscribe}
                    onEdit={handleEdit}
                    onDownload={handleDownload}
                    onDelete={handleDeleteAudio}
                    isTranscribing={audios.some(a => a.status === "transcribing" || a.status === "correcting")}
                  />
                ))
              )}
            </div>
          </div>

          {/* Section d'édition */}
          {activeAudio && (
            <div className="mt-8">
              <h2 className="text-xl font-medium text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Édition : {activeAudio.original_filename}
              </h2>
              
              {activeAudio.streamUrl && (
                <AudioPlayer
                  url={activeAudio.streamUrl}
                  onTimeUpdate={handleTimeUpdate}
                  title="Lecteur Audio"
                  externalTime={externalTime}
                />
              )}

              {transcriptData ? (
                <div>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={loadVersions}
                      className="text-sm bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <History size={14} /> Historique des versions
                    </button>
                    <button
                      onClick={() => setShowDocModal(true)}
                      className="text-sm bg-gray-800 text-white px-3 py-1.5 rounded hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <FileText size={14} /> Générer document (DOCX)
                    </button>
                  </div>
                  
                  <TranscriptionPanel
                    projectId={id}
                    audioId={activeAudio.id}
                    transcript={transcriptData}
                    activeSegmentId={activeSegmentId}
                    onSegmentClick={(start) => setExternalTime(start)}
                    onTranscriptUpdate={setTranscriptData}
                  />
                </div>
              ) : (
                <div className="text-center p-8 border border-dashed border-gray-300 rounded bg-white text-sm text-gray-500">
                  <p>Aucune transcription disponible ou en cours.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Colonne de droite (Glossaire) */}
        <div className="md:col-span-1">
          <GlossaryPanel projectId={id} terms={glossaryTerms} onUpdate={setGlossaryTerms} />
        </div>
      </main>

      {/* Modales */}
      {showHistoryModal && (
        <VersionHistoryModal
          projectId={id}
          audioId={activeAudio.id}
          versions={versions}
          versionsLoading={versionsLoading}
          onClose={() => setShowHistoryModal(false)}
          onRestore={(newText) => {
            setTranscriptData({ ...transcriptData, corrected_text: newText });
            toast.success("Version restaurée");
            setShowHistoryModal(false);
          }}
        />
      )}

      {showDocModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded w-full max-w-md shadow-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Générer DOCX</h2>
              <button
                onClick={() => setShowDocModal(false)}
                className="text-gray-400 hover:text-gray-700 font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleGenerateDoc} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Expéditeur</label>
                <input
                  type="text" required value={docForm.expediteur}
                  onChange={(e) => setDocForm({...docForm, expediteur: e.target.value})}
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Destinataire</label>
                <input
                  type="text" required value={docForm.destinataire}
                  onChange={(e) => setDocForm({...docForm, destinataire: e.target.value})}
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Objet</label>
                <input
                  type="text" required value={docForm.objet}
                  onChange={(e) => setDocForm({...docForm, objet: e.target.value})}
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
                />
              </div>
              
              <div className="border-t border-gray-100 pt-4 mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-3 py-1.5 bg-transparent border border-gray-300 hover:bg-gray-100 text-gray-700 text-sm rounded transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={docGenerating}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {docGenerating ? <Loader2 size={14} className="animate-spin" /> : null}
                  Télécharger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}