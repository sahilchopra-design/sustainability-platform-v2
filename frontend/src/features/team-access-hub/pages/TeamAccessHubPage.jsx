import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import useAdminApi from '../../admin-panel/hooks/useAdminApi';
import { MODULE_REGISTRY, ALL_MODULE_PATHS, TOTAL_MODULES } from '../../admin-panel/data/moduleRegistry';
import { useAuth } from '../../../context/AuthContext';

// ═══════════════════════════════════════════════════════════════════════════════
//  TEAM ACCESS HUB (EP-OPS1)
//  One place for the whole team: every module and workflow on the platform,
//  its REAL access state from the RBAC backend (same source of truth as
//  /admin), a live per-module enable/disable kill-switch, per-user and
//  bulk access assignment, and real usage analytics.
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

const Btn = ({ children, onClick, variant='primary', size='md', disabled, style }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: size === 'sm' ? '5px 11px' : '8px 16px',
    background: disabled ? T.surfaceH : variant === 'primary' ? T.navy : variant === 'danger' ? T.red : 'transparent',
    color: disabled ? T.textMut : variant === 'secondary' ? T.navy : '#fff',
    border: variant === 'secondary' ? `1px solid ${T.border}` : 'none',
    borderRadius: 6, fontSize: size === 'sm' ? 11.5 : 12.5, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: T.font, whiteSpace: 'nowrap',
    ...style,
  }}>{children}</button>
);

const th = { textAlign:'left', padding:'7px 10px', fontSize:10.5, color:T.textMut, fontWeight:700,
  textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:`2px solid ${T.border}`, whiteSpace:'nowrap' };
const td = { padding:'7px 10px', fontSize:12, color:T.text, borderBottom:`1px solid ${T.border}` };

// ── TAB 1: MODULE DIRECTORY ───────────────────────────────────────────────────
const DirectoryTab = ({ disabledSet, isSuperAdmin, onToggle }) => {
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('All');
  const [onlyEnabled, setOnlyEnabled] = useState(false);

  const groups = useMemo(() => ['All', ...MODULE_REGISTRY.map(g => g.group)], []);

  const flatModules = useMemo(() => MODULE_REGISTRY.flatMap(g =>
    g.modules.map(m => ({ ...m, nav_group: g.group, group_icon: g.icon, group_color: g.color }))
  ), []);

  const rows = useMemo(() => flatModules.filter(m => {
    const enabled = !disabledSet.has(m.path);
    if (group !== 'All' && m.nav_group !== group) return false;
    if (onlyEnabled && !enabled) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!m.label.toLowerCase().includes(q) && !m.path.includes(q) &&
          !(m.code || '').toLowerCase().includes(q) && !(m.badge || '').toLowerCase().includes(q)) return false;
    }
    return true;
  }), [flatModules, search, group, onlyEnabled, disabledSet]);

  const exportCsv = () => {
    const header = 'route,label,code,nav_group,enabled';
    const lines = flatModules.map(m =>
      [m.path, `"${m.label}"`, m.code || '', `"${m.nav_group}"`, !disabledSet.has(m.path)].join(','));
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
              <th style={th}>Capabilities</th><th style={th}>Status</th><th style={th}></th><th style={th}></th>
            </tr></thead>
            <tbody>
              {rows.map(m => {
                const enabled = !disabledSet.has(m.path);
                return (
                  <tr key={m.path} style={{ opacity: enabled ? 1 : 0.55 }}>
                    <td style={{ ...td, fontWeight:600, whiteSpace:'nowrap' }}>{m.label}</td>
                    <td style={{ ...td, color:T.textMut, fontSize:11 }}>{m.code || '—'}</td>
                    <td style={{ ...td, whiteSpace:'nowrap' }}>{m.group_icon} {m.nav_group}</td>
                    <td style={{ ...td, fontSize:11, color:T.textSec, maxWidth:340 }}>{m.badge || ''}</td>
                    <td style={td}>
                      <Pill text={enabled ? 'enabled' : 'disabled'} color={enabled ? T.green : T.red} />
                    </td>
                    <td style={td}>
                      {isSuperAdmin && (
                        <Btn size="sm" variant={enabled ? 'danger' : 'secondary'}
                          onClick={() => onToggle(m.path, !enabled)}>
                          {enabled ? 'Disable' : 'Enable'}
                        </Btn>
                      )}
                    </td>
                    <td style={td}>
                      {enabled ? (
                        <Link to={m.path} style={{ fontSize:11.5, fontWeight:700, color:T.navyL, textDecoration:'none' }}>
                          Open →
                        </Link>
                      ) : <span style={{ fontSize:11, color:T.textMut }}>off</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize:10.5, color:T.textMut, marginTop:8 }}>
          {rows.length} of {flatModules.length} modules · registry source: <b style={{ color:T.green }}>live (navGroups.js)</b>
          {' · '}enable/disable is enforced server-side for every user except super_admin.
        </div>
      </Card>
    </div>
  );
};

// ── TAB 2: ACCESS MATRIX ──────────────────────────────────────────────────────
const MatrixTab = ({ disabledSet }) => {
  const byGroup = useMemo(() => MODULE_REGISTRY.map(g => {
    const total = g.modules.length;
    const disabled = g.modules.filter(m => disabledSet.has(m.path)).length;
    return { group: g.group, icon: g.icon, total, enabled: total - disabled, disabled };
  }), [disabledSet]);

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

      <Card title='Enable / Disable Matrix by Group' sub='Live kill-switch state — disabled modules are blocked for everyone except super_admin'>
        <div style={{ overflowX:'auto' }}>
          <table style={{ borderCollapse:'collapse', width:'100%' }}>
            <thead><tr>
              <th style={th}>Domain Group</th><th style={th}>Modules</th>
              <th style={th}>Enabled</th><th style={th}>Disabled</th><th style={th}>Coverage</th>
            </tr></thead>
            <tbody>
              {byGroup.map(g => (
                <tr key={g.group}>
                  <td style={{ ...td, fontWeight:600 }}>{g.icon} {g.group}</td>
                  <td style={td}>{g.total}</td>
                  <td style={{ ...td, color: g.enabled === g.total ? T.green : T.amber, fontWeight:700 }}>{g.enabled}</td>
                  <td style={{ ...td, color: g.disabled > 0 ? T.red : T.textMut }}>{g.disabled}</td>
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

// ── Compact module picker (shared by single-user & bulk assign) ──────────────
const MiniModulePicker = ({ selected, onChange }) => {
  const [search, setSearch] = useState('');
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const filtered = useMemo(() => {
    if (!search) return MODULE_REGISTRY;
    const q = search.toLowerCase();
    return MODULE_REGISTRY.map(g => ({ ...g, modules: g.modules.filter(m => m.label.toLowerCase().includes(q)) }))
      .filter(g => g.modules.length > 0);
  }, [search]);

  const toggle = (path) => {
    const next = new Set(selectedSet);
    next.has(path) ? next.delete(path) : next.add(path);
    onChange([...next]);
  };

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:8 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search modules…'
          style={{ flex:1, padding:'6px 10px', border:`1px solid ${T.border}`, borderRadius:5, fontSize:12, fontFamily:T.font }} />
        <Btn size="sm" variant="secondary" onClick={() => onChange([...ALL_MODULE_PATHS])}>All</Btn>
        <Btn size="sm" variant="secondary" onClick={() => onChange([])}>None</Btn>
      </div>
      <div style={{ fontSize:11, color:T.textMut, marginBottom:8 }}>{selectedSet.size} / {TOTAL_MODULES} selected</div>
      <div style={{ maxHeight:340, overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}>
        {filtered.map(g => (
          <div key={g.group}>
            <div style={{ fontSize:11, fontWeight:700, color:T.navy, marginBottom:4 }}>{g.icon} {g.group}</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {g.modules.map(m => (
                <label key={m.path} style={{
                  display:'flex', alignItems:'center', gap:4, cursor:'pointer', fontSize:11,
                  background: selectedSet.has(m.path) ? T.navy + '15' : T.surfaceH,
                  border:`1px solid ${selectedSet.has(m.path) ? T.navyL : T.border}`,
                  borderRadius:4, padding:'3px 7px', color: selectedSet.has(m.path) ? T.navyL : T.textSec,
                }}>
                  <input type='checkbox' checked={selectedSet.has(m.path)} onChange={() => toggle(m.path)} />
                  {m.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ROLE_OPTIONS = ['viewer', 'demo', 'team_member', 'partner', 'super_admin'];

// ── Add Team Member (create user directly from Team Access Hub) ──────────────
const AddMemberForm = ({ createUser, onClose }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('team_member');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [created, setCreated] = useState(null); // { email, generated_password }

  const submit = async () => {
    if (!email || !name) { setErr('Name and email are required.'); return; }
    setSaving(true);
    setErr('');
    try {
      const res = await createUser({ email, name, role });
      setCreated(res);
    } catch (e) {
      setErr(e?.response?.data?.detail || e.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  if (created) {
    return (
      <Card title='Team Member Created' style={{ marginBottom:16, background:'#f0f9f0' }}>
        <div style={{ fontSize:12.5, color:T.text, marginBottom:8 }}>
          <b>{created.email}</b> can now sign in.
        </div>
        {created.generated_password && (
          <div style={{ fontSize:12, color:T.text, marginBottom:8 }}>
            Temporary password (shown once — share it now):{' '}
            <code style={{ background:T.surfaceH, padding:'2px 8px', borderRadius:4, fontWeight:700 }}>{created.generated_password}</code>
          </div>
        )}
        <div style={{ fontSize:11.5, color:T.textSec, marginBottom:10 }}>
          Pick them from the list below to assign specific modules.
        </div>
        <Btn size='sm' onClick={onClose}>Done</Btn>
      </Card>
    );
  }

  return (
    <Card title='Add Team Member' style={{ marginBottom:16 }}>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
        <div>
          <div style={{ fontSize:11, color:T.textMut, marginBottom:3 }}>Name</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder='Jane Doe'
            style={{ padding:'6px 10px', border:`1px solid ${T.border}`, borderRadius:5, fontSize:12, fontFamily:T.font, width:180 }} />
        </div>
        <div>
          <div style={{ fontSize:11, color:T.textMut, marginBottom:3 }}>Email</div>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder='jane@company.com' type='email'
            style={{ padding:'6px 10px', border:`1px solid ${T.border}`, borderRadius:5, fontSize:12, fontFamily:T.font, width:220 }} />
        </div>
        <div>
          <div style={{ fontSize:11, color:T.textMut, marginBottom:3 }}>Role</div>
          <select value={role} onChange={e => setRole(e.target.value)}
            style={{ padding:'6px 8px', border:`1px solid ${T.border}`, borderRadius:5, fontSize:12, fontFamily:T.font }}>
            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <Btn onClick={submit} disabled={saving}>{saving ? 'Creating…' : 'Create'}</Btn>
        <Btn variant='secondary' onClick={onClose}>Cancel</Btn>
      </div>
      {err && <div style={{ fontSize:11.5, color:T.red, marginTop:8 }}>{err}</div>}
      <div style={{ fontSize:11, color:T.textSec, marginTop:8 }}>
        Creates the account with no modules beyond its role's default — pick them from the list below afterward,
        or use Invites in <Link to='/admin' style={{ color:T.navyL }}>/admin</Link> to let them set their own password.
      </div>
    </Card>
  );
};

// ── TAB 3: USER ACCESS (single-user + bulk assign) ────────────────────────────
const UserAccessTab = ({ users, presets, setUserModules, bulkSetUserModules, createUser, resetPassword, usersError }) => {
  const [mode, setMode] = useState('single'); // single | bulk
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [paths, setPaths] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [resetInfo, setResetInfo] = useState(null); // { new_password } — shown once
  const [resetting, setResetting] = useState(false);

  const doResetPassword = async () => {
    if (!selectedUser) return;
    setResetting(true);
    setResetInfo(null);
    try {
      const res = await resetPassword(selectedUser);
      setResetInfo(res);
    } finally {
      setResetting(false);
    }
  };

  const user = users.find(u => u.user_id === selectedUser);
  const baselinePaths = useMemo(() => {
    if (!user || !user.preset_id) return [];
    const preset = presets.find(p => p.id === user.preset_id);
    return preset ? preset.module_paths || [] : [];
  }, [user, presets]);

  const selectUser = (uid) => {
    setSelectedUser(uid);
    const u = users.find(x => x.user_id === uid);
    const preset = u && u.preset_id ? presets.find(p => p.id === u.preset_id) : null;
    setPaths(preset ? preset.module_paths || [] : []);
    setDirty(false);
    setResetInfo(null);
  };

  const saveSingle = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const baseSet = new Set(baselinePaths);
      const newSet = new Set(paths);
      const grants = paths.filter(p => !baseSet.has(p));
      const denies = baselinePaths.filter(p => !newSet.has(p));
      await setUserModules(selectedUser, grants, denies);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const applyBulk = async () => {
    if (selectedUsers.length === 0) return;
    setSaving(true);
    try {
      await bulkSetUserModules(selectedUsers, paths, []);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    const q = userSearch.toLowerCase();
    return users.filter(u => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
  }, [users, userSearch]);

  const toggleUserSel = (uid) => {
    setSelectedUsers(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]);
    setDirty(true);
  };

  return (
    <div>
      {usersError && (
        <div style={{ marginBottom:14, padding:'10px 14px', background:'#fdf4f4', border:`1px solid ${T.red}55`,
          borderRadius:8, fontSize:12, color:T.red }}>
          Couldn't load team members: {usersError}
        </div>
      )}

      <div style={{ display:'flex', gap:12, marginBottom:16, alignItems:'center' }}>
        <Tab label='Single User' active={mode === 'single'} onClick={() => { setMode('single'); setDirty(false); }} />
        <Tab label='Bulk Assign' active={mode === 'bulk'} onClick={() => { setMode('bulk'); setPaths([]); setDirty(false); }} />
        <Btn size='sm' onClick={() => setShowAddMember(v => !v)} style={{ marginLeft:'auto' }}>
          {showAddMember ? 'Close' : '+ Add Team Member'}
        </Btn>
      </div>

      {showAddMember && <AddMemberForm createUser={createUser} onClose={() => setShowAddMember(false)} />}

      {mode === 'single' ? (
        <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:16 }}>
          <Card title='Team Members' sub={`${users.length} total`}>
            <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder='Search…'
              style={{ width:'100%', padding:'6px 10px', border:`1px solid ${T.border}`, borderRadius:5, fontSize:12, marginBottom:8, fontFamily:T.font, boxSizing:'border-box' }} />
            <div style={{ maxHeight:420, overflowY:'auto' }}>
              {filteredUsers.map(u => (
                <div key={u.user_id} onClick={() => selectUser(u.user_id)} style={{
                  padding:'8px 10px', borderRadius:6, cursor:'pointer', marginBottom:3,
                  background: selectedUser === u.user_id ? T.navy : 'transparent',
                  color: selectedUser === u.user_id ? '#fff' : T.text,
                }}>
                  <div style={{ fontSize:12.5, fontWeight:600 }}>{u.name || u.email}</div>
                  <div style={{ fontSize:10.5, opacity:0.75 }}>{u.rbac_role || 'no profile'}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title={user ? `Modules for ${user.name || user.email}` : 'Select a team member'}
            sub={user && user.rbac_role === 'super_admin' ? 'Master Access — all modules always accessible, nothing to configure' : 'Checked = granted on top of / instead of their preset'}>
            {!user && <div style={{ padding:40, textAlign:'center', color:T.textMut, fontSize:13 }}>Pick a team member on the left</div>}
            {user && (
              <div style={{ marginBottom:14, paddingBottom:14, borderBottom:`1px solid ${T.border}` }}>
                {!resetInfo ? (
                  <Btn size='sm' variant='secondary' onClick={doResetPassword} disabled={resetting}>
                    {resetting ? 'Resetting…' : 'Reset Password'}
                  </Btn>
                ) : (
                  <div style={{ fontSize:12, color:T.text }}>
                    New password for {user.email} (shown once — share it now):{' '}
                    <code style={{ background:T.surfaceH, padding:'2px 8px', borderRadius:4, fontWeight:700 }}>{resetInfo.new_password}</code>
                    {' '}<Btn size='sm' variant='secondary' onClick={() => setResetInfo(null)}>Dismiss</Btn>
                  </div>
                )}
              </div>
            )}
            {user && user.rbac_role === 'super_admin' && (
              <div style={{ padding:40, textAlign:'center' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🔓</div>
                <div style={{ color:T.green, fontWeight:700 }}>Master Access</div>
              </div>
            )}
            {user && user.rbac_role !== 'super_admin' && (
              <>
                <MiniModulePicker selected={paths} onChange={(p) => { setPaths(p); setDirty(true); }} />
                {dirty && (
                  <div style={{ marginTop:12, display:'flex', gap:8 }}>
                    <Btn onClick={saveSingle} disabled={saving}>{saving ? 'Saving…' : 'Save Access'}</Btn>
                    <Btn variant='secondary' onClick={() => { setPaths(baselinePaths); setDirty(false); }}>Reset</Btn>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:16 }}>
          <Card title='Select Team Members' sub={`${selectedUsers.length} selected`}>
            <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder='Search…'
              style={{ width:'100%', padding:'6px 10px', border:`1px solid ${T.border}`, borderRadius:5, fontSize:12, marginBottom:8, fontFamily:T.font, boxSizing:'border-box' }} />
            <div style={{ maxHeight:420, overflowY:'auto' }}>
              {filteredUsers.filter(u => u.rbac_role !== 'super_admin').map(u => (
                <label key={u.user_id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', cursor:'pointer' }}>
                  <input type='checkbox' checked={selectedUsers.includes(u.user_id)} onChange={() => toggleUserSel(u.user_id)} />
                  <div>
                    <div style={{ fontSize:12.5, fontWeight:600, color:T.text }}>{u.name || u.email}</div>
                    <div style={{ fontSize:10.5, color:T.textMut }}>{u.rbac_role || 'no profile'}</div>
                  </div>
                </label>
              ))}
            </div>
          </Card>

          <Card title='Module Set to Apply' sub='Replaces each selected user’s individual overrides with exactly this set, on top of their preset'>
            <MiniModulePicker selected={paths} onChange={(p) => { setPaths(p); setDirty(true); }} />
            <div style={{ marginTop:12 }}>
              <Btn onClick={applyBulk} disabled={saving || selectedUsers.length === 0}>
                {saving ? 'Applying…' : `Apply to ${selectedUsers.length} user${selectedUsers.length === 1 ? '' : 's'}`}
              </Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// ── TAB 4: USAGE ANALYTICS ────────────────────────────────────────────────────
const AnalyticsTab = ({ usageSummary, users }) => {
  const [apiStatus, setApiStatus] = useState('checking');
  React.useEffect(() => {
    axios.get('/api/health').then(() => setApiStatus('ok')).catch(() => setApiStatus('down'));
  }, []);

  const chart = (usageSummary.top || []).map(t => ({
    name: t.module_path.length > 26 ? t.module_path.slice(0, 24) + '…' : t.module_path,
    opens: t.opens,
  }));

  return (
    <div>
      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <Stat label='Backend API' value={apiStatus === 'checking' ? 'Checking…' : apiStatus === 'ok' ? 'Connected' : 'Unreachable'}
          color={apiStatus === 'ok' ? T.green : apiStatus === 'down' ? T.red : T.textMut} sub='/api/health' />
        <Stat label='Team Members' value={users.length} sub='rbac_user_profiles' />
        <Stat label='Total Opens Logged' value={usageSummary.total} sub='rbac_module_usage_log (real, RBAC-backed)' />
        <Stat label='Modules Opened' value={(usageSummary.top || []).length} sub='distinct routes in top-15' />
      </div>

      <Card title='Most-Opened Modules' sub='Real usage — logged on every successful module render' style={{ marginBottom:16 }}>
        {chart.length === 0 ? (
          <div style={{ padding:24, textAlign:'center', color:T.textMut, fontSize:12.5 }}>No module opens logged yet.</div>
        ) : (
          <ResponsiveContainer width='100%' height={Math.max(220, chart.length * 24)}>
            <BarChart data={chart} layout='vertical' margin={{ top:5, right:20, left:170, bottom:5 }}>
              <XAxis type='number' tick={{ fontSize:10, fill:T.textSec }} allowDecimals={false} />
              <YAxis type='category' dataKey='name' tick={{ fontSize:9.5, fill:T.textSec }} width={170} />
              <Tooltip contentStyle={{ fontSize:12 }} />
              <Bar dataKey='opens' radius={[0,4,4,0]} fill={T.navyL} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card title='Recent Activity' sub='Last 50 module opens across the team'>
        <div style={{ maxHeight:360, overflowY:'auto' }}>
          <table style={{ borderCollapse:'collapse', width:'100%' }}>
            <thead><tr><th style={th}>Module</th><th style={th}>User</th><th style={th}>Opened At</th></tr></thead>
            <tbody>
              {(usageSummary.recent || []).map((r, i) => (
                <tr key={i}>
                  <td style={{ ...td, fontFamily:'monospace', fontSize:11 }}>{r.module_path}</td>
                  <td style={td}>{r.name || r.email || 'unknown'}</td>
                  <td style={{ ...td, color:T.textSec }}>{r.opened_at ? new Date(r.opened_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
              {(usageSummary.recent || []).length === 0 && (
                <tr><td colSpan={3} style={{ ...td, textAlign:'center', color:T.textMut }}>No activity yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
const TeamAccessHubPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { allowedPaths } = useAuth();
  const isSuperAdmin = allowedPaths === null;
  const {
    users, presets, disabledModules, usageSummary, loading, fieldErrors,
    setUserModules, bulkSetUserModules, toggleModule, createUser, resetPassword,
  } = useAdminApi();

  const disabledSet = useMemo(() => new Set((disabledModules || []).map(d => d.module_path)), [disabledModules]);
  const enabledCount = TOTAL_MODULES - disabledSet.size;

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, padding:'24px' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:700, color:T.navy, marginBottom:4 }}>
          Team Access Hub
        </div>
        <div style={{ fontSize:13, color:T.textSec }}>
          Every module & workflow on the platform · live enable/disable · per-user &amp; bulk access assignment ·
          real usage analytics — all backed by the same RBAC system as /admin
          {isSuperAdmin && <> · <b style={{ color:T.green }}>Master Access — full control</b></>}
        </div>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <Stat label='Modules & Workflows' value={TOTAL_MODULES} sub={`${MODULE_REGISTRY.length} domain groups`} />
        <Stat label='Enabled for Team' value={enabledCount} color={T.green}
          sub={disabledSet.size > 0 ? `${disabledSet.size} disabled` : 'Full platform'} />
        <Stat label='Team Members' value={loading ? '…' : users.length} color={fieldErrors.users ? T.red : undefined}
          sub={fieldErrors.users ? 'Failed to load — see User Access tab' : 'rbac_user_profiles'} />
        <Stat label='Modules Opened (logged)' value={loading ? '…' : usageSummary.total} sub='rbac_module_usage_log' />
      </div>

      <div style={{ display:'flex', gap:4, background:T.surface, border:`1px solid ${T.border}`,
        borderRadius:8, padding:4, marginBottom:20, width:'fit-content', flexWrap:'wrap' }}>
        {['Module Directory', 'Access Matrix', 'User Access', 'Usage Analytics'].map((t, i) => (
          <Tab key={t} label={t} active={activeTab === i} onClick={() => setActiveTab(i)} />
        ))}
      </div>

      {!isSuperAdmin && activeTab === 2 && (
        <div style={{ marginBottom:14, padding:'10px 14px', background:T.gold + '22', border:`1px solid ${T.gold}`,
          borderRadius:8, fontSize:12, color:T.text }}>
          User Access management requires Master Access (super_admin). You can still browse the directory and matrix.
        </div>
      )}

      <div>
        {activeTab === 0 && <DirectoryTab disabledSet={disabledSet} isSuperAdmin={isSuperAdmin} onToggle={toggleModule} />}
        {activeTab === 1 && <MatrixTab disabledSet={disabledSet} />}
        {activeTab === 2 && (
          isSuperAdmin
            ? <UserAccessTab users={users} presets={presets} setUserModules={setUserModules} bulkSetUserModules={bulkSetUserModules}
                createUser={createUser} resetPassword={resetPassword} usersError={fieldErrors.users} />
            : <Card><div style={{ padding:24, textAlign:'center', color:T.textMut }}>Master Access required.</div></Card>
        )}
        {activeTab === 3 && <AnalyticsTab usageSummary={usageSummary} users={users} />}
      </div>
    </div>
  );
};

export default TeamAccessHubPage;
