from abc import ABC, abstractmethod
from typing import Any


class LLMProvider(ABC):
    @abstractmethod
    def is_available(self) -> bool:
        raise NotImplementedError

    @abstractmethod
    def extract_passport_data(self, ocr_text: str) -> dict[str, Any] | None:
        raise NotImplementedError
