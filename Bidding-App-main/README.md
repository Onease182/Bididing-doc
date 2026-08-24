# JV Bid Pro

A browser-based application for assembling Joint Venture (JV) bid documents from a Word template. It replaces placeholder text in a `.docx` template with data entered in the form and downloads an editable Word document.

The current web workflow is intentionally streamlined: it produces **Word only**, excludes all signature and stamp assets, and does not convert documents to PDF.

## What it actually does

- **Supports 1–3 partners** in a joint venture: Lead, First, and Second partner sections with organisation details, authorised-person names, managing directors, and ownership percentages.
- **Validates the essentials** before generation, including required project and employer information, partner ordering, and 100% ownership allocation for joint ventures.
- **Generates editable Word documents** from the checked-in templates with `python-docx` and `lxml`.
- **Excludes signatures and stamps by design.** The web form has no image-upload controls, and the generator removes all signature/stamp image slots from the output.
- **Does not convert to PDF.** The web workflow ends at the `.docx` download.
- **Professional responsive workspace** with a persistent navigation rail, live readiness summary, clear form cards, and mobile-friendly layout.

## Project structure

| File | Purpose |
|---|---|
| `web_app.py` | Flask web entry point and Word download endpoint |
| `web_templates/` | Professional responsive browser interface |
| `web_static/` | Styles and live readiness interactions |
| `app.py` | Legacy PySide6 desktop shell |
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
- `Flask` for the browser interface
- `PySide6` and `PyMuPDF` remain available only for the legacy desktop shell

Install the dependencies from the checked-in requirements file:

```bash
python -m pip install -r requirements.txt
```

## Running the web app

Install dependencies and start the browser-based workflow:

```bash
python -m pip install -r requirements.txt
python web_app.py
```

Then open `http://127.0.0.1:5000` in a browser. The legacy PySide6 desktop shell remains available with `python app.py`, but the recommended interface is the professional web workspace.

The web application resolves templates and generated output relative to the application directory. Before generating a document, it validates required fields, partner ordering, ownership percentages, and unresolved template placeholders. It never asks for or embeds signature/stamp images, and it does not create a PDF.

## Testing

```bash
pytest -q tests
```

## Note

`pdf_utils.py` is a reconstructed stand-in (see the note in the file) — swap in your original if you have one; it should be a drop-in match based on how it's used elsewhere in the app.
