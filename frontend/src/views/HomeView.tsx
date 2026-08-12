"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants/routes";

export default function HomeView() {
  const router = useRouter();
  const { isAuthenticated, isLoading, fetchMe } = useAuth();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace(ROUTES.DASHBOARD);
      } else {
        router.replace(ROUTES.LOGIN);
      }
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex items-center gap-2.5 text-gray-500 text-sm">
        <Loader2 size={18} className="animate-spin text-gray-600" />
        <span>Chargement de Transcribo...</span>
      </div>
    </div>
  );
}
