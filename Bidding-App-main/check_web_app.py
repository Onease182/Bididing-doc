from pathlib import Path
from zipfile import ZipFile
import re

from web_app import app, generator

base = Path(__file__).resolve().parent
all_keys = set()
for path in (base / "templates").glob("*.docx"):
    with ZipFile(path) as archive:
        for name in archive.namelist():
            if name.endswith(".xml"):
                all_keys.update(re.findall(r"\{\{([^{}]+)\}\}", archive.read(name).decode("utf-8", errors="ignore")))
print("templates:", len(list((base / "templates").glob("*.docx"))))
print("placeholders:", ", ".join(sorted(all_keys)))
assert any(rule.rule == "/generate" for rule in app.url_map.iter_rules())
print("flask import: ok")
