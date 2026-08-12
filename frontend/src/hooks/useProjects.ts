/**
 * Custom Hook pour la gestion complète de la liste des projets (recherche, tri, pagination, sélection groupée).
 */
import { useState, useMemo, useEffect, useCallback } from "react";
import { useProjectStore } from "@/store/projectStore";
import { Project, SortOption } from "@/types/project";
import { PROJECTS_PER_PAGE } from "@/constants/pagination";

export function useProjects() {
  const { projects, isLoading, error, fetchProjects, createProject, deleteProject } =
    useProjectStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("date_desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);

  // Charger les projets au montage
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Filtrage et Tri combinés
  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects];

    // 1. Filtrage par recherche
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // 2. Tri
    result.sort((a, b) => {
      switch (sortOption) {
        case "date_desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "date_asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name_asc":
          return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
        case "name_desc":
          return b.name.localeCompare(a.name, "fr", { sensitivity: "base" });
        default:
          return 0;
      }
    });

    return result;
  }, [projects, searchQuery, sortOption]);

  // Réinitialiser la page si la recherche ou le tri change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOption]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedProjects.length / PROJECTS_PER_PAGE)
  );

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * PROJECTS_PER_PAGE;
    return filteredAndSortedProjects.slice(startIndex, startIndex + PROJECTS_PER_PAGE);
  }, [filteredAndSortedProjects, currentPage]);

  // Sélection individuelle
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  // Vérifier si toute la page actuelle est sélectionnée
  const isAllCurrentPageSelected =
    paginatedProjects.length > 0 &&
    paginatedProjects.every((p) => selectedIds.includes(p.id));

  // Sélection / Désélection globale sur la page courante
  const toggleSelectAll = useCallback(() => {
    if (isAllCurrentPageSelected) {
      const currentPageIds = new Set(paginatedProjects.map((p) => p.id));
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...paginatedProjects.map((p) => p.id)]);
      setSelectedIds(Array.from(newIds));
    }
  }, [isAllCurrentPageSelected, paginatedProjects, selectedIds]);

  // Suppression d'un projet
  const handleDelete = useCallback(
    async (id: string, name: string) => {
      if (confirm(`Supprimer le projet "${name}" ? Cette action est irréversible.`)) {
        await deleteProject(id);
        setSelectedIds((prev) => prev.filter((item) => item !== id));
      }
    },
    [deleteProject]
  );

  // Suppression groupée
  const handleBatchDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteProject(id)));
      setSelectedIds([]);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedIds, deleteProject]);

  return {
    projects: paginatedProjects,
    allFilteredCount: filteredAndSortedProjects.length,
    rawCount: projects.length,
    isLoading,
    isDeleting,
    error,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    isAllCurrentPageSelected,
    currentPage,
    setCurrentPage,
    totalPages,
    createProject,
    deleteProject: handleDelete,
    batchDelete: handleBatchDelete,
    refetch: fetchProjects,
  };
}
