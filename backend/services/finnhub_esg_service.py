"""
Finnhub ESG Service
====================
Provides Refinitiv ESG scores and sustainability data via Finnhub API.
Fills the EODHD ESG gap (EODHD ESG data is 2019 vintage — Finnhub is current).

Free tier: 60 API calls/minute, no daily cap.
API key: FINNHUB_API_KEY in .env

Data sourced from:
  - Refinitiv (LSEG) ESG scores — ~10,000 companies globally
  - Environmental, Social, Governance pillar scores + controversy
  - Peers comparison (same GICS sector)
  - Analyst recommendations (buy/hold/sell)
  - Corporate ESG disclosures (reports, frameworks)

Coverage gaps:
  - Most Indian BSE companies NOT in Finnhub (limited to large-cap NSE ADRs)
  - For Indian ESG: use yfinance (Sustainalytics) as fallback

Modules served:
  - E2 ESG Risk Scoring
  - E4 ESG Benchmark & Peer Comparison
  - E105 Data Quality (ESG coverage assessment)
  - E7 Controversy Monitor
  - E111 ESG Controversy Deep-Dive

References:
  - Finnhub API Documentation: https://finnhub.io/docs/api
  - Refinitiv ESG Scores Methodology (LSEG, 2023)
"""
from __future__ import annotations

import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Import guard
# ---------------------------------------------------------------------------
try:
    import finnhub
    _FINNHUB_AVAILABLE = True
except ImportError:
    _FINNHUB_AVAILABLE = False


def _get_client():
    """Return a Finnhub client, raising if key not configured."""
    if not _FINNHUB_AVAILABLE:
        raise ImportError(
            "finnhub-python not installed. Run: pip install finnhub-python>=2.4.19"
        )
    api_key = os.environ.get("FINNHUB_API_KEY", "")
    if not api_key:
        raise ValueError("FINNHUB_API_KEY not set in environment/.env")
    return finnhub.Client(api_key=api_key)


# ---------------------------------------------------------------------------
# ESG Scores
# ---------------------------------------------------------------------------

def get_esg_scores(symbol: str) -> dict:
    """
    Fetch Refinitiv ESG scores for a company (Finnhub free tier).

    Args:
        symbol: Ticker symbol. For US companies: "AAPL", "MSFT", "TSLA".
                For Indian ADRs listed in US: "INFY", "WIT", "IBN", "HDB".
                Note: Indian BSE tickers (RELIANCE.NS) NOT supported by Finnhub.

    Returns:
        dict with:
          - total_esg: overall ESG risk score (0-100, lower=better)
          - environment_score, social_score, governance_score
          - controversy_level (0-5 scale)
          - esg_risk_level: "negligible"/"low"/"medium"/"high"/"severe"
          - year, month: data vintage
    """
    try:
        client = _get_client()
        data = client.company_esg_score(symbol)
        if not data:
            return {"symbol": symbol, "available": False, "error": "No ESG data returned"}

        total = data.get("totalEsg")
        risk_level = _score_to_risk_level(total)

        return {
            "symbol": symbol,
            "available": True,
            "total_esg": total,
            "environment_score": data.get("environmentScore"),
            "social_score": data.get("socialScore"),
            "governance_score": data.get("governanceScore"),
            "controversy_level": data.get("highestControversy"),
            "esg_risk_level": risk_level,
            "esg_risk_rating": data.get("esgRiskRating"),
            "year": data.get("year"),
            "month": data.get("month"),
            "data_source": "Finnhub (Refinitiv / LSEG ESG)",
            "scale_note": "Sustainalytics scale: 0-10=Negligible, 10-20=Low, 20-30=Medium, 30-40=High, 40+=Severe",
        }
    except Exception as e:
        return {"symbol": symbol, "available": False, "error": str(e), "data_source": "Finnhub"}


def get_esg_peers(symbol: str) -> dict:
    """
    Fetch ESG peer comparison for a company.

    Returns ESG scores for companies in the same GICS sector,
    enabling E4 ESG Benchmark & Peer Comparison module calculations.
    """
    try:
        client = _get_client()
        peers = client.company_peers(symbol)
        if not peers:
            return {"symbol": symbol, "peers": [], "error": "No peer data"}

        peer_scores = []
        for peer in peers[:10]:  # Limit to 10 peers to respect rate limits
            try:
                score = get_esg_scores(peer)
                if score.get("available"):
                    peer_scores.append({
                        "symbol": peer,
                        "total_esg": score.get("total_esg"),
                        "environment": score.get("environment_score"),
                        "social": score.get("social_score"),
                        "governance": score.get("governance_score"),
                        "controversy": score.get("controversy_level"),
                    })
            except Exception:
                continue

        # Compute peer statistics
        esg_vals = [p["total_esg"] for p in peer_scores if p.get("total_esg") is not None]
        peer_stats = {}
        if esg_vals:
            peer_stats = {
                "count": len(esg_vals),
                "mean": round(sum(esg_vals) / len(esg_vals), 2),
                "min": round(min(esg_vals), 2),
                "max": round(max(esg_vals), 2),
                "median": round(sorted(esg_vals)[len(esg_vals) // 2], 2),
            }

        return {
            "symbol": symbol,
            "peer_list": peers,
            "peer_esg_scores": peer_scores,
            "peer_statistics": peer_stats,
            "data_source": "Finnhub (Refinitiv ESG)",
        }
    except Exception as e:
        return {"symbol": symbol, "error": str(e), "data_source": "Finnhub"}


def get_analyst_recommendations(symbol: str) -> dict:
    """
    Fetch analyst buy/hold/sell recommendations (last 6 months).
    Useful for E4 ESG Benchmark, E5 ESG Investment modules.
    """
    try:
        client = _get_client()
        recs = client.recommendation_trends(symbol)
        if not recs:
            return {"symbol": symbol, "recommendations": []}

        latest = recs[0] if recs else {}
        return {
            "symbol": symbol,
            "latest": {
                "period": latest.get("period"),
                "strong_buy": latest.get("strongBuy"),
                "buy": latest.get("buy"),
                "hold": latest.get("hold"),
                "sell": latest.get("sell"),
                "strong_sell": latest.get("strongSell"),
                "total_analysts": sum([
                    latest.get("strongBuy", 0) or 0,
                    latest.get("buy", 0) or 0,
                    latest.get("hold", 0) or 0,
                    latest.get("sell", 0) or 0,
                    latest.get("strongSell", 0) or 0,
                ]),
            },
            "history_6m": recs[:6],
            "data_source": "Finnhub",
        }
    except Exception as e:
        return {"symbol": symbol, "error": str(e), "data_source": "Finnhub"}


def get_company_news(symbol: str, date_from: str = "2025-01-01", date_to: str = "2026-03-23") -> dict:
    """
    Fetch recent company news for controversy monitoring (E111, E7).

    Args:
        symbol: Ticker (US-listed)
        date_from: Start date YYYY-MM-DD
        date_to: End date YYYY-MM-DD

    Returns:
        dict with recent news articles, sentiment indicators
    """
    try:
        client = _get_client()
        news = client.company_news(symbol, _from=date_from, to=date_to)
        if not news:
            return {"symbol": symbol, "articles": [], "count": 0}

        articles = []
        for item in news[:20]:  # Top 20 articles
            articles.append({
                "headline": item.get("headline"),
                "summary": item.get("summary", "")[:300],
                "source": item.get("source"),
                "url": item.get("url"),
                "datetime": item.get("datetime"),
                "category": item.get("category"),
                "sentiment": item.get("sentiment"),
            })

        return {
            "symbol": symbol,
            "date_range": {"from": date_from, "to": date_to},
            "count": len(articles),
            "articles": articles,
            "data_source": "Finnhub",
        }
    except Exception as e:
        return {"symbol": symbol, "error": str(e), "data_source": "Finnhub"}


def get_esg_controversy_summary(symbol: str) -> dict:
    """
    Consolidated controversy assessment combining ESG scores + recent news.
    For E7 Controversy Monitor and E111 ESG Controversy Deep-Dive.
    """
    try:
        esg = get_esg_scores(symbol)
        news = get_company_news(symbol)

        controversy_level = esg.get("controversy_level") or 0
        controversy_label = {0: "None", 1: "Low", 2: "Moderate", 3: "Significant", 4: "High", 5: "Severe"}.get(
            int(controversy_level), "Unknown"
        )

        return {
            "symbol": symbol,
            "controversy_level": controversy_level,
            "controversy_label": controversy_label,
            "esg_risk_level": esg.get("esg_risk_level"),
            "total_esg_score": esg.get("total_esg"),
            "governance_score": esg.get("governance_score"),
            "recent_news_count": news.get("count", 0),
            "top_headlines": [a["headline"] for a in news.get("articles", [])[:5]],
            "assessment": _build_controversy_narrative(symbol, controversy_level, news),
            "data_source": "Finnhub (Refinitiv ESG + News)",
            "modules": ["E7 Controversy Monitor", "E111 ESG Controversy Deep-Dive", "E105 Data Quality"],
        }
    except Exception as e:
        return {"symbol": symbol, "error": str(e)}


# ---------------------------------------------------------------------------
# Batch scoring (for portfolio-level use)
# ---------------------------------------------------------------------------

def batch_esg_scores(symbols: list[str]) -> list[dict]:
    """
    Fetch ESG scores for a list of tickers.
    Respects Finnhub free tier (60 req/min) with rate limiting.

    Args:
        symbols: List of ticker symbols (max 60 per minute)

    Returns:
        List of ESG score dicts
    """
    import time
    results = []
    for i, symbol in enumerate(symbols):
        results.append(get_esg_scores(symbol))
        if (i + 1) % 55 == 0:  # Stay under 60/min limit
            logger.info(f"Finnhub rate limit pause after {i+1} symbols...")
            time.sleep(62)
        else:
            time.sleep(0.05)  # Small delay between calls
    return results


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _score_to_risk_level(score: Optional[float]) -> str:
    if score is None:
        return "unknown"
    if score < 10:
        return "negligible"
    if score < 20:
        return "low"
    if score < 30:
        return "medium"
    if score < 40:
        return "high"
    return "severe"


def _build_controversy_narrative(symbol: str, controversy_level: float, news: dict) -> str:
    level = int(controversy_level or 0)
    count = news.get("count", 0)
    if level == 0 and count < 5:
        return f"{symbol} shows no material controversy signals. ESG monitoring routine."
    elif level <= 2:
        return f"{symbol} has minor controversy signals (level {level}/5). Monitor quarterly."
    elif level <= 3:
        return f"{symbol} has significant controversy (level {level}/5) with {count} recent news items. Recommend ESG deep-dive."
    else:
        return f"{symbol} has severe controversy (level {level}/5). {count} recent news items. Immediate portfolio review recommended."
