import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

// ─── Theme ───────────────────────────────────────────────────────────────────
const T = {
  navy: '#1a2332',
  gold: '#d4a843',
  bg: '#faf8f4',
  card: 'rgba(255,255,255,0.92)',
  border: 'rgba(26,35,50,0.12)',
  text: '#1a2332',
  textSec: '#5a6a7a',
  green: '#065f46',
  blue: '#1d4ed8',
  red: '#dc2626',
  mono: "'JetBrains Mono', monospace",
};

// ─── Role config ─────────────────────────────────────────────────────────────
const ROLES = ['super_admin', 'team_member', 'partner', 'demo', 'viewer'];
const ROLE_LABELS = {
  super_admin: 'Super Admin',
  team_member: 'Team Member',
  partner: 'Partner',
  demo: 'Demo',
  viewer: 'Viewer',
};
const ROLE_COLORS = {
  super_admin: { bg: 'rgba(212,168,67,0.15)', text: '#92620a', border: 'rgba(212,168,67,0.4)' },
  team_member: { bg: 'rgba(29,78,216,0.1)', text: '#1d4ed8', border: 'rgba(29,78,216,0.3)' },
  partner: { bg: 'rgba(6,95,70,0.1)', text: '#065f46', border: 'rgba(6,95,70,0.3)' },
  demo: { bg: 'rgba(109,40,217,0.1)', text: '#6d28d9', border: 'rgba(109,40,217,0.3)' },
  viewer: { bg: 'rgba(100,116,139,0.1)', text: '#475569', border: 'rgba(100,116,139,0.3)' },
};

const DURATION_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
  { label: '60 days', value: 60 },
  { label: '90 days', value: 90 },
  { label: 'Unlimited', value: null },
];

// Common module paths grouped by domain — used as a pick helper in the Presets form
const COMMON_PATHS = [
  { group: 'SFDR', paths: ['/sfdr-classification', '/sfdr-pai', '/sfdr-art9', '/sfdr-v2', '/sfdr-pai-dashboard'] },
  { group: 'CSRD', paths: ['/csrd-dma', '/csrd-xbrl', '/csrd-esrs-full', '/csrd-esrs-automation'] },
  { group: 'ISSB', paths: ['/issb-tcfd', '/issb-materiality', '/issb-disclosure'] },
  { group: 'Paris / Temperature', paths: ['/paris-alignment', '/portfolio-temperature-score', '/temperature-alignment'] },
  { group: 'Portfolio', paths: ['/pcaf-financed-emissions', '/eu-taxonomy', '/green-bond-analytics'] },
  { group: 'Physical Risk', paths: ['/physical-risk-portfolio', '/physical-hazard-map', '/water-risk-analytics'] },
];

// Flatten for the search dropdown
const ALL_COMMON_PATHS = COMMON_PATHS.flatMap(g => g.paths.map(p => ({ path: p, group: g.group })));

// Test/demo email domains to identify bulk-revokable users
const TEST_DOMAINS = ['@test.', '@test.local', '@demo.com', '@a2intel.com'];

// ─── Shared sub-components ───────────────────────────────────────────────────
function RoleBadge({ role }) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.viewer;
  return (
    <span style={{
      background: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

function ErrorMsg({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      background: 'rgba(220,38,38,0.08)',
      border: '1px solid rgba(220,38,38,0.25)',
      borderRadius: 6,
      padding: '10px 14px',
      fontSize: 13,
      color: T.red,
      marginBottom: 12,
    }}>
      {msg}
    </div>
  );
}

function SuccessMsg({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      background: 'rgba(6,95,70,0.08)',
      border: '1px solid rgba(6,95,70,0.25)',
      borderRadius: 6,
      padding: '10px 14px',
      fontSize: 13,
      color: T.green,
      marginBottom: 12,
    }}>
      {msg}
    </div>
  );
}

function InputField({ label, type = 'text', value, onChange, placeholder, disabled, style }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 600,
          color: T.textSec,
          marginBottom: 5,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: 6,
          border: `1px solid ${T.border}`,
          background: disabled ? '#f5f4f1' : '#fff',
          color: T.text,
          fontSize: 13,
          fontFamily: "'DM Sans', sans-serif",
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, disabled }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 600,
          color: T.textSec,
          marginBottom: 5,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        }}>
          {label}
        </label>
      )}
      <select
        value={value === null || value === undefined ? '' : value}
        onChange={onChange}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: 6,
          border: `1px solid ${T.border}`,
          background: disabled ? '#f5f4f1' : '#fff',
          color: T.text,
          fontSize: 13,
          fontFamily: "'DM Sans', sans-serif",
          outline: 'none',
          boxSizing: 'border-box',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {options.map(opt => (
          <option key={String(opt.value)} value={opt.value === null ? '' : opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Btn({ children, onClick, variant = 'primary', small, disabled, style, type }) {
  const base = {
    padding: small ? '5px 12px' : '9px 18px',
    borderRadius: 6,
    border: 'none',
    fontSize: small ? 12 : 13,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'opacity 0.15s',
    opacity: disabled ? 0.5 : 1,
    ...style,
  };
  const variants = {
    primary: { background: T.navy, color: '#fff' },
    gold: { background: T.gold, color: T.navy },
    danger: { background: 'rgba(220,38,38,0.1)', color: T.red, border: '1px solid rgba(220,38,38,0.25)' },
    ghost: { background: 'transparent', color: T.textSec, border: `1px solid ${T.border}` },
    green: { background: 'rgba(6,95,70,0.1)', color: T.green, border: '1px solid rgba(6,95,70,0.25)' },
    orange: { background: 'rgba(234,88,12,0.1)', color: '#c2410c', border: '1px solid rgba(234,88,12,0.25)' },
  };
  return (
    <button type={type || 'button'} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

// Access type badge for overrides display
function AccessTypeBadge({ type }) {
  const granted = type === 'grant';
  return (
    <span style={{
      background: granted ? 'rgba(6,95,70,0.1)' : 'rgba(220,38,38,0.08)',
      color: granted ? T.green : T.red,
      border: `1px solid ${granted ? 'rgba(6,95,70,0.25)' : 'rgba(220,38,38,0.2)'}`,
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    }}>
      {granted ? 'Grant' : 'Deny'}
    </span>
  );
}

// ─── Tab: Users ──────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Create user form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    name: '',
    password: '',
    rbac_role: 'viewer',
    display_org: '',
    access_duration_days: 30,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Inline edit panel
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({ rbac_role: '', display_org: '', access_duration_days: 30 });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/v1/admin/rbac/users', { withCredentials: true });
      setUsers(res.data?.users || res.data || []);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleStatus = async (u) => {
    setActionLoading(u.user_id);
    setActionError('');
    setActionSuccess('');
    try {
      await axios.patch(
        `/api/v1/admin/rbac/users/${u.user_id}`,
        { is_active: !u.is_active },
        { withCredentials: true }
      );
      setUsers(prev => prev.map(x => x.user_id === u.user_id ? { ...x, is_active: !x.is_active } : x));
    } catch (err) {
      setActionError(err?.response?.data?.detail || 'Failed to update user.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (u) => {
    if (!window.confirm(`Revoke access for ${u.email}? This cannot be undone.`)) return;
    setActionLoading(u.user_id);
    setActionError('');
    setActionSuccess('');
    try {
      await axios.delete(`/api/v1/admin/rbac/users/${u.user_id}/revoke`, { withCredentials: true });
      setUsers(prev => prev.filter(x => x.user_id !== u.user_id));
      setActionSuccess(`Access revoked for ${u.email}.`);
    } catch (err) {
      setActionError(err?.response?.data?.detail || 'Failed to revoke access.');
    } finally {
      setActionLoading(null);
    }
  };

  const testUsers = users.filter(u =>
    TEST_DOMAINS.some(d => u.email && u.email.includes(d))
  );

  const handleClearTestUsers = async () => {
    if (!window.confirm(`Bulk-revoke ${testUsers.length} test/demo user(s)? This cannot be undone.`)) return;
    setActionError('');
    setActionSuccess('');
    let revoked = 0;
    for (const u of testUsers) {
      try {
        await axios.delete(`/api/v1/admin/rbac/users/${u.user_id}/revoke`, { withCredentials: true });
        revoked++;
      } catch {
        // continue with remaining users
      }
    }
    setActionSuccess(`Revoked ${revoked} of ${testUsers.length} test/demo user(s).`);
    await fetchUsers();
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!createForm.email) { setCreateError('Email is required.'); return; }
    if (!createForm.password) { setCreateError('Password is required.'); return; }
    setCreating(true);
    setCreateError('');
    try {
      await axios.post('/api/v1/admin/rbac/users', {
        email: createForm.email.trim(),
        name: createForm.name.trim() || undefined,
        password: createForm.password,
        rbac_role: createForm.rbac_role,
        display_org: createForm.display_org.trim() || undefined,
        access_duration_days: createForm.access_duration_days ? Number(createForm.access_duration_days) : null,
      }, { withCredentials: true });
      setShowCreateForm(false);
      setCreateForm({ email: '', name: '', password: '', rbac_role: 'viewer', display_org: '', access_duration_days: 30 });
      setActionSuccess('User created successfully.');
      await fetchUsers();
    } catch (err) {
      setCreateError(err?.response?.data?.detail || 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (u) => {
    setEditingUserId(u.user_id);
    setEditForm({
      rbac_role: u.rbac_role || u.role || 'viewer',
      display_org: u.display_org || u.org_name || '',
      access_duration_days: u.access_duration_days || 30,
    });
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    setActionError('');
    setActionSuccess('');
    try {
      await axios.patch(`/api/v1/admin/rbac/users/${editingUserId}`, {
        rbac_role: editForm.rbac_role,
        display_org: editForm.display_org.trim() || undefined,
        access_duration_days: editForm.access_duration_days ? Number(editForm.access_duration_days) : null,
      }, { withCredentials: true });
      setEditingUserId(null);
      setActionSuccess('User updated successfully.');
      await fetchUsers();
    } catch (err) {
      setEditError(err?.response?.data?.detail || 'Failed to update user.');
    } finally {
      setEditLoading(false);
    }
  };

  const filtered = users.filter(u =>
    !search || [u.name, u.email, u.display_org, u.org_name, u.rbac_role]
      .some(v => v && v.toLowerCase().includes(search.toLowerCase()))
  );

  const colStyle = (w) => ({
    padding: '10px 14px',
    fontSize: 13,
    color: T.text,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: w,
    borderBottom: `1px solid ${T.border}`,
  });

  const headStyle = {
    padding: '8px 14px',
    fontSize: 11,
    fontWeight: 700,
    color: T.textSec,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    background: '#f3f1ec',
    borderBottom: `1px solid ${T.border}`,
    whiteSpace: 'nowrap',
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, org, or role…"
          style={{
            flex: 1,
            minWidth: 200,
            padding: '8px 14px',
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            fontSize: 13,
            outline: 'none',
            fontFamily: "'DM Sans', sans-serif",
            color: T.text,
          }}
        />
        <Btn
          onClick={() => { setShowCreateForm(v => !v); setCreateError(''); }}
          variant="gold"
          small
        >
          {showCreateForm ? '✕ Cancel' : '+ Create User'}
        </Btn>
        {testUsers.length > 0 && (
          <Btn onClick={handleClearTestUsers} variant="orange" small>
            Clear Test Users ({testUsers.length})
          </Btn>
        )}
        <Btn onClick={fetchUsers} variant="ghost" small>Refresh</Btn>
      </div>

      {/* Create user form */}
      {showCreateForm && (
        <div style={{
          background: '#faf9f6',
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          padding: '20px 20px 16px',
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>
            Create New User
          </div>
          <ErrorMsg msg={createError} />
          <form onSubmit={handleCreateUser}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
              <InputField
                label="Email Address *"
                type="email"
                value={createForm.email}
                onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                placeholder="user@example.com"
                disabled={creating}
              />
              <InputField
                label="Full Name"
                value={createForm.name}
                onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Jane Smith"
                disabled={creating}
              />
              <InputField
                label="Password *"
                type="password"
                value={createForm.password}
                onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Min 8 characters"
                disabled={creating}
              />
              <SelectField
                label="Role"
                value={createForm.rbac_role}
                onChange={e => setCreateForm(p => ({ ...p, rbac_role: e.target.value }))}
                options={ROLES.map(r => ({ label: ROLE_LABELS[r], value: r }))}
                disabled={creating}
              />
              <InputField
                label="Org / Client Name"
                value={createForm.display_org}
                onChange={e => setCreateForm(p => ({ ...p, display_org: e.target.value }))}
                placeholder="Acme Capital"
                disabled={creating}
              />
              <SelectField
                label="Access Duration"
                value={createForm.access_duration_days}
                onChange={e => setCreateForm(p => ({
                  ...p,
                  access_duration_days: e.target.value === '' ? null : Number(e.target.value),
                }))}
                options={DURATION_OPTIONS.map(d => ({ label: d.label, value: d.value === null ? '' : d.value }))}
                disabled={creating}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn type="submit" variant="primary" disabled={creating}>
                {creating ? 'Creating…' : 'Create User'}
              </Btn>
              <Btn onClick={() => setShowCreateForm(false)} variant="ghost" disabled={creating}>
                Cancel
              </Btn>
            </div>
          </form>
        </div>
      )}

      <ErrorMsg msg={actionError} />
      <SuccessMsg msg={actionSuccess} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: T.textSec, fontSize: 14 }}>
          Loading users…
        </div>
      ) : error ? (
        <ErrorMsg msg={error} />
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${T.border}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Name', 'Email', 'Role', 'Org / Client', 'Expires', 'Status', 'Actions'].map(h => (
                  <th key={h} style={headStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: T.textSec, fontSize: 13 }}>
                    {search ? 'No users match your search.' : 'No users found.'}
                  </td>
                </tr>
              ) : filtered.map((u, i) => {
                const isActing = actionLoading === u.user_id;
                const isEditing = editingUserId === u.user_id;
                const rowBg = i % 2 === 0 ? '#fff' : '#faf9f6';
                const expires = u.access_expires_at
                  ? new Date(u.access_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—';
                return (
                  <React.Fragment key={u.user_id}>
                    <tr style={{ background: rowBg }}>
                      <td style={colStyle(160)}>{u.name || '—'}</td>
                      <td style={{ ...colStyle(220), fontFamily: T.mono, fontSize: 12 }}>{u.email}</td>
                      <td style={{ ...colStyle(120), padding: '10px 14px' }}>
                        <RoleBadge role={u.rbac_role || u.role} />
                      </td>
                      <td style={colStyle(160)}>{u.display_org || u.org_name || '—'}</td>
                      <td style={{ ...colStyle(110), fontFamily: T.mono, fontSize: 11, color: T.textSec }}>{expires}</td>
                      <td style={{ ...colStyle(100), padding: '8px 14px' }}>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={isActing}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 4,
                            border: 'none',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: isActing ? 'not-allowed' : 'pointer',
                            background: u.is_active ? 'rgba(6,95,70,0.1)' : 'rgba(220,38,38,0.08)',
                            color: u.is_active ? T.green : T.red,
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          {u.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td style={{ ...colStyle(140), padding: '8px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Btn
                            onClick={() => isEditing ? setEditingUserId(null) : openEdit(u)}
                            disabled={isActing}
                            variant="ghost"
                            small
                          >
                            {isEditing ? 'Close' : 'Edit'}
                          </Btn>
                          <Btn
                            onClick={() => handleRevoke(u)}
                            disabled={isActing}
                            variant="danger"
                            small
                          >
                            Revoke
                          </Btn>
                        </div>
                      </td>
                    </tr>
                    {isEditing && (
                      <tr style={{ background: '#f3f1ec' }}>
                        <td colSpan={7} style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}` }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>
                            Edit: {u.name || u.email}
                          </div>
                          <ErrorMsg msg={editError} />
                          <form onSubmit={handleEditSubmit}>
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                              <div style={{ minWidth: 160 }}>
                                <SelectField
                                  label="Role"
                                  value={editForm.rbac_role}
                                  onChange={e => setEditForm(p => ({ ...p, rbac_role: e.target.value }))}
                                  options={ROLES.map(r => ({ label: ROLE_LABELS[r], value: r }))}
                                  disabled={editLoading}
                                />
                              </div>
                              <div style={{ minWidth: 200 }}>
                                <InputField
                                  label="Org / Client Name"
                                  value={editForm.display_org}
                                  onChange={e => setEditForm(p => ({ ...p, display_org: e.target.value }))}
                                  placeholder="Acme Capital"
                                  disabled={editLoading}
                                />
                              </div>
                              <div style={{ minWidth: 150 }}>
                                <SelectField
                                  label="Access Duration"
                                  value={editForm.access_duration_days}
                                  onChange={e => setEditForm(p => ({
                                    ...p,
                                    access_duration_days: e.target.value === '' ? null : Number(e.target.value),
                                  }))}
                                  options={DURATION_OPTIONS.map(d => ({ label: d.label, value: d.value === null ? '' : d.value }))}
                                  disabled={editLoading}
                                />
                              </div>
                              <div style={{ marginBottom: 14, display: 'flex', gap: 8 }}>
                                <Btn type="submit" variant="primary" disabled={editLoading} small>
                                  {editLoading ? 'Saving…' : 'Save Changes'}
                                </Btn>
                                <Btn onClick={() => setEditingUserId(null)} variant="ghost" disabled={editLoading} small>
                                  Cancel
                                </Btn>
                              </div>
                            </div>
                          </form>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && (
        <div style={{ marginTop: 10, fontSize: 12, color: T.textSec }}>
          {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}
          {search ? ` matching "${search}"` : ''}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Invite ─────────────────────────────────────────────────────────────
function InviteTab({ presets }) {
  const [form, setForm] = useState({
    email: '',
    rbac_role: 'viewer',
    preset_id: '',
    display_org: '',
    access_duration_days: 30,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const linkRef = useRef(null);

  // Active invites
  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [invitesError, setInvitesError] = useState('');
  const [revokingInviteId, setRevokingInviteId] = useState(null);
  const [revokeError, setRevokeError] = useState('');
  const [revokeSuccess, setRevokeSuccess] = useState('');

  const fetchInvites = useCallback(async () => {
    setInvitesLoading(true);
    setInvitesError('');
    try {
      const res = await axios.get('/api/v1/admin/rbac/invites', { withCredentials: true });
      setInvites(res.data?.invites || res.data || []);
    } catch (err) {
      setInvitesError(err?.response?.data?.detail || 'Failed to load invites.');
    } finally {
      setInvitesLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvites(); }, [fetchInvites]);

  const set = (k) => (e) => setForm(prev => ({
    ...prev,
    [k]: e.target.value,
  }));

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.email) { setError('Email is required.'); return; }
    setError('');
    setInviteLink('');
    setLoading(true);
    try {
      const payload = {
        email: form.email.trim(),
        rbac_role: form.rbac_role,
        display_org: form.display_org.trim() || undefined,
        access_duration_days: form.access_duration_days ? Number(form.access_duration_days) : null,
      };
      if (form.preset_id) payload.preset_id = form.preset_id;
      const res = await axios.post('/api/v1/admin/rbac/invites', payload, { withCredentials: true });
      const token = res.data?.token || res.data?.invite_token;
      if (token) {
        setInviteLink(`${window.location.origin}/invite/${token}`);
      } else if (res.data?.invite_url) {
        setInviteLink(res.data.invite_url);
      } else {
        setError('Invite created but no link was returned. Check the API response.');
      }
      await fetchInvites();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to generate invite.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteLink).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      linkRef.current?.select();
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevokeInvite = async (inv) => {
    const inviteId = inv.id || inv.invite_id;
    if (!window.confirm(`Revoke invite for ${inv.email}?`)) return;
    setRevokingInviteId(inviteId);
    setRevokeError('');
    setRevokeSuccess('');
    try {
      await axios.delete(`/api/v1/admin/rbac/invites/${inviteId}/revoke`, { withCredentials: true });
      setRevokeSuccess(`Invite for ${inv.email} revoked.`);
      await fetchInvites();
    } catch (err) {
      setRevokeError(err?.response?.data?.detail || 'Failed to revoke invite.');
    } finally {
      setRevokingInviteId(null);
    }
  };

  const presetOptions = [
    { label: '— No preset —', value: '' },
    ...(presets || []).map(p => ({ label: `${p.name} (${p.rbac_role || p.role_type})`, value: p.id || p.preset_id })),
  ];

  const headStyle = {
    padding: '8px 14px',
    fontSize: 11,
    fontWeight: 700,
    color: T.textSec,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    background: '#f3f1ec',
    borderBottom: `1px solid ${T.border}`,
    whiteSpace: 'nowrap',
    textAlign: 'left',
  };

  const cellStyle = {
    padding: '10px 14px',
    fontSize: 12,
    color: T.text,
    borderBottom: `1px solid ${T.border}`,
  };

  return (
    <div>
      <div style={{ maxWidth: 520 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>
          Generate Invite Link
        </div>
        <div style={{ fontSize: 13, color: T.textSec, marginBottom: 20 }}>
          Create a one-time invite link to onboard a new user.
        </div>

        <ErrorMsg msg={error} />

        <form onSubmit={handleGenerate}>
          <InputField
            label="Email Address"
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="user@example.com"
            disabled={loading}
          />

          <SelectField
            label="Role"
            value={form.rbac_role}
            onChange={set('rbac_role')}
            options={ROLES.map(r => ({ label: ROLE_LABELS[r], value: r }))}
            disabled={loading}
          />

          <SelectField
            label="Module Preset (optional)"
            value={form.preset_id}
            onChange={set('preset_id')}
            options={presetOptions}
            disabled={loading}
          />

          <InputField
            label="Org / Client Name (optional)"
            value={form.display_org}
            onChange={set('display_org')}
            placeholder="Acme Capital"
            disabled={loading}
          />

          <SelectField
            label="Access Duration"
            value={form.access_duration_days}
            onChange={(e) => setForm(prev => ({
              ...prev,
              access_duration_days: e.target.value === '' ? null : Number(e.target.value),
            }))}
            options={DURATION_OPTIONS.map(d => ({ label: d.label, value: d.value === null ? '' : d.value }))}
            disabled={loading}
          />

          <Btn type="submit" variant="gold" disabled={loading} style={{ width: '100%', padding: '10px', fontSize: 14, marginTop: 4 }}>
            {loading ? 'Generating…' : 'Generate Invite Link'}
          </Btn>
        </form>

        {inviteLink && (
          <div style={{
            marginTop: 24,
            background: 'rgba(6,95,70,0.06)',
            border: '1px solid rgba(6,95,70,0.2)',
            borderRadius: 8,
            padding: '16px 16px 14px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.green, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Invite Link Generated
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={linkRef}
                readOnly
                value={inviteLink}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid rgba(6,95,70,0.3)',
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: T.mono,
                  color: T.text,
                  background: '#fff',
                  outline: 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              />
              <Btn onClick={handleCopy} variant="green" small>
                {copied ? 'Copied!' : 'Copy'}
              </Btn>
            </div>
            <div style={{ fontSize: 11, color: T.textSec, marginTop: 8 }}>
              Share this link with the invitee. It can only be used once.
            </div>
          </div>
        )}
      </div>

      {/* Active Invites section */}
      <div style={{ marginTop: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Active Invites</div>
          <Btn onClick={fetchInvites} variant="ghost" small>Refresh</Btn>
        </div>

        <ErrorMsg msg={revokeError} />
        <SuccessMsg msg={revokeSuccess} />

        {invitesLoading ? (
          <div style={{ fontSize: 13, color: T.textSec, padding: '16px 0' }}>Loading invites…</div>
        ) : invitesError ? (
          <ErrorMsg msg={invitesError} />
        ) : invites.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '28px 20px',
            color: T.textSec,
            fontSize: 13,
            border: `1px dashed ${T.border}`,
            borderRadius: 8,
          }}>
            No pending invites.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${T.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Email', 'Role', 'Org', 'Expires', 'Status', 'Action'].map(h => (
                    <th key={h} style={headStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invites.map((inv, i) => {
                  const inviteId = inv.id || inv.invite_id;
                  const rowBg = i % 2 === 0 ? '#fff' : '#faf9f6';
                  const expires = inv.expires_at
                    ? new Date(inv.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—';
                  const isRevoking = revokingInviteId === inviteId;
                  const statusColor = inv.status === 'pending'
                    ? { bg: 'rgba(29,78,216,0.1)', color: T.blue }
                    : inv.status === 'used'
                    ? { bg: 'rgba(6,95,70,0.1)', color: T.green }
                    : { bg: 'rgba(220,38,38,0.08)', color: T.red };
                  return (
                    <tr key={inviteId} style={{ background: rowBg }}>
                      <td style={{ ...cellStyle, fontFamily: T.mono, fontSize: 12 }}>{inv.email}</td>
                      <td style={cellStyle}><RoleBadge role={inv.rbac_role || inv.role} /></td>
                      <td style={cellStyle}>{inv.display_org || inv.org_name || '—'}</td>
                      <td style={{ ...cellStyle, fontFamily: T.mono, fontSize: 11, color: T.textSec }}>{expires}</td>
                      <td style={cellStyle}>
                        <span style={{
                          background: statusColor.bg,
                          color: statusColor.color,
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          {inv.status || 'pending'}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <Btn
                          onClick={() => handleRevokeInvite(inv)}
                          disabled={isRevoking || inv.status === 'used'}
                          variant="danger"
                          small
                        >
                          {isRevoking ? '…' : 'Revoke'}
                        </Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Presets ────────────────────────────────────────────────────────────
function PresetsTab({ presets, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editPreset, setEditPreset] = useState(null);
  const [form, setForm] = useState({ name: '', role_type: 'viewer', paths: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Path picker helper
  const [pathSearch, setPathSearch] = useState('');
  const [showPathPicker, setShowPathPicker] = useState(false);
  const pathPickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pathPickerRef.current && !pathPickerRef.current.contains(e.target)) {
        setShowPathPicker(false);
      }
    };
    if (showPathPicker) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPathPicker]);

  const filteredCommonPaths = pathSearch.trim()
    ? ALL_COMMON_PATHS.filter(item => item.path.includes(pathSearch.toLowerCase()))
    : ALL_COMMON_PATHS;

  const addPathFromPicker = (path) => {
    setForm(prev => {
      const existing = prev.paths
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      if (existing.includes(path)) return prev;
      const joined = [...existing, path].join(', ');
      return { ...prev, paths: joined };
    });
    setPathSearch('');
    setShowPathPicker(false);
  };

  const openNew = () => {
    setEditPreset(null);
    setForm({ name: '', role_type: 'viewer', paths: '' });
    setError('');
    setSuccess('');
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditPreset(p);
    setForm({
      name: p.name || '',
      role_type: p.rbac_role || p.role_type || 'viewer',
      paths: (p.module_paths || []).join(', '),
    });
    setError('');
    setSuccess('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Preset name is required.'); return; }
    setError('');
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        role_type: form.role_type,
        module_paths: form.paths
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        domain_groups: [],
      };
      if (editPreset) {
        const id = editPreset.id || editPreset.preset_id;
        await axios.patch(`/api/v1/admin/rbac/presets/${id}`, payload, { withCredentials: true });
        setSuccess('Preset updated.');
      } else {
        await axios.post('/api/v1/admin/rbac/presets', payload, { withCredentials: true });
        setSuccess('Preset created.');
      }
      setShowForm(false);
      onRefresh();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to save preset.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (p) => {
    const id = p.id || p.preset_id;
    if (!window.confirm(`Delete preset "${p.name}"?`)) return;
    setError('');
    try {
      await axios.delete(`/api/v1/admin/rbac/presets/${id}`, { withCredentials: true });
      setSuccess('Preset deleted.');
      onRefresh();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to delete preset.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Module Access Presets</div>
          <div style={{ fontSize: 13, color: T.textSec, marginTop: 2 }}>
            Presets define which modules a role can access. Apply them when sending invites.
          </div>
        </div>
        <Btn onClick={openNew} variant="gold">+ New Preset</Btn>
      </div>

      <ErrorMsg msg={error} />
      <SuccessMsg msg={success} />

      {showForm && (
        <div style={{
          background: '#faf9f6',
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          padding: '20px 20px 16px',
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>
            {editPreset ? `Edit: ${editPreset.name}` : 'New Preset'}
          </div>
          <form onSubmit={handleSubmit}>
            <InputField
              label="Preset Name"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. SFDR Full Suite"
              disabled={loading}
            />
            <SelectField
              label="Default Role Type"
              value={form.role_type}
              onChange={e => setForm(p => ({ ...p, role_type: e.target.value }))}
              options={ROLES.map(r => ({ label: ROLE_LABELS[r], value: r }))}
              disabled={loading}
            />
            <div style={{ marginBottom: 14 }}>
              <label style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 600,
                color: T.textSec,
                marginBottom: 5,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
              }}>
                Module Paths (comma-separated)
              </label>

              {/* Path picker dropdown */}
              <div style={{ position: 'relative', marginBottom: 6 }} ref={pathPickerRef}>
                <input
                  type="text"
                  value={pathSearch}
                  onChange={e => { setPathSearch(e.target.value); setShowPathPicker(true); }}
                  onFocus={() => setShowPathPicker(true)}
                  placeholder="Search and pick a common path…"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '7px 12px',
                    border: `1px solid ${T.border}`,
                    borderRadius: 6,
                    fontSize: 12,
                    fontFamily: T.mono,
                    color: T.text,
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: loading ? '#f5f4f1' : '#fff',
                  }}
                />
                {showPathPicker && filteredCommonPaths.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: `1px solid ${T.border}`,
                    borderRadius: 6,
                    boxShadow: '0 4px 16px rgba(26,35,50,0.12)',
                    zIndex: 100,
                    maxHeight: 220,
                    overflowY: 'auto',
                  }}>
                    {filteredCommonPaths.map(item => (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => addPathFromPicker(item.path)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          padding: '8px 14px',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          borderBottom: `1px solid ${T.border}`,
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f3f1ec'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span style={{ fontFamily: T.mono, fontSize: 12, color: T.text }}>{item.path}</span>
                        <span style={{
                          fontSize: 10,
                          color: T.textSec,
                          background: '#f3f1ec',
                          padding: '1px 6px',
                          borderRadius: 3,
                          marginLeft: 8,
                          flexShrink: 0,
                        }}>
                          {item.group}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <textarea
                value={form.paths}
                onChange={e => setForm(p => ({ ...p, paths: e.target.value }))}
                placeholder="/eu-taxonomy, /sfdr-classification, /paris-alignment"
                disabled={loading}
                rows={4}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: T.mono,
                  color: T.text,
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  background: loading ? '#f5f4f1' : '#fff',
                }}
              />
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>
                Type paths directly or use the search above to pick common routes, e.g.{' '}
                <code style={{ fontFamily: T.mono }}>/eu-taxonomy</code>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn type="submit" variant="primary" disabled={loading}>
                {loading ? 'Saving…' : editPreset ? 'Save Changes' : 'Create Preset'}
              </Btn>
              <Btn onClick={() => setShowForm(false)} variant="ghost" disabled={loading}>Cancel</Btn>
            </div>
          </form>
        </div>
      )}

      {/* Presets list */}
      {!presets || presets.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: T.textSec,
          fontSize: 13,
          border: `1px dashed ${T.border}`,
          borderRadius: 8,
        }}>
          No presets yet. Create one to streamline onboarding.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {presets.map(p => {
            const paths = p.module_paths || [];
            const id = p.id || p.preset_id;
            return (
              <div key={id} style={{
                background: '#fff',
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{p.name}</span>
                    <RoleBadge role={p.rbac_role || p.role_type} />
                    <span style={{
                      fontSize: 11,
                      color: T.textSec,
                      background: '#f3f1ec',
                      padding: '1px 6px',
                      borderRadius: 3,
                    }}>
                      {paths.length} module{paths.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {paths.length > 0 && (
                    <div style={{
                      fontSize: 11,
                      fontFamily: T.mono,
                      color: T.textSec,
                      lineHeight: 1.7,
                      wordBreak: 'break-all',
                    }}>
                      {paths.slice(0, 6).join(' · ')}
                      {paths.length > 6 && ` · +${paths.length - 6} more`}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Btn onClick={() => openEdit(p)} variant="ghost" small>Edit</Btn>
                  <Btn onClick={() => handleDelete(p)} variant="danger" small>Delete</Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Access ─────────────────────────────────────────────────────────────
function AccessTab({ users }) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [accessData, setAccessData] = useState(null);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [accessError, setAccessError] = useState('');

  const [grantForm, setGrantForm] = useState({ path: '', type: 'grant' });
  const [granting, setGranting] = useState(false);
  const [grantError, setGrantError] = useState('');
  const [grantSuccess, setGrantSuccess] = useState('');

  const [deletingOverrideId, setDeletingOverrideId] = useState(null);
  const [deleteOverrideError, setDeleteOverrideError] = useState('');

  const fetchAccess = useCallback(async (uid) => {
    if (!uid) return;
    setLoadingAccess(true);
    setAccessError('');
    setAccessData(null);
    try {
      const res = await axios.get(`/api/v1/admin/rbac/module-access/${uid}`, { withCredentials: true });
      setAccessData(res.data);
    } catch (err) {
      setAccessError(err?.response?.data?.detail || 'Failed to load access data.');
    } finally {
      setLoadingAccess(false);
    }
  }, []);

  const handleUserChange = (e) => {
    const uid = e.target.value;
    setSelectedUserId(uid);
    setGrantError('');
    setGrantSuccess('');
    setDeleteOverrideError('');
    if (uid) fetchAccess(uid);
    else setAccessData(null);
  };

  const handleGrant = async (e) => {
    e.preventDefault();
    if (!selectedUserId) { setGrantError('Select a user first.'); return; }
    if (!grantForm.path.trim()) { setGrantError('Enter a module path.'); return; }
    setGranting(true);
    setGrantError('');
    setGrantSuccess('');
    try {
      await axios.post(
        `/api/v1/admin/rbac/module-access/${selectedUserId}`,
        {
          module_path: grantForm.path.trim(),
          access_type: grantForm.type,
        },
        { withCredentials: true }
      );
      setGrantSuccess(`Access ${grantForm.type === 'grant' ? 'granted' : 'denied'} for ${grantForm.path.trim()}`);
      setGrantForm(prev => ({ ...prev, path: '' }));
      fetchAccess(selectedUserId);
    } catch (err) {
      setGrantError(err?.response?.data?.detail || 'Failed to update access.');
    } finally {
      setGranting(false);
    }
  };

  const handleDeleteOverride = async (override) => {
    const oid = override.id || override.override_id;
    setDeletingOverrideId(oid);
    setDeleteOverrideError('');
    try {
      await axios.delete(`/api/v1/admin/rbac/module-access/${oid}`, { withCredentials: true });
      fetchAccess(selectedUserId);
    } catch (err) {
      setDeleteOverrideError(err?.response?.data?.detail || 'Failed to delete override.');
    } finally {
      setDeletingOverrideId(null);
    }
  };

  const selectedUser = users?.find(u => u.user_id === selectedUserId);
  const paths = accessData?.allowed_module_paths || accessData?.paths || null;
  const overrides = accessData?.overrides || [];
  const isUnlimited = paths === null;

  const headStyle = {
    padding: '7px 12px',
    fontSize: 11,
    fontWeight: 700,
    color: T.textSec,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    background: '#f3f1ec',
    borderBottom: `1px solid ${T.border}`,
    whiteSpace: 'nowrap',
    textAlign: 'left',
  };

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>
        Per-User Module Access
      </div>
      <div style={{ fontSize: 13, color: T.textSec, marginBottom: 20 }}>
        View and modify the effective module access for individual users.
      </div>

      {/* User selector */}
      <div style={{ marginBottom: 20 }}>
        <label style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 600,
          color: T.textSec,
          marginBottom: 5,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        }}>
          Select User
        </label>
        <select
          value={selectedUserId}
          onChange={handleUserChange}
          style={{
            width: '100%',
            maxWidth: 400,
            padding: '8px 12px',
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            fontSize: 13,
            fontFamily: "'DM Sans', sans-serif",
            color: T.text,
            background: '#fff',
            outline: 'none',
          }}
        >
          <option value="">— Select a user —</option>
          {(users || []).map(u => (
            <option key={u.user_id} value={u.user_id}>
              {u.name || u.email} {u.display_org ? `(${u.display_org})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Access display */}
      {selectedUserId && (
        <div>
          {loadingAccess ? (
            <div style={{ fontSize: 13, color: T.textSec, padding: '16px 0' }}>Loading access data…</div>
          ) : accessError ? (
            <ErrorMsg msg={accessError} />
          ) : accessData ? (
            <div style={{ marginBottom: 24 }}>
              {/* Effective paths card */}
              <div style={{
                background: '#fff',
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: '16px 18px',
                marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, color: T.text }}>
                    {selectedUser?.name || selectedUser?.email}
                  </span>
                  <RoleBadge role={selectedUser?.rbac_role || selectedUser?.role} />
                  {isUnlimited && (
                    <span style={{
                      background: 'rgba(212,168,67,0.15)',
                      color: '#92620a',
                      border: '1px solid rgba(212,168,67,0.4)',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                    }}>
                      ALL MODULES
                    </span>
                  )}
                </div>

                {isUnlimited ? (
                  <div style={{ fontSize: 13, color: T.textSec }}>
                    Super admin — unrestricted access to all modules.
                  </div>
                ) : paths && paths.length > 0 ? (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.textSec, marginBottom: 8 }}>
                      {paths.length} allowed module{paths.length !== 1 ? 's' : ''}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {paths.map(p => (
                        <span key={p} style={{
                          background: '#f3f1ec',
                          border: `1px solid ${T.border}`,
                          borderRadius: 4,
                          padding: '3px 8px',
                          fontSize: 11,
                          fontFamily: T.mono,
                          color: T.text,
                        }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: T.textSec }}>
                    No module access configured.
                  </div>
                )}
              </div>

              {/* Raw overrides table */}
              <div style={{
                background: '#fff',
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: '16px 18px',
                marginBottom: 16,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>
                  Access Overrides ({overrides.length})
                </div>

                <ErrorMsg msg={deleteOverrideError} />

                {overrides.length === 0 ? (
                  <div style={{ fontSize: 13, color: T.textSec }}>
                    No individual overrides. Access is determined by role and preset only.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', borderRadius: 6, border: `1px solid ${T.border}` }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Module Path', 'Access Type', 'Expires', 'Delete'].map(h => (
                            <th key={h} style={headStyle}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {overrides.map((ov, i) => {
                          const oid = ov.id || ov.override_id;
                          const rowBg = i % 2 === 0 ? '#fff' : '#faf9f6';
                          const expires = ov.expires_at
                            ? new Date(ov.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—';
                          const isDeleting = deletingOverrideId === oid;
                          return (
                            <tr key={oid} style={{ background: rowBg }}>
                              <td style={{
                                padding: '9px 12px',
                                fontSize: 12,
                                fontFamily: T.mono,
                                color: T.text,
                                borderBottom: `1px solid ${T.border}`,
                              }}>
                                {ov.module_path}
                              </td>
                              <td style={{ padding: '9px 12px', borderBottom: `1px solid ${T.border}` }}>
                                <AccessTypeBadge type={ov.access_type} />
                              </td>
                              <td style={{
                                padding: '9px 12px',
                                fontSize: 11,
                                fontFamily: T.mono,
                                color: T.textSec,
                                borderBottom: `1px solid ${T.border}`,
                              }}>
                                {expires}
                              </td>
                              <td style={{ padding: '9px 12px', borderBottom: `1px solid ${T.border}` }}>
                                <Btn
                                  onClick={() => handleDeleteOverride(ov)}
                                  disabled={isDeleting}
                                  variant="danger"
                                  small
                                >
                                  {isDeleting ? '…' : 'Delete'}
                                </Btn>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Grant / deny form */}
          <div style={{
            background: '#faf9f6',
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            padding: '16px 18px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>
              Add Access Rule
            </div>
            <ErrorMsg msg={grantError} />
            <SuccessMsg msg={grantSuccess} />
            <form onSubmit={handleGrant}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 600,
                    color: T.textSec,
                    marginBottom: 5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                  }}>
                    Module Path
                  </label>
                  <input
                    type="text"
                    value={grantForm.path}
                    onChange={e => setGrantForm(p => ({ ...p, path: e.target.value }))}
                    placeholder="/eu-taxonomy"
                    disabled={granting}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${T.border}`,
                      borderRadius: 6,
                      fontSize: 13,
                      fontFamily: T.mono,
                      color: T.text,
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: granting ? '#f5f4f1' : '#fff',
                    }}
                  />
                </div>
                <div style={{ minWidth: 120 }}>
                  <label style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 600,
                    color: T.textSec,
                    marginBottom: 5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                  }}>
                    Type
                  </label>
                  <select
                    value={grantForm.type}
                    onChange={e => setGrantForm(p => ({ ...p, type: e.target.value }))}
                    disabled={granting}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${T.border}`,
                      borderRadius: 6,
                      fontSize: 13,
                      fontFamily: "'DM Sans', sans-serif",
                      color: T.text,
                      background: granting ? '#f5f4f1' : '#fff',
                      outline: 'none',
                    }}
                  >
                    <option value="grant">Grant</option>
                    <option value="deny">Deny</option>
                  </select>
                </div>
                <Btn type="submit" variant="primary" disabled={granting} style={{ flexShrink: 0 }}>
                  {granting ? 'Saving…' : 'Apply'}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main AdminPanelPage ──────────────────────────────────────────────────────
const TABS = [
  { key: 'users', label: 'Users' },
  { key: 'invite', label: 'Invite' },
  { key: 'presets', label: 'Presets' },
  { key: 'access', label: 'Access' },
];

export default function AdminPanelPage() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [presets, setPresets] = useState([]);
  const [loadingPresets, setLoadingPresets] = useState(true);

  const fetchPresets = useCallback(async () => {
    try {
      const res = await axios.get('/api/v1/admin/rbac/presets', { withCredentials: true });
      setPresets(res.data?.presets || res.data || []);
    } catch {
      // Non-fatal: presets are optional
    } finally {
      setLoadingPresets(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get('/api/v1/admin/rbac/users', { withCredentials: true });
      setUsers(res.data?.users || res.data || []);
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    fetchPresets();
    fetchUsers();
  }, [fetchPresets, fetchUsers]);

  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Page header */}
      <div style={{
        background: T.navy,
        borderBottom: `3px solid ${T.gold}`,
        padding: '18px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontSize: 11,
            fontFamily: T.mono,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.08em',
            marginBottom: 4,
          }}>
            A² INTELLIGENCE / ADMIN
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
            RBAC Administration
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
            Manage users, roles, invites, and module access
          </div>
        </div>
        <div style={{
          background: 'rgba(212,168,67,0.15)',
          border: '1px solid rgba(212,168,67,0.3)',
          borderRadius: 6,
          padding: '4px 12px',
          fontSize: 11,
          fontFamily: T.mono,
          color: T.gold,
          letterSpacing: '0.06em',
        }}>
          SUPER ADMIN
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        background: '#fff',
        borderBottom: `1px solid ${T.border}`,
        padding: '0 32px',
        display: 'flex',
        gap: 0,
      }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === t.key ? `2px solid ${T.navy}` : '2px solid transparent',
              background: 'transparent',
              color: tab === t.key ? T.navy : T.textSec,
              fontWeight: tab === t.key ? 700 : 500,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'color 0.15s',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
        {tab === 'users' && <UsersTab />}
        {tab === 'invite' && <InviteTab presets={loadingPresets ? [] : presets} />}
        {tab === 'presets' && <PresetsTab presets={presets} onRefresh={fetchPresets} />}
        {tab === 'access' && <AccessTab users={users} />}
      </div>
    </div>
  );
}
