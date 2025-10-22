FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Expose port (Railway will override with $PORT)
EXPOSE 8001

# Start the FastAPI app
CMD uvicorn app:app --host 0.0.0.0 --port ${PORT:-8001}