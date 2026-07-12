# Energy Supplier Network
**Module ID:** `energy-supplier-network` · **Route:** `/energy-supplier-network` · **Tier:** B (frontend-computed) · **EP code:** EP-CU3 · **Sprint:** CU

## 1 · Overview
40 suppliers across Tier 1/2/3 with transition scores, concentration risk, and engagement tracking.

**How an analyst works this module:**
- Supplier Dashboard shows transition scores
- Concentration Risk identifies single-source dependencies

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CATEGORIES`, `PLAN_COLORS`, `SUPPLIERS`, `TABS`, `TIER_COLORS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SUPPLIERS` | 41 | `name`, `tier`, `cat`, `country`, `spend`, `score`, `critical`, `plan` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CATEGORIES` | `['Drilling & Well Services','Pipeline Equipment','Refining Catalysts','Turbine/Rotating Equip','EPC/Construction','Chemicals & Additives','Safety & PPE','IT & Digital','Marine & Logistics','Environmental Services'];` |
| `filtered` | `useMemo(() => tierFilter === 'All' ? SUPPLIERS : SUPPLIERS.filter(s => s.tier === +tierFilter), [tierFilter]);` |
| `totalSpend` | `SUPPLIERS.reduce((s, x) => s + x.spend, 0);` |
| `avgScore` | `Math.round(SUPPLIERS.reduce((s, x) => s + x.score, 0) / Math.max(1, SUPPLIERS.length));` |
| `total` | `spends.reduce((a, b) => a + b, 0);` |
| `hhi` | `Math.round(spends.reduce((a, s) => a + Math.pow(s / total * 100, 2), 0));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `SUPPLIERS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Suppliers | — | Supply chain | Tier 1 (10), Tier 2 (15), Tier 3 (15) |

## 5 · Intermediate Transformation Logic
**Methodology:** Supplier concentration analysis
**Headline formula:** `HHI = Σ(spend_share_i²); Critical = single_source AND transition_score < 40`

40 suppliers with transition scores. Critical dependency flags single-source suppliers with low transition scores.

**Standards:** ['ISO 20400', 'CDP Supply Chain']
**Reference documents:** ISO 20400 Sustainable Procurement; CDP Supply Chain

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide (`HHI = Σ(spend_share_i²)`; `Critical = single_source AND transition_score < 40`) is
implemented as written. This is a supply-chain concentration dashboard over a hand-authored 40-supplier
table with real oilfield-services vendor names and realistic spend/score attributes. No PRNG, no hidden
model.

### 7.1 What the module computes

Data layer: 40 suppliers with `tier (1/2/3)`, `cat`, `country`, `spend ($M)`, `score` (transition
readiness 0–100), `critical` (flag), `plan` (engagement status). Derived quantities:

```js
totalSpend = Σ spend
avgScore   = round( Σ score / n )                     // guarded n≥1
// Category concentration (Herfindahl-Hirschman on spend shares):
total = Σ spends_in_category
hhi   = round( Σ (spend_i / total × 100)² )           // 0–10,000 scale
```

Critical-dependency identification uses the pre-set `critical` flag (which encodes the guide's
"single-source + low-transition-score" logic in the data) combined with `score` and `plan`.

### 7.2 Parameterisation / scoring rubric

| Field | Range/values | Provenance |
|---|---|---|
| `tier` | 1 (10 suppliers), 2 (15), 3 (15) | Supply-chain tiering |
| `spend` | $12–920M | Realistic vendor spend (editorial) |
| `score` | 22–74 | Transition-readiness score (hand-set) |
| `critical` | boolean | Single-source / strategic dependency |
| `plan` | Approved / Submitted / In Progress / Not Requested | Engagement status |
| HHI thresholds | >2,500 = high concentration | Standard antitrust/DOJ HHI band |

Supplier names are **real** oilfield-services and industrial vendors (Schlumberger, Halliburton, Baker
Hughes, TechnipFMC, Siemens Energy, BASF Catalysts…); the spend and score figures are editorial but
plausible (SLB $820M spend, score 58; Chinese Tier-3 vendors low scores 22–25).

### 7.3 Calculation walkthrough

Load the 40-supplier table → apply the tier filter → KPIs: total spend, average transition score,
critical-supplier count → per-category HHI computes each category's spend concentration → the
concentration-risk tab flags categories above the 2,500 HHI threshold → the critical-dependencies tab
lists flagged suppliers with low transition scores → the engagement tracker groups by `plan` status.

### 7.4 Worked example

**HHI for the "Refining Catalysts" category** (BASF Catalysts $210M score 68; Honeywell UOP $185M
score 65):
```
total = 210 + 185 = $395M
shares = 210/395 = 53.2%,  185/395 = 46.8%
HHI = round(53.2² + 46.8²) = round(2830 + 2190) = 5,020
```
An HHI of ≈5,020 (well above the 2,500 high-concentration threshold, and near the 5,000 duopoly
level) flags Refining Catalysts as a concentrated, single-points-of-failure category — exactly the
supply-chain-resilience signal the module surfaces. By contrast a category split across five roughly
equal suppliers would score ≈2,000 (below threshold).

### 7.5 Companion analytics

- **Tier 1 detail:** the 10 strategic suppliers with spend, transition score and engagement plan.
- **Critical dependencies:** suppliers flagged `critical=true` with `score < ~50` — the highest-risk
  intersection of dependency and transition unreadiness.
- **Engagement tracker:** distribution of transition-plan status (Approved/Submitted/In
  Progress/Not Requested), the stewardship pipeline for supplier decarbonisation.

### 7.6 Data provenance & limitations

- **Supplier names are real; spend and transition-score attributes are editorial** (hand-authored,
  not disclosed data). No PRNG is used — the table is static.
- The HHI is computed correctly (`Σ share²`) but only over the *displayed* suppliers per category, not
  the full market — so it measures internal-portfolio concentration, not industry-wide concentration.
- `critical` and `plan` are pre-set flags, so the guide's live `single_source AND score<40` rule is
  encoded in the data rather than evaluated at runtime.

**Framework alignment:** **ISO 20400 (Sustainable Procurement)** — the supplier transition-scoring and
engagement-plan tracking mirror ISO 20400's supplier-development approach; **CDP Supply Chain** — the
transition-readiness score and disclosure-request status map to CDP's supplier engagement program;
the **HHI** concentration measure is the standard Herfindahl-Hirschman index (0–10,000, >2,500 = high
concentration) used in competition and supply-chain-risk analysis.

## 9 · Future Evolution

### 9.1 Evolution A — Live supplier records with evidence-based transition scores (analytics ladder: rung 1 → 2)

**What.** §7 confirms a clean implementation: `HHI = Σ(spend_share²)` computed correctly per category, the critical-dependency rule encoded, no PRNG anywhere — over a hand-authored 40-supplier table with real vendor names (Schlumberger, Halliburton, Baker Hughes) but hand-set spend, transition scores (22–74), and engagement statuses. The risk is subtle: real company names carrying editorial scores read as assessments. Evolution A converts the table into maintained records and derives the scores.

**How.** (1) `suppliers` table (org-scoped) with CRUD endpoints — spend from procurement uploads, tier and category user-maintained; supplier entities resolved via `entity_lei`/GLEIF so names link to the platform's entity layer rather than free text. (2) Transition scores become derived: public CDP disclosure status, SBTi target presence (public dataset), and controversy signals from `esg-controversy` combine into a documented scoring rubric — replacing hand-set values with evidence-linked ones, each score expandable to its inputs. (3) Engagement `plan` states become a real workflow (requested → submitted → approved with dates), feeding the CDP Supply Chain-style tracking the guide cites. (4) Rung 2: concentration what-ifs — "if we dual-source refining catalysts, HHI drops from X to Y" — computed over the real spend rows, and Sprint-DN supply-chain tables provide tier-2/3 mapping where available.

**Prerequisites.** Procurement-spend ingestion format agreed; scoring-rubric documentation (§8-style model note) before any score attaches to a named vendor. **Acceptance:** HHI recomputes from stored spends; every displayed transition score expands to its evidence inputs; the critical flag derives from the documented rule rather than a pre-set boolean.

### 9.2 Evolution B — Procurement engagement copilot (LLM tier 2)

**What.** A tool-calling copilot for the procurement/sustainability workflow: "which critical single-source suppliers still haven't submitted transition plans, and draft the escalation for the top three by spend?" It queries Evolution A's supplier and engagement endpoints, applies the module's own criticality rule, and drafts tailored engagement letters citing each supplier's actual evidence gaps (no CDP response, no SBTi target) — the specific asks that would raise their derived score.

**How.** Tools: `query_suppliers(filters)`, `get_supplier_evidence(id)`, `get_concentration(category)`, `update_engagement_status` (mutation, gated behind explicit confirmation per tier-2 convention). Grounding corpus = this Atlas record's §5/§7 (HHI formula, criticality rule, the >2,500 concentration band) so risk framing matches the implemented thresholds. Letters reference only stored evidence gaps — the copilot must not assert a vendor "has no climate target" unless the evidence field says so, with its check date.

**Prerequisites (hard).** Evolution A — drafting escalations to real named vendors based on hand-set editorial scores would put unfounded assessments in outbound correspondence. **Acceptance:** the copilot's critical-supplier list matches the rule-based query exactly; every claim in a drafted letter maps to a stored evidence field with a date; engagement-status changes require the confirmation step.