# Auth
**Module ID:** `auth` · **Route:** `/auth` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (3 files)
**Components/functions:** `ROLE_COLORS`, `ROLE_LABELS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `res` | `await axios.get(`/api/auth/invite/${token}`, { withCredentials: true });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`
**Shared context buses:** `AuthContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).