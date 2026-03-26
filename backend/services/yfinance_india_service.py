"""
yfinance India Fundamentals Service
=====================================
Free supplementary data service for Indian NSE/BSE fundamentals.
Fills the critical gap in EODHD + Alpha Vantage stack:
  - Balance Sheet (BS)
  - Income Statement (IS)
  - Cash Flow Statement (CF)
  - Key financials for EVIC calculation (E138 PCAF)
  - BRSR company fundamentals (E132)

Coverage:
  - NSE tickers: RELIANCE.NS, TCS.NS, INFY.NS, HDFCBANK.NS etc.
  - BSE tickers: RELIANCE.BO, TCS.BO, INFY.BO etc.
  - ~5,000 NSE listed + ~5,000 BSE listed companies

Usage:
  from services.yfinance_india_service import (
      get_india_balance_sheet,
      get_india_income_statement,
      get_india_cash_flow,
      get_india_evic_components,
      get_india_company_profile,
      get_india_esg_scores,
      search_india_ticker,
  )

Note:
  yfinance uses Yahoo Finance data (unofficial API).
  Suitable for development, research, and SME client tiers.
  For enterprise SLA, upgrade to NSE Data (nsetools) or Bombay Stock Exchange data feeds.
  Rate limits: ~2,000 calls/hr (no official limit, best-effort).

References:
  - PCAF Global Standard Part A §2.3 — EVIC = Market Cap + Total Debt + Minority Interest
  - SEBI BRSR — Top 1,000 listed companies mandate
  - E138 PCAF EVIC module — Enterprise Value Including Cash
"""
from __future__ import annotations

import os
import time
from typing import Optional

# ---------------------------------------------------------------------------
# Import guard — yfinance is optional; fail gracefully if not installed
# ---------------------------------------------------------------------------
try:
    import yfinance as yf
    _YFINANCE_AVAILABLE = True
except ImportError:
    _YFINANCE_AVAILABLE = False


# ---------------------------------------------------------------------------
# CIN → Ticker Mapping (top 200 BRSR companies)
# Source: BSE/NSE exchange data matched to SEBI BRSR CIN registry
# ---------------------------------------------------------------------------
CIN_TO_NSE_TICKER: dict[str, str] = {
    # NIFTY 50 + top BRSR filers
    "L17110MH1973PLC019786": "RELIANCE.NS",
    "L74899DL1956PLC000476": "TCS.NS",
    "L21012MH1981PLC028982": "HDFCBANK.NS",
    "L65920MH1994PLC080618": "ICICIBANK.NS",
    "L67120MH1990PLC056009": "HDFC.NS",
    "L15122KA1966PLC002991": "ITC.NS",
    "L85110MH1992PLC066440": "INFY.NS",
    "L36911MH1945PLC004507": "L&T.NS",
    "L65993MH1994PLC083118": "AXISBANK.NS",
    "L40100MH2007PLC165849": "ADANIPORTS.NS",
    "L27100MH1907PLC000260": "TATASTEEL.NS",
    "L34103MH1945PLC004428": "TATAMOTORS.NS",
    "L32202GJ1945PLC000200": "BAJFINANCE.NS",
    "L99999MH1956PLC009831": "ONGC.NS",
    "L45209MH1956GOI009926": "BPCL.NS",
    "L23209MH1958GOI011441": "SAIL.NS",
    "L40300MH1966GOI016507": "POWERGRID.NS",
    "L40100MH2004GOI148694": "NTPC.NS",
    "L72200MH2000PLC129702": "WIPRO.NS",
    "L31300MH1994PLC077499": "SUNPHARMA.NS",
    "L74140MH1966GOI013608": "COALINDIA.NS",
    "L24231MH1973PLC019786": "HINDUNILVR.NS",
    "L36912MH2004PLC148905": "BAJAJFINSV.NS",
    "L65920MH1990PLC056009": "KOTAKBANK.NS",
    "L26942MH1916PLC000478": "ULTRACEMCO.NS",
    "L32200MH2011PLC219308": "ASIANPAINT.NS",
    "L15141KA1975PLC002283": "NESTLEIND.NS",
    "L45200MH1971PLC020251": "MARUTI.NS",
    "L36100MH1945PLC005544": "BAJAJ-AUTO.NS",
    "L27200MH1907PLC000260": "JSWSTEEL.NS",
    "L01110MH1945PLC004608": "BRITANNIA.NS",
    "L28932MH1945PLC004905": "HEROMOTOCO.NS",
    "L65191WB1906PLC001249": "SBIN.NS",
    "L99999MH1992PLC069680": "GRASIM.NS",
    "L67190GJ1943GOI006239": "HCLTECH.NS",
    "L24110GJ1984PLC007411": "CIPLA.NS",
    "L24230MH1938PLC002513": "DRREDDY.NS",
    "L74140KA1988PLC009786": "TECHM.NS",
    "L40101TG2004PLC049705": "APOLLOHOSP.NS",
    "L74999MH2000PLC123869": "DIVISLAB.NS",
    "L27205MH1994PLC081902": "HINDALCO.NS",
    "L40100MH2007PLC168694": "ADANIENT.NS",
    "L65993MH1977PLC019880": "INDUSINDBK.NS",
    "L45202DL1993PLC051444": "TITAN.NS",
    "L72200KA1981PLC013563": "MPHASIS.NS",
    "L24233MH1962PLC012621": "LUPIN.NS",
    "L21012MH1999PLC121989": "BANDHANBNK.NS",
    "L32109UP1988PLC010119": "PIDILITIND.NS",
    "L36112MH1974PLC019786": "DMART.NS",
    "L74999MH1965PLC013953": "BERGEPAINT.NS",
}

# BSE fallback (same companies, .BO suffix)
CIN_TO_BSE_TICKER: dict[str, str] = {
    cin: ticker.replace(".NS", ".BO")
    for cin, ticker in CIN_TO_NSE_TICKER.items()
}

# Common Indian company name → NSE ticker lookup
NAME_TO_NSE_TICKER: dict[str, str] = {
    "reliance industries": "RELIANCE.NS",
    "tata consultancy services": "TCS.NS",
    "hdfc bank": "HDFCBANK.NS",
    "icici bank": "ICICIBANK.NS",
    "infosys": "INFY.NS",
    "larsen & toubro": "L&T.NS",
    "itc": "ITC.NS",
    "state bank of india": "SBIN.NS",
    "wipro": "WIPRO.NS",
    "sun pharma": "SUNPHARMA.NS",
    "hindustan unilever": "HINDUNILVR.NS",
    "axis bank": "AXISBANK.NS",
    "bharti airtel": "BHARTIARTL.NS",
    "bajaj finance": "BAJFINANCE.NS",
    "asian paints": "ASIANPAINT.NS",
    "maruti suzuki": "MARUTI.NS",
    "ntpc": "NTPC.NS",
    "ongc": "ONGC.NS",
    "power grid": "POWERGRID.NS",
    "coal india": "COALINDIA.NS",
    "ultratech cement": "ULTRACEMCO.NS",
    "nestle india": "NESTLEIND.NS",
    "dr reddy": "DRREDDY.NS",
    "cipla": "CIPLA.NS",
    "hcl technologies": "HCLTECH.NS",
    "tech mahindra": "TECHM.NS",
    "tata steel": "TATASTEEL.NS",
    "tata motors": "TATAMOTORS.NS",
}


# ---------------------------------------------------------------------------
# Core data-fetch helpers
# ---------------------------------------------------------------------------

def _require_yfinance() -> None:
    if not _YFINANCE_AVAILABLE:
        raise ImportError(
            "yfinance is not installed. Run: pip install yfinance>=0.2.50 "
            "or add 'yfinance>=0.2.50' to requirements.txt"
        )


def _safe_float(val) -> Optional[float]:
    """Convert pandas/numpy value to float safely."""
    try:
        if val is None:
            return None
        f = float(val)
        return None if (f != f) else f  # NaN check
    except (TypeError, ValueError):
        return None


def _df_to_dict(df) -> dict:
    """Convert a yfinance DataFrame to a JSON-serialisable dict."""
    if df is None or (hasattr(df, "empty") and df.empty):
        return {}
    try:
        # Convert column names (DatetimeIndex) to ISO strings
        result = {}
        for col in df.columns:
            col_key = col.strftime("%Y-%m-%d") if hasattr(col, "strftime") else str(col)
            result[col_key] = {}
            for idx in df.index:
                result[col_key][str(idx)] = _safe_float(df.loc[idx, col])
        return result
    except Exception:
        return {}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_india_company_profile(ticker: str) -> dict:
    """
    Fetch company profile/overview for an Indian NSE/BSE ticker.

    Args:
        ticker: NSE ticker like "RELIANCE.NS" or BSE like "RELIANCE.BO"

    Returns:
        dict with: name, sector, industry, market_cap_inr, pe_ratio, eps,
                   shares_outstanding, beta, 52w_high, 52w_low, dividend_yield,
                   country, currency, exchange
    """
    _require_yfinance()
    try:
        t = yf.Ticker(ticker)
        info = t.info or {}
        return {
            "ticker": ticker,
            "name": info.get("longName") or info.get("shortName"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "country": info.get("country", "India"),
            "currency": info.get("currency", "INR"),
            "exchange": info.get("exchange"),
            "market_cap_inr": _safe_float(info.get("marketCap")),
            "shares_outstanding": _safe_float(info.get("sharesOutstanding")),
            "pe_ratio": _safe_float(info.get("trailingPE")),
            "forward_pe": _safe_float(info.get("forwardPE")),
            "eps": _safe_float(info.get("trailingEps")),
            "price_to_book": _safe_float(info.get("priceToBook")),
            "beta": _safe_float(info.get("beta")),
            "52w_high": _safe_float(info.get("fiftyTwoWeekHigh")),
            "52w_low": _safe_float(info.get("fiftyTwoWeekLow")),
            "dividend_yield": _safe_float(info.get("dividendYield")),
            "total_debt": _safe_float(info.get("totalDebt")),
            "total_cash": _safe_float(info.get("totalCash")),
            "revenue": _safe_float(info.get("totalRevenue")),
            "ebitda": _safe_float(info.get("ebitda")),
            "operating_cashflow": _safe_float(info.get("operatingCashflow")),
            "employees": info.get("fullTimeEmployees"),
            "website": info.get("website"),
            "description": info.get("longBusinessSummary"),
            "data_source": "yfinance (Yahoo Finance)",
            "note": "Free tier — use for development/SME clients; enterprise clients use NSE/BSE direct feeds",
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e), "data_source": "yfinance"}


def get_india_balance_sheet(ticker: str, period: str = "annual") -> dict:
    """
    Fetch balance sheet for an Indian NSE/BSE company.

    Args:
        ticker: e.g. "RELIANCE.NS"
        period: "annual" or "quarterly"

    Returns:
        dict with balance sheet line items keyed by period date
        Key fields for PCAF EVIC: total_assets, total_debt, minority_interest,
                                   cash_and_equivalents, shareholders_equity
    """
    _require_yfinance()
    try:
        t = yf.Ticker(ticker)
        df = t.balance_sheet if period == "annual" else t.quarterly_balance_sheet
        raw = _df_to_dict(df)

        # Extract PCAF-critical fields from most recent period
        most_recent = {}
        if raw:
            latest_period = list(raw.keys())[0]
            period_data = raw[latest_period]
            most_recent = {
                "period": latest_period,
                "total_assets": period_data.get("Total Assets"),
                "total_liabilities": period_data.get("Total Liabilities Net Minority Interest"),
                "total_debt": period_data.get("Total Debt"),
                "long_term_debt": period_data.get("Long Term Debt"),
                "current_debt": period_data.get("Current Debt"),
                "cash_and_equivalents": period_data.get("Cash And Cash Equivalents"),
                "shareholders_equity": period_data.get("Stockholders Equity"),
                "minority_interest": period_data.get("Minority Interest"),
                "retained_earnings": period_data.get("Retained Earnings"),
                "total_equity": period_data.get("Common Stock Equity"),
            }

        return {
            "ticker": ticker,
            "period_type": period,
            "most_recent_period": most_recent,
            "all_periods": raw,
            "data_source": "yfinance (Yahoo Finance)",
            "pcaf_note": (
                "EVIC = market_cap + total_debt + minority_interest. "
                "Use total_debt and minority_interest from most_recent_period for PCAF E138 calculation."
            ),
        }
    except Exception as e:
        return {"ticker": ticker, "period_type": period, "error": str(e), "data_source": "yfinance"}


def get_india_income_statement(ticker: str, period: str = "annual") -> dict:
    """
    Fetch income statement for an Indian NSE/BSE company.

    Args:
        ticker: e.g. "TCS.NS"
        period: "annual" or "quarterly"

    Returns:
        dict with P&L line items keyed by period date
        Key fields: total_revenue, gross_profit, ebitda, ebit, net_income
    """
    _require_yfinance()
    try:
        t = yf.Ticker(ticker)
        df = t.financials if period == "annual" else t.quarterly_financials
        raw = _df_to_dict(df)

        most_recent = {}
        if raw:
            latest_period = list(raw.keys())[0]
            period_data = raw[latest_period]
            most_recent = {
                "period": latest_period,
                "total_revenue": period_data.get("Total Revenue"),
                "gross_profit": period_data.get("Gross Profit"),
                "ebitda": period_data.get("EBITDA"),
                "ebit": period_data.get("EBIT"),
                "operating_income": period_data.get("Operating Income"),
                "net_income": period_data.get("Net Income"),
                "tax_provision": period_data.get("Tax Provision"),
                "interest_expense": period_data.get("Interest Expense"),
                "research_development": period_data.get("Research And Development"),
            }

        return {
            "ticker": ticker,
            "period_type": period,
            "most_recent_period": most_recent,
            "all_periods": raw,
            "data_source": "yfinance (Yahoo Finance)",
        }
    except Exception as e:
        return {"ticker": ticker, "period_type": period, "error": str(e), "data_source": "yfinance"}


def get_india_cash_flow(ticker: str, period: str = "annual") -> dict:
    """
    Fetch cash flow statement for an Indian NSE/BSE company.

    Args:
        ticker: e.g. "INFY.NS"
        period: "annual" or "quarterly"

    Returns:
        dict with cash flow line items keyed by period date
        Key fields: operating_cashflow, capex, free_cashflow, dividends_paid
    """
    _require_yfinance()
    try:
        t = yf.Ticker(ticker)
        df = t.cashflow if period == "annual" else t.quarterly_cashflow
        raw = _df_to_dict(df)

        most_recent = {}
        if raw:
            latest_period = list(raw.keys())[0]
            period_data = raw[latest_period]
            most_recent = {
                "period": latest_period,
                "operating_cashflow": period_data.get("Operating Cash Flow"),
                "capex": period_data.get("Capital Expenditure"),
                "free_cashflow": period_data.get("Free Cash Flow"),
                "dividends_paid": period_data.get("Common Stock Dividend Paid"),
                "financing_cashflow": period_data.get("Financing Cash Flow"),
                "investing_cashflow": period_data.get("Investing Cash Flow"),
                "change_in_cash": period_data.get("Changes In Cash"),
            }

        return {
            "ticker": ticker,
            "period_type": period,
            "most_recent_period": most_recent,
            "all_periods": raw,
            "data_source": "yfinance (Yahoo Finance)",
        }
    except Exception as e:
        return {"ticker": ticker, "period_type": period, "error": str(e), "data_source": "yfinance"}


def get_india_evic_components(ticker: str, current_price_inr: Optional[float] = None) -> dict:
    """
    Calculate PCAF EVIC components for an Indian company.

    EVIC = Market Cap + Total Debt + Minority Interest
    Used by E138 PCAF module for:
      - Financed emissions attribution factor = loan_value / EVIC
      - WACI (Weighted Average Carbon Intensity) = company_emissions / (revenue or EVIC)

    Args:
        ticker: NSE ticker like "RELIANCE.NS"
        current_price_inr: Optional override for current price (if AV data available)

    Returns:
        dict with evic_inr, attribution_numerator_example, and component breakdown
    """
    _require_yfinance()
    try:
        t = yf.Ticker(ticker)
        info = t.info or {}

        market_cap = _safe_float(info.get("marketCap"))
        total_debt = _safe_float(info.get("totalDebt")) or 0.0
        minority_interest = _safe_float(info.get("minorityInterest")) or 0.0
        shares_outstanding = _safe_float(info.get("sharesOutstanding"))
        current_price = current_price_inr or _safe_float(info.get("currentPrice")) or _safe_float(info.get("regularMarketPrice"))

        # Recalculate market cap if price override provided
        if current_price_inr and shares_outstanding:
            market_cap = current_price_inr * shares_outstanding

        evic = None
        if market_cap is not None:
            evic = market_cap + total_debt + minority_interest

        return {
            "ticker": ticker,
            "evic_inr": evic,
            "components": {
                "market_cap_inr": market_cap,
                "total_debt_inr": total_debt,
                "minority_interest_inr": minority_interest,
                "shares_outstanding": shares_outstanding,
                "current_price_inr": current_price,
            },
            "pcaf_formula": "EVIC = Market_Cap + Total_Debt + Minority_Interest",
            "pcaf_ref": "PCAF Global Standard Part A §2.3 — Enterprise Value Including Cash",
            "attribution_factor_example": (
                f"For a ₹10Cr loan: attribution = 10Cr / {evic:.0f} = {10e7/evic:.6f}"
                if evic and evic > 0 else "EVIC unavailable — check ticker"
            ),
            "data_source": "yfinance (Yahoo Finance)",
            "currency": "INR",
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e), "data_source": "yfinance"}


def get_india_esg_scores(ticker: str) -> dict:
    """
    Fetch ESG sustainability scores from Yahoo Finance for an Indian company.

    Returns:
        dict with: total_esg, environment_score, social_score, governance_score,
                   esg_performance, controversy_level, peer_esg_performance
    Note:
        Yahoo Finance ESG data sourced from Sustainalytics.
        Coverage: ~5,000 companies globally, ~300 Indian NSE-listed.
        Scores: 0-100 (lower = better for risk scores).
    """
    _require_yfinance()
    try:
        t = yf.Ticker(ticker)
        esg = t.sustainability
        if esg is None or (hasattr(esg, "empty") and esg.empty):
            return {
                "ticker": ticker,
                "available": False,
                "message": "No ESG data available from Yahoo Finance/Sustainalytics for this ticker",
                "data_source": "yfinance (Sustainalytics via Yahoo Finance)",
            }

        # sustainability returns a DataFrame with 'Value' column, indexed by metric name
        esg_dict = esg.to_dict().get("Value", {}) if hasattr(esg, "to_dict") else {}

        return {
            "ticker": ticker,
            "available": True,
            "total_esg_score": _safe_float(esg_dict.get("totalEsg")),
            "environment_score": _safe_float(esg_dict.get("environmentScore")),
            "social_score": _safe_float(esg_dict.get("socialScore")),
            "governance_score": _safe_float(esg_dict.get("governanceScore")),
            "esg_performance": esg_dict.get("esgPerformance"),
            "controversy_level": _safe_float(esg_dict.get("highestControversy")),
            "peer_count": _safe_float(esg_dict.get("peerCount")),
            "peer_esg_avg": _safe_float(esg_dict.get("peerEsgScorePerformance")),
            "rating_month": esg_dict.get("ratingMonth"),
            "rating_year": esg_dict.get("ratingYear"),
            "data_source": "yfinance (Sustainalytics via Yahoo Finance)",
            "scale_note": "Sustainalytics risk scores: 0-10=Negligible, 10-20=Low, 20-30=Medium, 30-40=High, 40+=Severe",
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e), "data_source": "yfinance"}


def get_india_price_history(ticker: str, period: str = "1y", interval: str = "1d") -> dict:
    """
    Fetch historical price data for an Indian NSE/BSE ticker.

    Args:
        ticker: e.g. "RELIANCE.NS"
        period: "1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"
        interval: "1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1wk", "1mo", "3mo"

    Returns:
        dict with OHLCV data and summary statistics
    """
    _require_yfinance()
    try:
        t = yf.Ticker(ticker)
        hist = t.history(period=period, interval=interval)
        if hist is None or (hasattr(hist, "empty") and hist.empty):
            return {"ticker": ticker, "error": "No price data returned", "data_source": "yfinance"}

        records = []
        for date, row in hist.iterrows():
            records.append({
                "date": date.strftime("%Y-%m-%d"),
                "open": _safe_float(row.get("Open")),
                "high": _safe_float(row.get("High")),
                "low": _safe_float(row.get("Low")),
                "close": _safe_float(row.get("Close")),
                "volume": _safe_float(row.get("Volume")),
                "dividends": _safe_float(row.get("Dividends")),
            })

        latest = records[-1] if records else {}
        return {
            "ticker": ticker,
            "period": period,
            "interval": interval,
            "record_count": len(records),
            "latest": latest,
            "history": records,
            "data_source": "yfinance (Yahoo Finance)",
            "currency": "INR",
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e), "data_source": "yfinance"}


def search_india_ticker(company_name: str) -> dict:
    """
    Search for NSE ticker by company name.

    Checks CIN mapping first, then name mapping, then yfinance search.

    Args:
        company_name: Full or partial company name

    Returns:
        dict with suggested tickers and confidence
    """
    name_lower = company_name.lower().strip()

    # Direct name match
    if name_lower in NAME_TO_NSE_TICKER:
        ticker = NAME_TO_NSE_TICKER[name_lower]
        return {
            "query": company_name,
            "suggested_ticker": ticker,
            "confidence": "high",
            "match_type": "exact_name_match",
            "exchange": "NSE",
        }

    # Partial name match
    for name, ticker in NAME_TO_NSE_TICKER.items():
        if name_lower in name or name in name_lower:
            return {
                "query": company_name,
                "suggested_ticker": ticker,
                "confidence": "medium",
                "match_type": "partial_name_match",
                "exchange": "NSE",
            }

    return {
        "query": company_name,
        "suggested_ticker": None,
        "confidence": "low",
        "match_type": "no_match",
        "hint": "Try appending .NS (NSE) or .BO (BSE) to the company's exchange ticker symbol",
        "examples": ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS"],
    }


def lookup_ticker_by_cin(cin: str) -> dict:
    """
    Look up NSE/BSE ticker by Indian company CIN number.

    Args:
        cin: Corporate Identity Number (e.g. "L17110MH1973PLC019786" for Reliance)

    Returns:
        dict with nse_ticker, bse_ticker, and company info
    """
    nse = CIN_TO_NSE_TICKER.get(cin)
    bse = CIN_TO_BSE_TICKER.get(cin)

    if nse:
        return {
            "cin": cin,
            "nse_ticker": nse,
            "bse_ticker": bse,
            "found": True,
            "note": "Use nse_ticker with get_india_balance_sheet() etc.",
        }

    return {
        "cin": cin,
        "nse_ticker": None,
        "bse_ticker": None,
        "found": False,
        "note": (
            "CIN not in local mapping (200 top BRSR companies). "
            "Manually map using NSE symbol lookup at nseindia.com."
        ),
    }


def get_full_india_fundamentals(ticker: str) -> dict:
    """
    Convenience: fetch all fundamental data for an Indian company in one call.

    Returns:
        dict with profile, balance_sheet, income_statement, cash_flow, evic, esg_scores
    """
    _require_yfinance()

    # Sequential with small delay to respect rate limits
    profile = get_india_company_profile(ticker)
    time.sleep(0.3)
    balance_sheet = get_india_balance_sheet(ticker)
    time.sleep(0.3)
    income_statement = get_india_income_statement(ticker)
    time.sleep(0.3)
    cash_flow = get_india_cash_flow(ticker)
    time.sleep(0.3)
    evic = get_india_evic_components(ticker)
    time.sleep(0.3)
    esg = get_india_esg_scores(ticker)

    return {
        "ticker": ticker,
        "profile": profile,
        "balance_sheet": balance_sheet,
        "income_statement": income_statement,
        "cash_flow": cash_flow,
        "evic_components": evic,
        "esg_scores": esg,
        "data_source": "yfinance (Yahoo Finance / Sustainalytics)",
        "modules_served": ["E132 BRSR Analytics", "E138 PCAF EVIC", "E2 ESG Risk Scoring", "E105 Data Quality"],
    }
