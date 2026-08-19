"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { Navbar } from "@/components/layout/Navbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { UploadZone } from "@/components/features/audio/UploadZone";
import { AudioList } from "@/components/features/audio/AudioList";
import { AudioPlayer } from "@/components/features/audio/AudioPlayer";
import { TranscriptionPanel } from "@/components/features/transcript/TranscriptionPanel";
import { VersionHistoryModal } from "@/components/features/transcript/VersionHistoryModal";
import { DocumentExportModal } from "@/components/features/transcript/DocumentExportModal";
import { GlossaryPanel } from "@/components/features/glossary/GlossaryPanel";
import { ROUTES } from "@/constants/routes";
import { AudioFile } from "@/types/audio";

export interface ProjectDetailViewProps {
  projectId?: string;
}

export default function ProjectDetailView({ projectId: propId }: ProjectDetailViewProps = {}) {
  const params = useParams();
  const projectId = propId || (params?.id as string);

  const { user, isAuthenticated, logout } = useAuth();
  const [playingAudio, setPlayingAudio] = useState<AudioFile | null>(null);

  const {
    project,
    audios,
    allAudios,
    glossaryTerms,
    loading,
    uploading,
    uploadProgress,
    activeAudio,
    isTranscribingAll,
    selectedAudios,
    showHistoryModal,
    setShowHistoryModal,
    versions,
    versionsLoading,
    showDocModal,
    setShowDocModal,
    docGenerating,
    transcriptData,
    isCorrecting,
    activeSegmentId,
    setActiveSegmentId,
    externalTime,
    setExternalTime,
    currentPage,
    pageSize,
    totalPages,
    setCurrentPage,
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
  } = useProjectDetails(projectId, isAuthenticated);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2.5 text-gray-500 text-sm">
          <Loader2 size={18} className="animate-spin text-blue-600" />
          <span>Chargement du projet...</span>
        </div>
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

  const activeAudioStreamUrl = activeAudio
    ? `${baseUrl}/projects/${projectId}/audios/${activeAudio.id}/stream`
    : "";

  const standaloneStreamUrl = playingAudio
    ? `${baseUrl}/projects/${projectId}/audios/${playingAudio.id}/stream`
    : "";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar supérieure avec retour aux projets */}
      <Navbar
        user={user}
        onLogout={() => logout()}
        leftContent={
          <div className="flex items-center gap-3">
            <Link
              href={ROUTES.DASHBOARD}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-1.5 text-xs sm:text-sm transition-colors py-1 px-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft size={15} />
              <span>Projets</span>
            </Link>
            <div className="h-4 w-px bg-gray-200" />
            <h1 className="text-sm sm:text-base font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-md">
              {project?.name || "Projet"}
            </h1>
          </div>
        }
      />

      <main className={`flex-1 py-6 ${playingAudio && !activeAudio ? "pb-32" : "pb-12"}`}>
        <PageContainer maxWidth="7xl">
          {/* 1. GRILLE PRINCIPALE FIXE AU SOMMET : Upload + Audios (Gauche) / Glossaire (Droite) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mb-8">
            {/* Colonne gauche (2/3) : Upload + Liste audio */}
            <div className="lg:col-span-2 space-y-6">
              <UploadZone
                onUpload={handleUpload}
                uploading={uploading}
                uploadProgress={uploadProgress}
              />

              <AudioList
                audios={audios}
                allAudiosCount={allAudios.length}
                activeAudio={activeAudio}
                playingAudioId={activeAudio?.id || playingAudio?.id}
                selectedAudios={selectedAudios}
                onToggleSelectAudio={handleToggleSelectAudio}
                onSelectAllAudios={handleSelectAllAudios}
                onClearSelection={handleClearSelection}
                onPlayAudio={(audio) => {
                  if (activeAudio?.id === audio.id) {
                    // Si cet audio est déjà ouvert dans la section édition
                  } else {
                    setPlayingAudio(audio);
                  }
                }}
                onTranscribeAudio={handleTranscribe}
                onTranscribeSelected={handleTranscribeSelected}
                onTranscribeAll={handleTranscribeAll}
                onEditTranscript={(audio) => {
                  setPlayingAudio(null);
                  handleSelectAudio(audio);
                }}
                onDeleteAudio={handleDeleteAudio}
                onDeleteSelected={handleDeleteSelectedAudios}
                onDeleteAll={handleDeleteAllAudios}
                isTranscribingAll={isTranscribingAll}
                currentPage={currentPage}
                pageSize={pageSize}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>

            {/* Colonne droite (1/3) : Glossaire */}
            <div className="h-[480px]">
              <GlossaryPanel
                terms={glossaryTerms}
                onSaveTerms={handleSaveGlossary}
              />
            </div>
          </div>

          {/* 2. SECTION ÉDITION UNIFIÉE ET REPLIABLE : POSITIONNÉE STRICTEMENT SOUS LA GRILLE */}
          {activeAudio && transcriptData && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <TranscriptionPanel
                transcript={transcriptData}
                audioFilename={activeAudio.original_filename}
                audioStreamUrl={activeAudioStreamUrl}
                externalTime={externalTime}
                activeSegmentId={activeSegmentId}
                glossaryTerms={glossaryTerms}
                isCorrecting={isCorrecting}
                onTimeUpdate={(t) => {
                  if (transcriptData?.raw_json?.segments) {
                    const seg = transcriptData.raw_json.segments.find(
                      (s) => t >= s.start && t <= s.end
                    );
                    if (seg && seg.id !== activeSegmentId) {
                      setActiveSegmentId(seg.id);
                    }
                  }
                }}
                onSegmentClick={(start) => {
                  setExternalTime(start);
                }}
                onValidateRaw={handleValidateRawTranscript}
                onSaveTranscript={handleSaveTranscript}
                onCorrectTranscript={handleCorrectTranscript}
                onShowHistory={handleOpenHistory}
                onGenerateDoc={() => setShowDocModal(true)}
                onClose={handleCloseTranscript}
              />
            </div>
          )}
        </PageContainer>
      </main>

      {/* 3. Lecteur Audio d'appoint (uniquement si écoute rapide d'un audio hors session d'édition) */}
      {playingAudio && !activeAudio && (
        <AudioPlayer
          url={standaloneStreamUrl}
          title={playingAudio.original_filename}
          externalTime={externalTime}
          onClose={() => setPlayingAudio(null)}
        />
      )}

      {/* Modales chargées dynamiquement */}
      {showHistoryModal && (
        <VersionHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          versions={versions}
          isLoading={versionsLoading}
          onRestore={handleRestoreVersion}
        />
      )}

      {showDocModal && (
        <DocumentExportModal
          isOpen={showDocModal}
          onClose={() => setShowDocModal(false)}
          onSubmit={handleGenerateDoc}
          isLoading={docGenerating}
        />
      )}
    </div>
  );
}
