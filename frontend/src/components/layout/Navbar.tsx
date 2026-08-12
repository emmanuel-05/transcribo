"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, LogOut } from "lucide-react";
import { User } from "@/types/auth";
import { ROUTES } from "@/constants/routes";

export interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  brandTitle?: string;
  leftContent?: React.ReactNode;
}

export function Navbar({
  user,
  onLogout,
  brandTitle = "Transcribo",
  leftContent,
}: NavbarProps) {
  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center z-30">
      <div className="flex items-center gap-3">
        {leftContent || (
          <Link
            href={ROUTES.DASHBOARD}
            className="text-lg font-semibold text-gray-900 tracking-tight hover:opacity-90 transition-opacity"
          >
            {brandTitle}
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {user?.is_admin && (
          <Link
            href={ROUTES.ADMIN}
            className="text-xs sm:text-sm text-gray-700 hover:text-gray-900 px-2.5 py-1 rounded-lg transition-colors hover:bg-gray-100 flex items-center gap-1.5 border border-gray-200"
          >
            <ShieldCheck size={15} />
            Administration
          </Link>
        )}

        <span className="text-gray-500 text-xs sm:text-sm hidden sm:inline">
          {user?.email}
        </span>

        <button
          type="button"
          onClick={onLogout}
          className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 px-2.5 py-1 rounded-lg transition-colors hover:bg-gray-100 flex items-center gap-1.5"
          title="Déconnexion"
        >
          <LogOut size={14} className="sm:hidden" />
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </nav>
  );
}
