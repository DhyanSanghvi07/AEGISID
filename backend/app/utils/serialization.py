import json
from typing import Any


def canonical_dumps(data: Any) -> str:
    """Deterministic JSON serialization for hashing."""
    return json.dumps(data, sort_keys=True, separators=(",", ":"), default=str, ensure_ascii=True)
