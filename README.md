# Legal Intelligence Hub — AI-Powered Contract Analysis Platform

**Legal Intelligence Hub** is an enterprise-grade legal document analysis and contract intelligence platform. It enables legal teams, general counsels, procurement managers, and corporate reviewers to upload complex contracts, interrogate clauses using Retrieval-Augmented Generation (RAG), execute natural language semantic search, identify high-risk commercial provisions across 8 dimensions, and verify every AI response with clickable, page-level citations.

---

## Key Capabilities

1. **Strict Page-Level Grounded Citations**:
   - Every AI response anchors its statements in bracketed citations: `[Document Name, Page X]`.
   - Clickable citation badges in the chat interface instantly open the verified contract page in the integrated document viewer.
   - Grounded anti-hallucination guardrails: if an answer is not supported by the document text, the system explicitly states that the contract does not provide sufficient information rather than fabricating facts.

2. **8-Dimension Contract Risk Audit**:
   - Automated compliance and exposure audit across 8 key legal dimensions:
     - **Termination Conditions** (Notice periods, cure periods, convenience exits)
     - **Indemnification Obligations** (Scope of defense, reciprocal coverage)
     - **Liability Limitations** (Aggregate caps, consequential damage disclaimers)
     - **Confidentiality Requirements** (Sunset durations, standard carve-outs)
     - **Payment Conditions** (Invoicing frequency, late interest, withholding rights)
     - **Renewal Clauses** (Automatic extension, notice deadlines)
     - **Governing Law & Jurisdiction** (Statutory choice of law, arbitration forums)
     - **Missing or Unclear Provisions** (Boilerplate covenants, merger clauses, assignment)
   - Risk ratings (High, Medium, Low) with clause excerpts, explanation of concerns, and suggested questions for human review.

3. **High-Performance Document Ingestion Pipeline**:
   - **PyMuPDF (`fitz`)**: Extracts text per page preserving exact 1-based page numbers.
   - **Scanned PDF Detection**: Identifies image-only or scanned PDFs without extractable text and provides clear warnings regarding OCR requirements.
   - **Context-Preserving Recursive Chunking**: Produces overlapping segments preserving clause headers and page metadata.
   - **Sentence Transformers (`all-MiniLM-L6-v2`) & FAISS**: Produces 384-dimensional dense embeddings for high-speed cosine vector search.

4. **Executive Dashboard**:
   - Real-time telemetry: Total documents, processing queue, completed analyses, research conversations, recent document list, and audit activity feed.

5. **Security & Local-First Privacy**:
   - Local Ollama LLM orchestration prevents confidential corporate contracts from being sent to external third parties by default.
   - Cryptographic Bcrypt password hashing and JWT access-token authentication with user isolation across all endpoints.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       React + Vite + Tailwind Frontend                       │
│   Landing Page • Dashboard • Document Management • Chat • Search • Audit    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST / JWT Auth
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                            FastAPI Backend API                              │
│  /api/auth  •  /api/documents  •  /api/chat  •  /api/search  •  /api/analysis │
└──────┬───────────────────────┬──────────────────────┬────────────────┬──────┘
       │                       │                      │                │
┌──────▼─────────┐      ┌──────▼──────┐        ┌──────▼──────┐  ┌──────▼──────┐
│ PyMuPDF Engine │      │ FAISS Index │        │ Local Ollama│  │ PostgreSQL  │
│ Page Extraction│      │ Dense Vector│        │ LLM (llama3)│  │ / SQLite DB │
│ SVG Rendering  │      │ Search (384)│        │ RAG & Audit │  │ Metadata    │
└────────────────┘      └─────────────┘        └─────────────┘  └─────────────┘
```

---

## Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Axios
- **Backend**: Python 3.9–3.12+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Bcrypt, PyJWT
- **Document Processing**: PyMuPDF (`fitz`)
- **Embeddings & Vector Search**: Sentence-Transformers (`all-MiniLM-L6-v2`), FAISS (`IndexFlatIP`), NumPy, Scikit-learn
- **AI Orchestration**: LangChain, Ollama (`llama3`, `mistral`, `llama3.2`)
- **Databases**: PostgreSQL 16 (with pgvector support) / SQLite (zero-config local default)

---

## Quick Start & Installation

### Prerequisites
- Node.js (v18+) & npm
- Python (3.9+) & pip
- Optional: [Ollama](https://ollama.com/) for local LLM inference
- Optional: Docker & Docker Compose

---

### Method A: Local Native Setup (Recommended for Development)

#### 1. Clone & Set Up Backend

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Initialize database
python app/db/init_db.py

# Generate sample contract PDF for testing
python scripts/generate_sample_contract.py

# Start the FastAPI backend server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The backend API and interactive OpenAPI documentation will be accessible at:
- **API Root**: [http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/api/docs](http://127.0.0.1:8000/api/docs)
- **Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

#### 2. Set Up Frontend

```bash
cd frontend

# Install dependencies
npm install

# Build production bundle (or start development server)
npm run build
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### Method B: Docker Compose Deployment

To run the complete platform including PostgreSQL, Ollama, backend, and frontend via Docker:

```bash
# Copy environment configuration
cp .env.example .env

# Start all services
docker compose up --build -d

# Pull the default LLM model inside the Ollama container
docker exec -it legal_hub_ollama ollama pull llama3
```

Access points:
- **Frontend Web App**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Backend**: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
- **PostgreSQL**: `localhost:5432` (db: `legal_hub`, user: `legal_user`)

---

## Configuring Ollama for Local Inference

1. Download and install Ollama from [https://ollama.com](https://ollama.com).
2. Start the Ollama background daemon:
   ```bash
   ollama serve
   ```
3. Pull the recommended legal analysis model:
   ```bash
   ollama pull llama3
   # or for smaller footprint:
   ollama pull llama3.2
   ```
4. Verify the Ollama endpoint responds:
   ```bash
   curl http://localhost:11434/api/tags
   ```

> **Resilient Offline Architecture**: If Ollama is offline or not installed, the platform automatically activates its **grounded extractive QA engine**. It retrieves the most relevant contract clauses via FAISS and formats exact `[Document, Page X]` citations, ensuring the platform remains fully functional in any environment.

---

## Running the Test Suite

The test suite validates authentication, PDF text extraction, scanned PDF detection, chunking with page retention, semantic retrieval, citations format, unsupported question handling, and user isolation.

```bash
cd backend
source venv/bin/activate

# Run all 18 automated unit and integration tests
pytest tests -v

# Run the end-to-end pipeline verification script
python scripts/verify_e2e_pipeline.py
```

---

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` — Register new user account
- `POST /api/auth/login` — Authenticate and obtain JWT Bearer token
- `GET /api/auth/me` — Retrieve current authenticated user profile

### Documents
- `POST /api/documents/upload` — Upload PDF contract and trigger parsing pipeline
- `GET /api/documents` — List user's uploaded documents with statuses
- `GET /api/documents/{id}` — Get document metadata, chunk counts, and finding stats
- `GET /api/documents/{id}/pages/{page}` — Inspect page text and vector SVG render
- `GET /api/documents/{id}/file` — Stream original PDF for browser viewing
- `DELETE /api/documents/{id}` — Delete document, database records, and vector indices

### AI & Analysis
- `POST /api/chat` — Submit legal query to RAG pipeline with citations
- `GET /api/chat/history` — List user's conversation threads
- `GET /api/chat/{id}` — Retrieve conversation message stream
- `DELETE /api/chat/{id}` — Delete conversation thread
- `POST /api/search` — Vector similarity semantic search across contract clauses
- `POST /api/documents/{id}/analyze` — Trigger 8-dimension contract risk audit
- `GET /api/documents/{id}/analysis` — Retrieve contract risk audit findings
- `GET /api/dashboard/stats` — Real-time telemetry metrics for executive dashboard

---

## Troubleshooting & FAQ

### 1. Scanned Image-Only PDFs
- **Symptom**: Document status displays `Scanned / OCR Needed`.
- **Reason**: The uploaded PDF contains scanned images or photos with negligible extractable text.
- **Resolution**: PyMuPDF detects scanned documents and flags them rather than silently returning empty chunks. Upload a digitally generated or searchable PDF.

### 2. Ollama Connection Unavailable
- **Symptom**: Chat answers note that Ollama is offline.
- **Resolution**: Ensure Ollama is running (`ollama serve`) and the model is downloaded (`ollama pull llama3`). If Ollama is not running, the application continues to answer questions using its built-in grounded clause extractor.

### 3. Password Hashing on Different OS Platforms
- Direct `bcrypt` with salt is used across all endpoints, eliminating deprecation warnings and ensuring cross-platform stability.

---

## Legal & Compliance Disclaimer

> **Important**: All assessments, risk categorizations (High, Medium, Low), and summaries generated by Legal Intelligence Hub are preliminary automated evaluations intended solely to assist human legal and procurement professionals. They do not constitute formal legal counsel, statutory certification, or professional attorney advice. Users must review citations and primary contract documents directly before taking commercial or legal actions.
