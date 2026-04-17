import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, ReferenceLine, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = {
  bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E',
  sub: '#6B7280', accent: '#B8860B', indigo: '#4F46E5', green: '#065F46',
  red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', navy: '#0F172A'
};

const fmt = (v, d = 1) => (isFinite(v) && !isNaN(v)) ? Number(v).toFixed(d) : '—';
const fmtM = v => (isFinite(v) && !isNaN(v)) ? `$${Number(v).toFixed(1)}M` : '—';
const fmtPct = v => (isFinite(v) && !isNaN(v)) ? `${Number(v).toFixed(2)}%` : '—';

function cableLoss(powerMW, voltagekV, resistancePerkm, lengthkm) {
  const currentkA = voltagekV > 0 ? powerMW / (Math.sqrt(3) * voltagekV) : 0;
  const lossKw = 3 * Math.pow(currentkA * 1000, 2) * resistancePerkm / 1e6 * lengthkm;
  const lossPct = powerMW > 0 ? lossKw / (powerMW * 1000) * 100 : 0;
  return { lossKw, lossPct };
}

function hvdcBreakeven(powerMW) {
  return Array.from({ length: 30 }, (_, i) => {
    const km = 20 + i * 10;
    const acLoss = cableLoss(powerMW, 220, 0.028, km).lossPct;
    const hvdcLoss = 1.4 + 0.0020 * km;
    return { km, acLoss: parseFloat(acLoss.toFixed(3)), hvdcLoss: parseFloat(hvdcLoss.toFixed(3)), diff: parseFloat((acLoss - hvdcLoss).toFixed(3)) };
  });
}

const TABS = [
  'Overview', 'Cable Sizing', 'AC vs HVDC', 'Grid Loss Model', 'Cable Cost Model',
  'Offshore Substation', 'Cable Routing', 'Grid Code', 'Interconnection',
  'Reliability', 'Curtailment', 'Frequency Reg', 'Black Start',
  'Future-Proofing', 'Hub Topology', 'Country Grid', 'Tender Comparison', 'Summary'
];

const COUNTRIES = ['UK', 'Germany', 'Netherlands', 'Denmark', 'US', 'Taiwan'];
const CABLE_VOLTAGES = ['33kV', '66kV', '132kV'];
const EXPORT_TYPES = ['AC 132kV', 'AC 220kV', 'HVDC ±320kV', 'HVDC ±525kV'];
const CONDUCTOR_MATERIALS = ['Cu', 'Al'];
const PLATFORM_TYPES = ['Jacket', 'Monopile', 'Floating'];
const GRID_VOLTAGES = ['132kV', '275kV', '400kV'];

const CONDUCTOR_DATA = [
  { area: 300, cuRating: 530, alRating: 420, resistance33: 0.0601, resistance66: 0.0601, resistance132: 0.0601 },
  { area: 500, cuRating: 645, alRating: 510, resistance33: 0.0366, resistance66: 0.0366, resistance132: 0.0366 },
  { area: 800, cuRating: 790, alRating: 625, resistance33: 0.0228, resistance66: 0.0228, resistance132: 0.0228 },
  { area: 1200, cuRating: 960, alRating: 760, resistance33: 0.0151, resistance66: 0.0151, resistance132: 0.0151 },
  { area: 1600, cuRating: 1100, alRating: 870, resistance33: 0.0113, resistance66: 0.0113, resistance132: 0.0113 },
  { area: 2000, cuRating: 1230, alRating: 970, resistance33: 0.0090, resistance66: 0.0090, resistance132: 0.0090 },
  { area: 2500, cuRating: 1380, alRating: 1090, resistance33: 0.0072, resistance66: 0.0072, resistance132: 0.0072 },
  { area: 3000, cuRating: 1510, alRating: 1195, resistance33: 0.0060, resistance66: 0.0060, resistance132: 0.0060 },
];

const TENDER_DATA = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  country: ['UK', 'Germany', 'Netherlands', 'Denmark', 'US', 'Taiwan', 'Belgium', 'France', 'Norway', 'Ireland'][i],
  capacity: Math.round(500 + sr(i * 7) * 2500),
  cableKm: Math.round(50 + sr(i * 13) * 250),
  costM: Math.round(200 + sr(i * 17) * 1800),
  year: 2019 + Math.floor(sr(i * 23) * 6),
  winner: ['Prysmian', 'Nexans', 'NKT', 'ABB', 'Siemens', 'GE Vernova', 'Hitachi', 'XLCC', 'Sumitomo', 'LS Cable'][i],
  timeline: Math.round(24 + sr(i * 31) * 36),
})).map(t => ({ ...t, dollarPerMW: t.costM > 0 ? Math.round(t.costM * 1e6 / t.capacity / 1000) : 0 }));

const KpiCard = ({ label, value, unit, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.sub, fontFamily: 'JetBrains Mono, monospace', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.text, fontFamily: 'DM Sans, sans-serif' }}>{value}</div>
    {unit && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{unit}</div>}
  </div>
);

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ fontSize: 11, color: T.accent, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, borderBottom: `1px solid ${T.border}`, paddingBottom: 6 }}>{title}</div>
    {children}
  </div>
);

const SideInput = ({ label, value, onChange, min, max, step, suffix }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
      <span style={{ fontSize: 11, color: T.sub }}>{label}</span>
      <span style={{ fontSize: 11, color: T.text, fontFamily: 'JetBrains Mono, monospace' }}>{value}{suffix || ''}</span>
    </div>
    <input type="range" min={min} max={max} step={step || 1} value={value} onChange={e => onChange(Number(e.target.value))}
      style={{ width: '100%', accentColor: T.indigo }} />
  </div>
);

const SideSelect = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{label}</div>
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12, background: T.bg, color: T.text }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const Table = ({ headers, rows, small }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: small ? 11 : 12 }}>
      <thead>
        <tr style={{ background: T.navy }}>
          {headers.map((h, i) => <th key={i} style={{ padding: '8px 12px', textAlign: 'left', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} style={{ background: ri % 2 === 0 ? T.card : T.bg, borderBottom: `1px solid ${T.border}` }}>
            {row.map((cell, ci) => <td key={ci} style={{ padding: '7px 12px', color: T.text, whiteSpace: 'nowrap' }}>{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ChartBox = ({ title, children, height = 220 }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 12 }}>{title}</div>
    <div style={{ height }}>{children}</div>
  </div>
);

export default function OffshoreGridInfrastructurePage() {
  const [activeTab, setActiveTab] = useState(0);

  // Section 1 — Project
  const [capacityMW, setCapacityMW] = useState(1000);
  const [distanceKm, setDistanceKm] = useState(80);
  const [waterDepth, setWaterDepth] = useState(35);
  const [country, setCountry] = useState('UK');
  const [arrayCableVoltage, setArrayCableVoltage] = useState('66kV');

  // Section 2 — Export Cable
  const [exportType, setExportType] = useState('HVDC ±320kV');
  const [conductorMaterial, setConductorMaterial] = useState('Cu');
  const [conductorArea, setConductorArea] = useState(1200);
  const [numCables, setNumCables] = useState(2);
  const [burialDepth, setBurialDepth] = useState(1.0);

  // Section 3 — Onshore Substation
  const [gridVoltage, setGridVoltage] = useState('400kV');
  const [transformerCapMVA, setTransformerCapMVA] = useState(500);
  const [reactiveCompMVAR, setReactiveCompMVAR] = useState(200);
  const [landCostM, setLandCostM] = useState(15);

  // Section 4 — Offshore Substation
  const [platformType, setPlatformType] = useState('Jacket');
  const [platformWeightT, setPlatformWeightT] = useState(3500);
  const [ossTxMVA, setOssTxMVA] = useState(500);
  const [numPlatforms, setNumPlatforms] = useState(1);
  const [platformCostM, setPlatformCostM] = useState(180);

  // Section 5 — Losses & Reliability
  const [loadFactor, setLoadFactor] = useState(42);
  const [mtbfCable, setMtbfCable] = useState(87600);
  const [repairDays, setRepairDays] = useState(45);
  const [faultFreq, setFaultFreq] = useState(0.08);

  // Section 6 — Financial
  const [cableCostPerM, setCableCostPerM] = useState(1200);
  const [substationCostM, setSubstationCostM] = useState(250);
  const [annualOM, setAnnualOM] = useState(1.8);
  const [discountRate, setDiscountRate] = useState(7);
  const [assetLife, setAssetLife] = useState(25);

  const calcs = useMemo(() => {
    const isHVDC = exportType.includes('HVDC');
    const exportVoltage = exportType === 'AC 132kV' ? 132 : exportType === 'AC 220kV' ? 220 : exportType === 'HVDC ±320kV' ? 320 : 525;
    const resistance = CONDUCTOR_DATA.find(c => c.area >= conductorArea)?.resistance33 || 0.015;

    // Cable AC/HVDC loss
    let lossPct = 0;
    if (isHVDC) {
      lossPct = 1.4 + 0.0020 * distanceKm;
    } else {
      const result = cableLoss(capacityMW / numCables, exportVoltage, resistance, distanceKm);
      lossPct = result.lossPct * numCables;
    }
    lossPct = Math.min(lossPct, 25);

    const annualGenGWh = capacityMW * (loadFactor / 100) * 8760 / 1000;
    const annualEnergyLossGWh = annualGenGWh * lossPct / 100;
    const ppaPriceMWh = 55 + sr(capacityMW * 3) * 30;
    const annualRevenueLossM = annualEnergyLossGWh * ppaPriceMWh / 1000;

    // Cable cost
    const cableLengthM = distanceKm * 1000 * numCables * 1.08;
    const cableSupplyCostM = cableLengthM * cableCostPerM / 1e6;
    const installationCostM = distanceKm * numCables * 0.8;
    const totalCableCostM = cableSupplyCostM + installationCostM;
    const onshoreSsCostM = substationCostM * 0.6 + landCostM;
    const offshoreSsCostM = platformCostM * numPlatforms;
    const totalCapexM = totalCableCostM + onshoreSsCostM + offshoreSsCostM;

    // Availability
    const faultPer100 = faultFreq;
    const expectedFaults = faultPer100 * distanceKm * numCables / 100;
    const repairHours = repairDays * 24;
    const annualOutageHrs = expectedFaults * repairHours;
    const availability = Math.max(0, Math.min(100, (1 - annualOutageHrs / 8760) * 100));

    // LCOE contribution
    const annualCapexCharge = totalCapexM * (discountRate / 100) / (1 - Math.pow(1 + discountRate / 100, -assetLife));
    const annualOMCostM = totalCapexM * annualOM / 100;
    const gridLcoe = annualGenGWh > 0 ? (annualCapexCharge + annualOMCostM + annualRevenueLossM) / annualGenGWh : 0;

    // NPV of losses
    const pvFactor = annualOM > 0 ? (1 - Math.pow(1 + discountRate / 100, -assetLife)) / (discountRate / 100) : assetLife;
    const npvLossM = annualRevenueLossM * pvFactor;

    return {
      lossPct, annualGenGWh, annualEnergyLossGWh, annualRevenueLossM,
      totalCapexM, cableSupplyCostM, installationCostM, totalCableCostM,
      onshoreSsCostM, offshoreSsCostM, availability, gridLcoe, npvLossM,
      exportVoltage, isHVDC, ppaPriceMWh, annualOMCostM, annualCapexCharge
    };
  }, [capacityMW, distanceKm, numCables, exportType, conductorArea, loadFactor, cableCostPerM,
    substationCostM, landCostM, platformCostM, numPlatforms, discountRate, assetLife,
    annualOM, faultFreq, repairDays]);

  const breakeven = useMemo(() => hvdcBreakeven(capacityMW), [capacityMW]);

  const sidebar = (
    <div style={{ width: 260, flexShrink: 0, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, overflowY: 'auto', maxHeight: 'calc(100vh - 160px)', fontSize: 12 }}>
      <Section title="Project">
        <SideInput label="Farm Capacity (MW)" value={capacityMW} onChange={setCapacityMW} min={100} max={3000} step={50} />
        <SideInput label="Distance to Shore (km)" value={distanceKm} onChange={setDistanceKm} min={10} max={300} step={5} />
        <SideInput label="Water Depth (m)" value={waterDepth} onChange={setWaterDepth} min={5} max={200} step={5} suffix="m" />
        <SideSelect label="Country" value={country} onChange={setCountry} options={COUNTRIES} />
        <SideSelect label="Array Cable Voltage" value={arrayCableVoltage} onChange={setArrayCableVoltage} options={CABLE_VOLTAGES} />
      </Section>
      <Section title="Export Cable">
        <SideSelect label="Export Type" value={exportType} onChange={setExportType} options={EXPORT_TYPES} />
        <SideSelect label="Conductor Material" value={conductorMaterial} onChange={setConductorMaterial} options={CONDUCTOR_MATERIALS} />
        <SideInput label="Conductor Area (mm²)" value={conductorArea} onChange={setConductorArea} min={300} max={3000} step={100} suffix="mm²" />
        <SideInput label="Number of Cables" value={numCables} onChange={setNumCables} min={1} max={6} step={1} />
        <SideInput label="Burial Depth (m)" value={burialDepth} onChange={setBurialDepth} min={0.5} max={3} step={0.5} suffix="m" />
      </Section>
      <Section title="Onshore Substation">
        <SideSelect label="Grid Voltage" value={gridVoltage} onChange={setGridVoltage} options={GRID_VOLTAGES} />
        <SideInput label="Transformer Capacity (MVA)" value={transformerCapMVA} onChange={setTransformerCapMVA} min={100} max={2000} step={50} />
        <SideInput label="Reactive Compensation (MVAR)" value={reactiveCompMVAR} onChange={setReactiveCompMVAR} min={0} max={600} step={25} />
        <SideInput label="Land Cost ($M)" value={landCostM} onChange={setLandCostM} min={1} max={80} step={1} />
      </Section>
      <Section title="Offshore Substation">
        <SideSelect label="Platform Type" value={platformType} onChange={setPlatformType} options={PLATFORM_TYPES} />
        <SideInput label="Platform Weight (T)" value={platformWeightT} onChange={setPlatformWeightT} min={500} max={12000} step={500} />
        <SideInput label="OSS Transformer (MVA)" value={ossTxMVA} onChange={setOssTxMVA} min={100} max={2000} step={50} />
        <SideInput label="Number of Platforms" value={numPlatforms} onChange={setNumPlatforms} min={1} max={4} step={1} />
        <SideInput label="Platform Cost ($M)" value={platformCostM} onChange={setPlatformCostM} min={30} max={600} step={10} />
      </Section>
      <Section title="Losses & Reliability">
        <SideInput label="Load Factor (%)" value={loadFactor} onChange={setLoadFactor} min={20} max={65} step={1} suffix="%" />
        <SideInput label="MTBF Cable (hrs)" value={mtbfCable} onChange={setMtbfCable} min={20000} max={200000} step={5000} />
        <SideInput label="Repair Time (days)" value={repairDays} onChange={setRepairDays} min={5} max={180} step={5} />
        <SideInput label="Fault Freq (per 100km/yr)" value={faultFreq} onChange={setFaultFreq} min={0.01} max={0.5} step={0.01} />
      </Section>
      <Section title="Financial">
        <SideInput label="Cable Cost ($/m installed)" value={cableCostPerM} onChange={setCableCostPerM} min={300} max={4000} step={100} />
        <SideInput label="Substation Cost ($M)" value={substationCostM} onChange={setSubstationCostM} min={50} max={800} step={10} />
        <SideInput label="Annual O&M (%)" value={annualOM} onChange={setAnnualOM} min={0.5} max={5} step={0.1} suffix="%" />
        <SideInput label="Discount Rate (%)" value={discountRate} onChange={setDiscountRate} min={3} max={15} step={0.5} suffix="%" />
        <SideInput label="Asset Life (yrs)" value={assetLife} onChange={setAssetLife} min={10} max={40} step={1} />
      </Section>
    </div>
  );

  const quickStats = (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
      <KpiCard label="Grid CAPEX" value={fmtM(calcs.totalCapexM)} color={T.indigo} />
      <KpiCard label="Cable Loss" value={fmtPct(calcs.lossPct)} color={calcs.lossPct > 3 ? T.red : T.green} />
      <KpiCard label="Revenue Loss" value={fmtM(calcs.annualRevenueLossM)} unit="per year" color={T.amber} />
      <KpiCard label="Grid LCOE" value={`$${fmt(calcs.gridLcoe, 2)}`} unit="$/MWh" color={T.teal} />
    </div>
  );

  // Tab content renderers
  const renderOverview = () => {
    const costPie = [
      { name: 'Cable Supply', value: parseFloat(calcs.cableSupplyCostM.toFixed(1)) },
      { name: 'Installation', value: parseFloat(calcs.installationCostM.toFixed(1)) },
      { name: 'Offshore SS', value: parseFloat(calcs.offshoreSsCostM.toFixed(1)) },
      { name: 'Onshore SS', value: parseFloat(calcs.onshoreSsCostM.toFixed(1)) },
    ];
    const PIE_COLORS = [T.indigo, T.teal, T.accent, T.blue];
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <KpiCard label="Total Grid CAPEX" value={fmtM(calcs.totalCapexM)} color={T.indigo} />
          <KpiCard label="Cable Loss" value={fmtPct(calcs.lossPct)} color={calcs.lossPct > 3 ? T.red : T.green} />
          <KpiCard label="Annual Energy Loss" value={`${fmt(calcs.annualEnergyLossGWh)} GWh`} color={T.amber} />
          <KpiCard label="Availability" value={`${fmt(calcs.availability)}%`} color={calcs.availability > 98 ? T.green : T.red} />
          <KpiCard label="Grid LCOE" value={`$${fmt(calcs.gridLcoe, 2)}/MWh`} color={T.teal} />
          <KpiCard label="NPV Loss" value={fmtM(calcs.npvLossM)} color={T.red} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 12 }}>System Schematic</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.text, lineHeight: 2.2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: `Wind Farm\n${capacityMW} MW`, color: T.green },
                { arrow: true },
                { label: `Array Cables\n${arrayCableVoltage}`, color: T.teal },
                { arrow: true },
                { label: `Offshore SS\n${platformType}`, color: T.indigo },
                { arrow: true },
                { label: `Export Cable\n${exportType}`, color: T.blue },
                { arrow: true },
                { label: `Onshore SS\n${gridVoltage}`, color: T.accent },
                { arrow: true },
                { label: `National Grid`, color: T.navy },
              ].map((item, i) => item.arrow ? (
                <div key={i} style={{ color: T.sub, fontSize: 16 }}>→</div>
              ) : (
                <div key={i} style={{ background: item.color, color: '#fff', padding: '6px 12px', borderRadius: 6, textAlign: 'center', minWidth: 90, fontSize: 10, lineHeight: 1.5, whiteSpace: 'pre' }}>{item.label}</div>
              ))}
            </div>
          </div>
        </div>
        <ChartBox title="CAPEX Breakdown" height={240}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={costPie} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: $${value}M`} labelLine={false}>
                {costPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => [`$${v}M`]} />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    );
  };

  const renderCableSizing = () => {
    const vLevels = [33, 66, 132, 220];
    const voltageDrop = CONDUCTOR_DATA.map(c => {
      const row = [`${c.area} mm²`, conductorMaterial === 'Cu' ? `${c.cuRating} A` : `${c.alRating} A`];
      vLevels.forEach(v => {
        const loss = cableLoss(capacityMW / numCables, v, c.resistance33, distanceKm);
        row.push(`${fmt(loss.lossPct, 2)}%`);
      });
      const currentLoad = capacityMW / numCables / (Math.sqrt(3) * calcs.exportVoltage);
      const rating = conductorMaterial === 'Cu' ? c.cuRating : c.alRating;
      const thermOk = currentLoad * 1000 <= rating;
      row.push(<span style={{ color: thermOk ? T.green : T.red, fontWeight: 700 }}>{thermOk ? '✓ OK' : '✗ Over'}</span>);
      return row;
    });
    const rlcData = [
      { type: '33kV XLPE', R: '0.0601', X: '0.100', C: '0.35', charging: '0.59', maxLen: '~50 km AC' },
      { type: '66kV XLPE', R: '0.0601', X: '0.110', C: '0.25', charging: '0.68', maxLen: '~80 km AC' },
      { type: '132kV XLPE', R: '0.0180', X: '0.120', C: '0.20', charging: '0.82', maxLen: '~120 km AC' },
      { type: '220kV XLPE', R: '0.0120', X: '0.130', C: '0.15', charging: '0.95', maxLen: '~200 km AC' },
      { type: 'HVDC ±320kV MI', R: '0.0120', X: '0', C: '0.22', charging: '—', maxLen: 'Unlimited' },
      { type: 'HVDC ±525kV PP', R: '0.0080', X: '0', C: '0.19', charging: '—', maxLen: 'Unlimited' },
    ];
    const thermalData = CONDUCTOR_DATA.map(c => ({
      area: c.area,
      cuRating: c.cuRating,
      alRating: c.alRating,
      cuResist: parseFloat((c.resistance33).toFixed(4)),
    }));
    const optimalRow = CONDUCTOR_DATA.find(c => {
      const rating = conductorMaterial === 'Cu' ? c.cuRating : c.alRating;
      const load = capacityMW / numCables / (Math.sqrt(3) * calcs.exportVoltage) * 1000;
      return rating >= load;
    });
    const voltDropChart = vLevels.map(v => ({
      voltage: `${v}kV`,
      lossPct: parseFloat(cableLoss(capacityMW / numCables, v, 0.028, distanceKm).lossPct.toFixed(3)),
      lossGWh: parseFloat((calcs.annualGenGWh * cableLoss(capacityMW / numCables, v, 0.028, distanceKm).lossPct / 100).toFixed(1)),
    }));
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="Optimal Conductor" value={optimalRow ? `${optimalRow.area} mm²` : 'N/A'} color={T.green} />
          <KpiCard label="Design Current" value={`${fmt(capacityMW / numCables / (Math.sqrt(3) * calcs.exportVoltage) * 1000, 0)} A`} />
          <KpiCard label="Selected Voltage" value={`${calcs.exportVoltage} kV`} color={T.indigo} />
          <KpiCard label="Cables in Parallel" value={`${numCables}`} />
        </div>
        <Section title="Conductor Sizing Matrix — Loss % by Voltage Level">
          <Table
            headers={['Area', 'Rating', '33kV Loss%', '66kV Loss%', '132kV Loss%', '220kV Loss%', 'Thermal Check']}
            rows={voltageDrop}
            small
          />
        </Section>
        <Section title="Cable Electrical Parameters per km">
          <Table
            headers={['Cable Type', 'R (Ω/km)', 'X (Ω/km)', 'C (μF/km)', 'Charging (A/km)', 'Max AC Length']}
            rows={rlcData.map(r => [r.type, r.R, r.X, r.C, r.charging, r.maxLen])}
          />
        </Section>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <ChartBox title="Current Rating by Conductor Area (A)" height={200}>
            <ResponsiveContainer>
              <BarChart data={thermalData}>
                <XAxis dataKey="area" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="cuRating" name="Cu (A)" fill={T.indigo} />
                <Bar dataKey="alRating" name="Al (A)" fill={T.teal} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
          <ChartBox title="Cable Loss % by Voltage Level" height={200}>
            <ResponsiveContainer>
              <BarChart data={voltDropChart}>
                <XAxis dataKey="voltage" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Bar dataKey="lossPct" name="Loss %" fill={T.red} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>
        <Section title="Design Notes">
          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 12, fontSize: 12, lineHeight: 1.8 }}>
            <strong>Conductor Selection Rule:</strong> Current rating must exceed design current (I_design = P / (√3 × V)) with 10–20% thermal margin.<br />
            <strong>Voltage Drop Limit:</strong> IEC 60287 limits continuous operating temperature to 90°C for XLPE; 50°C for HVDC polymer cables.<br />
            <strong>Reactive Charging Current:</strong> Long AC cables produce charging current that consumes conductor capacity; shunt reactors required beyond critical length.<br />
            <strong>HVDC Advantage:</strong> No reactive charging — ideal for distances beyond AC critical length. Extruded PP-insulated HVDC cables now available at ±525kV.
          </div>
        </Section>
      </div>
    );
  };

  const renderAcHvdc = () => {
    const breakevenDist = breakeven.findIndex(b => b.hvdcLoss < b.acLoss);
    const breakKm = breakevenDist >= 0 ? breakeven[breakevenDist].km : null;
    const acLossNow = cableLoss(capacityMW / numCables, 220, 0.028, distanceKm).lossPct * numCables;
    const hvdcLossNow = 1.4 + 0.002 * distanceKm;
    const annualSavingM = Math.max(0, acLossNow - hvdcLossNow) / 100 * calcs.annualGenGWh * calcs.ppaPriceMWh / 1000;
    const hvdcPremiumM = calcs.totalCableCostM * 0.30;
    const paybackYrs = annualSavingM > 0 ? hvdcPremiumM / annualSavingM : 999;
    const techRows = [
      ['AC 132kV XLPE', '2–5%', '~50 km', 'Passive', 'Shunt reactor required', '+0% (baseline)', 'Transitional distance'],
      ['AC 220kV XLPE', '1–3%', '~80 km', 'Passive', 'Shunt reactor + SVC', '+15%', 'Optimal to 80km'],
      ['HVDC-VSC ±320kV', '1.5–2.5%', 'Unlimited', 'Full active control', 'Self-commutating', '+30%', 'Industry standard >80km'],
      ['HVDC-VSC ±525kV', '1.2–2.0%', 'Unlimited', 'Full active control', 'Self-commutating', '+45%', 'Next generation (PP cable)'],
      ['HVDC-LCC (classic)', '0.7–1.2%', 'Unlimited', 'Active (thyristor)', 'Consumes 50–60% MW reactive', '+25%', 'Legacy; not for new OWF'],
    ];
    const costDiffData = breakeven.filter((_, i) => i % 3 === 0).map(b => ({
      km: b.km,
      acTotal: parseFloat((calcs.onshoreSsCostM + calcs.offshoreSsCostM + b.km * 1000 * numCables * 1.08 * cableCostPerM / 1e6 + b.km * numCables * 0.8).toFixed(1)),
      hvdcTotal: parseFloat((calcs.onshoreSsCostM + calcs.offshoreSsCostM + b.km * 1000 * numCables * 1.08 * cableCostPerM * 1.15 / 1e6 + b.km * numCables * 0.8 + 80).toFixed(1)),
    }));
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="AC Loss @ Current" value={fmtPct(acLossNow)} color={T.red} />
          <KpiCard label="HVDC Loss @ Current" value={fmtPct(hvdcLossNow)} color={T.green} />
          <KpiCard label="Breakeven Distance" value={breakKm ? `${breakKm} km` : '>320 km'} color={T.accent} />
          <KpiCard label="Annual HVDC Saving" value={fmtM(annualSavingM)} color={annualSavingM > 0 ? T.green : T.sub} />
          <KpiCard label="HVDC Premium Payback" value={paybackYrs < 50 ? `${fmt(paybackYrs, 1)} yr` : 'N/A'} color={paybackYrs < 15 ? T.green : T.red} />
        </div>
        <ChartBox title={`AC vs HVDC Loss Crossover — ${capacityMW} MW Farm`} height={230}>
          <ResponsiveContainer>
            <LineChart data={breakeven}>
              <XAxis dataKey="km" tick={{ fontSize: 10 }} label={{ value: 'Distance (km)', position: 'insideBottom', offset: -2 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip formatter={v => [`${fmt(v, 2)}%`]} />
              <ReferenceLine x={distanceKm} stroke={T.accent} strokeDasharray="4 2" label={{ value: `Current ${distanceKm}km`, fontSize: 9 }} />
              {breakKm && <ReferenceLine x={breakKm} stroke={T.green} strokeDasharray="6 2" label={{ value: `Breakeven ${breakKm}km`, fontSize: 9 }} />}
              <Line type="monotone" dataKey="acLoss" name="AC 220kV Loss %" stroke={T.red} dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="hvdcLoss" name="HVDC ±320kV Loss %" stroke={T.indigo} dot={false} strokeWidth={2} />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Total Grid CAPEX: AC vs HVDC by Distance ($M)" height={210}>
          <ResponsiveContainer>
            <LineChart data={costDiffData}>
              <XAxis dataKey="km" tick={{ fontSize: 10 }} label={{ value: 'Distance (km)', position: 'insideBottom', offset: -2 }} />
              <YAxis tick={{ fontSize: 10 }} unit="M" />
              <Tooltip formatter={v => [`$${v}M`]} />
              <ReferenceLine x={distanceKm} stroke={T.accent} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="acTotal" name="AC Total CAPEX ($M)" stroke={T.red} dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="hvdcTotal" name="HVDC Total CAPEX ($M)" stroke={T.indigo} dot={false} strokeWidth={2} />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>
        <Section title="Technology Detailed Comparison">
          <Table headers={['Technology', 'Losses', 'Max AC Length', 'Power Control', 'Reactive Power', 'Cost Premium', 'Use Case']} rows={techRows} small />
        </Section>
        <Section title="Selection Guidance">
          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 12, fontSize: 12, lineHeight: 1.8 }}>
            <strong>Rule of thumb:</strong> HVDC VSC becomes economically favourable above ~80km for 1GW projects (higher capacity pushes breakeven closer to 50–60km due to higher AC losses).<br />
            <strong>Current configuration:</strong> {distanceKm}km with {capacityMW}MW → {distanceKm > (breakKm || 80) ? 'HVDC recommended' : 'AC remains cost-competitive'}.<br />
            <strong>HVDC VSC advantages beyond losses:</strong> Black start capability, synthetic inertia, asymmetric power flow control, no risk of AC subsea resonance.<br />
            <strong>Key HVDC cost drivers:</strong> Converter stations ($60–120M each), cable (PP insulation premium vs XLPE), subsea jointing, FAT/SAT testing.
          </div>
        </Section>
      </div>
    );
  };

  const renderGridLoss = () => {
    const distPoints = Array.from({ length: 15 }, (_, i) => {
      const km = 20 + i * 20;
      const loss = calcs.isHVDC ? 1.4 + 0.002 * km : cableLoss(capacityMW / numCables, calcs.exportVoltage, 0.028, km).lossPct * numCables;
      const lossGWh = calcs.annualGenGWh * loss / 100;
      const costM = lossGWh * calcs.ppaPriceMWh / 1000;
      return { km, loss: parseFloat(loss.toFixed(3)), lossGWh: parseFloat(lossGWh.toFixed(1)), costM: parseFloat(costM.toFixed(2)) };
    });
    const peakLoss = cableLoss(capacityMW / numCables, calcs.exportVoltage, 0.028, distanceKm);
    const avgLoss = peakLoss.lossPct * (loadFactor / 100);
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="Peak Loss %" value={fmtPct(calcs.lossPct)} color={T.red} />
          <KpiCard label="Annual Energy Loss" value={`${fmt(calcs.annualEnergyLossGWh)} GWh`} color={T.amber} />
          <KpiCard label="Annual Loss Cost" value={fmtM(calcs.annualRevenueLossM)} color={T.accent} />
          <KpiCard label="Reactive Comp Needed" value={`${fmt(reactiveCompMVAR)} MVAR`} color={T.teal} />
        </div>
        <ChartBox title="Loss % vs Cable Distance" height={220}>
          <ResponsiveContainer>
            <LineChart data={distPoints}>
              <XAxis dataKey="km" tick={{ fontSize: 10 }} label={{ value: 'Distance (km)', position: 'insideBottom', offset: -2 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip formatter={v => [`${v}%`]} />
              <ReferenceLine x={distanceKm} stroke={T.accent} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="loss" name="Cable Loss %" stroke={T.red} dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Annual Loss Cost vs Distance ($M/yr)" height={200}>
          <ResponsiveContainer>
            <BarChart data={distPoints}>
              <XAxis dataKey="km" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="M" />
              <Tooltip formatter={v => [`$${v}M`]} />
              <Bar dataKey="costM" name="Revenue Loss $M" fill={T.red} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <Section title="Loss Calculation Detail">
          <Table
            headers={['Parameter', 'Value']}
            rows={[
              ['Formula', 'I²R × Length × Load Factor × 8760h'],
              ['Peak Current (kA)', fmt(capacityMW / numCables / (Math.sqrt(3) * calcs.exportVoltage), 3)],
              ['Resistance (Ω/km)', '0.028'],
              ['Peak Loss (kW)', fmt(peakLoss.lossKw, 0)],
              ['Peak Loss %', fmtPct(calcs.lossPct)],
              ['Avg Loss (load-wtd) %', fmtPct(calcs.lossPct * loadFactor / 100)],
              ['Annual Energy Loss (GWh)', fmt(calcs.annualEnergyLossGWh, 1)],
              ['PPA Price ($/MWh)', fmt(calcs.ppaPriceMWh, 2)],
              ['Annual Revenue Loss ($M)', fmtM(calcs.annualRevenueLossM)],
            ]}
          />
        </Section>
      </div>
    );
  };

  const renderCableCost = () => {
    const distSens = Array.from({ length: 12 }, (_, i) => {
      const km = 20 + i * 25;
      const cableM = km * 1000 * numCables * 1.08 * cableCostPerM / 1e6;
      const installM = km * numCables * 0.8;
      const total = cableM + installM + calcs.onshoreSsCostM + calcs.offshoreSsCostM;
      return { km, cableM: parseFloat(cableM.toFixed(1)), installM: parseFloat(installM.toFixed(1)), total: parseFloat(total.toFixed(1)) };
    });
    const capacitySens = Array.from({ length: 10 }, (_, i) => {
      const mw = 200 + i * 300;
      const cables = mw > 1000 ? 2 : 1;
      const cableM = distanceKm * 1000 * cables * 1.08 * cableCostPerM / 1e6;
      const installM = distanceKm * cables * 0.8;
      const total = cableM + installM + calcs.onshoreSsCostM + calcs.offshoreSsCostM;
      const perMW = mw > 0 ? total * 1e6 / mw / 1000 : 0;
      return { mw, total: parseFloat(total.toFixed(1)), perMW: parseFloat(perMW.toFixed(0)) };
    });
    const costDrivers = [
      { driver: 'Cable conductor area', sensitivity: 'High', range: '±15–25% cable cost', notes: '300mm² vs 3000mm² is 4× material cost' },
      { driver: 'Cable length (distance)', sensitivity: 'Very High', range: 'Linear above fixed SS cost', notes: 'SS cost fixed; cable cost scales linearly' },
      { driver: 'Number of cables', sensitivity: 'High', range: '×1.9 for 2nd cable (not 2×)', notes: 'Shared mobilization reduces marginal cost' },
      { driver: 'Conductor material (Cu vs Al)', sensitivity: 'Medium', range: '±5–10%', notes: 'Cu costs ~3× Al by weight; offset by smaller area' },
      { driver: 'Water depth / burial depth', sensitivity: 'Medium', range: '±10–20% installation', notes: 'Deep burial: rock-dump adds $50–150k/km' },
      { driver: 'Cable voltage level', sensitivity: 'Medium', range: '±5–15%', notes: 'Thicker insulation at higher voltage = higher $/m' },
      { driver: 'HVDC vs AC', sensitivity: 'High', range: '+25–45% overall', notes: 'Converter station adds $60–120M fixed cost each end' },
    ];
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="Cable Supply" value={fmtM(calcs.cableSupplyCostM)} />
          <KpiCard label="Installation" value={fmtM(calcs.installationCostM)} />
          <KpiCard label="Offshore SS" value={fmtM(calcs.offshoreSsCostM)} />
          <KpiCard label="Onshore SS" value={fmtM(calcs.onshoreSsCostM)} />
          <KpiCard label="Total Grid CAPEX" value={fmtM(calcs.totalCapexM)} color={T.indigo} />
        </div>
        <Section title="Detailed CAPEX Breakdown">
          <Table
            headers={['Component', 'Cost ($M)', '% of Total', 'Key Driver']}
            rows={[
              ['Cable Supply (conductor + insulation)', fmtM(calcs.cableSupplyCostM), `${calcs.totalCapexM > 0 ? fmt(calcs.cableSupplyCostM / calcs.totalCapexM * 100, 1) : '—'}%`, `${cableCostPerM}$/m × ${fmt(distanceKm * numCables * 1.08, 0)}km`],
              ['Installation (CLV + burial + mobilisation)', fmtM(calcs.installationCostM), `${calcs.totalCapexM > 0 ? fmt(calcs.installationCostM / calcs.totalCapexM * 100, 1) : '—'}%`, 'Vessel day rate + spread'],
              ['Offshore Substation (platform + topsides)', fmtM(calcs.offshoreSsCostM), `${calcs.totalCapexM > 0 ? fmt(calcs.offshoreSsCostM / calcs.totalCapexM * 100, 1) : '—'}%`, `${numPlatforms} platform(s) at $${platformCostM}M`],
              ['Onshore Substation + Land + Reactive Comp', fmtM(calcs.onshoreSsCostM), `${calcs.totalCapexM > 0 ? fmt(calcs.onshoreSsCostM / calcs.totalCapexM * 100, 1) : '—'}%`, `${gridVoltage} grid interface`],
              ['TOTAL', fmtM(calcs.totalCapexM), '100%', '—'],
            ]}
          />
        </Section>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <ChartBox title="Total CAPEX vs Distance ($M)" height={210}>
            <ResponsiveContainer>
              <LineChart data={distSens}>
                <XAxis dataKey="km" tick={{ fontSize: 10 }} label={{ value: 'Distance (km)', position: 'insideBottom', offset: -2 }} />
                <YAxis tick={{ fontSize: 10 }} unit="M" />
                <Tooltip formatter={v => [`$${v}M`]} />
                <ReferenceLine x={distanceKm} stroke={T.accent} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="total" name="Total CAPEX ($M)" stroke={T.indigo} dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="cableM" name="Cable Supply ($M)" stroke={T.teal} dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>
          <ChartBox title="Grid CAPEX per MW vs Farm Size ($k/MW)" height={210}>
            <ResponsiveContainer>
              <LineChart data={capacitySens}>
                <XAxis dataKey="mw" tick={{ fontSize: 10 }} label={{ value: 'Farm MW', position: 'insideBottom', offset: -2 }} />
                <YAxis tick={{ fontSize: 10 }} unit="k" />
                <Tooltip formatter={v => [`$${v}k/MW`]} />
                <ReferenceLine x={capacityMW} stroke={T.accent} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="perMW" name="$/MW (000s)" stroke={T.red} dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>
        <Section title="Key Cost Drivers & Sensitivity">
          <Table
            headers={['Cost Driver', 'Sensitivity', 'Range', 'Notes']}
            rows={costDrivers.map(d => [d.driver, d.sensitivity, d.range, d.notes])}
            small
          />
        </Section>
      </div>
    );
  };

  const renderOffshoreSubstation = () => {
    const ptData = [
      { type: 'Jacket', depthRange: '20–60 m', costMultiplier: 1.0, weightT: 3000, topsides: 4500, installVessel: 'HLV', installDays: 45, pros: 'Proven, low risk', cons: 'Depth limited (<60m)' },
      { type: 'Monopile', depthRange: '5–40 m', costMultiplier: 0.85, weightT: 1800, topsides: 4200, installVessel: 'JUV', installDays: 25, pros: 'Lowest cost, fastest install', cons: 'Shallow only, soft soils risk' },
      { type: 'Floating (semi-sub)', depthRange: '>60 m', costMultiplier: 1.8, weightT: 5000, topsides: 4800, installVessel: 'AHT + Mooring', installDays: 90, pros: 'Any depth, no piling', cons: 'Higher cost, new tech, dynamic cables' },
      { type: 'Gravity Base', depthRange: '5–30 m', costMultiplier: 1.1, weightT: 8000, topsides: 4300, installVessel: 'Semi-sub barge', installDays: 35, pros: 'Very stable, no piling', cons: 'Seabed prep, heavy, scour risk' },
    ];
    const txTypes = [
      ['Gas-Insulated (GIS)', 'Compact (60% smaller), no fire risk, hermetic', '+10–15% cost', '132kV–525kV', 'All offshore platforms', 'ABB, Siemens, GE'],
      ['Oil-Insulated (ONAN)', 'Lower cost, mature technology', 'Fire risk offshore, oil spill exposure', '132kV–220kV', 'Jacket + bund required', 'Areva, ABB classic'],
      ['Dry-Type (resin)', 'No spill risk, lightweight', 'Larger, heavier, 66kV limit', 'Up to 66kV', 'Array substations only', 'Eaton, ABB'],
    ];
    const harmonicData = [
      { order: '5th', freq: '250Hz', source: 'VSC converter', level: 'High', mitigation: 'LCL filter + active damping' },
      { order: '7th', freq: '350Hz', source: 'VSC converter', level: 'High', mitigation: 'Passive L filter' },
      { order: '11th', freq: '550Hz', source: 'LCC converter', level: 'Medium', mitigation: 'C-type filter bank' },
      { order: '13th', freq: '650Hz', source: 'LCC converter', level: 'Medium', mitigation: 'C-type filter bank' },
      { order: '23rd+', freq: '>1kHz', source: 'Switching', level: 'Low', mitigation: 'High-freq choke' },
    ];
    const rec = waterDepth <= 40 ? 'Monopile' : waterDepth <= 60 ? 'Jacket' : 'Floating (semi-sub)';
    const recData = ptData.find(p => p.type.startsWith(rec.split(' ')[0])) || ptData[0];
    const costScale = platformCostM * numPlatforms * recData.costMultiplier;
    const platformCostChart = ptData.map(p => ({
      type: p.type.split(' ')[0],
      costM: parseFloat((platformCostM * numPlatforms * p.costMultiplier).toFixed(1)),
      installDays: p.installDays,
    }));
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="Platform Type" value={platformType} color={T.indigo} />
          <KpiCard label="Platform Weight" value={`${platformWeightT.toLocaleString()} T`} />
          <KpiCard label="Topsides Weight (est.)" value={`${fmt(platformWeightT * 1.3, 0)} T`} />
          <KpiCard label="Total OSS CAPEX" value={fmtM(platformCostM * numPlatforms)} color={T.accent} />
          <KpiCard label="Transformer Capacity" value={`${ossTxMVA} MVA`} />
        </div>
        <Section title="Platform Type Comparison">
          <Table
            headers={['Type', 'Depth Range', 'Cost Mult.', 'Substructure (T)', 'Topsides (T)', 'Install Vessel', 'Install (days)', 'Pros', 'Cons']}
            rows={ptData.map(p => [p.type, p.depthRange, `×${p.costMultiplier}`, p.weightT.toLocaleString(), p.topsides.toLocaleString(), p.installVessel, p.installDays, p.pros, p.cons])}
            small
          />
        </Section>
        <Section title="Transformer Type Selection">
          <Table
            headers={['Type', 'Advantages', 'Disadvantages', 'Voltage Range', 'Application', 'Suppliers']}
            rows={txTypes}
            small
          />
        </Section>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <ChartBox title="OSS CAPEX by Platform Type ($M)" height={200}>
            <ResponsiveContainer>
              <BarChart data={platformCostChart}>
                <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="M" />
                <Tooltip formatter={v => [`$${v}M`]} />
                <Bar dataKey="costM" name="CAPEX ($M)" fill={T.indigo} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
          <ChartBox title="Installation Duration by Platform (days)" height={200}>
            <ResponsiveContainer>
              <BarChart data={platformCostChart}>
                <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit=" d" />
                <Tooltip />
                <Bar dataKey="installDays" name="Days" fill={T.teal} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>
        <Section title="Harmonic Filter Requirements (HVDC VSC)">
          <Table
            headers={['Harmonic Order', 'Frequency', 'Source', 'Level', 'Mitigation']}
            rows={harmonicData.map(h => [h.order, h.freq, h.source, h.level, h.mitigation])}
            small
          />
        </Section>
        <Section title="Platform Recommendation">
          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 12, fontSize: 12, lineHeight: 1.8 }}>
            <strong>Water Depth: {waterDepth}m →</strong>{' '}
            {waterDepth <= 40 ? 'Monopile OSS recommended. Lowest cost and fastest installation. JUV (jack-up vessel) can handle installation with minimal weather delay.' :
              waterDepth <= 60 ? 'Jacket OSS recommended. Well-proven for this depth range. HLV required for installation. Ensure geotechnical survey for pile design.' :
                'Floating semi-submersible OSS required. Emerging technology — only 2–3 projects globally. Dynamic cable required. Budget 80% contingency on platform cost.'}
            <br />
            <strong>Transformer:</strong> Specify GIS above 66kV for all offshore platforms. Oil-filled banned by most EU environmental regulations for new projects offshore.<br />
            <strong>Secondary Systems:</strong> Diesel generators ({Math.round(capacityMW * 0.002)} MW), HVAC, HVDC control building, fire detection, crane (80T SWL minimum).
          </div>
        </Section>
      </div>
    );
  };

  const renderCableRouting = () => {
    const routeMultiplier = 1.05 + sr(distanceKm * 7) * 0.25;
    const actualLength = distanceKm * routeMultiplier;
    const crossings = Math.floor(sr(distanceKm * 13) * 8) + 1;
    const crossingCostM = crossings * (0.5 + sr(distanceKm * 17) * 1.5);
    const protectedAreaAvoid = sr(distanceKm * 23) > 0.4;
    const shoreLandingCost = 2 + sr(distanceKm * 31) * 8;
    const routeSegs = [
      { segment: 'Offshore (deep)', length: fmt(distanceKm * 0.45, 1), depth: `${waterDepth}m`, constraint: 'None', protection: 'Burial 1m' },
      { segment: 'Offshore (shallow)', length: fmt(distanceKm * 0.30, 1), depth: '5–20m', constraint: 'Fishing, anchoring', protection: 'Burial 1.5m + rock dump' },
      { segment: 'Intertidal zone', length: fmt(distanceKm * 0.05, 1), depth: '0–5m', constraint: 'Sandbank, ecology', protection: 'HDD or mattress' },
      { segment: 'Shore approach (HDD)', length: '0.5–2', depth: 'Onshore', constraint: 'Coastal infrastructure', protection: 'HDD trenchless' },
      { segment: 'Onshore landfall to SS', length: fmt(distanceKm * 0.05 + 0.5, 1), depth: 'Land', constraint: 'Roads, rail, utilities', protection: 'Duct bank' },
    ];
    const vesselData = [
      { vessel: 'Cable Lay Vessel (CLV)', role: 'Primary cable installation', dayRate: '$120–180k', speed: '2–4 km/day (deep)', availability: '12 months/yr' },
      { vessel: 'Cable Burial Vehicle (CBV) / ROV', role: 'Post-lay burial', dayRate: '$25–60k', speed: '1–3 km/day', availability: '8 months/yr (weather)' },
      { vessel: 'Survey Vessel', role: 'Route survey, pre/post-lay inspection', dayRate: '$20–35k', speed: '5 km/day', availability: '12 months/yr' },
      { vessel: 'Guard Vessel', role: 'Exclusion zone, shore approach', dayRate: '$8–15k', speed: 'Stationed', availability: 'During ops only' },
    ];
    const permitTimeline = [
      { activity: 'Marine survey & route selection', duration: '3–6 months', agency: 'Internal' },
      { activity: 'Scoping & EIA', duration: '6–12 months', agency: `${country === 'UK' ? 'Marine Management Organisation' : country === 'Germany' ? 'BSH' : 'National marine authority'}` },
      { activity: 'MPA consultation', duration: '3–9 months', agency: 'Conservation bodies' },
      { activity: 'Pipeline crossing agreement', duration: '6–18 months', agency: 'Pipeline operator' },
      { activity: 'Shipping lane permit', duration: '3–6 months', agency: 'Port / coastguard' },
      { activity: 'Shore crossing permit (HDD)', duration: '6–12 months', agency: 'Local planning authority' },
      { activity: 'Total pre-construction consenting', duration: '18–36 months total', agency: '—' },
    ];
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="Direct Distance" value={`${distanceKm} km`} />
          <KpiCard label="Route Multiplier" value={`×${fmt(routeMultiplier, 3)}`} color={T.amber} />
          <KpiCard label="Actual Route Length" value={`${fmt(actualLength, 1)} km`} />
          <KpiCard label="Cable Crossings" value={`${crossings}`} color={T.red} />
          <KpiCard label="Route Additions Cost" value={fmtM(crossingCostM + shoreLandingCost)} color={T.accent} />
        </div>
        <Section title="Route Segment Analysis">
          <Table
            headers={['Segment', 'Length (km)', 'Depth', 'Key Constraint', 'Protection Method']}
            rows={routeSegs.map(r => [r.segment, r.length, r.depth, r.constraint, r.protection])}
          />
        </Section>
        <Section title="Cost Impact Summary">
          <Table
            headers={['Factor', 'Value', 'Cost Impact']}
            rows={[
              ['Direct Distance', `${distanceKm} km`, 'Baseline'],
              ['Actual Route Length', `${fmt(actualLength, 1)} km`, `+${fmt((routeMultiplier - 1) * 100, 1)}% cable material`],
              ['Pipeline / Cable Crossings', `${crossings} crossings`, fmtM(crossingCostM)],
              ['Protected Area Avoidance', protectedAreaAvoid ? 'Required' : 'Not Required', protectedAreaAvoid ? '$2–8M' : '$0'],
              ['Shore Landing (HDD)', `${country} approach`, fmtM(shoreLandingCost)],
              ['Burial Depth Premium', `${burialDepth}m`, `+${fmt(burialDepth * 12, 0)}% vessel day rate`],
              ['Route Additions Total', '—', fmtM(crossingCostM + shoreLandingCost)],
            ]}
          />
        </Section>
        <Section title="Installation Vessel Fleet">
          <Table
            headers={['Vessel Type', 'Role', 'Day Rate', 'Installation Speed', 'Availability Window']}
            rows={vesselData.map(v => [v.vessel, v.role, v.dayRate, v.speed, v.availability])}
            small
          />
        </Section>
        <Section title="Consenting & Permit Timeline">
          <Table
            headers={['Activity', 'Duration', 'Agency']}
            rows={permitTimeline.map(p => [p.activity, p.duration, p.agency])}
          />
        </Section>
      </div>
    );
  };

  const renderGridCode = () => {
    const countryReqs = {
      UK: { code: 'UK Grid Code + OREI CC', freq: '49.5–50.5 Hz', rampRate: '10 MW/min', frt: '140ms clear, ride-through to 0V', reactive: 'Q = ±0.33 P', blackStart: 'BSP tender (ESO)', inertia: 'Grid-forming inverters (2026 mandate)', voltCtrl: 'Automatic voltage control (AVC)' },
      Germany: { code: 'EntsoE NC RfG Cat C', freq: '47.5–51.5 Hz', rampRate: '10% Pmax/min', frt: '150ms clear, 0.85pu retain', reactive: '±0.41 P', blackStart: 'TSO mandate (50Hertz)', inertia: 'Synthetic inertia via HVDC (TenneT)', voltCtrl: 'Q(U) control at PoC' },
      Netherlands: { code: 'EntsoE NC RfG', freq: '47.5–51.5 Hz', rampRate: 'As agreed TSO', frt: '140ms, 0.85pu', reactive: '±0.33 P', blackStart: 'Not mandated (TenneT NL)', inertia: 'FFR bid in Imbalance market', voltCtrl: 'SVC/STATCOM at OSS' },
      Denmark: { code: 'Energinet Technical Regulation TR3.2.5', freq: '47.5–52 Hz', rampRate: '10% Pmax/min', frt: '100ms, 0.9pu', reactive: '±0.40 P', blackStart: 'Per tender requirement', inertia: 'Required (Energinet 2024+)', voltCtrl: 'Droop-based Q control' },
      US: { code: 'NERC PRC-024 / FERC Order 2023', freq: '59.5–60.5 Hz', rampRate: 'PPA defined', frt: 'Zone A trip avoidance (LVRT/HVRT)', reactive: 'IEEE 1547 / FERC ±0.44', blackStart: 'FERC-mandated capability', inertia: 'No mandate; state-by-state (CAISO FFR)', voltCtrl: 'ISO interconnection study basis' },
      Taiwan: { code: 'Taipower Grid Code TPC-GC-2022', freq: '59.5–60.5 Hz', rampRate: '10 MW/min', frt: '150ms, 0.85pu', reactive: '±0.33 P', blackStart: 'Under development', inertia: 'Island grid critical — FFR mandatory', voltCtrl: 'STATCOM required at 33kV bus' },
    };
    const req = countryReqs[country] || countryReqs['UK'];
    const allCodes = Object.entries(countryReqs);
    const pqData = Array.from({ length: 21 }, (_, i) => {
      const p = parseFloat((i / 20).toFixed(2));
      const qLim = parseFloat(req.reactive.match(/[\d.]+/)?.[0] || '0.33');
      const qMax = qLim * p;
      return { p, qAbsorb: parseFloat((-qMax).toFixed(3)), qGenerate: parseFloat(qMax.toFixed(3)) };
    });
    const frtCurve = [
      { t: 0, v: 1.0 }, { t: 0.01, v: 0.05 }, { t: 0.14, v: 0.05 }, { t: 0.15, v: 0.15 },
      { t: 0.5, v: 0.50 }, { t: 1.0, v: 0.85 }, { t: 1.5, v: 0.90 }, { t: 3.0, v: 1.0 },
    ];
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="Country" value={country} color={T.navy} />
          <KpiCard label="Reactive Range" value={req.reactive} color={T.teal} />
          <KpiCard label="Freq Range" value={req.freq} color={T.indigo} />
          <KpiCard label="Grid Code" value={req.code.split(' ')[0]} />
        </div>
        <Section title={`Grid Code Requirements — ${country} (${req.code})`}>
          <Table
            headers={['Parameter', 'Requirement']}
            rows={[
              ['Grid Code Standard', req.code],
              ['Operating Frequency Range', req.freq],
              ['Ramp Rate Limit', req.rampRate],
              ['Fault Ride-Through (FRT)', req.frt],
              ['Reactive Power Capability', req.reactive],
              ['Inertia / FFR Requirement', req.inertia],
              ['Voltage Control', req.voltCtrl],
              ['Black Start Capability', req.blackStart],
            ]}
          />
        </Section>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <ChartBox title="P-Q Capability Envelope (pu)" height={220}>
            <ResponsiveContainer>
              <LineChart data={pqData}>
                <XAxis dataKey="p" tick={{ fontSize: 10 }} label={{ value: 'P (pu)', position: 'insideBottom', offset: -2 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: 'Q (pu)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <ReferenceLine y={0} stroke={T.border} />
                <Line type="monotone" dataKey="qGenerate" name="Q Capacitive" stroke={T.green} dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="qAbsorb" name="Q Inductive" stroke={T.red} dot={false} strokeWidth={2} />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>
          <ChartBox title="Fault Ride-Through Voltage Profile" height={220}>
            <ResponsiveContainer>
              <LineChart data={frtCurve}>
                <XAxis dataKey="t" tick={{ fontSize: 10 }} label={{ value: 'Time (s)', position: 'insideBottom', offset: -2 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 1.1]} label={{ value: 'V (pu)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <ReferenceLine y={0.85} stroke={T.amber} strokeDasharray="4 2" label={{ value: 'Post-fault min', fontSize: 9 }} />
                <Line type="linear" dataKey="v" name="Min Voltage (pu)" stroke={T.indigo} dot={{ r: 3 }} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>
        <Section title="Country Grid Code Comparison">
          <Table
            small
            headers={['Country', 'Standard', 'FRT (ms)', 'Reactive', 'Inertia Req.']}
            rows={allCodes.map(([c, r]) => [c, r.code.split(' ')[0], r.frt.split(',')[0], r.reactive, r.inertia.split('(')[0].trim()])}
          />
        </Section>
      </div>
    );
  };

  const renderInterconnection = () => {
    const topologies = [
      { name: 'Radial (N-0)', redundancy: 'N-0', costMult: 1.0, lossOnFault: '100% capacity', recovery: `${repairDays} days`, annualEnergyRiskGWh: calcs.annualGenGWh * 0.01 },
      { name: 'Ring (N-1)', redundancy: 'N-1', costMult: 1.35, lossOnFault: '50% capacity', recovery: 'Immediate', annualEnergyRiskGWh: calcs.annualGenGWh * 0.005 },
      { name: 'Multi-cable (N-1)', redundancy: 'N-1', costMult: 1.40, lossOnFault: '50% capacity', recovery: 'Automatic', annualEnergyRiskGWh: calcs.annualGenGWh * 0.004 },
      { name: 'Dual-purpose Interconnector', redundancy: 'N-1 + trading', costMult: 2.10, lossOnFault: 'Wind only (interconnector stays)', recovery: 'TSO managed', annualEnergyRiskGWh: calcs.annualGenGWh * 0.002 },
    ];
    const perGwCost = capacityMW > 0 ? calcs.totalCapexM / (capacityMW / 1000) : 0;
    const n1CostPremiumM = calcs.totalCapexM * 0.38;
    const energyRiskSavedM = (topologies[0].annualEnergyRiskGWh - topologies[2].annualEnergyRiskGWh) * calcs.ppaPriceMWh / 1000;
    const n1Payback = energyRiskSavedM > 0 ? n1CostPremiumM / energyRiskSavedM : 999;
    const interconnectorExamples = [
      ['NordLink', 'Norway–Germany', 1400, 623, 2021, 'NordLink I/C + OWF export integration planned'],
      ['Viking Link', 'UK–Denmark', 1400, 760, 2023, 'IFA2 model; potential OWF integration'],
      ['LionLink', 'UK–Netherlands', 1800, 650, 2028, 'Wind integration + trading; planned'],
      ['BritNed', 'UK–Netherlands', 1000, 260, 2011, 'Pure interconnector; no OWF integration'],
      ['NSI Green', 'North Sea (concept)', 10000, 3200, 2035, 'EU North Sea Wind Power Hub concept'],
    ];
    const topCostChart = topologies.map(t => ({
      name: t.name.split('(')[0].trim(),
      capexM: parseFloat((calcs.totalCapexM * t.costMult).toFixed(1)),
      energyRiskGWh: parseFloat(t.annualEnergyRiskGWh.toFixed(1)),
    }));
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="Current Topology" value={numCables > 1 ? 'Multi-Cable N-1' : 'Radial N-0'} color={numCables > 1 ? T.green : T.red} />
          <KpiCard label="Cost per GW" value={`$${fmt(perGwCost, 0)}M/GW`} />
          <KpiCard label="N-1 Premium" value={fmtM(n1CostPremiumM)} color={T.amber} />
          <KpiCard label="N-1 Payback" value={`${fmt(Math.min(n1Payback, 99), 1)} yrs`} color={n1Payback < 15 ? T.green : T.red} />
        </div>
        <Section title="Topology Comparison">
          <Table
            headers={['Topology', 'Redundancy', 'Cost Multiplier', 'Loss on Fault', 'Recovery Time', 'Annual Energy Risk (GWh)']}
            rows={topologies.map(t => [t.name, t.redundancy, `×${t.costMult}`, t.lossOnFault, t.recovery, fmt(t.annualEnergyRiskGWh, 1)])}
          />
        </Section>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <ChartBox title="CAPEX by Topology ($M)" height={200}>
            <ResponsiveContainer>
              <BarChart data={topCostChart}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} unit="M" />
                <Tooltip formatter={v => [`$${v}M`]} />
                <Bar dataKey="capexM" name="CAPEX ($M)" fill={T.indigo} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
          <ChartBox title="Annual Energy at Risk by Topology (GWh)" height={200}>
            <ResponsiveContainer>
              <BarChart data={topCostChart}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} unit=" GWh" />
                <Tooltip />
                <Bar dataKey="energyRiskGWh" name="Energy at Risk" fill={T.red} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>
        <Section title="Dual-Purpose Interconnector Examples">
          <Table
            headers={['Link', 'Countries', 'Capacity (MW)', 'Cost ($M)', 'Year', 'Notes']}
            rows={interconnectorExamples.map(r => r)}
            small
          />
        </Section>
        <Section title="Multi-Purpose Interconnector Economics">
          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 12, fontSize: 12, lineHeight: 1.8 }}>
            <strong>Concept:</strong> HVDC export cable also serves as national grid interconnector, sharing cable and converter cost.<br />
            <strong>Cost sharing model:</strong> Wind developer pays for export capacity share; TSO pays for interconnector share (pro-rated on MW).<br />
            <strong>Regulatory barrier:</strong> Requires two national TSO agreement, cross-border capacity allocation (CACM), and ACER review.<br />
            <strong>Revenue upside:</strong> Interconnector capacity can earn market spread revenue during periods of low wind (€5–25/MWh typical spread UK/continent).<br />
            <strong>Estimated savings vs standalone:</strong> 15–25% grid infrastructure CAPEX at equivalent scale.
          </div>
        </Section>
      </div>
    );
  };

  const renderReliability = () => {
    const faultRate = faultFreq * distanceKm * numCables / 100;
    const repairHrs = repairDays * 24;
    const eaend = faultRate * repairHrs * capacityMW * (loadFactor / 100) / 1000;
    const insurancePremiumM = calcs.totalCapexM * (0.003 + sr(distanceKm * 7) * 0.004);
    const availability = calcs.availability;
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mttrData = MONTHS.map((m, i) => {
      const isWinter = i < 2 || i >= 10;
      const isAutumn = i >= 8 && i < 10;
      const weatherFactor = isWinter ? 2.2 + sr(i * 11) * 0.6 : isAutumn ? 1.5 + sr(i * 11) * 0.4 : 1.0 + sr(i * 11) * 0.25;
      const vesselAvail = isWinter ? 0.4 + sr(i * 17) * 0.2 : 0.85 + sr(i * 17) * 0.1;
      return {
        month: m,
        mttr: parseFloat((repairDays * weatherFactor).toFixed(1)),
        weatherFactor: parseFloat(weatherFactor.toFixed(2)),
        vesselAvail: parseFloat((vesselAvail * 100).toFixed(0)),
      };
    });
    const faultModeData = [
      { mode: 'Cable joint failure', share: 32, mttr: fmt(repairDays * 1.2, 0), cause: 'Thermo-mechanical fatigue', depth: 'Any' },
      { mode: 'Anchor/trawl damage', share: 28, mttr: fmt(repairDays * 1.5, 0), cause: 'Third-party activity', depth: '<30m' },
      { mode: 'Insulation breakdown', share: 18, mttr: fmt(repairDays * 1.8, 0), cause: 'Overvoltage, water ingress', depth: 'Any' },
      { mode: 'Cable termination failure', share: 12, mttr: fmt(repairDays * 0.8, 0), cause: 'Partial discharge', depth: 'J-tube' },
      { mode: 'Corrosion / erosion', share: 6, mttr: fmt(repairDays * 2.0, 0), cause: 'Electrochemical', depth: 'Intertidal' },
      { mode: 'Ship anchor strike', share: 4, mttr: fmt(repairDays * 1.3, 0), cause: 'Navigation incident', depth: '<50m' },
    ];
    const insuranceItems = [
      ['Marine All-Risk (construction)', `${fmt(calcs.totalCapexM * 0.0025, 2)}% of CAPEX`, fmtM(calcs.totalCapexM * 0.0025)],
      ['Loss of Revenue (LOR)', `${fmt(eaend * calcs.ppaPriceMWh / 1000 * 0.012, 2)} % of rev loss`, fmtM(eaend * calcs.ppaPriceMWh / 1000 * 0.012)],
      ['Third-Party Liability', '£50M limit', '$0.5–2M annual'],
      ['Cable Repair Insurance', `Per ${distanceKm}km route`, fmtM(calcs.totalCapexM * (0.003 + sr(distanceKm * 7) * 0.004))],
    ];
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="Grid Availability" value={`${fmt(availability)}%`} color={availability > 98 ? T.green : T.red} />
          <KpiCard label="Expected Faults/yr" value={fmt(faultRate, 3)} color={T.amber} />
          <KpiCard label="EAEND" value={`${fmt(eaend, 1)} GWh/yr`} color={T.red} />
          <KpiCard label="EAEND Cost" value={fmtM(eaend * calcs.ppaPriceMWh / 1000)} unit="/year" color={T.accent} />
          <KpiCard label="Insurance Premium" value={fmtM(insurancePremiumM)} unit="/year" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <ChartBox title="Weather-Adjusted MTTR by Month (days)" height={210}>
            <ResponsiveContainer>
              <BarChart data={mttrData}>
                <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} unit="d" />
                <Tooltip />
                <Bar dataKey="mttr" name="MTTR (days)" fill={T.blue} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
          <ChartBox title="Vessel Availability by Month (%)" height={210}>
            <ResponsiveContainer>
              <LineChart data={mttrData}>
                <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
                <Tooltip />
                <ReferenceLine y={70} stroke={T.amber} strokeDasharray="4 2" label={{ value: 'Min target', fontSize: 9 }} />
                <Line type="monotone" dataKey="vesselAvail" name="Vessel Avail %" stroke={T.teal} dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>
        <Section title="Cable Fault Mode Analysis">
          <Table
            headers={['Failure Mode', 'Share (%)', 'MTTR (days)', 'Root Cause', 'Depth Range']}
            rows={faultModeData.map(f => [f.mode, `${f.share}%`, f.mttr, f.cause, f.depth])}
            small
          />
        </Section>
        <Section title="Reliability Metrics">
          <Table
            headers={['Metric', 'Value']}
            rows={[
              ['Cable Fault Frequency (input)', `${faultFreq}/100km/yr`],
              ['Total Cable Route', `${fmt(distanceKm * numCables, 0)} km`],
              ['Expected Faults per Year', fmt(faultRate, 4)],
              ['Base Repair Time', `${repairDays} days`],
              ['Winter MTTR (weather-adj.)', `${fmt(repairDays * 2.4, 0)} days`],
              ['MTBF Cable (input)', `${(mtbfCable / 8760).toFixed(1)} years`],
              ['Annual Outage Hours', fmt(faultRate * repairHrs, 0)],
              ['Cable Availability', `${fmt(availability)}%`],
              ['EAEND (GWh/yr)', fmt(eaend, 2)],
              ['EAEND Revenue Impact', fmtM(eaend * calcs.ppaPriceMWh / 1000)],
            ]}
          />
        </Section>
        <Section title="Insurance Programme">
          <Table
            headers={['Insurance Type', 'Rate', 'Annual Premium']}
            rows={insuranceItems}
          />
        </Section>
      </div>
    );
  };

  const renderCurtailment = () => {
    const seasons = ['Q1', 'Q2', 'Q3', 'Q4'];
    const curtailmentData = seasons.map((s, i) => {
      const curtPct = 2 + sr(i * 17 + distanceKm * 3) * 8;
      const gen = calcs.annualGenGWh / 4;
      const curtGWh = gen * curtPct / 100;
      const costM = curtGWh * calcs.ppaPriceMWh / 1000;
      return { season: s, curtPct: parseFloat(curtPct.toFixed(1)), curtGWh: parseFloat(curtGWh.toFixed(1)), costM: parseFloat(costM.toFixed(2)) };
    });
    const totalCurtCostM = curtailmentData.reduce((a, b) => a + b.costM, 0);
    const avgCurtPct = curtailmentData.length > 0 ? curtailmentData.reduce((a, b) => a + b.curtPct, 0) / curtailmentData.length : 0;
    const nodeData = Array.from({ length: 6 }, (_, i) => ({
      node: `Node ${i + 1}`,
      congestion: parseFloat((sr(i * 19 + capacityMW * 7) * 15 + 1).toFixed(1)),
      curtCostM: parseFloat((sr(i * 23 + distanceKm * 5) * 4 + 0.5).toFixed(2)),
    }));
    const firmVsNonFirm = [
      { access: 'Firm Transmission', curtPct: '0%', premium: '+$15–25/MWh', npvPremiumM: fmt(calcs.annualGenGWh * 20 / 1000 * ((1 - Math.pow(1 + discountRate / 100, -assetLife)) / (discountRate / 100)), 1), suitable: 'CfD / PPA anchor projects' },
      { access: 'Non-Firm (Constrained)', curtPct: `${fmt(avgCurtPct, 1)}%`, premium: 'No premium', npvPremiumM: '0', suitable: 'Merchant / battery hybrid' },
      { access: 'Hybrid (Firm + Storage)', curtPct: `${fmt(avgCurtPct * 0.3, 1)}%`, premium: '+$8–12/MWh', npvPremiumM: fmt(calcs.annualGenGWh * 10 / 1000 * ((1 - Math.pow(1 + discountRate / 100, -assetLife)) / (discountRate / 100)), 1), suitable: 'Optimal for high-curtailment zones' },
    ];
    const constraintRegs = [
      ['UK', 'Balancing Mechanism (BM)', 'Constraint payments via SO Instructions', 'Socialized via BSUoS (being reformed)'],
      ['Germany', 'Redispatch 2.0 (§13a EnWG)', 'Network operator compensates', 'Cost socialized via grid tariff'],
      ['Netherlands', 'Congestion Management (ACM)', 'TenneT-led market dispatch', 'TSO obligation to resolve'],
      ['US', 'FERC Order 2023', 'Cluster study reforms; developer pays for upgrades', 'LMP nodal pricing; congestion revenue rights'],
      ['Denmark', 'Nord Pool spot market', 'Price signal-based curtailment', 'Zonal market; forecast tools evolving'],
    ];
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="Annual Curtailment Cost" value={fmtM(totalCurtCostM)} unit="/year" color={T.red} />
          <KpiCard label="Avg Curtailment %" value={`${fmt(avgCurtPct, 1)}%`} color={T.amber} />
          <KpiCard label="NPV Curtailment Loss" value={fmtM(totalCurtCostM * ((1 - Math.pow(1 + discountRate / 100, -assetLife)) / (discountRate / 100)))} color={T.red} />
          <KpiCard label="Grid Access Type" value="Non-Firm" color={T.sub} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <ChartBox title="Seasonal Curtailment (GWh)" height={200}>
            <ResponsiveContainer>
              <BarChart data={curtailmentData}>
                <XAxis dataKey="season" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit=" GWh" />
                <Tooltip />
                <Bar dataKey="curtGWh" name="Curtailed (GWh)" fill={T.red} />
                <Bar dataKey="costM" name="Cost ($M)" fill={T.amber} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
          <ChartBox title="Congestion Cost by Interconnection Node ($M/yr)" height={200}>
            <ResponsiveContainer>
              <BarChart data={nodeData}>
                <XAxis dataKey="node" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="M" />
                <Tooltip formatter={v => [`$${v}M`]} />
                <Bar dataKey="curtCostM" name="Constraint Cost" fill={T.indigo} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>
        <Section title="Firm vs Non-Firm Grid Access Comparison">
          <Table
            headers={['Access Type', 'Curtailment %', 'Connection Premium', 'NPV of Premium ($M)', 'Best Suited For']}
            rows={firmVsNonFirm.map(r => [r.access, r.curtPct, r.premium, r.npvPremiumM, r.suitable])}
          />
        </Section>
        <Section title="Congestion Management Regimes by Country">
          <Table
            headers={['Country', 'Framework', 'Mechanism', 'Cost Recovery']}
            rows={constraintRegs}
            small
          />
        </Section>
        <Section title="Curtailment Mitigation Options">
          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 12, fontSize: 12, lineHeight: 1.8 }}>
            <strong>1. Co-located Battery Storage:</strong> Capture curtailed energy; shift to high-price periods. Typical payback 6–10 years.<br />
            <strong>2. Hydrogen Electrolyser:</strong> Convert curtailed power to green hydrogen when grid is full. Optimal above 800+ MW.<br />
            <strong>3. Smart Curtailment Forecasting:</strong> Use ENTSO-E DACF/IDCF forecasts to pre-position output and minimize instruction-led cuts.<br />
            <strong>4. Upgrade to Firm Connection:</strong> Pay TSO for network reinforcement. Payback depends on curtailment severity and PPA structure.<br />
            <strong>5. Demand Response Partnership:</strong> Contract interruptible industrial demand (e.g. electrolysers, data centres) near POC.
          </div>
        </Section>
      </div>
    );
  };

  const renderFreqReg = () => {
    const synthInertiaRevM = capacityMW * 0.12 * 8760 / 1e6;
    const ffrRevM = capacityMW * 0.08 * (12 / 1000) * 8760 / 1e6;
    const dcRevM = capacityMW * 0.05 * (19 / 1000) * 8760 / 1e6;
    const freqData = Array.from({ length: 30 }, (_, i) => {
      const t = parseFloat((i * 0.15).toFixed(2));
      const nadir = i < 4 ? 50 - i * 0.18 : i < 8 ? 50 - 0.72 + (i - 4) * 0.06 : i < 15 ? 50 - 0.48 + (i - 8) * 0.05 : 50 - 0.13 + (i - 15) * 0.009;
      const withFFR = i < 4 ? 50 - i * 0.10 : i < 8 ? 50 - 0.40 + (i - 4) * 0.05 : i < 15 ? 50 - 0.20 + (i - 8) * 0.04 : 50 - 0.04 + (i - 15) * 0.003;
      return { t, withoutFFR: parseFloat(Math.max(49.0, nadir).toFixed(3)), withFFR: parseFloat(Math.max(49.2, withFFR).toFixed(3)) };
    });
    const rocofData = Array.from({ length: 10 }, (_, i) => ({
      inertia: parseFloat((1 + i * 0.5).toFixed(1)),
      rocof: parseFloat((2.5 / (1 + i * 0.5)).toFixed(3)),
      safe: (2.5 / (1 + i * 0.5)) <= 0.5,
    }));
    const gridFormingReqs = [
      { country: 'UK', mandate: '2026 (ESO requirement)', scope: 'All new OWF >300MW', standard: 'GCSE grid-forming specification', inertia: '6s virtual H constant' },
      { country: 'Germany', mandate: '2025 pilot', scope: 'Selected HVDC links', standard: 'VDE-AR-N4130', inertia: 'Synthetic inertia ≥3s' },
      { country: 'Ireland', mandate: '2024 (EirGrid)', scope: 'All converter-connected >10MW', standard: 'DS3 programme', inertia: 'Grid-forming inverter by 2025' },
      { country: 'Australia', mandate: '2023 (AEMO)', scope: 'New connections >30MW', standard: 'AEMO Grid-Forming standard', inertia: 'FFR market (4s response)' },
      { country: 'US', mandate: 'No federal mandate', scope: 'State-by-state (CAISO)', standard: 'NERC PRC-028 (proposed)', inertia: 'Voluntary FFR bid' },
    ];
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="Synthetic Inertia H" value="3–6 s" color={T.indigo} />
          <KpiCard label="FFR Revenue (est.)" value={`$${fmt(ffrRevM, 2)}M/yr`} color={T.green} />
          <KpiCard label="DC Revenue (est.)" value={`$${fmt(dcRevM, 2)}M/yr`} color={T.teal} />
          <KpiCard label="ROCOF Limit" value="0.5 Hz/s" color={T.red} />
          <KpiCard label="Grid-Forming Mandate" value={country === 'UK' ? '2026' : country === 'Germany' ? '2025' : 'Varies'} color={T.accent} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <ChartBox title="Frequency Nadir: With vs Without FFR" height={210}>
            <ResponsiveContainer>
              <LineChart data={freqData}>
                <XAxis dataKey="t" tick={{ fontSize: 9 }} label={{ value: 'Time (s)', position: 'insideBottom', offset: -2 }} />
                <YAxis domain={[49.0, 50.2]} tick={{ fontSize: 10 }} unit=" Hz" />
                <Tooltip />
                <ReferenceLine y={49.5} stroke={T.red} strokeDasharray="4 2" label={{ value: 'Under-freq limit', fontSize: 8 }} />
                <Line type="monotone" dataKey="withoutFFR" name="No FFR" stroke={T.red} dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="withFFR" name="With FFR" stroke={T.green} dot={false} strokeWidth={2} />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>
          <ChartBox title="ROCOF vs System Inertia (Hz/s)" height={210}>
            <ResponsiveContainer>
              <LineChart data={rocofData}>
                <XAxis dataKey="inertia" tick={{ fontSize: 10 }} label={{ value: 'Inertia (s)', position: 'insideBottom', offset: -2 }} />
                <YAxis tick={{ fontSize: 10 }} unit=" Hz/s" />
                <Tooltip />
                <ReferenceLine y={0.5} stroke={T.red} strokeDasharray="4 2" label={{ value: '0.5 Hz/s limit', fontSize: 9 }} />
                <Line type="monotone" dataKey="rocof" name="ROCOF (Hz/s)" stroke={T.indigo} dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>
        <Section title="Frequency Ancillary Services">
          <Table
            headers={['Service', 'Response Time', 'Duration', 'Payment Rate', 'Eligibility', 'Revenue Potential']}
            rows={[
              ['FFR (Fast Freq Response)', '<1 second', '30 seconds', '£10–15/MW/h', 'HVDC-connected OWF', `$${fmt(ffrRevM, 2)}M/yr`],
              ['Dynamic Containment (DC+)', '<1 second', '30 min', '£17–22/MW/h', 'Grid-forming / BESS', `$${fmt(dcRevM, 2)}M/yr`],
              ['Dynamic Regulation (DR)', '<10 seconds', 'Continuous', '£4–8/MW/h', 'Dispatchable assets', `$${fmt(capacityMW * 0.05 * 6 / 1000 * 8760 / 1e6, 2)}M/yr`],
              ['ROCOF Control', '<500ms', 'Continuous', 'Included in BSC', 'Grid-forming inverters', 'Mandatory — no revenue'],
              ['Synthetic Inertia (VSG)', '<200ms', 'Continuous', 'Capacity payment', 'Grid-forming 2026+', `$${fmt(synthInertiaRevM, 2)}M/yr`],
            ]}
          />
        </Section>
        <Section title="Grid-Forming Inverter Requirements by Country">
          <Table
            headers={['Country', 'Mandate Year', 'Scope', 'Standard', 'Inertia Requirement']}
            rows={gridFormingReqs.map(r => [r.country, r.mandate, r.scope, r.standard, r.inertia])}
            small
          />
        </Section>
      </div>
    );
  };

  const renderBlackStart = () => {
    const bspRevM = capacityMW * 0.08 * 8760 / 1e6;
    const bspCostM = 5 + sr(capacityMW * 7) * 15;
    const pvFactor = discountRate > 0 ? (1 - Math.pow(1 + discountRate / 100, -assetLife)) / (discountRate / 100) : assetLife;
    const bspNpv = (bspRevM - bspCostM * annualOM / 100) * pvFactor - bspCostM;
    const minMW = Math.round(capacityMW * 0.15);
    const bsSequence = [
      { step: 1, action: 'Receive BS instruction from SO', duration: '0–2 min', notes: 'Dedicated telecom line active' },
      { step: 2, action: 'Offshore diesel gensets start', duration: '2–5 min', notes: 'Provides auxiliary power to OSS' },
      { step: 3, action: 'OSS/converter systems energized', duration: '5–12 min', notes: 'SCADA, protection, comms alive' },
      { step: 4, action: 'First WTGs started (grid-forming)', duration: '12–20 min', notes: `${minMW} MW target — grid-forming converters required` },
      { step: 5, action: 'Export cable energized to onshore SS', duration: '20–25 min', notes: 'Under-frequency protection bypassed' },
      { step: 6, action: 'Onshore transformer synchronized', duration: '25–28 min', notes: 'Phase match to network island' },
      { step: 7, action: 'Load pickup begins / report to SO', duration: '28–30 min', notes: 'Ramp ≥5 MW/min; ≥2hr sustained hold' },
    ];
    const countryBs = [
      ['UK', 'BSP tender (ESO)', 'Available; £2.5–8M/yr', 'Most developed OWF-BS market'],
      ['Germany', 'BKV contract', 'Limited pilots', '50Hertz/TenneT mandate varies'],
      ['Netherlands', 'N/A', 'Not mandated', 'TenneT relies on conventional BS'],
      ['Denmark', 'Energinet', 'Specified per tender', 'May be included in OWF permit conditions'],
      ['US', 'NERC BAL-033', 'ISO-specific', 'ERCOT/CAISO leading BS from renewable'],
      ['Taiwan', 'Taipower', 'In development', 'Island grid makes BS critical priority'],
    ];
    const bspSens = Array.from({ length: 8 }, (_, i) => {
      const revScale = 0.6 + i * 0.1;
      const npv = (bspRevM * revScale - bspCostM * annualOM / 100) * pvFactor - bspCostM;
      return { revPct: `${Math.round(revScale * 100)}%`, npvM: parseFloat(npv.toFixed(1)) };
    });
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="BSP Annual Revenue" value={fmtM(bspRevM)} color={T.green} />
          <KpiCard label="Compliance CAPEX" value={fmtM(bspCostM)} color={T.red} />
          <KpiCard label="BSP NPV" value={fmtM(bspNpv)} color={bspNpv > 0 ? T.green : T.red} />
          <KpiCard label="Min BS Capability" value={`${minMW} MW`} color={T.teal} />
          <KpiCard label="Country Status" value={country === 'UK' ? 'Tender Open' : country === 'Denmark' ? 'Per Tender' : 'Not Mandated'} color={country === 'UK' ? T.accent : T.sub} />
        </div>
        <Section title="Black Start Sequence">
          <Table
            headers={['Step', 'Action', 'Duration', 'Notes']}
            rows={bsSequence.map(s => [s.step, s.action, s.duration, s.notes])}
            small
          />
        </Section>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Section title="Implementation Options">
            <Table
              headers={['Option', 'CAPEX', 'Annual Revenue', 'Tech Risk', 'Notes']}
              rows={[
                ['Dedicated diesel genset', fmtM(bspCostM * 0.35), fmtM(bspRevM * 0.55), 'Low', 'Simplest; OPEX for diesel'],
                ['Full OWF black start', fmtM(bspCostM), fmtM(bspRevM), 'Medium', 'Grid-forming inverters required'],
                ['BESS-assisted OWF', fmtM(bspCostM * 0.70), fmtM(bspRevM * 0.80), 'Low–Med', 'BESS seeds; OWF ramps up'],
                ['Hybrid diesel + BESS', fmtM(bspCostM * 0.55), fmtM(bspRevM * 0.70), 'Low', 'Best reliability, moderate cost'],
              ]}
              small
            />
          </Section>
          <ChartBox title="BSP NPV Sensitivity to Revenue Level" height={200}>
            <ResponsiveContainer>
              <BarChart data={bspSens}>
                <XAxis dataKey="revPct" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="M" />
                <Tooltip formatter={v => [`$${v}M`]} />
                <ReferenceLine y={0} stroke={T.border} />
                <Bar dataKey="npvM" name="NPV ($M)" fill={T.green} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>
        <Section title="Black Start Country Framework">
          <Table
            headers={['Country', 'Framework', 'Market Status', 'Notes']}
            rows={countryBs}
            small
          />
        </Section>
      </div>
    );
  };

  const renderFutureProofing = () => {
    const h2MW = Math.round(capacityMW * 0.3);
    const h2ktYr = parseFloat((h2MW * (loadFactor / 100) * 8760 * 0.020 / 1000).toFixed(1));
    const upgradePaths = [
      { option: 'Second Export Cable', cost: fmtM(calcs.totalCableCostM * 0.9), benefit: '+100% export capacity', timeline: '3–5 years', driver: 'Capacity expansion demand', difficulty: 'Low' },
      { option: 'Hydrogen Export (offshore electrolysis)', cost: '$80–200M', benefit: `${h2ktYr} kt H₂/yr`, timeline: '5–8 years', driver: 'H₂ policy, electrolyser cost', difficulty: 'High' },
      { option: '525kV HVDC Upgrade', cost: '$120–350M', benefit: 'Lower losses; +50% MW rating', timeline: '4–7 years', driver: 'Technology maturity (PP cables)', difficulty: 'Medium' },
      { option: 'Energy Island Hub', cost: '$500M–2B', benefit: 'Multi-GW, multi-country', timeline: '8–15 years', driver: 'North Sea policy framework', difficulty: 'Very High' },
      { option: 'Digital Substation (IEC 61850)', cost: '$15–40M', benefit: '-20% OPEX; faster fault isolation', timeline: '2–4 years', driver: 'Smart grid mandate', difficulty: 'Low' },
      { option: 'BESS Co-location', cost: '$30–80M', benefit: 'Curtailment recovery; ancillary', timeline: '1–3 years', driver: 'Battery cost parity', difficulty: 'Low' },
    ];
    const digitalSsFeatures = [
      { feature: 'IEC 61850 Process Bus', benefit: 'Merging units replace copper wiring', saving: '-15% wiring cost' },
      { feature: 'Digital Protection Relay (IED)', benefit: 'Faster trip (2ms vs 20ms)', saving: 'Reduced fault energy' },
      { feature: 'Digital Twin OSS', benefit: 'Predictive maintenance', saving: '-20% unplanned OPEX' },
      { feature: 'Fibre Optic Monitoring', benefit: 'DTS cable temperature monitoring', saving: 'Optimal rating use' },
      { feature: 'Cybersecurity (IEC 62443)', benefit: 'OT network segmentation', saving: 'Risk mitigation' },
    ];
    const capUpgradeChart = upgradePaths.map(u => ({
      option: u.option.split(' ').slice(0, 2).join(' '),
      minCost: parseFloat(u.cost.replace(/[^0-9.]/g, '') || 50),
    }));
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="H₂ Electrolyser Capacity" value={`${h2MW} MW`} color={T.teal} />
          <KpiCard label="Annual H₂ Production" value={`${h2ktYr} kt/yr`} color={T.green} />
          <KpiCard label="H₂ Breakeven Price" value="$4–6/kg" color={T.accent} />
          <KpiCard label="525kV Upgrade Saving" value="~0.4% loss reduction" color={T.indigo} />
        </div>
        <Section title="Grid Upgrade Pathways">
          <Table
            headers={['Upgrade Option', 'CAPEX', 'Key Benefit', 'Timeline', 'Driver', 'Difficulty']}
            rows={upgradePaths.map(u => [u.option, u.cost, u.benefit, u.timeline, u.driver, u.difficulty])}
            small
          />
        </Section>
        <Section title="Digital Substation Features">
          <Table
            headers={['Feature', 'Benefit', 'Cost/Risk Saving']}
            rows={digitalSsFeatures.map(d => [d.feature, d.benefit, d.saving])}
          />
        </Section>
        <Section title="Hydrogen Export Technology Pathway">
          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 12, fontSize: 12, lineHeight: 1.8 }}>
            <strong>Option A — Offshore Electrolysis:</strong> Electrolyser modules on OSS platform; H₂ compressed and piped to shore via dedicated pipeline alongside export cable corridor.<br />
            <strong>Option B — Onshore Electrolysis:</strong> Full power delivered via cable; electrolyser located onshore. Lower CAPEX but requires grid connection for electrolyser load.<br />
            <strong>Electrolyser capacity at 30% allocation:</strong> {h2MW} MW PEM electrolyser.<br />
            <strong>Annual production:</strong> {h2ktYr} kt/yr at {loadFactor}% load factor (20 kg H₂/MWh efficiency).<br />
            <strong>Pipeline CAPEX (offshore):</strong> ~$1.5–3M/km (10–16" pipe, dual-walled offshore spec).<br />
            <strong>Break-even H₂ price vs. grid power:</strong> $4.5–7/kg depending on CAPEX and curtailment rate.
          </div>
        </Section>
        <Section title="Energy Island Concept (North Sea)">
          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 12, fontSize: 12, lineHeight: 1.8 }}>
            <strong>Danish/Belgian model:</strong> Artificial island (gravel or caisson) serves as hub for 10+ GW from multiple wind farms across multiple countries.<br />
            <strong>Cost per GW at hub:</strong> $150–250M/GW vs $300–500M/GW for individual radial connections (35–50% saving).<br />
            <strong>Regulatory requirement:</strong> EU North Sea Wind Power Hub intergovernmental framework; minimum 3 TSO agreement.<br />
            <strong>Timeline:</strong> Bornholm Energy Island: operational 2030+ · Princess Elisabeth Island (Belgium): 2026 · North Sea Hub: 2035+.<br />
            <strong>Revenue model:</strong> Hub costs shared pro-rata on MW; each country's TSO pays its share via socialized grid tariff.
          </div>
        </Section>
      </div>
    );
  };

  const renderHubTopology = () => {
    const hubData = Array.from({ length: 6 }, (_, i) => {
      const sharedCostM = parseFloat((calcs.totalCapexM * (0.60 + i * 0.08)).toFixed(1));
      const perFarmCostM = parseFloat((sharedCostM / (i + 1)).toFixed(1));
      const saving = parseFloat(((1 - perFarmCostM / calcs.totalCapexM) * 100).toFixed(1));
      return { farms: i + 1, totalMW: (i + 1) * capacityMW, sharedCostM, perFarmCostM, saving: Math.max(0, saving) };
    });
    const hubChart = hubData.map(h => ({
      farms: `${h.farms} farm${h.farms > 1 ? 's' : ''}`,
      perFarmM: h.perFarmCostM,
      saving: h.saving,
    }));
    const topologyTypes = [
      { type: 'Star (radial spokes)', farms: '2–4', costMult: 1.0, reliability: 'N-0 per spoke', opControl: 'Simple', suitable: 'Small cluster, similar farm sizes' },
      { type: 'Ring', farms: '3–6', costMult: 1.25, reliability: 'N-1 ring', opControl: 'Moderate', suitable: 'Multiple farms, high reliability requirement' },
      { type: 'Meshed HVDC', farms: '4–10', costMult: 1.6, reliability: 'N-2 (multi-infeed)', opControl: 'Complex', suitable: 'Large offshore grid, interconnector integration' },
      { type: 'Energy Island', farms: '5–15', costMult: 2.1, reliability: 'N-1 (island infeed)', opControl: 'TSO-managed', suitable: 'North Sea multi-GW programme' },
    ];
    const hubExamples = [
      ['Dogger Bank Hub (concept)', 'UK / North Sea', 7200, 'Star + ring hybrid', 2032, 'Shared converter, multiple OWFs'],
      ['Princess Elisabeth Island', 'Belgium', 3500, 'Star (4 OWFs)', 2026, 'First dedicated OWF island'],
      ['Bornholm Energy Island', 'Denmark', 3000, 'Star (3 OWFs)', 2030, 'Includes interconnector to Germany'],
      ['North Sea Wind Power Hub', 'Multinational', 70000, 'Meshed HVDC (concept)', 2035, 'TenneT/Energinet/Gasunie consortium'],
      ['AquaVentus Hub', 'Germany', 10000, 'Ring topology (concept)', 2035, 'H₂-producing hub concept'],
    ];
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="Hub Concept" value="Centralized OSS" color={T.indigo} />
          <KpiCard label="Max Saving (6 farms)" value={`${hubData[5].saving.toFixed(1)}%`} color={T.green} />
          <KpiCard label="Standalone Grid Cost" value={fmtM(calcs.totalCapexM)} />
          <KpiCard label="6-Farm Per-Farm Cost" value={fmtM(hubData[5].perFarmCostM)} color={T.teal} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <ChartBox title="Per-Farm Cost vs Number of Farms ($M)" height={200}>
            <ResponsiveContainer>
              <LineChart data={hubChart}>
                <XAxis dataKey="farms" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} unit="M" />
                <Tooltip formatter={v => [`$${v}M`]} />
                <Line type="monotone" dataKey="perFarmM" name="Per-Farm Cost ($M)" stroke={T.indigo} dot={{ r: 4 }} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>
          <ChartBox title="Saving vs Standalone (%)" height={200}>
            <ResponsiveContainer>
              <BarChart data={hubChart}>
                <XAxis dataKey="farms" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Bar dataKey="saving" name="Saving %" fill={T.green} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>
        <Section title="Cost Sharing — Number of Farms Using Hub">
          <Table
            headers={['Farms', 'Total Capacity (MW)', 'Total Hub Cost ($M)', 'Per-Farm Cost ($M)', 'Saving vs Standalone']}
            rows={hubData.map(h => [h.farms, h.totalMW.toLocaleString(), fmtM(h.sharedCostM), fmtM(h.perFarmCostM), `${h.saving.toFixed(1)}%`])}
          />
        </Section>
        <Section title="Hub Topology Types">
          <Table
            headers={['Topology', 'Optimal Farms', 'Cost Multiplier', 'Reliability', 'Operational Complexity', 'Best For']}
            rows={topologyTypes.map(t => [t.type, t.farms, `×${t.costMult}`, t.reliability, t.opControl, t.suitable])}
            small
          />
        </Section>
        <Section title="Regulatory Models by Country">
          <Table
            headers={['Country', 'Hub Model', 'Who Pays', 'Regulatory Framework']}
            rows={[
              ['UK', 'OREI (Offshore Renewable Energy Infrastructure)', 'Offtaker via SOC', 'Ofgem OREI regime (2024)'],
              ['Germany', 'Direct TSO connection (50Hertz/TenneT)', 'Socialized via tariff', 'EnWG §17d; Offshore Netzanschlussverordnung'],
              ['Netherlands', 'TSO-built programmatic grid (Wind op Zee)', 'TenneT NL, socialized', 'Klimaatakkoord + SDE++ framework'],
              ['Denmark', 'Energy Island + hub model', 'Multi-party; DEA-coordinated', 'Danish Energy Agency concession'],
              ['US', 'Developer-built, BOEM leased area', 'Developer (FERC interconnection)', 'FERC Order 2023; regional cluster studies'],
              ['Taiwan', 'Taipower-managed connection', 'Developer contributes; Taipower builds', 'MOEA offshore grid development plan 2030'],
            ]}
            small
          />
        </Section>
        <Section title="Real-World Hub Examples">
          <Table
            headers={['Hub', 'Country', 'Capacity (MW)', 'Topology', 'Target Year', 'Notes']}
            rows={hubExamples.map(h => h)}
            small
          />
        </Section>
      </div>
    );
  };

  const renderCountryGrid = () => {
    const regimes = {
      UK: {
        model: 'OREI (Ofgem-regulated Offshore Transmission)', tso: 'National Grid ESO', timeline: '5–8 years',
        process: 'CfD auction → grid offer letter → s36/NSIP consent → connection', keyRisk: 'Grid queue congestion (700+ GW backlog as of 2024)',
        targetMW: 50000, currentMW: 14000, targetYear: 2030, gridCode: 'UK Grid Code + OREI Conditions of Connection',
        notes: 'OREI regime: developer builds to PCC; Offshore Transmission Owner (OFTO) operates. CfD winners must have grid offer. Reform underway (TMO4+ queue reform).',
      },
      Germany: {
        model: 'Direct TSO Connection (§17d EnWG)', tso: '50Hertz (Baltic/North) / TenneT (North Sea)', timeline: '6–10 years',
        process: 'BSH auction → binding TSO connection offer → building approval → installation', keyRisk: 'Onshore grid bottleneck at coast (Schleswig-Holstein corridor)',
        targetMW: 70000, currentMW: 9000, targetYear: 2030, gridCode: 'VDE-AR-N4130 / EntsoE NC RfG Cat C',
        notes: 'TSO is responsible for offshore grid; costs socialized via grid tariff (§17d-Umlage). HVDC connection standard for new projects. DolWin/BorWin/HelWin converter platforms.',
      },
      Netherlands: {
        model: 'TSO-Built Programmatic Grid (Wind op Zee)', tso: 'TenneT NL', timeline: '4–7 years',
        process: 'SDE++ tender → TenneT grid program → Hollandse Kust platform installation → PCC delivery', keyRisk: 'HVDC converter station delivery delay (semiconductor shortage)',
        targetMW: 21000, currentMW: 3000, targetYear: 2030, gridCode: 'EntsoE NC RfG / Netcode Elektriciteit',
        notes: 'TenneT builds and owns all offshore grid; developer connects at 66kV array cable level. Most efficient in Europe for grid delivery timelines. Hollandse Kust Zuid as template.',
      },
      Denmark: {
        model: 'Hub Island / Tender-Specific (DEA)', tso: 'Energinet', timeline: '8–15 years (island model)',
        process: 'DEA tender → grid study → bilateral TSO agreement → island construction → cable installation', keyRisk: 'Multi-country coordination complexity; diplomatic timeline',
        targetMW: 35000, currentMW: 2300, targetYear: 2030, gridCode: 'Energinet TR3.2.5 / EU Offshore Grid Regulation',
        notes: 'Pioneering energy island model (Bornholm 2030; North Sea island 2033+). Combines multi-GW wind with national interconnection. Energinet acts as system planner.',
      },
      US: {
        model: 'Developer-Built (BOEM lease + FERC interconnection)', tso: 'ISO-NE / NYISO / PJM / MISO', timeline: '7–12 years',
        process: 'BOEM lease auction → COP approval → FERC interconnection study → state PPA → installation', keyRisk: 'Interconnection queue reform (FERC Order 2023 — cluster study approach)',
        targetMW: 30000, currentMW: 2800, targetYear: 2030, gridCode: 'NERC PRC-024 / IEEE 1547 / FERC Order 2023',
        notes: 'States set targets (NY 9GW, MA 5.6GW, NJ 11GW by 2035). Developer responsible for full grid connection. FERC Order 2023 reforming interconnection queue to cluster model.',
      },
      Taiwan: {
        model: 'Taipower-Managed Grid Connection', tso: 'Taipower (state utility)', timeline: '5–9 years',
        process: 'MOEA tender → grid interconnection study → EIA → cable corridor approval → commercial ops', keyRisk: 'Island grid stability; limited interconnection with mainland',
        targetMW: 20000, currentMW: 2300, targetYear: 2030, gridCode: 'Taipower Grid Code TPC-GC-2022 / IEC 61400',
        notes: 'Taiwan operates isolated island grid — frequency stability is critical. All OWF required to provide FFR. Taipower builds onshore substation; developer builds export cable to shore.',
      },
    };
    const regime = regimes[country] || regimes['UK'];
    const allRegimes = Object.entries(regimes);
    const progressData = allRegimes.map(([c, r]) => ({
      country: c,
      current: r.currentMW,
      target: r.targetMW,
      pct: parseFloat((r.currentMW / r.targetMW * 100).toFixed(1)),
    }));
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="Country" value={country} color={T.navy} />
          <KpiCard label="Model" value={regime.model.split('(')[0].trim().split(' ').slice(0, 3).join(' ')} />
          <KpiCard label="Current Installed" value={`${regime.currentMW.toLocaleString()} MW`} color={T.teal} />
          <KpiCard label="2030 Target" value={`${regime.targetMW.toLocaleString()} MW`} color={T.indigo} />
          <KpiCard label="Progress" value={`${fmt(regime.currentMW / regime.targetMW * 100, 0)}%`} color={T.accent} />
        </div>
        <Section title={`Grid Connection Regime — ${country}`}>
          <Table
            headers={['Parameter', 'Detail']}
            rows={[
              ['Connection Model', regime.model],
              ['TSO / Grid Operator', regime.tso],
              ['Indicative Timeline', regime.timeline],
              ['Connection Process', regime.process],
              ['Grid Code Standard', regime.gridCode],
              ['Key Risk', regime.keyRisk],
              ['Notes', regime.notes],
            ]}
          />
        </Section>
        <ChartBox title="Offshore Wind Installed vs 2030 Target by Country (MW)" height={230}>
          <ResponsiveContainer>
            <BarChart data={progressData}>
              <XAxis dataKey="country" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit=" MW" />
              <Tooltip />
              <Bar dataKey="target" name="2030 Target (MW)" fill={T.border} />
              <Bar dataKey="current" name="Current Installed (MW)" fill={T.indigo} />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <Section title="Full Country Comparison">
          <Table
            small
            headers={['Country', 'Model', 'TSO', 'Timeline', 'Current (MW)', 'Target (MW)', 'Key Risk']}
            rows={allRegimes.map(([c, r]) => [c, r.model.split('(')[0].trim().split(' ').slice(0, 3).join(' '), r.tso.split('/')[0].trim(), r.timeline, r.currentMW.toLocaleString(), r.targetMW.toLocaleString(), r.keyRisk.split('(')[0].trim()])}
          />
        </Section>
      </div>
    );
  };

  const renderTenderComparison = () => {
    const avgCostPerMW = TENDER_DATA.length > 0 ? TENDER_DATA.reduce((a, b) => a + b.dollarPerMW, 0) / TENDER_DATA.length : 0;
    const avgCostM = TENDER_DATA.length > 0 ? TENDER_DATA.reduce((a, b) => a + b.costM, 0) / TENDER_DATA.length : 0;
    const sortedByCost = [...TENDER_DATA].sort((a, b) => a.dollarPerMW - b.dollarPerMW);
    const costByYear = [...TENDER_DATA].sort((a, b) => a.year - b.year).map(t => ({
      year: t.year, dollarPerMW: t.dollarPerMW, country: t.country,
    }));
    const lessonRows = [
      ['Route length underestimation', 'High', 'Add 15–25% route contingency in budget at FID'],
      ['Converter station delay (HVDC)', 'High', 'Order converter transformers 4–5 years ahead'],
      ['Cable jointing learning curve', 'Medium', 'Specify jointing qualification and pre-qualification testing'],
      ['Vessel availability risk', 'High', 'Book CLV/HLV 3+ years ahead for long route projects'],
      ['Permit timeline slippage', 'High', 'Start MPA/crossing consultations in pre-FEED'],
      ['Onshore civil delays', 'Medium', 'Early landfall HDD award; coordinate with highways authority'],
      ['Protection scheme integration', 'Medium', 'Factory acceptance test full protection sequence offshore + onshore'],
    ];
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="Tenders Analysed" value={TENDER_DATA.length} />
          <KpiCard label="Avg Cost per MW" value={`$${fmt(avgCostPerMW, 0)}k/MW`} color={T.indigo} />
          <KpiCard label="Avg Total Cost" value={fmtM(avgCostM)} color={T.accent} />
          <KpiCard label="Your Project" value={`$${fmt(calcs.totalCapexM * 1e6 / capacityMW / 1000, 0)}k/MW`} color={calcs.totalCapexM * 1e6 / capacityMW / 1000 < avgCostPerMW ? T.green : T.red} />
        </div>
        <Section title="Recent Grid Connection Tenders — Benchmark Dataset">
          <Table
            headers={['#', 'Country', 'Capacity (MW)', 'Cable (km)', 'Cost ($M)', '$/MW (000s)', 'Year', 'Cable Supplier', 'Timeline (mo)']}
            rows={TENDER_DATA.map(t => [t.id, t.country, t.capacity.toLocaleString(), t.cableKm, fmtM(t.costM), `$${t.dollarPerMW}k`, t.year, t.winner, t.timeline])}
            small
          />
        </Section>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <ChartBox title="Cost per MW by Tender ($k/MW)" height={210}>
            <ResponsiveContainer>
              <BarChart data={TENDER_DATA}>
                <XAxis dataKey="country" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} unit="k" />
                <Tooltip formatter={v => [`$${v}k/MW`]} />
                <ReferenceLine y={avgCostPerMW} stroke={T.accent} strokeDasharray="4 2" label={{ value: 'Avg', fontSize: 9 }} />
                <Bar dataKey="dollarPerMW" name="$/MW (000s)" fill={T.indigo} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
          <ChartBox title="Lowest-Cost Tenders Benchmark" height={210}>
            <ResponsiveContainer>
              <BarChart data={sortedByCost} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 9 }} unit="k" />
                <YAxis type="category" dataKey="country" tick={{ fontSize: 9 }} width={70} />
                <Tooltip formatter={v => [`$${v}k/MW`]} />
                <Bar dataKey="dollarPerMW" name="$/MW" fill={T.teal} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>
        <Section title="Key Lessons from Grid Tenders">
          <Table
            headers={['Lesson', 'Frequency', 'Mitigation']}
            rows={lessonRows}
            small
          />
        </Section>
        <Section title="Your Project vs Market Benchmark">
          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 12, fontSize: 12, lineHeight: 1.8 }}>
            <strong>Your project:</strong> {capacityMW}MW · {distanceKm}km · {exportType} · Total Grid CAPEX {fmtM(calcs.totalCapexM)} · ${fmt(calcs.totalCapexM * 1e6 / capacityMW / 1000, 0)}k/MW.<br />
            <strong>Market range:</strong> $200k–$700k/MW depending on distance, water depth, voltage level, and country.<br />
            <strong>Benchmark average (this dataset):</strong> ${fmt(avgCostPerMW, 0)}k/MW.<br />
            <strong>Assessment:</strong> Your project is <strong>{calcs.totalCapexM * 1e6 / capacityMW / 1000 < avgCostPerMW ? 'below average — competitive grid cost' : 'above average — review conductor sizing, route, and platform type for savings'}</strong>.
          </div>
        </Section>
      </div>
    );
  };

  const renderSummary = () => {
    const techRec = calcs.isHVDC ? 'HVDC VSC — optimal for distance > 80km and selected configuration' : 'AC export cable — cost-effective at current distance';
    const platformRec = waterDepth <= 40 ? 'Monopile (lowest cost, proven)' : waterDepth <= 60 ? 'Jacket (depth-appropriate)' : 'Floating (required for depth)';
    const pvFactor = discountRate > 0 ? (1 - Math.pow(1 + discountRate / 100, -assetLife)) / (discountRate / 100) : assetLife;
    const compliance = [
      ['Grid Code Compliance', country, '✓ Compatible with selected export type'],
      ['FRT Capability', 'Required (all markets)', calcs.isHVDC ? '✓ HVDC VSC provides inherent FRT' : '✓ AC WTG FRT via converter control'],
      ['Reactive Power Range', '±0.33 P at PoC', '✓ Meets EntsoE NC RfG / local code'],
      ['Frequency Response (FFR)', calcs.isHVDC ? 'Synthetic inertia available' : 'WTG de-loaded FFR', calcs.isHVDC ? '✓ HVDC FFR fully controllable' : '⚠ Confirm FFR headroom in de-rated mode'],
      ['Grid-Forming Inverter', country === 'UK' ? 'Required 2026' : 'Recommended', country === 'UK' ? '⚠ Specify grid-forming in converter contract' : '✓ Not yet mandated in this market'],
      ['Black Start Capability', country === 'UK' ? 'BSP tender opportunity' : 'Not mandated', country === 'UK' ? '⚠ Assess commercial case (NPV positive if rev > BSP threshold)' : '✓ Not applicable'],
      ['Harmonic Filter', calcs.isHVDC ? 'Required at OSS (VSC switching)' : 'STATCOM / SVC for reactive', calcs.isHVDC ? '⚠ Budget LCL + passive filter bank at OSS' : '✓ Reactive compensation per OSS design'],
    ];
    const costSummary = [
      ['Cable Supply', fmtM(calcs.cableSupplyCostM), `${calcs.totalCapexM > 0 ? fmt(calcs.cableSupplyCostM / calcs.totalCapexM * 100, 1) : '—'}%`],
      ['Cable Installation (vessel)', fmtM(calcs.installationCostM), `${calcs.totalCapexM > 0 ? fmt(calcs.installationCostM / calcs.totalCapexM * 100, 1) : '—'}%`],
      ['Offshore Substation (OSS)', fmtM(calcs.offshoreSsCostM), `${calcs.totalCapexM > 0 ? fmt(calcs.offshoreSsCostM / calcs.totalCapexM * 100, 1) : '—'}%`],
      ['Onshore Substation + Land', fmtM(calcs.onshoreSsCostM), `${calcs.totalCapexM > 0 ? fmt(calcs.onshoreSsCostM / calcs.totalCapexM * 100, 1) : '—'}%`],
      ['Total Grid CAPEX', fmtM(calcs.totalCapexM), '100%'],
      ['Annual O&M (est.)', fmtM(calcs.annualOMCostM), `${calcs.totalCapexM > 0 ? fmt(calcs.annualOMCostM / calcs.totalCapexM * 100, 2) : '—'}% of CAPEX/yr`],
      ['Annual CAPEX Charge', fmtM(calcs.annualCapexCharge), `At ${discountRate}% / ${assetLife}yr`],
    ];
    const reliabilitySummary = [
      ['Grid Availability', `${fmt(calcs.availability)}%`, calcs.availability > 98 ? 'GOOD' : 'REVIEW'],
      ['Annual Energy Loss', `${fmt(calcs.annualEnergyLossGWh)} GWh`, `${fmtPct(calcs.lossPct)} of generation`],
      ['Annual Revenue Loss', fmtM(calcs.annualRevenueLossM), 'From cable losses'],
      ['NPV of Cable Losses', fmtM(calcs.npvLossM), `Over ${assetLife} years`],
      ['Grid LCOE Component', `$${fmt(calcs.gridLcoe, 2)}/MWh`, 'Grid infrastructure contribution'],
      ['Grid CAPEX per MW', `$${fmt(calcs.totalCapexM * 1e6 / capacityMW / 1000, 0)}k/MW`, 'Benchmark: $200–600k/MW'],
    ];
    const capexChart = [
      { item: 'Cable Supply', value: parseFloat(calcs.cableSupplyCostM.toFixed(1)) },
      { item: 'Installation', value: parseFloat(calcs.installationCostM.toFixed(1)) },
      { item: 'Offshore SS', value: parseFloat(calcs.offshoreSsCostM.toFixed(1)) },
      { item: 'Onshore SS', value: parseFloat(calcs.onshoreSsCostM.toFixed(1)) },
    ];
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <KpiCard label="Total Grid CAPEX" value={fmtM(calcs.totalCapexM)} color={T.indigo} />
          <KpiCard label="CAPEX per MW" value={`$${fmt(calcs.totalCapexM * 1e6 / capacityMW / 1000, 0)}k/MW`} />
          <KpiCard label="Cable Loss" value={fmtPct(calcs.lossPct)} color={calcs.lossPct > 3 ? T.red : T.green} />
          <KpiCard label="Availability" value={`${fmt(calcs.availability)}%`} color={calcs.availability > 98 ? T.green : T.red} />
          <KpiCard label="NPV of Losses" value={fmtM(calcs.npvLossM)} color={T.red} />
          <KpiCard label="Grid LCOE" value={`$${fmt(calcs.gridLcoe, 2)}/MWh`} color={T.teal} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Section title="CAPEX Breakdown">
            <Table headers={['Component', 'Cost ($M)', '% Total']} rows={costSummary} />
          </Section>
          <Section title="Performance Metrics">
            <Table headers={['Metric', 'Value', 'Note']} rows={reliabilitySummary} />
          </Section>
        </div>
        <ChartBox title="Grid CAPEX Breakdown ($M)" height={200}>
          <ResponsiveContainer>
            <BarChart data={capexChart} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} unit="M" />
              <YAxis type="category" dataKey="item" tick={{ fontSize: 10 }} width={90} />
              <Tooltip formatter={v => [`$${v}M`]} />
              <Bar dataKey="value" name="CAPEX ($M)" fill={T.indigo} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <Section title="Technology Selection Rationale">
          <Table
            headers={['Decision', 'Selection', 'Rationale']}
            rows={[
              ['Export Technology', exportType, techRec],
              ['Conductor Material', conductorMaterial, conductorMaterial === 'Cu' ? 'Higher current rating; preferred for offshore' : 'Lower cost; acceptable for longer distances'],
              ['Conductor Area', `${conductorArea} mm²`, 'Sized for rated current at peak load with thermal margin'],
              ['OSS Platform', platformRec, `Water depth ${waterDepth}m determines structure type`],
              ['Array Voltage', arrayCableVoltage, arrayCableVoltage === '66kV' ? '66kV — reduces I²R losses vs 33kV; standard for farms >500MW' : 'Standard for selected farm size'],
              ['Number of Export Cables', `${numCables} × ${exportType}`, numCables > 1 ? 'N-1 redundancy — recommended for CfD/PPA projects' : 'Single cable — lower CAPEX, no N-1'],
            ]}
          />
        </Section>
        <Section title="Grid Code Compliance Checklist">
          <Table headers={['Requirement', 'Standard/Country', 'Status']} rows={compliance} small />
        </Section>
        <Section title="Strategic Recommendations">
          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14, fontSize: 12, lineHeight: 2.0 }}>
            <strong>1. Export Cable Technology:</strong> {techRec}. HVDC breakeven distance is ~80km for {capacityMW}MW. Selected distance ({distanceKm}km) is {distanceKm > 80 ? 'above' : 'below'} breakeven — {calcs.isHVDC ? 'HVDC is technically justified' : 'AC is cost-optimal but verify reactive compensation needs'}.<br />
            <strong>2. Offshore Substation Platform:</strong> {platformRec} for {waterDepth}m depth. Specify GIS transformers (fire risk reduction). Budget {numPlatforms} platform(s) at {fmtM(platformCostM)} each.<br />
            <strong>3. Cable Routing:</strong> Route multiplier ~{fmt(1.05 + sr(distanceKm * 7) * 0.25, 2)}× direct distance. Engage pipeline operators and marine regulators in pre-FEED to avoid crossing-agreement delays (6–18 months).<br />
            <strong>4. Reliability:</strong> Availability {fmt(calcs.availability)}%. {numCables > 1 ? 'N-1 configuration is in place — adequate for CfD obligations.' : 'Consider second cable for N-1 (+35–40% cable CAPEX) — critical if CfD penalises outages.'}<br />
            <strong>5. Revenue Protection:</strong> NPV of cable losses = {fmtM(calcs.npvLossM)} over {assetLife} years at ${fmt(calcs.ppaPriceMWh, 0)}/MWh PPA. Highest-impact levers: conductor area upsizing and {calcs.isHVDC ? 'HVDC route optimization' : 'switching to HVDC beyond breakeven distance'}.<br />
            <strong>6. Grid Code & Ancillaries:</strong> Initiate frequency response design (FFR/grid-forming) and black start assessment in FEED phase. {country === 'UK' ? 'UK ESO grid-forming mandate applies from 2026 — specify grid-forming inverters now.' : 'Monitor regulatory development in ' + country + '.'}
          </div>
        </Section>
      </div>
    );
  };

  const tabContent = [
    renderOverview, renderCableSizing, renderAcHvdc, renderGridLoss, renderCableCost,
    renderOffshoreSubstation, renderCableRouting, renderGridCode, renderInterconnection,
    renderReliability, renderCurtailment, renderFreqReg, renderBlackStart,
    renderFutureProofing, renderHubTopology, renderCountryGrid, renderTenderComparison, renderSummary
  ];

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: T.bg, minHeight: '100vh', color: T.text }}>
      {/* Header */}
      <div style={{ background: T.navy, borderBottom: `3px solid ${T.accent}`, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.accent, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>EP-DR4 · Offshore Grid & Cable Infrastructure Analytics</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>Offshore Grid Infrastructure</div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.accent }}>{country} · {exportType}</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#94A3B8' }}>{capacityMW} MW · {distanceKm} km</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0 }}>
        {/* Sidebar */}
        <div style={{ padding: '16px 0 16px 16px' }}>
          {sidebar}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: 16, minWidth: 0 }}>
          {quickStats}

          {/* Tab Bar */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
            {TABS.map((tab, i) => (
              <button key={i} onClick={() => setActiveTab(i)}
                style={{
                  padding: '6px 12px', borderRadius: 6, border: `1px solid ${activeTab === i ? T.indigo : T.border}`,
                  background: activeTab === i ? T.indigo : T.card, color: activeTab === i ? '#fff' : T.text,
                  fontSize: 11, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: activeTab === i ? 600 : 400,
                  whiteSpace: 'nowrap'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, minHeight: 400 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16, borderBottom: `2px solid ${T.accent}`, paddingBottom: 8 }}>
              {TABS[activeTab]}
            </div>
            {tabContent[activeTab]?.()}
          </div>

          {/* Status Bar */}
          <div style={{ marginTop: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.sub, display: 'flex', gap: 24 }}>
            <span>GRID CAPEX: {fmtM(calcs.totalCapexM)}</span>
            <span>CABLE LOSS: {fmtPct(calcs.lossPct)}</span>
            <span>AVAIL: {fmt(calcs.availability)}%</span>
            <span>GRID LCOE: ${fmt(calcs.gridLcoe, 2)}/MWh</span>
            <span style={{ marginLeft: 'auto' }}>EP-DR4 · OFFSHORE GRID INFRASTRUCTURE · {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
