import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ScatterChart, Scatter, ZAxis } from 'recharts';
import { T, useScenario, ToolkitBar, NumInput, TextInput, Kpi, Panel, Table, td, TabBar, PageHeader, Badge, downloadText, toCsv, openDeliverable, html } from '../../_shared/AdvisoryToolkit';

const SSP_MULT = { 'SSP1-2.6': { 2030: 1.0, 2040: 1.1, 2050: 1.15 }, 'SSP2-4.5': { 2030: 1.1, 2040: 1.3, 2050: 1.55 }, 'SSP5-8.5': { 2030: 1.2, 2040: 1.6, 2050: 2.2 } };
const HAZARDS = ['Heat', 'Water stress', 'Cyclone', 'Flood', 'Dust'];

const DEFAULTS = {
  portfolioName: 'Integrated RE-IPP Client (anonymised)',
  ssp: 'SSP2-4.5',
  horizonYr: 2040,
  discountRate: 8,
  assets: [
    { id: 'RAJ-SOL-1', name: 'Rajasthan Solar 1', mw: 1200, revenueCr: 380, debtCr: 2100, state: 'Rajasthan', heatExp: 4, waterExp: 5, cycloneExp: 1, floodExp: 1, dustExp: 5, adaptCapex: 32, adaptOpex: 1.8, adaptBenefitPct: 45 },
    { id: 'GUJ-WND-1', name: 'Gujarat Wind (Kutch)', mw: 300, revenueCr: 140, debtCr: 800, state: 'Gujarat', heatExp: 3, waterExp: 4, cycloneExp: 4, floodExp: 2, dustExp: 3, adaptCapex: 12, adaptOpex: 0.6, adaptBenefitPct: 35 },
    { id: 'GUJ-SOL-1', name: 'Gujarat Solar', mw: 900, revenueCr: 290, debtCr: 1600, state: 'Gujarat', heatExp: 4, waterExp: 4, cycloneExp: 3, floodExp: 2, dustExp: 4, adaptCapex: 22, adaptOpex: 1.2, adaptBenefitPct: 40 },
    { id: 'ODI-FDR-1', name: 'Odisha FDRE', mw: 500, revenueCr: 320, debtCr: 1800, state: 'Odisha', heatExp: 3, waterExp: 3, cycloneExp: 4, floodExp: 4, dustExp: 2, adaptCapex: 28, adaptOpex: 1.5, adaptBenefitPct: 42 },
    { id: 'TN-WND-1', name: 'Tamil Nadu Wind', mw: 180, revenueCr: 85, debtCr: 480, state: 'Tamil Nadu', heatExp: 3, waterExp: 2, cycloneExp: 4, floodExp: 3, dustExp: 2, adaptCapex: 8, adaptOpex: 0.4, adaptBenefitPct: 30 },
    { id: 'MP-SOL-1', name: 'MP Solar', mw: 260, revenueCr: 82, debtCr: 450, state: 'Madhya Pradesh', heatExp: 4, waterExp: 3, cycloneExp: 1, floodExp: 2, dustExp: 3, adaptCapex: 9, adaptOpex: 0.5, adaptBenefitPct: 35 },
    { id: 'KA-SOL-1', name: 'Karnataka Solar', mw: 220, revenueCr: 70, debtCr: 380, state: 'Karnataka', heatExp: 3, waterExp: 3, cycloneExp: 2, floodExp: 2, dustExp: 2, adaptCapex: 7, adaptOpex: 0.4, adaptBenefitPct: 32 },
    { id: 'AP-SOL-1', name: 'AP Solar', mw: 280, revenueCr: 88, debtCr: 490, state: 'Andhra Pradesh', heatExp: 3, waterExp: 3, cycloneExp: 3, floodExp: 2, dustExp: 2, adaptCapex: 10, adaptOpex: 0.5, adaptBenefitPct: 35 },
    { id: 'OMN-NH3', name: 'Oman Green NH₃', mw: 500, revenueCr: 520, debtCr: 3800, state: 'Oman', heatExp: 5, waterExp: 5, cycloneExp: 2, floodExp: 1, dustExp: 4, adaptCapex: 85, adaptOpex: 4.2, adaptBenefitPct: 50 },
  ],
};

function rarPct(a, ssp, horizon) {
  const mult = SSP_MULT[ssp]?.[horizon] || 1;
  const raw = (a.heatExp * 1.2 + a.waterExp * 1.5 + a.cycloneExp * 2.0 + a.floodExp * 1.8 + a.dustExp * 0.8) * mult;
  return Math.min(40, raw * 0.6);
}
const TABS = ['Inputs & Assets', 'Heat Map', 'SSP Projections', 'Financial Impact (RaR + DSCR)', 'Adaptation ROI', 'TCFD 4 Pillars', 'Deliverables'];

export default function TcfdPhysicalRiskAssessmentPage() {
  const sc = useScenario('eb5_tcfd', DEFAULTS);
  const [tab, setTab] = useState(0);
  const s = sc.state;

  const assets = useMemo(() => s.assets.map(a => {
    const rar = rarPct(a, s.ssp, s.horizonYr);
    const rarBeforeAdapt = rar;
    const rarAfterAdapt = rar * (1 - a.adaptBenefitPct / 100);
    const revLossCr = a.revenueCr * rar / 100;
    const revLossAfterCr = a.revenueCr * rarAfterAdapt / 100;
    const ebitda = a.revenueCr * 0.55;
    const debtSvc = a.debtCr * 0.09;
    const dscrBase = ebitda / Math.max(1, debtSvc);
    const dscrStressed = (ebitda - revLossCr) / Math.max(1, debtSvc);
    const dscrAfterAdapt = (ebitda - revLossAfterCr - a.adaptOpex) / Math.max(1, debtSvc);
    const adaptLifetimeBenefit = (revLossCr - revLossAfterCr - a.adaptOpex) * 15;
    const adaptRoiPct = a.adaptCapex > 0 ? adaptLifetimeBenefit / a.adaptCapex * 100 : 0;
    return { ...a, rar, rarBeforeAdapt, rarAfterAdapt, revLossCr, revLossAfterCr, ebitda, debtSvc, dscrBase, dscrStressed, dscrAfterAdapt, adaptRoiPct, adaptLifetimeBenefit };
  }), [s.assets, s.ssp, s.horizonYr]);

  const totalRev = assets.reduce((a, x) => a + x.revenueCr, 0);
  const totalRaR = assets.reduce((a, x) => a + x.revLossCr, 0);
  const totalRaRAfter = assets.reduce((a, x) => a + x.revLossAfterCr, 0);
  const totalAdaptCapex = assets.reduce((a, x) => a + x.adaptCapex, 0);
  const stressedAssets = assets.filter(a => a.dscrStressed < 1.2).length;

  const upd = (i, k, v) => sc.update(st => ({ assets: st.assets.map((a, j) => j === i ? { ...a, [k]: v } : a) }));
  const addA = () => sc.update(st => ({ assets: [...st.assets, { id: `NEW-${st.assets.length+1}`, name: 'New', mw: 100, revenueCr: 50, debtCr: 200, state: '', heatExp: 2, waterExp: 2, cycloneExp: 2, floodExp: 2, dustExp: 2, adaptCapex: 5, adaptOpex: 0.3, adaptBenefitPct: 30 }] }));
  const delA = (i) => sc.update(st => ({ assets: st.assets.filter((_, j) => j !== i) }));

  const exportCsv = () => downloadText(`EB5_TCFD_${sc.scenarioName}.csv`, toCsv(assets.map(a => ({
    id: a.id, name: a.name, state: a.state, mw: a.mw, rev_cr: a.revenueCr, debt_cr: a.debtCr,
    ssp: s.ssp, horizon: s.horizonYr,
    rar_pct: +a.rar.toFixed(2), rev_loss_cr: +a.revLossCr.toFixed(2),
    dscr_base: +a.dscrBase.toFixed(2), dscr_stressed: +a.dscrStressed.toFixed(2), dscr_after_adapt: +a.dscrAfterAdapt.toFixed(2),
    adapt_capex_cr: a.adaptCapex, adapt_roi_pct: +a.adaptRoiPct.toFixed(0),
  }))), 'text/csv');
  const exportJson = () => downloadText(`EB5_${sc.scenarioName}.json`, JSON.stringify({ module: 'EB5', state: s, assets }, null, 2), 'application/json');

  const generateReport = () => {
    const content = [
      html.h1('TCFD Physical Climate Risk Assessment'),
      html.meta({ Portfolio: s.portfolioName, Scenario: `${s.ssp} · ${s.horizonYr}`, Assets: assets.length, 'Total Rev': `₹${totalRev.toFixed(0)} Cr`, Discount: `${s.discountRate}%`, Basis: 'CMIP6 downscaled, 5-peril exposure, DSCR impact' }),
      html.h2('Executive Summary'),
      html.kpi('Total revenue at risk', `₹${totalRaR.toFixed(1)} Cr`) + html.kpi('% of portfolio revenue', `${(totalRaR/totalRev*100).toFixed(1)}%`) + html.kpi('After adaptation', `₹${totalRaRAfter.toFixed(1)} Cr`) + html.kpi('Adaptation capex', `₹${totalAdaptCapex.toFixed(0)} Cr`) + html.kpi('Stressed DSCR assets', stressedAssets),
      html.h2('1. TCFD Pillar — Strategy'),
      html.p(`Under ${s.ssp} by ${s.horizonYr}, ${assets.length} material assets carry physical climate exposure. Revenue-at-risk ₹${totalRaR.toFixed(1)} Cr (${(totalRaR/totalRev*100).toFixed(1)}% of portfolio revenue). Without adaptation, ${stressedAssets} assets breach DSCR 1.2× covenant.`),
      html.h2('2. Asset-Level Exposure'),
      html.table(['Asset', 'State', 'MW', 'Rev ₹Cr', 'RaR %', '₹Cr loss', 'DSCR base', 'DSCR stressed', 'DSCR + adapt'],
        assets.map(a => [a.name, a.state, a.mw, a.revenueCr, a.rar.toFixed(1), a.revLossCr.toFixed(1), a.dscrBase.toFixed(2), a.dscrStressed.toFixed(2), a.dscrAfterAdapt.toFixed(2)])),
      html.h2('3. Adaptation Roadmap & ROI'),
      html.table(['Asset', 'Capex ₹Cr', 'Opex/yr', 'RaR before', 'RaR after', 'Lifetime benefit', 'ROI %'],
        assets.map(a => [a.name, a.adaptCapex, a.adaptOpex, a.rarBeforeAdapt.toFixed(1)+'%', a.rarAfterAdapt.toFixed(1)+'%', '₹' + a.adaptLifetimeBenefit.toFixed(0) + ' Cr', a.adaptRoiPct.toFixed(0) + '%'])),
      html.h2('4. TCFD Pillar — Metrics & Targets'),
      html.p(`Physical RaR intensity: ${(totalRaR*10/totalRev).toFixed(2)} per ₹10 of revenue. Portfolio DSCR under stress: ${(assets.reduce((a,x)=>a+x.dscrStressed,0)/assets.length).toFixed(2)} (target: ≥1.4× covenant).`),
      html.h2('5. Recommendations'),
      html.p('Priority 1: Oman NH₃ adaptation — highest absolute RaR and highest adapt-capex leverage. Priority 2: Rajasthan/Gujarat solar — dust + heat drive yield loss, payback <5y. Priority 3: Odisha FDRE — cyclone/flood structural hardening.'),
    ].join('');
    openDeliverable(content, `TCFD Report — ${s.portfolioName}`);
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: '28px 40px' }}>
      <PageHeader code="EP-EB5" title="TCFD Physical Climate Risk Assessment" subtitle={`${s.portfolioName} · CMIP6 · ${s.ssp} @ ${s.horizonYr} · ${assets.length} assets · RaR + DSCR + Adaptation ROI`} />
      <ToolkitBar moduleCode="EB5" scenario={sc} onExportCsv={exportCsv} onExportJson={exportJson} onDeliverable={generateReport}
        importLabel="Import Assets CSV"
        onImportCsv={(rows) => { if (rows.length) sc.update({ assets: rows.map(r => ({
          id: r.id, name: r.name, mw: Number(r.mw) || 0, revenueCr: Number(r.revenueCr || r.rev_cr) || 0, debtCr: Number(r.debtCr || r.debt_cr) || 0,
          state: r.state || '', heatExp: Number(r.heatExp) || 0, waterExp: Number(r.waterExp) || 0, cycloneExp: Number(r.cycloneExp) || 0, floodExp: Number(r.floodExp) || 0, dustExp: Number(r.dustExp) || 0,
          adaptCapex: Number(r.adaptCapex) || 0, adaptOpex: Number(r.adaptOpex) || 0, adaptBenefitPct: Number(r.adaptBenefitPct) || 30,
        })) }); }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 18 }}>
        <Kpi label="Assets assessed" value={assets.length} sub={`${assets.reduce((a,x)=>a+x.mw,0).toLocaleString()} MW`} />
        <Kpi label="Revenue at risk" value={`₹${totalRaR.toFixed(1)} Cr`} sub={`${(totalRaR/Math.max(1,totalRev)*100).toFixed(1)}% of portfolio`} color={T.red} />
        <Kpi label="After adaptation" value={`₹${totalRaRAfter.toFixed(1)} Cr`} sub={`Residual ${(totalRaRAfter/Math.max(1,totalRev)*100).toFixed(1)}%`} color={T.amber} />
        <Kpi label="Adaptation capex" value={`₹${totalAdaptCapex.toFixed(0)} Cr`} sub={`${(totalAdaptCapex/Math.max(1,totalRaR)).toFixed(2)}× RaR`} color={T.gold} />
        <Kpi label="DSCR breach" value={stressedAssets} sub="Below 1.2× under stress" color={stressedAssets > 0 ? T.red : T.green} />
      </div>

      <TabBar tabs={TABS} tab={tab} setTab={setTab} />

      {tab === 0 && (
        <Panel title="Portfolio & scenario parameters" right={<button style={addBtn} onClick={addA}>+ Add asset</button>}>
          <div style={{ display: 'flex', gap: 20, marginBottom: 14, flexWrap: 'wrap' }}>
            <L label="Portfolio"><TextInput value={s.portfolioName} onChange={v => sc.update({ portfolioName: v })} style={{ width: 220 }} /></L>
            <L label="SSP scenario"><select value={s.ssp} onChange={e => sc.update({ ssp: e.target.value })} style={selS}>{Object.keys(SSP_MULT).map(k => <option key={k}>{k}</option>)}</select></L>
            <L label="Horizon"><select value={s.horizonYr} onChange={e => sc.update({ horizonYr: Number(e.target.value) })} style={selS}><option>2030</option><option>2040</option><option>2050</option></select></L>
            <L label="Discount rate"><NumInput value={s.discountRate} onChange={v => sc.update({ discountRate: v })} step={0.5} suffix="%" /></L>
          </div>
          <div style={{ fontSize: 11, color: T.textMut, marginBottom: 10 }}>Exposure scores: 1 (low) — 5 (extreme). Heat/water/cyclone/flood/dust weighted per peril severity. Adaptation benefit % = expected RaR reduction.</div>
          <Table cols={['ID', 'Name', 'State', 'MW', 'Rev ₹Cr', 'Debt ₹Cr', 'Heat', 'Water', 'Cyclone', 'Flood', 'Dust', 'Capex', 'Opex', 'Benefit %', '']}>
            {assets.map((a, i) => (
              <tr key={i}>
                <td style={{ ...td, fontFamily: T.mono, fontSize: 11 }}>{a.id}</td>
                <td style={td}><TextInput value={a.name} onChange={v => upd(i, 'name', v)} style={{ width: 140 }} /></td>
                <td style={td}><TextInput value={a.state} onChange={v => upd(i, 'state', v)} style={{ width: 90 }} /></td>
                <td style={td}><NumInput value={a.mw} onChange={v => upd(i, 'mw', v)} style={{ width: 60 }} /></td>
                <td style={td}><NumInput value={a.revenueCr} onChange={v => upd(i, 'revenueCr', v)} step={5} style={{ width: 65 }} /></td>
                <td style={td}><NumInput value={a.debtCr} onChange={v => upd(i, 'debtCr', v)} step={50} style={{ width: 70 }} /></td>
                {['heatExp', 'waterExp', 'cycloneExp', 'floodExp', 'dustExp'].map(k => (
                  <td key={k} style={td}><NumInput value={a[k]} onChange={v => upd(i, k, v)} min={0} max={5} style={{ width: 40 }} /></td>
                ))}
                <td style={td}><NumInput value={a.adaptCapex} onChange={v => upd(i, 'adaptCapex', v)} step={1} style={{ width: 55 }} /></td>
                <td style={td}><NumInput value={a.adaptOpex} onChange={v => upd(i, 'adaptOpex', v)} step={0.1} style={{ width: 55 }} /></td>
                <td style={td}><NumInput value={a.adaptBenefitPct} onChange={v => upd(i, 'adaptBenefitPct', v)} style={{ width: 50 }} /></td>
                <td style={td}><button onClick={() => delA(i)} style={delBtn}>✕</button></td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}

      {tab === 1 && (
        <Panel title={`Asset heat map (${s.ssp} @ ${s.horizonYr})`}>
          <Table cols={['Asset', ...HAZARDS, 'Total exposure', 'RaR %']}>
            {assets.map((a, i) => (
              <tr key={i}>
                <td style={td}><b>{a.name}</b></td>
                {['heatExp', 'waterExp', 'cycloneExp', 'floodExp', 'dustExp'].map(k => {
                  const v = a[k]; const color = v >= 4 ? T.red : v >= 3 ? T.amber : v >= 2 ? T.sage : T.textMut;
                  return <td key={k} style={{ ...td, background: color + '40', textAlign: 'center', fontFamily: T.mono, color: T.text, fontWeight: 600 }}>{v}</td>;
                })}
                <td style={{ ...td, fontFamily: T.mono }}>{a.heatExp + a.waterExp + a.cycloneExp + a.floodExp + a.dustExp}/25</td>
                <td style={{ ...td, fontFamily: T.mono, color: a.rar > 25 ? T.red : a.rar > 15 ? T.amber : T.green }}>{a.rar.toFixed(1)}%</td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}

      {tab === 2 && (
        <Panel title="SSP × horizon projection (RaR %)">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={[2030, 2040, 2050].map(yr => ({
              year: yr,
              'SSP1-2.6': assets.reduce((a, x) => a + rarPct(x, 'SSP1-2.6', yr), 0) / assets.length,
              'SSP2-4.5': assets.reduce((a, x) => a + rarPct(x, 'SSP2-4.5', yr), 0) / assets.length,
              'SSP5-8.5': assets.reduce((a, x) => a + rarPct(x, 'SSP5-8.5', yr), 0) / assets.length,
            }))}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: 'Mean RaR %', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}` }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line dataKey="SSP1-2.6" stroke={T.green} strokeWidth={2} />
              <Line dataKey="SSP2-4.5" stroke={T.amber} strokeWidth={2} />
              <Line dataKey="SSP5-8.5" stroke={T.red} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      )}

      {tab === 3 && (
        <Panel title="Financial impact — revenue + DSCR">
          <Table cols={['Asset', 'Rev ₹Cr', 'RaR ₹Cr', 'EBITDA', 'Debt svc', 'DSCR base', 'DSCR stressed', 'DSCR + adapt']}>
            {assets.map((a, i) => (
              <tr key={i}>
                <td style={td}><b>{a.name}</b></td>
                <td style={{ ...td, fontFamily: T.mono }}>{a.revenueCr}</td>
                <td style={{ ...td, fontFamily: T.mono, color: T.red }}>{a.revLossCr.toFixed(1)}</td>
                <td style={{ ...td, fontFamily: T.mono }}>{a.ebitda.toFixed(1)}</td>
                <td style={{ ...td, fontFamily: T.mono }}>{a.debtSvc.toFixed(1)}</td>
                <td style={{ ...td, fontFamily: T.mono, color: T.green }}>{a.dscrBase.toFixed(2)}</td>
                <td style={{ ...td, fontFamily: T.mono, color: a.dscrStressed < 1.2 ? T.red : a.dscrStressed < 1.4 ? T.amber : T.green }}>{a.dscrStressed.toFixed(2)}</td>
                <td style={{ ...td, fontFamily: T.mono, color: a.dscrAfterAdapt < 1.2 ? T.red : T.green }}>{a.dscrAfterAdapt.toFixed(2)}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}

      {tab === 4 && (
        <Panel title="Adaptation investment — 15-yr ROI">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={assets.map(a => ({ id: a.id, roi: +a.adaptRoiPct.toFixed(0), capex: a.adaptCapex }))}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="id" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: 'ROI %', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}` }} />
              <Bar dataKey="roi" fill={T.gold} />
            </BarChart>
          </ResponsiveContainer>
          <Table cols={['Asset', 'Capex ₹Cr', 'Opex ₹Cr/yr', 'RaR before', 'RaR after', 'Lifetime benefit', 'ROI %']}>
            {[...assets].sort((a, b) => b.adaptRoiPct - a.adaptRoiPct).map((a, i) => (
              <tr key={i}>
                <td style={td}><b>{a.name}</b></td>
                <td style={{ ...td, fontFamily: T.mono }}>{a.adaptCapex}</td>
                <td style={{ ...td, fontFamily: T.mono }}>{a.adaptOpex}</td>
                <td style={{ ...td, fontFamily: T.mono, color: T.red }}>{a.rarBeforeAdapt.toFixed(1)}%</td>
                <td style={{ ...td, fontFamily: T.mono, color: T.amber }}>{a.rarAfterAdapt.toFixed(1)}%</td>
                <td style={{ ...td, fontFamily: T.mono, color: T.green }}>₹{a.adaptLifetimeBenefit.toFixed(0)}</td>
                <td style={{ ...td, fontFamily: T.mono, color: a.adaptRoiPct > 200 ? T.green : a.adaptRoiPct > 100 ? T.gold : T.amber }}>{a.adaptRoiPct.toFixed(0)}%</td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}

      {tab === 5 && (
        <Panel title="TCFD 4-pillar coverage (editable live inputs ↓)">
          <Table cols={['Pillar', 'Recommended disclosures', 'Current status']}>
            {[
              ['Governance', '3 (Board oversight, Mgmt role, Climate committee)', 'Disclosed — board climate sub-committee FY25'],
              ['Strategy', '4 (Risks/opps, Impact on biz, Scenario analysis, Transition plan)', `Scenario analysis live in this tool (${s.ssp} × 2030/2040/2050). Transition plan pending Q2.`],
              ['Risk & Impact Mgmt', '4 (ID/assess, Manage, Integrate)', `Asset-level heat map live. ${assets.length} assets scored. Integration with ERM Q3.`],
              ['Metrics & Targets', '3 (Metrics, GHG, Targets)', `Physical RaR ₹${totalRaR.toFixed(1)} Cr, DSCR-at-risk ${stressedAssets} assets. SBTi 1.5°C filed.`],
            ].map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={j===0 ? { ...td, fontFamily: T.mono, color: T.gold, fontWeight: 600 } : td}>{c}</td>)}</tr>)}
          </Table>
        </Panel>
      )}

      {tab === 6 && (
        <Panel title="Client deliverable stack">
          <ul style={{ lineHeight: 1.9, fontSize: 13, color: T.textSec }}>
            <li><b style={{ color: T.text }}>Asset-level CSV</b> — RaR + DSCR by asset. <button style={btnInline} onClick={exportCsv}>Download</button></li>
            <li><b style={{ color: T.text }}>Scenario state JSON</b>. <button style={btnInline} onClick={exportJson}>Download</button></li>
            <li><b style={{ color: T.text }}>TCFD Report (HTML/PDF)</b> — board-ready, aligned IFRS S2. <button style={{ ...btnInline, background: T.gold, color: T.navy, borderColor: T.gold }} onClick={generateReport}>Generate</button></li>
          </ul>
        </Panel>
      )}
    </div>
  );
}

function L({ label, children }) { return <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: T.textSec }}><span style={{ minWidth: 110 }}>{label}</span>{children}</label>; }
const selS = { background: T.surface, color: T.text, border: `1px solid ${T.border}`, padding: '4px 6px', fontSize: 12, borderRadius: 2 };
const addBtn = { background: T.teal, color: T.text, border: 'none', padding: '4px 12px', fontSize: 11, cursor: 'pointer', borderRadius: 3 };
const delBtn = { background: 'transparent', color: T.red, border: 'none', cursor: 'pointer', fontSize: 14 };
const btnInline = { background: T.surface, color: T.gold, border: `1px solid ${T.gold}`, padding: '3px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 3, marginLeft: 8 };
