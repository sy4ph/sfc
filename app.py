# Shim for deployment platforms expecting `app:app` instead of `backend.app:app`
from backend.app import app  # noqa: F401
# Validating backend reload
