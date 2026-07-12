## 7 · Methodology Deep Dive

This module is a **transaction workflow / state-machine** tool, not a quantitative model. The
MODULE_GUIDES entry describes it accurately: a retirement pipeline (purpose declaration → beneficial
owner → registry instruction → confirmation → certificate → audit log). There is no emission
calculation; the only arithmetic is cost aggregation and portfolio KPIs over a synthetic transaction
ledger.

### 7.1 What the module computes

Aggregations over 20 synthetic `TRANSACTIONS`:
```
total_cost(t)  = quantity · price_per_t                    // per transaction
totalRetired   = Σ quantity where status = 'Completed'
totalPending   = Σ quantity where status ∈ {Pending, Processing}
totalValue     = Σ total_cost where status = 'Completed'
```
Plus `monthlyRetirements` (12-month retired-volume / request-count / avg-processing-time series,
`sr()`-seeded), `byPurpose` (volume by retirement purpose), and `submissionByRegistry`.

### 7.2 Parameterisation / data rubric

| Element | Value / source | Provenance |
|---|---|---|
| Registries | Verra, Gold Standard, Puro, Isometric | Hard-coded list |
| Purpose types | 8 (Voluntary S1/S2/S3, CORSIA, ETS, Product-neutral, Supply-chain, Event) | Hard-coded, regulator-aligned |
| Pipeline stages | Initiated → Validated → Submitted → Confirmed → Certified | Hard-coded state machine |
| Wizard steps | Select Credits → Beneficiary → Registry → Purpose → Documents → Submit | Hard-coded |
| Compliance frameworks | CORSIA, EU ETS, CA CaT, UK ETS, ICAO LTAG, Article 6.4 | Hard-coded, real frameworks + eligibility notes |
| Beneficiaries (Meridian, Swiss Re, Unilever, Lufthansa, Nestlé) | Hard-coded illustrative | Synthetic names |
| Transaction quantity, price, vintage, serials, dates | `sr()`-seeded | **Synthetic** PRNG demo data |
| Status distribution | Index-banded (i<3 Draft … i<18 Failed) | Deterministic seed for realistic mix |

### 7.3 Calculation walkthrough

`TRANSACTIONS` is generated with a banded status assignment (ensuring a realistic spread across
Draft/Pending/Processing/Completed/Failed/Cancelled), then a post-map loop sets
`total_cost = quantity · price_per_t`. KPIs filter by status and sum quantity/cost. The retirement
wizard is a 6-step UI flow over the pipeline state machine — the guide's `RetirementComplete =
RegistryConfirmation ∧ CertificateIssued ∧ AuditLog.appended` is represented by the pipeline stages,
not by executable transactional logic (no real registry API is called).

### 7.4 Worked example (portfolio KPIs)

Of 20 transactions, indices 10–15 (6 rows) are `Completed`. With per-row quantities drawn from
`5,000 + sr(i·7)·95,000` (mean ≈ 52,500) and prices from `3.5 + sr(i·19)·18` (mean ≈ $12.5/t):
`totalRetired ≈ 6·52,500 ≈ 315,000 tCO₂e`; `totalValue ≈ 315,000·12.5 ≈ $3.9M`. Pending (indices
3–9, statuses Pending/Processing) adds ~7·52,500 ≈ 367,500 tCO₂e in `totalPending`. Exact values are
deterministic given the `sr()` seeds.

### 7.5 Data provenance & limitations
- **All transaction data is synthetic `sr()`-seeded demo data**; beneficiaries and project names are
  illustrative. Compliance-framework metadata is real but static.
- No live registry integration — the "Submit" step does not generate a real registry instruction or
  confirmation ID; the certificate and audit log are UI artefacts.
- No double-retirement guard or serial-conflict check across transactions.

**Framework alignment:** **Verra VCS / Gold Standard retirement procedures** — the purpose-declaration,
beneficial-owner and irreversible-retirement steps mirror registry rules. **ISO 14064-3** — the
beneficial-owner declaration (final claimant of the reduction) follows ISO validation/verification
requirements. **ICAO CORSIA** retirement requirements and **EU/UK ETS / California CaT / Article 6.4**
are surfaced as eligibility metadata; Article 6.4 A6.4ERs and corresponding-adjustment handling are
noted as emerging but not enforced in the workflow.
