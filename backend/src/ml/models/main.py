from flask import Flask, request, jsonify
import joblib
import numpy as np
app = Flask(__name__)

# ==========================================================
# LOAD MODELS ON STARTUP (Only once)
# ==========================================================

model_ministry = joblib.load("model_ministry.pkl")
model_department = joblib.load("model_department.pkl")

vectorizer_ministry = joblib.load("vectorizer_ministry.pkl")
vectorizer_department = joblib.load("vectorizer_department.pkl")

mlb_ministry = joblib.load("mlb_ministry.pkl")
mlb_department = joblib.load("mlb_department.pkl")


# ==========================================================
# Helper Function
# ==========================================================

def top_k_predictions(probs, k=2):
    preds = np.zeros_like(probs)
    for i in range(len(probs)):
        top_k = np.argsort(probs[i])[-k:]
        preds[i, top_k] = 1
    return preds


def predict_complaint(text):

    # ---- Stage 1 (Ministry) ----
    X_m = vectorizer_ministry.transform([text])
    m_probs = model_ministry.predict_proba(X_m)
    m_pred = top_k_predictions(m_probs, k=2)

    ministries = [
        mlb_ministry.classes_[i]
        for i in range(len(m_pred[0]))
        if m_pred[0][i] == 1
    ]

    # ---- Stage 2 (Department) ----
    enhanced = text + " ministries " + " ".join(ministries)
    X_d = vectorizer_department.transform([enhanced])
    d_probs = model_department.predict_proba(X_d)
    d_pred = top_k_predictions(d_probs, k=2)

    departments = [
        mlb_department.classes_[i]
        for i in range(len(d_pred[0]))
        if d_pred[0][i] == 1
    ]

    return ministries, departments


# ==========================================================
# API ENDPOINT
# ==========================================================

@app.route("/classify", methods=["POST"])
def classify():

    data = request.get_json()

    # Expecting JSON like:
    # { "complaint": "Police refusing to file FIR" }

    complaint_text = data.get("complaint")

    if not complaint_text:
        return jsonify({"error": "Complaint text is required"}), 400

    ministries, departments = predict_complaint(complaint_text)

    return jsonify({
        "complaint": complaint_text,
        "ministries": ministries,
        "departments": departments
    })


if __name__ == "__main__":
    app.run(debug=True)

    