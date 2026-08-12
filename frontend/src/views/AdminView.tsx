"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, UserPlus, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { Navbar } from "@/components/layout/Navbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";

export default function AdminView() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, fetchMe, logout } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace(ROUTES.LOGIN);
      } else if (!user?.is_admin) {
        router.replace(ROUTES.DASHBOARD);
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await authService.register({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
      });

      setSuccessMessage(`Le compte pour ${email} a été créé avec succès.`);
      setFullName("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || "Une erreur est survenue lors de la création de l'utilisateur."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !isAuthenticated || !user?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Chargement de l'administration...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        user={user}
        onLogout={() => logout()}
        leftContent={
          <div className="flex items-center gap-3">
            <Link
              href={ROUTES.DASHBOARD}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-1.5 text-xs sm:text-sm transition-colors py-1 px-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft size={15} />
              <span>Projets</span>
            </Link>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-1.5 text-gray-900 font-semibold text-xs sm:text-sm">
              <ShieldCheck size={16} className="text-gray-700" />
              <span>Administration</span>
            </div>
          </div>
        }
      />

      <main className="flex-1 py-8">
        <PageContainer maxWidth="md">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Créer un compte utilisateur
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Seuls les administrateurs peuvent inscrire de nouveaux utilisateurs sur la plateforme.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            {successMessage && (
              <div className="flex items-start gap-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 p-3.5 rounded-xl text-xs sm:text-sm">
                <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-start gap-2.5 bg-red-50 text-red-800 border border-red-200/80 p-3.5 rounded-xl text-xs sm:text-sm">
                <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nom complet"
                type="text"
                placeholder="ex. Jean Dupont"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                label="Adresse email"
                type="email"
                placeholder="utilisateur@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Input
                label="Mot de passe temporaire"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isSubmitting}
                leftIcon={<UserPlus size={16} />}
              >
                Créer le compte
              </Button>
            </form>
          </div>
        </PageContainer>
      </main>
    </div>
  );
}
