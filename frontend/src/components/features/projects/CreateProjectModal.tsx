"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(name.trim(), description.trim() || undefined);
      setName("");
      setDescription("");
      setError(null);
      onClose();
    } catch (err: any) {
      console.error("Erreur lors de la création du projet:", err);
      const detail = err.response?.data?.detail;
      const message =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ")
          : err.message || "Impossible de créer le projet. Vérifiez vos informations et réessayez.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Créer un nouveau projet"
      description="Organisez vos fichiers audio et vos transcriptions au même endroit."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 text-red-800 border border-red-200 p-3 rounded-xl text-xs sm:text-sm leading-relaxed">
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Nom du projet"
          placeholder="ex: Réunion stratégique Q3"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
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
            onChange={(e) => {
              setDescription(e.target.value);
              if (error) setError(null);
            }}
            rows={3}
            className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded-xl text-xs sm:text-sm focus:ring-1 focus:ring-gray-400 outline-none transition-all resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
          >
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
