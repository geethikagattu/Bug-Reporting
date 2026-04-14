# BugFlow: Intelligent Bug Tracking System
**Project Overview & Technical Documentation**

BugFlow is a modern, full-stack Web Application designed to revolutionize the software testing lifecycle. Unlike traditional bug trackers (like Jira or Bugzilla) that heavily rely on manual intervention, this system leverages a dedicated **Machine Learning Microservice** to automatically classify incoming bugs and predict the exact source code files responsible for the crash using Natural Language Processing.

---

## 🛠️ Technology Stack (MERN + Python)

Your project follows a **Microservice Architecture**, splitting the application into three completely decoupled ecosystems:

### 1. The Frontend (Client UI)
* **Framework:** React.js (Bootstrapped incredibly fast using Vite)
* **Styling:** Tailwind CSS v4 (For modern, responsive, utility-first UI design)
* **Routing:** React Router DOM (Implements strict Protected & Role-Based Routes)
* **State Management:** React Context API (For global JWT Authentication states)
* **Icons:** Lucide React

### 2. The Backend API (Core Server)
* **Runtime & Framework:** Node.js powered by Express.js
* **Authentication:** JWT (JSON Web Tokens) combined with Bcrypt.js for encrypted password hashing, alongside **GitHub OAuth** integration.
* **Architecture:** Adheres perfectly to the MVC (Model-View-Controller) design pattern.

### 3. The Database
* **Database:** MongoDB (Running locally via MongoDB Community)
* **ODM (Object Data Modeling):** Mongoose. Leverages complex database relations (e.g., embedding History Logs, linking Users to Bugs via heavy population arrays).

### 4. The Machine Learning Engine (Microservice)
* **Framework:** Python Flask (Runs as an independent microservice on Port 5001)
* **Libraries:** `scikit-learn` (For building AI models), `pandas`/`numpy` (For mathematical matrix calculations)
* **Algorithms:** 
  - **SVM (Support Vector Machine):** Classifies text as "Valid Bug" vs "Invalid/Spam".
  - **TF-IDF Vectorizer & Cosine Similarity (Lexical Localization):** An Information Retrieval technique that measures mathematical similarities between the English words in the bug description and the raw text of the codebase files.

---

## 🚀 Core Features (Role-Based Design)

Your application has incredibly heavy Access-Control logic. It adapts its features based on three distinct roles.

### 1. General & Authentication Features
* **GitHub single sign-on (OAuth):** Developers can log in instantly using their GitHub profiles, completely bypassing passwords.
* **Automatic Account Linking:** The system intelligently checks if an email already exists in MongoDB and safely binds incoming GitHub IDs to old accounts without crashing.

### 2. Tester Capabilities
* **Crowdsourced Bug Reporting:** Testers act as the frontline troops. They fill out custom forms referencing heavily-detailed bugs mapped to specific global projects.
* **Live Status Tracking:** Testers can monitor a bug as it travels through your pipeline (from `Open` to `In Progress` to `Resolved`), viewing history logs and timestamps.

### 3. Developer Capabilities (The ML Magic)
* **Autonomous Assignment:** The system skips Project Managers and mathematically assigns developers based on who wrote the broken file originally.
* **AI Source Code Localization Panel:** The crown jewel. When a dev clicks a bug, instead of guessing what's wrong, your backend queries the Python Microservice and returns an ordered list of heavily-likely file locations (e.g., `src/auth/login.js - 88% Match`) saving developers hours of debugging time.

### 4. Admin / Project Manager Capabilities
* **Global Access & Override Modals:** Admins can view a completely unfiltered dashboard of all system stats, override ML assignments mathematically if a developer is busy, and terminate/elevate user roles.
* **Project Generators:** Only Admins have the key to register new Software Projects in the database, ensuring system integrity.
