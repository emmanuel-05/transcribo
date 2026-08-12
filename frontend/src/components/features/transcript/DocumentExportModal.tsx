"use client";

import React, { useState } from "react";
import { FileText } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DocumentGenerationParams } from "@/types/transcript";

export interface DocumentExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: DocumentGenerationParams) => Promise<void>;
  isLoading: boolean;
}

export function DocumentExportModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: DocumentExportModalProps) {
  const [expediteur, setExpediteur] = useState("");
  const [destinataire, setDestinataire] = useState("");
  const [objet, setObjet] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      expediteur: expediteur.trim(),
      destinataire: destinataire.trim(),
      objet: objet.trim(),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-gray-700" />
          <span>Générer un document officiel (DOCX)</span>
        </div>
      }
      description="Renseignez les en-têtes pour formater automatiquement la transcription en document professionnel."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Expéditeur"
          placeholder="ex: Dr. Dupont / Cabinet Conseil"
          value={expediteur}
          onChange={(e) => setExpediteur(e.target.value)}
          required
          autoFocus
        />

        <Input
          label="Destinataire"
          placeholder="ex: M. le Directeur Général"
          value={destinataire}
          onChange={(e) => setDestinataire(e.target.value)}
          required
        />

        <Input
          label="Objet"
          placeholder="ex: Compte-rendu de séance du 12/08/2026"
          value={objet}
          onChange={(e) => setObjet(e.target.value)}
          required
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            Générer et télécharger
          </Button>
        </div>
      </form>
    </Modal>
  );
}
