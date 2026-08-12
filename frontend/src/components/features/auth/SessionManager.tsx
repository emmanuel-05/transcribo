"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useInactivityTimer } from "@/hooks/useInactivityTimer";
import { SessionWarningModal } from "./SessionWarningModal";

export function SessionManager() {
  const { isAuthenticated, logout, stayConnected } = useAuth();
  const [isStayingConnected, setIsStayingConnected] = useState(false);

  const { showWarning, remainingSeconds, resetTimer } = useInactivityTimer({
    isAuthenticated,
    onInactivityExpire: () => logout("inactivity"),
    onAbsoluteExpire: () => logout("expired"),
  });

  const handleStayConnected = async () => {
    setIsStayingConnected(true);
    try {
      await stayConnected();
      resetTimer();
    } finally {
      setIsStayingConnected(false);
    }
  };

  const handleManualLogout = () => {
    logout();
  };

  if (!isAuthenticated || !showWarning) {
    return null;
  }

  return (
    <SessionWarningModal
      isOpen={showWarning}
      remainingSeconds={remainingSeconds}
      isLoading={isStayingConnected}
      onStayConnected={handleStayConnected}
      onLogout={handleManualLogout}
    />
  );
}
