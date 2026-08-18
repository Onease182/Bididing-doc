# JV Bid Pro

A desktop application (PySide6) for assembling Joint Venture (JV) bid documents from a Word template. It replaces the placeholder text and images in a `.docx` template with data entered in the form and produces a ready-to-submit bid document.

## What it actually does

- **Desktop app, not a web app.** Built with PySide6 (Qt), not Streamlit/Flask/Django.
- **Supports 1–3 partners** in a joint venture: Lead, First, and Second partner tabs, each with its own fields (name, short name, address, CEO, managing directors, ownership percentage) and supporting-document uploads.
- **JV Name auto-suggestion** from partner short names, and a live percentage guard rail that flags totals that don't add up to 100%.
- **Partner profiles** are saved to a local SQLite database (`db/profiles.db`) so partner details can be reused across bids, including cross-role loading (e.g. load a "First Partner" profile into the "Second Partner" slot).
- **Document generation** (`doc_generator.py`) does placeholder find-and-replace and image replacement in a `.docx` template using `python-docx` and `lxml`, then writes the output to `output/`.
- **Employer PDF viewer** built into the summary panel, using PyMuPDF (`fitz`) to render and paginate an uploaded PDF for reference while filling the form.
- **Command palette** (Ctrl+K) for quick navigation between tabs and actions (generate, clear fields, toggle theme).
- Light/dark theme, collapsible sidebar, sticky top bar, and a live summary/preview panel — a fuller enterprise-style UI shell.

## Project structure

| File | Purpose |
|---|---|
| `app.py` | Main window; wires the UI shell together and owns generation logic |
| `doc_generator.py` | Core placeholder/image replacement logic for the `.docx` template |
| `profiles.py` | SQLite-backed partner profile storage |
| `partner_docs.py` | Supporting-document upload/preview per partner |
| `pdf_viewer.py`, `pdf_utils.py` | Employer PDF rendering/pagination |
| `sidebar.py`, `top_bar.py`, `summary_panel.py`, `command_palette.py`, `theme.py` | UI shell components and styling |
| `templates/` | Word bid templates with placeholders |
| `db/profiles.db` | Local SQLite database of saved partner profiles |
| `output/` | Generated bid documents land here |

## Requirements

- Python 3.9+
- `PySide6`
- `python-docx`
- `lxml`
- `PyMuPDF` (`fitz`) — optional; without it the PDF page-count/viewer features are disabled but the rest of the app still runs

Install the dependencies from the checked-in requirements file:

```bash
python -m pip install -r requirements.txt
```

## Running

```bash
python app.py
```

The application now resolves its templates, databases, uploads, assets, logs, and generated output relative to the application directory rather than the current shell directory. Before generating a document, it validates required fields, partner ordering, ownership percentages, and the authorised-person signature. It also blocks output when unresolved `{{PLACEHOLDER}}` tokens remain in the selected Word template.

## Testing

```bash
pytest -q tests
```

## Note

`pdf_utils.py` is a reconstructed stand-in (see the note in the file) — swap in your original if you have one; it should be a drop-in match based on how it's used elsewhere in the app.
