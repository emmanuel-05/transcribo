"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { Navbar } from "@/components/layout/Navbar";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProjectToolbar } from "@/components/features/projects/ProjectToolbar";
import { ProjectGrid } from "@/components/features/projects/ProjectGrid";
import { CreateProjectModal } from "@/components/features/projects/CreateProjectModal";
import { BatchDeleteModal } from "@/components/features/projects/BatchDeleteModal";
import { Pagination } from "@/components/ui/Pagination";
import { PROJECTS_PER_PAGE } from "@/constants/pagination";
import { ROUTES } from "@/constants/routes";

export default function DashboardView() {
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading: authLoading, fetchMe } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) {
      router.replace(ROUTES.LOGIN);
    }
  }, [mounted, authLoading, isAuthenticated, router]);

  const {
    projects,
    allFilteredCount,
    isLoading,
    isDeleting,
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
    deleteProject,
    batchDelete,
  } = useProjects();

  const handleCreateProject = async (name: string, description?: string) => {
    await createProject(name, description);
  };

  const handleConfirmBatchDelete = async () => {
    await batchDelete();
    setShowBatchDeleteModal(false);
  };

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" suppressHydrationWarning>
      {/* Navbar supérieure */}
      <Navbar user={user} onLogout={() => logout()} />

      {/* Barre d'outils / Sticky Header */}
      <StickyHeader>
        <PageContainer className="py-3 sm:py-4">
          <ProjectToolbar
            totalCount={allFilteredCount}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortOption={sortOption}
            onSortChange={setSortOption}
            selectedCount={selectedIds.length}
            isAllSelected={isAllCurrentPageSelected}
            hasProjects={projects.length > 0}
            onToggleSelectAll={toggleSelectAll}
            onOpenCreate={() => setShowCreateModal(true)}
            onOpenBatchDelete={() => setShowBatchDeleteModal(true)}
          />
        </PageContainer>
      </StickyHeader>

      {/* Contenu principal */}
      <main className="flex-1 flex flex-col py-6">
        <PageContainer className="flex-1 flex flex-col justify-between">
          <ProjectGrid
            projects={projects}
            isLoading={isLoading}
            searchQuery={searchQuery}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onOpenProject={(id) => router.push(ROUTES.PROJECT_DETAILS(id))}
            onDeleteProject={deleteProject}
            onClearSearch={() => setSearchQuery("")}
            onCreateNew={() => setShowCreateModal(true)}
          />

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={allFilteredCount}
            itemsPerPage={PROJECTS_PER_PAGE}
            onPageChange={setCurrentPage}
            className="mt-8"
          />
        </PageContainer>
      </main>

      {/* Modales de gestion de projets */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
      />

      <BatchDeleteModal
        isOpen={showBatchDeleteModal}
        onClose={() => setShowBatchDeleteModal(false)}
        count={selectedIds.length}
        onConfirm={handleConfirmBatchDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
