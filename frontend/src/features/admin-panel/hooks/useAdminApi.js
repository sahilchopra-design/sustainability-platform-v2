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
      if (usersRes.status === 'fulfilled')   setUsers(usersRes.value.data || []);
      if (presetsRes.status === 'fulfilled') setPresets(presetsRes.value.data || []);
      if (invitesRes.status === 'fulfilled') setInvites(invitesRes.value.data || []);
      if (modulesRes.status === 'fulfilled') setModuleStatus(modulesRes.value.data || []);
      if (assignRes.status === 'fulfilled')  setAssignments(assignRes.value.data || []);
      if (killRes.status === 'fulfilled')    setDisabledModules(killRes.value.data || []);
      if (usageRes.status === 'fulfilled')   setUsageSummary(usageRes.value.data || { total: 0, top: [], recent: [] });
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
    loading, error,
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
