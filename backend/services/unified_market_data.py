"""
Unified Market Data Service
============================
Single entry point that routes to EODHD, Alpha Vantage, or yfinance based on exchange.

Routing Logic (updated 2026-03-23):
  - Indian BSE/NSE prices → Alpha Vantage (EODHD doesn't cover India)
  - Indian NSE/BSE fundamentals → yfinance (AV doesn't cover BSE fundamentals)
  - Indian EVIC components → yfinance (free, fills PCAF gap for 1,323 BRSR companies)
  - All other global tickers → EODHD All-In-One
  - Forex rates → Alpha Vantage (free, reliable)
  - Sentiment/News → EODHD only
  - ESG scores → Finnhub (Refinitiv, free tier)

Data Stack:
  EODHD ($99.99/mo)  — US/EU/Global prices, fundamentals, news, sentiment, macro
  Alpha Vantage ($49/mo) — India BSE prices, INR forex, CBAM conversions
  yfinance (free)    — India NSE fundamentals, balance sheet, income, cash flow, EVIC
  Finnhub (free)     — Refinitiv ESG scores, controversy flags

Usage:
    from services.unified_market_data import get_unified_service
    svc = get_unified_service()

    # Automatic routing
    price = svc.get_price("RELIANCE", "BSE")        # → Alpha Vantage
    price = svc.get_price("AAPL", "US")             # → EODHD
    rate = svc.get_forex("INR", "EUR")              # → Alpha Vantage
    evic = svc.get_evic("AAPL", "US")              # → EODHD fundamentals
    evic = svc.get_evic("RELIANCE", "NSE")          # → yfinance EVIC
    bs   = svc.get_fundamentals("RELIANCE", "NSE")  # → yfinance balance sheet
    esg  = svc.get_esg_scores("RELIANCE.NS")        # → Finnhub ESG
"""
from __future__ import annotations

import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Indian exchanges routed to Alpha Vantage
_INDIA_EXCHANGES = {"BSE", "NSE", "NSI", "BOM"}


class UnifiedMarketDataService:
    """Routes market data requests to the best available source."""

    def __init__(self):
        from services.eodhd_data_service import get_eodhd_service
        from services.alpha_vantage_service import get_alpha_vantage_service
        self.eodhd = get_eodhd_service()
        self.av = get_alpha_vantage_service()
        # yfinance — lazy import (no API key, just install)
        self._yf_available = None

    def _check_yfinance(self) -> bool:
        if self._yf_available is None:
            try:
                import yfinance  # noqa: F401
                self._yf_available = True
            except ImportError:
                self._yf_available = False
                logger.warning("yfinance not installed — India fundamentals unavailable. Run: pip install yfinance>=0.2.50")
        return self._yf_available

    def _is_india(self, exchange: str) -> bool:
        return exchange.upper() in _INDIA_EXCHANGES

    # ── Unified Price ──────────────────────────────────────────────────────

    def get_price(self, symbol: str, exchange: str = "US") -> dict:
        """Get live/latest price — auto-routes to best source."""
        if self._is_india(exchange):
            result = self.av.get_india_price(symbol, exchange)
            result["routed_to"] = "alpha_vantage"
        else:
            result = self.eodhd.get_live_price(symbol, exchange)
            result["routed_to"] = "eodhd"
        return result

    # ── Unified History ────────────────────────────────────────────────────

    def get_history(self, symbol: str, exchange: str = "US",
                    date_from: str = None, date_to: str = None) -> list[dict]:
        """Get EOD history — auto-routes."""
        if self._is_india(exchange):
            return self.av.get_india_daily(symbol, exchange, "full")
        else:
            return self.eodhd.get_eod_history(symbol, exchange, date_from, date_to)

    # ── Forex ──────────────────────────────────────────────────────────────

    def get_forex(self, from_currency: str, to_currency: str) -> dict:
        """Get forex rate — always Alpha Vantage (free + reliable)."""
        return self.av.get_forex_rate(from_currency, to_currency)

    def convert_to_eur(self, amount: float, from_currency: str = "INR") -> dict:
        """Convert any currency to EUR for CBAM/EU Taxonomy calculations."""
        return self.av.convert_inr_to_eur(amount) if from_currency == "INR" else {
            "error": f"Only INR→EUR supported currently, got {from_currency}"
        }

    # ── Fundamentals (balance sheet / income / cash flow) ─────────────────

    def get_fundamentals(self, symbol: str, exchange: str = "US", statement: str = "balance_sheet") -> dict:
        """
        Get financial statements.
        India (NSE/BSE) → yfinance (fills AV gap for BS/IS/CF)
        Global → EODHD
        """
        if self._is_india(exchange):
            if not self._check_yfinance():
                return {"error": "yfinance not installed", "symbol": symbol, "exchange": exchange}
            from services.yfinance_india_service import (
                get_india_balance_sheet, get_india_income_statement, get_india_cash_flow
            )
            # Build NSE ticker — try .NS first
            ticker = f"{symbol}.NS" if not symbol.endswith((".NS", ".BO")) else symbol
            if statement == "income_statement":
                return get_india_income_statement(ticker)
            elif statement == "cash_flow":
                return get_india_cash_flow(ticker)
            else:
                return get_india_balance_sheet(ticker)
        # Global — EODHD
        return self.eodhd.get_fundamentals(symbol, exchange) if hasattr(self.eodhd, "get_fundamentals") else {
            "symbol": symbol, "exchange": exchange, "note": "Use eodhd_data_service directly for full fundamentals"
        }

    # ── EVIC (PCAF) ────────────────────────────────────────────────────────

    def get_evic(self, symbol: str, exchange: str = "US", **kwargs) -> dict:
        """
        Calculate EVIC — EODHD for fundamentals (US/EU), yfinance for India.
        EVIC = Market Cap + Total Debt + Minority Interest (PCAF Part A §2.3)
        """
        if self._is_india(exchange):
            if self._check_yfinance():
                from services.yfinance_india_service import get_india_evic_components
                ticker = f"{symbol}.NS" if not symbol.endswith((".NS", ".BO")) else symbol
                # Optionally get live INR price from AV to override yfinance price
                try:
                    price_data = self.av.get_india_price(symbol, exchange)
                    current_price = price_data.get("price")
                except Exception:
                    current_price = None
                result = get_india_evic_components(ticker, current_price_inr=current_price)
                result["routed_to"] = "yfinance + alpha_vantage (price)"
                return result
            else:
                # Fallback: price only
                price_data = self.av.get_india_price(symbol, exchange)
                return {
                    "symbol": f"{symbol}.{exchange}",
                    "price": price_data.get("price"),
                    "evic_inr": None,
                    "note": "Install yfinance for full EVIC: pip install yfinance>=0.2.50",
                    "routed_to": "alpha_vantage (price only)",
                }
        return self.eodhd.calculate_evic(symbol, exchange, **kwargs)

    # ── ESG Scores ─────────────────────────────────────────────────────────

    def get_esg_scores(self, symbol: str, exchange: str = "US") -> dict:
        """
        Get ESG scores — Finnhub (Refinitiv) for all tickers.
        Falls back to yfinance (Sustainalytics) for Indian NSE tickers.
        """
        import os
        finnhub_key = os.environ.get("FINNHUB_API_KEY", "")
        if finnhub_key:
            try:
                import finnhub
                client = finnhub.Client(api_key=finnhub_key)
                # Finnhub expects plain US ticker (e.g. "AAPL"), not "AAPL.US"
                clean_symbol = symbol.split(".")[0] if "." in symbol else symbol
                data = client.company_esg_score(clean_symbol)
                if data:
                    return {
                        "symbol": symbol,
                        "source": "Finnhub (Refinitiv ESG)",
                        "total_esg": data.get("totalEsg"),
                        "environment": data.get("environmentScore"),
                        "social": data.get("socialScore"),
                        "governance": data.get("governanceScore"),
                        "esg_risk_rating": data.get("esgRiskRating"),
                        "controversy_level": data.get("highestControversy"),
                        "year": data.get("year"),
                    }
            except Exception as e:
                logger.warning(f"Finnhub ESG failed for {symbol}: {e}")

        # Fallback: yfinance (India NSE tickers work well)
        if self._is_india(exchange) and self._check_yfinance():
            from services.yfinance_india_service import get_india_esg_scores
            ticker = f"{symbol}.NS" if not symbol.endswith((".NS", ".BO")) else symbol
            return get_india_esg_scores(ticker)

        return {"symbol": symbol, "error": "No ESG score available — check FINNHUB_API_KEY or install yfinance"}

    # ── Sentiment (EODHD only) ─────────────────────────────────────────────

    def get_sentiment(self, symbol: str, exchange: str = "US") -> dict:
        """Get sentiment — EODHD only (Alpha Vantage doesn't have this)."""
        from eodhd import APIClient
        try:
            api = APIClient(self.eodhd.api_key)
            return api.get_sentiment(s=f"{symbol}.{exchange}")
        except Exception as e:
            return {"error": str(e)}

    # ── Portfolio Multi-Source ──────────────────────────────────────────────

    def get_portfolio_prices(self, holdings: list[dict]) -> list[dict]:
        """
        Get prices for a mixed portfolio (India + Global).
        Each holding: {"symbol": "RELIANCE", "exchange": "BSE", "weight": 0.15}
        """
        import time
        results = []
        for h in holdings:
            sym = h["symbol"]
            ex = h.get("exchange", "US")
            price = self.get_price(sym, ex)
            price["weight"] = h.get("weight", 0)
            results.append(price)
            time.sleep(0.3)  # Rate limit protection
        return results

    # ── BRSR Company Market Data ───────────────────────────────────────────

    def get_brsr_market_data(self, cin: str, bse_ticker: str) -> dict:
        """
        Get market data for a BRSR company by CIN + BSE ticker.
        Combines BRSR Supabase data with live price from Alpha Vantage.
        """
        price = self.av.get_india_price(bse_ticker, "BSE")
        forex = self.av.get_forex_rate("INR", "EUR")

        result = {
            "cin": cin,
            "bse_ticker": bse_ticker,
            "price_inr": price.get("price"),
            "volume": price.get("volume"),
            "change_pct": price.get("change_pct"),
            "inr_eur_rate": forex.get("rate") if "error" not in forex else None,
            "sources": {
                "price": "Alpha Vantage (BSE)",
                "forex": "Alpha Vantage",
                "esg_data": "BRSR Supabase (dme_brsr_submissions)",
            },
        }

        # Convert market cap to EUR for PCAF/CBAM
        if price.get("price") and forex.get("rate"):
            result["price_eur"] = round(price["price"] * forex["rate"], 4)

        return result


# ── Singleton ──────────────────────────────────────────────────────────────

_unified: Optional[UnifiedMarketDataService] = None

def get_unified_service() -> UnifiedMarketDataService:
    global _unified
    if _unified is None:
        _unified = UnifiedMarketDataService()
    return _unified
