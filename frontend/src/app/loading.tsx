import React from "react";
import { Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/70 p-4">
      <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm animate-in fade-in zoom-in-95 duration-200">
        <Loader2 size={24} className="animate-spin text-gray-900" />
        <p className="text-xs sm:text-sm font-medium text-gray-600">Chargement en cours...</p>
      </div>
    </div>
  );
}
