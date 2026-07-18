"""PhishSignal FastAPI — /analyze and /health."""

from __future__ import annotations

import os
import time
from collections import defaultdict
from threading import Lock

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware

from model import analyze

MAX_URL_LENGTH = 2048

# Comma-separated origins. Empty → allow all (local only).
_CORS_RAW = os.getenv("CORS_ORIGINS", "").strip()
CORS_ORIGINS = [o.strip() for o in _CORS_RAW.split(",") if o.strip()]

RATE_CAPACITY = float(os.getenv("RATE_LIMIT_CAPACITY", "20"))
RATE_REFILL = float(os.getenv("RATE_LIMIT_REFILL_PER_SEC", "0.5"))  # ~1 / 2s sustained

app = FastAPI(title="PhishSignal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS or ["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


class _TokenBucket:
    """Per-key token bucket for /analyze abuse control."""

    def __init__(self, capacity: float, refill_per_sec: float) -> None:
        self.capacity = capacity
        self.refill = refill_per_sec
        self._tokens: dict[str, float] = defaultdict(lambda: capacity)
        self._updated: dict[str, float] = defaultdict(time.monotonic)
        self._lock = Lock()

    def take(self, key: str) -> tuple[bool, float]:
        now = time.monotonic()
        with self._lock:
            last = self._updated[key]
            tokens = min(
                self.capacity,
                self._tokens[key] + (now - last) * self.refill,
            )
            self._updated[key] = now
            if tokens < 1:
                self._tokens[key] = tokens
                retry = (1 - tokens) / self.refill if self.refill > 0 else 60.0
                return False, retry
            self._tokens[key] = tokens - 1
            return True, 0.0


_analyze_limiter = _TokenBucket(RATE_CAPACITY, RATE_REFILL)


def _client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _validate_url(url: str) -> str:
    text = (url or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="url is required")
    if len(text) > MAX_URL_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"url exceeds {MAX_URL_LENGTH} characters",
        )
    lower = text.lower()
    if not (lower.startswith("http://") or lower.startswith("https://")):
        raise HTTPException(
            status_code=400,
            detail="url must start with http:// or https://",
        )
    if any(ch.isspace() for ch in text):
        raise HTTPException(status_code=400, detail="url must not contain whitespace")
    return text


@app.get("/analyze")
def analyze_url(
    request: Request,
    url: str = Query(..., min_length=1, max_length=MAX_URL_LENGTH),
):
    ok, retry_after = _analyze_limiter.take(_client_key(request))
    if not ok:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded",
            headers={"Retry-After": str(max(1, int(retry_after + 0.999)))},
        )
    return analyze(_validate_url(url))


@app.get("/health")
def health():
    return {"status": "ok"}
