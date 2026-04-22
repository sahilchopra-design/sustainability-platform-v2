import React, { useMemo } from 'react';
import {
  T, useScenario, openDeliverable, toCsv, downloadText, html,
  ToolShell, Step, OutputRail, PrimaryCTA, ToolMenu,
  FieldRow, Worksheet, NumInput, TextInput, SelectInput, Collapsible, Note, PageHeader
} from '../../_shared/AdvisoryToolkit';
import { LCA_EF as EF_LIB, PV_ARCHETYPES, LCA_PEER_BENCHMARKS, IEA_GRID_EF, gridEfFor } from '../../_shared/AdvisoryReference';

const COUNTRIES = Object.keys(IEA_GRID_EF);

const DEFAULTS = {
  product: 'ACME 550W Mono PERC Module',
  declaredUnit: '1 kW installed capacity',
  manufacturer: 'ACME Solar',
  mfgCountry: 'India',
  lifetimeYears: 30,
  gridEF: 0.71,   // kgCO2/kWh (India CEA 2024)
  mfgElec: 580,   // kWh per kW of module produced
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
};

export default function RenewableLcaEpdPage() {
  const sc = useScenario('renewable-lca-epd', DEFAULTS);
  const s = sc.state;

  const bomRows = useMemo(() => s.bom.map(b => ({ ...b, ef: EF_LIB[b.material] || 0, kgCO2: (EF_LIB[b.material] || 0) * b.kgPerKw })), [s.bom]);
  const bomKgCO2 = bomRows.reduce((x, r) => x + r.kgCO2, 0);
  const mfgKgCO2 = s.mfgElec * s.gridEF;
  const moduleKgCO2PerKw = bomKgCO2 + mfgKgCO2;

  const assetRows = useMemo(() => s.assets.map(a => {
    const lifetimeKwh = a.mw * 1000 * a.yieldKwhPerKw * s.lifetimeYears * (1 - a.degPct / 100 * s.lifetimeYears / 2);
    const totalKgCO2 = moduleKgCO2PerKw * a.mw * 1000;
    const gco2PerKwh = lifetimeKwh > 0 ? (totalKgCO2 * 1000) / lifetimeKwh : 0;
    return { ...a, lifetimeKwh, gco2PerKwh };
  }), [s.assets, moduleKgCO2PerKw, s.lifetimeYears]);

  const wtdGco2 = assetRows.reduce((x, r) => x + r.gco2PerKwh * r.mw, 0) / Math.max(1, assetRows.reduce((x, r) => x + r.mw, 0));
  const bestPeer = Math.min(...s.peers.map(p => p.gco2PerKwh));
  const vsBest = wtdGco2 - bestPeer;
  const ready = s.product.trim() && s.bom.length >= 3 && s.assets.length >= 1;

  const upd = (k) => (v) => sc.update({ [k]: v });
  const updBom = (i, k, v) => sc.update({ bom: s.bom.map((b, j) => j === i ? { ...b, [k]: v } : b) });
  const updAsset = (i, k, v) => sc.update({ assets: s.assets.map((a, j) => j === i ? { ...a, [k]: v } : a) });
  const updPeer = (i, k, v) => sc.update({ peers: s.peers.map((p, j) => j === i ? { ...p, [k]: v } : p) });

  // Load a PV archetype — replaces BOM and mfg energy with ITRPV 2024 reference values
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

  // Auto-update grid EF when country changes
  const setCountry = (c) => sc.update({ mfgCountry: c, gridEF: IEA_GRID_EF[c] ?? s.gridEF });

  // Tornado: ±20% each BOM row effect on module kgCO2/kW
  const tornado = useMemo(() => {
    return bomRows.map(r => ({
      material: r.material, base: r.kgCO2,
      low: r.kgCO2 * -0.2, high: r.kgCO2 * 0.2,
    })).sort((a, b) => b.base - a.base).slice(0, 5);
  }, [bomRows]);

  const peerPct = LCA_PEER_BENCHMARKS.filter(p => p.gco2PerKwh > wtdGco2).length;
  const peerRank = `beats ${peerPct}/${LCA_PEER_BENCHMARKS.length} benchmarks`;

  const onDeliver = () => {
    const body = [
      html.h1(`Environmental Product Declaration (draft) — ${s.product}`),
      html.meta({ Manufacturer: s.manufacturer, Country: s.mfgCountry, 'Declared unit': s.declaredUnit, Lifetime: `${s.lifetimeYears} yrs`, Generated: new Date().toLocaleDateString() }),
      html.h2('1. Boundary & Declared Unit'),
      html.p(`Cradle-to-gate LCA for <b>${s.product}</b>, declared unit <b>${s.declaredUnit}</b>. Boundary: raw materials → manufacturing → factory gate. Use phase modelled separately per asset.`),
      html.h2('2. Headline Results'),
      html.p(`<b>Module embodied carbon: ${moduleKgCO2PerKw.toFixed(0)} kg CO₂e / kW</b>`),
      html.p(`<b>Lifetime weighted generation intensity: ${wtdGco2.toFixed(1)} g CO₂e / kWh</b>`),
      html.p(`${vsBest > 0 ? html.badge('amber', `+${vsBest.toFixed(1)} vs best-in-class`) : html.badge('green', `${vsBest.toFixed(1)} below best-in-class`)}`),
      html.h2('3. Bill of Materials'),
      html.table(['Material', 'kg/kW', 'EF (kgCO₂e/kg)', 'kgCO₂e/kW', 'Note'],
        bomRows.map(r => [r.material, r.kgPerKw.toFixed(2), r.ef.toFixed(2), r.kgCO2.toFixed(1), r.note || ''])),
      html.h2('4. Manufacturing Energy'),
      html.p(`Grid EF (country): ${s.gridEF} kgCO₂/kWh · Electricity per kW produced: ${s.mfgElec} kWh · Mfg carbon: <b>${mfgKgCO2.toFixed(0)} kgCO₂e/kW</b>`),
      html.h2('5. Asset Inventory & Generation LCA'),
      html.table(['Asset', 'MW', 'Yield kWh/kW', 'Lifetime GWh', 'g CO₂e/kWh'],
        assetRows.map(r => [r.name, r.mw, r.yieldKwhPerKw, (r.lifetimeKwh / 1e6).toFixed(1), r.gco2PerKwh.toFixed(1)])),
      html.h2('6. Peer Benchmark'),
      html.table(['Benchmark', 'g CO₂e/kWh'], s.peers.map(p => [p.name, p.gco2PerKwh])),
      html.h2('7. Verification Pathway'),
      html.p('ISO 14025 compliant Product Category Rules (EN 15804+A2). Third-party verification recommended (e.g., EPD International, IBU). Estimated 8–12 weeks.'),
      html.h2('8. Limitations'),
      html.p('Cradle-to-gate only; decommissioning/recycling to be added in v2. EF values sourced from ecoinvent 3.10; primary data required for final EPD registration.'),
    ].join('');
    openDeliverable(body, `EPD Draft — ${s.product}`);
  };

  return (
    <ToolShell
      header={<PageHeader code="EP-EB1 · LCA / EPD" title="Renewable EPD Builder" subtitle="Build a cradle-to-gate LCA and generate a draft Environmental Product Declaration ready for ISO 14025 verification." />}
      steps={
        <>
          <Step n={1} title="Product & boundary">
            <FieldRow label="Product name"><TextInput value={s.product} onChange={upd('product')} style={{ width: 360 }} /></FieldRow>
            <FieldRow label="Declared unit" hint="e.g. 1 kW installed, or 1 m² module"><TextInput value={s.declaredUnit} onChange={upd('declaredUnit')} style={{ width: 260 }} /></FieldRow>
            <FieldRow label="Manufacturer"><TextInput value={s.manufacturer} onChange={upd('manufacturer')} style={{ width: 260 }} /></FieldRow>
            <FieldRow label="Mfg country" hint="Auto-updates grid EF via IEA 2024"><SelectInput value={s.mfgCountry} onChange={setCountry} options={COUNTRIES} style={{ width: 160 }} /></FieldRow>
            <FieldRow label="Lifetime" hint="Reference service life"><NumInput value={s.lifetimeYears} onChange={upd('lifetimeYears')} suffix="years" /></FieldRow>
          </Step>

          <Step n={2} title="Bill of materials (cradle-to-gate)" hint="Load an ITRPV 2024 archetype to auto-fill BOM + yield, or edit inline. EFs from ecoinvent-equivalent library.">
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
                { h: 'kgCO₂e/kW', width: '100px', edit: (r) => <span style={{ fontFamily: T.mono, color: T.gold, fontSize: 12 }}>{((EF_LIB[r.material] || 0) * r.kgPerKw).toFixed(1)}</span> },
                { h: 'Note', width: '1fr', edit: (r, i) => <TextInput value={r.note} onChange={v => updBom(i, 'note', v)} style={{ width: '100%' }} /> },
              ]}
              rows={s.bom}
              onAdd={() => sc.update({ bom: [...s.bom, { _id: Date.now(), material: 'Silicon (mono)', kgPerKw: 1, note: '' }] })}
              onDel={(i) => sc.update({ bom: s.bom.filter((_, j) => j !== i) })}
            />
          </Step>

          <Step n={3} title="Manufacturing energy">
            <FieldRow label="Electricity per kW produced" hint="Plant-level energy intensity"><NumInput value={s.mfgElec} onChange={upd('mfgElec')} step={10} suffix="kWh/kW" /></FieldRow>
            <FieldRow label="Grid emission factor" hint="Country grid EF (India CEA ≈ 0.71)"><NumInput value={s.gridEF} onChange={upd('gridEF')} step={0.01} suffix="kgCO₂/kWh" /></FieldRow>
            <Note level="info">Manufacturing carbon = {s.mfgElec} × {s.gridEF} = <b style={{ color: T.gold }}>{mfgKgCO2.toFixed(0)} kgCO₂e/kW</b></Note>
          </Step>

          <Step n={4} title="Asset inventory" hint="Per-site generation — drives the g CO₂e/kWh intensity.">
            <Worksheet
              cols={[
                { h: 'Asset', width: '1.5fr', edit: (r, i) => <TextInput value={r.name} onChange={v => updAsset(i, 'name', v)} style={{ width: '100%' }} /> },
                { h: 'MW', width: '70px', edit: (r, i) => <NumInput value={r.mw} onChange={v => updAsset(i, 'mw', v)} style={{ width: 60 }} /> },
                { h: 'Yield', width: '110px', edit: (r, i) => <NumInput value={r.yieldKwhPerKw} onChange={v => updAsset(i, 'yieldKwhPerKw', v)} step={10} suffix="kWh/kW" style={{ width: 70 }} /> },
                { h: 'Deg %/yr', width: '80px', edit: (r, i) => <NumInput value={r.degPct} onChange={v => updAsset(i, 'degPct', v)} step={0.1} style={{ width: 56 }} /> },
                { h: 'g CO₂/kWh', width: '100px', edit: (r) => {
                    const lt = r.mw * 1000 * r.yieldKwhPerKw * s.lifetimeYears * (1 - r.degPct / 100 * s.lifetimeYears / 2);
                    const g = lt > 0 ? (moduleKgCO2PerKw * r.mw * 1000 * 1000) / lt : 0;
                    return <span style={{ fontFamily: T.mono, color: T.gold, fontSize: 12 }}>{g.toFixed(1)}</span>;
                  } },
              ]}
              rows={assetRows}
              onAdd={() => sc.update({ assets: [...s.assets, { _id: Date.now(), name: 'New asset', mw: 10, yieldKwhPerKw: 1650, degPct: 0.5 }] })}
              onDel={(i) => sc.update({ assets: s.assets.filter((_, j) => j !== i) })}
            />
          </Step>

          <Step n={5} title="Peer benchmark" hint="IEA PVPS Task 12 reference benchmarks + BOM sensitivity (top-5 drivers).">
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', marginBottom: 10 }}>
              <thead><tr style={{ color: T.textMut, textAlign: 'left' }}><th style={{ padding: 6 }}>Benchmark</th><th style={{ padding: 6 }}>g CO₂/kWh</th><th style={{ padding: 6 }}>Δ vs you</th></tr></thead>
              <tbody>{LCA_PEER_BENCHMARKS.map(p => {
                const d = wtdGco2 - p.gco2PerKwh;
                return <tr key={p.name} style={{ borderTop: `1px solid ${T.borderL}`, fontFamily: T.mono }}>
                  <td style={{ padding: 6, fontFamily: T.font, color: T.textSec }}>{p.name}</td>
                  <td style={{ padding: 6 }}>{p.gco2PerKwh}</td>
                  <td style={{ padding: 6, color: d > 0 ? T.amber : T.green }}>{d > 0 ? '+' : ''}{d.toFixed(1)}</td>
                </tr>;
              })}</tbody>
            </table>
            <Collapsible title="BOM sensitivity (top-5 drivers, ±20%)">
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textSec, lineHeight: 1.8 }}>
                {tornado.map(t => (
                  <div key={t.material} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: 8, padding: '4px 0', borderTop: `1px solid ${T.borderL}` }}>
                    <span style={{ fontFamily: T.font, color: T.text }}>{t.material}</span>
                    <span>base {t.base.toFixed(1)} kgCO₂/kW</span>
                    <span style={{ color: T.amber }}>±{Math.abs(t.high).toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </Collapsible>
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
          </Step>

          <Step n={6} title="Generate EPD draft">
            {!ready && <Note level="bad">Not ready: need product name, ≥3 BOM rows, ≥1 asset.</Note>}
            {ready && <Note level="ok">Ready. The deliverable is an ISO 14025-formatted draft suitable for third-party verification.</Note>}
          </Step>
        </>
      }
      rail={
        <OutputRail
          label="LIVE LCA RESULT"
          stats={[
            { label: 'Module embodied', value: moduleKgCO2PerKw.toFixed(0), sub: 'kgCO₂e / kW', color: T.gold },
            { label: 'Gen intensity', value: wtdGco2.toFixed(1), sub: 'g CO₂/kWh', color: T.gold },
            { label: 'BOM share', value: `${(bomKgCO2 / Math.max(1, moduleKgCO2PerKw) * 100).toFixed(0)}%`, sub: `${bomKgCO2.toFixed(0)} kg` },
            { label: 'Mfg share', value: `${(mfgKgCO2 / Math.max(1, moduleKgCO2PerKw) * 100).toFixed(0)}%`, sub: `${mfgKgCO2.toFixed(0)} kg` },
          ]}
          preview={
            <div>
              <div><b style={{ color: T.text }}>{s.product}</b></div>
              <div style={{ marginTop: 4 }}>vs best-in-class: <b style={{ color: vsBest > 0 ? T.amber : T.green }}>{vsBest > 0 ? '+' : ''}{vsBest.toFixed(1)} gCO₂/kWh</b></div>
              <div>Peer rank: <b style={{ color: T.gold }}>{peerRank}</b></div>
              <div>{s.bom.length} materials · {s.assets.length} assets</div>
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
