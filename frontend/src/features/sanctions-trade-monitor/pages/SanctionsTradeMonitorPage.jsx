import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend, ReferenceLine
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const REGIMES = [
  { name:'OFAC (USA)', entity_count:2480, country_programs:28, color:T.blue, updated:'2026-03-28' },
  { name:'EU Sanctions', entity_count:1850, country_programs:22, color:T.purple, updated:'2026-03-25' },
  { name:'UK OFSI', entity_count:1620, country_programs:20, color:T.teal, updated:'2026-03-30' },
  { name:'UN Security Council', entity_count:780, country_programs:14, color:T.amber, updated:'2026-03-15' },
];

const COUNTRY_CLASS = [
  { country:'Russia', ofac:'Comprehensive', eu:'Comprehensive', uk:'Comprehensive', un:'Targeted', exposure:12.5 },
  { country:'Iran', ofac:'Comprehensive', eu:'Comprehensive', uk:'Comprehensive', un:'Comprehensive', exposure:0.2 },
  { country:'North Korea', ofac:'Comprehensive', eu:'Comprehensive', uk:'Comprehensive', un:'Comprehensive', exposure:0 },
  { country:'Syria', ofac:'Comprehensive', eu:'Comprehensive', uk:'Comprehensive', un:'Targeted', exposure:0 },
  { country:'Cuba', ofac:'Comprehensive', eu:'None', uk:'None', un:'None', exposure:0.1 },
  { country:'Venezuela', ofac:'Sectoral', eu:'Targeted', uk:'Targeted', un:'None', exposure:0.8 },
  { country:'Myanmar', ofac:'Targeted', eu:'Comprehensive', uk:'Comprehensive', un:'None', exposure:0.3 },
  { country:'Belarus', ofac:'Sectoral', eu:'Comprehensive', uk:'Comprehensive', un:'None', exposure:0.5 },
  { country:'China', ofac:'Sectoral', eu:'Sectoral', uk:'Sectoral', un:'None', exposure:18.2 },
  { country:'Turkey', ofac:'None', eu:'None', uk:'None', un:'None', exposure:4.5 },
  { country:'UAE', ofac:'None', eu:'None', uk:'None', un:'None', exposure:6.8 },
  { country:'Saudi Arabia', ofac:'None', eu:'None', uk:'None', un:'None', exposure:8.2 },
  { country:'India', ofac:'None', eu:'None', uk:'None', un:'None', exposure:5.1 },
  { country:'Brazil', ofac:'None', eu:'None', uk:'None', un:'None', exposure:3.8 },
  { country:'South Africa', ofac:'None', eu:'None', uk:'None', un:'None', exposure:2.2 },
];

const CLASS_COLORS = { Comprehensive: T.red, Sectoral: T.amber, Targeted: T.orange, None: T.green };

const TRADE_POLICIES = [
  { policy:'EU CBAM', type:'Carbon Border', status:'Phase 2 (2026)', impact:'High', sectors:'Steel, Cement, Aluminium, Fertilizer, Electricity, Hydrogen', effective:'2026-01-01' },
  { policy:'US Section 301 Tariffs', type:'Tariff', status:'Extended', impact:'High', sectors:'Chinese imports (EV, Solar, Steel, Semiconductors)', effective:'2024-09-27' },
  { policy:'US IRA Domestic Content', type:'Subsidy/Content', status:'Active', impact:'Medium', sectors:'Clean energy manufacturing, EV batteries', effective:'2023-01-01' },
  { policy:'EU Critical Raw Materials Act', type:'Supply Chain', status:'Enacted', impact:'Medium', sectors:'Lithium, Cobalt, Rare earths, Nickel', effective:'2024-05-23' },
  { policy:'China Export Controls (REE)', type:'Export Control', status:'Active', impact:'High', sectors:'Rare earth elements, Gallium, Germanium', effective:'2023-08-01' },
  { policy:'US CHIPS Act Export Controls', type:'Export Control', status:'Active', impact:'High', sectors:'Advanced semiconductors, AI chips', effective:'2022-10-07' },
  { policy:'UK CBAM', type:'Carbon Border', status:'Consultation', impact:'Medium', sectors:'Following EU scope', effective:'2027-01-01' },
  { policy:'India PLI Scheme', type:'Subsidy/Content', status:'Active', impact:'Low', sectors:'Solar PV, Batteries, Electronics', effective:'2021-03-01' },
];

const ALERTS = [
  { date:'2026-03-28', type:'Designation', regime:'OFAC', detail:'12 new SDN entries related to Russian defense sector entities', severity:'HIGH' },
  { date:'2026-03-25', type:'Trade Policy', regime:'EU', detail:'CBAM Phase 2 reporting requirements effective; certificates required for covered imports', severity:'HIGH' },
  { date:'2026-03-20', type:'Designation', regime:'EU', detail:'8 additional Belarus entities added to asset freeze list', severity:'MEDIUM' },
  { date:'2026-03-18', type:'Export Control', regime:'USA', detail:'Updated Entity List: 15 Chinese semiconductor firms added', severity:'HIGH' },
  { date:'2026-03-15', type:'Designation', regime:'UN', detail:'DPRK sanctions committee refreshed 4 vessel listings', severity:'LOW' },
  { date:'2026-03-10', type:'Trade Policy', regime:'USA', detail:'Section 301 tariff rate increase to 100% on Chinese EVs confirmed', severity:'MEDIUM' },
];

const PORTFOLIO_EXPOSURE = [
  { holding:'PetroChina', country:'China', sanctions_regime:'Sectoral', exposure_pct:3.2, risk:'HIGH' },
  { holding:'Gazprom ADR', country:'Russia', sanctions_regime:'Comprehensive', exposure_pct:0.1, risk:'CRITICAL' },
  { holding:'PDVSA Bond', country:'Venezuela', sanctions_regime:'Sectoral', exposure_pct:0.4, risk:'HIGH' },
  { holding:'PTT PCL', country:'Thailand', sanctions_regime:'None', exposure_pct:2.1, risk:'LOW' },
  { holding:'Reliance Industries', country:'India', sanctions_regime:'None', exposure_pct:1.8, risk:'LOW' },
  { holding:'Saudi Aramco', country:'Saudi Arabia', sanctions_regime:'None', exposure_pct:4.5, risk:'LOW' },
  { holding:'Lukoil GDR', country:'Russia', sanctions_regime:'Comprehensive', exposure_pct:0.05, risk:'CRITICAL' },
  { holding:'Sberbank', country:'Russia', sanctions_regime:'Comprehensive', exposure_pct:0, risk:'DIVESTED' },
];

const RISK_COLORS = { CRITICAL: T.red, HIGH: T.orange, MEDIUM: T.amber, LOW: T.green, DIVESTED: T.textMut };
const TABS = ['Sanctions Dashboard','OFAC SDN','EU Sanctions','UK OFSI','Trade Policy Tracker','Portfolio Exposure'];

export default function SanctionsTradeMonitorPage() {
  const [tab, setTab] = useState(0);
  const [alertFilter, setAlertFilter] = useState('All');

  const filteredAlerts = alertFilter === 'All' ? ALERTS : ALERTS.filter(a => a.severity === alertFilter);

  const card = (label, value, sub, color = T.navy) => (
    <div style={{ background: T.surface, borderRadius: 10, padding: '14px 18px', border: `1px solid ${T.border}`, flex: '1 1 155px' }}>
      <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ background: '#7c2d12', color: '#fff', fontFamily: T.mono, fontSize: 11, padding: '3px 10px', borderRadius: 6 }}>EP-CV2</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0 }}>Sanctions & Trade Policy Monitor</h1>
      </div>
      <p style={{ color: T.textSec, fontSize: 13, marginBottom: 16 }}>
        Multi-regime sanctions tracking (OFAC, EU, UK OFSI, UN) with trade policy impact analysis and portfolio exposure mapping.
        <span style={{ fontFamily: T.mono, marginLeft: 8, fontSize: 11, color: T.textMut }}>Source: OFAC SDN | EU Official Journal | UK OFSI | UN SC Committees</span>
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {card('Total Designations', REGIMES.reduce((s, r) => s + r.entity_count, 0).toLocaleString(), 'Across 4 regimes')}
        {card('Sanctioned Countries', '9', 'With comprehensive or sectoral sanctions', T.red)}
        {card('Portfolio Exposure', `${PORTFOLIO_EXPOSURE.filter(p => p.risk === 'CRITICAL' || p.risk === 'HIGH').length}`, 'Holdings in sanctioned jurisdictions', T.amber)}
        {card('Recent Alerts', ALERTS.length, 'Last 30 days', T.orange)}
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 18 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '10px 14px', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 13, fontWeight: tab === i ? 700 : 500,
            color: tab === i ? T.navy : T.textSec, background: tab === i ? T.surface : 'transparent',
            borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent', marginBottom: -2, borderRadius: '6px 6px 0 0'
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Sanctions Regime Overview</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
            {REGIMES.map(r => (
              <div key={r.name} style={{ padding: 16, borderRadius: 10, border: `1px solid ${T.border}`, borderLeft: `4px solid ${r.color}` }}>
                <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>{r.name}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: r.color }}>{r.entity_count.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: T.textSec }}>{r.country_programs} country programs</div>
                <div style={{ fontSize: 10, fontFamily: T.mono, color: T.textMut, marginTop: 4 }}>Updated: {r.updated}</div>
              </div>
            ))}
          </div>
          <h4 style={{ color: T.navy, fontSize: 13, marginBottom: 8 }}>Entity Count by Regime</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={REGIMES}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="entity_count" radius={[4,4,0,0]}>
                {REGIMES.map(r => <Cell key={r.name} fill={r.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {(tab === 1 || tab === 2 || tab === 3) && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>
            {tab === 1 ? 'OFAC SDN' : tab === 2 ? 'EU Sanctions' : 'UK OFSI'} — Country Classification
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: T.bg }}>
              {['Country', tab === 1 ? 'OFAC' : tab === 2 ? 'EU' : 'UK OFSI','Portfolio Exp %','Risk Level'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {COUNTRY_CLASS.map(c => {
                const cls = tab === 1 ? c.ofac : tab === 2 ? c.eu : c.uk;
                return (
                  <tr key={c.country} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 10px', fontWeight: 600 }}>{c.country}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: cls === 'Comprehensive' ? '#fef2f2' : cls === 'Sectoral' ? '#fffbeb' : cls === 'Targeted' ? '#fff7ed' : '#f0fdf4', color: CLASS_COLORS[cls] }}>{cls}</span>
                    </td>
                    <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{c.exposure}%</td>
                    <td style={{ padding: '6px 10px' }}>
                      {cls === 'Comprehensive' && c.exposure > 0 ? <span style={{ color: T.red, fontWeight: 700 }}>CRITICAL</span> :
                       cls !== 'None' && c.exposure > 0 ? <span style={{ color: T.amber, fontWeight: 600 }}>ELEVATED</span> :
                       <span style={{ color: T.green }}>CLEAR</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Trade Policy Tracker</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: T.bg }}>
              {['Policy','Type','Status','Impact','Sectors','Effective'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {TRADE_POLICIES.map(p => (
                <tr key={p.policy} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 10px', fontWeight: 600 }}>{p.policy}</td>
                  <td style={{ padding: '6px 10px' }}><span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, background: T.bg }}>{p.type}</span></td>
                  <td style={{ padding: '6px 10px', fontFamily: T.mono, fontSize: 11 }}>{p.status}</td>
                  <td style={{ padding: '6px 10px' }}><span style={{ color: p.impact === 'High' ? T.red : p.impact === 'Medium' ? T.amber : T.green, fontWeight: 600 }}>{p.impact}</span></td>
                  <td style={{ padding: '6px 10px', fontSize: 11, maxWidth: 200 }}>{p.sectors}</td>
                  <td style={{ padding: '6px 10px', fontFamily: T.mono, fontSize: 11 }}>{p.effective}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Portfolio Sanctions Exposure</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
            <thead><tr style={{ background: T.bg }}>
              {['Holding','Country','Sanctions Regime','Exposure %','Risk'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {PORTFOLIO_EXPOSURE.map(p => (
                <tr key={p.holding} style={{ borderBottom: `1px solid ${T.border}`, background: p.risk === 'CRITICAL' ? '#fef2f2' : 'transparent' }}>
                  <td style={{ padding: '6px 10px', fontWeight: 600 }}>{p.holding}</td>
                  <td style={{ padding: '6px 10px' }}>{p.country}</td>
                  <td style={{ padding: '6px 10px' }}><span style={{ color: CLASS_COLORS[p.sanctions_regime] || T.textSec, fontWeight: 600 }}>{p.sanctions_regime}</span></td>
                  <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{p.exposure_pct}%</td>
                  <td style={{ padding: '6px 10px' }}><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, color: RISK_COLORS[p.risk] }}>{p.risk}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <h4 style={{ color: T.navy, fontSize: 13, marginBottom: 8 }}>Recent Alerts</h4>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {['All','HIGH','MEDIUM','LOW'].map(f => (
              <button key={f} onClick={() => setAlertFilter(f)} style={{
                padding: '4px 12px', borderRadius: 6, border: `1px solid ${alertFilter === f ? T.navy : T.border}`,
                background: alertFilter === f ? T.navy : T.surface, color: alertFilter === f ? '#fff' : T.textSec, cursor: 'pointer', fontSize: 11
              }}>{f}</button>
            ))}
          </div>
          {filteredAlerts.map((a, i) => (
            <div key={i} style={{ padding: 10, borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, color: a.severity === 'HIGH' ? T.red : a.severity === 'MEDIUM' ? T.amber : T.green, background: a.severity === 'HIGH' ? '#fef2f2' : a.severity === 'MEDIUM' ? '#fffbeb' : '#f0fdf4', whiteSpace: 'nowrap' }}>{a.severity}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{a.detail}</div>
                <div style={{ fontSize: 11, color: T.textMut }}>{a.date} | {a.regime} | {a.type}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20, padding: 14, background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 11, color: T.textMut }}>
        <strong>Data Sources:</strong> OFAC SDN/SSI Lists | EU Official Journal | UK OFSI Consolidated List | UN SC Committees | WTO Trade Monitoring.
        <span style={{ float: 'right', fontFamily: T.mono }}>EP-CV2 v1.0 | Sanctions Monitor</span>
      </div>
    </div>
  );
}
