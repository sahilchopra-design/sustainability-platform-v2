"""
Alpha Vantage Data Service — India NSE/BSE + Forex
===================================================
Supplements EODHD with Indian stock exchange data that EODHD doesn't cover.

Key Capabilities (verified):
  ✅ Indian BSE stock prices (RELIANCE.BSE, INFY.BSE, ITC.BSE)
  ✅ Currency exchange rates (INR/EUR, INR/USD) — critical for CBAM
  ✅ Daily/weekly/monthly OHLCV for Indian tickers
  ❌ Indian fundamentals (empty on free tier)
  ⚠️ Rate limit: 25 requests/day (free), 75/min (premium)

Module Mapping:
  E132 Asia-Pacific Regulatory & BRSR — Indian stock prices for BRSR companies
  E127 CBAM — INR/EUR conversion for CBAM cost calculation
  E110 Export Credit & Trade Finance — INR forex rates
  E5   ESG Investment — India portfolio tracking
  E137 ESG Attribution — Indian stock returns for attribution

Usage:
    from services.alpha_vantage_service import AlphaVantageService
    svc = AlphaVantageService()
    price = svc.get_india_price("RELIANCE", "BSE")
    rate = svc.get_forex_rate("INR", "EUR")
    history = svc.get_india_daily("TCS", "BSE", outputsize="compact")
"""
from __future__ import annotations

import json
import logging
import os
import urllib.request
from typing import Optional

logger = logging.getLogger(__name__)

ALPHA_VANTAGE_KEY = os.environ.get("ALPHA_VANTAGE_API_KEY", "")
AV_BASE = "https://www.alphavantage.co/query"


class AlphaVantageService:
    """Alpha Vantage API wrapper for India NSE/BSE + Forex data."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or ALPHA_VANTAGE_KEY
        if not self.api_key:
            logger.warning("ALPHA_VANTAGE_API_KEY not set")

    def _call(self, params: dict) -> dict:
        """Make API call with error handling."""
        params["apikey"] = self.api_key
        qs = "&".join(f"{k}={v}" for k, v in params.items())
        url = f"{AV_BASE}?{qs}"
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode())
            if "Note" in data:
                logger.warning(f"Alpha Vantage rate limit: {data['Note'][:80]}")
                return {"error": "rate_limited", "message": data["Note"]}
            if "Information" in data:
                return {"error": "rate_limited", "message": data["Information"]}
            return data
        except Exception as e:
            logger.error(f"Alpha Vantage error: {e}")
            return {"error": str(e)}

    # ── Indian Stock Prices ────────────────────────────────────────────────

    def get_india_price(self, symbol: str, exchange: str = "BSE") -> dict:
        """Get latest price for an Indian stock (BSE/NSE)."""
        data = self._call({
            "function": "GLOBAL_QUOTE",
            "symbol": f"{symbol}.{exchange}",
        })
        gq = data.get("Global Quote", {})
        if gq:
            return {
                "symbol": f"{symbol}.{exchange}",
                "price": float(gq.get("05. price", 0)),
                "open": float(gq.get("02. open", 0)),
                "high": float(gq.get("03. high", 0)),
                "low": float(gq.get("04. low", 0)),
                "volume": int(gq.get("06. volume", 0)),
                "previous_close": float(gq.get("08. previous close", 0)),
                "change_pct": gq.get("10. change percent", "0%"),
                "latest_trading_day": gq.get("07. latest trading day"),
                "source": "Alpha Vantage",
                "currency": "INR",
            }
        return {"error": "No data", "symbol": f"{symbol}.{exchange}", "raw": data}

    def get_india_daily(
        self, symbol: str, exchange: str = "BSE",
        outputsize: str = "compact"
    ) -> list[dict]:
        """Get daily OHLCV history for Indian stock. compact=100 days, full=20yr."""
        data = self._call({
            "function": "TIME_SERIES_DAILY",
            "symbol": f"{symbol}.{exchange}",
            "outputsize": outputsize,
        })
        ts = data.get("Time Series (Daily)", {})
        result = []
        for date, vals in sorted(ts.items(), reverse=True):
            result.append({
                "date": date,
                "open": float(vals.get("1. open", 0)),
                "high": float(vals.get("2. high", 0)),
                "low": float(vals.get("3. low", 0)),
                "close": float(vals.get("4. close", 0)),
                "volume": int(vals.get("5. volume", 0)),
            })
        return result

    # ── Forex Rates ────────────────────────────────────────────────────────

    def get_forex_rate(self, from_currency: str, to_currency: str) -> dict:
        """Get real-time forex rate. Critical for CBAM (INR→EUR)."""
        data = self._call({
            "function": "CURRENCY_EXCHANGE_RATE",
            "from_currency": from_currency,
            "to_currency": to_currency,
        })
        rate_data = data.get("Realtime Currency Exchange Rate", {})
        if rate_data:
            return {
                "from": from_currency,
                "to": to_currency,
                "rate": float(rate_data.get("5. Exchange Rate", 0)),
                "bid": float(rate_data.get("8. Bid Price", 0)),
                "ask": float(rate_data.get("9. Ask Price", 0)),
                "last_refreshed": rate_data.get("6. Last Refreshed"),
                "source": "Alpha Vantage Forex",
            }
        return {"error": "No forex data", "raw": data}

    # ── Batch India Prices ─────────────────────────────────────────────────

    def get_brsr_company_prices(self, cin_ticker_map: dict[str, str]) -> dict:
        """
        Get prices for BRSR companies given CIN→BSE ticker mapping.

        Args:
            cin_ticker_map: {"L17110MH1973PLC019786": "RELIANCE", ...}

        Returns:
            {"L17110MH1973PLC019786": {"price": 1414.55, ...}, ...}
        """
        import time
        results = {}
        for cin, ticker in cin_ticker_map.items():
            price = self.get_india_price(ticker, "BSE")
            results[cin] = price
            time.sleep(0.8)  # Rate limit: ~75/min premium, 5/min free
        return results

    # ── CBAM Currency Converter ────────────────────────────────────────────

    def convert_inr_to_eur(self, amount_inr: float) -> dict:
        """Convert INR to EUR for CBAM cost calculations."""
        rate = self.get_forex_rate("INR", "EUR")
        if "error" not in rate:
            eur_amount = amount_inr * rate["rate"]
            return {
                "inr_amount": amount_inr,
                "eur_amount": round(eur_amount, 2),
                "rate": rate["rate"],
                "timestamp": rate.get("last_refreshed"),
                "source": "Alpha Vantage Forex",
            }
        return {"error": rate.get("error"), "inr_amount": amount_inr}


# ── Singleton ──────────────────────────────────────────────────────────────

_av_service: Optional[AlphaVantageService] = None

def get_alpha_vantage_service() -> AlphaVantageService:
    global _av_service
    if _av_service is None:
        _av_service = AlphaVantageService()
    return _av_service
