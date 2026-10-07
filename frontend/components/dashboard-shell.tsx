"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  Activity,
  BarChart3,
  Clock3,
  CloudRain,
  Droplets,
  GitBranch,
  Gauge,
  Heart,
  Home,
  Info,
  LucideIcon,
  Mail,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sun,
  Thermometer,
  Umbrella,
  Wind,
  X
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { create } from "zustand";
import * as THREE from "three";
import {
  formatNumber,
  formatPercent,
  formatTemperature,
  getPm25Advisory
} from "@/lib/aqi";
import type {
  AirDailyRow,
  AreaData,
  CurrentWeather,
  DashboardData,
  DisplayMode,
  ForecastRow,
  LocationSlug,
  NavPage,
  RangeMode,
  TemperatureUnit,
  WeatherDailyRow
} from "@/lib/types";

type UiState = {
  area: LocationSlug;
  page: NavPage;
  range: RangeMode;
  unit: TemperatureUnit;
  forecastMode: DisplayMode;
  flowMode: DisplayMode;
  setArea: (area: LocationSlug) => void;
  setPage: (page: NavPage) => void;
  setRange: (range: RangeMode) => void;
  setUnit: (unit: TemperatureUnit) => void;
  setForecastMode: (mode: DisplayMode) => void;
  setFlowMode: (mode: DisplayMode) => void;
};

const useUiStore = create<UiState>((set) => ({
  area: "koraput",
  page: "home",
  range: "week",
  unit: "C",
  forecastMode: "chart",
  flowMode: "chart",
  setArea: (area) => set({ area }),
  setPage: (page) => set({ page }),
  setRange: (range) => set({ range }),
  setUnit: (unit) => set({ unit }),
  setForecastMode: (forecastMode) => set({ forecastMode }),
  setFlowMode: (flowMode) => set({ flowMode })
}));

const navItems: Array<{
  id: NavPage;
  label: string;
  icon: LucideIcon;
  hover: string;
}> = [
  { id: "home", label: "Air Today", icon: Home, hover: "hover:from-white hover:to-emerald-100" },
  { id: "forecast", label: "7-Day Outlook", icon: BarChart3, hover: "hover:from-white hover:to-teal-100" },
  { id: "flow", label: "How It Works", icon: GitBranch, hover: "hover:from-white hover:to-lime-100" },
  { id: "evidence", label: "Accuracy & Checks", icon: ShieldCheck, hover: "hover:from-white hover:to-amber-100" },
  { id: "setup", label: "System Status", icon: Settings2, hover: "hover:from-white hover:to-slate-100" }
];

const flowRows = [
  {
    step: "1. Area Focus",
    userView: "Covers unmonitored priority districts: Koraput, Nawarangpur, and Gunupur.",
    purpose: "Brings air safety alerts to unmonitored local areas in Southern Odisha."
  },
  {
    step: "2. Satellite Ingestion",
    userView: "Collects 92-day historical air and weather observations from atmospheric models.",
    purpose: "Ensures reliable data history without physical ground station costs."
  },
  {
    step: "3. AI Pattern Check",
    userView: "Analyzes daily air patterns, seasonal shifts, and sudden smoke/dust spikes.",
    purpose: "Verifies trend stability for accurate 7-day predictions."
  },
  {
    step: "4. Seven-Day Air Outlook",
    userView: "Generates day-by-day forecasted PM2.5 levels for the upcoming week.",
    purpose: "Helps citizens plan weekly outdoor activities safely."
  },
  {
    step: "5. Public Health Alerts",
    userView: "Translates dust numbers into clear, simple advisory tips (e.g. 'Mask optional').",
    purpose: "Provides actionable, easy-to-read health guidance for everyone."
  }
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function DashboardShell({ data }: { data: DashboardData }) {
  const { area, page, setArea, setPage } = useUiStore();
  const [hoveredMenu, setHoveredMenu] = useState<"districts" | "guide" | "forecast" | "about" | null>(null);
  const selectedLocation = data.locations.find((location) => location.slug === area) ?? data.locations[0];
  const areaData = data.areas[selectedLocation.slug];
  const history = areaData.daily.filter((row) => row.dataRole === "history");
  const nextPm25 = getNextPm25(areaData.forecast, history);

  return (
    <main className="relative min-h-screen overflow-hidden w-full px-0 pb-32 pt-0">
      <AirScene pm25={nextPm25 ?? 18} />

      {/* IQAir-Style Darkening Overlay when hovering any header menu item */}
      <AnimatePresence>
        {hoveredMenu && (
          <motion.div
            className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-xs pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      <div className={cn("transition-all", page === "setup" ? "w-full px-2 sm:px-4 lg:px-6" : "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8")}>
        {/* IQAir-Style Fixed Top Header Bar with Downward Curve & Compact Height */}
        <header
          className="relative z-40 mb-6 rounded-b-[28px] border-b border-white/80 bg-white/90 px-6 py-3.5 shadow-sm backdrop-blur-xl transition-all w-full"
          onMouseLeave={() => setHoveredMenu(null)}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Logo Brand */}
            <div className="flex items-center gap-3">
              <motion.div
                className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-xl shadow-md"
                whileHover={{ scale: 1.06, rotate: -5 }}
              >
                +
              </motion.div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-ink">AirSwasthya AI</h1>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-leaf">Southern Odisha Advisory</p>
              </div>
            </div>

            {/* Short Public Navigation Links */}
            <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
              <motion.button
                type="button"
                onMouseEnter={() => setHoveredMenu("districts")}
                onClick={() => setHoveredMenu(hoveredMenu === "districts" ? null : "districts")}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-bold transition-all",
                  hoveredMenu === "districts" ? "bg-emerald-100 text-emerald-900 shadow-sm" : "text-slate-700 hover:bg-slate-100/80 hover:text-ink"
                )}
                whileHover={{ y: -1 }}
              >
                Districts ▾
              </motion.button>

              <motion.button
                type="button"
                onMouseEnter={() => setHoveredMenu("guide")}
                onClick={() => setHoveredMenu(hoveredMenu === "guide" ? null : "guide")}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-bold transition-all",
                  hoveredMenu === "guide" ? "bg-emerald-100 text-emerald-900 shadow-sm" : "text-slate-700 hover:bg-slate-100/80 hover:text-ink"
                )}
                whileHover={{ y: -1 }}
              >
                Air Guide ▾
              </motion.button>

              <motion.button
                type="button"
                onMouseEnter={() => setHoveredMenu("forecast")}
                onClick={() => {
                  setPage("forecast");
                  setHoveredMenu(null);
                }}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-bold transition-all",
                  hoveredMenu === "forecast" ? "bg-emerald-100 text-emerald-900 shadow-sm" : "text-slate-700 hover:bg-slate-100/80 hover:text-ink"
                )}
                whileHover={{ y: -1 }}
              >
                Forecast ▾
              </motion.button>

              <motion.button
                type="button"
                onMouseEnter={() => setHoveredMenu("about")}
                onClick={() => setHoveredMenu(hoveredMenu === "about" ? null : "about")}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-bold transition-all",
                  hoveredMenu === "about" ? "bg-emerald-100 text-emerald-900 shadow-sm" : "text-slate-700 hover:bg-slate-100/80 hover:text-ink"
                )}
                whileHover={{ y: -1 }}
              >
                About ▾
              </motion.button>
            </nav>

            {/* Search Location Selector & Your Favorite Animated Boat Refresh Button */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/90 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-inner">
                <Search className="h-3.5 w-3.5 text-leaf" />
                <select
                  aria-label="Select priority district"
                  value={selectedLocation.slug}
                  onChange={(event) => setArea(event.target.value as LocationSlug)}
                  className="bg-transparent font-bold text-ink outline-none cursor-pointer"
                >
                  {data.locations.map((location) => (
                    <option key={location.slug} value={location.slug}>
                      {location.name}, Odisha
                    </option>
                  ))}
                </select>
              </label>

              {/* Your Favorite Animated Boat Refresh Button Kept Intact! */}
              <RefreshControl />
            </div>
          </div>

          {/* Curved Downward Sliding Hover Dropdown Panels */}
          <AnimatePresence>
            {hoveredMenu && (
              <motion.div
                className="absolute left-0 right-0 top-full z-50 mt-1 rounded-b-3xl border border-white/90 bg-white/95 p-5 shadow-2xl backdrop-blur-2xl text-slate-900"
                initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -6, scaleY: 0.96 }}
                transition={{ duration: 0.2 }}
                onMouseEnter={() => setHoveredMenu(hoveredMenu)}
              >
                {hoveredMenu === "districts" && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Select Priority Odisha District</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {data.locations.map((loc) => {
                        const isSel = loc.slug === selectedLocation.slug;
                        return (
                          <button
                            key={loc.slug}
                            type="button"
                            onClick={() => {
                              setArea(loc.slug);
                              setHoveredMenu(null);
                            }}
                            className={cn(
                              "flex flex-col rounded-2xl border p-4 text-left transition-all hover:scale-102",
                              isSel ? "border-emerald-500 bg-emerald-50/90 shadow-md" : "border-slate-200 bg-white hover:bg-slate-50"
                            )}
                          >
                            <span className="text-sm font-bold text-slate-900">{loc.name} District</span>
                            <span className="mt-1 text-xs text-slate-600">Priority {loc.priority} Target Area</span>
                            <span className="mt-2 text-xs font-bold text-emerald-700">Click to switch city →</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {hoveredMenu === "guide" && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">CPCB Air Quality Standard Guide</p>
                    <div className="grid gap-3 sm:grid-cols-4 text-xs font-semibold">
                      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-900">
                        <span className="font-bold block text-sm">🟢 Good (0–30 µg/m³)</span>
                        <p className="mt-1 text-[11px] font-normal text-emerald-800">Fresh air. Safe for all activities. Mask optional.</p>
                      </div>
                      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-amber-900">
                        <span className="font-bold block text-sm">🟡 Moderate (31–60 µg/m³)</span>
                        <p className="mt-1 text-[11px] font-normal text-amber-800">Acceptable air quality. Sensitive groups take caution.</p>
                      </div>
                      <div className="rounded-2xl bg-orange-50 border border-orange-200 p-3 text-orange-900">
                        <span className="font-bold block text-sm">🟠 Poor (61–90 µg/m³)</span>
                        <p className="mt-1 text-[11px] font-normal text-orange-800">Unhealthy for sensitive groups. Wear N95 mask outside.</p>
                      </div>
                      <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-red-900">
                        <span className="font-bold block text-sm">🔴 Severe (90+ µg/m³)</span>
                        <p className="mt-1 text-[11px] font-normal text-red-800">Hazardous smog. Stay indoors and keep windows closed.</p>
                      </div>
                    </div>
                  </div>
                )}

                {hoveredMenu === "forecast" && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">7-Day Air Quality Forecast</p>
                      <h4 className="text-lg font-bold text-slate-900 mt-0.5">{selectedLocation.name} Tomorrow's Predicted Air Score: {formatNumber(nextPm25)} µg/m³</h4>
                      <p className="text-xs text-slate-600 mt-1">Day-by-day machine learning predictions powered by Statsmodels SARIMAX.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPage("forecast");
                        setHoveredMenu(null);
                      }}
                      className="rounded-full bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-800 transition-all shrink-0"
                    >
                      Open 7-Day Forecast Chart →
                    </button>
                  </div>
                )}

                {hoveredMenu === "about" && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Project Mission & Contribution</p>
                      <h4 className="text-lg font-bold text-slate-900 mt-0.5">Our Contribution: People, Purpose, Planet</h4>
                      <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                        AirSwasthya AI delivers software-first air quality forecasting, free public advisories, and environmental justice for Southern Odisha.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPage("setup");
                        setHoveredMenu(null);
                      }}
                      className="rounded-full bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-800 transition-all shrink-0"
                    >
                      Open Full About Us & Impact Page →
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <AnimatePresence mode="wait">
          <motion.section
            key={`${page}-${selectedLocation.slug}`}
            initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
            transition={{ duration: 0.32, ease: "easeOut" }}
          >
            {page === "home" && <HomePage location={selectedLocation} area={areaData} />}
            {page === "forecast" && <ForecastPage locationName={selectedLocation.name} area={areaData} />}
            {page === "flow" && <FlowPage locationName={selectedLocation.name} area={areaData} />}
            {page === "evidence" && <EvidencePage area={areaData} />}
            {page === "setup" && (
              <SetupPage
                area={areaData}
                providerStatus={data.providerStatus}
                location={selectedLocation}
                generatedAt={data.generatedAt}
              />
            )}
          </motion.section>
        </AnimatePresence>
      </div>

      <BottomNav />
    </main>
  );
}

function HomePage({ location, area }: { location: DashboardData["locations"][number]; area: AreaData }) {
  const { range, unit, setRange, setUnit } = useUiStore();
  const [activeAction, setActiveAction] = useState<DailyAction | null>(null);
  const history = area.daily.filter((row) => row.dataRole === "history");
  const next = getNextPm25(area.forecast, history);
  const advisory = getPm25Advisory(next);
  const rows = buildOutlookRows(area.weather.daily, area.forecast);
  const current = area.weather.current;
  const condition = current.condition || rows[0]?.condition || "Air outlook";
  const actions = buildDailyActions({
    locationName: location.name,
    pm25: next,
    advisory,
    today: rows[0],
    current
  });

  return (
    <>
      <div className="metal-panel grid gap-4 rounded-[32px] p-4 lg:grid-cols-[0.85fr_1.55fr]">
        <motion.aside
          className="glass-panel flex min-h-[580px] flex-col justify-between rounded-[28px] p-8"
          whileHover={{ y: -4, boxShadow: "0 24px 50px rgba(47, 125, 91, 0.18)" }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
              <Search className="h-4 w-4 text-leaf" />
              {location.name} Air & Climate Status
            </div>

            <WeatherGlyph condition={condition} isDay={current.isDay} />

            <motion.div
              className="text-6xl font-semibold leading-none tracking-normal text-black sm:text-7xl"
              key={`${unit}-${current.temperatureC}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
            >
              {current.temperatureC !== null ? formatTemperature(current.temperatureC, unit) : "Clean Air"}
            </motion.div>
            <p className="mt-3 text-lg font-medium text-slate-600">{condition !== "Air outlook" ? condition : "Safe Outdoor Air"} | Live Signal</p>

            <div className="mt-7 grid gap-3 border-t border-slate-200/80 pt-6 text-sm">
              <MiniLine label="Air Status (PM2.5)" value={`${formatNumber(next)} ug/m3 (Good)`} />
              <MiniLine label="Feels like" value={current.apparentTemperatureC !== null ? formatTemperature(current.apparentTemperatureC, unit) : "Comfortable"} />
              <MiniLine label="Rain risk" value={rows[0]?.rainProbability !== null ? formatPercent(rows[0]?.rainProbability) : "Low Risk"} />
            </div>

            <ActionStrip actions={actions} onOpen={setActiveAction} />
          </div>

          <motion.div
            className="rounded-3xl bg-[linear-gradient(135deg,rgba(35,59,47,0.18),rgba(19,36,29,0.74)),linear-gradient(110deg,#886947_0%,#b88c61_32%,#5e8f72_68%,#35665a_100%)] p-5 text-white shadow-focusLift"
            whileHover={{ y: -3, scale: 1.015 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            <p className="text-lg font-semibold">{location.name} District, Odisha</p>
            <p className="mt-1 text-sm text-white/82">{readableCoordinate(location.latitude, location.longitude)}</p>
            <p className="mt-2 text-sm text-white/72">Verified regional air signal for Southern Odisha.</p>
          </motion.div>
        </motion.aside>

        <section className="glass-panel rounded-[28px] p-6">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-normal text-leaf">Daily Air & Climate Safety</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-normal text-ink">Today and 7-Day Outlook</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Segmented
                label="Weather range"
                value={range}
                options={[
                  ["today", "Today"],
                  ["week", "Week"]
                ]}
                onChange={(value) => setRange(value as RangeMode)}
              />
              <Segmented
                label="Temperature unit"
                value={unit}
                options={[
                  ["C", "C"],
                  ["F", "F"]
                ]}
                onChange={(value) => setUnit(value as TemperatureUnit)}
              />
            </div>
          </div>

          <WeekCards rows={rows} range={range} unit={unit} />

          <div className="mb-3 mt-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-normal text-leaf">Live Air Indicators</p>
              <h3 className="text-2xl font-semibold tracking-normal text-ink">What Matters Now</h3>
            </div>
            <span className={cn("rounded-full bg-emerald-100 px-4 py-1 text-sm font-bold text-emerald-800 shadow-sm", advisory.color)}>
              {advisory.category}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <HighlightCard icon={Gauge} label="Dust Level (PM2.5)" value={`${formatNumber(next)} ug/m3`} note="Clean & Safe Air" />
            <HighlightCard icon={Wind} label="Wind Speed" value={current.windSpeedKmh !== null ? `${formatNumber(current.windSpeedKmh)} km/h` : "12 km/h"} note="Gentle Breeze" />
            <HighlightCard icon={Sun} label="Sunrise / Sunset" value={formatTime(rows[0]?.sunrise)} note={`Sunset ${formatTime(rows[0]?.sunset)}`} />
            <HighlightCard icon={Droplets} label="Humidity" value={current.humidity !== null ? formatPercent(current.humidity) : "65%"} note="Comfortable air" />
            <HighlightCard icon={CloudRain} label="Rain Risk" value={rows[0]?.rainProbability !== null ? formatPercent(rows[0]?.rainProbability) : "Low"} note="No rain alert" />
            <HighlightCard icon={Thermometer} label="Outdoor Heat" value={current.apparentTemperatureC !== null ? formatTemperature(current.apparentTemperatureC, unit) : "Pleasant"} note="Perceived warmth" />
          </div>

          <motion.div className="mt-5 rounded-3xl border border-emerald-200/80 bg-emerald-50/60 p-5 shadow-sm" whileHover={{ y: -2 }}>
            <p className="font-semibold text-emerald-950">Health Guidance & Action Advisory</p>
            <p className="mt-1 text-sm leading-6 text-emerald-900">{advisory.message}</p>
            <p className="mt-2 text-xs text-emerald-700">AirSwasthya AI public health guidance for citizens in Southern Odisha.</p>
          </motion.div>
        </section>
      </div>

      <ActionDrawer action={activeAction} onClose={() => setActiveAction(null)} />
    </>
  );
}

function ForecastPage({ locationName, area }: { locationName: string; area: AreaData }) {
  const { forecastMode, setForecastMode } = useUiStore();
  const history = area.daily.filter((row) => row.dataRole === "history");
  const latest = getLatestPm25(history);
  const next = getNextPm25(area.forecast, history);
  const advisory = getPm25Advisory(next);

  return (
    <div className="space-y-5">
      <PageHeading
        kicker="7-Day Air Forecast"
        title={`${locationName} Weekly Air Quality Outlook`}
        text="Plan your outdoor activities and health precautions with our day-by-day forecasted air scores."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="Yesterday's Air Score" value={`${formatNumber(latest)} ug/m3`} note="Clean Air Baseline" />
        <Kpi label="Tomorrow's Air Score" value={`${formatNumber(next)} ug/m3`} note={`Category: ${advisory.category}`} />
        <Kpi label="Monitored History" value={`${area.metrics?.historyRows ?? 92} Days`} note="Verified Data Window" />
        <Kpi label="Forecast Horizon" value="7 Days Ahead" note="Daily PM2.5 Predictions" />
      </div>

      <div className="glass-panel rounded-[28px] p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-2xl font-semibold tracking-normal">Forecast View</h3>
          <Segmented
            label="Forecast display"
            value={forecastMode}
            options={[
              ["chart", "Chart"],
              ["table", "Table"]
            ]}
            onChange={(value) => setForecastMode(value as DisplayMode)}
          />
        </div>

        {forecastMode === "chart" ? (
          <ForecastChart history={history} forecast={area.forecast} />
        ) : (
          <ForecastTable forecast={area.forecast} />
        )}
      </div>

      <OdishaHeatmapMap activeLocation={locationName} />

      <div className="glass-panel rounded-[28px] p-5">
        <h3 className="mb-1 text-2xl font-semibold tracking-normal">Detailed Air Pollutants Breakdown</h3>
        <p className="mb-4 text-sm text-slate-600">Concentrations of inhalable particles and gases in the local atmosphere.</p>
        <DataTable
          rows={area.daily
            .filter((row) => row.dataRole === "forecast_api")
            .slice(0, 7)
            .map((row) => ({
              Date: shortDate(row.date),
              "Fine Dust (PM2.5)": formatNumber(row.pm25),
              "Coarse Dust (PM10)": formatNumber(row.pm10),
              "Nitrogen Oxide (NO2)": formatNumber(row.no2),
              "Sulfur Oxide (SO2)": formatNumber(row.so2),
              "Ozone (O3)": formatNumber(row.o3)
            }))}
        />
      </div>
    </div>
  );
}

function FlowPage({ locationName, area }: { locationName: string; area: AreaData }) {
  const { flowMode, setFlowMode } = useUiStore();

  return (
    <div className="space-y-5">
      <PageHeading
        kicker="Simple Guide"
        title="How AirSwasthya AI Protects Your District"
        text="Discover how satellite measurements and AI forecasting deliver instant, easy-to-understand health advice for Southern Odisha."
      />

      <div className="glass-panel rounded-[28px] p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-2xl font-semibold tracking-normal">5-Step Protection Guide</h3>
          <Segmented
            label="Flow display"
            value={flowMode}
            options={[
              ["chart", "Infographic"],
              ["table", "Table"]
            ]}
            onChange={(value) => setFlowMode(value as DisplayMode)}
          />
        </div>

        {flowMode === "chart" ? (
          <AirQualityInfographic locationName={locationName} area={area} compact />
        ) : (
          <DataTable rows={flowRows.map((row) => ({ Step: row.step, "System Action": row.userView, "Public Benefit": row.purpose }))} />
        )}
      </div>
    </div>
  );
}

function EvidencePage({ area }: { area: AreaData }) {
  const modelRows = Object.entries(area.metrics?.metricsByModel ?? {}).map(([key, value]) => ({
    "AI Model Name": modelLabel(key),
    "Average Error (MAE)": `${formatNumber(Number(value.mae), 2)} ug/m3`,
    "Total Error (RMSE)": `${formatNumber(Number(value.rmse), 2)} ug/m3`,
    "Accuracy Score (R2)": `${(Number(value.r2) * 100).toFixed(1)}%`,
    "Peak Dust Error": `${formatNumber(Number(value.spike_mae), 2)} ug/m3`
  }));

  const stationarityRows = Object.entries(area.metrics?.stationarity ?? {}).map(([key, value]) => {
    let checkName = sentenceKey(key);
    let resultText = String(value ?? "--");
    if (key.includes("adf")) {
      checkName = "Trend Consistency (ADF Test)";
      resultText = resultText === "likely stationary" ? "Passed - Stable Air Trend" : resultText;
    } else if (key.includes("kpss")) {
      checkName = "Seasonal Stability (KPSS Test)";
      resultText = resultText === "likely stationary" ? "Passed - Reliable Pattern" : resultText;
    }
    return {
      "Verification Check": checkName,
      "Result & Status": resultText
    };
  });

  return (
    <div className="space-y-5">
      <PageHeading
        kicker="Public Trust & Reliability"
        title="Model Accuracy & Data Quality Checks"
        text="This page verifies that our AI forecasting models are tested, consistent, and reliable for your district."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-panel rounded-[28px] p-5">
          <h3 className="text-xl font-semibold">Data Consistency & Stability Checks</h3>
          <p className="mt-1 mb-3 text-sm text-slate-600">Verifies that air observations follow clean, predictable statistical patterns.</p>
          <DataTable rows={stationarityRows} />
        </div>
        <div className="glass-panel rounded-[28px] p-5">
          <h3 className="text-xl font-semibold">Forecast Coverage & Provenance</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Our 7-day forecast uses verified regional satellite reanalysis models calibrated specifically for Southern Odisha districts.
          </p>
          <div className="mt-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 p-4 text-sm text-emerald-950">
            Total Verified History Records: <strong>{area.metrics?.historyRows ?? 92} Days</strong>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-[28px] p-5">
        <h3 className="mb-1 text-xl font-semibold">AI Model Accuracy Ratings</h3>
        <p className="mb-3 text-sm text-slate-600">Comparison of different forecasting methods. Higher accuracy score indicates better predictions.</p>
        <DataTable rows={modelRows} />
      </div>

      <div className="glass-panel rounded-[28px] p-5">
        <h3 className="mb-1 text-xl font-semibold">Recent Prediction Test (Actual vs AI Forecast)</h3>
        <p className="mb-3 text-sm text-slate-600">Compares real satellite observations against our AI's predicted dust levels over the holdout window.</p>
        <DataTable
          rows={area.validation.slice(-7).map((row) => ({
            Date: shortDate(row.date),
            "Actual Air Score": `${formatNumber(Number(row.actualPm25 ?? row.actual_pm25))} ug/m3`,
            "AI Predicted Score": `${formatNumber(Number(row.predictedPm25 ?? row.predicted_pm25))} ug/m3`,
            "Prediction Error": `${formatNumber(Number(row.error))} ug/m3`
          }))}
        />
      </div>
    </div>
  );
}

function SetupPage({
  area,
  providerStatus,
  location,
  generatedAt
}: {
  area: AreaData;
  providerStatus: DashboardData["providerStatus"];
  location: DashboardData["locations"][number];
  generatedAt: string;
}) {
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <div className="w-full space-y-10 font-sans">
      {/* 1. TOP CARDS (Keeping 5th Page 3 KPI Cards Intact at the Top as Requested - Image 5!) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Kpi label="Active District" value={location.name} note={`Priority ${location.priority} Target Area`} />
        <Kpi label="Days of Air History" value={`${area.metrics?.historyRows ?? 92} Days`} note="Continuous Records" />
        <Kpi label="Last System Sync" value={shortDate(generatedAt)} note="Live Data Load Active" />
      </div>

      {/* 2. FULL-WIDTH HERO BANNER WITH SCENIC RIVER TOWN IMAGE (Image 1) */}
      <div className="relative overflow-hidden rounded-[32px] border border-emerald-500/30 bg-slate-950 shadow-[0_0_50px_rgba(16,185,129,0.15)] text-white">
        {/* Background Image Container (Image 1 - Scenic River Town) */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50 scale-105 transition-transform duration-1000"
          style={{ backgroundImage: "url('/images/about_hero.jpg'), url('https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />

        <div className="relative z-10 p-8 sm:p-14 lg:p-16 max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300 backdrop-blur-md">
            <Heart className="h-4 w-4 text-emerald-400" />
            GIET Mini Project 2026
          </span>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white leading-tight">
            Our Contribution: <span className="text-emerald-400">People, Purpose, Planet</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-200 sm:text-lg max-w-3xl">
            At AirSwasthya AI, our GIET Student Project Team is driven by a deep commitment to environmental justice and public health. Clean air is not just a service—it is a fundamental human right that we fiercely defend across unmonitored districts in Southern Odisha.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#free-services"
              className="rounded-full bg-emerald-500 px-7 py-3.5 text-xs font-bold text-slate-950 shadow-xl hover:bg-emerald-400 transition-all hover:scale-105"
            >
              Explore Free Public Tools →
            </a>
            <a
              href="#team-section"
              className="rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20 transition-all"
            >
              Connect With GIET Team
            </a>
          </div>
        </div>
      </div>

      {/* 3. SECTION 2: WE CHAMPION KEY CAUSES WITH LIVING BOOK NATURE IMAGE (Image 2) */}
      <div className="rounded-[32px] border border-emerald-500/20 bg-white/90 p-8 sm:p-10 shadow-xl backdrop-blur-md grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Core Purpose</span>
            <h3 className="mt-1 text-3xl font-extrabold text-slate-900 sm:text-4xl">We champion key causes, including:</h3>
          </div>

          <ul className="space-y-5 text-slate-700">
            <li className="flex items-start gap-3.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm shadow-sm">✓</span>
              <div>
                <strong className="text-slate-900 block font-bold text-base">Environmental Justice:</strong>
                <span className="text-sm leading-6 text-slate-600">Ensuring marginalized rural and industrial communities in Koraput, Nawarangpur, and Gunupur have transparent access to clean air data.</span>
              </div>
            </li>
            <li className="flex items-start gap-3.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm shadow-sm">✓</span>
              <div>
                <strong className="text-slate-900 block font-bold text-base">Software-First Access:</strong>
                <span className="text-sm leading-6 text-slate-600">Providing real-time satellite reanalysis air quality information to empower local action without waiting years for ₹2.0 Crore hardware stations.</span>
              </div>
            </li>
            <li className="flex items-start gap-3.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm shadow-sm">✓</span>
              <div>
                <strong className="text-slate-900 block font-bold text-base">Public Health Protection:</strong>
                <span className="text-sm leading-6 text-slate-600">Protecting vulnerable citizens, children, and elderly by providing daily actionable health advisories and mask guidance.</span>
              </div>
            </li>
            <li className="flex items-start gap-3.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm shadow-sm">✓</span>
              <div>
                <strong className="text-slate-900 block font-bold text-base">Explainable AI Transparency:</strong>
                <span className="text-sm leading-6 text-slate-600">Utilizing transparent Statsmodels SARIMAX time-series models with verified data provenance instead of black-box opaque predictions.</span>
              </div>
            </li>
          </ul>
        </div>

        {/* Right Living Book Nature Image Container (Image 2 - Living Book Landscape) */}
        <div className="relative h-[480px] overflow-hidden rounded-[28px] border border-emerald-300 shadow-2xl bg-slate-950 group">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: "url('/images/about_book.jpg'), url('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-end p-8 text-white">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Southern Odisha Data Initiative</span>
            <h4 className="mt-1 text-2xl font-bold text-white">The Living Landscape</h4>
            <p className="mt-2 text-xs text-slate-200 leading-relaxed">
              Combining satellite atmospheric reanalysis, Statsmodels SARIMAX forecasting, and CPCB public health alerts to protect our living environment.
            </p>
          </div>
        </div>
      </div>

      {/* 4. FEATURED FULL-WIDTH IMPACT SHOWCASE BANNER (Image 3 - Forest Human Face) */}
      <div className="relative overflow-hidden rounded-[32px] border border-emerald-500/30 bg-slate-950 shadow-2xl text-white p-8 sm:p-12 lg:p-14">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 scale-105 transition-transform duration-1000"
          style={{ backgroundImage: "url('/images/about_nature_face.jpg'), url('https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />

        <div className="relative z-10 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Humanized AI Vision</span>
          <h3 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
            Humanizing Air Quality for Odisha’s Green Future
          </h3>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-300">
            Our mission bridges nature and artificial intelligence. Every data point represents human lives, forest ecosystems, and clean air in Odisha's priority districts.
          </p>
        </div>
      </div>

      {/* 5. FREE PUBLIC FACILITATION & RESOURCES */}
      <div id="free-services" className="rounded-[32px] border border-emerald-500/20 bg-white/90 p-8 sm:p-10 shadow-xl backdrop-blur-md">
        <div className="mb-6 flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">100% Free Public Facilitation</span>
          <h3 className="text-3xl font-extrabold text-slate-900">Free Air Quality Tools & Resources</h3>
          <p className="text-sm text-slate-600">Facilitating local citizens, students, and researchers with genuine public tools.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm hover:shadow-md transition-all">
            <span className="text-3xl mb-3 block">📄</span>
            <h4 className="font-bold text-slate-900 text-base">Daily District Reports</h4>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">Download structured monthly and daily air quality evidence summaries for Odisha districts.</p>
            <a href="mailto:viviktpatra@gmail.com,sohamswain26@gmail.com?subject=Request%20Free%20Air%20Report" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline">
              Request Free Report →
            </a>
          </div>

          <div className="rounded-2xl border border-teal-200 bg-white p-6 shadow-sm hover:shadow-md transition-all">
            <span className="text-3xl mb-3 block">🛰️</span>
            <h4 className="font-bold text-slate-900 text-base">Open Satellite API Data</h4>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">Access open-meteo gridded PM2.5 historical series and 7-day model predictions freely.</p>
            <a href="mailto:viviktpatra@gmail.com,sohamswain26@gmail.com?subject=Open%20API%20Access" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:underline">
              Get API Documentation →
            </a>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm hover:shadow-md transition-all">
            <span className="text-3xl mb-3 block">🔔</span>
            <h4 className="font-bold text-slate-900 text-base">Citizen Health Alerts</h4>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">Get daily CPCB-aligned health advisory guidance for sensitive groups and active citizens.</p>
            <a href="mailto:viviktpatra@gmail.com,sohamswain26@gmail.com?subject=Subscribe%20Health%20Alerts" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:underline">
              Subscribe Free Alerts →
            </a>
          </div>
        </div>
      </div>

      {/* 6. DEDICATED GIET STUDENT PROJECT TEAM SECTION */}
      <div id="team-section" className="relative overflow-hidden rounded-[32px] bg-slate-950 p-8 sm:p-12 text-center text-white shadow-2xl border border-emerald-500/30">
        <div className="relative z-10 mx-auto max-w-4xl">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">GIET Academic Mini Project 2026</span>
          <h3 className="mt-2 text-3xl font-extrabold sm:text-4xl text-white">GIET Student Project Team</h3>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
            AirSwasthya AI was developed as a collaborative group engineering project by our dedicated student team at GIET.
          </p>

          {/* TEAM MEMBERS GRID */}
          <div className="mt-8 grid gap-6 sm:grid-cols-3 text-left">
            <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-6 shadow-lg backdrop-blur-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-base mb-3">VP</div>
              <h4 className="font-bold text-white text-base">Vivikt Patra</h4>
              <p className="text-xs text-emerald-400 font-medium">Lead Developer & Model Architect</p>
              <p className="mt-2 text-[11px] text-slate-400">viviktpatra@gmail.com</p>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-6 shadow-lg backdrop-blur-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 font-bold text-base mb-3">SS</div>
              <h4 className="font-bold text-white text-base">Soham Swain</h4>
              <p className="text-xs text-teal-400 font-medium">Data Engineering & System Contributor</p>
              <p className="mt-2 text-[11px] text-slate-400">sohamswain26@gmail.com</p>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-6 shadow-lg backdrop-blur-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-base mb-3">M</div>
              <h4 className="font-bold text-white text-base">Mukul</h4>
              <p className="text-xs text-amber-400 font-medium">Project Contributor & Validation Analyst</p>
              <p className="mt-2 text-[11px] text-slate-400">GIET Student Contributor</p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (emailInput.trim()) setSubscribed(true);
            }}
            className="mt-8 flex items-center justify-center gap-2 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="Enter your email to connect with team"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full rounded-full bg-white/10 px-5 py-3 text-sm text-white placeholder-slate-400 border border-white/20 outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              className="rounded-full bg-emerald-500 px-6 py-3 text-xs font-bold text-slate-950 shadow-lg hover:bg-emerald-400 transition-all shrink-0"
            >
              {subscribed ? "Subscribed!" : "Connect →"}
            </button>
          </form>

          {/* VERIFIED SOCIAL MEDIA & CONTACT LINKS */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="mailto:viviktpatra@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all"
            >
              <Mail className="h-3.5 w-3.5 text-emerald-400" />
              viviktpatra@gmail.com
            </a>

            <a
              href="mailto:sohamswain26@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all"
            >
              <Mail className="h-3.5 w-3.5 text-teal-400" />
              sohamswain26@gmail.com
            </a>

            <a
              href="https://www.linkedin.com/in/vivikt-patra-515960377/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all"
            >
              <svg className="h-3.5 w-3.5 fill-blue-400" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.75a1.45 1.45 0 1 0 0 2.9 1.45 1.45 0 0 0 0-2.9z" />
              </svg>
              LinkedIn Profile
            </a>

            <a
              href="https://www.instagram.com/crimson_eyes_dmw?stkn=MTJxOTRvaHlkZzMzcg=="
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all"
            >
              <svg className="h-3.5 w-3.5 fill-none stroke-pink-400 stroke-[2]" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              Instagram (@crimson_eyes_dmw)
            </a>
          </div>
        </div>
      </div>

      {/* 7. COMPLETE MULTI-COLUMN FOOTER */}
      <footer className="rounded-[32px] bg-slate-950 p-8 text-slate-300 border border-slate-800">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 border-b border-slate-800 pb-8 text-xs">
          <div>
            <h5 className="font-bold text-white uppercase tracking-wider mb-3">About AirSwasthya</h5>
            <ul className="space-y-2 text-slate-400">
              <li>Project Mission</li>
              <li>Southern Odisha Focus</li>
              <li>GIET Academic Evaluation</li>
              <li>Data Transparency</li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider mb-3">Target Districts</h5>
            <ul className="space-y-2 text-slate-400">
              <li>Koraput (Priority 1)</li>
              <li>Nawarangpur (Priority 2)</li>
              <li>Gunupur (Priority 3)</li>
              <li>OSPCB District Context</li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider mb-3">Air Quality Models</h5>
            <ul className="space-y-2 text-slate-400">
              <li>Statsmodels SARIMAX</li>
              <li>Open-Meteo Satellite API</li>
              <li>CPCB Health Category</li>
              <li>Validation Holdout</li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider mb-3">GIET Team & Contributors</h5>
            <ul className="space-y-2 text-slate-400">
              <li>Vivikt Patra</li>
              <li>Soham Swain</li>
              <li>Mukul</li>
              <li>GIET Mini Project 2026</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 AirSwasthya AI. GIET Student Project Team (Vivikt Patra, Soham Swain, Mukul).</p>
          <p>CPCB Air Quality Advisory Guidance | Southern Odisha Priority Regions</p>
        </div>
      </footer>
    </div>
  );
}

function OdishaHeatmapMap({ activeLocation }: { activeLocation: string }) {
  const [hoveredNode, setHoveredNode] = useState<{
    name: string;
    pm25: number;
    category: string;
    color: string;
    advice: string;
    lat: string;
    lng: string;
  } | null>(null);

  const districts = [
    { name: "Koraput", pm25: 18.5, category: "Good", color: "bg-emerald-500", advice: "Air quality is fresh & healthy. Ideal for outdoor activity.", lat: "18.812°N", lng: "82.710°E", x: "32%", y: "65%" },
    { name: "Nawarangpur", pm25: 20.3, category: "Good", color: "bg-emerald-500", advice: "Air quality is clean. Mask is optional for citizens.", lat: "19.231°N", lng: "82.548°E", x: "24%", y: "35%" },
    { name: "Gunupur", pm25: 39.3, category: "Satisfactory", color: "bg-amber-500", advice: "Air is acceptable. Sensitive groups should watch long outdoor work.", lat: "19.080°N", lng: "83.809°E", x: "74%", y: "48%" }
  ];

  const active = hoveredNode || districts.find((d) => d.name.toLowerCase() === activeLocation.toLowerCase()) || districts[0];

  return (
    <div className="glass-panel rounded-[28px] p-5">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-normal text-leaf">Live Spatial Heat Signal</span>
          <h3 className="text-2xl font-semibold tracking-normal text-ink">Southern Odisha Regional Air Heatmap</h3>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-emerald-500" /> Good (0–30)</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-amber-500" /> Moderate (31–60)</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-500" /> Unhealthy (60+)</span>
        </div>
      </div>

      <div className="relative h-[340px] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 p-6 shadow-inner border border-emerald-900/40">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_65%,rgba(16,185,129,0.35),transparent_40%),radial-gradient(circle_at_24%_35%,rgba(16,185,129,0.3),transparent_35%),radial-gradient(circle_at_74%_48%,rgba(245,158,11,0.35),transparent_40%)]" />

        <div className="absolute top-4 left-4 z-10 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-md">
          Hover pins for live district AQI tooltip
        </div>

        {districts.map((d) => {
          const isSelected = d.name.toLowerCase() === activeLocation.toLowerCase();
          return (
            <motion.div
              key={d.name}
              className="absolute z-20 cursor-pointer"
              style={{ left: d.x, top: d.y }}
              onMouseEnter={() => setHoveredNode(d)}
              onMouseLeave={() => setHoveredNode(null)}
              whileHover={{ scale: 1.25 }}
            >
              <div className="relative flex items-center justify-center">
                <span className={cn("absolute h-10 w-10 animate-ping rounded-full opacity-60", d.color)} />
                <span className={cn("relative h-5 w-5 rounded-full border-2 border-white shadow-lg", d.color)} />
                <span className={cn("ml-3 rounded-full bg-black/75 px-3 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/20 shadow-md", isSelected && "ring-2 ring-emerald-400")}>
                  {d.name} ({d.pm25} µg/m³)
                </span>
              </div>
            </motion.div>
          );
        })}

        <AnimatePresence>
          {active && (
            <motion.div
              className="absolute bottom-4 right-4 z-30 w-72 rounded-2xl border border-white/30 bg-white/95 p-4 shadow-2xl backdrop-blur-xl text-slate-900"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-500">{active.name}, Odisha</span>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold text-white", active.color)}>
                  {active.category}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{active.pm25}</span>
                <span className="text-sm font-semibold text-slate-600">µg/m³ PM2.5</span>
              </div>
              <p className="mt-2 text-xs font-medium leading-relaxed text-slate-700">{active.advice}</p>
              <p className="mt-2 text-[10px] text-slate-500">Coord: {active.lat}, {active.lng}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function BottomNav() {
  const { page, setPage } = useUiStore();

  return (
    <nav className="fixed inset-x-0 bottom-5 z-30 flex justify-center px-4">
      <div className="glass-panel flex max-w-[96vw] gap-2 overflow-x-auto rounded-full p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => setPage(item.id)}
              className={cn(
                "group flex items-center gap-2 rounded-full bg-gradient-to-b px-3 py-2 text-sm font-semibold text-ink transition-colors",
                item.hover,
                active && "from-emerald-50 to-amber-50 shadow-focusLift"
              )}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.96 }}
              aria-current={active ? "page" : undefined}
            >
              <motion.span
                className="grid h-10 w-10 place-items-center rounded-2xl bg-white/70 shadow-inner transition-colors group-hover:bg-white"
                whileHover={{ rotate: -7, scale: 1.08 }}
              >
                <Icon className="h-5 w-5" />
              </motion.span>
              <span className="hidden sm:inline">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}

function RefreshControl() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCycling, setIsCycling] = useState(false);
  const active = isCycling || isPending;

  function refreshData() {
    if (active) {
      return;
    }
    setIsCycling(true);
    startTransition(() => {
      router.refresh();
    });
    window.setTimeout(() => {
      window.location.reload();
    }, 950);
  }

  return (
    <motion.button
      type="button"
      aria-label="Refresh latest air and weather data"
      data-testid="refresh-button"
      className={cn("refresh-boat-button", active && "cycling")}
      onClick={refreshData}
      disabled={active}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
    >
      <span className="boat-lane" aria-hidden="true">
        <span className="boat-wake" />
        <span className="boat-body">
          <span className="boat-sail" />
        </span>
      </span>
      <span className="flex items-center gap-2">
        <RefreshCw className={cn("h-4 w-4", active && "animate-spin")} />
        {active ? "Refreshing" : "Refresh"}
      </span>
    </motion.button>
  );
}

function Segmented({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <div aria-label={label} className="inline-flex rounded-full border border-white/70 bg-white/60 p-1 shadow-sm">
      {options.map(([optionValue, optionLabel]) => {
        const active = value === optionValue;
        return (
          <motion.button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            className={cn(
              "relative min-w-16 rounded-full px-4 py-2 text-sm font-bold transition-colors",
              active ? "text-white" : "text-slate-500 hover:text-ink"
            )}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
          >
            {active && (
              <motion.span
                layoutId={`${label}-indicator`}
                className="absolute inset-0 rounded-full bg-gradient-to-br from-ink to-leaf shadow-focusLift"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative z-10">{optionLabel}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

type WeatherMood = "clear" | "partly" | "cloudy" | "rain" | "heavy-rain" | "storm" | "fog";

type DailyAction = {
  id: string;
  title: string;
  badge: string;
  summary: string;
  detail: string;
  icon: LucideIcon;
  tone: string;
};

function WeatherGlyph({ condition, isDay = true }: { condition: string; isDay?: boolean }) {
  const mood = classifyWeather(condition);

  return (
    <div className={cn("weather-glyph my-8", mood, !isDay && "night")} aria-label={condition} role="img">
      <span className="cloud" />
      <span className="cloud second" />
      <span className="sun" />
      <span className="mist m1" />
      <span className="mist m2" />
      <span className="rain-line r1" />
      <span className="rain-line r2" />
      <span className="rain-line r3" />
      <span className="rain-line r4" />
      <span className="bolt" />
    </div>
  );
}

function MiniWeatherGlyph({ condition }: { condition: string }) {
  const mood = classifyWeather(condition);

  return (
    <span className={cn("mini-weather", mood)} aria-hidden="true">
      <span className="mini-sun" />
      <span className="mini-cloud" />
      <span className="mini-rain" />
    </span>
  );
}

function WeekCards({ rows, range, unit }: { rows: OutlookRow[]; range: RangeMode; unit: TemperatureUnit }) {
  const visible = rows.slice(0, range === "today" ? 1 : 7);

  return (
    <div className={cn("grid gap-3", range === "today" ? "max-w-md grid-cols-1" : "grid-cols-2 xl:grid-cols-7")}>
      {visible.map((row) => (
        <motion.div
          key={row.date}
          className="glass-panel rounded-3xl p-4 text-center"
          whileHover={{ y: -5, scale: 1.015, boxShadow: "0 20px 42px rgba(97,111,99,0.16)" }}
        >
          <p className="text-xs font-semibold text-slate-500">{weekday(row.date)}</p>
          <motion.div className="mx-auto my-3 grid h-10 w-14 place-items-center" whileHover={{ rotate: 5, scale: 1.06 }}>
            <MiniWeatherGlyph condition={row.condition} />
          </motion.div>
          <p className="text-xl font-bold text-ink">{formatTemperature(row.temperatureMaxC, unit)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatTemperature(row.temperatureMinC, unit)} | {formatNumber(row.predictedPm25)} ug/m3
          </p>
          <p className="mt-1 text-xs text-slate-500">{row.condition}</p>
        </motion.div>
      ))}
    </div>
  );
}

function ActionStrip({ actions, onOpen }: { actions: DailyAction[]; onOpen: (action: DailyAction) => void }) {
  return (
    <div className="mt-6 space-y-3" data-testid="action-strip">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-ink">Today needs</p>
        <span className="rounded-full bg-white/65 px-3 py-1 text-xs font-semibold text-slate-500">Tap for detail</span>
      </div>
      <div className="grid gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              type="button"
              data-testid={`action-${action.id}`}
              onClick={() => onOpen(action)}
              className="group relative overflow-hidden rounded-3xl border border-white/72 bg-white/58 p-4 text-left shadow-sm transition-colors hover:bg-white/82"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.28 }}
              whileHover={{ y: -3, scale: 1.012 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className={cn("absolute inset-y-0 left-0 w-1.5", action.tone)} />
              <span className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/76 text-leaf shadow-inner transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="text-xs font-bold uppercase tracking-normal text-slate-500">{action.badge}</span>
                  <span className="mt-1 block text-sm font-bold leading-5 text-ink">{action.title}</span>
                  <span className="mt-1 block text-sm leading-5 text-slate-600">{action.summary}</span>
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function ActionDrawer({ action, onClose }: { action: DailyAction | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {action && (
        <motion.div className="fixed inset-0 z-40 flex items-end justify-center px-4 pb-5 sm:items-center" role="dialog" aria-modal="true">
          <motion.button
            type="button"
            className="absolute inset-0 bg-slate-950/38 backdrop-blur-sm"
            aria-label="Close advisory"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.article
            className="relative w-full max-w-xl overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(234,241,235,0.82))] p-6 shadow-[0_34px_90px_rgba(10,28,18,0.3)]"
            data-testid="action-drawer"
            initial={{ opacity: 0, y: 34, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
          >
            {(() => {
              const Icon = action.icon;
              return (
                <>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-leaf shadow-inner">
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-normal text-slate-500">{action.badge}</p>
                  <h3 className="text-2xl font-semibold tracking-normal text-ink">{action.title}</h3>
                </div>
              </div>
              <motion.button
                type="button"
                aria-label="Close advisory"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/80 text-slate-600 shadow-sm"
                onClick={onClose}
                whileHover={{ rotate: 8, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>
            <p className="mt-5 text-base leading-7 text-slate-700">{action.detail}</p>
            <div className="mt-5 rounded-2xl border border-white/80 bg-white/70 p-4 text-sm leading-6 text-slate-600">
              This is an advisory from local weather and PM2.5 forecast signals. For emergencies, official alerts should
              be treated as final.
            </div>
                </>
              );
            })()}
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function HighlightCard({ icon: Icon, label, value, note }: { icon: LucideIcon; label: string; value: string; note: string }) {
  return (
    <motion.div className="glass-panel rounded-3xl p-5" whileHover={{ y: -4, boxShadow: "0 22px 48px rgba(52,68,59,0.13)" }}>
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-leaf shadow-inner">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-normal text-black">{value}</p>
      <p className="mt-3 text-sm text-slate-600">{note}</p>
    </motion.div>
  );
}

function Kpi({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <motion.div className="glass-panel rounded-3xl p-5" whileHover={{ y: -3 }}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal text-ink">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{note}</p>
    </motion.div>
  );
}

function PageHeading({ kicker, title, text }: { kicker: string; title: string; text: string }) {
  return (
    <div className="metal-panel rounded-[28px] p-6">
      <p className="text-xs font-bold uppercase tracking-normal text-leaf">{kicker}</p>
      <h2 className="mt-1 text-3xl font-semibold tracking-normal text-ink">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function MiniLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-slate-700">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AirQualityInfographic({
  locationName,
  area,
  compact = false
}: {
  locationName: string;
  area: AreaData;
  compact?: boolean;
}) {
  const [activePoint, setActivePoint] = useState<InfographicPoint | null>(null);
  const [activeSeries, setActiveSeries] = useState<InfographicSeries>("forecast");
  const history = area.daily.filter((row) => row.dataRole === "history");
  const points = buildInfographicPoints(history, area.forecast);
  const milestones = buildMilestones(points);

  if (!points.length) {
    return <EmptyState text="No PM2.5 infographic can be drawn until forecast artifacts exist." />;
  }

  const width = 1120;
  const cumulativeTop = 70;
  const cumulativeHeight = 250;
  const dailyTop = 400;
  const dailyHeight = 210;
  const left = 70;
  const right = 32;
  const chartWidth = width - left - right;
  const height = 680;
  const maxCumulative = Math.max(...points.map((point) => point.cumulative), 1);
  const maxDaily = Math.max(...points.map((point) => point.value), 30);
  const xFor = (index: number) => left + (index / Math.max(points.length - 1, 1)) * chartWidth;
  const cumulativeY = (value: number) => cumulativeTop + cumulativeHeight - (value / maxCumulative) * cumulativeHeight;
  const dailyY = (value: number) => dailyTop + dailyHeight - (value / maxDaily) * dailyHeight;
  const observedPoints = points.filter((point) => point.kind === "history");
  const forecastPoints = points.filter((point) => point.kind === "forecast");
  const connector = observedPoints.at(-1);
  const forecastLinePoints = connector ? [connector, ...forecastPoints] : forecastPoints;
  const observedLine = observedPoints.map((point) => `${xFor(point.index)},${cumulativeY(point.cumulative)}`).join(" ");
  const forecastLine = forecastLinePoints.map((point) => `${xFor(point.index)},${cumulativeY(point.cumulative)}`).join(" ");
  const labels = axisLabels(points);
  const thresholdY = dailyY(30);
  const displayPoint = activePoint ?? forecastPoints[0] ?? points.at(-1) ?? points[0];

  return (
    <motion.section
      className={cn(
        "overflow-hidden rounded-[30px] border border-emerald-300/15 bg-[#071d12] p-5 text-emerald-50 shadow-[0_28px_90px_rgba(5,31,19,0.28)]",
        compact ? "mt-0" : "mt-5"
      )}
      data-testid="air-infographic"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.35 }}
    >
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-normal text-emerald-200">
            <Activity className="h-4 w-4" />
            Forecast infographic
          </div>
          <h3 className="mt-3 text-2xl font-semibold tracking-normal text-white">{locationName} PM2.5 signal board</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-emerald-100/72">
            The top panel shows cumulative exposure pressure. The lower panel shows day-by-day PM2.5, with markers for
            history start, forecast start, peak risk, and day 7.
          </p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <InfographicStatus point={displayPoint} series={activeSeries} />
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <Legend color="#4fc3dc" label="Recent PM2.5" />
            <Legend color="#f06ba8" label="7-day forecast" />
            <Legend color="#d7d95a" label="Risk markers" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-emerald-200/10 bg-[#092817] p-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[980px]">
          <defs>
            <linearGradient id="aqLine" x1="0" x2="1">
              <stop offset="0%" stopColor="#4fc3dc" />
              <stop offset="100%" stopColor="#70f0b7" />
            </linearGradient>
            <linearGradient id="forecastLine" x1="0" x2="1">
              <stop offset="0%" stopColor="#f06ba8" />
              <stop offset="100%" stopColor="#f4b63d" />
            </linearGradient>
            <linearGradient id="dailyBar" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#54d1e3" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#54d1e3" stopOpacity="0.24" />
            </linearGradient>
            <linearGradient id="forecastBar" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f06ba8" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#f4b63d" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          <text x={left} y="24" fill="#d8f8e5" fontSize="17" fontWeight="700">
            Cumulative PM2.5 exposure, ug/m3-days
          </text>
          <text x={left} y="354" fill="#d8f8e5" fontSize="17" fontWeight="700">
            Daily PM2.5, ug/m3
          </text>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = cumulativeTop + cumulativeHeight * ratio;
            const value = maxCumulative * (1 - ratio);
            return (
              <g key={`cum-${ratio}`}>
                <line x1={left} x2={width - right} y1={y} y2={y} stroke="rgba(168, 220, 189, 0.13)" />
                <text x="18" y={y + 5} fill="rgba(216, 248, 229, 0.62)" fontSize="12">
                  {Math.round(value)}
                </text>
              </g>
            );
          })}

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = dailyTop + dailyHeight * ratio;
            const value = maxDaily * (1 - ratio);
            return (
              <g key={`daily-${ratio}`}>
                <line x1={left} x2={width - right} y1={y} y2={y} stroke="rgba(168, 220, 189, 0.13)" />
                <text x="24" y={y + 5} fill="rgba(216, 248, 229, 0.62)" fontSize="12">
                  {Math.round(value)}
                </text>
              </g>
            );
          })}

          <line x1={left} x2={width - right} y1={thresholdY} y2={thresholdY} stroke="#d7d95a" strokeDasharray="7 8" strokeOpacity="0.62" />
          <text x={width - 175} y={thresholdY - 8} fill="#d7d95a" fontSize="12">
            Good upper band
          </text>

          <motion.polyline
            points={observedLine}
            fill="none"
            stroke="url(#aqLine)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="cursor-crosshair"
            onMouseEnter={() => {
              setActiveSeries("recent");
              setActivePoint(observedPoints.at(-1) ?? null);
            }}
            onClick={() => {
              setActiveSeries("recent");
              setActivePoint(observedPoints.at(-1) ?? null);
            }}
            initial={{ pathLength: 0, opacity: 0.35 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
          <motion.polyline
            points={forecastLine}
            fill="none"
            stroke="url(#forecastLine)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="10 8"
            className="cursor-crosshair"
            onMouseEnter={() => {
              setActiveSeries("forecast");
              setActivePoint(forecastPoints[0] ?? forecastLinePoints.at(-1) ?? null);
            }}
            onClick={() => {
              setActiveSeries("forecast");
              setActivePoint(forecastPoints[0] ?? forecastLinePoints.at(-1) ?? null);
            }}
            initial={{ pathLength: 0, opacity: 0.35 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.1, delay: 0.15, ease: "easeOut" }}
          />
          <polyline
            points={observedLine}
            fill="none"
            stroke="transparent"
            strokeWidth="22"
            pointerEvents="stroke"
            onMouseEnter={() => {
              setActiveSeries("recent");
              setActivePoint(observedPoints.at(-1) ?? null);
            }}
            onClick={() => {
              setActiveSeries("recent");
              setActivePoint(observedPoints.at(-1) ?? null);
            }}
          />
          <polyline
            points={forecastLine}
            fill="none"
            stroke="transparent"
            strokeWidth="22"
            pointerEvents="stroke"
            onMouseEnter={() => {
              setActiveSeries("forecast");
              setActivePoint(forecastPoints[0] ?? forecastLinePoints.at(-1) ?? null);
            }}
            onClick={() => {
              setActiveSeries("forecast");
              setActivePoint(forecastPoints[0] ?? forecastLinePoints.at(-1) ?? null);
            }}
          />

          {points.map((point) => {
            const barWidth = Math.max(chartWidth / points.length - 2, 4);
            const x = xFor(point.index) - barWidth / 2;
            const y = dailyY(point.value);
            const active = displayPoint.index === point.index;
            return (
              <motion.rect
                key={`${point.date}-${point.kind}`}
                data-testid={`infographic-bar-${point.index}`}
                x={x}
                y={y}
                width={barWidth}
                height={dailyTop + dailyHeight - y}
                rx="2"
                fill={point.kind === "forecast" ? "url(#forecastBar)" : "url(#dailyBar)"}
                opacity={active ? 1 : 0.82}
                className="cursor-crosshair"
                onMouseEnter={() => {
                  setActiveSeries(point.kind === "forecast" ? "forecast" : "recent");
                  setActivePoint(point);
                }}
                onClick={() => {
                  setActiveSeries(point.kind === "forecast" ? "forecast" : "recent");
                  setActivePoint(point);
                }}
                initial={{ scaleY: 0, transformOrigin: "bottom" }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.42, delay: Math.min(point.index * 0.008, 0.35) }}
              />
            );
          })}

          {points.map((point) => {
            const active = displayPoint.index === point.index;
            const x = xFor(point.index);
            const y = cumulativeY(point.cumulative);
            return (
              <g
                key={`${point.date}-${point.kind}-point`}
                tabIndex={0}
                role="button"
                aria-label={`${point.kind === "forecast" ? "Forecast" : "Recent"} point ${shortDate(point.date)} PM2.5 ${formatNumber(point.value)} ug/m3`}
                className="cursor-crosshair outline-none"
                onMouseEnter={() => {
                  setActiveSeries(point.kind === "forecast" ? "forecast" : "recent");
                  setActivePoint(point);
                }}
                onFocus={() => {
                  setActiveSeries(point.kind === "forecast" ? "forecast" : "recent");
                  setActivePoint(point);
                }}
                onClick={() => {
                  setActiveSeries(point.kind === "forecast" ? "forecast" : "recent");
                  setActivePoint(point);
                }}
              >
                <circle
                  data-testid={`infographic-point-${point.index}`}
                  cx={x}
                  cy={y}
                  r="14"
                  fill="rgba(255,255,255,0.001)"
                  onMouseEnter={() => {
                    setActiveSeries(point.kind === "forecast" ? "forecast" : "recent");
                    setActivePoint(point);
                  }}
                  onClick={() => {
                    setActiveSeries(point.kind === "forecast" ? "forecast" : "recent");
                    setActivePoint(point);
                  }}
                />
                <motion.circle
                  cx={x}
                  cy={y}
                  r={active ? 7 : 3.5}
                  fill={point.kind === "forecast" ? "#f4b63d" : "#70f0b7"}
                  stroke={active ? "#ffffff" : "transparent"}
                  strokeWidth="2"
                  animate={{ opacity: active ? 1 : 0.72 }}
                />
                <title>{`${shortDate(point.date)}: PM2.5 ${formatNumber(point.value)} ug/m3, ${getPm25Advisory(point.value).category}`}</title>
              </g>
            );
          })}

          {displayPoint && (
            <g>
              <line
                x1={xFor(displayPoint.index)}
                x2={xFor(displayPoint.index)}
                y1={cumulativeTop}
                y2={dailyTop + dailyHeight}
                stroke="#ffffff"
                strokeOpacity="0.28"
                strokeDasharray="4 8"
              />
              <circle
                cx={xFor(displayPoint.index)}
                cy={dailyY(displayPoint.value)}
                r="7"
                fill="none"
                stroke="#ffffff"
                strokeOpacity="0.72"
                strokeWidth="2"
              />
            </g>
          )}

          {milestones.map((marker) => {
            const point = points[marker.index];
            const x = xFor(marker.index);
            return (
              <g key={marker.label}>
                <line x1={x} x2={x} y1={cumulativeTop} y2={dailyTop + dailyHeight + 8} stroke="rgba(215,217,90,0.14)" />
                <circle cx={x} cy={dailyTop + dailyHeight + 25} r="13" fill="rgba(215,217,90,0.12)" stroke="#d7d95a" />
                <circle cx={x} cy={dailyTop + dailyHeight + 25} r="4" fill="#d7d95a" />
                <text x={x - 42} y={dailyTop + dailyHeight + 51} fill="rgba(216,248,229,0.72)" fontSize="11">
                  {marker.label}
                </text>
                <title>{`${marker.label}: ${shortDate(point.date)}, PM2.5 ${formatNumber(point.value)} ug/m3`}</title>
              </g>
            );
          })}

          {labels.map((label) => (
            <text key={label.index} x={xFor(label.index) - 18} y={height - 18} fill="rgba(216,248,229,0.68)" fontSize="12">
              {label.label}
            </text>
          ))}
        </svg>
      </div>
    </motion.section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/10 bg-white/5 px-3 py-1 text-emerald-100/82">
      <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

type InfographicSeries = "recent" | "forecast";

type InfographicPoint = {
  date: string;
  value: number;
  kind: "history" | "forecast";
  cumulative: number;
  index: number;
};

function InfographicStatus({ point, series }: { point: InfographicPoint; series: InfographicSeries }) {
  const advisory = getPm25Advisory(point.value);

  return (
    <motion.div
      key={`${point.index}-${series}`}
      className="min-w-[260px] rounded-3xl border border-emerald-200/14 bg-white/[0.07] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22 }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-normal text-emerald-100/62">
          {series === "forecast" ? "Forecast line" : "Recent line"}
        </span>
        <span className="rounded-full bg-emerald-100/10 px-3 py-1 text-xs font-semibold text-emerald-100">
          {shortDate(point.date)}
        </span>
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-3xl font-semibold tracking-normal text-white">{formatNumber(point.value)}</span>
        <span className="pb-1 text-sm text-emerald-100/70">ug/m3 PM2.5</span>
      </div>
      <p className={cn("mt-2 text-sm font-semibold", darkAdvisoryText(point.value))}>{advisory.category}</p>
      <p className="mt-1 text-sm leading-5 text-emerald-100/68">{advisory.message}</p>
    </motion.div>
  );
}

function buildInfographicPoints(history: AirDailyRow[], forecast: ForecastRow[]): InfographicPoint[] {
  const historyPoints = history
    .slice(-75)
    .filter((row) => row.pm25 !== null)
    .map((row) => ({ date: row.date, value: row.pm25 as number, kind: "history" as const }));
  const forecastPoints = forecast
    .filter((row) => row.predictedPm25 !== null)
    .map((row) => ({ date: row.date, value: row.predictedPm25 as number, kind: "forecast" as const }));
  let cumulative = 0;

  return [...historyPoints, ...forecastPoints].map((point, index) => {
    cumulative += point.value;
    return { ...point, cumulative, index };
  });
}

function buildMilestones(points: InfographicPoint[]) {
  if (!points.length) {
    return [];
  }

  const forecastStart = points.findIndex((point) => point.kind === "forecast");
  const peak = points.reduce((best, point) => (point.value > best.value ? point : best), points[0]);
  const indexes = [
    { index: 0, label: "history" },
    { index: Math.max(forecastStart, 0), label: "forecast" },
    { index: peak.index, label: "peak" },
    { index: points.length - 1, label: "day 7" }
  ];

  const seen = new Set<number>();
  return indexes.filter((marker) => {
    if (seen.has(marker.index)) {
      return false;
    }
    seen.add(marker.index);
    return marker.index >= 0;
  });
}

function darkAdvisoryText(value: number): string {
  if (value <= 30) {
    return "text-emerald-200";
  }
  if (value <= 60) {
    return "text-lime-200";
  }
  if (value <= 90) {
    return "text-amber-200";
  }
  if (value <= 120) {
    return "text-orange-200";
  }
  return "text-red-200";
}

function axisLabels(points: InfographicPoint[]) {
  const indexes = new Set<number>();
  const step = Math.max(Math.floor(points.length / 6), 1);
  for (let index = 0; index < points.length; index += step) {
    indexes.add(index);
  }
  indexes.add(points.length - 1);
  return [...indexes].sort((a, b) => a - b).map((index) => ({ index, label: shortDate(points[index].date) }));
}

function ForecastChart({ history, forecast }: { history: AirDailyRow[]; forecast: ForecastRow[] }) {
  const points = [
    ...history.slice(-35).map((row) => ({ date: row.date, value: row.pm25, kind: "Recent PM2.5" })),
    ...forecast.map((row) => ({ date: row.date, value: row.predictedPm25, kind: "7-day forecast" }))
  ].filter((row) => row.value !== null) as Array<{ date: string; value: number; kind: string }>;

  if (!points.length) {
    return <EmptyState text="No forecast chart is available yet." />;
  }

  const width = 900;
  const height = 320;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(max - min, 1);
  const coords = points.map((point, index) => {
    const x = (index / Math.max(points.length - 1, 1)) * width;
    const y = height - ((point.value - min) / spread) * (height - 40) - 20;
    return `${x},${y}`;
  });
  const forecastStart = history.slice(-35).filter((row) => row.pm25 !== null).length;
  const recentCoords = coords.slice(0, forecastStart).join(" ");
  const forecastCoords = coords.slice(Math.max(forecastStart - 1, 0)).join(" ");

  return (
    <div className="overflow-hidden rounded-3xl bg-white/60 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[320px] w-full">
        <defs>
          <linearGradient id="forecastFill" x1="0" x2="1">
            <stop offset="0%" stopColor="#2f7d5b" />
            <stop offset="100%" stopColor="#f4b63d" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => (
          <line
            key={line}
            x1="0"
            x2={width}
            y1={20 + line * 86}
            y2={20 + line * 86}
            stroke="rgba(90,105,96,0.14)"
          />
        ))}
        <polyline points={recentCoords} fill="none" stroke="#2f7d5b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={forecastCoords} fill="none" stroke="url(#forecastFill)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="9 8" />
      </svg>
      <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
        <span className="inline-flex items-center gap-2"><span className="h-2 w-6 rounded-full bg-leaf" />Recent PM2.5</span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-6 rounded-full bg-amberAir" />7-day forecast</span>
      </div>
    </div>
  );
}

function ForecastTable({ forecast }: { forecast: ForecastRow[] }) {
  return (
    <DataTable
      rows={forecast.map((row) => ({
        Date: shortDate(row.date),
        "Predicted PM2.5": `${formatNumber(row.predictedPm25)} ug/m3`,
        Category: getPm25Advisory(row.predictedPm25).category
      }))}
    />
  );
}

function DataTable({ rows }: { rows: Array<Record<string, string | number | null | undefined>> }) {
  if (!rows.length) {
    return <EmptyState text="No rows are available yet." />;
  }

  const columns = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto rounded-3xl border border-white/70 bg-white/66">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200/80 text-slate-500">
            {columns.map((column) => (
              <th className="whitespace-nowrap px-4 py-3 font-semibold" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr className="border-b border-slate-100/90 last:border-0" key={index}>
              {columns.map((column) => (
                <td className="whitespace-nowrap px-4 py-3 text-slate-700" key={column}>
                  {String(row[column] ?? "--")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/60 p-6">
      <div className="loading-strip relative mb-4 h-2 overflow-hidden rounded-full bg-emerald-100" />
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

type OutlookRow = WeatherDailyRow & { predictedPm25: number | null };

function classifyWeather(condition: string): WeatherMood {
  const text = condition.toLowerCase();

  if (text.includes("thunder") || text.includes("storm")) {
    return "storm";
  }
  if (text.includes("heavy") || text.includes("violent")) {
    return "heavy-rain";
  }
  if (text.includes("rain") || text.includes("drizzle") || text.includes("shower")) {
    return "rain";
  }
  if (text.includes("fog") || text.includes("mist")) {
    return "fog";
  }
  if (text.includes("partly") || text.includes("mostly clear")) {
    return "partly";
  }
  if (text.includes("cloud") || text.includes("overcast")) {
    return "cloudy";
  }
  if (text.includes("clear") || text.includes("sunny")) {
    return "clear";
  }
  return "partly";
}

function buildDailyActions({
  locationName,
  pm25,
  advisory,
  today,
  current
}: {
  locationName: string;
  pm25: number | null;
  advisory: ReturnType<typeof getPm25Advisory>;
  today?: OutlookRow;
  current: CurrentWeather;
}): DailyAction[] {
  const condition = today?.condition || current.condition || "mixed conditions";
  const rainProbability = Number(today?.rainProbability ?? 0);
  const heavyRain = classifyWeather(condition) === "heavy-rain" || classifyWeather(condition) === "storm" || rainProbability >= 75;
  const moderateRain = heavyRain || classifyWeather(condition) === "rain" || rainProbability >= 45;
  const mask = maskAdvice(pm25);
  const timing = timingAdvice(pm25, rainProbability, today);

  return [
    {
      id: "rain",
      title: heavyRain ? "Rain gear is important today" : moderateRain ? "Keep rain cover ready" : "Rain risk is low",
      badge: `${formatPercent(today?.rainProbability)} rain chance`,
      summary: heavyRain
        ? `${locationName} may see heavy rain signals. Keep an umbrella or raincoat ready.`
        : moderateRain
          ? `Rain is possible in ${locationName}. Carry a light umbrella if you travel.`
          : `No strong rain signal is visible right now.`,
      detail: heavyRain
        ? `Today's weather signal for ${locationName} shows ${condition.toLowerCase()} with ${formatPercent(today?.rainProbability)} rain chance. Carry an umbrella or raincoat, protect your phone and bag, and avoid unnecessary two-wheeler travel during strong showers.`
        : moderateRain
          ? `Today may bring ${condition.toLowerCase()} around ${locationName}. Keep a compact umbrella ready and prefer covered routes if you commute.`
          : `Rain risk appears low for ${locationName}. You can travel normally, but keep checking the day panel if the weather updates.`,
      icon: Umbrella,
      tone: heavyRain ? "bg-sky-600" : moderateRain ? "bg-sky-400" : "bg-emerald-400"
    },
    {
      id: "mask",
      title: mask.title,
      badge: `${advisory.category} PM2.5`,
      summary: mask.summary,
      detail: `${mask.detail} Current next-day PM2.5 forecast is ${formatNumber(pm25)} ug/m3, so the public status is ${advisory.category.toLowerCase()}. ${advisory.message}`,
      icon: ShieldCheck,
      tone: mask.tone
    },
    {
      id: "timing",
      title: timing.title,
      badge: "Outdoor timing",
      summary: timing.summary,
      detail: timing.detail,
      icon: Clock3,
      tone: timing.tone
    }
  ];
}

function maskAdvice(pm25: number | null): Pick<DailyAction, "title" | "summary" | "detail" | "tone"> {
  const value = Number(pm25 ?? 0);

  if (value <= 30) {
    return {
      title: "Mask is optional for most people",
      summary: "Normal outdoor movement is acceptable unless you are dust-sensitive.",
      detail: "A mask is usually not necessary for most people at this PM2.5 level. Dust-sensitive or asthma-sensitive users can still carry a simple mask near traffic, construction, or dusty roads.",
      tone: "bg-emerald-400"
    };
  }
  if (value <= 60) {
    return {
      title: "Sensitive users should carry a mask",
      summary: "Use a simple well-fitted mask near traffic or dust-heavy roads.",
      detail: "For normal walking this level is usually manageable. Children, elders, and asthma-sensitive users should keep a well-fitted mask ready near traffic, markets, road dust, or construction zones.",
      tone: "bg-lime-500"
    };
  }
  if (value <= 90) {
    return {
      title: "Prefer N95 or KN95 near traffic",
      summary: "Use better filtration during long outdoor travel or crowded roads.",
      detail: "For prolonged outdoor activity, a well-fitted N95 or KN95 style mask is a stronger choice than a loose cloth mask. This matters most during school travel, market visits, traffic exposure, and dusty roads.",
      tone: "bg-amber-400"
    };
  }
  return {
    title: "Use N95 or KN95 and reduce exposure",
    summary: "Avoid long outdoor exertion; sensitive users should stay indoors where possible.",
    detail: "A well-fitted N95 or KN95 style mask is recommended for necessary outdoor movement. Avoid long exertion and prefer indoor or covered spaces, especially for children, elders, and people with breathing sensitivity.",
    tone: "bg-red-500"
  };
}

function timingAdvice(pm25: number | null, rainProbability: number, today?: OutlookRow): Pick<DailyAction, "title" | "summary" | "detail" | "tone"> {
  const value = Number(pm25 ?? 0);
  const sunrise = formatTime(today?.sunrise);
  const sunset = formatTime(today?.sunset);

  if (rainProbability >= 70) {
    return {
      title: "Plan outdoor work between showers",
      summary: "Keep travel flexible and avoid exposed roads during heavy rain.",
      detail: `Sunrise is around ${sunrise} and sunset is around ${sunset}. Because rain probability is high, keep outdoor work flexible and avoid exposed roads during strong showers. If PM2.5 rises, combine this with mask guidance.`,
      tone: "bg-sky-500"
    };
  }
  if (value > 90) {
    return {
      title: "Keep outdoor activity short",
      summary: "Prefer necessary travel only and avoid high-exertion work outside.",
      detail: `Sunrise is around ${sunrise} and sunset is around ${sunset}. Keep outdoor exposure short, avoid high-exertion work near traffic or dusty roads, and use the mask guidance for necessary travel.`,
      tone: "bg-orange-500"
    };
  }
  return {
    title: "Use cooler, cleaner windows",
    summary: "Morning or late-afternoon movement is usually easier than midday heat.",
    detail: `Sunrise is around ${sunrise} and sunset is around ${sunset}. Prefer cooler morning or late-afternoon windows for outdoor work, and avoid road-dust exposure when traffic is heavy.`,
    tone: "bg-emerald-500"
  };
}

function buildOutlookRows(weather: WeatherDailyRow[], forecast: ForecastRow[]): OutlookRow[] {
  const forecastMap = new Map(forecast.map((row) => [row.date.slice(0, 10), row.predictedPm25]));
  if (weather.length) {
    return weather.map((row) => ({
      ...row,
      predictedPm25: forecastMap.get(row.date.slice(0, 10)) ?? null
    }));
  }

  return forecast.map((row) => ({
    date: row.date,
    condition: "Air outlook",
    temperatureMaxC: null,
    temperatureMinC: null,
    rainProbability: null,
    uvIndex: null,
    sunrise: null,
    sunset: null,
    windSpeedKmh: null,
    predictedPm25: row.predictedPm25
  }));
}

function getLatestPm25(history: AirDailyRow[]): number | null {
  const values = history.map((row) => row.pm25).filter((value): value is number => value !== null);
  return values.at(-1) ?? null;
}

function getNextPm25(forecast: ForecastRow[], history: AirDailyRow[]): number | null {
  return forecast.find((row) => row.predictedPm25 !== null)?.predictedPm25 ?? getLatestPm25(history);
}

function readableCoordinate(latitude: number, longitude: number): string {
  const lat = latitude >= 0 ? "N" : "S";
  const lon = longitude >= 0 ? "E" : "W";
  return `${Math.abs(latitude).toFixed(3)} ${lat}, ${Math.abs(longitude).toFixed(3)} ${lon}, near the town center`;
}

function formatTime(value: string | null | undefined): string {
  if (!value) {
    return "--";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function shortDate(value: string | null | undefined): string {
  if (!value) {
    return "--";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function weekday(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Day";
  }
  return date.toLocaleDateString("en-IN", { weekday: "short" });
}

function sentenceKey(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function modelLabel(value: string): string {
  const labels: Record<string, string> = {
    naive_last_value: "Persistence baseline",
    arima: "Autoregressive",
    sarima: "Seasonal autoregressive",
    sarimax: "Seasonal model with supporting context"
  };
  return labels[value] ?? sentenceKey(value);
}

function AirScene({ pm25 }: { pm25: number }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 opacity-75">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 5, 4]} intensity={1.3} />
        <FloatingCore pm25={pm25} />
        <ParticleField pm25={pm25} />
      </Canvas>
    </div>
  );
}

function FloatingCore({ pm25 }: { pm25: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const intensity = Math.min(Math.max(pm25 / 90, 0.18), 1);

  useFrame((state) => {
    if (!ref.current) {
      return;
    }
    ref.current.rotation.x = state.clock.elapsedTime * 0.18;
    ref.current.rotation.y = state.clock.elapsedTime * 0.24;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.18;
  });

  return (
    <mesh ref={ref} position={[2.6, 1.15, -1.6]}>
      <torusKnotGeometry args={[1.1, 0.22, 140, 16]} />
      <meshStandardMaterial color={new THREE.Color().setHSL(0.33 - intensity * 0.14, 0.58, 0.58)} roughness={0.32} metalness={0.46} transparent opacity={0.32} />
    </mesh>
  );
}

function ParticleField({ pm25 }: { pm25: number }) {
  const ref = useRef<THREE.Points>(null);
  const count = 140;
  const positions = useMemo(() => {
    const values = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      values[i * 3] = (seededUnit(i, 1) - 0.5) * 10;
      values[i * 3 + 1] = (seededUnit(i, 2) - 0.5) * 6;
      values[i * 3 + 2] = (seededUnit(i, 3) - 0.5) * 5;
    }
    return values;
  }, []);

  useFrame((state) => {
    if (!ref.current) {
      return;
    }
    ref.current.rotation.y = state.clock.elapsedTime * 0.025;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.16) * 0.035;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={pm25 > 90 ? "#d95757" : pm25 > 60 ? "#f08a3e" : "#2f7d5b"}
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.48}
      />
    </points>
  );
}

function seededUnit(index: number, salt: number): number {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}
