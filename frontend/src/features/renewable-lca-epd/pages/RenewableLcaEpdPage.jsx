import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { T, useScenario, ToolkitBar, NumInput, TextInput, Kpi, Panel, Table, td, TabBar, PageHeader, Badge, downloadText, toCsv, openDeliverable, html } from '../../_shared/AdvisoryToolkit';

const EF = {
  'Polysilicon': 37.2, 'Silver paste': 180, 'EVA encapsulant': 3.1, 'Glass (low-Fe)': 1.05,
  'Aluminium frame': 8.9, 'Backsheet (PET)': 3.4, 'Junction box (PBT)': 4.2, 'Copper ribbon': 3.9,
  'Steel (BoS)': 1.85, 'Concrete (foundations)': 0.11, 'Cable (Cu+XLPE)': 4.1, 'Inverter (balanced)': 620,
};
const GRID_EF = { India: 0.71, China: 0.55, EU: 0.23, US: 0.38, 'Norway (hydro)': 0.019 };

const DEFAULTS = {
  portfolioName: 'Integrated RE-IPP Client (anonymised)',
  vintage: 2026, mfgLocation: 'India', mfgElecIntensity: 185, moduleWatt: 620,
  bom: [
    { material: 'Polysilicon', kgPerModule: 1.9, notes: 'N-type TOPCon 7g/W wafer' },
    { material: 'Silver paste', kgPerModule: 0.014, notes: '90 mg/cell × 156 cells' },
    { material: 'EVA encapsulant', kgPerModule: 1.1, notes: 'Dual-layer 450µm' },
    { material: 'Glass (low-Fe)', kgPerModule: 22, notes: '3.2mm front, 2mm rear' },
    { material: 'Aluminium frame', kgPerModule: 2.4, notes: '6063-T5 anodised' },
    { material: 'Backsheet (PET)', kgPerModule: 0.65, notes: '' },
    { material: 'Junction box (PBT)', kgPerModule: 0.45, notes: 'IP68' },
    { material: 'Copper ribbon', kgPerModule: 0.38, notes: '' },
  ],
  genAssets: [
    { id: 'RAJ-SOL-1', name: 'Rajasthan Solar', mw: 1200, cf: 23, pr: 82, deg: 0.5, lifeYrs: 25, bosKg: 4800000, grid: 'India' },
    { id: 'GUJ-SOL-1', name: 'Gujarat Solar',   mw: 900,  cf: 22, pr: 81, deg: 0.5, lifeYrs: 25, bosKg: 3700000, grid: 'India' },
    { id: 'ODI-FDR',   name: 'Odisha FDRE',      mw: 500,  cf: 55, pr: 79, deg: 0.6, lifeYrs: 25, bosKg: 2200000, grid: 'India' },
  ],
  peers: [
    { peer: 'Tier-1 reference A', mfgKgCo2PerKw: 485 },
    { peer: 'Tier-1 reference B', mfgKgCo2PerKw: 530 },
    { peer: 'Tier-1 low-C (Norway wafer)', mfgKgCo2PerKw: 285 },
    { peer: 'Industry median ITRPV 2025', mfgKgCo2PerKw: 560 },
  ],
};

function calcModule(s) {
  const bomEmb = s.bom.reduce((a, b) => a + (EF[b.material] || 0) * b.kgPerModule, 0);
  const procEmb = s.mfgElecIntensity * (GRID_EF[s.mfgLocation] || 0.5);
  const total = bomEmb + procEmb;
  const kgPerKw = total / (s.moduleWatt / 1000);
  return { bomEmb, procEmb, totalKgPerModule: total, kgPerKw };
}
function calcAsset(a, kgPerKw) {
  const lifetimeKwh = a.mw * 1000 * a.cf / 100 * 8760 * a.lifeYrs * (1 - a.deg / 100 * a.lifeYrs / 2);
  const moduleEmb = a.mw * 1000 * kgPerKw;
  const bosEmb = a.bosKg * 1.6;
  const totalEmb = moduleEmb + bosEmb;
  const gCo2PerKwh = lifetimeKwh > 0 ? (totalEmb * 1000) / lifetimeKwh : 0;
  return { lifetimeKwh, moduleEmb, bosEmb, totalEmb, gCo2PerKwh };
}

const TABS = ['Inputs & BOM', 'Module LCA', 'Generation LCA', 'Peer Benchmark', 'EPD Pathway', 'What-If', 'Deliverables'];

export default function RenewableLcaEpdPage() {
  const sc = useScenario('eb1_lca_epd', DEFAULTS);
  const [tab, setTab] = useState(0);
  const s = sc.state;
  const mod = useMemo(() => calcModule(s), [s]);
  const assets = useMemo(() => s.genAssets.map(a => ({ ...a, ...calcAsset(a, mod.kgPerKw) })), [s.genAssets, mod.kgPerKw]);
  const totalGen = assets.reduce((x, a) => x + a.lifetimeKwh, 0);
  const totalEmb = assets.reduce((x, a) => x + a.totalEmb, 0);
  const portfolioG = totalGen > 0 ? (totalEmb * 1000) / totalGen : 0;
  const bomDecomp = s.bom.map(b => ({ material: b.material, kg: +((EF[b.material] || 0) * b.kgPerModule).toFixed(2) })).filter(x => x.kg > 0).sort((a, b) => b.kg - a.kg);

  const updateBom = (idx, k, v) => sc.update(st => ({ bom: st.bom.map((r, i) => i === idx ? { ...r, [k]: v } : r) }));
  const addBomRow = () => sc.update(st => ({ bom: [...st.bom, { material: 'Polysilicon', kgPerModule: 0, notes: '' }] }));
  const delBomRow = (idx) => sc.update(st => ({ bom: st.bom.filter((_, i) => i !== idx) }));
  const updateAsset = (idx, k, v) => sc.update(st => ({ genAssets: st.genAssets.map((a, i) => i === idx ? { ...a, [k]: v } : a) }));
  const addAsset = () => sc.update(st => ({ genAssets: [...st.genAssets, { id: `NEW-${st.genAssets.length + 1}`, name: 'New asset', mw: 100, cf: 22, pr: 80, deg: 0.5, lifeYrs: 25, bosKg: 400000, grid: 'India' }] }));
  const delAsset = (idx) => sc.update(st => ({ genAssets: st.genAssets.filter((_, i) => i !== idx) }));

  const exportCsv = () => {
    const rows = assets.map(a => ({
      asset_id: a.id, name: a.name, mw: a.mw, cf_pct: a.cf, lifetime_yrs: a.lifeYrs,
      lifetime_gwh: +(a.lifetimeKwh / 1e6).toFixed(0),
      module_emb_tco2: +(a.moduleEmb / 1000).toFixed(0), bos_emb_tco2: +(a.bosEmb / 1000).toFixed(0),
      total_emb_tco2: +(a.totalEmb / 1000).toFixed(0), g_co2_per_kwh: +a.gCo2PerKwh.toFixed(2),
    }));
    downloadText(`EB1_LCA_${sc.scenarioName}.csv`, toCsv(rows), 'text/csv');
  };
  const exportJson = () => downloadText(`EB1_${sc.scenarioName}.json`, JSON.stringify({ module: 'EB1', scenario: sc.scenarioName, state: s, computed: { mod, portfolioG } }, null, 2), 'application/json');

  const generateEpd = () => {
    const content = [
      html.h1('Environmental Product Declaration (draft)'),
      html.meta({ Portfolio: s.portfolioName, 'Declared Unit': '1 kWh electricity', Vintage: s.vintage, Standard: 'ISO 14025 + IEC 63274', Scenario: sc.scenarioName }),
      html.h2('1. Product & System Boundary'),
      html.p(`Grid-connected PV electricity generated across ${s.genAssets.length} assets, ${s.genAssets.reduce((a,b)=>a+b.mw,0).toLocaleString()} MW nameplate. Boundary: cradle-to-grave per IEC 63274.`),
      html.h2('2. Headline Results'),
      html.kpi('Module cradle-to-gate', `${mod.kgPerKw.toFixed(0)} kg CO₂e/kW`) + html.kpi('Portfolio lifecycle intensity', `${portfolioG.toFixed(1)} g CO₂e/kWh`) + html.kpi('Lifetime generation', `${(totalGen / 1e9).toFixed(1)} TWh`) + html.kpi('Total embodied', `${(totalEmb / 1e6).toFixed(2)} Mt CO₂e`),
      html.h2('3. Bill of Materials — A1 Raw Materials'),
      html.table(['Material', 'kg/module', 'EF (kg CO₂e/kg)', 'Embodied', 'Notes'], s.bom.map(b => [b.material, b.kgPerModule, EF[b.material] || '—', ((EF[b.material]||0)*b.kgPerModule).toFixed(2), b.notes || ''])),
      html.h2('4. A3 Manufacturing Energy'),
      html.p(`${s.mfgElecIntensity} kWh/module in ${s.mfgLocation} (grid EF ${(GRID_EF[s.mfgLocation]||0).toFixed(3)} kg/kWh) → <b>${mod.procEmb.toFixed(1)} kg CO₂e/module</b>.`),
      html.h2('5. Asset-Level Generation Inventory'),
      html.table(['Asset', 'MW', 'CF %', 'Life yrs', 'Lifetime GWh', 'Emb tCO₂e', 'g CO₂e/kWh'], assets.map(a => [a.name, a.mw, a.cf, a.lifeYrs, (a.lifetimeKwh/1e6).toFixed(0), (a.totalEmb/1000).toFixed(0), a.gCo2PerKwh.toFixed(1)])),
      html.h2('6. Peer Benchmark'),
      html.table(['Peer', 'kg CO₂e/kW', 'Delta vs client'], s.peers.map(p => [p.peer, p.mfgKgCo2PerKw, ((mod.kgPerKw-p.mfgKgCo2PerKw)/p.mfgKgCo2PerKw*100).toFixed(1)+'%'])),
      html.h2('7. Verification Pathway'),
      html.p('Third-party critical review (ISO 14044 §6.3) → Programme Operator registration → 5-year validity → CBAM default-value replacement.'),
    ].join('');
    openDeliverable(content, `EPD — ${s.portfolioName}`);
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: '28px 40px' }}>
      <PageHeader code="EP-EB1" title="RE Portfolio LCA & EPD Certification" subtitle={`${s.portfolioName} · ISO 14040/44 · ISO 14025 · IEC 63274 · Declared unit: 1 kWh`} />
      <ToolkitBar moduleCode="EB1" scenario={sc} onExportCsv={exportCsv} onExportJson={exportJson} onDeliverable={generateEpd}
        importLabel="Import BOM CSV"
        onImportCsv={(rows) => { if (rows.length) sc.update({ bom: rows.map(r => ({ material: r.material, kgPerModule: Number(r.kgPerModule) || 0, notes: r.notes || '' })) }); }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
        <Kpi label="Module cradle-to-gate" value={`${mod.kgPerKw.toFixed(0)} kg/kW`} sub={`${mod.totalKgPerModule.toFixed(1)} kg per ${s.moduleWatt}W module`} />
        <Kpi label="Portfolio intensity" value={`${portfolioG.toFixed(1)}`} sub="g CO₂e/kWh" color={portfolioG < 40 ? T.green : portfolioG < 55 ? T.amber : T.red} />
        <Kpi label="Lifetime generation" value={`${(totalGen / 1e9).toFixed(1)} TWh`} sub={`${s.genAssets.length} assets · ${s.genAssets.reduce((a,b)=>a+b.mw,0).toLocaleString()} MW`} />
        <Kpi label="Total embodied" value={`${(totalEmb / 1e6).toFixed(2)} Mt`} sub="CO₂e portfolio life" />
      </div>

      <TabBar tabs={TABS} tab={tab} setTab={setTab} />

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
          <Panel title="Portfolio inputs">
            <div style={{ display: 'grid', gap: 10 }}>
              <L label="Portfolio name"><TextInput value={s.portfolioName} onChange={v => sc.update({ portfolioName: v })} style={{ width: 220 }} /></L>
              <L label="Vintage year"><NumInput value={s.vintage} onChange={v => sc.update({ vintage: v })} min={2020} max={2030} /></L>
              <L label="Mfg location">
                <select value={s.mfgLocation} onChange={e => sc.update({ mfgLocation: e.target.value })} style={selS}>{Object.keys(GRID_EF).map(k => <option key={k}>{k}</option>)}</select>
                <span style={{ fontSize: 11, color: T.textMut, marginLeft: 8 }}>EF: {(GRID_EF[s.mfgLocation] || 0).toFixed(3)}</span>
              </L>
              <L label="Mfg elec intensity"><NumInput value={s.mfgElecIntensity} onChange={v => sc.update({ mfgElecIntensity: v })} suffix="kWh/mod" /></L>
              <L label="Module wattage"><NumInput value={s.moduleWatt} onChange={v => sc.update({ moduleWatt: v })} suffix="W" /></L>
            </div>
          </Panel>
          <Panel title={`Bill of materials (${s.bom.length} items)`} right={<button onClick={addBomRow} style={addBtn}>+ Add row</button>}>
            <Table cols={['Material', 'kg/module', 'EF', 'Embodied', 'Notes', '']}>
              {s.bom.map((b, i) => (
                <tr key={i}>
                  <td style={td}><select value={b.material} onChange={e => updateBom(i, 'material', e.target.value)} style={selS}>{Object.keys(EF).map(k => <option key={k}>{k}</option>)}</select></td>
                  <td style={td}><NumInput value={b.kgPerModule} onChange={v => updateBom(i, 'kgPerModule', v)} step={0.001} style={{ width: 70 }} /></td>
                  <td style={{ ...td, fontFamily: T.mono, color: T.textMut }}>{EF[b.material]?.toFixed(2) || '—'}</td>
                  <td style={{ ...td, fontFamily: T.mono, color: T.gold }}>{((EF[b.material] || 0) * b.kgPerModule).toFixed(2)}</td>
                  <td style={td}><TextInput value={b.notes} onChange={v => updateBom(i, 'notes', v)} /></td>
                  <td style={td}><button onClick={() => delBomRow(i)} style={delBtn}>✕</button></td>
                </tr>
              ))}
            </Table>
          </Panel>
        </div>
      )}

      {tab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Panel title="Module cradle-to-gate decomposition">
            <Table cols={['Stage', 'kg CO₂e/module', '%']}>
              <tr><td style={td}>A1 — Raw materials (BOM)</td><td style={{ ...td, fontFamily: T.mono, color: T.gold }}>{mod.bomEmb.toFixed(2)}</td><td style={{ ...td, fontFamily: T.mono }}>{(mod.bomEmb/Math.max(mod.totalKgPerModule,0.001)*100).toFixed(1)}%</td></tr>
              <tr><td style={td}>A3 — Manufacturing energy</td><td style={{ ...td, fontFamily: T.mono, color: T.gold }}>{mod.procEmb.toFixed(2)}</td><td style={{ ...td, fontFamily: T.mono }}>{(mod.procEmb/Math.max(mod.totalKgPerModule,0.001)*100).toFixed(1)}%</td></tr>
              <tr style={{ background: T.surfaceH }}><td style={{ ...td, fontWeight: 600 }}>Total A1–A3</td><td style={{ ...td, fontFamily: T.mono, color: T.gold, fontWeight: 600 }}>{mod.totalKgPerModule.toFixed(2)}</td><td style={{ ...td, fontFamily: T.mono }}>100%</td></tr>
              <tr><td style={td}>Per kW</td><td style={{ ...td, fontFamily: T.mono, color: T.gold }} colSpan={2}>{mod.kgPerKw.toFixed(1)} kg CO₂e/kW</td></tr>
            </Table>
          </Panel>
          <Panel title="BOM contribution">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bomDecomp} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fill: T.textSec, fontSize: 11 }} />
                <YAxis type="category" dataKey="material" width={130} tick={{ fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}` }} />
                <Bar dataKey="kg" fill={T.gold} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      )}

      {tab === 2 && (
        <Panel title={`Generation assets (${assets.length})`} right={<button onClick={addAsset} style={addBtn}>+ Add</button>}>
          <Table cols={['ID', 'Name', 'MW', 'CF %', 'Deg %/yr', 'Life', 'BoS kg', 'Grid', 'Lifetime GWh', 'Emb tCO₂e', 'g/kWh', '']}>
            {assets.map((a, i) => (
              <tr key={i}>
                <td style={{ ...td, fontFamily: T.mono, fontSize: 11 }}>{a.id}</td>
                <td style={td}><TextInput value={a.name} onChange={v => updateAsset(i, 'name', v)} /></td>
                <td style={td}><NumInput value={a.mw} onChange={v => updateAsset(i, 'mw', v)} style={{ width: 60 }} /></td>
                <td style={td}><NumInput value={a.cf} onChange={v => updateAsset(i, 'cf', v)} step={0.1} style={{ width: 50 }} /></td>
                <td style={td}><NumInput value={a.deg} onChange={v => updateAsset(i, 'deg', v)} step={0.01} style={{ width: 50 }} /></td>
                <td style={td}><NumInput value={a.lifeYrs} onChange={v => updateAsset(i, 'lifeYrs', v)} style={{ width: 50 }} /></td>
                <td style={td}><NumInput value={a.bosKg} onChange={v => updateAsset(i, 'bosKg', v)} step={10000} style={{ width: 90 }} /></td>
                <td style={td}><select value={a.grid} onChange={e => updateAsset(i, 'grid', e.target.value)} style={selS}>{Object.keys(GRID_EF).map(k => <option key={k}>{k}</option>)}</select></td>
                <td style={{ ...td, fontFamily: T.mono }}>{(a.lifetimeKwh / 1e6).toFixed(0)}</td>
                <td style={{ ...td, fontFamily: T.mono, color: T.gold }}>{(a.totalEmb / 1000).toFixed(0)}</td>
                <td style={{ ...td, fontFamily: T.mono, color: a.gCo2PerKwh < 40 ? T.green : T.amber }}>{a.gCo2PerKwh.toFixed(1)}</td>
                <td style={td}><button onClick={() => delAsset(i)} style={delBtn}>✕</button></td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}

      {tab === 3 && (
        <Panel title="Peer benchmark (kg CO₂e/kW)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[{ peer: `Client`, val: +mod.kgPerKw.toFixed(0) }, ...s.peers.map(p => ({ peer: p.peer, val: p.mfgKgCo2PerKw }))]}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="peer" tick={{ fill: T.textSec, fontSize: 10 }} angle={-20} textAnchor="end" height={80} interval={0} />
              <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}` }} />
              <Bar dataKey="val" fill={T.gold} />
            </BarChart>
          </ResponsiveContainer>
          <Table cols={['Peer', 'kg CO₂e/kW', 'Delta', 'Position']}>
            {s.peers.map((p, i) => {
              const delta = mod.kgPerKw - p.mfgKgCo2PerKw;
              return (
                <tr key={i}>
                  <td style={td}>{p.peer}</td>
                  <td style={{ ...td, fontFamily: T.mono }}><NumInput value={p.mfgKgCo2PerKw} onChange={v => sc.update(st => ({ peers: st.peers.map((x, j) => j === i ? { ...x, mfgKgCo2PerKw: v } : x) }))} /></td>
                  <td style={{ ...td, fontFamily: T.mono, color: delta <= 0 ? T.green : T.red }}>{delta > 0 ? '+' : ''}{delta.toFixed(0)}</td>
                  <td style={td}>{delta <= 0 ? <Badge level="good">Client better</Badge> : <Badge level="warn">Peer better</Badge>}</td>
                </tr>
              );
            })}
          </Table>
        </Panel>
      )}

      {tab === 4 && (
        <Panel title="EPD certification pathway (ISO 14025 + IEC 63274)">
          <Table cols={['Stage', 'Scope', 'Duration', 'Output']}>
            {[
              ['1. LCA study', 'ISO 14040/44 per IEC 63274 PCR', '8 wks', 'LCA report (this tool)'],
              ['2. Critical review', 'ISO 14044 §6.3 expert panel', '4 wks', 'Review statement'],
              ['3. PCR verification', 'Programme operator check', '2 wks', 'Conformance letter'],
              ['4. EPD publication', 'EPD Norge / International EPD System', '2 wks', 'Published EPD (5-yr validity)'],
              ['5. Client use', 'CBAM / GPP / green bond DD', 'Ongoing', 'Revenue / financing advantage'],
            ].map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={j===0 ? { ...td, fontWeight: 600 } : td}>{c}</td>)}</tr>)}
          </Table>
        </Panel>
      )}

      {tab === 5 && <Panel title="What-if: mfg relocation / BOM reduction"><WhatIf s={s} mod={mod} portfolioG={portfolioG} /></Panel>}

      {tab === 6 && (
        <Panel title="Client deliverable stack">
          <ul style={{ lineHeight: 1.9, fontSize: 13, color: T.textSec }}>
            <li><b style={{ color: T.text }}>LCA data pack (CSV)</b> — asset lifecycle intensities for regulator submission. <button style={btnInline} onClick={exportCsv}>Download</button></li>
            <li><b style={{ color: T.text }}>Scenario state (JSON)</b> — reproducible inputs for peer review. <button style={btnInline} onClick={exportJson}>Download</button></li>
            <li><b style={{ color: T.text }}>EPD draft (HTML/PDF)</b> — ISO 14025 format, ready for critical review. <button style={{ ...btnInline, background: T.gold, color: T.navy, borderColor: T.gold }} onClick={generateEpd}>Generate</button></li>
          </ul>
          <div style={{ marginTop: 16, padding: 12, background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 3, fontSize: 12, color: T.textMut }}>
            <b style={{ color: T.gold }}>Use cases:</b> CBAM default-value replacement (saves €40–85/tCO₂e for EU exports), EU GPP tender qualification, Climate Bonds Standard solar criterion, BRSR P6, SLB KPI baseline.
          </div>
        </Panel>
      )}
    </div>
  );
}

function WhatIf({ s, mod, portfolioG }) {
  const [scLoc, setScLoc] = useState(s.mfgLocation);
  const [bomCut, setBomCut] = useState(0);
  const newProcEmb = s.mfgElecIntensity * (GRID_EF[scLoc] || 0.5);
  const newBom = mod.bomEmb * (1 - bomCut / 100);
  const newTotal = newBom + newProcEmb;
  const newKgPerKw = newTotal / (s.moduleWatt / 1000);
  const delta = newKgPerKw - mod.kgPerKw;
  const newPortG = mod.kgPerKw > 0 ? portfolioG * (newKgPerKw / mod.kgPerKw) : 0;
  return (
    <div>
      <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
        <L label="Switch mfg location"><select value={scLoc} onChange={e => setScLoc(e.target.value)} style={selS}>{Object.keys(GRID_EF).map(k => <option key={k}>{k}</option>)}</select></L>
        <L label="BOM reduction"><NumInput value={bomCut} onChange={setBomCut} min={0} max={60} suffix="%" /></L>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        <Kpi label="New module intensity" value={`${newKgPerKw.toFixed(0)} kg/kW`} sub={`Δ ${delta > 0 ? '+' : ''}${delta.toFixed(0)} kg/kW`} color={delta < 0 ? T.green : T.red} />
        <Kpi label="New portfolio g/kWh" value={`${newPortG.toFixed(1)}`} sub={`from ${portfolioG.toFixed(1)}`} />
        <Kpi label="Lifetime tCO₂e avoided" value={`${((mod.kgPerKw - newKgPerKw) * s.genAssets.reduce((a,b)=>a+b.mw,0) / 1000).toFixed(0)}`} sub="across portfolio" color={T.green} />
      </div>
    </div>
  );
}

function L({ label, children }) {
  return <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: T.textSec }}><span style={{ minWidth: 160 }}>{label}</span>{children}</label>;
}
const selS = { background: T.surface, color: T.text, border: `1px solid ${T.border}`, padding: '4px 6px', fontSize: 12, borderRadius: 2 };
const addBtn = { background: T.teal, color: T.text, border: 'none', padding: '4px 12px', fontSize: 11, cursor: 'pointer', borderRadius: 3 };
const delBtn = { background: 'transparent', color: T.red, border: 'none', cursor: 'pointer', fontSize: 14 };
const btnInline = { background: T.surface, color: T.gold, border: `1px solid ${T.gold}`, padding: '3px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 3, marginLeft: 8 };
