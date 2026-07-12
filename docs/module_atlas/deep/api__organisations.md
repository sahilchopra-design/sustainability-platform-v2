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
