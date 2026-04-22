import React, { useMemo, useState } from 'react';
import {
  T, useScenario, openDeliverable, toCsv, downloadText, html,
  ToolShell, Step, OutputRail, PrimaryCTA, ToolMenu,
  FieldRow, Worksheet, NumInput, TextInput, SelectInput, Collapsible, Note, PageHeader,
  Tornado, Heatmap, ProgressRing, MonteCarloCard,
} from '../../_shared/AdvisoryToolkit';
import {
  SSP_MULT, IN_HAZARD_BASELINE, NGFS_DAMAGE,
  CARBON_PRICE_PATHS, TRANSITION_ELASTICITY, IFRS_S2_CHECKLIST,
  CLIMATE_OPPORTUNITIES, monteCarlo, tornado,
} from '../../_shared/AdvisoryReference';

const STATES = Object.keys(IN_HAZARD_BASELINE);
const SECTORS = Object.keys(TRANSITION_ELASTICITY);
const PRICE_PATHS = Object.keys(CARBON_PRICE_PATHS);
const HORIZONS = [2030, 2040, 2050];

const rarFor = (a, ssp, yr) => {
  const mult = SSP_MULT[ssp]?.[yr] ?? 1;
  return Math.min(40, 0.6 * (a.heat * 1.2 + a.water * 1.5 + a.cyclone * 2.0 + a.flood * 1.8 + a.dust * 0.8) * mult);
};

// Transition EBITDA impact %: elasticity × carbon price (normalised to $/t) × scope1+2 intensity factor
const transitionImpactPct = (sector, price, intensity) => {
  const elast = TRANSITION_ELASTICITY[sector] ?? -0.05;
  // elast is per $100/t; intensity is 0..2 multiplier (1.0 = sector-avg)
  return elast * (price / 100) * intensity * 100; // returns % of EBITDA
};

const DEFAULTS = {
  portfolio: 'ACME Solar + H₂ Assets',
  sector: 'Utilities — Power (renewables)',
  intensity: 1.0,
  ssp: 'SSP2-4.5',
  pricePath: 'NGFS Orderly (1.5°C)',
  horizon: 2040,
  ebitda: 1200,
  debtSvc: 420,
  adaptCapex: 80,
  adaptOpex: 12,
  adaptBenefitPct: 45,
  opportunityAdoption: 60,
  mcRuns: 800,
  checklist: { '6a': true, '6b': true, '10': true, '13': false, '14': false, '22': true, '25': true, '29a': true, '29b': false, '29d': false, '33': false },
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
  const [mcTrigger, setMcTrigger] = useState(0);

  const rows = useMemo(() => s.assets.map(a => {
    const rar = rarFor(a, s.ssp, s.horizon);
    const rarAfter = rar * (1 - s.adaptBenefitPct / 100);
    return { ...a, rar, rarAfter };
  }), [s.assets, s.ssp, s.horizon, s.adaptBenefitPct]);

  const portRar = rows.reduce((x, r) => x + r.rar, 0) / Math.max(1, rows.length);
  const portRarAfter = rows.reduce((x, r) => x + r.rarAfter, 0) / Math.max(1, rows.length);
  const rarDollar = s.ebitda * (portRar / 100);
  const rarDollarAfter = s.ebitda * (portRarAfter / 100);

  // Transition risk: carbon price @ horizon × elasticity × intensity
  const carbonPrice = CARBON_PRICE_PATHS[s.pricePath]?.[s.horizon] ?? 0;
  const transPct = transitionImpactPct(s.sector, carbonPrice, s.intensity);
  const transDollar = s.ebitda * (transPct / 100); // negative for loss, positive for gain

  // Combined risk
  const totalImpactPct = portRar - transPct; // physical RaR% minus transition% (transPct negative = loss, so subtract negative = add positive = larger loss)
  // Fix: we want combined loss = physical loss + transition loss. transPct can be +/-. Loss = rar - trans_gain
  const combinedLossPct = portRar + Math.max(0, -transPct); // physical + (transition loss if negative elast)
  const combinedDollar = s.ebitda * (combinedLossPct / 100);

  const dscrBase = s.debtSvc > 0 ? s.ebitda / s.debtSvc : 0;
  const dscrStress = s.debtSvc > 0 ? Math.max(0, s.ebitda - combinedDollar) / s.debtSvc : 0;
  const dscrAdapt = s.debtSvc > 0 ? Math.max(0, s.ebitda - rarDollarAfter - s.adaptOpex + Math.min(0, transDollar) + oppUplift()) / s.debtSvc : 0;

  // Opportunities: weighted NPV uplift at adoption %
  function oppUplift() {
    const adoptFrac = s.opportunityAdoption / 100;
    return CLIMATE_OPPORTUNITIES.reduce((x, o) => x + s.ebitda * (o.npvPctEbitda / 100) * adoptFrac / o.horizonY, 0);
  }
  const annualOppUplift = oppUplift();

  const avoidedLoss15yr = (rarDollar - rarDollarAfter) * 15;
  const roi = s.adaptCapex > 0 ? (avoidedLoss15yr - s.adaptOpex * 15) / s.adaptCapex : 0;

  // Multi-horizon × scenario heatmap (Physical × Transition combined loss %)
  const heatData = useMemo(() => {
    const d = {};
    PRICE_PATHS.forEach(pp => {
      d[pp] = {};
      HORIZONS.forEach(y => {
        const ssp = s.ssp;
        const rarAvg = s.assets.reduce((x, a) => x + rarFor(a, ssp, y), 0) / Math.max(1, s.assets.length);
        const p = CARBON_PRICE_PATHS[pp]?.[y] ?? 0;
        const t = transitionImpactPct(s.sector, p, s.intensity);
        d[pp][String(y)] = rarAvg + Math.max(0, -t);
      });
    });
    return d;
  }, [s.assets, s.ssp, s.sector, s.intensity]);

  // Monte Carlo: RaR × adaptation benefit × carbon price uncertainty
  const mc = useMemo(() => {
    void mcTrigger;
    return monteCarlo(
      ({ rarMult, benefit, priceMult }) => {
        const physLoss = portRar * rarMult * (1 - benefit / 100);
        const trans = transitionImpactPct(s.sector, carbonPrice * priceMult, s.intensity);
        return (physLoss + Math.max(0, -trans)) * s.ebitda / 100;
      },
      {
        rarMult: { min: 0.75, mode: 1.0, max: 1.35 },
        benefit: { min: Math.max(0, s.adaptBenefitPct - 15), mode: s.adaptBenefitPct, max: Math.min(90, s.adaptBenefitPct + 15) },
        priceMult: { min: 0.6, mode: 1.0, max: 1.6 },
      },
      s.mcRuns
    );
  }, [mcTrigger, portRar, carbonPrice, s.sector, s.intensity, s.ebitda, s.adaptBenefitPct, s.mcRuns]);

  // Tornado: drivers of combined loss $
  const torn = useMemo(() => tornado(
    { rar: portRar, price: carbonPrice, elast: TRANSITION_ELASTICITY[s.sector] ?? -0.05, intensity: s.intensity, benefit: s.adaptBenefitPct },
    (v) => {
      const phys = v.rar * (1 - v.benefit / 100);
      const trans = v.elast * (v.price / 100) * v.intensity * 100;
      return (phys + Math.max(0, -trans)) * s.ebitda / 100;
    },
    0.20
  ), [portRar, carbonPrice, s.sector, s.intensity, s.adaptBenefitPct, s.ebitda]);

  // IFRS S2 checklist
  const checklistPct = (Object.values(s.checklist).filter(Boolean).length / IFRS_S2_CHECKLIST.length) * 100;

  // Opportunity table rows
  const oppRows = CLIMATE_OPPORTUNITIES.map(o => {
    const totalNpv = s.ebitda * (o.npvPctEbitda / 100);
    const adopted = totalNpv * (s.opportunityAdoption / 100);
    return { ...o, totalNpv, adopted, annual: adopted / o.horizonY };
  });

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
  const toggleCheck = (id) => sc.update({ checklist: { ...s.checklist, [id]: !s.checklist[id] } });

  const hot = [...rows].sort((a, b) => b.rar - a.rar).slice(0, 3);

  const onDeliver = () => {
    const body = [
      html.h1(`TCFD / IFRS S2 Climate Risk Report — ${s.portfolio}`),
      html.meta({ Sector: s.sector, 'SSP (physical)': s.ssp, 'Carbon price path': s.pricePath, Horizon: s.horizon, 'EBITDA (₹ Cr)': s.ebitda, Generated: new Date().toLocaleDateString() }),
      html.h2('1. Executive Summary'),
      html.p(`Combined physical + transition climate risk for ${s.assets.length} asset${s.assets.length > 1 ? 's' : ''} at ${s.horizon} under ${s.ssp} × ${s.pricePath}: <b>${combinedLossPct.toFixed(1)}% of EBITDA</b> (₹${combinedDollar.toFixed(0)} Cr). Adaptation ROI over 15 years: <b>${(roi * 100).toFixed(0)}%</b>. IFRS S2 readiness: <b>${checklistPct.toFixed(0)}%</b>.`),
      html.h2('2. Physical Risk — Asset Hazard Scores'),
      html.table(['Asset', 'Heat', 'Water', 'Cyclone', 'Flood', 'Dust', 'RaR %', 'Post-adapt RaR %'],
        rows.map(r => [r.name, r.heat, r.water, r.cyclone, r.flood, r.dust, r.rar.toFixed(1), r.rarAfter.toFixed(1)])),
      html.h2('3. Transition Risk'),
      html.p(`Sector elasticity <b>${TRANSITION_ELASTICITY[s.sector]}</b> per $100/t. At carbon price $${carbonPrice}/t (${s.pricePath} @ ${s.horizon}) and intensity factor ${s.intensity.toFixed(2)}: EBITDA impact <b>${transPct.toFixed(1)}%</b> (${transPct >= 0 ? 'opportunity' : 'loss'} ₹${Math.abs(transDollar).toFixed(0)} Cr).`),
      html.h2('4. Multi-Horizon × Scenario Heatmap'),
      html.p('Combined physical + transition loss % across NGFS/IEA price paths × horizons (2030/2040/2050).'),
      html.table(['Price path', '2030', '2040', '2050'],
        PRICE_PATHS.map(pp => [pp, heatData[pp]['2030'].toFixed(1) + '%', heatData[pp]['2040'].toFixed(1) + '%', heatData[pp]['2050'].toFixed(1) + '%'])),
      html.h2('5. Monte Carlo Distribution (Combined Loss ₹ Cr)'),
      html.p(`N=${s.mcRuns}. P5=${mc.p05.toFixed(0)} · P50=${mc.p50.toFixed(0)} · Mean=${mc.mean.toFixed(0)} · P95=${mc.p95.toFixed(0)}.`),
      html.h2('6. Climate Opportunities'),
      html.table(['Opportunity', 'Category', 'NPV % EBITDA', 'Total NPV', 'Annual uplift'],
        oppRows.map(r => [r.name, r.cat, r.npvPctEbitda.toFixed(1) + '%', '₹' + r.totalNpv.toFixed(0) + ' Cr', '₹' + r.annual.toFixed(0) + ' Cr'])),
      html.h2('7. Financial Resilience'),
      html.p(`DSCR base <b>${dscrBase.toFixed(2)}x</b> → stressed <b>${dscrStress.toFixed(2)}x</b>${dscrStress < 1.2 ? ' ' + html.badge('red', 'COVENANT RISK') : ''} → post-adaptation <b>${dscrAdapt.toFixed(2)}x</b>.`),
      html.h2('8. NGFS Damage Function Cross-Check'),
      html.table(['NGFS scenario', 'β (% GDP/°C)', 'Max loss %', 'EBITDA impact'],
        Object.entries(NGFS_DAMAGE).map(([n, d]) => {
          const tempRise = { 'Orderly (1.5°C)': 0.5, 'Disorderly (late action)': 1.5, 'Hot house (3°C+)': 3.0, 'Current policies (2.8°C)': 2.0 }[n] ?? 1.5;
          const pct = Math.min(d.maxLoss, d.beta * tempRise);
          return [n, d.beta, d.maxLoss, '₹' + (s.ebitda * pct / 100).toFixed(0) + ' Cr'];
        })),
      html.h2('9. IFRS S2 Disclosure Readiness'),
      html.table(['§', 'Area', 'Requirement', 'Covered?'],
        IFRS_S2_CHECKLIST.map(c => [c.id, c.area, c.item, s.checklist[c.id] ? html.badge('green', 'YES') : html.badge('amber', 'GAP')])),
      html.h2('10. Recommendation'),
      html.p(`Priority adaptation sites: <b>${hot.map(h => h.name).join(', ')}</b>. Complete ${IFRS_S2_CHECKLIST.length - Object.values(s.checklist).filter(Boolean).length} remaining IFRS S2 checklist items before next reporting cycle.`),
    ].join('');
    openDeliverable(body, `TCFD/IFRS S2 — ${s.portfolio}`);
  };

  return (
    <ToolShell
      header={<PageHeader code="EP-EB5 · TCFD / IFRS S2" title="Climate Risk Assessment (Physical + Transition)" subtitle="Score 5-peril hazards, model carbon-price transition shock, combined scenario×horizon heatmap, Monte-Carlo, IFRS S2 readiness." />}
      steps={
        <>
          <Step n={1} title="Portfolio context">
            <FieldRow label="Portfolio name"><TextInput value={s.portfolio} onChange={upd('portfolio')} style={{ width: 320 }} /></FieldRow>
            <FieldRow label="Sector"><SelectInput value={s.sector} onChange={upd('sector')} options={SECTORS} style={{ width: 280 }} /></FieldRow>
            <FieldRow label="Emissions intensity factor" hint="1.0 = sector-avg; >1 for fossil-heavy sub-segments"><NumInput value={s.intensity} onChange={upd('intensity')} step={0.1} min={0} max={3} /></FieldRow>
            <FieldRow label="EBITDA"><NumInput value={s.ebitda} onChange={upd('ebitda')} step={10} suffix="₹ Cr" /></FieldRow>
            <FieldRow label="Annual debt service"><NumInput value={s.debtSvc} onChange={upd('debtSvc')} step={10} suffix="₹ Cr" /></FieldRow>
          </Step>

          <Step n={2} title="Scenarios — physical (SSP) & transition (carbon price)">
            <FieldRow label="SSP pathway"><SelectInput value={s.ssp} onChange={upd('ssp')} options={Object.keys(SSP_MULT)} /></FieldRow>
            <FieldRow label="Carbon price path"><SelectInput value={s.pricePath} onChange={upd('pricePath')} options={PRICE_PATHS} style={{ width: 240 }} /></FieldRow>
            <FieldRow label="Horizon"><SelectInput value={String(s.horizon)} onChange={v => upd('horizon')(+v)} options={HORIZONS.map(String)} /></FieldRow>
            <Note level="info">
              Physical: {s.ssp} × {s.horizon} → RaR mult <b style={{ color: T.gold }}>{SSP_MULT[s.ssp][s.horizon]}×</b>.&nbsp;
              Transition: {s.pricePath} → <b style={{ color: T.gold }}>${carbonPrice}/t</b> → EBITDA impact <b style={{ color: transPct >= 0 ? T.green : T.red }}>{transPct.toFixed(1)}%</b>.
            </Note>
          </Step>

          <Step n={3} title="Asset hazard matrix" hint="Pick state → hazard scores auto-fill from IMD + WRI Aqueduct + IPCC AR6. Override any cell.">
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

          <Step n={4} title="Multi-horizon × scenario heatmap" hint="Combined physical + transition loss % of EBITDA across all NGFS/IEA carbon price paths × 2030/2040/2050 horizons.">
            <Heatmap
              data={heatData}
              rows={PRICE_PATHS}
              cols={['2030', '2040', '2050']}
              fmt={(n) => n.toFixed(1) + '%'}
              loColor={T.green}
              hiColor={T.red}
            />
          </Step>

          <Step n={5} title="Monte Carlo — combined loss distribution" hint="Triangular: RaR mult [0.75, 1.0, 1.35] × benefit ±15pp × price mult [0.6, 1.0, 1.6].">
            <FieldRow label="MC runs"><NumInput value={s.mcRuns} onChange={upd('mcRuns')} step={200} min={100} max={5000} /></FieldRow>
            <div style={{ marginTop: 8 }}>
              <button onClick={() => setMcTrigger(x => x + 1)} style={{ background: T.surfaceH, color: T.gold, border: `1px solid ${T.border}`, padding: '4px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 3, fontFamily: T.mono }}>↻ Re-sample</button>
            </div>
            <div style={{ marginTop: 10 }}>
              <MonteCarloCard title={`Combined loss ₹ Cr @ ${s.horizon}`} stats={mc} fmt={(n) => n.toFixed(0)} unit=" ₹Cr" />
            </div>
          </Step>

          <Step n={6} title="Sensitivity (tornado) — combined loss drivers">
            <Tornado
              rows={torn.map(t => ({ label: t.driver, low: t.low, high: t.high }))}
              fmt={(n) => '₹' + n.toFixed(0) + ' Cr'}
            />
            <Note level="info">±20% input swing per driver. Widest bar = dominant driver.</Note>
          </Step>

          <Step n={7} title="Climate opportunities" hint="CLIMATE_OPPORTUNITIES (TCFD Strategy pillar) with adoption % slider; annualised uplift flows into DSCR post-adaptation.">
            <FieldRow label="Opportunity adoption %"><NumInput value={s.opportunityAdoption} onChange={upd('opportunityAdoption')} min={0} max={100} suffix="%" /></FieldRow>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', marginTop: 8 }}>
              <thead><tr style={{ color: T.textMut }}>
                <th style={{ padding: 4, textAlign: 'left' }}>Opportunity</th>
                <th style={{ padding: 4, textAlign: 'left' }}>Category</th>
                <th style={{ padding: 4, textAlign: 'right' }}>NPV %</th>
                <th style={{ padding: 4, textAlign: 'right' }}>Total NPV</th>
                <th style={{ padding: 4, textAlign: 'right' }}>Annual uplift</th>
              </tr></thead>
              <tbody>{oppRows.map((r, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${T.borderL}` }}>
                  <td style={{ padding: 4, color: T.text }}>{r.name}</td>
                  <td style={{ padding: 4, color: T.textSec }}>{r.cat}</td>
                  <td style={{ padding: 4, textAlign: 'right', fontFamily: T.mono, color: T.gold }}>{r.npvPctEbitda.toFixed(1)}%</td>
                  <td style={{ padding: 4, textAlign: 'right', fontFamily: T.mono, color: T.green }}>₹{r.totalNpv.toFixed(0)}</td>
                  <td style={{ padding: 4, textAlign: 'right', fontFamily: T.mono, color: T.green }}>₹{r.annual.toFixed(0)}</td>
                </tr>
              ))}</tbody>
            </table>
            <div style={{ marginTop: 6, fontSize: 11, color: T.textSec, fontFamily: T.mono }}>
              Annual uplift (weighted by adoption): <b style={{ color: T.green }}>₹{annualOppUplift.toFixed(0)} Cr</b>
            </div>
          </Step>

          <Step n={8} title="Adaptation economics">
            <FieldRow label="Adaptation capex"><NumInput value={s.adaptCapex} onChange={upd('adaptCapex')} step={5} suffix="₹ Cr" /></FieldRow>
            <FieldRow label="Adaptation opex (annual)"><NumInput value={s.adaptOpex} onChange={upd('adaptOpex')} step={1} suffix="₹ Cr" /></FieldRow>
            <FieldRow label="RaR reduction"><NumInput value={s.adaptBenefitPct} onChange={upd('adaptBenefitPct')} min={0} max={90} suffix="%" /></FieldRow>
            <Collapsible title="DSCR progression">
              <div style={{ fontFamily: T.mono, fontSize: 12, color: T.textSec, lineHeight: 1.8 }}>
                Base: <span style={{ color: T.green }}>{dscrBase.toFixed(2)}x</span><br />
                Under {s.ssp} {s.horizon} (phys+trans): <span style={{ color: dscrStress < 1.2 ? T.red : T.amber }}>{dscrStress.toFixed(2)}x</span><br />
                Post-adaptation + opportunities: <span style={{ color: dscrAdapt >= 1.2 ? T.green : T.amber }}>{dscrAdapt.toFixed(2)}x</span>
              </div>
            </Collapsible>
          </Step>

          <Step n={9} title="IFRS S2 disclosure checklist" hint="Tick each requirement you can evidence. Ring shows readiness %.">
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <ProgressRing pct={checklistPct} size={84} label="S2 ready" color={checklistPct >= 80 ? T.green : checklistPct >= 50 ? T.amber : T.red} />
              <div style={{ flex: 1 }}>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <tbody>{IFRS_S2_CHECKLIST.map(c => (
                    <tr key={c.id} style={{ borderTop: `1px solid ${T.borderL}` }}>
                      <td style={{ padding: 4, width: 30 }}><input type="checkbox" checked={!!s.checklist[c.id]} onChange={() => toggleCheck(c.id)} /></td>
                      <td style={{ padding: 4, fontFamily: T.mono, color: T.gold, width: 40 }}>{c.id}</td>
                      <td style={{ padding: 4, color: T.textSec, width: 120 }}>{c.area}</td>
                      <td style={{ padding: 4, color: T.text }}>{c.item}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </Step>

          <Step n={10} title="Generate TCFD / IFRS S2 report">
            {!ready && <Note level="bad">Need portfolio name and ≥1 asset.</Note>}
            {ready && <Note level="ok">Ready. Deliverable spans TCFD 4 pillars, IFRS S2, NGFS cross-check, MC distribution, multi-horizon heatmap, opportunities, adaptation ROI.</Note>}
          </Step>
        </>
      }
      rail={
        <OutputRail
          label="LIVE TCFD / S2 RESULT"
          stats={[
            { label: 'Physical RaR', value: `${portRar.toFixed(1)}%`, sub: `${s.ssp} ${s.horizon}`, color: portRar > 20 ? T.red : T.amber },
            { label: 'Transition EBITDA', value: `${transPct.toFixed(1)}%`, sub: `$${carbonPrice}/t`, color: transPct >= 0 ? T.green : T.red },
            { label: 'Combined loss', value: `₹${combinedDollar.toFixed(0)} Cr`, sub: `${combinedLossPct.toFixed(1)}% EBITDA`, color: T.red },
            { label: 'MC P95 loss', value: `₹${mc.p95.toFixed(0)}`, sub: `P50 ₹${mc.p50.toFixed(0)}`, color: T.amber },
            { label: 'DSCR stress', value: `${dscrStress.toFixed(2)}x`, sub: `base ${dscrBase.toFixed(2)}x`, color: dscrStress < 1.2 ? T.red : T.green },
            { label: 'IFRS S2 ready', value: `${checklistPct.toFixed(0)}%`, sub: `${Object.values(s.checklist).filter(Boolean).length}/${IFRS_S2_CHECKLIST.length} covered`, color: checklistPct >= 80 ? T.green : T.amber },
            { label: 'Adapt ROI (15y)', value: `${(roi * 100).toFixed(0)}%`, sub: `capex ₹${s.adaptCapex}Cr`, color: roi > 0 ? T.green : T.red },
            { label: 'Oppty uplift/yr', value: `₹${annualOppUplift.toFixed(0)}`, sub: `${s.opportunityAdoption}% adoption`, color: T.green },
          ]}
          preview={
            <div>
              <div><b style={{ color: T.text }}>{s.portfolio}</b></div>
              <div style={{ marginTop: 4 }}>{s.assets.length} assets · {s.sector.split('—')[0].trim()}</div>
              <div>Top hotspots:</div>
              <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>{hot.map(h => `${h.name} (${h.rar.toFixed(0)}%)`).join(' · ')}</div>
            </div>
          }
          cta={<PrimaryCTA onClick={onDeliver}>Generate TCFD / S2 Report →</PrimaryCTA>}
          menu={
            <ToolMenu
              scenario={sc}
              onExportCsv={() => downloadText('tcfd-assets.csv', toCsv(rows), 'text/csv')}
              onExportJson={() => downloadText('tcfd-scenario.json', JSON.stringify(s, null, 2), 'application/json')}
              onImportCsv={(r) => sc.update({ assets: r.map((x, i) => ({ _id: Date.now() + i, name: x.name || 'Asset', state: x.state || 'RJ', heat: +x.heat || 5, water: +x.water || 5, cyclone: +x.cyclone || 3, flood: +x.flood || 3, dust: +x.dust || 3 })) })}
              importLabel="Import assets CSV"
            />
          }
        />
      }
    />
  );
}
