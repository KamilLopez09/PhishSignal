# PhishSignal API — Docker image (pickle serve; build context = repo root)
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Serve from pickle only — do not COPY the training CSV into the image.
COPY api.py model.py model.pkl ./

ENV TRAIN_MODEL=0
ENV PORT=8000

EXPOSE 8000
CMD uvicorn api:app --host 0.0.0.0 --port ${PORT}
