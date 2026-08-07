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
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Transcribo</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="bg-gray-200 px-4 py-1 rounded text-sm hover:bg-gray-300"
          >
            Déconnexion
          </button>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Mes projets</h2>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={18} /> Nouveau projet
          </button>
        </div>

        {/* Formulaire de création */}
        {showCreate && (
          <form onSubmit={handleCreate} className="bg-white p-6 rounded-lg shadow mb-6">
            <input
              type="text"
              placeholder="Nom du projet"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border p-2 rounded mb-3"
              required
              autoFocus
            />
            <input
              type="text"
              placeholder="Description (optionnelle)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full border p-2 rounded mb-4"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Créer
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        {/* Liste des projets */}
        {projectsLoading ? (
          <p className="text-gray-500">Chargement des projets...</p>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
            <p>Aucun projet pour le moment.</p>
            <p className="text-sm">Créez votre premier projet pour commencer.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white p-5 rounded-lg shadow-sm flex justify-between items-center hover:shadow-md transition-shadow"
              >
                <div>
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  {project.description && (
                    <p className="text-gray-500 text-sm">{project.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Créé le {new Date(project.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Ouvrir"
                  >
                    <FolderOpen size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id, project.name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
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