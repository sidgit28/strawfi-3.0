"use client";
import { config } from "@/lib/config";
import { useEffect, useMemo, useState } from "react";
import {
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaSyncAlt,
  FaDatabase,
} from "react-icons/fa";

type Observation = {
  date: string;
  value: number | null;
};

type SeriesResponse = {
  success: boolean;
  series: {
    id: string;
    title: string;
    units: string;
    frequency: string;
    last_updated?: string;
  };
  observations: Observation[];
  error?: string;
};

type Indicator = {
  id: string;
  name: string;
  description: string;
};

const indicators: Indicator[] = [
  {
    id: "PAYEMS",
    name: "Nonfarm Payrolls",
    description:
      "Total nonfarm payroll employment.",
  },
  {
    id: "UNRATE",
    name: "Unemployment Rate",
    description:
      "Civilian unemployment rate.",
  },
  {
    id: "CPIAUCSL",
    name: "Consumer Price Index",
    description:
      "Consumer price index for all urban consumers.",
  },
  {
    id: "FEDFUNDS",
    name: "Federal Funds Rate",
    description:
      "Effective federal funds rate.",
  },
  {
    id: "GDP",
    name: "GDP",
    description:
      "Gross domestic product.",
  },
];

function formatValue(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
}

export default function EconomicDataTracker() {
  const [selectedIndicator, setSelectedIndicator] =
    useState("PAYEMS");

  const [data, setData] =
    useState<SeriesResponse | null>(null);

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const fetchIndicator = async () => {
    setIsLoading(true);
    setError("");

    try {
     const response = await fetch(
  `${config.api.baseUrl}/api/economic-data?series=${encodeURIComponent(
    selectedIndicator
  )}`,
  {
    method: "GET",
    cache: "no-store",
  }
);

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Unable to load economic data."
        );
      }

      setData(result);
    } catch (err: any) {
      console.error(
        "Economic data fetch failed:",
        err
      );

      setData(null);

      setError(
        err?.message ||
          "Unable to load economic data."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIndicator();
  }, [selectedIndicator]);

  const validObservations = useMemo(() => {
    return (
      data?.observations?.filter(
        (item) => item.value !== null
      ) ?? []
    );
  }, [data]);

  const latest =
    validObservations[
      validObservations.length - 1
    ];

  const previous =
    validObservations[
      validObservations.length - 2
    ];

  const change = useMemo(() => {
    if (
      !latest ||
      !previous ||
      latest.value === null ||
      previous.value === null
    ) {
      return null;
    }

    const absolute =
      latest.value - previous.value;

    const percentage =
      previous.value === 0
        ? null
        : (absolute / Math.abs(previous.value)) *
          100;

    return {
      absolute,
      percentage,
    };
  }, [latest, previous]);

  const trend =
    change === null
      ? "flat"
      : change.absolute > 0
      ? "up"
      : change.absolute < 0
      ? "down"
      : "flat";

  const selectedMeta = indicators.find(
    (item) => item.id === selectedIndicator
  );

  return (
    <div className="space-y-6 bg-black p-6 text-white">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
              <FaChartLine />
            </div>

            <div>
              <h2 className="text-2xl font-bold">
                NFP / Economic Data
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Live macroeconomic indicators powered by
                FRED.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchIndicator}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaSyncAlt
            className={isLoading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Indicator selector */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Economic Indicator
        </label>

        <select
          value={selectedIndicator}
          onChange={(event) =>
            setSelectedIndicator(event.target.value)
          }
          className="w-full rounded-lg border border-white/10 bg-gray-900 px-4 py-3 text-white outline-none focus:border-blue-400 md:max-w-xl"
        >
          {indicators.map((indicator) => (
            <option
              key={indicator.id}
              value={indicator.id}
              className="bg-gray-900"
            >
              {indicator.name} ({indicator.id})
            </option>
          ))}
        </select>

        {selectedMeta && (
          <p className="mt-2 text-sm text-gray-500">
            {selectedMeta.description}
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4">
          <p className="text-sm font-medium text-red-300">
            {error}
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && !data ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <FaSyncAlt className="mx-auto animate-spin text-2xl text-blue-300" />
          <p className="mt-3 text-sm text-gray-400">
            Loading economic data...
          </p>
        </div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-gray-500">
                Latest value
              </p>

              <p className="mt-2 text-3xl font-bold">
                {formatValue(
                  latest?.value ?? null
                )}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                {latest
                  ? formatDate(latest.date)
                  : "No observation"}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-gray-500">
                Period change
              </p>

              <div className="mt-2 flex items-center gap-2">
                {trend === "up" ? (
                  <FaArrowUp className="text-emerald-400" />
                ) : trend === "down" ? (
                  <FaArrowDown className="text-red-400" />
                ) : null}

                <span
                  className={`text-3xl font-bold ${
                    trend === "up"
                      ? "text-emerald-400"
                      : trend === "down"
                      ? "text-red-400"
                      : "text-white"
                  }`}
                >
                  {change?.percentage !== null &&
                  change?.percentage !== undefined
                    ? `${change.percentage >= 0 ? "+" : ""}${change.percentage.toFixed(2)}%`
                    : "—"}
                </span>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Compared with previous observation
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-gray-500">
                Frequency
              </p>

              <p className="mt-2 text-2xl font-bold">
                {data.series.frequency || "—"}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                {data.series.units || ""}
              </p>
            </div>
          </div>

          {/* Observation table */}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
              <FaDatabase className="text-blue-300" />

              <div>
                <h3 className="font-semibold">
                  Recent observations
                </h3>

                <p className="text-xs text-gray-500">
                  {data.series.title}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-3">
                      Date
                    </th>

                    <th className="px-5 py-3">
                      Value
                    </th>

                    <th className="px-5 py-3">
                      Change
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {validObservations
                    .slice(-12)
                    .reverse()
                    .map((observation, index, rows) => {
                      const older =
                        rows[index + 1];

                      const delta =
                        older &&
                        observation.value !== null &&
                        older.value !== null
                          ? observation.value -
                            older.value
                          : null;

                      return (
                        <tr
                          key={`${observation.date}-${observation.value}`}
                          className="border-b border-white/5 last:border-0"
                        >
                          <td className="px-5 py-3 text-gray-300">
                            {formatDate(
                              observation.date
                            )}
                          </td>

                          <td className="px-5 py-3 font-medium text-white">
                            {formatValue(
                              observation.value
                            )}
                          </td>

                          <td
                            className={`px-5 py-3 ${
                              delta === null
                                ? "text-gray-500"
                                : delta > 0
                                ? "text-emerald-400"
                                : delta < 0
                                ? "text-red-400"
                                : "text-gray-400"
                            }`}
                          >
                            {delta === null
                              ? "—"
                              : `${delta > 0 ? "+" : ""}${delta.toFixed(2)}`}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-xs text-gray-500">
            Source: Federal Reserve Bank of St. Louis
            (FRED). Last updated:{" "}
            {data.series.last_updated
              ? formatDate(
                  data.series.last_updated.split(" ")[0]
                )
              : "Not available"}
            .
          </div>
        </>
      ) : null}
    </div>
  );
}