import os
import sys
import json

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

DIST_DIR = os.path.join(os.path.dirname(__file__), 'dist')

app = Flask(__name__, static_folder=DIST_DIR, static_url_path='')
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ── 資料庫設定 ──────────────────────────────────────────────────────────────
database_url = os.environ.get('DATABASE_URL')
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url or 'sqlite:///local.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ── 資料模型 ─────────────────────────────────────────────────────────────────
class Lesson(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    theme = db.Column(db.String(50), nullable=False)
    lesson_num = db.Column(db.Integer, nullable=False)
    content = db.Column(db.JSON, nullable=False)
    __table_args__ = (db.UniqueConstraint('theme', 'lesson_num', name='unique_theme_lesson'),)

class QuizCache(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    theme = db.Column(db.String(50), nullable=False)
    lesson_num = db.Column(db.Integer, nullable=False)
    content = db.Column(db.JSON, nullable=False)
    __table_args__ = (db.UniqueConstraint('theme', 'lesson_num', name='unique_quiz_theme_lesson'),)

with app.app_context():
    db.create_all()

# ── Gemini 設定 ──────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

MODEL = 'gemini-2.5-flash'
FAST_CONFIG = types.GenerateContentConfig(
    temperature=0.7,
    thinking_config=types.ThinkingConfig(thinking_budget=0),
)

# ── 工具函式 ─────────────────────────────────────────────────────────────────
def _parse_ai_json(text):
    """去除 AI 可能包的 markdown code block，回傳純 JSON 字串並 parse。"""
    text = text.strip()
    if text.startswith('```'):
        text = text.split('```')[1]
        if text.strip().startswith('json'):
            text = text.strip()[4:]
    return json.loads(text)

# ── API 路由 ─────────────────────────────────────────────────────────────────
@app.route('/api/health')
def health_check():
    return jsonify({'status': 'ok'})

@app.route('/api/generate-study-list', methods=['POST'])
def generate_study_list():
    try:
        data = request.json
        theme = data.get('theme', 'daily')
        lesson = data.get('lesson', 1)

        existing = Lesson.query.filter_by(theme=theme, lesson_num=lesson).first()
        if existing:
            print(f"🔥 Cache Hit! {theme} Lesson {lesson}")
            return jsonify(existing.content)

        print(f"🤖 Cache Miss! AI 生成 {theme} Lesson {lesson}...")

        prev_lessons = Lesson.query.filter(
            Lesson.theme == theme,
            Lesson.lesson_num < lesson
        ).all()
        exclude_words = [item['word'] for pl in prev_lessons for item in pl.content]
        exclude_str = ", ".join(exclude_words) if exclude_words else "無"

        theme_names = {
            'travel': '旅遊', 'business': '商務', 'daily': '日常生活',
            'food': '飲食', 'shopping': '購物', 'technology': '科技',
        }
        theme_cn = theme_names.get(theme, theme)

        prompt = f"""你是英文教科書編輯。請為主題「{theme_cn}」的「第 {lesson} 課」編寫單字表。

嚴格要求：
1. 提供 8 個單字。
2. 難度對應 Lesson {lesson}（數字越大越難）。
3. 絕對禁止使用以下單字（已學過）：{exclude_str}
4. 包含詞性 (n./v./adj.)、中文定義、實用例句。

回傳 JSON Array：
[{{"word":"example","pos":"n.","chinese":"範例","definition":"A representative form.","example":"This is a good example."}}]
只回傳 JSON。"""

        response = gemini_client.models.generate_content(
            model=MODEL, contents=prompt, config=FAST_CONFIG,
        )
        new_words = _parse_ai_json(response.text)

        db.session.add(Lesson(theme=theme, lesson_num=lesson, content=new_words))
        db.session.commit()
        print("💾 已存入資料庫")
        return jsonify(new_words)

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/generate-vocab', methods=['POST'])
def generate_vocab():
    try:
        data = request.json
        theme = data.get('theme', 'daily')
        lesson = data.get('lesson', 1)

        cached = QuizCache.query.filter_by(theme=theme, lesson_num=lesson).first()
        if cached:
            return jsonify(cached.content)

        existing = Lesson.query.filter_by(theme=theme, lesson_num=lesson).first()
        if not existing:
            return jsonify({'error': '請先在學習模式生成該課程單字，才能進行測驗'}), 404

        words_list = ", ".join([w['word'] for w in existing.content])

        prompt = f"""請針對以下單字列表出 5 題選擇題：
單字列表：{words_list}

要求：
1. 題目必須從上述列表中選出。
2. 每個選項包含：單字、詞性、中文、例句。
3. 格式符合 JSON 標準。

格式：
{{"words":[{{"word":"target_word","pos":"n.","definition":"中文","example":"Sentence with ___ blank.","options":[...4個選項...],"correctIndex":0}}]}}
只回傳 JSON。"""

        response = gemini_client.models.generate_content(
            model=MODEL, contents=prompt, config=FAST_CONFIG,
        )
        quiz = _parse_ai_json(response.text)

        existing_cache = QuizCache.query.filter_by(theme=theme, lesson_num=lesson).first()
        if existing_cache:
            existing_cache.content = quiz
        else:
            db.session.add(QuizCache(theme=theme, lesson_num=lesson, content=quiz))
        db.session.commit()
        return jsonify(quiz)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/check-answer', methods=['POST'])
def check_answer():
    try:
        data = request.json
        user_answer = data.get('userAnswer')
        correct_answer = data.get('correctAnswer')
        example = data.get('example', '')
        is_correct = user_answer.lower() == correct_answer.lower()
        if is_correct:
            feedback = "✅ 答對了！"
        else:
            prompt = f"使用者答錯。題：{example} 正解：{correct_answer} 誤答：{user_answer}。請用中文簡短解析差異。"
            response = gemini_client.models.generate_content(
                model=MODEL, contents=prompt, config=FAST_CONFIG,
            )
            feedback = f"❌ {response.text}"
        return jsonify({'correct': is_correct, 'feedback': feedback})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/generate-story', methods=['POST'])
def generate_story():
    try:
        words = request.json.get('words', [])
        prompt = f"用這些字寫一篇幽默短故事(附中文翻譯)：{', '.join(words)}。回傳JSON: {{\"english_story\": \"...\", \"chinese_translation\": \"...\"}}"
        response = gemini_client.models.generate_content(
            model=MODEL, contents=prompt, config=FAST_CONFIG,
        )
        return jsonify(_parse_ai_json(response.text))
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/translate-sentences', methods=['POST'])
def translate_sentences():
    """批次翻譯英文句子為繁體中文，回傳 {translations: [...]}。"""
    try:
        sentences = request.json.get('sentences', [])
        if not sentences:
            return jsonify({'translations': []})

        numbered = "\n".join(f"{i+1}. {s}" for i, s in enumerate(sentences))
        prompt = f"""把以下英文句子翻成自然的繁體中文，逐句對應。
{numbered}

只回傳 JSON 陣列（字串），順序與輸入相同，數量必須一致：
["翻譯1", "翻譯2", ...]
只回傳 JSON。"""

        response = gemini_client.models.generate_content(
            model=MODEL, contents=prompt, config=FAST_CONFIG,
        )
        return jsonify({'translations': _parse_ai_json(response.text)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── 前端靜態檔服務（生產環境）────────────────────────────────────────────────
# 先跑 `cd frontend && npm run build`，Flask 就能直接 serve React app。
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    full = os.path.join(DIST_DIR, path)
    if path and os.path.exists(full):
        return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, 'index.html')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=True)
