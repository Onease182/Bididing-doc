# Bididing Document Workspace

Bididing is a browser-based Flask application for preparing editable Joint Venture bid documents from Word templates. The application collects project, employer, and partner information, replaces placeholders in the selected `.docx` template, and downloads the completed Word file.

The product is intentionally streamlined. The web workflow generates **Word documents only**. It does not request, embed, or process signatures or stamps, and it does not convert documents to PDF.

## Features

The workspace supports single-bidder and joint-venture submissions with one to three partner organisations. It validates required bid information, partner ordering, ownership totals, and unresolved Word-template placeholders before allowing an export. The interface is responsive and includes a live submission-readiness summary.

## Project structure

| Path | Purpose |
|---|---|
| `web_app.py` | Flask application and Word download endpoint |
| `web_templates/` | Responsive HTML interface |
| `web_static/` | CSS styling and client-side readiness feedback |
| `doc_generator.py` | Word placeholder replacement and template cleanup |
| `templates/` | Required Word templates |
| `tests/` | Unit tests for the document generator |
| `test_web_generation.py` | End-to-end Word download smoke test |
| `check_web_app.py` | Basic import and template inspection check |
| `requirements.txt` | Python dependencies |

## Requirements

Python 3.9 or newer is required. Install the dependencies with:

```bash
python -m pip install -r requirements.txt
```

## Run locally

From the `Bidding-App-main` directory:

```bash
python web_app.py
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in a browser. The generated files are written to the local `output/` directory.

For a production deployment, run the Flask `app` object with a production WSGI server such as Waitress or Gunicorn rather than using the development server built into Flask.

## Test

Run the unit tests:

```bash
pytest -q tests
```

Run the web generation smoke test:

```bash
python test_web_generation.py
```

The smoke test submits a valid form, confirms that the response is an editable `.docx`, and verifies that signature and stamp references are absent from the generated Word package.

## Word templates

The three templates in `templates/` are required by the generator. Keep their filenames and placeholder names compatible with `doc_generator.py` when modifying them. The generator selects the one-, two-, or three-partner template based on the submitted partner information.

## Developer handoff

Clone the repository, enter `Bidding-App-main`, install the dependencies, and run `python web_app.py`. The repository is self-contained for local development and does not require API keys or external services for the current Word-only workflow.
