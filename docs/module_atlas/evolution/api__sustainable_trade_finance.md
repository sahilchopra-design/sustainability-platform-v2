## 9 · Future Evolution

### 9.1 Evolution A — Live covenant tracking and evidence-backed screening (analytics ladder: rung 2 → 3)

**What.** The E75 engine exposes five deterministic assessments: EP4 compliance (A/B/C category,
IFC PS mapping, ESAP requirements), ECA green classification (OECD Common Approaches tier, country
risk 0–7), ESG-linked margin (`±15 bps` clamp on KPI performance), supply-chain ESG screening
(modern-slavery/deforestation/conflict-minerals, `rba_score = 100 − country_risk×8 + 5·certs`), and
report generation populated *only with caller-supplied metrics* (a stated honesty property). Two
Postgres tables exist (`trade_finance_assessments`, `trade_finance_esg_covenants`) but the margin
KPIs and screening signals are per-request inputs. Evolution A activates persistence and evidence.

**How.** (1) Activate covenant lifecycle tracking: persist ESG-linked margin structures to
`trade_finance_esg_covenants`, ingest periodic KPI observations, and recompute the margin
adjustment each period — turning a one-shot calculator into the covenant-monitoring workflow a
trade-finance desk runs. (2) Feed the supply-chain screen from platform evidence — the
`supply_chain_workflow` EUDR scores, `gdelt_controversy` for modern-slavery signals, GFW
deforestation exposure — rather than caller-asserted risk flags. (3) Track the UK/Australian MSA
applicability rules (currently threshold booleans) against stored entity turnover. (4) Bench-pin
the EP4 categorisation, margin clamp, and RBA score.

**Prerequisites.** Covenant/assessment write paths exercised (tables exist, D1); evidence-module
linkages. **Acceptance:** a stored covenant recomputes its margin on new KPI data with history;
screening components cite evidence sources where available; EP4/margin/RBA bench-pinned.

### 9.2 Evolution B — Trade-finance ESG structuring copilot (LLM tier 2)

**What.** A copilot for trade-finance originators: "categorise this project under EP4, classify it
for ECA green cover, and propose an ESG-linked margin grid" — calling the five POST assessments and
narrating the category, tier, and bps adjustment with their rubric citations, then generating the
ICC STF report shell.

**How.** Five POST endpoints plus seven `ref/*` registries (EP4 categories, ECA country-risk
ratings with the OECD 0–7 scale and source, high-risk sectors, commodity supply-chain risks) that
ground every threshold — the copilot cites the OECD/ICC/IFC basis per verdict. The `±15 bps` margin
mechanics and KPI scores make "what margin if we hit 2 of 3 SPTs?" a stateless re-run. The
report generator's caller-metrics-only property is the copilot's contract: shells are populated
from tool payloads, never LLM-estimated. Node for a trade-finance desk, chaining with
`supply_chain_workflow` and `sl_finance`.

**Prerequisites.** None hard — the engine is deterministic and honest; covenant-history answers
need Evolution A's persistence. **Acceptance:** every category, tier, and bps figure traces to a
tool response; rubric citations come from the ref endpoints; the copilot distinguishes
caller-declared from evidence-backed screening inputs and refuses to present the EP4 category as
lender legal sign-off.
