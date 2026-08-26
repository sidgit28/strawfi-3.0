"use client";

import { useState } from "react";
import { FaRobot, FaChartLine, FaShieldAlt, FaFileAlt, FaArrowLeft, FaRegBuilding, FaRegNewspaper, FaRegFileAlt as FaRegFile, FaRegUser, FaLeaf, FaGavel } from "react-icons/fa";
import Link from "next/link";
import SecFilingParser from "../components/SecFilingParser";
import DeltaDetectionUI from "../components/deltadetector"; 
import CorporateEvents from "../components/CorporateEvents";
import Header from "../components/Header";

type Tool = {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  component?: React.ComponentType;
  available: boolean;
};

export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const tools: Tool[] = [
    {
      id: "delta-detector",
      name: "Delta Detector",
      description: "Detect and analyze significant changes in financial data, portfolio metrics, or user behavior",
      icon: FaChartLine,
      component: DeltaDetectionUI, 
      available: true,
    },
    {
      id: "sec-filing",
      name: "SEC Filing Parser",
      description: "Parse and analyze SEC filings (10-K, 10-Q, 8-K) for detailed financial insights",
      icon: FaFileAlt,
      component: SecFilingParser,
      available: true,
    },
    {
      id: "esg-metrics",
      name: "ESG Metrics & Developments",
      description: "Track environmental, social, and governance metrics and related developments",
      icon: FaLeaf,
      available: false,
    },
    {
      id: "nfp-economic-data",
      name: "NFP/Economic Data",
      description: "Track non-farm payroll and key economic indicators",
      icon: FaRegNewspaper,
      available: false,
    },
    {
      id: "corporate-events",
      name: "Corporate Events",
      description: "Monitor earnings calls, mergers, acquisitions, and other corporate events",
      icon: FaRegBuilding,
      component: CorporateEvents,
      available: true,
    },
    {
      id: "insider-transactions",
      name: "Insider Transactions",
      description: "Track insider buying and selling activities",
      icon: FaRegUser,
      available: false,
    },
    {
      id: "regulation-compliance",
      name: "Regulation and Compliance",
      description: "Monitor regulatory changes, compliance requirements, and legal developments affecting financial markets",
      icon: FaGavel,
      available: false,
    },
  ];

  // Find the currently active tool
  const currentTool = tools.find((tool) => tool.id === activeTool);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header showBackButton backUrl="/" backText="Back to Home" />

      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-4">AI-powered Tracking Tools</h1>
            <p className="text-gray-400">
              Advanced tools powered by artificial intelligence to help you make informed financial decisions
            </p>
          </div>
        </div>

        {!activeTool ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => tool.available && setActiveTool(tool.id)}
                className={`p-6 rounded-xl border ${
                  tool.available
                    ? "border-white/10 hover:border-white/20 bg-white/5"
                    : "border-white/5 bg-white/5 opacity-50 cursor-not-allowed"
                } transition-all`}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/10 mb-4">
                  <tool.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{tool.name}</h3>
                <p className="text-gray-400 text-sm">{tool.description}</p>
                {!tool.available && (
                  <div className="mt-4 text-sm text-gray-500">Coming Soon</div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveTool(null)}
                className="flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <FaArrowLeft className="mr-2" />
                Back to Tools
              </button>
            </div>
            {currentTool?.component && (
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <currentTool.component />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}