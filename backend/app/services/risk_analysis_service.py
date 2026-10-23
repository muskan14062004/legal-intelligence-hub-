import re
import json
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.document import Document
from app.models.chunk import DocumentChunk
from app.models.analysis import AnalysisFinding

logger = logging.getLogger(__name__)

# Categories to evaluate
LEGAL_DIMENSIONS = [
    {
        "category": "Termination Conditions",
        "keywords": ["terminate", "termination", "for convenience", "breach", "notice period", "cure period", "immediate termination"],
        "high_risk_patterns": [r"without cause", r"for convenience", r"immediate(?:ly)? without notice", r"sole discretion"],
        "default_title": "Termination and Cancellation Rights",
        "explanation": "Contract provides unilateral or broad termination rights without adequate cure periods.",
        "risk_if_found": "High",
        "risk_if_missing": "Medium",
        "questions": [
            "Does the agreement require written notice and a reasonable cure period (e.g. 30 days) prior to termination?",
            "Can either party terminate for convenience, and what are the accrued payment obligations upon early termination?"
        ]
    },
    {
        "category": "Indemnification Obligations",
        "keywords": ["indemnify", "indemnification", "hold harmless", "defend", "losses", "damages", "claims"],
        "high_risk_patterns": [r"indemnify.*hold harmless", r"sole expense", r"unlimited indemnification", r"defend and hold harmless"],
        "default_title": "Indemnity and Defense Obligations",
        "explanation": "Broad indemnification clause requires defending against third-party claims without reciprocal protection or liability cap.",
        "risk_if_found": "High",
        "risk_if_missing": "Low",
        "questions": [
            "Is the indemnity obligation mutual between both parties?",
            "Are indemnification claims subject to the overall limitation of liability cap?",
            "Does the indemnifying party have the right to control the defense and settlement of claims?"
        ]
    },
    {
        "category": "Liability Limitations",
        "keywords": ["limitation of liability", "consequential damages", "indirect damages", "maximum aggregate liability", "cap on liability", "punitive damages"],
        "high_risk_patterns": [r"in no event.*liable", r"exceed the fees paid", r"no cap", r"unlimited liability"],
        "default_title": "Cap on Damages and Liability",
        "explanation": "Provisions define aggregate financial exposure or disclaim special, indirect, or consequential damages.",
        "risk_if_found": "Medium",
        "risk_if_missing": "High",
        "questions": [
            "Is the liability cap pegged to total fees paid within the preceding 12 months?",
            "Are gross negligence, willful misconduct, and confidentiality breaches excluded from the liability cap?"
        ]
    },
    {
        "category": "Confidentiality Requirements",
        "keywords": ["confidential information", "non-disclosure", "proprietary", "trade secrets", "survival of confidentiality", "marking"],
        "high_risk_patterns": [r"in perpetuity", r"survive indefinitely", r"all information disclosed"],
        "default_title": "Confidentiality and Data Protection",
        "explanation": "Terms govern protection and return of proprietary information and duration of non-disclosure obligations.",
        "risk_if_found": "Low",
        "risk_if_missing": "Medium",
        "questions": [
            "Does the confidentiality obligation have a standard sunset period (e.g. 3 to 5 years)?",
            "Are standard carve-outs included (e.g., publicly available, rightfully received from third parties, required by court order)?"
        ]
    },
    {
        "category": "Payment Conditions",
        "keywords": ["payment terms", "invoicing", "late fees", "interest", "net 30", "net 60", "taxes", "disputed amounts"],
        "high_risk_patterns": [r"interest at the rate of \d+%", r"compound interest", r"net 90", r"non-refundable"],
        "default_title": "Payment Schedule and Late Penalties",
        "explanation": "Conditions dictate invoicing cycles, payment grace periods, interest rates for delayed remittances, and withholding rights.",
        "risk_if_found": "Medium",
        "risk_if_missing": "Medium",
        "questions": [
            "Can the paying party withhold disputed amounts in good faith without triggering breach or default?",
            "Are late interest penalties standard and legally compliant in the governing jurisdiction?"
        ]
    },
    {
        "category": "Renewal Clauses",
        "keywords": ["automatic renewal", "evergreen", "renewal term", "opt-out", "notice of non-renewal", "auto-renew"],
        "high_risk_patterns": [r"automatically renew", r"unless written notice is provided at least \d+ days", r"evergreen"],
        "default_title": "Automatic Renewal & Term Extension",
        "explanation": "Evergreen or automatic renewal provision binds parties to successive terms unless advance opt-out notice is delivered.",
        "risk_if_found": "Medium",
        "risk_if_missing": "Low",
        "questions": [
            "What is the exact deadline to provide non-renewal notice prior to the end of the current term?",
            "Do pricing terms increase automatically upon renewal?"
        ]
    },
    {
        "category": "Governing Law & Jurisdiction",
        "keywords": ["governing law", "jurisdiction", "venue", "arbitration", "dispute resolution", "courts of", "laws of"],
        "high_risk_patterns": [r"exclusive jurisdiction", r"waiver of jury trial", r"mandatory arbitration in"],
        "default_title": "Jurisdiction & Choice of Law",
        "explanation": "Specifies applicable statutory framework and court jurisdiction or mandatory arbitration venue for disputes.",
        "risk_if_found": "Low",
        "risk_if_missing": "Medium",
        "questions": [
            "Is the designated forum and governing law favorable or convenient to the organization?",
            "Does the arbitration clause waive class actions or allow emergency injunctive relief?"
        ]
    },
    {
        "category": "Missing or Unclear Provisions",
        "keywords": ["force majeure", "severability", "entire agreement", "assignment", "amendment", "counterparts"],
        "high_risk_patterns": [],
        "default_title": "Standard Boilerplate & Protective Covenants",
        "explanation": "Evaluation of essential protective legal covenants including Assignment, Force Majeure, and Entire Agreement.",
        "risk_if_found": "Low",
        "risk_if_missing": "Medium",
        "questions": [
            "Is there an Entire Agreement (merger) clause superseding all prior informal representations?",
            "Are assignment rights restricted without prior written consent?"
        ]
    }
]

class RiskAnalysisService:
    @staticmethod
    def analyze_document(db: Session, document: Document) -> List[AnalysisFinding]:
        """
        Analyze all chunks of a document across the 8 key legal dimensions.
        Identifies present clauses or flags missing protective provisions.
        """
        # Remove any prior findings for clean re-analysis
        db.query(AnalysisFinding).filter(AnalysisFinding.document_id == document.id).delete()
        db.commit()

        chunks = db.query(DocumentChunk).filter(
            DocumentChunk.document_id == document.id
        ).order_by(DocumentChunk.chunk_index).all()

        if not chunks:
            logger.warning(f"No chunks found for document {document.id}")
            return []

        all_findings: List[AnalysisFinding] = []

        for dim in LEGAL_DIMENSIONS:
            category = dim["category"]
            keywords = dim["keywords"]
            high_risk_patterns = dim["high_risk_patterns"]
            matched_chunk = None
            extracted_snippet = ""
            is_high_risk = False

            # Search across chunks
            for c in chunks:
                content = c.content
                content_lower = content.lower()

                matches = sum(1 for kw in keywords if kw in content_lower)
                if matches >= 1:
                    matched_chunk = c
                    # Check for high risk patterns
                    for pattern in high_risk_patterns:
                        if re.search(pattern, content, re.IGNORECASE):
                            is_high_risk = True
                            break

                    # Extract the most relevant sentences
                    sentences = re.split(r'(?<=[.!?])\s+', content)
                    relevant_sents = [s.strip() for s in sentences if any(kw in s.lower() for kw in keywords)]
                    if relevant_sents:
                        extracted_snippet = " ".join(relevant_sents[:3])
                    else:
                        extracted_snippet = content[:300]
                    break

            if matched_chunk:
                # Clause was found
                risk_lvl = "High" if is_high_risk else dim["risk_if_found"]
                explanation = dim["explanation"]
                if is_high_risk:
                    explanation += " High severity language detected (e.g. unilateral right, broad forfeiture, or lack of notice)."

                finding = AnalysisFinding(
                    document_id=document.id,
                    category=category,
                    clause_title=dim["default_title"],
                    extracted_text=extracted_snippet,
                    page_number=matched_chunk.page_number,
                    explanation=explanation,
                    risk_level=risk_lvl,
                    suggested_questions=json.dumps(dim["questions"])
                )
            else:
                # Clause was not found (Missing / Unclear)
                finding = AnalysisFinding(
                    document_id=document.id,
                    category=category,
                    clause_title=f"Missing / Unspecified: {dim['default_title']}",
                    extracted_text="No express clause identified addressing this dimension in the uploaded document text.",
                    page_number=1,
                    explanation=f"The agreement does not explicitly articulate terms for {category.lower()}. This omission may leave rights ambiguous or governed by default statutory rules.",
                    risk_level=dim["risk_if_missing"],
                    suggested_questions=json.dumps(dim["questions"])
                )

            db.add(finding)
            all_findings.append(finding)

        db.commit()
        for f in all_findings:
            db.refresh(f)

        return all_findings

risk_analysis_service = RiskAnalysisService()
