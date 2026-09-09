def mask_passport_number(value: str | None) -> str | None:
    if not value:
        return None
    cleaned = value.strip()
    if len(cleaned) <= 4:
        return "*" * len(cleaned)
    return f"{cleaned[0]}{'*' * (len(cleaned) - 3)}{cleaned[-2:]}"
