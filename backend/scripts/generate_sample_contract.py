import os
import fitz  # PyMuPDF

def generate_sample_contract():
    output_dir = os.path.join(os.path.dirname(__file__), "..", "data", "sample_contracts")
    os.makedirs(output_dir, exist_ok=True)
    pdf_path = os.path.join(output_dir, "Master_Services_Agreement.pdf")

    doc = fitz.open()

    # Page 1
    p1 = doc.new_page()
    text_p1 = (
        "MASTER SERVICES AGREEMENT (MSA)\n\n"
        "This Master Services Agreement ('Agreement') is made effective as of October 23, 2026, by and between:\n"
        "AlphaCorp Global Inc., a Delaware corporation ('Client'), and\n"
        "LexTech Solutions LLC, a California limited liability company ('Service Provider').\n\n"
        "RECITALS\n"
        "WHEREAS, Client desires to retain Service Provider to perform enterprise cloud migration, data compliance, and advisory services;\n"
        "WHEREAS, Service Provider possesses the specialized expertise and agrees to deliver such services under Statements of Work ('SOW').\n\n"
        "NOW, THEREFORE, the parties agree as follows:\n\n"
        "1. SCOPE OF SERVICES & DELIVERABLES\n"
        "1.1 Statements of Work. Service Provider shall perform the services set forth in executed SOWs in accordance with industry best practices.\n"
        "1.2 Personnel. Service Provider shall assign qualified legal-tech specialists to oversee execution.\n\n"
        "2. COMPENSATION AND PAYMENT CONDITIONS\n"
        "2.1 Invoicing. Service Provider shall invoice Client on the first business day of each calendar month for fees incurred.\n"
        "2.2 Payment Terms. Client shall pay all undisputed invoice amounts within thirty (30) days from date of receipt (Net 30).\n"
        "2.3 Late Charges. Undisputed amounts unpaid after 30 days shall accrue interest at the rate of 1.0% per month or the statutory maximum.\n"
        "2.4 Disputed Invoices. Client may withhold payment of disputed amounts in good faith provided written notice is delivered within 10 days."
    )
    p1.insert_text((50, 60), text_p1, fontsize=10)

    # Page 2
    p2 = doc.new_page()
    text_p2 = (
        "3. CONFIDENTIALITY AND PROPRIETARY INFORMATION\n"
        "3.1 Definition of Confidential Information. 'Confidential Information' includes all non-public technical, financial, and legal information.\n"
        "3.2 Standard of Care. Receiving party shall protect disclosing party's confidential data with at least reasonable care.\n"
        "3.3 Sunset Period. Confidentiality obligations under this Section 3 shall survive for five (5) years following contract expiration.\n\n"
        "4. INDEMNIFICATION OBLIGATIONS\n"
        "4.1 Service Provider Indemnity. Service Provider shall defend, indemnify, and hold harmless Client, its officers, and affiliates from "
        "and against any third-party claims, judgments, and legal expenses arising out of intellectual property infringement or gross negligence.\n"
        "4.2 Client Indemnity. Client shall indemnify Service Provider against third-party claims arising from Client-provided data materials.\n"
        "4.3 Indemnity Procedures. Indemnified party must give prompt written notice and allow indemnifying party control of defense."
    )
    p2.insert_text((50, 60), text_p2, fontsize=10)

    # Page 3
    p3 = doc.new_page()
    text_p3 = (
        "5. TERM AND TERMINATION CONDITIONS\n"
        "5.1 Initial Term. The initial term of this Agreement is twelve (12) months from the Effective Date.\n"
        "5.2 Automatic Renewal. This Agreement shall automatically renew for successive one-year terms unless either party provides written "
        "notice of non-renewal at least thirty (30) days prior to the expiration of the current term.\n"
        "5.3 Termination for Convenience. Either party may terminate this Agreement without cause for convenience upon sixty (60) days prior written notice.\n"
        "5.4 Termination for Cause. Either party may terminate immediately if the other party commits a material breach and fails to cure within 30 days.\n\n"
        "6. LIMITATION OF LIABILITY\n"
        "6.1 Consequential Damages Waiver. IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR LOST PROFITS, PUNITIVE, OR CONSEQUENTIAL DAMAGES.\n"
        "6.2 Aggregate Liability Cap. Each party's maximum aggregate liability shall be capped at the total fees paid by Client during the twelve (12) "
        "months preceding the claim.\n\n"
        "7. GOVERNING LAW AND DISPUTE RESOLUTION\n"
        "7.1 Delaware Law. This Agreement is governed by the laws of the State of Delaware, excluding conflict of laws principles.\n"
        "7.2 Jurisdiction. The parties submit to the exclusive jurisdiction of the state and federal courts located in Wilmington, Delaware."
    )
    p3.insert_text((50, 60), text_p3, fontsize=10)

    doc.save(pdf_path)
    doc.close()
    print(f"Sample legal contract generated at: {pdf_path}")

if __name__ == "__main__":
    generate_sample_contract()
