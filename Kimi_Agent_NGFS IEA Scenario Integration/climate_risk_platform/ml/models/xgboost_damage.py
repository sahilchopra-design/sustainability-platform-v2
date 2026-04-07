"""
XGBoost Damage Prediction Model
==============================
Quantile regression for probabilistic damage prediction.
Implements conformal prediction for uncertainty quantification.
"""

import xgboost as xgb
import numpy as np
from typing import Dict, List, Optional, Tuple, Union
import pickle
import logging

logger = logging.getLogger(__name__)


class XGBoostDamageModel:
    """
    XGBoost model for climate damage prediction with quantile regression.
    
    Features:
    - Quantile regression for uncertainty quantification
    - Conformal prediction for coverage guarantees
    - Feature importance analysis
    - Model persistence
    """
    
    def __init__(
        self,
        quantiles: List[float] = None,
        model_params: Dict = None
    ):
        """
        Initialize XGBoost damage model.
        
        Args:
            quantiles: List of quantiles to predict (default: [0.05, 0.25, 0.5, 0.75, 0.95])
            model_params: XGBoost hyperparameters
        """
        self.quantiles = quantiles or [0.05, 0.25, 0.5, 0.75, 0.95]
        self.models: Dict[float, xgb.XGBRegressor] = {}
        
        # Default model parameters
        self.model_params = model_params or {
            "n_estimators": 500,
            "max_depth": 6,
            "learning_rate": 0.05,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "random_state": 42,
            "n_jobs": -1
        }
        
        # Conformal calibration scores
        self.calibration_scores: Optional[np.ndarray] = None
        self.conformal_quantile: float = 0.95
    
    def train(
        self,
        X: np.ndarray,
        y: np.ndarray,
        validation_split: float = 0.2
    ) -> Dict[str, float]:
        """
        Train quantile regression models.
        
        Args:
            X: Feature matrix (n_samples, n_features)
            y: Target vector (n_samples,)
            validation_split: Fraction for validation
            
        Returns:
            Dictionary with training metrics
        """
        logger.info(f"Training XGBoost damage model on {len(X)} samples")
        
        # Split data
        n_val = int(len(X) * validation_split)
        indices = np.random.permutation(len(X))
        
        X_train = X[indices[n_val:]]
        y_train = y[indices[n_val:]]
        X_val = X[indices[:n_val]]
        y_val = y[indices[:n_val]]
        
        metrics = {}
        
        # Train model for each quantile
        for q in self.quantiles:
            logger.info(f"Training quantile {q}")
            
            # Use quantile regression objective
            model = xgb.XGBRegressor(
                objective='reg:quantileerror',
                quantile_alpha=q,
                **self.model_params
            )
            
            model.fit(
                X_train, y_train,
                eval_set=[(X_val, y_val)],
                verbose=False
            )
            
            self.models[q] = model
            
            # Validation metrics
            y_pred = model.predict(X_val)
            mae = np.mean(np.abs(y_val - y_pred))
            metrics[f"mae_q{int(q*100)}"] = mae
        
        # Calibrate conformal prediction
        self._calibrate_conformal(X_val, y_val)
        
        logger.info(f"Training complete. Metrics: {metrics}")
        return metrics
    
    def predict(
        self,
        X: np.ndarray,
        return_quantiles: bool = True
    ) -> Union[np.ndarray, Dict[float, np.ndarray]]:
        """
        Make predictions with uncertainty quantification.
        
        Args:
            X: Feature matrix
            return_quantiles: If True, return all quantile predictions
            
        Returns:
            If return_quantiles: Dictionary of {quantile: predictions}
            Else: Median (0.5 quantile) predictions
        """
        if not self.models:
            raise ValueError("Model not trained. Call train() first.")
        
        predictions = {}
        for q in self.quantiles:
            predictions[q] = self.models[q].predict(X)
        
        if return_quantiles:
            return predictions
        else:
            return predictions[0.5]
    
    def predict_with_conformal(
        self,
        X: np.ndarray,
        confidence: float = 0.95
    ) -> Dict[str, np.ndarray]:
        """
        Make predictions with conformal prediction intervals.
        
        Args:
            X: Feature matrix
            confidence: Confidence level for intervals
            
        Returns:
            Dictionary with median, lower, and upper predictions
        """
        # Get base predictions
        predictions = self.predict(X, return_quantiles=True)
        median = predictions[0.5]
        
        # Calculate conformal interval
        if self.calibration_scores is not None:
            alpha = 1 - confidence
            q_level = np.ceil((len(self.calibration_scores) + 1) * (1 - alpha)) / len(self.calibration_scores)
            q_level = min(q_level, 1.0)
            
            quantile_score = np.quantile(self.calibration_scores, q_level)
            
            lower = median - quantile_score
            upper = median + quantile_score
        else:
            # Fallback to quantile regression intervals
            lower = predictions.get(0.05, median * 0.5)
            upper = predictions.get(0.95, median * 1.5)
        
        return {
            "median": median,
            "lower": lower,
            "upper": upper,
            "confidence": confidence
        }
    
    def _calibrate_conformal(
        self,
        X_cal: np.ndarray,
        y_cal: np.ndarray
    ):
        """
        Calibrate conformal prediction using calibration set.
        
        Args:
            X_cal: Calibration features
            y_cal: Calibration targets
        """
        logger.info("Calibrating conformal prediction")
        
        # Get median predictions
        median_pred = self.models[0.5].predict(X_cal)
        
        # Calculate non-conformity scores (absolute residuals)
        self.calibration_scores = np.abs(y_cal - median_pred)
        
        logger.info(f"Conformal calibration complete. N={len(self.calibration_scores)}")
    
    def get_feature_importance(
        self,
        feature_names: Optional[List[str]] = None
    ) -> Dict[str, float]:
        """
        Get feature importance from trained model.
        
        Args:
            feature_names: Optional list of feature names
            
        Returns:
            Dictionary of {feature: importance}
        """
        if not self.models:
            raise ValueError("Model not trained")
        
        # Use median model for importance
        importance = self.models[0.5].feature_importances_
        
        if feature_names:
            return {name: float(imp) for name, imp in zip(feature_names, importance)}
        else:
            return {f"feature_{i}": float(imp) for i, imp in enumerate(importance)}
    
    def save(self, filepath: str):
        """
        Save model to disk.
        
        Args:
            filepath: Path to save model
        """
        model_data = {
            "models": self.models,
            "quantiles": self.quantiles,
            "model_params": self.model_params,
            "calibration_scores": self.calibration_scores
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        logger.info(f"Model saved to {filepath}")
    
    @classmethod
    def load(cls, filepath: str) -> 'XGBoostDamageModel':
        """
        Load model from disk.
        
        Args:
            filepath: Path to saved model
            
        Returns:
            Loaded XGBoostDamageModel
        """
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)
        
        instance = cls(
            quantiles=model_data["quantiles"],
            model_params=model_data["model_params"]
        )
        instance.models = model_data["models"]
        instance.calibration_scores = model_data.get("calibration_scores")
        
        logger.info(f"Model loaded from {filepath}")
        return instance
    
    def cross_validate(
        self,
        X: np.ndarray,
        y: np.ndarray,
        n_folds: int = 5
    ) -> Dict[str, List[float]]:
        """
        Perform cross-validation.
        
        Args:
            X: Feature matrix
            y: Target vector
            n_folds: Number of folds
            
        Returns:
            Dictionary with CV metrics
        """
        from sklearn.model_selection import KFold
        
        kf = KFold(n_splits=n_folds, shuffle=True, random_state=42)
        
        cv_metrics = {
            "mae": [],
            "rmse": [],
            "coverage_90": []
        }
        
        for fold, (train_idx, val_idx) in enumerate(kf.split(X)):
            logger.info(f"CV Fold {fold + 1}/{n_folds}")
            
            X_train, X_val = X[train_idx], X[val_idx]
            y_train, y_val = y[train_idx], y[val_idx]
            
            # Train temporary model
            temp_model = XGBoostDamageModel(quantiles=self.quantiles)
            temp_model.train(X_train, y_train, validation_split=0)
            
            # Predict
            predictions = temp_model.predict(X_val, return_quantiles=True)
            median = predictions[0.5]
            
            # Metrics
            mae = np.mean(np.abs(y_val - median))
            rmse = np.sqrt(np.mean((y_val - median) ** 2))
            
            # Coverage
            lower = predictions.get(0.05, median * 0.5)
            upper = predictions.get(0.95, median * 1.5)
            coverage = np.mean((y_val >= lower) & (y_val <= upper))
            
            cv_metrics["mae"].append(mae)
            cv_metrics["rmse"].append(rmse)
            cv_metrics["coverage_90"].append(coverage)
        
        # Summary statistics
        summary = {
            f"{k}_mean": np.mean(v) for k, v in cv_metrics.items()
        }
        summary.update({
            f"{k}_std": np.std(v) for k, v in cv_metrics.items()
        })
        
        return summary


class XGBoostTransitionRiskModel(XGBoostDamageModel):
    """
    Specialized XGBoost model for transition risk prediction.
    """
    
    def __init__(self, model_params: Dict = None):
        """
        Initialize transition risk model.
        
        Args:
            model_params: XGBoost hyperparameters
        """
        default_params = {
            "n_estimators": 300,
            "max_depth": 5,
            "learning_rate": 0.08,
            "subsample": 0.9,
            "colsample_bytree": 0.9,
            "random_state": 42,
            "n_jobs": -1
        }
        
        if model_params:
            default_params.update(model_params)
        
        super().__init__(
            quantiles=[0.1, 0.25, 0.5, 0.75, 0.9],
            model_params=default_params
        )
    
    def prepare_features(
        self,
        carbon_intensity: float,
        sector: str,
        carbon_price: float,
        revenue: float,
        debt: float,
        years_to_target: int
    ) -> np.ndarray:
        """
        Prepare feature vector for transition risk prediction.
        
        Args:
            carbon_intensity: Carbon intensity (tCO2e/$M)
            sector: Industry sector
            carbon_price: Carbon price ($/tCO2e)
            revenue: Annual revenue
            debt: Total debt
            years_to_target: Years to climate target
            
        Returns:
            Feature vector
        """
        # Sector encoding (simplified)
        sector_encoded = hash(sector) % 10 / 10
        
        features = np.array([
            carbon_intensity,
            sector_encoded,
            carbon_price,
            revenue,
            debt,
            years_to_target,
            carbon_intensity * carbon_price,  # Interaction
            revenue / max(debt, 1),  # Leverage
            carbon_intensity * years_to_target  # Time-adjusted intensity
        ])
        
        return features.reshape(1, -1)
