import os
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib

def main():
    # 1. Synthesize Mock Dataset (since we dont have actual CSV locally)
    # 1 means valid bug, 0 means invalid/feature request/question
    mock_data = [
        {"title": "App crashes on login", "desc": "When I enter my credentials and click submit, the app closes unexpectedly.", "label": 1},
        {"title": "Null pointer exception", "desc": "Found NPE in auth module during token refresh at line 45.", "label": 1},
        {"title": "Please add dark mode", "desc": "It would be great to have a dark mode option in settings.", "label": 0},
        {"title": "Typo on the landing page", "desc": "The word Welcome is misspelled as Welcom in the header.", "label": 0},
        {"title": "Memory leak detected", "desc": "Memory usage spikes by 200MB every time the sync service runs in background.", "label": 1},
        {"title": "How do I change password", "desc": "I looked in settings but can't find the password reset option anywhere.", "label": 0},
        {"title": "Database connection timeout", "desc": "Getting 504 Gateway Timeout when executing complex queries during heavy load.", "label": 1},
        {"title": "Button color change", "desc": "Can we make the primary button slightly darker blue?", "label": 0},
        {"title": "Security vulnerability in dependencies", "desc": "Lodash version is outdated and susceptible to prototype pollution.", "label": 1},
        {"title": "Add Portuguese translation", "desc": "Please support PT-BR localization in the next release.", "label": 0}
    ]
    
    df = pd.DataFrame(mock_data)
    
    # 2. Preprocess Text
    # We concatenate title and desc for features
    df['text'] = df['title'] + " " + df['desc']
    df['text'] = df['text'].str.lower()
    
    X = df['text']
    y = df['label']
    
    # Very small synthetic dataset, no real train/test split needed for mock demo
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 3. Vectorize
    print("Vectorizing text data...")
    vectorizer = TfidfVectorizer(stop_words='english')
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    # 4. Train Model
    print("Training SVM Model...")
    svm_model = SVC(kernel='linear', probability=True)
    svm_model.fit(X_train_vec, y_train)
    
    # 5. Evaluate
    preds = svm_model.predict(X_test_vec)
    print("\nModel Evaluation:")
    print(f"Accuracy : {accuracy_score(y_test, preds):.2f}")
    print(f"Precision: {precision_score(y_test, preds, zero_division=0):.2f}")
    print(f"Recall   : {recall_score(y_test, preds, zero_division=0):.2f}")
    print(f"F1 Score : {f1_score(y_test, preds, zero_division=0):.2f}")
    
    # 6. Save Model
    os.makedirs('models', exist_ok=True)
    joblib.dump(svm_model, 'models/model.pkl')
    joblib.dump(vectorizer, 'models/vectorizer.pkl')
    
    print("\nTraining completed. Saved model.pkl and vectorizer.pkl in models/.")

if __name__ == "__main__":
    main()
