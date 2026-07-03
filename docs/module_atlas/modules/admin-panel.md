# Admin Panel
**Module ID:** `admin-panel` · **Route:** `/admin-panel` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (3 files)
**Components/functions:** `ALL_MODULE_PATHS`, `ANALYST_MODULES`, `AuditLogTab`, `Avatar`, `Btn`, `Card`, `DEMO_MODULES`, `DashboardTab`, `Drawer`, `Inp`, `InvitesTab`, `KpiCard`, `Label`, `MAIN_TABS`, `MATURITY_ACTIONS`, `MATURITY_COLORS`, `MATURITY_LABELS`, `MODULE_REGISTRY`, `MaturityTab`, `Modal`, `ModuleManagerTab`, `ModulePicker`, `PARTNER_MODULES`, `PERMISSIONS`, `PresetsTab`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `known` | `new Set(MODULE_REGISTRY.flatMap(g => g.modules.map(m => m.path)));` |
| `res` | `await axios.post('/api/admin/users', data);` |
| `res` | `await axios.put(`/api/admin/users/${userId}/role`, data);` |
| `res` | `await axios.post(`/api/admin/users/${userId}/deactivate`);` |
| `res` | `await axios.post('/api/admin/presets', data);` |
| `res` | `await axios.put(`/api/admin/presets/${presetId}`, data);` |
| `res` | `await axios.post(`/api/admin/presets/${presetId}/deactivate`);` |
| `res` | `await axios.post('/api/admin/invites', data);` |
| `res` | `await axios.post(`/api/admin/invites/${inviteId}/revoke`);` |
| `res` | `await axios.post('/api/admin/access/grant', {` |
| `res` | `await axios.post('/api/admin/access/deny', {` |
| `res` | `await axios.delete(`/api/admin/access/${accessId}`);` |
| `res` | `await axios.put('/api/admin/modules/review', {` |
| `res` | `await axios.put('/api/admin/modules/bulk-review', {` |
| `res` | `await axios.post('/api/admin/modules/feedback', {` |
| `res` | `await axios.post('/api/admin/refinement/assignments', data);` |
| `res` | `await axios.delete(`/api/admin/refinement/assignments${modulePath}`);` |
| `res` | `await axios.post('/api/admin/refinement/validate', { module_path: modulePath, build });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DEMO_MODULES`, `MAIN_TABS`, `MATURITY_ACTIONS`, `MODULE_REGISTRY`, `PARTNER_MODULES`, `PERMISSIONS`, `REFINE_STATUSES`, `ROLES`, `SECTION_GROUPS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).