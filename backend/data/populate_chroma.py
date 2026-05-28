"""
populate_chroma.py — Index demo data into ChromaDB.
Run: python backend/data/populate_chroma.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from services.chroma_service import ChromaService

DEMO_DIR = BACKEND_DIR / "data" / "demo"
MIN_CHARS = 80
BATCH_SIZE = 50


def populate(service: ChromaService | None = None) -> dict:
    """
    Index demo corpus into ChromaDB.
    @param service: optional shared instance (required for in-memory Render mode)
    """
    chunks = []
    chunks.extend(read_slack_messages(DEMO_DIR / "messages.json"))
    chunks.extend(read_incidents(DEMO_DIR / "incidents"))
    chunks.extend(read_docs(DEMO_DIR / "docs"))

    filtered = [chunk for chunk in chunks if len(chunk["text"]) >= MIN_CHARS]

    service = service or ChromaService()
    for index in range(0, len(filtered), BATCH_SIZE):
        service.add_documents(filtered[index : index + BATCH_SIZE])

    result = service.search("payment service recovery patel")
    assert len(result) > 0
    assert any("patel" in row["text"].lower() for row in result)
    print("Search test passed")

    counts = {
        "total": len(filtered),
        "slack": sum(1 for chunk in filtered if chunk["source_type"] == "Slack"),
        "incidents": sum(
            1 for chunk in filtered if chunk["source_type"] == "Incident"
        ),
        "docs": sum(1 for chunk in filtered if chunk["source_type"] == "Docs"),
    }
    return counts


def read_slack_messages(path: Path) -> list[dict]:
    messages = json.loads(path.read_text())
    chunks = []
    step = 6
    window = 8
    for index, start in enumerate(range(0, len(messages), step)):
        group = messages[start : start + window]
        if not group:
            continue
        text = "\n".join(
            f"{item['timestamp']} {item['author']} in {item['channel']}: {item['text']}"
            for item in group
        )
        chunks.append(
            {
                "id": chunk_id("Slack", path.name, index),
                "text": text,
                "source_type": "Slack",
                "source_name": path.name,
                "author": ", ".join(sorted({item["author"] for item in group})),
                "timestamp": group[0].get("timestamp", ""),
                "entities": extract_entities(text),
            }
        )
    return chunks


def read_incidents(directory: Path) -> list[dict]:
    chunks = []
    for path in sorted(directory.glob("*.md")):
        markdown = path.read_text()
        title = first_heading(markdown) or path.stem
        sections = re.split(r"(?m)^##\s+", markdown)
        for index, section in enumerate(sections):
            section = section.strip()
            if not section:
                continue
            text = section if section.startswith("#") else f"# {title}\n\n## {section}"
            chunks.append(
                {
                    "id": chunk_id("Incident", path.stem, index),
                    "text": text,
                    "source_type": "Incident",
                    "source_name": path.name,
                    "author": resolved_by(markdown),
                    "timestamp": incident_date(markdown),
                    "entities": extract_entities(text),
                }
            )
    return chunks


def read_docs(directory: Path) -> list[dict]:
    chunks = []
    for path in sorted(directory.glob("*.md")):
        markdown = path.read_text()
        author = doc_author(markdown)
        paragraphs = [part.strip() for part in re.split(r"\n\s*\n", markdown) if part.strip()]
        index = 0
        for paragraph in paragraphs:
            for text in split_paragraph(paragraph, max_chars=400):
                chunks.append(
                    {
                        "id": chunk_id("Docs", path.stem, index),
                        "text": text,
                        "source_type": "Docs",
                        "source_name": path.name,
                        "author": author,
                        "timestamp": doc_last_updated(markdown),
                        "entities": extract_entities(text),
                    }
                )
                index += 1
    return chunks


def split_paragraph(paragraph: str, max_chars: int) -> list[str]:
    normalized = re.sub(r"\s+", " ", paragraph).strip()
    if len(normalized) <= max_chars:
        return [normalized]

    sentences = re.split(r"(?<=[.!?])\s+", normalized)
    chunks = []
    current = ""
    for sentence in sentences:
        if len(sentence) > max_chars:
            if current:
                chunks.append(current.strip())
                current = ""
            chunks.extend(
                sentence[start : start + max_chars]
                for start in range(0, len(sentence), max_chars)
            )
            continue

        candidate = f"{current} {sentence}".strip()
        if len(candidate) > max_chars and current:
            chunks.append(current.strip())
            current = sentence
        else:
            current = candidate

    if current:
        chunks.append(current.strip())
    return chunks


def chunk_id(source_type: str, filename: str, index: int) -> str:
    safe_filename = re.sub(r"[^a-zA-Z0-9]+", "_", filename).strip("_").lower()
    return f"{source_type.lower()}_{safe_filename}_{index}"


def first_heading(markdown: str) -> str:
    match = re.search(r"(?m)^#\s+(.+)$", markdown)
    return match.group(1).strip() if match else ""


def resolved_by(markdown: str) -> str:
    match = re.search(r"(?ims)^##\s+Resolved By\s+(.+?)(?:\n##|\Z)", markdown)
    if not match:
        return ""
    return re.sub(r"\s+", " ", match.group(1)).strip()


def incident_date(markdown: str) -> str:
    match = re.search(r"(?ims)^##\s+Date\s+(.+?)(?:\n##|\Z)", markdown)
    if not match:
        return ""
    return re.sub(r"\s+", " ", match.group(1)).strip()


def doc_author(markdown: str) -> str:
    match = re.search(r"\*\*Author:\*\*\s*(.+)", markdown)
    if match:
        return match.group(1).strip()
    owner = re.search(r"\*\*Owner:\*\*\s*(.+)", markdown)
    return owner.group(1).strip() if owner else ""


def doc_last_updated(markdown: str) -> str:
    match = re.search(r"\*\*Last updated:\*\*\s*(.+)", markdown, flags=re.I)
    return match.group(1).strip() if match else ""


def extract_entities(text: str) -> list[str]:
    known = [
        "A. Patel",
        "R. Chen",
        "M. Kim",
        "T. Walsh",
        "J. Brooks",
        "Payment API",
        "payment-api",
        "Auth Service",
        "auth-service",
        "Data Bus",
        "Deploy System",
        "Analytics",
        "P-4021",
        "P-3882",
        "P-3722",
        "P-3509",
    ]
    lower_text = text.lower()
    return sorted({entity for entity in known if entity.lower() in lower_text})


def print_summary(counts: dict) -> None:
    print(
        "Indexed "
        f"{counts['total']} chunks: "
        f"{counts['slack']} from Slack, "
        f"{counts['incidents']} from incidents, "
        f"{counts['docs']} from docs"
    )


if __name__ == "__main__":
    print_summary(populate())
