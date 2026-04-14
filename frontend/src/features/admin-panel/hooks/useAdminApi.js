import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * useAdminApi — replaces localStorage mock store with real backend API calls.
 *
 * Backend endpoints (all require super_admin Bearer token):
 *   Users:   GET/POST /api/admin/users, PUT /api/admin/users/{id}/role, POST /api/admin/users/{id}/deactivate
 *   Presets: GET/POST /api/admin/presets, PUT /api/admin/presets/{id}, POST /api/admin/presets/{id}/deactivate
 *   Invites: GET/POST /api/admin/invites, PUT /api/admin/invites/{id}, POST /api/admin/invites/{id}/revoke
 *   Access:  POST /api/admin/access/grant, POST /api/admin/access/deny, DELETE /api/admin/access/{id}
 *   Modules: GET /api/admin/modules/status, PUT /api/admin/modules/review, POST /api/admin/modules/feedback
 *            PUT /api/admin/modules/bulk-review, GET /api/admin/modules/maturity-map
 */
export default function useAdminApi() {
  const [users, setUsers]             = useState([]);
  const [presets, setPresets]         = useState([]);
  const [invites, setInvites]         = useState([]);
  const [moduleStatus, setModuleStatus] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  // ── Initial load ──────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, presetsRes, invitesRes, modulesRes] = await Promise.allSettled([
        axios.get('/api/admin/users'),
        axios.get('/api/admin/presets'),
        axios.get('/api/admin/invites'),
        axios.get('/api/admin/modules/status'),
      ]);
      if (usersRes.status === 'fulfilled')   setUsers(usersRes.value.data || []);
      if (presetsRes.status === 'fulfilled') setPresets(presetsRes.value.data || []);
      if (invitesRes.status === 'fulfilled') setInvites(invitesRes.value.data || []);
      if (modulesRes.status === 'fulfilled') setModuleStatus(modulesRes.value.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Users CRUD ────────────────────────────────────────────────
  const createUser = useCallback(async (data) => {
    // data: { email, name, password, rbac_role, preset_id?, is_read_only?, access_duration_days?, display_org? }
    const res = await axios.post('/api/admin/users', data);
    await loadAll();
    return res.data;
  }, [loadAll]);

  const updateUserRole = useCallback(async (userId, data) => {
    // data: { rbac_role?, preset_id?, is_read_only?, access_duration_days?, display_org? }
    const res = await axios.put(`/api/admin/users/${userId}/role`, data);
    await loadAll();
    return res.data;
  }, [loadAll]);

  const deactivateUser = useCallback(async (userId) => {
    const res = await axios.post(`/api/admin/users/${userId}/deactivate`);
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
    const res = await axios.post(`/api/admin/presets/${presetId}/deactivate`);
    await loadAll();
    return res.data;
  }, [loadAll]);

  // ── Invites CRUD ──────────────────────────────────────────────
  const createInvite = useCallback(async (data) => {
    // data: { email, rbac_role, preset_id?, module_overrides?, display_org?, access_duration_days? }
    const res = await axios.post('/api/admin/invites', data);
    await loadAll();
    return res.data;
  }, [loadAll]);

  const revokeInvite = useCallback(async (inviteId) => {
    const res = await axios.post(`/api/admin/invites/${inviteId}/revoke`);
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

  return {
    // State
    users, presets, invites, moduleStatus,
    loading, error,
    // Actions
    loadAll,
    createUser, updateUserRole, deactivateUser,
    createPreset, updatePreset, deactivatePreset,
    createInvite, revokeInvite,
    grantModule, denyModule, removeAccess,
    reviewModule, bulkReviewModules, addModuleFeedback,
  };
}
