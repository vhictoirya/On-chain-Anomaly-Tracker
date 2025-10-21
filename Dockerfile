FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
COPY requirements.prod.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.prod.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8001

# Run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001"]