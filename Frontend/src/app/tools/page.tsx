"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";

import {
  FaChartLine,
  FaFileAlt,
  FaArrowLeft,
  FaRegBuilding,
  FaRegNewspaper,
  FaRegUser,
  FaLeaf,
  FaGavel,
} from "react-icons/fa";

import { useRouter, useSearchParams } from "next/navigation";

import SecFilingParser from "../components/SecFilingParser";
import DeltaDetectionUI from "../components/deltadetector";
import CorporateEvents from "../components/CorporateEvents";
import ESGMetricsTracker from "../components/ESGMetricsTracker";
import EconomicDataTracker from "../components/EconomicDataTracker";
import InsiderTransactionsTracker from "../components/InsiderTransactionsTracker";
import RegulationComplianceTracker from "../components/RegulationComplianceTracker";
import Header from "../components/Header";

type ToolId =
  | "delta-detector"
  | "sec-filing"
  | "corporate-events"
  | "esg-metrics"
  | "nfp-economic-data"
  | "insider-transactions"
  | "regulation-compliance";

type ToolComponent = ComponentType;

type Tool = {
  id: ToolId;
  name: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  component: ToolComponent;
  available: boolean;
};

export default function ToolsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTool, setActiveTool] =
    useState<ToolId | null>(null);

  /*
   * Single source of truth for the seven AI tracking tools.
   */
  const tools = useMemo<Tool[]>(
    () => [
      {
        id: "delta-detector",
        name: "Delta Detector",
        description:
          "Detect and analyze significant changes in financial data, portfolio metrics, and research signals.",
        icon: FaChartLine,
        component: DeltaDetectionUI,
        available: true,
      },

      {
        id: "sec-filing",
        name: "SEC Filing Parser",
        description:
          "Parse 10-K, 10-Q, and 8-K filings into structured financial research.",
        icon: FaFileAlt,
        component: SecFilingParser,
        available: true,
      },

      {
        id: "corporate-events",
        name: "Corporate Events",
        description:
          "Analyze earnings calls, transcripts, sentiment, historical events, and bulk corporate data.",
        icon: FaRegBuilding,
        component: CorporateEvents,
        available: true,
      },

      {
        id: "esg-metrics",
        name: "ESG Metrics & Developments",
        description:
          "Track environmental, social, and governance developments, disclosures, risks, and research signals.",
        icon: FaLeaf,
        component: ESGMetricsTracker,
        available: true,
      },

      {
        id: "nfp-economic-data",
        name: "NFP / Economic Data",
        description:
          "Track payroll, inflation, employment, rates, and other macroeconomic indicators.",
        icon: FaRegNewspaper,
        component: EconomicDataTracker,
        available: true,
      },

      {
        id: "insider-transactions",
        name: "Insider Transactions",
        description:
          "Monitor disclosed insider purchases, sales, and transaction patterns.",
        icon: FaRegUser,
        component: InsiderTransactionsTracker,
        available: true,
      },

      {
        id: "regulation-compliance",
        name: "Regulation & Compliance",
        description:
          "Track regulatory developments, compliance requirements, and market-impacting legal changes.",
        icon: FaGavel,
        component: RegulationComplianceTracker,
        available: true,
      },
    ],
    []
  );

  /*
   * Keep the active tool synchronized with ?tool=
   */
  useEffect(() => {
    const queryTool =
      searchParams.get("tool");

    if (
      queryTool &&
      tools.some(
        (tool) => tool.id === queryTool
      )
    ) {
      setActiveTool(
        queryTool as ToolId
      );
    } else if (!queryTool) {
      setActiveTool(null);
    }
  }, [searchParams, tools]);

  const currentTool = tools.find(
    (tool) => tool.id === activeTool
  );

  const CurrentToolComponent =
    currentTool?.component;

  const openTool = (toolId: ToolId) => {
    setActiveTool(toolId);

    router.replace(
      `/tools?tool=${toolId}`,
      {
        scroll: false,
      }
    );
  };

  const closeTool = () => {
    setActiveTool(null);

    router.replace("/tools", {
      scroll: false,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header
        showBackButton
        backUrl="/"
        backText="Back to Home"
      />

      <main className="container mx-auto px-4 pb-12 pt-24">
        {/* Page heading */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold">
            AI-powered Tracking Tools
          </h1>

          <p className="mt-3 max-w-3xl text-gray-400">
            Advanced research and monitoring
            workflows for financial analysis.
          </p>
        </div>

        {/* Tool selection */}
        {!currentTool ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {tools.map((tool) => {
              const Icon = tool.icon;

              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() =>
                    openTool(tool.id)
                  }
                  className="group rounded-xl border border-white/10 bg-white/5 p-6 text-left transition hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-white/[0.08]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300">
                      <Icon className="h-6 w-6" />
                    </div>

                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                      Available
                    </span>
                  </div>

                  <h2 className="mt-5 text-xl font-semibold">
                    {tool.name}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    {tool.description}
                  </p>

                  <div className="mt-5 text-sm font-medium text-blue-300 transition group-hover:text-blue-200">
                    Open tool →
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Active tool */
          <div className="space-y-6">
            <button
              type="button"
              onClick={closeTool}
              className="flex items-center text-gray-400 transition hover:text-white"
            >
              <FaArrowLeft className="mr-2" />
              Back to Tools
            </button>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
              {/* Tool header */}
              <div className="border-b border-white/10 px-6 py-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300">
                    <currentTool.icon className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold">
                      {currentTool.name}
                    </h2>

                    <p className="mt-1 text-sm text-gray-400">
                      {currentTool.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tool component */}
              <div className="p-0">
                {CurrentToolComponent ? (
                  <CurrentToolComponent />
                ) : (
                  <div className="p-8 text-center text-gray-400">
                    This tool is currently
                    unavailable.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}