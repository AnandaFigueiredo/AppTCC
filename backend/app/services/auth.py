from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings
from app.services.database import request

bearer = HTTPBearer(auto_error=False)

def authorize(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
    if credentials is None or credentials.scheme.lower() != 'bearer':
        raise HTTPException(401, 'Autenticação obrigatória.', headers={'WWW-Authenticate': 'Bearer'})
    # Supabase Auth validates the signature, expiry and authenticity remotely.
    user = request('/auth/v1/user', token=credentials.credentials)
    if not isinstance(user, dict) or not user.get('id'):
        raise HTTPException(401, 'Sessão inválida.')
    if user['id'] not in settings()['users']:
        raise HTTPException(403, 'Usuário sem autorização para consultar a base acadêmica.')
    return user
