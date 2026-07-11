import logging
from typing import Optional
from pydantic import BaseModel

from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from app.rag.rag_engine import rag_engine
from app.rag.vector_store import vector_store

logger = logging.getLogger("ai_engine.api.documents")
router = APIRouter(prefix="/documents", tags=["Documents"])


class SearchRequest(BaseModel):
    query: str
    k: int = 5
    filter_criteria: Optional[dict] = None
    use_hybrid: bool = True


class IngestTextRequest(BaseModel):
    text: str
    source: str = "inline"


@router.post("/ingest")
async def ingest_document(file: UploadFile = File(...)):
    try:
        import tempfile
        import os
        from pathlib import Path

        suffix = Path(file.filename).suffix if file.filename else ".txt"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        try:
            result = rag_engine.ingest_file(tmp_path)
            logger.info(f"Ingested document {file.filename}: {result['chunks']} chunks")
            return {
                "message": "Document ingested successfully",
                "filename": file.filename,
                "chunks": result["chunks"],
                "ids": result["ids"],
            }
        finally:
            os.unlink(tmp_path)
    except Exception as e:
        logger.error(f"Document ingestion error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ingest-text")
async def ingest_text(request: IngestTextRequest):
    try:
        result = rag_engine.ingest_text(request.text, source=request.source)
        logger.info(f"Ingested text ({request.source}): {result['chunks']} chunks")
        return {
            "message": "Text ingested successfully",
            "source": request.source,
            "chunks": result["chunks"],
            "ids": result["ids"],
        }
    except Exception as e:
        logger.error(f"Text ingestion error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    try:
        success = vector_store.delete_document(doc_id)
        if success:
            return {"message": f"Document {doc_id} deleted successfully"}
        raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete document error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def list_documents(offset: int = 0, limit: int = 50):
    try:
        docs = vector_store.list_documents(offset=offset, limit=limit)
        total = vector_store.count()
        return {
            "total": total,
            "offset": offset,
            "limit": limit,
            "documents": docs,
        }
    except Exception as e:
        logger.error(f"List documents error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search")
async def search_documents(request: SearchRequest):
    try:
        results = rag_engine.retrieve(
            query=request.query,
            k=request.k,
            filter_criteria=request.filter_criteria,
            use_hybrid=request.use_hybrid,
        )
        return {
            "query": request.query,
            "results": results,
            "total": len(results),
        }
    except Exception as e:
        logger.error(f"Search documents error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
