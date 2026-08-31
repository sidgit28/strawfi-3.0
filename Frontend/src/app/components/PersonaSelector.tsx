"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedSection } from "./AnimatedSection";
import { FaCheckCircle, FaSpinner } from "react-icons/fa";

type PersonaId =
  | "traditionalist"
  | "innovator"
  | "adventurer"
  | "athlete"
  | "artist"
  | "environmentalist";

const personas: {
  id: PersonaId;
  name: string;
  description: string;
  icon: string;
  color: string;
  traits: string[];
}[] = [
  {
    id: "traditionalist",
    name: "Traditionalist",
    description:
      "Prefer proven strategies and stable, long-term investments. You value consistency, reliability, and disciplined valuation.",
    icon: "🏛️",
    color: "from-green-500 to-emerald-500",
    traits: ["Disciplined", "Patient", "Value-focused"],
  },
  {
    id: "innovator",
    name: "Innovator",
    description:
      "Focus on emerging markets, disruptive technologies, and strong long-term growth opportunities.",
    icon: "🚀",
    color: "from-blue-500 to-cyan-500",
    traits: ["Forward-thinking", "Tech-savvy", "Growth-focused"],
  },
  {
    id: "adventurer",
    name: "Adventurer",
    description:
      "Willing to explore unconventional opportunities and accept greater volatility for potentially higher returns.",
    icon: "🏃",
    color: "from-orange-500 to-red-500",
    traits: ["Risk-tolerant", "Adaptable", "Opportunity-seeker"],
  },
  {
    id: "athlete",
    name: "Athlete",
    description:
      "Performance-driven and disciplined, with strong emphasis on measurable targets and operating efficiency.",
    icon: "🏆",
    color: "from-purple-500 to-indigo-500",
    traits: ["Goal-oriented", "Competitive", "Consistent"],
  },
  {
    id: "artist",
    name: "Artist",
    description:
      "Approach investments creatively, searching for differentiated business models and overlooked growth opportunities.",
    icon: "🎨",
    color: "from-pink-500 to-rose-500",
    traits: ["Creative", "Intuitive", "Differentiated"],
  },
  {
    id: "environmentalist",
    name: "Environmentalist",
    description:
      "Prioritize sustainable growth, resilience, responsible capital allocation, and long-term impact.",
    icon: "🌍",
    color: "from-emerald-500 to-teal-500",
    traits: ["Responsible", "Patient", "Impact-focused"],
  },
];

export default function PersonaSelector() {
  const router = useRouter();

  const [selectedPersona, setSelectedPersona] =
    useState<PersonaId | null>(null);

  const [isSavingPersona, setIsSavingPersona] =
    useState(false);

  const handlePersonaSelect = async (
    personaId: PersonaId
  ) => {
    const persona = personas.find(
      (item) => item.id === personaId
    );

    if (!persona) return;

    setSelectedPersona(personaId);
    setIsSavingPersona(true);

    try {
      // Keep the selected persona available to the rest
      // of StrawFi.
      localStorage.setItem(
        "strawfi_selected_persona",
        personaId
      );

      // Save to the backend if available.
      try {
        await fetch("/api/persona", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            persona: personaId,
          }),
        });
      } catch (error) {
        console.warn(
          "Persona API unavailable; continuing locally:",
          error
        );
      }

      /*
       * IMPORTANT:
       * Do NOT open the financial model here.
       *
       * The correct flow is:
       *
       * Persona
       *   ↓
       * Sector
       *   ↓
       * Analysis Tool
       */
      router.push(`/sector/${personaId}`);
    } catch (error) {
      console.error(
        "Unable to save persona:",
        error
      );
    } finally {
      setIsSavingPersona(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* INTRO */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">
          Choose Your Investment Style
        </h2>

        <p className="mx-auto mt-3 max-w-3xl text-sm text-white/60">
          Select the investment style that best matches your
          approach. StrawFi will personalize the next steps
          around your choice.
        </p>
      </div>

      {/* PERSONA CARDS */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {personas.map((persona, index) => (
          <AnimatedSection
            key={persona.id}
            delay={index * 0.05}
            animation="slide"
          >
            <button
              type="button"
              disabled={isSavingPersona}
              onClick={() =>
                handlePersonaSelect(persona.id)
              }
              className={`h-full w-full rounded-xl border-2 p-6 text-left transition-all ${
                selectedPersona === persona.id
                  ? "border-blue-400 bg-white/10 shadow-lg shadow-blue-900/20"
                  : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]"
              } ${
                isSavingPersona
                  ? "cursor-wait opacity-80"
                  : "cursor-pointer"
              }`}
            >
              <div className="flex items-center">
                <div className="text-4xl">
                  {persona.icon}
                </div>

                <h3 className="ml-3 text-xl font-semibold text-white">
                  {persona.name}
                </h3>

                {selectedPersona ===
                  persona.id && (
                  <>
                    {isSavingPersona ? (
                      <FaSpinner className="ml-auto animate-spin text-blue-400" />
                    ) : (
                      <FaCheckCircle className="ml-auto text-blue-400" />
                    )}
                  </>
                )}
              </div>

              <p className="mt-4 text-sm leading-6 text-white/60">
                {persona.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {persona.traits.map((trait) => (
                  <span
                    key={trait}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70"
                  >
                    {trait}
                  </span>
                ))}
              </div>

              <div
                className={`mt-5 h-1 w-full rounded-full bg-gradient-to-r ${persona.color}`}
              />
            </button>
          </AnimatedSection>
        ))}
      </div>
    </div>
  );
}