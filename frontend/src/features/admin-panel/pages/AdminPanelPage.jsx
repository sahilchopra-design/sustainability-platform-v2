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
      border: `1px solid rgba(220,38,38,0.25)`,
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

function Btn({ children, onClick, variant = 'primary', small, disabled, style }) {
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
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

// ─── Tab: Users ──────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // user_id being acted on

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
    try {
      await axios.delete(`/api/v1/admin/rbac/users/${u.user_id}`, { withCredentials: true });
      setUsers(prev => prev.filter(x => x.user_id !== u.user_id));
    } catch (err) {
      setActionError(err?.response?.data?.detail || 'Failed to revoke access.');
    } finally {
      setActionLoading(null);
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
      {/* Search + refresh */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, org, or role…"
          style={{
            flex: 1,
            padding: '8px 14px',
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            fontSize: 13,
            outline: 'none',
            fontFamily: "'DM Sans', sans-serif",
            color: T.text,
          }}
        />
        <Btn onClick={fetchUsers} variant="ghost" small>Refresh</Btn>
      </div>

      <ErrorMsg msg={actionError} />

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
                const rowBg = i % 2 === 0 ? '#fff' : '#faf9f6';
                const expires = u.access_expires_at
                  ? new Date(u.access_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—';
                return (
                  <tr key={u.user_id} style={{ background: rowBg }}>
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
                    <td style={{ ...colStyle(80), padding: '8px 14px' }}>
                      <Btn
                        onClick={() => handleRevoke(u)}
                        disabled={isActing}
                        variant="danger"
                        small
                      >
                        Revoke
                      </Btn>
                    </td>
                  </tr>
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
    org_name: '',
    duration_days: 30,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const linkRef = useRef(null);

  const set = (k) => (e) => setForm(prev => ({
    ...prev,
    [k]: e.target.value === '' && k === 'duration_days' ? null : e.target.value,
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
        org_name: form.org_name.trim() || undefined,
        duration_days: form.duration_days ? Number(form.duration_days) : null,
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

  const presetOptions = [
    { label: '— No preset —', value: '' },
    ...(presets || []).map(p => ({ label: `${p.name} (${p.rbac_role || p.role_type})`, value: p.id || p.preset_id })),
  ];

  return (
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
          value={form.org_name}
          onChange={set('org_name')}
          placeholder="Acme Capital"
          disabled={loading}
        />

        <SelectField
          label="Access Duration"
          value={form.duration_days}
          onChange={(e) => setForm(prev => ({
            ...prev,
            duration_days: e.target.value === '' ? null : Number(e.target.value),
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
                border: `1px solid rgba(6,95,70,0.3)`,
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
  );
}

// ─── Tab: Presets ────────────────────────────────────────────────────────────
function PresetsTab({ presets, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editPreset, setEditPreset] = useState(null); // null = new
  const [form, setForm] = useState({ name: '', role_type: 'viewer', paths: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      paths: (p.allowed_module_paths || p.paths || []).join(', '),
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
        allowed_module_paths: form.paths
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
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
                }}
              />
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>
                Enter route paths as they appear in the app, e.g. <code style={{ fontFamily: T.mono }}>/eu-taxonomy</code>
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
            const paths = p.allowed_module_paths || p.paths || [];
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

  const fetchAccess = async (uid) => {
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
  };

  const handleUserChange = (e) => {
    const uid = e.target.value;
    setSelectedUserId(uid);
    setGrantError('');
    setGrantSuccess('');
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
        `/api/v1/admin/rbac/module-access`,
        {
          user_id: selectedUserId,
          path: grantForm.path.trim(),
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

  const selectedUser = users?.find(u => u.user_id === selectedUserId);
  const paths = accessData?.allowed_module_paths || accessData?.paths || null;
  const isUnlimited = paths === null;

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
                      background: '#fff',
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

  // Fetch presets once (used by Invite + Presets tabs)
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

  // Fetch users list (used by Users + Access tabs)
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
