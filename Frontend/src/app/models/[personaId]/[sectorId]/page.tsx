"use client";

import { useMemo, useState } from "react";
import { FaArrowLeft, FaCalculator, FaChartLine, FaInfoCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import Header from "../../../components/Header";

type Props = {
  params: {
    personaId: string;
    sectorId: string;
  };
};

type ModelInputs = {
  revenue: number;
  revenueGrowth: number;
  ebitdaMargin: number;
  daPercentRevenue: number;
  capexPercentRevenue: number;
  nwcPercentRevenue: number;
  taxRate: number;
  wacc: number;
  terminalGrowth: number;
  netDebt: number;
  cash: number;
  dilutedShares: number;
};

const personaDefaults: Record<string, Partial<ModelInputs>> = {
  traditionalist: { revenueGrowth: 8, ebitdaMargin: 22, wacc: 10, terminalGrowth: 3 },
  innovator: { revenueGrowth: 16, ebitdaMargin: 24, wacc: 11, terminalGrowth: 4 },
  adventurer: { revenueGrowth: 20, ebitdaMargin: 20, wacc: 12, terminalGrowth: 4 },
  athlete: { revenueGrowth: 11, ebitdaMargin: 23, wacc: 10.5, terminalGrowth: 3.5 },
  artist: { revenueGrowth: 13, ebitdaMargin: 21, wacc: 11, terminalGrowth: 3.5 },
  environmentalist: { revenueGrowth: 9, ebitdaMargin: 20, wacc: 10, terminalGrowth: 3 },
};

const sectorDefaults: Record<string, Partial<ModelInputs>> = {
  technology: { ebitdaMargin: 25, capexPercentRevenue: 4 },
  fintech: { ebitdaMargin: 22, capexPercentRevenue: 3 },
  healthcare: { ebitdaMargin: 20, capexPercentRevenue: 6 },
  energy: { ebitdaMargin: 24, capexPercentRevenue: 12 },
  consumer: { ebitdaMargin: 18, capexPercentRevenue: 5 },
  industrials: { ebitdaMargin: 19, capexPercentRevenue: 7 },
};

const baseInputs: ModelInputs = {
  revenue: 1000,
  revenueGrowth: 10,
  ebitdaMargin: 22,
  daPercentRevenue: 4,
  capexPercentRevenue: 5,
  nwcPercentRevenue: 3,
  taxRate: 25,
  wacc: 10,
  terminalGrowth: 3,
  netDebt: 250,
  cash: 100,
  dilutedShares: 100,
};

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value: number, decimals = 1) {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return "—";
  return `$${formatNumber(value, 1)}`;
}

function normalizeLabel(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function FinancialModelPage({ params }: Props) {
  const router = useRouter();
  const persona = normalizeLabel(params.personaId || "investor");
  const sector = normalizeLabel(params.sectorId || "company");

  const defaults = useMemo<ModelInputs>(() => {
    return {
      ...baseInputs,
      ...(personaDefaults[params.personaId] || {}),
      ...(sectorDefaults[params.sectorId] || {}),
    };
  }, [params.personaId, params.sectorId]);

  const [inputs, setInputs] = useState<ModelInputs>(defaults);
  const [forecastYears, setForecastYears] = useState(5);

  const updateInput = (field: keyof ModelInputs, value: string) => {
    setInputs((current) => ({
      ...current,
      [field]: toNumber(value),
    }));
  };

  const resetModel = () => setInputs(defaults);

  const model = useMemo(() => {
    const years = Array.from({ length: forecastYears }, (_, index) => index + 1);
    const projections: Array<{
      year: number;
      revenue: number;
      ebitda: number;
      depreciation: number;
      ebit: number;
      taxes: number;
      nopat: number;
      capex: number;
      nwc: number;
      changeNwc: number;
      ufcf: number;
      discountFactor: number;
      pvUfcf: number;
    }> = [];

    let priorRevenue = Math.max(inputs.revenue, 0);
    let previousNwc = priorRevenue * (inputs.nwcPercentRevenue / 100);

    years.forEach((year) => {
      const revenue = priorRevenue * (1 + inputs.revenueGrowth / 100);
      const ebitda = revenue * (inputs.ebitdaMargin / 100);
      const depreciation = revenue * (inputs.daPercentRevenue / 100);
      const ebit = ebitda - depreciation;
      const taxes = Math.max(ebit, 0) * (inputs.taxRate / 100);
      const nopat = ebit - taxes;
      const capex = revenue * (inputs.capexPercentRevenue / 100);
      const nwc = revenue * (inputs.nwcPercentRevenue / 100);
      const changeNwc = nwc - previousNwc;
      const ufcf = nopat + depreciation - capex - changeNwc;
      const discountFactor = 1 / Math.pow(1 + inputs.wacc / 100, year);
      const pvUfcf = ufcf * discountFactor;

      projections.push({
        year,
        revenue,
        ebitda,
        depreciation,
        ebit,
        taxes,
        nopat,
        capex,
        nwc,
        changeNwc,
        ufcf,
        discountFactor,
        pvUfcf,
      });

      priorRevenue = revenue;
      previousNwc = nwc;
    });

    const last = projections[projections.length - 1];
    const terminalDenominator = inputs.wacc - inputs.terminalGrowth;
    const terminalValue =
      last && terminalDenominator > 0
        ? (last.ufcf * (1 + inputs.terminalGrowth / 100)) /
          (terminalDenominator / 100)
        : NaN;
    const pvTerminal =
      last && Number.isFinite(terminalValue)
        ? terminalValue * last.discountFactor
        : NaN;
    const pvForecast = projections.reduce((sum, row) => sum + row.pvUfcf, 0);
    const enterpriseValue = pvForecast + (Number.isFinite(pvTerminal) ? pvTerminal : 0);
    const equityValue = enterpriseValue - inputs.netDebt + inputs.cash;
    const impliedSharePrice =
      inputs.dilutedShares > 0 ? equityValue / inputs.dilutedShares : NaN;
    const terminalValueShare =
      enterpriseValue > 0 && Number.isFinite(pvTerminal)
        ? (pvTerminal / enterpriseValue) * 100
        : NaN;

    return {
      projections,
      terminalValue,
      pvTerminal,
      pvForecast,
      enterpriseValue,
      equityValue,
      impliedSharePrice,
      terminalValueShare,
    };
  }, [forecastYears, inputs]);

  const sensitivity = useMemo(() => {
    const growthRates = [inputs.terminalGrowth - 1, inputs.terminalGrowth, inputs.terminalGrowth + 1];
    const waccRates = [inputs.wacc - 1, inputs.wacc, inputs.wacc + 1];
    const last = model.projections[model.projections.length - 1];

    return waccRates.map((wacc) => ({
      wacc,
      values: growthRates.map((growth) => {
        const denominator = wacc - growth;
        if (!last || denominator <= 0 || inputs.dilutedShares <= 0) return NaN;

        const terminalValue =
          (last.ufcf * (1 + growth / 100)) / (denominator / 100);
        const pvTerminal = terminalValue * last.discountFactor;
        const equityValue = model.pvForecast + pvTerminal - inputs.netDebt + inputs.cash;
        return equityValue / inputs.dilutedShares;
      }),
    }));
  }, [inputs, model]);

  const fields: Array<{ key: keyof ModelInputs; label: string; suffix?: string; step?: string }> = [
    { key: "revenue", label: "Base Revenue", suffix: "m" },
    { key: "revenueGrowth", label: "Revenue Growth", suffix: "%", step: "0.1" },
    { key: "ebitdaMargin", label: "EBITDA Margin", suffix: "%", step: "0.1" },
    { key: "daPercentRevenue", label: "D&A / Revenue", suffix: "%", step: "0.1" },
    { key: "capexPercentRevenue", label: "CapEx / Revenue", suffix: "%", step: "0.1" },
    { key: "nwcPercentRevenue", label: "NWC / Revenue", suffix: "%", step: "0.1" },
    { key: "taxRate", label: "Tax Rate", suffix: "%", step: "0.1" },
    { key: "wacc", label: "WACC", suffix: "%", step: "0.1" },
    { key: "terminalGrowth", label: "Terminal Growth", suffix: "%", step: "0.1" },
    { key: "netDebt", label: "Net Debt", suffix: "m" },
    { key: "cash", label: "Cash", suffix: "m" },
    { key: "dilutedShares", label: "Diluted Shares", suffix: "m" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Header
        showBackButton
        backUrl={`/options/${params.personaId}/${params.sectorId}`}
        backText="Back to Analysis Tools"
      />

      <main className="container mx-auto px-4 pb-16 pt-28">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-medium text-blue-300">
              <FaCalculator />
              Personalised Financial Model
            </div>
            <h1 className="text-4xl font-bold">DCF Valuation Builder</h1>
            <p className="mt-3 max-w-3xl text-gray-400">
              Built for a <span className="text-white">{persona}</span> investor in the{' '}
              <span className="text-white">{sector}</span> sector. Adjust the assumptions and the model recalculates instantly.
            </p>
          </div>

          <button
            type="button"
            onClick={resetModel}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/10"
          >
            Reset assumptions
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200">
          <div className="flex items-start gap-3">
            <FaInfoCircle className="mt-0.5 shrink-0" />
            <p>
              These are model assumptions, not live market data. The builder is designed so live company inputs can be connected later without changing the valuation engine.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Model Assumptions</h2>
                <p className="mt-1 text-xs text-gray-500">Values in $m unless noted.</p>
              </div>
              <select
                value={forecastYears}
                onChange={(event) => setForecastYears(Number(event.target.value))}
                className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value={5}>5 years</option>
                <option value={7}>7 years</option>
                <option value={10}>10 years</option>
              </select>
            </div>

            <div className="space-y-4">
              {fields.map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-400">
                    {field.label}
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      step={field.step || "1"}
                      value={inputs[field.key]}
                      onChange={(event) => updateInput(field.key, event.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2.5 pr-12 text-sm text-white outline-none transition focus:border-blue-500"
                    />
                    {field.suffix && (
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                        {field.suffix}
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </section>

          <div className="space-y-6">
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <MetricCard label="Enterprise Value" value={formatCurrency(model.enterpriseValue)} />
              <MetricCard label="Equity Value" value={formatCurrency(model.equityValue)} />
              <MetricCard label="Implied Share Price" value={formatCurrency(model.impliedSharePrice)} highlight />
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SmallMetric label="PV of Forecast FCF" value={formatCurrency(model.pvForecast)} />
              <SmallMetric label="PV of Terminal Value" value={formatCurrency(model.pvTerminal)} />
              <SmallMetric label="Terminal Value / EV" value={`${formatNumber(model.terminalValueShare, 1)}%`} />
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">5–10 Year Forecast</h2>
                  <p className="mt-1 text-xs text-gray-500">Unlevered free cash flow projection</p>
                </div>
                <FaChartLine className="text-blue-300" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[840px] text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs text-gray-500">
                      <th className="px-3 py-3">Year</th>
                      <th className="px-3 py-3 text-right">Revenue</th>
                      <th className="px-3 py-3 text-right">EBITDA</th>
                      <th className="px-3 py-3 text-right">EBIT</th>
                      <th className="px-3 py-3 text-right">CapEx</th>
                      <th className="px-3 py-3 text-right">Δ NWC</th>
                      <th className="px-3 py-3 text-right">UFCF</th>
                      <th className="px-3 py-3 text-right">PV UFCF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.projections.map((row) => (
                      <tr key={row.year} className="border-b border-white/5">
                        <td className="px-3 py-3 font-medium">Year {row.year}</td>
                        <td className="px-3 py-3 text-right">{formatNumber(row.revenue)}</td>
                        <td className="px-3 py-3 text-right">{formatNumber(row.ebitda)}</td>
                        <td className="px-3 py-3 text-right">{formatNumber(row.ebit)}</td>
                        <td className="px-3 py-3 text-right">{formatNumber(row.capex)}</td>
                        <td className="px-3 py-3 text-right">{formatNumber(row.changeNwc)}</td>
                        <td className="px-3 py-3 text-right font-semibold text-emerald-300">{formatNumber(row.ufcf)}</td>
                        <td className="px-3 py-3 text-right">{formatNumber(row.pvUfcf)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">WACC / Terminal Growth Sensitivity</h2>
                <p className="mt-1 text-xs text-gray-500">Implied share price sensitivity.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full max-w-2xl text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-gray-500">
                      <th className="px-4 py-3 text-left">WACC \ Terminal Growth</th>
                      <th className="px-4 py-3 text-right">{formatNumber(inputs.terminalGrowth - 1, 1)}%</th>
                      <th className="px-4 py-3 text-right">{formatNumber(inputs.terminalGrowth, 1)}%</th>
                      <th className="px-4 py-3 text-right">{formatNumber(inputs.terminalGrowth + 1, 1)}%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sensitivity.map((row) => (
                      <tr key={row.wacc} className="border-b border-white/5">
                        <td className="px-4 py-3 font-medium">{formatNumber(row.wacc, 1)}%</td>
                        {row.values.map((value, index) => (
                          <td
                            key={`${row.wacc}-${index}`}
                            className={`px-4 py-3 text-right font-semibold ${
                              Math.abs(row.wacc - inputs.wacc) < 0.001 && index === 1
                                ? "bg-blue-500/10 text-blue-300"
                                : "text-white"
                            }`}
                          >
                            {formatCurrency(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-xl border border-blue-400/20 bg-blue-500/5 p-5">
              <h3 className="font-semibold text-blue-200">Model interpretation</h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                The valuation is driven primarily by forecast free cash flow, WACC and terminal growth. A high terminal-value share of enterprise value means the result is more sensitive to long-term assumptions.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <Interpretation label="Growth case" value={`${formatNumber(inputs.revenueGrowth, 1)}% revenue growth`} />
                <Interpretation label="Profitability" value={`${formatNumber(inputs.ebitdaMargin, 1)}% EBITDA margin`} />
                <Interpretation label="Discount rate" value={`${formatNumber(inputs.wacc, 1)}% WACC`} />
              </div>
            </section>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push(`/options/${params.personaId}/${params.sectorId}`)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white"
          >
            <FaArrowLeft />
            Back to Analysis Tools
          </button>
        </div>
      </main>
    </div>
  );
}

function MetricCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight
          ? "border-blue-400/30 bg-blue-500/10"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${highlight ? "text-blue-300" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-100">{value}</p>
    </div>
  );
}

function Interpretation({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-200">{value}</p>
    </div>
  );
}
