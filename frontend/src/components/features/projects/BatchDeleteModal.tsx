"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export interface BatchDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  count: number;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export function BatchDeleteModal({
  isOpen,
  onClose,
  count,
  onConfirm,
  isLoading,
}: BatchDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="flex items-center gap-3 text-red-600 mb-3">
        <div className="p-2 rounded-xl bg-red-50">
          <AlertTriangle size={20} />
        </div>
        <h3 className="text-base font-semibold text-gray-900">
          Confirmer la suppression groupée
        </h3>
      </div>

      <p className="text-sm text-gray-600 mb-6 leading-relaxed">
        Êtes-vous sûr de vouloir supprimer définitivement les{" "}
        <span className="font-semibold text-gray-900">{count}</span> projets sélectionnés ?
        Tous les fichiers audio et transcriptions associés seront effacés. Cette action est
        irréversible.
      </p>

      <div className="flex justify-end gap-2.5">
        <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
          Annuler
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={onConfirm}
          isLoading={isLoading}
        >
          Supprimer définitivement
        </Button>
      </div>
    </Modal>
  );
}
