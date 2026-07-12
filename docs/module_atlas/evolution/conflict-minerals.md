## 9 · Future Evolution

### 9.1 Evolution A — Join the real public lists: RMAP facilities, CAHRA countries, USGS shares (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag notes the code is a broader 12-mineral CRM dashboard than
the 3TG module the guide describes, and §7.5 identifies the sharper problem: real
smelter and company names carry Bernoulli-drawn attributes — a real facility can be
randomly labelled "Not Certified" or CAHRA-flagged, a genuine disclosure risk. HHI is
drawn rather than computed from shares. The only sourced numbers are the EU CRMA
10/40/25/65 benchmarks. Evolution A grounds the dashboard in the public lists that
actually exist for this domain.

**How.** (1) RMI RMAP conformant-facility list (published) replaces the seeded
certification tiers — smelter status becomes a joined fact with an as-of date.
(2) The EU CAHRA indicative list (published under Reg. 2017/821) replaces the
`P≈0.4` CAHRA coin-flip. (3) HHI computed from USGS Mineral Commodity Summaries
production shares per mineral — the same source can drive `reserveYrs` and producer
country breakdowns, replacing renormalised random shares. (4) CRMA progress bars read
curated Eurostat/CRMA-monitoring values instead of `sn(9001…)` draws. (5) CMRT
ingestion: parse the RMI CMRT template (a fixed-format workbook — deterministic
parsing, no ML needed) to populate company smelter declarations, enabling the
RCOI→due-diligence flow the guide promises; Form SD assembly then becomes a
templated export over real declarations.

**Prerequisites (hard).** Purge every seeded attribute attached to a real entity name
first — this module's real-names/fake-flags combination is the worst in its class;
list-refresh ownership (RMAP and CAHRA lists update periodically). **Acceptance:**
every smelter's RMAP status matches the RMI list snapshot; HHI for each mineral
reproduces from stored USGS shares; a sample CMRT parses into smelter declarations
without manual correction.

### 9.2 Evolution B — OECD 5-step due-diligence copilot (LLM tier 1 → 2)

**What.** The OECD framework requires evidence per step, not the scalar 1–5 progress
integer the page stores (§7.6). Evolution B operationalizes that: for a selected
supplier, the copilot walks the 5 steps, asks for or evaluates evidence against each
step's OECD DDG expectations (management systems documented? red-flag review of CMRT
declarations? audit reports on file?), and drafts the step-5 public reporting
narrative — the Form SD/EU-report content the guide names but the code never
generates. CMRT anomalies (smelter not on the conformant list, CAHRA-origin
declarations) surface as prioritized findings.

**How.** Tier 1: RAG over the OECD DDG text, Reg. 2017/821, and SEC Rule 13p-1
(refdata catalog additions) plus this Atlas record. Tier 2 pairs with Evolution A's
CMRT ingestion: "review this quarter's CMRTs" becomes tool calls over the parsed
declarations joined to the RMAP/CAHRA lists, with findings citing specific rows. The
drafter never asserts certification status — it quotes the joined list value with its
snapshot date.

**Prerequisites (hard).** Evolution A (list joins and CMRT parsing are the copilot's
entire evidence base; today there is nothing real to review); regulation texts
embedded. **Acceptance:** a due-diligence review of a test CMRT flags exactly the
declarations failing the list joins; the drafted Form SD narrative contains only
evidenced claims; steps without evidence are reported as gaps, not presumed complete.
