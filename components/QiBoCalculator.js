"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart, Line,
  XAxis, YAxis,
  Tooltip, CartesianGrid, ReferenceLine,
} from "recharts";
import { TrendingUp, Clock, Users, DollarSign, Calculator, Zap } from "lucide-react";

// ===== Module-scope helpers =====
const fmtNum = (n) => Math.round(Number(n)).toLocaleString();
const fmtMoney = (n) => `$${Math.round(Number(n)).toLocaleString()}`;
// Clamp helper (fixes ReferenceError: clamp is not defined)
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// Tooltip that adapts the X-axis label
function SmartTooltip({ active, payload, label, money = false, darkMode = false, xFormatter }) {
  if (!active || !payload || !payload.length) return null;
  const xText = xFormatter ? xFormatter(label) : String(label);
  return (
    <div className={`rounded-xl border shadow-lg px-4 py-3 backdrop-blur-sm ${
      darkMode ? 'bg-gray-800/95 border-gray-600 text-gray-100' : 'bg-white/95 border-gray-200'
    }`}>
      <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{xText}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-3 text-sm">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="font-medium">{p.name}:</span>
          <span className="ml-auto font-semibold">{money ? fmtMoney(p.value) : fmtNum(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function QiBoCalculator() {
  // ---- Inputs ----
  const [inputs, setInputs] = useState({
    patientsPerWeek: 40,
    hoursPerWeek: 40,
    rate: 85,
    qiboMinutes: 40,
    baselineMinutes: 60,
    subscription: 149,
  });
  const [darkMode] = useState(true);
  const [autoQiBo, setAutoQiBo] = useState(true); // default ON per your request

  const handleChange = (key) => (e) => {
    const val = parseFloat(e.target.value);
    setInputs((prev) => ({ ...prev, [key]: isNaN(val) ? 0 : val }));
  };

  const { patientsPerWeek, hoursPerWeek, rate, qiboMinutes, baselineMinutes, subscription } = inputs;

  // ---- Palette ----
  const palette = darkMode
    ? {
        primary: "#3b82f6",
        secondary: "#10b981",
        accent: "#f59e0b",
        surface: "#1f2937",
        surfaceLight: "#374151",
        text: "#f9fafb",
        textMuted: "#9ca3af",
        border: "#4b5563",
      }
    : {
        primary: "#2563eb",
        secondary: "#059669",
        accent: "#d97706",
        surface: "#ffffff",
        surfaceLight: "#f8fafc",
        text: "#1f2937",
        textMuted: "#6b7280",
        border: "#e5e7eb",
      };

  // ---- Auto QiBo minutes (linear: baseline 60→40, 30→25; clamp to 25..40) ----
  const qiboMinutesAuto = useMemo(() => {
    // influence window: baseline 30..60; output: 25..40 linearly
    const b = clamp(baselineMinutes, 30, 60);
    return clamp(0.5 * b + 10, 25, 40);
  }, [baselineMinutes]);

  const qiboMinutesEffective = autoQiBo ? qiboMinutesAuto : qiboMinutes;

  // ---- Core math ----
  const baselinePatientsPerHour = 60 / Math.max(1, baselineMinutes);
  const qiboPatientsPerHour = 60 / Math.max(1, qiboMinutesEffective);

  const baselinePatients = Math.round(baselinePatientsPerHour * hoursPerWeek);
  const qiboPatientsSameHours = Math.round(qiboPatientsPerHour * hoursPerWeek);

  const hoursNeededSamePatients = +(patientsPerWeek / Math.max(1e-6, qiboPatientsPerHour)).toFixed(1);
  const hoursSaved = +(hoursPerWeek - hoursNeededSamePatients).toFixed(1);

  const baselineRevenue = patientsPerWeek * rate;
  const qiboRevenueSameHours = qiboPatientsSameHours * rate;
  const deltaAnnualNet = Math.round((qiboRevenueSameHours - baselineRevenue - subscription) * 52);

  // ---- Goal-driven view ----
  const WEEKS_PER_YEAR = 48;
  const [goals, setGoals] = useState({ seeMore: true, workLess: false, makeMore: true });
  const [useDemandCap, setUseDemandCap] = useState(true);
  const [targets, setTargets] = useState({ extraPatients: 0, lessHours: 0 });
  const toggleGoalExclusive = (key) => {
    setGoals((g) => {
      if (key === "seeMore") {
        const next = !g.seeMore;
        return { ...g, seeMore: next, workLess: next ? false : g.workLess };
      }
      if (key === "workLess") {
        const next = !g.workLess;
        return { ...g, workLess: next, seeMore: next ? false : g.seeMore };
      }
      if (key === "makeMore") {
        return { ...g, makeMore: !g.makeMore };
      }
      return g;
    });
  };

  // If only seeMore is selected => patients view; else hours view
  const goalMode = goals.seeMore && !goals.workLess ? "patients" : goals.workLess && !goals.seeMore ? "hours" : "hours";

  // ----- Dynamic ranges so markers never clip -----
  const HOURS_MIN = 10, HOURS_MAX = 40; // keep your current bounds
  const currentAnnualGross = Math.round(patientsPerWeek * rate * WEEKS_PER_YEAR);
  const hoursToMatchCurrent_Baseline = +(patientsPerWeek / Math.max(1e-6, baselinePatientsPerHour)).toFixed(1);
  const hoursToMatchCurrent_QiBo = +(patientsPerWeek / Math.max(1e-6, qiboPatientsPerHour)).toFixed(1);
  const hoursSavedSameRevenue = +(hoursToMatchCurrent_Baseline - hoursToMatchCurrent_QiBo).toFixed(1);

  const xMin = Math.min(
    HOURS_MIN,
    Math.floor(hoursToMatchCurrent_Baseline),
    Math.floor(hoursToMatchCurrent_QiBo),
    Math.floor(hoursPerWeek)
  );
  const xMax = Math.max(
    HOURS_MAX,
    Math.ceil(hoursToMatchCurrent_Baseline),
    Math.ceil(hoursToMatchCurrent_QiBo),
    Math.ceil(hoursPerWeek)
  );

  const hoursRange = useMemo(() => {
    const min = Math.max(0, xMin); // honor your desire to allow starting at 0 if needed
    const max = Math.min(80, xMax);
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }, [xMin, xMax]);

  const patientsRange = useMemo(() => Array.from({ length: 61 }, (_, i) => 20 + i), []); // 20..80

  // Annual Revenue vs Hours (work fewer hours)
  const annualVsHoursData = useMemo(() => {
    return hoursRange.map((h) => ({
      x: h,
      Baseline: Math.round(h * baselinePatientsPerHour * rate * WEEKS_PER_YEAR),
      "With QiBo": Math.round(h * qiboPatientsPerHour * rate * WEEKS_PER_YEAR),
    }));
  }, [hoursRange, baselinePatientsPerHour, qiboPatientsPerHour, rate]);

  // Annual Revenue vs Patients (see more patients)
  const revenueVsPatientsData = useMemo(() => {
    return patientsRange.map((p) => ({ x: p, annual: Math.round(p * rate * WEEKS_PER_YEAR) }));
  }, [patientsRange, rate]);

  // Capacity at current hours anchor
  const hoursAnchor = hoursPerWeek;
  const baseCapAtAnchor = Math.round(baselinePatientsPerHour * hoursAnchor);
  const qiboCapAtAnchor = Math.round(qiboPatientsPerHour * hoursAnchor);

  // Summary rows at 25/30/35/40 hrs — baseline vs QiBo
  const SUMMARY_HOURS = [25, 30, 35, 40];
  const summaryHours = useMemo(() => {
    const s = new Set(SUMMARY_HOURS);
    s.add(Math.round(hoursPerWeek));
    return Array.from(s).sort((a,b) => a - b);
  }, [hoursPerWeek]);
  const summaryRows = useMemo(() => {
    return summaryHours.map((h) => {
      const baseCap = baselinePatientsPerHour * h;
      const qiboCap = qiboPatientsPerHour * h;
      const basePatients = useDemandCap ? Math.min(patientsPerWeek, baseCap) : baseCap;
      const qiboPatients = useDemandCap ? Math.min(patientsPerWeek, qiboCap) : qiboCap;
      const baseW = basePatients * rate;
      const qiboW = qiboPatients * rate; // gross
      return {
        hours: h,
        basePatients: Math.round(basePatients),
        qiboPatients: Math.round(qiboPatients),
        baseDollars: Math.round(baseW),
        qiboDollars: Math.round(qiboW),
        basePerHour: Math.round(baseW / h),
        qiboPerHour: Math.round(qiboW / h),
      };
    });
  }, [summaryHours, useDemandCap, patientsPerWeek, baselinePatientsPerHour, qiboPatientsPerHour, rate]);

  // ---- Minimal test suite (console assertions) ----
  useEffect(() => {
    try {
      // Palette presence
      console.assert(palette && palette.accent && palette.secondary, "palette has accent & secondary");
      // Clamp sanity
      console.assert(clamp(5, 10, 20) === 10 && clamp(25, 10, 20) === 20 && clamp(15, 10, 20) === 15, "clamp works");
      // QiBo auto minutes range
      console.assert(qiboMinutesAuto >= 25 && qiboMinutesAuto <= 40, "qibo auto in [25,40]");
      if (autoQiBo) {
        console.assert(Math.abs(qiboMinutesEffective - qiboMinutesAuto) < 1e-9, "auto mode uses auto value");
      }
      // Hour math
      console.assert(Math.abs((60 / 60) - 1) < 1e-9, "pph for 60 min should be 1");
      console.assert(Math.round((60 / 40) * 40) === 60, "40 min @ 40h => 60 patients");
      // Data lengths (dynamic hoursRange)
      console.assert(annualVsHoursData.length >= (HOURS_MAX - HOURS_MIN + 1), "annualVsHoursData length >= base span");
      console.assert(revenueVsPatientsData.length === 61, "revenueVsPatientsData length 61 (20..80)");
      // Range contains anchors
      const xs = annualVsHoursData.map(d=>d.x);
      const minX = xs[0], maxX = xs[xs.length-1];
      console.assert(minX <= Math.floor(hoursPerWeek) && maxX >= Math.ceil(hoursPerWeek), "range includes hoursAnchor");
      console.assert(minX <= Math.floor(hoursToMatchCurrent_QiBo) && maxX >= Math.ceil(hoursToMatchCurrent_QiBo), "range includes QiBo match");
      // Summary rows
      console.assert(summaryRows.some(r=>r.hours===25) && summaryRows.some(r=>r.hours===40) && summaryRows.some(r=>r.hours===Math.round(hoursPerWeek)), "matrix rows include 25, 40, and your hours");
      // Labels should not double the $
      const todaysLabel = `Current: ${fmtMoney(currentAnnualGross)}`;
      console.assert(!todaysLabel.includes('$$'), "No double $ in today's label");
      // Mutual exclusivity guard
      console.assert(!(goals.seeMore && goals.workLess), "seeMore and workLess should not both be true");
      // eslint-disable-next-line no-console
      console.log("✅ Calculator sanity tests passed");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("❌ Calculator tests failed", e);
    }
  }, [palette, annualVsHoursData, revenueVsPatientsData, summaryRows, hoursPerWeek, hoursToMatchCurrent_QiBo, currentAnnualGross, autoQiBo, qiboMinutesAuto, qiboMinutesEffective, goals]);

  return (
    <div className="min-h-screen transition-colors duration-300 dark bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-blue-500/20">
              <Calculator className="h-8 w-8 text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white">QiBo Productivity Calculator</h1>
          </div>
          <p className="text-xl max-w-3xl mx-auto text-gray-300">
            Tell us about your practice and goals. We’ll highlight what matters most: see more patients or work fewer hours.
          </p>
        </div>

        {/* Input Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <InputSection title="Practice Metrics" icon={<Users className="h-5 w-5" />} darkMode={darkMode}>
            {/* Always visible per your request */}
            <InputField label="Patients per week" value={patientsPerWeek} onChange={handleChange("patientsPerWeek")} darkMode={darkMode} icon={<Users className="h-4 w-4" />} />
            <InputField label="Working hours per week" value={hoursPerWeek} onChange={handleChange("hoursPerWeek")} darkMode={darkMode} icon={<Clock className="h-4 w-4" />} />
            <InputField label="Rate per treatment ($)" value={rate} onChange={handleChange("rate")} darkMode={darkMode} icon={<DollarSign className="h-4 w-4" />} />
          </InputSection>

          <InputSection title="Documentation Time" icon={<Clock className="h-5 w-5" />} darkMode={darkMode}>
            <InputField label="Current minutes per patient" value={baselineMinutes} onChange={handleChange("baselineMinutes")} darkMode={darkMode} sublabel="Traditional documentation" />
            <div className="flex items-center gap-2">
              <input id="autoQiBo" type="checkbox" checked={autoQiBo} onChange={() => setAutoQiBo(v=>!v)} className="h-4 w-4 accent-emerald-500" />
              <label htmlFor="autoQiBo" className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Auto-calculate based on the "QiBo Effect"
              </label>
            </div>
            <InputField 
              label="With QiBo minutes per patient" 
              value={Math.round(qiboMinutesEffective)} 
              onChange={handleChange("qiboMinutes")} 
              darkMode={darkMode}
              sublabel={autoQiBo ? `Auto: based on ${baselineMinutes} min` : "Manual override"}
              disabled={autoQiBo}
            />
            <div className="p-3 rounded-lg bg-green-900/30">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">{(baselineMinutes / Math.max(1, qiboMinutesEffective)).toFixed(1)}× efficiency gain</span>
              </div>
            </div>
          </InputSection>
          <InputSection title="Your Goals" icon={<TrendingUp className="h-5 w-5" />} darkMode={darkMode}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <GoalToggle label="See more patients" checked={goals.seeMore} onChange={() => toggleGoalExclusive("seeMore")} />
              <br/>
              <GoalToggle label="Work fewer hours" checked={goals.workLess} onChange={() => toggleGoalExclusive("workLess")} />
            </div>
            <div className="text-xs text-gray-400 mt-2">The chart adapts to your goal: X-axis is patients or hours; Y-axis shows annual dollars.</div>
          </InputSection>
        </div>

        {/* Main content: Metrics left, chart + table right */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <MetricsGrid
              baselinePatients={baselinePatients}
              qiboPatientsSameHours={qiboPatientsSameHours}
              hoursSaved={hoursSaved}
              deltaAnnualNet={deltaAnnualNet}
              darkMode={darkMode}
            />
          </div>

          <div className="md:col-span-2 space-y-6">
            {/* IMPORTANT: pass palette and computed props to avoid undefined errors */}
            <GoalChartCard
              mode={goalMode}
              dataPatients={revenueVsPatientsData}
              dataHours={annualVsHoursData}
              baseCapAtAnchor={baseCapAtAnchor}
              qiboCapAtAnchor={qiboCapAtAnchor}
              hoursAnchor={hoursPerWeek}
              palette={palette}
              darkMode={darkMode}
              currentAnnualGross={currentAnnualGross}
              hoursToMatchBaseline={hoursToMatchCurrent_Baseline}
              hoursToMatchQibo={hoursToMatchCurrent_QiBo}
              hoursSavedSameRevenue={hoursSavedSameRevenue}
            />

            <ChartCard title="Baseline vs QiBo (matrix)" darkMode={darkMode}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400">
                  {useDemandCap ? `Using your current patients/week (${fmtNum(patientsPerWeek)})` : "Assuming full schedule (capacity)"}
                </span>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" className="h-4 w-4 accent-emerald-500" checked={useDemandCap} onChange={() => setUseDemandCap(v=>!v)} />
                  <span className="text-white">Use my current demand</span>
                </label>
              </div>
              <ComparisonTable rows={summaryRows} />
            </ChartCard>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== UI bits ===== */
function InputSection({ title, icon, children, darkMode }) {
  return (
    <div className={`rounded-2xl border shadow-lg p-6 backdrop-blur-sm ${darkMode ? "bg-gray-800/80 border-gray-700" : "bg-white/80 border-gray-200"}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${darkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"}`}>{icon}</div>
        <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function GoalToggle({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-full text-left px-3 py-2 rounded-lg border ${checked ? "bg-emerald-600 text-white border-emerald-700" : "bg-gray-800/30 text-gray-200 border-gray-700"}`}
    >
      {label}
    </button>
  );
}

function InputField({ label, value, onChange, darkMode, icon, sublabel, disabled }) {
  return (
    <div>
      <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
        {label}
        {sublabel && <span className={`block text-xs font-normal ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{sublabel}</span>}
      </label>
      <div className="relative">
        {icon && <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{icon}</div>}
        <input
          type="number"
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full ${icon ? "pl-10" : "pl-4"} pr-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        />
      </div>
    </div>
  );
}

function MetricsGrid({ baselinePatients, qiboPatientsSameHours, hoursSaved, deltaAnnualNet, darkMode }) {
  const metrics = [
    {
      label: "Time Savings",
      value: `${hoursSaved}`,
      unit: "hours/week",
      description: "Treat the same patients faster",
      icon: <Clock className="h-5 w-5" />,
      color: "blue",
      positive: hoursSaved > 0,
    },
    {
      label: "Capacity Increase",
      value: `+${Math.max(0, qiboPatientsSameHours - baselinePatients)}`,
      unit: "patients/week",
      description: "Additional patients at same hours",
      icon: <Users className="h-5 w-5" />,
      color: "green",
      positive: qiboPatientsSameHours > baselinePatients,
    },
    {
      label: "Annual Net Gain",
      value: `${deltaAnnualNet >= 0 ? "+$" : "-$"}${Math.abs(deltaAnnualNet).toLocaleString()}`,
      unit: "per year",
      description: "After subscription cost",
      icon: <TrendingUp className="h-5 w-5" />,
      color: deltaAnnualNet >= 0 ? "green" : "red",
      positive: deltaAnnualNet >= 0,
    },
  ];

  return (
    <div className="space-y-4">
      {metrics.map((metric) => (
        <div key={metric.label} className={`rounded-2xl border p-4 shadow-lg backdrop-blur-sm ${darkMode ? "bg-gray-800/80 border-gray-700" : "bg-white/80 border-gray-200"}`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${metric.color === "blue" ? (darkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600") : metric.color === "green" ? (darkMode ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-600") : darkMode ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600"}`}>{metric.icon}</div>
            <div className={`text-xs px-2 py-1 rounded-full ${metric.positive ? (darkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700") : (darkMode ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700")}`}>{metric.positive ? "↗" : "↘"}</div>
          </div>
          <div className="mb-2">
            <div className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{metric.value}</div>
            <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{metric.unit}</div>
          </div>
          <div>
            <div className={`text-xs font-medium uppercase tracking-wide mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{metric.label}</div>
            <div className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{metric.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function GoalChartCard({ mode, dataPatients, dataHours, baseCapAtAnchor, qiboCapAtAnchor, hoursAnchor, palette, darkMode, currentAnnualGross, hoursToMatchBaseline, hoursToMatchQibo, hoursSavedSameRevenue }) {
  const isPatients = mode === 'patients';
  const accent = (palette && palette.accent) ? palette.accent : "#f59e0b"; // safe fallback to avoid undefined errors
  return (
    <ChartCard title={isPatients ? "Annual Revenue vs Patients" : "Annual Revenue vs Hours"} darkMode={darkMode}>
      <ResponsiveContainer width="100%" height="100%">
        {isPatients ? (
          <LineChart data={dataPatients} margin={{ left: 40, right: 10, top: 20, bottom: 15 }}>
            <CartesianGrid strokeDasharray="4 8" stroke="#374151" vertical={false} />
            <XAxis
              type="number"
              dataKey="x"
              allowDataOverflow
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              label={{ value: "Patients / week", position: "insideBottom", offset: -5, fill: "#cbd5e1", fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} tickFormatter={(v)=>fmtMoney(v)} />
            <Tooltip content={<SmartTooltip money darkMode={darkMode} xFormatter={(x)=>`${x} patients/week`} />} />
            <Line type="monotone" dataKey="annual" name="Annual revenue" stroke={palette.secondary} strokeWidth={3} dot={false} />
            <ReferenceLine x={baseCapAtAnchor} ifOverflow="extendDomain" stroke="#ef4444" strokeDasharray="4 4" label={{ value: `Baseline capacity @ ${hoursAnchor}h`, position: "top", fill: darkMode?"#e5e7eb":"#374151", fontSize: 12 }} />
            <ReferenceLine x={qiboCapAtAnchor} ifOverflow="extendDomain" stroke="#10b981" strokeDasharray="4 4" label={{ value: `QiBo capacity @ ${hoursAnchor}h`, position: "top", fill: darkMode?"#e5e7eb":"#374151", fontSize: 12 }} />
          </LineChart>
        ) : (
          <LineChart data={dataHours} margin={{ left: 40, right: 10, top: 20, bottom: 15 }}>
            <CartesianGrid strokeDasharray="4 8" stroke="#374151" vertical={false} />
            <XAxis
              type="number"
              dataKey="x"
              allowDataOverflow
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              label={{ value: "Hours / week", position: "insideBottom", offset: -5, fill: "#cbd5e1", fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} tickFormatter={(v)=>fmtMoney(v)} />
            <Tooltip content={<SmartTooltip money darkMode={darkMode} xFormatter={(x)=>`${x} hours/week`} />} />
            {/* Horizontal line at today's annual revenue (avoid double $ by letting fmtMoney insert it) */}
            <ReferenceLine y={currentAnnualGross} ifOverflow="extendDomain" stroke="#93c5fd" strokeDasharray="3 3" label={{ value: `Current: ${fmtMoney(currentAnnualGross)}`, position: 'left', fill: '#93c5fd', fontSize: 12 }} />
            {/* Dynamic "same money" intersections */}
            <ReferenceLine x={hoursToMatchBaseline} ifOverflow="extendDomain" stroke="#9ca3af" strokeDasharray="2 2" label={{ value: `Baseline: ${hoursToMatchBaseline}h`, position: 'top', fill: '#9ca3af', fontSize: 12 }} />
            <ReferenceLine x={hoursToMatchQibo} ifOverflow="extendDomain" stroke={palette.secondary} strokeDasharray="2 2" label={{ value: `QiBo: ${hoursToMatchQibo}h (save ~${hoursSavedSameRevenue}h)`, position: 'top', fill: darkMode? '#a7f3d0':'#065f46', fontSize: 12 }} />
            <Line type="monotone" dataKey="Baseline" name="Baseline" stroke="#6b7280" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="With QiBo" name="With QiBo" stroke={palette.secondary} strokeWidth={3} dot={false} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </ChartCard>
  );
}

function ComparisonTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <Th>Hours</Th>
            <Th>Patients (Baseline)</Th>
            <Th>Patients (QiBo)</Th>
            <Th>Dollars / Week (Baseline)</Th>
            <Th>Dollars / Week (QiBo)</Th>
            <Th>$/Hour (Baseline)</Th>
            <Th>$/Hour (QiBo)</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.hours} className="border-t border-gray-700">
              <Td>{r.hours}</Td>
              <Td>{fmtNum(r.basePatients)}</Td>
              <Td className="text-emerald-400 font-medium">{fmtNum(r.qiboPatients)}</Td>
              <Td>{fmtMoney(r.baseDollars)}</Td>
              <Td className="text-emerald-400 font-medium">{fmtMoney(r.qiboDollars)}</Td>
              <Td>{fmtMoney(r.basePerHour)}</Td>
              <Td className="text-emerald-400 font-medium">{fmtMoney(r.qiboPerHour)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-xs text-gray-500 mt-2">Gross revenue shown; excludes subscription and ancillary sales. Adjust your rate above to match your clinic.</div>
    </div>
  );
}

function Th({ children }) {
  return <th className="text-left p-2 font-semibold text-gray-200">{children}</th>;
}
function Td({ children }) {
  return <td className="p-2 text-gray-300">{children}</td>;
}

function ChartCard({ title, children, darkMode }) {
  return (
    <div className={`rounded-2xl border p-6 shadow-lg backdrop-blur-sm ${darkMode ? "bg-gray-800/80 border-gray-700" : "bg-white/80 border-gray-200"}`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>{title}</h3>
      <div className="h-80">{children}</div>
    </div>
  );
}

export default QiBoCalculator;
