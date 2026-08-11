import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import api from "@/services/api";

interface GlossaryPanelProps {
  projectId: string;
  terms: string[];
  onUpdate: (newTerms: string[]) => void;
}

export default function GlossaryPanel({ projectId, terms, onUpdate }: GlossaryPanelProps) {
  const [newTerm, setNewTerm] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim() || terms.includes(newTerm.trim())) return;
    
    const updated = [...terms, newTerm.trim()];
    try {
      await api.put(`/projects/${projectId}/glossary`, { terms: updated });
      onUpdate(updated);
      setNewTerm("");
    } catch (err) {
      console.error("Erreur ajout glossaire", err);
    }
  };

  const handleRemove = async (termToRemove: string) => {
    const updated = terms.filter(t => t !== termToRemove);
    try {
      await api.put(`/projects/${projectId}/glossary`, { terms: updated });
      onUpdate(updated);
    } catch (err) {
      console.error("Erreur suppression glossaire", err);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded p-4 shadow-sm h-full">
      <h3 className="font-medium text-gray-900 mb-4">Glossaire du projet</h3>
      
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTerm}
          onChange={(e) => setNewTerm(e.target.value)}
          placeholder="Nouveau terme technique..."
          className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white text-gray-900"
        />
        <button
          type="submit"
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1.5 rounded transition-colors"
          title="Ajouter"
        >
          <Plus size={16} />
        </button>
      </form>
      
      <div className="flex flex-wrap gap-2">
        {terms.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Aucun terme défini.</p>
        ) : (
          terms.map((term, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-700 px-2 py-1 rounded text-sm"
            >
              {term}
              <button
                onClick={() => handleRemove(term)}
                className="text-gray-400 hover:text-gray-700 focus:outline-none transition-colors"
                title="Supprimer"
              >
                <X size={14} />
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}
