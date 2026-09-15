import json
import logging
import time
from collections import defaultdict, deque
from typing import Annotated

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from .analysis import analyze
from .config import get_settings
from .models import Analysis, Candidate, Claim, TextRequest
from .parsing import ParseError, parse
from .proof import ROOT, verify

logging.basicConfig(level=logging.INFO)
settings = get_settings()
app = FastAPI(title="NoticeLens", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
samples = json.loads((ROOT / "sample-data/notices.json").read_text())
requests: dict[str, deque] = defaultdict(deque)


@app.middleware("http")
async def limits(request: Request, call_next):
    if request.method == "POST":
        key = request.client.host if request.client else "unknown"
        now = time.monotonic()
        # Expire idle clients as well as timestamps to bound this local limiter.
        for client in list(requests):
            if not requests[client] or requests[client][-1] < now - 60:
                del requests[client]
        q = requests[key]
        while q and q[0] < now - 60:
            q.popleft()
        if len(q) >= 20:
            return JSONResponse(
                {"detail": "Too many requests. Wait a minute and try again."}, status_code=429
            )
        q.append(now)
        try:
            size = int(request.headers.get("content-length", "0"))
        except ValueError:
            return JSONResponse({"detail": "Invalid request length."}, status_code=400)
        if size > 11 * 1024 * 1024:
            return JSONResponse(
                {"detail": "Upload is too large. Maximum file size is 10 MB."}, status_code=413
            )
        # Enforce a streamed-body limit, including requests without Content-Length.
        body = bytearray()
        async for chunk in request.stream():
            body.extend(chunk)
            if len(body) > 11 * 1024 * 1024:
                return JSONResponse({"detail": "Request is too large."}, status_code=413)
        request._body = bytes(body)
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@app.get("/health")
def health():
    return {"status": "ok", "provider": "rules", "persistence": "none"}


@app.get("/samples")
def get_samples():
    return samples


@app.post("/samples/{sample_id}", response_model=Analysis)
def sample(sample_id: str):
    s = next((s for s in samples if s["id"] == sample_id), None)
    if not s:
        raise HTTPException(404, "Sample not found.")
    return analyze(s["text"], "US-TX", True, "Synthetic text fixture")


@app.post("/analyze", response_model=Analysis)
def analyze_text(body: TextRequest):
    return analyze(body.text, body.jurisdiction)


@app.post("/upload", response_model=Analysis)
async def upload(
    file: Annotated[UploadFile, File()], jurisdiction: Annotated[str | None, Form()] = None
):
    try:
        data = await file.read(10 * 1024 * 1024 + 1)
        if len(data) > 10 * 1024 * 1024:
            raise HTTPException(413, "File exceeds 10 MB.")
        try:
            text, method = await run_in_threadpool(parse, data)
        except ParseError as exc:
            raise HTTPException(422, str(exc)) from exc
        return analyze(text, jurisdiction, method=method)
    finally:
        await file.close()


@app.post("/verify", response_model=Claim)
def proof_check(body: Candidate):
    return verify(body)


@app.get("/evaluation")
def evaluation():
    path = ROOT / "sample-data/evaluation-results.json"
    if not path.exists():
        return {
            "available": False,
            "message": "Run python -m app.evaluate from backend to generate measured results.",
        }
    return {"available": True, **json.loads(path.read_text())}
