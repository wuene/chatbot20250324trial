from flask import Flask, request, jsonify, render_template, send_from_directory
import sqlite3
import os
import json
import bcrypt
from flask_cors import CORS
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from datetime import datetime
import traceback
import requests as req  # 避免和 google 的 requests 混淆

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# === 資料庫設定 ===
DB_PATH = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'database.db')

def init_db():
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT,
            name TEXT,
            birthday TEXT,
            phone TEXT,
            registration_date TEXT,
            login_method TEXT
        )
        ''')
        conn.commit()
        conn.close()
        print("✅ 資料庫初始化完成")
    except Exception as e:
        print("❌ 資料庫初始化錯誤:", e)
        traceback.print_exc()

init_db()

# === 首頁 & 管理頁 ===
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/chat')
def chat_page():
    return render_template('chat.html')

@app.route('/explore')
def explore_page():
    return render_template('explore.html')

# === 聊天機器人處理 ===
LLM_URL = "http://localhost:8000/completion"  # 模型 API endpoint
USE_HEADERS = False
HEADERS = {
    "Content-Type": "application/json",
    "API-Key": "TZPR901-S20MAEK-N8XF063-YNK8EJ9"
}

@app.route("/chat", methods=["POST"])
def chat_api():
    user_message = request.json.get("message", "")
    payload = {"prompt": user_message, "n_predict": 128}
    try:
        if USE_HEADERS:
            response = req.post(LLM_URL, headers=HEADERS, json=payload)
        else:
            response = req.post(LLM_URL, json=payload)
        result = response.json()
        reply = result.get("content") or result.get("reply") or result.get("output") or str(result)
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"reply": f"錯誤：{str(e)}"})

# === 登入與註冊 API ===
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    birthday = data.get('birthday')
    phone = data.get('phone')
    registration_date = data.get('registrationDate', datetime.now().isoformat())
    login_method = 'email'

    if not all([email, password, name, birthday, phone]):
        return jsonify({"success": False, "message": "所有欄位都是必填的"}), 400

    try:
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("""
            INSERT INTO users (email, password, name, birthday, phone, registration_date, login_method)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (email, hashed_password, name, birthday, phone, registration_date, login_method))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "註冊成功！"})
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "message": "此電子郵件已註冊"}), 409
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/check-email', methods=['POST'])
def check_email():
    email = request.json.get('email')
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE email = ?", (email,))
        exists = c.fetchone() is not None
        conn.close()
        return jsonify({"success": True, "exists": exists})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = c.fetchone()
        conn.close()

        if user:
            stored_password = user[2]
            if stored_password and bcrypt.checkpw(password.encode('utf-8'), stored_password):
                return jsonify({"success": True, "message": "登入成功"})
            else:
                return jsonify({"success": False, "message": "密碼不正確"}), 401
        else:
            return jsonify({"success": False, "message": "用戶不存在"}), 404
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/google-login', methods=['POST'])
def google_login():
    token = request.json.get('token')
    GOOGLE_CLIENT_ID = "411255601205-g39rum5fuh1edi6bpklg5r11j5qq3pnu.apps.googleusercontent.com"
    try:
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo['email']

        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE email = ?", (email,))
        existing_user = c.fetchone()
        conn.close()

        return jsonify({
            "success": True,
            "isNewUser": existing_user is None,
            "email": email
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 401

@app.route('/api/update-google-user', methods=['POST'])
def update_google_user():
    data = request.json
    email = data.get('email')
    name = data.get('name')
    birthday = data.get('birthday')
    phone = data.get('phone')
    registration_date = data.get('registrationDate', datetime.now().isoformat())
    login_method = 'google'

    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("""
            INSERT INTO users (email, password, name, birthday, phone, registration_date, login_method)
            VALUES (?, NULL, ?, ?, ?, ?, ?)
        """, (email, name, birthday, phone, registration_date, login_method))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Google 使用者資料已儲存！"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT * FROM users")
        users = [dict(row) for row in c.fetchall()]
        conn.close()
        return jsonify({"success": True, "users": users})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5011)
