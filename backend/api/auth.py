from fastapi import Header, HTTPException
from config import settings

async def verify_firebase_token(authorization: str = Header(default="")) -> dict:
    """
    Shared Firebase token verification dependency.
    """
    if not settings.AUTH_ENABLED:
        return {"uid": "local-user", "email": "local@credintel.ai"}

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        import firebase_admin
        from firebase_admin import auth as firebase_auth, credentials

        if not firebase_admin._apps:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)

        decoded = firebase_auth.verify_id_token(token)
        return decoded
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
