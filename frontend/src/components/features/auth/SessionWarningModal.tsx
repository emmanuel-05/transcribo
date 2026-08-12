"use client";

import React from "react";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export interface SessionWarningModalProps {
  isOpen: boolean;
  remainingSeconds: number;
  isLoading: boolean;
  onStayConnected: () => void;
  onLogout: () => void;
}

export function SessionWarningModal({
  isOpen,
  remainingSeconds,
  isLoading,
  onStayConnected,
  onLogout,
}: SessionWarningModalProps) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedCountdown = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return (
    <Modal isOpen={isOpen} onClose={() => {}} maxWidth="md">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
          <Clock size={22} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Session bientôt expirée
          </h3>
          <p className="text-xs text-gray-500">Inactivité détectée</p>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
        Pour des raisons de sécurité, votre session va expirer pour inactivité dans :
      </p>

      {/* Compte à rebours */}
      <div className="flex items-center justify-center py-3 bg-amber-50/80 rounded-xl border border-amber-200/80 mb-5">
        <span className="text-2xl font-bold text-amber-700 tracking-wider font-mono">
          {formattedCountdown}
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-6">
        Cliquez sur <strong>Rester connecté</strong> pour prolonger votre session et poursuivre votre travail.
      </p>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <Button
          variant="blue"
          size="sm"
          onClick={onStayConnected}
          isLoading={isLoading}
          className="flex-1"
          leftIcon={<RefreshCw size={14} />}
        >
          Rester connecté
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          leftIcon={<LogOut size={14} />}
        >
          Se déconnecter
        </Button>
      </div>
    </Modal>
  );
}
