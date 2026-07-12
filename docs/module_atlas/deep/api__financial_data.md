## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is grounded solely in
`backend/api/v1/routes/financial_data.py`. There is no dedicated engine: this is a read-only
query surface over two ingested reference tables.)*

### 7.1 What the domain computes

The domain serves **real-world financial reference data** ingested by upstream pipelines into two
ORM models (`db/models/financial_ingest.py`):

- `SecEdgarFiling` — SEC EDGAR filing fundamentals (10-K / 10-Q / 20-F): revenue, net income,
  EBITDA, total assets/equity/debt, FCF, diluted EPS, ROE, ROA, D/E, shares outstanding, per
  CIK/ticker/fiscal year.
- `YfinanceMarketData` — yfinance market snapshots: market cap, share price, enterprise value,
  **EVIC**, P/E, P/B, EV/EBITDA, dividend yield, TTM revenue/EBITDA/net income, beta.

Nine GET endpoints (all gated by `require_min_role("viewer")`): filtered search (`/edgar`,
`/market`), grouped listings (`/edgar/companies`, `/edgar/filing-types`, `/market/tickers`),
sector aggregates (`/market/sectors`), a PCAF-oriented EVIC extract (`/market/evic`), a
time-series comparator (`/edgar/compare`), and corpus statistics (`/stats`).

The **only computations** performed in this domain are SQL aggregates:

```
/market/sectors:  per sector — COUNT(companies), SUM(market_cap),
                  AVG(pe_ratio), AVG(pb_ratio), AVG(dividend_yield), AVG(beta)
/edgar/companies: per (cik, ticker, name) — COUNT(filings), MIN/MAX(fiscal_year)
/stats:           COUNT + COUNT(DISTINCT …) over both tables
```

EVIC itself (Enterprise Value Including Cash = market cap + total debt, without netting cash) is
**stored, not derived here** — the ingest pipeline computes it; this route just filters
`evic IS NOT NULL` and returns the components (market_cap, total_debt, cash_and_equivalents,
enterprise_value, evic) so PCAF consumers can audit the identity.

### 7.2 Parameterisation

No model constants. Query parameters and guards:

| Endpoint | Filters | Limits / validation |
|---|---|---|
| `/edgar` | company ILIKE, ticker (uppercased), cik, filing_type, sic_code, fiscal_year min/max | limit ≤ 1000, offset paging |
| `/edgar/compare` | comma-separated tickers, filing_type (default 10-K) | `metric` validated against a 16-item whitelist (revenue … operating_cash_flow); invalid → HTTP 400 |
| `/market` | ticker, company/sector/country/exchange ILIKE, min_market_cap | limit ≤ 500; ordered by market cap desc |
| `/market/evic` | ticker, min_evic | limit ≤ 500; `evic IS NOT NULL` required |

### 7.3 Calculation walkthrough

`/edgar/compare` is the closest thing to analytics: it splits `tickers`, validates `metric`,
pulls all matching filings ordered by (ticker, fiscal_year), and groups them into
`{ticker, company_name, data: [{fiscal_year, value}]}` series using `getattr(r, metric, None)` —
i.e. a pivot of stored fundamentals into chart-ready time series, with `null` for years where the
metric wasn't extracted. No growth rates, CAGRs, or normalisations are computed server-side.

### 7.4 Worked example

`GET /api/v1/financial-data/edgar/compare?metric=revenue&tickers=xom,cvx&filing_type=10-K`
returns:

```json
{"metric": "revenue", "filing_type": "10-K",
 "companies": [
   {"ticker": "XOM", "company_name": "Exxon Mobil Corp",
    "data": [{"fiscal_year": 2021, "value": …}, {"fiscal_year": 2022, "value": …}]},
   {"ticker": "CVX", "…": "…"}]}
```

And `GET /market/evic?ticker=XOM` returns the stored EVIC decomposition — e.g. if
market_cap = $480B and total_debt = $40B, the ingest-computed `evic` field should equal $520B
(EVIC = market cap + total debt per PCAF; cash is *not* subtracted, unlike enterprise value —
both fields are returned so the difference is visible).

### 7.5 Interconnections

- **PCAF financed emissions** — `/market/evic` exists explicitly (per docstring) to feed
  attribution factors `outstanding / EVIC` for listed-equity/bond financed-emissions
  calculations elsewhere on the platform.
- **EDGAR fundamentals** — feed revenue-proxy emission estimates and company comparators in the
  reference-data layer (see memory: OWID/World Bank/SBTi ingest under `/api/v1/refdata` is a
  sibling system; this domain covers SEC + yfinance specifically).

### 7.6 Data provenance & limitations

- **Genuine public-source data** (SEC EDGAR XBRL fundamentals; yfinance snapshots tagged with
  `data_provider` and `ingested_at`) — no synthetic PRNG anywhere in this domain. Freshness is
  bounded by the last ingest run; `as_of_date` exposes staleness per record.
- `/market/tickers` claims "latest market data" but applies **no per-ticker dedup** — if multiple
  snapshots per ticker exist, all rows are returned (ordered by market cap), not just the latest.
- Sector averages are **unweighted arithmetic means** of P/E, P/B, yield and beta — small-caps
  count equally with mega-caps, and negative-earnings P/E outliers are not excluded.
- `/edgar/compare` trusts `getattr` for whitelisted metrics; several whitelist entries
  (`operating_income`, `cash_and_equivalents`, `total_liabilities`, `operating_cash_flow`,
  `ebitda`…) must exist as model columns or will return `None` silently via the default.
- Mixed currencies are returned as stored (`currency` field) with no FX normalisation.

### 7.7 Framework alignment

- **PCAF Global GHG Accounting Standard** — EVIC is PCAF's prescribed denominator for
  listed-company attribution (EVIC = market capitalisation + total debt, floored so it cannot go
  negative, with *no cash netting* — deliberately different from enterprise value); this domain
  provisions exactly that input with its components for auditability.
- **SEC EDGAR / XBRL** — filing types (10-K annual, 10-Q quarterly, 20-F foreign private
  issuer), CIK and SIC codes follow the SEC's public registry semantics.
- No disclosure framework (TCFD/ISSB/CSRD) is computed here — this is upstream input data for
  modules that do.
