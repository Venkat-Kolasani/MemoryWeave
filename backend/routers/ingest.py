"""
ingest.py

Document upload and ingestion pipeline trigger.
Accepts file uploads; returns job status matching frontend api.ingestFile.

Used by: main.py
Depends on: agents/ (Codex), services/ (Codex)
"""

from fastapi import APIRouter, File, HTTPException, UploadFile

try:
    from agents.pipeline import run_extraction_pipeline
    from services.chroma_service import ChromaService
    from services.neo4j_service import Neo4jService
except ModuleNotFoundError:
    from backend.agents.pipeline import run_extraction_pipeline
    from backend.services.chroma_service import ChromaService
    from backend.services.neo4j_service import Neo4jService

router = APIRouter(tags=["ingest"])

ALLOWED_EXTENSIONS = {".txt", ".md", ".json", ".csv"}


@router.post("/ingest")
async def post_ingest(file: UploadFile = File(...)) -> dict:
    """
    Upload a file and trigger the extraction pipeline.
    Returns: { status, job_id }
    """
    filename = file.filename or "upload"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    raw_content = await file.read()
    try:
        content = raw_content.decode("utf-8")
    except UnicodeDecodeError as e:
        raise HTTPException(status_code=400, detail="File must be UTF-8 text") from e

    neo4j = Neo4jService()
    chroma = ChromaService()
    try:
        summary = run_extraction_pipeline(
            content,
            ext.removeprefix(".") or "upload",
            filename,
            neo4j,
            chroma,
        )
    finally:
        neo4j.close()

    return {"status": "completed", "job_id": filename, **summary}
