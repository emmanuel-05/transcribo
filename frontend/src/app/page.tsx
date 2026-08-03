"use client";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Home() {
  const [message, setMessage] = useState("");

  // appel serveur backend pour récupérer le message
  useEffect(() => {
    axios.get("http://localhost:8000/api/v1/hello") // Envoie la demande
      .then(res => setMessage(res.data.message)) // si la demande est réussie, on met à jour le message
      .catch(err => setMessage("Erreur: " + err.message)); // si la demande échoue, on met à jour le message avec l'erreur
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Transcribo</h1>
      <p>Backend dit : {message || "Chargement..."}</p>
    </main>
  );
}