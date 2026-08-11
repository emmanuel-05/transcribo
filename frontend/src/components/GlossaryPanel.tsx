import React, { useState, useMemo, useRef } from "react";
import { Plus, X, Maximize2, Search, Upload, Trash2 } from "lucide-react";
import api from "@/services/api";

interface GlossaryPanelProps {
  projectId: string;
  terms: string[];
  onUpdate: (newTerms: string[]) => void;
}

export default function GlossaryPanel({ projectId, terms, onUpdate }: GlossaryPanelProps) {
  const [newTerm, setNewTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const newTermsFromCsv = text
        .split(/[\n,;]+/)
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const uniqueNewTerms = Array.from(new Set(newTermsFromCsv)).filter(t => !terms.includes(t));

      if (uniqueNewTerms.length === 0) {
        if (e.target) e.target.value = '';
        return;
      }

      const updated = [...terms, ...uniqueNewTerms];
      try {
        await api.put(`/projects/${projectId}/glossary`, { terms: updated });
        onUpdate(updated);
      } catch (err) {
        console.error("Erreur import CSV", err);
      } finally {
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsText(file);
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

  const handleSelectAll = () => {
    if (selectedTerms.length === terms.length) setSelectedTerms([]);
    else setSelectedTerms([...terms]);
  };

  const handleDeleteSelected = async () => {
    if (selectedTerms.length === 0) return;
    const updated = terms.filter(t => !selectedTerms.includes(t));
    try {
      await api.put(`/projects/${projectId}/glossary`, { terms: updated });
      onUpdate(updated);
      setSelectedTerms([]);
    } catch (err) {
      console.error("Erreur suppression groupée", err);
    }
  };

  const filteredTerms = useMemo(() => {
    return terms.filter(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [terms, searchQuery]);

  return (
    <>
      <div className="bg-white border border-gray-200 rounded p-4 shadow-sm h-full flex flex-col relative">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-gray-900">Glossaire</h3>
            {terms.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                  <input type="checkbox" checked={selectedTerms.length === terms.length && terms.length > 0} onChange={handleSelectAll} className="rounded border-gray-300" />
                  Tout
                </label>
                {selectedTerms.length > 0 && (
                  <button onClick={handleDeleteSelected} className="text-red-500 hover:text-red-700 transition-colors p-1" title="Supprimer la sélection">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
          {terms.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors px-2 py-1 border border-transparent hover:border-gray-200 rounded hover:bg-gray-50"
            >
              Voir tout <Maximize2 size={12} />
            </button>
          )}
        </div>
        
        <div className="flex gap-2 mb-4 shrink-0">
          <form onSubmit={handleAdd} className="flex flex-1 gap-2">
            <input
              type="text"
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              placeholder="Nouveau terme..."
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
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1.5 rounded transition-colors flex items-center gap-1"
            title="Uploader CSV"
          >
            <Upload size={16} /> <span className="text-xs font-medium hidden sm:inline">CSV</span>
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2 overflow-y-auto flex-1 content-start pb-8">
          {terms.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Aucun terme défini.</p>
          ) : (
            terms.map((term, idx) => (
              <label
                key={idx}
                className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-700 px-2 py-1 rounded text-sm h-fit cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <input 
                  type="checkbox" 
                  checked={selectedTerms.includes(term)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedTerms([...selectedTerms, term]);
                    else setSelectedTerms(selectedTerms.filter(t => t !== term));
                  }}
                  className="rounded border-gray-300 text-gray-800 focus:ring-gray-400"
                />
                {term}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); handleRemove(term); }}
                  className="text-gray-400 hover:text-red-500 focus:outline-none transition-colors ml-1"
                  title="Supprimer"
                >
                  <X size={14} />
                </button>
              </label>
            ))
          )}
        </div>
        
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Glossaire Complet</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un terme..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-400 bg-gray-50"
                />
              </div>
              <form onSubmit={handleAdd} className="flex gap-2">
                <input
                  type="text"
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  placeholder="Ajouter un terme..."
                  className="w-48 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
                />
                <button
                  type="submit"
                  className="bg-gray-800 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
                >
                  Ajouter
                </button>
              </form>
            </div>

            <div className="p-4 overflow-y-auto flex-1 flex flex-wrap gap-2 content-start bg-gray-50/50">
              {filteredTerms.length === 0 ? (
                <p className="text-sm text-gray-400 italic w-full text-center py-8">Aucun terme trouvé.</p>
              ) : (
                filteredTerms.map((term, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full text-sm shadow-sm"
                  >
                    {term}
                    <button
                      onClick={() => handleRemove(term)}
                      className="text-gray-400 hover:text-red-500 focus:outline-none transition-colors ml-1"
                      title="Supprimer"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
