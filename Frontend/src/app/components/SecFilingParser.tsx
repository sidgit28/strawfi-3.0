"use client";
import { useState } from "react";
import { FaSpinner } from "react-icons/fa";
import React from "react";
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/lib/services/apiService';

interface Section {
  text: string;
  raw_html?: string;
}

interface StructuredOutput {
  cik: string;
  company: string;
  ticker: string;
  form: string;
  table_of_contents: Array<{ item: string; title: string }>;
  [key: string]: any;
}

interface Chunk {
  chunk_id: string;
  section: string;
  text: string;
  tokens: number;
  source: string;
}

interface ParsedResult {
  structured: StructuredOutput;
  chunked: {
    metadata: {
      cik: string;
      company: string;
      ticker: string;
      form: string;
    };
    chunks: Chunk[];
  };
}

export default function SecFilingParser() {
  const { jwt } = useAuth();
  const [ticker, setTicker] = useState("");
  const [formType, setFormType] = useState("10-K");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'structured' | 'chunked'>('structured');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const sectionRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Parsing SEC filing with authentication...');
      const data = await apiService.parseSecFiling({
        ticker,
        formType,
        year
      }, jwt);

      if (!data.success) {
        throw new Error(data.message || "Failed to parse filing");
      }

      setResult(data.data);
    } catch (err) {
      console.error('Error fetching filing:', err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Scroll to section when TOC item is clicked
  const handleTOCClick = (key: string) => {
    setActiveSection(key);
    setTimeout(() => {
      sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const renderStructuredOutput = () => {
    if (!result?.structured) return null;

    const { structured } = result;
    const sections = Object.entries(structured)
      .filter(([key]) => key.startsWith('item_'))
      .map(([key, value]) => ({
        key,
        title: structured.table_of_contents?.find(toc => toc.item === key)?.title || key,
        content: (value as Section).text
      }));

    // Filter TOC to remove duplicates and meaningless titles
    const filteredTOC = structured.table_of_contents
      ? structured.table_of_contents.filter(
          (item, idx, arr) =>
            item.title &&
            item.title.trim() !== "." &&
            arr.findIndex(
              (i) =>
                i.item.toLowerCase() === item.item.toLowerCase() &&
                i.title.trim().toLowerCase() === item.title.trim().toLowerCase()
            ) === idx
        )
      : [];

    return (
      <div className="space-y-8">
        {/* Company Info Table */}
        <div className="overflow-x-auto">
          <table className="min-w-[400px] w-full bg-gray-800 rounded-lg border border-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-blue-400 text-lg" colSpan={2}>Company Information</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="px-4 py-2 font-semibold text-gray-300">Company</td><td className="px-4 py-2">{structured.company}</td></tr>
              <tr><td className="px-4 py-2 font-semibold text-gray-300">Ticker</td><td className="px-4 py-2">{structured.ticker}</td></tr>
              <tr><td className="px-4 py-2 font-semibold text-gray-300">CIK</td><td className="px-4 py-2">{structured.cik}</td></tr>
              <tr><td className="px-4 py-2 font-semibold text-gray-300">Form Type</td><td className="px-4 py-2">{structured.form}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Table of Contents with hyperlinks */}
        {filteredTOC.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-[400px] w-full bg-gray-900 rounded-lg border border-gray-700 mt-4">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-blue-300">Item</th>
                  <th className="px-4 py-2 text-left text-blue-300">Title</th>
                </tr>
              </thead>
              <tbody>
                {filteredTOC.map((item, idx) => (
                  <tr key={idx} className="border-t border-gray-700 hover:bg-gray-800 cursor-pointer" onClick={() => handleTOCClick(item.item)}>
                    <td className="px-4 py-2 text-blue-400 underline">{item.item.replace('_', ' ').toUpperCase()}</td>
                    <td className="px-4 py-2 text-gray-100">{item.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sections as Cards with scroll refs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {sections.map((section) => (
            <div
              key={section.key}
              ref={el => (sectionRefs.current[section.key] = el)}
              className={`bg-gray-800 p-6 rounded-lg shadow border border-gray-700 ${activeSection === section.key ? 'ring-2 ring-blue-400' : ''}`}
            >
              <h3 className="text-lg font-semibold mb-2 text-blue-400">{section.title}</h3>
              <div className="whitespace-pre-wrap text-gray-200 text-sm max-h-[400px] overflow-y-auto">
                {section.content.length > 1200 ? section.content.slice(0, 1200) + '... (truncated)' : section.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderChunkedOutput = () => {
    if (!result?.chunked) return null;

    const { chunks } = result.chunked;

    // Group chunks by section
    const grouped = chunks.reduce((acc, chunk) => {
      if (!acc[chunk.section]) acc[chunk.section] = [];
      acc[chunk.section].push(chunk);
      return acc;
    }, {} as { [section: string]: typeof chunks });

    return (
      <div className="space-y-8">
        {Object.entries(grouped).map(([section, sectionChunks]) => (
          <div key={section} className="bg-gray-900 rounded-lg border border-gray-700 p-4">
            <div className="flex items-center mb-2">
              <span className="text-blue-400 font-semibold text-lg mr-2">{section.replace('_', ' ').toUpperCase()}</span>
              <span className="text-xs text-gray-400">({sectionChunks.length} chunk{sectionChunks.length > 1 ? 's' : ''})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sectionChunks.map((chunk) => (
                <div key={chunk.chunk_id} className="bg-gray-800 p-4 rounded shadow border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-blue-300 font-semibold">Chunk {chunk.chunk_id.split('_').pop()}</span>
                    <span className="text-xs text-gray-400">{chunk.tokens} tokens</span>
                  </div>
                  <div className="whitespace-pre-wrap text-gray-200 text-sm max-h-[200px] overflow-y-auto">
                    {chunk.text.length > 800 ? chunk.text.slice(0, 800) + '... (truncated)' : chunk.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderError = () => {
    if (!error) return null;
    
    return (
      <div className="p-4 bg-red-500/10 border border-red-500 text-red-400 rounded">
        <h3 className="font-semibold mb-2">Error</h3>
        <p>{error}</p>
        <p className="mt-2 text-sm">Please check your input and try again.</p>
      </div>
    );
  };

  const renderLoadingState = () => {
    if (!loading) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
          <div className="flex items-center space-x-4">
            <FaSpinner className="animate-spin text-2xl text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold">Processing Filing</h3>
              <p className="text-gray-400">This may take a few minutes...</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6 text-white bg-black min-h-screen">
      <h1 className="text-2xl font-bold">SEC Filing Parser</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="ticker" className="block text-sm font-medium text-gray-300">
            Ticker Symbol
          </label>
          <input
            id="ticker"
            type="text"
            placeholder="Ticker (e.g., AAPL)"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            required
            pattern="[A-Z]{1,5}"
            title="1-5 uppercase letters"
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="formType" className="block text-sm font-medium text-gray-300">
            Form Type
          </label>
          <select
            id="formType"
            value={formType}
            onChange={(e) => setFormType(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="10-K">10-K</option>
            <option value="10-Q">10-Q</option>
            <option value="8-K">8-K</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="year" className="block text-sm font-medium text-gray-300">
            Year
          </label>
          <input
            id="year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
            min="1993"
            max={new Date().getFullYear()}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50 flex items-center justify-center transition-colors"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              Processing...
            </>
          ) : (
            "Fetch Filing"
          )}
        </button>
      </form>

      {renderError()}
      {renderLoadingState()}

      {result && (
        <div className="mt-6">
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setActiveTab('structured')}
              className={`px-4 py-2 rounded transition-colors ${
                activeTab === 'structured'
                  ? 'bg-blue-600'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              Structured View
            </button>
            <button
              onClick={() => setActiveTab('chunked')}
              className={`px-4 py-2 rounded transition-colors ${
                activeTab === 'chunked'
                  ? 'bg-blue-600'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              Chunked View
            </button>
          </div>

          <div className="max-h-[800px] overflow-y-auto">
            {activeTab === 'structured' ? renderStructuredOutput() : renderChunkedOutput()}
          </div>
        </div>
      )}
    </div>
  );
}
