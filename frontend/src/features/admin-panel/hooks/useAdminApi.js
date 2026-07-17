import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * useAdminApi — replaces localStorage mock store with real backend API calls.
 *
 * Backend endpoints (all require super_admin session, except maturity-map):
 *   Users:   GET/POST /api/admin/users, PUT /api/admin/users/{id}/role,
 *            DELETE /api/admin/users/{id} (deactivate), POST /api/admin/users/{id}/activate
 *   Presets: GET/POST /api/admin/presets, PUT /api/admin/presets/{id}, DELETE /api/admin/presets/{id} (deactivate)
 *   Invites: GET/POST /api/admin/invites, PUT /api/admin/invites/{id}
 *   Access:  POST /api/admin/access/grant, POST /api/admin/access/deny, DELETE /api/admin/access/{id}
 *            PUT /api/admin/users/{id}/modules — replace-all pick-and-choose {grants:[], denies:[]}
 *   Modules: GET /api/admin/modules/status, PUT /api/admin/modules/review, POST /api/admin/modules/feedback
 *            PUT /api/admin/modules/bulk-review, GET /api/admin/modules/maturity-map
 *   Kill-switch: GET /api/admin/modules/kill-switch (public), PUT /api/admin/modules/kill-switch
 *   Usage:   GET /api/admin/usage/summary, POST /api/admin/usage/log (any authenticated user)
 *   Bulk:    PUT /api/admin/users/bulk-modules — grants/denies applied to many users at once
 */
// A misrouted/unreachable backend (e.g. a request falling through to the
// frontend's own SPA catch-all) resolves as a successful axios response
// whose body is an HTML string, not the expected JSON array/object. Treating
// that as "no data" here — rather than crashing every .map/.filter call
// downstream — turns an infra routing problem into an honest empty state
// instead of an unmounted page.
const asArray = (v) => (Array.isArray(v) ? v : []);
const asUsageSummary = (v) => (v && typeof v === 'object' && !Array.isArray(v))
  ? { total: v.total || 0, top: asArray(v.top), recent: asArray(v.recent) }
  : { total: 0, top: [], recent: [] };

// A rejected Promise.allSettled entry silently degrading to an empty array
// (via asArray above) is safe for rendering but erases WHY the list is
// empty — "no team members" and "the /users call 401'd" look identical to a
// screen reader of the UI. Surface the real reason per endpoint instead of
// only the generic empty state, so a real failure is diagnosable without
// opening DevTools.
const describeRejection = (reason) => {
  if (reason?.response) return `HTTP ${reason.response.status}: ${reason.response.data?.detail || reason.message}`;
  return reason?.message || 'Request failed';
};

export default function useAdminApi() {
  const [users, setUsers]             = useState([]);
  const [presets, setPresets]         = useState([]);
  const [invites, setInvites]         = useState([]);
  const [moduleStatus, setModuleStatus] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [disabledModules, setDisabledModules] = useState([]);
  const [usageSummary, setUsageSummary] = useState({ total: 0, top: [], recent: [] });
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [fieldErrors, setFieldErrors] = useState({}); // { users: 'HTTP 403: ...', ... } — only failed calls appear here

  // ── Initial load ──────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, presetsRes, invitesRes, modulesRes, assignRes, killRes, usageRes] = await Promise.allSettled([
        axios.get('/api/admin/users'),
        axios.get('/api/admin/presets'),
        axios.get('/api/admin/invites'),
        axios.get('/api/admin/modules/status'),
        axios.get('/api/admin/refinement/assignments'),
        axios.get('/api/admin/modules/kill-switch'),
        axios.get('/api/admin/usage/summary'),
      ]);
      const nextFieldErrors = {};
      if (usersRes.status === 'fulfilled')   setUsers(asArray(usersRes.value.data));
      else nextFieldErrors.users = describeRejection(usersRes.reason);
      if (presetsRes.status === 'fulfilled') setPresets(asArray(presetsRes.value.data));
      else nextFieldErrors.presets = describeRejection(presetsRes.reason);
      if (invitesRes.status === 'fulfilled') setInvites(asArray(invitesRes.value.data));
      else nextFieldErrors.invites = describeRejection(invitesRes.reason);
      if (modulesRes.status === 'fulfilled') setModuleStatus(asArray(modulesRes.value.data));
      else nextFieldErrors.moduleStatus = describeRejection(modulesRes.reason);
      if (assignRes.status === 'fulfilled')  setAssignments(asArray(assignRes.value.data));
      else nextFieldErrors.assignments = describeRejection(assignRes.reason);
      if (killRes.status === 'fulfilled')    setDisabledModules(asArray(killRes.value.data));
      else nextFieldErrors.disabledModules = describeRejection(killRes.reason);
      if (usageRes.status === 'fulfilled')   setUsageSummary(asUsageSummary(usageRes.value.data));
      else nextFieldErrors.usageSummary = describeRejection(usageRes.reason);
      setFieldErrors(nextFieldErrors);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Users CRUD ────────────────────────────────────────────────
  const createUser = useCallback(async (data) => {
    // data: { email, name, role, preset_id?, duration_days?, password? }
    const res = await axios.post('/api/admin/users', data);
    await loadAll();
    return res.data;
  }, [loadAll]);

  const updateUserRole = useCallback(async (userId, data) => {
    // data: { role?, preset_id?, is_read_only?, duration_days? }
    const res = await axios.put(`/api/admin/users/${userId}/role`, data);
    await loadAll();
    return res.data;
  }, [loadAll]);

  const deactivateUser = useCallback(async (userId) => {
    const res = await axios.delete(`/api/admin/users/${userId}`);
    await loadAll();
    return res.data;
  }, [loadAll]);

  const activateUser = useCallback(async (userId) => {
    const res = await axios.post(`/api/admin/users/${userId}/activate`);
    await loadAll();
    return res.data;
  }, [loadAll]);

  // ── Bulk module pick-and-choose (replaces all overrides in one call) ──
  const setUserModules = useCallback(async (userId, grants, denies = []) => {
    const res = await axios.put(`/api/admin/users/${userId}/modules`, { grants, denies });
    await loadAll();
    return res.data;
  }, [loadAll]);

  // Same replace-all semantics as setUserModules, applied to many users at once
  // — used by Team Access Hub for rolling a module set out to the whole team.
  const bulkSetUserModules = useCallback(async (userIds, grants, denies = []) => {
    const res = await axios.put('/api/admin/users/bulk-modules', { user_ids: userIds, grants, denies });
    await loadAll();
    return res.data;
  }, [loadAll]);

  // ── Module kill-switch (whole-team enable/disable) ────────────
  const toggleModule = useCallback(async (modulePath, enabled, reason) => {
    const res = await axios.put('/api/admin/modules/kill-switch', { module_path: modulePath, enabled, reason });
    await loadAll();
    return res.data;
  }, [loadAll]);

  // ── Presets CRUD ──────────────────────────────────────────────
  const createPreset = useCallback(async (data) => {
    // data: { name, role_type, module_paths: [...], description? }
    const res = await axios.post('/api/admin/presets', data);
    await loadAll();
    return res.data;
  }, [loadAll]);

  const updatePreset = useCallback(async (presetId, data) => {
    // data: { name?, module_paths?, description? }
    const res = await axios.put(`/api/admin/presets/${presetId}`, data);
    await loadAll();
    return res.data;
  }, [loadAll]);

  const deactivatePreset = useCallback(async (presetId) => {
    const res = await axios.delete(`/api/admin/presets/${presetId}`);
    await loadAll();
    return res.data;
  }, [loadAll]);

  // ── Invites CRUD ──────────────────────────────────────────────
  const createInvite = useCallback(async (data) => {
    // data: { email, role, preset_id?, module_overrides?, display_org?, duration_days? }
    const res = await axios.post('/api/admin/invites', data);
    await loadAll();
    return res.data;
  }, [loadAll]);

  const revokeInvite = useCallback(async (inviteId) => {
    const res = await axios.put(`/api/admin/invites/${inviteId}`, { status: 'revoked' });
    await loadAll();
    return res.data;
  }, [loadAll]);

  // ── Module Access Overrides ───────────────────────────────────
  const grantModule = useCallback(async (userId, modulePath, reason) => {
    const res = await axios.post('/api/admin/access/grant', {
      user_id: userId, module_path: modulePath, reason: reason || '',
    });
    await loadAll();
    return res.data;
  }, [loadAll]);

  const denyModule = useCallback(async (userId, modulePath, reason) => {
    const res = await axios.post('/api/admin/access/deny', {
      user_id: userId, module_path: modulePath, reason: reason || '',
    });
    await loadAll();
    return res.data;
  }, [loadAll]);

  const removeAccess = useCallback(async (accessId) => {
    const res = await axios.delete(`/api/admin/access/${accessId}`);
    await loadAll();
    return res.data;
  }, [loadAll]);

  // ── Module Review / Maturity ──────────────────────────────────
  const reviewModule = useCallback(async (modulePath, action) => {
    // action: 'submit' | 'approve' | 'promote' | 'reject'
    const res = await axios.put('/api/admin/modules/review', {
      module_path: modulePath, action,
    });
    await loadAll();
    return res.data;
  }, [loadAll]);

  const bulkReviewModules = useCallback(async (modulePaths, action) => {
    const res = await axios.put('/api/admin/modules/bulk-review', {
      module_paths: modulePaths, action,
    });
    await loadAll();
    return res.data;
  }, [loadAll]);

  const addModuleFeedback = useCallback(async (modulePath, rating, comment) => {
    const res = await axios.post('/api/admin/modules/feedback', {
      module_path: modulePath, rating, comment,
    });
    await loadAll();
    return res.data;
  }, [loadAll]);

  // ── Refinement assignments (per-module ownership) ─────────────
  const assignModule = useCallback(async (data) => {
    // data: { module_path, assignee_id?, status?, branch_name?, target_maturity?, alembic_revision_claim?, notes? }
    const res = await axios.post('/api/admin/refinement/assignments', data);
    await loadAll();
    return res.data;
  }, [loadAll]);

  const unassignModule = useCallback(async (modulePath) => {
    const res = await axios.delete(`/api/admin/refinement/assignments${modulePath}`);
    await loadAll();
    return res.data;
  }, [loadAll]);

  const validateModule = useCallback(async (modulePath, build = false) => {
    // returns { pass, findings, buildOk } — used to gate maturity promotion
    const res = await axios.post('/api/admin/refinement/validate', { module_path: modulePath, build });
    return res.data;
  }, []);

  return {
    // State
    users, presets, invites, moduleStatus, assignments, disabledModules, usageSummary,
    loading, error, fieldErrors,
    // Actions
    loadAll,
    createUser, updateUserRole, deactivateUser, activateUser, setUserModules, bulkSetUserModules,
    createPreset, updatePreset, deactivatePreset,
    createInvite, revokeInvite,
    grantModule, denyModule, removeAccess,
    reviewModule, bulkReviewModules, addModuleFeedback,
    assignModule, unassignModule, validateModule,
    toggleModule,
  };
}
