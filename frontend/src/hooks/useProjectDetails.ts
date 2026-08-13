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

  // Gestion de la sélection multiple
  const handleToggleSelectAudio = (id: string, checked: boolean) => {
    setSelectedAudios((prev) =>
      checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((item) => item !== id)
    );
  };

  const handleSelectAllAudios = (checked: boolean) => {
    if (checked) {
      setSelectedAudios(audios.map((a) => a.id));
    } else {
      setSelectedAudios([]);
    }
  };

  const handleClearSelection = () => {
    setSelectedAudios([]);
  };

  // Transcription unitaire
  const handleTranscribe = async (audioId: string) => {
    try {
      await audioService.transcribeAudio(projectId, audioId);
      toast.success("Transcription lancée");
      loadAudios();
    } catch {
      toast.error("Erreur au lancement de la transcription");
    }
  };

  // Transcription de TOUS les fichiers (sauf ceux déjà transcrits)
  const handleTranscribeAll = async () => {
    const toTranscribe = audios.filter((a) => ["uploaded", "error"].includes(a.status));
    if (toTranscribe.length === 0) {
      toast("Tous les fichiers audio sont déjà transcrits ou en cours.", { icon: "ℹ️" });
      return;
    }

    setIsTranscribingAll(true);
    try {
      const res = await audioService.transcribeAllAudios(projectId);
      toast.success(`${res.launched_count} transcription(s) lancée(s) !`);
      loadAudios();
    } catch {
      toast.error("Erreur lors du lancement de la transcription globale");
    } finally {
      setIsTranscribingAll(false);
    }
  };

  // Transcription d'une sélection de fichiers (sauf ceux déjà transcrits)
  const handleTranscribeSelected = async () => {
    if (selectedAudios.length === 0) return;

    const toTranscribe = audios.filter(
      (a) => selectedAudios.includes(a.id) && ["uploaded", "error"].includes(a.status)
    );

    if (toTranscribe.length === 0) {
      toast("Les fichiers sélectionnés sont déjà transcrits ou en cours.", { icon: "ℹ️" });
      return;
    }

    setIsTranscribingAll(true);
    try {
      const res = await audioService.transcribeMultipleAudios(
        projectId,
        toTranscribe.map((a) => a.id)
      );
      toast.success(`${res.launched_count} transcription(s) lancée(s) sur la sélection !`);
      setSelectedAudios([]);
      loadAudios();
    } catch {
      toast.error("Erreur lors de la transcription de la sélection");
    } finally {
      setIsTranscribingAll(false);
    }
  };

  // Suppression unitaire
  const handleDeleteAudio = async (audioId: string, filename: string) => {
    if (confirm(`Supprimer l'audio "${filename}" ?`)) {
      try {
        await audioService.deleteAudio(projectId, audioId);
        toast.success("Audio supprimé");
        setSelectedAudios((prev) => prev.filter((id) => id !== audioId));
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

  // Suppression d'une sélection de fichiers
  const handleDeleteSelectedAudios = async () => {
    if (selectedAudios.length === 0) return;

    if (
      confirm(
        `Êtes-vous sûr de vouloir supprimer les ${selectedAudios.length} fichier(s) audio sélectionné(s) ? Cette action est irréversible.`
      )
    ) {
      try {
        const res = await audioService.deleteMultipleAudios(projectId, selectedAudios);
        toast.success(`${res.deleted_count} fichier(s) supprimé(s) avec succès !`);
        if (activeAudio && selectedAudios.includes(activeAudio.id)) {
          setActiveAudio(null);
          setTranscriptData(null);
        }
        setSelectedAudios([]);
        loadAudios();
      } catch {
        toast.error("Erreur lors de la suppression de la sélection");
      }
    }
  };

  // Suppression de TOUS les fichiers du projet
  const handleDeleteAllAudios = async () => {
    if (audios.length === 0) {
      toast("Aucun fichier audio à supprimer.", { icon: "ℹ️" });
      return;
    }

    if (
      confirm(
        `⚠️ ATTENTION : Voulez-vous vraiment supprimer TOUS les fichiers audio (${audios.length}) de ce projet ? Cette action est irréversible.`
      )
    ) {
      try {
        const res = await audioService.deleteAllAudios(projectId);
        toast.success(`${res.deleted_count} fichier(s) audio supprimé(s) !`);
        setActiveAudio(null);
        setTranscriptData(null);
        setSelectedAudios([]);
        loadAudios();
      } catch {
        toast.error("Erreur lors de la suppression de tous les fichiers");
      }
    }
  };

  const [isCorrecting, setIsCorrecting] = useState(false);

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
      loadAudios();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleValidateRawTranscript = async (rawText: string) => {
    if (!activeAudio) return;
    try {
      const updated = await transcriptService.validateRawTranscript(
        projectId,
        activeAudio.id,
        rawText
      );
      setTranscriptData(updated);
      toast.success("Transcription brute validée avec succès !");
      loadAudios();
    } catch {
      toast.error("Erreur lors de la validation de la transcription");
    }
  };

  const handleCorrectTranscript = async () => {
    if (!activeAudio) return;
    setIsCorrecting(true);
    try {
      const updated = await transcriptService.correctTranscript(
        projectId,
        activeAudio.id
      );
      setTranscriptData(updated);
      toast.success("Correction IA terminée avec succès !");
      loadAudios();
    } catch {
      toast.error("Erreur lors de la correction par l'IA");
    } finally {
      setIsCorrecting(false);
    }
  };

  const handleCloseTranscript = () => {
    setActiveAudio(null);
    setTranscriptData(null);
    setActiveSegmentId(null);
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
    isCorrecting,
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
    handleToggleSelectAudio,
    handleSelectAllAudios,
    handleClearSelection,
    handleTranscribe,
    handleTranscribeAll,
    handleTranscribeSelected,
    handleDeleteAudio,
    handleDeleteSelectedAudios,
    handleDeleteAllAudios,
    handleSelectAudio,
    handleSaveTranscript,
    handleValidateRawTranscript,
    handleCorrectTranscript,
    handleCloseTranscript,
    handleOpenHistory,
    handleRestoreVersion,
    handleGenerateDoc,
    handleSaveGlossary,
    reloadAudios: loadAudios,
  };
}
