"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  useEffect(() => {
    async function testConnection() {
      console.log("🔄 Starte Supabase-Test...");

      const { data, error } = await supabase
        .from("salons")
        .select("*")
        .limit(1);

      if (error) {
        console.error("❌ Supabase Fehler:", error);
      } else {
        console.log("✅ Verbindung erfolgreich!");
        console.log(data);
      }
    }

    testConnection();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold">
        Walkinly verbindet sich mit Supabase...
      </h1>
    </main>
  );
}