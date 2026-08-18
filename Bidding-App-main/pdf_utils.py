# -*- coding: utf-8 -*-
"""Small utility helpers for PDF/file handling — no GUI dependencies.

NOTE: This file was not part of the uploaded set but is imported by
pdf_viewer.py and partner_docs.py. It contains pure logic (no Tkinter /
Qt code), so it is unaffected by the PySide port. Reconstructed here
from usage so the app runs end-to-end — replace with your original
pdf_utils.py if you already have one (it should be a drop-in match).
"""

try:
    import fitz  # PyMuPDF
    HAS_FITZ = True
except ImportError:
    fitz = None
    HAS_FITZ = False


def _human_size(num_bytes):
    try:
        num_bytes = float(num_bytes)
    except (TypeError, ValueError):
        return "0 B"
    for unit in ["B", "KB", "MB", "GB"]:
        if num_bytes < 1024.0:
            return f"{int(num_bytes)} {unit}" if unit == "B" else f"{num_bytes:.1f} {unit}"
        num_bytes /= 1024.0
    return f"{num_bytes:.1f} TB"


def _count_pdf_pages(file_path):
    if not file_path or not HAS_FITZ:
        return -1
    if not str(file_path).lower().endswith(".pdf"):
        return -1
    try:
        with fitz.open(file_path) as doc:
            return len(doc)
    except Exception:
        return -1
