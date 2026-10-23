import os
import pytest
import fitz
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.main import app
from app.core.security import create_access_token

# Use SQLite for tests
TEST_DB_URL = "sqlite:///./test_legal_hub.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_legal_hub.db"):
        try:
            os.remove("./test_legal_hub.db")
        except Exception:
            pass

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def sample_pdf_path(tmp_path):
    """
    Creates a real 3-page sample legal contract using PyMuPDF.
    """
    pdf_path = str(tmp_path / "Master_Services_Agreement.pdf")
    doc = fitz.open()

    # Page 1: Definitions & Scope
    page1 = doc.new_page()
    text1 = (
        "MASTER SERVICES AGREEMENT\n\n"
        "This Master Services Agreement is entered into between Acme Corp ('Client') and TechCorp Solutions ('Vendor').\n\n"
        "Section 1. Scope of Services.\n"
        "Vendor agrees to provide enterprise software consulting and data engineering services as specified in Statements of Work.\n\n"
        "Section 2. Fees and Payment Terms.\n"
        "Client shall pay all undisputed invoiced fees within thirty (30) days from receipt of invoice (Net 30). "
        "Overdue payments shall accrue interest at 1.5% per month."
    )
    page1.insert_text((50, 72), text1, fontsize=11)

    # Page 2: Confidentiality & Indemnification
    page2 = doc.new_page()
    text2 = (
        "Section 3. Confidentiality and Non-Disclosure.\n"
        "Each party agrees to maintain all Confidential Information received from the other party in strict confidence. "
        "Confidentiality obligations shall survive for a period of three (3) years following termination.\n\n"
        "Section 4. Indemnification Obligations.\n"
        "Vendor shall indemnify, defend, and hold harmless Client from and against third-party claims, damages, "
        "losses, and expenses arising out of intellectual property infringement or gross negligence."
    )
    page2.insert_text((50, 72), text2, fontsize=11)

    # Page 3: Termination & Governing Law
    page3 = doc.new_page()
    text3 = (
        "Section 5. Term and Termination.\n"
        "Either party may terminate this Agreement for convenience upon providing thirty (30) days prior written notice. "
        "In the event of a material breach, the non-breaching party may terminate immediately if breach is not cured within 15 days.\n\n"
        "Section 6. Limitation of Liability.\n"
        "In no event shall either party's maximum aggregate liability exceed the total fees paid under this Agreement in the preceding 12 months.\n\n"
        "Section 7. Governing Law.\n"
        "This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware."
    )
    page3.insert_text((50, 72), text3, fontsize=11)

    doc.save(pdf_path)
    doc.close()
    return pdf_path

@pytest.fixture
def scanned_pdf_path(tmp_path):
    """
    Creates an image-only PDF with zero text characters to test scanned PDF detection.
    """
    pdf_path = str(tmp_path / "Scanned_Agreement_NoText.pdf")
    doc = fitz.open()
    page = doc.new_page()
    # Draw simple vector rect and dummy image without text
    pix = fitz.Pixmap(fitz.csRGB, (0, 0, 100, 100), 0)
    pix.clear_with(255)
    page.insert_image(page.rect, pixmap=pix)
    doc.save(pdf_path)
    doc.close()
    return pdf_path
