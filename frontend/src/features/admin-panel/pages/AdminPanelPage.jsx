/**
 * AdminPanelPage.jsx — A² Intelligence RBAC Administration Console
 * 3× capability enhancement: localStorage mock store, visual module picker,
 * role matrix, audit log, analytics dashboard — fully functional without backend.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  MODULE_REGISTRY, ALL_MODULE_PATHS, TOTAL_MODULES, getModuleLabel, getModuleGroup,
} from '../data/moduleRegistry';

/* ─────────────────────────────────────────────────────────────
   THEME
───────────────────────────────────────────────────────────── */
const T = {
  bg:      '#0f1117',
  surface: '#161b27',
  card:    '#1c2333',
  border:  '#2a3448',
  accent:  '#d4a017',
  blue:    '#3b82f6',
  green:   '#10b981',
  red:     '#ef4444',
  orange:  '#f59e0b',
  purple:  '#8b5cf6',
  cyan:    '#06b6d4',
  text:    '#e2e8f0',
  muted:   '#8892a4',
  font:    "'DM Sans', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

/* ─────────────────────────────────────────────────────────────
   ROLE & PERMISSION CONSTANTS
───────────────────────────────────────────────────────────── */
export const ROLES = [
  {
    id: 'super_admin',
    label: 'Super Admin',
    color: '#d4a017',
    description: 'Unrestricted access to all modules and admin functions.',
    moduleAccess: 'all',
    canManageUsers: true, canManageRoles: true, canManageModules: true,
    canViewAudit: true, canInvite: true, canExport: true,
  },
  {
    id: 'team_member',
    label: 'Team Member',
    color: '#3b82f6',
    description: 'Internal staff with broad module access defined by preset.',
    moduleAccess: 'preset',
    canManageUsers: false, canManageRoles: false, canManageModules: false,
    canViewAudit: false, canInvite: false, canExport: true,
  },
  {
    id: 'partner',
    label: 'Partner',
    color: '#10b981',
    description: 'External partners with curated module subset.',
    moduleAccess: 'preset',
    canManageUsers: false, canManageRoles: false, canManageModules: false,
    canViewAudit: false, canInvite: false, canExport: true,
  },
  {
    id: 'demo',
    label: 'Demo User',
    color: '#f59e0b',
    description: 'Limited read-only sandbox access for product demos.',
    moduleAccess: 'preset',
    canManageUsers: false, canManageRoles: false, canManageModules: false,
    canViewAudit: false, canInvite: false, canExport: false,
  },
  {
    id: 'viewer',
    label: 'Viewer',
    color: '#8b5cf6',
    description: 'Read-only access to specific modules only.',
    moduleAccess: 'preset',
    canManageUsers: false, canManageRoles: false, canManageModules: false,
    canViewAudit: false, canInvite: false, canExport: false,
  },
];

const ROLE_MAP = Object.fromEntries(ROLES.map(r => [r.id, r]));

const PERMISSIONS = [
  { id: 'canManageUsers',   label: 'Manage Users' },
  { id: 'canManageRoles',   label: 'Manage Roles' },
  { id: 'canManageModules', label: 'Manage Modules' },
  { id: 'canViewAudit',     label: 'View Audit Log' },
  { id: 'canInvite',        label: 'Send Invites' },
  { id: 'canExport',        label: 'Export Data' },
];

/* ─────────────────────────────────────────────────────────────
   MOCK DATA STORE (localStorage CRUD)
───────────────────────────────────────────────────────────── */
const STORE_KEY = 'a2_admin_store';

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

function saveStore(store) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (_) {}
}

function generateId() {
  const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
  return Date.now().toString(36) + sr(Date.now() % 9999).toString(36).slice(2, 7);
}

const DEMO_MODULES = [
  '/sfdr-classification', '/sfdr-pai', '/paris-alignment', '/eu-taxonomy',
  '/portfolio-manager', '/sdg-alignment', '/impact-measurement',
];

const ANALYST_MODULES = ALL_MODULE_PATHS.filter(p =>
  ['/paris-alignment', '/eu-taxonomy', '/portfolio-manager', '/net-zero-tracker',
   '/pcaf-financed-emissions', '/issb-tcfd', '/issb-materiality', '/issb-disclosure',
   '/sfdr-classification', '/sfdr-pai', '/sfdr-art9', '/sfdr-v2', '/sfdr-pai-dashboard',
   '/csrd-dma', '/csrd-xbrl', '/csrd-esrs-full', '/csrd-esrs-automation',
   '/portfolio-temperature-score', '/climate-var', '/scope3-engine',
   '/green-bond-analytics', '/green-bond-portfolio-analytics',
   '/esg-ratings-aggregator', '/sentiment-analysis', '/ai-sentiment',
  ].includes(p)
);

const PARTNER_MODULES = [
  '/paris-alignment', '/portfolio-temperature-score', '/sfdr-classification',
  '/eu-taxonomy', '/impact-measurement', '/sdg-alignment', '/net-zero-tracker',
  '/green-bond-analytics', '/carbon-pricing-analytics', '/esg-ratings-aggregator',
];

/* ─── SEED DATA ─── */
function buildSeedData() {
  const now = Date.now();
  const day = 86400000;

  const presets = [
    {
      id: 'preset_admin', name: 'Super Admin — Full Access', role: 'super_admin',
      description: 'All platform modules, unrestricted.',
      paths: ALL_MODULE_PATHS, createdAt: now - 30 * day, updatedAt: now - 5 * day,
    },
    {
      id: 'preset_analyst', name: 'Climate Analyst', role: 'team_member',
      description: 'Disclosure, climate alignment and portfolio analytics modules.',
      paths: ANALYST_MODULES, createdAt: now - 20 * day, updatedAt: now - 2 * day,
    },
    {
      id: 'preset_partner', name: 'Partner — Core Modules', role: 'partner',
      description: 'Key ESG and climate modules for external partners.',
      paths: PARTNER_MODULES, createdAt: now - 15 * day, updatedAt: now - 3 * day,
    },
    {
      id: 'preset_demo', name: 'Demo Sandbox', role: 'demo',
      description: 'Minimal read-only modules for product demonstrations.',
      paths: DEMO_MODULES, createdAt: now - 10 * day, updatedAt: now - 1 * day,
    },
  ];

  const users = [
    {
      id: 'user_001', name: 'Sahil Chopra', email: 'sahil@a2intelligence.com',
      role: 'super_admin', presetId: 'preset_admin',
      grantedPaths: [], deniedPaths: [],
      status: 'active', lastLogin: now - 2 * 3600000,
      createdAt: now - 90 * day, department: 'Engineering',
      avatar: 'SC', timezone: 'Asia/Kolkata',
    },
    {
      id: 'user_002', name: 'Aria Chen', email: 'aria.chen@a2intelligence.com',
      role: 'team_member', presetId: 'preset_analyst',
      grantedPaths: ['/carbon-credit-engine-hub', '/carbon-credit-portfolio'],
      deniedPaths: [],
      status: 'active', lastLogin: now - 5 * 3600000,
      createdAt: now - 60 * day, department: 'Research',
      avatar: 'AC', timezone: 'Europe/London',
    },
    {
      id: 'user_003', name: 'Marcus Webb', email: 'marcus@climatebridge.io',
      role: 'partner', presetId: 'preset_partner',
      grantedPaths: [], deniedPaths: ['/sfdr-pai'],
      status: 'active', lastLogin: now - 2 * day,
      createdAt: now - 45 * day, department: 'External',
      avatar: 'MW', timezone: 'America/New_York',
    },
    {
      id: 'user_004', name: 'Priya Nair', email: 'priya.nair@a2intelligence.com',
      role: 'team_member', presetId: 'preset_analyst',
      grantedPaths: [], deniedPaths: [],
      status: 'active', lastLogin: now - 3 * day,
      createdAt: now - 30 * day, department: 'Analytics',
      avatar: 'PN', timezone: 'Asia/Kolkata',
    },
    {
      id: 'user_005', name: 'Demo Account', email: 'demo@a2intelligence.com',
      role: 'demo', presetId: 'preset_demo',
      grantedPaths: [], deniedPaths: [],
      status: 'active', lastLogin: now - 6 * day,
      createdAt: now - 7 * day, department: 'Sales',
      avatar: 'DA', timezone: 'UTC',
    },
    {
      id: 'user_006', name: 'Felix Hartmann', email: 'felix@greenfinance.eu',
      role: 'viewer', presetId: null,
      grantedPaths: ['/sfdr-classification', '/eu-taxonomy', '/csrd-dma'],
      deniedPaths: [],
      status: 'inactive', lastLogin: now - 14 * day,
      createdAt: now - 20 * day, department: 'External',
      avatar: 'FH', timezone: 'Europe/Berlin',
    },
  ];

  const invites = [
    {
      id: 'inv_001', email: 'rahul.sharma@climateanalytics.in',
      role: 'team_member', presetId: 'preset_analyst',
      paths: ANALYST_MODULES, status: 'pending',
      expiresAt: now + 5 * day, createdAt: now - 2 * day, createdBy: 'user_001',
      note: 'Climate Analyst onboarding',
    },
    {
      id: 'inv_002', email: 'julia.m@sustainvest.com',
      role: 'partner', presetId: 'preset_partner',
      paths: PARTNER_MODULES, status: 'pending',
      expiresAt: now + 3 * day, createdAt: now - 1 * day, createdBy: 'user_001',
      note: 'Partner access — Sustainvest',
    },
    {
      id: 'inv_003', email: 'carlos.v@undp.org',
      role: 'partner', presetId: null,
      paths: ['/undp-blended-finance', '/sdg-alignment', '/impact-measurement', '/just-transition-intelligence'],
      status: 'accepted', expiresAt: now - 1 * day, createdAt: now - 8 * day, createdBy: 'user_001',
      note: 'UNDP collaboration access',
    },
    {
      id: 'inv_004', email: 'tom.baker@regtech.io',
      role: 'viewer', presetId: null,
      paths: ['/regulatory-radar', '/csrd-dma', '/issb-tcfd'],
      status: 'expired', expiresAt: now - 2 * day, createdAt: now - 9 * day, createdBy: 'user_001',
      note: 'RegTech viewer access',
    },
  ];

  const auditLog = [
    { id: 'a01', ts: now - 300000,    actor: 'Sahil Chopra', action: 'role_change',    target: 'Aria Chen',     detail: 'Role changed: viewer → team_member', severity: 'medium' },
    { id: 'a02', ts: now - 900000,    actor: 'Sahil Chopra', action: 'invite_sent',    target: 'rahul.sharma@climateanalytics.in', detail: 'Invite sent with preset: Climate Analyst', severity: 'low' },
    { id: 'a03', ts: now - 3600000,   actor: 'Sahil Chopra', action: 'module_grant',   target: 'Aria Chen',     detail: 'Granted: /carbon-credit-engine-hub, /carbon-credit-portfolio', severity: 'medium' },
    { id: 'a04', ts: now - 7200000,   actor: 'Aria Chen',    action: 'login',          target: 'system',        detail: 'Successful login from 203.0.113.42', severity: 'low' },
    { id: 'a05', ts: now - 14400000,  actor: 'Sahil Chopra', action: 'preset_update',  target: 'Climate Analyst', detail: 'Preset updated: added 2 modules', severity: 'medium' },
    { id: 'a06', ts: now - 86400000,  actor: 'Sahil Chopra', action: 'user_created',   target: 'Demo Account',  detail: 'New demo user created', severity: 'low' },
    { id: 'a07', ts: now - 172800000, actor: 'Sahil Chopra', action: 'invite_sent',    target: 'julia.m@sustainvest.com', detail: 'Partner invite — Sustainvest', severity: 'low' },
    { id: 'a08', ts: now - 259200000, actor: 'Sahil Chopra', action: 'module_deny',    target: 'Marcus Webb',   detail: 'Denied: /sfdr-pai', severity: 'medium' },
    { id: 'a09', ts: now - 345600000, actor: 'System',        action: 'invite_expired', target: 'tom.baker@regtech.io', detail: 'Invite expired after 7 days', severity: 'low' },
    { id: 'a10', ts: now - 432000000, actor: 'Sahil Chopra', action: 'preset_created', target: 'Partner — Core Modules', detail: 'New preset created with 10 modules', severity: 'low' },
    { id: 'a11', ts: now - 518400000, actor: 'Sahil Chopra', action: 'user_suspended', target: 'Felix Hartmann', detail: 'Account set to inactive', severity: 'high' },
    { id: 'a12', ts: now - 604800000, actor: 'Priya Nair',   action: 'login',          target: 'system',        detail: 'Successful login from 198.51.100.7', severity: 'low' },
  ];

  return { users, presets, invites, auditLog, settings: { sessionTimeout: 480, require2fa: false, passwordMinLen: 12, loginNotifications: true } };
}

/* ─── STORE HOOK ─── */
function useStore() {
  const [store, setStore] = useState(() => {
    const saved = loadStore();
    if (saved && saved.users && saved.users.length > 0) return saved;
    const seed = buildSeedData();
    saveStore(seed);
    return seed;
  });

  const update = useCallback((updater) => {
    setStore(prev => {
      const next = updater(prev);
      saveStore(next);
      return next;
    });
  }, []);

  const addAudit = useCallback((actor, action, target, detail, severity = 'low') => {
    update(s => ({
      ...s,
      auditLog: [{ id: generateId(), ts: Date.now(), actor, action, target, detail, severity }, ...s.auditLog],
    }));
  }, [update]);

  return { store, update, addAudit };
}

/* Compute effective module paths for a user */
function resolveEffectivePaths(user, presets) {
  if (!user) return [];
  if (user.role === 'super_admin') return ALL_MODULE_PATHS;
  const preset = presets.find(p => p.id === user.presetId);
  const base = preset ? [...preset.paths] : [];
  const granted = user.grantedPaths || [];
  const denied = new Set(user.deniedPaths || []);
  return [...new Set([...base, ...granted])].filter(p => !denied.has(p));
}

/* ─────────────────────────────────────────────────────────────
   UI PRIMITIVES
───────────────────────────────────────────────────────────── */
function RoleBadge({ role }) {
  const r = ROLE_MAP[role] || { label: role, color: T.muted };
  return (
    <span style={{
      background: r.color + '22', color: r.color, border: `1px solid ${r.color}44`,
      borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700,
      fontFamily: T.mono, letterSpacing: 1, textTransform: 'uppercase',
    }}>{r.label}</span>
  );
}

function StatusBadge({ status }) {
  const map = { active: T.green, inactive: T.muted, pending: T.orange, accepted: T.green, expired: T.red };
  const c = map[status] || T.muted;
  return (
    <span style={{
      background: c + '22', color: c, border: `1px solid ${c}44`,
      borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600,
      fontFamily: T.mono, letterSpacing: 0.5,
    }}>{status}</span>
  );
}

function SeverityDot({ severity }) {
  const map = { low: T.green, medium: T.orange, high: T.red };
  const c = map[severity] || T.muted;
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block', marginRight: 6 }} />;
}

function Avatar({ initials, role, size = 36 }) {
  const r = ROLE_MAP[role] || { color: T.muted };
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${r.color}33, ${r.color}66)`,
      border: `2px solid ${r.color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: T.mono, fontSize: size * 0.33, fontWeight: 700, color: r.color,
      flexShrink: 0,
    }}>{initials}</div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 8,
      padding: 20, ...style,
    }}>{children}</div>
  );
}

function KpiCard({ label, value, sub, color, icon }) {
  return (
    <Card style={{ flex: 1, minWidth: 160 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: T.muted, fontFamily: T.mono, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: color || T.accent, fontFamily: T.mono }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{sub}</div>}
        </div>
        {icon && <div style={{ fontSize: 28, opacity: 0.6 }}>{icon}</div>}
      </div>
    </Card>
  );
}

function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, style }) {
  const variants = {
    primary:   { background: T.accent,           color: '#000',    border: 'none' },
    secondary: { background: 'transparent',       color: T.text,    border: `1px solid ${T.border}` },
    danger:    { background: T.red + '22',        color: T.red,     border: `1px solid ${T.red}44` },
    ghost:     { background: 'transparent',       color: T.muted,   border: 'none' },
    success:   { background: T.green + '22',      color: T.green,   border: `1px solid ${T.green}44` },
  };
  const sizes = { sm: '5px 10px', md: '8px 16px', lg: '10px 20px' };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...variants[variant], padding: sizes[size],
      borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: size === 'sm' ? 12 : 13, fontWeight: 600, fontFamily: T.font,
      opacity: disabled ? 0.5 : 1, transition: 'all 0.15s',
      ...style,
    }}>{children}</button>
  );
}

function Inp({ value, onChange, placeholder, style, type = 'text' }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6,
        color: T.text, padding: '8px 12px', fontSize: 13, fontFamily: T.font,
        outline: 'none', width: '100%', boxSizing: 'border-box', ...style,
      }}
    />
  );
}

function Sel({ value, onChange, children, style }) {
  return (
    <select value={value} onChange={onChange} style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6,
      color: T.text, padding: '8px 12px', fontSize: 13, fontFamily: T.font,
      outline: 'none', cursor: 'pointer', ...style,
    }}>{children}</select>
  );
}

function Modal({ open, onClose, title, children, width = 640 }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
        width: '100%', maxWidth: width, maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

function Drawer({ open, onClose, title, children, width = 500 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, pointerEvents: open ? 'auto' : 'none' }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
        opacity: open ? 1 : 0, transition: 'opacity 0.25s',
      }} />
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width,
        background: T.surface, borderLeft: `1px solid ${T.border}`,
        transform: open ? 'translateX(0)' : `translateX(${width}px)`,
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 22 }}>×</button>
        </div>
        <div style={{ padding: 20, flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

function Tabs({ tabs, active, onChange, style }) {
  return (
    <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap', ...style }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          background: active === t.id ? T.card : 'transparent',
          border: 'none', borderBottom: active === t.id ? `2px solid ${T.accent}` : '2px solid transparent',
          color: active === t.id ? T.accent : T.muted,
          padding: '10px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          fontFamily: T.font, transition: 'all 0.15s', whiteSpace: 'nowrap',
        }}>
          {t.icon && <span style={{ marginRight: 5 }}>{t.icon}</span>}
          {t.label}
          {t.count != null && (
            <span style={{
              marginLeft: 6, background: T.border, color: T.muted,
              borderRadius: 10, padding: '0 6px', fontSize: 11, fontFamily: T.mono,
            }}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function Label({ children, style }) {
  return <div style={{ fontSize: 11, color: T.muted, fontFamily: T.mono, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, ...style }}>{children}</div>;
}

function SearchBar({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.muted, fontSize: 13 }}>🔍</span>
      <Inp value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ paddingLeft: 30 }} />
    </div>
  );
}

function formatTime(ts) {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

/* ─────────────────────────────────────────────────────────────
   MODULE PICKER — visual domain accordion with checkboxes
───────────────────────────────────────────────────────────── */
function ModulePicker({ selected, onChange, style }) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const filtered = useMemo(() => {
    if (!search) return MODULE_REGISTRY;
    const q = search.toLowerCase();
    return MODULE_REGISTRY.map(g => ({
      ...g,
      modules: g.modules.filter(m => m.label.toLowerCase().includes(q) || m.path.toLowerCase().includes(q)),
    })).filter(g => g.modules.length > 0);
  }, [search]);

  const toggleModule = (path) => {
    const next = new Set(selectedSet);
    next.has(path) ? next.delete(path) : next.add(path);
    onChange([...next]);
  };

  const toggleGroup = (group) => {
    const groupPaths = MODULE_REGISTRY.find(g => g.group === group)?.modules.map(m => m.path) || [];
    const allSelected = groupPaths.every(p => selectedSet.has(p));
    const next = new Set(selectedSet);
    groupPaths.forEach(p => allSelected ? next.delete(p) : next.add(p));
    onChange([...next]);
  };

  return (
    <div style={style}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search modules…" />
        <Btn onClick={() => onChange([...ALL_MODULE_PATHS])} variant="secondary" size="sm" style={{ whiteSpace: 'nowrap' }}>All</Btn>
        <Btn onClick={() => onChange([])} variant="secondary" size="sm" style={{ whiteSpace: 'nowrap' }}>None</Btn>
      </div>
      <div style={{ fontSize: 11, color: T.muted, fontFamily: T.mono, marginBottom: 8 }}>
        {selectedSet.size} / {TOTAL_MODULES} modules selected
      </div>
      <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {filtered.map(group => {
          const gpaths = group.modules.map(m => m.path);
          const selCount = gpaths.filter(p => selectedSet.has(p)).length;
          const allSel = selCount === gpaths.length;
          const partSel = selCount > 0 && !allSel;
          const isOpen = expanded[group.group] ?? (search.length > 0);
          return (
            <div key={group.group} style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: T.surface, cursor: 'pointer' }}>
                <input type="checkbox" checked={allSel}
                  ref={el => { if (el) el.indeterminate = partSel; }}
                  onChange={() => toggleGroup(group.group)}
                  style={{ width: 14, height: 14, cursor: 'pointer', accentColor: group.color }} />
                <span style={{ fontSize: 13 }}>{group.icon}</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: T.text }}
                  onClick={() => setExpanded(e => ({ ...e, [group.group]: !e[group.group] }))}>{group.group}</span>
                <span style={{ fontSize: 11, fontFamily: T.mono, color: group.color }}>{selCount}/{gpaths.length}</span>
                <span onClick={() => setExpanded(e => ({ ...e, [group.group]: !e[group.group] }))}
                  style={{ color: T.muted, fontSize: 11, cursor: 'pointer' }}>{isOpen ? '▲' : '▼'}</span>
              </div>
              {isOpen && (
                <div style={{ padding: '4px 12px 8px', background: T.card + 'bb', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {group.modules.map(m => (
                    <label key={m.path} style={{
                      display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
                      background: selectedSet.has(m.path) ? group.color + '22' : T.surface,
                      border: `1px solid ${selectedSet.has(m.path) ? group.color + '55' : T.border}`,
                      borderRadius: 4, padding: '3px 7px', fontSize: 11,
                      color: selectedSet.has(m.path) ? group.color : T.muted,
                      transition: 'all 0.1s',
                    }}>
                      <input type="checkbox" checked={selectedSet.has(m.path)}
                        onChange={() => toggleModule(m.path)}
                        style={{ width: 11, height: 11, accentColor: group.color }} />
                      {m.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DASHBOARD TAB
───────────────────────────────────────────────────────────── */
function DashboardTab({ store }) {
  const { users, presets, invites, auditLog } = store;

  const roleChartData = useMemo(() => {
    const map = {};
    ROLES.forEach(r => { map[r.id] = 0; });
    users.forEach(u => { if (map[u.role] != null) map[u.role]++; });
    return ROLES.map(r => ({ name: r.label, value: map[r.id] || 0, fill: r.color }));
  }, [users]);

  const activityData = useMemo(() => {
    const days = 7;
    const bins = Array.from({ length: days }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
      return { date: d.toLocaleDateString('en', { weekday: 'short' }), events: 0 };
    });
    const now = Date.now(); const dayMs = 86400000;
    auditLog.forEach(e => {
      const ago = Math.floor((now - e.ts) / dayMs);
      if (ago < days) bins[days - 1 - ago].events++;
    });
    return bins;
  }, [auditLog]);

  const moduleDistData = useMemo(() => MODULE_REGISTRY.slice(0, 8).map(g => ({
    name: g.group.split(' & ')[0].split(' ')[0],
    users: users.filter(u => {
      const eff = resolveEffectivePaths(u, presets);
      return g.modules.some(m => eff.includes(m.path));
    }).length,
    fill: g.color,
  })), [users, presets]);

  const pendingInvites = invites.filter(i => i.status === 'pending').length;
  const activeUsers   = users.filter(u => u.status === 'active').length;
  const avgModules    = users.length
    ? Math.round(users.reduce((s, u) => s + resolveEffectivePaths(u, presets).length, 0) / users.length)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <KpiCard label="Total Users"    value={users.length}    sub={`${activeUsers} active`}            color={T.blue}   icon="👥" />
        <KpiCard label="Pending Invites" value={pendingInvites} sub="awaiting acceptance"                color={T.orange} icon="✉️" />
        <KpiCard label="Role Presets"   value={presets.length}  sub="access templates"                   color={T.green}  icon="🎛️" />
        <KpiCard label="Avg Modules"    value={avgModules}      sub={`of ${TOTAL_MODULES} total`}        color={T.purple} icon="📦" />
        <KpiCard label="Audit Events"   value={auditLog.length} sub="in log"                             color={T.cyan}   icon="📋" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 14 }}>Role Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={roleChartData.filter(r => r.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}
                label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {roleChartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, color: T.text, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 14 }}>Audit Activity (7 days)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={activityData} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="date" tick={{ fill: T.muted, fontSize: 11 }} />
              <YAxis tick={{ fill: T.muted, fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, color: T.text, fontSize: 12 }} />
              <Bar dataKey="events" fill={T.blue} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 14 }}>Module Access by Domain</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={moduleDistData} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" tick={{ fill: T.muted, fontSize: 11 }} domain={[0, users.length]} />
              <YAxis type="category" dataKey="name" tick={{ fill: T.muted, fontSize: 10 }} width={72} />
              <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, color: T.text, fontSize: 12 }} />
              <Bar dataKey="users" radius={[0, 4, 4, 0]}>
                {moduleDistData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 14 }}>Recent Activity</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {auditLog.slice(0, 6).map(e => (
              <div key={e.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <SeverityDot severity={e.severity} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: T.text }}>
                    <span style={{ color: T.accent, fontWeight: 600 }}>{e.actor}</span>
                    {' '}<span style={{ color: T.muted }}>{e.action.replace(/_/g, ' ')}</span>
                    {e.target && e.target !== 'system' && <>{' '}<span style={{ color: T.blue }}>{e.target}</span></>}
                  </div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{formatTime(e.ts)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 14 }}>User Access Coverage</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {users.map(u => {
            const eff = resolveEffectivePaths(u, presets);
            const pct = Math.round((eff.length / TOTAL_MODULES) * 100);
            const r = ROLE_MAP[u.role] || {};
            return (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar initials={u.avatar} role={u.role} size={28} />
                <div style={{ width: 130, fontSize: 12, color: T.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                <RoleBadge role={u.role} />
                <div style={{ flex: 1, height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: r.color || T.accent, borderRadius: 3, transition: 'width 0.5s' }} />
                </div>
                <div style={{ width: 90, fontSize: 11, fontFamily: T.mono, color: T.muted, textAlign: 'right' }}>
                  {eff.length}/{TOTAL_MODULES} ({pct}%)
                </div>
                <StatusBadge status={u.status} />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   USER PROFILE DRAWER
───────────────────────────────────────────────────────────── */
function UserProfileDrawer({ user, store, update, addAudit, onClose }) {
  const { presets } = store;
  const [sec, setSec]             = useState('overview');
  const [editRole, setEditRole]   = useState(user?.role || 'viewer');
  const [editPreset, setEditPreset] = useState(user?.presetId || '');
  const [grantPaths, setGrant]    = useState(user?.grantedPaths || []);
  const [denyPaths,  setDeny]     = useState(user?.deniedPaths  || []);

  useEffect(() => {
    if (user) {
      setEditRole(user.role); setEditPreset(user.presetId || '');
      setGrant(user.grantedPaths || []); setDeny(user.deniedPaths || []);
      setSec('overview');
    }
  }, [user?.id]);

  if (!user) return null;

  const effectivePaths = resolveEffectivePaths(
    { ...user, role: editRole, presetId: editPreset, grantedPaths: grantPaths, deniedPaths: denyPaths },
    presets
  );

  const save = () => {
    const oldRole = user.role;
    update(s => ({
      ...s,
      users: s.users.map(u => u.id === user.id
        ? { ...u, role: editRole, presetId: editPreset, grantedPaths: grantPaths, deniedPaths: denyPaths }
        : u),
    }));
    if (oldRole !== editRole) addAudit('Admin', 'role_change', user.name, `${oldRole} → ${editRole}`, 'medium');
    else addAudit('Admin', 'module_update', user.name, `${effectivePaths.length} effective modules`, 'low');
    onClose();
  };

  const toggleStatus = () => {
    const next = user.status === 'active' ? 'inactive' : 'active';
    update(s => ({ ...s, users: s.users.map(u => u.id === user.id ? { ...u, status: next } : u) }));
    addAudit('Admin', next === 'inactive' ? 'user_suspended' : 'user_activated', user.name, '', 'high');
    onClose();
  };

  const preset = presets.find(p => p.id === editPreset);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <Avatar initials={user.avatar} role={user.role} size={52} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: T.text }}>{user.name}</div>
          <div style={{ fontSize: 12, color: T.muted }}>{user.email}</div>
          <div style={{ marginTop: 4, display: 'flex', gap: 6 }}>
            <RoleBadge role={user.role} />
            <StatusBadge status={user.status} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, marginBottom: 18 }}>
        {['overview', 'access', 'advanced'].map(s => (
          <button key={s} onClick={() => setSec(s)} style={{
            background: 'none', border: 'none',
            borderBottom: sec === s ? `2px solid ${T.accent}` : '2px solid transparent',
            color: sec === s ? T.accent : T.muted,
            padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            textTransform: 'capitalize',
          }}>{s}</button>
        ))}
      </div>

      {sec === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[{ l: 'Department', v: user.department }, { l: 'Timezone', v: user.timezone },
              { l: 'Last Login', v: formatTime(user.lastLogin) }, { l: 'Created', v: formatTime(user.createdAt) }].map(i => (
              <div key={i.l}><Label>{i.l}</Label><div style={{ fontSize: 13, color: T.text }}>{i.v}</div></div>
            ))}
          </div>
          <div>
            <Label>Role</Label>
            <Sel value={editRole} onChange={e => setEditRole(e.target.value)} style={{ width: '100%' }}>
              {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </Sel>
          </div>
          {editRole !== 'super_admin' && (
            <div>
              <Label>Role Preset</Label>
              <Sel value={editPreset} onChange={e => setEditPreset(e.target.value)} style={{ width: '100%' }}>
                <option value="">— No Preset —</option>
                {presets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.paths.length} modules)</option>)}
              </Sel>
            </div>
          )}
          <div style={{ background: T.surface, borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>
              Effective Access — {effectivePaths.length} modules ({Math.round(effectivePaths.length / TOTAL_MODULES * 100)}%)
            </div>
            {editRole === 'super_admin'
              ? <div style={{ fontSize: 12, color: T.accent, fontWeight: 600 }}>✓ Full platform access</div>
              : <div style={{ fontSize: 11, color: T.muted }}>Preset: {preset?.paths.length || 0} + Granted: {grantPaths.length} − Denied: {denyPaths.length}</div>
            }
          </div>
        </div>
      )}

      {sec === 'access' && (
        <div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>{effectivePaths.length} modules accessible</div>
          <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MODULE_REGISTRY.map(g => {
              const eff = g.modules.filter(m => effectivePaths.includes(m.path));
              if (!eff.length) return null;
              return (
                <div key={g.group}>
                  <div style={{ fontSize: 11, color: g.color, fontWeight: 700, marginBottom: 5 }}>
                    {g.icon} {g.group} ({eff.length}/{g.modules.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {g.modules.map(m => (
                      <span key={m.path} style={{
                        fontSize: 10, padding: '2px 6px', borderRadius: 3,
                        background: effectivePaths.includes(m.path) ? g.color + '22' : T.border,
                        color: effectivePaths.includes(m.path) ? g.color : T.muted,
                        border: `1px solid ${effectivePaths.includes(m.path) ? g.color + '44' : 'transparent'}`,
                      }}>{m.label}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sec === 'advanced' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Label>Additional Granted Modules</Label>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>Added on top of preset</div>
            <ModulePicker selected={grantPaths} onChange={setGrant} />
          </div>
          <div>
            <Label>Denied Modules</Label>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>Removed from preset</div>
            <ModulePicker selected={denyPaths} onChange={setDeny} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
        <Btn onClick={save} variant="primary">Save Changes</Btn>
        <Btn onClick={onClose} variant="secondary">Cancel</Btn>
        <Btn onClick={toggleStatus} variant={user.status === 'active' ? 'danger' : 'success'} style={{ marginLeft: 'auto' }}>
          {user.status === 'active' ? 'Suspend' : 'Activate'}
        </Btn>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   USERS TAB
───────────────────────────────────────────────────────────── */
function UsersTab({ store, update, addAudit }) {
  const { users, presets } = store;
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleF]    = useState('');
  const [statusFilter, setStatusF]= useState('');
  const [drawerUser, setDrawer]   = useState(null);
  const [showCreate, setCreate]   = useState(false);
  const [newU, setNewU] = useState({ name: '', email: '', role: 'team_member', presetId: '', department: '', timezone: 'UTC' });

  const filtered = useMemo(() => users.filter(u => {
    const q = search.toLowerCase();
    if (search && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    if (roleFilter   && u.role   !== roleFilter)   return false;
    if (statusFilter && u.status !== statusFilter) return false;
    return true;
  }), [users, search, roleFilter, statusFilter]);

  const createUser = () => {
    if (!newU.name || !newU.email) return;
    const u = {
      id: 'user_' + generateId(), ...newU,
      grantedPaths: [], deniedPaths: [], status: 'active',
      lastLogin: Date.now(), createdAt: Date.now(),
      avatar: newU.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    };
    update(s => ({ ...s, users: [...s.users, u] }));
    addAudit('Admin', 'user_created', u.name, `Role: ${u.role}`, 'low');
    setCreate(false);
    setNewU({ name: '', email: '', role: 'team_member', presetId: '', department: '', timezone: 'UTC' });
  };

  const removeUser = (userId, name) => {
    if (!window.confirm(`Remove ${name}?`)) return;
    update(s => ({ ...s, users: s.users.filter(u => u.id !== userId) }));
    addAudit('Admin', 'user_deleted', name, '', 'high');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search name or email…" />
        <Sel value={roleFilter} onChange={e => setRoleF(e.target.value)} style={{ width: 160 }}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
        </Sel>
        <Sel value={statusFilter} onChange={e => setStatusF(e.target.value)} style={{ width: 130 }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Sel>
        <Btn onClick={() => setCreate(true)} variant="primary" style={{ marginLeft: 'auto' }}>+ Add User</Btn>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: T.surface }}>
              {['User', 'Role', 'Preset', 'Modules', 'Last Login', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: T.muted, fontWeight: 600, fontFamily: T.mono, borderBottom: `1px solid ${T.border}`, letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => {
              const eff = resolveEffectivePaths(u, presets);
              const preset = presets.find(p => p.id === u.presetId);
              const rc = ROLE_MAP[u.role]?.color || T.muted;
              return (
                <tr key={u.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surface + '44', cursor: 'pointer' }}
                  onClick={() => setDrawer(u)}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar initials={u.avatar} role={u.role} size={30} />
                      <div>
                        <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: T.muted }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }} onClick={e => e.stopPropagation()}><RoleBadge role={u.role} /></td>
                  <td style={{ padding: '10px 14px', fontSize: 11, color: T.muted }}>{preset?.name || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontSize: 12, fontFamily: T.mono, color: T.text }}>
                      {u.role === 'super_admin' ? <span style={{ color: T.accent }}>All ({TOTAL_MODULES})</span> : `${eff.length}/${TOTAL_MODULES}`}
                    </div>
                    {u.role !== 'super_admin' && (
                      <div style={{ width: 72, height: 4, background: T.border, borderRadius: 2, marginTop: 4 }}>
                        <div style={{ width: `${Math.round(eff.length / TOTAL_MODULES * 100)}%`, height: '100%', background: rc, borderRadius: 2 }} />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 11, color: T.muted, fontFamily: T.mono }}>{formatTime(u.lastLogin)}</td>
                  <td style={{ padding: '10px 14px' }}><StatusBadge status={u.status} /></td>
                  <td style={{ padding: '10px 14px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn size="sm" variant="secondary" onClick={() => setDrawer(u)}>Edit</Btn>
                      <Btn size="sm" variant="danger" onClick={() => removeUser(u.id, u.name)}>✕</Btn>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: T.muted, fontSize: 13 }}>No users match filters.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <Modal open={showCreate} onClose={() => setCreate(false)} title="Create New User">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><Label>Full Name</Label><Inp value={newU.name} onChange={e => setNewU(p => ({ ...p, name: e.target.value }))} placeholder="Jane Smith" /></div>
            <div><Label>Email</Label><Inp value={newU.email} onChange={e => setNewU(p => ({ ...p, email: e.target.value }))} placeholder="jane@company.com" /></div>
            <div><Label>Role</Label>
              <Sel value={newU.role} onChange={e => setNewU(p => ({ ...p, role: e.target.value, presetId: '' }))} style={{ width: '100%' }}>
                {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </Sel>
            </div>
            <div><Label>Preset</Label>
              <Sel value={newU.presetId} onChange={e => setNewU(p => ({ ...p, presetId: e.target.value }))} style={{ width: '100%' }}>
                <option value="">— None —</option>
                {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Sel>
            </div>
            <div><Label>Department</Label><Inp value={newU.department} onChange={e => setNewU(p => ({ ...p, department: e.target.value }))} placeholder="Research" /></div>
            <div><Label>Timezone</Label>
              <Sel value={newU.timezone} onChange={e => setNewU(p => ({ ...p, timezone: e.target.value }))} style={{ width: '100%' }}>
                {['UTC','America/New_York','Europe/London','Asia/Kolkata','Asia/Singapore','Australia/Sydney'].map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </Sel>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn onClick={createUser} variant="primary">Create User</Btn>
            <Btn onClick={() => setCreate(false)} variant="secondary">Cancel</Btn>
          </div>
        </div>
      </Modal>

      <Drawer open={!!drawerUser} onClose={() => setDrawer(null)} title={drawerUser ? `Edit — ${drawerUser.name}` : ''}>
        {drawerUser && (
          <UserProfileDrawer
            user={store.users.find(u => u.id === drawerUser.id) || drawerUser}
            store={store} update={update} addAudit={addAudit}
            onClose={() => setDrawer(null)}
          />
        )}
      </Drawer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ROLE MATRIX TAB
───────────────────────────────────────────────────────────── */
function RoleMatrixTab() {
  const MODULE_ACCESS_MAP = {
    super_admin: { disc: true, climate: true, portfolio: true, risk: true, carbon: true, insurance: true, esg: true, nature: true },
    team_member:  { disc: true, climate: true, portfolio: true, risk: true, carbon: true, insurance: false, esg: true, nature: false },
    partner:      { disc: true, climate: true, portfolio: true, risk: false, carbon: false, insurance: false, esg: false, nature: false },
    demo:         { disc: false, climate: false, portfolio: false, risk: false, carbon: false, insurance: false, esg: false, nature: false },
    viewer:       { disc: true, climate: false, portfolio: false, risk: false, carbon: false, insurance: false, esg: false, nature: false },
  };

  const SECTION_GROUPS = [
    {
      title: 'Administration', items: PERMISSIONS,
      getValue: (r, p) => ROLE_MAP[r.id]?.[p.id] || false,
    },
    {
      title: 'Domain Access', items: [
        { id: 'disc', label: 'Disclosure & Reporting' },
        { id: 'climate', label: 'Climate Alignment' },
        { id: 'portfolio', label: 'Portfolio Analytics' },
        { id: 'risk', label: 'Physical Risk' },
        { id: 'carbon', label: 'Carbon Markets' },
        { id: 'insurance', label: 'Insurance & Actuarial' },
        { id: 'esg', label: 'ESG Intelligence' },
        { id: 'nature', label: 'Nature & Biodiversity' },
      ],
      getValue: (r, p) => (MODULE_ACCESS_MAP[r.id] || {})[p.id] || false,
    },
  ];

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 4 }}>Role Permissions Matrix</div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 20 }}>Capability comparison across all roles.</div>
      <Card style={{ padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: T.surface }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: T.muted, fontFamily: T.mono, borderBottom: `1px solid ${T.border}`, width: 200 }}>CAPABILITY</th>
              {ROLES.map(r => (
                <th key={r.id} style={{ padding: '12px 16px', textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, color: r.color, fontWeight: 700, fontFamily: T.mono, letterSpacing: 0.5 }}>{r.label.toUpperCase()}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SECTION_GROUPS.map((sg, gi) => (
              <React.Fragment key={sg.title}>
                <tr>
                  <td colSpan={ROLES.length + 1} style={{ padding: '10px 16px 4px', background: T.bg, fontSize: 10, color: T.accent, fontWeight: 700, fontFamily: T.mono, letterSpacing: 2, textTransform: 'uppercase', borderTop: gi > 0 ? `1px solid ${T.border}` : 'none' }}>
                    {sg.title}
                  </td>
                </tr>
                {sg.items.map((item, pi) => (
                  <tr key={item.id} style={{ background: pi % 2 === 0 ? 'transparent' : T.surface + '44' }}>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: T.text, borderRight: `1px solid ${T.border}` }}>{item.label}</td>
                    {ROLES.map(r => {
                      const has = sg.getValue(r, item);
                      return (
                        <td key={r.id} style={{ padding: '10px 16px', textAlign: 'center', borderRight: `1px solid ${T.border}22` }}>
                          {has ? <span style={{ color: T.green, fontSize: 16 }}>✓</span> : <span style={{ color: T.border, fontSize: 16 }}>—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginTop: 20 }}>
        {ROLES.map(r => (
          <Card key={r.id} style={{ borderLeft: `3px solid ${r.color}` }}>
            <div style={{ fontWeight: 700, color: r.color, fontSize: 13, marginBottom: 6 }}>{r.label}</div>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5, marginBottom: 10 }}>{r.description}</div>
            <div style={{ fontSize: 11 }}>
              {PERMISSIONS.map(p => (
                <div key={p.id} style={{ color: r[p.id] ? T.green : T.border, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>{r[p.id] ? '✓' : '—'}</span> {p.label}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MODULE MANAGER TAB
───────────────────────────────────────────────────────────── */
function ModuleManagerTab({ store, update, addAudit }) {
  const { users, presets } = store;
  const [selectedUser, setSelUser] = useState('');
  const [localPaths, setLocal]     = useState([]);
  const [dirty, setDirty]          = useState(false);
  const [viewMode, setView]        = useState('picker');

  const user = users.find(u => u.id === selectedUser);

  useEffect(() => {
    if (user) { setLocal(resolveEffectivePaths(user, presets)); setDirty(false); }
  }, [selectedUser]);

  const handleChange = (paths) => { setLocal(paths); setDirty(true); };

  const save = () => {
    if (!user) return;
    const preset = presets.find(p => p.id === user.presetId);
    const basePaths = new Set(preset ? preset.paths : []);
    const newSet = new Set(localPaths);
    const granted = localPaths.filter(p => !basePaths.has(p));
    const denied  = [...basePaths].filter(p => !newSet.has(p));
    update(s => ({
      ...s,
      users: s.users.map(u => u.id === selectedUser ? { ...u, grantedPaths: granted, deniedPaths: denied } : u),
    }));
    addAudit('Admin', 'module_update', user.name, `${localPaths.length} effective modules`, 'medium');
    setDirty(false);
  };

  const heatmapData = useMemo(() => MODULE_REGISTRY.map(g => ({
    ...g,
    modules: g.modules.map(m => ({
      ...m,
      userCount: users.filter(u => resolveEffectivePaths(u, presets).includes(m.path)).length,
    })),
  })), [users, presets]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <Label>Select User</Label>
          <Sel value={selectedUser} onChange={e => setSelUser(e.target.value)} style={{ width: 280 }}>
            <option value="">— Select a user —</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({ROLE_MAP[u.role]?.label})</option>)}
          </Sel>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn variant={viewMode === 'picker' ? 'primary' : 'secondary'} size="sm" onClick={() => setView('picker')}>Module Picker</Btn>
          <Btn variant={viewMode === 'heatmap' ? 'primary' : 'secondary'} size="sm" onClick={() => setView('heatmap')}>Access Heatmap</Btn>
        </div>
        {dirty && viewMode === 'picker' && (
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <Btn onClick={save} variant="primary" size="sm">Save Access</Btn>
            <Btn onClick={() => { setLocal(resolveEffectivePaths(user, presets)); setDirty(false); }} variant="secondary" size="sm">Reset</Btn>
          </div>
        )}
      </div>

      {viewMode === 'picker' && (
        user ? (
          user.role === 'super_admin' ? (
            <Card style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🔓</div>
              <div style={{ color: T.accent, fontWeight: 700, fontSize: 15 }}>Super Admin — Full Platform Access</div>
              <div style={{ color: T.muted, fontSize: 12, marginTop: 6 }}>All {TOTAL_MODULES} modules are always accessible.</div>
            </Card>
          ) : (
            <ModulePicker selected={localPaths} onChange={handleChange} />
          )
        ) : (
          <Card style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👤</div>
            <div style={{ color: T.muted, fontSize: 13 }}>Select a user above to manage their module access.</div>
          </Card>
        )
      )}

      {viewMode === 'heatmap' && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>Module Access Heatmap</div>
            <div style={{ fontSize: 11, color: T.muted }}>Color intensity = % of users with access ({users.length} total)</div>
          </div>
          <div style={{ padding: 16, maxHeight: 520, overflowY: 'auto' }}>
            {heatmapData.map(g => (
              <div key={g.group} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: g.color, fontWeight: 700, marginBottom: 6 }}>{g.icon} {g.group}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {g.modules.map(m => {
                    const pct = users.length > 0 ? m.userCount / users.length : 0;
                    const opacity = Math.round(pct * 100 + 20);
                    return (
                      <div key={m.path} title={`${m.label}: ${m.userCount}/${users.length} users`} style={{
                        padding: '3px 7px', borderRadius: 4, fontSize: 10,
                        background: g.color + opacity.toString(16).padStart(2, '0'),
                        color: pct > 0.4 ? '#fff' : T.muted, cursor: 'default',
                      }}>
                        {m.label} <span style={{ opacity: 0.7 }}>{m.userCount}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   INVITES TAB
───────────────────────────────────────────────────────────── */
function InvitesTab({ store, update, addAudit }) {
  const { invites, presets, users } = store;
  const [statusFilter, setStatusF] = useState('');
  const [showCreate, setCreate]    = useState(false);
  const [showPicker, setPicker]    = useState(false);
  const [form, setForm] = useState({ email: '', role: 'team_member', presetId: '', paths: [], note: '', expireDays: 7 });

  const filtered = useMemo(() => invites.filter(i => !statusFilter || i.status === statusFilter), [invites, statusFilter]);

  const sendInvite = () => {
    if (!form.email) return;
    const inv = {
      id: 'inv_' + generateId(), email: form.email, role: form.role,
      presetId: form.presetId, paths: form.paths, status: 'pending', note: form.note,
      expiresAt: Date.now() + form.expireDays * 86400000,
      createdAt: Date.now(), createdBy: users[0]?.id || '',
    };
    update(s => ({ ...s, invites: [inv, ...s.invites] }));
    addAudit('Admin', 'invite_sent', form.email, `Role: ${form.role}, ${form.paths.length} modules`, 'low');
    setCreate(false);
    setForm({ email: '', role: 'team_member', presetId: '', paths: [], note: '', expireDays: 7 });
  };

  const revoke = (id, email) => {
    update(s => ({ ...s, invites: s.invites.map(i => i.id === id ? { ...i, status: 'expired' } : i) }));
    addAudit('Admin', 'invite_revoked', email, '', 'medium');
  };

  const resend = (inv) => {
    const n = { ...inv, id: 'inv_' + generateId(), status: 'pending', createdAt: Date.now(), expiresAt: Date.now() + 7 * 86400000 };
    update(s => ({ ...s, invites: [n, ...s.invites] }));
    addAudit('Admin', 'invite_resent', inv.email, '', 'low');
  };

  const onPresetPick = (presetId) => {
    const p = presets.find(x => x.id === presetId);
    setForm(f => ({ ...f, presetId, paths: p ? [...p.paths] : f.paths }));
  };

  const STC = { pending: T.orange, accepted: T.green, expired: T.red };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Sel value={statusFilter} onChange={e => setStatusF(e.target.value)} style={{ width: 160 }}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="expired">Expired</option>
        </Sel>
        <Btn onClick={() => setCreate(true)} variant="primary" style={{ marginLeft: 'auto' }}>+ Send Invite</Btn>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        {['pending', 'accepted', 'expired'].map(s => (
          <div key={s} style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', borderLeft: `3px solid ${STC[s]}` }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: STC[s], fontFamily: T.mono }}>
              {invites.filter(i => i.status === s).length}
            </div>
            <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{s}</div>
          </div>
        ))}
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: T.surface }}>
              {['Email', 'Role', 'Modules', 'Note', 'Expires', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: T.muted, fontWeight: 600, fontFamily: T.mono, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv, i) => {
              const preset = presets.find(p => p.id === inv.presetId);
              const cnt = inv.paths?.length || preset?.paths?.length || 0;
              return (
                <tr key={inv.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surface + '44' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: T.text }}>{inv.email}</td>
                  <td style={{ padding: '10px 14px' }}><RoleBadge role={inv.role} /></td>
                  <td style={{ padding: '10px 14px', fontSize: 12, fontFamily: T.mono, color: T.muted }}>{cnt}</td>
                  <td style={{ padding: '10px 14px', fontSize: 11, color: T.muted }}>{inv.note || '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 11, fontFamily: T.mono, color: inv.expiresAt < Date.now() ? T.red : T.muted }}>
                    {new Date(inv.expiresAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px 14px' }}><StatusBadge status={inv.status} /></td>
                  <td style={{ padding: '10px 14px' }}>
                    {inv.status === 'pending' && <Btn size="sm" variant="danger" onClick={() => revoke(inv.id, inv.email)}>Revoke</Btn>}
                    {inv.status === 'expired' && <Btn size="sm" variant="secondary" onClick={() => resend(inv)}>Resend</Btn>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Modal open={showCreate} onClose={() => setCreate(false)} title="Send New Invite" width={720}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><Label>Email Address</Label><Inp value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@company.com" /></div>
            <div><Label>Role</Label>
              <Sel value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ width: '100%' }}>
                {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </Sel>
            </div>
            <div><Label>Preset (optional)</Label>
              <Sel value={form.presetId} onChange={e => onPresetPick(e.target.value)} style={{ width: '100%' }}>
                <option value="">— Custom —</option>
                {presets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.paths.length})</option>)}
              </Sel>
            </div>
            <div><Label>Expires In</Label>
              <Sel value={form.expireDays} onChange={e => setForm(f => ({ ...f, expireDays: +e.target.value }))} style={{ width: '100%' }}>
                {[1, 3, 7, 14, 30].map(d => <option key={d} value={d}>{d} days</option>)}
              </Sel>
            </div>
          </div>
          <div><Label>Note</Label><Inp value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Purpose of this invite" /></div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Label style={{ marginBottom: 0 }}>Module Access ({form.paths.length} selected)</Label>
              <Btn size="sm" variant="secondary" onClick={() => setPicker(!showPicker)}>
                {showPicker ? 'Hide Picker' : 'Edit Modules'}
              </Btn>
            </div>
            {showPicker && <div style={{ marginTop: 10 }}><ModulePicker selected={form.paths} onChange={p => setForm(f => ({ ...f, paths: p }))} /></div>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn onClick={sendInvite} variant="primary">Send Invite</Btn>
            <Btn onClick={() => setCreate(false)} variant="secondary">Cancel</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PRESETS TAB
───────────────────────────────────────────────────────────── */
function PresetsTab({ store, update, addAudit }) {
  const { presets, users } = store;
  const [editing, setEditing]   = useState(null);
  const [showCreate, setCreate] = useState(false);
  const [form, setForm] = useState({ name: '', role: 'team_member', description: '', paths: [] });

  const openEdit = (p) => { setEditing(p); setForm({ name: p.name, role: p.role, description: p.description, paths: [...p.paths] }); };

  const saveEdit = () => {
    update(s => ({ ...s, presets: s.presets.map(p => p.id === editing.id ? { ...p, ...form, updatedAt: Date.now() } : p) }));
    addAudit('Admin', 'preset_update', form.name, `${form.paths.length} modules`, 'medium');
    setEditing(null);
  };

  const createPreset = () => {
    if (!form.name) return;
    const p = { id: 'preset_' + generateId(), ...form, createdAt: Date.now(), updatedAt: Date.now() };
    update(s => ({ ...s, presets: [...s.presets, p] }));
    addAudit('Admin', 'preset_created', form.name, `${form.paths.length} modules`, 'low');
    setCreate(false);
    setForm({ name: '', role: 'team_member', description: '', paths: [] });
  };

  const deletePreset = (id, name) => {
    const inUse = users.filter(u => u.presetId === id).length;
    if (inUse > 0 && !window.confirm(`${name} is used by ${inUse} user(s). Delete anyway?`)) return;
    update(s => ({ ...s, presets: s.presets.filter(p => p.id !== id) }));
    addAudit('Admin', 'preset_deleted', name, '', 'high');
  };

  const PresetForm = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><Label>Preset Name</Label><Inp value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. ESG Research Analyst" /></div>
        <div><Label>Default Role</Label>
          <Sel value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ width: '100%' }}>
            {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </Sel>
        </div>
      </div>
      <div><Label>Description</Label><Inp value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What this preset is for" /></div>
      <div>
        <Label>Module Access ({form.paths.length} / {TOTAL_MODULES})</Label>
        <ModulePicker selected={form.paths} onChange={paths => setForm(f => ({ ...f, paths }))} />
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn onClick={() => { setForm({ name: '', role: 'team_member', description: '', paths: [] }); setCreate(true); }} variant="primary">+ New Preset</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {presets.map(p => {
          const r = ROLE_MAP[p.role] || {};
          const assigned = users.filter(u => u.presetId === p.id).length;
          return (
            <Card key={p.id} style={{ borderLeft: `3px solid ${r.color || T.muted}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{p.name}</div>
                  <div style={{ marginTop: 4 }}><RoleBadge role={p.role} /></div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn size="sm" variant="secondary" onClick={() => openEdit(p)}>Edit</Btn>
                  <Btn size="sm" variant="danger" onClick={() => deletePreset(p.id, p.name)}>✕</Btn>
                </div>
              </div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 10, lineHeight: 1.5 }}>{p.description}</div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, fontFamily: T.mono }}>
                <span><span style={{ color: T.muted }}>Modules: </span><span style={{ color: T.accent, fontWeight: 700 }}>{p.paths.length}</span></span>
                <span><span style={{ color: T.muted }}>Users: </span><span style={{ color: T.blue, fontWeight: 700 }}>{assigned}</span></span>
                <span style={{ marginLeft: 'auto', color: T.muted, fontSize: 10 }}>{formatTime(p.updatedAt)}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
                {MODULE_REGISTRY.map(g => {
                  const cnt = g.modules.filter(m => p.paths.includes(m.path)).length;
                  if (!cnt) return null;
                  return (
                    <span key={g.group} title={`${cnt}/${g.modules.length} ${g.group}`} style={{
                      fontSize: 10, padding: '2px 6px', borderRadius: 3,
                      background: g.color + '22', color: g.color, border: `1px solid ${g.color}33`,
                    }}>{g.icon} {cnt}</span>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit — ${editing?.name}`} width={780}>
        <PresetForm />
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <Btn onClick={saveEdit} variant="primary">Save Preset</Btn>
          <Btn onClick={() => setEditing(null)} variant="secondary">Cancel</Btn>
        </div>
      </Modal>

      <Modal open={showCreate} onClose={() => setCreate(false)} title="Create New Preset" width={780}>
        <PresetForm />
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <Btn onClick={createPreset} variant="primary">Create Preset</Btn>
          <Btn onClick={() => setCreate(false)} variant="secondary">Cancel</Btn>
        </div>
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   AUDIT LOG TAB
───────────────────────────────────────────────────────────── */
function AuditLogTab({ store }) {
  const { auditLog } = store;
  const [search, setSearch] = useState('');
  const [sevF, setSev]      = useState('');
  const [actF, setAct]      = useState('');

  const actionTypes = [...new Set(auditLog.map(e => e.action))];

  const filtered = useMemo(() => auditLog.filter(e => {
    const q = search.toLowerCase();
    if (search && !e.actor.toLowerCase().includes(q) && !e.target.toLowerCase().includes(q) && !e.detail.toLowerCase().includes(q)) return false;
    if (sevF && e.severity !== sevF) return false;
    if (actF && e.action !== actF)   return false;
    return true;
  }), [auditLog, search, sevF, actF]);

  const ACTION_ICONS = {
    login: '🔐', role_change: '🔄', module_grant: '✅', module_deny: '🚫', module_update: '📦',
    invite_sent: '✉️', invite_revoked: '🔒', invite_resent: '↩️', invite_expired: '⏰',
    preset_created: '🆕', preset_update: '✏️', preset_deleted: '🗑️',
    user_created: '👤', user_deleted: '🗑️', user_suspended: '⛔', user_activated: '✅',
    settings_update: '⚙️',
  };
  const SEV_COLOR = { low: T.green, medium: T.orange, high: T.red };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search actor, target, detail…" />
        <Sel value={sevF} onChange={e => setSev(e.target.value)} style={{ width: 140 }}>
          <option value="">All Severity</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </Sel>
        <Sel value={actF} onChange={e => setAct(e.target.value)} style={{ width: 200 }}>
          <option value="">All Actions</option>
          {actionTypes.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </Sel>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted }}>{filtered.length} events</span>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ maxHeight: 560, overflowY: 'auto' }}>
          {filtered.map((e, i) => (
            <div key={e.id} style={{
              display: 'flex', gap: 14, padding: '12px 16px',
              borderBottom: `1px solid ${T.border}`,
              background: i % 2 === 0 ? 'transparent' : T.surface + '44',
              alignItems: 'flex-start',
            }}>
              <div style={{ fontSize: 17, width: 26, textAlign: 'center', flexShrink: 0 }}>{ACTION_ICONS[e.action] || '📌'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: T.accent }}>{e.actor}</span>
                  <span style={{ fontSize: 11, color: T.muted, fontFamily: T.mono, background: T.surface, padding: '1px 6px', borderRadius: 3 }}>
                    {e.action.replace(/_/g, ' ')}
                  </span>
                  {e.target && e.target !== 'system' && <span style={{ fontSize: 12, color: T.blue }}>{e.target}</span>}
                </div>
                {e.detail && <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{e.detail}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: 10, color: T.muted, fontFamily: T.mono }}>{formatTime(e.ts)}</span>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: SEV_COLOR[e.severity] || T.muted, display: 'inline-block' }} />
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: T.muted, fontSize: 13 }}>No events match your filters.</div>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SETTINGS TAB
───────────────────────────────────────────────────────────── */
function SettingsTab({ store, update, addAudit }) {
  const { settings } = store;
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  const save = () => {
    update(s => ({ ...s, settings: { ...form } }));
    addAudit('Admin', 'settings_update', 'system', `Session timeout: ${form.sessionTimeout}m`, 'medium');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetAll = () => {
    if (!window.confirm('Reset all admin data to seed defaults? This cannot be undone.')) return;
    localStorage.removeItem(STORE_KEY);
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 580 }}>
      <Card>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 16 }}>Session & Security</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <Label>Session Timeout (minutes)</Label>
            <Sel value={form.sessionTimeout} onChange={e => setForm(f => ({ ...f, sessionTimeout: +e.target.value }))} style={{ width: 200 }}>
              {[30, 60, 120, 240, 480, 720].map(m => <option key={m} value={m}>{m} minutes</option>)}
            </Sel>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="checkbox" id="req2fa" checked={form.require2fa}
              onChange={e => setForm(f => ({ ...f, require2fa: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: T.accent }} />
            <label htmlFor="req2fa" style={{ fontSize: 13, color: T.text, cursor: 'pointer' }}>Require 2FA for all users</label>
          </div>
          <div>
            <Label>Minimum Password Length</Label>
            <Sel value={form.passwordMinLen} onChange={e => setForm(f => ({ ...f, passwordMinLen: +e.target.value }))} style={{ width: 200 }}>
              {[8, 10, 12, 16, 20].map(n => <option key={n} value={n}>{n} characters</option>)}
            </Sel>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="checkbox" id="loginNotif" checked={form.loginNotifications}
              onChange={e => setForm(f => ({ ...f, loginNotifications: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: T.accent }} />
            <label htmlFor="loginNotif" style={{ fontSize: 13, color: T.text, cursor: 'pointer' }}>Email login notifications to admins</label>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Btn onClick={save} variant="primary">Save Settings</Btn>
            {saved && <span style={{ fontSize: 12, color: T.green }}>✓ Saved</span>}
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>Platform Info</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { l: 'Total Modules', v: TOTAL_MODULES },
            { l: 'Domain Groups', v: MODULE_REGISTRY.length },
            { l: 'Role Types',    v: ROLES.length },
            { l: 'Data Store',    v: 'localStorage (mock mode)' },
            { l: 'Backend Auth',  v: 'Optional (dual-mode fallback)' },
          ].map(i => (
            <div key={i.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: T.muted }}>{i.l}</span>
              <span style={{ color: T.text, fontFamily: T.mono, fontWeight: 600 }}>{i.v}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ borderColor: T.red + '44' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.red, marginBottom: 8 }}>Danger Zone</div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>
          Reset all users, presets, invites and audit log to seed defaults.
        </div>
        <Btn onClick={resetAll} variant="danger">Reset Admin Store</Btn>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────────────────────── */
const MAIN_TABS = [
  { id: 'dashboard', label: 'Dashboard',      icon: '📊' },
  { id: 'users',     label: 'Users',          icon: '👥' },
  { id: 'roles',     label: 'Role Matrix',    icon: '🔐' },
  { id: 'modules',   label: 'Module Manager', icon: '📦' },
  { id: 'invites',   label: 'Invites',        icon: '✉️' },
  { id: 'presets',   label: 'Presets',        icon: '🎛️' },
  { id: 'audit',     label: 'Audit Log',      icon: '📋' },
  { id: 'settings',  label: 'Settings',       icon: '⚙️' },
];

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { store, update, addAudit } = useStore();

  const tabsWithCounts = MAIN_TABS.map(t => ({
    ...t,
    count: t.id === 'users'   ? store.users.length
         : t.id === 'invites' ? store.invites.filter(i => i.status === 'pending').length
         : t.id === 'presets' ? store.presets.length
         : t.id === 'audit'   ? store.auditLog.length
         : undefined,
  }));

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: T.font, padding: '24px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <div style={{ fontSize: 28 }}>🛡️</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.accent, fontFamily: T.mono, letterSpacing: 1 }}>
              A² RBAC Administration Console
            </h1>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
              {store.users.length} users · {store.presets.length} presets · {TOTAL_MODULES} modules · localhost mock mode
            </div>
          </div>
          <div style={{ marginLeft: 'auto', background: T.green + '22', border: `1px solid ${T.green}44`, borderRadius: 6, padding: '6px 14px', fontSize: 11, color: T.green, fontFamily: T.mono, fontWeight: 600 }}>
            ● FULLY FUNCTIONAL
          </div>
        </div>
        <div style={{ height: 2, background: `linear-gradient(90deg, ${T.accent}, transparent)`, borderRadius: 1 }} />
      </div>

      <Tabs tabs={tabsWithCounts} active={activeTab} onChange={setActiveTab} style={{ marginBottom: 24 }} />

      {activeTab === 'dashboard' && <DashboardTab store={store} />}
      {activeTab === 'users'     && <UsersTab store={store} update={update} addAudit={addAudit} />}
      {activeTab === 'roles'     && <RoleMatrixTab />}
      {activeTab === 'modules'   && <ModuleManagerTab store={store} update={update} addAudit={addAudit} />}
      {activeTab === 'invites'   && <InvitesTab store={store} update={update} addAudit={addAudit} />}
      {activeTab === 'presets'   && <PresetsTab store={store} update={update} addAudit={addAudit} />}
      {activeTab === 'audit'     && <AuditLogTab store={store} />}
      {activeTab === 'settings'  && <SettingsTab store={store} update={update} addAudit={addAudit} />}
    </div>
  );
}
