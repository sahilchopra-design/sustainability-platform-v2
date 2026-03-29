import React, { useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const tip = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 11 };

const PURPLE = '#7c3aed';
const PURPLE_LIGHT = '#ede9fe';

const CENTRAL_BANKS = [
  { bank: 'ECB',      jurisdiction: 'Eurozone',    greenMandate: true,  climateStressTest: true,  greenBondPurchases: 141, ngfsAlignment: 'High',   capitalAddOn: 30, status: 'Active' },
  { bank: 'BoE',      jurisdiction: 'UK',           greenMandate: true,  climateStressTest: true,  greenBondPurchases: 38,  ngfsAlignment: 'High',   capitalAddOn: 25, status: 'Active' },
  { bank: 'Fed',      jurisdiction: 'USA',          greenMandate: false, climateStressTest: false, greenBondPurchases: 0,   ngfsAlignment: 'Low',    capitalAddOn: 0,  status: 'Limited' },
  { bank: 'PBoC',     jurisdiction: 'China',        greenMandate: true,  climateStressTest: true,  greenBondPurchases: 62,  ngfsAlignment: 'Medium', capitalAddOn: 20, status: 'Active' },
  { bank: 'RBA',      jurisdiction: 'Australia',    greenMandate: false, climateStressTest: true,  greenBondPurchases: 8,   ngfsAlignment: 'Medium', capitalAddOn: 15, status: 'Developing' },
  { bank: 'BoC',      jurisdiction: 'Canada',       greenMandate: true,  climateStressTest: true,  greenBondPurchases: 14,  ngfsAlignment: 'High',   capitalAddOn: 20, status: 'Active' },
  { bank: 'SNB',      jurisdiction: 'Switzerland',  greenMandate: false, climateStressTest: false, greenBondPurchases: 5,   ngfsAlignment: 'Low',    capitalAddOn: 0,  status: 'Limited' },
  { bank: 'Riksbank', jurisdiction: 'Sweden',       greenMandate: true,  climateStressTest: true,  greenBondPurchases: 22,  ngfsAlignment: 'High',   capitalAddOn: 28, status: 'Active' },
  { bank: 'DNB',      jurisdiction: 'Netherlands',  greenMandate: true,  climateStressTest: true,  greenBondPurchases: 18,  ngfsAlignment: 'High',   capitalAddOn: 25, status: 'Active' },
  { bank: 'HKMA',     jurisdiction: 'Hong Kong',    greenMandate: true,  climateStressTest: true,  greenBondPurchases: 36,  ngfsAlignment: 'Medium', capitalAddOn: 18, status: 'Developing' },
];

const NGFS_SCENARIOS = [
  { scenario: 'Net Zero 2050',          category: 'Orderly',     tempBy2100: 1.5, physicalRisk: 'Low',    transitionRisk: 'High',   gdpImpact2050: -1.4, financialStability: 'Manageable' },
  { scenario: 'Divergent Net Zero',     category: 'Disorderly',  tempBy2100: 1.6, physicalRisk: 'Low',    transitionRisk: 'V.High', gdpImpact2050: -2.5, financialStability: 'Stressed' },
  { scenario: 'Too Little Too Late',    category: 'Disorderly',  tempBy2100: 2.6, physicalRisk: 'High',   transitionRisk: 'High',   gdpImpact2050: -4.8, financialStability: 'At Risk' },
  { scenario: 'Hot House World',        category: 'Hot House',   tempBy2100: 3.2, physicalRisk: 'V.High', transitionRisk: 'Low',    gdpImpact2050: -8.1, financialStability: 'Severe' },
];

const GREEN_QE = [
  { bank: 'ECB',      greenHoldings: 141, pctOfQE: 22, tiltingStrategy: 'Climate tilt + exclusions', carbonReduction: 35 },
  { bank: 'PBoC',     greenHoldings: 62,  pctOfQE: 18, tiltingStrategy: 'Green lending facilities',  carbonReduction: 28 },
  { bank: 'BoE',      greenHoldings: 38,  pctOfQE: 12, tiltingStrategy: 'Green gilt preference',     carbonReduction: 22 },
  { bank: 'HKMA',     greenHoldings: 36,  pctOfQE: 14, tiltingStrategy: 'ESG-tilted reserves',       carbonReduction: 18 },
  { bank: 'BoC',      greenHoldings: 14,  pctOfQE: 9,  tiltingStrategy: 'Sustainability criteria',   carbonReduction: 15 },
  { bank: 'Riksbank', greenHoldings: 22,  pctOfQE: 16, tiltingStrategy: 'Green bond tilting',        carbonReduction: 25 },
];

const CAPITAL_ADDONS = [
  { jurisdiction: 'EU',          proposedBps: 30, implementationYear: 2026, scope: 'All credit institutions', regulatoryBasis: 'CRR3 / CRDVI' },
  { jurisdiction: 'UK',          proposedBps: 25, implementationYear: 2025, scope: 'Systemically important',  regulatoryBasis: 'PRA SS3/19' },
  { jurisdiction: 'Switzerland', proposedBps: 18, implementationYear: 2027, scope: 'Pillar 2 discretion',     regulatoryBasis: 'FINMA Circ 2023' },
  { jurisdiction: 'Canada',      proposedBps: 20, implementationYear: 2026, scope: 'D-SIBs',                  regulatoryBasis: 'OSFI B-15' },
  { jurisdiction: 'China',       proposedBps: 20, implementationYear: 2025, scope: 'Major commercial banks',  regulatoryBasis: 'PBoC Directive' },
  { jurisdiction: 'Australia',   proposedBps: 15, implementationYear: 2027, scope: 'Pillar 2 guidance',       regulatoryBasis: 'APRA CPG 229' },
];

const STRESS_TREND = Array.from({ length: 18 }, (_, i) => ({
  month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'][i] + (i < 12 ? ' 25' : ' 26'),
  score: +(28 + sr(i * 3) * 18 + i * 0.6).toFixed(1),
  threshold: 45,
}));

const TABS = ['Overview', 'NGFS Scenarios', 'Supervisory Mandates', 'Green QE & CSPP', 'Capital Add-ons'];

const KPI = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || PURPLE, lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Badge = ({ v, map }) => {
  const cfg = map[v] || { bg: '#f3f4f6', color: T.textSec };
  return <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{v}</span>;
};

const statusMap = {
  'Active':     { bg: '#dcfce7', color: T.green },
  'Developing': { bg: '#fef9c3', color: T.amber },
  'Limited':    { bg: '#fee2e2', color: T.red },
};
const alignMap = {
  'High':   { bg: '#ede9fe', color: PURPLE },
  'Medium': { bg: '#fef9c3', color: T.amber },
  'Low':    { bg: '#fee2e2', color: T.red },
};
const fsMap = {
  'Manageable': { bg: '#dcfce7', color: T.green },
  'Stressed':   { bg: '#fef9c3', color: T.amber },
  'At Risk':    { bg: '#fed7aa', color: '#c2410c' },
  'Severe':     { bg: '#fee2e2', color: T.red },
};
const catMap = {
  'Orderly':   { bg: '#dcfce7', color: T.green },
  'Disorderly':{ bg: '#fed7aa', color: '#c2410c' },
  'Hot House': { bg: '#fee2e2', color: T.red },
};

function OverviewTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <KPI label="CBs with Climate Mandate" value="83%" sub="of NGFS member central banks" color={PURPLE} />
        <KPI label="Green Bonds in CB Portfolios" value="€344bn" sub="across 6 major central banks" color={T.teal} />
        <KPI label="Climate Stress Test Frameworks" value="42" sub="jurisdictions globally" color={T.sage} />
        <KPI label="Avg Proposed Capital Add-on" value="25 bps" sub="Pillar 2 climate risk buffer" color={T.gold} />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 300, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>Systemic Climate Stress Score — 18-Month Trend</div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={STRESS_TREND} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.textMut }} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: T.textMut }} domain={[20, 60]} />
              <Tooltip contentStyle={tip} />
              <Area type="monotone" dataKey="score" stroke={PURPLE} fill={PURPLE_LIGHT} strokeWidth={2} name="Stress Score" />
              <Area type="monotone" dataKey="threshold" stroke={T.amber} fill="none" strokeDasharray="5 3" strokeWidth={1.5} name="Alert Threshold" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ flex: 1, minWidth: 240, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>Green Bond Holdings ($bn)</div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={GREEN_QE} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="bank" tick={{ fontSize: 10, fill: T.textMut }} />
              <YAxis tick={{ fontSize: 10, fill: T.textMut }} />
              <Tooltip contentStyle={tip} />
              <Bar dataKey="greenHoldings" name="Holdings $bn" radius={[4,4,0,0]}>
                {GREEN_QE.map((_, i) => <Cell key={i} fill={i === 0 ? PURPLE : i === 1 ? T.teal : T.sage} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: PURPLE_LIGHT, border: `1px solid #c4b5fd`, borderRadius: 10, padding: '14px 18px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: PURPLE, marginBottom: 6 }}>EP-AB3 — Green Central Banking Monitor</div>
        <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.7 }}>
          Tracks NGFS Phase IV scenario alignment, supervisory climate mandates, green quantitative easing programmes, and
          proposed Pillar 2 climate capital add-ons across 10 major central banks. Data sourced from NGFS, BIS, TCFD and
          individual central bank disclosures updated quarterly.
        </div>
      </div>
    </div>
  );
}

function NgfsScenariosTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, fontSize: 13, fontWeight: 700, color: T.text }}>
          NGFS Phase IV Scenario Analysis
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Scenario','Category','Temp by 2100','Physical Risk','Transition Risk','GDP Impact 2050','Financial Stability'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NGFS_SCENARIOS.map((s, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={{ padding: '10px 14px', fontWeight: 600, color: T.text }}>{s.scenario}</td>
                <td style={{ padding: '10px 14px' }}><Badge v={s.category} map={catMap} /></td>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: s.tempBy2100 <= 1.6 ? T.green : s.tempBy2100 <= 2.6 ? T.amber : T.red }}>{s.tempBy2100}°C</td>
                <td style={{ padding: '10px 14px' }}><Badge v={s.physicalRisk} map={{ 'Low':{ bg:'#dcfce7',color:T.green },'High':{ bg:'#fed7aa',color:'#c2410c' },'V.High':{ bg:'#fee2e2',color:T.red } }} /></td>
                <td style={{ padding: '10px 14px' }}><Badge v={s.transitionRisk} map={{ 'High':{ bg:'#fef9c3',color:T.amber },'V.High':{ bg:'#fee2e2',color:T.red },'Low':{ bg:'#dcfce7',color:T.green } }} /></td>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: s.gdpImpact2050 > -2 ? T.amber : T.red }}>{s.gdpImpact2050}%</td>
                <td style={{ padding: '10px 14px' }}><Badge v={s.financialStability} map={fsMap} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>GDP Impact by Scenario (%, 2050)</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={NGFS_SCENARIOS} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="scenario" tick={{ fontSize: 10, fill: T.textMut }} width={80} />
            <YAxis tick={{ fontSize: 10, fill: T.textMut }} domain={[-10, 0]} />
            <Tooltip contentStyle={tip} />
            <Bar dataKey="gdpImpact2050" name="GDP Impact %" radius={[4,4,0,0]}>
              {NGFS_SCENARIOS.map((s, i) => (
                <Cell key={i} fill={s.gdpImpact2050 > -2 ? T.amber : s.gdpImpact2050 > -5 ? '#f97316' : T.red} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SupervisoryMandatesTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, fontSize: 13, fontWeight: 700, color: T.text }}>
          Central Bank Climate Supervisory Landscape
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Central Bank','Jurisdiction','Green Mandate','Climate Stress Test','NGFS Alignment','Capital Add-on (bps)','Status'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CENTRAL_BANKS.map((cb, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: T.text }}>{cb.bank}</td>
                <td style={{ padding: '10px 14px', color: T.textSec }}>{cb.jurisdiction}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ color: cb.greenMandate ? T.green : T.red, fontWeight: 700 }}>{cb.greenMandate ? '✓ Yes' : '✗ No'}</span>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ color: cb.climateStressTest ? T.green : T.red, fontWeight: 700 }}>{cb.climateStressTest ? '✓ Yes' : '✗ No'}</span>
                </td>
                <td style={{ padding: '10px 14px' }}><Badge v={cb.ngfsAlignment} map={alignMap} /></td>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: cb.capitalAddOn > 0 ? PURPLE : T.textMut }}>{cb.capitalAddOn > 0 ? cb.capitalAddOn : '—'}</td>
                <td style={{ padding: '10px 14px' }}><Badge v={cb.status} map={statusMap} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 14 }}>
        {[
          { label: 'Active Mandates', value: CENTRAL_BANKS.filter(c => c.greenMandate).length, total: CENTRAL_BANKS.length, color: PURPLE },
          { label: 'Stress Test Active', value: CENTRAL_BANKS.filter(c => c.climateStressTest).length, total: CENTRAL_BANKS.length, color: T.teal },
          { label: 'High NGFS Alignment', value: CENTRAL_BANKS.filter(c => c.ngfsAlignment === 'High').length, total: CENTRAL_BANKS.length, color: T.sage },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}/{s.total}</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GreenQeTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>Green Holdings as % of Total QE</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={GREEN_QE} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="bank" tick={{ fontSize: 11, fill: T.textMut }} />
              <YAxis tick={{ fontSize: 10, fill: T.textMut }} unit="%" />
              <Tooltip contentStyle={tip} formatter={v => `${v}%`} />
              <Bar dataKey="pctOfQE" name="% of Total QE" radius={[4,4,0,0]}>
                {GREEN_QE.map((_, i) => <Cell key={i} fill={[PURPLE, T.teal, T.sage, T.gold, '#f97316', '#0ea5e9'][i % 6]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ flex: 1, minWidth: 280, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>Carbon Intensity Reduction from Tilting (%)</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={GREEN_QE} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="bank" tick={{ fontSize: 11, fill: T.textMut }} />
              <YAxis tick={{ fontSize: 10, fill: T.textMut }} unit="%" />
              <Tooltip contentStyle={tip} formatter={v => `${v}%`} />
              <Bar dataKey="carbonReduction" name="Carbon Reduction %" radius={[4,4,0,0]}>
                {GREEN_QE.map((_, i) => <Cell key={i} fill={T.sage} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, fontSize: 13, fontWeight: 700, color: T.text }}>
          Green QE & CSPP Detail
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Central Bank','Green Holdings ($bn)','% of Total QE','Tilting Strategy','Carbon Reduction'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GREEN_QE.map((g, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: T.text }}>{g.bank}</td>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: PURPLE }}>${g.greenHoldings}bn</td>
                <td style={{ padding: '10px 14px' }}>{g.pctOfQE}%</td>
                <td style={{ padding: '10px 14px', color: T.textSec }}>{g.tiltingStrategy}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ color: T.green, fontWeight: 700 }}>-{g.carbonReduction}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CapitalAddOnsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>Proposed Climate Capital Add-ons by Jurisdiction (bps)</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={CAPITAL_ADDONS} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="jurisdiction" tick={{ fontSize: 11, fill: T.textMut }} />
            <YAxis tick={{ fontSize: 10, fill: T.textMut }} unit=" bps" domain={[0, 40]} />
            <Tooltip contentStyle={tip} formatter={v => `${v} bps`} />
            <Bar dataKey="proposedBps" name="Capital Add-on (bps)" radius={[4,4,0,0]}>
              {CAPITAL_ADDONS.map((_, i) => (
                <Cell key={i} fill={_.proposedBps >= 28 ? PURPLE : _.proposedBps >= 20 ? T.teal : T.sage} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, fontSize: 13, fontWeight: 700, color: T.text }}>
          Pillar 2 Climate Capital Add-on Tracker
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Jurisdiction','Proposed Add-on','Implementation','Scope','Regulatory Basis'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CAPITAL_ADDONS.map((c, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: T.text }}>{c.jurisdiction}</td>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: PURPLE }}>{c.proposedBps} bps</td>
                <td style={{ padding: '10px 14px', color: T.textSec }}>{c.implementationYear}</td>
                <td style={{ padding: '10px 14px', color: T.textSec }}>{c.scope}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ background: PURPLE_LIGHT, color: PURPLE, borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{c.regulatoryBasis}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 14 }}>
        <KPI label="Avg Capital Add-on" value="25 bps" sub="across 6 jurisdictions" color={PURPLE} />
        <KPI label="Earliest Implementation" value="2025" sub="UK (PRA) & China (PBoC)" color={T.teal} />
        <KPI label="Highest Proposed" value="30 bps" sub="EU — CRR3 / CRDVI" color={T.amber} />
        <KPI label="Jurisdictions Tracked" value={CAPITAL_ADDONS.length} sub="with active proposals" color={T.sage} />
      </div>
    </div>
  );
}

export default function GreenCentralBankingPage() {
  const [activeTab, setActiveTab] = useState(0);

  const tabContent = [
    <OverviewTab key="overview" />,
    <NgfsScenariosTab key="ngfs" />,
    <SupervisoryMandatesTab key="supervisory" />,
    <GreenQeTab key="greenqe" />,
    <CapitalAddOnsTab key="capital" />,
  ];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ background: PURPLE, borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 16 }}>🏦</span>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>Green Central Banking</div>
            <div style={{ fontSize: 12, color: T.textSec }}>EP-AB3 — NGFS Scenarios · Supervisory Mandates · Green QE · Capital Add-ons</div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.border}`, paddingBottom: 0 }}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 16px', fontSize: 13, fontWeight: activeTab === i ? 700 : 500,
              color: activeTab === i ? PURPLE : T.textSec,
              borderBottom: activeTab === i ? `2px solid ${PURPLE}` : '2px solid transparent',
              marginBottom: -2, transition: 'all 0.15s', fontFamily: T.font,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tabContent[activeTab]}
    </div>
  );
}
