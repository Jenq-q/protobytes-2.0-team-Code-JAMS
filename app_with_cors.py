from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import joblib
import numpy as np
import uuid
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# ================= DATABASE =================

def get_db_connection():
    return psycopg2.connect(
        host="localhost",
        database="gunaso",
        user="your_username",
        password="your_password"
    )

# ================= LOAD MODELS =================

model_ministry = joblib.load("model_ministry.pkl")
model_department = joblib.load("model_department.pkl")

vectorizer_ministry = joblib.load("vectorizer_ministry.pkl")
vectorizer_department = joblib.load("vectorizer_department.pkl")

mlb_ministry = joblib.load("mlb_ministry.pkl")
mlb_department = joblib.load("mlb_department.pkl")

# ================= ML FUNCTION =================

def predict_complaint(text):

    X_m = vectorizer_ministry.transform([text])
    m_probs = model_ministry.predict_proba(X_m)

    top_min_indices = np.argsort(m_probs[0])[-2:]
    ministries = [mlb_ministry.classes_[i] for i in top_min_indices]
    ministry_conf = float(np.max(m_probs[0])) * 100

    enhanced = text + " ministries " + " ".join(ministries)
    X_d = vectorizer_department.transform([enhanced])
    d_probs = model_department.predict_proba(X_d)

    top_dep_indices = np.argsort(d_probs[0])[-2:]
    departments = [mlb_department.classes_[i] for i in top_dep_indices]
    department_conf = float(np.max(d_probs[0])) * 100

    return ministries, departments, ministry_conf, department_conf

# ================= API =================

@app.route("/")
def home():
    return jsonify({
        "complaint_ref": "TEST-123",
        "ministries": ["Test Ministry"],
        "departments": ["Test Department"],
        "confidence": 95
    })

@app.route("/form")
def form():
    return render_template("complaint_form.html")


@app.route("/submit", methods=["POST"])
def submit():

    data = request.get_json()
    complaint_msg = data.get("complaint")

    ministries, departments, min_conf, dep_conf = predict_complaint(complaint_msg)

    return jsonify({
        "complaint_ref": "TEST-ML-001",
        "ministries": ministries,
        "departments": departments,
        "confidence": int(max(min_conf, dep_conf))
    })
    if not complaint_msg:
        return jsonify({"error": "Complaint text required"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    # 1️⃣ Create complaint reference
    complaint_ref = f"CPL-2026-{uuid.uuid4().hex[:6].upper()}"

    # 2️⃣ Insert complaint
    cur.execute("""
        INSERT INTO complaints 
        (complaint_ref, user_id, title, complain_msg, status)
        VALUES (%s, %s, %s, %s, 'registered')
        RETURNING complain_id
    """, (complaint_ref, user_id, title, complaint_msg))

    complain_id = cur.fetchone()[0]
    conn.commit()

    # 3️⃣ ML Prediction
    ministries, departments, min_conf, dep_conf = predict_complaint(complaint_msg)

    # 4️⃣ Insert ministries (many-to-many)
    for ministry in ministries:
        cur.execute("SELECT ministry_id FROM ministries WHERE ministry_name = %s", (ministry,))
        result = cur.fetchone()
        if result:
            ministry_id = result[0]
            cur.execute("""
                INSERT INTO complaint_ministries (complain_id, ministry_id)
                VALUES (%s, %s)
                ON CONFLICT DO NOTHING
            """, (complain_id, ministry_id))

    # 5️⃣ Insert departments
    for department in departments:
        cur.execute("SELECT department_id FROM departments WHERE department_name = %s", (department,))
        result = cur.fetchone()
        if result:
            department_id = result[0]
            cur.execute("""
                INSERT INTO complaint_departments (complain_id, department_id)
                VALUES (%s, %s)
                ON CONFLICT DO NOTHING
            """, (complain_id, department_id))

    # 6️⃣ Update complaint metadata
    cur.execute("""
        UPDATE complaints
        SET category = %s,
            sub_category = %s,
            confidence_score = %s,
            status = 'pending'
        WHERE complain_id = %s
    """, (
        ministries[0] if ministries else None,
        departments[0] if departments else None,
        int(max(min_conf, dep_conf)),
        complain_id
    ))

    # 7️⃣ Add timeline entry
    cur.execute("""
        INSERT INTO complaint_timeline 
        (complain_id, step, status, note, performed_by)
        VALUES (%s, %s, %s, %s, %s)
    """, (
        complain_id,
        "AI Classification Completed",
        "pending",
        "Complaint automatically classified by ML system",
        "System"
    ))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({
        "complaint_ref": complaint_ref,
        "ministries": ministries,
        "departments": departments,
        "confidence": int(max(min_conf, dep_conf))
    })

# ================= RUN =================

if __name__ == "__main__":
    app.run(debug=True, port=5095)
