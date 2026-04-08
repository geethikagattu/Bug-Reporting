from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.svm import SVC
import numpy as np
from collections import defaultdict

app = Flask(__name__)
CORS(app)

# --- MOCK TRAINING DATA ---
training_texts = [
    "App crashes when clicking submit button on login page",
    "Null pointer exception in auth module during token refresh",
    "Please add dark mode to the application",
    "Typo on the landing page header",
    "Memory leak detected in background sync service",
    "How do I change my password",
    "Database connection timeout under heavy load"
]
# 1 = Valid Bug, 0 = Invalid/Feature Request/Question
training_labels = [1, 1, 0, 0, 1, 0, 1]

vectorizer = TfidfVectorizer(stop_words='english')
X_train = vectorizer.fit_transform(training_texts)

svm_model = SVC(kernel='linear', probability=True)
svm_model.fit(X_train, training_labels)

@app.route('/')
def home():
    return jsonify({"status": "ML Service is running"})

@app.route('/api/ml/classify', methods=['POST'])
def classify_bug():
    data = request.json
    text = data.get('text', '')
    if not text:
        return jsonify({"error": "No text provided"}), 400
        
    X_test = vectorizer.transform([text])
    pred = svm_model.predict(X_test)[0]
    prob = svm_model.predict_proba(X_test)[0]
    
    isValid = bool(pred == 1)
    confidence = float(np.max(prob))
    
    return jsonify({
        "isValid": isValid,
        "class": "Valid Bug" if isValid else "Invalid/Feature Request",
        "confidence": round(confidence, 2)
    })

@app.route('/api/ml/localize', methods=['POST'])
def localize_bug():
    data = request.json
    text = data.get('text', '')
    files = data.get('files', []) # Expects list of dicts: [{'path': 'src/app.js', 'name': 'app.js'}]
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
    if not files:
        return jsonify({"files": [], "scores": []})
        
    # Text + All file paths/names (since we don't download code)
    # We use the path and name as the "document" to match against the bug description
    doc_meta = [f"{f.get('path', '')} {f.get('name', '')}".replace('/', ' ').replace('.', ' ') for f in files]
    documents = [text] + doc_meta
    
    loc_vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_mat = loc_vectorizer.fit_transform(documents)
    
    # Cosine similarity between text and file paths
    similarities = cosine_similarity(tfidf_mat[0:1], tfidf_mat[1:]).flatten()
    
    # Top 5 files
    top_indices = similarities.argsort()[-5:][::-1]
    
    top_files = [files[i].get('path') for i in top_indices if similarities[i] > 0]
    
    return jsonify({
        "files": top_files,
        "scores": [round(float(similarities[i]), 2) for i in top_indices if similarities[i] > 0]
    })

@app.route('/api/ml/assign', methods=['POST'])
def assign_bug():
    data = request.json
    top_files = data.get('top_files', [])
    commits = data.get('commits', []) # List of dicts: {'hash': '...', 'authorEmail': '...', 'message': '...'}
    
    if not commits or not top_files:
        return jsonify({
            "authorEmail": None,
            "reason": "Insufficient data to determine expertise."
        })

    # Find which author has the most commits related to the buggy files
    # We simulate this by checking if the top_files appear in the commit messages 
    # or just who has the most recent activity overall.
    
    expertise_scores = {}
    
    for commit in commits:
        email = commit.get('authorEmail')
        if not email:
            continue
            
        msg = commit.get('message', '').lower()
        
        # Base score for activity
        expertise_scores[email] = expertise_scores.get(email, 0) + 1
        
        # High score if commit message mentions the buggy file
        for f in top_files:
            file_name = f.split('/')[-1].lower()
            if getattr(file_name, 'split'):
               fname = file_name.split('.')[0]
               if fname in msg and len(fname) > 3:
                   expertise_scores[email] = expertise_scores.get(email, 0) + 10

    if not expertise_scores:
        return jsonify({"authorEmail": None, "reason": "No authors found."})

    best_author = max(expertise_scores, key=lambda k: expertise_scores[k])
    
    return jsonify({
        "authorEmail": best_author,
        "score": expertise_scores[best_author],
        "reason": f"Assigned based on repository commit history analysis (Score: {expertise_scores[best_author]})."
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)
