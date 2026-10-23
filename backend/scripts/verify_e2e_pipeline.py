import os
import sys
from fastapi.testclient import TestClient

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

def run_e2e_verification():
    print("=" * 60)
    print("LEGAL INTELLIGENCE HUB — END-TO-END PIPELINE VERIFICATION")
    print("=" * 60)

    client = TestClient(app)

    # 1. Register User
    print("\n1. Testing User Registration...")
    reg_res = client.post(
        "/api/auth/register",
        json={
            "email": "lead.counsel@lextech.com",
            "password": "FirmPassword2026",
            "full_name": "Sarah Jenkins, General Counsel"
        }
    )
    if reg_res.status_code == 400 and "already exists" in reg_res.text:
        # Login if already exists
        login_res = client.post(
            "/api/auth/login",
            json={"email": "lead.counsel@lextech.com", "password": "FirmPassword2026"}
        )
        token = login_res.json()["access_token"]
    else:
        assert reg_res.status_code == 201
        token = reg_res.json()["access_token"]
    print("✓ Authentication successful. JWT token issued.")

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload Sample Contract PDF
    print("\n2. Uploading 'Master_Services_Agreement.pdf'...")
    pdf_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "sample_contracts", "Master_Services_Agreement.pdf"))
    assert os.path.exists(pdf_path), f"Sample PDF missing at {pdf_path}"

    with open(pdf_path, "rb") as f:
        upload_res = client.post(
            "/api/documents/upload",
            headers=headers,
            files={"file": ("Master_Services_Agreement.pdf", f, "application/pdf")}
        )
    assert upload_res.status_code == 201
    doc_data = upload_res.json()
    doc_id = doc_data["id"]
    print(f"✓ Uploaded successfully. Document ID: {doc_id}")

    # Process pipeline immediately
    from app.api.documents import process_document_pipeline
    process_document_pipeline(doc_id)

    # 3. Check Document Details & Chunks
    print("\n3. Verifying Document Ingestion Status...")
    doc_res = client.get(f"/api/documents/{doc_id}", headers=headers)
    assert doc_res.status_code == 200
    doc_detail = doc_res.json()
    print(f"✓ Status: {doc_detail['status']}")
    print(f"✓ Pages: {doc_detail['page_count']}")
    print(f"✓ Chunks indexed: {doc_detail['total_chunks']}")
    print(f"✓ Risk findings generated: {doc_detail['total_findings']}")
    assert doc_detail["status"] == "completed"
    assert doc_detail["page_count"] == 3
    assert doc_detail["total_chunks"] >= 3

    # 4. Check Page-Level Inspection
    print("\n4. Testing PyMuPDF Page Text and SVG Vector Rendering...")
    page_res = client.get(f"/api/documents/{doc_id}/pages/2", headers=headers)
    assert page_res.status_code == 200
    p_data = page_res.json()
    assert p_data["page_number"] == 2
    assert "indemnif" in p_data["text"].lower()
    assert p_data["svg_data"] is not None and "<svg" in p_data["svg_data"]
    print("✓ Page 2 text extraction and SVG vector render verified.")

    # 5. Semantic Search
    print("\n5. Testing Vector Semantic Search Across Contract Clauses...")
    search_res = client.post(
        "/api/search",
        headers=headers,
        json={"query": "What are the rules for early contract termination?", "document_id": doc_id}
    )
    assert search_res.status_code == 200
    search_data = search_res.json()
    print(f"✓ Search returned {search_data['total_results']} matching clause passages.")
    for r in search_data["results"][:2]:
        print(f"  • Matched Page {r['page_number']} with {round(r['score']*100)}% similarity: {r['excerpt'][:80]}...")

    # 6. RAG Question Answering with Page-Level Citations
    print("\n6. Testing AI Document Chat RAG with Grounded Citations...")
    chat_res = client.post(
        "/api/chat",
        headers=headers,
        json={"message": "What is the notice period required to terminate for convenience?", "document_id": doc_id}
    )
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assistant_msg = chat_data["message"]
    print(f"✓ AI Answer:\n{assistant_msg['content']}\n")
    print(f"✓ Citations extracted: {len(assistant_msg['citations'])}")
    for c in assistant_msg["citations"]:
        print(f"  • Citation: [{c['document_title']}, Page {c['page_number']}]")
        assert c["page_number"] in (1, 2, 3)

    # 7. Contract Risk Analysis across 8 Legal Dimensions
    print("\n7. Testing Contract Risk Analysis (8 Dimensions)...")
    audit_res = client.get(f"/api/documents/{doc_id}/analysis", headers=headers)
    assert audit_res.status_code == 200
    audit_data = audit_res.json()
    print(f"✓ Total Findings: {audit_data['total_findings']}")
    print(f"✓ High Risk: {audit_data['high_risk_count']}, Medium Risk: {audit_data['medium_risk_count']}, Low Risk: {audit_data['low_risk_count']}")
    for f in audit_data["findings"]:
        print(f"  • [{f['risk_level']} Risk] {f['category']}: {f['clause_title']} (Page {f['page_number']})")

    # 8. Dashboard Statistics Telemetry
    print("\n8. Testing Executive Dashboard Metrics...")
    stats_res = client.get("/api/dashboard/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    print(f"✓ Dashboard Total Documents: {stats['total_documents']}")
    print(f"✓ Completed Analyses: {stats['completed_analyses']}")
    print(f"✓ Recent Activities Logged: {len(stats['recent_activities'])}")

    print("\n" + "=" * 60)
    print("ALL END-TO-END PIPELINE VERIFICATIONS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_e2e_verification()
