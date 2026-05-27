"""
chroma_service.py — ChromaDB operations for MemoryWeave semantic search.
Uses ChromaDB's built-in embedding function (onnxruntime, no PyTorch required).
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Optional

import chromadb
from dotenv import load_dotenv
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction

load_dotenv()
load_dotenv(Path(__file__).resolve().parents[1] / ".env")


class ChromaService:
    def __init__(self):
        self.client = chromadb.HttpClient(
            host=os.getenv("CHROMA_HOST", "localhost"),
            port=int(os.getenv("CHROMA_PORT", 8001)),
        )
        # DefaultEmbeddingFunction uses all-MiniLM-L6-v2 via onnxruntime (lightweight)
        self.ef = DefaultEmbeddingFunction()
        self.collection = self.init_collection()

    def init_collection(self):
        """Get or create the memoryweave_knowledge collection."""
        return self.client.get_or_create_collection(
            name="memoryweave_knowledge", embedding_function=self.ef
        )

    def add_documents(self, chunks: list[dict]):
        """
        Embed and store document chunks.
        Each chunk: { id, text, source_type, source_name, author, timestamp, entities }
        """
        if not chunks:
            return

        ids = [chunk["id"] for chunk in chunks]
        documents = [chunk["text"] for chunk in chunks]
        metadatas = [self._metadata(chunk) for chunk in chunks]
        self.collection.upsert(ids=ids, documents=documents, metadatas=metadatas)

    def search(self, query: str, n_results: int = 5) -> list[dict]:
        """
        Semantic search over indexed chunks.
        Returns list of { text, metadata, distance } sorted by relevance.
        """
        result = self.collection.query(query_texts=[query], n_results=n_results)
        documents = result.get("documents", [[]])[0]
        metadatas = result.get("metadatas", [[]])[0]
        distances = result.get("distances", [[]])[0]

        return [
            {"text": text, "metadata": metadata or {}, "distance": distance}
            for text, metadata, distance in zip(documents, metadatas, distances)
        ]

    def get_stats(self) -> dict:
        """Return { count, sources } for the collection."""
        count = self.collection.count()
        sources = set()

        if count:
            records = self.collection.get(include=["metadatas"], limit=count)
            for metadata in records.get("metadatas", []):
                if metadata and metadata.get("source_name"):
                    sources.add(metadata["source_name"])

        return {"count": count, "sources": sorted(sources)}

    @staticmethod
    def _metadata(chunk: dict) -> dict:
        metadata = {
            "source_type": chunk.get("source_type", ""),
            "source_name": chunk.get("source_name", ""),
            "author": chunk.get("author", ""),
            "timestamp": chunk.get("timestamp", ""),
        }
        entities = chunk.get("entities", [])
        metadata["entities"] = (
            json.dumps(entities, sort_keys=True) if not isinstance(entities, str) else entities
        )
        return metadata
