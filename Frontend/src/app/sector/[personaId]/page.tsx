"use client";

import { useParams, useRouter } from "next/navigation";
import {
  FaArrowRight,
  FaChartLine,
  FaCoins,
  FaHeartbeat,
  FaBolt,
  FaShoppingBag,
  FaIndustry,
} from "react-icons/fa";
import Header from "../../components/Header";

const sectors = [
  {
    id: "technology",
    name: "Technology",
    description:
      "Software, semiconductors, cloud, AI and technology-enabled businesses.",
    icon: <FaChartLine />,
  },
  {
    id: "fintech",
    name: "Fintech",
    description:
      "Digital payments, financial technology, banking platforms and related services.",
    icon: <FaCoins />,
  },
  {
    id: "healthcare",
    name: "Healthcare",
    description:
      "Healthcare providers, pharmaceuticals, medical technology and life sciences.",
    icon: <FaHeartbeat />,
  },
  {
    id: "energy",
    name: "Energy",
    description:
      "Oil, gas, renewables, utilities and energy infrastructure.",
    icon: <FaBolt />,
  },
  {
    id: "consumer",
    name: "Consumer",
    description:
      "Consumer goods, retail, e-commerce and consumer services.",
    icon: <FaShoppingBag />,
  },
  {
    id: "industrials",
    name: "Industrials",
    description:
      "Manufacturing, infrastructure, engineering, logistics and industrial services.",
    icon: <FaIndustry />,
  },
];

function formatLabel(value: string) {
  return String(value || "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function SectorPage() {
  const router = useRouter();
  const params = useParams<{ personaId: string }>();

  const personaId = String(params?.personaId || "").trim();

  const personaName = formatLabel(
    personaId || "Investor"
  );

  const handleSectorSelect = (sectorId: string) => {
    if (!personaId) {
      console.error(
        "StrawFi: personaId is missing from sector route."
      );
      return;
    }

    router.push(
      `/options/${personaId}/${sectorId}`
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header
        showBackButton
        backUrl="/"
        backText="Back to Investment Style"
      />

      <main className="container mx-auto px-4 pb-16 pt-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-sm font-medium text-blue-300">
              Investment Style: {personaName}
            </p>

            <h1 className="text-4xl font-bold">
              Choose Your Investment Sector
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-gray-400">
              Select the sector you want to analyse. StrawFi
              will use your investment style and sector
              together to personalize your analysis tools.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sectors.map((sector) => (
              <button
                key={sector.id}
                type="button"
                onClick={() =>
                  handleSectorSelect(sector.id)
                }
                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left transition hover:border-blue-400/40 hover:bg-white/[0.08]"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-xl text-blue-300">
                    {sector.icon}
                  </div>

                  <FaArrowRight className="text-gray-500 transition group-hover:text-white" />
                </div>

                <h2 className="text-xl font-semibold">
                  {sector.name}
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-400">
                  {sector.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}