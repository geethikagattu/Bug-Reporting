from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import joblib
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Load Models
MODEL_PATH = os.getenv('MODEL_PATH', './models/model.pkl')
VECTORIZER_PATH = os.getenv('VECTORIZER_PATH', './models/vectorizer.pkl')

try:
    svm_model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    print("Loaded ML models successfully.")
except Exception as e:
    print(f"Warning: Could not load models ({e}). Please run train_model.py first.")
    svm_model = None
    vectorizer = None

@app.route('/health')
def health():
    return jsonify({"status": "ok"})

@app.route('/api/ml/classify', methods=['POST'])
def classify_bug():
    if not svm_model or not vectorizer:
        return jsonify({"error": "Models not loaded"}), 500

    data = request.json
    text = data.get('text', '')
    if not text:
        return jsonify({"error": "No text provided"}), 400
        
    X_test = vectorizer.transform([text.lower()])
    pred = svm_model.predict(X_test)[0]
    prob = svm_model.predict_proba(X_test)[0]
    
    isValid = bool(pred == 1)
    confidence = float(max(prob))
    
    return jsonify({
        "isValid": isValid,
        "class": "Valid Bug" if isValid else "Invalid Bug",
        "confidence": confidence,
        "modelUsed": "SVM"
    })

@app.route('/api/ml/localize', methods=['POST'])
def localize_bug():
    data = request.json
    text = data.get('text', '')
    top_n = data.get('top_n', 5)
    files = data.get('files', []) # Expects list of dicts: [{'path': 'src/app.js', 'name': 'app.js'}]
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
    if not files:
        return jsonify({"files": [], "scores": []})
        
    # Document match strategy using TF-IDF locally (for files)
    doc_meta = [f"{f.get('path', '')} {f.get('name', '')}".replace('/', ' ').replace('.', ' ') for f in files]
    documents = [text] + doc_meta
    
    loc_vectorizer = TfidfVectorizer(stop_words='english')
    try:
        tfidf_mat = loc_vectorizer.fit_transform(documents)
    except ValueError:
        return jsonify({"files": [], "scores": []})
    
    # Cosine similarity between text and file paths
    similarities = cosine_similarity(tfidf_mat[0:1], tfidf_mat[1:]).flatten()
    
    # Extract top files
    top_indices = similarities.argsort()[-top_n:][::-1]
    
    top_files = [files[i].get('path') for i in top_indices if similarities[i] > 0]
    scores = [float(similarities[i]) for i in top_indices if similarities[i] > 0]
    
    return jsonify({
        "files": top_files,
        "scores": list(scores)
    })

@app.route('/api/ml/assign', methods=['POST'])
def assign_bug():
    data = request.json
    top_files = data.get('top_files', [])
    commits = data.get('commits', [])
    
    if not commits or not top_files:
        return jsonify({"authorEmail": None, "reason": "Insufficient data to determine expertise."})

    expertise_scores = {}
    
    for commit in commits:
        email = commit.get('authorEmail')
        if not email: continue
            
        msg = commit.get('message', '').lower()
        
        expertise_scores[email] = expertise_scores.get(email, 0) + 1
        
        for f in top_files:
            file_name = f.split('/')[-1].lower()
            fname = file_name.split('.')[0] if '.' in file_name else file_name
            if fname in msg and len(fname) > 3:
                expertise_scores[email] = expertise_scores.get(email, 0) + 10

    if not expertise_scores:
        return jsonify({"authorEmail": None, "reason": "No matched authors found."})

    best_author = max(expertise_scores, key=lambda k: expertise_scores[k])
    
    return jsonify({
        "authorEmail": best_author,
        "score": expertise_scores[best_author],
        "reason": f"Assigned based on commit history tracking."
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    app.run(port=port, debug=True)
