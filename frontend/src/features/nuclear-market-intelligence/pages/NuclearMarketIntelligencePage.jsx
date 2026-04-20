import React, { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

const T = {
  bg: "#0f1117", surface: "#1a1d27", surfaceH: "#22263a", border: "#2a2d3e", borderL: "#353852",
  navy: "#1e3a5f", navyL: "#2a4f7c", gold: "#c9a84c", goldL: "#e0c068", sage: "#4a7c59", sageL: "#5a9c6e",
  teal: "#2a6b7c", text: "#e8e6df", textSec: "#9e9b93", textMut: "#6b6860", red: "#dc2626",
  green: "#16a34a", amber: "#d97706", font: "DM Sans, sans-serif", mono: "JetBrains Mono, monospace"
};

const sr = s => { const x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const TABS = [
  "Global Fleet","New Build Pipeline","Export Markets","Vendor Landscape",
  "Policy & COP28","Capacity Expansion","Fuel Supply Chain","Financing Structures",
  "SMR Market","Outlook to 2050"
];

const GLOBAL_FLEET = [
  { country:"USA",         operating:93,  building:2,  planned:4,  gwNet:95.5,  pctElec:19, vendor:"Westinghouse/GE" },
  { country:"France",      operating:56,  building:1,  planned:14, gwNet:61.4,  pctElec:67, vendor:"EDF/Framatome" },
  { country:"China",       operating:56,  building:27, planned:50, gwNet:57.1,  pctElec:5,  vendor:"CNNC/CGN/SPIC" },
  { country:"Russia",      operating:37,  building:4,  planned:24, gwNet:28.4,  pctElec:20, vendor:"Rosatom" },
  { country:"S. Korea",    operating:26,  building:4,  planned:3,  gwNet:25.8,  pctElec:29, vendor:"KEPCO/KHNP" },
  { country:"India",       operating:22,  building:6,  planned:28, gwNet:6.7,   pctElec:3,  vendor:"NPCIL/BHAVINI" },
  { country:"Canada",      operating:19,  building:0,  planned:4,  gwNet:13.6,  pctElec:15, vendor:"Bruce Power/OPG" },
  { country:"UK",          operating:9,   building:1,  planned:6,  gwNet:6.5,   pctElec:15, vendor:"EDF/NNB" },
  { country:"Japan",       operating:12,  building:2,  planned:5,  gwNet:11.3,  pctElec:10, vendor:"Tepco/Kansai" },
  { country:"Germany",     operating:0,   building:0,  planned:0,  gwNet:0,     pctElec:0,  vendor:"Phased out 2023" },
];

const NEW_BUILD = [
  { project:"Hinkley Point C",   country:"UK",      mw:3260, vendor:"EDF/Framatome", status:"Under construction", capex_bn:46, cod:2029, reactor:"EPR" },
  { project:"Vogtle 3+4",        country:"USA",     mw:2234, vendor:"Westinghouse",  status:"Complete (2023/24)", capex_bn:35, cod:2024, reactor:"AP1000" },
  { project:"Paks II",           country:"Hungary", mw:2400, vendor:"Rosatom",       status:"Under construction", capex_bn:14, cod:2030, reactor:"VVER-1200" },
  { project:"Flamanville 3",     country:"France",  mw:1630, vendor:"EDF",           status:"First criticality 2024",capex_bn:24,cod:2025,reactor:"EPR" },
  { project:"Akkuyu",            country:"Turkey",  mw:4800, vendor:"Rosatom",       status:"Under construction", capex_bn:22, cod:2027, reactor:"VVER-1200" },
  { project:"Barakah 3+4",       country:"UAE",     mw:2800, vendor:"KEPCO",         status:"Pre-commissioning",  capex_bn:18, cod:2024, reactor:"APR-1400" },
  { project:"Rooppur",           country:"Bangladesh",mw:2400,vendor:"Rosatom",      status:"Under construction", capex_bn:13, cod:2025, reactor:"VVER-1200" },
  { project:"El-Dabaa",          country:"Egypt",   mw:4800, vendor:"Rosatom",       status:"Under construction", capex_bn:30, cod:2028, reactor:"VVER-1200" },
];

const EXPORT_MARKETS = [
  { market:"Poland",     reactor:"AP1000/APR-1400", vendor:"USA/Korea", gwPlanned:6,   policy:"Active procurement", risk:"Low" },
  { market:"Czech Republic",reactor:"AP1000",       vendor:"Westinghouse",gwPlanned:2, policy:"Tender awarded 2024",risk:"Low" },
  { market:"Saudi Arabia",reactor:"APR-1400",       vendor:"KEPCO",     gwPlanned:16,  policy:"Site selection",     risk:"Medium" },
  { market:"Indonesia",  reactor:"CANDU/APR-1400",  vendor:"KEPCO/AECL",gwPlanned:4,  policy:"Pre-feasibility",    risk:"Medium" },
  { market:"Ghana/Kenya",reactor:"SMR/LWR",         vendor:"US/Korea",  gwPlanned:1.5, policy:"IAEA milestones",    risk:"High" },
  { market:"Kazakhstan", reactor:"SMR/VVER",        vendor:"Rosatom",   gwPlanned:2.4, policy:"2024 referendum +ve",risk:"Medium" },
  { market:"India new",  reactor:"PWR/EPR",         vendor:"EDF/Westinghouse",gwPlanned:12,policy:"Active 10 sites",risk:"Low" },
  { market:"Brazil",     reactor:"AP1000/ATMEA",    vendor:"Westinghouse",gwPlanned:2, policy:"Angra 3 completion", risk:"Medium" },
];

const VENDORS = [
  { vendor:"Rosatom (Russia)",  reactor:"VVER-1200",    plants:28, mw_export:35000, share:28, color: T.red },
  { vendor:"CGN/CNNC (China)",  reactor:"HPR-1000/CAP", plants:14, mw_export:22000, share:20, color: T.amber },
  { vendor:"KEPCO (Korea)",     reactor:"APR-1400",     plants:6,  mw_export:9800,  share:9,  color: T.teal },
  { vendor:"Westinghouse (US)", reactor:"AP1000",       plants:12, mw_export:15600, share:14, color: T.gold },
  { vendor:"EDF/Framatome (FR)",reactor:"EPR/EPR1200",  plants:5,  mw_export:8000,  share:7,  color: T.sage },
  { vendor:"GE-Hitachi",        reactor:"ABWR/BWRX-300",plants:3, mw_export:3600,  share:3,  color: T.navyL },
  { vendor:"Rolls-Royce SMR",   reactor:"RR-SMR 470",   plants:0,  mw_export:0,     share:0,  color: T.goldL },
  { vendor:"NuScale",           reactor:"VOYGR-77",     plants:0,  mw_export:0,     share:0,  color: T.sageL },
];

const COP28_COMMITMENTS = [
  { declaration:"Triple Nuclear Capacity by 2050", signatories:25, gwTarget:600, baseGW:372, status:"Adopted Dec 2023" },
  { declaration:"Nuclear New Build Commitment", signatories:22, gwTarget:null, baseGW:null, status:"Supporting statement" },
  { declaration:"Advanced Reactor Deployment", signatories:14, gwTarget:200, baseGW:0, status:"ARDP + EU taxonomy" },
  { declaration:"Just Transition Nuclear", signatories:6, gwTarget:null, baseGW:null, status:"ILO + IAEA framework" },
];

const FINANCING = [
  { structure:"CfD / PPA (long-term)",     provider:"Government/Corporate", term:"15–35yr", cost:"7–9% WACC",  suitable:"Hinkley / New FOAK" },
  { structure:"Export Credit Agency (ECA)",provider:"EXIM/BPI/UKEF",      term:"20–25yr",  cost:"LIBOR+150–200bp",suitable:"Emerging market" },
  { structure:"Development Finance (MDB)", provider:"World Bank/AIIB",     term:"20–30yr",  cost:"IBRD+80bp",   suitable:"First-in-country" },
  { structure:"Nuclear Bond (ATOM bond)",  provider:"Capital markets",     term:"10–20yr",  cost:"6–8%",         suitable:"Investment-grade utility" },
  { structure:"Government Loan Guarantee", provider:"DOE LPO / HMT",      term:"10–30yr",  cost:"Risk-free+50bp",suitable:"US AP1000 / UK EPR" },
  { structure:"Revenue Floor (RAB model)", provider:"UK Government",       term:"35yr",     cost:"~6.5% allowed return",suitable:"Sizewell C" },
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "14px 18px" }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.gold, margin: "4px 0 2px" }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec }}>{sub}</div>}
  </div>
);

const Slider = ({ label, min, max, step, value, onChange, fmt }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textSec, marginBottom: 4 }}>
      <span>{label}</span><span style={{ color: T.gold, fontFamily: T.mono }}>{fmt ? fmt(value) : value}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{ width: "100%", accentColor: T.gold }} />
  </div>
);

export default function NuclearMarketIntelligencePage() {
  const [tab, setTab] = useState(0);
  const [gwTarget2050, setGwTarget2050] = useState(600);
  const [annualAddition, setAnnualAddition] = useState(15);
  const [selectedCountry, setSelectedCountry] = useState(0);

  const COLORS = [T.gold, T.teal, T.sage, T.navyL, T.amber, T.goldL, T.red, T.green, T.red, T.textSec];

  const fleetGrowth = useMemo(() => Array.from({ length: 26 }, (_, i) => ({
    year: 2025 + i,
    operable: +(372 + annualAddition * i - 4 * i).toFixed(0),
    building: +(90 - 2 * i + sr(i * 5) * 20).toFixed(0),
  })), [annualAddition]);

  const vendorPie = VENDORS.filter(v => v.share > 0).map(v => ({ name: v.vendor.split(" ")[0], value: v.share, fill: v.color }));

  const exportPipelineData = EXPORT_MARKETS.map(m => ({
    market: m.market, gwPlanned: m.gwPlanned,
    capex: +(m.gwPlanned * 6).toFixed(0),
  }));

  const smrPipeline = useMemo(() => [
    { design:"NuScale VOYGR",  mw_per:77,  units:3, total_mw:231,  cod:2030, country:"Poland / Romania" },
    { design:"GEH BWRX-300",   mw_per:300, units:4, total_mw:1200, cod:2031, country:"Canada / Sweden / UK" },
    { design:"Rolls-Royce SMR",mw_per:470, units:5, total_mw:2350, cod:2033, country:"UK + exports" },
    { design:"X-Energy Xe-100",mw_per:80,  units:4, total_mw:320,  cod:2030, country:"USA (Dow Chemical)" },
    { design:"Kairos KP-FHR",  mw_per:140, units:1, total_mw:140,  cod:2030, country:"USA (demo)" },
    { design:"eVinci (5MW)",   mw_per:5,   units:10,total_mw:50,   cod:2029, country:"Remote/mining" },
  ], []);

  const capacityScenario = useMemo(() => {
    const scenarios = [
      { name:"Base (current policy)", gwArr: [372, 390, 415, 450, 490, 520] },
      { name:"Accelerated (COP28)",   gwArr: [372, 410, 460, 520, 570, 600] },
      { name:"Nuclear Renaissance",   gwArr: [372, 430, 510, 600, 680, 750] },
      { name:"Stagnation",            gwArr: [372, 370, 368, 365, 360, 350] },
    ];
    return [2025, 2030, 2035, 2040, 2045, 2050].map((yr, i) => ({
      year: yr,
      base: scenarios[0].gwArr[i], accel: scenarios[1].gwArr[i],
      renais: scenarios[2].gwArr[i], stag: scenarios[3].gwArr[i],
    }));
  }, []);

  const policyTimeline = [
    { year:"2021", event:"EU Taxonomy: nuclear included as transitional",         impact:"High" },
    { year:"2022", event:"US IRA: $30/MWh nuclear PTC + $1B credit support",      impact:"High" },
    { year:"2023", event:"COP28 Triple Nuclear Declaration (25 countries)",        impact:"High" },
    { year:"2023", event:"Germany phase-out complete — 3 last reactors closed",   impact:"Medium" },
    { year:"2024", event:"UK RAB model legislation; Sizewell C approved",         impact:"High" },
    { year:"2024", event:"Japan restarts 12 reactors; 17 awaiting approval",      impact:"Medium" },
    { year:"2024", event:"Belgium reverses phase-out — Doel/Tihange life extension",impact:"Medium" },
    { year:"2024", event:"US ADVANCE Act — NRC fee reduction + export support",   impact:"High" },
  ];

  const marketSizeData = [
    { segment:"New Build (GW-LWR)", mktBn:480, cagr:8 },
    { segment:"SMR/Advanced",       mktBn:180, cagr:25 },
    { segment:"Life Extension",     mktBn:95,  cagr:6 },
    { segment:"Fuel Cycle",         mktBn:60,  cagr:5 },
    { segment:"Decommissioning",    mktBn:50,  cagr:5 },
    { segment:"Services/D&D",       mktBn:35,  cagr:7 },
  ];

  const tabContent = () => {
    switch (tab) {
      case 0: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="Operating Reactors" value="437" sub="World total (2024)" />
            <KpiCard label="Under Construction" value="63" sub="Highest since 1992" color={T.teal} />
            <KpiCard label="Global Nuclear Capacity" value="395 GWe" sub="Net 2024" color={T.sage} />
            <KpiCard label="% Global Electricity" value="10%" sub="2,600 TWh/yr" color={T.amber} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Reactor Count by Country (Operating + Building)</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={GLOBAL_FLEET}>
                  <XAxis dataKey="country" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="operating" fill={T.gold}  name="Operating" stackId="a" />
                  <Bar dataKey="building"  fill={T.teal}  name="Building"  stackId="a" />
                  <Bar dataKey="planned"   fill={T.sage}  name="Planned"   stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Nuclear % of Electricity by Country</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={GLOBAL_FLEET} layout="vertical">
                  <XAxis type="number" domain={[0, 80]} tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis dataKey="country" type="category" tick={{ fill: T.textMut, fontSize: 10 }} width={80} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="pctElec" radius={[0,3,3,0]} name="% electricity">
                    {GLOBAL_FLEET.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Country","Operating","Building","Planned","Capacity (GWe)","% Electricity","Key Vendor"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", color: T.textSec, textAlign: "left", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GLOBAL_FLEET.map((p, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, cursor: "pointer", background: selectedCountry === i ? T.surfaceH : "transparent" }}
                    onClick={() => setSelectedCountry(i)}>
                    <td style={{ padding: "8px 10px", color: T.text, fontWeight: 600 }}>{p.country}</td>
                    <td style={{ padding: "8px 10px", color: T.green, fontFamily: T.mono }}>{p.operating}</td>
                    <td style={{ padding: "8px 10px", color: T.teal, fontFamily: T.mono }}>{p.building}</td>
                    <td style={{ padding: "8px 10px", color: T.sage, fontFamily: T.mono }}>{p.planned}</td>
                    <td style={{ padding: "8px 10px", color: T.gold, fontFamily: T.mono }}>{p.gwNet}</td>
                    <td style={{ padding: "8px 10px", color: p.pctElec > 30 ? T.green : p.pctElec > 10 ? T.amber : T.textSec, fontFamily: T.mono }}>{p.pctElec}%</td>
                    <td style={{ padding: "8px 10px", color: T.textSec }}>{p.vendor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
      case 1: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="Projects Under Constr." value="63" sub="As of 2024" />
            <KpiCard label="New Build Pipeline GW" value="85 GWe" sub="Under construction" color={T.teal} />
            <KpiCard label="Total CAPEX Committed" value="$500B+" sub="Active projects" color={T.amber} />
            <KpiCard label="Avg. Cost Overrun" value="2.5×" sub="vs original budget" color={T.red} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Major New Build Projects — Capex & Status</div>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Project","Country","MW","Reactor","Vendor","Status","CAPEX","CoD"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", color: T.textSec, textAlign: "left", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NEW_BUILD.map((p, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "8px 10px", color: T.gold, fontWeight: 600 }}>{p.project}</td>
                    <td style={{ padding: "8px 10px", color: T.textSec }}>{p.country}</td>
                    <td style={{ padding: "8px 10px", color: T.text, fontFamily: T.mono }}>{p.mw.toLocaleString()}</td>
                    <td style={{ padding: "8px 10px", color: T.teal }}>{p.reactor}</td>
                    <td style={{ padding: "8px 10px", color: T.textSec }}>{p.vendor}</td>
                    <td style={{ padding: "8px 10px", color: p.status.includes("Complete") ? T.green : T.amber, fontSize: 11 }}>{p.status}</td>
                    <td style={{ padding: "8px 10px", color: T.red, fontFamily: T.mono }}>${p.capex_bn}B</td>
                    <td style={{ padding: "8px 10px", color: T.textSec, fontFamily: T.mono }}>{p.cod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>New Build CAPEX by Project ($B)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={NEW_BUILD.map(p => ({ name: p.project.split(" ").slice(0, 2).join(" "), capex: p.capex_bn }))}>
                <XAxis dataKey="name" tick={{ fill: T.textMut, fontSize: 10 }} />
                <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                <Bar dataKey="capex" radius={[3,3,0,0]} name="CAPEX ($B)">
                  {NEW_BUILD.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
      case 2: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="Export Pipeline GW" value="75 GWe" sub="Planned in new markets" />
            <KpiCard label="Largest Market" value="Saudi Arabia" sub="16 GWe planned" color={T.amber} />
            <KpiCard label="KEPCO Dominance" value="Barakah model" sub="4-unit APR-1400" color={T.teal} />
            <KpiCard label="US ADVANCE Act" value="2024" sub="Export finance support" color={T.sage} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Export Pipeline by Country (GWe planned)</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={exportPipelineData} layout="vertical">
                  <XAxis type="number" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis dataKey="market" type="category" tick={{ fill: T.textMut, fontSize: 10 }} width={90} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="gwPlanned" fill={T.gold} radius={[0,3,3,0]} name="GWe planned" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Export Market Risk Assessment</div>
              <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {["Market","GWe","Vendor","Policy","Risk"].map(h => (
                      <th key={h} style={{ padding: "6px 8px", color: T.textSec, textAlign: "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EXPORT_MARKETS.map((m, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "6px 8px", color: T.text, fontWeight: 600 }}>{m.market}</td>
                      <td style={{ padding: "6px 8px", color: T.gold, fontFamily: T.mono }}>{m.gwPlanned}</td>
                      <td style={{ padding: "6px 8px", color: T.teal }}>{m.vendor.split("/")[0]}</td>
                      <td style={{ padding: "6px 8px", color: T.textSec, fontSize: 10 }}>{m.policy}</td>
                      <td style={{ padding: "6px 8px", color: m.risk === "Low" ? T.green : m.risk === "Medium" ? T.amber : T.red }}>{m.risk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
      case 3: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="Top Export Vendor" value="Rosatom" sub="28% pipeline share" color={T.red} />
            <KpiCard label="Western Leader" value="Westinghouse" sub="AP1000 resurgence" color={T.teal} />
            <KpiCard label="Rising Competitor" value="KEPCO" sub="Barakah proves model" color={T.sage} />
            <KpiCard label="China Export Ban" value="Selective" sub="CNNC/CGN geopolitics" color={T.amber} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Vendor Export Pipeline Share (% by GWe)</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={vendorPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                    {vendorPie.map((v, i) => <Cell key={i} fill={v.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }}
                    formatter={(v, n) => [`${v}%`, n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Vendor Comparison Matrix</div>
              <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {["Vendor","Reactor","Plants Sold","Export MW","Share"].map(h => (
                      <th key={h} style={{ padding: "6px 8px", color: T.textSec, textAlign: "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {VENDORS.map((v, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "6px 8px", color: v.color, fontWeight: 600 }}>{v.vendor.split(" ")[0]}</td>
                      <td style={{ padding: "6px 8px", color: T.textSec }}>{v.reactor}</td>
                      <td style={{ padding: "6px 8px", color: T.text, fontFamily: T.mono }}>{v.plants}</td>
                      <td style={{ padding: "6px 8px", color: T.teal, fontFamily: T.mono }}>{v.mw_export.toLocaleString()}</td>
                      <td style={{ padding: "6px 8px", color: T.gold, fontFamily: T.mono }}>{v.share}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
      case 4: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="COP28 Triple Target" value="600 GWe" sub="By 2050 from 372 GWe" />
            <KpiCard label="Signatories" value="25 nations" sub="Dec 2023 UAE Declaration" color={T.teal} />
            <KpiCard label="Annual Additions Needed" value="16 GWe/yr" sub="2024–2050 average" color={T.amber} />
            <KpiCard label="Current Build Rate" value="~8 GWe/yr" sub="2× acceleration needed" color={T.red} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>COP28 Nuclear Commitments</div>
              {COP28_COMMITMENTS.map((c, i) => (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 6, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>{c.declaration}</div>
                  <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: T.teal }}>{c.signatories} signatories</span>
                    {c.gwTarget && <span style={{ fontSize: 11, color: T.amber, fontFamily: T.mono }}>{c.gwTarget} GWe target</span>}
                  </div>
                  <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>{c.status}</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Key Policy Milestones Timeline</div>
              {policyTimeline.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, minWidth: 36 }}>{p.year}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: T.textSec }}>{p.event}</div>
                  </div>
                  <div style={{ fontSize: 10, color: p.impact === "High" ? T.green : T.amber, minWidth: 50, textAlign: "right" }}>{p.impact}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      case 5: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="COP28 Target" value={`${gwTarget2050} GWe`} sub="By 2050" />
            <KpiCard label="Annual Additions" value={`${annualAddition} GWe/yr`} sub="Required rate" color={T.teal} />
            <KpiCard label="2050 Projected (Base)" value="520 GWe" sub="Current trajectory" color={T.amber} />
            <KpiCard label="Gap to Triple Target" value="228 GWe" sub="Acceleration needed" color={T.red} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, marginBottom: 20 }}>
            <Slider label="COP28 GW Target 2050" min={400} max={900} step={25} value={gwTarget2050} onChange={setGwTarget2050} fmt={v => `${v} GWe`} />
            <Slider label="Annual Net Additions (GWe/yr)" min={5} max={30} step={1} value={annualAddition} onChange={setAnnualAddition} fmt={v => `${v} GWe/yr`} />
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Capacity Scenarios to 2050 (GWe)</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={capacityScenario}>
                <XAxis dataKey="year" tick={{ fill: T.textMut, fontSize: 10 }} />
                <YAxis domain={[300, 800]} tick={{ fill: T.textMut, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                <Line type="monotone" dataKey="accel"  stroke={T.green}  dot={false} strokeWidth={2} name="Accelerated (COP28)" />
                <Line type="monotone" dataKey="base"   stroke={T.gold}   dot={false} strokeWidth={2} name="Base Case" />
                <Line type="monotone" dataKey="renais" stroke={T.teal}   dot={false} strokeWidth={2} name="Nuclear Renaissance" />
                <Line type="monotone" dataKey="stag"   stroke={T.red}    dot={false} strokeWidth={2} name="Stagnation" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Fleet Growth Model (GWe — {annualAddition} GWe/yr net addition)</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={fleetGrowth.filter((_, i) => i % 2 === 0)}>
                <XAxis dataKey="year" tick={{ fill: T.textMut, fontSize: 10 }} />
                <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                <Area type="monotone" dataKey="operable" stroke={T.gold} fill={T.gold} fillOpacity={0.2} name="Operating (GWe)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
      case 6: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="Uranium Demand 2035E" value="220 Mlbs/yr" sub="+22% from 2024" />
            <KpiCard label="SWU Demand 2035E" value="68M SWU/yr" sub="+6%" color={T.teal} />
            <KpiCard label="Russian SWU Ban Impact" value="$4B/yr" sub="US market displacement" color={T.red} />
            { /* ":" in string values must be rendered as JSX prop values */ }
            <KpiCard label="Supply Stress (2030)" value="HIGH" sub="HALEU + Western SWU" color={T.red} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Fuel Demand vs Supply Forecast (Mlbs U3O8/yr)</div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={Array.from({ length: 10 }, (_, i) => ({
                  year: 2025 + i,
                  demand: +(180 + i * 4).toFixed(0),
                  supply: +(170 + sr(i * 3) * 10 + i * 2).toFixed(0),
                }))}>
                  <XAxis dataKey="year" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis domain={[150, 230]} tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Area type="monotone" dataKey="demand" stroke={T.gold}  fill={T.gold}  fillOpacity={0.2} name="Demand (Mlbs)" />
                  <Area type="monotone" dataKey="supply" stroke={T.teal}  fill={T.teal}  fillOpacity={0.2} name="Supply (Mlbs)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Western Fuel Supply Chain — Investment Needs ($B)</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[
                  { segment:"New U mines (NA/AU)", invest: 8.5 },
                  { segment:"Conversion capacity",  invest: 2.0 },
                  { segment:"Western enrichment",   invest: 4.5 },
                  { segment:"HALEU production",     invest: 3.0 },
                  { segment:"Fuel fabrication",     invest: 1.5 },
                ]}>
                  <XAxis dataKey="segment" tick={{ fill: T.textMut, fontSize: 9 }} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="invest" fill={T.gold} radius={[3,3,0,0]} name="Investment needed ($B)">
                    {[T.gold, T.teal, T.sage, T.amber, T.navyL].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );
      case 7: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="UK RAB Model" value="Active" sub="Sizewell C financing" color={T.green} />
            <KpiCard label="US LPO Guarantee" value="$1B+" sub="DOE Vogtle precedent" color={T.teal} />
            <KpiCard label="ECA Coverage" value="80–95%" sub="Export project cover" color={T.sage} />
            <KpiCard label="Typical WACC" value="7–9%" sub="CfD-backed projects" color={T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, marginBottom: 20 }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Structure","Provider","Term","Cost","Suitable For"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", color: T.textSec, textAlign: "left", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FINANCING.map((f, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "8px 10px", color: T.gold, fontWeight: 600 }}>{f.structure}</td>
                    <td style={{ padding: "8px 10px", color: T.textSec }}>{f.provider}</td>
                    <td style={{ padding: "8px 10px", color: T.teal, fontFamily: T.mono }}>{f.term}</td>
                    <td style={{ padding: "8px 10px", color: T.sage, fontFamily: T.mono }}>{f.cost}</td>
                    <td style={{ padding: "8px 10px", color: T.textSec }}>{f.suitable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
      case 8: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="SMR Market 2050E" value="$600B+" sub="IEA high scenario" />
            <KpiCard label="SMR Orders Pipeline" value="20+ GWe" sub="Announced 2023–24" color={T.teal} />
            <KpiCard label="Data Center Demand" value="Emerging" sub="Microsoft / Google / Meta" color={T.sage} />
            <KpiCard label="NOAK Cost Target" value="$3,500/kWe" sub="vs $6,500+ FOAK" color={T.amber} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>SMR Pipeline — Capacity by Design (MWe)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={smrPipeline.map(s => ({ name: s.design.split(" ")[0], mw: s.total_mw }))}>
                  <XAxis dataKey="name" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="mw" radius={[3,3,0,0]} name="MWe">
                    {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>SMR Pipeline by Design</div>
              <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {["Design","MW/unit","Units","Total MW","CoD","Markets"].map(h => (
                      <th key={h} style={{ padding: "6px 8px", color: T.textSec, textAlign: "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {smrPipeline.map((s, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "6px 8px", color: T.gold, fontWeight: 600 }}>{s.design}</td>
                      <td style={{ padding: "6px 8px", color: T.text, fontFamily: T.mono }}>{s.mw_per}</td>
                      <td style={{ padding: "6px 8px", color: T.teal, fontFamily: T.mono }}>{s.units}</td>
                      <td style={{ padding: "6px 8px", color: T.amber, fontFamily: T.mono }}>{s.total_mw.toLocaleString()}</td>
                      <td style={{ padding: "6px 8px", color: T.textSec, fontFamily: T.mono }}>{s.cod}</td>
                      <td style={{ padding: "6px 8px", color: T.textSec }}>{s.country}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
      case 9: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="2050 Capacity (COP28)" value="600 GWe" sub="Triple from 372 GWe" />
            <KpiCard label="Investment Required" value="$1.7T" sub="2024–2050 new build" color={T.amber} />
            <KpiCard label="Jobs Created" value="1.2M" sub="By 2050 (IEA)" color={T.teal} />
            <KpiCard label="CO2 Avoided" value="2.0 GtCO2/yr" sub="vs coal/gas baseline" color={T.green} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Nuclear Market Size by Segment ($B, 2035E)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={marketSizeData}>
                <XAxis dataKey="segment" tick={{ fill: T.textMut, fontSize: 10 }} />
                <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                <Bar dataKey="mktBn" radius={[3,3,0,0]} name="Market $B">
                  {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.gold, marginBottom: 12 }}>2030/2050 Key Milestones</div>
              {[
                { yr:"2025", milestone:"Barakah 4 + Flamanville 3 commercial ops", conf:"High" },
                { yr:"2027", milestone:"First ARDP demo (TerraPower Natrium)", conf:"Medium" },
                { yr:"2028", milestone:"Rolls-Royce SMR FID decision", conf:"Medium" },
                { yr:"2030", milestone:"First Gen IV commercial unit (HTGR/SFR)", conf:"Low" },
                { yr:"2035", milestone:"SMR NOAK series economics proven", conf:"Low" },
                { yr:"2040", milestone:"Advanced reactor series ramp (MSR/LFR)", conf:"Very Low" },
                { yr:"2050", milestone:"600 GWe global capacity (COP28 target)", conf:"Very Low" },
              ].map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, minWidth: 36 }}>{m.yr}</div>
                  <div style={{ flex: 1, fontSize: 11, color: T.textSec }}>{m.milestone}</div>
                  <div style={{ fontSize: 10, color: m.conf === "High" ? T.green : m.conf === "Medium" ? T.amber : T.red, minWidth: 55, textAlign: "right" }}>{m.conf}</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Nuclear Market CAGR by Segment (2024–2035)</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={marketSizeData} layout="vertical">
                  <XAxis type="number" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis dataKey="segment" type="category" tick={{ fill: T.textMut, fontSize: 10 }} width={130} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="cagr" radius={[0,3,3,0]} name="CAGR %">
                    {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: 24, fontFamily: T.font, color: T.text }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, borderBottom: `1px solid ${T.border}`, paddingBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: T.gold, fontFamily: T.mono, letterSpacing: 2, marginBottom: 6 }}>EP-DU6 · NUCLEAR MARKET INTELLIGENCE</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: T.text }}>Nuclear Market Intelligence Platform</h1>
            <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>Global Fleet · New Build Pipeline · Export Markets · Vendor Landscape · COP28 · SMR Market · Outlook 2050</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>FLEET SIZE</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.gold }}>395 GWe</div>
            <div style={{ fontSize: 11, color: T.textSec }}>437 operating · 63 building</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: "7px 14px", fontSize: 12, cursor: "pointer", borderRadius: 4,
              background: tab === i ? T.gold : T.surface,
              color: tab === i ? T.bg : T.textSec,
              border: `1px solid ${tab === i ? T.gold : T.border}`,
              fontFamily: T.font, fontWeight: tab === i ? 600 : 400,
            }}>{t}</button>
          ))}
        </div>

        {tabContent()}
      </div>
    </div>
  );
}
