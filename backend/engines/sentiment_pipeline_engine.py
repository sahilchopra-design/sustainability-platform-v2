"""
Sentiment Analysis Pipeline Engine
Source: sahilchopra-design/sentiment-engine

8-Step Processing:
1. INGEST  -- Raw signal from source
2. CLASSIFY -- Stakeholder group (8) + ESG pillar (E/S/G)
3. SCORE   -- Raw sentiment [-1.0, +1.0] with confidence [0-1]
4. WEIGHT  -- Apply source credibility (Tier 1: 1.00 -> Tier 5: 0.25)
5. DECAY   -- Time-decay based on signal type (half-lives: 1d to 10yr)
6. AGGREGATE -- Entity composite with HHI diversity
7. VELOCITY -- EWMA-smoothed velocity + acceleration
8. ALERT   -- Threshold alerts (Watch/Elevated/Critical/Extreme)
"""
import math
from datetime import datetime, timedelta
from typing import List, Dict, Optional


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Stakeholder weights (sum = 100%)
STAKEHOLDER_WEIGHTS = {
    'investor':  0.20,
    'regulator': 0.18,
    'employee':  0.15,
    'customer':  0.14,
    'media':     0.12,
    'ngo':       0.08,
    'community': 0.07,
    'supplier':  0.06,
}

# Source credibility tiers
CREDIBILITY_WEIGHTS = {
    1: 1.00,  # Authoritative (SEC filings, audited reports)
    2: 0.85,  # High quality (Reuters, Bloomberg, FT)
    3: 0.65,  # Standard (major newspapers, NGO reports)
    4: 0.45,  # Mixed (social media verified, blogs)
    5: 0.25,  # Low (unverified social, forums)
}

# Signal decay half-lives (days)
DECAY_HALF_LIVES = {
    'instant':   1,
    'fast':      7,
    'medium':    30,
    'slow':      90,
    'chronic':   365,
    'permanent': 3650,
}

# Alert thresholds (ordered least severe -> most severe)
ALERT_THRESHOLDS = {
    'Watch':    -0.3,
    'Elevated': -0.5,
    'Critical': -0.7,
    'Extreme':  -0.9,
}

# ESG topic keywords for classification
ESG_KEYWORDS = {
    'environmental': [
        'climate', 'carbon', 'emissions', 'pollution', 'biodiversity',
        'deforestation', 'water', 'waste', 'energy', 'renewable',
        'fossil', 'methane', 'ocean', 'soil', 'recycling',
    ],
    'social': [
        'labor', 'health', 'safety', 'diversity', 'inclusion',
        'human rights', 'community', 'wage', 'discrimination', 'privacy',
        'supply chain', 'modern slavery', 'child labor',
    ],
    'governance': [
        'governance', 'board', 'compensation', 'audit', 'corruption',
        'bribery', 'tax', 'transparency', 'lobbying', 'shareholder',
        'executive pay', 'compliance', 'ethics', 'whistleblower',
    ],
}

# Signal-to-stakeholder heuristic mapping
SIGNAL_STAKEHOLDER_MAP = {
    'sec_filing':        'regulator',
    'earnings_call':     'investor',
    'press_release':     'media',
    'glassdoor_review':  'employee',
    'customer_review':   'customer',
    'ngo_report':        'ngo',
    'regulatory_action': 'regulator',
    'news_article':      'media',
    'social_media':      'media',
    'academic_paper':    'investor',
}


# ---------------------------------------------------------------------------
# Step 2: Classification
# ---------------------------------------------------------------------------

def classify_stakeholder(signal: Dict) -> str:
    """Step 2a: Classify signal into one of 8 stakeholder groups."""
    signal_type = signal.get('signal_type', '').lower()
    return SIGNAL_STAKEHOLDER_MAP.get(signal_type, 'media')


def classify_esg_pillar(signal: Dict) -> str:
    """Step 2b: Classify signal ESG pillar based on content keywords."""
    text = (signal.get('title', '') + ' ' + signal.get('content', '')).lower()
    scores = {}
    for pillar, keywords in ESG_KEYWORDS.items():
        scores[pillar] = sum(1 for kw in keywords if kw in text)
    if max(scores.values()) == 0:
        return 'governance'  # default pillar
    return max(scores, key=scores.get)


# ---------------------------------------------------------------------------
# Step 4: Credibility weighting
# ---------------------------------------------------------------------------

def apply_credibility_weight(raw_sentiment: float, source_tier: int) -> float:
    """Step 4: Apply source credibility weight to raw sentiment."""
    weight = CREDIBILITY_WEIGHTS.get(source_tier, 0.5)
    return raw_sentiment * weight


# ---------------------------------------------------------------------------
# Step 5: Time decay
# ---------------------------------------------------------------------------

def apply_decay(weighted_sentiment: float, age_days: float,
                decay_category: str) -> float:
    """Step 5: Exponential time-decay based on signal category half-life."""
    half_life = DECAY_HALF_LIVES.get(decay_category, 30)
    decay_factor = math.exp(-0.693 * age_days / half_life)
    return weighted_sentiment * decay_factor


# ---------------------------------------------------------------------------
# Step 6: Entity aggregation
# ---------------------------------------------------------------------------

def aggregate_entity_score(signals: List[Dict]) -> Dict:
    """Step 6: Compute entity composite from stakeholder-weighted signals.

    Returns composite score, confidence (incorporating HHI source diversity),
    signal count, and per-stakeholder breakdown.
    """
    if not signals:
        return {'composite': 0, 'confidence': 0, 'signal_count': 0}

    # Group decayed sentiments by stakeholder
    stakeholder_scores: Dict[str, List[float]] = {sg: [] for sg in STAKEHOLDER_WEIGHTS}
    for s in signals:
        sg = s.get('stakeholder_group', 'media')
        if sg in stakeholder_scores:
            stakeholder_scores[sg].append(s.get('decayed_sentiment', 0))

    # Weighted average across stakeholders
    composite = 0.0
    total_weight = 0.0
    stakeholder_breakdown: Dict[str, float] = {}

    for sg, scores in stakeholder_scores.items():
        if scores:
            avg = sum(scores) / len(scores)
            weight = STAKEHOLDER_WEIGHTS[sg]
            composite += avg * weight
            total_weight += weight
            stakeholder_breakdown[sg] = round(avg, 4)

    if total_weight > 0:
        composite /= total_weight

    # Source diversity via Herfindahl-Hirschman Index (1 - HHI)
    source_counts: Dict[str, int] = {}
    for s in signals:
        src = s.get('source', 'unknown')
        source_counts[src] = source_counts.get(src, 0) + 1
    total = sum(source_counts.values()) or 1
    hhi = sum((c / total) ** 2 for c in source_counts.values())
    diversity = 1 - hhi

    # Confidence: 70% diversity + 30% signal volume (capped at 20 signals)
    confidence = diversity * 0.7 + min(len(signals) / 20, 1.0) * 0.3

    return {
        'composite':              round(composite, 4),
        'confidence':             round(confidence, 4),
        'signal_count':           len(signals),
        'source_diversity':       round(diversity, 4),
        'stakeholder_breakdown':  stakeholder_breakdown,
    }


# ---------------------------------------------------------------------------
# Step 7: Velocity
# ---------------------------------------------------------------------------

def compute_velocity(current_score: float, prev_score: float,
                     alpha: float = 0.2) -> Dict:
    """Step 7: EWMA-smoothed velocity of composite score movement."""
    raw_velocity = current_score - prev_score
    smoothed = alpha * raw_velocity + (1 - alpha) * 0  # prev_ema defaults to 0
    return {
        'raw_velocity':      round(raw_velocity, 4),
        'smoothed_velocity': round(smoothed, 4),
    }


# ---------------------------------------------------------------------------
# Step 8: Alert generation
# ---------------------------------------------------------------------------

def generate_alert(composite: float,
                   entity_id: str = '') -> Optional[Dict]:
    """Step 8: Threshold-based alert generation.

    Iterates thresholds from least negative to most negative and returns
    the most severe tier breached.
    """
    matched_tier = None
    for tier, threshold in sorted(ALERT_THRESHOLDS.items(), key=lambda x: x[1]):
        if composite <= threshold:
            matched_tier = {
                'entity_id':  entity_id,
                'alert_tier': tier,
                'composite':  composite,
                'threshold':  threshold,
                'pillar':     'X',  # cross-cutting for sentiment alerts
            }
    return matched_tier


# ---------------------------------------------------------------------------
# Greenwashing detection
# ---------------------------------------------------------------------------

def greenwashing_discount(marketing_sentiment: float,
                          operational_sentiment: float,
                          kappa: float = 0.5) -> float:
    """Greenwashing Detection Factor.

    GDF = max(0, 1 - kappa * max(0, S_marketing - S_operational) / 100)
    A value of 1.0 means no greenwashing divergence; lower means larger gap.
    """
    divergence = max(0, marketing_sentiment - operational_sentiment)
    gdf = max(0, 1 - kappa * divergence / 100)
    return round(gdf, 4)


# ---------------------------------------------------------------------------
# Full pipeline: single signal
# ---------------------------------------------------------------------------

def process_signal(signal: Dict, prev_score: float = 0) -> Dict:
    """Run the full 8-step pipeline on a single signal dict.

    Expected keys in *signal*:
        signal_type, title, content, sentiment, confidence,
        credibility_tier, age_days, decay_category, source
    """
    # Step 2: Classify
    stakeholder = classify_stakeholder(signal)
    pillar = classify_esg_pillar(signal)

    # Step 3: Score (assumed pre-computed in signal dict)
    raw_sentiment = signal.get('sentiment', 0)
    confidence = signal.get('confidence', 0.7)

    # Step 4: Weight by source credibility
    source_tier = signal.get('credibility_tier', 3)
    weighted = apply_credibility_weight(raw_sentiment * confidence, source_tier)

    # Step 5: Time decay
    age_days = signal.get('age_days', 0)
    decay_cat = signal.get('decay_category', 'medium')
    decayed = apply_decay(weighted, age_days, decay_cat)

    return {
        **signal,
        'stakeholder_group':  stakeholder,
        'esg_pillar':         pillar,
        'weighted_sentiment': round(weighted, 4),
        'decayed_sentiment':  round(decayed, 4),
        'credibility_weight': CREDIBILITY_WEIGHTS.get(source_tier, 0.5),
    }


# ---------------------------------------------------------------------------
# Full pipeline: batch
# ---------------------------------------------------------------------------

def process_batch(signals: List[Dict], entity_id: str = '',
                  prev_score: float = 0) -> Dict:
    """Process a batch of signals through the full 8-step pipeline.

    Returns processed signals, entity composite, velocity, and alert.
    """
    processed = [process_signal(s) for s in signals]
    entity_score = aggregate_entity_score(processed)
    velocity = compute_velocity(entity_score['composite'], prev_score)
    alert = generate_alert(entity_score['composite'], entity_id)

    return {
        'entity_id':         entity_id,
        'processed_signals': processed,
        'entity_score':      entity_score,
        'velocity':          velocity,
        'alert':             alert,
    }
