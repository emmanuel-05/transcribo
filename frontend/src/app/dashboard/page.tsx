"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import api from "@/services/api";

interface Project {
  id: string;
  name: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, fetchMe, logout } = useAuthStore();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      api.get("/projects/")
        .then(res => setProjects(res.data))
        .catch(() => setProjects([]));
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barre de navigation */}
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Transcribo</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
          >
            Déconnexion
          </button>
        </div>
      </nav>

      {/* Contenu */}
      <main className="p-8">
        <h2 className="text-2xl font-bold mb-6">Mes projets</h2>
        {projects.length === 0 ? (
          <p className="text-gray-500">Aucun projet pour le moment.</p>
        ) : (
          <ul className="space-y-3">
            {projects.map((project) => (
              <li key={project.id} className="bg-white p-4 rounded shadow-sm">
                {project.name}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}