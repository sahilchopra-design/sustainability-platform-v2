import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#0f172a', card: '#1e293b', border: '#334155', muted: '#94a3b8',
  text: '#f1f5f9', sub: '#cbd5e1', accent: '#EF4444',
  green: '#16A34A', amber: '#D97706', red: '#DC2626', indigo: '#6366F1',
  teal: '#0D9488', blue: '#2563EB', purple: '#7C3AED',
};

const KpiCard = ({ label, value, sub, color = T.accent }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 22px' }}>
    <div style={{ color: T.muted, fontSize: 12, marginBottom: 6 }}>{label}</div>
    <div style={{ color, fontSize: 26, fontWeight: 700 }}>{value}</div>
    {sub && <div style={{ color: T.sub, fontSize: 11, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Pill = ({ label, color = T.accent }) => (
  <span style={{ background: color + '22', color, border: `1px solid ${color}55`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{label}</span>
);

const CITIES = [
  { city: 'Phoenix, AZ', country: 'USA', heatDays2024: 110, heatDays2050: 165, urbHeatIsland: 4.2, gdpAtRisk: 3.8, laborProdLoss: 12, hospitalAdmit: 18, coolCostM: 480, greenCoverage: 12 },
  { city: 'Delhi', country: 'India', heatDays2024: 98, heatDays2050: 148, urbHeatIsland: 3.8, gdpAtRisk: 6.2, laborProdLoss: 22, hospitalAdmit: 34, coolCostM: 320, greenCoverage: 8 },
  { city: 'Dubai', country: 'UAE', heatDays2024: 145, heatDays2050: 178, urbHeatIsland: 5.1, gdpAtRisk: 8.4, laborProdLoss: 28, hospitalAdmit: 14, coolCostM: 1240, greenCoverage: 6 },
  { city: 'Bangkok', country: 'Thailand', heatDays2024: 88, heatDays2050: 132, urbHeatIsland: 3.4, gdpAtRisk: 4.1, laborProdLoss: 18, hospitalAdmit: 22, coolCostM: 180, greenCoverage: 15 },
  { city: 'Karachi', country: 'Pakistan', heatDays2024: 102, heatDays2050: 155, urbHeatIsland: 4.6, gdpAtRisk: 5.8, laborProdLoss: 24, hospitalAdmit: 42, coolCostM: 95, greenCoverage: 4 },
  { city: 'Madrid', country: 'Spain', heatDays2024: 72, heatDays2050: 118, urbHeatIsland: 3.1, gdpAtRisk: 2.4, laborProdLoss: 8, hospitalAdmit: 11, coolCostM: 210, greenCoverage: 22 },
  { city: 'Melbourne', country: 'Australia', heatDays2024: 58, heatDays2050: 94, urbHeatIsland: 2.8, gdpAtRisk: 2.1, laborProdLoss: 6, hospitalAdmit: 8, coolCostM: 290, greenCoverage: 28 },
  { city: 'São Paulo', country: 'Brazil', heatDays2024: 65, heatDays2050: 102, urbHeatIsland: 3.6, gdpAtRisk: 3.4, laborProdLoss: 14, hospitalAdmit: 19, coolCostM: 140, greenCoverage: 18 },
];

const SOLUTIONS = [
  { solution: 'Cool Roofs & Pavements', costPerHa: 85000, tempReduction: 1.8, lifetime: 20, cobenefits: 'Energy savings 15%, AQ improvement', eligibility: 'Green Bond / GCF' },
  { solution: 'Urban Tree Canopy Expansion', costPerHa: 42000, tempReduction: 2.4, lifetime: 50, cobenefits: 'Air quality, biodiversity, stormwater', eligibility: 'NbS / Adaptation Fund' },
  { solution: 'Green Roofs & Walls', costPerHa: 125000, tempReduction: 1.4, lifetime: 30, cobenefits: 'Stormwater retention, building insulation', eligibility: 'Green Bond / SLB' },
  { solution: 'Urban Water Features', costPerHa: 68000, tempReduction: 2.1, lifetime: 40, cobenefits: 'Amenity, biodiversity, flood attenuation', eligibility: 'Municipal Bond' },
  { solution: 'District Cooling Networks', costPerHa: 340000, tempReduction: 3.2, lifetime: 40, cobenefits: 'Energy efficiency at scale', eligibility: 'Infrastructure Bond' },
  { solution: 'Cool Corridors / Wind Paths', costPerHa: 55000, tempReduction: 1.6, lifetime: 50, cobenefits: 'Air circulation, urban planning co-benefit', eligibility: 'Municipal / DFI Grant' },
  { solution: 'Building Retrofit (insulation)', costPerHa: 180000, tempReduction: 0, lifetime: 25, cobenefits: 'Energy reduction 30–40%, indoor comfort', eligibility: 'Green Mortgage / SLB' },
];

const PRODUCTIVITY_IMPACT = Array.from({ length: 9 }, (_, i) => ({
  scenario: ['1.5°C', '2.0°C', '2.5°C', '3.0°C', '3.5°C', '4.0°C', '4.5°C', '5.0°C', '5.5°C'][i],
  global: +(1.2 + i * 0.8 + sr(i * 7) * 0.3).toFixed(1),
  tropics: +(2.4 + i * 1.6 + sr(i * 11) * 0.5).toFixed(1),
  midLat: +(0.6 + i * 0.5 + sr(i * 13) * 0.2).toFixed(1),
}));

const HEAT_HEALTH_COST = Array.from({ length: 6 }, (_, i) => ({
  year: 2025 + i * 5,
  medical: Math.round(180 + i * 42 + sr(i * 7) * 20),
  productivity: Math.round(280 + i * 68 + sr(i * 11) * 25),
  mortality: Math.round(95 + i * 28 + sr(i * 13) * 15),
}));

const INVESTMENT_SEGMENTS = [
  { segment: 'Cooling Infrastructure', size: 42, cagr: 8.4, opportunity: 'District cooling, smart AC, thermal storage' },
  { segment: 'Urban Green Infrastructure', size: 28, cagr: 12.2, opportunity: 'Tree planting, green roofs, urban forests' },
  { segment: 'Heat-Resilient Housing', size: 65, cagr: 6.8, opportunity: 'Retrofits, passive design, ventilation' },
  { segment: 'Worker Heat Protection', size: 18, cagr: 9.1, opportunity: 'PPE, scheduling software, rest facilities' },
  { segment: 'Heat Early Warning Tech', size: 8, cagr: 15.4, opportunity: 'IoT sensors, forecast platforms, alerts' },
  { segment: 'Thermally Resilient Transport', size: 22, cagr: 7.2, opportunity: 'AC rail, bus shelters, tunnels' },
];

const TABS = ['Market Overview', 'City Heat Analytics', 'Urban Cooling Solutions', 'Health & Productivity', 'Investment Map', 'Finance Structures'];

export default function HeatAdaptationFinancePage() {
  const [tab, setTab] = useState(0);
  const [sortCity, setSortCity] = useState('heatDays2024');
  const [budgetM, setBudgetM] = useState(100);

  const sortedCities = useMemo(() => [...CITIES].sort((a, b) => b[sortCity] - a[sortCity]), [sortCity]);

  const totalGdpRisk = CITIES.reduce((a, b) => a + b.gdpAtRisk, 0);
  const avgHeatDays2050 = CITIES.reduce((a, b) => a + b.heatDays2050, 0) / CITIES.length;

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: 'Inter,sans-serif', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ background: T.accent + '22', border: `1px solid ${T.accent}`, borderRadius: 8, padding: '4px 12px', fontSize: 11, color: T.accent, fontWeight: 700 }}>EP-EK2</div>
          <Pill label="Heat Adaptation" color={T.accent} />
          <Pill label="Urban Resilience" color={T.teal} />
          <Pill label="Cooling Finance" color={T.blue} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Heat Adaptation Finance</h1>
        <p style={{ color: T.muted, marginTop: 6, fontSize: 14 }}>Urban heat island analytics, cooling infrastructure economics, labour productivity loss modelling, and investment intelligence for heat adaptation in cities and buildings.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Global Heat Mortality" value="489K/yr" sub="Estimated 2024 (Lancet)" color={T.accent} />
        <KpiCard label="Labour Productivity Loss" value="$2.4Tn" sub="At 2°C warming (ILO)" color={T.red} />
        <KpiCard label="Avg Heat Days 2050" value={`${avgHeatDays2050.toFixed(0)}`} sub="Days >35°C, dataset cities" color={T.amber} />
        <KpiCard label="Dataset GDP at Risk" value={`$${totalGdpRisk.toFixed(1)}Bn`} sub="8 cities tracked" color={T.teal} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ background: tab === i ? T.accent : T.card, color: tab === i ? '#fff' : T.sub, border: `1px solid ${tab === i ? T.accent : T.border}`, borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Global Heat Health Cost ($Bn)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={HEAT_HEALTH_COST}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" stroke={T.muted} tick={{ fontSize: 11 }} />
                  <YAxis stroke={T.muted} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                  <Legend />
                  <Area type="monotone" dataKey="medical" name="Medical Costs" stroke={T.accent} fill={T.accent + '33'} stackId="1" />
                  <Area type="monotone" dataKey="productivity" name="Productivity Loss" stroke={T.amber} fill={T.amber + '22'} stackId="1" />
                  <Area type="monotone" dataKey="mortality" name="Mortality (VSL)" stroke={T.red} fill={T.red + '22'} stackId="1" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Investment Market Size ($Bn) by Segment</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={INVESTMENT_SEGMENTS} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" stroke={T.muted} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="segment" type="category" stroke={T.muted} tick={{ fontSize: 9 }} width={130} />
                  <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                  <Bar dataKey="size" name="Market ($Bn)" fill={T.accent} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[['heatDays2024', '2024 Heat Days'], ['heatDays2050', '2050 Heat Days'], ['gdpAtRisk', 'GDP at Risk'], ['laborProdLoss', 'Labour Loss']].map(([f, l]) => (
              <button key={f} onClick={() => setSortCity(f)} style={{ background: sortCity === f ? T.accent : T.card, color: sortCity === f ? '#fff' : T.sub, border: `1px solid ${sortCity === f ? T.accent : T.border}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['City', 'Country', 'Heat Days 2024', 'Heat Days 2050', 'UHI (°C)', 'GDP at Risk ($Bn)', 'Labour Loss %', 'Hospital Admits', 'Cool Cost ($M)', 'Green Cover %'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.muted, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedCities.map((c, i) => (
                    <tr key={c.city} style={{ borderBottom: `1px solid ${T.border}22`, background: i % 2 === 0 ? T.bg + '55' : 'transparent' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>{c.city}</td>
                      <td style={{ padding: '10px 12px' }}>{c.country}</td>
                      <td style={{ padding: '10px 12px', color: T.amber, fontWeight: 700 }}>{c.heatDays2024}</td>
                      <td style={{ padding: '10px 12px', color: T.red, fontWeight: 700 }}>{c.heatDays2050}</td>
                      <td style={{ padding: '10px 12px', color: c.urbHeatIsland > 4 ? T.red : T.amber }}>+{c.urbHeatIsland}°C</td>
                      <td style={{ padding: '10px 12px', color: T.accent }}>${c.gdpAtRisk}Bn</td>
                      <td style={{ padding: '10px 12px' }}>{c.laborProdLoss}%</td>
                      <td style={{ padding: '10px 12px' }}>{c.hospitalAdmit}K/yr</td>
                      <td style={{ padding: '10px 12px', color: T.indigo }}>${c.coolCostM}M</td>
                      <td style={{ padding: '10px 12px', color: c.greenCoverage < 10 ? T.red : c.greenCoverage < 20 ? T.amber : T.green }}>{c.greenCoverage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: T.muted, fontSize: 12 }}>Budget ($M): {budgetM}</label>
            <input type="range" min={10} max={500} value={budgetM} onChange={e => setBudgetM(+e.target.value)} style={{ width: 300, marginLeft: 12 }} />
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Solution', 'Cost/Ha', 'Temp Reduction', 'Asset Life', 'Co-Benefits', 'Finance Eligibility'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.muted, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SOLUTIONS.map((s, i) => (
                    <tr key={s.solution} style={{ borderBottom: `1px solid ${T.border}22`, background: i % 2 === 0 ? T.bg + '55' : 'transparent' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{s.solution}</td>
                      <td style={{ padding: '10px 12px', color: T.amber }}>${s.costPerHa.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', color: s.tempReduction > 2 ? T.green : T.amber }}>{s.tempReduction > 0 ? `-${s.tempReduction}°C` : '—'}</td>
                      <td style={{ padding: '10px 12px' }}>{s.lifetime}yr</td>
                      <td style={{ padding: '10px 12px', color: T.sub, fontSize: 11 }}>{s.cobenefits}</td>
                      <td style={{ padding: '10px 12px' }}><Pill label={s.eligibility} color={T.teal} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Labour Productivity Loss by Warming Scenario (%)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={PRODUCTIVITY_IMPACT}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="scenario" stroke={T.muted} tick={{ fontSize: 11 }} />
              <YAxis stroke={T.muted} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
              <Legend />
              <Line type="monotone" dataKey="global" name="Global Avg %" stroke={T.amber} strokeWidth={2} dot />
              <Line type="monotone" dataKey="tropics" name="Tropical Regions %" stroke={T.accent} strokeWidth={2} dot />
              <Line type="monotone" dataKey="midLat" name="Mid-Latitudes %" stroke={T.blue} strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          {INVESTMENT_SEGMENTS.map(s => (
            <div key={s.segment} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{s.segment}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                <KpiCard label="Market Size ($Bn)" value={`$${s.size}Bn`} sub="" color={T.accent} />
                <KpiCard label="CAGR" value={`${s.cagr}%`} sub="2024–2030E" color={T.green} />
              </div>
              <div style={{ color: T.sub, fontSize: 12 }}>{s.opportunity}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 5 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[
            { title: 'Green Bond & Sustainability-Linked Finance', items: ['EU Taxonomy Art. 7.4 — heat adaptation CapEx eligible (urban cooling)', 'CBI Climate Bonds Standard — Urban Heat Island mitigation use-of-proceeds', 'World Bank COOL Cities Bond — district cooling + green roof basket', 'SLB with heat-day KPI: coupon step-up if heat days > threshold (linked to 30-yr avg)', 'Impact bond for urban tree canopy: outcome payment on % canopy coverage', 'MIGA guarantee for district cooling PPPs in emerging market cities'] },
            { title: 'Public Finance & MDB', items: ['GCF Adaptation Finance — heat resilience in vulnerable countries (Tier B)', 'ADB Urban Climate Change Resilience Trust Fund (UCCRTF)', 'AIIB Green City Affordable Housing — heat-resilient building standards', 'EU Cohesion Fund — urban green infrastructure for member states', 'US HUD CDBG-DR — heat vulnerability grants post-disaster', 'UK UKIB Heat Resilience Fund — cooling infrastructure in deprived areas'] },
          ].map(s => (
            <div key={s.title} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.accent }}>{s.title}</h3>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {s.items.map(it => <li key={it} style={{ color: T.sub, fontSize: 12, marginBottom: 6 }}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
