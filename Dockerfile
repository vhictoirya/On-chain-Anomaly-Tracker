FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.prod.txt requirements.prod.txt
RUN pip install --no-cache-dir -r requirements.prod.txt

# Copy backend code
COPY backend/ .

# The port will be provided by Railway as an environment variable
ENV PORT=8001

# Run the application
CMD uvicorn app:app --host 0.0.0.0 --port ${PORT}