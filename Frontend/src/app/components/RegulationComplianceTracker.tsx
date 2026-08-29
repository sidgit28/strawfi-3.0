"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaGavel,
  FaSearch,
  FaSyncAlt,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { config } from "@/lib/config";

type RegulatoryItem = {
  title: string;
  description: string;
  date: string;
  link: string;
  guid?: string;
  category: string;
};

type ApiResponse = {
  success: boolean;
  items?: RegulatoryItem[];
  error?: string;
};

const categories = [
  "All",
  "Rules",
  "Enforcement",
  "Markets",
  "Reporting",
  "Other",
];

function classifyItem(title: string): string {
  const value = title.toLowerCase();

  if (
    value.includes("rule") ||
    value.includes("regulation") ||
    value.includes("proposes") ||
    value.includes("adopts")
  ) {
    return "Rules";
  }

  if (
    value.includes("charges") ||
    value.includes("fraud") ||
    value.includes("enforcement") ||
    value.includes("penalty")
  ) {
    return "Enforcement";
  }

  if (
    value.includes("market") ||
    value.includes("trading") ||
    value.includes("exchange") ||
    value.includes("derivatives")
  ) {
    return "Markets";
  }

  if (
    value.includes("reporting") ||
    value.includes("disclosure") ||
    value.includes("filing") ||
    value.includes("financial reporting")
  ) {
    return "Reporting";
  }

  return "Other";
}

export default function RegulationComplianceTracker() {
  const [items, setItems] = useState<RegulatoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRegulatoryNews = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${config.api.baseUrl}/api/regulation-compliance`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result: ApiResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Unable to load regulatory developments."
        );
      }

      setItems(result.items || []);
    } catch (err: any) {
      console.error(
        "Regulation feed error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load regulatory developments."
      );

      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegulatoryNews();
  }, []);

  const enrichedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        category:
          item.category ||
          classifyItem(item.title),
      })),
    [items]
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery =
      query.trim().toLowerCase();

    return enrichedItems.filter((item) => {
      const categoryMatches =
        selectedCategory === "All" ||
        item.category === selectedCategory;

      const queryMatches =
        !normalizedQuery ||
        item.title
          .toLowerCase()
          .includes(normalizedQuery) ||
        item.description
          .toLowerCase()
          .includes(normalizedQuery);

      return categoryMatches && queryMatches;
    });
  }, [
    enrichedItems,
    query,
    selectedCategory,
  ]);

  return (
    <div className="space-y-6 bg-black p-6 text-white">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
            <FaGavel />
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              Regulation & Compliance
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Monitor official SEC regulatory and enforcement
              developments.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchRegulatoryNews}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaSyncAlt
            className={
              loading ? "animate-spin" : ""
            }
          />
          Refresh
        </button>
      </div>

      {/* Search / filters */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />

          <input
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            placeholder="Search regulation, disclosure, markets, enforcement..."
            className="w-full rounded-lg border border-white/10 bg-gray-900 py-3 pl-10 pr-4 text-white outline-none focus:border-blue-400"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => {
            const active =
              selectedCategory === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() =>
                  setSelectedCategory(category)
                }
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-blue-600 text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4">
          <p className="text-sm text-red-300">
            {error}
          </p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <FaSyncAlt className="mx-auto animate-spin text-2xl text-blue-300" />

          <p className="mt-3 text-sm text-gray-400">
            Loading SEC regulatory developments...
          </p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-gray-500">
                Developments
              </p>

              <p className="mt-1 text-3xl font-bold">
                {filteredItems.length}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-gray-500">
                Rules & regulations
              </p>

              <p className="mt-1 text-3xl font-bold">
                {
                  enrichedItems.filter(
                    (item) =>
                      item.category === "Rules"
                  ).length
                }
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-gray-500">
                Enforcement
              </p>

              <p className="mt-1 text-3xl font-bold">
                {
                  enrichedItems.filter(
                    (item) =>
                      item.category === "Enforcement"
                  ).length
                }
              </p>
            </div>
          </div>

          {/* Feed */}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
            <div className="border-b border-white/10 px-5 py-4">
              <h3 className="font-semibold">
                Latest developments
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Official SEC source
              </p>
            </div>

            {filteredItems.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">
                No regulatory developments match
                your search.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredItems.map((item, index) => (
                  <article
                    key={
                      item.guid ||
                      `${item.date}-${index}-${item.title}`
                    }
                    className="p-5 transition hover:bg-white/[0.03]"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-300">
                            {item.category}
                          </span>

                          <span className="text-xs text-gray-500">
                            {item.date}
                          </span>
                        </div>

                        <h4 className="mt-2 text-base font-semibold text-white">
                          {item.title}
                        </h4>

                        {item.description && (
                          <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-400">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-blue-300 hover:text-blue-200"
                      >
                        View SEC
                        <FaExternalLinkAlt size={11} />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500">
            Source: U.S. Securities and Exchange
            Commission Press Releases RSS feed.
          </div>
        </>
      )}
    </div>
  );
}