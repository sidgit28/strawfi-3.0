"use client";

import { useState } from "react";
import {
  FaUserTie,
  FaSearch,
  FaSyncAlt,
  FaExternalLinkAlt,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import { config } from "@/lib/config";

type Transaction = {
  form: string;
  filingDate: string;
  reportDate?: string;
  accessionNumber: string;
  insiderName?: string;
  transactionType?: string;
  shares?: number | null;
  price?: number | null;
  value?: number | null;
  security?: string;
  url: string;
};

type ApiResponse = {
  success: boolean;
  company?: {
    name: string;
    cik: string;
    ticker: string;
  };
  transactions?: Transaction[];
  summary?: {
    purchases: number;
    sales: number;
    totalPurchaseValue: number;
    totalSaleValue: number;
  };
  error?: string;
};

const money = (value?: number | null) => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
};

const number = (value?: number | null) => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
};

export default function InsiderTransactionsTracker() {
  const [ticker, setTicker] = useState("");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchInsiders = async () => {
    const symbol = ticker.trim().toUpperCase();

    if (!symbol) {
      setError("Enter a ticker symbol.");
      return;
    }

    setLoading(true);
    setError("");
    setData(null);

    try {
      const response = await fetch(
        `${config.api.baseUrl}/api/insider-transactions?ticker=${encodeURIComponent(symbol)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Unable to fetch insider transactions."
        );
      }

      setData(result);
    } catch (err: any) {
      console.error("Insider transactions error:", err);
      setError(
        err?.message || "Unable to fetch insider transactions."
      );
    } finally {
      setLoading(false);
    }
  };

  const netSignal =
    (data?.summary?.totalPurchaseValue || 0) >
    (data?.summary?.totalSaleValue || 0)
      ? "Buying pressure"
      : (data?.summary?.totalSaleValue || 0) >
        (data?.summary?.totalPurchaseValue || 0)
      ? "Selling pressure"
      : "Balanced";

  return (
    <div className="space-y-6 bg-black p-6 text-white">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
          <FaUserTie />
        </div>

        <div>
          <h2 className="text-2xl font-bold">
            Insider Transactions
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Track SEC ownership filings and insider transaction signals.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Company ticker
        </label>

        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  searchInsiders();
                }
              }}
              placeholder="e.g. AAPL"
              className="w-full rounded-lg border border-white/10 bg-gray-900 py-3 pl-10 pr-4 text-white outline-none focus:border-blue-400"
            />
          </div>

          <button
            type="button"
            onClick={searchInsiders}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <FaSyncAlt className="animate-spin" />
            ) : (
              <FaSearch />
            )}
            Search
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-gray-500">Purchases</p>
              <p className="mt-1 text-3xl font-bold text-emerald-400">
                {data.summary?.purchases ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-gray-500">Sales</p>
              <p className="mt-1 text-3xl font-bold text-red-400">
                {data.summary?.sales ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-gray-500">Purchase value</p>
              <p className="mt-1 text-2xl font-bold">
                {money(data.summary?.totalPurchaseValue)}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-gray-500">Signal</p>
              <p
                className={`mt-1 text-2xl font-bold ${
                  netSignal === "Buying pressure"
                    ? "text-emerald-400"
                    : netSignal === "Selling pressure"
                    ? "text-red-400"
                    : "text-gray-300"
                }`}
              >
                {netSignal}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-gray-500">Company</p>
            <p className="mt-1 text-xl font-semibold">
              {data.company?.name}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {data.company?.ticker} • CIK {data.company?.cik}
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
            <div className="border-b border-white/10 px-5 py-4">
              <h3 className="font-semibold">
                Recent insider activity
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                SEC Forms 3, 4, 5 and amendments
              </p>
            </div>

            {!data.transactions?.length ? (
              <div className="p-10 text-center text-sm text-gray-500">
                No transaction records were extracted from the recent filings.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-5 py-3">Insider</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Shares</th>
                      <th className="px-5 py-3">Price</th>
                      <th className="px-5 py-3">Value</th>
                      <th className="px-5 py-3">Filed</th>
                      <th className="px-5 py-3">SEC</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.transactions.map((item) => (
                      <tr
                        key={`${item.accessionNumber}-${item.insiderName || ""}`}
                        className="border-b border-white/5 last:border-0"
                      >
                        <td className="px-5 py-3 text-gray-300">
                          {item.insiderName || "Not extracted"}
                        </td>

                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                              item.transactionType === "Purchase"
                                ? "bg-emerald-500/10 text-emerald-300"
                                : item.transactionType === "Sale"
                                ? "bg-red-500/10 text-red-300"
                                : "bg-white/5 text-gray-400"
                            }`}
                          >
                            {item.transactionType === "Purchase" ? (
                              <FaArrowUp />
                            ) : item.transactionType === "Sale" ? (
                              <FaArrowDown />
                            ) : null}
                            {item.transactionType || item.form}
                          </span>
                        </td>

                        <td className="px-5 py-3">
                          {number(item.shares)}
                        </td>

                        <td className="px-5 py-3">
                          {money(item.price)}
                        </td>

                        <td className="px-5 py-3">
                          {money(item.value)}
                        </td>

                        <td className="px-5 py-3 text-gray-400">
                          {item.filingDate || "—"}
                        </td>

                        <td className="px-5 py-3">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200"
                          >
                            Open
                            <FaExternalLinkAlt size={10} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}