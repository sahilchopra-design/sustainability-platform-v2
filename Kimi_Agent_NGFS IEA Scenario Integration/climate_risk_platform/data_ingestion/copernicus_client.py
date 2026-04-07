"""
Copernicus Climate Data Store Client
====================================
Client for accessing Copernicus CDS climate data.
Free registration required at: https://cds.climate.copernicus.eu
"""

import cdsapi
import xarray as xr
import numpy as np
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import logging
import os

logger = logging.getLogger(__name__)


class CopernicusCDSClient:
    """
    Client for Copernicus Climate Data Store.
    
    Provides access to:
    - ERA5 reanalysis data
    - Seasonal forecasts
    - Climate projections
    - Extreme indices
    """
    
    def __init__(self, api_key: Optional[str] = None, api_url: Optional[str] = None):
        """
        Initialize CDS client.
        
        Args:
            api_key: CDS API key (or set CDSAPI_KEY env var)
            api_url: CDS API URL (or set CDSAPI_URL env var)
        """
        # Set credentials
        if api_key:
            os.environ["CDSAPI_KEY"] = api_key
        if api_url:
            os.environ["CDSAPI_URL"] = api_url
        
        self.client = cdsapi.Client()
        logger.info("Copernicus CDS client initialized")
    
    def download_era5_single_levels(
        self,
        variables: List[str],
        years: List[int],
        months: List[int],
        area: List[float],  # [N, W, S, E]
        output_file: str,
        pressure_level: Optional[str] = None
    ) -> str:
        """
        Download ERA5 single level data.
        
        Args:
            variables: List of variable names (e.g., ['2m_temperature', 'total_precipitation'])
            years: List of years
            months: List of months (1-12)
            area: Bounding box [North, West, South, East]
            output_file: Output file path
            pressure_level: Optional pressure level
            
        Returns:
            Path to downloaded file
        """
        request = {
            "product_type": "reanalysis",
            "variable": variables,
            "year": [str(y) for y in years],
            "month": [f"{m:02d}" for m in months],
            "day": [f"{d:02d}" for d in range(1, 32)],
            "time": [f"{h:02d}:00" for h in range(24)],
            "area": area,
            "format": "netcdf"
        }
        
        if pressure_level:
            request["pressure_level"] = pressure_level
        
        dataset = "reanalysis-era5-single-levels"
        
        logger.info(f"Downloading ERA5 data: {variables} for {years}")
        self.client.retrieve(dataset, request, output_file)
        logger.info(f"Download complete: {output_file}")
        
        return output_file
    
    def download_extreme_indices(
        self,
        index: str,
        experiment: str,
        model: str,
        period: str,
        output_file: str
    ) -> str:
        """
        download climate extreme indices from CORDEX.
        
        Args:
            index: Extreme index (e.g., 'txx', 'tnn', 'rx5day')
            experiment: Experiment (e.g., 'rcp85', 'rcp45')
            model: Climate model name
            period: Time period (e.g., '2071-2100')
            output_file: Output file path
            
        Returns:
            Path to downloaded file
        """
        request = {
            "domain": "europe",
            "experiment": experiment,
            "horizontal_resolution": "0_11deg_x_0_11deg",
            "temporal_resolution": "annual",
            "variable": index,
            "gcm_model": model,
            "rcm_model": f"{model}-r1i1p1",
            "ensemble_member": "r1i1p1",
            "period": period,
            "version": "1_0",
            "format": "tgz"
        }
        
        dataset = "projections-cordex-domains-single-levels"
        
        logger.info(f"Downloading extreme index: {index}")
        self.client.retrieve(dataset, request, output_file)
        
        return output_file
    
    def download_seasonal_forecast(
        self,
        variables: List[str],
        year: int,
        month: int,
        leadtime_months: List[int],
        output_file: str
    ) -> str:
        """
        Download seasonal forecast data.
        
        Args:
            variables: List of variables
            year: Forecast year
            month: Forecast month
            leadtime_months: Lead time months
            output_file: Output file path
            
        Returns:
            Path to downloaded file
        """
        request = {
            "originating_centre": "ecmwf",
            "system": "51",
            "variable": variables,
            "year": str(year),
            "month": f"{month:02d}",
            "leadtime_month": [str(l) for l in leadtime_months],
            "format": "grib"
        }
        
        dataset = "seasonal-monthly-single-levels"
        
        logger.info(f"Downloading seasonal forecast: {year}-{month}")
        self.client.retrieve(dataset, request, output_file)
        
        return output_file
    
    def extract_temperature_extremes(
        self,
        netcdf_file: str,
        lat: float,
        lon: float,
        method: str = "nearest"
    ) -> Dict[str, np.ndarray]:
        """
        Extract temperature extreme statistics from NetCDF.
        
        Args:
            netcdf_file: Path to NetCDF file
            lat: Latitude
            lon: Longitude
            method: Interpolation method
            
        Returns:
            Dictionary with temperature statistics
        """
        ds = xr.open_dataset(netcdf_file)
        
        # Extract at location
        if method == "nearest":
            data = ds.sel(latitude=lat, longitude=lon, method="nearest")
        else:
            data = ds.interp(latitude=lat, longitude=lon)
        
        # Calculate statistics
        t2m = data["t2m"]
        
        stats = {
            "mean": float(t2m.mean()),
            "std": float(t2m.std()),
            "min": float(t2m.min()),
            "max": float(t2m.max()),
            "p95": float(t2m.quantile(0.95)),
            "p99": float(t2m.quantile(0.99))
        }
        
        ds.close()
        return stats
    
    def extract_precipitation_extremes(
        self,
        netcdf_file: str,
        lat: float,
        lon: float
    ) -> Dict[str, float]:
        """
        Extract precipitation extreme statistics.
        
        Args:
            netcdf_file: Path to NetCDF file
            lat: Latitude
            lon: Longitude
            
        Returns:
            Dictionary with precipitation statistics
        """
        ds = xr.open_dataset(netcdf_file)
        
        data = ds.sel(latitude=lat, longitude=lon, method="nearest")
        tp = data["tp"]  # Total precipitation
        
        # Calculate extreme indices
        stats = {
            "annual_max": float(tp.resample(time="Y").max().mean()),
            "rx5day": float(tp.rolling(time=5).sum().max()),  # Max 5-day precipitation
            "sdii": float(tp.where(tp > 1).mean()),  # Simple daily intensity index
            "r95ptot": float(tp.where(tp > tp.quantile(0.95)).sum())  # Precipitation from very wet days
        }
        
        ds.close()
        return stats
    
    def calculate_climate_indices(
        self,
        netcdf_file: str,
        lat: float,
        lon: float
    ) -> Dict[str, float]:
        """
        Calculate climate extreme indices for a location.
        
        Args:
            netcdf_file: Path to NetCDF file
            lat: Latitude
            lon: Longitude
            
        Returns:
            Dictionary with climate indices
        """
        ds = xr.open_dataset(netcdf_file)
        data = ds.sel(latitude=lat, longitude=lon, method="nearest")
        
        indices = {}
        
        # Temperature indices
        if "t2m" in data:
            t2m = data["t2m"]
            indices["txx"] = float(t2m.max())  # Max daily max temp
            indices["tnn"] = float(t2m.min())  # Min daily min temp
            indices["txn"] = float(t2m.resample(time="D").max().min())  # Min daily max
            indices["tnx"] = float(t2m.resample(time="D").min().max())  # Max daily min
        
        # Precipitation indices
        if "tp" in data:
            tp = data["tp"]
            indices["rx1day"] = float(tp.max())  # Max 1-day precipitation
            indices["rx5day"] = float(tp.rolling(time=5).sum().max())
            indices["r10mm"] = int((tp > 0.01).sum())  # Days with precip > 10mm
            indices["r20mm"] = int((tp > 0.02).sum())  # Days with precip > 20mm
        
        ds.close()
        return indices


class ClimateDataProcessor:
    """
    Process and transform climate data for risk modeling.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def calculate_return_periods(
        self,
        data: np.ndarray,
        return_periods: List[int] = [10, 25, 50, 100, 250]
    ) -> Dict[int, float]:
        """
        Calculate return period values using GEV distribution.
        
        Args:
            data: Extreme value data
            return_periods: List of return periods
            
        Returns:
            Dictionary of {return_period: value}
        """
        from scipy.stats import genextreme
        
        # Fit GEV distribution
        params = genextreme.fit(data)
        
        results = {}
        for rp in return_periods:
            # Return level for given return period
            probability = 1 - 1/rp
            return_level = genextreme.ppf(probability, *params)
            results[rp] = float(return_level)
        
        return results
    
    def calculate_trend(
        self,
        data: np.ndarray,
        years: np.ndarray
    ) -> Dict[str, float]:
        """
        Calculate linear trend in climate data.
        
        Args:
            data: Climate data values
            years: Corresponding years
            
        Returns:
            Dictionary with trend statistics
        """
        from scipy import stats
        
        slope, intercept, r_value, p_value, std_err = stats.linregress(years, data)
        
        return {
            "slope": slope,
            "intercept": intercept,
            "r_squared": r_value ** 2,
            "p_value": p_value,
            "std_error": std_err,
            "trend_per_decade": slope * 10
        }
    
    def downscale_data(
        self,
        coarse_data: xr.DataArray,
        high_res_elevation: xr.DataArray,
        method: str = "bilinear"
    ) -> xr.DataArray:
        """
        Downscale climate data to higher resolution.
        
        Args:
            coarse_data: Low resolution climate data
            high_res_elevation: High resolution elevation data
            method: Downscaling method
            
        Returns:
            Downscaled data
        """
        # Regrid to high resolution
        downscaled = coarse_data.interp_like(high_res_elevation, method=method)
        
        # Apply elevation correction for temperature
        if "temp" in coarse_data.name.lower() or "t2m" in coarse_data.name.lower():
            # Lapse rate: 6.5°C per km
            elevation_diff = high_res_elevation - coarse_data.elevation
            temp_correction = elevation_diff * 0.0065
            downscaled = downscaled - temp_correction
        
        return downscaled
