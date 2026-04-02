import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── Organisations ─────────────────────────────────────────────────────────────
const ORG_TIERS = ['Enterprise', 'Professional', 'Starter', 'Trial'];
const ORGS = [
  { id: 'org-001', name: 'Blackstone ESG Partners',   tier: 'Enterprise',    users: 48, portfolios: 24, apiCalls: 142000, dataGb: 18.4, createdAt: '2025-01-15', active: true },
  { id: 'org-002', name: 'Vanguard Climate Desk',     tier: 'Enterprise',    users: 35, portfolios: 18, apiCalls: 98000,  dataGb: 12.1, createdAt: '2025-02-01', active: true },
  { id: 'org-003', name: 'PIMCO Sustainability',      tier: 'Professional',  users: 22, portfolios: 12, apiCalls: 54000,  dataGb: 7.8,  createdAt: '2025-03-10', active: true },
  { id: 'org-004', name: 'Fidelity Green Alloc',      tier: 'Professional',  users: 18, portfolios: 9,  apiCalls: 41000,  dataGb: 6.2,  createdAt: '2025-03-22', active: true },
  { id: 'org-005', name: 'Schroders Net Zero',        tier: 'Enterprise',    users: 31, portfolios: 15, apiCalls: 87000,  dataGb: 10.5, createdAt: '2025-04-05', active: true },
  { id: 'org-006', name: 'AXA IM Responsible',        tier: 'Professional',  users: 19, portfolios: 10, apiCalls: 47000,  dataGb: 6.9,  createdAt: '2025-05-14', active: true },
  { id: 'org-007', name: 'Amundi ESG Lab',            tier: 'Starter',       users: 8,  portfolios: 4,  apiCalls: 12000,  dataGb: 1.8,  createdAt: '2025-06-20', active: true },
  { id: 'org-008', name: 'NatWest Sustain Risk',      tier: 'Starter',       users: 6,  portfolios: 3,  apiCalls: 9000,   dataGb: 1.2,  createdAt: '2025-07-01', active: true },
  { id: 'org-009', name: 'ING Green Finance',         tier: 'Professional',  users: 14, portfolios: 7,  apiCalls: 32000,  dataGb: 4.5,  createdAt: '2025-08-12', active: true },
  { id: 'org-010', name: 'Demo Tenant (Trial)',       tier: 'Trial',         users: 2,  portfolios: 1,  apiCalls: 1200,   dataGb: 0.2,  createdAt: '2026-03-01', active: true },
];

// ── Table org_id audit ────────────────────────────────────────────────────────
const TABLE_AUDIT = [
  // Core tables
  { table: 'portfolios_pg',         rowCount: 842,   hasOrgId: true,  rlsEnabled: true,  coverage: 100, domain: 'Portfolio' },
  { table: 'portfolio_holdings',    rowCount: 48200, hasOrgId: true,  rlsEnabled: true,  coverage: 100, domain: 'Portfolio' },
  { table: 'portfolio_metrics',     rowCount: 12400, hasOrgId: true,  rlsEnabled: true,  coverage: 100, domain: 'Portfolio' },
  { table: 'esg_scores',            rowCount: 9800,  hasOrgId: true,  rlsEnabled: true,  coverage: 100, domain: 'ESG' },
  { table: 'carbon_emissions',      rowCount: 7200,  hasOrgId: true,  rlsEnabled: true,  coverage: 100, domain: 'Climate' },
  { table: 'scenario_results',      rowCount: 18400, hasOrgId: true,  rlsEnabled: true,  coverage: 100, domain: 'Climate' },
  { table: 'reports',               rowCount: 3200,  hasOrgId: true,  rlsEnabled: true,  coverage: 100, domain: 'Reporting' },
  { table: 'audit_logs',            rowCount: 142000,hasOrgId: true,  rlsEnabled: true,  coverage: 100, domain: 'Platform' },
  // Partial coverage
  { table: 'dme_financial_risk_var',rowCount: 4200,  hasOrgId: false, rlsEnabled: false, coverage: 0,   domain: 'DME' },
  { table: 'dme_pd_results',        rowCount: 3800,  hasOrgId: false, rlsEnabled: false, coverage: 0,   domain: 'DME' },
  { table: 'dme_index_scores',      rowCount: 2900,  hasOrgId: false, rlsEnabled: false, coverage: 0,   domain: 'DME' },
  { table: 'greenium_signals',      rowCount: 5600,  hasOrgId: false, rlsEnabled: false, coverage: 0,   domain: 'Quant' },
  { table: 'sentiment_signals',     rowCount: 14200, hasOrgId: false, rlsEnabled: false, coverage: 0,   domain: 'AI/ML' },
  { table: 'pe_deals',              rowCount: 1800,  hasOrgId: false, rlsEnabled: false, coverage: 0,   domain: 'Private Mkts' },
  { table: 'tech_risk_scores',      rowCount: 2400,  hasOrgId: false, rlsEnabled: false, coverage: 0,   domain: 'Risk' },
  { table: 'residential_re_properties', rowCount: 8400, hasOrgId: false, rlsEnabled: false, coverage: 0, domain: 'Real Assets' },
  // Reference tables — no org_id needed (shared)
  { table: 'gleif_lei',             rowCount: 2184000,hasOrgId: false, rlsEnabled: false, coverage: null, domain: 'Reference' },
  { table: 'owid_co2_annual',       rowCount: 58432, hasOrgId: false, rlsEnabled: false, coverage: null, domain: 'Reference' },
  { table: 'ofac_sdn',              rowCount: 14820, hasOrgId: false, rlsEnabled: false, coverage: null, domain: 'Reference' },
  { table: 'sbti_targets',          rowCount: 9312,  hasOrgId: false, rlsEnabled: false, coverage: null, domain: 'Reference' },
];

// ── RBAC matrix ───────────────────────────────────────────────────────────────
const ROLES = ['org_admin','analyst','viewer','data_manager','compliance_officer','api_service'];
const PERMISSIONS = [
  { resource: 'portfolios',       read: ['org_admin','analyst','viewer','compliance_officer'], write: ['org_admin','analyst'], delete: ['org_admin'] },
  { resource: 'esg_scores',       read: ['org_admin','analyst','viewer','compliance_officer'], write: ['org_admin','data_manager'], delete: ['org_admin'] },
  { resource: 'carbon_emissions', read: ['org_admin','analyst','viewer','compliance_officer'], write: ['org_admin','data_manager'], delete: ['org_admin'] },
  { resource: 'reports',          read: ['org_admin','analyst','viewer','compliance_officer'], write: ['org_admin','analyst','compliance_officer'], delete: ['org_admin'] },
  { resource: 'users',            read: ['org_admin'], write: ['org_admin'], delete: ['org_admin'] },
  { resource: 'audit_logs',       read: ['org_admin','compliance_officer'], write: [], delete: [] },
  { resource: 'api_keys',         read: ['org_admin'], write: ['org_admin'], delete: ['org_admin'] },
  { resource: 'reference_data',   read: ['org_admin','analyst','viewer','data_manager','compliance_officer','api_service'], write: ['api_service'], delete: [] },
];

const DOMAIN_COLORS = {
  'Portfolio': T.navy, 'ESG': T.teal, 'Climate': T.green, 'Reporting': T.purple,
  'Platform': T.slate, 'DME': T.amber, 'Quant': T.red, 'AI/ML': T.purple,
  'Private Mkts': '#0284c7', 'Risk': '#dc2626', 'Real Assets': '#9333ea', 'Reference': '#6b7280',
};
const TIER_COLOR = { Enterprise: T.navy, Professional: T.teal, Starter: T.green, Trial: T.amber };

const pill = (label, color) => (
  <span style={{ background: color + '22', color, border: `1px solid ${color}44`,
    borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>
    {label}
  </span>
);

const card = (label, value, sub, color = T.navy) => (
  <div style={{ background: '#fff', border: `1px solid ${T.navy}22`, borderRadius: 8,
    padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.slate, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.slate, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function MultiTenancyAuditPage() {
  const [tab, setTab] = useState(0);
  const [domainFilter, setDomainFilter] = useState('ALL');

  const tabs = ['Organisation Registry', 'Tenant Isolation Audit', 'Access Control Matrix', 'Architecture Reference'];

  const tenantTables = TABLE_AUDIT.filter(t => t.coverage !== null);
  const referenceTables = TABLE_AUDIT.filter(t => t.coverage === null);
  const isolated = tenantTables.filter(t => t.hasOrgId && t.rlsEnabled).length;
  const missing = tenantTables.filter(t => !t.hasOrgId).length;

  const filteredTables = useMemo(() => domainFilter === 'ALL'
    ? TABLE_AUDIT : TABLE_AUDIT.filter(t => t.domain === domainFilter),
    [domainFilter]
  );

  const domains = [...new Set(TABLE_AUDIT.map(t => t.domain))];

  const tierBreakdown = ORG_TIERS.map(tier => ({
    tier,
    orgs: ORGS.filter(o => o.tier === tier).length,
    users: ORGS.filter(o => o.tier === tier).reduce((s, o) => s + o.users, 0),
    apiCalls: ORGS.filter(o => o.tier === tier).reduce((s, o) => s + o.apiCalls, 0),
  }));

  const pieData = tierBreakdown.map(t => ({ name: t.tier, value: t.orgs }));
  const TIER_PIE_COLORS = [T.navy, T.teal, T.green, T.amber];

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ background: T.purple, color: '#fff', borderRadius: 8, padding: '6px 14px',
          fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>EP-BH2</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>
          Multi-Tenancy &amp; Org Management
        </h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pill('10 Organisations', T.navy)}
          {pill('org_id Audit', T.purple)}
          {pill('RLS Policies', T.red)}
          {pill('RBAC 6 Roles', T.teal)}
        </div>
      </div>

      {/* Audit alert */}
      <div style={{ background: T.red + '12', border: `1px solid ${T.red}44`, borderRadius: 8,
        padding: '10px 16px', marginBottom: 20 }}>
        <span style={{ fontWeight: 700, color: T.red }}>⚠ ISOLATION GAP: </span>
        <span style={{ fontSize: 12, color: T.slate }}>
          {missing} tenant tables are missing <code style={{ fontFamily: T.mono }}>org_id</code> FK and RLS policies
          (migrations 086–087 pending). Queries currently return cross-tenant data for these tables.
          Apply <strong>alembic upgrade head</strong> to close the gap.
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.navy}22` }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            background: tab === i ? T.purple : 'transparent',
            color: tab === i ? '#fff' : T.slate,
            border: 'none', borderRadius: '6px 6px 0 0', padding: '8px 16px',
            fontFamily: T.font, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>

      {/* ── Tab 0: Organisation Registry ── */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {card('Total Orgs', ORGS.length, 'Active tenants')}
            {card('Total Users', ORGS.reduce((s,o)=>s+o.users,0), 'Across all tenants', T.teal)}
            {card('Total Portfolios', ORGS.reduce((s,o)=>s+o.portfolios,0), 'Tenant portfolios', T.navy)}
            {card('API Calls/Month', (ORGS.reduce((s,o)=>s+o.apiCalls,0)/1000).toFixed(0)+'K', 'Platform total', T.green)}
            {card('Data Volume', ORGS.reduce((s,o)=>s+o.dataGb,0).toFixed(1)+' GB', 'Total tenant data', T.amber)}
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Org ID','Organisation','Tier','Users','Portfolios','API Calls/Mo','Data (GB)','Created','Status'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ORGS.map((o, i) => (
                  <tr key={o.id} style={{ background: i % 2 === 0 ? '#fff' : T.cream + '80',
                    borderBottom: `1px solid ${T.navy}11` }}>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, fontSize: 10, color: T.teal }}>{o.id}</td>
                    <td style={{ padding: '9px 12px', fontWeight: 600, color: T.navy }}>{o.name}</td>
                    <td style={{ padding: '9px 12px' }}>{pill(o.tier, TIER_COLOR[o.tier])}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right' }}>{o.users}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right' }}>{o.portfolios}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right' }}>{o.apiCalls.toLocaleString()}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right' }}>{o.dataGb.toFixed(1)}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, fontSize: 10 }}>{o.createdAt}</td>
                    <td style={{ padding: '9px 12px' }}>{pill(o.active ? 'Active' : 'Inactive', o.active ? T.green : T.red)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16 }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>Orgs by Tier</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((_, i) => <Cell key={i} fill={TIER_PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16 }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>API Usage by Tier</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={tierBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="tier" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => (v/1000).toFixed(0)+'K'} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [(v/1000).toFixed(0)+'K', 'API Calls']} />
                  <Bar dataKey="apiCalls" fill={T.teal} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 1: Isolation Audit ── */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {card('Tenant Tables', tenantTables.length, 'Require org_id isolation')}
            {card('Fully Isolated', isolated, 'org_id + RLS active', T.green)}
            {card('Missing Isolation', missing, 'No org_id FK yet', T.red)}
            {card('Reference Tables', referenceTables.length, 'Shared — no org_id needed', T.slate)}
          </div>

          {/* Domain filter */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {['ALL', ...domains].map(d => (
              <button key={d} onClick={() => setDomainFilter(d)} style={{
                background: domainFilter === d ? (DOMAIN_COLORS[d] || T.navy) : '#fff',
                color: domainFilter === d ? '#fff' : T.slate,
                border: `1px solid ${(DOMAIN_COLORS[d] || T.navy)}44`,
                borderRadius: 16, padding: '3px 10px', fontSize: 10,
                fontFamily: T.mono, cursor: 'pointer',
              }}>{d}</button>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Table','Domain','Row Count','org_id FK','RLS Enabled','Coverage','Action Required'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTables.map((t, i) => (
                  <tr key={t.table} style={{ background: i % 2 === 0 ? '#fff' : T.cream + '80',
                    borderBottom: `1px solid ${T.navy}11` }}>
                    <td style={{ padding: '8px 12px', fontFamily: T.mono, fontWeight: 600, color: T.navy }}>{t.table}</td>
                    <td style={{ padding: '8px 12px' }}>{pill(t.domain, DOMAIN_COLORS[t.domain] || T.slate)}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.mono, textAlign: 'right' }}>{t.rowCount.toLocaleString()}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      {t.hasOrgId ? pill('✓ Yes', T.green) : t.coverage === null ? pill('N/A', T.slate) : pill('✗ Missing', T.red)}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      {t.rlsEnabled ? pill('✓ On', T.green) : t.coverage === null ? pill('N/A', T.slate) : pill('✗ Off', T.amber)}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      {t.coverage === null
                        ? <span style={{ color: T.slate, fontSize: 10 }}>Shared ref</span>
                        : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ flex: 1, background: T.navy + '22', borderRadius: 4, height: 6 }}>
                              <div style={{ width: t.coverage + '%', background: t.coverage === 100 ? T.green : T.red, height: '100%', borderRadius: 4 }} />
                            </div>
                            <span style={{ fontFamily: T.mono, fontSize: 10 }}>{t.coverage}%</span>
                          </div>
                        )}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 10, color: T.slate }}>
                      {t.coverage === null ? '—' : t.hasOrgId ? 'None' : 'Apply migration 086 + 087'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 2: Access Control Matrix ── */}
      {tab === 2 && (
        <div>
          <div style={{ fontSize: 12, color: T.slate, marginBottom: 14 }}>
            RBAC matrix — role × resource permissions (all enforced at application layer + Supabase RLS)
          </div>
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 10 }}>Resource</th>
                  {ROLES.map(r => (
                    <th key={r} style={{ padding: '10px 12px', textAlign: 'center', fontFamily: T.mono, fontSize: 10 }}>{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((p, i) => (
                  <tr key={p.resource} style={{ background: i % 2 === 0 ? '#fff' : T.cream + '80',
                    borderBottom: `1px solid ${T.navy}11` }}>
                    <td style={{ padding: '8px 12px', fontFamily: T.mono, fontWeight: 700, color: T.navy }}>{p.resource}</td>
                    {ROLES.map(role => {
                      const canRead = p.read.includes(role);
                      const canWrite = p.write.includes(role);
                      const canDelete = p.delete.includes(role);
                      return (
                        <td key={role} style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {canRead   && <span style={{ fontSize: 9, background: T.teal+'22', color: T.teal, borderRadius: 3, padding: '1px 4px', fontFamily: T.mono }}>R</span>}
                            {canWrite  && <span style={{ fontSize: 9, background: T.amber+'22', color: T.amber, borderRadius: 3, padding: '1px 4px', fontFamily: T.mono }}>W</span>}
                            {canDelete && <span style={{ fontSize: 9, background: T.red+'22', color: T.red, borderRadius: 3, padding: '1px 4px', fontFamily: T.mono }}>D</span>}
                            {!canRead && !canWrite && !canDelete && <span style={{ color: T.slate, fontSize: 10 }}>—</span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {['R = Read', 'W = Write', 'D = Delete'].map((l, i) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.slate }}>
                <span style={{ background: [T.teal, T.amber, T.red][i]+'22', color: [T.teal, T.amber, T.red][i],
                  fontSize: 10, borderRadius: 3, padding: '1px 6px', fontFamily: T.mono }}>{l[0]}</span>
                {l.slice(4)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab 3: Architecture Reference ── */}
      {tab === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            {
              title: 'org_id Isolation Architecture', color: T.purple,
              items: [
                'Every tenant table has org_id UUID FK → organisations(id)',
                'On query: WHERE org_id = :current_org_id applied at ORM layer (SQLAlchemy session)',
                'RLS fallback: PostgreSQL enforces org_id = current_setting(\'app.org_id\')::uuid',
                'JWT: org_id embedded as claim in Supabase JWT, extracted by auth middleware',
                'Admin/migration scripts: use service_role (bypasses RLS) with explicit org_id filter',
                'Cross-org queries: only allowed by platform_admin role with explicit override flag',
              ],
            },
            {
              title: 'Row Level Security Policy Pattern', color: T.red,
              items: [
                'ALTER TABLE portfolios_pg ENABLE ROW LEVEL SECURITY;',
                'CREATE POLICY org_isolation ON portfolios_pg',
                '  USING (org_id = current_setting(\'app.org_id\')::uuid);',
                '',
                'FastAPI middleware sets: SET LOCAL app.org_id = \'{org_uuid}\';',
                'Per-request — scoped to transaction, cleared after response',
                'Supabase: set via Supabase client headers or JWT claim (app_metadata.org_id)',
              ],
            },
            {
              title: 'Organisation Tier Limits', color: T.teal,
              items: [
                'Trial: 2 users, 1 portfolio, 2000 API calls/mo, 30-day TTL',
                'Starter: 10 users, 5 portfolios, 20K API calls/mo, no export',
                'Professional: 25 users, 15 portfolios, 100K API calls/mo, PDF export',
                'Enterprise: unlimited users/portfolios, 1M+ API calls/mo, white-label, SSO',
                'Limits enforced at API Gateway (Redis rate limiter per org_id)',
                'Overage: soft limit at 110% → email alert; hard limit at 120% → 429 response',
              ],
            },
            {
              title: 'Multi-Tenancy Checklist', color: T.green,
              items: [
                '✓ portfolios_pg, esg_scores, carbon_emissions — org_id + RLS active',
                '✓ audit_logs — org_id tracked, RLS on',
                '✗ dme_financial_risk_*, dme_pd_*, dme_index_* — migration 086 pending',
                '✗ greenium_signals, sentiment_signals — migration 086 pending',
                '✗ pe_deals, tech_risk_scores, residential_re_* — migration 086 pending',
                '→ Reference tables (gleif_lei, owid_co2, ofac_sdn) shared — no org_id needed',
                '→ Apply: alembic upgrade 087 — closes all isolation gaps in one operation',
              ],
            },
          ].map(item => (
            <div key={item.title} style={{ background: '#fff', borderRadius: 10,
              border: `2px solid ${item.color}33`, padding: 16 }}>
              <div style={{ fontWeight: 800, color: item.color, fontSize: 13, marginBottom: 10 }}>{item.title}</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {item.items.map((s, i) => (
                  s === '' ? <br key={i} /> :
                  <li key={i} style={{ fontSize: 11, color: T.slate, marginBottom: 5, lineHeight: 1.5,
                    fontFamily: s.startsWith('ALTER') || s.startsWith('CREATE') || s.startsWith('SET') || s.startsWith('USING') ? T.mono : T.font,
                    listStyle: s.startsWith('✓') || s.startsWith('✗') || s.startsWith('→') ? 'none' : 'disc',
                  }}>{s}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
