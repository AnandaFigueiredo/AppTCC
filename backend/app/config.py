import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / '.env')

def settings():
    return {
        'url': os.getenv('SUPABASE_URL', '').rstrip('/'),
        'key': os.getenv('SUPABASE_SERVICE_ROLE_KEY', ''),
        'users': {x.strip() for x in os.getenv('AUTHORIZED_USER_IDS', '').split(',') if x.strip()},
        'origins': [x.strip() for x in os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(',') if x.strip()],
    }
