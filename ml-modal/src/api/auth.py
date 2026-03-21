from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
import os
import logging
from dotenv import load_dotenv, find_dotenv

logger = logging.getLogger(__name__)

# Search for nearest .env file (useful for local dev) and load it
load_dotenv(find_dotenv(usecwd=True))
# Also try checking the frontend directory explicitly if running from ml-modal
frontend_env = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", ".env.local")
if os.path.exists(frontend_env):
    load_dotenv(frontend_env)
elif os.path.exists(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", ".env")):
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", ".env"))

JWT_SECRET = os.getenv("JWT_SECRET")

# Allow passing the token in the Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_token(token: str = Depends(oauth2_scheme)):
    """
    Dependency to verify the Next.js standard signature JWT 
    using the shared JWT_SECRET.
    """
    if not JWT_SECRET:
        logger.error("JWT_SECRET is not configured in the environment.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server misconfiguration: Authentication secret missing."
        )
    
    try:
        # Next.js jose SignJWT with HS256 uses the exact secret string bytes
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
