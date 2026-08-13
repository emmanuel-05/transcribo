import React from "react";
import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white max-w-md w-full p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center mx-auto mb-4">
          <FileQuestion size={24} />
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">Page introuvable (404)</h1>

        <p className="text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        <Link
          href={ROUTES.HOME}
          className="inline-flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-xs"
        >
          <ArrowLeft size={14} />
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
