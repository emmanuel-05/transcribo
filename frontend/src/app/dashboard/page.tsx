"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useProjectStore } from "@/store/projectStore";
import { useRouter } from "next/navigation";
import { Plus, Trash2, FolderOpen } from "lucide-react";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading, fetchMe, logout } = useAuthStore();
  const { projects, isLoading: projectsLoading, fetchProjects, createProject, deleteProject } = useProjectStore();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createProject(newName, newDesc);
    setNewName("");
    setNewDesc("");
    setShowCreate(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Supprimer le projet "${name}" ? Cette action est irréversible.`)) {
      await deleteProject(id);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500 text-sm">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-gray-900">Transcribo</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1 rounded transition-colors hover:bg-gray-100"
          >
            Déconnexion
          </button>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="max-w-5xl mx-auto p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-gray-900">Mes projets</h2>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-gray-800 text-white px-3 py-1.5 rounded text-sm flex items-center gap-2 hover:bg-gray-700 transition-colors"
          >
            <Plus size={16} /> Nouveau projet
          </button>
        </div>

        {/* Formulaire de création */}
        {showCreate && (
          <form onSubmit={handleCreate} className="bg-white p-5 rounded border border-gray-200 shadow-sm mb-6">
            <input
              type="text"
              placeholder="Nom du projet"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded mb-3 focus:ring-1 focus:ring-gray-400 outline-none text-sm"
              required
              autoFocus
            />
            <input
              type="text"
              placeholder="Description (optionnelle)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded mb-4 focus:ring-1 focus:ring-gray-400 outline-none text-sm"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-gray-800 text-white px-3 py-1.5 text-sm rounded hover:bg-gray-700 transition-colors"
              >
                Créer
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="bg-transparent border border-gray-300 text-gray-700 px-3 py-1.5 text-sm rounded hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        {/* Liste des projets */}
        {projectsLoading ? (
          <p className="text-gray-500 text-sm">Chargement des projets...</p>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FolderOpen size={40} className="mx-auto mb-3 text-gray-400" />
            <p className="text-sm">Aucun projet pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white p-5 rounded border border-gray-200 flex flex-col justify-between hover:shadow-md transition-shadow group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-gray-900">{project.name}</h3>
                    <FolderOpen size={16} className="text-gray-400" />
                  </div>
                  {project.description && (
                    <p className="text-gray-500 text-sm mt-1 truncate">{project.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-3">
                    Créé le {new Date(project.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="text-gray-600 hover:text-gray-900 text-sm px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                  >
                    Ouvrir
                  </button>
                  <button
                    onClick={() => handleDelete(project.id, project.name)}
                    className="text-gray-500 hover:text-red-600 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors ml-auto"
                    title="Supprimer"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}