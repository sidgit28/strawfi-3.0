"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const metrics = [
  "Risk Management", "Innovation Index", "ESG Score", "Operational Efficiency",
  "Market Position", "Financial Stability", "R&D Investment", "Regulatory Compliance",
  "Customer Satisfaction", "Digital Transformation", "Supply Chain Resilience",
  "Talent Management", "Sustainability Metrics", "Cybersecurity Posture"
];

const PeerComparisonPage = () => {
  const [company1, setCompany1] = useState("");
  const [company2, setCompany2] = useState("");
  const [metric, setMetric] = useState("");
  const [timeRange, setTimeRange] = useState({ from: "2024", to: "2025" });
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [deepDiveCompany, setDeepDiveCompany] = useState("");
  const [deepDiveResult, setDeepDiveResult] = useState(null);
  const [isDeepDiveLoading, setIsDeepDiveLoading] = useState(false);
  const [deepDiveError, setDeepDiveError] = useState("");
  const router = useRouter();

  // Clear results on any input change
  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    setResult(null);
    setDeepDiveCompany("");
    setDeepDiveResult(null);
    setDeepDiveError("");
    setError("");
  };
  const handleTimeRangeChange = (field, value) => {
    setTimeRange((prev) => ({ ...prev, [field]: value }));
    setResult(null);
    setDeepDiveCompany("");
    setDeepDiveResult(null);
    setDeepDiveError("");
    setError("");
  };

  // Prompt generators
  const generatePeerComparisonPrompt = (ticker1, ticker2, metric, fromYear, toYear) => {
    return `You are a financial analyst. Compare ${ticker1} and ${ticker2} on the metric "${metric}" between ${fromYear} and ${toYear}.\n\nYour response should be in the following JSON format:\n{\n  "company1": "${ticker1}",\n  "company2": "${ticker2}",\n  "score_${fromYear}_1": [score for company 1 in ${fromYear}],\n  "score_${toYear}_1": [score for company 1 in ${toYear}],\n  "score_${fromYear}_2": [score for company 2 in ${fromYear}],\n  "score_${toYear}_2": [score for company 2 in ${toYear}],\n  "delta_1": "[percentage change for company 1]",\n  "delta_2": "[percentage change for company 2]",\n  "winner": "[which company performed better and why]",\n  "insights": [\n    "First insight",\n    "Second insight",\n    "Third insight"\n  ]\n}\n\nMake the analysis realistic, actionable, and based on publicly available information. Return only the JSON object, no extra text.`;
  };
  const generateDeepDivePrompt = (company, metric, year) => {
    return `You are a financial analyst. Provide a deep dive analysis for ${company} on the metric "${metric}" for the year ${year}.\n\nYour response should be in the following JSON format:\n{\n  "executive_summary": "A concise summary of the deep dive findings.",\n  "key_drivers": [\n    "First key driver",\n    "Second key driver",\n    "Third key driver"\n  ],\n  "challenges": [\n    "First challenge",\n    "Second challenge"\n  ],\n  "opportunities": [\n    "First opportunity",\n    "Second opportunity"\n  ],\n  "recommendations": [\n    "First recommendation",\n    "Second recommendation"\n  ]\n}\n\nMake the analysis realistic, actionable, and based on publicly available information. Return only the JSON object, no extra text.`;
  };

  // API call
  const callOpenAI = async (prompt) => {
    try {
      const response = await fetch("/api/delta-detector-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.analysis;
    } catch (err) {
      throw err;
    }
  };

  // Compare handler
  const handleCompare = async () => {
    if (!company1.trim() || !company2.trim() || !metric || !timeRange.from || !timeRange.to) {
      setError("Please fill in all fields");
      return;
    }
    setIsLoading(true);
    setError("");
    setResult(null);
    setDeepDiveCompany("");
    setDeepDiveResult(null);
    setDeepDiveError("");
    try {
      const prompt = generatePeerComparisonPrompt(company1.toUpperCase(), company2.toUpperCase(), metric, timeRange.from, timeRange.to);
      const resultText = await callOpenAI(prompt);
      const parsed = JSON.parse(resultText);
      setResult(parsed);
    } catch (err) {
      setError("Failed to generate peer comparison. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Deep dive handler
  const handleDeepDive = async (company) => {
    setDeepDiveCompany(company);
    setIsDeepDiveLoading(true);
    setDeepDiveResult(null);
    setDeepDiveError("");
    try {
      const prompt = generateDeepDivePrompt(company, metric, timeRange.to);
      const resultText = await callOpenAI(prompt);
      const parsed = JSON.parse(resultText);
      setDeepDiveResult(parsed);
    } catch (err) {
      setDeepDiveError("Failed to generate deep dive analysis. Please try again.");
    } finally {
      setIsDeepDiveLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Peer Comparison</h1>
          <button onClick={() => router.push("/tools")} className="text-blue-400 hover:underline">Back to Tools</button>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Company 1 Ticker *</label>
              <input type="text" value={company1} onChange={handleInputChange(setCompany1)} placeholder="e.g., AAPL" className="w-full px-4 py-3 border border-white/20 rounded-lg bg-white/10 text-white placeholder-gray-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Company 2 Ticker *</label>
              <input type="text" value={company2} onChange={handleInputChange(setCompany2)} placeholder="e.g., MSFT" className="w-full px-4 py-3 border border-white/20 rounded-lg bg-white/10 text-white placeholder-gray-400" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Metric *</label>
              <select value={metric} onChange={handleInputChange(setMetric)} className="w-full px-4 py-3 border border-white/20 rounded-lg bg-white/10 text-white">
                <option value="" className="bg-gray-900 text-white">Select metric...</option>
                {metrics.map((m) => (
                  <option key={m} value={m} className="bg-gray-900 text-white">{m}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-300 mb-2">From Year *</label>
                <input type="text" value={timeRange.from} onChange={e => handleTimeRangeChange('from', e.target.value)} className="w-full px-4 py-3 border border-white/20 rounded-lg bg-white/10 text-white text-center" />
              </div>
              <span className="text-gray-400 font-medium mb-3">vs</span>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-300 mb-2">To Year *</label>
                <input type="text" value={timeRange.to} onChange={e => handleTimeRangeChange('to', e.target.value)} className="w-full px-4 py-3 border border-white/20 rounded-lg bg-white/10 text-white text-center" />
              </div>
            </div>
          </div>
          <button onClick={handleCompare} disabled={isLoading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
            {isLoading ? "Comparing..." : "Compare"}
          </button>
          {error && <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400">{error}</div>}
        </div>
        {result && (
          <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-8">
            <h2 className="text-2xl font-bold text-pink-200 mb-4">Comparison Result</h2>
            <div className="mb-2"><span className="font-semibold">{result.company1}:</span> {result[`score_${timeRange.from}_1`]} → {result[`score_${timeRange.to}_1`]} ({result.delta_1})</div>
            <div className="mb-2"><span className="font-semibold">{result.company2}:</span> {result[`score_${timeRange.from}_2`]} → {result[`score_${timeRange.to}_2`]} ({result.delta_2})</div>
            <div className="mb-2"><span className="font-semibold">Winner:</span> {result.winner}</div>
            <div className="mb-2"><span className="font-semibold">Key Insights:</span>
              <ul className="list-disc ml-6">
                {result.insights?.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={() => handleDeepDive(result.company1)} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg">Deep Dive: {result.company1}</button>
              <button onClick={() => handleDeepDive(result.company2)} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg">Deep Dive: {result.company2}</button>
            </div>
            {deepDiveError && <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400">{deepDiveError}</div>}
            {deepDiveResult && deepDiveCompany && (
              <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                <h4 className="text-xl font-bold text-blue-200 mb-2">Deep Dive Analysis: {deepDiveCompany}</h4>
                <div className="mb-2"><span className="font-semibold">Executive Summary:</span> {deepDiveResult.executive_summary}</div>
                <div className="mb-2"><span className="font-semibold">Key Drivers:</span>
                  <ul className="list-disc ml-6">
                    {deepDiveResult.key_drivers?.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                </div>
                <div className="mb-2"><span className="font-semibold">Challenges:</span>
                  <ul className="list-disc ml-6">
                    {deepDiveResult.challenges?.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                </div>
                <div className="mb-2"><span className="font-semibold">Opportunities:</span>
                  <ul className="list-disc ml-6">
                    {deepDiveResult.opportunities?.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                </div>
                <div className="mb-2"><span className="font-semibold">Recommendations:</span>
                  <ul className="list-disc ml-6">
                    {deepDiveResult.recommendations?.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PeerComparisonPage; 