"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Info, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading, fetchMe } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sessionMessage, setSessionMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const reason = searchParams.get("reason");
    const expired = searchParams.get("expired");

    if (reason === "inactivity") {
      setSessionMessage("Vous avez été déconnecté suite à une inactivité de 30 minutes.");
    } else if (reason === "expired" || reason === "absolute") {
      setSessionMessage(
        "Votre session de 7 jours a expiré. Veuillez vous reconnecter pour des raisons de sécurité."
      );
    } else if (expired === "1") {
      setSessionMessage("Votre session a expiré. Veuillez vous reconnecter.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSessionMessage("");
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.push(ROUTES.DASHBOARD);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Erreur de connexion au serveur");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl border border-gray-200 w-full max-w-md shadow-sm space-y-4"
      >
        <h1 className="text-xl text-gray-900 font-semibold text-center mb-2">
          Connexion Transcribo
        </h1>

        {sessionMessage && (
          <div className="flex items-start gap-2.5 bg-amber-50 text-amber-800 border border-amber-200/80 p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed">
            <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <span>{sessionMessage}</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 text-red-800 border border-red-200 p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed">
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Adresse email"
          type="email"
          placeholder="nom@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <Input
          label="Mot de passe"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full mt-2"
          isLoading={isSubmitting}
        >
          Se connecter
        </Button>
      </form>
    </div>
  );
}

export default function LoginView() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">
          Chargement...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
