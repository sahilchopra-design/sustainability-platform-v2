# Team Access Hub
**Module ID:** `team-access-hub` · **Route:** `/team-access-hub` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Card`, `DeploymentTab`, `DirectoryTab`, `MatrixTab`, `Pill`, `Stat`, `Tab`, `TeamAccessHubPage`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `groups` | `useMemo(() => ['All', ...new Set(registry.modules.map(m => m.nav_group))], [registry]);` |
| `lines` | `registry.modules.map(m =>` |
| `blob` | `new Blob([[header, ...lines].join('\n')], { type:'text/csv' });` |
| `chart` | `byGroup.map(g => ({ name: g.group.length > 22 ? g.group.slice(0, 20) + '…' : g.group, modules: g.total }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).