"use client";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur de connexion");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded border border-gray-200 w-full max-w-md shadow-sm">
        <h1 className="text-xl text-gray-900 font-semibold mb-6 text-center">Connexion Transcribo</h1>
        {error && <div className="bg-gray-100 text-gray-700 border border-gray-300 p-3 rounded mb-4 text-sm">{error}</div>}
        <input
          type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded mb-4 focus:ring-1 focus:ring-gray-400 outline-none transition-all" required
        />
        <input
          type="password" placeholder="Mot de passe" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded mb-6 focus:ring-1 focus:ring-gray-400 outline-none transition-all" required
        />
        <button type="submit" className="w-full bg-gray-800 text-white p-2 rounded hover:bg-gray-700 font-medium transition-colors">
          Se connecter
        </button>
      </form>
    </div>
  );
}