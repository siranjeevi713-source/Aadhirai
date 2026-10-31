import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Dict
import jwt
from app.core.config import settings

def get_password_hash(password: str) -> str:
    """Generate secure salted SHA256 password hash."""
    salt = os.urandom(16).hex()
    hash_obj = hashlib.pbkdf2_hmac(
        "sha256", 
        password.encode("utf-8"), 
        salt.encode("utf-8"), 
        100000
    )
    return f"{salt}${hash_obj.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against salt$hash format."""
    try:
        if "$" not in hashed_password:
            return False
        salt, expected_hash = hashed_password.split("$", 1)
        calc_hash = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            100000
        ).hex()
        return hmac.compare_digest(calc_hash, expected_hash)
    except Exception:
        return False

def create_access_token(subject: str, roles: list[str], extra_claims: Optional[Dict[str, Any]] = None) -> str:
    """Generate JWT bearer token."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": subject,
        "roles": roles,
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    if extra_claims:
        to_encode.update(extra_claims)
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate JWT bearer token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None
