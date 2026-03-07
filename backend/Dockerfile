FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
# Install CPU-only torch first — keeps image ~300 MB instead of ~2 GB
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# FastAPI on port 8000 as required by PBI-002
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]