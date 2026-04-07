"""
Spatiotemporal Graph Neural Network (ST-GNN)
===========================================
Graph neural network for spatially-aware climate risk prediction.
Implements Chebyshev spectral convolution for geographic data.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import ChebConv, GATConv, global_mean_pool
from torch_geometric.data import Data, Batch
import numpy as np
from typing import List, Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class STGNNClimateRisk(nn.Module):
    """
    Spatiotemporal Graph Neural Network for climate risk prediction.
    
    Architecture:
    - Chebyshev spectral convolution for spatial dependencies
    - LSTM for temporal dynamics
    - Attention mechanism for hazard-specific features
    """
    
    def __init__(
        self,
        num_features: int,
        hidden_dim: int = 64,
        num_layers: int = 3,
        k: int = 3,  # Chebyshev polynomial order
        num_hazards: int = 6,
        dropout: float = 0.2
    ):
        """
        Initialize ST-GNN model.
        
        Args:
            num_features: Number of input features per node
            hidden_dim: Hidden layer dimension
            num_layers: Number of graph convolution layers
            k: Chebyshev polynomial order
            num_hazards: Number of hazard types
            dropout: Dropout rate
        """
        super(STGNNClimateRisk, self).__init__()
        
        self.num_features = num_features
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.num_hazards = num_hazards
        
        # Graph convolution layers (Chebyshev)
        self.conv_layers = nn.ModuleList()
        self.conv_layers.append(ChebConv(num_features, hidden_dim, K=k))
        
        for _ in range(num_layers - 1):
            self.conv_layers.append(ChebConv(hidden_dim, hidden_dim, K=k))
        
        # Batch normalization
        self.batch_norms = nn.ModuleList([
            nn.BatchNorm1d(hidden_dim) for _ in range(num_layers)
        ])
        
        # Temporal LSTM
        self.lstm = nn.LSTM(
            input_size=hidden_dim,
            hidden_size=hidden_dim,
            num_layers=2,
            batch_first=True,
            dropout=dropout
        )
        
        # Hazard attention
        self.hazard_attention = nn.MultiheadAttention(
            embed_dim=hidden_dim,
            num_heads=4,
            dropout=dropout
        )
        
        # Hazard embeddings
        self.hazard_embedding = nn.Embedding(num_hazards, hidden_dim)
        
        # Output layers
        self.fc1 = nn.Linear(hidden_dim * 2, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, num_hazards)  # Risk score per hazard
        self.fc3 = nn.Linear(hidden_dim, 1)  # Aggregate risk
        
        self.dropout = nn.Dropout(dropout)
    
    def forward(
        self,
        x: torch.Tensor,
        edge_index: torch.Tensor,
        edge_weight: Optional[torch.Tensor] = None,
        hazard_types: Optional[torch.Tensor] = None,
        temporal_seq: Optional[torch.Tensor] = None
    ) -> Dict[str, torch.Tensor]:
        """
        Forward pass.
        
        Args:
            x: Node features (num_nodes, num_features)
            edge_index: Graph connectivity (2, num_edges)
            edge_weight: Edge weights (num_edges,)
            hazard_types: Hazard type indices (num_nodes,)
            temporal_seq: Temporal sequence (batch, seq_len, hidden_dim)
            
        Returns:
            Dictionary with risk predictions
        """
        # Graph convolution
        h = x
        for i, (conv, bn) in enumerate(zip(self.conv_layers, self.batch_norms)):
            h = conv(h, edge_index, edge_weight)
            h = bn(h)
            h = F.relu(h)
            h = self.dropout(h)
        
        # Temporal processing (if sequence provided)
        if temporal_seq is not None:
            lstm_out, _ = self.lstm(temporal_seq)
            temporal_features = lstm_out[:, -1, :]  # Last timestep
            
            # Combine spatial and temporal
            h = torch.cat([h, temporal_features], dim=-1)
        
        # Hazard attention
        if hazard_types is not None:
            hazard_emb = self.hazard_embedding(hazard_types)
            hazard_emb = hazard_emb.unsqueeze(0)  # (1, num_nodes, hidden_dim)
            h_att = h.unsqueeze(0)  # (1, num_nodes, hidden_dim)
            
            attn_out, attn_weights = self.hazard_attention(
                h_att, hazard_emb, hazard_emb
            )
            h = h + attn_out.squeeze(0)
        
        # Global pooling for graph-level prediction
        h_pooled = global_mean_pool(h, batch=None)
        
        # Output layers
        h_out = F.relu(self.fc1(h_pooled))
        h_out = self.dropout(h_out)
        
        # Per-hazard risk scores
        hazard_risks = torch.sigmoid(self.fc2(h_out))
        
        # Aggregate risk
        aggregate_risk = torch.sigmoid(self.fc3(h_out))
        
        return {
            "hazard_risks": hazard_risks,
            "aggregate_risk": aggregate_risk,
            "node_embeddings": h,
            "attention_weights": attn_weights if hazard_types is not None else None
        }
    
    def predict_risk(
        self,
        node_features: np.ndarray,
        edge_index: np.ndarray,
        edge_weight: Optional[np.ndarray] = None,
        hazard_types: Optional[np.ndarray] = None
    ) -> Dict[str, np.ndarray]:
        """
        Predict climate risk for a graph.
        
        Args:
            node_features: Node feature matrix (num_nodes, num_features)
            edge_index: Edge connectivity (2, num_edges)
            edge_weight: Edge weights (num_edges,)
            hazard_types: Hazard types per node (num_nodes,)
            
        Returns:
            Dictionary with risk predictions
        """
        self.eval()
        
        with torch.no_grad():
            # Convert to tensors
            x = torch.FloatTensor(node_features)
            edge_idx = torch.LongTensor(edge_index)
            edge_w = torch.FloatTensor(edge_weight) if edge_weight is not None else None
            hazard_t = torch.LongTensor(hazard_types) if hazard_types is not None else None
            
            # Forward pass
            outputs = self.forward(x, edge_idx, edge_w, hazard_t)
            
            return {
                "hazard_risks": outputs["hazard_risks"].numpy(),
                "aggregate_risk": outputs["aggregate_risk"].numpy(),
                "node_embeddings": outputs["node_embeddings"].numpy()
            }


class ClimateGraphBuilder:
    """
    Build graph representations of climate risk data.
    """
    
    def __init__(
        self,
        distance_threshold: float = 100.0,  # km
        connectivity: str = "knn"
    ):
        """
        Initialize graph builder.
        
        Args:
            distance_threshold: Maximum distance for edge creation
            connectivity: Graph connectivity type ("knn", "radius", "delaunay")
        """
        self.distance_threshold = distance_threshold
        self.connectivity = connectivity
    
    def build_graph(
        self,
        locations: List[Tuple[float, float]],  # (lat, lon) pairs
        features: np.ndarray,
        hazard_types: Optional[List[int]] = None
    ) -> Data:
        """
        Build PyTorch Geometric Data object.
        
        Args:
            locations: List of (latitude, longitude) coordinates
            features: Node features (num_nodes, num_features)
            hazard_types: Hazard type per node
            
        Returns:
            PyTorch Geometric Data object
        """
        num_nodes = len(locations)
        
        # Build edge index based on geographic proximity
        edge_index = []
        edge_weights = []
        
        for i in range(num_nodes):
            for j in range(i + 1, num_nodes):
                dist = self._haversine_distance(locations[i], locations[j])
                
                if dist <= self.distance_threshold:
                    # Add bidirectional edges
                    edge_index.append([i, j])
                    edge_index.append([j, i])
                    
                    # Weight inversely by distance
                    weight = 1.0 / (1.0 + dist / self.distance_threshold)
                    edge_weights.append(weight)
                    edge_weights.append(weight)
        
        edge_index = np.array(edge_index).T if edge_index else np.zeros((2, 0), dtype=np.int64)
        edge_weights = np.array(edge_weights) if edge_weights else np.ones(edge_index.shape[1])
        
        # Create Data object
        data = Data(
            x=torch.FloatTensor(features),
            edge_index=torch.LongTensor(edge_index),
            edge_attr=torch.FloatTensor(edge_weights)
        )
        
        if hazard_types is not None:
            data.hazard_types = torch.LongTensor(hazard_types)
        
        return data
    
    def _haversine_distance(
        self,
        loc1: Tuple[float, float],
        loc2: Tuple[float, float]
    ) -> float:
        """
        Calculate haversine distance between two points.
        
        Args:
            loc1: (lat, lon) of first point
            loc2: (lat, lon) of second point
            
        Returns:
            Distance in kilometers
        """
        R = 6371  # Earth's radius in km
        
        lat1, lon1 = np.radians(loc1)
        lat2, lon2 = np.radians(loc2)
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
        c = 2 * np.arcsin(np.sqrt(a))
        
        return R * c
    
    def build_batch(
        self,
        graphs: List[Data]
    ) -> Batch:
        """
        Build batch from multiple graphs.
        
        Args:
            graphs: List of Data objects
            
        Returns:
            Batched Data object
        """
        return Batch.from_data_list(graphs)


class STGNNTrainer:
    """
    Training utilities for ST-GNN model.
    """
    
    def __init__(
        self,
        model: STGNNClimateRisk,
        learning_rate: float = 0.001,
        weight_decay: float = 1e-5
    ):
        """
        Initialize trainer.
        
        Args:
            model: ST-GNN model
            learning_rate: Learning rate
            weight_decay: Weight decay
        """
        self.model = model
        self.optimizer = torch.optim.Adam(
            model.parameters(),
            lr=learning_rate,
            weight_decay=weight_decay
        )
        self.criterion = nn.MSELoss()
    
    def train_epoch(
        self,
        dataloader: torch.utils.data.DataLoader
    ) -> float:
        """
        Train for one epoch.
        
        Args:
            dataloader: Training data loader
            
        Returns:
            Average loss
        """
        self.model.train()
        total_loss = 0
        
        for batch in dataloader:
            self.optimizer.zero_grad()
            
            outputs = self.model(
                x=batch.x,
                edge_index=batch.edge_index,
                edge_weight=batch.edge_attr,
                hazard_types=batch.hazard_types if hasattr(batch, 'hazard_types') else None
            )
            
            # Multi-task loss
            loss = self.criterion(outputs["aggregate_risk"], batch.y)
            
            if hasattr(batch, 'hazard_targets'):
                hazard_loss = self.criterion(outputs["hazard_risks"], batch.hazard_targets)
                loss = loss + 0.5 * hazard_loss
            
            loss.backward()
            self.optimizer.step()
            
            total_loss += loss.item()
        
        return total_loss / len(dataloader)
    
    def evaluate(
        self,
        dataloader: torch.utils.data.DataLoader
    ) -> Dict[str, float]:
        """
        Evaluate model.
        
        Args:
            dataloader: Evaluation data loader
            
        Returns:
            Dictionary with metrics
        """
        self.model.eval()
        total_loss = 0
        predictions = []
        targets = []
        
        with torch.no_grad():
            for batch in dataloader:
                outputs = self.model(
                    x=batch.x,
                    edge_index=batch.edge_index,
                    edge_weight=batch.edge_attr
                )
                
                loss = self.criterion(outputs["aggregate_risk"], batch.y)
                total_loss += loss.item()
                
                predictions.extend(outputs["aggregate_risk"].numpy())
                targets.extend(batch.y.numpy())
        
        predictions = np.array(predictions)
        targets = np.array(targets)
        
        mae = np.mean(np.abs(predictions - targets))
        rmse = np.sqrt(np.mean((predictions - targets) ** 2))
        
        return {
            "loss": total_loss / len(dataloader),
            "mae": mae,
            "rmse": rmse
        }
    
    def save_checkpoint(
        self,
        filepath: str,
        epoch: int,
        metrics: Dict
    ):
        """
        Save model checkpoint.
        
        Args:
            filepath: Save path
            epoch: Current epoch
            metrics: Training metrics
        """
        torch.save({
            'epoch': epoch,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'metrics': metrics
        }, filepath)
        
        logger.info(f"Checkpoint saved to {filepath}")
    
    def load_checkpoint(self, filepath: str):
        """
        Load model checkpoint.
        
        Args:
            filepath: Checkpoint path
        """
        checkpoint = torch.load(filepath)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        
        logger.info(f"Checkpoint loaded from {filepath}")
        return checkpoint['epoch'], checkpoint['metrics']
