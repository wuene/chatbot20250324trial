from flask import Flask, request, jsonify, render_template, send_from_directory
import requests
import os

app = Flask(__name__)

# === 可切換用的模型設定 ===
# 你可以根據實際情況替換這些值
USE_HEADERS = False
LLM_URL = "http://localhost:8000/completion"  # 改成對方模型的 API endpoint

HEADERS = {
    "Content-Type": "application/json",
    "API-Key": "TZPR901-S20MAEK-N8XF063-YNK8EJ9"
}

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat_api():
    user_message = request.json.get("message", "")

    # 預設傳送格式（根據模型需要修改）
    payload = {
        "prompt": user_message,
        "n_predict": 128
    }

    try:
        if USE_HEADERS:
            response = requests.post(LLM_URL, headers=HEADERS, json=payload)
        else:
            response = requests.post(LLM_URL, json=payload)

        result = response.json()

        # 自動嘗試找出模型的回覆欄位
        ai_answer = result.get("content") or result.get("reply") or result.get("output") or str(result)

        return jsonify({"reply": ai_answer})

    except Exception as e:
        return jsonify({"reply": f"錯誤：{str(e)}"})

@app.route("/chat")
def chat_page():
    return render_template("chat.html")

@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory("static", filename)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
