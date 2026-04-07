EndpointType='Interface',
            SubnetIds=[],  # Specify subnet IDs
            SecurityGroupIds=[]  # Specify security group IDs
        )
        
        return response
    
    def create_kms_key(self, key_alias: str) -> dict:
        """Create KMS key for encryption"""
        
        response = self.kms.create_key(
            Description=f"KMS key for {key_alias}",
            KeyUsage='ENCRYPT_DECRYPT',
            Origin='AWS_KMS',
            Tags=[
                {
                    'TagKey': 'Project',
                    'TagValue': 'CDT-Climate-Risk'
                }
            ]
        )
        
        key_id = response['KeyMetadata']['KeyId']
        
        # Create alias
        self.kms.create_alias(
            AliasName=f"alias/{key_alias}",
            TargetKeyId=key_id
        )
        
        # Enable key rotation
        self.kms.enable_key_rotation(KeyId=key_id)
        
        return response
    
    def configure_encryption_at_rest(self, bucket_name: str, kms_key_id: str) -> dict:
        """Configure S3 encryption at rest"""
        
        s3 = boto3.client('s3')
        
        encryption_config = {
            'Rules': [
                {
                    'ApplyServerSideEncryptionByDefault': {
                        'SSEAlgorithm': 'aws:kms',
                        'KMSMasterKeyID': kms_key_id
                    },
                    'BucketKeyEnabled': True
                }
            ]
        }
        
        response = s3.put_bucket_encryption(
            Bucket=bucket_name,
            ServerSideEncryptionConfiguration=encryption_config
        )
        
        return response
    
    def configure_encryption_in_transit(self) -> dict:
        """Configure TLS/SSL for encryption in transit"""
        
        # This is typically configured at the application level
        # Here we document the requirements
        
        tls_config = {
            "minimum_tls_version": "TLSv1.2",
            "cipher_suites": [
                "TLS_AES_256_GCM_SHA384",
                "TLS_CHACHA20_POLY1305_SHA256",
                "TLS_AES_128_GCM_SHA256"
            ],
            "certificate_authority": "AWS Certificate Manager",
            "hsts_enabled": True,
            "hsts_max_age": 31536000
        }
        
        return tls_config


# IAM Policy Templates
# ====================

IAM_POLICY_TEMPLATES = {
    "s3_read_only": {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:ListBucket"
                ],
                "Resource": [
                    "arn:aws:s3:::cdt-climate-data",
                    "arn:aws:s3:::cdt-climate-data/*"
                ]
            }
        ]
    },
    
    "s3_read_write": {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:ListBucket"
                ],
                "Resource": [
                    "arn:aws:s3:::cdt-climate-data",
                    "arn:aws:s3:::cdt-climate-data/*"
                ]
            }
        ]
    },
    
    "sagemaker_training": {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "sagemaker:CreateTrainingJob",
                    "sagemaker:DescribeTrainingJob",
                    "sagemaker:StopTrainingJob",
                    "sagemaker:CreateModel",
                    "sagemaker:CreateEndpoint",
                    "sagemaker:CreateEndpointConfig"
                ],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject"
                ],
                "Resource": "arn:aws:s3:::cdt-climate-data/*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "iam:PassRole"
                ],
                "Resource": "arn:aws:iam::*:role/SageMakerExecutionRole"
            }
        ]
    },
    
    "lambda_execution": {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": "arn:aws:logs:*:*:*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject"
                ],
                "Resource": "arn:aws:s3:::cdt-climate-data/*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "kms:Decrypt"
                ],
                "Resource": "arn:aws:kms:*:*:key/*"
            }
        ]
    },
    
    "step_functions_execution": {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "lambda:InvokeFunction"
                ],
                "Resource": "arn:aws:lambda:*:*:function:cdt-*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "sagemaker:CreateTrainingJob",
                    "sagemaker:DescribeTrainingJob"
                ],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject"
                ],
                "Resource": "arn:aws:s3:::cdt-climate-data/*"
            }
        ]
    }
}
```

---

## 6. Deterministic Override Mechanisms

### 6.1 Confidence Interval Enrichment

```python
"""
Deterministic Override Mechanisms
=================================

Override model bounds using riskthinking.ai tail risk data
with probabilistic override rules.
"""

import numpy as np
from scipy import stats
from typing import Dict, Tuple, Optional
from dataclasses import dataclass

@dataclass
class OverrideRule:
    """Specification for deterministic override rule"""
    rule_id: str
    condition: str
    override_type: str  # 'enrich', 'replace', 'bound'
    confidence_threshold: float
    source_reliability: float
    temporal_validity_years: int


class ConfidenceIntervalEnricher:
    """
    Enrich confidence intervals using riskthinking.ai tail risk data.
    
    Maps stochastic tail risk distributions to deterministic model bounds,
    enabling probabilistic overrides with quantified uncertainty.
    """
    
    def __init__(self, confidence_level: float = 0.95):
        self.confidence_level = confidence_level
        self.override_rules = []
    
    def enrich_with_tail_risk(
        self,
        deterministic_bounds: Tuple[float, float],
        tail_risk_distribution: np.ndarray,
        override_aggressiveness: str = "moderate"
    ) -> Dict:
        """
        Enrich deterministic bounds using tail risk distribution.
        
        Args:
            deterministic_bounds: (lower, upper) bounds from deterministic model
            tail_risk_distribution: Ensemble of tail risk values
            override_aggressiveness: "conservative", "moderate", "aggressive"
            
        Returns:
            dict: Enriched bounds with override metadata
        """
        det_lower, det_upper = deterministic_bounds
        
        # Calculate tail risk percentiles
        tail_p05 = np.percentile(tail_risk_distribution, 5)
        tail_p95 = np.percentile(tail_risk_distribution, 95)
        tail_p99 = np.percentile(tail_risk_distribution, 99)
        
        # Calculate tail risk statistics
        tail_mean = np.mean(tail_risk_distribution)
        tail_std = np.std(tail_risk_distribution)
        
        # Determine override strategy based on aggressiveness
        if override_aggressiveness == "conservative":
            # Only override if tail risk significantly exceeds bounds
            override_factor = 0.3
        elif override_aggressiveness == "moderate":
            # Balanced override
            override_factor = 0.5
        else:  # aggressive
            # Strong override toward tail risk
            override_factor = 0.8
        
        # Calculate enriched bounds
        # Upper bound: consider tail risk 95th percentile
        enriched_upper = det_upper + override_factor * (tail_p95 - det_upper)
        
        # Lower bound: consider tail risk 5th percentile
        enriched_lower = det_lower + override_factor * (tail_p05 - det_lower)
        
        # Ensure bounds remain valid
        enriched_lower = max(0, min(enriched_lower, enriched_upper))
        enriched_upper = max(enriched_lower, enriched_upper)
        
        return {
            "original_bounds": {
                "lower": round(det_lower, 4),
                "upper": round(det_upper, 4)
            },
            "enriched_bounds": {
                "lower": round(enriched_lower, 4),
                "upper": round(enriched_upper, 4)
            },
            "tail_risk_stats": {
                "mean": round(tail_mean, 4),
                "std": round(tail_std, 4),
                "p05": round(tail_p05, 4),
                "p95": round(tail_p95, 4),
                "p99": round(tail_p99, 4)
            },
            "override_metadata": {
                "aggressiveness": override_aggressiveness,
                "override_factor": override_factor,
                "upper_bound_extended": enriched_upper > det_upper,
                "lower_bound_extended": enriched_lower < det_lower,
                "enrichment_applied": True
            }
        }
    
    def probabilistic_override(
        self,
        base_estimate: float,
        override_estimate: float,
        base_confidence: float,
        override_confidence: float,
        correlation: float = 0.5
    ) -> Dict:
        """
        Combine estimates using probabilistic override.
        
        Uses precision-weighted combination accounting for correlation.
        
        Args:
            base_estimate: Original deterministic estimate
            override_estimate: riskthinking.ai override estimate
            base_confidence: Confidence in base estimate (0-1)
            override_confidence: Confidence in override (0-1)
            correlation: Correlation between estimates
            
        Returns:
            dict: Combined estimate with uncertainty
        """
        # Convert confidence to precision (inverse variance)
        base_precision = base_confidence / (1 - base_confidence + 0.001)
        override_precision = override_confidence / (1 - override_confidence + 0.001)
        
        # Precision-weighted combination
        # Accounting for correlation using precision-weighted average
        if correlation >= 1:
            # Perfect correlation - use higher confidence estimate
            combined = override_estimate if override_confidence > base_confidence else base_estimate
            combined_precision = max(base_precision, override_precision)
        else:
            # Combine with correlation adjustment
            combined = (
                base_precision * base_estimate +
                override_precision * override_estimate
            ) / (base_precision + override_precision)
            
            combined_precision = base_precision + override_precision - \
                                2 * correlation * np.sqrt(base_precision * override_precision)
        
        combined_confidence = combined_precision / (1 + combined_precision)
        
        return {
            "combined_estimate": round(combined, 4),
            "combined_confidence": round(combined_confidence, 4),
            "base_contribution": round(base_precision / (base_precision + override_precision), 4),
            "override_contribution": round(override_precision / (base_precision + override_precision), 4),
            "correlation_adjusted": correlation < 1,
            "override_applied": override_confidence > base_confidence
        }


class TailRiskOverrideEngine:
    """
    Engine for applying tail risk-based overrides to deterministic models.
    """
    
    def __init__(self):
        self.enricher = ConfidenceIntervalEnricher()
        self.override_history = []
    
    def apply_override(
        self,
        asset_id: str,
        scenario: str,
        horizon: int,
        hazard: str,
        deterministic_result: dict,
        tail_risk_data: dict,
        override_policy: str = "moderate"
    ) -> dict:
        """
        Apply tail risk override to deterministic model result.
        
        Args:
            asset_id: Asset identifier
            scenario: Climate scenario
            horizon: Time horizon
            hazard: Hazard type
            deterministic_result: Output from deterministic model
            tail_risk_data: riskthinking.ai tail risk metrics
            override_policy: Override policy level
            
        Returns:
            dict: Override result with full audit trail
        """
        # Extract deterministic bounds
        det_bounds = (
            deterministic_result.get('confidence_interval', {}).get('lower', 0),
            deterministic_result.get('confidence_interval', {}).get('upper', 1)
        )
        
        # Extract tail risk distribution
        tail_risk_dist = tail_risk_data.get('ensemble_distribution', [])
        if not tail_risk_dist:
            # Fallback to single value
            tail_risk_dist = [tail_risk_data.get('tail_risk_score', 0.5)]
        
        # Apply enrichment
        enriched = self.enricher.enrich_with_tail_risk(
            det_bounds,
            np.array(tail_risk_dist),
            override_aggressiveness=override_policy
        )
        
        # Create override record
        override_record = {
            "asset_id": asset_id,
            "scenario": scenario,
            "horizon": horizon,
            "hazard": hazard,
            "timestamp": datetime.now().isoformat(),
            "override_policy": override_policy,
            "enrichment_result": enriched,
            "deterministic_input": deterministic_result,
            "tail_risk_input": tail_risk_data
        }
        
        self.override_history.append(override_record)
        
        return {
            "enriched_result": enriched,
            "override_record_id": len(self.override_history) - 1,
            "override_applied": enriched['override_metadata']['enrichment_applied'],
            "recommendation": self._generate_recommendation(enriched)
        }
    
    def _generate_recommendation(self, enriched: dict) -> str:
        """Generate human-readable recommendation"""
        
        orig = enriched['original_bounds']
        new = enriched['enriched_bounds']
        
        if new['upper'] > orig['upper'] * 1.2:
            return (
                f"CRITICAL: Tail risk suggests significantly higher upper bound "
                f"({new['upper']:.2%} vs {orig['upper']:.2%}). "
                f"Consider stress testing with enriched bounds."
            )
        elif new['upper'] > orig['upper']:
            return (
                f"ELEVATED: Tail risk suggests moderately higher upper bound. "
                f"Monitor closely and consider enhanced risk controls."
            )
        else:
            return (
                f"STABLE: Deterministic bounds adequately capture tail risk. "
                f"No significant override required."
            )
```

### 6.2 Data Quality Scoring

```python
class DataQualityScorer:
    """
    Score data quality for override decisions.
    
    Considers source reliability, temporal relevance, and spatial accuracy.
    """
    
    def __init__(self):
        self.source_weights = {
            "riskthinking_cdt": 0.95,
            "cmip6_ensemble": 0.90,
            "ngfs_phase4": 0.88,
            "ipcc_ar6": 0.92,
            "regional_model": 0.75,
            "statistical_downscaling": 0.70,
            "historical_observation": 0.85,
            "satellite_derived": 0.80
        }
    
    def calculate_source_reliability(
        self,
        source_type: str,
        model_version: str = None,
        validation_status: str = "validated"
    ) -> float:
        """
        Calculate source reliability score.
        
        Args:
            source_type: Type of data source
            model_version: Model version identifier
            validation_status: Validation status
            
        Returns:
            float: Reliability score (0-1)
        """
        base_score = self.source_weights.get(source_type, 0.5)
        
        # Adjust for validation status
        validation_multiplier = {
            "peer_reviewed": 1.0,
            "validated": 0.95,
            "preliminary": 0.80,
            "experimental": 0.60
        }
        
        multiplier = validation_multiplier.get(validation_status, 0.7)
        
        # Adjust for model version (newer = better)
        if model_version:
            try:
                version_num = float(model_version.split('.')[0])
                if version_num >= 4:
                    version_bonus = 0.05
                elif version_num >= 3:
                    version_bonus = 0.02
                else:
                    version_bonus = 0
            except:
                version_bonus = 0
        else:
            version_bonus = 0
        
        return min(base_score * multiplier + version_bonus, 1.0)
    
    def calculate_temporal_relevance(
        self,
        data_year: int,
        projection_horizon: int,
        current_year: int = None
    ) -> float:
        """
        Calculate temporal relevance score.
        
        Args:
            data_year: Year data was generated
            projection_horizon: Target projection year
            current_year: Current year (default: now)
            
        Returns:
            float: Temporal relevance score (0-1)
        """
        if current_year is None:
            current_year = datetime.now().year
        
        # Data age penalty
        data_age = current_year - data_year
        age_penalty = min(data_age * 0.02, 0.2)  # Max 20% penalty for old data
        
        # Projection distance penalty
        projection_distance = projection_horizon - current_year
        if projection_distance <= 10:
            distance_penalty = 0
        elif projection_distance <= 30:
            distance_penalty = 0.1
        else:
            distance_penalty = 0.2
        
        return max(0, 1 - age_penalty - distance_penalty)
    
    def calculate_spatial_accuracy(
        self,
        resolution_km: float,
        asset_location_confidence: float,
        downscaling_method: str = None
    ) -> float:
        """
        Calculate spatial accuracy score.
        
        Args:
            resolution_km: Spatial resolution in kilometers
            asset_location_confidence: Confidence in asset location (0-1)
            downscaling_method: Downscaling technique used
            
        Returns:
            float: Spatial accuracy score (0-1)
        """
        # Resolution score (higher resolution = better)
        if resolution_km <= 5:
            resolution_score = 1.0
        elif resolution_km <= 25:
            resolution_score = 0.9
        elif resolution_km <= 100:
            resolution_score = 0.75
        else:
            resolution_score = 0.6
        
        # Downscaling method adjustment
        downscaling_bonus = {
            "dynamic": 0.05,
            "statistical_bias_correction": 0.03,
            "simple_interpolation": 0,
            "none": -0.1
        }
        
        bonus = downscaling_bonus.get(downscaling_method, 0)
        
        # Combine with location confidence
        combined = resolution_score * asset_location_confidence + bonus
        
        return min(max(combined, 0), 1)
    
    def calculate_overall_quality_score(
        self,
        source_reliability: float,
        temporal_relevance: float,
        spatial_accuracy: float,
        weights: dict = None
    ) -> dict:
        """
        Calculate overall data quality score.
        
        Args:
            source_reliability: Source reliability score
            temporal_relevance: Temporal relevance score
            spatial_accuracy: Spatial accuracy score
            weights: Optional custom weights
            
        Returns:
            dict: Quality score breakdown
        """
        if weights is None:
            weights = {
                "source": 0.4,
                "temporal": 0.3,
                "spatial": 0.3
            }
        
        overall = (
            weights["source"] * source_reliability +
            weights["temporal"] * temporal_relevance +
            weights["spatial"] * spatial_accuracy
        )
        
        return {
            "overall_score": round(overall, 4),
            "component_scores": {
                "source_reliability": round(source_reliability, 4),
                "temporal_relevance": round(temporal_relevance, 4),
                "spatial_accuracy": round(spatial_accuracy, 4)
            },
            "weights_applied": weights,
            "quality_tier": self._tier_from_score(overall),
            "override_eligible": overall >= 0.7
        }
    
    def _tier_from_score(self, score: float) -> str:
        """Convert score to quality tier"""
        if score >= 0.9:
            return "excellent"
        elif score >= 0.8:
            return "good"
        elif score >= 0.7:
            return "acceptable"
        elif score >= 0.6:
            return "marginal"
        else:
            return "poor"


class OverrideTriggerConditions:
    """
    Define conditions that trigger deterministic overrides.
    """
    
    TRIGGERS = {
        "tail_risk_exceeds_threshold": {
            "description": "Tail risk score exceeds defined threshold",
            "parameters": {"threshold": 0.8},
            "severity": "high"
        },
        "confidence_interval_too_narrow": {
            "description": "Deterministic CI width less than minimum",
            "parameters": {"min_width": 0.1},
            "severity": "medium"
        },
        "model_disagreement": {
            "description": "Significant disagreement between models",
            "parameters": {"max_difference": 0.3},
            "severity": "medium"
        },
        "extreme_event_detected": {
            "description": "Extreme event probability above threshold",
            "parameters": {"probability_threshold": 0.05},
            "severity": "critical"
        },
        "data_quality_concern": {
            "description": "Overall data quality score below threshold",
            "parameters": {"min_quality": 0.6},
            "severity": "low"
        }
    }
    
    @classmethod
    def evaluate_triggers(
        cls,
        deterministic_result: dict,
        tail_risk_data: dict,
        quality_score: float
    ) -> list:
        """
        Evaluate all trigger conditions.
        
        Args:
            deterministic_result: Deterministic model output
            tail_risk_data: Tail risk metrics
            quality_score: Overall data quality score
            
        Returns:
            list: Triggered conditions
        """
        triggered = []
        
        # Check tail risk threshold
        tail_risk = tail_risk_data.get('tail_risk_score', 0)
        if tail_risk > cls.TRIGGERS['tail_risk_exceeds_threshold']['parameters']['threshold']:
            triggered.append({
                "trigger": "tail_risk_exceeds_threshold",
                "value": tail_risk,
                "threshold": 0.8,
                "severity": "high"
            })
        
        # Check confidence interval width
        ci = deterministic_result.get('confidence_interval', {})
        ci_width = ci.get('upper', 1) - ci.get('lower', 0)
        if ci_width < cls.TRIGGERS['confidence_interval_too_narrow']['parameters']['min_width']:
            triggered.append({
                "trigger": "confidence_interval_too_narrow",
                "value": ci_width,
                "threshold": 0.1,
                "severity": "medium"
            })
        
        # Check data quality
        if quality_score < cls.TRIGGERS['data_quality_concern']['parameters']['min_quality']:
            triggered.append({
                "trigger": "data_quality_concern",
                "value": quality_score,
                "threshold": 0.6,
                "severity": "low"
            })
        
        return triggered
```

### 6.3 Version Control for Overrides

```python
import hashlib
import json
from datetime import datetime
from typing import List, Dict

class OverrideVersionControl:
    """
    Version control system for deterministic overrides.
    
    Maintains complete audit trail of all override decisions.
    """
    
    def __init__(self, storage_backend: str = "s3"):
        self.storage_backend = storage_backend
        self.versions = {}
        self.current_version = None
    
    def create_version(
        self,
        override_data: dict,
        parent_version: str = None,
        metadata: dict = None
    ) -> str:
        """
        Create new override version.
        
        Args:
            override_data: Override configuration/data
            parent_version: Parent version ID (for branching)
            metadata: Version metadata
            
        Returns:
            str: Version ID
        """
        # Generate version hash
        content_hash = hashlib.sha256(
            json.dumps(override_data, sort_keys=True).encode()
        ).hexdigest()[:16]
        
        version_id = f"v{datetime.now().strftime('%Y%m%d')}-{content_hash}"
        
        version_record = {
            "version_id": version_id,
            "parent_version": parent_version,
            "created_at": datetime.now().isoformat(),
            "override_data": override_data,
            "metadata": metadata or {},
            "status": "active"
        }
        
        self.versions[version_id] = version_record
        self.current_version = version_id
        
        return version_id
    
    def get_version(self, version_id: str) -> dict:
        """Retrieve specific version"""
        return self.versions.get(version_id)
    
    def list_versions(
        self,
        asset_id: str = None,
        scenario: str = None
    ) -> List[dict]:
        """
        List versions with optional filtering.
        
        Args:
            asset_id: Filter by asset
            scenario: Filter by scenario
            
        Returns:
            list: Matching versions
        """
        versions = list(self.versions.values())
        
        if asset_id:
            versions = [
                v for v in versions
                if v.get('metadata', {}).get('asset_id') == asset_id
            ]
        
        if scenario:
            versions = [
                v for v in versions
                if v.get('metadata', {}).get('scenario') == scenario
            ]
        
        return sorted(versions, key=lambda x: x['created_at'], reverse=True)
    
    def compare_versions(self, version_a: str, version_b: str) -> dict:
        """
        Compare two override versions.
        
        Args:
            version_a: First version ID
            version_b: Second version ID
            
        Returns:
            dict: Comparison results
        """
        v_a = self.get_version(version_a)
        v_b = self.get_version(version_b)
        
        if not v_a or not v_b:
            return {"error": "One or both versions not found"}
        
        # Compare override data
        data_a = v_a.get('override_data', {})
        data_b = v_b.get('override_data', {})
        
        differences = []
        
        all_keys = set(data_a.keys()) | set(data_b.keys())
        for key in all_keys:
            val_a = data_a.get(key)
            val_b = data_b.get(key)
            
            if val_a != val_b:
                differences.append({
                    "field": key,
                    "version_a": val_a,
                    "version_b": val_b
                })
        
        return {
            "version_a": version_a,
            "version_b": version_b,
            "differences": differences,
            "difference_count": len(differences),
            "created_at_a": v_a['created_at'],
            "created_at_b": v_b['created_at']
        }
    
    def rollback_to_version(self, version_id: str) -> dict:
        """
        Rollback to previous version.
        
        Args:
            version_id: Version to rollback to
            
        Returns:
            dict: Rollback result
        """
        target_version = self.get_version(version_id)
        
        if not target_version:
            return {"error": "Version not found", "version_id": version_id}
        
        # Create rollback record
        rollback_record = {
            "rollback_from": self.current_version,
            "rollback_to": version_id,
            "rollback_at": datetime.now().isoformat(),
            "reason": "Manual rollback"
        }
        
        # Update current version
        self.current_version = version_id
        
        # Mark rolled-back version
        if self.current_version in self.versions:
            self.versions[self.current_version]['status'] = 'rolled_back'
        
        return {
            "success": True,
            "current_version": version_id,
            "rollback_record": rollback_record
        }
    
    def generate_audit_report(self, asset_id: str = None) -> dict:
        """
        Generate audit report for override history.
        
        Args:
            asset_id: Optional asset filter
            
        Returns:
            dict: Audit report
        """
        versions = self.list_versions(asset_id=asset_id)
        
        report = {
            "generated_at": datetime.now().isoformat(),
            "asset_id": asset_id,
            "total_versions": len(versions),
            "active_versions": len([v for v in versions if v['status'] == 'active']),
            "rolled_back_versions": len([v for v in versions if v['status'] == 'rolled_back']),
            "version_history": [
                {
                    "version_id": v['version_id'],
                    "created_at": v['created_at'],
                    "status": v['status'],
                    "metadata": v.get('metadata', {})
                }
                for v in versions
            ]
        }
        
        return report
```

---

## 7. API Response Processing Pipeline

### 7.1 Response Parsing and Validation

```python
"""
API Response Processing Pipeline
================================

Complete pipeline for processing CDT Express™ API responses.
"""

import json
import jsonschema
from jsonschema import validate, ValidationError
from typing import Dict, Any, List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ResponseValidator:
    """
    Validate CDT Express™ API responses against schemas.
    """
    
    # JSON Schema for risk metrics response
    RISK_METRICS_SCHEMA = {
        "type": "object",
        "required": ["status", "data"],
        "properties": {
            "status": {
                "type": "string",
                "enum": ["success", "partial", "error"]
            },
            "data": {
                "type": "object",
                "properties": {
                    "asset_results": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["asset_id", "location"],
                            "properties": {
                                "asset_id": {"type": "string"},
                                "location": {
                                    "type": "object",
                                    "properties": {
                                        "latitude": {"type": "number"},
                                        "longitude": {"type": "number"}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "metadata": {
                "type": "object",
                "properties": {
                    "request_id": {"type": "string"},
                    "timestamp": {"type": "string"}
                }
            }
        }
    }
    
    def __init__(self):
        self.validation_errors = []
    
    def validate_response(self, response: dict, schema: dict = None) -> dict:
        """
        Validate API response against schema.
        
        Args:
            response: API response dictionary
            schema: JSON schema (default: RISK_METRICS_SCHEMA)
            
        Returns:
            dict: Validation result
        """
        schema = schema or self.RISK_METRICS_SCHEMA
        
        try:
            validate(instance=response, schema=schema)
            return {
                "valid": True,
                "errors": []
            }
        except ValidationError as e:
            self.validation_errors.append(str(e))
            return {
                "valid": False,
                "errors": [str(e)],
                "error_path": list(e.path) if e.path else None
            }
    
    def validate_batch_responses(
        self,
        responses: List[dict]
    ) -> dict:
        """
        Validate multiple responses in batch.
        
        Args:
            responses: List of API responses
            
        Returns:
            dict: Batch validation results
        """
        results = []
        valid_count = 0
        
        for i, response in enumerate(responses):
            result = self.validate_response(response)
            result['index'] = i
            results.append(result)
            
            if result['valid']:
                valid_count += 1
        
        return {
            "total": len(responses),
            "valid": valid_count,
            "invalid": len(responses) - valid_count,
            "validity_rate": valid_count / len(responses) if responses else 0,
            "results": results
        }


class ResponseParser:
    """
    Parse CDT Express™ API responses into structured formats.
    """
    
    def __init__(self):
        self.validator = ResponseValidator()
    
    def parse_risk_metrics(self, response: dict) -> List[dict]:
        """
        Parse risk metrics response into flat records.
        
        Args:
            response: API response
            
        Returns:
            list: Flattened risk records
        """
        # Validate first
        validation = self.validator.validate_response(response)
        if not validation['valid']:
            logger.error(f"Invalid response: {validation['errors']}")
            return []
        
        records = []
        
        for asset in response.get('data', {}).get('asset_results', []):
            asset_id = asset.get('asset_id')
            location = asset.get('location', {})
            
            for hazard_result in asset.get('hazard_results', []):
                record = {
                    'asset_id': asset_id,
                    'latitude': location.get('latitude'),
                    'longitude': location.get('longitude'),
                    'country': location.get('country'),
                    'hazard': hazard_result.get('hazard'),
                    'scenario': hazard_result.get('scenario'),
                    'horizon': hazard_result.get('horizon'),
                    'tail_risk_score': hazard_result.get('metrics', {}).get('tail_risk_score'),
                    'expected_damage': hazard_result.get('metrics', {}).get('expected_damage', {}).get('value'),
                    'var_95': hazard_result.get('metrics', {}).get('var', {}).get('var_95'),
                    'cvar_95': hazard_result.get('metrics', {}).get('cvar', {}).get('cvar_95'),
                    'probability': hazard_result.get('metrics', {}).get('probability', {}).get('annual_exceedance'),
                    'request_id': response.get('metadata', {}).get('request_id'),
                    'timestamp': response.get('metadata', {}).get('timestamp')
                }
                records.append(record)
        
        return records
    
    def parse_ensemble_distribution(
        self,
        response: dict
    ) -> Dict[str, List[float]]:
        """
        Parse ensemble distribution from response.
        
        Args:
            response: API response with ensemble data
            
        Returns:
            dict: Ensemble distributions by asset
        """
        distributions = {}
        
        for asset in response.get('data', {}).get('asset_results', []):
            asset_id = asset.get('asset_id')
            
            for hazard_result in asset.get('hazard_results', []):
                ensemble = hazard_result.get('ensemble_distribution', {})
                
                key = f"{asset_id}_{hazard_result.get('hazard')}"
                distributions[key] = ensemble.get('ensemble_members', [])
        
        return distributions
    
    def parse_to_dataframe(self, response: dict) -> pd.DataFrame:
        """
        Parse response directly to pandas DataFrame.
        
        Args:
            response: API response
            
        Returns:
            pd.DataFrame: Parsed data
        """
        records = self.parse_risk_metrics(response)
        return pd.DataFrame(records)
```

### 7.2 Error Handling and Retries

```python
import time
import random
from functools import wraps
from typing import Callable, TypeVar

T = TypeVar('T')

class APIErrorHandler:
    """
    Handle API errors with intelligent retry logic.
    """
    
    # Error codes and their retry behavior
    ERROR_CONFIG = {
        400: {"retry": False, "description": "Bad Request"},
        401: {"retry": False, "description": "Unauthorized"},
        403: {"retry": False, "description": "Forbidden"},
        404: {"retry": False, "description": "Not Found"},
        429: {"retry": True, "description": "Rate Limited", "backoff": "exponential"},
        500: {"retry": True, "description": "Internal Server Error", "backoff": "exponential"},
        502: {"retry": True, "description": "Bad Gateway", "backoff": "exponential"},
        503: {"retry": True, "description": "Service Unavailable", "backoff": "exponential"},
        504: {"retry": True, "description": "Gateway Timeout", "backoff": "exponential"}
    }
    
    def __init__(
        self,
        max_retries: int = 5,
        base_delay: float = 1.0,
        max_delay: float = 60.0
    ):
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
    
    def calculate_backoff(
        self,
        attempt: int,
        backoff_type: str = "exponential",
        jitter: bool = True
    ) -> float:
        """
        Calculate retry delay with backoff.
        
        Args:
            attempt: Retry attempt number
            backoff_type: "exponential", "linear", "fixed"
            jitter: Add random jitter
            
        Returns:
            float: Delay in seconds
        """
        if backoff_type == "exponential":
            delay = self.base_delay * (2 ** attempt)
        elif backoff_type == "linear":
            delay = self.base_delay * attempt
        else:  # fixed
            delay = self.base_delay
        
        # Apply jitter (±25%)
        if jitter:
            delay *= random.uniform(0.75, 1.25)
        
        return min(delay, self.max_delay)
    
    def should_retry(self, status_code: int) -> bool:
        """Determine if request should be retried"""
        config = self.ERROR_CONFIG.get(status_code, {})
        return config.get("retry", False)
    
    def execute_with_retry(
        self,
        func: Callable[..., T],
        *args,
        **kwargs
    ) -> T:
        """
        Execute function with retry logic.
        
        Args:
            func: Function to execute
            *args: Function arguments
            **kwargs: Function keyword arguments
            
        Returns:
            Function result
            
        Raises:
            Exception: If all retries exhausted
        """
        last_exception = None
        
        for attempt in range(self.max_retries + 1):
            try:
                return func(*args, **kwargs)
                
            except requests.exceptions.HTTPError as e:
                status_code = e.response.status_code
                last_exception = e
                
                if not self.should_retry(status_code):
                    raise  # Don't retry non-retryable errors
                
                if attempt >= self.max_retries:
                    break  # Exhausted retries
                
                # Calculate backoff
                config = self.ERROR_CONFIG.get(status_code, {})
                backoff_type = config.get("backoff", "exponential")
                delay = self.calculate_backoff(attempt, backoff_type)
                
                logger.warning(
                    f"Request failed with {status_code}, "
                    f"retrying in {delay:.2f}s (attempt {attempt + 1}/{self.max_retries})"
                )
                
                time.sleep(delay)
                
            except requests.exceptions.RequestException as e:
                # Network errors - always retry
                last_exception = e
                
                if attempt >= self.max_retries:
                    break
                
                delay = self.calculate_backoff(attempt)
                logger.warning(f"Network error, retrying in {delay:.2f}s")
                time.sleep(delay)
        
        # All retries exhausted
        raise last_exception or Exception("Max retries exceeded")


def retry_on_error(
    max_retries: int = 5,
    base_delay: float = 1.0,
    exceptions: tuple = (requests.exceptions.RequestException,)
):
    """
    Decorator for retry logic.
    
    Args:
        max_retries: Maximum retry attempts
        base_delay: Base delay between retries
        exceptions: Exceptions to catch
        
    Returns:
        Decorated function
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            handler = APIErrorHandler(max_retries, base_delay)
            return handler.execute_with_retry(func, *args, **kwargs)
        return wrapper
    return decorator
```

### 7.3 Data Transformation

```python
import numpy as np
from pyproj import Transformer

class DataTransformer:
    """
    Transform API response data for downstream consumption.
    
    Handles unit conversions, coordinate system alignment, and temporal interpolation.
    """
    
    # Unit conversion factors
    UNIT_CONVERSIONS = {
        # Length
        ("m", "km"): 0.001,
        ("km", "m"): 1000,
        ("ft", "m"): 0.3048,
        ("m", "ft"): 3.28084,
        
        # Temperature
        ("celsius", "fahrenheit"): lambda x: x * 9/5 + 32,
        ("fahrenheit", "celsius"): lambda x: (x - 32) * 5/9,
        ("celsius", "kelvin"): lambda x: x + 273.15,
        
        # Speed
        ("m/s", "km/h"): 3.6,
        ("km/h", "m/s"): 1/3.6,
        ("mph", "m/s"): 0.44704,
        
        # Pressure
        ("pa", "hpa"): 0.01,
        ("hpa", "pa"): 100,
        ("inhg", "hpa"): 33.8639,
        
        # Financial
        ("usd", "eur"): None,  # Requires exchange rate
        ("thousands", "millions"): 0.001,
        ("millions", "billions"): 0.001
    }
    
    def __init__(self):
        self.transformers = {}
    
    def convert_units(
        self,
        values: np.ndarray,
        from_unit: str,
        to_unit: str,
        exchange_rate: float = None
    ) -> np.ndarray:
        """
        Convert values between units.
        
        Args:
            values: Array of values to convert
            from_unit: Source unit
            to_unit: Target unit
            exchange_rate: Exchange rate for currency conversions
            
        Returns:
            np.ndarray: Converted values
        """
        if from_unit == to_unit:
            return values
        
        key = (from_unit.lower(), to_unit.lower())
        conversion = self.UNIT_CONVERSIONS.get(key)
        
        if conversion is None:
            raise ValueError(f"No conversion defined for {from_unit} to {to_unit}")
        
        if callable(conversion):
            return conversion(values)
        elif key[0] == ("usd", "eur"):
            if exchange_rate is None:
                raise ValueError("Exchange rate required for currency conversion")
            return values * exchange_rate
        else:
            return values * conversion
    
    def align_coordinates(
        self,
        latitudes: np.ndarray,
        longitudes: np.ndarray,
        from_crs: str = "EPSG:4326",
        to_crs: str = "EPSG:4326"
    ) -> tuple:
        """
        Align coordinates to target coordinate reference system.
        
        Args:
            latitudes: Latitude values
            longitudes: Longitude values
            from_crs: Source CRS
            to_crs: Target CRS
            
        Returns:
            tuple: (transformed_lats, transformed_lons)
        """
        if from_crs == to_crs:
            return latitudes, longitudes
        
        # Get or create transformer
        transformer_key = f"{from_crs}_to_{to_crs}"
        
        if transformer_key not in self.transformers:
            self.transformers[transformer_key] = Transformer.from_crs(
                from_crs, to_crs, always_xy=True
            )
        
        transformer = self.transformers[transformer_key]
        
        # Transform coordinates
        lons_transformed, lats_transformed = transformer.transform(
            longitudes, latitudes
        )
        
        return lats_transformed, lons_transformed
    
    def temporal_interpolation(
        self,
        source_years: np.ndarray,
        source_values: np.ndarray,
        target_years: np.ndarray,
        method: str = "linear"
    ) -> np.ndarray:
        """
        Interpolate values to target years.
        
        Args:
            source_years: Years with known values
            source_values: Known values
            target_years: Years to interpolate
            method: Interpolation method ("linear", "cubic", "nearest")
            
        Returns:
            np.ndarray: Interpolated values
        """
        from scipy.interpolate import interp1d
        
        # Create interpolation function
        interp_func = interp1d(
            source_years,
            source_values,
            kind=method,
            fill_value="extrapolate"
        )
        
        return interp_func(target_years)
    
    def normalize_risk_scores(
        self,
        scores: np.ndarray,
        method: str = "minmax"
    ) -> np.ndarray:
        """
        Normalize risk scores to 0-1 range.
        
        Args:
            scores: Raw risk scores
            method: Normalization method
            
        Returns:
            np.ndarray: Normalized scores
        """
        if method == "minmax":
            min_val = np.min(scores)
            max_val = np.max(scores)
            return (scores - min_val) / (max_val - min_val) if max_val > min_val else scores
        
        elif method == "zscore":
            mean = np.mean(scores)
            std = np.std(scores)
            return (scores - mean) / std if std > 0 else scores
        
        elif method == "sigmoid":
            return 1 / (1 + np.exp(-scores))
        
        else:
            raise ValueError(f"Unknown normalization method: {method}")
```

### 7.4 Database Loading Procedures

```python
import sqlalchemy
from sqlalchemy import create_engine, Table, Column, MetaData
from sqlalchemy.types import Float, String, Integer, DateTime
import pandas as pd
from typing import Dict, List

class DatabaseLoader:
    """
    Load processed climate data into databases.
    
    Supports multiple database backends with optimized loading.
    """
    
    def __init__(self, connection_string: str):
        self.engine = create_engine(connection_string)
        self.metadata = MetaData()
    
    def create_risk_metrics_table(self) -> Table:
        """Create risk metrics table schema"""
        
        table = Table(
            'climate_risk_metrics',
            self.metadata,
            Column('id', Integer, primary_key=True, autoincrement=True),
            Column('asset_id', String(100), nullable=False, index=True),
            Column('latitude', Float, nullable=False),
            Column('longitude', Float, nullable=False),
            Column('country_code', String(10)),
            Column('hazard', String(50), nullable=False, index=True),
            Column('scenario', String(100), nullable=False, index=True),
            Column('horizon', Integer, nullable=False, index=True),
            Column('tail_risk_score', Float),
            Column('expected_damage', Float),
            Column('var_95', Float),
            Column('cvar_95', Float),
            Column('probability', Float),
            Column('created_at', DateTime, default=datetime.now),
            
            # Indexes for common queries
            sqlalchemy.Index('idx_asset_scenario', 'asset_id', 'scenario'),
            sqlalchemy.Index('idx_geo_hazard', 'latitude', 'longitude', 'hazard'),
            sqlalchemy.Index('idx_risk_score', 'tail_risk_score')
        )
        
        self.metadata.create_all(self.engine)
        
        return table
    
    def bulk_insert(
        self,
        df: pd.DataFrame,
        table_name: str = 'climate_risk_metrics',
        batch_size: int = 10000
    ) -> Dict:
        """
        Bulk insert DataFrame into database.
        
        Args:
            df: DataFrame to insert
            table_name: Target table name
            batch_size: Insert batch size
            
        Returns:
            dict: Insert statistics
        """
        total_rows = len(df)
        inserted_rows = 0
        
        # Process in batches
        for i in range(0, total_rows, batch_size):
            batch = df.iloc[i:i+batch_size]
            
            batch.to_sql(
                table_name,
                self.engine,
                if_exists='append',
                index=False,
                method='multi'
            )
            
            inserted_rows += len(batch)
            logger.info(f"Inserted {inserted_rows}/{total_rows} rows")
        
        return {
            "table": table_name,
            "total_rows": total_rows,
            "inserted_rows": inserted_rows,
            "batch_size": batch_size
        }
    
    def upsert_records(
        self,
        df: pd.DataFrame,
        table_name: str,
        key_columns: List[str]
    ) -> Dict:
        """
        Upsert records (insert or update on conflict).
        
        Args:
            df: DataFrame with records
            table_name: Target table
            key_columns: Columns defining unique constraint
            
        Returns:
            dict: Upsert statistics
        """
        # This implementation uses PostgreSQL ON CONFLICT
        # Adapt for other databases as needed
        
        from sqlalchemy.dialects.postgresql import insert
        
        table = Table(table_name, self.metadata, autoload_with=self.engine)
        
        records = df.to_dict('records')
        
        stmt = insert(table).values(records)
        
        # Define update on conflict
        update_dict = {
            c.name: c
            for c in stmt.excluded
            if c.name not in key_columns
        }
        
        upsert_stmt = stmt.on_conflict_do_update(
            index_elements=key_columns,
            set_=update_dict
        )
        
        with self.engine.connect() as conn:
            result = conn.execute(upsert_stmt)
            conn.commit()
        
        return {
            "table": table_name,
            "records_processed": len(records),
            "rowcount": result.rowcount
        }
    
    def create_partitioned_table(
        self,
        table_name: str,
        partition_column: str = 'horizon'
    ) -> None:
        """
        Create partitioned table for time-series data.
        
        Args:
            table_name: Table name
            partition_column: Column to partition by
        """
        # PostgreSQL range partitioning example
        create_sql = f"""
        CREATE TABLE {table_name} (
            id SERIAL,
            asset_id VARCHAR(100) NOT NULL,
            hazard VARCHAR(50) NOT NULL,
            scenario VARCHAR(100) NOT NULL,
            horizon INTEGER NOT NULL,
            tail_risk_score FLOAT,
            expected_damage FLOAT,
            created_at TIMESTAMP DEFAULT NOW(),
            PRIMARY KEY (id, horizon)
        ) PARTITION BY RANGE (horizon);
        
        CREATE TABLE {table_name}_2030 PARTITION OF {table_name}
            FOR VALUES FROM (2025) TO (2035);
        
        CREATE TABLE {table_name}_2050 PARTITION OF {table_name}
            FOR VALUES FROM (2035) TO (2055);
        
        CREATE TABLE {table_name}_2100 PARTITION OF {table_name}
            FOR VALUES FROM (2055) TO (2101);
        """
        
        with self.engine.connect() as conn:
            conn.execute(sqlalchemy.text(create_sql))
            conn.commit()
        
        logger.info(f"Created partitioned table: {table_name}")


class DataPipeline:
    """
    Complete data processing pipeline from API to database.
    """
    
    def __init__(
        self,
        auth: CDTAuth,
        db_connection: str,
        s3_bucket: str = None
    ):
        self.auth = auth
        self.validator = ResponseValidator()
        self.parser = ResponseParser()
        self.transformer = DataTransformer()
        self.db_loader = DatabaseLoader(db_connection)
        self.s3_bucket = s3_bucket
    
    def process_api_response(
        self,
        response: dict,
        target_crs: str = "EPSG:4326",
        unit_conversions: dict = None
    ) -> pd.DataFrame:
        """
        Process API response through full pipeline.
        
        Args:
            response: API response
            target_crs: Target coordinate system
            unit_conversions: Unit conversion specifications
            
        Returns:
            pd.DataFrame: Processed data
        """
        # Step 1: Validate
        validation = self.validator.validate_response(response)
        if not validation['valid']:
            raise ValueError(f"Invalid response: {validation['errors']}")
        
        # Step 2: Parse
        df = self.parser.parse_to_dataframe(response)
        
        # Step 3: Transform coordinates
        if target_crs != "EPSG:4326":
            df['latitude'], df['longitude'] = self.transformer.align_coordinates(
                df['latitude'].values,
                df['longitude'].values,
                from_crs="EPSG:4326",
                to_crs=target_crs
            )
        
        # Step 4: Convert units
        if unit_conversions:
            for column, (from_unit, to_unit) in unit_conversions.items():
                if column in df.columns:
                    df[column] = self.transformer.convert_units(
                        df[column].values,
                        from_unit,
                        to_unit
                    )
        
        # Step 5: Normalize risk scores
        if 'tail_risk_score' in df.columns:
            df['tail_risk_score_normalized'] = self.transformer.normalize_risk_scores(
                df['tail_risk_score'].values
            )
        
        return df
    
    def run_full_pipeline(
        self,
        query: dict,
        load_to_db: bool = True,
        save_to_s3: bool = False
    ) -> Dict:
        """
        Execute complete pipeline from query to database.
        
        Args:
            query: CDT API query
            load_to_db: Whether to load to database
            save_to_s3: Whether to save raw response to S3
            
        Returns:
            dict: Pipeline execution results
        """
        results = {
            "started_at": datetime.now().isoformat(),
            "steps": []
        }
        
        # Execute API query
        url = f"{self.auth.base_url}/risk/stochastic"
        response = requests.post(
            url,
            headers=self.auth.get_auth_headers(),
            json=query,
            timeout=300
        )
        response.raise_for_status()
        api_response = response.json()
        
        results["steps"].append({"step": "api_query", "status": "success"})
        
        # Save to S3 if requested
        if save_to_s3 and self.s3_bucket:
            s3_key = f"raw/{datetime.now().strftime('%Y%m%d')}/{query.get('query_id', 'query')}.json"
            s3_client.put_object(
                Bucket=self.s3_bucket,
                Key=s3_key,
                Body=json.dumps(api_response)
            )
            results["steps"].append({"step": "s3_save", "status": "success", "s3_key": s3_key})
        
        # Process response
        df = self.process_api_response(api_response)
        results["steps"].append({
            "step": "processing",
            "status": "success",
            "records": len(df)
        })
        
        # Load to database
        if load_to_db:
            insert_result = self.db_loader.bulk_insert(df)
            results["steps"].append({
                "step": "db_load",
                "status": "success",
                **insert_result
            })
        
        results["completed_at"] = datetime.now().isoformat()
        results["status"] = "success"
        
        return results
```

---

## Appendix A: Complete Integration Example

```python
"""
Complete Integration Example
============================

End-to-end example of CDT Express™ API integration.
"""

# 1. Initialize authentication
auth = CDTAuth(
    client_id="your_client_id",
    client_secret="your_client_secret",
    environment="production"
)

# 2. Build stochastic query
query = build_stochastic_query(
    asset_locations=[
        (40.7128, -74.0060),   # New York
        (34.0522, -118.2437),  # Los Angeles
    ],
    hazards=["flood_riverine", "wind_cyclone", "heat_extreme"],
    scenarios=["NGFS_NetZero2050", "NGFS_CurrentPolicies"],
    time_horizons=[2030, 2050, 2100],
    return_periods=[10, 50, 100, 250],
    metrics=["expected_damage", "var", "cvar", "tail_risk"]
)

# 3. Execute query with retry
@retry_on_error(max_retries=5)
def execute_query():
    url = f"{auth.base_url}/risk/stochastic"
    response = requests.post(
        url,
        headers=auth.get_auth_headers(),
        json=query,
        timeout=300
    )
    response.raise_for_status()
    return response.json()

api_response = execute_query()

# 4. Process response
parser = ResponseParser()
df = parser.parse_to_dataframe(api_response)

# 5. Calculate portfolio metrics
calculator = PortfolioTailRiskAggregator()
portfolio_risk = calculator.aggregate_tail_risk(
    df.to_dict('records'),
    method="value_weighted"
)

# 6. Visualize results
viz = CDTVizualization()
fig = viz.plot_risk_distribution(df)
fig.show()

# 7. Export results
exporter = CDTExport()
s3_uri = exporter.export_to_excel(
    df,
    s3_key=f"results/{datetime.now().strftime('%Y%m%d')}_risk_analysis.xlsx"
)

print(f"Results exported to: {s3_uri}")
```

---

## Appendix B: API Error Codes Reference

| Code | Description | Retryable | Action |
|------|-------------|-----------|--------|
| 200 | Success | N/A | Process response |
| 400 | Bad Request | No | Check query parameters |
| 401 | Unauthorized | No | Check credentials |
| 403 | Forbidden | No | Check permissions |
| 404 | Not Found | No | Verify resource exists |
| 429 | Rate Limited | Yes | Retry with backoff |
| 500 | Internal Error | Yes | Retry with backoff |
| 502 | Bad Gateway | Yes | Retry with backoff |
| 503 | Service Unavailable | Yes | Retry with backoff |
| 504 | Gateway Timeout | Yes | Retry with backoff |

---

## Appendix C: Scenario Codes Reference

### NGFS Phase 4 Scenarios
- `NGFS_NetZero2050` - Net Zero 2050 (1.5°C)
- `NGFS_Below2C` - Below 2°C
- `NGFS_LowDemand` - Low Demand (1.5°C)
- `NGFS_DelayedTransition` - Delayed Transition (2°C)
- `NGFS_NDCs` - NDCs / Current Policies
- `NGFS_FragmentedWorld` - Fragmented World
- `NGFS_DAPS` - Disorderly Physical Scenario

### IPCC SSP Scenarios
- `IPCC_SSP1_1.9` - Sustainability (1.5°C)
- `IPCC_SSP1_2.6` - Sustainability (1.8°C)
- `IPCC_SSP2_4.5` - Middle of the Road (2.7°C)
- `IPCC_SSP3_7.0` - Regional Rivalry (3.6°C)
- `IPCC_SSP5_8.5` - Fossil-Fueled Development (4.4°C)

---

## Document Information

- **Version**: 2.0
- **Last Updated**: 2024
- **Author**: AA Impact Inc. - Climate Data Science Team
- **Review Status**: Technical Specification

---

*This document provides comprehensive technical specifications for riskthinking.ai CDT Express™ API integration. For additional support, contact riskthinking.ai support or refer to the official API documentation.*
