from pathlib import Path
from flask import Flask, jsonify, render_template, request, send_file
from doc_generator import BidDocumentGenerator
from web_profiles import PROFILE_FIELDS, create_profile, delete_profile, get_profile, init_db, list_profiles

BASE_DIR = Path(__file__).resolve().parent
app = Flask(__name__, template_folder="web_templates", static_folder="web_static")
generator = BidDocumentGenerator(BASE_DIR)
init_db()

TEXT_FIELDS = [
    "BID_TYPE", "PROJECT_NAME", "BID_DATE", "EMPLOYER_NAME", "EMPLOYER_ADDRESS", "IFB_NUMBER", "BID_VALIDITY_PERIOD", "JV_NAME", "JV_ADDRESS",
    "LEAD_PARTNER_NAME", "LEAD_PARTNER_SHORT", "LEAD_ADDRESS", "LEAD_PARTNER_CEO", "LEAD_PARTNER_MD1", "LEAD_PARTNER_MD2", "L_PER",
    "FIRST_PARTNER_NAME", "FIRST_PARTNER_SHORT", "FIRST_ADDRESS", "FIRST_PARTNER_CEO", "FIRST_PARTNER_MD1", "FIRST_PARTNER_MD2", "F_PER",
    "SECOND_PARTNER_NAME", "SECOND_PARTNER_SHORT", "SECOND_ADDRESS", "SECOND_PARTNER_CEO", "SECOND_PARTNER_MD1", "SECOND_PARTNER_MD2", "S_PER",
    "AUTHORIZED_PERSON_NAME",
]
DEFAULTS = {key: "" for key in TEXT_FIELDS}
DEFAULTS.update({"BID_TYPE": "Joint Venture", "BID_DATE": "", "BID_VALIDITY_PERIOD": "120 days"})


def collect_data(form):
    data = {key: form.get(key, "").strip() for key in TEXT_FIELDS}
    # Keep the existing document templates compatible while making the web form signature-free.
    for key in ("LEAD_STAMP", "LEAD_CEO_SIG", "FIRST_STAMP", "FIRST_CEO_SIG", "SECOND_STAMP", "SECOND_CEO_SIG", "AUTHORISED_SIG"):
        data[key] = ""
    # The two-partner template uses this standalone conjunction between
    # partner names. Single-bidder templates do not contain the placeholder.
    data["AND_CONNECTOR"] = "and" if data["BID_TYPE"] == "Joint Venture" else ""
    return data


def validate(data):
    errors = []
    is_single = data["BID_TYPE"] == "Single Bidder"
    for key, label in (("PROJECT_NAME", "Project name"), ("BID_DATE", "Bid date"), ("EMPLOYER_NAME", "Employer name"), ("LEAD_PARTNER_NAME", "Lead partner name"), ("LEAD_ADDRESS", "Lead partner address")):
        if not data.get(key):
            errors.append(f"{label} is required.")
    if not is_single and not data.get("JV_NAME"):
        errors.append("JV name is required for a joint venture.")
    if not is_single:
        values = {}
        for key, label in (("L_PER", "Lead"), ("F_PER", "First partner"), ("S_PER", "Second partner")):
            raw = data.get(key, "").replace("%", "")
            if not raw:
                values[key] = 0.0
                continue
            try:
                values[key] = float(raw)
                if not 0 <= values[key] <= 100:
                    errors.append(f"{label} ownership must be between 0 and 100%.")
            except ValueError:
                errors.append(f"{label} ownership must be numeric.")
        if not errors and abs(sum(values.values()) - 100) > 0.01:
            errors.append(f"Ownership percentages must total 100%; current total is {sum(values.values()):.2f}%.")
    if not is_single and data.get("SECOND_PARTNER_NAME") and not data.get("FIRST_PARTNER_NAME"):
        errors.append("Complete the first partner before adding a second partner.")
    for prefix, role in (("FIRST", "First"), ("SECOND", "Second")):
        if data.get(f"{prefix}_PARTNER_NAME"):
            if not data.get(f"{prefix}_ADDRESS"):
                errors.append(f"{role} partner address is required.")
            if not data.get(f"{prefix}_PARTNER_CEO"):
                errors.append(f"{role} partner authorised person is required.")
    return errors


@app.get("/")
def index():
    return render_template("web_index.html", data=DEFAULTS, errors=[], generated=False, profiles=list_profiles())


@app.get("/api/profiles")
def profiles_index():
    return jsonify(list_profiles())


@app.get("/api/profiles/<profile_id>")
def profile_detail(profile_id):
    profile = get_profile(profile_id)
    if not profile:
        return jsonify({"error": "Profile not found."}), 404
    return jsonify(profile)


@app.post("/api/profiles")
def profile_create():
    payload = request.get_json(silent=True) or {}
    try:
        profile = create_profile(payload.get("name"), payload.get("role"), payload.get("values", {}))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify(profile), 201


@app.delete("/api/profiles/<profile_id>")
def profile_remove(profile_id):
    if not delete_profile(profile_id):
        return jsonify({"error": "Profile not found."}), 404
    return jsonify({"deleted": True})


@app.post("/generate")
def generate_word():
    data = collect_data(request.form)
    errors = validate(data)
    if errors:
        return render_template("web_index.html", data=data, errors=errors, generated=False, profiles=list_profiles()), 400
    try:
        output_path = generator.generate(data, image_mapping={})
    except Exception as exc:
        return render_template("web_index.html", data=data, errors=[str(exc)], generated=False, profiles=list_profiles()), 400
    return send_file(output_path, as_attachment=True, download_name=output_path.name, mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
