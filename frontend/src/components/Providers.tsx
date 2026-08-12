"use client";

import React from "react";
import { Toaster } from "react-hot-toast";
import { SessionManager } from "@/components/features/auth/SessionManager";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster position="top-right" />
      <SessionManager />
      {children}
    </>
  );
}
