# Api::Organisations
**Module ID:** `api::organisations` · **Route:** `/api/v1/organisations` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/organisations/` | `list_organisations` | api/v1/routes/organisations.py |
| GET | `/api/v1/organisations/mine` | `get_my_org` | api/v1/routes/organisations.py |
| GET | `/api/v1/organisations/{org_id}` | `get_organisation` | api/v1/routes/organisations.py |
| POST | `/api/v1/organisations/` | `create_organisation` | api/v1/routes/organisations.py |
| PUT | `/api/v1/organisations/{org_id}` | `update_organisation` | api/v1/routes/organisations.py |
| GET | `/api/v1/organisations/{org_id}/members` | `list_org_members` | api/v1/routes/organisations.py |
| POST | `/api/v1/organisations/{org_id}/members` | `add_org_member` | api/v1/routes/organisations.py |

### 2.3 Engine `demo_portfolio_seeder` (services/demo_portfolio_seeder.py)
| Function | Args | Purpose |
|---|---|---|
| `DemoPortfolioSeeder.seed_for_org` | org_id | Create (or skip if already exists) a demo portfolio for *org_id*. Returns the existing or newly created PortfolioPG, or None on error. Idempotent: repeated calls with the same org_id do not create duplicates. |
| `DemoPortfolioSeeder._create_portfolio` | org_id |  |
| `DemoPortfolioSeeder._create_assets` | portfolio_id, org_id_str |  |
| `DemoPortfolioSeeder._create_analysis_run` | portfolio | Pre-populate one analysis run so dashboard charts render immediately. |

**Engine `demo_portfolio_seeder` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `_DEMO_ASSETS` | `[('Eurobank AG', 'Banking', 'Retail Banking', 'Bond', 120000000, 'A', 0.003, 0.4, 5, 12000, 8000, 25000, 'K64', 42.0), ('Alpine RE Ltd', 'Insurance', 'P&C Insurance', 'Bond', 80000000, 'AA', 0.002, 0.35, 7, 8500, 4200, 18000, 'K65', 38.0), ('NordSteel GmbH', 'Materials', 'Steel', 'Loan', 95000000, '` |
| `_SCENARIO_TEMPLATES` | `[{'scenario': 'net_zero_2050', 'horizon': '2030', 'expected_loss_bps': 12.5, 'transition_risk_score': 45.0, 'physical_risk_score': 18.0, 'capital_charge_pct': 0.8, 'co2_reduction_pct': 32.0}, {'scenario': 'delayed_transition', 'horizon': '2030', 'expected_loss_bps': 28.0, 'transition_risk_score': 72` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `mock-sample`, `real-db`

**Database tables:** `__future__` *(shared)*, `an` *(shared)*, `api` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*, `uuid` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/organisations/** — status `passed`, provenance ['real-db'], source tables: `organisations`
Output: `{'type': 'object', 'keys': ['total', 'organisations'], 'n_keys': 2}`

**GET /api/v1/organisations/mine** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['organisation', 'message'], 'n_keys': 2}`

**GET /api/v1/organisations/{org_id}** — status `failed`, provenance ['db-empty'], source tables: `organisations`
Output: `None`

**GET /api/v1/organisations/{org_id}/members** — status `passed`, provenance ['db-empty'], source tables: `org_users`
Output: `{'type': 'object', 'keys': ['org_id', 'members'], 'n_keys': 2}`

**POST /api/v1/organisations/** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**PUT /api/v1/organisations/{org_id}** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/organisations/{org_id}/members** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/organisations/{org_id}/seed-demo** — status `skipped`, provenance ['mock-sample'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `demo_portfolio_seeder` — extracted transformation lines:**
```python
exposure = round(base_exp * jitter, -3)  # round to nearest 1000
market_value=round(exposure * rng.uniform(0.92, 1.08), -3),
base_pd=round(pd * rng.uniform(0.90, 1.10), 5),
base_lgd=round(lgd * rng.uniform(0.95, 1.05), 3),
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The `organisations` domain (`/api/v1/organisations`) is the platform's **multi-tenant
control plane**: CRUD for organisations, member management, and one-click demo-portfolio
provisioning. It is infrastructure rather than a quantitative engine — the only "calculation"
of note lives in `demo_portfolio_seeder.py`, which manufactures a realistic sample portfolio
for every new tenant.

### 7.1 What the module computes

The route layer (`organisations.py`) is thin CRUD over `OrganisationPG`, `OrgUserPG`,
`UserPG` with role-gating (`require_role("admin")` for writes). The substantive logic is the
**demo seeder**, which on `POST /{org_id}/seed-demo` (and automatically for new orgs) creates:

- one `PortfolioPG` labelled `"Demo — Sample Climate Portfolio"`,
- 15 `AssetPG` rows spanning ~10 sectors, three asset types (Bond/Loan/Equity), ratings
  AAA→CCC, maturities 1–10 yr, each with Scope 1/2/3 emissions, a NACE code and a climate
  score,
- one completed `AnalysisRunPG` holding three pre-computed NGFS scenario results.

### 7.2 Parameterisation / scoring rubric

The 15 demo assets are a hand-authored fixed list (`_DEMO_ASSETS`). Selected rows:

| Company | Sector | Type | Base exposure € | Rating | PD | LGD | Scope1 | NACE | Climate score |
|---|---|---|---|---|---|---|---|---|---|
| Eurobank AG | Banking | Bond | 120,000,000 | A | 0.003 | 0.40 | 12,000 | K64 | 42 |
| PetroCo NV | Energy | Loan | 150,000,000 | BBB | 0.020 | 0.48 | 920,000 | B06 | 85 |
| NordSteel GmbH | Materials | Steel Loan | 95,000,000 | BBB | 0.018 | 0.45 | 485,000 | C24 | 71 |
| TechCore BV | Technology | Equity | 55,000,000 | A | 0.005 | 0.32 | 4,200 | J63 | 18 |

PD/LGD/climate scores are calibrated to the rating and sector by hand — e.g. oil & gas and
steel carry the highest climate scores (85, 71) and emissions, technology the lowest (18).
**Provenance:** synthetic demo values, explicitly labelled as such (portfolio description
begins "⚠️ SAMPLE DATA").

**Scenario templates** (`_SCENARIO_TEMPLATES`, 2030 horizon): Net-Zero-2050 (EL 12.5 bps,
transition 45, physical 18), Delayed-Transition (28 bps, 72, 24), Current-Policies (18 bps,
22, 48). Note the NGFS-consistent ordering: transition risk peaks in Delayed Transition,
physical risk peaks in Current Policies.

### 7.3 Calculation walkthrough

`seed_for_org(org_id)` is **idempotent** — it first queries for an existing portfolio whose
name starts with the demo prefix and returns it if found. Otherwise it:

1. Seeds a deterministic RNG: `random.Random(int(sha256(org_id)[:8], 16))`.
2. For each demo asset, applies a **±15% exposure jitter** (`rng.uniform(0.85, 1.15)`, rounded
   to the nearest 1,000) and smaller jitters to market value (±8%), PD (±10%) and LGD (±5%),
   so different tenants get slightly different books but the same tenant is reproducible.
3. Builds one analysis run, scaling each scenario's expected loss to portfolio size:
   `EL_€ = total_exposure · expected_loss_bps / 10,000`.

### 7.4 Worked example

Take `PetroCo NV` (base exposure €150,000,000) for an org whose seed yields
`jitter = 1.04`: exposure `= 150,000,000 · 1.04 = 156,000,000` (rounded to nearest 1,000).
If total portfolio exposure sums to €1,200,000,000, the Delayed-Transition run's expected
loss is `1,200,000,000 · 28.0 / 10,000 = €3,360,000`.

### 7.5 Data provenance & limitations

- The seeded RNG uses Python's `random.Random` keyed on a SHA-256 digest of the org id — a
  **legitimate deterministic jitter**, not the platform's `sr()` sine-hash PRNG, and not used
  to fabricate headline analytics (only to vary a demo book cosmetically).
- All demo figures are clearly flagged sample data; regulatory users are warned in the
  portfolio description to replace them with real exposures.
- The pre-computed scenario results are static templates, not a live run of the ECL/NGFS
  engines — they exist only so the dashboard renders on first login (addresses the "zeros for
  new orgs" first-use failure).

**Framework alignment:** The demo data is shaped to exercise downstream **PCAF** (Scope 1/2/3
+ NACE per asset), **IFRS 9 ECL** (PD/LGD/rating/maturity per asset) and **NGFS** scenario
modules (three-scenario analysis run), so those engines return meaningful values immediately.
Organisation records carry `jurisdiction`, `regulatory_regime` and `lei` fields to support
multi-tenant regulatory scoping (CSRD/SFDR applicability by domicile).

## 9 · Future Evolution

### 9.1 Evolution A — Deterministic demo seeding and multi-tenant isolation hardening (analytics ladder: rung 1 → 2)

**What.** This is the platform's multi-tenant control plane — CRUD over `OrganisationPG`,
`OrgUserPG`, `UserPG` with `require_role("admin")` writes — not a quant engine. Its one
computation is `demo_portfolio_seeder.py`, which provisions a 15-asset sample portfolio
(10 sectors, Bond/Loan/Equity, AAA→CCC) plus a pre-computed 3-scenario analysis run for
every new tenant. The §5 extract shows the seeder uses `rng.uniform` jitter on exposure,
market value, PD, and LGD — a deliberate demo-realism trick, but exactly the kind of
random-as-data the platform's guardrail (`check_no_fabricated_random.py`) polices
elsewhere. The atlas also shows `/{org_id}` and `/{org_id}/members` trace **db-empty**.
Evolution A makes seeding reproducible and tightens isolation.

**How.** (1) Make the demo seeder deterministic — seed the RNG from the org_id so a tenant's
demo book is stable across re-provisions (and clearly labelled synthetic-demo, keeping it
outside the fabrication guardrail's scope by construction). (2) Implement the D2 roadmap
item here: an `org_id` scoping audit across tenant tables plus Supabase RLS as
defense-in-depth under the app-layer RBAC. (3) Fix the `/{org_id}` GET (traces failed) and
members read path. (4) Add per-org row quotas.

**Prerequisites.** RLS policy rollout (roadmap D2); confirmation the demo seeder's synthetic
data is excluded from any analytics that feed real decisions. **Acceptance:** re-seeding an
org twice yields identical demo portfolios; cross-tenant reads are blocked at the DB layer,
not just the app; `/{org_id}` returns `passed`; per-org quotas enforced.

### 9.2 Evolution B — Tenant-admin copilot for onboarding and membership (LLM tier 2)

**What.** An admin copilot: "create an org for Acme, provision the demo portfolio, and add
these three users as analysts" — executing `POST /organisations/`,
`POST /{org_id}/seed-demo`, and `POST /{org_id}/members` under explicit confirmation and
strict RBAC inheritance.

**How.** This is a mutating tier-2 surface, so it is the roadmap's gated-tool pattern: read
endpoints (`/`, `/mine`, `/{org_id}`, `/members`) are freely callable, but org creation,
updates, and member-adds require confirmation and inherit the admin's session — never a
service account. The copilot narrates real membership state and never claims a user was
added without an `org_users` row confirming it. It's an internal platform-admin tool, not a
customer analytics copilot.

**Prerequisites.** Evolution A's isolation hardening before any cross-tenant admin action;
RBAC confirmation UX for the mutating endpoints (middleware already enforces `admin`).
**Acceptance:** every membership/org claim traces to a real DB row; write actions require
confirmation and log to the audit trail; a non-admin asking to create an org is refused by
inherited RBAC, and the copilot explains why rather than attempting it.