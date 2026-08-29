"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatedSection } from "./AnimatedSection";
import { FaCheckCircle, FaSpinner, FaSave, FaCalculator, FaUndo } from "react-icons/fa";
import ChatBot from "./ChatBot";

type PersonaId =
  | "traditionalist"
  | "innovator"
  | "adventurer"
  | "athlete"
  | "artist"
  | "environmentalist";

type Scenario = "bear" | "base" | "bull";

type ModelAssumptions = {
  revenue: number;
  growth: number;
  ebitdaMargin: number;
  taxRate: number;
  capexPercent: number;
  workingCapitalPercent: number;
  depreciationPercent: number;
  wacc: number;
  terminalGrowth: number;
  sharesOutstanding: number;
  netDebt: number;
};

type ProjectionYear = {
  year: number;
  revenue: number;
  ebitda: number;
  ebit: number;
  taxes: number;
  nopat: number;
  depreciation: number;
  capex: number;
  changeInWorkingCapital: number;
  freeCashFlow: number;
  discountFactor: number;
  presentValue: number;
};

type ModelState = {
  persona: PersonaId;
  companyName: string;
  ticker: string;
  scenario: Scenario;
  assumptions: ModelAssumptions;
};

const personas: {
  id: PersonaId;
  name: string;
  description: string;
  icon: string;
  color: string;
  traits: string[];
  defaults: ModelAssumptions;
}[] = [
  {
    id: "traditionalist",
    name: "Traditionalist",
    description:
      "Prefer proven strategies and stable, long-term investments. You value consistency, reliability, and disciplined valuation.",
    icon: "🏛️",
    color: "from-green-500 to-emerald-500",
    traits: ["Disciplined", "Patient", "Value-focused"],
    defaults: {
      revenue: 1000,
      growth: 0.06,
      ebitdaMargin: 0.22,
      taxRate: 0.25,
      capexPercent: 0.05,
      workingCapitalPercent: 0.02,
      depreciationPercent: 0.04,
      wacc: 0.1,
      terminalGrowth: 0.025,
      sharesOutstanding: 100,
      netDebt: 250,
    },
  },
  {
    id: "innovator",
    name: "Innovator",
    description:
      "Focus on emerging markets, disruptive technologies, and strong long-term growth opportunities.",
    icon: "🚀",
    color: "from-blue-500 to-cyan-500",
    traits: ["Forward-thinking", "Tech-savvy", "Growth-focused"],
    defaults: {
      revenue: 1000,
      growth: 0.14,
      ebitdaMargin: 0.2,
      taxRate: 0.23,
      capexPercent: 0.07,
      workingCapitalPercent: 0.025,
      depreciationPercent: 0.045,
      wacc: 0.105,
      terminalGrowth: 0.04,
      sharesOutstanding: 100,
      netDebt: 200,
    },
  },
  {
    id: "adventurer",
    name: "Adventurer",
    description:
      "Willing to explore unconventional opportunities and accept greater volatility for potentially higher returns.",
    icon: "🏃",
    color: "from-orange-500 to-red-500",
    traits: ["Risk-tolerant", "Adaptable", "Opportunity-seeker"],
    defaults: {
      revenue: 1000,
      growth: 0.18,
      ebitdaMargin: 0.19,
      taxRate: 0.23,
      capexPercent: 0.08,
      workingCapitalPercent: 0.03,
      depreciationPercent: 0.05,
      wacc: 0.125,
      terminalGrowth: 0.05,
      sharesOutstanding: 100,
      netDebt: 175,
    },
  },
  {
    id: "athlete",
    name: "Athlete",
    description:
      "Performance-driven and disciplined, with strong emphasis on measurable targets and operating efficiency.",
    icon: "🏆",
    color: "from-purple-500 to-indigo-500",
    traits: ["Goal-oriented", "Competitive", "Consistent"],
    defaults: {
      revenue: 1000,
      growth: 0.09,
      ebitdaMargin: 0.24,
      taxRate: 0.24,
      capexPercent: 0.05,
      workingCapitalPercent: 0.02,
      depreciationPercent: 0.04,
      wacc: 0.095,
      terminalGrowth: 0.03,
      sharesOutstanding: 100,
      netDebt: 225,
    },
  },
  {
    id: "artist",
    name: "Artist",
    description:
      "Approach investments creatively, searching for differentiated business models and overlooked growth opportunities.",
    icon: "🎨",
    color: "from-pink-500 to-rose-500",
    traits: ["Creative", "Intuitive", "Differentiated"],
    defaults: {
      revenue: 1000,
      growth: 0.11,
      ebitdaMargin: 0.21,
      taxRate: 0.24,
      capexPercent: 0.06,
      workingCapitalPercent: 0.023,
      depreciationPercent: 0.04,
      wacc: 0.11,
      terminalGrowth: 0.035,
      sharesOutstanding: 100,
      netDebt: 200,
    },
  },
  {
    id: "environmentalist",
    name: "Environmentalist",
    description:
      "Prioritize sustainable growth, resilience, responsible capital allocation, and long-term impact.",
    icon: "🌍",
    color: "from-emerald-500 to-teal-500",
    traits: ["Responsible", "Patient", "Impact-focused"],
    defaults: {
      revenue: 1000,
      growth: 0.08,
      ebitdaMargin: 0.21,
      taxRate: 0.24,
      capexPercent: 0.06,
      workingCapitalPercent: 0.022,
      depreciationPercent: 0.04,
      wacc: 0.1,
      terminalGrowth: 0.03,
      sharesOutstanding: 100,
      netDebt: 220,
    },
  },
];

const scenarioAdjustments: Record<
  Scenario,
  Partial<ModelAssumptions>
> = {
  bear: {
    growth: -0.04,
    ebitdaMargin: -0.03,
    wacc: 0.015,
    terminalGrowth: -0.01,
  },
  base: {},
  bull: {
    growth: 0.04,
    ebitdaMargin: 0.03,
    wacc: -0.01,
    terminalGrowth: 0.01,
  },
};

function applyScenario(
  assumptions: ModelAssumptions,
  scenario: Scenario
): ModelAssumptions {
  const adjustment =
    scenarioAdjustments[scenario];

  return {
    ...assumptions,
    growth:
      assumptions.growth +
      (adjustment.growth ?? 0),
    ebitdaMargin:
      assumptions.ebitdaMargin +
      (adjustment.ebitdaMargin ?? 0),
    wacc:
      assumptions.wacc +
      (adjustment.wacc ?? 0),
    terminalGrowth:
      assumptions.terminalGrowth +
      (adjustment.terminalGrowth ?? 0),
  };
}

function calculateProjection(
  assumptions: ModelAssumptions
): ProjectionYear[] {
  const projections: ProjectionYear[] = [];

  let previousRevenue =
    assumptions.revenue;

  for (let i = 1; i <= 5; i++) {
    const revenue =
      previousRevenue *
      (1 + assumptions.growth);

    const ebitda =
      revenue *
      assumptions.ebitdaMargin;

    const depreciation =
      revenue *
      assumptions.depreciationPercent;

    const ebit =
      ebitda - depreciation;

    const taxes =
      Math.max(0, ebit) *
      assumptions.taxRate;

    const nopat =
      ebit - taxes;

    const capex =
      revenue *
      assumptions.capexPercent;

    const workingCapital =
      revenue *
      assumptions.workingCapitalPercent;

    const previousWorkingCapital =
      previousRevenue *
      assumptions.workingCapitalPercent;

    const changeInWorkingCapital =
      workingCapital -
      previousWorkingCapital;

    const freeCashFlow =
      nopat +
      depreciation -
      capex -
      changeInWorkingCapital;

    const discountFactor =
      1 /
      Math.pow(
        1 + assumptions.wacc,
        i
      );

    const presentValue =
      freeCashFlow *
      discountFactor;

    projections.push({
      year:
        new Date().getFullYear() +
        i,
      revenue,
      ebitda,
      ebit,
      taxes,
      nopat,
      depreciation,
      capex,
      changeInWorkingCapital,
      freeCashFlow,
      discountFactor,
      presentValue,
    });

    previousRevenue = revenue;
  }

  return projections;
}

function calculateDCF(
  projections: ProjectionYear[],
  assumptions: ModelAssumptions
) {
  const explicitValue =
    projections.reduce(
      (sum, year) =>
        sum + year.presentValue,
      0
    );

  const finalYear =
    projections[projections.length - 1];

  const terminalCashFlow =
    finalYear.freeCashFlow *
    (1 + assumptions.terminalGrowth);

  const terminalValue =
    terminalCashFlow /
    (assumptions.wacc -
      assumptions.terminalGrowth);

  const terminalPresentValue =
    terminalValue *
    finalYear.discountFactor;

  const enterpriseValue =
    explicitValue +
    terminalPresentValue;

  const equityValue =
    enterpriseValue -
    assumptions.netDebt;

  const valuePerShare =
    equityValue /
    Math.max(
      assumptions.sharesOutstanding,
      0.0001
    );

  return {
    explicitValue,
    terminalValue,
    terminalPresentValue,
    enterpriseValue,
    equityValue,
    valuePerShare,
  };
}

function formatMoney(
  value: number
): string {
  return `$${value.toFixed(1)}`;
}

function formatPercent(
  value: number
): string {
  return `${(value * 100).toFixed(1)}%`;
}

export default function PersonaSelector() {
  const [selectedPersona, setSelectedPersona] =
    useState<PersonaId | null>(null);

  const [showChatbot, setShowChatbot] =
    useState(false);

  const [isSavingPersona, setIsSavingPersona] =
    useState(false);

  const [companyName, setCompanyName] =
    useState("");

  const [ticker, setTicker] =
    useState("");

  const [scenario, setScenario] =
    useState<Scenario>("base");

  const [assumptions, setAssumptions] =
    useState<ModelAssumptions | null>(null);

  const [savedMessage, setSavedMessage] =
    useState("");

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(
          "strawfi_personalised_model"
        );

      if (!stored) return;

      const parsed =
        JSON.parse(stored) as ModelState;

      if (
        parsed.persona &&
        parsed.assumptions
      ) {
        setSelectedPersona(parsed.persona);
        setCompanyName(
          parsed.companyName || ""
        );
        setTicker(parsed.ticker || "");
        setScenario(
          parsed.scenario || "base"
        );
        setAssumptions(
          parsed.assumptions
        );
      }
    } catch (error) {
      console.warn(
        "Unable to restore financial model:",
        error
      );
    }
  }, []);

  const selectedPersonaData =
    selectedPersona
      ? personas.find(
          (persona) =>
            persona.id === selectedPersona
        )
      : null;

  const effectiveAssumptions =
    assumptions
      ? applyScenario(
          assumptions,
          scenario
        )
      : null;

  const projections = useMemo(() => {
    if (!effectiveAssumptions) {
      return [];
    }

    return calculateProjection(
      effectiveAssumptions
    );
  }, [effectiveAssumptions]);

  const valuation = useMemo(() => {
    if (
      !effectiveAssumptions ||
      projections.length === 0
    ) {
      return null;
    }

    return calculateDCF(
      projections,
      effectiveAssumptions
    );
  }, [
    effectiveAssumptions,
    projections,
  ]);

  const sensitivity = useMemo(() => {
    if (
      !assumptions ||
      !valuation
    ) {
      return [];
    }

    const waccValues = [
      effectiveAssumptions!.wacc - 0.02,
      effectiveAssumptions!.wacc - 0.01,
      effectiveAssumptions!.wacc,
      effectiveAssumptions!.wacc + 0.01,
      effectiveAssumptions!.wacc + 0.02,
    ];

    const growthValues = [
      effectiveAssumptions!.terminalGrowth - 0.01,
      effectiveAssumptions!.terminalGrowth - 0.005,
      effectiveAssumptions!.terminalGrowth,
      effectiveAssumptions!.terminalGrowth + 0.005,
      effectiveAssumptions!.terminalGrowth + 0.01,
    ];

    return growthValues.map(
      (growth) => ({
        growth,
        values: waccValues.map(
          (wacc) => {
            const modifiedAssumptions =
              {
                ...effectiveAssumptions!,
                wacc,
                terminalGrowth:
                  Math.max(
                    0.001,
                    growth
                  ),
              };

            const modifiedProjections =
              calculateProjection(
                modifiedAssumptions
              );

            const modifiedValuation =
              calculateDCF(
                modifiedProjections,
                modifiedAssumptions
              );

            return modifiedValuation.valuePerShare;
          }
        ),
      })
    );
  }, [
    assumptions,
    effectiveAssumptions,
    valuation,
  ]);

  const handlePersonaSelect = async (
    personaId: PersonaId
  ) => {
    const persona =
      personas.find(
        (item) =>
          item.id === personaId
      );

    if (!persona) return;

    setSelectedPersona(personaId);
    setAssumptions(
      persona.defaults
    );
    setScenario("base");
    setSavedMessage("");

    setIsSavingPersona(true);

    try {
      localStorage.setItem(
        "strawfi_selected_persona",
        personaId
      );

      try {
        await fetch("/api/persona", {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            persona: personaId,
          }),
        });
      } catch (error) {
        console.warn(
          "Persona API unavailable; continuing locally:",
          error
        );
      }
    } finally {
      setIsSavingPersona(false);
    }
  };

  const updateAssumption = (
    key: keyof ModelAssumptions,
    value: number
  ) => {
    setAssumptions(
      (current) =>
        current
          ? {
              ...current,
              [key]: value,
            }
          : current
    );

    setSavedMessage("");
  };

  const resetModel = () => {
    if (!selectedPersonaData) return;

    setAssumptions(
      selectedPersonaData.defaults
    );
    setScenario("base");
    setSavedMessage("");
  };

  const saveModel = () => {
    if (
      !selectedPersona ||
      !assumptions
    ) {
      return;
    }

    const model: ModelState = {
      persona: selectedPersona,
      companyName,
      ticker,
      scenario,
      assumptions,
    };

    try {
      localStorage.setItem(
        "strawfi_personalised_model",
        JSON.stringify(model)
      );

      setSavedMessage(
        "Model saved successfully."
      );
    } catch (error) {
      console.error(
        "Unable to save model:",
        error
      );

      setSavedMessage(
        "Unable to save the model."
      );
    }
  };

  return (
    <div className="space-y-10">
      {/* INTRO */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">
          Personalised Financial Models
        </h2>

        <p className="mx-auto mt-3 max-w-3xl text-sm text-white/60">
          Choose an investment style and build a transparent
          financial model tailored to that approach.
        </p>
      </div>

      {/* PERSONA SELECTION */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {personas.map(
          (persona, index) => (
            <AnimatedSection
              key={persona.id}
              delay={index * 0.05}
              animation="slide"
            >
              <button
                type="button"
                onClick={() =>
                  handlePersonaSelect(
                    persona.id
                  )
                }
                className={`h-full w-full rounded-xl border-2 p-6 text-left transition-all ${
                  selectedPersona ===
                  persona.id
                    ? "border-blue-400 bg-white/10 shadow-lg shadow-blue-900/20"
                    : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]"
                }`}
              >
                <div className="flex items-center">
                  <div className="text-4xl">
                    {persona.icon}
                  </div>

                  <h3 className="ml-3 text-xl font-semibold text-white">
                    {persona.name}
                  </h3>

                  {selectedPersona ===
                    persona.id && (
                    <FaCheckCircle className="ml-auto text-blue-400" />
                  )}
                </div>

                <p className="mt-4 text-sm leading-6 text-white/60">
                  {persona.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {persona.traits.map(
                    (trait) => (
                      <span
                        key={trait}
                        className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70"
                      >
                        {trait}
                      </span>
                    )
                  )}
                </div>

                <div
                  className={`mt-5 h-1 w-full rounded-full bg-gradient-to-r ${persona.color}`}
                />
              </button>
            </AnimatedSection>
          )
        )}
      </div>

      {/* MODEL */}
      {selectedPersona &&
        selectedPersonaData &&
        assumptions && (
          <AnimatedSection animation="fade">
            <div className="space-y-6">
              {/* Persona summary */}
              <div
                className={`rounded-2xl border border-white/10 bg-gradient-to-r ${selectedPersonaData.color} bg-opacity-10 p-6`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-4xl">
                    {selectedPersonaData.icon}
                  </div>

                  <div>
                    <p className="text-sm text-white/50">
                      Selected investment style
                    </p>

                    <h3 className="text-2xl font-bold text-white">
                      {selectedPersonaData.name}
                    </h3>

                    <p className="mt-1 text-sm text-white/60">
                      Your model starts with assumptions tailored
                      to this investment style. Every assumption
                      remains editable.
                    </p>
                  </div>

                  {isSavingPersona && (
                    <FaSpinner className="ml-auto animate-spin text-blue-300" />
                  )}
                </div>
              </div>

              {/* Model header */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-sm text-white/50">
                      Financial Model
                    </p>

                    <h3 className="mt-1 text-2xl font-bold text-white">
                      {companyName ||
                        ticker ||
                        "Untitled Company Model"}
                    </h3>

                    <p className="mt-1 text-sm text-white/50">
                      {ticker
                        ? `${ticker.toUpperCase()} • `
                        : ""}
                      {selectedPersonaData.name} framework
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        "bear",
                        "base",
                        "bull",
                      ] as Scenario[]
                    ).map(
                      (value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setScenario(
                              value
                            )
                          }
                          className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
                            scenario ===
                            value
                              ? "bg-blue-600 text-white"
                              : "bg-white/5 text-white/60 hover:bg-white/10"
                          }`}
                        >
                          {value}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={
                        resetModel
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
                    >
                      <FaUndo />
                      Reset
                    </button>

                    <button
                      type="button"
                      onClick={
                        saveModel
                      }
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      <FaSave />
                      Save Model
                    </button>
                  </div>
                </div>

                {savedMessage && (
                  <p className="mt-4 text-sm text-emerald-300">
                    {savedMessage}
                  </p>
                )}
              </div>

              {/* Company inputs */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                  <label className="text-sm font-medium text-white/80">
                    Company Name
                  </label>

                  <input
                    value={companyName}
                    onChange={(event) =>
                      setCompanyName(
                        event.target.value
                      )
                    }
                    placeholder="e.g. Microsoft"
                    className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 p-3 text-white outline-none placeholder:text-white/30 focus:border-blue-500"
                  />
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                  <label className="text-sm font-medium text-white/80">
                    Ticker
                  </label>

                  <input
                    value={ticker}
                    onChange={(event) =>
                      setTicker(
                        event.target.value.toUpperCase()
                      )
                    }
                    placeholder="e.g. MSFT"
                    className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 p-3 text-white outline-none placeholder:text-white/30 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Assumptions */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300">
                    <FaCalculator />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold">
                      Model Assumptions
                    </h3>

                    <p className="text-sm text-white/50">
                      {scenario === "base"
                        ? "Base case assumptions"
                        : `${scenario.toUpperCase()} case adjustments applied`}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <ModelInput
                    label="Starting Revenue"
                    value={assumptions.revenue}
                    onChange={(value) =>
                      updateAssumption(
                        "revenue",
                        value
                      )
                    }
                    suffix="M"
                    min={1}
                  />

                  <ModelInput
                    label="Revenue Growth"
                    value={
                      assumptions.growth *
                      100
                    }
                    onChange={(value) =>
                      updateAssumption(
                        "growth",
                        value / 100
                      )
                    }
                    suffix="%"
                  />

                  <ModelInput
                    label="EBITDA Margin"
                    value={
                      assumptions.ebitdaMargin *
                      100
                    }
                    onChange={(value) =>
                      updateAssumption(
                        "ebitdaMargin",
                        value / 100
                      )
                    }
                    suffix="%"
                  />

                  <ModelInput
                    label="Tax Rate"
                    value={
                      assumptions.taxRate *
                      100
                    }
                    onChange={(value) =>
                      updateAssumption(
                        "taxRate",
                        value / 100
                      )
                    }
                    suffix="%"
                  />

                  <ModelInput
                    label="CapEx"
                    value={
                      assumptions.capexPercent *
                      100
                    }
                    onChange={(value) =>
                      updateAssumption(
                        "capexPercent",
                        value / 100
                      )
                    }
                    suffix="% revenue"
                  />

                  <ModelInput
                    label="Working Capital"
                    value={
                      assumptions.workingCapitalPercent *
                      100
                    }
                    onChange={(value) =>
                      updateAssumption(
                        "workingCapitalPercent",
                        value / 100
                      )
                    }
                    suffix="% revenue"
                  />

                  <ModelInput
                    label="Depreciation"
                    value={
                      assumptions.depreciationPercent *
                      100
                    }
                    onChange={(value) =>
                      updateAssumption(
                        "depreciationPercent",
                        value / 100
                      )
                    }
                    suffix="% revenue"
                  />

                  <ModelInput
                    label="WACC"
                    value={
                      assumptions.wacc *
                      100
                    }
                    onChange={(value) =>
                      updateAssumption(
                        "wacc",
                        value / 100
                      )
                    }
                    suffix="%"
                  />

                  <ModelInput
                    label="Terminal Growth"
                    value={
                      assumptions.terminalGrowth *
                      100
                    }
                    onChange={(value) =>
                      updateAssumption(
                        "terminalGrowth",
                        value / 100
                      )
                    }
                    suffix="%"
                  />

                  <ModelInput
                    label="Shares Outstanding"
                    value={
                      assumptions.sharesOutstanding
                    }
                    onChange={(value) =>
                      updateAssumption(
                        "sharesOutstanding",
                        value
                      )
                    }
                    suffix="M"
                  />

                  <ModelInput
                    label="Net Debt"
                    value={
                      assumptions.netDebt
                    }
                    onChange={(value) =>
                      updateAssumption(
                        "netDebt",
                        value
                      )
                    }
                    suffix="M"
                  />
                </div>
              </div>

              {/* Projection summary */}
              {effectiveAssumptions &&
                valuation && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      <SummaryCard
                        label="Enterprise Value"
                        value={formatMoney(
                          valuation.enterpriseValue
                        )}
                      />

                      <SummaryCard
                        label="Equity Value"
                        value={formatMoney(
                          valuation.equityValue
                        )}
                      />

                      <SummaryCard
                        label="Implied Value / Share"
                        value={formatMoney(
                          valuation.valuePerShare
                        )}
                      />

                      <SummaryCard
                        label="5Y Revenue"
                        value={formatMoney(
                          projections[
                            projections.length -
                              1
                          ].revenue
                        )}
                      />
                    </div>

                    {/* Projections */}
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                      <div className="border-b border-white/10 px-6 py-4">
                        <h3 className="text-lg font-semibold">
                          5-Year Projection
                        </h3>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-sm">
                          <thead>
                            <tr className="border-b border-white/10 text-left text-white/50">
                              <th className="px-5 py-4">
                                Year
                              </th>
                              <th className="px-5 py-4">
                                Revenue
                              </th>
                              <th className="px-5 py-4">
                                EBITDA
                              </th>
                              <th className="px-5 py-4">
                                EBIT
                              </th>
                              <th className="px-5 py-4">
                                FCF
                              </th>
                              <th className="px-5 py-4">
                                PV of FCF
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {projections.map(
                              (year) => (
                                <tr
                                  key={
                                    year.year
                                  }
                                  className="border-b border-white/5"
                                >
                                  <td className="px-5 py-4 font-medium">
                                    {
                                      year.year
                                    }
                                  </td>
                                  <td className="px-5 py-4">
                                    {formatMoney(
                                      year.revenue
                                    )}
                                  </td>
                                  <td className="px-5 py-4">
                                    {formatMoney(
                                      year.ebitda
                                    )}
                                  </td>
                                  <td className="px-5 py-4">
                                    {formatMoney(
                                      year.ebit
                                    )}
                                  </td>
                                  <td className="px-5 py-4 text-emerald-300">
                                    {formatMoney(
                                      year.freeCashFlow
                                    )}
                                  </td>
                                  <td className="px-5 py-4">
                                    {formatMoney(
                                      year.presentValue
                                    )}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Sensitivity */}
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                      <div className="border-b border-white/10 px-6 py-4">
                        <h3 className="text-lg font-semibold">
                          DCF Sensitivity
                        </h3>

                        <p className="mt-1 text-sm text-white/50">
                          Implied value per share across
                          WACC and terminal growth assumptions.
                        </p>
                      </div>

                      <div className="overflow-x-auto p-6">
                        <table className="min-w-[700px] w-full text-sm">
                          <thead>
                            <tr>
                              <th className="px-4 py-3 text-left text-white/50">
                                Terminal Growth ↓ / WACC →
                              </th>

                              {(
                                [
                                  -0.02,
                                  -0.01,
                                  0,
                                  0.01,
                                  0.02,
                                ] as number[]
                              ).map(
                                (offset) => (
                                  <th
                                    key={
                                      offset
                                    }
                                    className="px-4 py-3 text-center text-white/50"
                                  >
                                    {formatPercent(
                                      effectiveAssumptions.wacc +
                                        offset
                                    )}
                                  </th>
                                )
                              )}
                            </tr>
                          </thead>

                          <tbody>
                            {sensitivity.map(
                              (
                                row
                              ) => (
                                <tr
                                  key={
                                    row.growth
                                  }
                                  className="border-t border-white/5"
                                >
                                  <td className="px-4 py-3 font-medium">
                                    {formatPercent(
                                      row.growth
                                    )}
                                  </td>

                                  {row.values.map(
                                    (
                                      value,
                                      index
                                    ) => (
                                      <td
                                        key={`${row.growth}-${index}`}
                                        className="px-4 py-3 text-center text-blue-300"
                                      >
                                        {formatMoney(
                                          value
                                        )}
                                      </td>
                                    )
                                  )}
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

              {/* Chatbot */}
              {showChatbot && (
                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-6">
                  <div className="mb-4">
                    <p className="text-sm font-medium text-purple-300">
                      AI Investment Assistant
                    </p>

                    <p className="mt-1 text-sm text-white/50">
                      Ask questions about your selected investment style
                      and model assumptions.
                    </p>
                  </div>

                  <ChatBot
                    persona={
                      selectedPersona
                    }
                  />
                </div>
              )}

              {!showChatbot && (
                <button
                  type="button"
                  onClick={() =>
                    setShowChatbot(true)
                  }
                  className="w-full rounded-xl border border-purple-500/20 bg-purple-500/5 px-5 py-4 text-left transition hover:bg-purple-500/10"
                >
                  <p className="font-medium text-purple-300">
                    Open AI Investment Assistant
                  </p>

                  <p className="mt-1 text-sm text-white/50">
                    The chatbot uses your configured AI API.
                  </p>
                </button>
              )}
            </div>
          </AnimatedSection>
        )}
    </div>
  );
}

function ModelInput({
  label,
  value,
  onChange,
  suffix,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-white/80">
        {label}
      </label>

      <div className="relative mt-2">
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          step="0.1"
          onChange={(event) =>
            onChange(
              Number(event.target.value)
            )
          }
          className="w-full rounded-lg border border-white/10 bg-slate-950 p-3 pr-20 text-white outline-none focus:border-blue-500"
        />

        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm text-white/50">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}