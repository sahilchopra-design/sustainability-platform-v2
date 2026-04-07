"""
Climate Risk Platform - Main Application
=======================================
FastAPI application entry point.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import time

from config.database import init_database, close_database
from api.routes import climate_risk

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="Climate Risk Modeling Platform",
    description="""
    Enterprise-grade climate risk modeling platform for financial institutions.
    
    ## Features
    
    * **Scenario Analysis**: NGFS, IEA, IPCC climate scenarios
    * **Physical Risk**: Flood, wildfire, hurricane, earthquake, heat, drought
    * **Transition Risk**: Carbon pricing, stranded assets, sector pathways
    * **Credit Risk**: IFRS 9 ECL, Basel capital requirements
    * **Portfolio Analysis**: Aggregation, VaR, temperature alignment
    * **TCFD Reporting**: Automated disclosure reports
    
    ## Data Sources
    
    * NGFS Scenario Portal
    * IEA World Energy Outlook
    * IPCC AR6
    * Copernicus Climate Data Store
    * USGS, NOAA hazard data
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time header to responses."""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__}
    )


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    logger.info("Starting Climate Risk Platform...")
    
    # Initialize database
    init_database()
    
    logger.info("Climate Risk Platform started successfully")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("Shutting down Climate Risk Platform...")
    
    # Close database connections
    close_database()
    
    logger.info("Climate Risk Platform shut down successfully")


# Include routers
app.include_router(climate_risk.router)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "Climate Risk Modeling Platform",
        "version": "1.0.0",
        "documentation": "/docs",
        "health": "/v1/climate-risk/health"
    }


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "climate-risk-platform",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
