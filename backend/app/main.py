from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers.api import router

app = FastAPI(title='SerTech — Apoio à decisão na produtividade leiteira', version='1.0.0')
app.add_middleware(CORSMiddleware, allow_origins=settings()['origins'], allow_credentials=False, allow_methods=['GET', 'POST'], allow_headers=['Authorization', 'Content-Type'])
app.include_router(router)

@app.get('/health')
def health():
    return {'status': 'ok', 'database_checked': False}
