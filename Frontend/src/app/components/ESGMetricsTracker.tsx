"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaLeaf,
  FaSearch,
  FaExternalLinkAlt,
  FaSyncAlt,
  FaClock,
} from "react-icons/fa";
import { config } from "@/lib/config";

type ESGCategory =
  | "Environmental"
  | "Social"
  | "Governance";

type Disclosure = {
  form: string;
  filingDate: string;
  title: string;
  category: ESGCategory;
  matchedTerms: string[];
  url: string;
};

type Company = {
  name: string;
  ticker: string;
  cik: string;
};

type ApiResponse = {
  success: boolean;
  company?: Company;
  disclosures?: Disclosure[];
  error?: string;
  tracking?: {
    checkedAt?: string;
    filingsScanned?: number;
    nextRecommendedCheck?: string;
  };
};

const categories: ESGCategory[] = [
  "Environmental",
  "Social",
  "Governance",
];

const categoryStyles: Record<ESGCategory, string> = {
  Environmental:
    "bg-emerald-500/10 text-emerald-300",
  Social:
    "bg-blue-500/10 text-blue-300",
  Governance:
    "bg-purple-500/10 text-purple-300",
};

const REFRESH_INTERVAL = 5 * 60 * 1000;

export default function ESGMetricsTracker() {
  const [ticker, setTicker] = useState("");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastChecked, setLastChecked] =
    useState<Date | null>(null);

  const tickerRef = useRef("");
  const requestInProgressRef = useRef(false);

  const fetchESGData = useCallback(
    async (symbol: string, silent = false) => {
      const normalizedSymbol =
        symbol.trim().toUpperCase();

      if (!normalizedSymbol) {
        return;
      }

      // Prevent multiple simultaneous requests.
      if (requestInProgressRef.current) {
        return;
      }

      requestInProgressRef.current = true;

      if (!silent) {
        setLoading(true);
      }

      setError("");

      const controller = new AbortController();

      const timeout = window.setTimeout(() => {
        controller.abort();
      }, 30000);

      try {
        const url =
          `${config.api.baseUrl}/api/esg-disclosures` +
          `?ticker=${encodeURIComponent(
            normalizedSymbol
          )}`;

        console.log("🌱 ESG request:", url);

        const response = await fetch(url, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        console.log(
          "🌱 ESG response status:",
          response.status
        );

        const rawText = await response.text();

        console.log(
          "🌱 ESG response received:",
          rawText.slice(0, 200)
        );

        let result: ApiResponse;

        try {
          result = JSON.parse(rawText);
        } catch {
          throw new Error(
            "The ESG backend returned an invalid JSON response."
          );
        }

        if (!response.ok || !result.success) {
          throw new Error(
            result.error ||
              `ESG request failed (${response.status}).`
          );
        }

        const disclosureCount =
          result.disclosures?.length ?? 0;

        console.log(
          `✅ ESG frontend received ${disclosureCount} disclosures`
        );

        setData(result);
        setLastChecked(new Date());
      } catch (err: unknown) {
        console.error(
          "❌ ESG frontend error:",
          err
        );

        if (
          err instanceof DOMException &&
          err.name === "AbortError"
        ) {
          setError(
            "ESG scan timed out. Please try again."
          );
        } else {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load ESG data."
          );
        }
      } finally {
        window.clearTimeout(timeout);

        requestInProgressRef.current = false;

        // This is the important part:
        // always stop the loading state.
        setLoading(false);
      }
    },
    []
  );

  const searchESG = async () => {
    const symbol =
      ticker.trim().toUpperCase();

    if (!symbol) {
      setError("Please enter a company ticker.");
      return;
    }

    tickerRef.current = symbol;

    await fetchESGData(symbol, false);
  };

  /*
   * Automatic refresh every 5 minutes
   * after a ticker has been searched.
   */
  useEffect(() => {
    const interval = window.setInterval(() => {
      const symbol =
        tickerRef.current;

      if (symbol) {
        fetchESGData(symbol, true);
      }
    }, REFRESH_INTERVAL);

    return () => {
      window.clearInterval(interval);
    };
  }, [fetchESGData]);

  /*
   * Refresh when the user returns to this tab.
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState !== "visible"
      ) {
        return;
      }

      const symbol =
        tickerRef.current;

      if (symbol) {
        fetchESGData(symbol, true);
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [fetchESGData]);

  const disclosures =
    data?.disclosures ?? [];

  const environmentalCount =
    disclosures.filter(
      (item) =>
        item.category === "Environmental"
    ).length;

  const socialCount =
    disclosures.filter(
      (item) =>
        item.category === "Social"
    ).length;

  const governanceCount =
    disclosures.filter(
      (item) =>
        item.category === "Governance"
    ).length;

  return (
    <div className="space-y-6 bg-black p-6 text-white">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
            <FaLeaf />
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              ESG Metrics & Developments
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Automatically track ESG-related disclosures
              from company SEC filings.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (tickerRef.current) {
              fetchESGData(
                tickerRef.current,
                false
              );
            }
          }}
          disabled={
            loading ||
            !tickerRef.current
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaSyncAlt
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />

          {loading
            ? "Checking..."
            : "Refresh"}
        </button>
      </div>

      {/* Search */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <label
          htmlFor="esg-ticker"
          className="mb-2 block text-sm font-medium text-gray-300"
        >
          Company ticker
        </label>

        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />

            <input
              id="esg-ticker"
              type="text"
              value={ticker}
              onChange={(event) => {
                const value =
                  event.target.value.toUpperCase();

                setTicker(value);
                tickerRef.current = value;

                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  searchESG();
                }
              }}
              placeholder="e.g. MSFT"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-lg border border-white/10 bg-gray-900 py-3 pl-10 pr-4 text-white outline-none placeholder:text-gray-600 focus:border-emerald-400"
            />
          </div>

          <button
            type="button"
            onClick={searchESG}
            disabled={
              loading ||
              !ticker.trim()
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-medium transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <FaSyncAlt className="animate-spin" />
            ) : (
              <FaSearch />
            )}

            {loading
              ? "Scanning..."
              : "Scan Filings"}
          </button>
        </div>
      </div>

      {/* Tracking status */}
      {data && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03] px-4 py-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Automatic tracking active
          </div>

          <span className="text-gray-600">
            •
          </span>

          <div className="flex items-center gap-2 text-gray-400">
            <FaClock />

            <span>
              {lastChecked
                ? `Last checked ${lastChecked.toLocaleTimeString()}`
                : "Checked"}
            </span>
          </div>

          <span className="text-gray-600">
            •
          </span>

          <span className="text-gray-500">
            Updates every 5 minutes
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4">
          <p className="text-sm font-medium text-red-300">
            {error}
          </p>
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="space-y-6">
          {/* Company */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-gray-500">
              Company
            </p>

            <p className="mt-1 text-xl font-semibold">
              {data.company?.name ||
                "Unknown company"}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {data.company?.ticker ||
                ticker}

              {data.company?.cik
                ? ` • CIK ${data.company.cik}`
                : ""}
            </p>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-gray-500">
                Environmental
              </p>

              <p className="mt-1 text-3xl font-bold text-emerald-300">
                {environmentalCount}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                detected disclosures
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-gray-500">
                Social
              </p>

              <p className="mt-1 text-3xl font-bold text-blue-300">
                {socialCount}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                detected disclosures
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-gray-500">
                Governance
              </p>

              <p className="mt-1 text-3xl font-bold text-purple-300">
                {governanceCount}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                detected disclosures
              </p>
            </div>
          </div>

          {/* Results */}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
            <div className="border-b border-white/10 px-5 py-4">
              <h3 className="font-semibold">
                ESG-related disclosures
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                {disclosures.length} disclosure
                {disclosures.length === 1
                  ? ""
                  : "s"} detected from SEC filings.
              </p>
            </div>

            {disclosures.length === 0 ? (
              <div className="p-10 text-center">
                <FaLeaf className="mx-auto text-2xl text-gray-600" />

                <p className="mt-3 text-sm text-gray-400">
                  No ESG-related disclosures were
                  detected in the scanned filings.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {disclosures.map(
                  (item, index) => (
                    <div
                      key={`${item.form}-${item.filingDate}-${item.category}-${index}`}
                      className="p-5 hover:bg-white/[0.02]"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                categoryStyles[
                                  item.category
                                ]
                              }`}
                            >
                              {item.category}
                            </span>

                            <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-300">
                              {item.form}
                            </span>

                            <span className="text-xs text-gray-500">
                              {item.filingDate ||
                                "Date unavailable"}
                            </span>
                          </div>

                          <h4 className="mt-2 font-medium">
                            {item.title}
                          </h4>

                          {item.matchedTerms?.length >
                            0 && (
                            <p className="mt-2 text-xs text-gray-500">
                              Matched:{" "}
                              {item.matchedTerms.join(
                                ", "
                              )}
                            </p>
                          )}
                        </div>

                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-blue-300 hover:text-blue-200"
                          >
                            Open SEC
                            <FaExternalLinkAlt size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}