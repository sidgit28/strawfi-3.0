"use client";

import PersonaSelector from "../components/PersonaSelector";
import Header from "../components/Header";

export default function ModelsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header
        showBackButton
        backUrl="/"
        backText="Back to Home"
      />

      <main className="container mx-auto px-4 pb-12 pt-24">
        <PersonaSelector />
      </main>
    </div>
  );
}