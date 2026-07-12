# Carbon Certificate Management
**Module ID:** `cc-certificate-mgmt` · **Route:** `/cc-certificate-mgmt` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
End-to-end lifecycle management for verified carbon certificates: issuance, transfer, retirement, and cancellation workflows across Verra VCS, Gold Standard, and CAR registries. Tracks serial numbers, vintage years, and beneficial ownership chains.

> **Business value:** Certificate lifecycle tracked from issuance through retirement. Retired serials permanently locked; audit trail immutable.

**How an analyst works this module:**
- Issue certificates from verified project batches
- Transfer tab routes certificates to counterparty accounts
- Reserve tab locks certificates for pending transactions
- Retire tab records beneficial owner and purpose
- Audit Trail tab displays full serial-level history

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AUDIT_ENTRIES`, `BATCHES`, `Badge`, `CREDITS`, `CREDIT_STATUSES`, `DualInput`, `Kpi`, `METHODOLOGIES`, `PROJECT_NAMES`, `REGISTRIES`, `REG_COLORS`, `STATUS_COLORS`, `Section`, `TRANSFERS`, `TabBar`, `VINTAGES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n, d = 1) => { if (n == null \|\| !isFinite(n)) return '—'; return n >= 1e9 ? `${(n / 1e9).toFixed(d)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(d)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(d)}K` : `${n.toFixed(d)}`; };` |
| `METHODOLOGIES` | `['VM0015 (REDD+)', 'VM0006 (Biomass)', 'GS Cookstove', 'Puro Biochar', 'VM0042 (Blue Carbon)', 'ACM0002 (Grid RE)', 'AMS-I.E (Solar)', 'Iso CDR-001'];` |
| `qty` | `Math.round(5000 + sr(i * 7) * 95000);` |
| `bCredits` | `CREDITS.filter(c => c.batch_id === `BATCH-${String.fromCharCode(65 + i)}1` \|\| c.batch_id === `BATCH-${String.fromCharCode(65 + i)}2`);` |
| `totalAvailable` | `useMemo(() => CREDITS.filter(c => c.status === 'Available').reduce((a, c) => a + c.quantity, 0), []);` |
| `totalReserved` | `useMemo(() => CREDITS.filter(c => c.status === 'Reserved').reduce((a, c) => a + c.quantity, 0), []);` |
| `totalRetired` | `useMemo(() => CREDITS.filter(c => c.status === 'Retired').reduce((a, c) => a + c.quantity, 0), []);` |
| `totalValue` | `useMemo(() => CREDITS.reduce((a, c) => a + c.quantity * c.price, 0), []);` |
| `vintageData` | `useMemo(() => VINTAGES.map((yr, i) => {` |
| `agingAnalysis` | `useMemo(() => VINTAGES.map((yr, i) => {` |
| `age` | `2024 - yr;` |
| `inventoryByRegistry` | `useMemo(() => REGISTRIES.map((r, i) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CREDIT_STATUSES`, `METHODOLOGIES`, `PROJECT_NAMES`, `REGISTRIES`, `REG_COLORS`, `TABS`, `VINTAGES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Certificate Serial | `Registry-id – Project – Vintage – Seq` | Registry API | Unique identifier preventing double-counting across registries |
| Vintage Year | `Project verification period` | Registry records | Year in which emission reductions or removals occurred |
| Retirement Purpose | `Beneficial owner declaration` | ISO 14064-3 | Stated end-use governs registry retirement category |
| Transfer Chain | `Ledger audit trail` | Registry logs | Number of ownership transfers from issuance to final retirement |
- **Registry API** → Serial issuance data → certificate ledger → **Live certificate positions**
- **Verification reports** → Audit documents → certificate attributes → **Vintage and project metadata**

## 5 · Intermediate Transformation Logic
**Methodology:** Certificate lifecycle state machine with audit ledger
**Headline formula:** `CertState ∈ {Issued, Reserved, Transferred, Retired, Cancelled}`

Each certificate batch assigned a unique serial range (registry-id-vintage-project-start–end). State transitions logged with timestamp, counterparty, and purpose. Retirement locks serial numbers permanently; cancellation allowed only pre-retirement. Double-counting prevention via cross-registry serial number deduplication check.

**Standards:** ['Verra VCS Registry', 'Gold Standard Registry', 'Climate Action Reserve', 'ISO 14064-3']
**Reference documents:** Verra VCS Registry Procedures; Gold Standard Registry Rules; Climate Action Reserve Protocols; ISO 14064-3 Verification Standard

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial-mismatch flag.** The guide describes a *certificate lifecycle state machine
> with an immutable audit ledger, cross-registry serial-number deduplication, and enforced state
> transitions* (Issued→Reserved→Transferred→Retired→Cancelled). The code has **no state machine, no
> transition enforcement, and no dedup logic** — it is a read-only inventory dashboard over a synthetic
> credit table (30 credits, 8 batches, 12 transfers, 15 audit rows), all statically generated. There
> is no computational/risk model here; the "methodology" is aggregation and aging arithmetic.

### 7.1 What the module computes

All figures derive from the seeded `CREDITS` array. The only computations are inventory aggregates:

```js
totalAvailable = Σ quantity where status==='Available'
totalReserved  = Σ quantity where status==='Reserved'
totalRetired   = Σ quantity where status==='Retired'
totalValue     = Σ (quantity × price)
age            = 2024 − vintage                       // aging analysis per vintage
```

`vintageData`, `agingAnalysis`, and `inventoryByRegistry` are group-bys over vintage year and
registry. Serial ranges are cosmetically generated: `serial_start = REG-<2,000,000 + i·47321>`,
`serial_end = serial_start + quantity` — a plausible-looking range, not a registry-issued serial.

### 7.2 Parameterisation / data model

| Field | Generation | Provenance |
|---|---|---|
| `quantity` | `5,000 + sr(i·7)×95,000` | Synthetic PRNG |
| `status` | Positional: i<12 Available, <18 Reserved, <26 Retired, else Cancelled | Hard-coded partition (not a state machine) |
| `price` | `2.5 + sr(i·13)×22` $/t | Synthetic; spans typical VCM range |
| `registry` | Verra / Gold Standard / Puro / Isometric | Real registry names |
| `methodology` | VM0015, VM0006, GS Cookstove, Puro Biochar, VM0042, ACM0002, AMS-I.E, Iso CDR-001 | Real methodology IDs |
| `vintage` | 2016 + `floor(sr(i·11)×9)` | 2016–2024 |
| `beneficiary` | Named corporates (retired credits only) | Synthetic illustrative |
| `sdgs` | `3 + sr(i·17)×10` | Synthetic SDG count |

### 7.3 Calculation walkthrough

1. **Inventory KPIs** — status-partitioned sums of `quantity`; portfolio `totalValue` sums
   `quantity × price`.
2. **Vintage analysis** — credits grouped by vintage year; `agingAnalysis` computes `age = 2024 −
   vintage` and buckets inventory for stale-credit visibility.
3. **Registry breakdown** — `inventoryByRegistry` counts and sums by the 4 registries.
4. **Batches / Transfers / Audit** — three synthetic tables (batch rollups, a 12-row transfer log
   with `custody_chain` hop counts, a 15-row audit trail) rendered for narrative completeness.

### 7.4 Worked example — aging

A 2019-vintage Available credit of 60,000 t at $12.40: contributes 60,000 to `totalAvailable`,
`60,000 × 12.40 = $744,000` to `totalValue`, and `age = 2024 − 2019 = 5 years` in the aging bucket.
No permanence, discount, or reversal logic touches it — pure inventory accounting.

### 7.5 Data provenance & limitations

- **Entirely synthetic.** Every credit, batch, transfer, and audit entry is generated by the platform
  PRNG `sr(seed)=frac(sin(seed+1)×10⁴)`; corporate beneficiary names are illustrative, not real
  holdings.
- **No lifecycle enforcement.** Status is a fixed positional label, not the result of validated
  transitions; a production registry integration would enforce Issued→…→Retired ordering and lock
  retired serials.
- **No double-counting control.** The guide's cross-registry serial deduplication is not implemented;
  serials are decorative strings.
- **Aging hardcodes the reference year 2024** — `age = 2024 − vintage` will drift as wall-clock time
  advances (the platform's "today" is 2026), understating credit age by ~2 years.

**Framework alignment:** Verra VCS / Gold Standard / Puro / Isometric registry conventions (serial
ranges, vintages, retirement beneficiaries) and ISO 14064-3 verification vocabulary are *referenced*
in the data shapes, but the module performs no registry API integration and no ISO-conformant
lifecycle assurance. It is a UI mock of a certificate register, suitable for demonstration only.

## 9 · Future Evolution

### 9.1 Evolution A — Real certificate ledger with enforced state machine (analytics ladder: rung 1 → 2)

**What.** The §7 deep-dive flags a guide↔code mismatch: the page claims a certificate
lifecycle state machine with immutable audit ledger and cross-registry dedup, but the
code is a read-only inventory dashboard over a seeded `CREDITS` array (30 credits, 8
batches) computing only aggregates (`totalAvailable`, `agingAnalysis`,
`inventoryByRegistry`). Evolution A builds the module's first backend vertical: a
`cc_certificates` / `cc_certificate_events` table pair with the documented
Issued→Reserved→Transferred→Retired→Cancelled transitions actually enforced
server-side, plus serial-range overlap detection across registries.

**How.** (1) New router `api/v1/routes/cc_certificates.py` with POST transition
endpoints that reject illegal moves (e.g. Retired→Transferred) at the DB constraint
level, not just UI. (2) Append-only event table gives the audit trail the guide already
promises; retirement writes lock the serial range via a partial unique index.
(3) What-if layer (rung 2): project retirement runway from the vintage-aging arithmetic
the page already computes, but off live positions.

**Prerequisites.** Resolve the documented mismatch by either building this vertical or
rewording the guide — the atlas flag must not survive the evolution; Alembic migration
slot after the two-head merge. **Acceptance:** an API attempt to transfer a retired
serial returns 409 with the blocking event cited; UI aggregates reconcile 1:1 with SQL
sums over the new tables.

### 9.2 Evolution B — Registry-operations copilot (LLM tier 1)

**What.** A copilot on the certificate page answering "why can't this batch be
cancelled?", "what does the aging analysis mean for our 2019 vintages?", and "which
registry rules govern this retirement?" grounded strictly in this atlas page (§5 state
machine, Verra/GS/CAR/ISO 14064-3 standards list) and the rendered page state — not a
tool-calling analyst, because today the module exposes zero backend endpoints to call.

**How.** Per the tier-1 pattern: atlas record embedded into `llm_corpus_chunks`,
served via `POST /api/v1/copilot/cc-certificate-mgmt/ask` with the page's current
inventory aggregates passed as context; answers must cite an atlas section or on-screen
figure, with the mandatory refusal path for anything the dashboard does not compute
(prices, forward curves, counterparty credit).

**Prerequisites.** The copilot prompt must disclose that current data is a synthetic
demonstration book until Evolution A lands — narrating seeded serials as if they were
live registry positions would violate the no-fabrication contract. **Acceptance:**
adversarial probe "what is the market price of BATCH-A1?" produces a refusal citing the
module's computed surface; every numeric in answers traces to page state.