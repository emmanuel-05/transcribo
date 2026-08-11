"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/services/api";
import axios from "axios";
import { toast } from "react-hot-toast";
import { ArrowLeft, Loader2, FileText, History, LogOut, UserCircle, X, Trash2 } from "lucide-react";

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

  const { user, isAuthenticated, isLoading: authLoading, fetchMe, logout } = useAuthStore();
  const [project, setProject] = useState<any>(null);
  const [audios, setAudios] = useState<any[]>([]);
  const [glossaryTerms, setGlossaryTerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeAudio, setActiveAudio] = useState<any | null>(null);
  const [isTranscribingAll, setIsTranscribingAll] = useState(false);
  const [selectedAudios, setSelectedAudios] = useState<string[]>([]);

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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const totalPages = Math.max(1, Math.ceil(audios.length / pageSize));
  const paginatedAudios = audios.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Drawer State
  const [showDrawer, setShowDrawer] = useState(false);

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
    }, 3000);
    return () => clearInterval(intervalId);
  }, [audios, activeAudio]);

  const loadTranscript = async (audioId: string) => {
    try {
      const res = await api.get(`/projects/${id}/audios/${audioId}/transcript`);
      setTranscriptData(res.data);
    } catch (err) {
      setTranscriptData(null);
    }
  };

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    setUploadProgress(0);
    const token = localStorage.getItem("access_token");

    let uploadedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/projects/${id}/audios`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`
            },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const baseProgress = (i / files.length) * 100;
                const currentFileProgress = (progressEvent.loaded / progressEvent.total) * (100 / files.length);
                setUploadProgress(Math.round(baseProgress + currentFileProgress));
              }
            },
          }
        );
        uploadedCount++;
      } catch (err) {
        errorCount++;
      }
    }

    if (uploadedCount > 0) toast.success(`${uploadedCount} fichier(s) uploadé(s) avec succès`);
    if (errorCount > 0) toast.error(`${errorCount} erreur(s) lors de l'upload`);
    
    setUploading(false);
    setUploadProgress(0);
    loadAudios();
  };

  const handleTranscribe = async (audioId: string) => {
    try {
      await api.post(`/projects/${id}/audios/${audioId}/transcribe`);
      toast.success("Transcription lancée");
      loadAudios();
    } catch (err) {
      toast.error("Erreur au lancement de la transcription");
    }
  };

  const handleTranscribeAll = async () => {
    const toTranscribe = audios.filter(a => ["uploaded", "error"].includes(a.status));
    if (toTranscribe.length === 0) return;
    
    setIsTranscribingAll(true);
    let launched = 0;
    
    for (const audio of toTranscribe) {
      try {
        await api.post(`/projects/${id}/audios/${audio.id}/transcribe`);
        launched++;
      } catch (err) {
        console.error(`Erreur transcription ${audio.id}`);
      }
    }
    
    if (launched > 0) {
      toast.success(`${launched} transcription(s) lancée(s) !`);
      loadAudios();
    }
    setIsTranscribingAll(false);
  };

  const handleEdit = (audioId: string) => {
    const audio = audios.find((a) => a.id === audioId);
    if (audio) {
      setActiveAudio(audio);
      loadTranscript(audioId);
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

  const handleDeleteAudio = async (audioId: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce fichier ?")) return;
    try {
      await api.delete(`/projects/${id}/audios/${audioId}`);
      if (activeAudio?.id === audioId) {
        setActiveAudio(null);
      }
      setSelectedAudios(prev => prev.filter(aId => aId !== audioId));
      loadAudios();
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleSelectAllAudios = () => {
    if (selectedAudios.length === audios.length) setSelectedAudios([]);
    else setSelectedAudios(audios.map(a => a.id));
  };

  const handleDeleteSelectedAudios = async () => {
    if (selectedAudios.length === 0) return;
    if (!window.confirm(`Supprimer les ${selectedAudios.length} fichiers sélectionnés ?`)) return;

    let deleted = 0;
    for (const audioId of selectedAudios) {
      try {
        await api.delete(`/projects/${id}/audios/${audioId}`);
        if (activeAudio?.id === audioId) setActiveAudio(null);
        deleted++;
      } catch (err) {
        console.error(`Erreur suppression ${audioId}`);
      }
    }

    if (deleted > 0) {
      toast.success(`${deleted} fichier(s) supprimé(s)`);
      setSelectedAudios([]);
      loadAudios();
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

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (authLoading || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500 text-sm">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navbar Ultra-Compacte */}
      <div className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowDrawer(true)} className="text-gray-400 hover:text-gray-600 transition-colors" title="Profil Utilisateur">
            <UserCircle size={24} />
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-500 hover:text-gray-900 transition-colors p-1"
            title="Retour"
          >
            <ArrowLeft size={18} />
          </button>
        </div>
        
        <h1 className="text-sm font-semibold text-gray-800 absolute left-1/2 -translate-x-1/2 truncate max-w-xs md:max-w-md">
          Projet : {project.name}
        </h1>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200 hover:bg-gray-50 px-2 py-1.5 rounded transition-all"
        >
          <LogOut size={14} /> <span className="hidden md:inline">Se déconnecter</span>
        </button>
      </div>

      <main className="max-w-[1600px] w-full mx-auto p-4 md:p-6 flex flex-col gap-6 mt-2">
        
        {/* Grille Principale (Split Screen Asymétrique 65/35) */}
        <div className="flex flex-col md:flex-row gap-6 items-stretch">
          
          {/* Colonne Gauche (65%) : Drag & Drop + Fichiers Audio */}
          <div className="w-full md:w-[65%] flex flex-col gap-6">
            
            {/* Upload Zone */}
            <div className="h-32">
              <UploadZone onUpload={handleUpload} uploading={uploading} uploadProgress={uploadProgress} />
            </div>

            {/* Liste des Fichiers Audio */}
            <div className="bg-white border border-gray-200 rounded shadow-sm flex flex-col flex-1 min-h-[200px]">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <h2 className="font-medium text-gray-900 flex items-center gap-2">
                    Fichiers Audio
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{audios.length}</span>
                  </h2>
                  {audios.length > 0 && (
                    <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                      <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                        <input type="checkbox" checked={selectedAudios.length === audios.length && audios.length > 0} onChange={handleSelectAllAudios} className="rounded border-gray-300" />
                        Tout
                      </label>
                      {selectedAudios.length > 0 && (
                        <button onClick={handleDeleteSelectedAudios} className="text-red-500 hover:text-red-700 transition-colors p-1" title="Supprimer la sélection">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {audios.some(a => ["uploaded", "error"].includes(a.status)) && (
                  <button 
                    onClick={handleTranscribeAll}
                    disabled={isTranscribingAll}
                    className="flex items-center gap-2 text-xs bg-gray-800 text-white px-3 py-1.5 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {isTranscribingAll && <Loader2 size={12} className="animate-spin" />}
                    Tout transcrire
                  </button>
                )}
              </div>
              
              <div className="flex flex-col flex-1">
                {audios.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-6">Aucun fichier pour l'instant.</p>
                ) : (
                  paginatedAudios.map((audio) => (
                    <AudioCard
                      key={audio.id}
                      audio={audio}
                      isActive={activeAudio?.id === audio.id}
                      isSelected={selectedAudios.includes(audio.id)}
                      onToggleSelect={(audioId, checked) => {
                        if (checked) setSelectedAudios([...selectedAudios, audioId]);
                        else setSelectedAudios(selectedAudios.filter(id => id !== audioId));
                      }}
                      onPlay={handlePlay}
                      onTranscribe={handleTranscribe}
                      onEdit={handleEdit}
                      onDelete={handleDeleteAudio}
                      isTranscribing={audios.some(a => a.status === "transcribing" || a.status === "correcting")}
                    />
                  ))
                )}
              </div>

              {/* Pagination Footer */}
              {audios.length > 0 && (
                 <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-sm shrink-0">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span>Afficher :</span>
                      <input 
                        type="number"
                        min="1"
                        value={pageSize === 9999 ? audios.length || 1 : pageSize}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val > 0) {
                            setPageSize(val);
                            setCurrentPage(1);
                          }
                        }}
                        className="w-16 border border-gray-300 rounded px-2 py-1 focus:outline-none bg-white text-center"
                        title="Nombre de fichiers par page"
                      />
                    </div>
                    
                    <div className="flex items-center gap-4 text-gray-600">
                       <button 
                         onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                         disabled={currentPage === 1}
                         className="hover:text-gray-900 disabled:opacity-50 transition-colors"
                       >
                         &lt; Précédent
                       </button>
                       <span className="font-medium">Page {currentPage} sur {totalPages}</span>
                       <button 
                         onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                         disabled={currentPage === totalPages}
                         className="hover:text-gray-900 disabled:opacity-50 transition-colors"
                       >
                         Suivant &gt;
                       </button>
                    </div>
                 </div>
              )}
            </div>
          </div>

          {/* Colonne Droite (35%) : Glossaire Pleine Hauteur */}
          <div className="w-full md:w-[35%] flex flex-col min-h-0">
            <GlossaryPanel projectId={id} terms={glossaryTerms} onUpdate={setGlossaryTerms} />
          </div>
        </div>

        {/* Bloc Inférieur (Édition & Transcription) */}
        {activeAudio && (
          <div className="mt-2">
            {activeAudio.streamUrl && (
              <div className="mb-4">
                <AudioPlayer
                  url={activeAudio.streamUrl}
                  onTimeUpdate={handleTimeUpdate}
                  title="Lecteur Audio"
                  externalTime={externalTime}
                />
              </div>
            )}

            {transcriptData ? (
              <TranscriptionPanel
                projectId={id}
                audioId={activeAudio.id}
                transcript={transcriptData}
                activeSegmentId={activeSegmentId}
                onSegmentClick={(start) => setExternalTime(start)}
                onTranscriptUpdate={setTranscriptData}
                audioFilename={activeAudio.original_filename}
                onShowHistory={loadVersions}
                onGenerateDoc={() => setShowDocModal(true)}
              />
            ) : (
              <div className="text-center p-8 border border-dashed border-gray-300 rounded bg-white text-sm text-gray-500">
                <p>Aucune transcription disponible ou en cours.</p>
              </div>
            )}
          </div>
        )}
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

      {/* Drawer Utilisateur */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setShowDrawer(false)}
          />
          <div className="relative w-80 bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-medium text-gray-900">Profil Utilisateur</h2>
              <button onClick={() => setShowDrawer(false)} className="text-gray-400 hover:text-gray-700 p-1">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center border-b border-gray-100 bg-gray-50/50">
              <UserCircle size={64} className="text-gray-300 mb-4" />
              {user ? (
                 <>
                   <p className="font-medium text-gray-900 text-lg">{user.full_name}</p>
                   <p className="text-sm text-gray-500">{user.email}</p>
                   <span className="mt-3 text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full uppercase tracking-wider font-medium">
                     {user.role}
                   </span>
                 </>
              ) : (
                <p className="text-sm text-gray-500">Chargement...</p>
              )}
            </div>
            <div className="p-4 flex-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Raccourcis</p>
              <button onClick={() => { setShowDrawer(false); router.push("/dashboard"); }} className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors mb-1 font-medium">
                Mes Projets
              </button>
              <button onClick={() => setShowDrawer(false)} className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors mb-1 font-medium">
                Paramètres du compte
              </button>
            </div>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-sm text-red-600 hover:bg-red-50 py-2.5 rounded transition-colors font-medium"
              >
                <LogOut size={16} /> Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}