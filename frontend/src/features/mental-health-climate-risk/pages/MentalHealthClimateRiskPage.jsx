import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const EVENTS = ['Wildfire', 'Flood', 'Hurricane', 'Drought', 'Heatwave', 'Sea Level Rise'];
const POP_TYPES = ['Coastal Community', 'Wildfire Zone', 'Agriculture-Dependent', 'Urban Heat Island', 'Island Nation', 'Flood Plain', 'Arctic/Polar', 'Drought-Prone'];

const POPULATIONS = Array.from({ length: 65 }, (_, i) => {
  const ptIdx = Math.floor(sr(i * 5) * POP_TYPES.length);
  const evIdx = Math.floor(sr(i * 7) * EVENTS.length);
  const ecoAnxiety = 10 + sr(i * 11) * 85;
  const ptsdRate = 5 + sr(i * 13) * 45;
  const insGap = 20 + sr(i * 17) * 75;
  const disasterMH = 15 + sr(i * 19) * 70;
  const treatAccess = 5 + sr(i * 23) * 80;
  const econImpact = 0.1 + sr(i * 29) * 4.9;
  const workdaysLost = Math.round(2 + sr(i * 31) * 28);
  const popSize = Math.round(50000 + sr(i * 37) * 9950000);
  const popNames = ['Pacific Islanders','Bangladesh Delta','California Wildfire Zone','Netherlands Coast','Sahel Pastoralists','Maldives Nation','Arctic Inuit','Australian Outback','Amazon Riverside','Caribbean Island','Florida Keys','Louisiana Bayou','Ganges Delta','Yangtze Basin','Murray-Darling Basin','Sub-Saharan Pastoralists','Coral Triangle','Horn of Africa','Siberian Tundra','Indus Valley','Tigris-Euphrates','Nile Delta','Rhine Valley','Mississippi Delta','Brahmaputra Delta','Mekong Delta','Orinoco Basin','Congo Basin','Lake Chad Basin','Aral Sea Region','Atacama Desert Edge','Himalayan Foothills','Tibetan Plateau','Sundarbans','Great Barrier Reef','Chesapeake Bay','Baltic Sea Coast','Mediterranean Small Islands','Adriatic Coast','Danube Basin','Okavango Delta','Zambezi Valley','Niger River Delta','Volta Basin','Irrawaddy Delta','Chao Phraya Basin','Red River Delta','Pearl River Delta','Bohai Bay','Yellow Sea Coast','Japan Pacific Coast','Korean Peninsula Coast','Philippine Archipelago','Indonesian Outer Islands','PNG Highlands','Fiji Islands','Tonga Islands','Samoa Islands','Kiribati Atoll','Tuvalu Atoll','Marshall Islands','Palau Islands','Cook Islands','Vanuatu Islands','Solomon Islands'];
  return { id: i, name: popNames[i] || `Population ${i+1}`, popType: POP_TYPES[ptIdx], primaryEvent: EVENTS[evIdx], ecoAnxiety: +ecoAnxiety.toFixed(1), ptsdRate: +ptsdRate.toFixed(1), insGap: +insGap.toFixed(1), disasterMH: +disasterMH.toFixed(1), treatAccess: +treatAccess.toFixed(1), econImpact: +econImpact.toFixed(2), workdaysLost, popSize };
});

const EVENT_DATA = EVENTS.map((e, i) => ({
  event: e,
  prevalenceIncrease: +(15 + sr(i * 41) * 85).toFixed(1),
  ptsdRate: +(10 + sr(i * 43) * 50).toFixed(1),
  chronicAnxiety: +(15 + sr(i * 47) * 55).toFixed(1),
  economicCostBn: +(0.5 + sr(i * 53) * 19.5).toFixed(1),
  recoveryYears: +(1 + sr(i * 59) * 9).toFixed(1),
}));

const TABS = ['Overview', 'Eco-Anxiety Index', 'PTSD & Trauma', 'Disaster MH Impact', 'Insurance Gap', 'Treatment Access', 'Economic Burden', 'Investment Framework'];

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 16px', borderTop: `3px solid ${color || T.gold}` }}>
      <div style={{ fontSize: 10, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontFamily: T.fontMono }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Bar({ pct, color }) {
  return (
    <div style={{ background: T.borderL, borderRadius: 2, height: 6, width: '100%' }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', borderRadius: 2, background: color || T.gold }} />
    </div>
  );
}

export default function MentalHealthClimateRiskPage() {
  const [tab, setTab] = useState(0);
  const [popTypeFilter, setPopTypeFilter] = useState('All');
  const [eventFilter, setEventFilter] = useState('All');

  const filtered = useMemo(() => {
    return POPULATIONS.filter(p =>
      (popTypeFilter === 'All' || p.popType === popTypeFilter) &&
      (eventFilter === 'All' || p.primaryEvent === eventFilter)
    );
  }, [popTypeFilter, eventFilter]);

  const avgEcoAnxiety = filtered.length ? (filtered.reduce((a, p) => a + p.ecoAnxiety, 0) / filtered.length).toFixed(1) : '0.0';
  const avgPtsd = filtered.length ? (filtered.reduce((a, p) => a + p.ptsdRate, 0) / filtered.length).toFixed(1) : '0.0';
  const avgInsGap = filtered.length ? (filtered.reduce((a, p) => a + p.insGap, 0) / filtered.length).toFixed(1) : '0.0';
  const totalEconImpact = filtered.reduce((a, p) => a + p.econImpact, 0).toFixed(1);
  const avgTreatAccess = filtered.length ? (filtered.reduce((a, p) => a + p.treatAccess, 0) / filtered.length).toFixed(1) : '0.0';
  const highAnxiety = filtered.filter(p => p.ecoAnxiety > 70).length;

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto', fontFamily: "'DM Sans', sans-serif", background: T.bg, minHeight: '100vh' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>EP-DP5 · HEALTH & CLIMATE WELLBEING</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: T.navy, margin: 0 }}>Mental Health & Climate Risk</h1>
            <p style={{ color: T.textSec, fontSize: 13, marginTop: 4 }}>Eco-anxiety index · Disaster mental health · Insurance gap — 65 populations · 6 events</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Avg Eco-Anxiety" value={`${avgEcoAnxiety}/100`} sub="Climate anxiety index" color={T.purple} />
        <KpiCard label="Avg PTSD Rate" value={`${avgPtsd}%`} sub="Post-disaster" color={T.red} />
        <KpiCard label="Avg Insurance Gap" value={`${avgInsGap}%`} sub="MH coverage gap" color={T.amber} />
        <KpiCard label="Total Econ Impact" value={`$${totalEconImpact}Bn`} sub="Lost productivity" color={T.orange} />
        <KpiCard label="Avg Treatment Access" value={`${avgTreatAccess}%`} sub="Service availability" color={T.teal} />
        <KpiCard label="High-Anxiety Pops" value={highAnxiety} sub="Eco-anxiety > 70" color={T.purple} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={popTypeFilter} onChange={e => setPopTypeFilter(e.target.value)} style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, background: T.card, color: T.navy }}>
          <option value="All">All Population Types</option>
          {POP_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={eventFilter} onChange={e => setEventFilter(e.target.value)} style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, background: T.card, color: T.navy }}>
          <option value="All">All Events</option>
          {EVENTS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <span style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center' }}>{filtered.length} populations</span>
      </div>

      <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: `2px solid ${T.border}` }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 14px', border: 'none', background: 'none', borderBottom: tab === i ? `2px solid ${T.navy}` : '2px solid transparent', color: tab === i ? T.navy : T.textSec, fontWeight: tab === i ? 700 : 400, fontSize: 12, cursor: 'pointer', marginBottom: -2 }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Highest Eco-Anxiety Populations</div>
            {[...filtered].sort((a, b) => b.ecoAnxiety - a.ecoAnxiety).slice(0, 12).map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontFamily: T.fontMono, color: T.textSec, width: 18 }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: T.navy }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: T.textSec }}>{p.popType} · {p.primaryEvent}</div>
                </div>
                <span style={{ fontSize: 12, fontFamily: T.fontMono, color: p.ecoAnxiety > 70 ? T.purple : T.amber, fontWeight: 700 }}>{p.ecoAnxiety}</span>
                <div style={{ width: 60 }}><Bar pct={p.ecoAnxiety} color={p.ecoAnxiety > 70 ? T.purple : T.amber} /></div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Event-Type MH Impact</div>
            {EVENT_DATA.map(e => (
              <div key={e.event} style={{ marginBottom: 10, padding: '8px 10px', background: T.sub, borderRadius: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>{e.event}</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 11, color: T.textSec }}>PTSD: <b style={{ color: T.red }}>{e.ptsdRate}%</b></span>
                  <span style={{ fontSize: 11, color: T.textSec }}>Anxiety: <b style={{ color: T.purple }}>+{e.prevalenceIncrease}%</b></span>
                  <span style={{ fontSize: 11, color: T.textSec }}>Cost: <b style={{ color: T.orange }}>${e.economicCostBn}Bn</b></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Eco-Anxiety Index — All Populations</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[...filtered].sort((a, b) => b.ecoAnxiety - a.ecoAnxiety).map(p => (
              <div key={p.id} style={{ background: T.sub, borderRadius: 6, padding: '10px 12px', borderLeft: `3px solid ${p.ecoAnxiety > 70 ? T.purple : p.ecoAnxiety > 50 ? T.amber : T.sage}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{p.name}</div>
                <div style={{ fontSize: 10, color: T.textSec, marginBottom: 4 }}>{p.popType} · {p.primaryEvent}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 22, fontWeight: 700, fontFamily: T.fontMono, color: p.ecoAnxiety > 70 ? T.purple : T.amber }}>{p.ecoAnxiety}</span>
                  <span style={{ fontSize: 10, color: T.textSec }}>Pop: {(p.popSize / 1000000).toFixed(1)}M</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>PTSD & Trauma Rates — Post-Climate Event</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {filtered.slice(0, 24).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: T.sub, borderRadius: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{p.primaryEvent}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontFamily: T.fontMono, fontWeight: 700, color: p.ptsdRate > 30 ? T.red : T.amber }}>{p.ptsdRate}%</div>
                    <div style={{ fontSize: 9, color: T.textSec }}>PTSD rate</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Disaster Mental Health Impact — Event Analysis</div>
          {EVENT_DATA.map(e => (
            <div key={e.event} style={{ marginBottom: 14, padding: '12px 14px', background: T.sub, borderRadius: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{e.event}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { label: 'Prevalence Increase', val: `+${e.prevalenceIncrease}%`, color: T.purple },
                  { label: 'PTSD Rate', val: `${e.ptsdRate}%`, color: T.red },
                  { label: 'Chronic Anxiety', val: `${e.chronicAnxiety}%`, color: T.amber },
                  { label: 'Recovery (years)', val: e.recoveryYears, color: T.teal },
                ].map(item => (
                  <div key={item.label} style={{ background: T.card, borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: T.textSec }}>{item.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, fontFamily: T.fontMono, color: item.color }}>{item.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 8 }}>Economic cost: <b style={{ color: T.orange }}>${e.economicCostBn}Bn</b></div>
            </div>
          ))}
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Mental Health Insurance Gap by Population</div>
            {[...filtered].sort((a, b) => b.insGap - a.insGap).slice(0, 25).map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ width: 140, fontSize: 12, color: T.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                <span style={{ width: 80, fontSize: 11, color: T.textSec }}>{p.popType}</span>
                <div style={{ flex: 1 }}><Bar pct={p.insGap} color={p.insGap > 70 ? T.red : p.insGap > 50 ? T.amber : T.sage} /></div>
                <span style={{ fontFamily: T.fontMono, fontSize: 12, color: p.insGap > 70 ? T.red : T.amber, width: 45 }}>{p.insGap}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Treatment Access vs Eco-Anxiety</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {filtered.slice(0, 30).map(p => (
              <div key={p.id} style={{ background: T.sub, borderRadius: 6, padding: '10px 12px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.navy, marginBottom: 2 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: T.textSec, marginBottom: 6 }}>{p.popType}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  <div><div style={{ fontSize: 9, color: T.textSec }}>Treat. Access</div><div style={{ fontSize: 18, fontFamily: T.fontMono, fontWeight: 700, color: p.treatAccess < 30 ? T.red : T.teal }}>{p.treatAccess}%</div></div>
                  <div><div style={{ fontSize: 9, color: T.textSec }}>Eco-Anxiety</div><div style={{ fontSize: 18, fontFamily: T.fontMono, fontWeight: 700, color: p.ecoAnxiety > 70 ? T.purple : T.amber }}>{p.ecoAnxiety}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 6 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Economic Burden — Lost Productivity & Healthcare Costs</div>
          {[...filtered].sort((a, b) => b.econImpact - a.econImpact).slice(0, 25).map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ width: 140, fontSize: 12, color: T.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              <div style={{ flex: 1 }}><Bar pct={p.econImpact / 5 * 100} color={T.orange} /></div>
              <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.orange, width: 55 }}>${p.econImpact}Bn</span>
              <span style={{ fontSize: 11, color: T.textSec }}>{p.workdaysLost} days lost</span>
            </div>
          ))}
        </div>
      )}

      {tab === 7 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Mental Health Climate Investment Framework</div>
          {[
            { framework: 'WHO Special Initiative for MH (SIMH)', funding: '$2.5Bn', focus: 'Universal health coverage · MH integration', instruments: 'MDB concessional loans' },
            { framework: 'Lancet Commission on Climate & MH', funding: '$0.8Bn', focus: 'Research · Policy · Advocacy', instruments: 'Philanthropy + public' },
            { framework: 'UNDP Climate-MH Resilience Window', funding: '$1.2Bn', focus: 'Post-disaster psychosocial support', instruments: 'GCF · GEF aligned' },
            { framework: 'Parametric Disaster MH Insurance', funding: 'Pipeline $5Bn', focus: 'Trigger: Disaster severity index', instruments: 'ILS · CAT bond' },
            { framework: 'Social Impact Bonds — Climate MH', funding: '$0.5Bn', focus: 'Outcomes-based · CBT programs', instruments: 'SIB · Development Impact Bond' },
            { framework: 'IFRC Mental Health & Psychosocial', funding: '$0.3Bn', focus: 'Emergency response · Climate disasters', instruments: 'Humanitarian finance' },
            { framework: 'Corporate Climate Anxiety Programs', funding: 'Market $12Bn', focus: 'Employee wellness · ESG risk', instruments: 'Corporate bonds · ESG-linked' },
            { framework: 'Green Climate Fund MH Mainstreaming', funding: '$0.4Bn', focus: 'Country NAP integration', instruments: 'GCF grant + loan' },
          ].map(fw => (
            <div key={fw.framework} style={{ display: 'flex', gap: 14, padding: '10px 12px', marginBottom: 8, background: T.sub, borderRadius: 6, borderLeft: `3px solid ${T.purple}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{fw.framework}</div>
                <div style={{ fontSize: 10, color: T.textSec }}>{fw.focus}</div>
                <div style={{ fontSize: 10, color: T.teal }}>{fw.instruments}</div>
              </div>
              <span style={{ fontSize: 16, fontFamily: T.fontMono, fontWeight: 700, color: T.indigo, whiteSpace: 'nowrap' }}>{fw.funding}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
