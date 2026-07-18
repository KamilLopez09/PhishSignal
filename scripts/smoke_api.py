"""Smoke /health, /analyze, validation, and rate-limit against a running API."""

from __future__ import annotations

import os
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = os.getenv("SMOKE_API_BASE", "http://127.0.0.1:8000").rstrip("/")


def get(path: str) -> tuple[int, str]:
    req = urllib.request.Request(f"{BASE}{path}", headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            return res.status, res.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode("utf-8", errors="replace")


def main() -> int:
    code, body = get("/health")
    assert code == 200 and '"ok"' in body, (code, body)
    print("health ok")

    q = urllib.parse.urlencode({"url": "https://example.com"})
    code, body = get(f"/analyze?{q}")
    assert code == 200 and '"score"' in body and '"signals"' in body, (code, body)
    print("analyze ok", body[:160])

    code, _ = get("/analyze?url=")
    assert code in (400, 422), code
    print("empty url rejected", code)

    code, _ = get("/analyze?url=ftp://evil.example")
    assert code == 400, code
    print("bad scheme rejected", code)

    # Exhaust a tight bucket if the server was started with tiny limits;
    # with defaults this still exercises the endpoint repeatedly.
    saw_429 = False
    for _ in range(40):
        code, _ = get(f"/analyze?{q}")
        if code == 429:
            saw_429 = True
            break
    print("rate limit 429 observed" if saw_429 else "rate limit not hit (limits may be high)")
    print("smoke passed")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print("smoke failed:", exc, file=sys.stderr)
        raise SystemExit(1)
