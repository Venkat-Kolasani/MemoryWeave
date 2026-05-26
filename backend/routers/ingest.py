"""
ingest.py

Document upload and ingestion pipeline trigger.
Accepts file uploads; returns job status matching frontend api.ingestFile.

Used by: main.py
Depends on: agents/ (Codex), services/ (Codex)
"""

from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter(tags=["ingest"])

ALLOWED_EXTENSIONS = {".txt", ".md", ".json", ".csv"}


@router.post("/ingest")
async def post_ingest(file: UploadFile = File(...)) -> dict[str, str]:
    """
    Upload a file and trigger the extraction pipeline.
    Returns: { status, job_id }
    """
    # CODEX: replace this with real implementation (C3-03):
    #   - Validate extension, chunk document, run extractor agent
    #   - Persist entities to Neo4j, embeddings to ChromaDB (built-in embed fn)
    #   - from services.fireworks_config import fireworks_client_kwargs, get_fireworks_model
    #       model = get_fireworks_model("extraction")  # llama-v3p1-70b (single-model setup)
    filename = file.filename or "upload"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    await file.read()

    return {"status": "processing", "job_id": "demo-001"}
