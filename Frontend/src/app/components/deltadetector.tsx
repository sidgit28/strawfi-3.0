'use client';

import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown, BarChart3, Calendar, Filter, Download, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

const DeltaDetectionUI = () => {
  const [tickerSymbol, setTickerSymbol] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('');
  const [timeRange, setTimeRange] = useState({ from: '2024', to: '2025' });
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [deepDiveResult, setDeepDiveResult] = useState(null);
  const [isDeepDiveLoading, setIsDeepDiveLoading] = useState(false);
  const [deepDiveError, setDeepDiveError] = useState('');

  const [peerTicker, setPeerTicker] = useState('');
  const [peerComparisonResult, setPeerComparisonResult] = useState(null);
  const [isPeerComparisonLoading, setIsPeerComparisonLoading] = useState(false);
  const [peerComparisonError, setPeerComparisonError] = useState('');

  const metrics = [
    'Risk Management', 'Innovation Index', 'ESG Score', 'Operational Efficiency',
    'Market Position', 'Financial Stability', 'R&D Investment', 'Regulatory Compliance',
    'Customer Satisfaction', 'Digital Transformation', 'Supply Chain Resilience',
    'Talent Management', 'Sustainability Metrics', 'Cybersecurity Posture'
  ];

  const generateAnalysisPrompt = (ticker, company, metric, fromYear, toYear) => {
    return `You are a financial analyst providing a delta analysis for ${company} (${ticker}) comparing their ${metric} performance between ${fromYear} and ${toYear}.

Please provide a structured analysis in the following JSON format:
{
  "score2024": [numerical score between 1-100 for ${fromYear}],
  "score2025": [numerical score between 1-100 for ${toYear}],
  "delta": "[percentage change with + or - sign]",
  "trend": "[up or down]",
  "insights": [
    "First key insight about what drove the change, including the most important financial numbers (e.g., revenue, profit, margin)",
    "Second insight about specific improvements or challenges, including relevant financial numbers",
    "Third insight about strategic implications, including relevant financial numbers"
  ],
  "sources": [
    "Yahoo Finance",
    "Company Report",
  ]
}

In your insights, mention the most important financial numbers as part of the explanation, not just in a separate field. The 'sources' array can include either URLs or short source names and you must provide some sources. Return only the JSON object, no additional text.`;
  };

  const callOpenAI = async (prompt) => {
    try {
      const response = await fetch('/api/delta-detector-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.analysis;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  };

  const handleAnalyze = async () => {
    if (!tickerSymbol.trim() || !selectedMetric || !companyName.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');
    setAnalysisResults(null);
  

    try {
      const prompt = generateAnalysisPrompt(
        tickerSymbol.toUpperCase(),
        companyName,
        selectedMetric,
        timeRange.from,
        timeRange.to
      );

      const result = await callOpenAI(prompt);
      
      // Parse the JSON response
      const parsedResult = JSON.parse(result);
      
      // Validate the response structure
      if (!parsedResult.score2024 || !parsedResult.score2025 || !parsedResult.insights) {
        throw new Error('Invalid response structure from AI');
      }

      setAnalysisResults(parsedResult);
    } catch (error) {
      console.error('Analysis error:', error);
      setError('Failed to generate analysis. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTickerChange = (e) => {
    const value = e.target.value.toUpperCase();
    setTickerSymbol(value);
    setAnalysisResults(null);
    setDeepDiveResult(null);
    setDeepDiveError('');
    setPeerTicker('');
    setPeerComparisonResult(null);
    setPeerComparisonError('');
    setError('');
    
    // Auto-populate company name based on common tickers
const commonTickers = {
  'AAPL': 'Apple Inc.',
  'MSFT': 'Microsoft Corporation',
  'AMZN': 'Amazon.com Inc.',
  'NVDA': 'NVIDIA Corporation',
  'GOOGL': 'Alphabet Inc. (Class A)',
  'GOOG': 'Alphabet Inc. (Class C)',
  'META': 'Meta Platforms Inc.',
  'TSLA': 'Tesla Inc.',
  'BRK.B': 'Berkshire Hathaway Inc. (Class B)',
  'UNH': 'UnitedHealth Group Inc.',
  'JNJ': 'Johnson & Johnson',
  'XOM': 'Exxon Mobil Corp.',
  'JPM': 'JPMorgan Chase & Co.',
  'LLY': 'Eli Lilly and Co.',
  'V': 'Visa Inc.',
  'PG': 'Procter & Gamble Co.',
  'MA': 'Mastercard Inc.',
  'HD': 'Home Depot Inc.',
  'CVX': 'Chevron Corporation',
  'ABBV': 'AbbVie Inc.',
  'AVGO': 'Broadcom Inc.',
  'MRK': 'Merck & Co. Inc.',
  'PEP': 'PepsiCo Inc.',
  'KO': 'Coca-Cola Co.',
  'COST': 'Costco Wholesale Corp.',
  'BAC': 'Bank of America Corp.',
  'WMT': 'Walmart Inc.',
  'ADBE': 'Adobe Inc.',
  'CSCO': 'Cisco Systems Inc.',
  'NFLX': 'Netflix Inc.',
  'ABT': 'Abbott Laboratories',
  'TMO': 'Thermo Fisher Scientific Inc.',
  'ACN': 'Accenture plc',
  'CRM': 'Salesforce Inc.',
  'MCD': 'McDonald\'s Corp.',
  'DHR': 'Danaher Corporation',
  'QCOM': 'Qualcomm Inc.',
  'TXN': 'Texas Instruments Inc.',
  'NEE': 'NextEra Energy Inc.',
  'LIN': 'Linde plc',
  'NKE': 'Nike Inc.',
  'PM': 'Philip Morris International Inc.',
  'UNP': 'Union Pacific Corporation',
  'AMGN': 'Amgen Inc.',
  'MDT': 'Medtronic plc',
  'INTU': 'Intuit Inc.',
  'T': 'AT&T Inc.',
  'HON': 'Honeywell International Inc.',
  'VZ': 'Verizon Communications Inc.',
  'LOW': 'Lowe\'s Companies Inc.',
  'UPS': 'United Parcel Service Inc.',
  'ORCL': 'Oracle Corporation',
  'INTC': 'Intel Corporation',
  'SBUX': 'Starbucks Corporation',
  'RTX': 'RTX Corporation',
  'CAT': 'Caterpillar Inc.',
  'BA': 'The Boeing Company',
  'IBM': 'International Business Machines Corp.',
  'GS': 'Goldman Sachs Group Inc.',
  'BLK': 'BlackRock Inc.',
  'LMT': 'Lockheed Martin Corporation',
  'CVS': 'CVS Health Corporation',
  'SPGI': 'S&P Global Inc.',
  'ISRG': 'Intuitive Surgical Inc.',
  'AMD': 'Advanced Micro Devices Inc.',
  'MDLZ': 'Mondelez International Inc.',
  'AXP': 'American Express Company',
  'GE': 'General Electric Company',
  'ELV': 'Elevance Health Inc.',
  'PFE': 'Pfizer Inc.',
  'CI': 'Cigna Group',
  'SYK': 'Stryker Corporation',
  'BKNG': 'Booking Holdings Inc.',
  'ADI': 'Analog Devices Inc.',
  'CHTR': 'Charter Communications Inc.',
  'MMC': 'Marsh & McLennan Companies Inc.',
  'C': 'Citigroup Inc.',
  'MO': 'Altria Group Inc.',
  'AMT': 'American Tower Corp.',
  'NOW': 'ServiceNow Inc.',
  'ZTS': 'Zoetis Inc.',
  'TGT': 'Target Corporation',
  'GILD': 'Gilead Sciences Inc.',
  'DE': 'Deere & Company',
  'PLD': 'Prologis Inc.',
  'FIS': 'Fidelity National Information Services Inc.',
  'EOG': 'EOG Resources Inc.',
  'FDX': 'FedEx Corporation',
  'EQIX': 'Equinix Inc.',
  'CL': 'Colgate-Palmolive Company',
  'ADP': 'Automatic Data Processing Inc.',
  'ITW': 'Illinois Tool Works Inc.',
  'MU': 'Micron Technology Inc.',
  'APD': 'Air Products and Chemicals Inc.',
  'SHW': 'Sherwin-Williams Co.',
  'HUM': 'Humana Inc.',
  'PGR': 'Progressive Corporation',
  'ILMN': 'Illumina Inc.',
  'MAR': 'Marriott International Inc.',
  'BIIB': 'Biogen Inc.',
  'CME': 'CME Group Inc.',
  'WELL': 'Welltower Inc.',
  'ROP': 'Roper Technologies Inc.',
  'KLAC': 'KLA Corporation'
};


    if (commonTickers[value]) {
      setCompanyName(commonTickers[value]);
    } else if (value.length === 0) {
      setCompanyName('');
    }
  };

  const handleCompanyNameChange = (e) => {
    setCompanyName(e.target.value);
    setAnalysisResults(null);
    setDeepDiveResult(null);
    setDeepDiveError('');
    setPeerTicker('');
    setPeerComparisonResult(null);
    setPeerComparisonError('');
    setError('');
  };

  const handleMetricChange = (e) => {
    setSelectedMetric(e.target.value);
    setAnalysisResults(null);
    setDeepDiveResult(null);
    setDeepDiveError('');
    setPeerTicker('');
    setPeerComparisonResult(null);
    setPeerComparisonError('');
    setError('');
  };

  const handleTimeRangeChange = (field, value) => {
    setTimeRange(prev => ({ ...prev, [field]: value }));
    setAnalysisResults(null);
    setDeepDiveResult(null);
    setDeepDiveError('');
    setPeerTicker('');
    setPeerComparisonResult(null);
    setPeerComparisonError('');
    setError('');
  };

  // Deep Dive Prompt
  const generateDeepDivePrompt = (ticker, company, metric, year) => {
    return `You are a financial analyst. Provide a deep dive analysis for ${company} (${ticker}) on the metric "${metric}" for the year ${year}.

Your response should be in the following JSON format:
{
  "executive_summary": "A concise summary of the deep dive findings, including the most important financial numbers (e.g., revenue, profit, margin, etc.) as part of the explanation.",
  "key_drivers": [
    "First key driver, including relevant financial numbers",
    "Second key driver, including relevant financial numbers",
    "Third key driver, including relevant financial numbers"
  ],
  "challenges": [
    "First challenge",
    "Second challenge"
  ],
  "opportunities": [
    "First opportunity",
    "Second opportunity"
  ],
  "recommendations": [
    "First recommendation",
    "Second recommendation"
  ],
  "sources": [
    "Yahoo Finance",
    "Company Report"
  ]
}

In your executive summary and key drivers, mention the most important financial numbers (e.g., revenue, profit, margin, etc.) as part of the explanation. The 'sources' array can include either URLs or short source names. Return only the JSON object, no extra text.`;
  };

  // Peer Comparison Prompt
  const generatePeerComparisonPrompt = (ticker1, company1, ticker2, metric, fromYear, toYear) => {
    return `You are a financial analyst. Compare ${company1} (${ticker1}) and ${ticker2} on the metric "${metric}" between ${fromYear} and ${toYear}.

Your response should be in the following JSON format:
{
  "company1": "${company1} (${ticker1})",
  "company2": "${ticker2}",
  "score_${fromYear}_1": [score for company 1 in ${fromYear}],
  "score_${toYear}_1": [score for company 1 in ${toYear}],
  "score_${fromYear}_2": [score for company 2 in ${fromYear}],
  "score_${toYear}_2": [score for company 2 in ${toYear}],
  "delta_1": "[percentage change for company 1]",
  "delta_2": "[percentage change for company 2]",
  "winner": "[which company performed better and why, including the most important financial numbers for both companies]",
  "insights": [
    "First insight, including the most important financial numbers for both companies",
    "Second insight, including relevant financial numbers",
    "Third insight, including relevant financial numbers"
  ],
  "sources": [
    "Yahoo Finance",
    "Company Report"
  ]
}

In your insights and winner explanation, mention the most important financial numbers for both companies (e.g., revenue, profit, margin, etc.) as part of the explanation. The 'sources' array can include either URLs or short source names. Return only the JSON object, no extra text.`;
  };

  // Deep Dive Handler
  const handleDeepDive = async () => {
    setPeerTicker('');
    setPeerComparisonResult(null);
    setPeerComparisonError('');

    setIsDeepDiveLoading(true);
    setDeepDiveError('');
    setDeepDiveResult(null);
    try {
      const prompt = generateDeepDivePrompt(
        tickerSymbol.toUpperCase(),
        companyName,
        selectedMetric,
        timeRange.to // Use the 'to' year for deep dive
      );
      const result = await callOpenAI(prompt);
      const parsed = JSON.parse(result);
      setDeepDiveResult(parsed);
    } catch (error) {
      setDeepDiveError('Failed to generate deep dive analysis. Please try again.');
    } finally {
      setIsDeepDiveLoading(false);
    }
  };

  // Peer Comparison Handler
  const handlePeerComparison = async () => {
    if (!peerTicker.trim()) {
      setPeerComparisonError('Please enter a peer ticker symbol.');
      return;
    }
    setIsPeerComparisonLoading(true);
    setPeerComparisonError('');
    setPeerComparisonResult(null);
    try {
      const prompt = generatePeerComparisonPrompt(
        tickerSymbol.toUpperCase(),
        companyName,
        peerTicker.toUpperCase(),
        selectedMetric,
        timeRange.from,
        timeRange.to
      );
      const result = await callOpenAI(prompt);
      const parsed = JSON.parse(result);
      setPeerComparisonResult(parsed);
    } catch (error) {
      setPeerComparisonError('Failed to generate peer comparison. Please try again.');
    } finally {
      setIsPeerComparisonLoading(false);
    }
  };

  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Delta Detection Analytics
          </h1>
          <p className="text-gray-400 text-lg">
            Compare company performance metrics across time periods to identify key improvements and risks
          </p>
        </div>

        {/* Controls Panel */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Ticker Symbol */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Ticker Symbol *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={tickerSymbol}
                  onChange={handleTickerChange}
                  placeholder="e.g., AAPL"
                  className="w-full pl-10 pr-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent bg-white/10 text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={companyName}
                onChange={handleCompanyNameChange}
                placeholder="e.g., Apple Inc."
                className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent bg-white/10 text-white placeholder-gray-400"
              />
            </div>

            {/* Metric Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Analysis Metric *
              </label>
              <div className="relative">
                <BarChart3 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select 
                  value={selectedMetric}
                  onChange={handleMetricChange}
                  className="w-full pl-10 pr-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent bg-white/10 text-white"
                >
                  <option value="" className="bg-gray-900 text-white">Select metric...</option>
                  {metrics.map(metric => (
                    <option key={metric} value={metric} className="bg-gray-900 text-white">{metric}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Time Range */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Time Period
              </label>
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <input 
                    type="text"
                    value={timeRange.from}
                    onChange={e => handleTimeRangeChange('from', e.target.value)}
                    className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent text-center bg-white/10 text-white"
                  />
                </div>
                <span className="text-gray-400 font-medium">vs</span>
                <div className="flex-1">
                  <input 
                    type="text"
                    value={timeRange.to}
                    onChange={e => handleTimeRangeChange('to', e.target.value)}
                    className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent text-center bg-white/10 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Analyze Button */}
            <div className="flex items-end">
              <button
                onClick={handleAnalyze}
                disabled={!tickerSymbol.trim() || !selectedMetric || !companyName.trim() || isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                {isLoading ? 'Analyzing...' : 'Analyze Delta'}
              </button>
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Always show Peer Comparison button below controls */}
        <div className="flex justify-end mb-8">
          <button
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-2 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
            onClick={() => router.push('/tools/deltadetector/peer-comparison')}
          >
            Go to Peer Comparison Tool
          </button>
        </div>

        {/* Results Section */}
        {analysisResults && (
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden mb-8">
            {/* Results Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">
                    {companyName} ({tickerSymbol}) - {selectedMetric}
                  </h2>
                  <p className="text-blue-100">
                    Performance comparison: {timeRange.from} vs {timeRange.to}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors">
                    <Download className="w-5 h-5" />
                  </button>
                  <button className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors">
                    <Filter className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Score Comparison */}
            <div className="p-6 border-b border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-300 mb-1">
                    {analysisResults.score2024}
                  </div>
                  <div className="text-sm text-gray-400">{timeRange.from} Score</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {analysisResults.trend === 'up' ? (
                      <TrendingUp className="w-6 h-6 text-green-500" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-500" />
                    )}
                    <span className={`text-2xl font-bold ${
                      analysisResults.trend === 'up' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {analysisResults.delta}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">Change</div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">
                    {analysisResults.score2025}
                  </div>
                  <div className="text-sm text-gray-400">{timeRange.to} Score</div>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Key Performance Drivers
              </h3>
              <div className="space-y-3">
                {analysisResults.insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-300 leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
            {analysisResults.sources && (
              <div className="mb-2">
                <span className="font-semibold">Sources:</span>
                <ul className="list-disc ml-6">
                  {analysisResults.sources.map((src, i) => (
                    src.startsWith('http') ? (
                      <li key={i}><a href={src} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">{src}</a></li>
                    ) : (
                      <li key={i} className="text-gray-200">{src}</li>
                    )
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Next Steps */}
            <div className="p-6 bg-white/5 border-t border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">
                Recommended Next Steps
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  className="bg-white/10 border border-white/20 p-4 rounded-lg hover:bg-white/20 transition-all text-left"
                  onClick={handleDeepDive}
                  disabled={isDeepDiveLoading}
                >
                  <div className="font-semibold text-white mb-1">Deep Dive Analysis</div>
                  <div className="text-sm text-gray-400">Get detailed breakdown of contributing factors</div>
                  {isDeepDiveLoading && <div className="text-blue-400 mt-2">Loading...</div>}
                </button>
                <button
                  className="bg-white/10 border border-white/20 p-4 rounded-lg hover:bg-white/20 transition-all text-left"
                  onClick={() => router.push('/tools/deltadetector/peer-comparison')}
                >
                  <div className="font-semibold text-white mb-1">Peer Comparison</div>
                  <div className="text-sm text-gray-400">Compare against industry benchmarks</div>
                </button>
              </div>
              {/* Deep Dive Result */}
              {deepDiveError && <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400">{deepDiveError}</div>}
              {deepDiveResult && (
                <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                  <h4 className="text-xl font-bold text-blue-200 mb-2">Deep Dive Analysis</h4>
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
          </div>
        )}

        {/* Peer Comparison UI - always visible
        <div className="mt-6 bg-purple-900/20 border border-purple-500/30 rounded-lg p-6">
          <h4 className="text-xl font-bold text-purple-200 mb-2">Peer Comparison</h4>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-300 mb-2">Company 1 Ticker</label>
              <input
                type="text"
                value={tickerSymbol}
                disabled
                className="w-full px-4 py-3 border border-white/20 rounded-lg bg-white/10 text-white placeholder-gray-400 opacity-70 cursor-not-allowed"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-300 mb-2">Peer Ticker *</label>
              <input
                type="text"
                value={peerTicker}
                onChange={e => setPeerTicker(e.target.value)}
                placeholder="e.g., MSFT"
                className="w-full px-4 py-3 border border-white/20 rounded-lg bg-white/10 text-white placeholder-gray-400"
              />
            </div>
          </div>
          <button
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-2 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            onClick={handlePeerComparison}
            disabled={isPeerComparisonLoading || !peerTicker.trim()}
          >
            {isPeerComparisonLoading ? 'Comparing...' : 'Compare'}
          </button>
          <button
            className="ml-4 text-sm text-gray-400 underline hover:text-white"
            onClick={() => {
              setPeerTicker('');
              setPeerComparisonResult(null);
              setPeerComparisonError('');
            }}
          >Clear</button>
          {peerComparisonError && <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400">{peerComparisonError}</div>}
          {peerComparisonResult && (
            <div className="mt-6 bg-pink-900/20 border border-pink-500/30 rounded-lg p-6">
              <h5 className="text-lg font-bold text-pink-200 mb-2">Comparison Result</h5>
              <div className="mb-2"><span className="font-semibold">{peerComparisonResult.company1}:</span> {peerComparisonResult[`score_${timeRange.from}_1`]} → {peerComparisonResult[`score_${timeRange.to}_1`]} ({peerComparisonResult.delta_1})</div>
              <div className="mb-2"><span className="font-semibold">{peerComparisonResult.company2}:</span> {peerComparisonResult[`score_${timeRange.from}_2`]} → {peerComparisonResult[`score_${timeRange.to}_2`]} ({peerComparisonResult.delta_2})</div>
              <div className="mb-2"><span className="font-semibold">Winner:</span> {peerComparisonResult.winner}</div>
              <div className="mb-2"><span className="font-semibold">Key Insights:</span>
                <ul className="list-disc ml-6">
                  {peerComparisonResult.insights?.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            </div>
          )}
          {peerComparisonResult.financial_numbers && (
            <div className="mb-2">
              <span className="font-semibold">Financial Numbers:</span>
              <pre className="bg-black/20 rounded p-2 mt-1 text-sm text-gray-200">
                {JSON.stringify(peerComparisonResult.financial_numbers, null, 2)}
              </pre>
            </div>
          )}
          {peerComparisonResult.sources && (
            <div className="mb-2">
              <span className="font-semibold">Sources:</span>
              <ul className="list-disc ml-6">
                {peerComparisonResult.sources.map((src, i) => (
                  src.startsWith('http') ? (
                    <li key={i}><a href={src} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">{src}</a></li>
                  ) : (
                    <li key={i} className="text-gray-200">{src}</li>
                  )
                ))}
              </ul>
            </div>
          )}
        </div> */}

        {/* Example Queries */}
        {!analysisResults && (
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Example Analysis Questions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div 
                className="p-4 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg border border-blue-500/30 cursor-pointer hover:from-blue-800/50 hover:to-purple-800/50 transition-all"
                onClick={() => {
                  setTickerSymbol('AAPL');
                  setCompanyName('Apple Inc.');
                  setSelectedMetric('Risk Management');
                }}
              >
                <div className="font-semibold text-white mb-2">Risk Management</div>
                <div className="text-sm text-gray-400">
                  "How did Apple manage risk better in 2025 than 2024?"
                </div>
              </div>
              <div 
                className="p-4 bg-gradient-to-r from-green-900/50 to-blue-900/50 rounded-lg border border-green-500/30 cursor-pointer hover:from-green-800/50 hover:to-blue-800/50 transition-all"
                onClick={() => {
                  setTickerSymbol('NVDA');
                  setCompanyName('NVIDIA Corporation');
                  setSelectedMetric('Innovation Index');
                }}
              >
                <div className="font-semibold text-white mb-2">Innovation Analysis</div>
                <div className="text-sm text-gray-400">
                  "How is NVIDIA enhancing innovations in 2025 vs 2024?"
                </div>
              </div>
              <div 
                className="p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg border border-purple-500/30 cursor-pointer hover:from-purple-800/50 hover:to-pink-800/50 transition-all"
                onClick={() => {
                  setTickerSymbol('TSLA');
                  setCompanyName('Tesla Inc.');
                  setSelectedMetric('ESG Score');
                }}
              >
                <div className="font-semibold text-white mb-2">ESG Performance</div>
                <div className="text-sm text-gray-400">
                  "How has Tesla's ESG score evolved from 2024 to 2025?"
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeltaDetectionUI;