# validators.py

import re


def validate_email(email: str) -> bool:

    pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"

    return bool(re.match(pattern, email))


def validate_password(password: str) -> bool:

    if len(password) < 6:
        return False

    return True


def validate_phone(phone: str) -> bool:

    pattern = r"^\d{10,11}$"

    return bool(re.match(pattern, phone))