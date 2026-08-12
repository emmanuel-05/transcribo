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
    showHistoryModal,
    setShowHistoryModal,
    versions,
    versionsLoading,
    showDocModal,
    setShowDocModal,
    docGenerating,
    transcriptData,
    activeSegmentId,
    setActiveSegmentId,
    externalTime,
    setExternalTime,
    currentPage,
    pageSize,
    totalPages,
    setCurrentPage,
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

  const audioStreamUrl = playingAudio
    ? `http://localhost:8000/api/v1/projects/${projectId}/audios/${playingAudio.id}/stream`
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

      <main className="flex-1 py-6">
        <PageContainer maxWidth="7xl">
          {/* Lecteur Audio flottant en haut si un audio est sélectionné */}
          {playingAudio && (
            <AudioPlayer
              url={audioStreamUrl}
              title={playingAudio.original_filename}
              externalTime={externalTime}
              onTimeUpdate={(t) => {
                if (transcriptData?.raw_json?.segments) {
                  const seg = transcriptData.raw_json.segments.find(
                    (s) => t >= s.start && t <= s.end
                  );
                  if (seg) setActiveSegmentId(seg.id);
                }
              }}
            />
          )}

          {/* Éditeur de transcription si actif */}
          {activeAudio && transcriptData && (
            <TranscriptionPanel
              transcript={transcriptData}
              audioFilename={activeAudio.original_filename}
              activeSegmentId={activeSegmentId}
              onSegmentClick={(start) => {
                if (!playingAudio || playingAudio.id !== activeAudio.id) {
                  setPlayingAudio(activeAudio);
                }
                setExternalTime(start);
              }}
              onSaveTranscript={handleSaveTranscript}
              onShowHistory={handleOpenHistory}
              onGenerateDoc={() => setShowDocModal(true)}
            />
          )}

          {/* Grille principale : Upload + Audios (Gauche) / Glossaire (Droite) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
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
                onPlayAudio={(audio) => {
                  setPlayingAudio(audio);
                  handleSelectAudio(audio);
                }}
                onTranscribeAudio={handleTranscribe}
                onEditTranscript={handleSelectAudio}
                onDeleteAudio={handleDeleteAudio}
                onTranscribeAll={handleTranscribeAll}
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
        </PageContainer>
      </main>

      {/* Modale d'historique des versions */}
      <VersionHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        versions={versions}
        isLoading={versionsLoading}
        onRestore={handleRestoreVersion}
      />

      {/* Modale de génération de document */}
      <DocumentExportModal
        isOpen={showDocModal}
        onClose={() => setShowDocModal(false)}
        onSubmit={handleGenerateDoc}
        isLoading={docGenerating}
      />
    </div>
  );
}
