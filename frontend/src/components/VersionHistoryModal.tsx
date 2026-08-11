import React from "react";
import { Loader2 } from "lucide-react";
import api from "@/services/api";

interface Version {
  id: string;
  version_number: number;
  source: string;
  content: string;
  created_at: string;
}

interface VersionHistoryModalProps {
  projectId: string;
  audioId: string;
  versions: Version[];
  versionsLoading: boolean;
  onClose: () => void;
  onRestore: (newCorrectedText: string) => void;
}

export default function VersionHistoryModal({
  projectId,
  audioId,
  versions,
  versionsLoading,
  onClose,
  onRestore
}: VersionHistoryModalProps) {

  const handleRestore = async (versionId: string) => {
    try {
      const res = await api.post(`/projects/${projectId}/audios/${audioId}/transcript/restore/${versionId}`);
      onRestore(res.data.corrected_text);
    } catch (err) {
      console.error("Erreur lors de la restauration", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded w-full max-w-4xl h-[80vh] flex flex-col shadow-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t">
          <h2 className="text-lg font-medium text-gray-900">Historique des versions</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 font-bold px-2 py-1 transition-colors focus:outline-none"
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {versionsLoading ? (
            <div className="flex items-center justify-center h-full text-gray-500 gap-2">
              <Loader2 size={24} className="animate-spin" />
              <span>Chargement...</span>
            </div>
          ) : versions.length === 0 ? (
            <p className="text-center text-gray-500 mt-10">Aucune version antérieure disponible.</p>
          ) : (
            <div className="space-y-6">
              {versions.map((ver) => (
                <div key={ver.id} className="border border-gray-200 rounded p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="font-semibold text-gray-800">Version {ver.version_number}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({new Date(ver.created_at).toLocaleString("fr-FR")}) - Source: <span className="uppercase text-xs font-mono bg-gray-200 px-1 rounded">{ver.source}</span>
                      </span>
                    </div>
                    <button
                      onClick={() => handleRestore(ver.id)}
                      className="bg-gray-800 text-white px-3 py-1.5 text-sm rounded hover:bg-gray-700 transition-colors"
                    >
                      Restaurer cette version
                    </button>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200 text-sm text-gray-700 max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {ver.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
