"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FaArrowRight,
  FaCalculator,
  FaRobot,
} from "react-icons/fa";
import Header from "../../../components/Header";

function formatLabel(value: string) {
  return String(value || "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AnalysisToolsPage() {
  const params = useParams<{
    personaId: string;
    sectorId: string;
  }>();

  const personaId = String(
    params?.personaId || ""
  ).trim();

  const sectorId = String(
    params?.sectorId || ""
  ).trim();

  const persona = formatLabel(
    personaId || "Investor"
  );

  const sector = formatLabel(
    sectorId || "Sector"
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Header
        showBackButton
        backUrl={
          personaId
            ? `/sector/${personaId}`
            : "/"
        }
        backText="Back to Sector"
      />

      <main className="container mx-auto px-4 pb-16 pt-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-medium text-blue-300">
              {persona} • {sector}
            </p>

            <h1 className="text-4xl font-bold">
              Choose Your Analysis Tool
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-gray-400">
              Choose how you want to analyse your selected
              sector. StrawFi will personalise the experience
              using your investment style and sector.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Link
              href={
                personaId && sectorId
                  ? `/models/${personaId}/${sectorId}`
                  : "#"
              }
              className={`group ${
                !personaId || !sectorId
                  ? "pointer-events-none opacity-50"
                  : ""
              }`}
            >
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-8 transition hover:border-blue-400/40 hover:bg-white/[0.08]">
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
                    <FaCalculator className="text-2xl" />
                  </div>

                  <FaArrowRight className="text-xl text-gray-500 transition group-hover:translate-x-1 group-hover:text-white" />
                </div>

                <h2 className="text-2xl font-semibold">
                  Build Financial Models
                </h2>

                <p className="mt-4 leading-7 text-gray-400">
                  Build a personalised DCF valuation model using
                  assumptions tailored to your investment style
                  and selected sector.
                </p>

                <div className="mt-6 text-sm font-medium text-blue-300">
                  Open Financial Model →
                </div>
              </div>
            </Link>

            <Link
              href={
                personaId && sectorId
                  ? `/chatbot/${personaId}/${sectorId}`
                  : "#"
              }
              className={`group ${
                !personaId || !sectorId
                  ? "pointer-events-none opacity-50"
                  : ""
              }`}
            >
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-8 transition hover:border-purple-400/40 hover:bg-white/[0.08]">
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-500/10 text-purple-300">
                    <FaRobot className="text-2xl" />
                  </div>

                  <FaArrowRight className="text-xl text-gray-500 transition group-hover:translate-x-1 group-hover:text-white" />
                </div>

                <h2 className="text-2xl font-semibold">
                  Sector-Specific Chatbot
                </h2>

                <p className="mt-4 leading-7 text-gray-400">
                  Ask FinBot about financial concepts, valuation,
                  risk, research and your selected investment
                  approach.
                </p>

                <div className="mt-6 text-sm font-medium text-purple-300">
                  Open FinBot →
                </div>
              </div>
            </Link>
          </div>

          <div className="mt-8 rounded-xl border border-blue-400/10 bg-blue-500/[0.04] p-5">
            <p className="text-sm text-gray-400">
              Your current setup:
              <span className="ml-2 font-medium text-white">
                {persona}
              </span>
              <span className="mx-2 text-gray-600">
                •
              </span>
              <span className="font-medium text-white">
                {sector}
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}