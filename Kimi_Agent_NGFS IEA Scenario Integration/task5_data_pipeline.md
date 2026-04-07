# RiskThinking.ai Integration - Data Pipeline Architecture
## Comprehensive Technical Specification

**Version:** 1.0  
**Date:** 2024  
**Author:** AA Impact Inc. - Data & MLOps Engineering Team

---

## Executive Summary

This document provides a comprehensive technical specification for integrating RiskThinking.ai's climate risk projection data (140B+ stochastic projections) into AA Impact Inc.'s infrastructure. The architecture emphasizes horizontal scalability, data integrity, and sub-second query performance for real-time risk analytics.

---

## 1. API Ingestion Module Architecture

### 1.1 Microservice Design Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        API INGESTION MICROSERVICE ARCHITECTURE              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   API        │    │   API        │    │   API        │                  │
│  │   Gateway    │◄──►│   Gateway    │◄──►│   Gateway    │  (Nginx/HAProxy)│
│  │   (Instance 1)│   │   (Instance 2)│   │   (Instance N)│                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         └───────────────────┼───────────────────┘                          │
│                             ▼                                              │
│  ┌─────────────────────────────────────────────────────────────┐          │
│  │              INGESTION ORCHESTRATOR SERVICE                  │          │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │          │
│  │  │  Scheduler  │  │  Rate       │  │  Circuit Breaker    │  │          │
│  │  │  (APScheduler)│  │  Limiter    │  │  (PyCircuitBreaker) │  │          │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │          │
│  └──────────────────────────┬──────────────────────────────────┘          │
│                             │                                              │
│         ┌───────────────────┼───────────────────┐                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Worker      │    │  Worker      │    │  Worker      │                  │
│  │  Pool A      │    │  Pool B      │    │  Pool C      │  (Celery Workers)│
│  │  (Assets)    │    │  (Scenarios) │    │  (Hazards)   │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         └───────────────────┼───────────────────┘                          │
│                             ▼                                              │
│  ┌─────────────────────────────────────────────────────────────┐          │
│  │              MESSAGE QUEUE (Redis/RabbitMQ)                  │          │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │          │
│  │  │  priority:  │  │  priority:  │  │  priority:  │          │          │
│  │  │  high       │  │  medium     │  │  low        │          │          │
│  │  │  (real-time)│  │  (batch)    │  │  (backfill) │          │          │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │          │
│  └─────────────────────────────────────────────────────────────┘          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Ingestion Service Responsibilities

#### 1.2.1 Core Service Components

| Component | Responsibility | Technology Stack |
|-----------|---------------|------------------|
| **API Gateway** | Request routing, load balancing, SSL termination | Nginx, HAProxy, Traefik |
| **Orchestrator** | Job scheduling, dependency management, retry logic | FastAPI, APScheduler |
| **Worker Pools** | Parallel data fetching, transformation, persistence | Celery, Python asyncio |
| **Queue Manager** | Priority-based task distribution, dead letter handling | Redis, RabbitMQ |
| **Credential Manager** | Secure token handling, rotation automation | AWS Secrets Manager |

#### 1.2.2 Service Configuration (FastAPI)

```python
# ingestion_service/config.py
from pydantic_settings import BaseSettings
from typing import List, Dict
import os

class IngestionConfig(BaseSettings):
    """Production-grade ingestion service configuration"""
    
    # Service Identity
    SERVICE_NAME: str = "riskthinking-ingestion"
    SERVICE_VERSION: str = "1.0.0"
    
    # API Configuration
    API_BASE_URL: str = "https://api.riskthinking.ai/v2"
    API_TIMEOUT_CONNECT: float = 10.0
    API_TIMEOUT_READ: float = 300.0
    API_MAX_RETRIES: int = 5
    API_RETRY_BACKOFF: float = 2.0  # Exponential backoff multiplier
    
    # Connection Pooling
    HTTP_POOL_SIZE: int = 100
    HTTP_POOL_MAX_KEEPALIVE: int = 30  # connections
    HTTP_KEEPALIVE_EXPIRY: int = 60  # seconds
    HTTP_HTTP2_ENABLED: bool = True
    
    # Worker Pool Configuration
    CELERY_WORKERS: int = 32
    CELERY_CONCURRENCY: int = 8
    CELERY_PREFETCH_MULTIPLIER: int = 4
    CELERY_TASK_TIME_LIMIT: int = 1800  # 30 minutes
    CELERY_TASK_SOFT_TIME_LIMIT: int = 1500  # 25 minutes
    
    # Queue Configuration
    REDIS_URL: str = "redis://redis-cluster:6379/0"
    QUEUE_HIGH_PRIORITY: str = "ingestion:high"
    QUEUE_MEDIUM_PRIORITY: str = "ingestion:medium"
    QUEUE_LOW_PRIORITY: str = "ingestion:low"
    QUEUE_DEAD_LETTER: str = "ingestion:dlq"
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 1000
    RATE_LIMIT_BURST_SIZE: int = 100
    
    # Circuit Breaker
    CIRCUIT_BREAKER_FAILURE_THRESHOLD: int = 5
    CIRCUIT_BREAKER_RECOVERY_TIMEOUT: int = 60
    CIRCUIT_BREAKER_EXPECTED_EXCEPTION: List[str] = [
        "ConnectionError",
        "TimeoutError",
        "HTTPStatusError"
    ]
    
    class Config:
        env_prefix = "RT_INGESTION_"
        case_sensitive = True

config = IngestionConfig()
```

#### 1.2.3 Ingestion Service Implementation

```python
# ingestion_service/main.py
import asyncio
import httpx
from fastapi import FastAPI, BackgroundTasks, HTTPException
from celery import Celery
from circuitbreaker import circuit
from tenacity import retry, stop_after_attempt, wait_exponential
import structlog
from datetime import datetime, timedelta
from typing import AsyncGenerator, List, Dict, Optional
import aioboto3

logger = structlog.get_logger()

app = FastAPI(title="RiskThinking Ingestion Service")
celery_app = Celery('ingestion_tasks', broker=config.REDIS_URL)

class RiskThinkingAPIClient:
    """
    Production-grade API client with connection pooling,
    automatic retries, and circuit breaker patterns.
    """
    
    def __init__(self):
        self.base_url = config.API_BASE_URL
        self._client: Optional[httpx.AsyncClient] = None
        self._semaphore = asyncio.Semaphore(config.HTTP_POOL_SIZE)
        self._credential_manager = AWSCredentialManager()
        
    async def __aenter__(self):
        limits = httpx.Limits(
            max_keepalive_connections=config.HTTP_POOL_MAX_KEEPALIVE,
            max_connections=config.HTTP_POOL_SIZE,
            keepalive_expiry=config.HTTP_KEEPALIVE_EXPIRY
        )
        
        self._client = httpx.AsyncClient(
            limits=limits,
            http2=config.HTTP_HTTP2_ENABLED,
            timeout=httpx.Timeout(
                connect=config.API_TIMEOUT_CONNECT,
                read=config.API_TIMEOUT_READ,
                write=10.0,
                pool=5.0
            ),
            headers={
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate, br",
                "User-Agent": f"AA-Impact-Ingestion/{config.SERVICE_VERSION}"
            }
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._client:
            await self._client.aclose()
    
    @retry(
        stop=stop_after_attempt(config.API_MAX_RETRIES),
        wait=wait_exponential(multiplier=config.API_RETRY_BACKOFF, min=4, max=60),
        reraise=True
    )
    @circuit(
        failure_threshold=config.CIRCUIT_BREAKER_FAILURE_THRESHOLD,
        recovery_timeout=config.CIRCUIT_BREAKER_RECOVERY_TIMEOUT,
        expected_exception=Exception
    )
    async def fetch_projections(
        self,
        asset_ids: List[str],
        scenario: str,
        hazard: str,
        time_horizon: int,
        projection_type: str = "stochastic"
    ) -> Dict:
        """
        Fetch stochastic projections with automatic retry and circuit breaking.
        
        Args:
            asset_ids: List of asset UUIDs
            scenario: Climate scenario (e.g., "RCP8.5")
            hazard: Hazard type (e.g., "flood", "wildfire")
            time_horizon: Years into future (e.g., 2050)
            projection_type: Type of projection data
            
        Returns:
            Dictionary containing projection data
        """
        async with self._semaphore:
            token = await self._credential_manager.get_valid_token()
            
            payload = {
                "asset_ids": asset_ids,
                "scenario": scenario,
                "hazard": hazard,
                "time_horizon": time_horizon,
                "projection_type": projection_type,
                "include_distribution": True,
                "include_metadata": True
            }
            
            try:
                response = await self._client.post(
                    f"{self.base_url}/projections/batch",
                    json=payload,
                    headers={"Authorization": f"Bearer {token}"}
                )
                response.raise_for_status()
                
                logger.info(
                    "projections_fetched",
                    asset_count=len(asset_ids),
                    scenario=scenario,
                    hazard=hazard,
                    response_size_bytes=len(response.content)
                )
                
                return response.json()
                
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:  # Rate limited
                    retry_after = int(e.response.headers.get("Retry-After", 60))
                    logger.warning("rate_limited", retry_after=retry_after)
                    await asyncio.sleep(retry_after)
                    raise
                elif e.response.status_code == 401:  # Token expired
                    await self._credential_manager.refresh_token()
                    raise
                raise

class AWSCredentialManager:
    """
    Manages API credentials with automatic rotation and secure storage.
    Uses AWS Secrets Manager for credential storage.
    """
    
    def __init__(self):
        self._session = aioboto3.Session()
        self._token: Optional[str] = None
        self._token_expiry: Optional[datetime] = None
        self._secret_name = "riskthinking/api-credentials"
        self._region = "us-east-1"
        
    async def get_valid_token(self) -> str:
        """Get a valid, non-expired API token."""
        if self._token and self._token_expiry and datetime.utcnow() < self._token_expiry:
            return self._token
            
        await self.refresh_token()
        return self._token
    
    async def refresh_token(self) -> None:
        """Refresh API token from AWS Secrets Manager."""
        async with self._session.client(
            service_name='secretsmanager',
            region_name=self._region
        ) as client:
            try:
                response = await client.get_secret_value(SecretId=self._secret_name)
                secret = json.loads(response['SecretString'])
                
                self._token = secret['api_token']
                # Token expires 5 minutes before actual expiry for safety
                self._token_expiry = datetime.utcnow() + timedelta(
                    seconds=secret.get('expires_in', 3600) - 300
                )
                
                logger.info("token_refreshed", expiry=self._token_expiry.isoformat())
                
            except Exception as e:
                logger.error("token_refresh_failed", error=str(e))
                raise

# Celery Tasks for Background Processing
@celery_app.task(bind=True, max_retries=5)
def ingest_asset_projections(
    self,
    asset_batch: List[str],
    scenario: str,
    hazard: str,
    time_horizon: int
) -> Dict:
    """
    Celery task for ingesting projections for a batch of assets.
    
    This task is designed to be retried on failure with exponential backoff.
    Failed tasks are moved to the dead letter queue after max retries.
    """
    try:
        # Run async code in sync Celery task
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(
            _async_ingest_asset_projections(
                asset_batch, scenario, hazard, time_horizon
            )
        )
        
        logger.info(
            "ingestion_task_completed",
            task_id=self.request.id,
            asset_count=len(asset_batch)
        )
        
        return {
            "status": "success",
            "assets_processed": len(asset_batch),
            "records_inserted": result["count"]
        }
        
    except Exception as exc:
        logger.error("ingestion_task_failed", error=str(exc), task_id=self.request.id)
        # Retry with exponential backoff
        countdown = 2 ** self.request.retries * 60
        raise self.retry(exc=exc, countdown=countdown)

async def _async_ingest_asset_projections(
    asset_batch: List[str],
    scenario: str,
    hazard: str,
    time_horizon: int
) -> Dict:
    """Async implementation of projection ingestion."""
    async with RiskThinkingAPIClient() as client:
        data = await client.fetch_projections(
            asset_ids=asset_batch,
            scenario=scenario,
            hazard=hazard,
            time_horizon=time_horizon
        )
        
        # Transform and persist to database
        transformer = ProjectionTransformer()
        transformed = transformer.transform_batch(data['projections'])
        
        # Bulk insert to PostgreSQL
        await bulk_insert_projections(transformed)
        
        return {"count": len(transformed)}
```

### 1.3 Connection Pooling Strategy

#### 1.3.1 HTTP/2 Multiplexing Configuration

```python
# ingestion_service/connection_pool.py
import httpx
from typing import Optional
import ssl

class HTTP2ConnectionPool:
    """
    Optimized HTTP/2 connection pool for high-throughput API ingestion.
    
    HTTP/2 multiplexing allows multiple concurrent requests over a single
    TCP connection, significantly reducing connection overhead for batch
    operations.
    """
    
    def __init__(
        self,
        max_connections: int = 100,
        max_keepalive: int = 30,
        http2_enabled: bool = True,
        enable_push: bool = False  # Disable server push for API clients
    ):
        self.max_connections = max_connections
        self.max_keepalive = max_keepalive
        self.http2_enabled = http2_enabled
        self.enable_push = enable_push
        
    def create_client(self) -> httpx.AsyncClient:
        """Create optimized HTTP client with connection pooling."""
        
        # SSL configuration for performance
        ssl_context = ssl.create_default_context()
        ssl_context.set_alpn_protocols(['h2', 'http/1.1'])
        
        # Connection limits
        limits = httpx.Limits(
            max_keepalive_connections=self.max_keepalive,
            max_connections=self.max_connections,
            keepalive_expiry=60.0
        )
        
        # HTTP/2 specific settings
        http2_settings = {
            'ENABLE_PUSH': int(self.enable_push),
            'MAX_CONCURRENT_STREAMS': 100,
            'INITIAL_WINDOW_SIZE': 65535,
            'MAX_FRAME_SIZE': 16384
        } if self.http2_enabled else {}
        
        return httpx.AsyncClient(
            limits=limits,
            http2=self.http2_enabled,
            http1=False if self.http2_enabled else True,
            verify=ssl_context,
            timeout=httpx.Timeout(
                connect=10.0,
                read=300.0,
                write=10.0,
                pool=5.0
            ),
            headers={
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive'
            }
        )

class ConnectionPoolManager:
    """
    Manages multiple connection pools for different API endpoints
    and prioritization strategies.
    """
    
    def __init__(self):
        self._pools = {
            'default': HTTP2ConnectionPool(max_connections=100),
            'priority': HTTP2ConnectionPool(max_connections=50),
            'bulk': HTTP2ConnectionPool(max_connections=200, max_keepalive=50)
        }
        self._clients = {}
        
    async def get_client(self, pool_name: str = 'default') -> httpx.AsyncClient:
        """Get or create client from named pool."""
        if pool_name not in self._clients:
            pool = self._pools.get(pool_name, self._pools['default'])
            self._clients[pool_name] = pool.create_client()
        return self._clients[pool_name]
    
    async def close_all(self):
        """Gracefully close all connections."""
        for client in self._clients.values():
            await client.aclose()
        self._clients.clear()
```

#### 1.3.2 Timeout and Retry Logic

```python
# ingestion_service/retry_config.py
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential_jitter,
    retry_if_exception_type,
    before_sleep_log
)
import structlog
import httpx

logger = structlog.get_logger()

# Define retry strategies for different error types
RETRY_STRATEGIES = {
    'transient_error': retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential_jitter(initial=1, max=60, jitter=2),
        retry=retry_if_exception_type((
            httpx.ConnectError,
            httpx.ConnectTimeout,
            httpx.ReadTimeout,
            httpx.WriteTimeout,
            httpx.NetworkError,
            httpx.PoolTimeout
        )),
        before_sleep=before_sleep_log(logger, 'warning'),
        reraise=True
    ),
    
    'rate_limit': retry(
        stop=stop_after_attempt(10),
        wait=wait_exponential_jitter(initial=10, max=300, jitter=5),
        retry=retry_if_exception_type(httpx.HTTPStatusError),
        before_sleep=before_sleep_log(logger, 'info'),
        reraise=True
    ),
    
    'server_error': retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential_jitter(initial=5, max=120, jitter=3),
        retry=retry_if_exception_type(httpx.HTTPStatusError),
        before_sleep=before_sleep_log(logger, 'error'),
        reraise=True
    )
}

class RetryHandler:
    """
    Intelligent retry handler that applies different strategies
    based on error classification.
    """
    
    @staticmethod
    def classify_error(error: Exception) -> str:
        """Classify error type for appropriate retry strategy."""
        if isinstance(error, httpx.HTTPStatusError):
            status_code = error.response.status_code
            if status_code == 429:
                return 'rate_limit'
            elif status_code >= 500:
                return 'server_error'
            elif status_code in (408, 502, 503, 504):
                return 'transient_error'
        elif isinstance(error, (
            httpx.ConnectError,
            httpx.ConnectTimeout,
            httpx.ReadTimeout,
            httpx.NetworkError
        )):
            return 'transient_error'
        
        return 'no_retry'
    
    @staticmethod
    def get_retry_decorator(error_type: str):
        """Get appropriate retry decorator for error type."""
        return RETRY_STRATEGIES.get(error_type, None)
```

### 1.4 Authentication Management

#### 1.4.1 AWS Secrets Manager Integration

```python
# ingestion_service/auth_manager.py
import aioboto3
import json
from datetime import datetime, timedelta
from typing import Optional, Dict
import structlog
from cryptography.fernet import Fernet
import base64

logger = structlog.get_logger()

class SecureCredentialManager:
    """
    Enterprise-grade credential management with automatic rotation,
    encryption at rest, and audit logging.
    """
    
    def __init__(
        self,
        secret_name: str = "riskthinking/api-credentials",
        region: str = "us-east-1",
        rotation_days: int = 30
    ):
        self.secret_name = secret_name
        self.region = region
        self.rotation_days = rotation_days
        self._session = aioboto3.Session()
        
        # In-memory cache with TTL
        self._cache: Dict[str, any] = {}
        self._cache_expiry: Dict[str, datetime] = {}
        self._cache_ttl = timedelta(minutes=5)
        
    async def get_credentials(self) -> Dict:
        """
        Retrieve credentials from AWS Secrets Manager with caching.
        
        Returns:
            Dictionary containing API credentials
        """
        cache_key = "api_credentials"
        
        # Check cache first
        if self._is_cache_valid(cache_key):
            logger.debug("credentials_cache_hit")
            return self._cache[cache_key]
        
        # Fetch from Secrets Manager
        async with self._session.client(
            service_name='secretsmanager',
            region_name=self.region
        ) as client:
            try:
                response = await client.get_secret_value(SecretId=self.secret_name)
                
                if 'SecretString' in response:
                    credentials = json.loads(response['SecretString'])
                else:
                    # Binary secret
                    credentials = json.loads(
                        base64.b64decode(response['SecretBinary']).decode()
                    )
                
                # Update cache
                self._cache[cache_key] = credentials
                self._cache_expiry[cache_key] = datetime.utcnow() + self._cache_ttl
                
                logger.info(
                    "credentials_fetched",
                    secret_arn=response.get('ARN'),
                    version_id=response.get('VersionId')
                )
                
                return credentials
                
            except Exception as e:
                logger.error("credentials_fetch_failed", error=str(e))
                raise
    
    async def rotate_credentials(self) -> bool:
        """
        Trigger credential rotation via AWS Secrets Manager.
        
        Returns:
            True if rotation initiated successfully
        """
        async with self._session.client(
            service_name='secretsmanager',
            region_name=self.region
        ) as client:
            try:
                response = await client.rotate_secret(
                    SecretId=self.secret_name,
                    RotationLambdaARN="arn:aws:lambda:us-east-1:ACCOUNT:function:rt-credential-rotator",
                    AutomaticallyAfterDays=self.rotation_days
                )
                
                logger.info(
                    "credential_rotation_initiated",
                    secret_arn=response['ARN'],
                    version_id=response['VersionId']
                )
                
                return True
                
            except Exception as e:
                logger.error("credential_rotation_failed", error=str(e))
                return False
    
    def _is_cache_valid(self, key: str) -> bool:
        """Check if cached credentials are still valid."""
        if key not in self._cache:
            return False
        if datetime.utcnow() > self._cache_expiry.get(key, datetime.min):
            return False
        return True
    
    async def invalidate_cache(self):
        """Clear credential cache."""
        self._cache.clear()
        self._cache_expiry.clear()
        logger.info("credentials_cache_invalidated")

# Lambda function for automatic credential rotation
# infrastructure/lambda/credential_rotator.py
import boto3
import json
import requests
from datetime import datetime

def lambda_handler(event, context):
    """
    AWS Lambda function for automatic API credential rotation.
    Triggered by Secrets Manager rotation schedule.
    """
    arn = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']
    
    secrets_client = boto3.client('secretsmanager')
    
    if step == 'createSecret':
        # Generate new API key from RiskThinking
        new_credentials = generate_new_api_key()
        secrets_client.put_secret_value(
            SecretId=arn,
            ClientRequestToken=token,
            SecretString=json.dumps(new_credentials),
            VersionStages=['AWSPENDING']
        )
        
    elif step == 'setSecret':
        # Test new credentials
        pending_version = secrets_client.get_secret_value(
            SecretId=arn,
            VersionId=token,
            VersionStage='AWSPENDING'
        )
        credentials = json.loads(pending_version['SecretString'])
        test_api_connection(credentials)
        
    elif step == 'testSecret':
        # Verify new credentials work
        pass
        
    elif step == 'finishSecret':
        # Promote new version to current
        metadata = secrets_client.describe_secret(SecretId=arn)
        current_version = None
        for version in metadata['VersionIdsToStages']:
            if 'AWSCURRENT' in metadata['VersionIdsToStages'][version]:
                current_version = version
                break
        
        secrets_client.update_secret_version_stage(
            SecretId=arn,
            VersionStage='AWSCURRENT',
            MoveToVersionId=token,
            RemoveFromVersionId=current_version
        )

def generate_new_api_key() -> Dict:
    """Generate new API key via RiskThinking management API."""
    # Implementation depends on RiskThinking's key management API
    pass

def test_api_connection(credentials: Dict) -> bool:
    """Test that new credentials can authenticate successfully."""
    # Implementation for testing API connectivity
    pass
```

---

## 2. Data Pipeline for 140B Projections

### 2.1 High-Level Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    140B PROJECTIONS DATA PIPELINE ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  INGESTION LAYER                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  RiskThinking│  │  RiskThinking│  │  RiskThinking│  │  RiskThinking│           │
│  │  API Stream 1│  │  API Stream 2│  │  API Stream N│  │  Batch Export│           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                 │                    │
│         └─────────────────┴─────────────────┴─────────────────┘                    │
│                                   │                                                 │
│                                   ▼                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                    STREAM INGESTION (Apache Kafka / AWS Kinesis)             │  │
│  │  ┌───────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  Topics:                                                              │  │  │
│  │  │  • projections.raw.asset-risk      (100 partitions, 3 replicas)      │  │  │
│  │  │  • projections.raw.scenario-data   (50 partitions, 3 replicas)       │  │  │
│  │  │  • projections.raw.hazard-events   (75 partitions, 3 replicas)       │  │  │
│  │  │  • projections.batch.updates       (25 partitions, 3 replicas)       │  │  │
│  │  └───────────────────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────┬────────────────────────────────────────┘  │
│                                       │                                             │
│  PROCESSING LAYER                     │                                             │
│  ┌────────────────────────────────────┴────────────────────────────────────────┐  │
│  │                    STREAM PROCESSING (Apache Flink / Spark Structured Streaming)│  │
│  │                                                                              │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │  │
│  │  │  Validation     │  │  Enrichment     │  │  Aggregation    │            │  │
│  │  │  Job            │──►│  Job            │──►│  Job            │            │  │
│  │  │  (Check schema, │  │  (Add metadata, │  │  (Compute       │            │  │
│  │  │  ranges)        │  │  geohash)       │  │  statistics)    │            │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘            │  │
│  │                                                                              │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │  │
│  │  │  Windowing Strategy:                                                │   │  │
│  │  │  • Tumbling windows: 5 minutes for real-time aggregations           │   │  │
│  │  │  • Sliding windows: 1 hour for trend detection                      │   │  │
│  │  │  • Session windows: For batch job completion tracking               │   │  │
│  │  └─────────────────────────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────┬────────────────────────────────────────┘  │
│                                       │                                             │
│  STORAGE LAYER                        │                                             │
│  ┌────────────────────────────────────┴────────────────────────────────────────┐  │
│  │                                                                              │  │
│  │  ┌───────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  HOT TIER (Real-time Queries)                                         │  │  │
│  │  │  • Redis Cluster (100GB) - Hot projections cache                      │  │  │
│  │  │  • PostgreSQL (10TB) - Recent projections + metadata                  │  │  │
│  │  └───────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                              │  │
│  │  ┌───────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  WARM TIER (Analytical Queries)                                       │  │  │
│  │  │  • Delta Lake on S3 (500TB) - Partitioned Parquet files               │  │  │
│  │  │  • Athena/Presto for SQL queries                                      │  │  │
│  │  └───────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                              │  │
│  │  ┌───────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  COLD TIER (Archive)                                                  │  │  │
│  │  │  • S3 Glacier (2PB) - Historical projections                          │  │  │
│  │  │  • Lifecycle: 90 days → Glacier, 7 years → Deep Archive               │  │  │
│  │  └───────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                              │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Stream Processing Architecture

#### 2.2.1 Kafka Topic Design

```yaml
# kafka/topics.yaml
---
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaTopic
metadata:
  name: projections-raw-asset-risk
  labels:
    strimzi.io/cluster: riskthinking-kafka
spec:
  partitions: 100
  replicas: 3
  config:
    retention.ms: 604800000  # 7 days
    cleanup.policy: delete
    compression.type: snappy
    min.insync.replicas: 2
    segment.bytes: 1073741824  # 1GB segments
---
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaTopic
metadata:
  name: projections-validated
  labels:
    strimzi.io/cluster: riskthinking-kafka
spec:
  partitions: 100
  replicas: 3
  config:
    retention.ms: 259200000  # 3 days (shorter, processed data)
    cleanup.policy: compact,delete
    compression.type: snappy
    min.insync.replicas: 2
---
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaTopic
metadata:
  name: projections-enriched
  labels:
    strimzi.io/cluster: riskthinking-kafka
spec:
  partitions: 100
  replicas: 3
  config:
    retention.ms: 86400000  # 1 day
    cleanup.policy: delete
    compression.type: snappy
    min.insync.replicas: 2
---
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaTopic
metadata:
  name: projections-dlq
  labels:
    strimzi.io/cluster: riskthinking-kafka
spec:
  partitions: 10
  replicas: 3
  config:
    retention.ms: 1209600000  # 14 days (longer retention for debugging)
    cleanup.policy: delete
    compression.type: snappy
```

#### 2.2.2 Flink Stream Processing Jobs

```java
// flink/ProjectionValidationJob.java
package com.aaimpact.riskthinking;

import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaProducer;
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.time.Time;
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;

public class ProjectionValidationJob {
    
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        
        // Checkpointing configuration for exactly-once processing
        env.enableCheckpointing(60000);  // 60 second checkpoints
        env.getCheckpointConfig().setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);
        env.getCheckpointConfig().setMinPauseBetweenCheckpoints(30000);
        env.getCheckpointConfig().setCheckpointTimeout(600000);
        env.getCheckpointConfig().setMaxConcurrentCheckpoints(1);
        env.getCheckpointConfig().enableExternalizedCheckpoints(
            ExternalizedCheckpointCleanup.RETAIN_ON_CANCELLATION
        );
        
        // State backend for large state
        env.setStateBackend(new RocksDBStateBackend("s3://aa-impact-flink-checkpoints/"));
        env.setRestartStrategy(RestartStrategies.fixedDelayRestart(
            10,  // max restart attempts
            Time.of(60, TimeUnit.SECONDS)  // delay between restarts
        ));
        
        // Kafka consumer configuration
        Properties consumerProps = new Properties();
        consumerProps.setProperty("bootstrap.servers", "kafka-cluster:9092");
        consumerProps.setProperty("group.id", "projection-validation-group");
        consumerProps.setProperty("auto.offset.reset", "earliest");
        consumerProps.setProperty("enable.auto.commit", "false");
        consumerProps.setProperty("isolation.level", "read_committed");
        
        // Create Kafka consumer
        FlinkKafkaConsumer<String> kafkaConsumer = new FlinkKafkaConsumer<>(
            "projections-raw-asset-risk",
            new SimpleStringSchema(),
            consumerProps
        );
        
        kafkaConsumer.setStartFromGroupOffsets();
        kafkaConsumer.setCommitOffsetsOnCheckpoints(true);
        
        // Create stream from Kafka
        DataStream<String> rawProjections = env
            .addSource(kafkaConsumer)
            .name("Kafka Raw Projections Source")
            .uid("kafka-raw-source")
            .assignTimestampsAndWatermarks(
                WatermarkStrategy
                    .<String>forBoundedOutOfOrderness(Duration.ofMinutes(5))
                    .withTimestampAssigner((event, timestamp) -> 
                        extractTimestamp(event))
            );
        
        // Validation pipeline
        DataStream<ValidatedProjection> validatedProjections = rawProjections
            .map(new ProjectionParser())
            .name("Parse JSON Projection")
            .uid("json-parser")
            
            .filter(new SchemaValidator())
            .name("Schema Validation")
            .uid("schema-validator")
            
            .filter(new RangeValidator())
            .name("Range Validation")
            .uid("range-validator")
            
            .filter(new CompletenessValidator())
            .name("Completeness Check")
            .uid("completeness-validator")
            
            .keyBy(Projection::getAssetId)
            .window(TumblingEventTimeWindows.of(Time.minutes(5)))
            .aggregate(new ProjectionAggregator())
            .name("5-Minute Aggregation")
            .uid("5min-aggregator");
        
        // Dead letter queue for invalid records
        DataStream<String> invalidRecords = rawProjections
            .getSideOutput(new OutputTag<String>("invalid") {});
        
        // Kafka producer for validated records
        Properties producerProps = new Properties();
        producerProps.setProperty("bootstrap.servers", "kafka-cluster:9092");
        producerProps.setProperty("transaction.timeout.ms", "900000");
        
        FlinkKafkaProducer<String> kafkaProducer = new FlinkKafkaProducer<>(
            "projections-validated",
            new SimpleStringSchema(),
            producerProps,
            FlinkKafkaProducer.Semantic.EXACTLY_ONCE
        );
        
        // Sink validated records
        validatedProjections
            .map(new ProjectionSerializer())
            .name("Serialize to JSON")
            .uid("json-serializer")
            .addSink(kafkaProducer)
            .name("Kafka Validated Sink")
            .uid("kafka-validated-sink");
        
        // Sink invalid records to DLQ
        invalidRecords
            .addSink(new FlinkKafkaProducer<>(
                "projections-dlq",
                new SimpleStringSchema(),
                producerProps
            ))
            .name("DLQ Sink")
            .uid("dlq-sink");
        
        env.execute("RiskThinking Projection Validation Pipeline");
    }
}

// Validation operators
class SchemaValidator implements FilterFunction<Projection> {
    private static final JsonSchema SCHEMA = loadSchema();
    
    @Override
    public boolean filter(Projection projection) {
        try {
            SCHEMA.validate(projection.toJsonNode());
            return true;
        } catch (ValidationException e) {
            // Log validation failure
            return false;
        }
    }
}

class RangeValidator implements FilterFunction<Projection> {
    @Override
    public boolean filter(Projection projection) {
        // Validate value ranges
        for (DistributionValue value : projection.getDistribution()) {
            if (value.getProbability() < 0 || value.getProbability() > 1) {
                return false;
            }
            if (Double.isNaN(value.getValue()) || Double.isInfinite(value.getValue())) {
                return false;
            }
        }
        
        // Validate time horizon
        if (projection.getTimeHorizon() < 2020 || projection.getTimeHorizon() > 2100) {
            return false;
        }
        
        return true;
    }
}
```

#### 2.2.3 Spark Structured Streaming Alternative

```python
# spark/streaming_validation.py
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
from delta import configure_spark_with_delta_pip
import json

# Initialize Spark with Delta Lake support
builder = SparkSession.builder \
    .appName("RiskThinking-Streaming-Validation") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .config("spark.streaming.kafka.maxRatePerPartition", "10000") \
    .config("spark.sql.streaming.checkpointLocation", "s3://aa-impact-checkpoints/streaming/") \
    .config("spark.executor.memory", "8g") \
    .config("spark.executor.cores", "4") \
    .config("spark.sql.adaptive.enabled", "true") \
    .config("spark.sql.adaptive.coalescePartitions.enabled", "true")

spark = configure_spark_with_delta_pip(builder).getOrCreate()

# Define schema for incoming projections
projection_schema = StructType([
    StructField("asset_id", StringType(), False),
    StructField("scenario", StringType(), False),
    StructField("hazard", StringType(), False),
    StructField("time_horizon", IntegerType(), False),
    StructField("distribution", StructType([
        StructField("bins", ArrayType(DoubleType()), True),
        StructField("probabilities", ArrayType(DoubleType()), True),
        StructField("mean", DoubleType(), True),
        StructField("std_dev", DoubleType(), True),
        StructField("skewness", DoubleType(), True),
        StructField("kurtosis", DoubleType(), True),
        StructField("samples", ArrayType(DoubleType()), True)
    ]), False),
    StructField("metadata", StructType([
        StructField("source", StringType(), True),
        StructField("timestamp", TimestampType(), True),
        StructField("version", StringType(), True)
    ]), True),
    StructField("geohash", StringType(), True),
    StructField("quadkey", StringType(), True)
])

# Read from Kafka
raw_stream = spark \
    .readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "kafka-cluster:9092") \
    .option("subscribe", "projections-raw-asset-risk") \
    .option("startingOffsets", "latest") \
    .option("failOnDataLoss", "false") \
    .option("kafka.security.protocol", "SASL_SSL") \
    .option("kafka.sasl.mechanism", "SCRAM-SHA-512") \
    .load()

# Parse JSON and apply schema
parsed_stream = raw_stream \
    .select(from_json(col("value").cast("string"), projection_schema).alias("data")) \
    .select("data.*")

# Validation rules
validated_stream = parsed_stream \
    .filter(col("asset_id").isNotNull()) \
    .filter(col("scenario").isin(["RCP2.6", "RCP4.5", "RCP6.0", "RCP8.5"])) \
    .filter(col("hazard").isin(["flood", "wildfire", "hurricane", "drought", "heatwave"])) \
    .filter(col("time_horizon").between(2020, 2100)) \
    .filter(col("distribution.mean").isNotNull()) \
    .withColumn("validation_timestamp", current_timestamp()) \
    .withColumn("processing_date", current_date())

# Add geohash enrichment
enriched_stream = validated_stream \
    .withColumn("geohash_precision", lit(6)) \
    .withColumn("partition_key", 
        concat(col("scenario"), lit("_"), col("hazard"), lit("_"), col("time_horizon")))

# Write to Delta Lake with partitioning
write_query = enriched_stream \
    .writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("path", "s3://aa-impact-datalake/projections/validated/") \
    .option("checkpointLocation", "s3://aa-impact-checkpoints/streaming-validated/") \
    .partitionBy("scenario", "hazard", "processing_date") \
    .trigger(processingTime="5 minutes") \
    .queryName("projection-validation-stream") \
    .start()

# Write invalid records to separate location for analysis
invalid_stream = parsed_stream \
    .filter(
        col("asset_id").isNull() |
        ~col("scenario").isin(["RCP2.6", "RCP4.5", "RCP6.0", "RCP8.5"]) |
        col("distribution.mean").isNull()
    ) \
    .withColumn("rejection_reason", 
        when(col("asset_id").isNull(), "missing_asset_id")
        .when(~col("scenario").isin(["RCP2.6", "RCP4.5", "RCP6.0", "RCP8.5"]), "invalid_scenario")
        .when(col("distribution.mean").isNull(), "missing_distribution")
        .otherwise("unknown")
    ) \
    .withColumn("rejection_timestamp", current_timestamp())

invalid_query = invalid_stream \
    .writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("path", "s3://aa-impact-datalake/projections/rejected/") \
    .option("checkpointLocation", "s3://aa-impact-checkpoints/streaming-rejected/") \
    .partitionBy("rejection_reason", "processing_date") \
    .trigger(processingTime="5 minutes") \
    .queryName("projection-rejection-stream") \
    .start()

# Await termination
write_query.awaitTermination()
```

### 2.3 Batch Processing Workflows

#### 2.3.1 Apache Airflow DAG for Nightly Portfolio Runs

```python
# airflow/dags/nightly_portfolio_pipeline.py
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.providers.amazon.aws.operators.emr import EmrAddStepsOperator
from airflow.providers.amazon.aws.sensors.emr import EmrStepSensor
from airflow.providers.postgres.operators.postgres import PostgresOperator
from airflow.utils.task_group import TaskGroup
from datetime import datetime, timedelta
import json

default_args = {
    'owner': 'data-engineering',
    'depends_on_past': False,
    'email': ['data-alerts@aaimpact.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'execution_timeout': timedelta(hours=4),
}

with DAG(
    'nightly_portfolio_risk_pipeline',
    default_args=default_args,
    description='Nightly batch processing for portfolio risk calculations',
    schedule_interval='0 2 * * *',  # 2 AM daily
    start_date=datetime(2024, 1, 1),
    catchup=False,
    max_active_runs=1,
    tags=['risk', 'portfolio', 'nightly'],
) as dag:
    
    # Task 1: Check data freshness
    check_data_freshness = PostgresOperator(
        task_id='check_projection_freshness',
        postgres_conn_id='riskthinking_db',
        sql="""
            SELECT 
                scenario,
                hazard,
                MAX(created_at) as last_update,
                COUNT(*) as record_count
            FROM stochastic_projections
            WHERE created_at >= NOW() - INTERVAL '25 hours'
            GROUP BY scenario, hazard
            HAVING COUNT(*) > 0;
        """
    )
    
    # Task 2: Extract portfolio positions
    with TaskGroup("extract_portfolio_data") as extract_group:
        
        extract_equities = PostgresOperator(
            task_id='extract_equity_positions',
            postgres_conn_id='portfolio_db',
            sql="""
                COPY (
                    SELECT 
                        p.position_id,
                        p.asset_id,
                        a.latitude,
                        a.longitude,
                        a.asset_type,
                        p.quantity,
                        p.market_value,
                        p.portfolio_id
                    FROM positions p
                    JOIN assets a ON p.asset_id = a.asset_id
                    WHERE p.as_of_date = CURRENT_DATE - 1
                ) TO STDOUT WITH CSV HEADER;
            """
        )
        
        extract_fixed_income = PostgresOperator(
            task_id='extract_fixed_income_positions',
            postgres_conn_id='portfolio_db',
            sql="""
                COPY (
                    SELECT 
                        p.position_id,
                        p.asset_id,
                        i.issuer_location_lat,
                        i.issuer_location_lon,
                        i.bond_type,
                        p.quantity,
                        p.market_value,
                        p.portfolio_id
                    FROM positions p
                    JOIN fixed_income_instruments i ON p.asset_id = i.asset_id
                    WHERE p.as_of_date = CURRENT_DATE - 1
                ) TO STDOUT WITH CSV HEADER;
            """
        )
        
        extract_alternatives = PostgresOperator(
            task_id='extract_alternative_positions',
            postgres_conn_id='portfolio_db',
            sql="""
                COPY (
                    SELECT 
                        p.position_id,
                        p.asset_id,
                        a.latitude,
                        a.longitude,
                        a.asset_class,
                        p.quantity,
                        p.market_value,
                        p.portfolio_id
                    FROM positions p
                    JOIN alternative_assets a ON p.asset_id = a.asset_id
                    WHERE p.as_of_date = CURRENT_DATE - 1
                ) TO STDOUT WITH CSV HEADER;
            """
        )
    
    # Task 3: Spark job for risk aggregation
    SPARK_STEPS = [
        {
            'Name': 'Portfolio Risk Calculation',
            'ActionOnFailure': 'CONTINUE',
            'HadoopJarStep': {
                'Jar': 'command-runner.jar',
                'Args': [
                    'spark-submit',
                    '--deploy-mode', 'cluster',
                    '--master', 'yarn',
                    '--driver-memory', '16g',
                    '--executor-memory', '32g',
                    '--executor-cores', '8',
                    '--num-executors', '50',
                    '--conf', 'spark.sql.adaptive.enabled=true',
                    '--conf', 'spark.sql.adaptive.coalescePartitions.enabled=true',
                    '--conf', 'spark.serializer=org.apache.spark.serializer.KryoSerializer',
                    '--conf', 'spark.sql.shuffle.partitions=1000',
                    '--py-files', 's3://aa-impact-jobs/libs/risk_calculation.zip',
                    's3://aa-impact-jobs/spark/portfolio_risk_calculation.py',
                    '--input-portfolio', 's3://aa-impact-data/portfolio/{{ ds }}/',
                    '--input-projections', 's3://aa-impact-datalake/projections/validated/',
                    '--output-results', 's3://aa-impact-results/portfolio-risk/{{ ds }}/',
                    '--scenarios', 'RCP2.6,RCP4.5,RCP6.0,RCP8.5',
                    '--time-horizons', '2030,2050,2075,2100',
                    '--confidence-levels', '0.5,0.75,0.9,0.95,0.99'
                ]
            }
        }
    ]
    
    add_spark_step = EmrAddStepsOperator(
        task_id='submit_portfolio_risk_job',
        job_flow_id='{{ var.value.emr_cluster_id }}',
        steps=SPARK_STEPS
    )
    
    watch_spark_step = EmrStepSensor(
        task_id='monitor_portfolio_risk_job',
        job_flow_id='{{ var.value.emr_cluster_id }}',
        step_id="{{ task_instance.xcom_pull('submit_portfolio_risk_job', key='return_value')[0] }}",
        aws_conn_id='aws_default'
    )
    
    # Task 4: Load results to PostgreSQL
    load_results = PostgresOperator(
        task_id='load_risk_results',
        postgres_conn_id='riskthinking_db',
        sql="""
            COPY portfolio_risk_results(
                portfolio_id, scenario, time_horizon, 
                var_50, var_75, var_90, var_95, var_99,
                expected_loss, tail_risk_contribution,
                calculation_date
            )
            FROM 's3://aa-impact-results/portfolio-risk/{{ ds }}/aggregated/'
            WITH (FORMAT csv, HEADER true);
        """
    )
    
    # Task 5: Update materialized views
    refresh_views = PostgresOperator(
        task_id='refresh_materialized_views',
        postgres_conn_id='riskthinking_db',
        sql="""
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_portfolio_risk_summary;
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_scenario_comparison;
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_geographic_risk_heatmap;
            ANALYZE portfolio_risk_results;
        """
    )
    
    # Task 6: Generate reports
    generate_reports = PythonOperator(
        task_id='generate_daily_reports',
        python_callable=generate_portfolio_reports,
        op_kwargs={
            'report_date': '{{ ds }}',
            'output_bucket': 'aa-impact-reports'
        }
    )
    
    # Task 7: Cleanup temporary files
    cleanup = BashOperator(
        task_id='cleanup_temp_files',
        bash_command='''
            aws s3 rm s3://aa-impact-data/portfolio/{{ ds }}/ --recursive
            aws s3 rm s3://aa-impact-results/portfolio-risk/{{ ds }}/temp/ --recursive
        '''
    )
    
    # Define dependencies
    check_data_freshness >> extract_group >> add_spark_step
    add_spark_step >> watch_spark_step >> load_results
    load_results >> refresh_views >> generate_reports >> cleanup


def generate_portfolio_reports(report_date: str, output_bucket: str):
    """Generate daily portfolio risk reports."""
    import boto3
    import pandas as pd
    from jinja2 import Template
    
    # Query risk results
    # Generate PDF/HTML reports
    # Upload to S3
    pass
```

#### 2.3.2 Scenario Update Workflow

```python
# airflow/dags/scenario_update_pipeline.py
"""
Scenario Update Pipeline

This DAG handles the ingestion and processing of new climate scenario
projections from RiskThinking.ai. Triggered when new scenario data
is available.
"""

from airflow import DAG
from airflow.operators.trigger_dagrun import TriggerDagRunOperator
from airflow.operators.python import BranchPythonOperator, PythonOperator
from airflow.sensors.external_task import ExternalTaskSensor
from datetime import datetime, timedelta

def check_scenario_updates(**context):
    """Check if new scenario data is available from RiskThinking."""
    import requests
    
    api_url = "https://api.riskthinking.ai/v2/scenarios/updates"
    headers = {"Authorization": f"Bearer {get_api_token()}"}
    
    response = requests.get(api_url, headers=headers)
    updates = response.json()
    
    if updates['has_new_data']:
        context['ti'].xcom_push(key='scenarios_to_update', value=updates['scenarios'])
        return 'process_scenario_updates'
    return 'no_updates_needed'

with DAG(
    'scenario_update_pipeline',
    default_args=default_args,
    description='Process new climate scenario projections',
    schedule_interval='0 */6 * * *',  # Every 6 hours
    start_date=datetime(2024, 1, 1),
    catchup=False,
    max_active_runs=1,
    tags=['scenario', 'update', 'risk'],
) as dag:
    
    # Check for updates
    check_updates = BranchPythonOperator(
        task_id='check_scenario_updates',
        python_callable=check_scenario_updates,
        provide_context=True
    )
    
    # Process updates
    process_updates = TriggerDagRunOperator(
        task_id='process_scenario_updates',
        trigger_dag_id='full_recalculation_pipeline',
        conf={"scenarios": "{{ ti.xcom_pull(task_ids='check_scenario_updates', key='scenarios_to_update') }}"}
    )
    
    # No-op for when no updates
    no_updates = PythonOperator(
        task_id='no_updates_needed',
        python_callable=lambda: print("No new scenario updates available")
    )
    
    check_updates >> [process_updates, no_updates]
```

### 2.4 Data Partitioning Strategies

#### 2.4.1 Geographic Partitioning (H3/Quadtree)

```python
# partitioning/geographic_partitioning.py
"""
Geographic partitioning using H3 hexagonal grid system and quadtree.

H3 provides approximately equal-area hexagons with hierarchical indexing,
making it ideal for spatial risk aggregation.
"""

import h3
import pygeohash as geohash
from typing import List, Tuple, Dict
import numpy as np

class GeographicPartitioner:
    """
    Manages geographic partitioning for risk data using H3 and quadtree.
    """
    
    H3_RESOLUTIONS = {
        'coarse': 4,      # ~1,000 km² hexagons (global overview)
        'medium': 6,      # ~36 km² hexagons (regional analysis)
        'fine': 8,        # ~0.74 km² hexagons (local analysis)
        'ultra_fine': 10  # ~0.015 km² hexagons (asset-level)
    }
    
    def __init__(self, default_resolution: int = 6):
        self.default_resolution = default_resolution
        
    def lat_lon_to_h3(self, lat: float, lon: float, resolution: int = None) -> str:
        """Convert latitude/longitude to H3 index."""
        res = resolution or self.default_resolution
        return h3.latlng_to_cell(lat, lon, res)
    
    def h3_to_lat_lon(self, h3_index: str) -> Tuple[float, float]:
        """Convert H3 index back to centroid coordinates."""
        return h3.cell_to_latlng(h3_index)
    
    def get_h3_neighbors(self, h3_index: str, ring_size: int = 1) -> List[str]:
        """Get neighboring H3 cells for spatial analysis."""
        return list(h3.grid_ring(h3_index, ring_size))
    
    def get_h3_parent(self, h3_index: str) -> str:
        """Get parent cell at coarser resolution."""
        return h3.cell_to_parent(h3_index)
    
    def get_h3_children(self, h3_index: str) -> List[str]:
        """Get child cells at finer resolution."""
        return list(h3.cell_to_children(h3_index))
    
    def compute_h3_polygon(self, h3_index: str) -> List[Tuple[float, float]]:
        """Get polygon boundary for H3 cell."""
        boundary = h3.cell_to_boundary(h3_index)
        return [(lat, lon) for lat, lon in boundary]
    
    def lat_lon_to_quadkey(self, lat: float, lon: float, zoom: int = 12) -> str:
        """Convert to Bing Maps quadkey for tile-based storage."""
        # Convert lat/lon to tile coordinates
        x, y = self._lat_lon_to_tile(lat, lon, zoom)
        return self._tile_to_quadkey(x, y, zoom)
    
    def _lat_lon_to_tile(self, lat: float, lon: float, zoom: int) -> Tuple[int, int]:
        """Convert lat/lon to tile coordinates."""
        lat_rad = np.radians(lat)
        n = 2.0 ** zoom
        x = int((lon + 180.0) / 360.0 * n)
        y = int((1.0 - np.log(np.tan(lat_rad) + (1 / np.cos(lat_rad))) / np.pi) / 2.0 * n)
        return x, y
    
    def _tile_to_quadkey(self, x: int, y: int, zoom: int) -> str:
        """Convert tile coordinates to quadkey."""
        quadkey = ""
        for i in range(zoom, 0, -1):
            digit = 0
            mask = 1 << (i - 1)
            if (x & mask) != 0:
                digit += 1
            if (y & mask) != 0:
                digit += 2
            quadkey += str(digit)
        return quadkey
    
    def get_partitioning_strategy(self, query_type: str) -> Dict:
        """
        Get recommended partitioning strategy based on query type.
        
        Args:
            query_type: Type of analysis ('global', 'regional', 'local', 'asset')
            
        Returns:
            Dictionary with partitioning configuration
        """
        strategies = {
            'global': {
                'h3_resolution': 4,
                'partition_column': 'h3_coarse',
                'estimated_partitions': 1000,
                'use_case': 'Portfolio-level risk summaries'
            },
            'regional': {
                'h3_resolution': 6,
                'partition_column': 'h3_medium',
                'estimated_partitions': 50000,
                'use_case': 'Regional risk comparison'
            },
            'local': {
                'h3_resolution': 8,
                'partition_column': 'h3_fine',
                'estimated_partitions': 2000000,
                'use_case': 'Local risk analysis'
            },
            'asset': {
                'h3_resolution': 10,
                'partition_column': 'h3_ultra_fine',
                'estimated_partitions': 50000000,
                'use_case': 'Individual asset risk'
            }
        }
        return strategies.get(query_type, strategies['regional'])


# Delta Lake partitioning with H3
# spark/partitioned_writes.py
from pyspark.sql import SparkSession
from pyspark.sql.functions import udf, col
from pyspark.sql.types import StringType

spark = SparkSession.builder.appName("H3-Partitioning").getOrCreate()

# Register H3 UDF
@udf(StringType())
def lat_lon_to_h6(lat, lon):
    import h3
    if lat is None or lon is None:
        return None
    return h3.latlng_to_cell(float(lat), float(lon), 6)

spark.udf.register("lat_lon_to_h6", lat_lon_to_h6)

# Read projections and add H3 partitioning
projections_df = spark.read.format("delta").load("s3://aa-impact-datalake/projections/validated/")

partitioned_df = projections_df \
    .withColumn("h3_partition", lat_lon_to_h6(col("latitude"), col("longitude"))) \
    .withColumn("scenario_hazard", concat(col("scenario"), lit("_"), col("hazard")))

# Write with H3 partitioning for spatial queries
partitioned_df.write \
    .format("delta") \
    .mode("overwrite") \
    .option("overwriteSchema", "true") \
    .partitionBy("scenario_hazard", "h3_partition", "time_horizon") \
    .save("s3://aa-impact-datalake/projections/h3-partitioned/")
```

#### 2.4.2 Delta Lake Partitioning Configuration

```python
# delta_lake/partitioning_config.py
"""
Delta Lake partitioning strategies for 140B projections.
"""

from delta import DeltaTable
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, concat, lit

class ProjectionPartitionManager:
    """
    Manages Delta Lake partitioning for optimal query performance.
    """
    
    PARTITION_CONFIGS = {
        'by_scenario_hazard_time': {
            'columns': ['scenario', 'hazard', 'time_horizon'],
            'description': 'Optimized for scenario comparison queries',
            'recommended_for': ['portfolio_analysis', 'scenario_stress_testing']
        },
        'by_geography_scenario': {
            'columns': ['h3_partition', 'scenario', 'hazard'],
            'description': 'Optimized for geographic risk queries',
            'recommended_for': ['regional_analysis', 'heatmap_generation']
        },
        'by_asset_type_scenario': {
            'columns': ['asset_type', 'scenario', 'time_horizon'],
            'description': 'Optimized for asset class analysis',
            'recommended_for': ['sector_analysis', 'asset_allocation']
        },
        'by_time_scenario': {
            'columns': ['time_horizon', 'scenario', 'hazard'],
            'description': 'Optimized for time-series analysis',
            'recommended_for': ['trend_analysis', 'forecasting']
        }
    }
    
    def __init__(self, spark: SparkSession, table_path: str):
        self.spark = spark
        self.table_path = table_path
        
    def create_partitioned_table(
        self,
        partition_strategy: str,
        source_path: str
    ):
        """
        Create a new partitioned Delta table.
        
        Args:
            partition_strategy: Key from PARTITION_CONFIGS
            source_path: Path to source data
        """
        config = self.PARTITION_CONFIGS.get(partition_strategy)
        if not config:
            raise ValueError(f"Unknown partition strategy: {partition_strategy}")
        
        # Read source data
        df = self.spark.read.format("delta").load(source_path)
        
        # Add computed partition columns if needed
        if 'h3_partition' in config['columns'] and 'h3_partition' not in df.columns:
            from partitioning.geographic_partitioning import GeographicPartitioner
            partitioner = GeographicPartitioner()
            
            @udf(StringType())
            def compute_h3(lat, lon):
                return partitioner.lat_lon_to_h3(lat, lon, resolution=6)
            
            df = df.withColumn("h3_partition", compute_h3(col("latitude"), col("longitude")))
        
        # Write partitioned table
        df.write \
            .format("delta") \
            .mode("overwrite") \
            .option("overwriteSchema", "true") \
            .partitionBy(*config['columns']) \
            .save(self.table_path)
        
        # Optimize with Z-ORDER for common query patterns
        self.optimize_zorder(['asset_id', 'scenario', 'hazard'])
        
    def optimize_zorder(self, zorder_columns: list):
        """Apply Z-ORDER optimization for multi-column queries."""
        self.spark.sql(f"""
            OPTIMIZE delta.`{self.table_path}`
            ZORDER BY ({', '.join(zorder_columns)})
        """)
        
    def enable_dynamic_partition_pruning(self):
        """Enable dynamic partition pruning for better query performance."""
        self.spark.conf.set("spark.sql.optimizer.dynamicPartitionPruning.enabled", "true")
        self.spark.conf.set("spark.sql.optimizer.dynamicPartitionPruning.useStats", "true")
        
    def vacuum_old_versions(self, retention_hours: int = 168):
        """Remove old Delta versions to save storage."""
        delta_table = DeltaTable.forPath(self.spark, self.table_path)
        delta_table.vacuum(retention_hours)
        
    def get_partition_statistics(self) -> dict:
        """Get statistics about current partitioning."""
        df = self.spark.read.format("delta").load(self.table_path)
        
        # Get partition columns
        detail_df = self.spark.sql(f"""
            DESCRIBE DETAIL delta.`{self.table_path}`
        """)
        
        partition_columns = detail_df.select("partitionColumns").collect()[0][0]
        
        # Get file statistics
        files_df = self.spark.sql(f"""
            DESCRIBE HISTORY delta.`{self.table_path}`
        """)
        
        return {
            'partition_columns': partition_columns,
            'num_files': df.inputFiles(),
            'total_size_gb': sum(
                self.spark.sparkContext._jvm.org.apache.hadoop.fs.FileSystem.get(
                    self.spark._jsc.hadoopConfiguration()
                ).getFileStatus(f).getLen() 
                for f in df.inputFiles()
            ) / (1024**3)
        }
```

### 2.5 Compression and Encoding

#### 2.5.1 Parquet with Snappy Configuration

```python
# storage/parquet_config.py
"""
Optimized Parquet configuration for stochastic projection storage.
"""

from pyspark.sql import SparkSession

class ParquetOptimizer:
    """
    Configures Parquet with optimal compression and encoding for risk data.
    """
    
    # Recommended settings for stochastic data
    SPARK_CONFIG = {
        # Compression
        'spark.sql.parquet.compression.codec': 'snappy',
        'spark.sql.parquet.compression.level': '6',
        
        # Encoding
        'spark.sql.parquet.binaryAsString': 'false',
        'spark.sql.parquet.int96AsTimestamp': 'true',
        'spark.sql.parquet.writeLegacyFormat': 'false',
        
        # Row group size (larger = better compression, more memory)
        'spark.sql.parquet.rowGroupSize': '134217728',  # 128MB
        
        # Page size
        'spark.sql.parquet.pageSize': '1048576',  # 1MB
        
        # Enable dictionary encoding for low-cardinality columns
        'spark.sql.parquet.enable.dictionary': 'true',
        'spark.sql.parquet.dictionary.page.size': '1048576',
        
        # Statistics
        'spark.sql.parquet.write.statistics': 'true',
        'spark.sql.parquet.filterPushdown': 'true',
        
        # Bloom filters for point queries
        'spark.sql.parquet.bloom.filter.enabled': 'true',
        'spark.sql.parquet.bloom.filter.expected.ndv': '1000000',
        'spark.sql.parquet.bloom.filter.fpp': '0.01',
        
        # Column-level configuration
        'spark.sql.parquet.column.indexes': 'true',
    }
    
    # Column-specific encoding strategies
    COLUMN_ENCODING = {
        'asset_id': 'DICTIONARY',  # UUIDs benefit from dictionary encoding
        'scenario': 'DICTIONARY',  # Low cardinality (4-8 values)
        'hazard': 'DICTIONARY',    # Low cardinality (5-10 values)
        'time_horizon': 'DICTIONARY',  # Integer years
        'latitude': 'PLAIN',       # High cardinality, floating point
        'longitude': 'PLAIN',      # High cardinality, floating point
        'distribution_mean': 'PLAIN',  # High cardinality floating point
        'distribution_std': 'PLAIN',
        'geohash': 'DICTIONARY',   # Spatial index
        'h3_index': 'DICTIONARY',  # Spatial index
    }
    
    def __init__(self, spark: SparkSession):
        self.spark = spark
        self._apply_config()
        
    def _apply_config(self):
        """Apply Parquet optimization settings to Spark session."""
        for key, value in self.SPARK_CONFIG.items():
            self.spark.conf.set(key, value)
            
    def write_optimized_parquet(self, df, path: str, partition_cols: list = None):
        """
        Write DataFrame with optimized Parquet settings.
        
        Args:
            df: Spark DataFrame to write
            path: Output path
            partition_cols: List of partition columns
        """
        writer = df.write \
            .format("parquet") \
            .option("compression", "snappy") \
            .option("parquet.block.size", "134217728") \
            .option("parquet.page.size", "1048576") \
            .option("parquet.enable.dictionary", "true")
        
        if partition_cols:
            writer = writer.partitionBy(*partition_cols)
            
        writer.mode("overwrite").save(path)
        
    def compare_compression(self, df, path_prefix: str) -> dict:
        """
        Compare different compression codecs for the dataset.
        
        Returns:
            Dictionary with compression statistics
        """
        codecs = ['uncompressed', 'snappy', 'gzip', 'zstd', 'lz4']
        results = {}
        
        for codec in codecs:
            output_path = f"{path_prefix}_{codec}"
            
            start_time = time.time()
            
            df.write \
                .format("parquet") \
                .option("compression", codec) \
                .mode("overwrite") \
                .save(output_path)
            
            write_time = time.time() - start_time
            
            # Get file size
            fs = spark._jvm.org.apache.hadoop.fs.FileSystem.get(
                spark._jsc.hadoopConfiguration()
            )
            path = spark._jvm.org.apache.hadoop.fs.Path(output_path)
            file_status = fs.listStatus(path)
            total_size = sum(f.getLen() for f in file_status if f.isFile())
            
            # Measure read performance
            start_time = time.time()
            read_df = spark.read.parquet(output_path)
            read_df.count()
            read_time = time.time() - start_time
            
            results[codec] = {
                'write_time_sec': write_time,
                'read_time_sec': read_time,
                'size_bytes': total_size,
                'size_mb': total_size / (1024 * 1024)
            }
            
        return results
```

#### 2.5.2 Delta Lake Versioning Configuration

```sql
-- delta_lake/table_configuration.sql
-- Delta Lake table configuration for projection data

-- Create main projections table with optimized settings
CREATE TABLE IF NOT EXISTS riskthinking.projections (
    asset_id STRING NOT NULL,
    scenario STRING NOT NULL,
    hazard STRING NOT NULL,
    time_horizon INT NOT NULL,
    latitude DOUBLE,
    longitude DOUBLE,
    distribution_mean DOUBLE,
    distribution_std DOUBLE,
    distribution_skewness DOUBLE,
    distribution_kurtosis DOUBLE,
    distribution_bins ARRAY<DOUBLE>,
    distribution_probabilities ARRAY<DOUBLE>,
    distribution_samples ARRAY<DOUBLE>,
    metadata MAP<STRING, STRING>,
    geohash STRING,
    h3_index STRING,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
USING DELTA
PARTITIONED BY (scenario, hazard, time_horizon)
LOCATION 's3://aa-impact-datalake/projections/main/'
TBLPROPERTIES (
    'delta.autoOptimize.optimizeWrite' = 'true',
    'delta.autoOptimize.autoCompact' = 'true',
    'delta.checkpointInterval' = '10',
    'delta.logRetentionDuration' = 'interval 30 days',
    'delta.deletedFileRetentionDuration' = 'interval 7 days',
    'delta.columnMapping.mode' = 'name',
    'delta.enableChangeDataFeed' = 'true',
    'delta.minReaderVersion' = '2',
    'delta.minWriterVersion' = '5'
);

-- Enable change data feed for audit trail
ALTER TABLE riskthinking.projections 
SET TBLPROPERTIES ('delta.enableChangeDataFeed' = 'true');

-- Optimize with Z-ORDER for common query patterns
OPTIMIZE riskthinking.projections ZORDER BY (asset_id, scenario, hazard);

-- Create time-travel view for historical analysis
CREATE OR REPLACE VIEW riskthinking.projections_historical AS
SELECT * FROM riskthinking.projections TIMESTAMP AS OF date_sub(current_date(), 1);

-- Set up automated VACUUM for old versions
-- Run weekly via Airflow
VACUUM riskthinking.projections RETAIN 168 HOURS;
```

---

## 3. Stochastic Data Storage Design

### 3.1 PostgreSQL JSONB Schema Design

#### 3.1.1 Core Tables

```sql
-- ============================================
-- STOCHASTIC PROJECTIONS SCHEMA
-- PostgreSQL with JSONB for flexible distribution storage
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For GIN indexes on scalar types

-- ============================================
-- MAIN PROJECTIONS TABLE
-- ============================================
CREATE TABLE stochastic_projections (
    -- Primary identifier
    projection_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign keys
    asset_id UUID NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES climate_scenarios(scenario_id),
    hazard_type VARCHAR(30) NOT NULL,
    time_horizon INT NOT NULL,
    
    -- Temporal tracking
    projection_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP WITH TIME ZONE,  -- NULL = current version
    
    -- Stochastic distribution stored as JSONB
    distribution JSONB NOT NULL,
    
    -- Distribution metadata
    distribution_type VARCHAR(20) NOT NULL DEFAULT 'empirical',
    sample_size INT,
    confidence_level DECIMAL(3,2),
    
    -- Pre-computed statistics for fast querying
    stat_mean DECIMAL(18,8),
    stat_median DECIMAL(18,8),
    stat_std_dev DECIMAL(18,8),
    stat_variance DECIMAL(18,8),
    stat_skewness DECIMAL(10,6),
    stat_kurtosis DECIMAL(10,6),
    stat_min DECIMAL(18,8),
    stat_max DECIMAL(18,8),
    stat_var_95 DECIMAL(18,8),
    stat_var_99 DECIMAL(18,8),
    stat_cvar_95 DECIMAL(18,8),
    stat_cvar_99 DECIMAL(18,8),
    
    -- Spatial indexing
    location GEOGRAPHY(POINT, 4326),
    geohash VARCHAR(12),
    h3_index VARCHAR(15),
    quadkey VARCHAR(30),
    
    -- Partitioning columns
    partition_key VARCHAR(50) GENERATED ALWAYS AS (
        scenario_id::text || '_' || hazard_type || '_' || time_horizon::text
    ) STORED,
    
    -- Data quality flags
    quality_score DECIMAL(3,2),
    validation_status VARCHAR(20) DEFAULT 'pending',
    
    -- Source tracking
    data_source VARCHAR(50) DEFAULT 'riskthinking_api',
    api_version VARCHAR(10),
    ingestion_batch_id UUID,
    
    -- Row constraints
    CONSTRAINT valid_time_horizon CHECK (time_horizon BETWEEN 2020 AND 2100),
    CONSTRAINT valid_hazard_type CHECK (hazard_type IN (
        'flood', 'wildfire', 'hurricane', 'drought', 'heatwave',
        'sea_level_rise', 'storm_surge', 'landslide', 'earthquake'
    )),
    CONSTRAINT valid_distribution_type CHECK (distribution_type IN (
        'empirical', 'parametric', 'histogram', 'kernel_density', 'monte_carlo'
    )),
    CONSTRAINT valid_confidence CHECK (confidence_level BETWEEN 0 AND 1),
    CONSTRAINT valid_quality_score CHECK (quality_score BETWEEN 0 AND 1)
) PARTITION BY RANGE (time_horizon);

-- Create partitions for time horizons
CREATE TABLE stochastic_projections_2020_2030 
    PARTITION OF stochastic_projections
    FOR VALUES FROM (2020) TO (2031);

CREATE TABLE stochastic_projections_2031_2050 
    PARTITION OF stochastic_projections
    FOR VALUES FROM (2031) TO (2051);

CREATE TABLE stochastic_projections_2051_2075 
    PARTITION OF stochastic_projections
    FOR VALUES FROM (2051) TO (2076);

CREATE TABLE stochastic_projections_2076_2100 
    PARTITION OF stochastic_projections
    FOR VALUES FROM (2076) TO (2101);

-- ============================================
-- DISTRIBUTION REPRESENTATIONS
-- ============================================

-- Table for histogram-based distributions
CREATE TABLE distribution_histograms (
    histogram_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    projection_id UUID NOT NULL REFERENCES stochastic_projections(projection_id),
    
    -- Histogram bins and counts
    bin_edges DECIMAL(18,8)[] NOT NULL,
    bin_counts INT[] NOT NULL,
    bin_probabilities DECIMAL(10,8)[],
    
    -- Histogram metadata
    num_bins INT NOT NULL,
    bin_width DECIMAL(18,8),
    binning_method VARCHAR(20) DEFAULT 'equal_width',  -- equal_width, quantile, bayesian_blocks
    
    -- Validation
    total_count INT GENERATED ALWAYS AS (
        (SELECT SUM(c) FROM UNNEST(bin_counts) AS c)
    ) STORED,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for parametric distributions
CREATE TABLE distribution_parametric (
    parametric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    projection_id UUID NOT NULL REFERENCES stochastic_projections(projection_id),
    
    -- Distribution family
    distribution_family VARCHAR(30) NOT NULL,  -- normal, lognormal, gamma, gumbel, etc.
    
    -- Parameters (family-specific)
    param_1 DECIMAL(18,8),  -- mean for normal, shape for gamma, etc.
    param_2 DECIMAL(18,8),  -- std for normal, scale for gamma, etc.
    param_3 DECIMAL(18,8),  -- additional parameters as needed
    param_4 DECIMAL(18,8),
    
    -- Parameter names for clarity
    param_1_name VARCHAR(20),
    param_2_name VARCHAR(20),
    param_3_name VARCHAR(20),
    param_4_name VARCHAR(20),
    
    -- Goodness of fit
    ks_statistic DECIMAL(10,8),
    ks_p_value DECIMAL(10,8),
    anderson_statistic DECIMAL(10,8),
    aic DECIMAL(12,4),
    bic DECIMAL(12,4),
    
    -- Fitting method
    fitting_method VARCHAR(20) DEFAULT 'mle',  -- mle, mme, bayesian
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_distribution_family CHECK (distribution_family IN (
        'normal', 'lognormal', 'gamma', 'weibull', 'gumbel', 'frechet',
        'gev', 'beta', 'pareto', 'exponential', 'poisson', 'binomial'
    ))
);

-- Table for empirical CDF samples
CREATE TABLE distribution_ecdf_samples (
    sample_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    projection_id UUID NOT NULL REFERENCES stochastic_projections(projection_id),
    
    -- Sample values and their CDF values
    sample_values DECIMAL(18,8)[] NOT NULL,
    cdf_values DECIMAL(10,8)[] NOT NULL,
    
    -- Sample metadata
    num_samples INT NOT NULL,
    sampling_method VARCHAR(20) DEFAULT 'uniform',  -- uniform, quantile, adaptive
    
    -- Interpolation method for reconstruction
    interpolation_method VARCHAR(20) DEFAULT 'linear',  -- linear, cubic_spline, pchip
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT matching_array_lengths CHECK (
        ARRAY_LENGTH(sample_values, 1) = ARRAY_LENGTH(cdf_values, 1)
    )
);

-- ============================================
-- AGGREGATION TABLES
-- ============================================

-- Pre-computed portfolio aggregations
CREATE TABLE portfolio_risk_aggregations (
    aggregation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(portfolio_id),
    scenario_id UUID NOT NULL REFERENCES climate_scenarios(scenario_id),
    hazard_type VARCHAR(30) NOT NULL,
    time_horizon INT NOT NULL,
    aggregation_date DATE NOT NULL,
    
    -- Portfolio-level statistics
    total_exposure DECIMAL(18,2),
    num_assets INT,
    
    -- Aggregated distribution (stored as JSONB)
    aggregated_distribution JSONB,
    
    -- Pre-computed risk metrics
    portfolio_var_50 DECIMAL(18,2),
    portfolio_var_75 DECIMAL(18,2),
    portfolio_var_90 DECIMAL(18,2),
    portfolio_var_95 DECIMAL(18,2),
    portfolio_var_99 DECIMAL(18,2),
    portfolio_var_999 DECIMAL(18,2),
    
    portfolio_cvar_50 DECIMAL(18,2),
    portfolio_cvar_75 DECIMAL(18,2),
    portfolio_cvar_90 DECIMAL(18,2),
    portfolio_cvar_95 DECIMAL(18,2),
    portfolio_cvar_99 DECIMAL(18,2),
    
    expected_loss DECIMAL(18,2),
    unexpected_loss DECIMAL(18,2),
    
    -- Tail risk metrics
    tail_risk_contribution JSONB,  -- Asset-level contributions
    concentration_risk DECIMAL(10,6),
    diversification_benefit DECIMAL(10,6),
    
    -- Geographic distribution
    geographic_breakdown JSONB,
    
    -- Sector breakdown
    sector_breakdown JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_portfolio_aggregation UNIQUE (
        portfolio_id, scenario_id, hazard_type, time_horizon, aggregation_date
    )
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- B-tree indexes for common query patterns
CREATE INDEX idx_projections_asset_id ON stochastic_projections(asset_id);
CREATE INDEX idx_projections_scenario ON stochastic_projections(scenario_id);
CREATE INDEX idx_projections_hazard ON stochastic_projections(hazard_type);
CREATE INDEX idx_projections_time_horizon ON stochastic_projections(time_horizon);
CREATE INDEX idx_projections_date ON stochastic_projections(projection_date);
CREATE INDEX idx_projections_created ON stochastic_projections(created_at);
CREATE INDEX idx_projections_partition_key ON stochastic_projections(partition_key);

-- Composite indexes for common filter combinations
CREATE INDEX idx_projections_asset_scenario ON stochastic_projections(asset_id, scenario_id);
CREATE INDEX idx_projections_scenario_hazard_time ON stochastic_projections(scenario_id, hazard_type, time_horizon);
CREATE INDEX idx_projections_asset_scenario_hazard ON stochastic_projections(asset_id, scenario_id, hazard_type);

-- GIN indexes for JSONB queries
CREATE INDEX idx_projections_distribution_gin ON stochastic_projections USING GIN (distribution);
CREATE INDEX idx_projections_metadata_gin ON stochastic_projections USING GIN (metadata);

-- Spatial indexes (PostGIS)
CREATE INDEX idx_projections_location_gist ON stochastic_projections USING GIST (location);
CREATE INDEX idx_projections_geohash ON stochastic_projections(geohash);
CREATE INDEX idx_projections_h3 ON stochastic_projections(h3_index);

-- Partial indexes for active records only
CREATE INDEX idx_projections_active ON stochastic_projections(asset_id, scenario_id, hazard_type, time_horizon)
    WHERE valid_to IS NULL;

-- Expression indexes for computed values
CREATE INDEX idx_projections_mean ON stochastic_projections(stat_mean);
CREATE INDEX idx_projections_var95 ON stochastic_projections(stat_var_95);

-- BRIN indexes for time-series data (space-efficient)
CREATE INDEX idx_projections_created_brin ON stochastic_projections 
    USING BRIN (created_at) WITH (pages_per_range = 128);

-- Trigram index for text search
CREATE INDEX idx_projections_hazard_trgm ON stochastic_projections 
    USING GIN (hazard_type gin_trgm_ops);
```

#### 3.1.2 JSONB Distribution Schema

```sql
-- ============================================
-- JSONB DISTRIBUTION SCHEMA EXAMPLES
-- ============================================

-- Example 1: Histogram Distribution
{
    "type": "histogram",
    "version": "1.0",
    "metadata": {
        "binning_method": "bayesian_blocks",
        "num_bins": 50,
        "sample_size": 10000
    },
    "bins": {
        "edges": [0.0, 0.1, 0.2, 0.3, ...],
        "counts": [100, 150, 200, ...],
        "probabilities": [0.01, 0.015, 0.02, ...],
        "cumulative_probabilities": [0.01, 0.025, 0.045, ...]
    },
    "statistics": {
        "mean": 0.45,
        "median": 0.42,
        "std_dev": 0.15,
        "skewness": 0.3,
        "kurtosis": 2.8,
        "min": 0.0,
        "max": 1.0,
        "percentiles": {
            "p5": 0.15,
            "p25": 0.35,
            "p50": 0.42,
            "p75": 0.55,
            "p95": 0.78
        }
    }
}

-- Example 2: Parametric Distribution (LogNormal)
{
    "type": "parametric",
    "version": "1.0",
    "family": "lognormal",
    "parameters": {
        "mu": -0.8,
        "sigma": 0.5,
        "location": 0.0,
        "scale": 1.0
    },
    "goodness_of_fit": {
        "ks_statistic": 0.02,
        "ks_p_value": 0.85,
        "aic": 1250.3,
        "bic": 1265.7
    },
    "statistics": {
        "mean": 0.45,
        "median": 0.42,
        "mode": 0.38,
        "std_dev": 0.15,
        "variance": 0.0225,
        "skewness": 0.3,
        "kurtosis": 2.8
    }
}

-- Example 3: Empirical CDF Samples
{
    "type": "empirical_cdf",
    "version": "1.0",
    "metadata": {
        "num_samples": 1000,
        "sampling_method": "quantile",
        "interpolation": "cubic_spline"
    },
    "samples": [
        {"value": 0.0, "cdf": 0.0},
        {"value": 0.1, "cdf": 0.05},
        {"value": 0.2, "cdf": 0.12},
        {"value": 0.3, "cdf": 0.25},
        ...
    ],
    "statistics": {
        "mean": 0.45,
        "std_dev": 0.15,
        "min": 0.0,
        "max": 1.0
    }
}

-- Example 4: Monte Carlo Samples
{
    "type": "monte_carlo",
    "version": "1.0",
    "metadata": {
        "num_simulations": 10000,
        "random_seed": 42,
        "simulation_method": "latin_hypercube"
    },
    "samples": [0.12, 0.34, 0.56, 0.23, ...],
    "statistics": {
        "mean": 0.45,
        "median": 0.42,
        "std_dev": 0.15,
        "skewness": 0.3,
        "kurtosis": 2.8,
        "min": 0.0,
        "max": 1.0,
        "percentiles": {
            "p5": 0.15,
            "p25": 0.35,
            "p50": 0.42,
            "p75": 0.55,
            "p95": 0.78
        }
    }
}
```

### 3.2 Distribution Representation Strategies

#### 3.2.1 Python Distribution Handler

```python
# storage/distribution_handler.py
"""
Flexible distribution storage and retrieval using PostgreSQL JSONB.
Supports multiple distribution representations with automatic conversion.
"""

import json
import numpy as np
from typing import Dict, List, Optional, Tuple, Union
from dataclasses import dataclass
from enum import Enum
import asyncpg
from scipy import stats
from scipy.interpolate import interp1d, CubicSpline

class DistributionType(Enum):
    HISTOGRAM = "histogram"
    PARAMETRIC = "parametric"
    EMPIRICAL_CDF = "empirical_cdf"
    MONTE_CARLO = "monte_carlo"
    KERNEL_DENSITY = "kernel_density"

@dataclass
class DistributionStatistics:
    """Standardized statistics for any distribution type."""
    mean: float
    median: float
    std_dev: float
    variance: float
    skewness: float
    kurtosis: float
    minimum: float
    maximum: float
    percentiles: Dict[str, float]

class DistributionHandler:
    """
    Handles storage and retrieval of stochastic distributions in PostgreSQL JSONB.
    Provides automatic conversion between different representation formats.
    """
    
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool
        
    async def store_distribution(
        self,
        asset_id: str,
        scenario: str,
        hazard: str,
        time_horizon: int,
        distribution_data: Dict,
        distribution_type: DistributionType = DistributionType.HISTOGRAM
    ) -> str:
        """
        Store a distribution in PostgreSQL with automatic statistics computation.
        
        Args:
            asset_id: Asset UUID
            scenario: Climate scenario (e.g., "RCP8.5")
            hazard: Hazard type
            time_horizon: Year of projection
            distribution_data: Distribution-specific data structure
            distribution_type: Type of distribution representation
            
        Returns:
            projection_id of stored record
        """
        async with self.pool.acquire() as conn:
            # Compute statistics from distribution
            stats = self._compute_statistics(distribution_data, distribution_type)
            
            # Convert to JSONB
            distribution_json = json.dumps(distribution_data)
            
            # Insert into database
            result = await conn.fetchrow(
                """
                INSERT INTO stochastic_projections (
                    asset_id, scenario_id, hazard_type, time_horizon,
                    distribution, distribution_type,
                    stat_mean, stat_median, stat_std_dev, stat_variance,
                    stat_skewness, stat_kurtosis, stat_min, stat_max,
                    stat_var_95, stat_var_99, stat_cvar_95, stat_cvar_99
                ) VALUES (
                    $1, $2, $3, $4, $5, $6,
                    $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
                )
                RETURNING projection_id
                """,
                asset_id,
                scenario,
                hazard,
                time_horizon,
                distribution_json,
                distribution_type.value,
                stats.mean,
                stats.median,
                stats.std_dev,
                stats.variance,
                stats.skewness,
                stats.kurtosis,
                stats.minimum,
                stats.maximum,
                stats.percentiles.get('p95'),
                stats.percentiles.get('p99'),
                stats.percentiles.get('cvar95'),
                stats.percentiles.get('cvar99')
            )
            
            return str(result['projection_id'])
    
    def _compute_statistics(
        self,
        distribution_data: Dict,
        distribution_type: DistributionType
    ) -> DistributionStatistics:
        """Compute standardized statistics from any distribution type."""
        
        if distribution_type == DistributionType.HISTOGRAM:
            return self._stats_from_histogram(distribution_data)
        elif distribution_type == DistributionType.PARAMETRIC:
            return self._stats_from_parametric(distribution_data)
        elif distribution_type == DistributionType.EMPIRICAL_CDF:
            return self._stats_from_ecdf(distribution_data)
        elif distribution_type == DistributionType.MONTE_CARLO:
            return self._stats_from_monte_carlo(distribution_data)
        else:
            raise ValueError(f"Unsupported distribution type: {distribution_type}")
    
    def _stats_from_histogram(self, data: Dict) -> DistributionStatistics:
        """Compute statistics from histogram representation."""
        edges = np.array(data['bins']['edges'])
        probabilities = np.array(data['bins']['probabilities'])
        
        # Compute bin centers
        centers = (edges[:-1] + edges[1:]) / 2
        
        # Compute statistics
        mean = np.sum(centers * probabilities)
        variance = np.sum(probabilities * (centers - mean) ** 2)
        std_dev = np.sqrt(variance)
        
        # Compute percentiles from CDF
        cdf = np.cumsum(probabilities)
        percentiles = {
            'p5': np.interp(0.05, cdf, centers),
            'p25': np.interp(0.25, cdf, centers),
            'p50': np.interp(0.50, cdf, centers),
            'p75': np.interp(0.75, cdf, centers),
            'p95': np.interp(0.95, cdf, centers),
            'p99': np.interp(0.99, cdf, centers),
        }
        
        # CVaR (Conditional Value at Risk)
        p95_idx = np.searchsorted(cdf, 0.95)
        percentiles['cvar95'] = np.sum(centers[p95_idx:] * probabilities[p95_idx:]) / np.sum(probabilities[p95_idx:])
        
        p99_idx = np.searchsorted(cdf, 0.99)
        percentiles['cvar99'] = np.sum(centers[p99_idx:] * probabilities[p99_idx:]) / np.sum(probabilities[p99_idx:])
        
        # Skewness and kurtosis
        skewness = np.sum(probabilities * (centers - mean) ** 3) / (std_dev ** 3)
        kurtosis = np.sum(probabilities * (centers - mean) ** 4) / (std_dev ** 4)
        
        return DistributionStatistics(
            mean=mean,
            median=percentiles['p50'],
            std_dev=std_dev,
            variance=variance,
            skewness=skewness,
            kurtosis=kurtosis,
            minimum=edges[0],
            maximum=edges[-1],
            percentiles=percentiles
        )
    
    def _stats_from_parametric(self, data: Dict) -> DistributionStatistics:
        """Compute statistics from parametric distribution."""
        family = data['family']
        params = data['parameters']
        
        if family == 'lognormal':
            mu = params['mu']
            sigma = params['sigma']
            
            # LogNormal statistics
            mean = np.exp(mu + sigma**2 / 2)
            variance = (np.exp(sigma**2) - 1) * np.exp(2*mu + sigma**2)
            std_dev = np.sqrt(variance)
            median = np.exp(mu)
            
            # Compute percentiles using scipy
            dist = stats.lognorm(s=sigma, scale=np.exp(mu))
            percentiles = {
                'p5': dist.ppf(0.05),
                'p25': dist.ppf(0.25),
                'p50': dist.ppf(0.50),
                'p75': dist.ppf(0.75),
                'p95': dist.ppf(0.95),
                'p99': dist.ppf(0.99),
            }
            
            # CVaR computation
            percentiles['cvar95'] = self._compute_cvar_parametric(dist, 0.95)
            percentiles['cvar99'] = self._compute_cvar_parametric(dist, 0.99)
            
            # Skewness and kurtosis for lognormal
            skewness = (np.exp(sigma**2) + 2) * np.sqrt(np.exp(sigma**2) - 1)
            kurtosis = np.exp(4*sigma**2) + 2*np.exp(3*sigma**2) + 3*np.exp(2*sigma**2) - 6
            
        elif family == 'normal':
            mu = params['mu']
            sigma = params['sigma']
            
            mean = mu
            std_dev = sigma
            variance = sigma ** 2
            median = mu
            
            dist = stats.norm(loc=mu, scale=sigma)
            percentiles = {
                'p5': dist.ppf(0.05),
                'p25': dist.ppf(0.25),
                'p50': dist.ppf(0.50),
                'p75': dist.ppf(0.75),
                'p95': dist.ppf(0.95),
                'p99': dist.ppf(0.99),
            }
            
            percentiles['cvar95'] = self._compute_cvar_parametric(dist, 0.95)
            percentiles['cvar99'] = self._compute_cvar_parametric(dist, 0.99)
            
            skewness = 0.0
            kurtosis = 3.0
        
        else:
            raise ValueError(f"Unsupported parametric family: {family}")
        
        return DistributionStatistics(
            mean=mean,
            median=median,
            std_dev=std_dev,
            variance=variance,
            skewness=skewness,
            kurtosis=kurtosis,
            minimum=dist.ppf(0.0001),
            maximum=dist.ppf(0.9999),
            percentiles=percentiles
        )
    
    def _compute_cvar_parametric(self, dist, alpha: float) -> float:
        """Compute CVaR for a parametric distribution."""
        var = dist.ppf(alpha)
        # CVaR = E[X | X > VaR]
        # For continuous distributions: CVaR = integral from VaR to inf of x * f(x) dx / (1-alpha)
        from scipy.integrate import quad
        
        def integrand(x):
            return x * dist.pdf(x)
        
        numerator, _ = quad(integrand, var, dist.ppf(0.999999))
        return numerator / (1 - alpha)
    
    async def get_distribution(
        self,
        projection_id: str,
        target_type: Optional[DistributionType] = None
    ) -> Dict:
        """
        Retrieve a distribution, optionally converting to target type.
        
        Args:
            projection_id: UUID of the projection
            target_type: Optional type to convert to
            
        Returns:
            Distribution data dictionary
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT distribution, distribution_type
                FROM stochastic_projections
                WHERE projection_id = $1
                """,
                projection_id
            )
            
            if not row:
                raise ValueError(f"Projection not found: {projection_id}")
            
            distribution = json.loads(row['distribution'])
            source_type = DistributionType(row['distribution_type'])
            
            if target_type and target_type != source_type:
                distribution = self._convert_distribution(
                    distribution, source_type, target_type
                )
            
            return distribution
    
    def _convert_distribution(
        self,
        distribution: Dict,
        source_type: DistributionType,
        target_type: DistributionType
    ) -> Dict:
        """Convert between distribution representation types."""
        
        # Convert to samples first (universal intermediate)
        samples = self._to_samples(distribution, source_type, n_samples=10000)
        
        # Convert from samples to target type
        if target_type == DistributionType.HISTOGRAM:
            return self._samples_to_histogram(samples)
        elif target_type == DistributionType.PARAMETRIC:
            return self._samples_to_parametric(samples)
        elif target_type == DistributionType.EMPIRICAL_CDF:
            return self._samples_to_ecdf(samples)
        elif target_type == DistributionType.MONTE_CARLO:
            return {"type": "monte_carlo", "samples": samples.tolist()}
        else:
            raise ValueError(f"Unsupported target type: {target_type}")
    
    def _to_samples(
        self,
        distribution: Dict,
        source_type: DistributionType,
        n_samples: int = 10000
    ) -> np.ndarray:
        """Convert any distribution to samples."""
        
        if source_type == DistributionType.HISTOGRAM:
            edges = np.array(distribution['bins']['edges'])
            probabilities = np.array(distribution['bins']['probabilities'])
            centers = (edges[:-1] + edges[1:]) / 2
            return np.random.choice(centers, size=n_samples, p=probabilities)
        
        elif source_type == DistributionType.PARAMETRIC:
            family = distribution['family']
            params = distribution['parameters']
            
            if family == 'lognormal':
                return np.random.lognormal(
                    mean=params['mu'],
                    sigma=params['sigma'],
                    size=n_samples
                )
            elif family == 'normal':
                return np.random.normal(
                    loc=params['mu'],
                    scale=params['sigma'],
                    size=n_samples
                )
        
        elif source_type == DistributionType.EMPIRICAL_CDF:
            samples_data = distribution['samples']
            values = np.array([s['value'] for s in samples_data])
            cdf = np.array([s['cdf'] for s in samples_data])
            # Inverse transform sampling
            u = np.random.uniform(0, 1, n_samples)
            return np.interp(u, cdf, values)
        
        elif source_type == DistributionType.MONTE_CARLO:
            return np.array(distribution['samples'])
        
        raise ValueError(f"Conversion from {source_type} not implemented")
    
    def _samples_to_histogram(self, samples: np.ndarray, n_bins: int = 50) -> Dict:
        """Convert samples to histogram representation."""
        counts, edges = np.histogram(samples, bins=n_bins, density=True)
        probabilities = counts / np.sum(counts)
        cdf = np.cumsum(probabilities)
        
        return {
            "type": "histogram",
            "bins": {
                "edges": edges.tolist(),
                "counts": counts.tolist(),
                "probabilities": probabilities.tolist(),
                "cumulative_probabilities": cdf.tolist()
            },
            "statistics": {
                "mean": float(np.mean(samples)),
                "std_dev": float(np.std(samples)),
                "min": float(np.min(samples)),
                "max": float(np.max(samples))
            }
        }
    
    def _samples_to_parametric(self, samples: np.ndarray) -> Dict:
        """Fit parametric distribution to samples."""
        # Try lognormal first (common for risk data)
        try:
            shape, loc, scale = stats.lognorm.fit(samples, floc=0)
            mu = np.log(scale)
            sigma = shape
            
            # Goodness of fit
            ks_stat, ks_pvalue = stats.kstest(samples, 'lognorm', args=(shape, loc, scale))
            
            return {
                "type": "parametric",
                "family": "lognormal",
                "parameters": {
                    "mu": float(mu),
                    "sigma": float(sigma),
                    "location": float(loc),
                    "scale": float(scale)
                },
                "goodness_of_fit": {
                    "ks_statistic": float(ks_stat),
                    "ks_p_value": float(ks_pvalue)
                }
            }
        except:
            # Fall back to normal
            mu, std = stats.norm.fit(samples)
            return {
                "type": "parametric",
                "family": "normal",
                "parameters": {
                    "mu": float(mu),
                    "sigma": float(std)
                }
            }
    
    def _samples_to_ecdf(self, samples: np.ndarray, n_points: int = 1000) -> Dict:
        """Convert samples to empirical CDF."""
        sorted_samples = np.sort(samples)
        cdf = np.arange(1, len(sorted_samples) + 1) / len(sorted_samples)
        
        # Downsample to n_points
        indices = np.linspace(0, len(sorted_samples) - 1, n_points, dtype=int)
        
        return {
            "type": "empirical_cdf",
            "samples": [
                {"value": float(sorted_samples[i]), "cdf": float(cdf[i])}
                for i in indices
            ],
            "statistics": {
                "mean": float(np.mean(samples)),
                "std_dev": float(np.std(samples))
            }
        }
```

### 3.3 Indexing Strategies

#### 3.3.1 GIN Index Configuration

```sql
-- ============================================
-- ADVANCED GIN INDEX CONFIGURATION
-- ============================================

-- GIN index for JSONB with specific operators
CREATE INDEX idx_projections_distribution_ops ON stochastic_projections 
    USING GIN (distribution jsonb_path_ops);

-- GIN index for partial matching on nested JSON
CREATE INDEX idx_projections_distribution_mean ON stochastic_projections 
    USING GIN ((distribution -> 'statistics' -> 'mean'));

-- Composite GIN index for common query patterns
CREATE INDEX idx_projections_jsonb_composite ON stochastic_projections 
    USING GIN (
        distribution,
        metadata
    );

-- GIN index with fastupdate disabled for bulk loads
CREATE INDEX idx_projections_bulk_load ON stochastic_projections 
    USING GIN (distribution) WITH (fastupdate = off);

-- Expression index for extracting specific values from JSONB
CREATE INDEX idx_projections_distribution_type ON stochastic_projections 
    USING BTREE ((distribution ->> 'type'));

-- Partial GIN index for active records
CREATE INDEX idx_projections_active_gin ON stochastic_projections 
    USING GIN (distribution) 
    WHERE valid_to IS NULL;

-- ============================================
-- SPATIAL INDEX OPTIMIZATION
-- ============================================

-- Main spatial index on geography column
CREATE INDEX idx_projections_location_geog ON stochastic_projections 
    USING GIST (location);

-- Spatial index with specific parameters for point data
CREATE INDEX idx_projections_location_2d ON stochastic_projections 
    USING GIST (location gist_geometry_ops_2d);

-- H3 index for hexagonal grid queries
CREATE INDEX idx_projections_h3_prefix ON stochastic_projections 
    USING BTREE (h3_index varchar_pattern_ops);

-- Geohash prefix index for range queries
CREATE INDEX idx_projections_geohash_prefix ON stochastic_projections 
    USING BTREE (geohash varchar_pattern_ops);

-- Composite spatial-temporal index
CREATE INDEX idx_projections_location_time ON stochastic_projections 
    USING GIST (location, time_horizon);

-- ============================================
-- BRIN INDEXES FOR TIME-SERIES
-- ============================================

-- BRIN index for created_at (efficient for append-only time series)
CREATE INDEX idx_projections_created_brin ON stochastic_projections 
    USING BRIN (created_at) WITH (pages_per_range = 128);

-- BRIN index for projection_date
CREATE INDEX idx_projections_date_brin ON stochastic_projections 
    USING BRIN (projection_date) WITH (pages_per_range = 128);

-- Multi-column BRIN for temporal queries
CREATE INDEX idx_projections_temporal_brin ON stochastic_projections 
    USING BRIN (time_horizon, projection_date) WITH (pages_per_range = 128);

-- ============================================
-- COVERING INDEXES (INCLUDE)
-- ============================================

-- Covering index for common aggregation queries
CREATE INDEX idx_projections_scenario_covering ON stochastic_projections 
    (scenario_id, hazard_type, time_horizon)
    INCLUDE (stat_mean, stat_std_dev, stat_var_95, stat_var_99);

-- Covering index for asset lookups
CREATE INDEX idx_projections_asset_covering ON stochastic_projections 
    (asset_id)
    INCLUDE (scenario_id, hazard_type, time_horizon, stat_mean, stat_var_95);

-- ============================================
-- INDEX MAINTENANCE
-- ============================================

-- Function to analyze index usage
CREATE OR REPLACE FUNCTION analyze_index_usage()
RETURNS TABLE (
    index_name text,
    table_name text,
    index_size text,
    idx_scan bigint,
    idx_tup_read bigint,
    idx_tup_fetch bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || indexrelname::text,
        schemaname || '.' || relname::text,
        pg_size_pretty(pg_relation_size(indexrelid)),
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY pg_relation_size(indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to identify unused indexes
CREATE OR REPLACE FUNCTION find_unused_indexes()
RETURNS TABLE (
    index_name text,
    table_name text,
    index_size text,
    last_scan timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || indexrelname::text,
        schemaname || '.' || relname::text,
        pg_size_pretty(pg_relation_size(indexrelid)),
        last_idx_scan
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0
    AND schemaname = 'public'
    ORDER BY pg_relation_size(indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- Reindex job (run during maintenance window)
CREATE OR REPLACE FUNCTION reindex_projections()
RETURNS void AS $$
BEGIN
    -- Reindex with minimal locking
    REINDEX INDEX CONCURRENTLY idx_projections_asset_id;
    REINDEX INDEX CONCURRENTLY idx_projections_scenario;
    REINDEX INDEX CONCURRENTLY idx_projections_location_geog;
    REINDEX INDEX CONCURRENTLY idx_projections_distribution_gin;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. Caching and Performance Optimization

### 4.1 Redis Cache Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         REDIS CACHE LAYER ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    REDIS CLUSTER (6 nodes, 3 masters + 3 replicas)          │   │
│  │                                                                              │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │   │
│  │  │  Master 1   │◄──►│  Master 2   │◄──►│  Master 3   │                     │   │
│  │  │  (slots     │    │  (slots     │    │  (slots     │                     │   │
│  │  │   0-5460)   │    │   5461-10922)│   │   10923-16383)│                   │   │
│  │  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                     │   │
│  │         │                  │                  │                             │   │
│  │         ▼                  ▼                  ▼                             │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │   │
│  │  │  Replica 1  │    │  Replica 2  │    │  Replica 3  │                     │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘                     │   │
│  │                                                                              │   │
│  │  Memory Allocation:                                                          │   │
│  │  • Hot Data Cache: 40GB (recent projections, active portfolios)             │   │
│  │  • Query Results: 30GB (materialized query results)                         │   │
│  │  • Session Store: 10GB (user sessions, API tokens)                          │   │
│  │  • Rate Limiting: 10GB (API quota tracking)                                 │   │
│  │  • Pub/Sub: 10GB (real-time updates)                                        │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  CACHE KEY NAMING CONVENTIONS:                                                      │
│  • projections:{asset_id}:{scenario}:{hazard}:{time_horizon}                       │
│  • portfolio:{portfolio_id}:summary:{scenario}:{time_horizon}                      │
│  • query:{hash}:results  (cached query results)                                    │
│  • heatmap:{scenario}:{hazard}:{time_horizon}:{geohash_prefix}                     │
│  • aggregation:{type}:{parameters_hash}                                            │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

#### 4.1.1 Redis Configuration

```yaml
# redis/redis-cluster.yaml
apiVersion: redis.redis.opstreelabs.in/v1beta1
kind: RedisCluster
metadata:
  name: riskthinking-cache
  namespace: data-platform
spec:
  clusterSize: 3
  kubernetesConfig:
    image: redis:7.2-alpine
    imagePullPolicy: IfNotPresent
    resources:
      requests:
        cpu: "2000m"
        memory: "32Gi"
      limits:
        cpu: "4000m"
        memory: "32Gi"
  redisExporter:
    enabled: true
    image: oliver006/redis_exporter:latest
  redisConfig:
    additionalRedisConfig: |
      # Memory management
      maxmemory 30gb
      maxmemory-policy allkeys-lru
      
      # Persistence (RDB only for cache)
      save 900 1
      save 300 10
      save 60 10000
      stop-writes-on-bgsave-error yes
      rdbcompression yes
      rdbchecksum yes
      
      # Disable AOF for cache-only use
      appendonly no
      
      # Performance tuning
      hash-max-ziplist-entries 512
      hash-max-ziplist-value 64
      list-max-ziplist-size -2
      set-max-intset-entries 512
      zset-max-ziplist-entries 128
      zset-max-ziplist-value 64
      
      # Client output buffer limits
      client-output-buffer-limit normal 0 0 0
      client-output-buffer-limit replica 256mb 64mb 60
      client-output-buffer-limit pubsub 32mb 8mb 60
      
      # Slow log
      slowlog-log-slower-than 10000
      slowlog-max-len 128
      
      # Latency monitoring
      latency-monitor-threshold 100
      
  storage:
    volumeClaimTemplate:
      spec:
        storageClassName: fast-ssd
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 100Gi
```

#### 4.1.2 Python Redis Cache Client

```python
# caching/redis_client.py
"""
High-performance Redis cache client for risk data with intelligent
caching strategies and cache warming.
"""

import json
import hashlib
import pickle
from typing import Any, Optional, Dict, List, Callable
from functools import wraps
import redis.asyncio as redis
from redis.asyncio.cluster import RedisCluster
from redis.asyncio.sentinel import Sentinel
import structlog
from datetime import timedelta
import asyncio

logger = structlog.get_logger()

class RiskDataCache:
    """
    Multi-tier cache for risk projection data with:
    - Hot data caching (frequently accessed projections)
    - Query result caching (materialized query results)
    - Cache warming for predictable access patterns
    - Intelligent TTL based on data volatility
    """
    
    # TTL configurations by data type
    TTL_CONFIG = {
        'projection': timedelta(hours=24),      # Individual projections
        'portfolio_summary': timedelta(hours=6),  # Portfolio aggregations
        'query_result': timedelta(hours=2),     # Query results
        'heatmap': timedelta(hours=12),         # Geographic heatmaps
        'metadata': timedelta(days=7),          # Static metadata
        'session': timedelta(hours=8),          # User sessions
        'rate_limit': timedelta(minutes=1),     # Rate limiting counters
    }
    
    # Key prefixes for namespacing
    KEY_PREFIXES = {
        'projection': 'proj',
        'portfolio': 'port',
        'query': 'query',
        'heatmap': 'heat',
        'metadata': 'meta',
        'session': 'sess',
        'rate_limit': 'rate',
        'aggregation': 'aggr',
    }
    
    def __init__(
        self,
        redis_url: str = "redis://localhost:6379",
        cluster_mode: bool = False,
        default_ttl: timedelta = timedelta(hours=1)
    ):
        self.cluster_mode = cluster_mode
        self.default_ttl = default_ttl
        
        if cluster_mode:
            startup_nodes = [
                {"host": "redis-node-1", "port": "6379"},
                {"host": "redis-node-2", "port": "6379"},
                {"host": "redis-node-3", "port": "6379"},
            ]
            self.redis = RedisCluster(
                startup_nodes=startup_nodes,
                decode_responses=True,
                skip_full_coverage_check=True,
                max_connections_per_node=50
            )
        else:
            self.redis = redis.from_url(
                redis_url,
                decode_responses=True,
                max_connections=100,
                socket_keepalive=True,
                socket_keepalive_options={},
                health_check_interval=30
            )
            
        self._local_cache: Dict[str, Any] = {}
        self._local_cache_max_size = 1000
        
    async def get_projection(
        self,
        asset_id: str,
        scenario: str,
        hazard: str,
        time_horizon: int
    ) -> Optional[Dict]:
        """
        Get a cached projection with automatic fallback to database.
        
        Args:
            asset_id: Asset UUID
            scenario: Climate scenario
            hazard: Hazard type
            time_horizon: Year of projection
            
        Returns:
            Projection data or None if not cached
        """
        cache_key = self._make_key(
            'projection',
            asset_id=asset_id,
            scenario=scenario,
            hazard=hazard,
            time_horizon=time_horizon
        )
        
        # Check local cache first (L1)
        if cache_key in self._local_cache:
            logger.debug("local_cache_hit", key=cache_key)
            return self._local_cache[cache_key]
        
        # Check Redis cache (L2)
        cached = await self.redis.get(cache_key)
        if cached:
            data = json.loads(cached)
            # Populate local cache
            self._update_local_cache(cache_key, data)
            logger.debug("redis_cache_hit", key=cache_key)
            return data
        
        logger.debug("cache_miss", key=cache_key)
        return None
    
    async def set_projection(
        self,
        asset_id: str,
        scenario: str,
        hazard: str,
        time_horizon: int,
        data: Dict,
        ttl: Optional[timedelta] = None
    ) -> bool:
        """
        Cache a projection with configurable TTL.
        
        Args:
            asset_id: Asset UUID
            scenario: Climate scenario
            hazard: Hazard type
            time_horizon: Year of projection
            data: Projection data to cache
            ttl: Optional custom TTL
            
        Returns:
            True if cached successfully
        """
        cache_key = self._make_key(
            'projection',
            asset_id=asset_id,
            scenario=scenario,
            hazard=hazard,
            time_horizon=time_horizon
        )
        
        ttl_seconds = int((ttl or self.TTL_CONFIG['projection']).total_seconds())
        
        try:
            # Serialize to JSON
            serialized = json.dumps(data, default=str)
            
            # Store in Redis
            await self.redis.setex(cache_key, ttl_seconds, serialized)
            
            # Update local cache
            self._update_local_cache(cache_key, data)
            
            logger.debug("projection_cached", key=cache_key, ttl=ttl_seconds)
            return True
            
        except Exception as e:
            logger.error("cache_set_failed", key=cache_key, error=str(e))
            return False
    
    async def get_portfolio_summary(
        self,
        portfolio_id: str,
        scenario: str,
        time_horizon: int,
        include_breakdown: bool = False
    ) -> Optional[Dict]:
        """Get cached portfolio risk summary."""
        cache_key = self._make_key(
            'portfolio',
            portfolio_id=portfolio_id,
            scenario=scenario,
            time_horizon=time_horizon,
            breakdown=include_breakdown
        )
        
        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)
        return None
    
    async def set_portfolio_summary(
        self,
        portfolio_id: str,
        scenario: str,
        time_horizon: int,
        data: Dict,
        include_breakdown: bool = False
    ) -> bool:
        """Cache portfolio risk summary."""
        cache_key = self._make_key(
            'portfolio',
            portfolio_id=portfolio_id,
            scenario=scenario,
            time_horizon=time_horizon,
            breakdown=include_breakdown
        )
        
        ttl_seconds = int(self.TTL_CONFIG['portfolio_summary'].total_seconds())
        
        try:
            serialized = json.dumps(data, default=str)
            await self.redis.setex(cache_key, ttl_seconds, serialized)
            return True
        except Exception as e:
            logger.error("portfolio_cache_failed", error=str(e))
            return False
    
    async def cache_query_result(
        self,
        query_hash: str,
        result: Any,
        ttl: Optional[timedelta] = None
    ) -> bool:
        """
        Cache a query result by its hash.
        
        Args:
            query_hash: Hash of the query (SQL + parameters)
            result: Query result to cache
            ttl: Optional custom TTL
            
        Returns:
            True if cached successfully
        """
        cache_key = f"{self.KEY_PREFIXES['query']}:{query_hash}"
        ttl_seconds = int((ttl or self.TTL_CONFIG['query_result']).total_seconds())
        
        try:
            # Use pickle for complex objects
            serialized = pickle.dumps(result)
            await self.redis.setex(cache_key, ttl_seconds, serialized)
            return True
        except Exception as e:
            logger.error("query_cache_failed", error=str(e))
            return False
    
    async def get_cached_query(self, query_hash: str) -> Optional[Any]:
        """Retrieve a cached query result."""
        cache_key = f"{self.KEY_PREFIXES['query']}:{query_hash}"
        
        cached = await self.redis.get(cache_key)
        if cached:
            return pickle.loads(cached)
        return None
    
    async def warm_cache_for_portfolio(
        self,
        portfolio_id: str,
        scenarios: List[str],
        time_horizons: List[int],
        db_fetch_func: Callable
    ) -> Dict[str, int]:
        """
        Pre-warm cache for a portfolio's common queries.
        
        Args:
            portfolio_id: Portfolio to warm cache for
            scenarios: List of scenarios to warm
            time_horizons: List of time horizons to warm
            db_fetch_func: Async function to fetch data from DB
            
        Returns:
            Statistics about cache warming
        """
        stats = {'warmed': 0, 'failed': 0, 'skipped': 0}
        
        # Generate all combinations
        combinations = [
            (scenario, horizon)
            for scenario in scenarios
            for horizon in time_horizons
        ]
        
        # Check which are already cached
        keys_to_warm = []
        for scenario, horizon in combinations:
            cache_key = self._make_key(
                'portfolio',
                portfolio_id=portfolio_id,
                scenario=scenario,
                time_horizon=horizon
            )
            exists = await self.redis.exists(cache_key)
            if not exists:
                keys_to_warm.append((scenario, horizon, cache_key))
            else:
                stats['skipped'] += 1
        
        # Fetch and cache missing data in batches
        batch_size = 10
        for i in range(0, len(keys_to_warm), batch_size):
            batch = keys_to_warm[i:i+batch_size]
            
            # Fetch data for batch
            fetch_tasks = [
                db_fetch_func(portfolio_id, scenario, horizon)
                for scenario, horizon, _ in batch
            ]
            results = await asyncio.gather(*fetch_tasks, return_exceptions=True)
            
            # Cache results
            for (scenario, horizon, cache_key), result in zip(batch, results):
                if isinstance(result, Exception):
                    logger.error("warm_fetch_failed", scenario=scenario, horizon=horizon, error=str(result))
                    stats['failed'] += 1
                elif result:
                    await self.set_portfolio_summary(
                        portfolio_id, scenario, horizon, result
                    )
                    stats['warmed'] += 1
        
        logger.info("cache_warming_complete", portfolio_id=portfolio_id, stats=stats)
        return stats
    
    async def invalidate_portfolio_cache(self, portfolio_id: str) -> int:
        """
        Invalidate all cached data for a portfolio.
        
        Args:
            portfolio_id: Portfolio to invalidate
            
        Returns:
            Number of keys invalidated
        """
        pattern = f"{self.KEY_PREFIXES['portfolio']}:{portfolio_id}:*"
        
        # Find all matching keys
        keys = []
        async for key in self.redis.scan_iter(match=pattern):
            keys.append(key)
        
        # Delete in batches
        if keys:
            await self.redis.delete(*keys)
        
        logger.info("portfolio_cache_invalidated", portfolio_id=portfolio_id, keys_deleted=len(keys))
        return len(keys)
    
    async def get_cache_stats(self) -> Dict:
        """Get cache statistics."""
        info = await self.redis.info()
        
        return {
            'used_memory_mb': info.get('used_memory', 0) / (1024 * 1024),
            'used_memory_peak_mb': info.get('used_memory_peak', 0) / (1024 * 1024),
            'total_keys': info.get('db0', {}).get('keys', 0),
            'keyspace_hits': info.get('keyspace_hits', 0),
            'keyspace_misses': info.get('keyspace_misses', 0),
            'hit_rate': (
                info.get('keyspace_hits', 0) / 
                (info.get('keyspace_hits', 0) + info.get('keyspace_misses', 1))
            ),
            'connected_clients': info.get('connected_clients', 0),
            'blocked_clients': info.get('blocked_clients', 0),
        }
    
    def _make_key(self, key_type: str, **kwargs) -> str:
        """Generate a cache key from type and parameters."""
        prefix = self.KEY_PREFIXES.get(key_type, 'cache')
        parts = [f"{k}:{v}" for k, v in sorted(kwargs.items())]
        return f"{prefix}:" + ":".join(parts)
    
    def _update_local_cache(self, key: str, value: Any):
        """Update LRU local cache."""
        if len(self._local_cache) >= self._local_cache_max_size:
            # Remove oldest entry (simple FIFO)
            oldest_key = next(iter(self._local_cache))
            del self._local_cache[oldest_key]
        
        self._local_cache[key] = value


def cached_query(ttl: Optional[timedelta] = None):
    """
    Decorator for caching function results based on arguments.
    
    Usage:
        @cached_query(ttl=timedelta(hours=2))
        async def get_risk_summary(portfolio_id: str, scenario: str):
            # Expensive query
            return result
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            cache_key_data = {
                'func': func.__name__,
                'args': args,
                'kwargs': sorted(kwargs.items())
            }
            cache_key = hashlib.sha256(
                json.dumps(cache_key_data, sort_keys=True, default=str).encode()
            ).hexdigest()
            
            # Try to get from cache
            cache = RiskDataCache()  # Should be injected/singleton in production
            cached = await cache.get_cached_query(cache_key)
            
            if cached is not None:
                logger.debug("function_result_cached", func=func.__name__)
                return cached
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Cache result
            await cache.cache_query_result(cache_key, result, ttl)
            
            return result
        
        return wrapper
    return decorator
```

### 4.2 CDN Configuration for Static Hazard Layers

```yaml
# cdn/cloudfront-config.yaml
---
# AWS CloudFront distribution for hazard layer tiles
AWSTemplateFormatVersion: '2010-09-09'
Description: CloudFront CDN for RiskThinking hazard layers

Resources:
  HazardLayerDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Comment: CDN for climate hazard layer tiles
        Enabled: true
        PriceClass: PriceClass_All  # Global distribution
        
        Origins:
          - Id: S3HazardLayers
            DomainName: !GetAtt HazardLayersBucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: !Sub "origin-access-identity/cloudfront/${OriginAccessIdentity}"
          
          - Id: APIGatewayOrigin
            DomainName: !Sub "${ApiGatewayRestApi}.execute-api.${AWS::Region}.amazonaws.com"
            CustomOriginConfig:
              OriginProtocolPolicy: https-only
              OriginSSLProtocols:
                - TLSv1.2
        
        DefaultCacheBehavior:
          TargetOriginId: S3HazardLayers
          ViewerProtocolPolicy: https-only
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
          CachedMethods:
            - GET
            - HEAD
          ForwardedValues:
            QueryString: true
            QueryStringCacheKeys:
              - scenario
              - hazard
              - time_horizon
              - z
              - x
              - y
          MinTTL: 86400  # 1 day
          DefaultTTL: 604800  # 7 days
          MaxTTL: 2592000  # 30 days
          Compress: true
          
          # Enable caching based on query parameters
          LambdaFunctionAssociations:
            - EventType: viewer-request
              LambdaFunctionARN: !GetAtt CacheKeyLambdaFunction.Arn
        
        CacheBehaviors:
          # API responses (shorter cache)
          - PathPattern: /api/*
            TargetOriginId: APIGatewayOrigin
            ViewerProtocolPolicy: https-only
            AllowedMethods:
              - GET
              - HEAD
              - OPTIONS
              - PUT
              - POST
              - PATCH
              - DELETE
            ForwardedValues:
              QueryString: true
              Headers:
                - Authorization
                - Origin
                - Access-Control-Request-Headers
                - Access-Control-Request-Method
            MinTTL: 0
            DefaultTTL: 300  # 5 minutes for API
            MaxTTL: 3600  # 1 hour
            Compress: true
          
          # Tile images (long cache)
          - PathPattern: /tiles/*
            TargetOriginId: S3HazardLayers
            ViewerProtocolPolicy: https-only
            AllowedMethods:
              - GET
              - HEAD
            ForwardedValues:
              QueryString: false
            MinTTL: 604800  # 7 days
            DefaultTTL: 2592000  # 30 days
            MaxTTL: 31536000  # 1 year
            Compress: true
        
        # SSL/TLS Configuration
        ViewerCertificate:
          AcmCertificateArn: !Ref CertificateArn
          SslSupportMethod: sni-only
          MinimumProtocolVersion: TLSv1.2_2021
        
        # Logging
        Logging:
          Bucket: !GetAtt AccessLogsBucket.DomainName
          Prefix: cdn-access-logs/
          IncludeCookies: false
        
        # WAF Integration
        WebACLId: !GetAtt WebACL.Arn
        
        # Custom error responses
        CustomErrorResponses:
          - ErrorCode: 404
            ResponseCode: 404
            ResponsePagePath: /errors/404.html
            ErrorCachingMinTTL: 300
          - ErrorCode: 500
            ResponseCode: 500
            ResponsePagePath: /errors/500.html
            ErrorCachingMinTTL: 60

  # S3 Bucket for hazard layer tiles
  HazardLayersBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${AWS::StackName}-hazard-layers"
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToIA
            Status: Enabled
            TransitionInDays: 90
            StorageClass: STANDARD_IA
          - Id: TransitionToGlacier
            Status: Enabled
            TransitionInDays: 365
            StorageClass: GLACIER
      CorsConfiguration:
        CorsRules:
          - AllowedHeaders:
              - "*"
            AllowedMethods:
              - GET
              - HEAD
            AllowedOrigins:
              - "*"
            MaxAge: 3600

  # Lambda@Edge for cache key manipulation
  CacheKeyLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "${AWS::StackName}-cache-key-normalizer"
      Runtime: nodejs18.x
      Handler: index.handler
      Code:
        ZipFile: |
          exports.handler = async (event) => {
            const request = event.Records[0].cf.request;
            const querystring = request.querystring;
            
            // Normalize query parameters for consistent cache keys
            const params = new URLSearchParams(querystring);
            const normalized = new URLSearchParams();
            
            // Only include relevant parameters in cache key
            const cacheableParams = ['scenario', 'hazard', 'time_horizon', 'z', 'x', 'y'];
            cacheableParams.forEach(param => {
              if (params.has(param)) {
                normalized.set(param, params.get(param));
              }
            });
            
            request.querystring = normalized.toString();
            return request;
          };
      Role: !GetAtt LambdaExecutionRole.Arn

Outputs:
  DistributionDomainName:
    Description: CloudFront Distribution Domain Name
    Value: !GetAtt HazardLayerDistribution.DomainName
  
  DistributionId:
    Description: CloudFront Distribution ID
    Value: !Ref HazardLayerDistribution
```

### 4.3 Materialized Views

```sql
-- ============================================
-- MATERIALIZED VIEWS FOR COMMON AGGREGATIONS
-- ============================================

-- View 1: Portfolio Risk Summary by Scenario
CREATE MATERIALIZED VIEW mv_portfolio_risk_summary AS
SELECT 
    p.portfolio_id,
    p.portfolio_name,
    sp.scenario_id,
    cs.scenario_name,
    sp.hazard_type,
    sp.time_horizon,
    COUNT(DISTINCT sp.asset_id) as num_assets,
    SUM(pos.market_value) as total_exposure,
    AVG(sp.stat_mean) as avg_expected_loss,
    STDDEV(sp.stat_mean) as std_expected_loss,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY sp.stat_mean) as median_loss,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY sp.stat_var_95) as portfolio_var_95,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY sp.stat_var_99) as portfolio_var_99,
    SUM(sp.stat_cvar_95 * pos.market_value) / NULLIF(SUM(pos.market_value), 0) as weighted_cvar_95,
    MAX(sp.created_at) as last_updated
FROM portfolios p
JOIN positions pos ON p.portfolio_id = pos.portfolio_id
JOIN stochastic_projections sp ON pos.asset_id = sp.asset_id
JOIN climate_scenarios cs ON sp.scenario_id = cs.scenario_id
WHERE sp.valid_to IS NULL
GROUP BY 
    p.portfolio_id, p.portfolio_name,
    sp.scenario_id, cs.scenario_name,
    sp.hazard_type, sp.time_horizon;

-- Create indexes on materialized view
CREATE UNIQUE INDEX idx_mv_portfolio_risk_pk 
    ON mv_portfolio_risk_summary (portfolio_id, scenario_id, hazard_type, time_horizon);
CREATE INDEX idx_mv_portfolio_risk_scenario 
    ON mv_portfolio_risk_summary (scenario_id, time_horizon);
CREATE INDEX idx_mv_portfolio_risk_hazard 
    ON mv_portfolio_risk_summary (hazard_type);

-- View 2: Scenario Comparison Matrix
CREATE MATERIALIZED VIEW mv_scenario_comparison AS
SELECT 
    sp.asset_id,
    a.asset_name,
    a.latitude,
    a.longitude,
    a.h3_index,
    sp.hazard_type,
    sp.time_horizon,
    jsonb_object_agg(
        cs.scenario_name,
        jsonb_build_object(
            'mean', sp.stat_mean,
            'var_95', sp.stat_var_95,
            'var_99', sp.stat_var_99,
            'std_dev', sp.stat_std_dev
        )
    ) as scenario_comparison
FROM stochastic_projections sp
JOIN assets a ON sp.asset_id = a.asset_id
JOIN climate_scenarios cs ON sp.scenario_id = cs.scenario_id
WHERE sp.valid_to IS NULL
GROUP BY 
    sp.asset_id, a.asset_name, a.latitude, a.longitude, a.h3_index,
    sp.hazard_type, sp.time_horizon;

CREATE UNIQUE INDEX idx_mv_scenario_comparison_pk 
    ON mv_scenario_comparison (asset_id, hazard_type, time_horizon);
CREATE INDEX idx_mv_scenario_comparison_h3 
    ON mv_scenario_comparison (h3_index);

-- View 3: Geographic Risk Heatmap
CREATE MATERIALIZED VIEW mv_geographic_risk_heatmap AS
WITH h6_aggregation AS (
    SELECT 
        SUBSTRING(sp.h3_index, 1, 7) as h6_index,  -- H3 resolution 6
        sp.scenario_id,
        sp.hazard_type,
        sp.time_horizon,
        COUNT(DISTINCT sp.asset_id) as asset_count,
        AVG(sp.stat_mean) as avg_risk,
        MAX(sp.stat_var_95) as max_var_95,
        STDDEV(sp.stat_mean) as risk_volatility,
        h3_cell_to_latlng(SUBSTRING(sp.h3_index, 1, 7)::h3index) as centroid
    FROM stochastic_projections sp
    WHERE sp.valid_to IS NULL
    AND sp.h3_index IS NOT NULL
    GROUP BY 
        SUBSTRING(sp.h3_index, 1, 7),
        sp.scenario_id, sp.hazard_type, sp.time_horizon
)
SELECT 
    h6_index,
    scenario_id,
    hazard_type,
    time_horizon,
    asset_count,
    avg_risk,
    max_var_95,
    risk_volatility,
    ST_SetSRID(ST_MakePoint(
        (centroid).longitude,
        (centroid).latitude
    ), 4326) as centroid_geom
FROM h6_aggregation;

CREATE UNIQUE INDEX idx_mv_heatmap_pk 
    ON mv_geographic_risk_heatmap (h6_index, scenario_id, hazard_type, time_horizon);
CREATE INDEX idx_mv_heatmap_geom 
    ON mv_geographic_risk_heatmap USING GIST (centroid_geom);

-- View 4: Asset Risk Time Series
CREATE MATERIALIZED VIEW mv_asset_risk_timeseries AS
SELECT 
    sp.asset_id,
    a.asset_name,
    a.asset_type,
    sp.scenario_id,
    sp.hazard_type,
    jsonb_object_agg(
        sp.time_horizon::text,
        jsonb_build_object(
            'mean', sp.stat_mean,
            'var_95', sp.stat_var_95,
            'var_99', sp.stat_var_99,
            'distribution', sp.distribution
        )
        ORDER BY sp.time_horizon
    ) as time_series
FROM stochastic_projections sp
JOIN assets a ON sp.asset_id = a.asset_id
WHERE sp.valid_to IS NULL
GROUP BY sp.asset_id, a.asset_name, a.asset_type, sp.scenario_id, sp.hazard_type;

CREATE UNIQUE INDEX idx_mv_timeseries_pk 
    ON mv_asset_risk_timeseries (asset_id, scenario_id, hazard_type);

-- ============================================
-- REFRESH PROCEDURES
-- ============================================

-- Concurrent refresh function (non-blocking)
CREATE OR REPLACE FUNCTION refresh_materialized_views_concurrent()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_portfolio_risk_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_scenario_comparison;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_geographic_risk_heatmap;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_asset_risk_timeseries;
    
    -- Update statistics
    ANALYZE mv_portfolio_risk_summary;
    ANALYZE mv_scenario_comparison;
    ANALYZE mv_geographic_risk_heatmap;
    ANALYZE mv_asset_risk_timeseries;
END;
$$ LANGUAGE plpgsql;

-- Scheduled refresh (called by Airflow every 6 hours)
CREATE OR REPLACE FUNCTION scheduled_view_refresh()
RETURNS void AS $$
DECLARE
    start_time timestamp;
    end_time timestamp;
BEGIN
    start_time := clock_timestamp();
    
    PERFORM refresh_materialized_views_concurrent();
    
    end_time := clock_timestamp();
    
    -- Log refresh duration
    INSERT INTO view_refresh_log (refresh_time, duration_ms)
    VALUES (now(), EXTRACT(MILLISECONDS FROM (end_time - start_time)));
END;
$$ LANGUAGE plpgsql;

-- Create refresh log table
CREATE TABLE view_refresh_log (
    log_id SERIAL PRIMARY KEY,
    refresh_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    duration_ms NUMERIC,
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT
);
```

### 4.4 Read Replicas Configuration

```yaml
# database/read-replicas.yaml
---
# AWS RDS PostgreSQL read replica configuration
AWSTemplateFormatVersion: '2010-09-09'
Description: Read replica configuration for risk data queries

Parameters:
  SourceDBInstanceIdentifier:
    Type: String
    Description: Source database instance identifier
  
  ReplicaCount:
    Type: Number
    Default: 2
    Description: Number of read replicas to create

Resources:
  # Read Replica 1 - For analytical queries
  ReadReplica1:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub "${SourceDBInstanceIdentifier}-replica-1"
      SourceDBInstanceIdentifier: !Ref SourceDBInstanceIdentifier
      DBInstanceClass: db.r6g.4xlarge
      PubliclyAccessible: false
      StorageEncrypted: true
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      EnableCloudwatchLogsExports:
        - postgresql
      Tags:
        - Key: Purpose
          Value: analytical-queries
        - Key: Workload
          Value: reporting
  
  # Read Replica 2 - For API queries
  ReadReplica2:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub "${SourceDBInstanceIdentifier}-replica-2"
      SourceDBInstanceIdentifier: !Ref SourceDBInstanceIdentifier
      DBInstanceClass: db.r6g.2xlarge
      PubliclyAccessible: false
      StorageEncrypted: true
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      EnableCloudwatchLogsExports:
        - postgresql
      Tags:
        - Key: Purpose
          Value: api-queries
        - Key: Workload
          Value: realtime

  # Route 53 weighted routing for read replicas
  ReadReplicaEndpoint:
    Type: AWS::Route53::RecordSetGroup
    Properties:
      HostedZoneId: !Ref HostedZoneId
      RecordSets:
        - Name: read.replicas.riskthinking.internal
          Type: CNAME
          SetIdentifier: replica-1
          Weight: 60
          TTL: 60
          ResourceRecords:
            - !GetAtt ReadReplica1.Endpoint.Address
        - Name: read.replicas.riskthinking.internal
          Type: CNAME
          SetIdentifier: replica-2
          Weight: 40
          TTL: 60
          ResourceRecords:
            - !GetAtt ReadReplica2.Endpoint.Address

  # CloudWatch alarms for replica lag
  ReplicaLagAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${AWS::StackName}-replica-lag"
      AlarmDescription: Alarm when replica lag exceeds 5 minutes
      MetricName: ReplicaLag
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 300
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref ReadReplica1

Outputs:
  Replica1Endpoint:
    Description: Read Replica 1 Endpoint
    Value: !GetAtt ReadReplica1.Endpoint.Address
  
  Replica2Endpoint:
    Description: Read Replica 2 Endpoint
    Value: !GetAtt ReadReplica2.Endpoint.Address
  
  LoadBalancedEndpoint:
    Description: Load-balanced read replica endpoint
    Value: read.replicas.riskthinking.internal
```

---

## 5. Data Quality and Validation

### 5.1 Schema Validation

#### 5.1.1 JSON Schema Definitions

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://aaimpact.com/schemas/risk-projection.json",
  "title": "Risk Projection",
  "description": "Schema for climate risk projection data from RiskThinking.ai",
  "type": "object",
  "required": ["asset_id", "scenario", "hazard", "time_horizon", "distribution"],
  "properties": {
    "asset_id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique identifier for the asset"
    },
    "scenario": {
      "type": "string",
      "enum": ["RCP2.6", "RCP4.5", "RCP6.0", "RCP8.5", "SSP1-1.9", "SSP1-2.6", "SSP2-4.5", "SSP3-7.0", "SSP5-8.5"],
      "description": "Climate change scenario"
    },
    "hazard": {
      "type": "string",
      "enum": ["flood", "wildfire", "hurricane", "drought", "heatwave", "sea_level_rise", "storm_surge", "landslide", "earthquake"],
      "description": "Type of climate hazard"
    },
    "time_horizon": {
      "type": "integer",
      "minimum": 2020,
      "maximum": 2100,
      "description": "Year of projection"
    },
    "projection_date": {
      "type": "string",
      "format": "date",
      "description": "Date when projection was generated"
    },
    "distribution": {
      "oneOf": [
        { "$ref": "#/definitions/histogramDistribution" },
        { "$ref": "#/definitions/parametricDistribution" },
        { "$ref": "#/definitions/empiricalCdfDistribution" },
        { "$ref": "#/definitions/monteCarloDistribution" }
      ]
    },
    "metadata": {
      "type": "object",
      "properties": {
        "source": { "type": "string" },
        "version": { "type": "string" },
        "model": { "type": "string" },
        "timestamp": { "type": "string", "format": "date-time" }
      }
    },
    "location": {
      "type": "object",
      "required": ["latitude", "longitude"],
      "properties": {
        "latitude": {
          "type": "number",
          "minimum": -90,
          "maximum": 90
        },
        "longitude": {
          "type": "number",
          "minimum": -180,
          "maximum": 180
        },
        "geohash": { "type": "string" },
        "h3_index": { "type": "string" }
      }
    }
  },
  "definitions": {
    "histogramDistribution": {
      "type": "object",
      "required": ["type", "bins"],
      "properties": {
        "type": { "const": "histogram" },
        "bins": {
          "type": "object",
          "required": ["edges", "counts"],
          "properties": {
            "edges": {
              "type": "array",
              "items": { "type": "number" },
              "minItems": 2
            },
            "counts": {
              "type": "array",
              "items": { "type": "integer", "minimum": 0 }
            },
            "probabilities": {
              "type": "array",
              "items": { "type": "number", "minimum": 0, "maximum": 1 }
            }
          }
        },
        "statistics": {
          "type": "object",
          "properties": {
            "mean": { "type": "number" },
            "median": { "type": "number" },
            "std_dev": { "type": "number", "minimum": 0 },
            "min": { "type": "number" },
            "max": { "type": "number" }
          }
        }
      }
    },
    "parametricDistribution": {
      "type": "object",
      "required": ["type", "family", "parameters"],
      "properties": {
        "type": { "const": "parametric" },
        "family": {
          "type": "string",
          "enum": ["normal", "lognormal", "gamma", "weibull", "gumbel", "gev"]
        },
        "parameters": {
          "type": "object",
          "additionalProperties": { "type": "number" }
        },
        "goodness_of_fit": {
          "type": "object",
          "properties": {
            "ks_statistic": { "type": "number", "minimum": 0, "maximum": 1 },
            "ks_p_value": { "type": "number", "minimum": 0, "maximum": 1 },
            "aic": { "type": "number" },
            "bic": { "type": "number" }
          }
        }
      }
    },
    "empiricalCdfDistribution": {
      "type": "object",
      "required": ["type", "samples"],
      "properties": {
        "type": { "const": "empirical_cdf" },
        "samples": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["value", "cdf"],
            "properties": {
              "value": { "type": "number" },
              "cdf": { "type": "number", "minimum": 0, "maximum": 1 }
            }
          }
        }
      }
    },
    "monteCarloDistribution": {
      "type": "object",
      "required": ["type", "samples"],
      "properties": {
        "type": { "const": "monte_carlo" },
        "samples": {
          "type": "array",
          "items": { "type": "number" }
        },
        "metadata": {
          "type": "object",
          "properties": {
            "num_simulations": { "type": "integer", "minimum": 1 },
            "random_seed": { "type": "integer" }
          }
        }
      }
    }
  }
}
```

#### 5.1.2 Python Schema Validator

```python
# validation/schema_validator.py
"""
JSON Schema validation for risk projection data with
detailed error reporting and custom validators.
"""

import json
from typing import Dict, List, Any, Optional, Tuple
from jsonschema import Draft7Validator, ValidationError, FormatChecker
from jsonschema.exceptions import best_match
import structlog
from dataclasses import dataclass
from enum import Enum

logger = structlog.get_logger()

class ValidationSeverity(Enum):
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"

@dataclass
class ValidationResult:
    """Result of a validation operation."""
    is_valid: bool
    errors: List[Dict[str, Any]]
    warnings: List[Dict[str, Any]]
    data_quality_score: float  # 0.0 to 1.0

class ProjectionSchemaValidator:
    """
    Validates risk projection data against JSON Schema with
    additional custom validation rules.
    """
    
    # Load schema from file
    SCHEMA = json.load(open('schemas/risk-projection.json'))
    
    # Custom validation rules
    VALIDATION_RULES = {
        'probability_sum': {
            'description': 'Probabilities in histogram must sum to 1.0 (within tolerance)',
            'tolerance': 0.001
        },
        'monotonic_cdf': {
            'description': 'CDF values must be monotonically increasing'
        },
        'valid_percentiles': {
            'description': 'Percentile values must be within valid range'
        },
        'consistent_statistics': {
            'description': 'Computed statistics must match provided statistics'
        }
    }
    
    def __init__(self):
        self.validator = Draft7Validator(
            self.SCHEMA,
            format_checker=FormatChecker()
        )
        
    def validate(self, data: Dict, strict: bool = False) -> ValidationResult:
        """
        Validate projection data against schema and custom rules.
        
        Args:
            data: Projection data to validate
            strict: If True, warnings become errors
            
        Returns:
            ValidationResult with detailed error information
        """
        errors = []
        warnings = []
        
        # JSON Schema validation
        schema_errors = list(self.validator.iter_errors(data))
        for error in schema_errors:
            errors.append({
                'type': 'schema',
                'severity': ValidationSeverity.ERROR.value,
                'message': error.message,
                'path': list(error.path),
                'schema_path': list(error.schema_path)
            })
        
        # Custom validation rules
        custom_results = self._run_custom_validations(data)
        for result in custom_results:
            if result['severity'] == ValidationSeverity.ERROR.value or strict:
                errors.append(result)
            else:
                warnings.append(result)
        
        # Calculate quality score
        quality_score = self._calculate_quality_score(data, errors, warnings)
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            data_quality_score=quality_score
        )
    
    def _run_custom_validations(self, data: Dict) -> List[Dict]:
        """Run custom validation rules."""
        results = []
        
        distribution = data.get('distribution', {})
        dist_type = distribution.get('type')
        
        if dist_type == 'histogram':
            results.extend(self._validate_histogram(distribution))
        elif dist_type == 'parametric':
            results.extend(self._validate_parametric(distribution))
        elif dist_type == 'empirical_cdf':
            results.extend(self._validate_ecdf(distribution))
        elif dist_type == 'monte_carlo':
            results.extend(self._validate_monte_carlo(distribution))
        
        # Validate location if present
        if 'location' in data:
            results.extend(self._validate_location(data['location']))
        
        return results
    
    def _validate_histogram(self, distribution: Dict) -> List[Dict]:
        """Validate histogram distribution."""
        results = []
        bins = distribution.get('bins', {})
        
        # Check probability sum
        if 'probabilities' in bins:
            prob_sum = sum(bins['probabilities'])
            tolerance = self.VALIDATION_RULES['probability_sum']['tolerance']
            if abs(prob_sum - 1.0) > tolerance:
                results.append({
                    'type': 'custom',
                    'rule': 'probability_sum',
                    'severity': ValidationSeverity.ERROR.value,
                    'message': f'Probabilities sum to {prob_sum}, expected 1.0',
                    'path': ['distribution', 'bins', 'probabilities']
                })
        
        # Check array lengths match
        edges = bins.get('edges', [])
        counts = bins.get('counts', [])
        if len(edges) != len(counts) + 1:
            results.append({
                'type': 'custom',
                'rule': 'array_length_mismatch',
                'severity': ValidationSeverity.ERROR.value,
                'message': f'Expected {len(counts) + 1} edges for {len(counts)} bins',
                'path': ['distribution', 'bins']
            })
        
        # Check edges are monotonically increasing
        if edges:
            for i in range(1, len(edges)):
                if edges[i] <= edges[i-1]:
                    results.append({
                        'type': 'custom',
                        'rule': 'monotonic_edges',
                        'severity': ValidationSeverity.ERROR.value,
                        'message': f'Bin edges must be strictly increasing',
                        'path': ['distribution', 'bins', 'edges']
                    })
                    break
        
        return results
    
    def _validate_parametric(self, distribution: Dict) -> List[Dict]:
        """Validate parametric distribution."""
        results = []
        family = distribution.get('family')
        params = distribution.get('parameters', {})
        
        # Family-specific parameter validation
        if family == 'lognormal':
            if 'sigma' in params and params['sigma'] <= 0:
                results.append({
                    'type': 'custom',
                    'rule': 'invalid_parameter',
                    'severity': ValidationSeverity.ERROR.value,
                    'message': 'LogNormal sigma parameter must be positive',
                    'path': ['distribution', 'parameters', 'sigma']
                })
        
        elif family == 'normal':
            if 'sigma' in params and params['sigma'] <= 0:
                results.append({
                    'type': 'custom',
                    'rule': 'invalid_parameter',
                    'severity': ValidationSeverity.ERROR.value,
                    'message': 'Normal sigma parameter must be positive',
                    'path': ['distribution', 'parameters', 'sigma']
                })
        
        # Check goodness of fit if available
        gof = distribution.get('goodness_of_fit', {})
        if 'ks_p_value' in gof and gof['ks_p_value'] < 0.05:
            results.append({
                'type': 'custom',
                'rule': 'poor_fit',
                'severity': ValidationSeverity.WARNING.value,
                'message': f'Low goodness of fit (p-value: {gof["ks_p_value"]:.4f})',
                'path': ['distribution', 'goodness_of_fit', 'ks_p_value']
            })
        
        return results
    
    def _validate_ecdf(self, distribution: Dict) -> List[Dict]:
        """Validate empirical CDF distribution."""
        results = []
        samples = distribution.get('samples', [])
        
        if len(samples) < 2:
            results.append({
                'type': 'custom',
                'rule': 'insufficient_samples',
                'severity': ValidationSeverity.WARNING.value,
                'message': f'ECDF should have at least 100 samples, found {len(samples)}',
                'path': ['distribution', 'samples']
            })
        
        # Check CDF values are monotonically increasing
        cdf_values = [s['cdf'] for s in samples]
        for i in range(1, len(cdf_values)):
            if cdf_values[i] < cdf_values[i-1]:
                results.append({
                    'type': 'custom',
                    'rule': 'monotonic_cdf',
                    'severity': ValidationSeverity.ERROR.value,
                    'message': 'CDF values must be monotonically increasing',
                    'path': ['distribution', 'samples', i]
                })
                break
        
        # Check CDF values are within [0, 1]
        for i, cdf in enumerate(cdf_values):
            if cdf < 0 or cdf > 1:
                results.append({
                    'type': 'custom',
                    'rule': 'invalid_cdf',
                    'severity': ValidationSeverity.ERROR.value,
                    'message': f'CDF value {cdf} is outside valid range [0, 1]',
                    'path': ['distribution', 'samples', i, 'cdf']
                })
        
        return results
    
    def _validate_monte_carlo(self, distribution: Dict) -> List[Dict]:
        """Validate Monte Carlo distribution."""
        results = []
        samples = distribution.get('samples', [])
        metadata = distribution.get('metadata', {})
        
        # Check sample count matches metadata
        expected_count = metadata.get('num_simulations')
        if expected_count and len(samples) != expected_count:
            results.append({
                'type': 'custom',
                'rule': 'sample_count_mismatch',
                'severity': ValidationSeverity.WARNING.value,
                'message': f'Expected {expected_count} samples, found {len(samples)}',
                'path': ['distribution', 'samples']
            })
        
        # Check for NaN or infinite values
        nan_count = sum(1 for s in samples if s != s)  # NaN check
        inf_count = sum(1 for s in samples if abs(s) == float('inf'))
        
        if nan_count > 0:
            results.append({
                'type': 'custom',
                'rule': 'nan_values',
                'severity': ValidationSeverity.ERROR.value,
                'message': f'Found {nan_count} NaN values in samples',
                'path': ['distribution', 'samples']
            })
        
        if inf_count > 0:
            results.append({
                'type': 'custom',
                'rule': 'infinite_values',
                'severity': ValidationSeverity.ERROR.value,
                'message': f'Found {inf_count} infinite values in samples',
                'path': ['distribution', 'samples']
            })
        
        return results
    
    def _validate_location(self, location: Dict) -> List[Dict]:
        """Validate location data."""
        results = []
        
        lat = location.get('latitude')
        lon = location.get('longitude')
        
        # Check for valid coordinates
        if lat is not None and (lat < -90 or lat > 90):
            results.append({
                'type': 'custom',
                'rule': 'invalid_latitude',
                'severity': ValidationSeverity.ERROR.value,
                'message': f'Latitude {lat} is outside valid range [-90, 90]',
                'path': ['location', 'latitude']
            })
        
        if lon is not None and (lon < -180 or lon > 180):
            results.append({
                'type': 'custom',
                'rule': 'invalid_longitude',
                'severity': ValidationSeverity.ERROR.value,
                'message': f'Longitude {lon} is outside valid range [-180, 180]',
                'path': ['location', 'longitude']
            })
        
        # Check for suspicious coordinates (0, 0 is often a default/error)
        if lat == 0 and lon == 0:
            results.append({
                'type': 'custom',
                'rule': 'suspicious_coordinates',
                'severity': ValidationSeverity.WARNING.value,
                'message': 'Coordinates (0, 0) may indicate missing location data',
                'path': ['location']
            })
        
        return results
    
    def _calculate_quality_score(
        self,
        data: Dict,
        errors: List[Dict],
        warnings: List[Dict]
    ) -> float:
        """Calculate data quality score from 0.0 to 1.0."""
        score = 1.0
        
        # Deduct for errors
        score -= len(errors) * 0.2
        
        # Deduct for warnings
        score -= len(warnings) * 0.05
        
        # Check for completeness
        required_fields = ['asset_id', 'scenario', 'hazard', 'time_horizon', 'distribution']
        for field in required_fields:
            if field not in data or data[field] is None:
                score -= 0.1
        
        return max(0.0, min(1.0, score))


# FastAPI integration for automatic validation
from fastapi import FastAPI, Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

class ValidationMiddleware(BaseHTTPMiddleware):
    """Middleware to validate incoming projection data."""
    
    def __init__(self, app: FastAPI, validator: ProjectionSchemaValidator):
        super().__init__(app)
        self.validator = validator
    
    async def dispatch(self, request: Request, call_next):
        # Only validate POST/PUT requests with JSON body
        if request.method in ['POST', 'PUT'] and 'application/json' in request.headers.get('content-type', ''):
            body = await request.body()
            
            try:
                data = json.loads(body)
                result = self.validator.validate(data)
                
                if not result.is_valid:
                    raise HTTPException(
                        status_code=422,
                        detail={
                            'message': 'Validation failed',
                            'errors': result.errors,
                            'quality_score': result.data_quality_score
                        }
                    )
                
                # Store quality score in request state for logging
                request.state.quality_score = result.data_quality_score
                
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail='Invalid JSON')
        
        response = await call_next(request)
        return response
```

### 5.2 Data Quality Checks

```python
# validation/data_quality_checks.py
"""
Comprehensive data quality checks for risk projection data.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
import asyncpg
import structlog

logger = structlog.get_logger()

@dataclass
class QualityCheckResult:
    """Result of a data quality check."""
    check_name: str
    passed: bool
    severity: str  # 'critical', 'warning', 'info'
    details: Dict[str, Any]
    recommendation: str

class DataQualityChecker:
    """
    Performs comprehensive data quality checks on risk projection data.
    """
    
    def __init__(self, db_pool: asyncpg.Pool):
        self.db_pool = db_pool
        self.checks: Dict[str, Callable] = {
            'completeness': self._check_completeness,
            'consistency': self._check_consistency,
            'accuracy': self._check_accuracy,
            'timeliness': self._check_timeliness,
            'validity': self._check_validity,
            'uniqueness': self._check_uniqueness,
        }
    
    async def run_all_checks(
        self,
        table_name: str = 'stochastic_projections',
        sample_size: int = 10000
    ) -> List[QualityCheckResult]:
        """
        Run all data quality checks.
        
        Args:
            table_name: Table to check
            sample_size: Number of records to sample for checks
            
        Returns:
            List of quality check results
        """
        results = []
        
        for check_name, check_func in self.checks.items():
            try:
                result = await check_func(table_name, sample_size)
                results.append(result)
                logger.info(f"quality_check_completed", check=check_name, passed=result.passed)
            except Exception as e:
                logger.error(f"quality_check_failed", check=check_name, error=str(e))
                results.append(QualityCheckResult(
                    check_name=check_name,
                    passed=False,
                    severity='critical',
                    details={'error': str(e)},
                    recommendation='Investigate check implementation'
                ))
        
        return results
    
    async def _check_completeness(
        self,
        table_name: str,
        sample_size: int
    ) -> QualityCheckResult:
        """Check for missing/null values in critical fields."""
        async with self.db_pool.acquire() as conn:
            # Check null percentages
            null_checks = await conn.fetch(
                f"""
                SELECT 
                    COUNT(*) as total_count,
                    COUNT(asset_id) as asset_id_count,
                    COUNT(scenario_id) as scenario_count,
                    COUNT(hazard_type) as hazard_count,
                    COUNT(time_horizon) as horizon_count,
                    COUNT(distribution) as distribution_count,
                    COUNT(stat_mean) as mean_count,
                    COUNT(location) as location_count
                FROM {table_name}
                TABLESAMPLE SYSTEM (({sample_size} * 100.0 / NULLIF(COUNT(*), 0))::numeric)
                """
            )
            
            row = null_checks[0]
            total = row['total_count']
            
            completeness_scores = {
                'asset_id': row['asset_id_count'] / total,
                'scenario': row['scenario_count'] / total,
                'hazard': row['hazard_count'] / total,
                'time_horizon': row['horizon_count'] / total,
                'distribution': row['distribution_count'] / total,
                'statistics': row['mean_count'] / total,
                'location': row['location_count'] / total,
            }
            
            min_completeness = min(completeness_scores.values())
            passed = min_completeness >= 0.95  # 95% threshold
            
            critical_fields = ['asset_id', 'scenario', 'hazard', 'time_horizon', 'distribution']
            critical_missing = [f for f in critical_fields if completeness_scores[f] < 1.0]
            
            return QualityCheckResult(
                check_name='completeness',
                passed=passed and len(critical_missing) == 0,
                severity='critical' if critical_missing else 'warning',
                details={
                    'completeness_scores': completeness_scores,
                    'critical_fields_missing': critical_missing,
                    'sample_size': total
                },
                recommendation='Investigate source of missing data in critical fields'
            )
    
    async def _check_consistency(
        self,
        table_name: str,
        sample_size: int
    ) -> QualityCheckResult:
        """Check for internal consistency of data."""
        async with self.db_pool.acquire() as conn:
            # Check for inconsistent statistics
            inconsistency_query = await conn.fetch(
                f"""
                SELECT 
                    COUNT(*) as inconsistent_count,
                    COUNT(CASE WHEN stat_min > stat_max THEN 1 END) as min_max_error,
                    COUNT(CASE WHEN stat_var_95 < stat_var_90 THEN 1 END) as var_inversion,
                    COUNT(CASE WHEN stat_std_dev < 0 THEN 1 END) as negative_std,
                    COUNT(CASE WHEN stat_mean < stat_min OR stat_mean > stat_max THEN 1 END) as mean_outside_range
                FROM {table_name}
                WHERE valid_to IS NULL
                TABLESAMPLE SYSTEM (({sample_size} * 100.0 / NULLIF(COUNT(*), 0))::numeric)
                """
            )
            
            row = inconsistency_query[0]
            total_inconsistent = row['inconsistent_count']
            
            issues = []
            if row['min_max_error'] > 0:
                issues.append(f"{row['min_max_error']} records with min > max")
            if row['var_inversion'] > 0:
                issues.append(f"{row['var_inversion']} records with VaR inversion")
            if row['negative_std'] > 0:
                issues.append(f"{row['negative_std']} records with negative std dev")
            if row['mean_outside_range'] > 0:
                issues.append(f"{row['mean_outside_range']} records with mean outside range")
            
            passed = total_inconsistent == 0
            
            return QualityCheckResult(
                check_name='consistency',
                passed=passed,
                severity='critical' if not passed else 'info',
                details={
                    'inconsistent_records': total_inconsistent,
                    'specific_issues': issues
                },
                recommendation='Review data transformation logic for statistical consistency'
            )
    
    async def _check_accuracy(
        self,
        table_name: str,
        sample_size: int
    ) -> QualityCheckResult:
        """Check for accuracy by comparing with reference data."""
        async with self.db_pool.acquire() as conn:
            # Check for extreme values that might indicate errors
            extreme_values = await conn.fetch(
                f"""
                SELECT 
                    COUNT(CASE WHEN ABS(stat_mean) > 1000000 THEN 1 END) as extreme_mean,
                    COUNT(CASE WHEN stat_var_99 > 10000000 THEN 1 END) as extreme_var,
                    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY stat_mean) as p99_mean,
                    PERCENTILE_CONT(0.01) WITHIN GROUP (ORDER BY stat_mean) as p01_mean
                FROM {table_name}
                WHERE valid_to IS NULL
                """
            )
            
            row = extreme_values[0]
            extreme_count = row['extreme_mean'] + row['extreme_var']
            
            passed = extreme_count < (sample_size * 0.001)  # Less than 0.1% extreme values
            
            return QualityCheckResult(
                check_name='accuracy',
                passed=passed,
                severity='warning' if not passed else 'info',
                details={
                    'extreme_mean_count': row['extreme_mean'],
                    'extreme_var_count': row['extreme_var'],
                    'p99_mean': row['p99_mean'],
                    'p01_mean': row['p01_mean']
                },
                recommendation='Review extreme values for potential data entry errors'
            )
    
    async def _check_timeliness(
        self,
        table_name: str,
        sample_size: int
    ) -> QualityCheckResult:
        """Check data freshness and update frequency."""
        async with self.db_pool.acquire() as conn:
            freshness = await conn.fetch(
                f"""
                SELECT 
                    MAX(created_at) as latest_record,
                    MIN(created_at) as oldest_record,
                    COUNT(CASE WHEN created_at < NOW() - INTERVAL '7 days' THEN 1 END) as stale_records,
                    COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_records
                FROM {table_name}
                WHERE valid_to IS NULL
                """
            )
            
            row = freshness[0]
            latest = row['latest_record']
            stale_count = row['stale_records']
            recent_count = row['recent_records']
            
            # Check if data is being updated regularly
            hours_since_update = (datetime.utcnow() - latest).total_seconds() / 3600 if latest else float('inf')
            
            passed = hours_since_update < 48  # Data updated within 48 hours
            
            return QualityCheckResult(
                check_name='timeliness',
                passed=passed,
                severity='warning' if not passed else 'info',
                details={
                    'latest_record': latest.isoformat() if latest else None,
                    'oldest_record': row['oldest_record'].isoformat() if row['oldest_record'] else None,
                    'hours_since_update': hours_since_update,
                    'stale_records': stale_count,
                    'recent_records': recent_count
                },
                recommendation='Verify data ingestion pipeline is running correctly'
            )
    
    async def _check_validity(
        self,
        table_name: str,
        sample_size: int
    ) -> QualityCheckResult:
        """Check for valid values in enumerated fields."""
        async with self.db_pool.acquire() as conn:
            validity = await conn.fetch(
                f"""
                SELECT 
                    COUNT(CASE WHEN hazard_type NOT IN (
                        'flood', 'wildfire', 'hurricane', 'drought', 
                        'heatwave', 'sea_level_rise', 'storm_surge', 
                        'landslide', 'earthquake'
                    ) THEN 1 END) as invalid_hazard,
                    COUNT(CASE WHEN time_horizon < 2020 OR time_horizon > 2100 THEN 1 END) as invalid_horizon,
                    COUNT(CASE WHEN stat_mean IS NULL OR stat_mean != stat_mean THEN 1 END) as invalid_mean
                FROM {table_name}
                WHERE valid_to IS NULL
                """
            )
            
            row = validity[0]
            invalid_count = row['invalid_hazard'] + row['invalid_horizon'] + row['invalid_mean']
            
            passed = invalid_count == 0
            
            return QualityCheckResult(
                check_name='validity',
                passed=passed,
                severity='critical' if not passed else 'info',
                details={
                    'invalid_hazard_count': row['invalid_hazard'],
                    'invalid_horizon_count': row['invalid_horizon'],
                    'invalid_mean_count': row['invalid_mean']
                },
                recommendation='Implement stricter validation at ingestion time'
            )
    
    async def _check_uniqueness(
        self,
        table_name: str,
        sample_size: int
    ) -> QualityCheckResult:
        """Check for duplicate records."""
        async with self.db_pool.acquire() as conn:
            duplicates = await conn.fetch(
                f"""
                SELECT 
                    asset_id,
                    scenario_id,
                    hazard_type,
                    time_horizon,
                    COUNT(*) as duplicate_count
                FROM {table_name}
                WHERE valid_to IS NULL
                GROUP BY asset_id, scenario_id, hazard_type, time_horizon
                HAVING COUNT(*) > 1
                LIMIT 100
                """
            )
            
            duplicate_count = len(duplicates)
            passed = duplicate_count == 0
            
            return QualityCheckResult(
                check_name='uniqueness',
                passed=passed,
                severity='critical' if duplicate_count > 10 else 'warning',
                details={
                    'duplicate_groups': duplicate_count,
                    'sample_duplicates': [
                        {
                            'asset_id': str(d['asset_id']),
                            'scenario': d['scenario_id'],
                            'hazard': d['hazard_type'],
                            'time_horizon': d['time_horizon'],
                            'count': d['duplicate_count']
                        }
                        for d in duplicates[:5]
                    ]
                },
                recommendation='Implement unique constraint or deduplication logic'
            )


# Quality check reporting
class QualityReportGenerator:
    """Generates data quality reports."""
    
    def generate_report(self, results: List[QualityCheckResult]) -> Dict:
        """Generate comprehensive quality report."""
        total_checks = len(results)
        passed_checks = sum(1 for r in results if r.passed)
        critical_issues = sum(1 for r in results if not r.passed and r.severity == 'critical')
        warnings = sum(1 for r in results if not r.passed and r.severity == 'warning')
        
        overall_score = passed_checks / total_checks if total_checks > 0 else 0
        
        return {
            'summary': {
                'overall_score': overall_score,
                'total_checks': total_checks,
                'passed': passed_checks,
                'failed': total_checks - passed_checks,
                'critical_issues': critical_issues,
                'warnings': warnings
            },
            'checks': [
                {
                    'name': r.check_name,
                    'passed': r.passed,
                    'severity': r.severity,
                    'details': r.details,
                    'recommendation': r.recommendation
                }
                for r in results
            ],
            'generated_at': datetime.utcnow().isoformat()
        }
```

### 5.3 Anomaly Detection

```python
# validation/anomaly_detection.py
"""
Statistical anomaly detection for risk projection data.
"""

import numpy as np
import pandas as pd
from scipy import stats
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import structlog

logger = structlog.get_logger()

@dataclass
class AnomalyResult:
    """Result of anomaly detection."""
    is_anomaly: bool
    anomaly_score: float
    anomaly_type: str
    confidence: float
    details: Dict[str, Any]

class StatisticalAnomalyDetector:
    """
    Detects statistical anomalies in risk projection data.
    """
    
    def __init__(self, contamination: float = 0.01):
        self.contamination = contamination
        self.scaler = StandardScaler()
        self.isolation_forest = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
        )
        self.baseline_stats = {}
        
    def fit_baseline(self, data: pd.DataFrame):
        """
        Fit baseline statistics from historical data.
        
        Args:
            data: DataFrame with historical projection data
        """
        # Compute baseline statistics by scenario/hazard
        for (scenario, hazard), group in data.groupby(['scenario', 'hazard']):
            key = f"{scenario}_{hazard}"
            
            self.baseline_stats[key] = {
                'mean_mean': group['stat_mean'].mean(),
                'mean_std': group['stat_mean'].std(),
                'var95_mean': group['stat_var_95'].mean(),
                'var95_std': group['stat_var_95'].std(),
                'skewness_mean': group['stat_skewness'].mean(),
                'kurtosis_mean': group['stat_kurtosis'].mean(),
                'count': len(group)
            }
        
        # Fit isolation forest on scaled features
        features = data[['stat_mean', 'stat_std_dev', 'stat_var_95', 'stat_skewness', 'stat_kurtosis']].fillna(0)
        scaled_features = self.scaler.fit_transform(features)
        self.isolation_forest.fit(scaled_features)
        
        logger.info("baseline_fitted", scenarios=len(self.baseline_stats))
    
    def detect_anomalies(self, record: Dict) -> List[AnomalyResult]:
        """
        Detect anomalies in a single record.
        
        Args:
            record: Risk projection record
            
        Returns:
            List of detected anomalies
        """
        anomalies = []
        
        # Check against baseline statistics
        key = f"{record.get('scenario')}_{record.get('hazard')}"
        baseline = self.baseline_stats.get(key)
        
        if baseline:
            # Z-score anomaly detection
            mean_zscore = abs(record.get('stat_mean', 0) - baseline['mean_mean']) / baseline['mean_std']
            if mean_zscore > 3:
                anomalies.append(AnomalyResult(
                    is_anomaly=True,
                    anomaly_score=mean_zscore,
                    anomaly_type='statistical_outlier',
                    confidence=min(mean_zscore / 5, 1.0),
                    details={
                        'field': 'stat_mean',
                        'value': record.get('stat_mean'),
                        'expected_range': [
                            baseline['mean_mean'] - 3 * baseline['mean_std'],
                            baseline['mean_mean'] + 3 * baseline['mean_std']
                        ],
                        'z_score': mean_zscore
                    }
                ))
            
            # VaR anomaly detection
            var_zscore = abs(record.get('stat_var_95', 0) - baseline['var95_mean']) / baseline['var95_std']
            if var_zscore > 3:
                anomalies.append(AnomalyResult(
                    is_anomaly=True,
                    anomaly_score=var_zscore,
                    anomaly_type='var_outlier',
                    confidence=min(var_zscore / 5, 1.0),
                    details={
                        'field': 'stat_var_95',
                        'value': record.get('stat_var_95'),
                        'expected_range': [
                            baseline['var95_mean'] - 3 * baseline['var95_std'],
                            baseline['var95_mean'] + 3 * baseline['var95_std']
                        ],
                        'z_score': var_zscore
                    }
                ))
        
        # Isolation forest anomaly detection
        features = np.array([[
            record.get('stat_mean', 0),
            record.get('stat_std_dev', 0),
            record.get('stat_var_95', 0),
            record.get('stat_skewness', 0),
            record.get('stat_kurtosis', 0)
        ]])
        
        scaled_features = self.scaler.transform(features)
        anomaly_score = -self.isolation_forest.score_samples(scaled_features)[0]
        is_anomaly = self.isolation_forest.predict(scaled_features)[0] == -1
        
        if is_anomaly:
            anomalies.append(AnomalyResult(
                is_anomaly=True,
                anomaly_score=anomaly_score,
                anomaly_type='multivariate_outlier',
                confidence=min(anomaly_score, 1.0),
                details={
                    'isolation_score': anomaly_score,
                    'features': ['stat_mean', 'stat_std_dev', 'stat_var_95', 'stat_skewness', 'stat_kurtosis']
                }
            ))
        
        return anomalies


class DriftDetector:
    """
    Detects data drift over time.
    """
    
    def __init__(self, window_size: int = 30):
        self.window_size = window_size
        self.reference_distribution = None
        
    def set_reference(self, data: pd.DataFrame):
        """Set reference distribution for drift detection."""
        self.reference_distribution = {
            'mean': data['stat_mean'].mean(),
            'std': data['stat_mean'].std(),
            'quantiles': data['stat_mean'].quantile([0.1, 0.25, 0.5, 0.75, 0.9]).to_dict()
        }
    
    def detect_drift(self, current_data: pd.DataFrame) -> Dict:
        """
        Detect drift between reference and current data.
        
        Returns:
            Dictionary with drift metrics
        """
        if self.reference_distribution is None:
            raise ValueError("Reference distribution not set")
        
        current_mean = current_data['stat_mean'].mean()
        current_std = current_data['stat_mean'].std()
        
        # Kolmogorov-Smirnov test
        ks_stat, ks_pvalue = stats.ks_2samp(
            current_data['stat_mean'].dropna(),
            [self.reference_distribution['mean']] * len(current_data)  # Approximate
        )
        
        # Population Stability Index (PSI)
        current_quantiles = current_data['stat_mean'].quantile([0.1, 0.25, 0.5, 0.75, 0.9])
        ref_quantiles = pd.Series(self.reference_distribution['quantiles'])
        
        psi = self._calculate_psi(ref_quantiles, current_quantiles)
        
        # Determine drift severity
        if psi < 0.1:
            drift_level = 'none'
        elif psi < 0.2:
            drift_level = 'moderate'
        else:
            drift_level = 'significant'
        
        return {
            'drift_detected': psi > 0.1 or ks_pvalue < 0.05,
            'drift_level': drift_level,
            'psi': psi,
            'ks_statistic': ks_stat,
            'ks_pvalue': ks_pvalue,
            'mean_shift': (current_mean - self.reference_distribution['mean']) / self.reference_distribution['std'],
            'std_ratio': current_std / self.reference_distribution['std'],
            'reference_mean': self.reference_distribution['mean'],
            'current_mean': current_mean
        }
    
    def _calculate_psi(self, expected: pd.Series, actual: pd.Series) -> float:
        """Calculate Population Stability Index."""
        # Avoid division by zero
        expected = expected.replace(0, 0.0001)
        actual = actual.replace(0, 0.0001)
        
        psi = np.sum((actual - expected) * np.log(actual / expected))
        return float(psi)
```

---

## 6. Monitoring and Alerting

### 6.1 Pipeline Health Metrics

```yaml
# monitoring/prometheus-rules.yaml
---
groups:
  - name: riskthinking_pipeline_health
    interval: 30s
    rules:
      # Ingestion Latency
      - alert: HighIngestionLatency
        expr: |
          histogram_quantile(0.95, 
            rate(ingestion_request_duration_seconds_bucket[5m])
          ) > 30
        for: 5m
        labels:
          severity: warning
          team: data-engineering
        annotations:
          summary: "High ingestion latency detected"
          description: "95th percentile ingestion latency is {{ $value }}s, exceeding 30s threshold"
      
      - alert: CriticalIngestionLatency
        expr: |
          histogram_quantile(0.95, 
            rate(ingestion_request_duration_seconds_bucket[5m])
          ) > 60
        for: 2m
        labels:
          severity: critical
          team: data-engineering
        annotations:
          summary: "Critical ingestion latency"
          description: "95th percentile ingestion latency is {{ $value }}s, exceeding 60s threshold"
      
      # Processing Throughput
      - alert: LowProcessingThroughput
        expr: |
          rate(projections_processed_total[5m]) < 1000
        for: 10m
        labels:
          severity: warning
          team: data-engineering
        annotations:
          summary: "Low processing throughput"
          description: "Processing rate is {{ $value }} projections/sec, below 1000/sec threshold"
      
      # Error Rates
      - alert: HighErrorRate
        expr: |
          (
            rate(ingestion_errors_total[5m]) /
            rate(ingestion_requests_total[5m])
          ) > 0.05
        for: 5m
        labels:
          severity: warning
          team: data-engineering
        annotations:
          summary: "High ingestion error rate"
          description: "Error rate is {{ $value | humanizePercentage }}, exceeding 5% threshold"
      
      - alert: CriticalErrorRate
        expr: |
          (
            rate(ingestion_errors_total[5m]) /
            rate(ingestion_requests_total[5m])
          ) > 0.10
        for: 2m
        labels:
          severity: critical
          team: data-engineering
        annotations:
          summary: "Critical ingestion error rate"
          description: "Error rate is {{ $value | humanizePercentage }}, exceeding 10% threshold"
      
      # Queue Depth
      - alert: LargeQueueBacklog
        expr: |
          celery_queue_length{queue="ingestion"} > 10000
        for: 5m
        labels:
          severity: warning
          team: data-engineering
        annotations:
          summary: "Large ingestion queue backlog"
          description: "Queue depth is {{ $value }} tasks, exceeding 10,000 threshold"
      
      # Dead Letter Queue
      - alert: DeadLetterQueueNotEmpty
        expr: |
          celery_queue_length{queue="dlq"} > 0
        for: 1m
        labels:
          severity: warning
          team: data-engineering
        annotations:
          summary: "Dead letter queue has messages"
          description: "DLQ contains {{ $value }} failed messages requiring investigation"

  - name: data_freshness
    interval: 60s
    rules:
      # Data Freshness
      - alert: StaleProjectionData
        expr: |
          (
            time() - max(stochastic_projections_last_update_timestamp) /
          ) > 86400
        for: 5m
        labels:
          severity: warning
          team: data-engineering
        annotations:
          summary: "Projection data is stale"
          description: "Last projection update was {{ $value | humanizeDuration }} ago"
      
      # Materialized View Freshness
      - alert: StaleMaterializedViews
        expr: |
          (
            time() - max(view_refresh_log_refresh_time) /
          ) > 21600
        for: 5m
        labels:
          severity: warning
          team: data-engineering
        annotations:
          summary: "Materialized views are stale"
          description: "Last view refresh was {{ $value | humanizeDuration }} ago"

  - name: api_quota_tracking
    interval: 60s
    rules:
      # API Quota Usage
      - alert: HighAPIQuotaUsage
        expr: |
          (riskthinking_api_calls_total / riskthinking_api_quota_limit) > 0.8
        for: 5m
        labels:
          severity: warning
          team: data-engineering
        annotations:
          summary: "High API quota usage"
          description: "API quota usage is {{ $value | humanizePercentage }} of daily limit"
      
      - alert: CriticalAPIQuotaUsage
        expr: |
          (riskthinking_api_calls_total / riskthinking_api_quota_limit) > 0.95
        for: 2m
        labels:
          severity: critical
          team: data-engineering
        annotations:
          summary: "Critical API quota usage"
          description: "API quota usage is {{ $value | humanizePercentage }} of daily limit. Throttling imminent."
      
      # Rate Limiting
      - alert: APIRateLimitHit
        expr: |
          increase(riskthinking_api_rate_limit_errors_total[5m]) > 0
        for: 1m
        labels:
          severity: warning
          team: data-engineering
        annotations:
          summary: "API rate limit hit"
          description: "Rate limit errors detected in the last 5 minutes"

  - name: infrastructure_health
    interval: 30s
    rules:
      # Database Health
      - alert: HighDatabaseConnections
        expr: |
          pg_stat_activity_count > 800
        for: 5m
        labels:
          severity: warning
          team: data-engineering
        annotations:
          summary: "High database connection count"
          description: "Database has {{ $value }} active connections"
      
      - alert: DatabaseReplicationLag
        expr: |
          pg_replication_lag_seconds > 300
        for: 5m
        labels:
          severity: warning
          team: data-engineering
        annotations:
          summary: "Database replication lag"
          description: "Replication lag is {{ $value }}s, exceeding 5 minute threshold"
      
      # Redis Health
      - alert: RedisMemoryHigh
        expr: |
          (redis_memory_used_bytes / redis_memory_max_bytes) > 0.85
        for: 5m
        labels:
          severity: warning
          team: data-engineering
        annotations:
          summary: "Redis memory usage high"
          description: "Redis memory usage is {{ $value | humanizePercentage }}"
      
      - alert: RedisCacheHitRateLow
        expr: |
          (
            rate(redis_keyspace_hits_total[5m]) /
            (rate(redis_keyspace_hits_total[5m]) + rate(redis_keyspace_misses_total[5m]))
          ) < 0.80
        for: 10m
        labels:
          severity: warning
          team: data-engineering
        annotations:
          summary: "Redis cache hit rate low"
          description: "Cache hit rate is {{ $value | humanizePercentage }}, below 80% threshold"
      
      # Kafka Health
      - alert: KafkaConsumerLag
        expr: |
          kafka_consumer_group_lag > 100000
        for: 5m
        labels:
          severity: warning
          team: data-engineering
        annotations:
          summary: "Kafka consumer lag high"
          description: "Consumer lag is {{ $value }} messages"
      
      # Disk Space
      - alert: DiskSpaceLow
        expr: |
          (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.15
        for: 5m
        labels:
          severity: critical
          team: data-engineering
        annotations:
          summary: "Disk space low"
          description: "Disk usage is {{ $value | humanizePercentage }} available"
```

### 6.2 Custom Metrics Collection

```python
# monitoring/metrics_collector.py
"""
Custom metrics collection for the risk data pipeline.
"""

from prometheus_client import Counter, Histogram, Gauge, Info, CollectorRegistry
from prometheus_client.exposition import generate_latest
import time
from functools import wraps
from typing import Callable, Optional
import structlog

logger = structlog.get_logger()

# Create a custom registry
REGISTRY = CollectorRegistry()

# Ingestion metrics
INGESTION_REQUESTS = Counter(
    'ingestion_requests_total',
    'Total ingestion requests',
    ['method', 'endpoint', 'status'],
    registry=REGISTRY
)

INGESTION_ERRORS = Counter(
    'ingestion_errors_total',
    'Total ingestion errors',
    ['error_type', 'endpoint'],
    registry=REGISTRY
)

INGESTION_DURATION = Histogram(
    'ingestion_request_duration_seconds',
    'Ingestion request duration',
    ['method', 'endpoint'],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0],
    registry=REGISTRY
)

PROJECTIONS_PROCESSED = Counter(
    'projections_processed_total',
    'Total projections processed',
    ['scenario', 'hazard', 'status'],
    registry=REGISTRY
)

# Data quality metrics
DATA_QUALITY_SCORE = Gauge(
    'data_quality_score',
    'Data quality score (0-1)',
    ['table', 'check_type'],
    registry=REGISTRY
)

VALIDATION_FAILURES = Counter(
    'validation_failures_total',
    'Total validation failures',
    ['validation_type', 'field'],
    registry=REGISTRY
)

ANOMALIES_DETECTED = Counter(
    'anomalies_detected_total',
    'Total anomalies detected',
    ['anomaly_type', 'severity'],
    registry=REGISTRY
)

# Pipeline metrics
PIPELINE_STAGE_DURATION = Histogram(
    'pipeline_stage_duration_seconds',
    'Pipeline stage duration',
    ['stage'],
    buckets=[1.0, 5.0, 10.0, 30.0, 60.0, 300.0, 600.0, 1800.0],
    registry=REGISTRY
)

QUEUE_DEPTH = Gauge(
    'celery_queue_length',
    'Current queue depth',
    ['queue'],
    registry=REGISTRY
)

BATCH_SIZE = Histogram(
    'ingestion_batch_size',
    'Size of ingestion batches',
    buckets=[10, 50, 100, 500, 1000, 5000, 10000],
    registry=REGISTRY
)

# Cache metrics
CACHE_HITS = Counter(
    'cache_hits_total',
    'Total cache hits',
    ['cache_type', 'cache_name'],
    registry=REGISTRY
)

CACHE_MISSES = Counter(
    'cache_misses_total',
    'Total cache misses',
    ['cache_type', 'cache_name'],
    registry=REGISTRY
)

CACHE_OPERATION_DURATION = Histogram(
    'cache_operation_duration_seconds',
    'Cache operation duration',
    ['operation', 'cache_type'],
    buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
    registry=REGISTRY
)

# API quota metrics
API_CALLS = Counter(
    'riskthinking_api_calls_total',
    'Total API calls made',
    ['endpoint', 'status'],
    registry=REGISTRY
)

API_QUOTA_USAGE = Gauge(
    'riskthinking_api_quota_usage',
    'Current API quota usage percentage',
    registry=REGISTRY
)

API_RATE_LIMIT_ERRORS = Counter(
    'riskthinking_api_rate_limit_errors_total',
    'Total rate limit errors',
    registry=REGISTRY
)

# Database metrics
DB_QUERY_DURATION = Histogram(
    'db_query_duration_seconds',
    'Database query duration',
    ['query_type', 'table'],
    buckets=[0.001, 0.01, 0.1, 0.5, 1.0, 5.0, 10.0, 30.0],
    registry=REGISTRY
)

DB_CONNECTIONS = Gauge(
    'db_active_connections',
    'Current active database connections',
    ['database', 'state'],
    registry=REGISTRY
)

# System info
SYSTEM_INFO = Info(
    'riskthinking_pipeline',
    'Pipeline information',
    registry=REGISTRY
)


class MetricsCollector:
    """Centralized metrics collection for the pipeline."""
    
    def __init__(self):
        self.registry = REGISTRY
        
    def record_ingestion(
        self,
        method: str,
        endpoint: str,
        status: str,
        duration: float
    ):
        """Record ingestion metrics."""
        INGESTION_REQUESTS.labels(
            method=method,
            endpoint=endpoint,
            status=status
        ).inc()
        
        INGESTION_DURATION.labels(
            method=method,
            endpoint=endpoint
        ).observe(duration)
    
    def record_projection_processed(
        self,
        scenario: str,
        hazard: str,
        status: str = 'success'
    ):
        """Record projection processing."""
        PROJECTIONS_PROCESSED.labels(
            scenario=scenario,
            hazard=hazard,
            status=status
        ).inc()
    
    def record_validation_failure(
        self,
        validation_type: str,
        field: str
    ):
        """Record validation failure."""
        VALIDATION_FAILURES.labels(
            validation_type=validation_type,
            field=field
        ).inc()
    
    def record_anomaly(
        self,
        anomaly_type: str,
        severity: str
    ):
        """Record detected anomaly."""
        ANOMALIES_DETECTED.labels(
            anomaly_type=anomaly_type,
            severity=severity
        ).inc()
    
    def update_data_quality_score(
        self,
        table: str,
        check_type: str,
        score: float
    ):
        """Update data quality score."""
        DATA_QUALITY_SCORE.labels(
            table=table,
            check_type=check_type
        ).set(score)
    
    def update_queue_depth(self, queue: str, depth: int):
        """Update queue depth gauge."""
        QUEUE_DEPTH.labels(queue=queue).set(depth)
    
    def record_cache_operation(
        self,
        operation: str,
        cache_type: str,
        hit: bool,
        duration: float
    ):
        """Record cache operation."""
        CACHE_OPERATION_DURATION.labels(
            operation=operation,
            cache_type=cache_type
        ).observe(duration)
        
        if hit:
            CACHE_HITS.labels(
                cache_type=cache_type,
                cache_name='default'
            ).inc()
        else:
            CACHE_MISSES.labels(
                cache_type=cache_type,
                cache_name='default'
            ).inc()
    
    def record_api_call(
        self,
        endpoint: str,
        status: str
    ):
        """Record API call."""
        API_CALLS.labels(
            endpoint=endpoint,
            status=status
        ).inc()
    
    def update_api_quota(self, usage_percent: float):
        """Update API quota usage."""
        API_QUOTA_USAGE.set(usage_percent)
    
    def record_rate_limit_error(self):
        """Record rate limit error."""
        API_RATE_LIMIT_ERRORS.inc()
    
    def get_metrics(self) -> bytes:
        """Get metrics in Prometheus exposition format."""
        return generate_latest(self.registry)


# Decorator for automatic metrics collection
def timed_metric(metric: Histogram, labels: dict = None):
    """Decorator to time function execution and record to histogram."""
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                status = 'success'
                return result
            except Exception as e:
                status = 'error'
                raise
            finally:
                duration = time.time() - start_time
                label_values = labels or {}
                metric.labels(**label_values).observe(duration)
        return wrapper
    return decorator


def count_metric(metric: Counter, labels: dict = None):
    """Decorator to count function calls."""
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            label_values = labels or {}
            metric.labels(**label_values).inc()
            return func(*args, **kwargs)
        return wrapper
    return decorator
```

### 6.3 Alerting Configuration

```yaml
# monitoring/alertmanager-config.yaml
---
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@aaimpact.com'
  smtp_auth_username: 'alerts@aaimpact.com'
  smtp_auth_password: '{{ .Env.SMTP_PASSWORD }}'
  
  slack_api_url: '{{ .Env.SLACK_WEBHOOK_URL }}'
  pagerduty_url: 'https://events.pagerduty.com/v2/enqueue'
  opsgenie_api_url: 'https://api.opsgenie.com/'

route:
  receiver: 'default'
  group_by: ['alertname', 'severity', 'team']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  
  routes:
    # Critical alerts - immediate notification
    - match:
        severity: critical
      receiver: 'critical-alerts'
      group_wait: 0s
      repeat_interval: 15m
      continue: true
    
    # Data engineering team alerts
    - match:
        team: data-engineering
      receiver: 'data-engineering'
      group_wait: 1m
      repeat_interval: 2h
    
    # Pipeline-specific alerts
    - match_re:
        alertname: '.*Ingestion.*|.*Pipeline.*|.*Queue.*'
      receiver: 'pipeline-alerts'
      group_wait: 30s
      repeat_interval: 1h
    
    # Data quality alerts
    - match_re:
        alertname: '.*Quality.*|.*Validation.*|.*Anomaly.*'
      receiver: 'data-quality-alerts'
      group_wait: 5m
      repeat_interval: 6h

receivers:
  - name: 'default'
    email_configs:
      - to: 'oncall@aaimpact.com'
        subject: '{{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Severity: {{ .Labels.severity }}
          Time: {{ .StartsAt }}
          {{ end }}

  - name: 'critical-alerts'
    pagerduty_configs:
      - service_key: '{{ .Env.PAGERDUTY_SERVICE_KEY }}'
        severity: critical
        description: '{{ .GroupLabels.alertname }}'
        details:
          summary: '{{ .CommonAnnotations.summary }}'
          description: '{{ .CommonAnnotations.description }}'
    
    slack_configs:
      - channel: '#critical-alerts'
        title: 'CRITICAL: {{ .GroupLabels.alertname }}'
        text: |
          {{ range .Alerts }}
          *{{ .Annotations.summary }}*
          {{ .Annotations.description }}
          {{ end }}
        send_resolved: true
    
    email_configs:
      - to: 'oncall@aaimpact.com,data-leads@aaimpact.com'
        subject: '[CRITICAL] {{ .GroupLabels.alertname }}'
        priority: high

  - name: 'data-engineering'
    slack_configs:
      - channel: '#data-engineering-alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: |
          {{ range .Alerts }}
          *{{ .Annotations.summary }}*
          {{ .Annotations.description }}
          Labels: {{ .Labels }}
          {{ end }}
        send_resolved: true
    
    email_configs:
      - to: 'data-engineering@aaimpact.com'
        subject: '[Data Engineering] {{ .GroupLabels.alertname }}'

  - name: 'pipeline-alerts'
    slack_configs:
      - channel: '#pipeline-alerts'
        title: 'Pipeline Alert: {{ .GroupLabels.alertname }}'
        text: |
          {{ range .Alerts }}
          *{{ .Annotations.summary }}*
          {{ .Annotations.description }}
          {{ end }}
        send_resolved: true

  - name: 'data-quality-alerts'
    slack_configs:
      - channel: '#data-quality'
        title: 'Data Quality: {{ .GroupLabels.alertname }}'
        text: |
          {{ range .Alerts }}
          *{{ .Annotations.summary }}*
          {{ .Annotations.description }}
          {{ end }}
        send_resolved: true
    
    email_configs:
      - to: 'data-quality@aaimpact.com'
        subject: '[Data Quality] {{ .GroupLabels.alertname }}'

inhibit_rules:
  # Inhibit warning alerts if critical alert is firing
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
  
  # Inhibit info alerts if warning is firing
  - source_match:
      severity: 'warning'
    target_match:
      severity: 'info'
    equal: ['alertname', 'instance']
```

### 6.4 Grafana Dashboards

```json
{
  "dashboard": {
    "title": "RiskThinking Pipeline Monitoring",
    "tags": ["risk", "pipeline", "monitoring"],
    "timezone": "UTC",
    "schemaVersion": 36,
    "refresh": "30s",
    "panels": [
      {
        "id": 1,
        "title": "Ingestion Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(ingestion_requests_total[5m])",
            "legendFormat": "{{ method }} {{ endpoint }}"
          }
        ],
        "yAxes": [
          {
            "label": "Requests/sec"
          }
        ],
        "alert": {
          "name": "Ingestion Rate Drop",
          "conditions": [
            {
              "query": {"queryType": "", "refId": "A"},
              "reducer": {"type": "avg", "params": []},
              "evaluator": {"params": [100], "type": "lt"}
            }
          ]
        }
      },
      {
        "id": 2,
        "title": "Ingestion Latency (p95)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(ingestion_request_duration_seconds_bucket[5m]))",
            "legendFormat": "{{ endpoint }}"
          }
        ],
        "yAxes": [
          {
            "label": "Seconds",
            "format": "s"
          }
        ]
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(ingestion_errors_total[5m]) / rate(ingestion_requests_total[5m])",
            "legendFormat": "Error Rate"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                {"color": "green", "value": 0},
                {"color": "yellow", "value": 0.05},
                {"color": "red", "value": 0.10}
              ]
            },
            "unit": "percentunit"
          }
        }
      },
      {
        "id": 4,
        "title": "Projections Processed",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(projections_processed_total[5m])",
            "legendFormat": "{{ scenario }} - {{ hazard }}"
          }
        ],
        "yAxes": [
          {
            "label": "Projections/sec"
          }
        ]
      },
      {
        "id": 5,
        "title": "Queue Depth",
        "type": "graph",
        "targets": [
          {
            "expr": "celery_queue_length",
            "legendFormat": "{{ queue }}"
          }
        ],
        "yAxes": [
          {
            "label": "Tasks"
          }
        ],
        "alert": {
          "name": "High Queue Depth",
          "conditions": [
            {
              "query": {"queryType": "", "refId": "A"},
              "reducer": {"type": "max", "params": []},
              "evaluator": {"params": [10000], "type": "gt"}
            }
          ]
        }
      },
      {
        "id": 6,
        "title": "Data Quality Score",
        "type": "gauge",
        "targets": [
          {
            "expr": "data_quality_score",
            "legendFormat": "{{ table }} - {{ check_type }}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "min": 0,
            "max": 1,
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "yellow", "value": 0.7},
                {"color": "green", "value": 0.9}
              ]
            }
          }
        }
      },
      {
        "id": 7,
        "title": "API Quota Usage",
        "type": "stat",
        "targets": [
          {
            "expr": "riskthinking_api_quota_usage",
            "legendFormat": "Quota Usage"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                {"color": "green", "value": 0},
                {"color": "yellow", "value": 0.8},
                {"color": "red", "value": 0.95}
              ]
            },
            "unit": "percentunit"
          }
        }
      },
      {
        "id": 8,
        "title": "Cache Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))",
            "legendFormat": "Cache Hit Rate"
          }
        ],
        "yAxes": [
          {
            "label": "Hit Rate",
            "format": "percentunit"
          }
        ]
      },
      {
        "id": 9,
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "db_active_connections",
            "legendFormat": "{{ database }} - {{ state }}"
          }
        ],
        "yAxes": [
          {
            "label": "Connections"
          }
        ]
      },
      {
        "id": 10,
        "title": "Pipeline Stage Duration",
        "type": "heatmap",
        "targets": [
          {
            "expr": "pipeline_stage_duration_seconds_bucket",
            "legendFormat": "{{ stage }}"
          }
        ],
        "dataFormat": "tsbuckets"
      }
    ]
  }
}
```

### 6.5 Log Aggregation and Analysis

```yaml
# monitoring/fluentd-config.yaml
---
# Fluentd configuration for log aggregation
<source>
  @type tail
  path /var/log/riskthinking/*.log
  pos_file /var/log/fluentd/riskthinking.log.pos
  tag riskthinking.application
  <parse>
    @type json
    time_key timestamp
    time_format %Y-%m-%dT%H:%M:%S.%NZ
  </parse>
</source>

<source>
  @type tail
  path /var/log/riskthinking/ingestion/*.log
  pos_file /var/log/fluentd/ingestion.log.pos
  tag riskthinking.ingestion
  <parse>
    @type json
    time_key timestamp
    time_format %Y-%m-%dT%H:%M:%S.%NZ
  </parse>
</source>

<source>
  @type tail
  path /var/log/postgresql/*.log
  pos_file /var/log/fluentd/postgresql.log.pos
  tag riskthinking.database
  <parse>
    @type regexp
    expression /^(?<time>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \w+ \[(?<pid>\d+)\]: (?<level>\w+):\s+(?<message>.*)$/
  </parse>
</source>

# Filter and enrich logs
<filter riskthinking.**>
  @type record_transformer
  <record>
    hostname ${hostname}
    environment ${ENV['ENVIRONMENT']}
    service riskthinking-pipeline
  </record>
</filter>

# Parse structured logs
<filter riskthinking.**>
  @type parser
  format json
  key_name message
  reserve_data true
  <parse>
    @type json
  </parse>
</filter>

# Output to Elasticsearch
<match riskthinking.**>
  @type elasticsearch
  host elasticsearch
  port 9200
  index_name riskthinking-logs
  type_name _doc
  logstash_format true
  logstash_prefix riskthinking
  <buffer>
    @type file
    path /var/log/fluentd/buffers
    flush_interval 10s
    retry_max_interval 300
    chunk_limit_size 8M
    queue_limit_length 256
  </buffer>
</match>

# Also output to S3 for archival
<match riskthinking.**>
  @type s3
  aws_key_id ${AWS_ACCESS_KEY_ID}
  aws_sec_key ${AWS_SECRET_ACCESS_KEY}
  s3_bucket aa-impact-logs
  s3_region us-east-1
  path logs/riskthinking/%Y/%m/%d/
  time_slice_format %Y%m%d%H
  <buffer time>
    @type file
    path /var/log/fluentd/s3-buffer
    timekey 3600
    timekey_wait 10m
    chunk_limit_size 256m
  </buffer>
</match>
```

---

## 7. Summary and Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           RISKTHTINKING.AI INTEGRATION - COMPLETE ARCHITECTURE              │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              DATA SOURCES                                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │   │
│  │  │ RiskThinking │  │ RiskThinking │  │ RiskThinking │  │ Batch Export │            │   │
│  │  │ API (REST)   │  │ API (Stream) │  │ WebSocket    │  │ (S3/Parquet) │            │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │   │
│  └─────────┼─────────────────┼─────────────────┼─────────────────┼────────────────────┘   │
│            │                 │                 │                 │                        │
│  ┌─────────┴─────────────────┴─────────────────┴─────────────────┴────────────────────┐   │
│  │                              INGESTION LAYER                                        │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐   │   │
│  │  │  API Gateway (Nginx/HAProxy) → Load Balancing, SSL, Rate Limiting           │   │   │
│  │  └─────────────────────────────────────────────────────────────────────────────┘   │   │
│  │                                    │                                                │   │
│  │  ┌─────────────────────────────────▼──────────────────────────────────────────┐   │   │
│  │  │  Ingestion Service (FastAPI)                                               │   │   │
│  │  │  • Connection Pooling (HTTP/2)                                             │   │   │
│  │  │  • Circuit Breaker (PyCircuitBreaker)                                      │   │   │
│  │  │  • Retry Logic (Tenacity)                                                  │   │   │
│  │  │  • Auth Management (AWS Secrets Manager)                                   │   │   │
│  │  └─────────────────────────────────┬──────────────────────────────────────────┘   │   │
│  │                                    │                                                │   │
│  │  ┌─────────────────────────────────▼──────────────────────────────────────────┐   │   │
│  │  │  Message Queue (Redis/RabbitMQ)                                            │   │   │
│  │  │  • Priority Queues (High/Medium/Low)                                       │   │   │
│  │  │  • Dead Letter Queue                                                       │   │   │
│  │  └─────────────────────────────────┬──────────────────────────────────────────┘   │   │
│  └────────────────────────────────────┼───────────────────────────────────────────────┘   │
│                                       │                                                   │
│  ┌────────────────────────────────────┼───────────────────────────────────────────────┐   │
│  │                         PROCESSING LAYER                                            │   │
│  │  ┌─────────────────────────────────▼──────────────────────────────────────────┐   │   │
│  │  │  Stream Processing (Apache Flink / Spark Streaming)                        │   │   │
│  │  │  • Validation (JSON Schema)                                                │   │   │
│  │  │  • Enrichment (Geohash, H3)                                                │   │   │
│  │  │  • Aggregation (Windowing)                                                 │   │   │
│  │  └─────────────────────────────────┬──────────────────────────────────────────┘   │   │
│  │                                    │                                                │   │
│  │  ┌─────────────────────────────────▼──────────────────────────────────────────┐   │   │
│  │  │  Batch Processing (Apache Spark on EMR)                                    │   │   │
│  │  │  • Nightly Portfolio Runs                                                  │   │   │
│  │  │  • Scenario Updates                                                        │   │   │
│  │  │  • Full Recalculations                                                     │   │   │
│  │  └─────────────────────────────────┬──────────────────────────────────────────┘   │   │
│  └────────────────────────────────────┼───────────────────────────────────────────────┘   │
│                                       │                                                   │
│  ┌────────────────────────────────────┼───────────────────────────────────────────────┐   │
│  │                           STORAGE LAYER                                             │   │
│  │  ┌─────────────────────────────────▼──────────────────────────────────────────┐   │   │
│  │  │  HOT TIER                                                                  │   │   │
│  │  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │   │   │
│  │  │  │ Redis Cluster   │  │ PostgreSQL      │  │ TimescaleDB     │            │   │   │
│  │  │  │ (Cache Layer)   │  │ (Primary DB)    │  │ (Time Series)   │            │   │   │
│  │  │  │ • Hot data      │  │ • Projections   │  │ • Metrics       │            │   │   │
│  │  │  │ • Query results │  │ • JSONB storage │  │ • Time-series   │            │   │   │
│  │  │  │ • Sessions      │  │ • PostGIS       │  │                 │            │   │   │
│  │  │  └─────────────────┘  └─────────────────┘  └─────────────────┘            │   │   │
│  │  └──────────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                                  │   │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐   │   │
│  │  │  WARM TIER                                                               │   │   │
│  │  │  ┌─────────────────────────────────────────────────────────────────┐    │   │   │
│  │  │  │ Delta Lake on S3                                                │    │   │   │
│  │  │  │ • Partitioned Parquet (Snappy)                                  │    │   │   │
│  │  │  │ • H3/Quadtree spatial partitioning                              │    │   │   │
│  │  │  │ • Versioning & Time Travel                                      │    │   │   │
│  │  │  │ • Z-ORDER optimization                                          │    │   │   │
│  │  │  └─────────────────────────────────────────────────────────────────┘    │   │   │
│  │  └──────────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                                  │   │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐   │   │
│  │  │  COLD TIER                                                               │   │   │
│  │  │  ┌─────────────────────────────────────────────────────────────────┐    │   │   │
│  │  │  │ S3 Glacier / Deep Archive                                       │    │   │   │
│  │  │  │ • Historical projections (7+ years)                             │    │   │   │
│  │  │  │ • Compliance archives                                           │    │   │   │
│  │  │  └─────────────────────────────────────────────────────────────────┘    │   │   │
│  │  └──────────────────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │                         CACHING & CDN                                             │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                   │   │
│  │  │ Redis Cache     │  │ CloudFront CDN  │  │ Materialized    │                   │   │
│  │  │ • Hot data      │  │ • Hazard tiles  │  │ Views           │                   │   │
│  │  │ • Query results │  │ • Static assets │  │ • Aggregations  │                   │   │
│  │  │ • TTL policies  │  │ • Global edge   │  │ • Pre-computed  │                   │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘                   │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │                      MONITORING & OBSERVABILITY                                   │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐     │   │
│  │  │ Prometheus    │  │ Grafana       │  │ Alertmanager  │  │ ELK Stack     │     │   │
│  │  │ • Metrics     │  │ • Dashboards  │  │ • Alerts      │  │ • Logs        │     │   │
│  │  │ • Time-series │  │ • Visualize   │  │ • Routing     │  │ • Search      │     │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Appendix A: Configuration Files

### Docker Compose for Local Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL with PostGIS
  postgres:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_USER: riskthinking
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: riskthinking
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql/init:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    command: >
      postgres
      -c shared_preload_libraries='pg_stat_statements'
      -c pg_stat_statements.track=all
      -c max_connections=200
      -c shared_buffers=2GB
      -c effective_cache_size=6GB
      -c work_mem=50MB

  # Redis Cluster
  redis-master-1:
    image: redis:7.2-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_master1_data:/data
    command: redis-server --appendonly yes --maxmemory 1gb --maxmemory-policy allkeys-lru

  redis-master-2:
    image: redis:7.2-alpine
    ports:
      - "6380:6379"
    volumes:
      - redis_master2_data:/data
    command: redis-server --appendonly yes --maxmemory 1gb --maxmemory-policy allkeys-lru

  redis-master-3:
    image: redis:7.2-alpine
    ports:
      - "6381:6379"
    volumes:
      - redis_master3_data:/data
    command: redis-server --appendonly yes --maxmemory 1gb --maxmemory-policy allkeys-lru

  # Ingestion Service
  ingestion-service:
    build:
      context: ./ingestion_service
      dockerfile: Dockerfile
    environment:
      - RT_INGESTION_API_BASE_URL=https://api.riskthinking.ai/v2
      - RT_INGESTION_REDIS_URL=redis://redis-master-1:6379/0
      - RT_INGESTION_CELERY_WORKERS=4
    depends_on:
      - postgres
      - redis-master-1
    ports:
      - "8000:8000"

  # Celery Workers
  celery-worker:
    build:
      context: ./ingestion_service
      dockerfile: Dockerfile.worker
    environment:
      - CELERY_BROKER_URL=redis://redis-master-1:6379/0
      - CELERY_RESULT_BACKEND=redis://redis-master-1:6379/0
      - DATABASE_URL=postgresql://riskthinking:${POSTGRES_PASSWORD}@postgres:5432/riskthinking
    depends_on:
      - postgres
      - redis-master-1
    command: celery -A ingestion_service.celery_app worker -l info -c 4

  # Flower (Celery Monitoring)
  flower:
    image: mher/flower:latest
    environment:
      - CELERY_BROKER_URL=redis://redis-master-1:6379/0
    ports:
      - "5555:5555"
    depends_on:
      - redis-master-1

  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  # Grafana
  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - "3000:3000"

volumes:
  postgres_data:
  redis_master1_data:
  redis_master2_data:
  redis_master3_data:
  prometheus_data:
  grafana_data:
```

### Environment Variables Template

```bash
# .env.template
# Copy to .env and fill in values

# Database
POSTGRES_PASSWORD=changeme
DATABASE_URL=postgresql://riskthinking:${POSTGRES_PASSWORD}@localhost:5432/riskthinking

# Redis
REDIS_URL=redis://localhost:6379/0

# RiskThinking API
RISHTHINKING_API_KEY=your_api_key_here
RISHTHINKING_API_SECRET=your_api_secret_here

# AWS
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# Monitoring
GRAFANA_PASSWORD=changeme
PROMETHEUS_RETENTION=30d

# Feature Flags
ENABLE_CACHE_WARMING=true
ENABLE_COMPRESSION=true
ENABLE_READ_REPLICAS=true
```

---

**Document End**

*This document provides comprehensive technical specifications for the RiskThinking.ai integration data pipeline. For questions or updates, contact the Data Engineering team at AA Impact Inc.*
