import React, { useMemo } from 'react';
import {
  T, useScenario, openDeliverable, toCsv, downloadText, html,
  ToolShell, Step, OutputRail, PrimaryCTA, ToolMenu,
  FieldRow, Worksheet, NumInput, TextInput, SelectInput, Collapsible, Note, PageHeader
} from '../../_shared/AdvisoryToolkit';
import { SSP_MULT, IN_HAZARD_BASELINE, AQUEDUCT_STRESS, NGFS_DAMAGE } from '../../_shared/AdvisoryReference';

const STATES = Object.keys(IN_HAZARD_BASELINE);

const rarFor = (a, ssp, yr) => {
  const mult = SSP_MULT[ssp]?.[yr] ?? 1;
  return Math.min(40, 0.6 * (a.heat * 1.2 + a.water * 1.5 + a.cyclone * 2.0 + a.flood * 1.8 + a.dust * 0.8) * mult);
};

const DEFAULTS = {
  portfolio: 'ACME Solar + H₂ Assets',
  ssp: 'SSP2-4.5',
  horizon: 2040,
  ebitda: 1200,       // ₹ Cr
  debtSvc: 420,       // ₹ Cr annual
  adaptCapex: 80,     // ₹ Cr upfront
  adaptOpex: 12,      // ₹ Cr / yr
  adaptBenefitPct: 45,  // % RaR reduction
  assets: [
    { _id: 1, name: 'Rajasthan 50 MW', state: 'RJ', ...IN_HAZARD_BASELINE.RJ },
    { _id: 2, name: 'Gujarat 40 MW', state: 'GJ', ...IN_HAZARD_BASELINE.GJ },
    { _id: 3, name: 'Odisha 35 MW', state: 'OD', ...IN_HAZARD_BASELINE.OD },
    { _id: 4, name: 'Tamil Nadu 30 MW', state: 'TN', ...IN_HAZARD_BASELINE.TN },
    { _id: 5, name: 'MP 25 MW', state: 'MP', ...IN_HAZARD_BASELINE.MP },
    { _id: 6, name: 'Karnataka 40 MW', state: 'KA', ...IN_HAZARD_BASELINE.KA },
    { _id: 7, name: 'AP 30 MW', state: 'AP', ...IN_HAZARD_BASELINE.AP },
    { _id: 8, name: 'Oman NH₃ Hub', state: 'OM', ...IN_HAZARD_BASELINE.OM },
  ],
};

export default function TcfdPhysicalRiskAssessmentPage() {
  const sc = useScenario('tcfd-physical', DEFAULTS);
  const s = sc.state;

  const rows = useMemo(() => s.assets.map(a => {
    const rar = rarFor(a, s.ssp, s.horizon);
    const rarAfter = rar * (1 - s.adaptBenefitPct / 100);
    return { ...a, rar, rarAfter };
  }), [s.assets, s.ssp, s.horizon, s.adaptBenefitPct]);

  const portRar = rows.reduce((x, r) => x + r.rar, 0) / Math.max(1, rows.length);
  const portRarAfter = rows.reduce((x, r) => x + r.rarAfter, 0) / Math.max(1, rows.length);
  const rarDollar = s.ebitda * (portRar / 100);
  const rarDollarAfter = s.ebitda * (portRarAfter / 100);

  const dscrBase = s.debtSvc > 0 ? s.ebitda / s.debtSvc : 0;
  const dscrStress = s.debtSvc > 0 ? Math.max(0, (s.ebitda - rarDollar)) / s.debtSvc : 0;
  const dscrAdapt = s.debtSvc > 0 ? Math.max(0, (s.ebitda - rarDollarAfter - s.adaptOpex)) / s.debtSvc : 0;

  const avoidedLoss15yr = (rarDollar - rarDollarAfter) * 15;
  const roi = s.adaptCapex > 0 ? (avoidedLoss15yr - s.adaptOpex * 15) / s.adaptCapex : 0;
  const ready = s.assets.length >= 1 && s.portfolio.trim();

  const upd = (k) => (v) => sc.update({ [k]: v });
  const updAsset = (i, k, v) => {
    sc.update({ assets: s.assets.map((a, j) => {
      if (j !== i) return a;
      const next = { ...a, [k]: v };
      if (k === 'state' && IN_HAZARD_BASELINE[v]) Object.assign(next, IN_HAZARD_BASELINE[v]);
      return next;
    }) });
  };

  const hot = [...rows].sort((a, b) => b.rar - a.rar).slice(0, 3);

  const onDeliver = () => {
    const body = [
      html.h1(`TCFD Physical Risk Report — ${s.portfolio}`),
      html.meta({ Scenario: s.ssp, Horizon: s.horizon, 'EBITDA (₹ Cr)': s.ebitda, Generated: new Date().toLocaleDateString() }),
      html.h2('1. Governance & Strategy'),
      html.p(`This report covers ${s.assets.length} asset${s.assets.length > 1 ? 's' : ''} exposed to five physical hazards (heat, water stress, cyclone, flood, dust). Analysis aligned to TCFD 4 pillars and IFRS S2.`),
      html.h2('2. Scenario & Methodology'),
      html.p(`Hazard intensities scored 0–10 per asset per peril. Revenue-at-Risk (RaR) formula: <code>0.6 × Σ(peril × weight) × SSP_multiplier</code>, capped at 40%. ${s.ssp} × ${s.horizon}: multiplier <b>${SSP_MULT[s.ssp][s.horizon]}×</b>.`),
      html.h2('3. Asset-Level Hazard Scores'),
      html.table(['Asset', 'Heat', 'Water', 'Cyclone', 'Flood', 'Dust', 'RaR %', 'Post-adapt RaR %'],
        rows.map(r => [r.name, r.heat, r.water, r.cyclone, r.flood, r.dust, r.rar.toFixed(1), r.rarAfter.toFixed(1)])),
      html.h2('4. Financial Impact'),
      html.p(`Portfolio RaR: <b>${portRar.toFixed(1)}%</b> (₹${rarDollar.toFixed(0)} Cr) · DSCR base <b>${dscrBase.toFixed(2)}x</b> → stressed <b>${dscrStress.toFixed(2)}x</b>${dscrStress < 1.2 ? ' ' + html.badge('red', 'COVENANT RISK') : ''}`),
      html.h2('5. Adaptation & ROI'),
      html.p(`Proposed capex ₹${s.adaptCapex} Cr reduces RaR by ${s.adaptBenefitPct}%. Post-adaptation DSCR: <b>${dscrAdapt.toFixed(2)}x</b>. 15-yr ROI: <b>${(roi * 100).toFixed(0)}%</b>. Priority sites: ${hot.map(h => h.name).join(', ')}.`),
    ].join('');
    openDeliverable(body, `TCFD Physical Risk — ${s.portfolio}`);
  };

  return (
    <ToolShell
      header={<PageHeader code="EP-EB5 · TCFD" title="Physical Risk Assessment Tool" subtitle="Score 5-peril hazards across asset portfolio, model DSCR under climate stress, size adaptation ROI." />}
      steps={
        <>
          <Step n={1} title="Portfolio context">
            <FieldRow label="Portfolio name"><TextInput value={s.portfolio} onChange={upd('portfolio')} style={{ width: 320 }} /></FieldRow>
            <FieldRow label="EBITDA"><NumInput value={s.ebitda} onChange={upd('ebitda')} step={10} suffix="₹ Cr" /></FieldRow>
            <FieldRow label="Annual debt service"><NumInput value={s.debtSvc} onChange={upd('debtSvc')} step={10} suffix="₹ Cr" /></FieldRow>
          </Step>

          <Step n={2} title="Climate scenario">
            <FieldRow label="SSP pathway"><SelectInput value={s.ssp} onChange={upd('ssp')} options={Object.keys(SSP_MULT)} /></FieldRow>
            <FieldRow label="Horizon"><SelectInput value={String(s.horizon)} onChange={v => upd('horizon')(+v)} options={['2030', '2040', '2050']} /></FieldRow>
            <Note level="info">{s.ssp} × {s.horizon} → RaR multiplier <b style={{ color: T.gold }}>{SSP_MULT[s.ssp][s.horizon]}×</b></Note>
          </Step>

          <Step n={3} title="Asset hazard matrix" hint="Pick state → hazard scores auto-fill from IMD + WRI Aqueduct + IPCC AR6. Override any cell to reflect site-level granularity.">
            <Worksheet
              cols={[
                { h: 'Asset', width: '1.4fr', edit: (r, i) => <TextInput value={r.name} onChange={v => updAsset(i, 'name', v)} style={{ width: '100%' }} /> },
                { h: 'State', width: '65px', edit: (r, i) => <SelectInput value={r.state || 'RJ'} onChange={v => updAsset(i, 'state', v)} options={STATES} style={{ width: '100%' }} /> },
                { h: 'Heat', width: '60px', edit: (r, i) => <NumInput value={r.heat} onChange={v => updAsset(i, 'heat', v)} min={0} max={10} style={{ width: 42 }} /> },
                { h: 'Water', width: '60px', edit: (r, i) => <NumInput value={r.water} onChange={v => updAsset(i, 'water', v)} min={0} max={10} style={{ width: 42 }} /> },
                { h: 'Cyclone', width: '70px', edit: (r, i) => <NumInput value={r.cyclone} onChange={v => updAsset(i, 'cyclone', v)} min={0} max={10} style={{ width: 42 }} /> },
                { h: 'Flood', width: '60px', edit: (r, i) => <NumInput value={r.flood} onChange={v => updAsset(i, 'flood', v)} min={0} max={10} style={{ width: 42 }} /> },
                { h: 'Dust', width: '60px', edit: (r, i) => <NumInput value={r.dust} onChange={v => updAsset(i, 'dust', v)} min={0} max={10} style={{ width: 42 }} /> },
                { h: 'RaR %', width: '80px', edit: (r) => {
                    const rar = rarFor(r, s.ssp, s.horizon);
                    return <span style={{ fontFamily: T.mono, color: rar > 20 ? T.red : rar > 10 ? T.amber : T.green, fontSize: 12 }}>{rar.toFixed(1)}</span>;
                  } },
              ]}
              rows={rows}
              onAdd={() => sc.update({ assets: [...s.assets, { _id: Date.now(), name: 'New asset', state: 'RJ', ...IN_HAZARD_BASELINE.RJ }] })}
              onDel={(i) => sc.update({ assets: s.assets.filter((_, j) => j !== i) })}
            />
          </Step>

          <Step n={4} title="Adaptation economics" hint="Size capex/opex for adaptation — output rail shows ROI and post-adaptation DSCR.">
            <Collapsible title="NGFS damage function cross-check">
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <thead><tr style={{ color: T.textMut }}><th style={{ padding: 4, textAlign: 'left' }}>NGFS scenario</th><th style={{ padding: 4 }}>β (% GDP/°C)</th><th style={{ padding: 4 }}>Max loss %</th><th style={{ padding: 4 }}>EBITDA impact</th></tr></thead>
                <tbody>{Object.entries(NGFS_DAMAGE).map(([n, d]) => {
                  const tempRise = { 'Orderly (1.5°C)': 0.5, 'Disorderly (late action)': 1.5, 'Hot house (3°C+)': 3.0, 'Current policies (2.8°C)': 2.0 }[n];
                  const pct = Math.min(d.maxLoss, d.beta * tempRise);
                  return <tr key={n} style={{ borderTop: `1px solid ${T.borderL}`, fontFamily: T.mono }}>
                    <td style={{ padding: 4, fontFamily: T.font, color: T.textSec }}>{n}</td>
                    <td style={{ padding: 4, textAlign: 'right' }}>{d.beta}</td>
                    <td style={{ padding: 4, textAlign: 'right' }}>{d.maxLoss}</td>
                    <td style={{ padding: 4, color: T.amber, textAlign: 'right' }}>₹{(s.ebitda * pct / 100).toFixed(0)} Cr</td>
                  </tr>;
                })}</tbody>
              </table>
            </Collapsible>
            <FieldRow label="Adaptation capex (upfront)"><NumInput value={s.adaptCapex} onChange={upd('adaptCapex')} step={5} suffix="₹ Cr" /></FieldRow>
            <FieldRow label="Adaptation opex (annual)"><NumInput value={s.adaptOpex} onChange={upd('adaptOpex')} step={1} suffix="₹ Cr" /></FieldRow>
            <FieldRow label="RaR reduction" hint="% of revenue-at-risk avoided post-adaptation"><NumInput value={s.adaptBenefitPct} onChange={upd('adaptBenefitPct')} min={0} max={90} suffix="%" /></FieldRow>
            <Collapsible title="DSCR progression">
              <div style={{ fontFamily: T.mono, fontSize: 12, color: T.textSec, lineHeight: 1.8 }}>
                Base: <span style={{ color: T.green }}>{dscrBase.toFixed(2)}x</span><br />
                Under {s.ssp} {s.horizon}: <span style={{ color: dscrStress < 1.2 ? T.red : T.amber }}>{dscrStress.toFixed(2)}x</span><br />
                Post-adaptation: <span style={{ color: dscrAdapt >= 1.2 ? T.green : T.amber }}>{dscrAdapt.toFixed(2)}x</span>
              </div>
            </Collapsible>
          </Step>

          <Step n={5} title="Generate TCFD report">
            {!ready && <Note level="bad">Need portfolio name and ≥1 asset.</Note>}
            {ready && <Note level="ok">Ready. Deliverable is aligned to TCFD 4 pillars / IFRS S2 Climate.</Note>}
          </Step>
        </>
      }
      rail={
        <OutputRail
          label="LIVE TCFD RESULT"
          stats={[
            { label: 'Portfolio RaR', value: `${portRar.toFixed(1)}%`, sub: `${s.ssp} ${s.horizon}`, color: portRar > 20 ? T.red : T.amber },
            { label: 'RaR (₹ Cr)', value: rarDollar.toFixed(0), sub: `of ₹${s.ebitda} EBITDA`, color: T.amber },
            { label: 'DSCR stress', value: `${dscrStress.toFixed(2)}x`, sub: `base ${dscrBase.toFixed(2)}x`, color: dscrStress < 1.2 ? T.red : T.green },
            { label: 'Adapt ROI (15y)', value: `${(roi * 100).toFixed(0)}%`, sub: `capex ₹${s.adaptCapex}Cr`, color: roi > 0 ? T.green : T.red },
          ]}
          preview={
            <div>
              <div><b style={{ color: T.text }}>{s.portfolio}</b></div>
              <div style={{ marginTop: 4 }}>{s.assets.length} assets · SSP {s.ssp.slice(-3)}</div>
              <div>Top hotspots:</div>
              <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>{hot.map(h => `${h.name} (${h.rar.toFixed(0)}%)`).join(' · ')}</div>
            </div>
          }
          cta={<PrimaryCTA onClick={onDeliver}>Generate TCFD Report →</PrimaryCTA>}
          menu={
            <ToolMenu
              scenario={sc}
              onExportCsv={() => downloadText('tcfd-assets.csv', toCsv(rows), 'text/csv')}
              onExportJson={() => downloadText('tcfd-scenario.json', JSON.stringify(s, null, 2), 'application/json')}
              onImportCsv={(r) => sc.update({ assets: r.map((x, i) => ({ _id: Date.now() + i, name: x.name || 'Asset', lat: +x.lat || 20, lon: +x.lon || 78, heat: +x.heat || 5, water: +x.water || 5, cyclone: +x.cyclone || 3, flood: +x.flood || 3, dust: +x.dust || 3 })) })}
              importLabel="Import assets CSV"
            />
          }
        />
      }
    />
  );
}
