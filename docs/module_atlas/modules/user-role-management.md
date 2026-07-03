# User Role Management
**Module ID:** `user-role-management` · **Route:** `/user-role-management` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Platform role-based access control (RBAC), permissions management and user administration; configures who can view, edit and approve ESG data, reports and module configurations.

> **Business value:** Least-privilege access control is foundational to ESG platform security; GDPR Article 25 requires data protection by design including role-based data minimisation for personal and sensitive ESG data.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTIONS`, `API_KEYS_DATA`, `COLORS`, `DOMAINS`, `FIRST_NAMES`, `IP_WHITELIST`, `LAST_NAMES`, `MODULES_PER_DOMAIN`, `ROLES`, `ROLE_PERMS`, `SECURITY_EVENTS`, `SESSION_DATA`, `SOC2_CHECKLIST`, `STATUSES`, `TABS`, `TEAMS`, `TEAM_DATA`, `TIERS`, `TOTAL_MODULES`, `USERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `LAST_NAMES` | `['Chen','O\'Brien','Nakamura','Patel','Kowalski','Williams','Garcia','Kim','Johansson','Al-Rashid','Thompson','Dubois','Santos','Andersson','Nguyen','` |
| `ROLES` | `['Super Admin','Platform Admin','ESG Analyst','Portfolio Manager','Risk Officer','Compliance Officer','Read-Only Viewer','External Auditor'];` |
| `role` | `ROLES[Math.floor(sr(i*7)*8)];` |
| `team` | `TEAMS[Math.floor(sr(i*11)*6)];` |
| `status` | `STATUSES[Math.floor(sr(i*13)*10)];` |
| `tier` | `TIERS[Math.floor(sr(i*17)*10)];` |
| `daysAgo` | `Math.floor(sr(i*23)*90);` |
| `loginDate` | `new Date(2026,2,29-daysAgo);` |
| `sessCount` | `Math.floor(sr(i*29)*200+10);` |
| `modulesAccessed` | `Math.floor(sr(i*31)*40+5);` |
| `TOTAL_MODULES` | `DOMAINS.reduce((a,_,i)=>a+MODULES_PER_DOMAIN[i],0);` |
| `base` | `sr(ri*100+di*7);` |
| `IP_WHITELIST` | `['10.0.0.0/8','172.16.0.0/12','192.168.1.0/24','203.0.113.0/24','198.51.100.0/24','100.64.0.0/10'];` |
| `pagedUsers` | `useMemo(()=>filteredUsers.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filteredUsers,page]);` |
| `totalPages` | `Math.ceil(filteredUsers.length/PAGE_SIZE);` |
| `roleDistribution` | `useMemo(()=>ROLES.map(r=>({name:r,count:USERS.filter(u=>u.role===r).length})),[]);` |
| `teamDistribution` | `useMemo(()=>TEAMS.map(t=>({name:t,count:USERS.filter(u=>u.team===t).length})),[]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ACTIONS`, `COLORS`, `DOMAINS`, `FIRST_NAMES`, `IP_WHITELIST`, `LAST_NAMES`, `MODULES_PER_DOMAIN`, `ROLES`, `SEC_TABS`, `SOC2_CHECKLIST`, `STATUSES`, `TABS`, `TEAMS`, `TIERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Configured Users | — | User Directory | Total platform users with active role assignments across all modules and data domains. |
| Roles Defined | — | RBAC Engine | Number of distinct role definitions spanning Viewer, Analyst, Manager, Admin, Auditor and custom roles. |
| Permission Gaps | — | Access Audit | Users with incomplete or conflicting role assignments flagged for immediate resolution. |
- **Corporate Directory / IdP, Module Access Logs, Role Definitions** → RBAC engine + permission matrix + access audit tools → **Role assignment reports, access gap alerts, audit logs, GDPR/SOC 2 evidence**

## 5 · Intermediate Transformation Logic
**Methodology:** Access Coverage Score
**Headline formula:** `ACS = Configured Users / Total Users × Role Assignment Completeness`
**Standards:** ['NIST RBAC Standard SP 800-162', 'ISO/IEC 27001 A.9']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).