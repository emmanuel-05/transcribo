"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erreur d'exécution capturée :", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white max-w-md w-full p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={24} />
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Une erreur inattendue est survenue
        </h2>

        <p className="text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed">
          {error?.message || "L'application a rencontré un problème lors du chargement de cette page."}
        </p>

        <div className="flex justify-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => reset()}
            leftIcon={<RotateCcw size={14} />}
          >
            Réessayer
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = "/dashboard")}
          >
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    </div>
  );
}
