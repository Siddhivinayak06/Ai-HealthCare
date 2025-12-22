import fitz  # PyMuPDF
import os

def extract_text_from_pdf(pdf_path):
    """
    Extracts plain text from a medical PDF report.
    """
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        return text.strip()
    except Exception as e:
        print(f"❌ PDF Parsing Error: {e}")
        return ""

def parse_clinical_report(file_path):
    """
    Dispatcher for different medical report formats with section detection.
    """
    ext = os.path.splitext(file_path)[1].lower()
    text = ""
    
    if ext == ".pdf":
        text = extract_text_from_pdf(file_path)
    elif ext in [".txt", ".md"]:
        with open(file_path, "r") as f:
            text = f.read().strip()
    else:
        raise ValueError(f"Unsupported clinical report format: {ext}")

    # Section Detection (Common in Medical Reports)
    sections = {
        "findings": "",
        "impression": "",
        "history": "",
        "full_text": text
    }
    
    curr_section = "full_text"
    for line in text.split('\n'):
        l_upper = line.upper()
        if "FINDINGS" in l_upper: curr_section = "findings"
        elif "IMPRESSION" in l_upper: curr_section = "impression"
        elif "HISTORY" in l_upper or "CLINICAL" in l_upper: curr_section = "history"
        
        if curr_section != "full_text":
            sections[curr_section] += line + "\n"
            
    return sections
