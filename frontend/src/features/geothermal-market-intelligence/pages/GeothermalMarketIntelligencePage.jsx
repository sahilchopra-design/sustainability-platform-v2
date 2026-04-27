import React, { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine } from "recharts";
import { IRENA_RENEWABLE_CAPACITY_2023 } from '../../../data/publicDataSeed';

const T = {
  bg: "#0f1117", surface: "#1a1d27", surfaceH: "#22263a", border: "#2a2f45",
  navy: "#1e3a5f", navyL: "#2a4a6f", gold: "#d4a843",
  sage: "#2d6a4f", teal: "#0d4f5c", text: "#e8e0d0",
  textSec: "#a89880", textMut: "#6b6050", red: "#c0392b", green: "#27ae60",
  amber: "#e67e22", font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace",
};

const sr = s => { const x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const COUNTRIES = [
  { country: "USA",         installed: 3706, pipeline: 650,  resource: 39000, heatFlow: 110, risk: "Low",    sector: "Utility", ipo: 4, key: "The Geysers, Salton Sea, Steamboat Springs" },
  { country: "Indonesia",   installed: 2356, pipeline: 1800, resource: 29000, heatFlow: 140, risk: "Moderate", sector: "Utility", ipo: 2, key: "Sarulla, Wayang Windu, Kamojang, Lahendong" },
  { country: "Philippines", installed: 1918, pipeline: 400,  resource: 6000,  heatFlow: 130, risk: "Moderate", sector: "Utility", ipo: 3, key: "Makban, Tiwi, Leyte, BacMan" },
  { country: "Turkey",      installed: 1682, pipeline: 1200, resource: 4500,  heatFlow: 95,  risk: "Low",    sector: "Mixed",   ipo: 1, key: "Kızıldere, Efeler, Gurmat, Alasehir" },
  { country: "Kenya",       installed: 990,  pipeline: 2000, resource: 10000, heatFlow: 150, risk: "Moderate", sector: "Utility", ipo: 2, key: "Olkaria I-V, Menengai, Bogoria" },
  { country: "New Zealand", installed: 1050, pipeline: 300,  resource: 3650,  heatFlow: 125, risk: "Low",    sector: "Utility", ipo: 2, key: "Wairakei, Rotokawa, Ngatamariki, Te Mihi" },
  { country: "Mexico",      installed: 963,  pipeline: 200,  resource: 3000,  heatFlow: 100, risk: "Low",    sector: "State",   ipo: 0, key: "Cerro Prieto, Los Azufres, Los Humeros" },
  { country: "Italy",       installed: 821,  pipeline: 150,  resource: 3000,  heatFlow: 90,  risk: "Low",    sector: "Utility", ipo: 1, key: "Larderello, Travale, Monte Amiata" },
  { country: "Iceland",     installed: 754,  pipeline: 200,  resource: 5800,  heatFlow: 180, risk: "Very Low", sector: "State", ipo: 0, key: "Hellisheidi, Nesjavellir, Svartsengi, Krafla" },
  { country: "Japan",       installed: 620,  pipeline: 500,  resource: 23000, heatFlow: 85,  risk: "Low",    sector: "Mixed",   ipo: 1, key: "Hatchobaru, Takigami, Ogiri, Waita" },
  { country: "Ethiopia",    installed: 9,    pipeline: 1000, resource: 10000, heatFlow: 120, risk: "Moderate-High", sector: "Dev", ipo: 0, key: "Aluto-Langano, Corbetti, Tulu Moye" },
  { country: "Germany",     installed: 42,   pipeline: 300,  resource: 1500,  heatFlow: 65,  risk: "Low",    sector: "Mixed",   ipo: 0, key: "Dürrnhaar, Sauerlach, Unterhaching" },
  { country: "Chile",       installed: 0,    pipeline: 500,  resource: 3000,  heatFlow: 120, risk: "Moderate", sector: "Dev",   ipo: 0, key: "El Tatio, Cerro Pabellón" },
  { country: "Australia",   installed: 1,    pipeline: 300,  resource: 25000, heatFlow: 80,  risk: "Low",    sector: "Dev",     ipo: 0, key: "Cooper Basin, Granite (EGS)" },
  { country: "UK",          installed: 1,    pipeline: 200,  resource: 2000,  heatFlow: 45,  risk: "Low",    sector: "Dev",     ipo: 0, key: "Cornwall Geothermal, Eden Project" },
  { country: "Tanzania",    installed: 0,    pipeline: 600,  resource: 5000,  heatFlow: 130, risk: "Moderate", sector: "Dev",   ipo: 0, key: "Lake Ngozi, Kiejo-Mbaka" },
];

const DEVELOPERS = [
  { company: "Ormat Technologies",   country: "USA",         mw: 1400, listed: true,  market: "NYSE: ORA",  focus: "Binary ORC globally" },
  { company: "Contact Energy",        country: "NZ",          mw: 450,  listed: true,  market: "NZX: CEN",  focus: "NZ utility + generation" },
  { company: "KenGen",               country: "Kenya",       mw: 860,  listed: true,  market: "NSE: KEGN",  focus: "East Africa rift" },
  { company: "Pertamina Geothermal", country: "Indonesia",   mw: 850,  listed: true,  market: "IDX: PGEO",  focus: "Indonesia (state-backed)" },
  { company: "Enel Green Power",     country: "Italy",       mw: 900,  listed: true,  market: "MTA: ENEL",  focus: "Italy + Central America" },
  { company: "Mercury NZ",           country: "NZ",          mw: 350,  listed: true,  market: "NZX: MCY",   focus: "Waikato geothermal" },
  { company: "Mighty River Power",   country: "NZ",          mw: 320,  listed: false, market: "Private",    focus: "NZ Wairakei + Rotokawa" },
  { company: "Fervo Energy",         country: "USA",         mw: 400,  listed: false, market: "Private / PE", focus: "EGS technology (Fervo Cape)" },
  { company: "Eavor Technologies",   country: "Canada",      mw: 120,  listed: false, market: "BP + Chevron", focus: "Closed-loop AGS" },
  { company: "CFE (Mexico)",         country: "Mexico",      mw: 963,  listed: false, market: "State entity", focus: "Cerro Prieto + Los Azufres" },
];

const CAPACITY_HISTORY = [
  { year: 2000, installed: 7970,  heat: 20000 },
  { year: 2005, installed: 8900,  heat: 28000 },
  { year: 2010, installed: 10958, heat: 50583 },
  { year: 2015, installed: 12928, heat: 70329 },
  { year: 2020, installed: 15406, heat: 90000 },
  { year: 2023, installed: 15900, heat: 107000 },
  { year: 2025, installed: 17200, heat: 118000 },
  { year: 2030, installed: 22000, heat: 145000 },
  { year: 2035, installed: 30000, heat: 180000 },
  { year: 2040, installed: 45000, heat: 220000 },
  { year: 2050, installed: 80000, heat: 300000 },
];

const INVESTMENT_FLOWS = [
  { region: "East Africa",      investment: 4.2, pipeline: 3600, growth: 22 },
  { region: "Southeast Asia",   investment: 6.8, pipeline: 4200, growth: 18 },
  { region: "North America",    investment: 3.5, pipeline: 1800, growth: 12 },
  { region: "Europe",           investment: 2.1, pipeline: 1200, growth: 15 },
  { region: "Latin America",    investment: 1.8, pipeline: 900,  growth: 25 },
  { region: "Pacific",          investment: 0.9, pipeline: 400,  growth: 8 },
];

// ── Wire real IRENA geothermal capacity data (GAP-011) ────────────────────
const IRENA_GEOTHERMAL = (IRENA_RENEWABLE_CAPACITY_2023||[]).filter(c=>c.geothermal_gw>0).map(c=>({
  country: c.country, iso3: c.iso3, installed_gw: c.geothermal_gw,
  total_renewables_gw: c.total_renewables_gw, share_of_total: +(c.geothermal_gw/Math.max(0.01,c.total_renewables_gw)*100).toFixed(1)
}));

const TABS = [
  "Global Overview", "Country Rankings", "Developer Landscape", "Capacity History",
  "Pipeline Analysis", "Investment Flows", "Technology Mix", "Policy Landscape",
  "Risk Assessment", "Outlook 2050"
];

const KpiCard = ({ label, value, unit, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "14px 18px" }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.gold, fontFamily: T.mono, marginTop: 4 }}>{value}<span style={{ fontSize: 13, marginLeft: 4, color: T.textSec }}>{unit}</span></div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function GeothermalMarketIntelligencePage() {
  const [tab, setTab] = useState(0);
  const [sortBy, setSortBy] = useState("installed");
  const [filterRegion, setFilterRegion] = useState("All");
  const [carbonScenario, setCarbonScenario] = useState("Base");

  const totalInstalled = COUNTRIES.reduce((s, c) => s + c.installed, 0);
  const totalPipeline  = COUNTRIES.reduce((s, c) => s + c.pipeline,  0);
  const top3 = [...COUNTRIES].sort((a, b) => b.installed - a.installed).slice(0, 3);

  const sortedCountries = useMemo(() => {
    const arr = [...COUNTRIES];
    if (sortBy === "installed") return arr.sort((a, b) => b.installed - a.installed);
    if (sortBy === "pipeline")  return arr.sort((a, b) => b.pipeline - a.pipeline);
    if (sortBy === "resource")  return arr.sort((a, b) => b.resource - a.resource);
    return arr;
  }, [sortBy]);

  const techMixData = [
    { tech: "Single Flash", pct: 42, mw: +(totalInstalled * 0.42 / 1000).toFixed(1), color: T.gold },
    { tech: "Double Flash", pct: 21, mw: +(totalInstalled * 0.21 / 1000).toFixed(1), color: T.amber },
    { tech: "Dry Steam",    pct: 18, mw: +(totalInstalled * 0.18 / 1000).toFixed(1), color: T.teal },
    { tech: "Binary (ORC)", pct: 14, mw: +(totalInstalled * 0.14 / 1000).toFixed(1), color: T.green },
    { tech: "Flash+Binary", pct: 4,  mw: +(totalInstalled * 0.04 / 1000).toFixed(1), color: T.sage },
    { tech: "EGS/Other",    pct: 1,  mw: +(totalInstalled * 0.01 / 1000).toFixed(1), color: T.red },
  ];

  const outlookData = useMemo(() => {
    const mult = carbonScenario === "High" ? 1.4 : carbonScenario === "Low" ? 0.7 : 1.0;
    return CAPACITY_HISTORY.map(d => ({
      ...d,
      scenarioInstalled: d.year <= 2023 ? d.installed : +(d.installed * mult).toFixed(0),
    }));
  }, [carbonScenario]);

  const styles = {
    page: { background: T.bg, minHeight: "100vh", fontFamily: T.font, color: T.text, padding: 24 },
    header: { borderBottom: `2px solid ${T.gold}`, paddingBottom: 16, marginBottom: 24 },
    tabs: { display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 24 },
    tab: (a) => ({ padding: "8px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: T.mono,
      background: a ? T.gold : T.surface, color: a ? "#000" : T.textSec, border: `1px solid ${a ? T.gold : T.border}` }),
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
    grid4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 },
    grid3: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 },
    panel: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 },
    h3: { fontSize: 13, fontFamily: T.mono, color: T.gold, marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.mono, letterSpacing: 2, marginBottom: 6 }}>EP-DV6 · GEOTHERMAL ENERGY FINANCE</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Global Geothermal Market Intelligence Platform</h1>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 6 }}>16 Country Atlas · Developer Landscape · Capacity History · Pipeline Analysis · Investment Flows · Outlook 2050</div>
      </div>

      <div style={styles.tabs}>
        {TABS.map((t, i) => <button key={t} style={styles.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div>
          <div style={styles.grid4}>
            <KpiCard label="Global Installed" value={(totalInstalled / 1000).toFixed(1)} unit="GW" sub="Electricity capacity, 2024E" />
            <KpiCard label="Development Pipeline" value={(totalPipeline / 1000).toFixed(1)} unit="GW" sub="Projects in development" color={T.green} />
            <KpiCard label="Countries Active" value={COUNTRIES.filter(c => c.installed > 0).length} unit="" sub="Producing geothermal electricity" color={T.amber} />
            <KpiCard label="Growth Rate" value="3.2%" unit="/yr" sub="2020–2025 CAGR" color={T.teal} />
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Top 10 Countries by Installed Capacity (MW)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[...COUNTRIES].sort((a, b) => b.installed - a.installed).slice(0, 10)} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="country" tick={{ fontSize: 10, fill: T.textSec }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit=" MW" />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Legend />
                <Bar dataKey="installed" name="Installed (MW)" fill={T.gold} />
                <Bar dataKey="pipeline" name="Pipeline (MW)" fill={T.teal} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={styles.grid3}>
            {top3.map((c, i) => (
              <div key={c.country} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>#{i + 1} INSTALLED CAPACITY</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.gold, marginTop: 4 }}>{c.country}</div>
                <div style={{ fontSize: 24, fontFamily: T.mono, color: T.text, marginTop: 4 }}>{c.installed.toLocaleString()} <span style={{ fontSize: 13, color: T.textSec }}>MW</span></div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 6 }}>{c.key}</div>
                <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11 }}>
                  <span style={{ color: T.green }}>Pipeline: {c.pipeline.toLocaleString()} MW</span>
                  <span style={{ color: T.amber }}>Heat Flow: {c.heatFlow} mW/m²</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Country Rankings — Geothermal Market Intelligence</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["installed", "pipeline", "resource"].map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                style={styles.tab(sortBy === s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                  {["Country", "Installed (MW)", "Pipeline (MW)", "Resource (MW)", "Heat Flow", "Risk", "Sector", "Listed Cos.", "Key Projects"].map(h => (
                    <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: T.gold, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedCountries.map((c, i) => (
                  <tr key={c.country} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : "transparent" }}>
                    <td style={{ padding: "7px 10px", color: T.text, fontWeight: 600 }}>{c.country}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono, color: T.gold }}>{c.installed.toLocaleString()}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono, color: T.teal }}>{c.pipeline.toLocaleString()}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono }}>{c.resource.toLocaleString()}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono, color: c.heatFlow > 130 ? T.red : c.heatFlow > 100 ? T.amber : T.text }}>{c.heatFlow}</td>
                    <td style={{ padding: "7px 10px", color: c.risk === "Very Low" || c.risk === "Low" ? T.green : c.risk.includes("High") ? T.red : T.amber }}>{c.risk}</td>
                    <td style={{ padding: "7px 10px", color: T.textSec }}>{c.sector}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono }}>{c.ipo}</td>
                    <td style={{ padding: "7px 10px", color: T.textSec, fontSize: 10 }}>{c.key.split(",")[0]}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Global Geothermal Developer & Operator Landscape</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                  {["Company", "Country", "Managed MW", "Listed", "Market / Investors", "Focus"].map(h => (
                    <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: T.gold, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...DEVELOPERS].sort((a, b) => b.mw - a.mw).map((d, i) => (
                  <tr key={d.company} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : "transparent" }}>
                    <td style={{ padding: "7px 10px", color: T.text, fontWeight: 600 }}>{d.company}</td>
                    <td style={{ padding: "7px 10px", color: T.textSec }}>{d.country}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono, color: T.gold }}>{d.mw.toLocaleString()}</td>
                    <td style={{ padding: "7px 10px" }}><span style={{ background: d.listed ? T.sage : T.surfaceH, color: T.text, borderRadius: 4, padding: "2px 6px", fontSize: 10 }}>{d.listed ? "Listed" : "Private"}</span></td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono, fontSize: 11, color: T.teal }}>{d.market}</td>
                    <td style={{ padding: "7px 10px", color: T.textSec, fontSize: 11 }}>{d.focus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Global Geothermal Capacity History & Forecast</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["Base", "High", "Low"].map(s => (
              <button key={s} onClick={() => setCarbonScenario(s)} style={styles.tab(carbonScenario === s)}>{s} Scenario</button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={outlookData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Elec. (MW)", angle: -90, position: "insideLeft", fill: T.textSec, fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Heat (MWth)", angle: 90, position: "insideRight", fill: T.textSec, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} formatter={v => [v.toLocaleString()]} />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="installed" name="Installed Elec. (MW)" stroke={T.gold} fill={T.gold} fillOpacity={0.2} />
              <Line yAxisId="left" type="monotone" dataKey="scenarioInstalled" name={`${carbonScenario} Scenario`} stroke={T.green} strokeWidth={2} strokeDasharray={carbonScenario !== "Base" ? "4 4" : "0"} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="heat" name="Thermal Capacity (MWth)" stroke={T.amber} strokeWidth={2} dot={false} />
              <ReferenceLine yAxisId="left" x={2023} stroke={T.border} strokeDasharray="4 4" label={{ value: "Today", fill: T.textSec, fontSize: 10 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={styles.grid3}>
            <KpiCard label="Total Pipeline" value={(totalPipeline / 1000).toFixed(1)} unit="GW" sub="Active development projects" />
            <KpiCard label="Largest Pipeline" value="Indonesia" unit="" sub="1,800 MW in development" color={T.green} />
            <KpiCard label="Fastest Growth" value="East Africa" unit="" sub="+22% p.a. investment growth" color={T.amber} />
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Development Pipeline by Country (MW)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...COUNTRIES].sort((a, b) => b.pipeline - a.pipeline).slice(0, 12)} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="country" tick={{ fontSize: 10, fill: T.textSec }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit=" MW" />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Bar dataKey="pipeline" name="Pipeline (MW)" fill={T.teal} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={styles.grid3}>
            <KpiCard label="Annual Investment" value="$19.3" unit="B" sub="Global geothermal, 2023E" />
            <KpiCard label="Top Region" value="SE Asia" unit="" sub="$6.8B annual investment" color={T.green} />
            <KpiCard label="Fastest Growing" value="Lat. Am." unit="" sub="+25% p.a. growth rate" color={T.amber} />
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Annual Investment & Pipeline by Region</div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={INVESTMENT_FLOWS} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="region" tick={{ fontSize: 9, fill: T.textMut }} angle={-25} textAnchor="end" />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Investment ($B)", angle: -90, position: "insideLeft", fill: T.textSec, fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} unit=" MW" />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Legend />
                <Bar yAxisId="left" dataKey="investment" name="Investment ($B)" fill={T.gold} />
                <Line yAxisId="right" type="monotone" dataKey="pipeline" name="Pipeline (MW)" stroke={T.teal} strokeWidth={2} dot={{ fill: T.teal, r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Growth Rate by Region (% p.a.)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[...INVESTMENT_FLOWS].sort((a, b) => b.growth - a.growth)} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="region" tick={{ fontSize: 9, fill: T.textMut }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="%" />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Bar dataKey="growth" name="Growth Rate (%)" fill={T.green} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div>
          <div style={styles.grid3}>
            {techMixData.slice(0, 3).map(t => (
              <KpiCard key={t.tech} label={t.tech} value={`${t.pct}%`} unit="" sub={`${t.mw} GW installed`} color={t.color} />
            ))}
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Global Technology Mix by Installed Capacity (%)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={techMixData} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="tech" tick={{ fontSize: 10, fill: T.textSec }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="%" />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Bar dataKey="pct" name="Share (%)" fill={T.gold} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Technology Description</div>
            {techMixData.map(t => (
              <div key={t.tech} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: t.color }} />
                  <span style={{ fontWeight: 600, color: t.color }}>{t.tech}</span>
                </div>
                <div style={{ textAlign: "right", fontFamily: T.mono }}>
                  <span style={{ color: T.gold }}>{t.pct}%</span>
                  <span style={{ color: T.textSec, marginLeft: 12 }}>{t.mw} GW</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 7 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Global Policy & Regulatory Landscape</div>
          {[
            { country: "Kenya", policy: "Feed-in Tariff + KETRACO grid access", impact: "High", detail: "Government commits to geothermal as baseload backbone. KenGen state support + World Bank co-finance." },
            { country: "Indonesia", policy: "Presidential Decree 7/2017 + RUPTL PPA", impact: "High", detail: "PLN 30yr USD-denominated PPAs. Government absorbs resource exploration risk." },
            { country: "USA", policy: "IRA 2022: Investment Tax Credit 30%, DOE $84M EGS program", impact: "Very High", detail: "IRA extends ITC to geothermal. DOE GeoVision + FORGE + $84M for EGS development." },
            { country: "EU", policy: "EU Taxonomy + Clean Energy Directive + REPowerEU", impact: "High", detail: "Geothermal classified as sustainable. RED III mandates 42.5% RES by 2030." },
            { country: "Philippines", policy: "Renewable Energy Act (RA 9513) + FiT", impact: "High", detail: "FiT ₱5.90/kWh for geothermal. 35% RPS target by 2030." },
            { country: "New Zealand", policy: "ETS + Climate Change Response Act", impact: "Moderate", detail: "NZ Emissions Trading Scheme provides carbon price floor. Utility-scale geothermal competes on market." },
            { country: "Japan", policy: "FiT ¥40/kWh + national park drilling permits", impact: "Moderate-High", detail: "FiT active since 2012. National park restrictions partially lifted for small-scale units." },
            { country: "Iceland", policy: "State-owned utility model + energy export plans", impact: "High", detail: "Landsvirkjun + Reykjavik Energy state model. Plans for data center + green hydrogen export." },
          ].map(p => (
            <div key={p.country} style={{ padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 600, color: T.gold }}>{p.country} — <span style={{ color: T.text, fontWeight: 400 }}>{p.policy}</span></div>
                  <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{p.detail}</div>
                </div>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: p.impact === "Very High" ? T.green : p.impact === "High" ? T.amber : T.teal, whiteSpace: "nowrap", marginLeft: 10 }}>{p.impact}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 8 && (
        <div>
          <div style={styles.panel}>
            <div style={styles.h3}>Country Risk Assessment — Geothermal Investment</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                    {["Country", "Resource Risk", "Country Risk", "Currency Risk", "PPA Bankability", "Overall"].map(h => (
                      <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: T.gold, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { country: "USA",         resource: "Low", country: "Low",  currency: "Low",  ppa: "High",    overall: "A+" },
                    { country: "Iceland",     resource: "Low", country: "Low",  currency: "Low",  ppa: "N/A (state)", overall: "A+" },
                    { country: "New Zealand", resource: "Low", country: "Low",  currency: "Low",  ppa: "High",    overall: "A" },
                    { country: "Italy",       resource: "Low", country: "Low",  currency: "Low",  ppa: "High",    overall: "A" },
                    { country: "Philippines", resource: "Low", country: "Mod",  currency: "Mod",  ppa: "High",    overall: "B+" },
                    { country: "Mexico",      resource: "Low", country: "Mod",  currency: "Low",  ppa: "Med",     overall: "B+" },
                    { country: "Turkey",      resource: "Low", country: "Mod",  currency: "High", ppa: "Med",     overall: "B" },
                    { country: "Indonesia",   resource: "Low", country: "Mod",  currency: "Mod",  ppa: "High",    overall: "B+" },
                    { country: "Kenya",       resource: "Low", country: "Mod",  currency: "Mod",  ppa: "High",    overall: "B" },
                    { country: "Ethiopia",    resource: "Low", country: "High", currency: "High", ppa: "Dev",     overall: "C+" },
                  ].map((r, i) => (
                    <tr key={r.country} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : "transparent" }}>
                      <td style={{ padding: "7px 10px", color: T.text, fontWeight: 600 }}>{r.country}</td>
                      <td style={{ padding: "7px 10px", color: r.resource === "Low" ? T.green : T.amber }}>{r.resource}</td>
                      <td style={{ padding: "7px 10px", color: r.country === "Low" ? T.green : r.country === "Mod" ? T.amber : T.red }}>{r.country}</td>
                      <td style={{ padding: "7px 10px", color: r.currency === "Low" ? T.green : r.currency === "Mod" ? T.amber : T.red }}>{r.currency}</td>
                      <td style={{ padding: "7px 10px", color: r.ppa === "High" ? T.green : r.ppa === "Med" ? T.amber : T.textSec }}>{r.ppa}</td>
                      <td style={{ padding: "7px 10px", fontFamily: T.mono, fontSize: 14, color: r.overall.startsWith("A") ? T.green : r.overall.startsWith("B") ? T.amber : T.red }}>{r.overall}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 9 && (
        <div>
          <div style={styles.grid3}>
            <KpiCard label="2050 Base Scenario" value="80" unit="GW" sub="Global geothermal electricity" />
            <KpiCard label="2050 High Scenario" value="120+" unit="GW" sub="EGS technology breakthrough" color={T.green} />
            <KpiCard label="Market Value 2050" value="$500B+" unit="" sub="Cumulative investment required" color={T.amber} />
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Outlook to 2050 — Key Themes</div>
            {[
              { theme: "EGS Commercialization", horizon: "2030-2035", detail: "Fervo, Eavor, Quaise reach commercial scale. EGS costs fall 30-50%. Unlocks 90% of global resource base.", impact: "Transformative" },
              { theme: "24/7 Carbon-Free Energy Premium", horizon: "2025-2030", detail: "Corporate buyers (Google, Microsoft) paying 15-30% premium for 24/7 CFE. Drives new project economics.", impact: "High" },
              { theme: "DFI & Climate Finance Scale-Up", horizon: "2024-2028", detail: "World Bank, ADB, AfDB triple geothermal allocation. COP targets drive EM country support programs.", impact: "High" },
              { theme: "East Africa Scale", horizon: "2025-2035", detail: "Kenya, Ethiopia, Tanzania, Uganda developing 6,000+ MW of Rift Valley resource. AGRA corridor unlocks.", impact: "Very High" },
              { theme: "Superhot Rock (SHR)", horizon: "2035-2045", detail: "10-100× energy per well at supercritical conditions. Could reduce geothermal LCOE to $30-50/MWh.", impact: "Transformative" },
              { theme: "Geothermal + Green Hydrogen", horizon: "2030-2040", detail: "Iceland and Kenya exploring 24/7 electrolysis powered by geothermal. Natural baseload match for H₂.", impact: "Moderate-High" },
              { theme: "Geothermal Heating Network Expansion", horizon: "2025-2035", detail: "EU district heating mandates drive 50GWth of new geothermal heat. Netherlands, Germany, France lead.", impact: "High" },
            ].map(t => (
              <div key={t.theme} style={{ padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: T.gold }}>{t.theme}</div>
                    <div style={{ fontSize: 11, color: T.amber, fontFamily: T.mono, marginTop: 2 }}>{t.horizon}</div>
                    <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{t.detail}</div>
                  </div>
                  <span style={{ fontFamily: T.mono, fontSize: 11, padding: "3px 8px", borderRadius: 4, background: T.surfaceH,
                    color: t.impact === "Transformative" ? T.green : t.impact.includes("Very High") ? T.teal : t.impact === "High" ? T.amber : T.textSec,
                    whiteSpace: "nowrap", marginLeft: 16 }}>{t.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
