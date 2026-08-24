from pathlib import Path
from zipfile import ZipFile
from web_app import app

client = app.test_client()
response = client.post("/generate", data={
    "BID_TYPE": "Single Bidder",
    "PROJECT_NAME": "North District Works",
    "BID_DATE": "2026-08-24",
    "EMPLOYER_NAME": "City Works Authority",
    "IFB_NUMBER": "IFB-2026-018",
    "JV_NAME": "",
    "JV_ADDRESS": "",
    "AUTHORIZED_PERSON_NAME": "Jordan Lee",
    "LEAD_PARTNER_NAME": "Apex Civil Engineering Ltd",
    "LEAD_PARTNER_SHORT": "Apex",
    "LEAD_ADDRESS": "12 Market Street",
    "LEAD_PARTNER_CEO": "Jordan Lee",
    "LEAD_PARTNER_MD1": "",
    "LEAD_PARTNER_MD2": "",
    "L_PER": "100",
    "FIRST_PARTNER_NAME": "",
    "FIRST_PARTNER_SHORT": "",
    "FIRST_ADDRESS": "",
    "FIRST_PARTNER_CEO": "",
    "FIRST_PARTNER_MD1": "",
    "FIRST_PARTNER_MD2": "",
    "F_PER": "",
    "SECOND_PARTNER_NAME": "",
    "SECOND_PARTNER_SHORT": "",
    "SECOND_ADDRESS": "",
    "SECOND_PARTNER_CEO": "",
    "SECOND_PARTNER_MD1": "",
    "SECOND_PARTNER_MD2": "",
    "S_PER": "",
})
if response.status_code != 200:
    raise AssertionError(response.data.decode("utf-8", errors="ignore").split("<div class=\"alert\">")[1].split("</div>")[0])
assert response.mimetype == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
assert ".docx" in response.headers.get("Content-Disposition", "")
output = Path("/tmp/web_generated_bid.docx")
output.write_bytes(response.data)
with ZipFile(output) as package:
    xml = "\\n".join(package.read(name).decode("utf-8", errors="ignore") for name in package.namelist() if name.endswith(".xml"))
    assert not any(token in xml.upper() for token in ("LEAD_STAMP", "FIRST_STAMP", "SECOND_STAMP", "CEO_SIG", "AUTHORISED_SIG"))
print("Word generation: ok; unsigned and unstamped package verified")
