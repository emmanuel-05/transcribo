"use client";

import React from "react";
import { Loader2, History, RotateCcw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TranscriptVersion } from "@/types/transcript";
import { formatDateTime } from "@/utils/formatters";

export interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: TranscriptVersion[];
  isLoading: boolean;
  onRestore: (versionNumber: number) => Promise<void>;
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  versions,
  isLoading,
  onRestore,
}: VersionHistoryModalProps) {
  const [restoringNumber, setRestoringNumber] = React.useState<number | null>(null);

  const handleRestore = async (num: number) => {
    setRestoringNumber(num);
    try {
      await onRestore(num);
    } finally {
      setRestoringNumber(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <History size={18} className="text-gray-700" />
          <span>Historique des versions</span>
        </div>
      }
      description="Consultez et restaurez les versions antérieures de cette transcription."
      maxWidth="2xl"
    >
      <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
            <Loader2 size={20} className="animate-spin text-blue-600" />
            <span className="text-sm">Chargement de l'historique...</span>
          </div>
        ) : versions.length === 0 ? (
          <p className="text-center text-gray-500 py-8 text-sm">
            Aucune version antérieure disponible pour cet enregistrement.
          </p>
        ) : (
          versions.map((ver) => (
            <div
              key={ver.id}
              className="border border-gray-200 rounded-xl p-4 bg-gray-50/70 hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div>
                  <span className="font-semibold text-gray-900 text-sm">
                    Version {ver.version_number}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {formatDateTime(ver.created_at)}
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded ml-2">
                    {ver.source}
                  </span>
                </div>

                <Button
                  size="xs"
                  variant="primary"
                  onClick={() => handleRestore(ver.version_number)}
                  isLoading={restoringNumber === ver.version_number}
                  leftIcon={<RotateCcw size={12} />}
                >
                  Restaurer
                </Button>
              </div>

              <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs text-gray-700 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {ver.content}
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
