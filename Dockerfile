FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

ENV PORT=8001
EXPOSE ${PORT}

CMD uvicorn backend.app:app --host 0.0.0.0 --port ${PORT:-8001}