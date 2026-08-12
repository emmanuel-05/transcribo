"use client";

import React, { useState, useMemo, useRef } from "react";
import { Plus, X, Maximize2, Search, Upload, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export interface GlossaryPanelProps {
  terms: string[];
  onSaveTerms: (terms: string[]) => Promise<void>;
}

export function GlossaryPanel({ terms, onSaveTerms }: GlossaryPanelProps) {
  const [newTerm, setNewTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTerm.trim();
    if (!trimmed || terms.includes(trimmed)) return;

    const updated = [...terms, trimmed];
    await onSaveTerms(updated);
    setNewTerm("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const newTerms = text
        .split(/[\n,;]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const uniqueNewTerms = Array.from(new Set(newTerms)).filter((t) => !terms.includes(t));
      if (uniqueNewTerms.length === 0) return;

      const updated = [...terms, ...uniqueNewTerms];
      await onSaveTerms(updated);
      if (e.target) e.target.value = "";
    };
    reader.readAsText(file);
  };

  const handleRemove = async (termToRemove: string) => {
    const updated = terms.filter((t) => t !== termToRemove);
    await onSaveTerms(updated);
  };

  const handleSelectAll = () => {
    if (selectedTerms.length === terms.length) setSelectedTerms([]);
    else setSelectedTerms([...terms]);
  };

  const handleDeleteSelected = async () => {
    if (selectedTerms.length === 0) return;
    const updated = terms.filter((t) => !selectedTerms.includes(t));
    await onSaveTerms(updated);
    setSelectedTerms([]);
  };

  const filteredTerms = useMemo(() => {
    if (!searchQuery.trim()) return terms;
    return terms.filter((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [terms, searchQuery]);

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 h-full flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <BookOpen size={16} className="text-gray-600" />
              <span>Glossaire</span>
            </div>
            {terms.length > 0 && (
              <div className="flex items-center gap-1.5 ml-2">
                <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer hover:text-gray-800">
                  <input
                    type="checkbox"
                    checked={selectedTerms.length === terms.length && terms.length > 0}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Tout</span>
                </label>
                {selectedTerms.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Supprimer la sélection"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            )}
          </div>

          {terms.length > 0 && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span>Voir tout</span>
              <Maximize2 size={11} />
            </button>
          )}
        </div>

        {/* Formulaire ajout & Import CSV */}
        <div className="flex gap-2 mb-3 shrink-0">
          <form onSubmit={handleAdd} className="flex flex-1 gap-1.5">
            <input
              type="text"
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              placeholder="Nouveau terme..."
              className="flex-1 border border-gray-300 rounded-xl px-3 py-1.5 text-xs sm:text-sm bg-white text-gray-900 focus:ring-1 focus:ring-gray-400 outline-none"
            />
            <button
              type="submit"
              className="bg-gray-900 hover:bg-gray-800 text-white px-2.5 py-1.5 rounded-xl transition-colors shrink-0 shadow-xs"
              title="Ajouter au glossaire"
            >
              <Plus size={15} />
            </button>
          </form>

          <input
            type="file"
            accept=".csv,.txt"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1 text-xs font-medium shrink-0"
            title="Importer CSV / TXT"
          >
            <Upload size={14} />
            <span>CSV</span>
          </button>
        </div>

        {/* Liste des tags */}
        <div className="flex flex-wrap gap-1.5 overflow-y-auto flex-1 content-start pb-4">
          {terms.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-4 w-full text-center">
              Aucun terme défini pour ce projet.
            </p>
          ) : (
            terms.map((term, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-700 px-2.5 py-1 rounded-lg text-xs hover:bg-gray-100 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedTerms.includes(term)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedTerms([...selectedTerms, term]);
                    else setSelectedTerms(selectedTerms.filter((t) => t !== term));
                  }}
                  className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{term}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(term)}
                  className="text-gray-400 hover:text-red-500 ml-0.5"
                  title="Supprimer"
                >
                  <X size={12} />
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Modal Glossaire Complet */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Glossaire Complet du Projet"
        description="Recherchez et gérez tous les termes spécifiques à votre domaine."
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Filtrer les termes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl bg-gray-50 outline-none focus:bg-white focus:ring-1 focus:ring-gray-400"
            />
          </div>

          <div className="max-h-64 overflow-y-auto p-3 bg-gray-50/50 rounded-xl border border-gray-200 flex flex-wrap gap-2 content-start">
            {filteredTerms.length === 0 ? (
              <p className="text-xs text-gray-400 italic w-full text-center py-6">Aucun terme trouvé.</p>
            ) : (
              filteredTerms.map((term, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-800 px-3 py-1 rounded-full text-xs shadow-2xs"
                >
                  <span>{term}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(term)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
