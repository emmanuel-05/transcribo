"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description?: string) => Promise<void>;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(name.trim(), description.trim() || undefined);
      setName("");
      setDescription("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Créer un nouveau projet"
      description="Organisez vos fichiers audio et vos transcriptions au même endroit."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nom du projet"
          placeholder="ex: Réunion stratégique Q3"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Description (optionnelle)
          </label>
          <textarea
            placeholder="Détails ou contexte du projet..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded-xl text-xs sm:text-sm focus:ring-1 focus:ring-gray-400 outline-none transition-all resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Créer le projet
          </Button>
        </div>
      </form>
    </Modal>
  );
}
