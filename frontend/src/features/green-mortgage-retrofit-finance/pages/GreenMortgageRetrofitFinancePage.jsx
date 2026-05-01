import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const T = {
  bg: '#EFF6FF', card: '#FFFFFF', border: '#BFDBFE', text: '#1E3A5F',
  sub: '#1E40AF', accent: '#2563EB', light: '#DBEAFE',
  green: '#16A34A', amber: '#D97706', red: '#DC2626',
  purple: '#7C3AED', teal: '#0D9488',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const MORTGAGE_PRODUCTS = [
  { bank: 'Barclays Green Home Mortgage', country: 'UK', epcReq: 'A/B', rateBenefit: -0.10, maxLTV: 90, features: 'Free EPC upgrade assessment + 10bps discount', volume2023: 2.1 },
  { bank: 'NatWest Greener Home', country: 'UK', epcReq: 'A/B', rateBenefit: -0.16, maxLTV: 85, features: 'Cashback up to £250 for A-rated homes', volume2023: 1.8 },
  { bank: 'ING Green Mortgage', country: 'Netherlands', epcReq: 'A+/A', rateBenefit: -0.20, maxLTV: 100, features: '20bps discount; 30% of mortgages green by 2025', volume2023: 8.5 },
  { bank: 'BNP Paribas Crédit Vert', country: 'France', epcReq: 'A/B', rateBenefit: -0.15, maxLTV: 85, features: 'Preferred rate + advisory service', volume2023: 3.2 },
  { bank: 'Nationwide Green Additional Borrowing', country: 'UK', epcReq: 'Post-retrofit', rateBenefit: -0.25, maxLTV: 80, features: 'Green further advance for EPC improvement works', volume2023: 0.9 },
  { bank: 'ABN AMRO Energy Mortgage', country: 'Netherlands', epcReq: 'A label', rateBenefit: -0.18, maxLTV: 95, features: 'A-label discount + energy advisory', volume2023: 6.1 },
  { bank: 'Intesa Sanpaolo Prestito Green', country: 'Italy', epcReq: 'Class A/B', rateBenefit: -0.12, maxLTV: 80, features: 'Reduced rate for energy class A/B properties', volume2023: 2.4 },
  { bank: 'Hypo Vorarlberg Klimakredit', country: 'Austria', epcReq: 'A++ to B', rateBenefit: -0.22, maxLTV: 80, features: 'Climate loan for new NZEB or deep retrofit', volume2023: 0.5 },
];

const RETROFIT_SCHEMES = [
  { scheme: 'UK ECO4', country: 'UK', budget: '£4Bn', target: 'Fuel-poor EPC D-G', subsidy: 'Up to 100% for eligible households', tech: 'Insulation, heat pumps, glazing' },
  { scheme: "UK Great British Insulation Scheme", country: 'UK', budget: '£1Bn', target: 'EPC D-G; lowest council tax bands', subsidy: 'Partial subsidy cavity/loft insulation', tech: 'Cavity wall, loft insulation' },
  { scheme: 'EU Renovation Wave', country: 'EU', budget: '€275Bn/yr', target: 'Double annual renovation rate to 2%', subsidy: 'Member state schemes + EU Taxonomy aligned', tech: 'All measures; NZEB standard' },
  { scheme: 'France MaPrimeRénov', country: 'France', budget: '€5Bn (2024)', target: 'Class E-G → Class C+', subsidy: '€35,000–70,000 per household for full package', tech: 'Heat pump, insulation, ventilation' },
  { scheme: 'Germany BAFA / KfW', country: 'Germany', budget: '€12Bn', target: 'BEG standard (energy efficiency houses)', subsidy: '15–25% grant or low-rate loan', tech: 'Heat pump, insulation, windows, MVHR' },
  { scheme: 'IRA §25C Home Efficiency', country: 'USA', budget: 'Uncapped tax credit', target: 'Individual homes', subsidy: '30% tax credit up to $3,200/yr', tech: 'Heat pump, insulation, windows, doors' },
];

const MARKET_DATA = Array.from({ length: 10 }, (_, i) => ({
  year: 2024 + i,
  greenMortgageVolume: Math.round(120 + i * 35),
  retrofitLoanVolume: Math.round(45 + i * 22),
  avgGreenSpread: -(10 + i * 1.5).toFixed(1),
}));

const DEALS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  product: MORTGAGE_PRODUCTS[i % MORTGAGE_PRODUCTS.length].bank,
  country: MORTGAGE_PRODUCTS[i % MORTGAGE_PRODUCTS.length].country,
  propertyValue: Math.round(150 + sr(i * 13) * 850),
  loanSize: Math.round(100 + sr(i * 19) * 600),
  epcBefore: ['D', 'E', 'F', 'G', 'C'][i % 5],
  epcAfter: ['B', 'A', 'B', 'A', 'B'][i % 5],
  retrofitCost: Math.round(15 + sr(i * 29) * 85),
  annualEnergySaving: Math.round(800 + sr(i * 37) * 3200),
  rateSaving: (0.10 + sr(i * 43) * 0.20).toFixed(2),
}));

const TABS = ['Overview', 'Green Mortgage Products', 'Retrofit Schemes', 'Loan Economics', 'Market Forecast', 'Green Finance Standards'];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.accent }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Pill = ({ label, color }) => (
  <span style={{ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 12, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{label}</span>
);

export default function GreenMortgageRetrofitFinancePage() {
  const [tab, setTab] = useState(0);
  const [loanAmount, setLoanAmount] = useState(300);
  const [epcImprovement, setEpcImprovement] = useState(2);
  const [energySaving, setEnergySaving] = useState(30);

  const calc = useMemo(() => {
    const rateSaving = 0.0015 * epcImprovement;
    const annualInterestSaving = loanAmount * 1000 * rateSaving;
    const annualEnergySaving = energySaving * 0.15 * 100;
    const totalAnnual = annualInterestSaving + annualEnergySaving;
    return {
      rateSaving: (rateSaving * 100).toFixed(2),
      annualInterestSaving: Math.round(annualInterestSaving),
      annualEnergySaving: Math.round(annualEnergySaving),
      totalAnnual: Math.round(totalAnnual),
    };
  }, [loanAmount, epcImprovement, energySaving]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ background: T.accent + '22', color: T.accent, border: `1px solid ${T.accent}44`, borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>EP-EI3</span>
            <span style={{ fontSize: 12, color: T.sub }}>Green Mortgage & Retrofit Finance</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>Green Mortgage & Retrofit Finance Platform</h1>
          <p style={{ color: T.sub, marginTop: 4, fontSize: 14 }}>Green mortgage products, retrofit loan schemes, EPC-linked rate discounts, and residential decarbonisation finance intelligence</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <KpiCard label="Market Size (EU)" value="€500Bn" sub="green mortgages outstanding 2023" color={T.accent} />
          <KpiCard label="Avg Rate Benefit" value="-16bps" sub="green mortgage vs standard" color={T.green} />
          <KpiCard label="Retrofit Market" value="€275Bn/yr" sub="EU Renovation Wave target" color={T.teal} />
          <KpiCard label="EPC D-G Stock" value="~65%" sub="EU residential (stranding risk)" color={T.red} />
          <KpiCard label="IRA §25C Benefit" value="30%" sub="US home efficiency tax credit" color={T.purple} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: tab === i ? T.accent : T.light, color: tab === i ? '#fff' : T.text, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{t}</button>
          ))}
        </div>

        {tab === 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: T.light }}>{['#', 'Product', 'Country', 'EPC Req.', 'Rate Benefit', 'Max LTV', 'Vol 2023 (€Bn)', 'Key Features'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}</tr></thead>
              <tbody>
                {MORTGAGE_PRODUCTS.map((p, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: T.accent }}>{i + 1}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: T.text }}>{p.bank}</td>
                    <td style={{ padding: '8px 12px' }}><Pill label={p.country} color={T.blue} /></td>
                    <td style={{ padding: '8px 12px' }}>{p.epcReq}</td>
                    <td style={{ padding: '8px 12px', color: T.green, fontWeight: 700 }}>{(p.rateBenefit * 100).toFixed(0)}bps</td>
                    <td style={{ padding: '8px 12px' }}>{p.maxLTV}%</td>
                    <td style={{ padding: '8px 12px', color: T.teal, fontWeight: 600 }}>€{p.volume2023}Bn</td>
                    <td style={{ padding: '8px 12px', fontSize: 11 }}>{p.features}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Rate Benefit by Product (bps)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={MORTGAGE_PRODUCTS.map(p => ({ name: p.bank.split(' ').slice(0, 2).join(' '), benefit: Math.abs(p.rateBenefit * 100) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="benefit" fill={T.green} radius={[4, 4, 0, 0]} name="Rate Benefit (bps)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Green Mortgage Volume by Country (€Bn)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { country: 'Netherlands', volume: 14.6 },
                  { country: 'UK', volume: 4.8 },
                  { country: 'France', volume: 3.2 },
                  { country: 'Italy', volume: 2.4 },
                  { country: 'Germany', volume: 1.8 },
                  { country: 'Austria', volume: 0.5 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="volume" fill={T.accent} radius={[4, 4, 0, 0]} name="Volume (€Bn)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {RETROFIT_SCHEMES.map(s => (
              <div key={s.scheme} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 700, color: T.text, fontSize: 13, marginBottom: 6 }}>{s.scheme}</div>
                <Pill label={s.country} color={T.accent} />
                <div style={{ marginTop: 10, fontSize: 12 }}>
                  <div style={{ color: T.sub, marginBottom: 4 }}>Budget: <strong style={{ color: T.teal }}>{s.budget}</strong></div>
                  <div style={{ color: T.sub, marginBottom: 4 }}>Target: {s.target}</div>
                  <div style={{ color: T.sub, marginBottom: 4 }}>Subsidy: <strong style={{ color: T.green }}>{s.subsidy}</strong></div>
                  <div style={{ color: T.sub, fontSize: 11 }}>Tech: {s.tech}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Green Mortgage Benefit Calculator</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 13, color: T.sub }}>Loan Amount: €{loanAmount}k</label>
                  <input type="range" min={50} max={1000} value={loanAmount} onChange={e => setLoanAmount(Number(e.target.value))} style={{ width: '100%', marginTop: 8 }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: T.sub }}>EPC Bands Improved: {epcImprovement}</label>
                  <input type="range" min={1} max={5} value={epcImprovement} onChange={e => setEpcImprovement(Number(e.target.value))} style={{ width: '100%', marginTop: 8 }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: T.sub }}>Energy Saving: {energySaving}%</label>
                  <input type="range" min={10} max={70} value={energySaving} onChange={e => setEnergySaving(Number(e.target.value))} style={{ width: '100%', marginTop: 8 }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                <KpiCard label="Rate Benefit" value={`${calc.rateSaving}%`} sub="annual rate reduction" color={T.green} />
                <KpiCard label="Interest Saving" value={`€${calc.annualInterestSaving}/yr`} sub="on €${loanAmount}k loan" color={T.accent} />
                <KpiCard label="Energy Saving" value={`€${calc.annualEnergySaving}/yr`} sub="operational cost" color={T.teal} />
                <KpiCard label="Total Benefit" value={`€${calc.totalAnnual}/yr`} sub="combined annual saving" color={T.purple} />
              </div>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Green Mortgage Volume Forecast (€Bn)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={MARKET_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="greenMortgageVolume" stroke={T.accent} fill={T.accent + '33'} name="Green Mortgages (€Bn)" />
                  <Area type="monotone" dataKey="retrofitLoanVolume" stroke={T.green} fill={T.green + '33'} name="Retrofit Loans (€Bn)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Loan Volume by Retrofit Type (€Bn)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { type: 'Heat Pumps', volume: 45 }, { type: 'Insulation', volume: 82 },
                  { type: 'Solar PV', volume: 38 }, { type: 'Windows', volume: 28 },
                  { type: 'MVHR', volume: 12 }, { type: 'Deep Retrofit', volume: 95 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="volume" fill={T.teal} radius={[4, 4, 0, 0]} name="Volume (€Bn)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { standard: 'EeMAP / Energy Efficient Mortgages Label', body: 'EEFIG / EeMAP Initiative', req: 'EPC A/B; primary energy ≤75 kWh/m²/yr; or improvement of ≥30%', benefit: 'Reduced capital requirements for banks; label enables securitisation' },
              { standard: 'EU Green Bond Standard (EUGBS)', body: 'European Commission', req: 'Use of proceeds: buildings in top 15% national EE or NZEB; EU Taxonomy CCM 7.7', benefit: 'Lower issuance cost for EUGBS-labelled covered bonds' },
              { standard: 'CBI Low Carbon Buildings Criteria', body: 'Climate Bonds Initiative', req: 'CRREM-aligned; top 15% energy intensity by building type + country', benefit: 'Green bond labelling; investor confidence' },
              { standard: 'EBA Green Mortgage Reporting', body: 'European Banking Authority', req: 'Disclose Scope 3 Cat 15 financed emissions; EPC coverage %; CRREM alignment of portfolio', benefit: 'Regulatory capital treatment improvements proposed (Green Supporting Factor)' },
            ].map(s => (
              <div key={s.standard} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 700, color: T.text, fontSize: 13, marginBottom: 6 }}>{s.standard}</div>
                <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}><strong>Body:</strong> {s.body}</div>
                <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}><strong>Requirement:</strong> {s.req}</div>
                <div style={{ fontSize: 12, color: T.green }}><strong>Benefit:</strong> {s.benefit}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
