import re
import json
import logging
import requests
from typing import List, Dict, Any, Optional, Tuple
from app.core.config import settings
from app.services.vector_store import vector_store
import google.generativeai as genai

logger = logging.getLogger(__name__)

LEGAL_SYSTEM_PROMPT = """You are Legal Intelligence Hub AI, a rigorous legal document analysis assistant.
Your answers MUST be strictly grounded in the provided document excerpts.
Rules:
1. Every legal statement or factual point must cite the source document and page number in this exact bracketed format: [Document Name, Page X]. For example: "According to [Non-Disclosure Agreement.pdf, Page 2], the agreement terminates..."
2. If the provided document excerpts do not contain sufficient information to answer the question, explicitly state: "The uploaded documents do not provide sufficient information to answer this question."
3. DO NOT fabricate, extrapolate, or invent legal clauses, terms, or citations.
4. Keep answers professional, concise, objective, and clearly structured with bullet points where appropriate."""

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

class RAGService:
    @staticmethod
    def extract_citations(text: str, context_chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract citations from text matching `[Document Name, Page X]`
        and cross-reference with retrieved chunks to supply exact excerpt and IDs.
        """
        citations = []
        seen = set()

        # Regex for bracketed citations: [DocName, Page 3] or [DocName.pdf, Page 3]
        pattern = r'\[([^,\]]+),\s*Page\s*(\d+)\]'
        matches = re.findall(pattern, text, re.IGNORECASE)

        for doc_title, page_str in matches:
            page_num = int(page_str)
            clean_title = doc_title.strip()
            key = (clean_title.lower(), page_num)
            if key in seen:
                continue
            seen.add(key)

            # Find matching context chunk
            matched_chunk = None
            for c in context_chunks:
                c_title = c.get("document_title", "").strip().lower()
                if (c_title in clean_title.lower() or clean_title.lower() in c_title) and c.get("page_number") == page_num:
                    matched_chunk = c
                    break

            if matched_chunk:
                citations.append({
                    "document_id": matched_chunk.get("document_id", ""),
                    "document_title": matched_chunk.get("document_title", clean_title),
                    "page_number": page_num,
                    "excerpt": matched_chunk.get("excerpt", "")
                })
            elif context_chunks:
                # Default to closest available context chunk for that page
                matching_page_chunk = next((c for c in context_chunks if c.get("page_number") == page_num), context_chunks[0])
                citations.append({
                    "document_id": matching_page_chunk.get("document_id", ""),
                    "document_title": clean_title,
                    "page_number": page_num,
                    "excerpt": matching_page_chunk.get("excerpt", "")
                })

        # If model didn't explicitly format citations with brackets but used context:
        if not citations and context_chunks:
            # Include top 2 context chunks as source citations
            for c in context_chunks[:2]:
                citations.append({
                    "document_id": c.get("document_id", ""),
                    "document_title": c.get("document_title", "Document"),
                    "page_number": c.get("page_number", 1),
                    "excerpt": c.get("excerpt", "")
                })

        return citations

    @staticmethod
    def _query_gemini(prompt: str, system_prompt: str) -> Optional[str]:
        """Send prompt to Gemini hosted API."""
        try:
            if not settings.GEMINI_API_KEY:
                logger.warning("GEMINI_API_KEY is missing; Gemini generation unavailable.")
                return None

            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            response = model.generate_content([
                {"role": "user", "parts": [{"text": system_prompt + "\n\n" + prompt}]}
            ])
            return response.text.strip() if getattr(response, "text", None) else None
        except Exception as e:
            logger.info(f"Gemini generation unavailable: {e}")
            return None

    @staticmethod
    def _generate_grounded_fallback(
        query: str,
        context_chunks: List[Dict[str, Any]]
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Extractive RAG fallback when Gemini is unavailable.
        """
        if not context_chunks:
            return (
                "The uploaded documents do not provide sufficient information to answer this question. "
                "No matching contract clauses were found for your query.",
                []
            )

        query_terms = set(re.findall(r'\b\w{3,}\b', query.lower()))
        # Remove common query stop words
        stop_words = {"what", "which", "where", "when", "does", "have", "with", "from", "that", "this", "about"}
        terms = query_terms - stop_words

        extracted_findings = []
        citations = []

        for chunk in context_chunks[:4]:
            text = chunk.get("content", "")
            doc_title = chunk.get("document_title", "Contract")
            page_num = chunk.get("page_number", 1)

            # Split sentences
            sentences = re.split(r'(?<=[.!?])\s+', text)
            matching_sentences = []

            for sent in sentences:
                sent_clean = sent.strip()
                if not sent_clean or len(sent_clean) < 15:
                    continue
                sent_lower = sent_clean.lower()
                # Check overlap
                overlap = sum(1 for t in terms if t in sent_lower)
                if overlap > 0 or len(sentences) <= 3:
                    matching_sentences.append((overlap, sent_clean))

            if matching_sentences:
                matching_sentences.sort(key=lambda x: x[0], reverse=True)
                top_sent = " ".join([s[1] for s in matching_sentences[:3]])
                cite_tag = f"[{doc_title}, Page {page_num}]"
                extracted_findings.append(f"• According to {cite_tag}:\n  \"{top_sent}\"")
                citations.append({
                    "document_id": chunk.get("document_id", ""),
                    "document_title": doc_title,
                    "page_number": page_num,
                    "excerpt": chunk.get("excerpt", top_sent[:250])
                })

        if not extracted_findings:
            # Fallback to general chunk context
            c = context_chunks[0]
            doc_title = c.get("document_title", "Contract")
            page_num = c.get("page_number", 1)
            cite_tag = f"[{doc_title}, Page {page_num}]"
            answer = (
                f"Based on {cite_tag}:\n\n"
                f"\"{c.get('content')[:400]}...\"\n\n"
                "> *Note: Gemini generation is currently unavailable. Extracted directly from retrieved contract clauses.*"
            )
            return answer, [{
                "document_id": c.get("document_id", ""),
                "document_title": doc_title,
                "page_number": page_num,
                "excerpt": c.get("excerpt", "")
            }]

        answer = (
            f"Here are the relevant provisions identified in your contract regarding **{query}**:\n\n"
            + "\n\n".join(extracted_findings)
            + "\n\n> *Note: Synthesized from indexed document text. Gemini generation is used when available.*"
        )
        return answer, citations

    @classmethod
    def answer_question(
        cls,
        query: str,
        user_id: str,
        document_id: Optional[str] = None,
        top_k: int = 5
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Executes end-to-end RAG using hosted Gemini models.
        """
        chunks = vector_store.search(
            query=query,
            user_id=user_id,
            document_id=document_id,
            top_k=top_k
        )

        if not chunks:
            return (
                "The uploaded documents do not provide sufficient information to answer this question. "
                "Please verify that the document is processed or upload the relevant agreement.",
                []
            )

        # Assemble context string
        context_parts = []
        for idx, c in enumerate(chunks):
            doc_title = c.get("document_title", "Contract")
            page_num = c.get("page_number", 1)
            content = c.get("content", "").strip()
            context_parts.append(
                f"--- EXCERPT {idx + 1} from [{doc_title}, Page {page_num}] ---\n{content}\n"
            )

        context_str = "\n".join(context_parts)

        prompt = (
            f"Context from uploaded legal documents:\n\n{context_str}\n\n"
            f"User Question: {query}\n\n"
            f"Instructions:\n"
            f"- Answer the user's question clearly, thoroughly, and objectively based ONLY on the excerpts above.\n"
            f"- Cite every point using the format [Document Name, Page X].\n"
            f"- If the excerpts do not contain the answer, say 'The uploaded documents do not provide sufficient information to answer this question.'\n\n"
            f"Answer:"
        )

        gemini_response = cls._query_gemini(prompt, LEGAL_SYSTEM_PROMPT)
        if gemini_response:
            citations = cls.extract_citations(gemini_response, chunks)
            return gemini_response, citations

        return cls._generate_grounded_fallback(query, chunks)

rag_service = RAGService()
