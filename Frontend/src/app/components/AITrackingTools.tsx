"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaChartLine,
  FaRegNewspaper,
  FaRegFileAlt,
  FaRegUser,
  FaSearch,
  FaGavel,
  FaLeaf,
  FaArrowRight,
  FaClock,
} from "react-icons/fa";

interface TrackingTool {
  id: string;
  name: string;
  description: string;
  icon: JSX.Element;
  available: boolean;
  route?: string;
  status?: string;
}

interface AITrackingToolsProps {
  onToolSelect?: (toolId: string) => void;
}

const trackingTools: TrackingTool[] = [
  {
    id: "delta-detector",
    name: "Delta Detector",
    description:
      "Detect and analyze significant changes in financial data, portfolio metrics, and research signals.",
    icon: <FaChartLine className="text-2xl" />,
    available: true,
    route: "/tools/deltadetector",
  },
  {
    id: "sec-filing",
    name: "SEC Filing Parser",
    description:
      "Parse 10-K, 10-Q, and 8-K filings into structured sections and research-ready chunks.",
    icon: <FaSearch className="text-2xl" />,
    available: true,
    route: "/tools?tool=sec-filing",
  },
  {
    id: "corporate-events",
    name: "Corporate Events",
    description:
      "Analyze earnings calls, transcripts, sentiment, historical events, and bulk corporate data.",
    icon: <FaRegFileAlt className="text-2xl" />,
    available: true,
    route: "/tools?tool=corporate-events",
  },
  {
    id: "esg-metrics",
    name: "ESG Metrics & Developments",
    description:
      "Track environmental, social, and governance developments and research signals.",
    icon: <FaLeaf className="text-2xl" />,
    available: false,
    status: "Data integration pending",
  },
  {
    id: "nfp-economic-data",
    name: "NFP / Economic Data",
    description:
      "Track payroll, inflation, rates, employment, and other macroeconomic indicators.",
    icon: <FaRegNewspaper className="text-2xl" />,
    available: false,
    status: "Data integration pending",
  },
  {
    id: "insider-transactions",
    name: "Insider Transactions",
    description:
      "Monitor disclosed insider purchases, sales, and transaction patterns.",
    icon: <FaRegUser className="text-2xl" />,
    available: false,
    status: "Data integration pending",
  },
  {
    id: "regulation-compliance",
    name: "Regulation & Compliance",
    description:
      "Track regulatory developments, compliance requirements, and market-impacting legal changes.",
    icon: <FaGavel className="text-2xl" />,
    available: false,
    status: "Data integration pending",
  },
];

export default function AITrackingTools({ onToolSelect }: AITrackingToolsProps) {
  const router = useRouter();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const handleToolClick = (tool: TrackingTool) => {
    setSelectedTool(tool.id);
    onToolSelect?.(tool.id);

    if (tool.available && tool.route) {
      router.push(tool.route);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">
          AI-powered Tracking Tools
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-white/60">
          Research and monitoring tools designed to turn financial data into
          actionable signals.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {trackingTools.map((tool) => {
          const isSelected = selectedTool === tool.id;

          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => handleToolClick(tool)}
              className={`group relative rounded-xl border p-5 text-left transition-all duration-200 ${
                tool.available
                  ? isSelected
                    ? "border-blue-400/60 bg-blue-500/10 shadow-lg shadow-blue-900/10"
                    : "border-white/10 bg-white/[0.04] hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-white/[0.07]"
                  : "cursor-default border-white/5 bg-white/[0.025] opacity-75"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                    tool.available ? "bg-blue-500/15 text-blue-300" : "bg-white/5 text-white/40"
                  }`}
                >
                  {tool.icon}
                </div>

                {tool.available ? (
                  <FaArrowRight className="mt-1 text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-blue-300" />
                ) : (
                  <FaClock className="mt-1 text-white/30" />
                )}
              </div>

              <h3 className="mt-4 text-lg font-semibold text-white">
                {tool.name}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/60">
                {tool.description}
              </p>

              <div className="mt-4 flex items-center justify-between">
                {tool.available ? (
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                    Available
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
                    {tool.status ?? "Coming soon"}
                  </span>
                )}

                {isSelected && tool.available && (
                  <span className="text-xs text-blue-300">Opening…</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}