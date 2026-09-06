# Journal & Reflections AI App

A production-grade, user-authenticated journaling and personal reflection web application. Users authenticate via Google Sign-In (Firebase Authentication), converse across multi-turn reflection threads with the Gemini 3.6 Flash API, and store their private journal entries with strict owner-bound isolation in Cloud Firestore.

---

## Architecture Overview

| Layer | Technology | Security & Implementation Highlights |
| :--- | :--- | :--- |
| **Authentication** | Firebase Authentication (Google Sign-In) | Passwordless federated OAuth login. No user passwords stored in code. |
| **Database** | Cloud Firestore | Isolated document storage under `/users/{userId}/interactions/{interactionId}`. Enforced via `firestore.rules`. |
| **AI Engine** | Gemini 3.6 Flash (`@google/genai`) | Server-side execution proxy with 4-tier model fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`). |
| **Secret Management** | Google Cloud Secret Manager / Env Vars | Operational credentials dynamically retrieved server-side; zero API keys exposed to browser clients. |

---

## 1. Environment & Prerequisites

1. **Google Cloud SDK (`gcloud` CLI)** installed and configured:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
2. Enable required Google Cloud APIs:
   ```bash
   gcloud services enable \
     run.googleapis.com \
     secretmanager.googleapis.com \
     firestore.googleapis.com \
     identitytoolkit.googleapis.com
   ```
3. Node.js 20+ and npm installed locally.

---

## 2. Secret Management Setup

Store your `GEMINI_API_KEY` securely in Google Cloud Secret Manager and grant the Cloud Run runtime service account the necessary access:

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Identify your Cloud Project Number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

# 3. Grant the default Compute / Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Database Security Configuration (Cloud Firestore)

Deploy the owner-bound Firestore security rules ensuring strict user isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

To deploy rules with the Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env`:
   ```bash
   GEMINI_API_KEY="your-gemini-api-key"
   ```
3. Start the full-stack dev server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 5. Cloud Run Deployment Flow

Deploy the application container directly to Cloud Run:

```bash
gcloud run deploy journal-reflections \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

### Required Campaign Labeling
Apply the mandatory resource label to register the service for automated challenge verification:

```bash
gcloud run services update journal-reflections \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region asia-southeast1
```

---

## 6. Verification Test Cases & Walkthrough

| Test ID | Flow | Expected Result |
| :--- | :--- | :--- |
| **TC-01** | Google Sign-In | Firebase Auth popup completes; user profile loads in dashboard. |
| **TC-02** | Gemini Multi-Turn Reflection | Input sent to `/api/reflections/generate`; Gemini generates structured markdown reflection. |
| **TC-03** | Mode Tuning | Deep Reflection, Executive Summary, or Brainstorming adjusts system prompt and response framing. |
| **TC-04** | User Firestore Isolation | Documents saved under `/users/{uid}/interactions`; cross-user access rejected by security rules. |
| **TC-05** | Fallback Resilience & Retry | Recoverable API codes trigger model ladder; failed writes show retry button without clearing text. |
| **TC-06** | History Search & Delete | Real-time search filter query; delete removes document from Firestore. |
| **TC-07** | Sign Out | Cleans session state and redirects to landing page. |
