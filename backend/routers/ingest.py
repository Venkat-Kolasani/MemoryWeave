"""
ingest.py

POST /ingest endpoint — accepts file upload, runs extraction pipeline in background.
Returns job summary immediately while pipeline updates Neo4j + ChromaDB.

Used by: main.py
Depends on: agents/pipeline.py, services/neo4j_service.py, services/chroma_service.py
"""

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile

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


def run_pipeline_task(content: str, source_type: str, filename: str) -> None:
    """
    Background task: run full extraction pipeline.
    Separated so the HTTP response returns immediately.
    """
    neo4j = Neo4jService()
    chroma = ChromaService()
    try:
        chroma.init_collection()
        result = run_extraction_pipeline(content, source_type, filename, neo4j, chroma)
        print(f"[ingest] pipeline complete for {filename}: {result}")
    except Exception as e:
        print(f"[ingest] pipeline failed for {filename}: {e}")
    finally:
        neo4j.close()


@router.post("/ingest")
async def ingest_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
) -> dict:
    """
    Accept file upload and trigger extraction pipeline as a background task.
    Returns immediately with job info — pipeline runs async.
    Supported: .txt .md .json .csv
    """
    filename = file.filename or "upload"
    suffix = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{suffix}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    content_bytes = await file.read()
    try:
        content = content_bytes.decode("utf-8")
    except UnicodeDecodeError as e:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded text") from e

    if len(content.strip()) < 50:
        raise HTTPException(status_code=400, detail="File content too short to extract from")

    source_type = "document"
    name_lower = filename.lower()
    if "slack" in name_lower or suffix == ".json":
        source_type = "slack"
    elif any(token in name_lower for token in ("incident", "p-", "outage", "postmortem")):
        source_type = "incident"
    elif any(token in name_lower for token in ("runbook", "doc", "guide", "readme")):
        source_type = "document"

    background_tasks.add_task(run_pipeline_task, content, source_type, filename)

    return {
        "status": "processing",
        "job_id": f"job_{filename.replace('.', '_')}",
        "filename": filename,
        "source_type": source_type,
        "message": "Extraction pipeline started. Graph will update within 30-60 seconds.",
    }
