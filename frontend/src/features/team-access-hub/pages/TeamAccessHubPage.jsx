import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchModuleRegistry, fetchDeployments, fetchUsageSummary, logModuleOpen } from '../../../services/moduleRegistryService';
import { supabaseConfig, sbPing } from '../../../services/supabaseClient';

// ═══════════════════════════════════════════════════════════════════════════════
//  TEAM ACCESS HUB (EP-OPS1)
//  One place for the whole team: every module and workflow on the platform,
//  its shared access state from the Supabase team DB, live connectivity status,
//  and where the app is deployed for remote access.
// ═══════════════════════════════════════════════════════════════════════════════

const T = {
  bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7',
  border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c',
  gold:'#c5a96a', sage:'#5a8a6a',
  text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706',
  card:'0 1px 4px rgba(27,58,92,0.06)',
  font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

const Stat = ({ label, value, sub, color }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8,
    padding:'14px 18px', boxShadow:T.card, minWidth:140 }}>
    <div style={{ fontSize:11, color:T.textMut, fontWeight:600, textTransform:'uppercase',
      letterSpacing:'0.06em', marginBottom:4 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:700, color:color||T.navy, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textSec, marginTop:4 }}>{sub}</div>}
  </div>
);

const Tab = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding:'8px 16px', borderRadius:6, border:'none', cursor:'pointer',
    fontFamily:T.font, fontSize:12.5, fontWeight:600,
    background:active ? T.navy : 'transparent', color:active ? '#fff' : T.textSec }}>
    {label}
  </button>
);

const Card = ({ title, sub, children, style }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10,
    padding:18, boxShadow:T.card, ...style }}>
    {title && <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom: sub ? 2 : 12 }}>{title}</div>}
    {sub && <div style={{ fontSize:11.5, color:T.textSec, marginBottom:12 }}>{sub}</div>}
    {children}
  </div>
);

const Pill = ({ text, color }) => (
  <span style={{ display:'inline-block', padding:'2px 9px', borderRadius:20, fontSize:10.5,
    fontWeight:700, color:'#fff', background:color }}>{text}</span>
);

const th = { textAlign:'left', padding:'7px 10px', fontSize:10.5, color:T.textMut, fontWeight:700,
  textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:`2px solid ${T.border}`, whiteSpace:'nowrap' };
const td = { padding:'7px 10px', fontSize:12, color:T.text, borderBottom:`1px solid ${T.border}` };

const accessColor = lvl => (lvl === 'open' ? T.green : lvl === 'team' ? T.navyL : T.amber);

// ── TAB 1: MODULE DIRECTORY ───────────────────────────────────────────────────
const DirectoryTab = ({ registry }) => {
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('All');
  const [onlyEnabled, setOnlyEnabled] = useState(false);

  const groups = useMemo(() => ['All', ...new Set(registry.modules.map(m => m.nav_group))], [registry]);

  const rows = useMemo(() => registry.modules.filter(m => {
    if (group !== 'All' && m.nav_group !== group) return false;
    if (onlyEnabled && !m.enabled) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!m.label.toLowerCase().includes(q) && !m.route.includes(q) &&
          !(m.code || '').toLowerCase().includes(q) && !(m.badge || '').toLowerCase().includes(q)) return false;
    }
    return true;
  }), [registry, search, group, onlyEnabled]);

  const exportCsv = () => {
    const header = 'route,label,code,nav_group,access_level,enabled';
    const lines = registry.modules.map(m =>
      [m.route, `"${m.label}"`, m.code || '', `"${m.nav_group}"`, m.access_level, m.enabled].join(','));
    const blob = new Blob([[header, ...lines].join('\n')], { type:'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'platform_module_directory.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:14, alignItems:'flex-end' }}>
        <div>
          <div style={{ fontSize:11, color:T.textMut, marginBottom:3 }}>Search</div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder='Module, route, code, keyword…'
            style={{ padding:'6px 10px', border:`1px solid ${T.border}`, borderRadius:5, fontSize:12,
              background:T.surface, color:T.text, width:240, fontFamily:T.font }} />
        </div>
        <div>
          <div style={{ fontSize:11, color:T.textMut, marginBottom:3 }}>Domain Group</div>
          <select value={group} onChange={e => setGroup(e.target.value)}
            style={{ padding:'6px 8px', border:`1px solid ${T.border}`, borderRadius:5, fontSize:12,
              background:T.surface, color:T.text, maxWidth:280, fontFamily:T.font }}>
            {groups.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:T.textSec, cursor:'pointer' }}>
          <input type='checkbox' checked={onlyEnabled} onChange={e => setOnlyEnabled(e.target.checked)} />
          Enabled only
        </label>
        <button onClick={exportCsv} style={{ marginLeft:'auto', padding:'7px 16px', background:T.navy,
          color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>
          Export Directory CSV
        </button>
      </div>

      <Card>
        <div style={{ overflowX:'auto', maxHeight:560, overflowY:'auto' }}>
          <table style={{ borderCollapse:'collapse', width:'100%' }}>
            <thead><tr>
              <th style={th}>Module</th><th style={th}>Code</th><th style={th}>Domain Group</th>
              <th style={th}>Capabilities</th><th style={th}>Access</th><th style={th}>Status</th><th style={th}></th>
            </tr></thead>
            <tbody>
              {rows.map(m => (
                <tr key={m.route} style={{ opacity: m.enabled ? 1 : 0.45 }}>
                  <td style={{ ...td, fontWeight:600, whiteSpace:'nowrap' }}>{m.label}</td>
                  <td style={{ ...td, color:T.textMut, fontSize:11 }}>{m.code || '—'}</td>
                  <td style={{ ...td, whiteSpace:'nowrap' }}>{m.group_icon} {m.nav_group}</td>
                  <td style={{ ...td, fontSize:11, color:T.textSec, maxWidth:340 }}>{m.badge || ''}</td>
                  <td style={td}><Pill text={m.access_level} color={accessColor(m.access_level)} /></td>
                  <td style={td}>
                    <Pill text={m.enabled ? 'enabled' : 'disabled'} color={m.enabled ? T.green : T.red} />
                  </td>
                  <td style={td}>
                    {m.enabled ? (
                      <Link to={m.route} onClick={() => logModuleOpen(m.route)}
                        style={{ fontSize:11.5, fontWeight:700, color:T.navyL, textDecoration:'none' }}>
                        Open →
                      </Link>
                    ) : <span style={{ fontSize:11, color:T.textMut }}>off</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize:10.5, color:T.textMut, marginTop:8 }}>
          {rows.length} of {registry.modules.length} modules · registry source:{' '}
          <b style={{ color: registry.source === 'supabase' ? T.green : T.amber }}>{registry.source}</b>
          {registry.source === 'static' && ' (offline fallback — DB unreachable, showing build-time catalog)'}
          {' · '}access flags are edited in the Supabase dashboard (platform_module_access) and apply to everyone instantly.
        </div>
      </Card>
    </div>
  );
};

// ── TAB 2: ACCESS MATRIX ──────────────────────────────────────────────────────
const MatrixTab = ({ registry }) => {
  const byGroup = useMemo(() => {
    const map = {};
    registry.modules.forEach(m => {
      const g = map[m.nav_group] || (map[m.nav_group] = { group: m.nav_group, icon: m.group_icon, total:0, enabled:0, open:0, team:0, admin:0 });
      g.total++;
      if (m.enabled) g.enabled++;
      g[m.access_level] = (g[m.access_level] || 0) + 1;
    });
    return Object.values(map);
  }, [registry]);

  const chart = byGroup.map(g => ({ name: g.group.length > 22 ? g.group.slice(0, 20) + '…' : g.group, modules: g.total }));

  return (
    <div>
      <Card title='Modules per Domain Group' sub='Full platform surface shared with the team' style={{ marginBottom:16 }}>
        <ResponsiveContainer width='100%' height={Math.max(300, byGroup.length * 18)}>
          <BarChart data={chart} layout='vertical' margin={{ top:5, right:20, left:150, bottom:5 }}>
            <XAxis type='number' tick={{ fontSize:10, fill:T.textSec }} allowDecimals={false} />
            <YAxis type='category' dataKey='name' tick={{ fontSize:9.5, fill:T.textSec }} width={150} />
            <Tooltip contentStyle={{ fontSize:12 }} />
            <Bar dataKey='modules' radius={[0,4,4,0]}>
              {chart.map((e, i) => <Cell key={i} fill={i % 2 ? T.navyL : T.sage} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title='Access Matrix by Group' sub='open = no restriction · team = all team members (default) · admin = restricted; disabled modules are hidden from use'>
        <div style={{ overflowX:'auto' }}>
          <table style={{ borderCollapse:'collapse', width:'100%' }}>
            <thead><tr>
              <th style={th}>Domain Group</th><th style={th}>Modules</th><th style={th}>Enabled</th>
              <th style={th}>Open</th><th style={th}>Team</th><th style={th}>Admin</th><th style={th}>Coverage</th>
            </tr></thead>
            <tbody>
              {byGroup.map(g => (
                <tr key={g.group}>
                  <td style={{ ...td, fontWeight:600 }}>{g.icon} {g.group}</td>
                  <td style={td}>{g.total}</td>
                  <td style={{ ...td, color: g.enabled === g.total ? T.green : T.amber, fontWeight:700 }}>{g.enabled}</td>
                  <td style={td}>{g.open || 0}</td>
                  <td style={td}>{g.team || 0}</td>
                  <td style={td}>{g.admin || 0}</td>
                  <td style={{ ...td, minWidth:120 }}>
                    <div style={{ height:7, background:T.surfaceH, borderRadius:4 }}>
                      <div style={{ width:`${(g.enabled / g.total) * 100}%`, height:7, borderRadius:4,
                        background: g.enabled === g.total ? T.sage : T.gold }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ── TAB 3: DEPLOYMENT & CONNECTIVITY ──────────────────────────────────────────
const DeploymentTab = ({ registry, deployments, usage }) => {
  const [ping, setPing] = useState(null);
  const cfg = supabaseConfig();

  useEffect(() => { sbPing().then(setPing); }, []);

  const steps = [
    ['Import the GitHub repo in Vercel', 'vercel.com/new → select sustainability-platform-v2 → root vercel.json is picked up automatically (CRA build + SPA rewrites)'],
    ['Every module route works remotely', 'The catch-all rewrite serves index.html for all ' + registry.modules.length + ' routes — deep links like /climate-collateral-framework resolve directly'],
    ['(Optional) set Supabase env vars', 'REACT_APP_SUPABASE_URL + REACT_APP_SUPABASE_ANON_KEY — defaults for the team "New App" project are baked in, so this is only needed to point elsewhere'],
    ['Record the deployment', 'Insert a row into platform_deployments (Supabase dashboard) so this panel shows the canonical team URL'],
    ['Share the URL', 'Team members open any module remotely; module opens are logged to platform_module_usage'],
  ];

  return (
    <div>
      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <Stat label='Team DB' value={ping ? (ping.ok ? 'Connected' : 'Unreachable') : 'Checking…'}
          color={ping ? (ping.ok ? T.green : T.red) : T.textMut}
          sub={ping ? (ping.ok ? `${ping.ms}ms · ${cfg.url.replace('https://','')}` : ping.error) : ''} />
        <Stat label='Registry Source' value={registry.source === 'supabase' ? 'Live DB' : 'Static'}
          color={registry.source === 'supabase' ? T.green : T.amber}
          sub={registry.source === 'supabase' ? 'platform_modules table' : 'Build-time fallback catalog'} />
        <Stat label='Key Source' value={cfg.keySource === 'environment' ? 'Env Var' : 'Default'}
          sub='Publishable key · RLS read-only' />
        <Stat label='Usage Events' value={usage.total} sub='Module opens logged (last 500)' />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Card title='Remote Access — Deployment Runbook' sub='From repo to a URL every team member can open'>
          {steps.map(([t, d], i) => (
            <div key={t} style={{ display:'flex', gap:12, padding:'9px 0', borderBottom:`1px solid ${T.border}` }}>
              <div style={{ width:24, height:24, borderRadius:12, background:T.navy, color:'#fff', fontSize:12,
                fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i + 1}</div>
              <div>
                <div style={{ fontSize:12.5, fontWeight:700, color:T.navy }}>{t}</div>
                <div style={{ fontSize:11.5, color:T.textSec, lineHeight:1.5 }}>{d}</div>
              </div>
            </div>
          ))}
          <div style={{ fontSize:11, color:T.textSec, marginTop:10, fontStyle:'italic' }}>
            Full guide: TEAM_DEPLOYMENT_GUIDE.md in the repo root.
          </div>
        </Card>

        <Card title='Registered Deployments' sub='platform_deployments — canonical URLs for remote access'>
          {deployments.length === 0 && (
            <div style={{ fontSize:12, color:T.textMut, padding:'20px 0', textAlign:'center' }}>
              No deployments recorded yet — add a row after the first Vercel deploy.
            </div>
          )}
          {deployments.map(d => (
            <div key={d.id} style={{ padding:'10px 0', borderBottom:`1px solid ${T.border}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Pill text={d.environment} color={d.environment === 'production' ? T.green : T.amber} />
                <a href={d.url} target='_blank' rel='noreferrer'
                  style={{ fontSize:13, fontWeight:700, color:T.navyL }}>{d.url}</a>
              </div>
              <div style={{ fontSize:11, color:T.textSec, marginTop:3 }}>
                {d.git_branch && <>branch <b>{d.git_branch}</b> · </>}
                {d.git_commit && <>commit <b>{String(d.git_commit).slice(0, 7)}</b> · </>}
                {new Date(d.deployed_at).toLocaleString()} {d.notes && <>· {d.notes}</>}
              </div>
            </div>
          ))}
          {usage.top.length > 0 && (
            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:11, color:T.textMut, fontWeight:700, textTransform:'uppercase', marginBottom:6 }}>
                Most-Opened Modules
              </div>
              {usage.top.map(u => (
                <div key={u.route} style={{ display:'flex', justifyContent:'space-between', fontSize:11.5,
                  padding:'3px 0', color:T.textSec }}>
                  <span>{u.route}</span><b style={{ color:T.navy }}>{u.opens}</b>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title='Data Architecture' sub='How every module reaches the shared team database'>
        <table style={{ borderCollapse:'collapse', width:'100%' }}>
          <thead><tr><th style={th}>Table</th><th style={th}>Purpose</th><th style={th}>App Permissions (RLS)</th></tr></thead>
          <tbody>
            {[
              ['platform_modules', 'Canonical catalog of all modules/workflows (synced from App.js NAV_GROUPS)', 'read'],
              ['platform_module_access', 'Team-shared access level + enable/disable kill-switch per module', 'read'],
              ['platform_module_usage', 'Append-only usage pings from the deployed app', 'read + insert'],
              ['platform_deployments', 'Registry of deployed URLs for remote team access', 'read'],
              ['dme_* / esrs_* / pcaf_* / repo_*', 'Existing domain datasets already used by backend engines', 'per existing setup'],
            ].map(([t2, p, perm]) => (
              <tr key={t2}>
                <td style={{ ...td, fontFamily:'monospace', fontSize:11.5, fontWeight:700 }}>{t2}</td>
                <td style={{ ...td, color:T.textSec }}>{p}</td>
                <td style={td}><Pill text={perm} color={perm === 'read' ? T.navyL : perm === 'read + insert' ? T.sage : T.textMut} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize:11, color:T.textSec, marginTop:10, lineHeight:1.5 }}>
          Writes (access changes, deployment records, module status) are made through the Supabase dashboard,
          which every team member already has access to — changes propagate to all deployed clients on next load.
        </div>
      </Card>
    </div>
  );
};

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
const TeamAccessHubPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [registry, setRegistry] = useState({ source:'static', modules: [] });
  const [deployments, setDeployments] = useState([]);
  const [usage, setUsage] = useState({ total:0, top:[], recent:[] });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([fetchModuleRegistry(), fetchDeployments(), fetchUsageSummary()]).then(([r, d, u]) => {
      setRegistry(r); setDeployments(d); setUsage(u); setLoaded(true);
    });
  }, []);

  const groups = new Set(registry.modules.map(m => m.nav_group)).size;
  const enabled = registry.modules.filter(m => m.enabled).length;

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, padding:'24px' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:700, color:T.navy, marginBottom:4 }}>
          Team Access Hub
        </div>
        <div style={{ fontSize:13, color:T.textSec }}>
          Every module & workflow on the platform · shared access control from the team Supabase DB ·
          remote deployment status & runbook
        </div>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <Stat label='Modules & Workflows' value={loaded ? registry.modules.length : '…'} sub={`${groups} domain groups`} />
        <Stat label='Enabled for Team' value={loaded ? enabled : '…'} color={T.green}
          sub={loaded && enabled < registry.modules.length ? `${registry.modules.length - enabled} disabled` : 'Full platform'} />
        <Stat label='Registry' value={registry.source === 'supabase' ? 'Live' : loaded ? 'Fallback' : '…'}
          color={registry.source === 'supabase' ? T.green : T.amber} sub='platform_modules (Supabase)' />
        <Stat label='Deployments' value={loaded ? deployments.length : '…'} sub='Registered remote URLs' />
      </div>

      <div style={{ display:'flex', gap:4, background:T.surface, border:`1px solid ${T.border}`,
        borderRadius:8, padding:4, marginBottom:20, width:'fit-content' }}>
        {['Module Directory', 'Access Matrix', 'Deployment & Connectivity'].map((t, i) => (
          <Tab key={t} label={t} active={activeTab === i} onClick={() => setActiveTab(i)} />
        ))}
      </div>

      <div>
        {activeTab === 0 && <DirectoryTab registry={registry} />}
        {activeTab === 1 && <MatrixTab registry={registry} />}
        {activeTab === 2 && <DeploymentTab registry={registry} deployments={deployments} usage={usage} />}
      </div>
    </div>
  );
};

export default TeamAccessHubPage;
