/**
 * Custom Hook gérant l'état et les opérations d'un projet spécifique (fichiers audio, transcriptions, glossaire, export).
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import { projectService, audioService, transcriptService, glossaryService } from "@/services";
import { Project } from "@/types/project";
import { AudioFile } from "@/types/audio";
import { TranscriptData, TranscriptVersion, DocumentGenerationParams } from "@/types/transcript";
import { AUDIOS_PER_PAGE } from "@/constants/pagination";

export function useProjectDetails(projectId: string, isAuthenticated: boolean) {
  const [project, setProject] = useState<Project | null>(null);
  const [audios, setAudios] = useState<AudioFile[]>([]);
  const [glossaryTerms, setGlossaryTerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeAudio, setActiveAudio] = useState<AudioFile | null>(null);
  const [isTranscribingAll, setIsTranscribingAll] = useState(false);
  const [selectedAudios, setSelectedAudios] = useState<string[]>([]);

  // Modales
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [versions, setVersions] = useState<TranscriptVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  const [showDocModal, setShowDocModal] = useState(false);
  const [docGenerating, setDocGenerating] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  // Transcription
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
  const [activeSegmentId, setActiveSegmentId] = useState<number | null>(null);
  const [externalTime, setExternalTime] = useState<number | undefined>(undefined);

  // Pagination audios
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(AUDIOS_PER_PAGE);

  // Chargements initiaux
  const loadProject = useCallback(async () => {
    try {
      const data = await projectService.getProject(projectId);
      setProject(data);
    } catch {
      toast.error("Projet introuvable");
    }
  }, [projectId]);

  const loadAudios = useCallback(async () => {
    try {
      const data = await audioService.getProjectAudios(projectId);
      setAudios(data.files || []);
    } catch {
      toast.error("Erreur de chargement des audios");
    }
  }, [projectId]);

  const loadGlossary = useCallback(async () => {
    try {
      const data = await glossaryService.getGlossary(projectId);
      setGlossaryTerms(data.terms || []);
    } catch (err) {
      console.error("Erreur glossaire", err);
    }
  }, [projectId]);

  const loadTranscript = useCallback(async (audioId: string) => {
    try {
      const data = await transcriptService.getTranscript(projectId, audioId);
      setTranscriptData(data);
    } catch {
      setTranscriptData(null);
    }
  }, [projectId]);

  useEffect(() => {
    if (isAuthenticated && projectId) {
      setLoading(true);
      Promise.all([loadProject(), loadAudios(), loadGlossary()]).finally(() => {
        setLoading(false);
      });
    }
  }, [isAuthenticated, projectId, loadProject, loadAudios, loadGlossary]);

  // Polling pour les statuts en cours (transcription, conversion)
  useEffect(() => {
    const hasProcessing = audios.some((a) =>
      ["transcribing", "correcting", "converting"].includes(a.status)
    );
    if (!hasProcessing) return;

    const intervalId = setInterval(() => {
      loadAudios();
      if (activeAudio && ["transcribing", "correcting"].includes(activeAudio.status)) {
        loadTranscript(activeAudio.id);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [audios, activeAudio, loadAudios, loadTranscript]);

  // Actions Audio
  const handleUpload = async (files: File[]) => {
    setUploading(true);
    setUploadProgress(0);

    let uploadedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        await audioService.uploadAudio(projectId, file, (percent) => {
          const baseProgress = (i / files.length) * 100;
          const currentProgress = percent * (1 / files.length);
          setUploadProgress(Math.round(baseProgress + currentProgress));
        });
        uploadedCount++;
      } catch (err) {
        console.error("Erreur upload", err);
        errorCount++;
      }
    }

    if (uploadedCount > 0) toast.success(`${uploadedCount} fichier(s) uploadé(s)`);
    if (errorCount > 0) toast.error(`${errorCount} erreur(s) lors de l'upload`);

    setUploading(false);
    setUploadProgress(0);
    loadAudios();
  };

  const handleTranscribe = async (audioId: string) => {
    try {
      await audioService.transcribeAudio(projectId, audioId);
      toast.success("Transcription lancée");
      loadAudios();
    } catch {
      toast.error("Erreur au lancement de la transcription");
    }
  };

  const handleTranscribeAll = async () => {
    const toTranscribe = audios.filter((a) => ["uploaded", "error"].includes(a.status));
    if (toTranscribe.length === 0) return;

    setIsTranscribingAll(true);
    let launched = 0;

    for (const audio of toTranscribe) {
      try {
        await audioService.transcribeAudio(projectId, audio.id);
        launched++;
      } catch (err) {
        console.error(`Erreur transcription ${audio.id}`, err);
      }
    }

    if (launched > 0) {
      toast.success(`${launched} transcription(s) lancée(s) !`);
      loadAudios();
    }
    setIsTranscribingAll(false);
  };

  const handleDeleteAudio = async (audioId: string, filename: string) => {
    if (confirm(`Supprimer l'audio "${filename}" ?`)) {
      try {
        await audioService.deleteAudio(projectId, audioId);
        toast.success("Audio supprimé");
        if (activeAudio?.id === audioId) {
          setActiveAudio(null);
          setTranscriptData(null);
        }
        loadAudios();
      } catch {
        toast.error("Erreur lors de la suppression de l'audio");
      }
    }
  };

  const handleSelectAudio = (audio: AudioFile) => {
    setActiveAudio(audio);
    loadTranscript(audio.id);
  };

  // Actions Transcription
  const handleSaveTranscript = async (correctedText: string) => {
    if (!activeAudio) return;
    try {
      const updated = await transcriptService.updateTranscript(
        projectId,
        activeAudio.id,
        correctedText
      );
      setTranscriptData(updated);
      toast.success("Transcription enregistrée");
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleOpenHistory = async () => {
    if (!activeAudio) return;
    setShowHistoryModal(true);
    setVersionsLoading(true);
    try {
      const list = await transcriptService.getVersions(projectId, activeAudio.id);
      setVersions(list || []);
    } catch {
      toast.error("Erreur lors du chargement des versions");
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleRestoreVersion = async (versionNumber: number) => {
    if (!activeAudio) return;
    try {
      const restored = await transcriptService.restoreVersion(
        projectId,
        activeAudio.id,
        versionNumber
      );
      setTranscriptData(restored);
      setShowHistoryModal(false);
      toast.success(`Version ${versionNumber} restaurée`);
    } catch {
      toast.error("Erreur lors de la restauration");
    }
  };

  const handleGenerateDoc = async (params: DocumentGenerationParams) => {
    if (!activeAudio) return;
    setDocGenerating(true);
    try {
      const res = await transcriptService.generateDocument(
        projectId,
        activeAudio.id,
        params
      );
      if (res.download_url) {
        window.open(res.download_url, "_blank");
      }
      setShowDocModal(false);
      toast.success("Document généré avec succès !");
    } catch {
      toast.error("Erreur lors de la génération du document");
    } finally {
      setDocGenerating(false);
    }
  };

  const handleSaveGlossary = async (terms: string[]) => {
    try {
      await glossaryService.updateGlossary(projectId, terms);
      setGlossaryTerms(terms);
      toast.success("Glossaire mis à jour");
    } catch {
      toast.error("Erreur lors de la mise à jour du glossaire");
    }
  };

  // Pagination calculée
  const totalPages = Math.max(1, Math.ceil(audios.length / pageSize));
  const paginatedAudios = useMemo(() => {
    return audios.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [audios, currentPage, pageSize]);

  return {
    project,
    audios: paginatedAudios,
    allAudios: audios,
    glossaryTerms,
    loading,
    uploading,
    uploadProgress,
    activeAudio,
    isTranscribingAll,
    selectedAudios,
    setSelectedAudios,
    showHistoryModal,
    setShowHistoryModal,
    versions,
    versionsLoading,
    showDocModal,
    setShowDocModal,
    docGenerating,
    showDrawer,
    setShowDrawer,
    transcriptData,
    activeSegmentId,
    setActiveSegmentId,
    externalTime,
    setExternalTime,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    handleUpload,
    handleTranscribe,
    handleTranscribeAll,
    handleDeleteAudio,
    handleSelectAudio,
    handleSaveTranscript,
    handleOpenHistory,
    handleRestoreVersion,
    handleGenerateDoc,
    handleSaveGlossary,
    reloadAudios: loadAudios,
  };
}
