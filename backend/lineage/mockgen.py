"""
lineage.mockgen — build schema-valid inputs for endpoints.

Real-data-first: callers pass `overrides` harvested from the live DB (e.g. a real
reserve id). For anything still required, we synthesise a deterministic,
type-appropriate mock value so the endpoint can run. Provenance for synthesised
inputs is tagged "mock" by the runner.

Supports Pydantic v2 (model_fields) and v1 (__fields__).
"""

import datetime
import enum
import typing


def _is_pydantic(cls):
    return hasattr(cls, "model_fields") or hasattr(cls, "__fields__")


def _fields(cls):
    """Return {name: (annotation, required, default)} for a pydantic model."""
    out = {}
    if hasattr(cls, "model_fields"):                       # pydantic v2
        for name, f in cls.model_fields.items():
            required = f.is_required()
            default = None if required else f.default
            out[name] = (f.annotation, required, default)
    elif hasattr(cls, "__fields__"):                       # pydantic v1
        for name, f in cls.__fields__.items():
            required = f.required
            default = None if required else f.default
            out[name] = (f.outer_type_, required, default)
    return out


def _mock_scalar(ann, seed):
    origin = typing.get_origin(ann)
    args = typing.get_args(ann)

    # Optional[X] / Union -> first non-None arm
    if origin is typing.Union:
        non_none = [a for a in args if a is not type(None)]  # noqa: E721
        return _mock_scalar(non_none[0], seed) if non_none else None

    if origin in (list, typing.List):
        inner = args[0] if args else str
        return [build(inner, seed=seed)] if _is_pydantic(inner) else [_mock_scalar(inner, seed)]
    if origin in (dict, typing.Dict):
        return {}

    if isinstance(ann, type) and issubclass(ann, enum.Enum):
        return list(ann)[0].value
    if ann in (int,):
        return 1
    if ann in (float,):
        return 1.0
    if ann in (bool,):
        return True
    if ann in (datetime.date,):
        return datetime.date(2024, 1, 1).isoformat()
    if ann in (datetime.datetime,):
        return datetime.datetime(2024, 1, 1).isoformat()
    if ann in (str,):
        return f"TEST_{seed}"
    # nested pydantic model
    if _is_pydantic(ann):
        return build(ann, seed=seed)
    # decimals, UUIDs, etc.
    name = getattr(ann, "__name__", "").lower()
    if "decimal" in name:
        return 1.0
    if "uuid" in name:
        return "550e8400-e29b-41d4-a716-446655440000"
    return f"TEST_{seed}"


def build(model_cls, overrides=None, seed="x"):
    """Return a JSON-serialisable dict valid for `model_cls`."""
    overrides = overrides or {}
    data = {}
    for name, (ann, required, default) in _fields(model_cls).items():
        if name in overrides:
            data[name] = overrides[name]
        elif required:
            data[name] = _mock_scalar(ann, seed=f"{seed}_{name}")
        elif default is not None:
            continue  # let the model apply its own default
    return data
