# Board Diversity Metrics
**Module ID:** `board-diversity` · **Route:** `/board-diversity` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Gender, ethnic, skills, and age diversity analytics for board and executive committee covering 30% Club targets, Hampton-Alexander and Parker Review benchmarks, and EU Gender Balance Directive compliance. Tracks intersectional diversity using a composite diversity index and benchmarks against FTSE All-World peer groups.

> **Business value:** Board diversity metrics are rapidly moving from voluntary best practice to mandatory disclosure and minimum threshold requirements under the EU Gender Balance Directive and UK Listing Rules. Investors monitoring Hampton-Alexander, Parker Review, and EU Directive compliance simultaneously can identify engagement-priority companies before legal non-compliance triggers regulatory sanctions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BOARD_SKILLS`, `COUNTRY_BOARD_REGULATIONS`, `COUNTRY_ISO_MAP`, `ChartTooltip`, `DIVERSITY_TREND`, `GOV_SCORE_WEIGHTS`, `PIE_COLORS`, `SECTOR_BOARD_BENCHMARKS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `BOARD_SKILLS` | `['Finance', 'Technology', 'ESG/Sustainability', 'Industry Expertise', 'Legal/Compliance', 'International', 'Risk Management', 'Digital/Innovation'];` |
| `seededRandom` | `(seed) => { let s = seed; return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; }; };` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `rng` | `seededRandom(idx * 137 + 42 + (holding.name \|\| '').charCodeAt(0));` |
| `vary` | `(base, spread) => clamp(base + (rng() - 0.5) * spread * 2, 0, 100);` |
| `female_pct` | `Math.round(vary((bench.female_pct + countryAvg) / 2, 12));` |
| `board_size` | `Math.round(clamp(bench.board_size_avg + (rng() - 0.5) * 6, 5, 18));` |
| `avg_age` | `Math.round(clamp(bench.avg_age + (rng() - 0.5) * 10, 42, 72));` |
| `avg_tenure` | `+(clamp(bench.avg_tenure_yr + (rng() - 0.5) * 6, 2, 16)).toFixed(1);` |
| `skills_coverage` | `+(clamp(bench.skills_coverage + (rng() - 0.5) * 0.3, 0.3, 1.0)).toFixed(2);` |
| `boardData` | `useMemo(() => portfolio.map((h, i) => genBoardData(h, i)), [portfolio]);` |
| `sectors` | `useMemo(() => ['All', ...new Set(boardData.map(h => h.sector))].sort(), [boardData]);` |
| `wtSum` | `boardData.reduce((s, h) => s + wt(h), 0) \|\| 1;` |
| `wavg` | `(arr, fn) => arr.reduce((s, h) => s + fn(h) * wt(h), 0) / wtSum;` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => { const v = r[k]; return typeof v === 'string' && v.includes(',') ? `"${v}"` : v ?? ''; }).join(','))]` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `exportGovernance` | `() => exportCSV(filtered.map(h => ({ Company: h.name, Sector: h.sector, Country: h.countryCode, 'Female %': h.female_pct, 'Independent %': h.independe` |
| `rows` | `filtered.map(h => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BOARD_SKILLS`, `COUNTRY_BOARD_REGULATIONS`, `DIVERSITY_TREND`, `GOV_SCORE_WEIGHTS`, `PIE_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Female Board Representation | `Female_directors / Total × 100` | Company proxy | Percentage of female directors; EU Directive mandates ≥40% by 2026 for large companies |
| Ethnic Minority Representation | `Ethnic_minority / Total × 100` | Parker Review data | Percentage of ethnic minority directors; Parker Review target is ≥10% for FTSE 250 |
| Diversity Index (composite) | `1 – Σp² across categories` | Platform model | Composite Herfindahl-Simpson diversity score; higher = more diverse across all dimensions |
- **Company proxy statements and annual reports** → Extract board demographics; compute gender parity gap and Parker score → **Per-company diversity metrics with EU Directive and Parker Review compliance flags**
- **FTSE/MSCI governance databases** → Benchmark diversity indices against index and sector peer groups → **Diversity ranking with peer percentile positioning and stewardship priority flags**

## 5 · Intermediate Transformation Logic
**Methodology:** Composite board diversity index
**Headline formula:** `DiversityIndex = 1 – Σ_i(p_i²); Gender_parity_gap = |Female_pct – 0.40|; Parker_score = Ethnic_minority_directors / Total × 100`
**Standards:** ['EU Gender Balance on Corporate Boards Directive', 'Hampton-Alexander Review', 'Parker Review 2020']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).