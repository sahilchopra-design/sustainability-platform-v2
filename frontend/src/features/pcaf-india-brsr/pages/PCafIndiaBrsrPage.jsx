import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { COMPANY_MASTER, searchCompanies } from '../../../data/companyMaster';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';

const API = 'http://localhost:8000';

// ── Theme ──────────────────────────────────────────────────────────────────
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const DQS_COLORS = { 1:'#16a34a', 2:'#65a30d', 3:'#d97706', 4:'#ea580c', 5:'#dc2626' };
const DQS_LABELS = { 1:'Verified GHG data', 2:'Audited data', 3:'Reported data', 4:'Sector-level proxy', 5:'Least granular' };
const SECTOR_OPTIONS = [
  'Energy','Materials','Industrials','Consumer Discretionary','Consumer Staples',
  'Health Care','Financials','Information Technology','Communication Services',
  'Utilities','Real Estate','Agriculture','Mining','Cement','Steel',
];
const CHART_COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#2563eb','#9333ea','#ea580c','#0d9488'];

// ── Company suggestions ────────────────────────────────────────────────────
const COMPANY_SUGGESTIONS = [
  // IT
  { name:'Tata Consultancy Services', cin:'L22210MH1995PLC084781', sector:'Information Technology' },
  { name:'Infosys Ltd', cin:'L85110KA1981PLC013115', sector:'Information Technology' },
  { name:'Wipro Ltd', cin:'L32102KA1945PLC020800', sector:'Information Technology' },
  { name:'HCL Technologies', cin:'L74140DL1976PLC072673', sector:'Information Technology' },
  { name:'Tech Mahindra', cin:'L64200MH1986PLC041370', sector:'Information Technology' },
  // Energy
  { name:'Reliance Industries', cin:'L17110MH1973PLC019786', sector:'Energy' },
  { name:'ONGC Ltd', cin:'L74899DL1993GOI054155', sector:'Energy' },
  { name:'Indian Oil Corporation', cin:'L23201MH1959GOI011388', sector:'Energy' },
  { name:'Bharat Petroleum', cin:'L23220MH1952GOI008931', sector:'Energy' },
  { name:'Hindustan Petroleum', cin:'L23201MH1952GOI008510', sector:'Energy' },
  { name:'GAIL India', cin:'L40200DL1984GOI018085', sector:'Energy' },
  { name:'Oil India Ltd', cin:'L11101AS1959GOI001148', sector:'Energy' },
  // Materials / Steel / Mining
  { name:'Tata Steel Ltd', cin:'L27102OR1907PLC000002', sector:'Materials' },
  { name:'JSW Steel', cin:'L27102MH1994PLC152925', sector:'Materials' },
  { name:'Steel Authority of India', cin:'L27109DL1973GOI006454', sector:'Materials' },
  { name:'Hindalco Industries', cin:'L27020MH1958PLC011238', sector:'Materials' },
  { name:'Vedanta Ltd', cin:'L13209MH1965PLC291394', sector:'Materials' },
  { name:'UltraTech Cement', cin:'L26940MH2000PLC128420', sector:'Materials' },
  { name:'Ambuja Cements', cin:'L26942GJ1981PLC004717', sector:'Materials' },
  { name:'Asian Paints', cin:'L24201MH1945PLC004598', sector:'Materials' },
  { name:'Coal India Ltd', cin:'L10101WB1973GOI028844', sector:'Mining' },
  // Financials
  { name:'State Bank of India', cin:'L64190WB1955GOI022605', sector:'Financials' },
  { name:'HDFC Bank', cin:'L65920MH1994PLC080618', sector:'Financials' },
  { name:'ICICI Bank', cin:'L65190GJ1994PLC021012', sector:'Financials' },
  { name:'Axis Bank', cin:'L65110GJ1993PLC020769', sector:'Financials' },
  { name:'Punjab National Bank', cin:'L65191DL1894GOI000002', sector:'Financials' },
  { name:'Bank of Baroda', cin:'L99999GJ1908GOI000145', sector:'Financials' },
  { name:'Bajaj Finance', cin:'L65910MH1987PLC042961', sector:'Financials' },
  { name:'LIC Housing Finance', cin:'L65922MH1989PLC052257', sector:'Financials' },
  { name:'Power Finance Corporation', cin:'L65910DL1986GOI024862', sector:'Financials' },
  { name:'REC Limited', cin:'L40101DL1969GOI005095', sector:'Financials' },
  { name:'IRFC Ltd', cin:'L45203DL1986GOI023574', sector:'Financials' },
  { name:'NABARD', cin:'L65000MH1981GOI023845', sector:'Financials' },
  // Utilities
  { name:'NTPC Ltd', cin:'L40101DL1975GOI007966', sector:'Utilities' },
  { name:'Power Grid Corp', cin:'L40101DL1989GOI038121', sector:'Utilities' },
  { name:'Adani Green Energy', cin:'L40100GJ2015PLC082803', sector:'Utilities' },
  { name:'Adani Power', cin:'L40100GJ1996PLC030533', sector:'Utilities' },
  { name:'Tata Power', cin:'L28920MH1919PLC000567', sector:'Utilities' },
  { name:'JSW Energy', cin:'L40100MH1994PLC077041', sector:'Utilities' },
  // Industrials
  { name:'Larsen & Toubro', cin:'L99999MH1946PLC004768', sector:'Industrials' },
  { name:'Bharat Electronics', cin:'L32309KA1954GOI000787', sector:'Industrials' },
  { name:'Siemens India', cin:'L28992MH1957PLC010839', sector:'Industrials' },
  { name:'ABB India', cin:'L32202KA1949FLC032923', sector:'Industrials' },
  // Consumer
  { name:'Mahindra & Mahindra', cin:'L65990MH1945PLC004558', sector:'Consumer Discretionary' },
  { name:'Maruti Suzuki', cin:'L34103DL1981PLC011375', sector:'Consumer Discretionary' },
  { name:'Tata Motors', cin:'L28920MH1945PLC004520', sector:'Consumer Discretionary' },
  { name:'Hero MotoCorp', cin:'L35911DL1984PLC017354', sector:'Consumer Discretionary' },
  { name:'Bajaj Auto', cin:'L65993PN2007PLC130076', sector:'Consumer Discretionary' },
  { name:'Hindustan Unilever', cin:'L15140MH1933PLC002030', sector:'Consumer Staples' },
  { name:'ITC Ltd', cin:'L16005WB1910PLC001985', sector:'Consumer Staples' },
  { name:'Nestle India', cin:'L15202DL1959PLC003786', sector:'Consumer Staples' },
  { name:'Britannia Industries', cin:'L15412WB1918PLC002964', sector:'Consumer Staples' },
  { name:'Dabur India', cin:'L74999DL1975PLC007123', sector:'Consumer Staples' },
  // Health Care
  { name:'Sun Pharma', cin:'L24230GJ1993PLC019050', sector:'Health Care' },
  { name:'Dr Reddys Labs', cin:'L85195TG1984PLC004507', sector:'Health Care' },
  { name:'Cipla Ltd', cin:'L24239MH1935PLC002380', sector:'Health Care' },
  { name:'Divi\'s Laboratories', cin:'L24110TG1990PLC011522', sector:'Health Care' },
  // Real Estate
  { name:'DLF Ltd', cin:'L70101HR1963PLC032723', sector:'Real Estate' },
  { name:'Godrej Properties', cin:'L45200MH1990PLC056781', sector:'Real Estate' },
];

// ── Mini components ────────────────────────────────────────────────────────
const Btn = ({ children, onClick, disabled, color='navy', sm }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? '#9ca3af' : (color==='navy' ? T.navy : color==='gold' ? T.gold : color==='green' ? T.green : color==='red' ? T.red : T.sage),
    color: '#fff', border: 'none', borderRadius: 6,
    padding: sm ? '6px 14px' : '10px 22px',
    fontSize: sm ? 12 : 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: T.font, transition: 'opacity .15s',
  }}>{children}</button>
);

const Card = ({ children, style }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
    padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)', ...style }}>
    {children}
  </div>
);

const KpiCard = ({ label, value, sub, color, wide }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
    padding: '16px 20px', minWidth: wide ? 200 : 140, flex: 1 }}>
    <div style={{ fontSize: 11, color: T.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, margin: '6px 0 2px' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub }}>{sub}</div>}
  </div>
);

const Inp = ({ label, value, onChange, type='text', placeholder, small }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
    {label && <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>{label}</label>}
    <input value={value} onChange={e=>onChange(e.target.value)} type={type} placeholder={placeholder}
      style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: small ? '5px 10px' : '8px 12px',
        fontSize: small ? 12 : 13, fontFamily: T.font, background: '#fafafa', color: T.text, outline:'none' }} />
  </div>
);

const Sel = ({ label, value, onChange, options }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
    {label && <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>{label}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 12px',
        fontSize: 13, fontFamily: T.font, background: '#fafafa', color: T.text }}>
      {options.map(o => <option key={typeof o==='string'?o:o.value} value={typeof o==='string'?o:o.value}>{typeof o==='string'?o:o.label}</option>)}
    </select>
  </div>
);

const DqsBadge = ({ score }) => (
  <span style={{ background: DQS_COLORS[score]||T.sub, color:'#fff', borderRadius: 20,
    padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>DQS {score}</span>
);

const Alert = ({ children, type='info' }) => {
  const colors = { info:{bg:'#eff6ff',border:'#93c5fd',text:'#1e40af'}, warn:{bg:'#fffbeb',border:'#fcd34d',text:'#92400e'}, ok:{bg:'#f0fdf4',border:'#86efac',text:'#166534'} };
  const c = colors[type]||colors.info;
  return <div style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:8, padding:'12px 16px', fontSize:13, color:c.text }}>{children}</div>;
};

// ── Company name autocomplete — uses companyMaster for rich pre-fill ────────
const CompanyAutocomplete = ({ value, onChange, onSelect, placeholder, width }) => {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState(value || '');
  const containerRef      = useRef(null);
  const skipSyncRef       = useRef(false); // prevents useEffect overwriting after selection

  // Derive suggestions from master database
  const suggestions = query.length >= 1
    ? searchCompanies(query, 8)
    : COMPANY_MASTER.slice(0, 6); // show top-6 on focus before typing

  // Sync value prop → local query only when not mid-selection
  useEffect(() => {
    if (!skipSyncRef.current) setQuery(value || '');
    skipSyncRef.current = false;
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = val => {
    setQuery(val);
    onChange(val);
    setOpen(true);
  };

  const handleSelect = master => {
    skipSyncRef.current = true;    // block the useEffect sync for this cycle
    setQuery(master.name);
    setOpen(false);
    // Pass full master record to parent for rich pre-fill
    onSelect(master);
  };

  return (
    <div ref={containerRef} style={{ position:'relative', width: width || '100%' }}>
      <input
        value={query}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder || 'Search company…'}
        style={{ border:`1px solid ${T.border}`, borderRadius:4, padding:'5px 9px', fontSize:12,
          width:'100%', fontFamily:T.font, background:'#fafafa', color:T.text,
          boxSizing:'border-box', outline:'none' }}
      />
      {open && suggestions.length > 0 && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff',
          border:`1px solid ${T.border}`, borderRadius:6, boxShadow:'0 6px 20px rgba(0,0,0,.14)',
          zIndex:200, maxHeight:280, overflowY:'auto' }}>
          {query.length < 1 && (
            <div style={{ padding:'6px 12px', fontSize:10, color:T.sub, fontWeight:600,
              background:'#f8f7f3', borderBottom:`1px solid ${T.border}` }}>
              RECENTLY USED · TYPE TO SEARCH 30+ COMPANIES
            </div>
          )}
          {suggestions.map(s => {
            const riskColor = s.transition_risk === 'Very High' ? T.red
              : s.transition_risk === 'High' ? '#ea580c'
              : s.transition_risk === 'Medium' ? T.amber : T.sage;
            return (
              <div key={s.cin} onMouseDown={() => handleSelect(s)}
                style={{ padding:'9px 12px', cursor:'pointer', borderBottom:`1px solid ${T.border}`,
                  display:'flex', alignItems:'center', gap:10 }}
                onMouseEnter={e => e.currentTarget.style.background='#f1f0eb'}
                onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                {/* Sector dot */}
                <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0,
                  background: s.transition_risk === 'Very High' ? T.red
                    : s.transition_risk === 'High' ? '#ea580c'
                    : s.transition_risk === 'Medium' ? T.amber : T.sage }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, color:T.navy, fontSize:12 }}>{s.name}</div>
                  <div style={{ color:T.sub, fontSize:10, marginTop:1, display:'flex', gap:8 }}>
                    <span>{s.ticker}</span>
                    <span>·</span>
                    <span>{s.sector}</span>
                    <span>·</span>
                    <span>EVIC ₹{(s.evic_inr_cr/1000).toFixed(0)}K Cr</span>
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:10, color: riskColor, fontWeight:600 }}>T-Risk: {s.transition_risk}</div>
                  <div style={{ fontSize:10, color:T.sub }}>DQS {s.dqs_default}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Default portfolio holdings ─────────────────────────────────────────────
const DEFAULT_HOLDINGS = [
  { id:1, cin:'L15122TN1902GOI000001', company_name:'Tata Consultancy Services', sector_gics:'Information Technology', revenue_inr_cr:22400, evic_inr_cr:158000, exposure_inr_cr:850, scope1_co2e:120000, scope2_co2e:85000, scope3_co2e:0, dqs_override:'', instrument_type:'Listed Equity' },
  { id:2, cin:'L27109MH1907PLC000002', company_name:'Tata Steel Ltd', sector_gics:'Materials', revenue_inr_cr:22000, evic_inr_cr:78000, exposure_inr_cr:1200, scope1_co2e:29000000, scope2_co2e:1800000, scope3_co2e:0, dqs_override:'', instrument_type:'Corporate Bond' },
  { id:3, cin:'L40300MH1995PLC000003', company_name:'Reliance Industries', sector_gics:'Energy', revenue_inr_cr:88000, evic_inr_cr:980000, exposure_inr_cr:3200, scope1_co2e:25600000, scope2_co2e:890000, scope3_co2e:180000000, dqs_override:'2', instrument_type:'Listed Equity' },
  { id:4, cin:'L65190MH1994PLC000004', company_name:'HDFC Bank', sector_gics:'Financials', revenue_inr_cr:28000, evic_inr_cr:480000, exposure_inr_cr:2100, scope1_co2e:18000, scope2_co2e:82000, scope3_co2e:0, dqs_override:'', instrument_type:'Listed Equity' },
  { id:5, cin:'L40100GJ1995PLC000005', company_name:'Adani Green Energy', sector_gics:'Utilities', revenue_inr_cr:8500, evic_inr_cr:95000, exposure_inr_cr:680, scope1_co2e:18000, scope2_co2e:52000, scope3_co2e:0, dqs_override:'', instrument_type:'Corporate Bond' },
  { id:6, cin:'', company_name:'IREDA Green Bond 2025', sector_gics:'Financials', revenue_inr_cr:null, evic_inr_cr:null, exposure_inr_cr:500, scope1_co2e:null, scope2_co2e:null, scope3_co2e:null, dqs_override:'', instrument_type:'Use of Proceeds', total_deal_size_inr_cr:5000, use_of_proceeds_category:'renewable_energy', project_scope1_tco2e:12000, project_scope2_tco2e:3000 },
  { id:7, cin:'', company_name:'SBI RMBS Pool 2025-A', sector_gics:'Financials', revenue_inr_cr:null, evic_inr_cr:null, exposure_inr_cr:800, scope1_co2e:null, scope2_co2e:null, scope3_co2e:null, dqs_override:'', instrument_type:'Securitisation', total_pool_inr_cr:12000, securitisation_type:'rmbs', underlying_asset_count:5000, weighted_avg_carbon_intensity:2.4 },
  { id:8, cin:'', company_name:'Maharashtra State Bond 2030', sector_gics:'Utilities', revenue_inr_cr:null, evic_inr_cr:null, exposure_inr_cr:300, scope1_co2e:null, scope2_co2e:null, scope3_co2e:null, dqs_override:'', instrument_type:'Sub-sovereign Debt', jurisdiction_name:'Maharashtra', jurisdiction_budget_inr_cr:450000, jurisdiction_ghg_tco2e:180000000, country_iso:'IN' },
];

// ── LOB config map ─────────────────────────────────────────────────────────
const LOB_FIELDS = {
  'Motor': {
    color: '#1b3a5c', lobValues: ['motor_personal', 'motor_commercial'],
    reference: 'PCAF Part B § 5.2.1 · Premium-weighted vehicle emissions',
    fields: [
      { key: 'line_of_business', label: 'Sub-LOB', type: 'select', options: ['motor_personal', 'motor_commercial'] },
      { key: 'vehicle_count', label: 'Vehicle Count', type: 'number' },
      { key: 'fuel_type', label: 'Fuel Type', type: 'select', options: ['petrol','diesel','cng','hybrid','bev','lpg'] },
      { key: 'annual_km_per_vehicle', label: 'Annual km/veh', type: 'number', help: 'Default 12,000' },
      { key: 'avg_engine_cc', label: 'Engine CC', type: 'number' },
    ],
  },
  'Property': {
    color: '#d97706', lobValues: ['property_residential', 'property_commercial'],
    reference: 'PCAF Part B § 5.2.2 · Building area × EPC emission factor',
    fields: [
      { key: 'line_of_business', label: 'Sub-LOB', type: 'select', options: ['property_residential', 'property_commercial'] },
      { key: 'insured_property_area_m2', label: 'Area (m²)', type: 'number' },
      { key: 'epc_rating', label: 'EPC', type: 'select', options: ['A+','A','B','C','D','E','F','G'] },
      { key: 'building_type', label: 'Building', type: 'select', options: ['residential','commercial','industrial'] },
      { key: 'building_year', label: 'Year Built', type: 'number' },
    ],
  },
  'Commercial': {
    color: '#0d9488', lobValues: ['commercial_marine', 'commercial_energy', 'commercial_liability', 'commercial_other'],
    reference: 'PCAF Part B § 5.2.3 · Revenue-based sector emission factor',
    fields: [
      { key: 'line_of_business', label: 'Sub-LOB', type: 'select', options: ['commercial_marine','commercial_energy','commercial_liability','commercial_other'] },
      { key: 'insured_revenue_inr_cr', label: 'Insured Rev (₹Cr)', type: 'number' },
      { key: 'nace_sector', label: 'NACE Sector', type: 'text', help: 'e.g. C24.10, B06' },
    ],
  },
  'Life': {
    color: '#4f46e5', lobValues: ['life'],
    reference: 'PCAF Part B § 5.2.4 · Premium-only disclosure',
    fields: [],
  },
  'Health': {
    color: '#5a8a6a', lobValues: ['health'],
    reference: 'PCAF Part B § 5.2.5 · Healthcare sector EF',
    fields: [],
  },
  'Reinsurance': {
    // NEW in Part C 2nd Edition Dec 2025
    color: '#be185d', // rose
    lobValues: ['treaty_reinsurance'],
    reference: 'PCAF Part C 2nd Ed § 7.1 · Treaty reinsurance attribution',
    fields: [
      { key: 'line_of_business', label: 'Type', type: 'select', options: ['treaty_reinsurance'] },
      { key: 'ceded_premium_inr_cr', label: 'Ceded Premium (₹Cr)', type: 'number' },
      { key: 'cedent_name', label: 'Cedent Insurer', type: 'text', help: 'Primary insurer ceding risk' },
      { key: 'cedent_total_gwp_inr_cr', label: 'Cedent Total GWP (₹Cr)', type: 'number' },
      { key: 'cedent_reported_tco2e', label: 'Cedent Reported tCO₂e', type: 'number', help: 'From cedent ESG filing' },
    ],
  },
  'Project Insurance': {
    // NEW in Part C 2nd Edition Dec 2025
    color: '#7c3aed', // violet
    lobValues: ['project_insurance'],
    reference: 'PCAF Part C 2nd Ed § 7.2 · All-risk construction/erection',
    fields: [
      { key: 'line_of_business', label: 'Type', type: 'select', options: ['project_insurance'] },
      { key: 'sum_insured_inr_cr', label: 'Sum Insured (₹Cr)', type: 'number' },
      { key: 'total_project_cost_inr_cr', label: 'Project Cost (₹Cr)', type: 'number' },
      { key: 'project_sector', label: 'Project Sector', type: 'select', options: ['energy','infrastructure','mining','manufacturing','real_estate','transport'] },
      { key: 'project_scope1_tco2e', label: 'Project Scope 1', type: 'number' },
    ],
  },
};
const LOB_CATEGORIES = Object.keys(LOB_FIELDS);
const getLobCategory = (lob) => { for (const [cat, cfg] of Object.entries(LOB_FIELDS)) { if (cfg.lobValues.includes(lob)) return cat; } return 'Life'; };

// ── Default insurance policies ─────────────────────────────────────────────
const POLICY_TEMPLATE = {
  policy_id:'', policyholder_name:'', line_of_business:'life',
  gross_written_premium_inr_cr:0,
  // Motor fields
  vehicle_count:null, fuel_type:'petrol', annual_km_per_vehicle:null, avg_engine_cc:null,
  // Property fields
  insured_property_area_m2:null, epc_rating:'', building_type:'', building_year:null,
  // Commercial fields
  insured_revenue_inr_cr:null, nace_sector:'',
};
const DEFAULT_INSURANCE_POLICIES = [
  { ...POLICY_TEMPLATE, id:1, policy_id:'POL-001', policyholder_name:'Bajaj Allianz Motor Personal', line_of_business:'motor_personal', gross_written_premium_inr_cr:800, vehicle_count:120000, fuel_type:'petrol', annual_km_per_vehicle:12000, avg_engine_cc:1200 },
  { ...POLICY_TEMPLATE, id:2, policy_id:'POL-002', policyholder_name:'ICICI Lombard Fleet', line_of_business:'motor_commercial', gross_written_premium_inr_cr:1200, vehicle_count:50000, fuel_type:'diesel', annual_km_per_vehicle:35000, avg_engine_cc:3500 },
  { ...POLICY_TEMPLATE, id:3, policy_id:'POL-003', policyholder_name:'New India Assurance Property', line_of_business:'property_commercial', gross_written_premium_inr_cr:800, insured_property_area_m2:500000, epc_rating:'C', building_type:'commercial', building_year:2005 },
  { ...POLICY_TEMPLATE, id:4, policy_id:'POL-004', policyholder_name:'Oriental Marine Cargo', line_of_business:'commercial_marine', gross_written_premium_inr_cr:450, insured_revenue_inr_cr:12000, nace_sector:'H50.20' },
  { ...POLICY_TEMPLATE, id:5, policy_id:'POL-005', policyholder_name:'LIC of India', line_of_business:'life', gross_written_premium_inr_cr:50000 },
  { ...POLICY_TEMPLATE, id:6, policy_id:'POL-006', policyholder_name:'Star Health Insurance', line_of_business:'health', gross_written_premium_inr_cr:6200 },
  { ...POLICY_TEMPLATE, id:7, policy_id:'POL-007', policyholder_name:'GIC Re Treaty Pool', line_of_business:'treaty_reinsurance', gross_written_premium_inr_cr:3500, ceded_premium_inr_cr:3500, cedent_name:'New India Assurance', cedent_total_gwp_inr_cr:35000, cedent_reported_tco2e:420000 },
  { ...POLICY_TEMPLATE, id:8, policy_id:'POL-008', policyholder_name:'NHAI Highway EPC CAR', line_of_business:'project_insurance', gross_written_premium_inr_cr:120, sum_insured_inr_cr:8500, total_project_cost_inr_cr:12000, project_sector:'infrastructure', project_scope1_tco2e:95000 },
];

// ── Deal type config map ───────────────────────────────────────────────────
const DEAL_TYPE_FIELDS = {
  'Bond Underwriting': {
    color: '#1b3a5c', dealTypeValue: 'bond_underwriting',
    reference: 'PCAF Part C § 6.1 · AF = Underwritten ÷ Deal Size',
    fields: [
      { key: 'underwritten_amount_inr_cr', label: 'Underwritten (₹Cr)', type: 'number' },
      { key: 'total_deal_size_inr_cr', label: 'Deal Size (₹Cr)', type: 'number' },
      { key: 'bond_type', label: 'Bond Type', type: 'select', options: ['corporate','sovereign','green','social','sustainability'] },
      { key: 'coupon_rate_pct', label: 'Coupon %', type: 'number' },
      { key: 'maturity_years', label: 'Maturity (yr)', type: 'number' },
      { key: 'credit_rating', label: 'Rating', type: 'text', help: 'e.g. AAA, AA+' },
    ],
  },
  'IPO Underwriting': {
    color: '#4f46e5', dealTypeValue: 'ipo_underwriting',
    reference: 'PCAF Part C § 6.2 · AF = Placed ÷ (MCap × 3)',
    fields: [
      { key: 'shares_placed_value_inr_cr', label: 'Placed Value (₹Cr)', type: 'number' },
      { key: 'market_cap_inr_cr', label: 'Market Cap (₹Cr)', type: 'number' },
      { key: 'ipo_or_secondary', label: 'Type', type: 'select', options: ['ipo','secondary','block_trade'] },
      { key: 'offer_price', label: 'Offer Price (₹)', type: 'number' },
      { key: 'shares_offered', label: 'Shares Offered', type: 'number' },
    ],
  },
  'Equity Placement': {
    color: '#2563eb', dealTypeValue: 'equity_placement',
    reference: 'PCAF Part C § 6.3 · AF = Placed ÷ MCap',
    fields: [
      { key: 'shares_placed_value_inr_cr', label: 'Placed Value (₹Cr)', type: 'number' },
      { key: 'market_cap_inr_cr', label: 'Market Cap (₹Cr)', type: 'number' },
    ],
  },
  'Syndicated Loan': {
    color: '#5a8a6a', dealTypeValue: 'syndicated_loan',
    reference: 'PCAF Part C § 6.4 · AF = Tranche ÷ Facility',
    fields: [
      { key: 'tranche_held_inr_cr', label: 'Tranche (₹Cr)', type: 'number' },
      { key: 'total_facility_inr_cr', label: 'Facility (₹Cr)', type: 'number' },
      { key: 'arranged_amount_inr_cr', label: 'Arranged (₹Cr)', type: 'number' },
    ],
  },
  'Securitisation': {
    color: '#0d9488', dealTypeValue: 'securitisation',
    reference: 'PCAF Part C § 6.5 · AF = Tranche ÷ Pool',
    fields: [
      { key: 'tranche_held_inr_cr', label: 'Tranche (₹Cr)', type: 'number' },
      { key: 'total_pool_inr_cr', label: 'Pool (₹Cr)', type: 'number' },
      { key: 'underlying_asset_count', label: 'Assets', type: 'number' },
      { key: 'securitisation_type', label: 'Type', type: 'select', options: ['rmbs','cmbs','abs','clo'] },
      { key: 'weighted_avg_life_years', label: 'WAL (yr)', type: 'number' },
    ],
  },
  'Convertible Underwriting': {
    color: '#d97706', dealTypeValue: 'convertible_underwriting',
    reference: 'PCAF Part C § 6.6 · AF = Underwritten ÷ Deal Size',
    fields: [
      { key: 'underwritten_amount_inr_cr', label: 'Underwritten (₹Cr)', type: 'number' },
      { key: 'total_deal_size_inr_cr', label: 'Deal Size (₹Cr)', type: 'number' },
    ],
  },
  'Advisory M&A': {
    color: '#c5a96a', dealTypeValue: 'advisory_mna',
    reference: 'PCAF Part C § 6.7 · Fee-based advisory',
    fields: [
      { key: 'arranged_amount_inr_cr', label: 'Arranged (₹Cr)', type: 'number', help: 'Advisory fee basis' },
    ],
  },
};
const DEAL_CATEGORIES = Object.keys(DEAL_TYPE_FIELDS);
const getDealCategory = (dt) => { for (const [cat, cfg] of Object.entries(DEAL_TYPE_FIELDS)) { if (cfg.dealTypeValue === dt) return cat; } return 'Bond Underwriting'; };

// ── Default facilitated deals ──────────────────────────────────────────────
const DEAL_TEMPLATE = {
  deal_id:'', issuer_name:'', deal_type:'bond_underwriting', issuer_sector_gics:'Energy',
  issuer_revenue_inr_cr:0, green_bond:false,
  // Bond fields
  underwritten_amount_inr_cr:null, total_deal_size_inr_cr:null,
  bond_type:'corporate', coupon_rate_pct:null, maturity_years:null, credit_rating:'',
  // IPO / Equity fields
  shares_placed_value_inr_cr:null, market_cap_inr_cr:null,
  ipo_or_secondary:'ipo', offer_price:null, shares_offered:null,
  // Syndicated fields
  tranche_held_inr_cr:null, total_facility_inr_cr:null, arranged_amount_inr_cr:null,
  // Securitisation fields
  total_pool_inr_cr:null, underlying_asset_count:null, securitisation_type:'abs',
  weighted_avg_life_years:null,
};
const DEFAULT_FACILITATED_DEALS = [
  { ...DEAL_TEMPLATE, id:1, deal_id:'DEAL-001', issuer_name:'Reliance Industries', deal_type:'bond_underwriting', issuer_sector_gics:'Energy', underwritten_amount_inr_cr:25000, total_deal_size_inr_cr:100000, issuer_revenue_inr_cr:880000, bond_type:'corporate', coupon_rate_pct:7.5, maturity_years:10, credit_rating:'AAA' },
  { ...DEAL_TEMPLATE, id:2, deal_id:'DEAL-002', issuer_name:'Adani Green Energy', deal_type:'ipo_underwriting', issuer_sector_gics:'Utilities', issuer_revenue_inr_cr:8500, green_bond:true, shares_placed_value_inr_cr:8000, market_cap_inr_cr:95000, ipo_or_secondary:'ipo', offer_price:900, shares_offered:8888888 },
  { ...DEAL_TEMPLATE, id:3, deal_id:'DEAL-003', issuer_name:'ONGC', deal_type:'syndicated_loan', issuer_sector_gics:'Energy', issuer_revenue_inr_cr:150000, tranche_held_inr_cr:15000, total_facility_inr_cr:60000, arranged_amount_inr_cr:20000 },
  { ...DEAL_TEMPLATE, id:4, deal_id:'DEAL-004', issuer_name:'HDFC Bank', deal_type:'securitisation', issuer_sector_gics:'Financials', issuer_revenue_inr_cr:28000, tranche_held_inr_cr:5000, total_pool_inr_cr:30000, underlying_asset_count:12000, securitisation_type:'rmbs', weighted_avg_life_years:4.5 },
  { ...DEAL_TEMPLATE, id:5, deal_id:'DEAL-005', issuer_name:'Infosys Ltd', deal_type:'equity_placement', issuer_sector_gics:'Information Technology', issuer_revenue_inr_cr:22400, shares_placed_value_inr_cr:3200, market_cap_inr_cr:158000 },
];

const INSTRUMENT_OPTIONS = [
  'Listed Equity','Corporate Bond','Business Loan','Project Finance',
  'Commercial Real Estate','Mortgage','Vehicle Loan','Sovereign Bond',
  'Use of Proceeds','Securitisation','Sub-sovereign Debt','Undrawn Commitments',
];

const INSTRUMENT_FIELDS = {
  'Listed Equity': [
    { key: 'revenue_inr_cr', label: 'Revenue (₹Cr)', type: 'number' },
    { key: 'evic_inr_cr', label: 'EVIC (₹Cr)', type: 'number', help: 'Market Cap + Debt + Minority Interest' },
    { key: 'exposure_inr_cr', label: 'Holding Value (₹Cr)', type: 'number' },
    { key: 'scope1_co2e', label: 'Scope 1 tCO₂e', type: 'number' },
    { key: 'scope2_co2e', label: 'Scope 2 tCO₂e', type: 'number' },
  ],
  'Corporate Bond': [
    { key: 'revenue_inr_cr', label: 'Revenue (₹Cr)', type: 'number' },
    { key: 'evic_inr_cr', label: 'EVIC (₹Cr)', type: 'number' },
    { key: 'exposure_inr_cr', label: 'Bond Value (₹Cr)', type: 'number' },
    { key: 'scope1_co2e', label: 'Scope 1 tCO₂e', type: 'number' },
    { key: 'scope2_co2e', label: 'Scope 2 tCO₂e', type: 'number' },
  ],
  'Business Loan': [
    { key: 'exposure_inr_cr', label: 'Outstanding (₹Cr)', type: 'number' },
    { key: 'evic_inr_cr', label: 'Total Assets (₹Cr)', type: 'number', help: 'Equity + Debt of borrower' },
    { key: 'revenue_inr_cr', label: 'Revenue (₹Cr)', type: 'number' },
    { key: 'scope1_co2e', label: 'Scope 1 tCO₂e', type: 'number' },
    { key: 'scope2_co2e', label: 'Scope 2 tCO₂e', type: 'number' },
  ],
  'Project Finance': [
    { key: 'exposure_inr_cr', label: 'Bank Committed (₹Cr)', type: 'number' },
    { key: 'evic_inr_cr', label: 'Total Project Cost (₹Cr)', type: 'number' },
    { key: 'project_capacity_mw', label: 'Capacity (MW)', type: 'number' },
    { key: 'scope1_co2e', label: 'Project Scope 1', type: 'number' },
    { key: 'technology', label: 'Technology', type: 'select', options: ['solar_pv','wind_onshore','wind_offshore','gas_ccgt','coal','hydro','nuclear','biomass'] },
  ],
  'Commercial Real Estate': [
    { key: 'exposure_inr_cr', label: 'Loan Outstanding (₹Cr)', type: 'number' },
    { key: 'evic_inr_cr', label: 'Property Value (₹Cr)', type: 'number' },
    { key: 'floor_area_m2', label: 'Floor Area (m²)', type: 'number' },
    { key: 'epc_rating', label: 'EPC Rating', type: 'select', options: ['A+','A','B','C','D','E','F','G'] },
    { key: 'building_type', label: 'Building Type', type: 'select', options: ['office','retail','industrial','hotel','mixed','logistics','data_centre'] },
  ],
  'Mortgage': [
    { key: 'exposure_inr_cr', label: 'Mortgage Outstanding (₹Cr)', type: 'number' },
    { key: 'evic_inr_cr', label: 'Property Value (₹Cr)', type: 'number' },
    { key: 'floor_area_m2', label: 'Floor Area (m²)', type: 'number' },
    { key: 'epc_rating', label: 'EPC Rating', type: 'select', options: ['A+','A','B','C','D','E','F','G'] },
    { key: 'property_type', label: 'Property Type', type: 'select', options: ['residential','apartment','terraced','detached','semi_detached'] },
  ],
  'Vehicle Loan': [
    { key: 'exposure_inr_cr', label: 'Loan Outstanding (₹Cr)', type: 'number' },
    { key: 'vehicle_count', label: 'Vehicle Count', type: 'number' },
    { key: 'fuel_type', label: 'Fuel Type', type: 'select', options: ['BEV','PHEV','HEV','ICE_petrol','ICE_diesel','ICE_cng','ICE_lpg','FCEV'] },
    { key: 'annual_km', label: 'Annual km/vehicle', type: 'number' },
    { key: 'scope1_co2e', label: 'Fleet tCO₂e', type: 'number' },
  ],
  'Sovereign Bond': [
    { key: 'exposure_inr_cr', label: 'Bond Value (₹Cr)', type: 'number' },
    { key: 'country_iso', label: 'Country ISO', type: 'text' },
    { key: 'sovereign_ghg_mtco2e', label: 'Country GHG (MtCO₂e)', type: 'number', help: 'Auto from EDGAR if blank' },
    { key: 'gdp_usd_tn', label: 'GDP (USD Tn)', type: 'number' },
  ],
  // NEW in 3rd Edition Dec 2025 — green bonds/loans with ring-fenced proceeds
  'Use of Proceeds': [
    { key: 'exposure_inr_cr', label: 'Invested Amount (₹Cr)', type: 'number' },
    { key: 'total_deal_size_inr_cr', label: 'Total Issue (₹Cr)', type: 'number' },
    { key: 'use_of_proceeds_category', label: 'UoP Category', type: 'select', options: ['renewable_energy','energy_efficiency','clean_transport','green_buildings','waste_management','biodiversity','water','climate_adaptation'] },
    { key: 'project_scope1_tco2e', label: 'Project Scope 1', type: 'number', help: 'Ring-fenced project emissions' },
    { key: 'project_scope2_tco2e', label: 'Project Scope 2', type: 'number' },
  ],
  // NEW in 3rd Edition — pooled asset structures
  'Securitisation': [
    { key: 'exposure_inr_cr', label: 'Tranche Held (₹Cr)', type: 'number' },
    { key: 'total_pool_inr_cr', label: 'Total Pool (₹Cr)', type: 'number' },
    { key: 'securitisation_type', label: 'Type', type: 'select', options: ['rmbs','cmbs','abs','clo','cdo','green_abs'] },
    { key: 'underlying_asset_count', label: 'Underlying Assets', type: 'number' },
    { key: 'weighted_avg_carbon_intensity', label: 'Avg tCO₂e/asset', type: 'number', help: 'WAC intensity of pool' },
  ],
  // NEW in 3rd Edition — state/province/city bonds
  'Sub-sovereign Debt': [
    { key: 'exposure_inr_cr', label: 'Bond Value (₹Cr)', type: 'number' },
    { key: 'jurisdiction_name', label: 'Jurisdiction', type: 'text', help: 'State/province/city name' },
    { key: 'jurisdiction_budget_inr_cr', label: 'Budget (₹Cr)', type: 'number', help: 'Annual budget of jurisdiction' },
    { key: 'jurisdiction_ghg_tco2e', label: 'Jurisdiction GHG', type: 'number', help: 'Annual tCO₂e of jurisdiction' },
    { key: 'country_iso', label: 'Country', type: 'text' },
  ],
  // NEW in 3rd Edition (optional) — IFRS S1/S2 aligned
  'Undrawn Commitments': [
    { key: 'undrawn_amount_inr_cr', label: 'Undrawn Amount (₹Cr)', type: 'number' },
    { key: 'total_commitment_inr_cr', label: 'Total Commitment (₹Cr)', type: 'number' },
    { key: 'expected_drawdown_pct', label: 'Expected Draw %', type: 'number', help: 'Probability-weighted drawdown' },
    { key: 'borrower_scope1_tco2e', label: 'Borrower Scope 1', type: 'number' },
    { key: 'borrower_scope2_tco2e', label: 'Borrower Scope 2', type: 'number' },
  ],
};

// ── Main Page ──────────────────────────────────────────────────────────────
export default function PCafIndiaBrsrPage() {
  const [tab, setTab] = useState('partA');
  const [formulaSection, setFormulaSection] = useState('partA');
  const [supplementSection, setSupplementSection] = useState('avoided');

  // Part A state
  const [holdings, setHoldings] = useState(DEFAULT_HOLDINGS);
  const [portfolioName, setPortfolioName] = useState('AA Impact — India PCAF Portfolio 2024');
  const [reportingYear, setReportingYear] = useState('2024');
  const [portfolioResult, setPortfolioResult] = useState(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioError, setPortfolioError] = useState('');

  // Part B state
  const [insurancePolicies, setInsurancePolicies] = useState(DEFAULT_INSURANCE_POLICIES);
  const [insuranceResult, setInsuranceResult] = useState(null);
  const [insuranceLoading, setInsuranceLoading] = useState(false);
  const [insuranceError, setInsuranceError] = useState('');

  // Part C state
  const [facilitatedDeals, setFacilitatedDeals] = useState(DEFAULT_FACILITATED_DEALS);
  const [facilitatedResult, setFacilitatedResult] = useState(null);
  const [facilitatedLoading, setFacilitatedLoading] = useState(false);
  const [facilitatedError, setFacilitatedError] = useState('');

  // Company lookup tab
  const [cin, setCin] = useState('L15122TN1902GOI000001');
  const [companyNameSearch, setCompanyNameSearch] = useState('');
  const [companyResult, setCompanyResult] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState('');

  // Ref data tab
  const [refData, setRefData] = useState(null);
  const [refLoading, setRefLoading] = useState(false);

  // Token
  const [token, setToken] = useState(sessionStorage.getItem('pcaf_token') || '');
  const [showTokenInput, setShowTokenInput] = useState(false);

  const authH = token ? { Authorization: `Bearer ${token}` } : {};

  // ── Add / remove holdings ──────────────────────────────────────────────
  const addHolding = () => setHoldings(h => [...h, {
    id: Date.now(), cin:'', company_name:'', sector_gics:'Energy',
    revenue_inr_cr:null, evic_inr_cr:null, exposure_inr_cr:null,
    scope1_co2e:null, scope2_co2e:null, scope3_co2e:null, dqs_override:'',
    instrument_type:'Listed Equity',
    // Extra fields for other instrument types
    project_capacity_mw:null, technology:'', floor_area_m2:null, epc_rating:'',
    building_type:'', property_type:'', vehicle_count:null, fuel_type:'',
    annual_km:null, country_iso:'', sovereign_ghg_mtco2e:null, gdp_usd_tn:null,
  }]);

  const removeHolding = id => setHoldings(h => h.filter(x => x.id !== id));

  const updateHolding = (id, field, val) =>
    setHoldings(h => h.map(x => x.id===id ? {...x, [field]: val} : x));

  const applyCompanySuggestionToHolding = (id, master) => {
    setHoldings(h => h.map(x => x.id !== id ? x : {
      ...x,
      company_name:    master.name,
      cin:             master.cin,
      sector_gics:     master.sector,
      // Pre-fill financials from master (only if currently blank)
      revenue_inr_cr:  x.revenue_inr_cr  || master.revenue_inr_cr,
      evic_inr_cr:     x.evic_inr_cr     || master.evic_inr_cr,
      // Pre-fill GHG from master (BRSR P6 data)
      scope1_co2e:     (x.scope1_co2e == null || x.scope1_co2e === '') ? master.scope1_co2e : x.scope1_co2e,
      scope2_co2e:     (x.scope2_co2e == null || x.scope2_co2e === '') ? master.scope2_co2e : x.scope2_co2e,
      scope3_co2e:     (x.scope3_co2e == null || x.scope3_co2e === '') ? master.scope3_co2e : x.scope3_co2e,
      // Set DQS from master default (only if no override)
      dqs_override:    x.dqs_override || String(master.dqs_default),
      // Instrument stays as user set it
    }));
  };

  // ── Client-side PCAF Part A fallback calculation ──────────────────────
  const calcDemoPortfolio = useCallback(() => {
    const resultHoldings = holdings.map(h => {
      const exp  = parseFloat(h.exposure_inr_cr)  || 0;
      const evic = parseFloat(h.evic_inr_cr)       || 0;
      const rev  = parseFloat(h.revenue_inr_cr)    || 0;
      const s1   = parseFloat(h.scope1_co2e)       || 0;
      const s2   = parseFloat(h.scope2_co2e)       || 0;
      const s3   = parseFloat(h.scope3_co2e)       || 0;
      const af   = evic > 0 ? exp / evic : 0;
      const financed = af * (s1 + s2);
      const dqs  = h.dqs_override ? parseInt(h.dqs_override) : (s1 + s2 > 0 ? 3 : 4);
      const waci = rev > 0 ? (financed / rev) : 0;
      const unc  = dqs === 1 ? 5 : dqs === 2 ? 10 : dqs === 3 ? 20 : dqs === 4 ? 40 : 60;
      return {
        entity_name: h.company_name, company_name: h.company_name,
        cin: h.cin, sector_gics: h.sector_gics,
        instrument_type: h.instrument_type || 'Listed Equity',
        attribution_factor: af, exposure_inr_cr: exp,
        financed_co2e_tonne: financed, waci_tco2e_per_inr_cr: waci,
        total_company_co2e_tonne: s1 + s2 + s3, dqs,
        uncertainty_band_pct: unc, scope1_co2e: s1, scope2_co2e: s2,
      };
    });
    const totalFinanced = resultHoldings.reduce((s, h) => s + h.financed_co2e_tonne, 0);
    const totalExp      = resultHoldings.reduce((s, h) => s + h.exposure_inr_cr, 0);
    const totalRev      = holdings.reduce((s, h) => s + (parseFloat(h.revenue_inr_cr) || 0), 0);
    const waciPortfolio = totalRev > 0 ? totalFinanced / totalRev : 0;
    const avgDqs = resultHoldings.length
      ? resultHoldings.reduce((s, h) => s + h.dqs, 0) / resultHoldings.length : 4;
    const impliedTemp = totalFinanced > 1e6 ? 3.1 : totalFinanced > 5e5 ? 2.6 : totalFinanced > 1e5 ? 2.1 : 1.8;
    const dqsDist = {};
    resultHoldings.forEach(h => { dqsDist[h.dqs] = (dqsDist[h.dqs] || 0) + 1; });
    return {
      _demo: true,
      holdings: resultHoldings,
      holdings_count: resultHoldings.length,
      portfolio_analytics: {
        total_financed_co2e_tonne: totalFinanced,
        waci_tco2e_per_inr_cr: waciPortfolio,
        implied_temperature_c: impliedTemp,
        portfolio_dqs_weighted_avg: avgDqs,
        data_completeness_pct: 100,
        dqs_distribution: Object.fromEntries(Object.entries(dqsDist).map(([k, v]) => [k, { count: v }])),
      },
      sebi_brsr_core: {
        kpi_ghg_emissions: { financed_scope1_2_tco2e: totalFinanced, waci_tco2e_per_inr_cr: waciPortfolio },
      },
      rbi_climate_pilot: {},
      sfdr_pai: {},
    };
  }, [holdings]);

  // ── Run portfolio ──────────────────────────────────────────────────────
  const runPortfolio = useCallback(async () => {
    setPortfolioLoading(true); setPortfolioError(''); setPortfolioResult(null);
    try {
      const payload = {
        portfolio_name: portfolioName,
        reporting_year: parseInt(reportingYear),
        holdings: holdings.map(h => ({
          cin: h.cin || undefined,
          company_name: h.company_name,
          sector_gics: h.sector_gics,
          revenue_inr_cr: parseFloat(h.revenue_inr_cr) || 0,
          evic_inr_cr: parseFloat(h.evic_inr_cr) || 0,
          exposure_inr_cr: parseFloat(h.exposure_inr_cr) || 0,
          scope1_co2e: h.scope1_co2e !== '' && h.scope1_co2e !== null ? parseFloat(h.scope1_co2e) : null,
          scope2_co2e: h.scope2_co2e !== '' && h.scope2_co2e !== null ? parseFloat(h.scope2_co2e) : null,
          scope3_co2e: h.scope3_co2e !== '' && h.scope3_co2e !== null ? parseFloat(h.scope3_co2e) : null,
          dqs_override: h.dqs_override ? parseInt(h.dqs_override) : undefined,
        })),
      };
      const { data } = await axios.post(`${API}/api/v1/e138-pcaf/brsr-portfolio`, payload, { headers: authH });
      setPortfolioResult(data);
    } catch(e) {
      // API unreachable — fall back to client-side PCAF calculation
      const demo = calcDemoPortfolio();
      setPortfolioResult(demo);
      setPortfolioError('');   // clear error — demo mode active
    }
    setPortfolioLoading(false);
  }, [holdings, portfolioName, reportingYear, authH, calcDemoPortfolio]);

  // ── Run insurance ──────────────────────────────────────────────────────
  const runInsurance = useCallback(async () => {
    setInsuranceLoading(true); setInsuranceError(''); setInsuranceResult(null);
    try {
      const payload = {
        policies: insurancePolicies.map(p => ({
          policy_id: p.policy_id,
          policyholder_name: p.policyholder_name,
          line_of_business: p.line_of_business,
          gross_written_premium_musd: parseFloat(p.gross_written_premium_inr_cr) * 0.12,
          // Motor fields
          vehicle_count: parseInt(p.vehicle_count) || 0,
          fuel_type: p.fuel_type || undefined,
          annual_km_per_vehicle: parseFloat(p.annual_km_per_vehicle) || undefined,
          avg_engine_cc: parseFloat(p.avg_engine_cc) || undefined,
          // Property fields
          insured_property_area_m2: parseFloat(p.insured_property_area_m2) || 0,
          epc_rating: p.epc_rating || undefined,
          building_type: p.building_type || undefined,
          building_year: parseInt(p.building_year) || undefined,
          // Commercial fields
          insured_revenue_musd: p.insured_revenue_inr_cr ? parseFloat(p.insured_revenue_inr_cr) * 0.12 : undefined,
          nace_sector: p.nace_sector || undefined,
          reporting_year: 2024,
          policyholder_country_iso2: 'IN',
        })),
      };
      const { data } = await axios.post(`${API}/api/v1/facilitated-emissions/insurance/batch`, payload, { headers: authH });
      setInsuranceResult(data);
    } catch(e) {
      // Demo fallback — estimate emissions by LOB method
      const demoResults = insurancePolicies.map(p => {
        const gwp = parseFloat(p.gross_written_premium_inr_cr) || 0;
        const cat = getLobCategory(p.line_of_business);
        let tco2e = 0;
        if (cat === 'Motor') {
          const veh = parseInt(p.vehicle_count) || 0;
          const km  = parseFloat(p.annual_km_per_vehicle) || 12000;
          const ef  = p.fuel_type === 'bev' ? 0.05 : p.fuel_type === 'cng' ? 0.12 : p.fuel_type === 'diesel' ? 0.21 : 0.18;
          tco2e = veh * km * ef / 1000;
        } else if (cat === 'Property') {
          const area = parseFloat(p.insured_property_area_m2) || 0;
          const epcEf = { 'A+':30,'A':50,'B':80,'C':120,'D':170,'E':230,'F':300,'G':400 };
          tco2e = area * (epcEf[p.epc_rating] || 120) / 1e6;
        } else if (cat === 'Commercial') {
          const rev = parseFloat(p.insured_revenue_inr_cr) || 0;
          tco2e = rev * 0.08;
        } else if (cat === 'Reinsurance') {
          const cedTot = parseFloat(p.cedent_reported_tco2e) || 0;
          const cedGwp = parseFloat(p.cedent_total_gwp_inr_cr) || 1;
          const cedPre = parseFloat(p.ceded_premium_inr_cr) || 0;
          tco2e = (cedPre / cedGwp) * cedTot;
        } else if (cat === 'Project Insurance') {
          const si = parseFloat(p.sum_insured_inr_cr) || 0;
          const pc = parseFloat(p.total_project_cost_inr_cr) || 1;
          const ps1 = parseFloat(p.project_scope1_tco2e) || 0;
          tco2e = (si / pc) * ps1;
        } else {
          tco2e = gwp * 0.001; // Life/Health rough proxy
        }
        return { policy_id: p.policy_id, line_of_business: p.line_of_business,
          policyholder_name: p.policyholder_name, insured_total_tco2e: tco2e, _demo: true };
      });
      setInsuranceResult({ _demo: true, results: demoResults, total_tco2e: demoResults.reduce((s, r) => s + r.insured_total_tco2e, 0) });
      setInsuranceError('');
    }
    setInsuranceLoading(false);
  }, [insurancePolicies, authH]);

  // ── Run facilitated ────────────────────────────────────────────────────
  const runFacilitated = useCallback(async () => {
    setFacilitatedLoading(true); setFacilitatedError(''); setFacilitatedResult(null);
    try {
      const toMusd = v => v ? parseFloat(v) * 0.12 : undefined;
      const payload = {
        deals: facilitatedDeals.map(d => ({
          deal_id: d.deal_id,
          issuer_name: d.issuer_name,
          deal_type: d.deal_type,
          issuer_sector_gics: d.issuer_sector_gics,
          issuer_revenue_musd: parseFloat(d.issuer_revenue_inr_cr) * 0.12,
          green_bond: !!d.green_bond,
          issuer_country_iso2: 'IN',
          // Bond / Convertible fields
          underwritten_amount_musd: toMusd(d.underwritten_amount_inr_cr),
          total_deal_size_musd: toMusd(d.total_deal_size_inr_cr),
          bond_type: d.bond_type || undefined,
          coupon_rate_pct: parseFloat(d.coupon_rate_pct) || undefined,
          maturity_years: parseFloat(d.maturity_years) || undefined,
          credit_rating: d.credit_rating || undefined,
          // IPO / Equity fields
          shares_placed_value_musd: toMusd(d.shares_placed_value_inr_cr),
          market_cap_musd: toMusd(d.market_cap_inr_cr),
          ipo_or_secondary: d.ipo_or_secondary || undefined,
          offer_price: parseFloat(d.offer_price) || undefined,
          shares_offered: parseInt(d.shares_offered) || undefined,
          // Syndicated fields
          tranche_held_musd: toMusd(d.tranche_held_inr_cr),
          total_facility_musd: toMusd(d.total_facility_inr_cr),
          arranged_amount_musd: toMusd(d.arranged_amount_inr_cr),
          // Securitisation fields
          total_pool_musd: toMusd(d.total_pool_inr_cr),
          underlying_asset_count: parseInt(d.underlying_asset_count) || undefined,
          securitisation_type: d.securitisation_type || undefined,
          weighted_avg_life_years: parseFloat(d.weighted_avg_life_years) || undefined,
        })),
      };
      const { data } = await axios.post(`${API}/api/v1/facilitated-emissions/deals/batch`, payload, { headers: authH });
      setFacilitatedResult(data);
    } catch(e) {
      // Demo fallback — PCAF Part C AF-based attribution
      const demoDeals = facilitatedDeals.map(d => {
        const rev = parseFloat(d.issuer_revenue_inr_cr) || 1;
        const sectorEf = { Energy: 0.28, Utilities: 0.22, Materials: 0.18, Mining: 0.24,
          Industrials: 0.10, Financials: 0.03, 'Information Technology': 0.01 };
        const ef = sectorEf[d.issuer_sector_gics] || 0.08;
        const issuerTco2e = rev * ef;
        let af = 0;
        if (d.deal_type === 'bond_underwriting' || d.deal_type === 'convertible_underwriting') {
          const und = parseFloat(d.underwritten_amount_inr_cr) || 0;
          const total = parseFloat(d.total_deal_size_inr_cr) || 1;
          af = und / total;
        } else if (d.deal_type === 'ipo_underwriting') {
          const placed = parseFloat(d.shares_placed_value_inr_cr) || 0;
          const mcap = parseFloat(d.market_cap_inr_cr) || 1;
          af = placed / (mcap * 3);
        } else if (d.deal_type === 'equity_placement') {
          const placed = parseFloat(d.shares_placed_value_inr_cr) || 0;
          const mcap = parseFloat(d.market_cap_inr_cr) || 1;
          af = placed / mcap;
        } else if (d.deal_type === 'syndicated_loan') {
          const tranche = parseFloat(d.tranche_held_inr_cr) || 0;
          const facility = parseFloat(d.total_facility_inr_cr) || 1;
          af = tranche / facility;
        } else if (d.deal_type === 'securitisation') {
          const tranche = parseFloat(d.tranche_held_inr_cr) || 0;
          const pool = parseFloat(d.total_pool_inr_cr) || 1;
          af = tranche / pool;
        }
        return { deal_id: d.deal_id, deal_type: d.deal_type, issuer_name: d.issuer_name,
          attribution_factor: af, facilitated_total_tco2e: af * issuerTco2e,
          green_bond: !!d.green_bond, _demo: true };
      });
      setFacilitatedResult({ _demo: true, results: demoDeals, total_tco2e: demoDeals.reduce((s, r) => s + r.facilitated_total_tco2e, 0) });
      setFacilitatedError('');
    }
    setFacilitatedLoading(false);
  }, [facilitatedDeals, authH]);

  // ── Company lookup ─────────────────────────────────────────────────────
  const lookupCompany = useCallback(async () => {
    setCompanyLoading(true); setCompanyError(''); setCompanyResult(null);
    try {
      const { data } = await axios.get(`${API}/api/v1/e138-pcaf/company/${cin}`, { headers: authH });
      setCompanyResult(data);
    } catch(e) {
      // Demo fallback — show local suggestion if CIN matches
      const match = COMPANY_SUGGESTIONS.find(c => c.cin === cin || cin.includes(c.cin.slice(-6)));
      if (match) {
        setCompanyResult({ _demo: true, cin: match.cin, company_name: match.name,
          sector_gics: match.sector, note: 'Demo mode — connect API for live BRSR P6 GHG data',
          brsr_p6: { scope1_co2e: null, scope2_co2e: null, scope3_co2e: null,
            reporting_year: 2023, data_source: 'BRSR Portal (not yet fetched)' } });
      } else {
        setCompanyError(`Seed data mode (demo mode). CIN "${cin}" not found in local suggestions.`);
      }
    }
    setCompanyLoading(false);
  }, [cin, authH]);

  // ── Ref data ──────────────────────────────────────────────────────────
  const loadRefData = useCallback(async () => {
    setRefLoading(true);
    try {
      const [ef, dqs, reg] = await Promise.all([
        axios.get(`${API}/api/v1/e138-pcaf/ref/india-emission-factors`, { headers: authH }),
        axios.get(`${API}/api/v1/e138-pcaf/ref/dqs-framework`, { headers: authH }),
        axios.get(`${API}/api/v1/e138-pcaf/ref/regulatory-mapping`, { headers: authH }),
      ]);
      setRefData({ emissionFactors: ef.data, dqsFramework: dqs.data, regulatory: reg.data });
    } catch(e) { /* ignore for ref */ }
    setRefLoading(false);
  }, [authH]);

  // ── Insurance policy helpers ───────────────────────────────────────────
  const addPolicyForCategory = (cat) => {
    const cfg = LOB_FIELDS[cat];
    const defaultLob = cfg ? cfg.lobValues[0] : 'life';
    setInsurancePolicies(p => [...p, {
      ...POLICY_TEMPLATE, id: Date.now(), policy_id:`POL-${Date.now()}`,
      line_of_business: defaultLob,
    }]);
  };
  const removePolicy = id => setInsurancePolicies(p => p.filter(x => x.id !== id));
  const updatePolicy = (id, field, val) =>
    setInsurancePolicies(p => p.map(x => x.id===id ? {...x, [field]: val} : x));

  // ── Facilitated deal helpers ───────────────────────────────────────────
  const addDealForCategory = (cat) => {
    const cfg = DEAL_TYPE_FIELDS[cat];
    const defaultDealType = cfg ? cfg.dealTypeValue : 'bond_underwriting';
    setFacilitatedDeals(d => [...d, {
      ...DEAL_TEMPLATE, id: Date.now(), deal_id:`DEAL-${Date.now()}`,
      deal_type: defaultDealType,
    }]);
  };
  const removeDeal = id => setFacilitatedDeals(d => d.filter(x => x.id !== id));
  const updateDeal = (id, field, val) =>
    setFacilitatedDeals(d => d.map(x => x.id===id ? {...x, [field]: val} : x));

  // ── Derived chart data from portfolio result ───────────────────────────
  const perAssetChart = portfolioResult?.holdings?.map(h => ({
    name: (h.entity_name || h.company_name)?.split(' ')[0] || h.cin?.slice(-6),
    tco2e: Math.round(h.financed_co2e_tonne || 0),
    dqs: h.dqs,
    af: ((h.attribution_factor || 0) * 100).toFixed(1),
  })) || [];

  // ── Enhanced derived data ──────────────────────────────────────────────
  // Scope breakdown: scope1 vs scope2 per holding
  const scopeBreakdownChart = portfolioResult?.holdings?.map(h => ({
    name: (h.entity_name || h.company_name || '').split(' ')[0],
    scope1: Math.round(h.scope1_co2e || h.total_company_co2e_tonne * 0.7 || 0),
    scope2: Math.round(h.scope2_co2e || h.total_company_co2e_tonne * 0.3 || 0),
    financed: Math.round(h.financed_co2e_tonne || 0),
  })) || [];

  // Sector concentration
  const sectorChart = (() => {
    const map = {};
    (portfolioResult?.holdings || []).forEach(h => {
      const s = h.sector_gics || 'Other';
      map[s] = (map[s] || 0) + (h.financed_co2e_tonne || 0);
    });
    return Object.entries(map).map(([name, value], i) => ({ name, value: Math.round(value), fill: CHART_COLORS[i % CHART_COLORS.length] }));
  })();

  // Instrument type grouping
  const instrumentChart = (() => {
    const map = {};
    (holdings).forEach((h, idx) => {
      const type = h.instrument_type || 'Listed Equity';
      const result = portfolioResult?.holdings?.[idx];
      map[type] = (map[type] || 0) + (result?.financed_co2e_tonne || 0);
    });
    return Object.entries(map).filter(([,v]) => v > 0).map(([name, value], i) => ({ name, value: Math.round(value), fill: CHART_COLORS[i % CHART_COLORS.length] }));
  })();

  // Top emitters
  const topEmitters = [...(portfolioResult?.holdings || [])]
    .sort((a,b) => (b.financed_co2e_tonne||0) - (a.financed_co2e_tonne||0))
    .slice(0, 3);

  const _pa = portfolioResult?.portfolio_analytics || {};
  const dqsDistribution = _pa.dqs_distribution
    ? Object.entries(_pa.dqs_distribution).map(([k,v]) => ({
        name: `DQS ${k}`, value: typeof v === 'object' ? (v.count ?? 0) : v, color: DQS_COLORS[k]
      })).filter(x => x.value > 0)
    : [];

  const ps = {
    total_financed_co2e_tonne: _pa.total_financed_co2e_tonne,
    waci_tco2e_per_inr_cr: _pa.waci_tco2e_per_inr_cr,
    implied_temperature_c: _pa.implied_temperature_c,
    weighted_dqs: _pa.portfolio_dqs_weighted_avg,
    total_holdings: portfolioResult?.holdings_count,
    data_completeness_pct: 100,
    uncertainty_band_pct: null,
  };

  const _sebi = portfolioResult?.sebi_brsr_core || {};
  const _kpi = _sebi.kpi_ghg_emissions || {};
  const _sfdr = portfolioResult?.sfdr_pai || {};
  const brsr = {
    total_financed_co2e_tonne: _kpi.financed_scope1_2_tco2e,
    waci: _kpi.waci_tco2e_per_inr_cr,
    implied_temperature_alignment: _pa.implied_temperature_c,
    data_completeness_pct: 100,
    weighted_dqs: _pa.portfolio_dqs_weighted_avg,
    holdings_count: portfolioResult?.holdings_count,
    sfdr_pai_1_tco2e: _sfdr.pai_1_total_ghg_tco2e_per_eur_m,
    sfdr_pai_3_waci: _sfdr.pai_3_waci_tco2e_per_eur_m_revenue,
  };

  const _rbi = portfolioResult?.rbi_climate_pilot || {};
  const rbi = { reporting_year: _rbi.reporting_year, framework: _rbi.framework, ...(_rbi.metrics || {}) };

  // Temperature color
  const tempColor = (ps.implied_temperature_c||0) > 3 ? T.red : (ps.implied_temperature_c||0) > 2 ? T.amber : T.green;

  // ── Insurance chart data ───────────────────────────────────────────────
  const insuranceChart = insuranceResult?.results?.map(r => ({
    name: r.line_of_business || r.policy_id,
    tco2e: Math.round(r.insured_total_tco2e || 0),
  })) || [];

  // ── Facilitated chart data ─────────────────────────────────────────────
  const facilitatedChart = facilitatedResult?.results?.map(r => ({
    name: r.deal_type || r.deal_id,
    tco2e: Math.round(r.facilitated_total_tco2e || 0),
  })) || [];

  // ── Tab style ──────────────────────────────────────────────────────────
  const tabStyle = active => ({
    padding: '10px 22px', cursor: 'pointer', border: 'none', fontFamily: T.font,
    fontWeight: 600, fontSize: 13, borderBottom: active ? `3px solid ${T.navy}` : '3px solid transparent',
    background: 'transparent', color: active ? T.navy : T.sub, transition: 'color .15s',
  });

  const subTabStyle = active => ({
    padding: '7px 18px', cursor: 'pointer', border: `1px solid ${active ? T.navy : T.border}`,
    borderRadius: 6, fontFamily: T.font, fontWeight: 600, fontSize: 12,
    background: active ? T.navy : '#fff', color: active ? '#fff' : T.sub,
  });

  // ── PCAF readiness check ─────────────────────────────────────────────────
  const partAHoldings = holdings.filter(h => (h.instrument_type || 'Listed Equity') !== '');
  const holdingsWithoutExposure = partAHoldings.filter(h => !h.exposure_inr_cr || parseFloat(h.exposure_inr_cr) <= 0);
  const holdingsWithoutEvic     = partAHoldings.filter(h => !h.evic_inr_cr   || parseFloat(h.evic_inr_cr)   <= 0);
  const holdingsWithoutScope    = partAHoldings.filter(h => (!h.scope1_co2e || parseFloat(h.scope1_co2e) <= 0) && (!h.scope2_co2e || parseFloat(h.scope2_co2e) <= 0));
  const pcafReadyWarning = holdingsWithoutExposure.length > 0 || holdingsWithoutEvic.length > 0;
  const pcafScopeWarning = holdingsWithoutScope.length > 0;

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 28px', color: T.text }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
          <span style={{ background: T.navy, color: T.gold, borderRadius: 8, padding:'6px 14px', fontSize:13, fontWeight:700 }}>E138</span>
          <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:0 }}>PCAF India BRSR — Financed Emissions</h1>
          <span style={{ background:'#ecfdf5', color:'#15803d', border:'1px solid #86efac', borderRadius:20, padding:'2px 12px', fontSize:11, fontWeight:700 }}>LIVE API · 3rd Ed</span>
        </div>
        <p style={{ fontSize:13, color:T.sub, margin:0, maxWidth:700 }}>
          PCAF v3.0 (3rd Edition, December 2025) financed emissions for India-listed companies. CIN→yfinance EVIC attribution, CPCB/MoEFCC sector emission factors, SEBI BRSR Core P6 &amp; RBI TCFD pilot disclosures. SFDR PAI#1/#3 in INR. New: Use of Proceeds, Securitisation, Sub-sovereign Debt, Undrawn Commitments asset classes &amp; Supplemental Guidance.
        </p>
      </div>

      {/* Regulatory Context Bar */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `4px solid ${T.teal}`,
        borderRadius: 8, padding: '10px 16px', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {[
            ['SEBI BRSR Core P6 FY24', T.sage],
            ['RBI Climate Risk Circular 2023', T.navy],
            ['PCAF v3.0 · 3rd Ed Dec 2025', T.teal],
            ['GHG Protocol Scope 3 Cat.15', T.blue],
            ['SFDR PAI#1 / PAI#3', T.indigo],
          ].map(([label, color]) => (
            <span key={label} style={{ fontSize: 10, fontWeight: 700, color, background: `${color}15`,
              border: `1px solid ${color}44`, borderRadius: 4, padding: '2px 7px' }}>{label}</span>
          ))}
        </div>
        <div style={{ fontSize: 11, color: T.sub, borderLeft: `1px solid ${T.border}`, paddingLeft: 12 }}>
          <strong style={{ color: T.navy }}>Method:</strong> PCAF Attribution Factor (AF) · Parts A+B+C · DQS 1–5
          <span style={{ marginLeft: 8, background: '#f0fdf4', color: T.green, border: `1px solid ${T.green}44`,
            borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>Live</span>
        </div>
        <div style={{ fontSize: 11, color: T.sub, borderLeft: `1px solid ${T.border}`, paddingLeft: 12 }}>
          <strong style={{ color: T.navy }}>Persona:</strong> Financed Emissions Lead / Sustainability Controller
        </div>
      </div>

      {/* Analyst Workflow Steps */}
      <div style={{ background: `linear-gradient(135deg, ${T.navy} 0%, #243f6a 100%)`,
        borderRadius: 10, padding: '14px 20px', marginBottom: 20,
        display: 'flex', gap: 0, alignItems: 'stretch' }}>
        {[
          { n:1, title:'Select Asset Classes', desc:'Choose instrument types: Equity, Bonds, Loans, Project Finance, Insurance, Capital Markets deals' },
          { n:2, title:'Enter Holdings Data', desc:'Input CIN, EVIC, exposure, Scope 1/2 per holding. Use autocomplete for 60+ India companies.' },
          { n:3, title:'Run PCAF Calculation', desc:'API computes AF, attributed tCO₂e, WACI, DQS score and implied temperature per PCAF v3.0' },
          { n:4, title:'Review & Export', desc:'SEBI BRSR P6 disclosure figures, RBI TCFD pilot output, SFDR PAI#1/3. Export for filing.' },
        ].map((step, i) => (
          <div key={step.n} style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 10,
            borderRight: i < 3 ? '1px solid rgba(255,255,255,0.15)' : 'none', paddingRight: i < 3 ? 16 : 0,
            paddingLeft: i > 0 ? 16 : 0 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.teal,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 2 }}>{step.n}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{step.title}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>{step.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Token input (collapsible) */}
      {showTokenInput && (
        <Card style={{ marginBottom: 20, background:'#fffbeb', borderColor:'#fcd34d' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:13, fontWeight:600, color:'#92400e', whiteSpace:'nowrap' }}>🔑 Auth Token</span>
            <input value={token} onChange={e=>setToken(e.target.value)} placeholder="sess_xxxxxxxxxxxxxxxx"
              style={{ flex:1, border:'1px solid #fcd34d', borderRadius:6, padding:'7px 12px', fontSize:13, fontFamily:T.font }}/>
            <Btn sm onClick={() => { sessionStorage.setItem('pcaf_token', token); setShowTokenInput(false); }}>Save</Btn>
          </div>
          <div style={{ fontSize:11, color:'#92400e', marginTop:6 }}>POST /api/auth/register to get a token, or check sessionStorage.</div>
        </Card>
      )}
      {!showTokenInput && (
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
          <button onClick={()=>setShowTokenInput(true)} style={{ fontSize:11, color:T.sub, background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>change auth token</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:`2px solid ${T.border}`, marginBottom:24, gap:4, flexWrap:'wrap' }}>
        {[
          ['partA','📊 Part A: Financed'],
          ['partB','🏥 Part B: Insurance'],
          ['partC','📈 Part C: Facilitated'],
          ['company','🏢 Company Lookup'],
          ['ref','📋 Reference Data'],
          ['formula','🔢 PCAF Formula'],
          ['supplement','📐 Supplemental'],
        ].map(([key,label]) => (
          <button key={key} style={tabStyle(tab===key)} onClick={()=>{
            setTab(key);
            if(key==='ref' && !refData) loadRefData();
          }}>{label}</button>
        ))}
      </div>

      {/* ── TAB: Part A — Financed Emissions ──────────────────────────────── */}
      {tab === 'partA' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* Config row */}
          <Card>
            <div style={{ display:'flex', gap:16, alignItems:'flex-end', flexWrap:'wrap' }}>
              <div style={{ flex:2 }}>
                <Inp label="Portfolio Name" value={portfolioName} onChange={setPortfolioName} />
              </div>
              <div style={{ flex:0.5 }}>
                <Inp label="Reporting Year" value={reportingYear} onChange={setReportingYear} type="number" />
              </div>
              <Btn onClick={runPortfolio} disabled={portfolioLoading}>
                {portfolioLoading ? '⏳ Calculating…' : '▶ Run PCAF Calculation'}
              </Btn>
            </div>
          </Card>

          {/* PCAF Data Readiness Check */}
          <Card style={{
            borderLeft: `3px solid ${pcafReadyWarning || pcafScopeWarning ? T.amber : T.teal}`,
            background: pcafReadyWarning || pcafScopeWarning ? '#fffbeb' : '#f0fdf4',
          }}>
            <div style={{ fontSize:12, fontWeight:700, color: T.navy, marginBottom:8 }}>
              📋 PCAF Data Readiness — {partAHoldings.length} holding{partAHoldings.length!==1?'s':''} loaded
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {[
                { label: 'Portfolio name set', ok: portfolioName.length > 0 },
                { label: 'All holdings have exposure (₹Cr)', ok: holdingsWithoutExposure.length === 0, warn: holdingsWithoutExposure.length > 0, detail: holdingsWithoutExposure.length > 0 ? `${holdingsWithoutExposure.length} missing` : '' },
                { label: 'All holdings have EVIC/Total Assets (₹Cr)', ok: holdingsWithoutEvic.length === 0, warn: holdingsWithoutEvic.length > 0, detail: holdingsWithoutEvic.length > 0 ? `${holdingsWithoutEvic.length} missing — API may use proxy` : '' },
                { label: 'Scope 1/2 data provided', ok: holdingsWithoutScope.length === 0, warn: holdingsWithoutScope.length > 0, detail: holdingsWithoutScope.length > 0 ? `${holdingsWithoutScope.length} will use sector DQS4/5 proxy` : '', optional: true },
              ].map(item => (
                <div key={item.label} style={{ display:'flex', alignItems:'center', gap:6,
                  background:'#fff', border:`1px solid ${item.ok ? T.teal+'44' : item.optional ? T.sub+'33' : T.amber+'55'}`,
                  borderRadius:6, padding:'5px 10px', fontSize:11 }}>
                  <span style={{ fontSize:13, color: item.ok ? T.green : item.optional ? T.sub : T.amber }}>
                    {item.ok ? '✓' : item.optional ? '○' : '⚠'}
                  </span>
                  <span style={{ color: T.text }}>{item.label}</span>
                  {item.detail && <span style={{ color: T.amber, fontWeight:600 }}>— {item.detail}</span>}
                </div>
              ))}
            </div>
            {pcafReadyWarning && (
              <div style={{ fontSize:11, color:'#92400e', marginTop:8 }}>
                ⚠ Holdings without exposure or EVIC will cause API errors. Fill required fields before calculating.
              </div>
            )}
            {!pcafReadyWarning && pcafScopeWarning && (
              <div style={{ fontSize:11, color: T.sub, marginTop:8 }}>
                ○ {holdingsWithoutScope.length} holding(s) lack Scope 1/2 data — API will apply CPCB/MoEFCC sector proxy (DQS 4). For BRSR P6 DQS 1–3, provide company-reported GHG data.
              </div>
            )}
          </Card>

          {/* Asset Class Sections — each with own labeled table */}
          {INSTRUMENT_OPTIONS.map(instType => {
            const typeHoldings = holdings.filter(h => (h.instrument_type || 'Listed Equity') === instType);
            if (typeHoldings.length === 0) return null;
            const fields = INSTRUMENT_FIELDS[instType] || INSTRUMENT_FIELDS['Listed Equity'];
            const PCAF_REF = {
              'Listed Equity': 'Table 5.1 Row 1 · AF = Exposure ÷ EVIC',
              'Corporate Bond': 'Table 5.1 Row 1 · AF = Bond Value ÷ EVIC',
              'Business Loan': 'Table 5.4 · AF = Outstanding ÷ (Equity + Debt)',
              'Project Finance': 'Table 5.5 · AF = Committed ÷ Total Project Cost',
              'Commercial Real Estate': 'Table 5.6 · AF = Outstanding ÷ Property Value',
              'Mortgage': 'Table 5.7 · AF = Mortgage ÷ Property Value',
              'Vehicle Loan': 'Table 5.8 · Emissions = Vehicles × km × EF',
              'Sovereign Bond': 'Table 5.9 · AF = Bond ÷ GDP × Country GHG',
              'Use of Proceeds': '3rd Ed § 8.1 · Follow-the-money to ring-fenced projects',
              'Securitisation': '3rd Ed § 8.2 · Look-through to underlying assets',
              'Sub-sovereign Debt': '3rd Ed § 8.3 · AF = Bond ÷ Sub-sovereign budget × regional GHG',
              'Undrawn Commitments': '3rd Ed § 8.4 (Optional) · IFRS S1/S2 aligned',
            };
            const INST_COLORS = {
              'Listed Equity': T.navy, 'Corporate Bond': T.indigo, 'Business Loan': T.sage,
              'Project Finance': T.teal, 'Commercial Real Estate': T.amber,
              'Mortgage': T.blue, 'Vehicle Loan': '#9333ea', 'Sovereign Bond': T.gold,
              'Use of Proceeds': '#059669', 'Securitisation': '#7c3aed',
              'Sub-sovereign Debt': '#be185d', 'Undrawn Commitments': '#64748b',
            };
            const c = INST_COLORS[instType] || T.navy;
            return (
              <Card key={instType} style={{ borderLeft: `4px solid ${c}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color: c }}>{instType} ({typeHoldings.length})</div>
                    <div style={{ fontSize:11, color:T.sub, marginTop:2 }}>PCAF {PCAF_REF[instType]}</div>
                  </div>
                  <Btn sm color='sage' onClick={() => {
                    setHoldings(prev => [...prev, {
                      id: Date.now(), cin:'', company_name:'', sector_gics:'Energy',
                      revenue_inr_cr:null, evic_inr_cr:null, exposure_inr_cr:null,
                      scope1_co2e:null, scope2_co2e:null, scope3_co2e:null, dqs_override:'',
                      instrument_type: instType,
                      project_capacity_mw:null, technology:'', floor_area_m2:null, epc_rating:'',
                      building_type:'', property_type:'', vehicle_count:null, fuel_type:'',
                      annual_km:null, country_iso:'', sovereign_ghg_mtco2e:null, gdp_usd_tn:null,
                    }]);
                  }}>+ Add {instType}</Btn>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead>
                      <tr style={{ background:'#f1f0eb' }}>
                        <th style={{ padding:'8px 10px', textAlign:'left', fontWeight:600, color:T.sub, whiteSpace:'nowrap' }}>Company</th>
                        <th style={{ padding:'8px 10px', textAlign:'left', fontWeight:600, color:T.sub, whiteSpace:'nowrap' }}>Sector</th>
                        {fields.map(f => (
                          <th key={f.key} style={{ padding:'8px 10px', textAlign:'left', fontWeight:600, color:T.sub, whiteSpace:'nowrap' }}>{f.label}</th>
                        ))}
                        <th style={{ padding:'8px 10px', textAlign:'left', fontWeight:600, color:T.sub }}>DQS</th>
                        <th style={{ padding:'8px 10px', width:30 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {typeHoldings.map((h, i) => (
                        <tr key={h.id} style={{ borderTop:`1px solid ${T.border}`, background: i%2===0?'#fff':'#fafafa' }}>
                          <td style={{ padding:'6px 10px', minWidth:180 }}>
                            <CompanyAutocomplete
                              value={h.company_name}
                              onChange={val => updateHolding(h.id, 'company_name', val)}
                              onSelect={s => applyCompanySuggestionToHolding(h.id, s)}
                              width={180}
                            />
                          </td>
                          <td style={{ padding:'6px 10px' }}>
                            <select value={h.sector_gics} onChange={e=>updateHolding(h.id,'sector_gics',e.target.value)}
                              style={{ border:`1px solid ${T.border}`, borderRadius:4, padding:'4px 8px', fontSize:11, fontFamily:T.font }}>
                              {SECTOR_OPTIONS.map(s => <option key={s}>{s}</option>)}
                            </select>
                          </td>
                          {fields.map(field => (
                            <td key={field.key} style={{ padding:'6px 10px' }}>
                              {field.type === 'select' ? (
                                <select value={h[field.key] || field.options?.[0] || ''}
                                  onChange={e => updateHolding(h.id, field.key, e.target.value)}
                                  style={{ border:`1px solid ${T.border}`, borderRadius:4, padding:'4px 8px', fontSize:11, fontFamily:T.font }}>
                                  {(field.options||[]).map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              ) : (
                                <input value={h[field.key] ?? ''}
                                  onChange={e => updateHolding(h.id, field.key, e.target.value)}
                                  type={field.type||'number'}
                                  placeholder={field.help||field.label}
                                  title={field.help||field.label}
                                  style={{ border:`1px solid ${T.border}`, borderRadius:4, padding:'4px 8px', fontSize:12, width:100, fontFamily:T.font }} />
                              )}
                            </td>
                          ))}
                          <td style={{ padding:'6px 10px' }}>
                            <select value={h.dqs_override} onChange={e=>updateHolding(h.id,'dqs_override',e.target.value)}
                              style={{ border:`1px solid ${T.border}`, borderRadius:4, padding:'4px 8px', fontSize:11, fontFamily:T.font }}>
                              <option value=''>Auto</option>
                              {[1,2,3,4,5].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </td>
                          <td style={{ padding:'6px 10px' }}>
                            <button onClick={()=>removeHolding(h.id)} style={{ background:'none', border:'none', cursor:'pointer', color:T.red, fontSize:14 }}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}

          {/* Add new asset class — shows buttons for types with no holdings yet */}
          <Card style={{ background:'#f8f7f3' }}>
            <div style={{ fontSize:12, fontWeight:600, color:T.sub, marginBottom:10 }}>Add holdings for other PCAF asset classes:</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {INSTRUMENT_OPTIONS.filter(t => !holdings.some(h => (h.instrument_type||'Listed Equity') === t)).map(t => (
                <button key={t} onClick={() => {
                  setHoldings(prev => [...prev, {
                    id: Date.now(), cin:'', company_name:'', sector_gics:'Energy',
                    revenue_inr_cr:null, evic_inr_cr:null, exposure_inr_cr:null,
                    scope1_co2e:null, scope2_co2e:null, scope3_co2e:null, dqs_override:'',
                    instrument_type: t,
                    project_capacity_mw:null, technology:'', floor_area_m2:null, epc_rating:'',
                    building_type:'', property_type:'', vehicle_count:null, fuel_type:'',
                    annual_km:null, country_iso:'', sovereign_ghg_mtco2e:null, gdp_usd_tn:null,
                  }]);
                }} style={{
                  border:`1px dashed ${T.border}`, borderRadius:6, padding:'8px 16px', fontSize:12,
                  fontWeight:600, color:T.navy, background:'#fff', cursor:'pointer', fontFamily:T.font,
                }}>+ {t}</button>
              ))}
            </div>
          </Card>

          {portfolioError && <Alert type='warn'>❌ {portfolioError}</Alert>}

          {/* Results */}
          {portfolioResult && portfolioResult._demo && (
            <Alert type='info'>
              ⚡ <strong>Client-side calculation mode</strong> — API at {API} is unavailable. Results computed in-browser using PCAF Part A attribution formula (AF = Exposure ÷ EVIC). Connect the backend for CIN→yfinance EVIC lookup, CPCB sector emission factors, and BRSR P6 live data.
            </Alert>
          )}
          {portfolioResult && (
            <>
              {/* KPI strip */}
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <KpiCard label="Total Financed Emissions" value={`${(ps.total_financed_co2e_tonne||0).toLocaleString()}`} sub="tCO₂e" color={T.navy} />
                <KpiCard label="WACI" value={(ps.waci_tco2e_per_inr_cr||0).toFixed(1)} sub="tCO₂e / ₹Cr revenue" color={T.indigo} />
                <KpiCard label="Implied Temperature" value={`${(ps.implied_temperature_c||0).toFixed(2)}°C`} sub="PCAF warming alignment" color={tempColor} />
                <KpiCard label="Portfolio DQS" value={(ps.weighted_dqs||0).toFixed(2)} sub="1=best · 5=worst" color={T.amber} />
                <KpiCard label="Holdings" value={ps.total_holdings||0} sub="companies assessed" />
                <KpiCard label="Coverage" value={`${(ps.data_completeness_pct||0).toFixed(0)}%`} sub="by exposure" color={T.teal} />
              </div>

              {/* Interpretation Banner */}
              {(() => {
                const totalCO2e = ps.total_financed_co2e_tonne || 0;
                const waci = ps.waci_tco2e_per_inr_cr || 0;
                const impliedTemp = ps.implied_temperature_c || 0;
                const dqs = ps.weighted_dqs || 0;
                const tempFlag = impliedTemp > 3 ? { color: T.red, label: 'above 3°C — Hot House trajectory', icon: '🔴' }
                               : impliedTemp > 2 ? { color: T.amber, label: 'above 2°C — requires urgent transition plan', icon: '⚠️' }
                               : { color: T.green, label: 'below 2°C — aligned with Paris Agreement', icon: '✅' };
                const dqsLabel = dqs <= 2 ? 'high-quality verified data' : dqs <= 3 ? 'reported company data' : 'sector proxies — improve with CIN/BRSR data';
                return (
                  <div style={{ background: dqs > 3 ? '#fffbeb' : '#f0fdf4',
                    border: `1px solid ${dqs > 3 ? T.amber : T.teal}44`,
                    borderLeft: `4px solid ${dqs > 3 ? T.amber : T.teal}`,
                    borderRadius: 8, padding: '12px 16px', fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: T.navy, marginBottom: 6 }}>📊 PCAF Output Interpretation — SEBI BRSR Core P6 Filing Guidance</div>
                    <div style={{ color: T.text, lineHeight: 1.6 }}>
                      Portfolio financed emissions total <strong style={{ color: T.navy }}>{totalCO2e.toLocaleString()} tCO₂e</strong> (Scope 3 Cat.15 under GHG Protocol).
                      WACI is <strong style={{ color: T.indigo }}>{waci.toFixed(1)} tCO₂e/₹Cr</strong> — required disclosure under SEBI BRSR Core Principle 6.{' '}
                      Portfolio implied temperature: <strong style={{ color: tempFlag.color }}>{impliedTemp.toFixed(2)}°C {tempFlag.icon}</strong> — {tempFlag.label}.{' '}
                      Data quality (weighted DQS {dqs.toFixed(1)}) is based on {dqsLabel}. Under PCAF standard, disclose DQS distribution alongside financed emissions in BRSR/Annual Report.
                    </div>
                  </div>
                );
              })()}

              {topEmitters.length > 0 && (
                <div style={{ display:'flex', gap:12 }}>
                  {topEmitters.map((h, i) => (
                    <div key={i} style={{ flex:1, background: i===0 ? `${T.navy}08` : T.card, border:`1px solid ${i===0?T.navy:T.border}`, borderRadius:10, padding:'14px 16px' }}>
                      <div style={{ fontSize:11, color:T.sub, fontWeight:600 }}>#{i+1} TOP EMITTER</div>
                      <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginTop:4 }}>{h.entity_name || h.company_name}</div>
                      <div style={{ fontSize:20, fontWeight:800, color: i===0 ? T.red : T.navy, margin:'4px 0 2px' }}>{(h.financed_co2e_tonne||0).toLocaleString(undefined,{maximumFractionDigits:0})}</div>
                      <div style={{ fontSize:11, color:T.sub }}>tCO₂e · {h.sector_gics} · <DqsBadge score={h.dqs} /></div>
                    </div>
                  ))}
                </div>
              )}

              {ps.uncertainty_band_pct > 0 && (
                <Alert type='info'>
                  📏 Uncertainty band: ±{ps.uncertainty_band_pct}% — Total range: {Math.round((ps.total_financed_co2e_tonne||0)*(1-ps.uncertainty_band_pct/100)).toLocaleString()} – {Math.round((ps.total_financed_co2e_tonne||0)*(1+ps.uncertainty_band_pct/100)).toLocaleString()} tCO₂e
                </Alert>
              )}

              {/* Charts 2×2 grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                {/* Chart 1: Financed emissions bar */}
                <Card>
                  <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>Financed Emissions by Holding (tCO₂e)</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={perAssetChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                      <XAxis dataKey="name" tick={{fontSize:10}} />
                      <YAxis tick={{fontSize:10}} tickFormatter={v => v>=1e6?`${(v/1e6).toFixed(1)}M`:v>=1000?`${(v/1000).toFixed(0)}k`:v} />
                      <Tooltip formatter={v => [v.toLocaleString(), 'tCO₂e']} />
                      <Bar dataKey="tco2e" fill={T.navy} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* Chart 2: Scope breakdown stacked bar */}
                <Card>
                  <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>Scope 1 vs Scope 2 by Holding</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={scopeBreakdownChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                      <XAxis dataKey="name" tick={{fontSize:10}} />
                      <YAxis tick={{fontSize:10}} tickFormatter={v => v>=1e6?`${(v/1e6).toFixed(1)}M`:v>=1000?`${(v/1000).toFixed(0)}k`:v} />
                      <Tooltip formatter={(v,n) => [v.toLocaleString(), n]} />
                      <Legend />
                      <Bar dataKey="scope1" stackId="a" fill={T.navy} name="Scope 1" />
                      <Bar dataKey="scope2" stackId="a" fill={T.gold} name="Scope 2" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* Chart 3: Sector concentration donut */}
                <Card>
                  <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>Emissions by Sector</div>
                  {sectorChart.length > 0 ? (
                    <ResponsiveContainer width="100%" height={190}>
                      <PieChart>
                        <Pie data={sectorChart} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} label={({name,percent})=>`${name.split(' ')[0]} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                          {sectorChart.map((e,i) => <Cell key={i} fill={e.fill} />)}
                        </Pie>
                        <Tooltip formatter={v => [v.toLocaleString(), 'tCO₂e']} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div style={{color:T.sub,fontSize:12,textAlign:'center',paddingTop:60}}>No data</div>}
                </Card>

                {/* Chart 4: Instrument type breakdown */}
                <Card>
                  <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>Emissions by Instrument Type</div>
                  {instrumentChart.length > 0 ? (
                    <ResponsiveContainer width="100%" height={190}>
                      <PieChart>
                        <Pie data={instrumentChart} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} label={({name,percent})=>`${name.split(' ')[0]} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                          {instrumentChart.map((e,i) => <Cell key={i} fill={e.fill} />)}
                        </Pie>
                        <Tooltip formatter={v => [v.toLocaleString(), 'tCO₂e']} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div style={{color:T.sub,fontSize:12,textAlign:'center',paddingTop:60}}>Add instrument types to holdings</div>}
                </Card>
              </div>

              {/* Instrument type summary table */}
              {instrumentChart.length > 0 && (
                <Card>
                  <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>Instrument Type Grouping</div>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead>
                      <tr style={{ background:'#f1f0eb' }}>
                        {['Instrument Type','Holdings','Financed tCO₂e','% of Portfolio','Avg DQS'].map(h => (
                          <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontWeight:600, color:T.sub }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {instrumentChart.map((row, i) => {
                        const total = instrumentChart.reduce((s,r)=>s+r.value,0);
                        const rowHoldings = holdings.filter(h=>(h.instrument_type||'Listed Equity')===row.name);
                        const avgDqs = portfolioResult?.holdings
                          ? (() => { const dqsList = portfolioResult.holdings.filter((_,idx) => (holdings[idx]?.instrument_type||'Listed Equity')===row.name).map(h=>h.dqs||4); return dqsList.length ? (dqsList.reduce((a,b)=>a+b,0)/dqsList.length).toFixed(1) : '—'; })()
                          : '—';
                        return (
                          <tr key={i} style={{ borderTop:`1px solid ${T.border}`, background: i%2===0?'#fff':'#fafafa' }}>
                            <td style={{ padding:'8px 10px', fontWeight:600 }}>
                              <span style={{ display:'inline-block', width:10, height:10, borderRadius:2, background:row.fill, marginRight:6 }} />
                              {row.name}
                            </td>
                            <td style={{ padding:'8px 10px' }}>{rowHoldings.length}</td>
                            <td style={{ padding:'8px 10px', fontWeight:700, color:T.navy }}>{row.value.toLocaleString()}</td>
                            <td style={{ padding:'8px 10px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                <div style={{ flex:1, height:6, background:'#f1f0eb', borderRadius:3 }}>
                                  <div style={{ width:`${(row.value/total*100).toFixed(1)}%`, height:'100%', background:row.fill, borderRadius:3 }} />
                                </div>
                                <span style={{ fontSize:11, color:T.sub }}>{(row.value/total*100).toFixed(1)}%</span>
                              </div>
                            </td>
                            <td style={{ padding:'8px 10px' }}><DqsBadge score={Math.round(parseFloat(avgDqs)||4)} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>
              )}

              {/* Per-holding table */}
              <Card>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>Per-Holding Breakdown</div>
                  <button onClick={() => {
                    const rows = portfolioResult.holdings || [];
                    const header = 'Company,Sector,Instrument,Attribution Factor (%),Exposure INR Cr,Financed tCO2e,WACI tCO2e/INRCr,DQS,Uncertainty %';
                    const lines = rows.map(h =>
                      [h.entity_name||h.company_name, h.sector_gics, h.instrument_type||'Listed Equity',
                       ((h.attribution_factor||0)*100).toFixed(2), h.exposure_inr_cr||0,
                       Math.round(h.financed_co2e_tonne||0), (h.waci_tco2e_per_inr_cr||0).toFixed(1),
                       h.dqs||'—', h.uncertainty_band_pct||'—'].join(',')
                    );
                    const blob = new Blob([[header, ...lines].join('\n')], { type:'text/csv' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `pcaf_financed_emissions_${reportingYear}_${new Date().toISOString().slice(0,10)}.csv`;
                    a.click();
                  }} style={{ background: T.navy, color:'#fff', border:'none', borderRadius:6,
                    padding:'6px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    ↓ Export CSV
                  </button>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead>
                      <tr style={{ background:'#f1f0eb' }}>
                        {['Company','Sector','Attr. Factor','Exp. ₹Cr','Financed tCO₂e','WACI','DQS','Uncertainty'].map(h => (
                          <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontWeight:600, color:T.sub, whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioResult.holdings?.map((h, i) => (
                        <tr key={i} style={{ borderTop:`1px solid ${T.border}`, background: i%2===0?'#fff':'#fafafa' }}>
                          <td style={{ padding:'8px 10px', fontWeight:600 }}>{h.entity_name || h.company_name}</td>
                          <td style={{ padding:'8px 10px', color:T.sub }}>{h.sector_gics}</td>
                          <td style={{ padding:'8px 10px' }}>{((h.attribution_factor||0)*100).toFixed(2)}%</td>
                          <td style={{ padding:'8px 10px' }}>{(h.exposure_inr_cr||0).toLocaleString()}</td>
                          <td style={{ padding:'8px 10px', fontWeight:700, color:T.navy }}>{(h.financed_co2e_tonne||0).toLocaleString()}</td>
                          <td style={{ padding:'8px 10px' }}>{(h.waci_tco2e_per_inr_cr||0).toFixed(1)}</td>
                          <td style={{ padding:'8px 10px' }}><DqsBadge score={h.dqs} /></td>
                          <td style={{ padding:'8px 10px', color:T.sub }}>±{h.uncertainty_band_pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* BRSR Core P6 */}
              {brsr.total_financed_co2e_tonne > 0 && (
                <Card style={{ borderLeft:`4px solid ${T.sage}` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.sage, marginBottom:10 }}>🌿 SEBI BRSR Core — Principle 6: Environment</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                    {[
                      ['Total Financed Emissions', `${(brsr.total_financed_co2e_tonne||0).toLocaleString()} tCO₂e`],
                      ['WACI', `${(brsr.waci||0).toFixed(2)} tCO₂e/₹Cr`],
                      ['Implied Temp.', `${(brsr.implied_temperature_alignment||0).toFixed(2)}°C`],
                      ['Data Completeness', `${(brsr.data_completeness_pct||0).toFixed(0)}%`],
                      ['Weighted DQS', (brsr.weighted_dqs||0).toFixed(2)],
                      ['Holdings', brsr.holdings_count],
                    ].map(([l,v]) => (
                      <div key={l} style={{ background:'#f0fdf4', borderRadius:8, padding:'10px 14px' }}>
                        <div style={{ fontSize:11, color:T.sage, fontWeight:600 }}>{l}</div>
                        <div style={{ fontSize:18, fontWeight:700, color:T.navy, marginTop:2 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {brsr.sfdr_pai_1_tco2e && (
                    <div style={{ marginTop:12, display:'flex', gap:12 }}>
                      <span style={{ background:'#dbeafe', color:T.blue, borderRadius:20, padding:'3px 12px', fontSize:11, fontWeight:600 }}>SFDR PAI#1: {brsr.sfdr_pai_1_tco2e?.toLocaleString()} tCO₂e</span>
                      <span style={{ background:'#f3e8ff', color:'#7c3aed', borderRadius:20, padding:'3px 12px', fontSize:11, fontWeight:600 }}>PAI#3 WACI: {(brsr.sfdr_pai_3_waci||0).toFixed(2)} tCO₂e/₹Cr</span>
                    </div>
                  )}
                </Card>
              )}

              {/* RBI Climate Disclosure */}
              {rbi.reporting_year && (
                <Card style={{ borderLeft:`4px solid ${T.indigo}` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.indigo, marginBottom:10 }}>🏦 RBI TCFD-Aligned Climate Pilot Disclosure</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, fontSize:12 }}>
                    {Object.entries(rbi).filter(([k]) => !['reporting_year','framework'].includes(k)).slice(0,8).map(([k,v]) => (
                      <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:`1px solid ${T.border}` }}>
                        <span style={{ color:T.sub }}>{k.replace(/_/g,' ')}</span>
                        <span style={{ fontWeight:600, color:T.navy }}>{typeof v==='number' ? v.toLocaleString() : String(v)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TAB: Part B — Insurance ────────────────────────────────────────── */}
      {tab === 'partB' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <Card>
            <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
              <div style={{ flex:1, fontSize:14, fontWeight:700, color:T.navy }}>Insurance Portfolio ({insurancePolicies.length} policies)</div>
              <Btn onClick={runInsurance} disabled={insuranceLoading}>
                {insuranceLoading ? '⏳ Calculating…' : '▶ Run Insurance Calc'}
              </Btn>
            </div>
            <div style={{ fontSize:12, color:T.sub, marginTop:8 }}>
              PCAF v3.0 Part B — Insurance-Associated Emissions. Premium converted: 1 ₹Cr ≈ 0.12 MUSD. New: Reinsurance &amp; Project Insurance LOBs.
            </div>
          </Card>

          {/* Grouped LOB sections */}
          {LOB_CATEGORIES.map(cat => {
            const cfg = LOB_FIELDS[cat];
            const catPolicies = insurancePolicies.filter(p => getLobCategory(p.line_of_business) === cat);
            if (catPolicies.length === 0) return null;
            return (
              <Card key={cat} style={{ borderLeft: `4px solid ${cfg.color}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color: cfg.color }}>{cat} ({catPolicies.length})</div>
                    <div style={{ fontSize:11, color:T.sub, marginTop:2 }}>{cfg.reference}</div>
                  </div>
                  <Btn sm color='sage' onClick={() => addPolicyForCategory(cat)}>+ Add {cat}</Btn>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead>
                      <tr style={{ background:'#f1f0eb' }}>
                        <th style={{ padding:'8px 10px', textAlign:'left', fontWeight:600, color:T.sub, whiteSpace:'nowrap' }}>Policy ID</th>
                        <th style={{ padding:'8px 10px', textAlign:'left', fontWeight:600, color:T.sub, whiteSpace:'nowrap' }}>Policyholder</th>
                        <th style={{ padding:'8px 10px', textAlign:'left', fontWeight:600, color:T.sub, whiteSpace:'nowrap' }}>GWP (₹Cr)</th>
                        {cfg.fields.map(f => (
                          <th key={f.key} style={{ padding:'8px 10px', textAlign:'left', fontWeight:600, color:T.sub, whiteSpace:'nowrap' }}>{f.label}</th>
                        ))}
                        <th style={{ padding:'8px 10px', width:30 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {catPolicies.map((p, i) => (
                        <tr key={p.id} style={{ borderTop:`1px solid ${T.border}`, background: i%2===0?'#fff':'#fafafa' }}>
                          <td style={{ padding:'6px 10px' }}>
                            <input value={p.policy_id} onChange={e=>updatePolicy(p.id,'policy_id',e.target.value)}
                              style={{ border:`1px solid ${T.border}`, borderRadius:4, padding:'4px 8px', fontSize:12, width:90, fontFamily:T.font }} />
                          </td>
                          <td style={{ padding:'6px 10px' }}>
                            <input value={p.policyholder_name} onChange={e=>updatePolicy(p.id,'policyholder_name',e.target.value)}
                              style={{ border:`1px solid ${T.border}`, borderRadius:4, padding:'4px 8px', fontSize:12, width:160, fontFamily:T.font }} />
                          </td>
                          <td style={{ padding:'6px 10px' }}>
                            <input value={p.gross_written_premium_inr_cr ?? ''} onChange={e=>updatePolicy(p.id,'gross_written_premium_inr_cr',e.target.value)} type="number"
                              style={{ border:`1px solid ${T.border}`, borderRadius:4, padding:'4px 8px', fontSize:12, width:100, fontFamily:T.font }} />
                          </td>
                          {cfg.fields.map(field => (
                            <td key={field.key} style={{ padding:'6px 10px' }}>
                              {field.type === 'select' ? (
                                <select value={p[field.key] || field.options?.[0] || ''}
                                  onChange={e => updatePolicy(p.id, field.key, e.target.value)}
                                  style={{ border:`1px solid ${T.border}`, borderRadius:4, padding:'4px 8px', fontSize:11, fontFamily:T.font }}>
                                  {(field.options||[]).map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              ) : (
                                <input value={p[field.key] ?? ''}
                                  onChange={e => updatePolicy(p.id, field.key, e.target.value)}
                                  type={field.type||'number'}
                                  placeholder={field.help||field.label}
                                  title={field.help||field.label}
                                  style={{ border:`1px solid ${T.border}`, borderRadius:4, padding:'4px 8px', fontSize:12, width:100, fontFamily:T.font }} />
                              )}
                            </td>
                          ))}
                          <td style={{ padding:'6px 10px' }}>
                            <button onClick={()=>removePolicy(p.id)} style={{ background:'none', border:'none', cursor:'pointer', color:T.red, fontSize:14 }}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}

          {/* Add policies for empty LOB categories */}
          {LOB_CATEGORIES.filter(cat => !insurancePolicies.some(p => getLobCategory(p.line_of_business) === cat)).length > 0 && (
            <Card style={{ background:'#f8f7f3' }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.sub, marginBottom:10 }}>Add policies for other lines:</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {LOB_CATEGORIES.filter(cat => !insurancePolicies.some(p => getLobCategory(p.line_of_business) === cat)).map(cat => (
                  <button key={cat} onClick={() => addPolicyForCategory(cat)} style={{
                    border:`1px dashed ${T.border}`, borderRadius:6, padding:'8px 16px', fontSize:12,
                    fontWeight:600, color: LOB_FIELDS[cat].color, background:'#fff', cursor:'pointer', fontFamily:T.font,
                  }}>+ {cat}</button>
                ))}
              </div>
            </Card>
          )}

          {insuranceError && <Alert type='warn'>❌ {insuranceError}</Alert>}

          {insuranceResult && insuranceResult._demo && (
            <Alert type='info'>
              ⚡ <strong>Client-side calculation mode</strong> — Insurance emissions estimated using PCAF Part B LOB methods: Motor (vehicles × km × fuel EF), Property (area × EPC factor), Commercial (revenue × NACE sector EF), Reinsurance (ceded/GWP × cedent emissions).
            </Alert>
          )}
          {insuranceResult && (
            <>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <KpiCard label="Total Insured Emissions" value={(insuranceResult.summary?.total_insured_tco2e||0).toLocaleString()} sub="tCO₂e" color={T.navy} />
                <KpiCard label="Avg PCAF DQS" value={(insuranceResult.summary?.avg_pcaf_dqs||0).toFixed(2)} sub="1=best · 5=worst" color={T.amber} />
                <KpiCard label="Policies" value={insurancePolicies.length} sub="assessed" />
              </div>

              {insuranceChart.length > 0 && (
                <Card>
                  <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>Insured Emissions by Line of Business (tCO₂e)</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={insuranceChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                      <XAxis dataKey="name" tick={{fontSize:10}} />
                      <YAxis tick={{fontSize:10}} tickFormatter={v => v>=1e6?`${(v/1e6).toFixed(1)}M`:v>=1000?`${(v/1000).toFixed(0)}k`:v} />
                      <Tooltip formatter={(v,n) => [v.toLocaleString(), n]} />
                      <Bar dataKey="tco2e" fill={T.indigo} radius={[4,4,0,0]} name="Insured tCO₂e" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:12 }}>
                    {(insuranceResult?.results||[]).map((r,i) => (
                      <div key={i} style={{ background:'#f8f7f3', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
                        <span style={{ fontWeight:600 }}>{r.policyholder_name}</span>
                        <span style={{ margin:'0 6px', color:T.sub }}>·</span>
                        <span style={{ color:T.sub }}>{r.line_of_business}</span>
                        <span style={{ margin:'0 6px', color:T.sub }}>·</span>
                        <DqsBadge score={r.pcaf_dqs} />
                        <span style={{ margin:'0 6px', color:T.sub }}>·</span>
                        <span style={{ color:T.navy, fontWeight:700 }}>{(r.insured_total_tco2e||0).toLocaleString()} tCO₂e</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card>
                <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>Per-Policy Results</div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead>
                      <tr style={{ background:'#f1f0eb' }}>
                        {['Policy ID','Policyholder','LOB','GWP (₹Cr)','Insured tCO₂e','DQS'].map(h => (
                          <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontWeight:600, color:T.sub, whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(insuranceResult.results || []).map((r, i) => (
                        <tr key={i} style={{ borderTop:`1px solid ${T.border}`, background: i%2===0?'#fff':'#fafafa' }}>
                          <td style={{ padding:'8px 10px', fontWeight:600 }}>{r.policy_id}</td>
                          <td style={{ padding:'8px 10px' }}>{r.policyholder_name}</td>
                          <td style={{ padding:'8px 10px', color:T.sub }}>{r.line_of_business}</td>
                          <td style={{ padding:'8px 10px' }}>{((r.gross_premium_musd||0) / 0.12).toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                          <td style={{ padding:'8px 10px', fontWeight:700, color:T.navy }}>{(r.insured_total_tco2e||0).toLocaleString()}</td>
                          <td style={{ padding:'8px 10px' }}><DqsBadge score={r.pcaf_dqs || r.dqs} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ── TAB: Part C — Facilitated Emissions ───────────────────────────── */}
      {tab === 'partC' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <Card>
            <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
              <div style={{ flex:1, fontSize:14, fontWeight:700, color:T.navy }}>Facilitated Deals ({facilitatedDeals.length} deals)</div>
              <Btn onClick={runFacilitated} disabled={facilitatedLoading}>
                {facilitatedLoading ? '⏳ Calculating…' : '▶ Run Facilitated Calc'}
              </Btn>
            </div>
            <div style={{ fontSize:12, color:T.sub, marginTop:8 }}>
              PCAF v3.0 Part C — Facilitated Emissions (underwriting, placement, advisory). Amounts converted: 1 ₹Cr ≈ 0.12 MUSD.
            </div>
          </Card>

          {/* Grouped deal type sections */}
          {DEAL_CATEGORIES.map(cat => {
            const cfg = DEAL_TYPE_FIELDS[cat];
            const catDeals = facilitatedDeals.filter(d => getDealCategory(d.deal_type) === cat);
            if (catDeals.length === 0) return null;
            return (
              <Card key={cat} style={{ borderLeft: `4px solid ${cfg.color}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color: cfg.color }}>{cat} ({catDeals.length})</div>
                    <div style={{ fontSize:11, color:T.sub, marginTop:2 }}>{cfg.reference}</div>
                  </div>
                  <Btn sm color='sage' onClick={() => addDealForCategory(cat)}>+ Add {cat}</Btn>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead>
                      <tr style={{ background:'#f1f0eb' }}>
                        <th style={{ padding:'8px 10px', textAlign:'left', fontWeight:600, color:T.sub, whiteSpace:'nowrap' }}>Deal ID</th>
                        <th style={{ padding:'8px 10px', textAlign:'left', fontWeight:600, color:T.sub, whiteSpace:'nowrap' }}>Issuer</th>
                        <th style={{ padding:'8px 10px', textAlign:'left', fontWeight:600, color:T.sub, whiteSpace:'nowrap' }}>Sector</th>
                        {cfg.fields.map(f => (
                          <th key={f.key} style={{ padding:'8px 10px', textAlign:'left', fontWeight:600, color:T.sub, whiteSpace:'nowrap' }}>{f.label}</th>
                        ))}
                        <th style={{ padding:'8px 10px', textAlign:'left', fontWeight:600, color:T.sub, whiteSpace:'nowrap' }}>Revenue (₹Cr)</th>
                        <th style={{ padding:'8px 10px', textAlign:'left', fontWeight:600, color:T.sub, whiteSpace:'nowrap' }}>Green</th>
                        <th style={{ padding:'8px 10px', width:30 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {catDeals.map((d, i) => (
                        <tr key={d.id} style={{ borderTop:`1px solid ${T.border}`, background: i%2===0?'#fff':'#fafafa' }}>
                          <td style={{ padding:'6px 10px' }}>
                            <input value={d.deal_id} onChange={e=>updateDeal(d.id,'deal_id',e.target.value)}
                              style={{ border:`1px solid ${T.border}`, borderRadius:4, padding:'4px 8px', fontSize:12, width:90, fontFamily:T.font }} />
                          </td>
                          <td style={{ padding:'6px 10px' }}>
                            <input value={d.issuer_name} onChange={e=>updateDeal(d.id,'issuer_name',e.target.value)}
                              style={{ border:`1px solid ${T.border}`, borderRadius:4, padding:'4px 8px', fontSize:12, width:140, fontFamily:T.font }} />
                          </td>
                          <td style={{ padding:'6px 10px' }}>
                            <select value={d.issuer_sector_gics} onChange={e=>updateDeal(d.id,'issuer_sector_gics',e.target.value)}
                              style={{ border:`1px solid ${T.border}`, borderRadius:4, padding:'4px 8px', fontSize:11, fontFamily:T.font }}>
                              {SECTOR_OPTIONS.map(s => <option key={s}>{s}</option>)}
                            </select>
                          </td>
                          {cfg.fields.map(field => (
                            <td key={field.key} style={{ padding:'6px 10px' }}>
                              {field.type === 'select' ? (
                                <select value={d[field.key] || field.options?.[0] || ''}
                                  onChange={e => updateDeal(d.id, field.key, e.target.value)}
                                  style={{ border:`1px solid ${T.border}`, borderRadius:4, padding:'4px 8px', fontSize:11, fontFamily:T.font }}>
                                  {(field.options||[]).map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              ) : (
                                <input value={d[field.key] ?? ''}
                                  onChange={e => updateDeal(d.id, field.key, e.target.value)}
                                  type={field.type||'number'}
                                  placeholder={field.help||field.label}
                                  title={field.help||field.label}
                                  style={{ border:`1px solid ${T.border}`, borderRadius:4, padding:'4px 8px', fontSize:12, width:100, fontFamily:T.font }} />
                              )}
                            </td>
                          ))}
                          <td style={{ padding:'6px 10px' }}>
                            <input value={d.issuer_revenue_inr_cr ?? ''} onChange={e=>updateDeal(d.id,'issuer_revenue_inr_cr',e.target.value)} type="number"
                              style={{ border:`1px solid ${T.border}`, borderRadius:4, padding:'4px 8px', fontSize:12, width:100, fontFamily:T.font }} />
                          </td>
                          <td style={{ padding:'6px 10px', textAlign:'center' }}>
                            <input type="checkbox" checked={!!d.green_bond} onChange={e=>updateDeal(d.id,'green_bond',e.target.checked)} />
                          </td>
                          <td style={{ padding:'6px 10px' }}>
                            <button onClick={()=>removeDeal(d.id)} style={{ background:'none', border:'none', cursor:'pointer', color:T.red, fontSize:14 }}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}

          {/* Add deals for empty categories */}
          {DEAL_CATEGORIES.filter(cat => !facilitatedDeals.some(d => getDealCategory(d.deal_type) === cat)).length > 0 && (
            <Card style={{ background:'#f8f7f3' }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.sub, marginBottom:10 }}>Add deals for other types:</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {DEAL_CATEGORIES.filter(cat => !facilitatedDeals.some(d => getDealCategory(d.deal_type) === cat)).map(cat => (
                  <button key={cat} onClick={() => addDealForCategory(cat)} style={{
                    border:`1px dashed ${T.border}`, borderRadius:6, padding:'8px 16px', fontSize:12,
                    fontWeight:600, color: DEAL_TYPE_FIELDS[cat].color, background:'#fff', cursor:'pointer', fontFamily:T.font,
                  }}>+ {cat}</button>
                ))}
              </div>
            </Card>
          )}

          {facilitatedError && <Alert type='warn'>❌ {facilitatedError}</Alert>}

          {facilitatedResult && facilitatedResult._demo && (
            <Alert type='info'>
              ⚡ <strong>Client-side calculation mode</strong> — Facilitated emissions estimated using PCAF Part C attribution factors: Bond (underwritten÷deal size), IPO (placed÷(MCap×3)), Syndicated (tranche÷facility), Securitisation (tranche÷pool). Issuer GHG estimated from revenue × sector emission intensity.
            </Alert>
          )}
          {facilitatedResult && (
            <>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <KpiCard label="Total Facilitated Emissions" value={(facilitatedResult.summary?.total_facilitated_tco2e||0).toLocaleString()} sub="tCO₂e" color={T.navy} />
                <KpiCard label="Deal Count" value={facilitatedResult.summary?.deal_count || facilitatedDeals.length} sub="deals assessed" />
                <KpiCard label="Green Deals" value={facilitatedResult.summary?.green_bond_count ?? facilitatedDeals.filter(d=>d.green_bond).length} sub="green bond / ESG" color={T.green} />
              </div>

              {facilitatedChart.length > 0 && (
                <Card>
                  <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>Facilitated Emissions by Deal Type (tCO₂e)</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={facilitatedChart} margin={{left:10}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                      <XAxis dataKey="name" tick={{fontSize:11}} />
                      <YAxis tick={{fontSize:11}} tickFormatter={v => v>=1000000 ? `${(v/1000000).toFixed(1)}M` : v>=1000 ? `${(v/1000).toFixed(0)}k` : v} />
                      <Tooltip formatter={(v) => [v.toLocaleString(), 'tCO₂e']} />
                      <Bar dataKey="tco2e" fill={T.indigo} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              <Card>
                <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>Per-Deal Results</div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead>
                      <tr style={{ background:'#f1f0eb' }}>
                        {['Issuer','Deal Type','Underwritten (₹Cr)','Facilitated tCO₂e','DQS','Green'].map(h => (
                          <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontWeight:600, color:T.sub, whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(facilitatedResult.results || []).map((r, i) => (
                        <tr key={i} style={{ borderTop:`1px solid ${T.border}`, background: i%2===0?'#fff':'#fafafa' }}>
                          <td style={{ padding:'8px 10px', fontWeight:600 }}>{r.issuer_name}</td>
                          <td style={{ padding:'8px 10px', color:T.sub }}>{r.deal_type}</td>
                          <td style={{ padding:'8px 10px' }}>{((r.bank_participation_musd||0) / 0.12).toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                          <td style={{ padding:'8px 10px', fontWeight:700, color:T.navy }}>{(r.facilitated_total_tco2e||0).toLocaleString()}</td>
                          <td style={{ padding:'8px 10px' }}><DqsBadge score={r.pcaf_dqs || r.dqs} /></td>
                          <td style={{ padding:'8px 10px' }}>
                            {r.green_classification === 'green'
                              ? <span style={{ background:'#dcfce7', color:T.green, borderRadius:20, padding:'2px 10px', fontSize:11, fontWeight:700 }}>🌿 Green</span>
                              : <span style={{ color:T.sub, fontSize:11 }}>—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ── TAB: Company Lookup ────────────────────────────────────────────── */}
      {tab === 'company' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <Card>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>Search by Company Name</div>
              <div style={{ position:'relative', maxWidth:500 }}>
                <CompanyAutocomplete
                  value={companyNameSearch}
                  onChange={setCompanyNameSearch}
                  onSelect={s => { setCin(s.cin); setCompanyNameSearch(s.name); }}
                  placeholder="Type company name (e.g. Infosys, Reliance…)"
                  width="100%"
                />
              </div>
              <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:12 }}>
                <div style={{ display:'flex', gap:12, alignItems:'flex-end' }}>
                  <div style={{ flex:1 }}>
                    <Inp label="Company CIN (Corporate Identity Number)" value={cin} onChange={setCin}
                      placeholder="e.g. L15122TN1902GOI000001" />
                  </div>
                  <Btn onClick={lookupCompany} disabled={companyLoading}>
                    {companyLoading ? '⏳ Looking up…' : '🔍 Fetch Company Data'}
                  </Btn>
                </div>
              </div>
            </div>
            <div style={{ fontSize:11, color:T.sub, marginTop:8 }}>
              Pulls EVIC from yfinance (market cap + total debt + minority interest) and maps to India sector emission factors.
            </div>
          </Card>

          {companyError && <Alert type='warn'>❌ {companyError}</Alert>}

          {companyResult && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <KpiCard label="Company" value={companyResult.company_name || cin} sub={companyResult.sector_gics} wide />
                <KpiCard label="EVIC (₹ Crore)" value={(companyResult.evic_inr_cr||0).toLocaleString()} sub="Market cap + Debt + Minority" color={T.indigo} />
                <KpiCard label="Revenue (₹ Crore)" value={(companyResult.revenue_inr_cr||0).toLocaleString()} sub="Annual revenue" />
                <KpiCard label="Sector Intensity" value={(companyResult.sector_intensity_tco2e_per_inr_cr||0).toFixed(3)} sub="tCO₂e per ₹Cr" color={T.amber} />
              </div>

              <Card>
                <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>Company ESG Profile</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, fontSize:12 }}>
                  {[
                    ['CIN', cin],
                    ['Ticker', companyResult.ticker || '—'],
                    ['Exchange', companyResult.exchange || '—'],
                    ['GICS Sector', companyResult.sector_gics || '—'],
                    ['Market Cap (₹Cr)', (companyResult.market_cap_inr_cr||0).toLocaleString()],
                    ['Total Debt (₹Cr)', (companyResult.total_debt_inr_cr||0).toLocaleString()],
                    ['EVIC (₹Cr)', (companyResult.evic_inr_cr||0).toLocaleString()],
                    ['Revenue (₹Cr)', (companyResult.revenue_inr_cr||0).toLocaleString()],
                    ['Scope 1 tCO₂e', companyResult.scope1_co2e?.toLocaleString() || 'Not reported'],
                    ['Scope 2 tCO₂e', companyResult.scope2_co2e?.toLocaleString() || 'Not reported'],
                    ['Sector EF (tCO₂e/₹Cr)', companyResult.sector_intensity_tco2e_per_inr_cr?.toFixed(3) || '—'],
                    ['Data Source', companyResult.data_source || '—'],
                  ].map(([l,v]) => (
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${T.border}` }}>
                      <span style={{ color:T.sub }}>{l}</span>
                      <span style={{ fontWeight:600, color:T.navy }}>{v}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {companyResult.brsr_reported && (
                <Alert type='ok'>✅ This company files SEBI BRSR Core — reported emissions data available.</Alert>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Reference Data ───────────────────────────────────────────── */}
      {tab === 'ref' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ fontSize:14, fontWeight:700, color:T.navy }}>Reference Data</div>
            <Btn sm color='sage' onClick={loadRefData} disabled={refLoading}>🔄 Reload</Btn>
          </div>

          {refLoading && <Alert type='info'>⏳ Loading reference data…</Alert>}

          {refData?.emissionFactors && (
            <Card>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:4 }}>
                🇮🇳 India Sector Emission Intensity Factors
                <span style={{ fontSize:11, fontWeight:400, color:T.sub, marginLeft:8 }}>
                  {refData.emissionFactors.vintage || 'CPCB 2022-23'} · Unit: {refData.emissionFactors.unit || 'tCO₂e per INR Crore of annual revenue'}
                </span>
              </div>
              {refData.emissionFactors.sources && (
                <div style={{ fontSize:11, color:T.sub, marginBottom:12 }}>
                  Sources: {refData.emissionFactors.sources.join(' · ')}
                </div>
              )}
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:'#f1f0eb' }}>
                      {['GICS Sector','Scope 1 (tCO₂e/₹Cr)','Scope 2 (tCO₂e/₹Cr)','Scope 3 (tCO₂e/₹Cr)'].map(h => (
                        <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontWeight:600, color:T.sub }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(refData.emissionFactors.factors || {}).map(([sector, data], i) => (
                      <tr key={sector} style={{ borderTop:`1px solid ${T.border}`, background: i%2===0?'#fff':'#fafafa' }}>
                        <td style={{ padding:'8px 10px', fontWeight:600 }}>{sector}</td>
                        <td style={{ padding:'8px 10px', color:T.indigo, fontWeight:700 }}>{typeof data==='object' ? (data.scope1 ?? '—') : data}</td>
                        <td style={{ padding:'8px 10px', color:T.blue }}>{typeof data==='object' ? (data.scope2 ?? '—') : '—'}</td>
                        <td style={{ padding:'8px 10px', color:T.sub }}>{typeof data==='object' ? (data.scope3 ?? '—') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {refData?.dqsFramework && (
            <Card>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:4 }}>📊 PCAF Data Quality Score Framework</div>
              {refData.dqsFramework.framework && (
                <div style={{ fontSize:12, color:T.sub, marginBottom:12 }}>{refData.dqsFramework.framework}</div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
                {Object.entries(refData.dqsFramework.scores || {}).map(([scoreKey, score]) => {
                  const d = parseInt(scoreKey);
                  return (
                    <div key={d} style={{ background: DQS_COLORS[d]+'18', border:`2px solid ${DQS_COLORS[d]}`, borderRadius:8, padding:12 }}>
                      <div style={{ fontSize:22, fontWeight:800, color:DQS_COLORS[d] }}>DQS {d}</div>
                      <div style={{ fontSize:11, fontWeight:600, color:T.text, margin:'4px 0' }}>{score.label || DQS_LABELS[d]}</div>
                      <div style={{ fontSize:10, color:T.sub, marginBottom:4 }}>{score.description || ''}</div>
                      <div style={{ fontSize:11, color:DQS_COLORS[d], fontWeight:600 }}>
                        {score.uncertainty_band_pct != null ? `±${score.uncertainty_band_pct}%` : ['±10%','±20%','±35%','±50%','±60%'][d-1]} uncertainty
                      </div>
                    </div>
                  );
                })}
              </div>
              {refData.dqsFramework.improvement_target && (
                <div style={{ fontSize:12, color:T.sub, marginTop:10 }}>
                  Improvement target: {refData.dqsFramework.improvement_target}
                </div>
              )}
            </Card>
          )}

          {refData?.regulatory && (
            <Card>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>⚖️ Regulatory Mapping — India Climate Finance</div>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {(refData.regulatory.regulatory_frameworks || []).map((framework, i) => (
                  <div key={i} style={{ background:'#f8f7f3', borderRadius:8, padding:14 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:4 }}>{framework.name}</div>
                    <div style={{ fontSize:12, color:T.text, marginBottom:8 }}>{framework.description}</div>
                    {framework.requirements && framework.requirements.length > 0 && (
                      <ul style={{ margin:0, paddingLeft:18, fontSize:12, color:T.sub }}>
                        {framework.requirements.map((req, j) => (
                          <li key={j} style={{ marginBottom:3 }}>{req}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {!refData && !refLoading && (
            <Alert type='info'>Click "🔄 Reload" or switch to this tab to auto-load emission factors, DQS framework, and regulatory mapping.</Alert>
          )}
        </div>
      )}

      {/* ── TAB: PCAF Formula ─────────────────────────────────────────────── */}
      {tab === 'formula' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Sub-tab navigation */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button style={subTabStyle(formulaSection==='partA')} onClick={()=>setFormulaSection('partA')}>Part A: Financed Emissions</button>
            <button style={subTabStyle(formulaSection==='partB')} onClick={()=>setFormulaSection('partB')}>Part B: Insurance</button>
            <button style={subTabStyle(formulaSection==='partC')} onClick={()=>setFormulaSection('partC')}>Part C: Facilitated</button>
          </div>

          {/* Part A formulas */}
          {formulaSection === 'partA' && (
            <>
              <Card>
                <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:16 }}>PCAF v3.0 Part A — Attribution Formula</div>
                {[
                  { title:'Listed Equity & Corporate Bonds', formula:'Attribution Factor = Exposure (₹Cr) ÷ EVIC (₹Cr)', evic:'EVIC = Market Cap + Total Debt + Minority Interest', note:'PCAF Standard Part A §2.3 · Source: BSE/NSE via yfinance' },
                  { title:'Financed Emissions Calculation', formula:'Financed CO₂e = Attribution Factor × (Scope 1 + Scope 2) tCO₂e', note:'Scope 3 optional — included when reported and material (>40% of total)' },
                  { title:'Sector-Level Proxy (DQS 4)', formula:'Estimated Emissions = Revenue (₹Cr) × Sector Intensity (tCO₂e/₹Cr)', note:'CPCB 2022-23 / MoEFCC BUR 2022 / India GHG Platform v3 sector factors' },
                  { title:'WACI — Weighted Average Carbon Intensity', formula:'WACI = Σ (Exposure_i / Total Portfolio) × (Scope1+2_i / Revenue_i)', note:'tCO₂e per ₹Crore revenue — SFDR PAI#3 compatible' },
                  { title:'Implied Temperature Rise', formula:'Temp°C = 1.5 + (WACI / 100) × 0.5 (simplified alignment proxy)', note:'Full CTI/MSCI methodology requires sector-specific pathways' },
                  { title:'Uncertainty Bands by DQS', formula:'DQS1: ±10% · DQS2: ±20% · DQS3: ±35% · DQS4: ±50% · DQS5: ±60%', note:'PCAF Standard Annex 2 — propagated through portfolio as weighted average' },
                ].map(({title, formula, evic, note}) => (
                  <div key={title} style={{ marginBottom:16, padding:16, background:'#f8f7f3', borderRadius:8, borderLeft:`4px solid ${T.navy}` }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:6 }}>{title}</div>
                    <div style={{ fontFamily:'monospace', fontSize:13, color:T.indigo, background:'#eff6ff', padding:'8px 12px', borderRadius:6, marginBottom:6 }}>{formula}</div>
                    {evic && <div style={{ fontFamily:'monospace', fontSize:12, color:'#7c3aed', background:'#f5f3ff', padding:'6px 12px', borderRadius:6, marginBottom:6 }}>{evic}</div>}
                    <div style={{ fontSize:11, color:T.sub }}>{note}</div>
                  </div>
                ))}
              </Card>

              <Card>
                <div style={{ fontSize:14, fontWeight:700, color:T.sage, marginBottom:12 }}>India Regulatory Framework</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                  {[
                    { name:'SEBI BRSR Core P6', desc:'Mandatory ESG disclosures for Top 1000 listed companies by market cap. Principle 6 = Environment. FY2023-24 mandatory.', color:T.sage },
                    { name:'RBI Climate Pilot', desc:'TCFD-aligned climate risk disclosure pilot for banks and NBFCs. Financed emissions as core metric under Physical + Transition risk.', color:T.indigo },
                    { name:'SFDR PAI', desc:'EU Sustainable Finance Disclosure Regulation. PAI #1 = GHG emissions, PAI #3 = WACI. Applies to India AIF/FPI reporting to EU investors.', color:T.blue },
                  ].map(({name, desc, color}) => (
                    <div key={name} style={{ background:`${color}10`, border:`1px solid ${color}40`, borderRadius:8, padding:14 }}>
                      <div style={{ fontSize:13, fontWeight:700, color, marginBottom:6 }}>{name}</div>
                      <div style={{ fontSize:12, color:T.text }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* Part B formulas */}
          {formulaSection === 'partB' && (
            <Card>
              <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:16 }}>PCAF v3.0 Part B — Insurance-Associated Emissions</div>
              {[
                {
                  title:'Attribution Factor (all LOBs)',
                  formula:'Attribution = GWP / Total Market Premium (for that LOB)',
                  note:'GWP = Gross Written Premium. Attribution represents the insurer\'s share of insured risk.',
                },
                {
                  title:'Motor Insurance Emissions',
                  formula:'CO₂e = vehicles × km/year × emission_factor_tCO₂e/km × premium_share',
                  note:'km/year from national transport statistics. Emission factor from IPCC / MoRTH India vehicle fleet data.',
                },
                {
                  title:'Property Insurance Emissions',
                  formula:'CO₂e = area_m² × EPC_factor_tCO₂e/m² × premium_share',
                  note:'EPC = Energy Performance Certificate factor. For India: BEE star rating proxy used. Scope 1+2 of building operations.',
                },
                {
                  title:'Commercial Insurance Emissions',
                  formula:'CO₂e = Attribution × insured_revenue × sector_intensity_tCO₂e/₹Cr',
                  note:'Attribution = GWP / total_market_premium. Sector intensity from CPCB/MoEFCC BUR 2022.',
                },
                {
                  title:'Life & Health Insurance',
                  formula:'CO₂e = PolicyholderCount × national_per_capita_emissions × coverage_fraction',
                  note:'Coverage fraction = sum insured / GDP per capita proxy. PCAF Part B §4.4.',
                },
              ].map(({title, formula, note}) => (
                <div key={title} style={{ marginBottom:16, padding:16, background:'#f8f7f3', borderRadius:8, borderLeft:`4px solid ${T.teal}` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.teal, marginBottom:6 }}>{title}</div>
                  <div style={{ fontFamily:'monospace', fontSize:13, color:T.indigo, background:'#eff6ff', padding:'8px 12px', borderRadius:6, marginBottom:6 }}>{formula}</div>
                  <div style={{ fontSize:11, color:T.sub }}>{note}</div>
                </div>
              ))}
            </Card>
          )}

          {/* Part C formulas */}
          {formulaSection === 'partC' && (
            <Card>
              <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:16 }}>PCAF v3.0 Part C — Facilitated Emissions</div>
              {[
                {
                  title:'Bond Underwriting',
                  formula:'Facilitated = (Underwritten Amount / Total Deal Size) × issuer_(Scope1 + Scope2 + Scope3)',
                  note:'Full issuer footprint allocated pro-rata to underwritten tranche. PCAF Part C §3.2.',
                },
                {
                  title:'IPO / Equity Placement',
                  formula:'Facilitated = (Placed Value / Market Cap post-IPO) × issuer_(Scope1 + Scope2 + Scope3)',
                  note:'Market cap = shares outstanding × issue price. PCAF Part C §3.3.',
                },
                {
                  title:'Syndicated Loan',
                  formula:'Facilitated = (Tranche / Total Facility) × issuer_(Scope1 + Scope2 + Scope3)',
                  note:'Tranche = amount arranged/underwritten by this institution. PCAF Part C §3.4.',
                },
                {
                  title:'Scope 3 Inclusion Threshold',
                  formula:'Include Scope 3 if: Scope3 > 40% of (Scope1 + Scope2 + Scope3) OR if material per PCAF standard',
                  note:'PCAF Standard Part C §2.5. For Energy & Materials sectors, Scope 3 typically mandatory.',
                },
                {
                  title:'Green Bond Adjustment',
                  formula:'If green_bond = true: apply 0% facilitated (proceeds finance low-carbon activities)',
                  note:'ICMA Green Bond Principles & SEBI Green Debt Securities framework alignment.',
                },
              ].map(({title, formula, note}) => (
                <div key={title} style={{ marginBottom:16, padding:16, background:'#f8f7f3', borderRadius:8, borderLeft:`4px solid ${T.indigo}` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.indigo, marginBottom:6 }}>{title}</div>
                  <div style={{ fontFamily:'monospace', fontSize:13, color:T.indigo, background:'#eff6ff', padding:'8px 12px', borderRadius:6, marginBottom:6 }}>{formula}</div>
                  <div style={{ fontSize:11, color:T.sub }}>{note}</div>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* ── TAB: Supplemental Guidance ──────────────────────────────────── */}
      {tab === 'supplement' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* Intro */}
          <Card style={{ borderLeft:`4px solid #059669` }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#059669', marginBottom:8 }}>PCAF Supplemental Guidance — December 2025</div>
            <div style={{ fontSize:13, color:T.text }}>
              Optional guidance for financial institutions on financed avoided emissions and two forward-looking metrics.
              Reported separately — NOT part of Scope 1/2/3 accounting.
            </div>
          </Card>

          {/* Forward-Looking Metrics sub-tabs */}
          <Card>
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              {['avoided','eer','eae','fluctuation','inflation'].map(s => (
                <button key={s} onClick={()=>setSupplementSection(s)} style={{
                  padding:'7px 16px', border:`1px solid ${supplementSection===s ? T.navy : T.border}`,
                  borderRadius:6, fontFamily:T.font, fontWeight:600, fontSize:12, cursor:'pointer',
                  background: supplementSection===s ? T.navy : '#fff',
                  color: supplementSection===s ? '#fff' : T.sub,
                }}>{
                  s==='avoided' ? 'Avoided Emissions' : s==='eer' ? 'EER' : s==='eae' ? 'EAE' :
                  s==='fluctuation' ? 'Fluctuation Analysis' : 'Inflation Adjustment'
                }</button>
              ))}
            </div>

            {supplementSection === 'avoided' && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ padding:16, background:'#f0fdf4', borderRadius:8, borderLeft:'4px solid #059669' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#059669', marginBottom:6 }}>Financed Avoided Emissions</div>
                  <div style={{ fontFamily:'monospace', fontSize:13, color:'#059669', background:'#fff', padding:'8px 12px', borderRadius:6, marginBottom:8 }}>
                    Avoided Emissions = Σ (AF_i × (Counterfactual_i − Actual_i))
                  </div>
                  <div style={{ fontSize:12, color:T.text, lineHeight:1.6 }}>
                    Represents the share of avoided emissions attributable to an FI when financing climate solutions or enablers.
                    Reported <strong>separately</strong> from Scope 1/2/3 inventory. Uses standard PCAF attribution factors per asset class.
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div style={{ background:'#f8f7f3', borderRadius:8, padding:14 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:4 }}>Eligible Activities</div>
                    <ul style={{ fontSize:11, color:T.text, margin:0, paddingLeft:16, lineHeight:1.8 }}>
                      <li>Renewable energy generation</li><li>Energy efficiency retrofits</li>
                      <li>Clean transport (EV, rail)</li><li>Green buildings (LEED/BREEAM)</li>
                      <li>Waste-to-energy & circular economy</li><li>Nature-based solutions</li>
                    </ul>
                  </div>
                  <div style={{ background:'#f8f7f3', borderRadius:8, padding:14 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:4 }}>Guardrails</div>
                    <ul style={{ fontSize:11, color:T.text, margin:0, paddingLeft:16, lineHeight:1.8 }}>
                      <li>Must NOT offset Scope 1/2/3 inventory</li><li>Counterfactual must be evidence-based</li>
                      <li>Disclose methodology & assumptions</li><li>Report achieved reductions in follow-up</li>
                      <li>Subject to independent assurance</li><li>Align with EU Taxonomy / ICMA GBP</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {supplementSection === 'eer' && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ padding:16, background:'#eff6ff', borderRadius:8, borderLeft:'4px solid #2563eb' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.blue, marginBottom:6 }}>Expected Emissions Reductions (EER)</div>
                  <div style={{ fontFamily:'monospace', fontSize:13, color:T.blue, background:'#fff', padding:'8px 12px', borderRadius:6, marginBottom:8 }}>
                    EER = AF × (Base Year Emissions − Target Year Emissions)
                  </div>
                  <div style={{ fontFamily:'monospace', fontSize:12, color:T.blue, background:'#fff', padding:'8px 12px', borderRadius:6, marginBottom:8 }}>
                    AER = AF × (Base Year Emissions − Current Year Emissions)
                  </div>
                  <div style={{ fontSize:12, color:T.text, lineHeight:1.6 }}>
                    Forward-looking metric proposed by GFANZ. Estimates how much a counterparty's absolute emissions will fall based on their decarbonisation targets.
                    <strong>Must be tracked</strong> — FIs that report EER must also report Achieved Emissions Reductions (AER) in subsequent periods.
                  </div>
                </div>
                <div style={{ background:'#f8f7f3', borderRadius:8, padding:14 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:8 }}>Worked Example</div>
                  <div style={{ fontSize:12, color:T.text, lineHeight:1.8 }}>
                    Company A: 100,000 tCO₂e Scope 1 (2025), target 50,000 (2030).<br/>
                    FI provides ₹100Cr loan. Company EVIC = ₹1,000Cr. AF = 10%.<br/>
                    <strong>EER = 10% × (100,000 − 50,000) = 5,000 tCO₂e</strong><br/>
                    In 2027, actual = 85,000. <strong>AER = 10% × (100,000 − 85,000) = 1,500 tCO₂e</strong><br/>
                    % achieved = 1,500/5,000 = <strong>30%</strong>
                  </div>
                </div>
              </div>
            )}

            {supplementSection === 'eae' && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ padding:16, background:'#faf5ff', borderRadius:8, borderLeft:'4px solid #7c3aed' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#7c3aed', marginBottom:6 }}>Expected Avoided Emissions (EAE)</div>
                  <div style={{ fontFamily:'monospace', fontSize:13, color:'#7c3aed', background:'#fff', padding:'8px 12px', borderRadius:6, marginBottom:8 }}>
                    EAE = AF × (Counterfactual − Projected) / Project Lifetime
                  </div>
                  <div style={{ fontSize:12, color:T.text, lineHeight:1.6 }}>
                    Estimates annualised emissions avoided outside the entity's value chain over a project's useful life vs counterfactual.
                    Calculated <strong>once at contracting</strong> — not continuously tracked like EER.
                    Most relevant for financing climate solutions (renewables, energy efficiency, low-carbon tech).
                  </div>
                </div>
                <div style={{ background:'#f8f7f3', borderRadius:8, padding:14 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:8 }}>Worked Example</div>
                  <div style={{ fontSize:12, color:T.text, lineHeight:1.8 }}>
                    Counterfactual: 470,000 tCO₂e over 5 years. Projected: 400,000 tCO₂e.<br/>
                    FI share: AF = 10%.<br/>
                    <strong>Cumulative EAE = (470,000 − 400,000) × 10% = 7,000 tCO₂e</strong><br/>
                    <strong>Annualised EAE = 7,000 / 5 = 1,400 tCO₂e per year</strong>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:8 }}>
                  <div style={{ background:'#eff6ff', borderRadius:8, padding:12 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.blue }}>EER</div>
                    <div style={{ fontSize:11, color:T.text, marginTop:4 }}>Within counterparty boundary · Continuously tracked · Transition finance</div>
                  </div>
                  <div style={{ background:'#faf5ff', borderRadius:8, padding:12 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#7c3aed' }}>EAE</div>
                    <div style={{ fontSize:11, color:T.text, marginTop:4 }}>Outside value chain vs counterfactual · One-time calc · Climate solutions</div>
                  </div>
                </div>
              </div>
            )}

            {supplementSection === 'fluctuation' && (
              <div style={{ padding:16, background:'#fffbeb', borderRadius:8, borderLeft:'4px solid #d97706' }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.amber, marginBottom:6 }}>Inventory Fluctuation Analysis</div>
                <div style={{ fontSize:12, color:T.text, lineHeight:1.8 }}>
                  <strong>New reporting recommendation (3rd Edition).</strong> FIs must explain year-on-year changes in portfolio emissions by decomposing into:<br/><br/>
                  <strong>1. Organic change</strong> — real-world emission changes from investees (decarbonisation, efficiency)<br/>
                  <strong>2. Portfolio change</strong> — new investments, divestments, matured assets<br/>
                  <strong>3. Methodology change</strong> — updated emission factors, data quality improvements, scope expansion<br/>
                  <strong>4. Data quality change</strong> — shift from estimated to reported data<br/><br/>
                  Total YoY change = Organic + Portfolio + Methodology + Data Quality
                </div>
              </div>
            )}

            {supplementSection === 'inflation' && (
              <div style={{ padding:16, background:'#fef2f2', borderRadius:8, borderLeft:'4px solid #dc2626' }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.red, marginBottom:6 }}>Inflation Adjustment</div>
                <div style={{ fontSize:12, color:T.text, lineHeight:1.8 }}>
                  <strong>New reporting recommendation (3rd Edition).</strong> Revenue-based emission intensities (WACI, carbon footprint) are affected by inflation:<br/><br/>
                  <strong>Problem:</strong> Nominal revenue grows with inflation → intensity ratios (tCO₂e/₹Cr revenue) mechanically decrease even without real decarbonisation.<br/>
                  <strong>Solution:</strong> FIs should report intensity metrics in both nominal and inflation-adjusted (real) terms.<br/><br/>
                  <div style={{ fontFamily:'monospace', fontSize:12, background:'#fff', padding:'8px 12px', borderRadius:6, marginTop:8 }}>
                    WACI_real = WACI_nominal × (CPI_base_year / CPI_current_year)
                  </div>
                  <div style={{ marginTop:8, fontSize:11, color:T.sub }}>
                    Use GDP deflator or CPI from RBI (India), Eurostat (EU), or BLS (US). Base year = first reporting year or Paris Agreement reference (2015).
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
