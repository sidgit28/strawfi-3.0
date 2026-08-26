"use client";

import { useState } from "react";
import { FaChartLine, FaRegBuilding, FaRegNewspaper, FaRegFileAlt, FaRegUser, FaSearch, FaSpinner, FaGavel } from "react-icons/fa";

interface TrackingTool {
  id: string;
  name: string;
  description: string;
  icon: JSX.Element;
  action?: () => void;
}

interface AITrackingToolsProps {
  onToolSelect?: (toolId: string) => void;
}

const trackingTools: TrackingTool[] = [
  {
    id: "esg",
    name: "ESG Metrics & Developments",
    description: "Track environmental, social, and governance metrics and related developments",
    icon: <FaChartLine className="text-2xl" />,
  },
  {
    id: "delta-detector",
    name: "Delta Detector",
    description: "Detect and analyze significant changes in financial data, portfolio metrics, or user behavior",
    icon: <FaChartLine className="text-2xl" />,
  },
  {
    id: "nfp",
    name: "NFP/Economic Data",
    description: "Track non-farm payroll and key economic indicators",
    icon: <FaRegNewspaper className="text-2xl" />,
  },
  {
    id: "corporate",
    name: "Corporate Events",
    description: "Monitor earnings calls, mergers, acquisitions, and other corporate events",
    icon: <FaRegFileAlt className="text-2xl" />,
  },
  {
    id: "insider",
    name: "Insider Transactions",
    description: "Track insider buying and selling activities",
    icon: <FaRegUser className="text-2xl" />,
  },
  {
    id: "sec-filing",
    name: "SEC Filing Parser",
    description: "Parse and analyze SEC filings (10-K, 10-Q, 8-K) for comprehensive financial data",
    icon: <FaSearch className="text-2xl" />,
  },
  {
    id: "regulation-compliance",
    name: "Regulation and Compliance",
    description: "Monitor regulatory changes, compliance requirements, and legal developments affecting financial markets",
    icon: <FaGavel className="text-2xl" />,
  },
];

export default function AITrackingTools({ onToolSelect }: AITrackingToolsProps) {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const handleToolClick = (tool: TrackingTool) => {
    setSelectedTool(tool.id);
    if (onToolSelect) {
      onToolSelect(tool.id);
    }
    if (tool.action) {
      tool.action();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">AI-powered Tracking Tools</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trackingTools.map((tool) => (
          <div
            key={tool.id}
            onClick={() => handleToolClick(tool)}
            className={`p-4 rounded-lg border transition-all cursor-pointer ${
              selectedTool === tool.id
                ? "bg-white/10 border-white/20"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center space-x-3 mb-2">
              {tool.icon}
              <h3 className="text-lg font-semibold text-white">{tool.name}</h3>
            </div>
            <p className="text-white/70 text-sm">{tool.description}</p>
          </div>
        ))}
      </div>

      {selectedTool && (
        <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <p className="text-white/80">
            Selected tool: <span className="font-semibold text-white">
              {trackingTools.find(t => t.id === selectedTool)?.name}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}