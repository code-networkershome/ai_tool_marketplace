from dotenv import load_dotenv
import os

load_dotenv(override=True)
print(f"RAW VALUE: {os.getenv('CORS_ORIGINS')}")
