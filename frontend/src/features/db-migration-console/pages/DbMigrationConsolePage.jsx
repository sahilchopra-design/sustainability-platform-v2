import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── Migration registry (001–087) ──────────────────────────────────────────────
const SPRINT_MAP = {
  '001': 'S01', '002': 'S01', '003': 'S02', '004': 'S02', '005': 'S03',
  '006': 'S03', '007': 'S04', '008': 'S04', '009': 'S05', '010': 'S05',
  '011': 'S06', '012': 'S06', '013': 'S07', '014': 'S07', '015': 'S08',
  '016': 'S08', '017': 'S09', '018': 'S09', '019': 'S10', '020': 'S10',
  '021': 'S11', '022': 'S12', '023': 'S13', '024': 'S14', '025': 'S15',
  '026': 'S16', '027': 'S17', '028': 'S18', '029': 'S19', '030': 'S20',
};

const MIGRATION_DESCRIPTIONS = {
  '068': 'add_greenium_signal_tables',
  '069': 'add_sentiment_pipeline_tables',
  '070': 'add_dme_financial_risk_tables',
  '071': 'add_dme_pd_engine_tables',
  '072': 'add_dme_index_tables',
  '073': 'add_gleif_lei_table',
  '074': 'add_owid_co2_tables',
  '075': 'add_yfinance_evic_table',
  '076': 'add_sbti_targets_table',
  '077': 'add_climate_trace_emit_table',
  '078': 'add_ofac_sdn_table',
  '079': 'add_un_consolidated_table',
  '080': 'add_eu_sanctions_table',
  '081': 'add_uk_hmt_list_table',
  '082': 'add_pe_deal_pipeline_tables',
  '083': 'add_technology_risk_tables',
  '084': 'add_residential_re_assessment_tables',
  '085': 'add_xbrl_ingestion_tables',
  '086': 'add_org_id_fk_all_tables',
  '087': 'add_row_level_security_policies',
};

const MIGRATIONS = Array.from({ length: 87 }, (_, i) => {
  const num = String(i + 1).padStart(3, '0');
  const isApplied = i < 60;  // applied 001–060 to Supabase
  const isPending = i >= 60; // 061–087 pending
  const isCurrent = i === 66; // codebase head at 067
  const desc = MIGRATION_DESCRIPTIONS[num] ||
    `migration_${num}_${['add_tables','add_columns','add_index','alter_table','add_fk'][i % 5]}`;
  const tables = 1 + Math.floor(sr(i * 7) * 4);
  const columns = tables * (2 + Math.floor(sr(i * 7 + 1) * 6));
  const indices = Math.floor(sr(i * 7 + 2) * 3);
  const appliedDate = isApplied
    ? `2026-0${1 + Math.floor(i / 20)}-${String(1 + (i % 28)).padStart(2, '0')}`
    : null;
  return { num, desc, isApplied, isPending, isCurrent, tables, columns, indices, appliedDate };
});

// ── Schema diff summary per pending migration ──────────────────────────────────
const SCHEMA_DIFFS = Object.entries(MIGRATION_DESCRIPTIONS).map(([num, desc]) => {
  const idx = parseInt(num) - 1;
  const tableNames = {
    '068': ['greenium_signals','greenium_backtest'],
    '069': ['sentiment_signals','sentiment_entities','sentiment_pipeline_runs'],
    '070': ['dme_financial_risk_var','dme_financial_risk_wacc','dme_ecl_ifrs9'],
    '071': ['dme_pd_results','dme_pd_sector_coefficients'],
    '072': ['dme_index_scores','dme_index_timeseries','dme_portfolio_aggregation'],
    '073': ['gleif_lei'],
    '074': ['owid_co2_annual','owid_energy_mix'],
    '075': ['yfinance_evic'],
    '076': ['sbti_targets'],
    '077': ['climate_trace_emit'],
    '078': ['ofac_sdn'],
    '079': ['un_consolidated'],
    '080': ['eu_sanctions'],
    '081': ['uk_hmt_list'],
    '082': ['pe_deals','pe_fund_structures','pe_co_investments'],
    '083': ['tech_risk_scores','tech_incidents','tech_compliance'],
    '084': ['residential_re_properties','residential_re_mortgage_stress'],
    '085': ['xbrl_filings','xbrl_validation_rules','xbrl_fact_mappings'],
    '086': ['ALTER: all_tenant_tables ADD COLUMN org_id UUID'],
    '087': ['CREATE POLICY: rls_org_isolation ON all_tenant_tables'],
  }[num] || [`table_${num}_a`, `table_${num}_b`];
  return { num, desc, tables: tableNames };
});

// ── Growth chart — cumulative tables by migration ─────────────────────────────
const GROWTH = MIGRATIONS.reduce((acc, m, i) => {
  const prev = acc.length > 0 ? acc[acc.length - 1] : { migration: '000', tables: 0, columns: 0 };
  acc.push({
    migration: i % 10 === 0 || i >= 60 ? m.num : null,
    tables: prev.tables + m.tables,
    columns: prev.columns + m.columns,
    status: m.isApplied ? 'applied' : 'pending',
  });
  return acc;
}, []).filter((_, i) => i % 5 === 0 || i >= 60);

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

export default function DbMigrationConsolePage() {
  const [tab, setTab] = useState(0);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [expandedMig, setExpandedMig] = useState(null);

  const tabs = ['Migration Status', 'Schema Diff (061–087)', 'Growth Analytics', 'Runbook'];

  const displayMigrations = useMemo(() =>
    showPendingOnly ? MIGRATIONS.filter(m => m.isPending) : MIGRATIONS,
    [showPendingOnly]
  );

  const totalTables = MIGRATIONS.reduce((s, m) => s + m.tables, 0);
  const totalColumns = MIGRATIONS.reduce((s, m) => s + m.columns, 0);
  const pendingCount = MIGRATIONS.filter(m => m.isPending).length;

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ background: T.navy, color: '#fff', borderRadius: 8, padding: '6px 14px',
          fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>EP-BH1</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>
          Database Migration Console
        </h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pill('Alembic', T.teal)}
          {pill('087 Migrations', T.navy)}
          {pill('Supabase', T.green)}
          {pill('060 Applied · 027 Pending', T.amber)}
        </div>
      </div>

      {/* Sync status banner */}
      <div style={{ background: T.amber + '18', border: `1px solid ${T.amber}55`, borderRadius: 8,
        padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.amber }}>⚠ DRIFT DETECTED</span>
        <span style={{ fontSize: 12, color: T.slate }}>
          Codebase HEAD: <strong style={{ fontFamily: T.mono }}>067_add_e36_e39_tables</strong> &nbsp;|&nbsp;
          Supabase applied: <strong style={{ fontFamily: T.mono }}>060_add_uk_sdr_tables</strong> &nbsp;|&nbsp;
          <strong>27 migrations pending</strong> (061–087). Run <code style={{ fontFamily: T.mono }}>alembic upgrade head</code> against Supabase to sync.
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.navy}22` }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            background: tab === i ? T.navy : 'transparent',
            color: tab === i ? '#fff' : T.slate,
            border: 'none', borderRadius: '6px 6px 0 0', padding: '8px 16px',
            fontFamily: T.font, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>

      {/* ── Tab 0: Migration Status ── */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {card('Total Migrations', 87, 'Codebase revision count')}
            {card('Applied (Supabase)', 60, '001–060 synced', T.green)}
            {card('Pending', pendingCount, '061–087 need apply', T.amber)}
            {card('Est. New Tables', MIGRATIONS.filter(m=>m.isPending).reduce((s,m)=>s+m.tables,0), 'From pending migrations', T.navy)}
            {card('Alembic Head', '067', 'add_e36_e39_tables', T.teal)}
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={showPendingOnly} onChange={e => setShowPendingOnly(e.target.checked)} />
              Show pending only (061–087)
            </label>
            <span style={{ fontSize: 12, color: T.slate }}>
              Showing {displayMigrations.length} of {MIGRATIONS.length} migrations
            </span>
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Rev','Description','Tables','Columns','Indices','Status','Applied Date'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayMigrations.map((m, i) => (
                  <tr key={m.num} style={{
                    background: m.isCurrent ? T.teal + '18' : i % 2 === 0 ? '#fff' : T.cream + '80',
                    borderBottom: `1px solid ${T.navy}11`,
                    opacity: m.isApplied ? 1 : 0.85,
                  }}>
                    <td style={{ padding: '8px 12px', fontFamily: T.mono, fontWeight: 700,
                      color: m.isCurrent ? T.teal : T.navy }}>{m.num}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.mono, fontSize: 10, color: T.slate }}>{m.desc}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.mono, textAlign: 'right' }}>{m.tables}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.mono, textAlign: 'right' }}>{m.columns}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.mono, textAlign: 'right' }}>{m.indices}</td>
                    <td style={{ padding: '8px 12px' }}>
                      {m.isCurrent ? pill('HEAD', T.teal)
                        : m.isApplied ? pill('APPLIED', T.green)
                        : pill('PENDING', T.amber)}
                    </td>
                    <td style={{ padding: '8px 12px', fontFamily: T.mono, fontSize: 10, color: T.slate }}>
                      {m.appliedDate || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 1: Schema Diff ── */}
      {tab === 1 && (
        <div>
          <div style={{ fontSize: 13, color: T.slate, marginBottom: 16 }}>
            27 pending migrations (061–087) — click any to expand table list
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SCHEMA_DIFFS.map((m) => (
              <div key={m.num} style={{ background: '#fff', borderRadius: 8,
                border: `1px solid ${m.num === '086' || m.num === '087' ? T.purple : T.navy}33`,
                overflow: 'hidden' }}>
                <div
                  onClick={() => setExpandedMig(expandedMig === m.num ? null : m.num)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}>
                  <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.navy, minWidth: 36 }}>{m.num}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 12, color: T.slate, flex: 1 }}>{m.desc}</span>
                  {m.num === '086' && pill('org_id FK', T.purple)}
                  {m.num === '087' && pill('RLS', T.purple)}
                  <span style={{ color: T.slate, fontSize: 12 }}>{expandedMig === m.num ? '▲' : '▼'}</span>
                </div>
                {expandedMig === m.num && (
                  <div style={{ borderTop: `1px solid ${T.navy}11`, padding: '12px 16px', background: T.cream + '80' }}>
                    <div style={{ fontWeight: 700, color: T.slate, fontSize: 12, marginBottom: 8 }}>
                      Tables / operations in this revision:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {m.tables.map(t => (
                        <span key={t} style={{ fontFamily: T.mono, fontSize: 11, background: T.navy + '10',
                          color: T.navy, border: `1px solid ${T.navy}22`, borderRadius: 4, padding: '3px 8px' }}>{t}</span>
                      ))}
                    </div>
                    {(m.num === '086' || m.num === '087') && (
                      <div style={{ marginTop: 10, fontSize: 12, color: T.purple, fontWeight: 600 }}>
                        {m.num === '086'
                          ? '⚙ Adds org_id UUID FK to all tenant tables — enables row-level multi-tenancy isolation'
                          : '🔒 Creates PostgreSQL Row Level Security (RLS) policies — enforces org_id = auth.uid() isolation'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab 2: Growth Analytics ── */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {card('Est. Total Tables', totalTables, 'After all 87 migrations')}
            {card('Est. Total Columns', totalColumns, 'Schema width', T.teal)}
            {card('Migrations / Sprint', (87 / 45).toFixed(1), 'Avg across 45 sprints')}
            {card('Pending Table Add', MIGRATIONS.filter(m=>m.isPending).reduce((s,m)=>s+m.tables,0), 'From 061–087', T.amber)}
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>Cumulative Table Count by Migration</div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={GROWTH}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="migration" tick={{ fontSize: 9, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [v, n === 'tables' ? 'Tables' : 'Columns']} />
                <Legend />
                <Line type="monotone" dataKey="tables"  stroke={T.navy}  strokeWidth={2} dot={false} name="Tables" />
                <Line type="monotone" dataKey="columns" stroke={T.teal}  strokeWidth={2} dot={false} name="Columns" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Sprint-by-sprint migration count */}
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>Migrations per 10-revision block</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={Array.from({ length: 9 }, (_, i) => ({
                block: `${String(i*10+1).padStart(3,'0')}–${String(Math.min(i*10+10, 87)).padStart(3,'0')}`,
                count: Math.min(10, 87 - i * 10),
                applied: i < 6 ? Math.min(10, 60 - i * 10) : 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="block" tick={{ fontSize: 9, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="applied" name="Applied"  fill={T.green} stackId="a" />
                <Bar dataKey="count"   name="Pending"  fill={T.amber} stackId="a" radius={[3,3,0,0]}
                  // only show pending part
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Tab 3: Runbook ── */}
      {tab === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            {
              title: 'Apply Pending Migrations (061–087)', color: T.green,
              steps: [
                '1. Set DATABASE_URL to Supabase connection string (Transaction Pooler port 6543)',
                '2. Verify current head: alembic current',
                '3. Check pending: alembic history --verbose | grep "<base>"',
                '4. Dry-run 061–085 (new tables, safe): alembic upgrade 085',
                '5. Review migration 086 (org_id FK): adds UUID column, backfill default org if needed',
                '6. Review migration 087 (RLS): enable_rls() + CREATE POLICY — test with test tenant first',
                '7. Apply: alembic upgrade head',
                '8. Verify: alembic current — should show 087_add_row_level_security_policies',
              ],
            },
            {
              title: 'Migration 086 — org_id FK Details', color: T.purple,
              steps: [
                'Adds: org_id UUID NOT NULL DEFAULT \'00000000-0000-0000-0000-000000000001\' to all tenant tables',
                'Default: system org UUID used for existing single-tenant data',
                'FK: REFERENCES organisations(id) ON DELETE CASCADE',
                'Index: CREATE INDEX CONCURRENTLY idx_<table>_org_id ON <table>(org_id)',
                'Tables affected: all portfolio, entity, risk, ESG, emissions tables (~60 tables)',
                'Backfill: UPDATE <table> SET org_id = \'<default-org-uuid>\' WHERE org_id IS NULL',
                'Zero-downtime: column nullable during migration, NOT NULL added after backfill',
              ],
            },
            {
              title: 'Migration 087 — Row Level Security (RLS)', color: T.red,
              steps: [
                'ALTER TABLE <table> ENABLE ROW LEVEL SECURITY',
                'CREATE POLICY org_isolation ON <table> USING (org_id = current_setting(\'app.org_id\')::uuid)',
                'Service role bypasses RLS — use anon/authenticated roles for tenant queries',
                'Set org context: SET app.org_id = \'<uuid>\' or via Supabase JWT claim',
                'SUPERUSER / service_role: always bypasses — use only for admin/migration scripts',
                'Test: SET ROLE authenticated; SET app.org_id=\'test-uuid\'; SELECT * FROM portfolios_pg;',
                'Expected result: only rows where org_id = test-uuid returned',
              ],
            },
            {
              title: 'Alembic Configuration', color: T.teal,
              steps: [
                'alembic.ini: sqlalchemy.url = ${DATABASE_URL}',
                'env.py: target_metadata = Base.metadata (imports all model modules)',
                'Version locations: backend/alembic/versions/',
                'Naming: <NNN>_<description>.py — auto-incremented by generate script',
                'Generate new migration: alembic revision --autogenerate -m "description"',
                'Always review autogenerated — autogenerate may miss: CHECK constraints, partial indexes, custom types',
                'Rollback: alembic downgrade -1 (one step) or alembic downgrade <rev_id>',
              ],
            },
          ].map(item => (
            <div key={item.title} style={{ background: '#fff', borderRadius: 10,
              border: `2px solid ${item.color}33`, padding: 16 }}>
              <div style={{ fontWeight: 800, color: item.color, fontSize: 13, marginBottom: 10 }}>{item.title}</div>
              <ol style={{ margin: 0, paddingLeft: 18 }}>
                {item.steps.map((s, i) => (
                  <li key={i} style={{ fontSize: 11, color: T.slate, marginBottom: 5, lineHeight: 1.5,
                    fontFamily: s.startsWith('alembic') || s.startsWith('ALTER') || s.startsWith('CREATE') || s.startsWith('SET') ? T.mono : T.font }}>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
