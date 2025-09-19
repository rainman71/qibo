import React, { useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, BarChart, Bar, Legend } from "recharts";
import { TrendingUp, Clock, Users, DollarSign, Calculator, Zap } from "lucide-react";

function QiBoCalculator() {
  const [inputs, setInputs] = useState({
    patientsPerWeek: 40,
    hoursPerWeek: 40,
    rate: 85,
    qiboMinutes: 40,
    baselineMinutes: 60,
    subscription: 149,
  });
  const [darkMode, setDarkMode] = useState(true);

  const handleChange = (key) => (e) => {
    const val = parseFloat(e.target.value);
    setInputs((prev) => ({ ...prev, [key]: isNaN(val) ? 0 : val }));
  };

  const { patientsPerWeek, hoursPerWeek, rate, qiboMinutes, baselineMinutes, subscription } = inputs;

  // Core math
  const baselinePatientsPerHour = 60 / Math.max(1, baselineMinutes);
  const qiboPatientsPerHour = 60 / Math.max(1, qiboMinutes);

  const baselinePatients = Math.round(baselinePatientsPerHour * hoursPerWeek);
  const qiboPatientsSameHours = Math.round(qiboPatientsPerHour * hoursPerWeek);

  const hoursNeededSamePatients = +(patientsPerWeek / qiboPatientsPerHour).toFixed(1);
  const hoursSaved = +(hoursPerWeek - hoursNeededSamePatients).toFixed(1);

  const baselineRevenue = patientsPerWeek * rate;
  const qiboRevenueSameHours = qiboPatientsSameHours * rate;
  const deltaAnnualNet = Math.round((qiboRevenueSameHours - baselineRevenue - subscription) * 52);

  // Medical professional color palette
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
        success: "#10b981",
        warning: "#f59e0b",
        gradient: "from-slate-900 to-slate-800"
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
        success: "#059669",
        warning: "#d97706",
        gradient: "from-blue-50 to-indigo-100"
      };

  const fmtNum = (n) => Math.round(Number(n)).toLocaleString();
  const fmtMoney = (n) => `$${Math.round(Number(n)).toLocaleString()}`;

  function ChartTooltip({ active, payload, label, money = false }) {
    if (active && payload && payload.length) {
      return (
        <div className={`rounded-xl border shadow-lg px-4 py-3 backdrop-blur-sm ${
          darkMode ? 'bg-gray-800/95 border-gray-600 text-gray-100' : 'bg-white/95 border-gray-200'
        }`}>
          <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            {label} hours/week
          </div>
          {payload.map((p) => (
            <div key={p.dataKey} className="flex items-center gap-3 text-sm">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: p.color }}
              />
              <span className="font-medium">{p.name}:</span>
              <span className="ml-auto font-semibold">
                {money ? fmtMoney(p.value) : fmtNum(p.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  }

  // Chart data
  const data = Array.from({ length: 26 }, (_, i) => {
    const hrs = 20 + i;
    const baseP = baselinePatientsPerHour * hrs;
    const qiboP = qiboPatientsPerHour * hrs;
    return {
      hours: hrs,
      Baseline: Math.round(baseP),
      "With QiBo": Math.round(qiboP),
      baselineRevenue: Math.round(baseP * rate),
      qiboNetRevenue: Math.round(qiboP * rate - subscription),
    };
  });

  return (
    <div className="min-h-screen transition-colors duration-300 dark bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-blue-500/20">
              <Calculator className="h-8 w-8 text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white">
              QiBo ROI Calculator
            </h1>
          </div>
          <p className="text-xl max-w-3xl mx-auto text-gray-300">
            Discover how QiBo's intelligent documentation can transform your practice efficiency, 
            patient capacity, and revenue potential.
          </p>
        </div>

        {/* Input Panels - 3 across top */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <InputSection 
            title="Practice Metrics" 
            icon={<Users className="h-5 w-5" />}
            darkMode={darkMode} 
            palette={palette}
          >
            <InputField 
              label="Patients per week" 
              value={patientsPerWeek} 
              onChange={handleChange("patientsPerWeek")} 
              darkMode={darkMode}
              icon={<Users className="h-4 w-4" />}
            />
            <InputField 
              label="Working hours per week" 
              value={hoursPerWeek} 
              onChange={handleChange("hoursPerWeek")} 
              darkMode={darkMode}
              icon={<Clock className="h-4 w-4" />}
            />
            <InputField 
              label="Rate per treatment ($)" 
              value={rate} 
              onChange={handleChange("rate")} 
              darkMode={darkMode}
              icon={<DollarSign className="h-4 w-4" />}
            />
          </InputSection>

          <InputSection 
            title="Documentation Time" 
            icon={<Clock className="h-5 w-5" />}
            darkMode={darkMode} 
            palette={palette}
          >
            <InputField 
              label="Current minutes per patient" 
              value={baselineMinutes} 
              onChange={handleChange("baselineMinutes")} 
              darkMode={darkMode}
              sublabel="Traditional documentation"
            />
            <InputField 
              label="With QiBo minutes per patient" 
              value={qiboMinutes} 
              onChange={handleChange("qiboMinutes")} 
              darkMode={darkMode}
              sublabel="AI-assisted documentation"
            />
            <div className="p-3 rounded-lg bg-green-900/30">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">
                  {(baselineMinutes / Math.max(1, qiboMinutes)).toFixed(1)}× efficiency gain
                </span>
              </div>
            </div>
          </InputSection>

          <InputSection 
            title="Investment" 
            icon={<DollarSign className="h-5 w-5" />}
            darkMode={darkMode} 
            palette={palette}
          >
            <InputField 
              label="QiBo monthly subscription ($)" 
              value={subscription} 
              onChange={handleChange("subscription")} 
              darkMode={darkMode}
            />
            <div className="text-xs p-3 rounded-lg bg-blue-900/30 text-blue-300">
              💡 Tip: Try 40 minutes (from 60) to see a typical 1.5× efficiency improvement
            </div>
          </InputSection>
        </div>

        {/* Main Content Grid - Metrics left, Charts right */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column - Key Metrics */}
          <div className="md:col-span-1">
            <MetricsGrid
              baselinePatients={baselinePatients}
              qiboPatientsSameHours={qiboPatientsSameHours}
              hoursSaved={hoursSaved}
              deltaAnnualNet={deltaAnnualNet}
              darkMode={darkMode}
              palette={palette}
            />
          </div>

          {/* Right Columns - Charts stacked */}
          <div className="md:col-span-2 space-y-6">
            <ChartCard title="Patient Capacity vs Hours" darkMode={darkMode} palette={palette}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="gradBaseline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6b7280" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6b7280" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gradQibo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="hours" 
                    tick={{ fontSize: 12, fill: '#9ca3af' }} 
                    axisLine={{ stroke: '#4b5563' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#9ca3af' }} 
                    axisLine={{ stroke: '#4b5563' }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine 
                    x={hoursPerWeek} 
                    stroke={palette.accent} 
                    strokeDasharray="4 4" 
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Baseline" 
                    stroke="#6b7280" 
                    strokeWidth={2}
                    fill="url(#gradBaseline)" 
                    dot={false}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="With QiBo" 
                    stroke="#059669" 
                    strokeWidth={3}
                    fill="url(#gradQibo)" 
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Revenue Analysis" darkMode={darkMode} palette={palette}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="hours" 
                    tick={{ fontSize: 12, fill: '#9ca3af' }} 
                    axisLine={{ stroke: '#4b5563' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#9ca3af' }} 
                    axisLine={{ stroke: '#4b5563' }}
                  />
                  <Tooltip content={<ChartTooltip money />} />
                  <ReferenceLine 
                    x={hoursPerWeek} 
                    stroke={palette.accent} 
                    strokeDasharray="4 4" 
                    strokeWidth={2}
                  />
                  <Bar 
                    dataKey="baselineRevenue" 
                    name="Current Revenue" 
                    fill="#6b7280" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="qiboNetRevenue" 
                    name="QiBo Net Revenue" 
                    fill="#059669" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputSection({ title, icon, children, darkMode, palette }) {
  return (
    <div className={`rounded-2xl border shadow-lg p-6 backdrop-blur-sm ${
      darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200'
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
          {icon}
        </div>
        <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, darkMode, icon, sublabel }) {
  return (
    <div>
      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
        {label}
        {sublabel && (
          <span className={`block text-xs font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {sublabel}
          </span>
        )}
      </label>
      <div className="relative">
        {icon && (
          <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {icon}
          </div>
        )}
        <input
          type="number"
          value={value}
          onChange={onChange}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
        />
      </div>
    </div>
  );
}

function MetricsGrid({ baselinePatients, qiboPatientsSameHours, hoursSaved, deltaAnnualNet, darkMode, palette }) {
  const metrics = [
    {
      label: "Time Savings",
      value: `${hoursSaved}`,
      unit: "hours/week",
      description: "Treat the same patients faster",
      icon: <Clock className="h-5 w-5" />,
      color: "blue",
      positive: hoursSaved > 0
    },
    {
      label: "Capacity Increase", 
      value: `+${Math.max(0, qiboPatientsSameHours - baselinePatients)}`,
      unit: "patients/week",
      description: "Additional patients at same hours",
      icon: <Users className="h-5 w-5" />,
      color: "green",
      positive: qiboPatientsSameHours > baselinePatients
    },
    {
      label: "Annual ROI",
      value: deltaAnnualNet >= 0 ? `+${Math.abs(deltaAnnualNet).toLocaleString()}` : `-${Math.abs(deltaAnnualNet).toLocaleString()}`,
      unit: "per year",
      description: "Net revenue after QiBo costs",
      icon: <TrendingUp className="h-5 w-5" />,
      color: deltaAnnualNet >= 0 ? "green" : "red",
      positive: deltaAnnualNet >= 0
    }
  ];

  return (
    <div className="space-y-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className={`rounded-2xl border p-4 shadow-lg backdrop-blur-sm ${
            darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${
              metric.color === 'blue' ? (darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600') :
              metric.color === 'green' ? (darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600') :
              darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
            }`}>
              {metric.icon}
            </div>
            <div className={`text-xs px-2 py-1 rounded-full ${
              metric.positive 
                ? (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700')
                : (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700')
            }`}>
              {metric.positive ? '↗' : '↘'}
            </div>
          </div>
          
          <div className="mb-2">
            <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {metric.value}
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {metric.unit}
            </div>
          </div>
          
          <div>
            <div className={`text-xs font-medium uppercase tracking-wide mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {metric.label}
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {metric.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ title, children, darkMode, palette }) {
  return (
    <div className={`rounded-2xl border p-6 shadow-lg backdrop-blur-sm ${
      darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200'
    }`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h3>
      <div className="h-80">
        {children}
      </div>
    </div>
  );
}

export default QiBoCalculator;
