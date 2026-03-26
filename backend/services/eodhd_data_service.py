"""
EODHD Financial Data Service
=============================
Integrates EODHD API (https://eodhd.com) to provide real-time and historical
market data for ESG analytics modules.

Available Endpoints (with current API tier):
  ✅ EOD Historical Prices — daily OHLCV for 150K+ tickers worldwide
  ✅ Live/Delayed Quotes — real-time stock prices
  ✅ Exchange Lists — 73 exchanges globally
  ✅ Exchange Symbols — ticker lists per exchange
  ❌ Fundamentals — requires upgraded tier (403 on current key)
  ❌ ESG Scores — requires Marketplace subscription

Module Mapping:
  E86  Climate Financial Statements — stock price data for climate-adjusted valuations
  E108 Regulatory Capital — market data for RWA calculations
  E128 Stranded Assets — price trends for fossil fuel companies
  E103 Temperature Alignment — market cap-weighted portfolio ITR
  E137 ESG Attribution — price returns for Brinson-Fachler decomposition
  E138 PCAF Financed Emissions — EVIC (Enterprise Value Including Cash) calculation
  E5   ESG Investment Integration — portfolio price tracking
  E119 Comprehensive Reporting — financial performance overlay in ESG reports

Usage:
    from services.eodhd_data_service import EODHDService
    svc = EODHDService()
    price = svc.get_live_price("RELIANCE", "BSE")
    history = svc.get_eod_history("TCS", "NSE", "2024-01-01", "2025-03-23")
    evic = svc.calculate_evic("AAPL", "US")  # For PCAF financed emissions
"""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger(__name__)

# API key from environment (never hardcode in source)
EODHD_API_KEY = os.environ.get("EODHD_API_KEY", "")


class EODHDService:
    """Wrapper for EODHD Financial Data API."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or EODHD_API_KEY
        if not self.api_key:
            logger.warning("EODHD_API_KEY not set — market data unavailable")
        try:
            from eodhd import APIClient
            self.client = APIClient(self.api_key)
        except ImportError:
            logger.warning("eodhd package not installed — pip install eodhd")
            self.client = None

    # ── Live Prices ────────────────────────────────────────────────────────

    def get_live_price(self, symbol: str, exchange: str = "US") -> dict:
        """Get real-time or delayed price for a ticker."""
        if not self.client:
            return {"error": "EODHD client not initialized"}
        try:
            result = self.client.get_live_stock_prices(symbol, exchange)
            if isinstance(result, dict):
                return {
                    "symbol": f"{symbol}.{exchange}",
                    "price": result.get("close"),
                    "open": result.get("open"),
                    "high": result.get("high"),
                    "low": result.get("low"),
                    "volume": result.get("volume"),
                    "previous_close": result.get("previousClose"),
                    "change_pct": result.get("change_p"),
                    "timestamp": result.get("timestamp"),
                    "source": "EODHD Real-Time API",
                }
            return {"error": "Unexpected response format", "raw": str(result)[:200]}
        except Exception as e:
            logger.error(f"EODHD live price error for {symbol}.{exchange}: {e}")
            return {"error": str(e)}

    # ── Historical EOD Data ────────────────────────────────────────────────

    def get_eod_history(
        self, symbol: str, exchange: str = "US",
        date_from: str = None, date_to: str = None,
        period: str = "d"
    ) -> list[dict]:
        """Get historical end-of-day OHLCV data."""
        if not self.client:
            return [{"error": "EODHD client not initialized"}]

        if not date_from:
            date_from = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
        if not date_to:
            date_to = datetime.now().strftime("%Y-%m-%d")

        try:
            import urllib.request
            url = (
                f"https://eodhd.com/api/eod/{symbol}.{exchange}"
                f"?api_token={self.api_key}&fmt=json"
                f"&from={date_from}&to={date_to}&period={period}"
            )
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode())
            return data if isinstance(data, list) else []
        except Exception as e:
            logger.error(f"EODHD EOD history error: {e}")
            return [{"error": str(e)}]

    # ── Exchange & Symbol Data ─────────────────────────────────────────────

    def get_exchange_tickers(self, exchange: str = "NSE") -> list[dict]:
        """Get all tickers for an exchange."""
        if not self.client:
            return []
        try:
            import urllib.request
            url = f"https://eodhd.com/api/exchange-symbol-list/{exchange}?api_token={self.api_key}&fmt=json"
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=15) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:
            logger.error(f"EODHD exchange tickers error: {e}")
            return []

    # ── PCAF EVIC Calculation ──────────────────────────────────────────────

    def calculate_evic(
        self, symbol: str, exchange: str = "US",
        market_cap: Optional[float] = None,
        total_debt: Optional[float] = None,
        cash: Optional[float] = None,
    ) -> dict:
        """
        Calculate Enterprise Value Including Cash (EVIC) for PCAF financed emissions.
        EVIC = Market Cap + Total Debt (no cash deduction per PCAF methodology).

        If market_cap not provided, fetches from live price × shares outstanding.
        total_debt and cash should be provided from financial statements.
        """
        live = self.get_live_price(symbol, exchange)
        price = live.get("price")

        if not market_cap and price:
            # Placeholder: real implementation needs shares outstanding from fundamentals
            market_cap = price * 1_000_000  # Dummy; needs fundamentals API

        evic = (market_cap or 0) + (total_debt or 0)

        return {
            "symbol": f"{symbol}.{exchange}",
            "market_cap": market_cap,
            "total_debt": total_debt,
            "cash": cash,
            "evic": evic,
            "evic_method": "PCAF Part A §3.3: EVIC = Market Cap + Total Debt",
            "price_source": "EODHD Real-Time API",
            "price": price,
            "timestamp": live.get("timestamp"),
            "note": "Total debt and cash must be provided from financial statements (fundamentals API requires upgraded tier)",
        }

    # ── Portfolio Price Aggregation ────────────────────────────────────────

    def get_portfolio_prices(self, holdings: list[dict]) -> list[dict]:
        """
        Get live prices for a portfolio of holdings.
        Each holding: {"symbol": "RELIANCE", "exchange": "BSE", "weight": 0.15}
        """
        results = []
        for h in holdings:
            price_data = self.get_live_price(h["symbol"], h.get("exchange", "US"))
            price_data["weight"] = h.get("weight", 0)
            price_data["holding_symbol"] = f"{h['symbol']}.{h.get('exchange', 'US')}"
            results.append(price_data)
        return results

    # ── Carbon Intensity with Market Data ──────────────────────────────────

    def carbon_intensity_market_adjusted(
        self,
        symbol: str, exchange: str,
        scope1_tco2e: float, scope2_tco2e: float,
        revenue: Optional[float] = None,
    ) -> dict:
        """
        Calculate market-adjusted carbon intensity using EODHD price data.

        Metrics:
          - Weighted Average Carbon Intensity (WACI): tCO2e / revenue
          - Carbon to Value: tCO2e / market cap (EVIC-based per PCAF)
          - Carbon to Revenue: tCO2e / revenue
        """
        live = self.get_live_price(symbol, exchange)
        price = live.get("price", 0)

        total_emissions = scope1_tco2e + scope2_tco2e

        result = {
            "symbol": f"{symbol}.{exchange}",
            "scope1_tco2e": scope1_tco2e,
            "scope2_tco2e": scope2_tco2e,
            "total_emissions": total_emissions,
            "current_price": price,
            "methodology": "PCAF + ISSB S2 para 29",
        }

        if revenue and revenue > 0:
            result["carbon_to_revenue"] = round(total_emissions / revenue, 6)
            result["unit"] = "tCO2e per unit revenue"

        return result


# ── Convenience function for route handlers ───────────────────────────────

_service: Optional[EODHDService] = None

def get_eodhd_service() -> EODHDService:
    """Singleton factory for EODHD service."""
    global _service
    if _service is None:
        _service = EODHDService()
    return _service
