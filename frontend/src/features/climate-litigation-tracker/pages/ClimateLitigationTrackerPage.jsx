import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, LineChart, Line, Cell,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Climate Litigation Tracker
// Landmark climate-litigation cases → jurisdiction / defendant-sector /
// legal-theory analytics + a sector-jurisdiction exposure prior.
// Data: hand-authored REAL extract of landmark cases from the Sabin Center
//   Climate Change Litigation Databases (climatecasechart.com, now powered by
//   Climate Policy Radar) — the full DB holds 3,000+ cases. This is a curated
//   verified subset for analytics context; each fact (year, jurisdiction, status)
//   was checked. Refresh from climatecasechart.com for the full population.
// No PRNG/fabricated data; the exposure prior is an explicit small-sample
// frequency computed from the extract, with the full-DB caveat stated.
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', blue: '#0369a1',
  border: '#e2ded5',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

// Legal theory buckets: Constitutional/Human Rights, Tort/Nuisance,
// Corporate/Directors, Securities/Consumer Fraud, Administrative/Planning, Public Trust.
const CASES = [
  { name: 'Massachusetts v. EPA', jur: 'United States', year: 2003, sector: 'Government', theory: 'Administrative/Statutory', status: 'Decided', outcome: 'Plaintiff win — GHGs are Clean Air Act pollutants (2007)' },
  { name: 'American Electric Power v. Connecticut', jur: 'United States', year: 2004, sector: 'Utilities', theory: 'Tort/Nuisance', status: 'Decided', outcome: 'Defendant win — federal nuisance displaced by CAA (2011)' },
  { name: 'Urgenda Foundation v. Netherlands', jur: 'Netherlands', year: 2013, sector: 'Government', theory: 'Human Rights', status: 'Decided', outcome: 'Plaintiff win — state ordered to cut 25% by 2020 (2019)' },
  { name: 'Leghari v. Federation of Pakistan', jur: 'Pakistan', year: 2015, sector: 'Government', theory: 'Human Rights', status: 'Decided', outcome: 'Plaintiff win — climate commission ordered (2015)' },
  { name: 'Lliuya v. RWE', jur: 'Germany', year: 2015, sector: 'Utilities', theory: 'Tort/Nuisance', status: 'Decided', outcome: 'Dismissed on facts (2025) — but transboundary liability principle affirmed' },
  { name: 'Juliana v. United States', jur: 'United States', year: 2015, sector: 'Government', theory: 'Public Trust', status: 'Dismissed', outcome: 'Dismissed for lack of standing/redressability (9th Cir 2020)' },
  { name: 'City of New York v. BP / Chevron', jur: 'United States', year: 2018, sector: 'Oil & Gas', theory: 'Tort/Nuisance', status: 'Dismissed', outcome: 'Dismissed — federal common law displaced (2nd Cir 2021)' },
  { name: 'Future Generations v. Ministry of Environment', jur: 'Colombia', year: 2018, sector: 'Government', theory: 'Human Rights', status: 'Decided', outcome: 'Plaintiff win — Amazon a subject of rights; deforestation order' },
  { name: 'Gloucester Resources v. Minister (Rocky Hill)', jur: 'Australia', year: 2018, sector: 'Mining', theory: 'Administrative/Planning', status: 'Decided', outcome: 'Coal mine refused partly on climate grounds (2019)' },
  { name: 'Milieudefensie v. Royal Dutch Shell', jur: 'Netherlands', year: 2019, sector: 'Oil & Gas', theory: 'Tort/Nuisance', status: 'Decided', outcome: '2021 45%-cut order overturned on appeal (2024)' },
  { name: 'Massachusetts AG v. ExxonMobil', jur: 'United States', year: 2019, sector: 'Oil & Gas', theory: 'Securities/Consumer Fraud', status: 'Ongoing', outcome: 'Consumer-protection & investor-fraud claims proceeding' },
  { name: 'Smith v. Fonterra', jur: 'New Zealand', year: 2019, sector: 'Agriculture', theory: 'Tort/Nuisance', status: 'Ongoing', outcome: 'NZ Supreme Court allowed tort claim to proceed (2024)' },
  { name: 'Friends of the Irish Environment v. Ireland', jur: 'Ireland', year: 2019, sector: 'Government', theory: 'Administrative/Planning', status: 'Decided', outcome: 'Plaintiff win — 2017 climate plan quashed (2020)' },
  { name: "Notre Affaire à Tous v. France", jur: 'France', year: 2019, sector: 'Government', theory: 'Administrative/Planning', status: 'Decided', outcome: 'Plaintiff win — state liable for climate inaction (2021)' },
  { name: 'Sharma v. Minister for the Environment', jur: 'Australia', year: 2020, sector: 'Government', theory: 'Tort/Nuisance', status: 'Decided', outcome: 'Duty of care to children overturned on appeal (2022)' },
  { name: 'Held v. State of Montana', jur: 'United States', year: 2020, sector: 'Government', theory: 'Constitutional', status: 'Decided', outcome: 'Plaintiff win — green-amendment right; affirmed by MT Sup Ct (2024)' },
  { name: 'La Rose v. Canada', jur: 'Canada', year: 2019, sector: 'Government', theory: 'Constitutional', status: 'Ongoing', outcome: 'Fed Court of Appeal allowed claim to proceed (2023)' },
  { name: 'Mathur v. Ontario', jur: 'Canada', year: 2019, sector: 'Government', theory: 'Constitutional', status: 'Ongoing', outcome: 'Court of Appeal ordered reconsideration (2024)' },
  { name: 'Neubauer et al. v. Germany', jur: 'Germany', year: 2020, sector: 'Government', theory: 'Constitutional', status: 'Decided', outcome: 'Plaintiff win — intergenerational rights; law strengthened (2021)' },
  { name: 'Greenpeace Nordic v. Norway (Arctic Oil)', jur: 'Norway', year: 2016, sector: 'Oil & Gas', theory: 'Human Rights', status: 'Decided', outcome: 'Licenses upheld by Sup Ct (2020); ECtHR complaint followed' },
  { name: 'Verein KlimaSeniorinnen v. Switzerland', jur: 'European Court of Human Rights', year: 2020, sector: 'Government', theory: 'Human Rights', status: 'Decided', outcome: 'Plaintiff win — ECHR Art. 8 breach (2024)' },
  { name: 'Daniel Billy v. Australia (Torres Strait)', jur: 'UN Human Rights Committee', year: 2019, sector: 'Government', theory: 'Human Rights', status: 'Decided', outcome: 'Australia found to violate Islanders’ rights (2022)' },
  { name: 'ClientEarth v. Shell Board of Directors', jur: 'United Kingdom', year: 2023, sector: 'Oil & Gas', theory: 'Corporate/Directors', status: 'Dismissed', outcome: 'Derivative claim against directors dismissed (2023)' },
  { name: 'Asmania et al. v. Holcim', jur: 'Switzerland', year: 2022, sector: 'Cement', theory: 'Tort/Nuisance', status: 'Ongoing', outcome: 'Indonesian islanders’ damages/mitigation claim proceeding' },
  { name: 'Milieudefensie v. ING Bank', jur: 'Netherlands', year: 2024, sector: 'Financial', theory: 'Corporate/Directors', status: 'Ongoing', outcome: 'First major duty-of-care claim against a bank' },
  { name: 'Aurora (Anton Foley) v. Sweden', jur: 'Sweden', year: 2022, sector: 'Government', theory: 'Human Rights', status: 'Ongoing', outcome: 'Class action alleging insufficient state mitigation' },
  { name: 'California v. Exxon, Shell, Chevron et al.', jur: 'United States', year: 2023, sector: 'Oil & Gas', theory: 'Securities/Consumer Fraud', status: 'Ongoing', outcome: 'State deception/nuisance suit; damages fund sought' },
  { name: 'Comer v. Murphy Oil', jur: 'United States', year: 2005, sector: 'Oil & Gas', theory: 'Tort/Nuisance', status: 'Dismissed', outcome: 'Dismissed on standing/political-question grounds' },
  { name: 'Rikki Held-style youth suit (Navahine v. HDOT)', jur: 'United States', year: 2022, sector: 'Government', theory: 'Constitutional', status: 'Decided', outcome: 'Settlement — Hawaii DOT decarbonization commitments (2024)' },
  { name: 'Greenpeace v. TotalEnergies', jur: 'France', year: 2022, sector: 'Oil & Gas', theory: 'Securities/Consumer Fraud', status: 'Ongoing', outcome: 'Greenwashing / misleading net-zero-claims suit' },
];

const THEORY_COLOR = {
  'Constitutional': '#1b3a5c', 'Human Rights': '#0f766e', 'Tort/Nuisance': '#b45309',
  'Corporate/Directors': '#6d28d9', 'Securities/Consumer Fraud': '#b91c1c',
  'Administrative/Planning': '#0369a1', 'Administrative/Statutory': '#0369a1', 'Public Trust': '#15803d',
};
const STATUS_COLOR = { Decided: T.green, Ongoing: T.amber, Dismissed: T.red };

const Badge = () => <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>○ Curated extract — Sabin Climate Case Chart</span>;

const Kpi = ({ label, value, sub, color = T.navy }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

const th = { textAlign: 'left', fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 8px', borderBottom: `2px solid ${T.border}` };
const td = { fontSize: 12, color: T.slate, padding: '6px 8px', borderBottom: `1px solid ${T.border}`, verticalAlign: 'top' };
const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 };
const selectStyle = { border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 12, fontFamily: T.mono, color: T.navy, background: '#fff' };

const countBy = (arr, key) => {
  const m = {};
  arr.forEach((x) => { m[x[key]] = (m[x[key]] || 0) + 1; });
  return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
};

export default function ClimateLitigationTrackerPage() {
  const [fSector, setFSector] = useState('All');
  const [fJur, setFJur] = useState('All');
  const [fTheory, setFTheory] = useState('All');
  const [scSector, setScSector] = useState('Oil & Gas');
  const [scJur, setScJur] = useState('United States');

  const sectors = useMemo(() => ['All', ...Array.from(new Set(CASES.map((c) => c.sector))).sort()], []);
  const jurs = useMemo(() => ['All', ...Array.from(new Set(CASES.map((c) => c.jur))).sort()], []);
  const theories = useMemo(() => ['All', ...Array.from(new Set(CASES.map((c) => c.theory))).sort()], []);

  const filtered = useMemo(() => CASES.filter((c) =>
    (fSector === 'All' || c.sector === fSector) &&
    (fJur === 'All' || c.jur === fJur) &&
    (fTheory === 'All' || c.theory === fTheory)
  ), [fSector, fJur, fTheory]);

  const byYear = useMemo(() => {
    const m = {};
    CASES.forEach((c) => { m[c.year] = (m[c.year] || 0) + 1; });
    const years = Object.keys(m).map(Number).sort((a, b) => a - b);
    let cum = 0;
    return years.map((y) => { cum += m[y]; return { year: y, filed: m[y], cumulative: cum }; });
  }, []);

  const byTheory = useMemo(() => countBy(CASES, 'theory'), []);
  const bySector = useMemo(() => countBy(CASES, 'sector'), []);
  const winRate = useMemo(() => {
    const decided = CASES.filter((c) => c.status === 'Decided' || c.status === 'Dismissed');
    const plaintiffWins = CASES.filter((c) => /Plaintiff win|Settlement|affirmed|proceed|refused/i.test(c.outcome)).length;
    return { decided: decided.length, wins: plaintiffWins };
  }, []);

  // Exposure prior: cases matching sector+jurisdiction / total (small-sample frequency)
  const prior = useMemo(() => {
    const inSector = CASES.filter((c) => c.sector === scSector);
    const inBoth = inSector.filter((c) => c.jur === scJur);
    return {
      sectorCount: inSector.length,
      bothCount: inBoth.length,
      sectorFreq: inSector.length / CASES.length,
      bothFreq: inBoth.length / CASES.length,
      cases: inBoth,
    };
  }, [scSector, scJur]);

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: '24px 28px', color: T.navy }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Climate Litigation Tracker</h1>
        <Badge />
      </div>
      <p style={{ color: T.sub, fontSize: 13, maxWidth: 940, marginTop: 4 }}>
        A curated, fact-checked extract of {CASES.length} landmark climate cases from the Sabin Center
        Climate Change Litigation Databases — analysed by year, jurisdiction, defendant sector and legal
        theory, with a sector-jurisdiction exposure prior. The full database holds 3,000+ cases.
      </p>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
        <Kpi label="Cases in extract" value={CASES.length} />
        <Kpi label="Jurisdictions" value={jurs.length - 1} />
        <Kpi label="Ongoing" value={CASES.filter((c) => c.status === 'Ongoing').length} color={T.amber} />
        <Kpi label="Plaintiff-favourable" value={winRate.wins} color={T.green} sub={`of ${CASES.length} landmark cases`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(300px, 1fr)', gap: 18 }}>
        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Cases filed by year (cumulative)</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={byYear} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.sub }} />
              <YAxis tick={{ fontSize: 11, fill: T.sub }} />
              <Tooltip contentStyle={{ fontSize: 12, fontFamily: T.mono }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="filed" name="Filed" stroke={T.blue} strokeWidth={1.8} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="cumulative" name="Cumulative" stroke={T.navy} strokeWidth={2.4} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>By legal theory</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byTheory} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 11, fill: T.sub }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 9.5, fill: T.sub }} />
              <Tooltip contentStyle={{ fontSize: 12, fontFamily: T.mono }} />
              <Bar dataKey="value" name="Cases">
                {byTheory.map((t) => <Cell key={t.name} fill={THEORY_COLOR[t.name] || T.slate} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Exposure scorer */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Litigation exposure prior</div>
          <select style={selectStyle} value={scSector} onChange={(e) => setScSector(e.target.value)}>
            {sectors.filter((s) => s !== 'All').map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select style={selectStyle} value={scJur} onChange={(e) => setScJur(e.target.value)}>
            {jurs.filter((j) => j !== 'All').map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
          <Kpi label={`${scSector} cases`} value={prior.sectorCount} sub={`${(prior.sectorFreq * 100).toFixed(0)}% of extract`} />
          <Kpi label={`${scSector} in ${scJur}`} value={prior.bothCount} color={prior.bothCount ? T.red : T.green} sub={`${(prior.bothFreq * 100).toFixed(0)}% of extract`} />
          <Kpi label="Empirical prior" value={`${(prior.bothFreq * 100).toFixed(1)}%`} color={T.purple} sub="landmark-case frequency" />
        </div>
        <div style={{ fontSize: 11, color: T.sub }}>
          Small-sample frequency from the {CASES.length}-case landmark extract — a directional prior, not a base rate.
          For a calibrated frequency, weight against the full Sabin/CPR database (3,000+ cases) at climatecasechart.com.
        </div>
        {prior.cases.length > 0 && (
          <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 12, color: T.slate }}>
            {prior.cases.map((c) => <li key={c.name} style={{ marginBottom: 3 }}>{c.name} <span style={{ color: T.sub }}>({c.year}, {c.status})</span></li>)}
          </ul>
        )}
      </div>

      {/* Filterable case table */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Cases <span style={{ color: T.sub, fontWeight: 400, fontSize: 12 }}>({filtered.length})</span></div>
          <select style={selectStyle} value={fSector} onChange={(e) => setFSector(e.target.value)}>{sectors.map((s) => <option key={s} value={s}>{s === 'All' ? 'All sectors' : s}</option>)}</select>
          <select style={selectStyle} value={fJur} onChange={(e) => setFJur(e.target.value)}>{jurs.map((j) => <option key={j} value={j}>{j === 'All' ? 'All jurisdictions' : j}</option>)}</select>
          <select style={selectStyle} value={fTheory} onChange={(e) => setFTheory(e.target.value)}>{theories.map((t) => <option key={t} value={t}>{t === 'All' ? 'All theories' : t}</option>)}</select>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={th}>Case</th><th style={th}>Jurisdiction</th><th style={th}>Year</th><th style={th}>Sector</th><th style={th}>Theory</th><th style={th}>Status</th><th style={th}>Outcome</th></tr></thead>
          <tbody>
            {filtered.sort((a, b) => b.year - a.year).map((c) => (
              <tr key={c.name}>
                <td style={{ ...td, fontWeight: 600 }}>{c.name}</td>
                <td style={td}>{c.jur}</td>
                <td style={{ ...td, fontFamily: T.mono }}>{c.year}</td>
                <td style={td}>{c.sector}</td>
                <td style={td}><span style={{ fontSize: 10.5, color: '#fff', background: THEORY_COLOR[c.theory] || T.slate, padding: '2px 6px', borderRadius: 4 }}>{c.theory}</span></td>
                <td style={{ ...td, fontWeight: 700, color: STATUS_COLOR[c.status] || T.slate }}>{c.status}</td>
                <td style={{ ...td, fontSize: 11, color: T.sub, maxWidth: 260 }}>{c.outcome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 11, color: T.sub, fontFamily: T.mono }}>
        Source: Sabin Center for Climate Change Law — Climate Change Litigation Databases (climatecasechart.com),
        now powered by Climate Policy Radar. Curated landmark subset; verify current status before relying on any entry.
      </div>
    </div>
  );
}
