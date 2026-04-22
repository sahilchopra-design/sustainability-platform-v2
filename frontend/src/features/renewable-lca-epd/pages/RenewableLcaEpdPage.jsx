import React, { useMemo, useState } from 'react';
import {
  T, useScenario, openDeliverable, toCsv, downloadText, html,
  ToolShell, Step, OutputRail, PrimaryCTA, ToolMenu,
  FieldRow, Worksheet, NumInput, TextInput, SelectInput, Collapsible, Note, PageHeader,
  Tornado, MonteCarloCard, Sparkline, Heatmap, ProgressRing
} from '../../_shared/AdvisoryToolkit';
import {
  LCA_EF as EF_LIB, PV_ARCHETYPES, LCA_PEER_BENCHMARKS, IEA_GRID_EF,
  LCA_IMPACT_CATEGORIES, CIRCULARITY, TRANSPORT_EF, TRANSPORT_DIST, GRID_DECARB,
  monteCarlo, tornado
} from '../../_shared/AdvisoryReference';

const COUNTRIES = Object.keys(IEA_GRID_EF);
const DEPLOY_COUNTRIES = ['India', 'USA', 'Germany', 'Global'];
const TRANSPORT_MODES = Object.keys(TRANSPORT_EF);

const DEFAULTS = {
  product: 'ACME 550W Mono PERC Module',
  declaredUnit: '1 kW installed capacity',
  manufacturer: 'ACME Solar',
  mfgCountry: 'India',
  deployCountry: 'India',
  transportMode: 'Ocean container (global)',
  lifetimeYears: 30,
  gridEF: 0.71,
  mfgElec: 580,
  eolScenario: 'Mixed (recycle 70%)',
  bom: [
    { _id: 1, material: 'Silicon (mono)', kgPerKw: 3.6, note: 'Cell wafers' },
    { _id: 2, material: 'Glass (tempered)', kgPerKw: 46.0, note: 'Front cover' },
    { _id: 3, material: 'Aluminium frame', kgPerKw: 8.2, note: 'Frame' },
    { _id: 4, material: 'EVA backsheet', kgPerKw: 2.1, note: 'Encapsulant' },
    { _id: 5, material: 'Copper wiring', kgPerKw: 0.9, note: 'Ribbon + cabling' },
    { _id: 6, material: 'Junction box (plastic)', kgPerKw: 0.6, note: 'J-box' },
  ],
  assets: [
    { _id: 1, name: 'Rajasthan 50 MW', mw: 50, yieldKwhPerKw: 1720, degPct: 0.5 },
    { _id: 2, name: 'Gujarat 40 MW', mw: 40, yieldKwhPerKw: 1680, degPct: 0.5 },
  ],
  peers: [
    { _id: 1, name: 'Global avg (IEA PVPS)', gco2PerKwh: 43 },
    { _id: 2, name: 'EU Best-in-class', gco2PerKwh: 28 },
    { _id: 3, name: 'China avg', gco2PerKwh: 58 },
  ],
  mcRuns: 2000,
};

const EOL_MULT = {
  'Landfill (0%)': 1.0,
  'Mixed (recycle 70%)': 0.72,
  'Closed-loop (recycle 95%)': 0.45,
  'Best available tech (98%)': 0.38,
};

export default function RenewableLcaEpdPage() {
  const sc = useScenario('renewable-lca-epd', DEFAULTS);
  const s = sc.state;
  const [mcTrigger, setMcTrigger] = useState(0);

  const bomRows = useMemo(() => s.bom.map(b => ({ ...b, ef: EF_LIB[b.material] || 0, kgCO2: (EF_LIB[b.material] || 0) * b.kgPerKw })), [s.bom]);
  const bomKgCO2 = bomRows.reduce((x, r) => x + r.kgCO2, 0);
  const mfgKgCO2 = s.mfgElec * s.gridEF;
  const totalBomKg = bomRows.reduce((x, r) => x + r.kgPerKw, 0);

  // Transport carbon
  const transDist = TRANSPORT_DIST[s.mfgCountry]?.[s.deployCountry] ?? TRANSPORT_DIST[s.mfgCountry]?.['Global'] ?? 9000;
  const transEf = TRANSPORT_EF[s.transportMode] ?? 0.012;
  const transKgCO2 = (totalBomKg / 1000) * transDist * transEf;

  // EoL benefit
  const eolMult = EOL_MULT[s.eolScenario] ?? 1.0;
  const cradleToGate = bomKgCO2 + mfgKgCO2 + transKgCO2;
  const moduleKgCO2PerKw = cradleToGate * eolMult;

  const assetRows = useMemo(() => s.assets.map(a => {
    const lifetimeKwh = a.mw * 1000 * a.yieldKwhPerKw * s.lifetimeYears * (1 - a.degPct / 100 * s.lifetimeYears / 2);
    const totalKgCO2 = moduleKgCO2PerKw * a.mw * 1000;
    const gco2PerKwh = lifetimeKwh > 0 ? (totalKgCO2 * 1000) / lifetimeKwh : 0;
    // Energy payback time
    const embodiedKwh = s.mfgElec * a.mw * 1000;
    const annualKwh = a.mw * 1000 * a.yieldKwhPerKw;
    const epbtYrs = annualKwh > 0 ? embodiedKwh / annualKwh : 0;
    return { ...a, lifetimeKwh, gco2PerKwh, epbtYrs };
  }), [s.assets, moduleKgCO2PerKw, s.lifetimeYears, s.mfgElec]);

  const totalMwPortfolio = Math.max(1, assetRows.reduce((x, r) => x + r.mw, 0));
  const wtdGco2 = assetRows.reduce((x, r) => x + r.gco2PerKwh * r.mw, 0) / totalMwPortfolio;
  const wtdEpbt = assetRows.reduce((x, r) => x + r.epbtYrs * r.mw, 0) / totalMwPortfolio;
  const bestPeer = Math.min(...s.peers.map(p => p.gco2PerKwh));
  const vsBest = wtdGco2 - bestPeer;
  const ready = s.product.trim() && s.bom.length >= 3 && s.assets.length >= 1;

  // Multi-impact results (scale from GWP ref using PV column)
  const impactRows = useMemo(() => {
    const gwpRef = LCA_IMPACT_CATEGORIES.GWP.refPV;
    const ratio = wtdGco2 / gwpRef;
    return Object.entries(LCA_IMPACT_CATEGORIES).map(([k, v]) => ({
      key: k, label: v.label, unit: v.unit,
      value: v.refPV * ratio,
      refPV: v.refPV, refWind: v.refWind, refBattery: v.refBattery,
    }));
  }, [wtdGco2]);

  // Circularity — Material Circularity Indicator (MCI)
  const mci = useMemo(() => {
    if (!bomRows.length) return { mci: 0, V: 0, M: 0, W: 0 };
    let sumMass = 0, weightedMCI = 0;
    bomRows.forEach(r => {
      const c = CIRCULARITY[r.material] || { recContent: 0, eolRec: 30, eolUseful: 15 };
      const V = c.recContent / 100;
      const C = c.eolUseful / 100;
      const W = 1 - V - C;
      const LFI = W;
      const F = 0.9;
      const rowMci = Math.max(0, 1 - LFI * F);
      weightedMCI += rowMci * r.kgPerKw;
      sumMass += r.kgPerKw;
    });
    return { mci: sumMass > 0 ? weightedMCI / sumMass : 0 };
  }, [bomRows]);

  // Grid decarbonization — in-use emissions trajectory
  const gridTrajectory = useMemo(() => {
    const path = GRID_DECARB[s.deployCountry] || GRID_DECARB.Global;
    return [2024, 2030, 2040, 2050].map(yr => ({ year: yr, mult: path[yr] ?? 1 }));
  }, [s.deployCountry]);

  // Monte Carlo — g CO2/kWh intensity under BOM ± EF ± mfg ± yield uncertainty
  const mc = useMemo(() => {
    if (totalMwPortfolio <= 0) return null;
    return monteCarlo(({ bomMult, efMult, yieldMult }) => {
      const bom = bomKgCO2 * bomMult;
      const mfg = mfgKgCO2 * efMult;
      const trans = transKgCO2 * bomMult;
      const modKg = (bom + mfg + trans) * eolMult;
      const lt = assetRows.reduce((x, a) => x + a.mw * 1000 * a.yieldKwhPerKw * yieldMult * s.lifetimeYears * (1 - a.degPct / 100 * s.lifetimeYears / 2), 0);
      const totalKg = modKg * totalMwPortfolio * 1000;
      return lt > 0 ? (totalKg * 1000) / lt : 0;
    }, {
      bomMult: { min: 0.85, mode: 1.0, max: 1.20 },
      efMult: { min: 0.80, mode: 1.0, max: 1.25 },
      yieldMult: { min: 0.92, mode: 1.0, max: 1.05 },
    }, s.mcRuns);
  }, [bomKgCO2, mfgKgCO2, transKgCO2, eolMult, assetRows, totalMwPortfolio, s.lifetimeYears, s.mcRuns, mcTrigger]);

  // Tornado on BOM drivers
  const tornadoRows = useMemo(() => {
    if (!bomRows.length) return [];
    const inputs = { bom: bomKgCO2, mfg: mfgKgCO2, trans: transKgCO2, eol: eolMult };
    return tornado(inputs, (v) => (v.bom + v.mfg + v.trans) * v.eol, 0.2)
      .map(r => ({ label: r.driver, low: r.low, high: r.high }));
  }, [bomKgCO2, mfgKgCO2, transKgCO2, eolMult, bomRows.length]);

  const peerPct = LCA_PEER_BENCHMARKS.filter(p => p.gco2PerKwh > wtdGco2).length;
  const peerRank = `beats ${peerPct}/${LCA_PEER_BENCHMARKS.length} benchmarks`;

  const upd = (k) => (v) => sc.update({ [k]: v });
  const updBom = (i, k, v) => sc.update({ bom: s.bom.map((b, j) => j === i ? { ...b, [k]: v } : b) });
  const updAsset = (i, k, v) => sc.update({ assets: s.assets.map((a, j) => j === i ? { ...a, [k]: v } : a) });
  const updPeer = (i, k, v) => sc.update({ peers: s.peers.map((p, j) => j === i ? { ...p, [k]: v } : p) });

  const loadArchetype = (name) => {
    const a = PV_ARCHETYPES[name];
    if (!a) return;
    sc.update({
      product: `${s.manufacturer} ${a.tech} (${name})`,
      bom: a.bom.map((b, i) => ({ _id: Date.now() + i, ...b })),
      mfgElec: a.mfgElec,
      assets: s.assets.map(x => ({ ...x, yieldKwhPerKw: a.yield, degPct: a.degPct })),
    });
  };
  const setCountry = (c) => sc.update({ mfgCountry: c, gridEF: IEA_GRID_EF[c] ?? s.gridEF });

  const onDeliver = () => {
    const body = [
      html.h1(`Environmental Product Declaration (draft) — ${s.product}`),
      html.meta({ Manufacturer: s.manufacturer, 'Mfg country': s.mfgCountry, 'Deploy country': s.deployCountry, 'Declared unit': s.declaredUnit, Lifetime: `${s.lifetimeYears} yrs`, Generated: new Date().toLocaleDateString() }),
      html.h2('1. Boundary & Declared Unit'),
      html.p(`Cradle-to-grave LCA for <b>${s.product}</b>. Boundary: raw materials → manufacturing → transport → use → end-of-life (${s.eolScenario}).`),
      html.h2('2. Headline Results'),
      html.p(`<b>Module embodied (incl. transport, EoL adj): ${moduleKgCO2PerKw.toFixed(0)} kg CO₂e / kW</b>`),
      html.p(`<b>Generation intensity: ${wtdGco2.toFixed(1)} g CO₂e / kWh</b> · EPBT: <b>${wtdEpbt.toFixed(2)} years</b> · MCI: <b>${(mci.mci * 100).toFixed(0)}%</b>`),
      html.p(`${vsBest > 0 ? html.badge('amber', `+${vsBest.toFixed(1)} vs best-in-class`) : html.badge('green', `${vsBest.toFixed(1)} below best-in-class`)}`),
      mc ? html.p(`<b>Monte Carlo (${s.mcRuns.toLocaleString()} runs):</b> P5 ${mc.p05.toFixed(1)} · P50 ${mc.p50.toFixed(1)} · P95 ${mc.p95.toFixed(1)} gCO₂/kWh.`) : '',
      html.h2('3. Multi-Impact (EN 15804+A2)'),
      html.table(['Category', 'Unit', 'Value', 'PV ref', 'Wind ref'],
        impactRows.map(r => [r.label, r.unit, r.value.toFixed(2), r.refPV, r.refWind])),
      html.h2('4. Bill of Materials + Circularity'),
      html.table(['Material', 'kg/kW', 'EF', 'kgCO₂e/kW', 'Recycled %', 'EoL useful %'],
        bomRows.map(r => {
          const c = CIRCULARITY[r.material] || { recContent: 0, eolUseful: 15 };
          return [r.material, r.kgPerKw.toFixed(2), r.ef.toFixed(2), r.kgCO2.toFixed(1), c.recContent, c.eolUseful];
        })),
      html.h2('5. Manufacturing + Transport + EoL'),
      html.p(`Mfg electricity: ${s.mfgElec} kWh/kW × ${s.gridEF} = <b>${mfgKgCO2.toFixed(0)} kgCO₂/kW</b>.`),
      html.p(`Transport (${s.mfgCountry}→${s.deployCountry}, ${s.transportMode}): ${transDist.toLocaleString()} km × ${transEf} = <b>${transKgCO2.toFixed(1)} kgCO₂/kW</b>.`),
      html.p(`EoL scenario: <b>${s.eolScenario}</b> → credit multiplier <b>${(eolMult * 100).toFixed(0)}%</b> of cradle-to-gate.`),
      html.h2('6. Asset Inventory & Generation LCA'),
      html.table(['Asset', 'MW', 'Yield', 'Lifetime GWh', 'gCO₂/kWh', 'EPBT yrs'],
        assetRows.map(r => [r.name, r.mw, r.yieldKwhPerKw, (r.lifetimeKwh / 1e6).toFixed(1), r.gco2PerKwh.toFixed(1), r.epbtYrs.toFixed(2)])),
      html.h2('7. Grid Decarbonization Trajectory'),
      html.table(['Year', `Grid multiplier (${s.deployCountry})`, 'Indicative use-phase intensity'],
        gridTrajectory.map(g => [g.year, g.mult.toFixed(2), (wtdGco2 * g.mult).toFixed(1) + ' g/kWh'])),
      html.h2('8. Peer Benchmark'),
      html.table(['Benchmark', 'g CO₂e/kWh'], s.peers.map(p => [p.name, p.gco2PerKwh])),
      html.h2('9. Verification Pathway'),
      html.p('EN 15804+A2 / ISO 14025 compliant. Third-party verification recommended (EPD Int\'l, IBU). 8–12 weeks.'),
      html.h2('10. Limitations'),
      html.p('EF values from ecoinvent 3.10 equivalent; primary data required for final registration. Toxicity categories (HTP, FAETP) excluded per EN 15804+A2 mandatory set.'),
    ].join('');
    openDeliverable(body, `EPD Draft — ${s.product}`);
  };

  return (
    <ToolShell
      header={<PageHeader code="EP-EB1 · LCA / EPD" title="Renewable EPD Builder" subtitle="Cradle-to-grave LCA with multi-impact analysis, circularity (MCI), transport + EoL modelling, grid decarbonization trajectory, and Monte Carlo uncertainty." />}
      steps={
        <>
          <Step n={1} title="Product & boundary">
            <FieldRow label="Product name"><TextInput value={s.product} onChange={upd('product')} style={{ width: 360 }} /></FieldRow>
            <FieldRow label="Declared unit"><TextInput value={s.declaredUnit} onChange={upd('declaredUnit')} style={{ width: 260 }} /></FieldRow>
            <FieldRow label="Manufacturer"><TextInput value={s.manufacturer} onChange={upd('manufacturer')} style={{ width: 260 }} /></FieldRow>
            <FieldRow label="Mfg country"><SelectInput value={s.mfgCountry} onChange={setCountry} options={COUNTRIES} style={{ width: 160 }} /></FieldRow>
            <FieldRow label="Deployment country"><SelectInput value={s.deployCountry} onChange={upd('deployCountry')} options={DEPLOY_COUNTRIES} style={{ width: 160 }} /></FieldRow>
            <FieldRow label="Lifetime"><NumInput value={s.lifetimeYears} onChange={upd('lifetimeYears')} suffix="years" /></FieldRow>
          </Step>

          <Step n={2} title="Bill of materials" hint="Load an ITRPV 2024 archetype or edit inline.">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: T.textMut, alignSelf: 'center', marginRight: 4 }}>LOAD ARCHETYPE:</span>
              {Object.keys(PV_ARCHETYPES).map(n => (
                <button key={n} onClick={() => loadArchetype(n)} style={{ background: T.surfaceH, color: T.gold, border: `1px solid ${T.border}`, padding: '4px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 2, fontFamily: T.mono }}>{n}</button>
              ))}
            </div>
            <Worksheet
              cols={[
                { h: 'Material', width: '1.6fr', edit: (r, i) => <SelectInput value={r.material} onChange={v => updBom(i, 'material', v)} options={Object.keys(EF_LIB)} style={{ width: '100%' }} /> },
                { h: 'kg / kW', width: '90px', edit: (r, i) => <NumInput value={r.kgPerKw} onChange={v => updBom(i, 'kgPerKw', v)} step={0.1} style={{ width: 70 }} /> },
                { h: 'EF', width: '70px', edit: (r) => <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textSec }}>{(EF_LIB[r.material] || 0).toFixed(2)}</span> },
                { h: 'kgCO₂/kW', width: '95px', edit: (r) => <span style={{ fontFamily: T.mono, color: T.gold, fontSize: 12 }}>{((EF_LIB[r.material] || 0) * r.kgPerKw).toFixed(1)}</span> },
                { h: 'Rec%', width: '60px', edit: (r) => <span style={{ fontFamily: T.mono, fontSize: 11, color: T.teal }}>{(CIRCULARITY[r.material]?.recContent ?? 0)}</span> },
                { h: 'EoL%', width: '60px', edit: (r) => <span style={{ fontFamily: T.mono, fontSize: 11, color: T.sage }}>{(CIRCULARITY[r.material]?.eolUseful ?? 15)}</span> },
                { h: 'Note', width: '1fr', edit: (r, i) => <TextInput value={r.note} onChange={v => updBom(i, 'note', v)} style={{ width: '100%' }} /> },
              ]}
              rows={s.bom}
              onAdd={() => sc.update({ bom: [...s.bom, { _id: Date.now(), material: 'Silicon (mono)', kgPerKw: 1, note: '' }] })}
              onDel={(i) => sc.update({ bom: s.bom.filter((_, j) => j !== i) })}
            />
            <Note level="info">Material Circularity Indicator (MCI): <b style={{ color: T.gold }}>{(mci.mci * 100).toFixed(0)}%</b> · weighted across BOM mass. Higher is better (Ellen MacArthur).</Note>
          </Step>

          <Step n={3} title="Manufacturing energy">
            <FieldRow label="Electricity per kW produced"><NumInput value={s.mfgElec} onChange={upd('mfgElec')} step={10} suffix="kWh/kW" /></FieldRow>
            <FieldRow label="Grid emission factor"><NumInput value={s.gridEF} onChange={upd('gridEF')} step={0.01} suffix="kgCO₂/kWh" /></FieldRow>
            <Note level="info">Manufacturing carbon = {s.mfgElec} × {s.gridEF} = <b style={{ color: T.gold }}>{mfgKgCO2.toFixed(0)} kgCO₂/kW</b></Note>
          </Step>

          <Step n={4} title="Transport & End-of-Life" hint="Outbound freight + end-of-life scenario.">
            <FieldRow label="Transport mode"><SelectInput value={s.transportMode} onChange={upd('transportMode')} options={TRANSPORT_MODES} style={{ width: 220 }} /></FieldRow>
            <FieldRow label="Distance"><span style={{ fontFamily: T.mono, color: T.textSec }}>{transDist.toLocaleString()} km ({s.mfgCountry} → {s.deployCountry})</span></FieldRow>
            <FieldRow label="Transport carbon"><span style={{ fontFamily: T.mono, color: T.gold }}>{transKgCO2.toFixed(2)} kgCO₂/kW</span></FieldRow>
            <FieldRow label="End-of-life scenario"><SelectInput value={s.eolScenario} onChange={upd('eolScenario')} options={Object.keys(EOL_MULT)} style={{ width: 240 }} /></FieldRow>
            <FieldRow label="EoL credit multiplier"><span style={{ fontFamily: T.mono, color: T.green }}>{(eolMult * 100).toFixed(0)}% of cradle-to-gate</span></FieldRow>
          </Step>

          <Step n={5} title="Asset inventory">
            <Worksheet
              cols={[
                { h: 'Asset', width: '1.5fr', edit: (r, i) => <TextInput value={r.name} onChange={v => updAsset(i, 'name', v)} style={{ width: '100%' }} /> },
                { h: 'MW', width: '70px', edit: (r, i) => <NumInput value={r.mw} onChange={v => updAsset(i, 'mw', v)} style={{ width: 60 }} /> },
                { h: 'Yield', width: '110px', edit: (r, i) => <NumInput value={r.yieldKwhPerKw} onChange={v => updAsset(i, 'yieldKwhPerKw', v)} step={10} suffix="kWh/kW" style={{ width: 70 }} /> },
                { h: 'Deg %/yr', width: '80px', edit: (r, i) => <NumInput value={r.degPct} onChange={v => updAsset(i, 'degPct', v)} step={0.1} style={{ width: 56 }} /> },
                { h: 'gCO₂/kWh', width: '100px', edit: (r) => {
                    const lt = r.mw * 1000 * r.yieldKwhPerKw * s.lifetimeYears * (1 - r.degPct / 100 * s.lifetimeYears / 2);
                    const g = lt > 0 ? (moduleKgCO2PerKw * r.mw * 1000 * 1000) / lt : 0;
                    return <span style={{ fontFamily: T.mono, color: T.gold, fontSize: 12 }}>{g.toFixed(1)}</span>;
                  } },
                { h: 'EPBT', width: '70px', edit: (r) => {
                    const annualKwh = r.mw * 1000 * r.yieldKwhPerKw;
                    const embodiedKwh = s.mfgElec * r.mw * 1000;
                    const e = annualKwh > 0 ? embodiedKwh / annualKwh : 0;
                    return <span style={{ fontFamily: T.mono, color: T.teal, fontSize: 11 }}>{e.toFixed(2)}y</span>;
                  } },
              ]}
              rows={assetRows}
              onAdd={() => sc.update({ assets: [...s.assets, { _id: Date.now(), name: 'New asset', mw: 10, yieldKwhPerKw: 1650, degPct: 0.5 }] })}
              onDel={(i) => sc.update({ assets: s.assets.filter((_, j) => j !== i) })}
            />
          </Step>

          <Step n={6} title="Multi-impact profile (EN 15804+A2)" hint="Beyond GWP — 7 mandatory indicators scaled from GWP reference.">
            <Heatmap
              data={impactRows.map(r => [r.value, r.refPV, r.refWind, r.refBattery])}
              rows={impactRows.map(r => r.label)}
              cols={['This product', 'PV ref', 'Wind ref', 'Battery ref']}
              fmt={(n) => n < 1 ? n.toFixed(2) : n.toFixed(0)}
            />
            <Note level="info">Higher values (red) indicate greater environmental pressure. Battery systems typically dominate on ADP (abiotic depletion) and WD (water).</Note>
          </Step>

          <Step n={7} title="Grid decarbonization trajectory" hint="Use-phase offset evolves with deployment country's grid.">
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead><tr style={{ color: T.textMut, textAlign: 'left' }}><th style={{ padding: 6 }}>Year</th><th>Grid multiplier</th><th>Relative gCO₂/kWh</th></tr></thead>
              <tbody>{gridTrajectory.map(g => (
                <tr key={g.year} style={{ borderTop: `1px solid ${T.borderL}`, fontFamily: T.mono }}>
                  <td style={{ padding: 6, color: T.text }}>{g.year}</td>
                  <td style={{ padding: 6, color: T.teal }}>{g.mult.toFixed(2)}×</td>
                  <td style={{ padding: 6, color: T.gold }}>{(wtdGco2 * g.mult).toFixed(1)}</td>
                </tr>))}
              </tbody>
            </table>
            <Note level="info">IEA NZE 2050 trajectory for <b>{s.deployCountry}</b>. Module lifetime straddles grid transition — avoided-emissions uplift compounds.</Note>
          </Step>

          <Step n={8} title="Uncertainty analysis — Monte Carlo + tornado">
            <FieldRow label="MC simulations"><NumInput value={s.mcRuns} onChange={upd('mcRuns')} step={500} min={500} max={10000} /></FieldRow>
            {mc && <MonteCarloCard title={`Generation intensity distribution (gCO₂/kWh)`} stats={mc} fmt={(n) => n.toFixed(1)} />}
            <button onClick={() => setMcTrigger(t => t + 1)} style={{ marginTop: 8, background: T.surfaceH, color: T.gold, border: `1px solid ${T.gold}`, padding: '5px 12px', fontSize: 11, cursor: 'pointer', borderRadius: 3 }}>↻ Re-sample</button>
            <Collapsible title="Tornado — driver sensitivity (±20%, kgCO₂/kW)" defaultOpen>
              <div style={{ paddingTop: 8 }}><Tornado rows={tornadoRows} fmt={(n) => n.toFixed(0)} /></div>
            </Collapsible>
          </Step>

          <Step n={9} title="Peer benchmark & EPD draft">
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', marginBottom: 10 }}>
              <thead><tr style={{ color: T.textMut, textAlign: 'left' }}><th style={{ padding: 6 }}>Benchmark</th><th>g CO₂/kWh</th><th>Δ vs you</th></tr></thead>
              <tbody>{LCA_PEER_BENCHMARKS.map(p => {
                const d = wtdGco2 - p.gco2PerKwh;
                return <tr key={p.name} style={{ borderTop: `1px solid ${T.borderL}`, fontFamily: T.mono }}>
                  <td style={{ padding: 6, fontFamily: T.font, color: T.textSec }}>{p.name}</td>
                  <td style={{ padding: 6 }}>{p.gco2PerKwh}</td>
                  <td style={{ padding: 6, color: d > 0 ? T.amber : T.green }}>{d > 0 ? '+' : ''}{d.toFixed(1)}</td>
                </tr>;
              })}</tbody>
            </table>
            <Collapsible title="Edit peer benchmarks">
              <Worksheet
                cols={[
                  { h: 'Benchmark', width: '2fr', edit: (r, i) => <TextInput value={r.name} onChange={v => updPeer(i, 'name', v)} style={{ width: '100%' }} /> },
                  { h: 'g CO₂/kWh', width: '110px', edit: (r, i) => <NumInput value={r.gco2PerKwh} onChange={v => updPeer(i, 'gco2PerKwh', v)} /> },
                ]}
                rows={s.peers}
                onAdd={() => sc.update({ peers: [...s.peers, { _id: Date.now(), name: 'New peer', gco2PerKwh: 45 }] })}
                onDel={(i) => sc.update({ peers: s.peers.filter((_, j) => j !== i) })}
              />
            </Collapsible>
            {!ready && <Note level="bad">Not ready: need product name, ≥3 BOM rows, ≥1 asset.</Note>}
            {ready && <Note level="ok">Ready. Deliverable is an EN 15804+A2 draft with multi-impact, circularity, uncertainty analysis.</Note>}
          </Step>
        </>
      }
      rail={
        <OutputRail
          label="LIVE LCA RESULT"
          stats={[
            { label: 'Gen intensity', value: wtdGco2.toFixed(1), sub: 'g CO₂/kWh', color: T.gold },
            { label: 'EPBT', value: `${wtdEpbt.toFixed(2)}y`, sub: 'energy payback' },
            { label: 'MCI', value: `${(mci.mci * 100).toFixed(0)}%`, sub: 'circularity', color: T.teal },
            { label: 'MC P50', value: mc ? mc.p50.toFixed(1) : '—', sub: mc ? `P5–P95: ${mc.p05.toFixed(1)}–${mc.p95.toFixed(1)}` : '—', color: T.gold },
          ]}
          preview={
            <div>
              <div><b style={{ color: T.text }}>{s.product}</b></div>
              <div style={{ marginTop: 4 }}>vs best-in-class: <b style={{ color: vsBest > 0 ? T.amber : T.green }}>{vsBest > 0 ? '+' : ''}{vsBest.toFixed(1)} gCO₂/kWh</b></div>
              <div>Peer rank: <b style={{ color: T.gold }}>{peerRank}</b></div>
              <div>BOM {(bomKgCO2 / Math.max(1, cradleToGate) * 100).toFixed(0)}% · Mfg {(mfgKgCO2 / Math.max(1, cradleToGate) * 100).toFixed(0)}% · Trans {(transKgCO2 / Math.max(1, cradleToGate) * 100).toFixed(0)}%</div>
              <div style={{ marginTop: 4 }}>Grid trajectory <Sparkline values={gridTrajectory.map(g => g.mult)} color={T.teal} /></div>
              <div style={{ marginTop: 6 }}><ProgressRing pct={mci.mci * 100} size={48} color={T.teal} label="MCI" /></div>
            </div>
          }
          cta={<PrimaryCTA onClick={onDeliver}>Generate EPD Draft →</PrimaryCTA>}
          menu={
            <ToolMenu
              scenario={sc}
              onExportCsv={() => downloadText('lca-bom.csv', toCsv(bomRows), 'text/csv')}
              onExportJson={() => downloadText('lca-scenario.json', JSON.stringify(s, null, 2), 'application/json')}
              onImportCsv={(r) => sc.update({ bom: r.map((x, i) => ({ _id: Date.now() + i, material: x.material || 'Silicon (mono)', kgPerKw: +x.kgPerKw || 0, note: x.note || '' })) })}
              importLabel="Import BOM CSV"
            />
          }
        />
      }
    />
  );
}
