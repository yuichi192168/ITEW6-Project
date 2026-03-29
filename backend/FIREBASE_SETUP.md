# Firebase Setup Guide

This document provides step-by-step instructions to connect your Education Management System to Firebase.

## Prerequisites

- A Google account
- Access to [Firebase Console](https://console.firebase.google.com)
- The project code already configured

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"** or select an existing one
3. Enter your project name (e.g., "Education Management System")
4. Complete the remaining setup steps
5. Once created, your project dashboard will appear

## Step 2: Create a Web App

1. In the Firebase console, click the **"<>"** (Web) icon to add a web app
2. Enter an app nickname (e.g., "Education Web App")
3. Check "Also set up Firebase Hosting for this app" (optional)
4. Click **"Register app"**
5. Firebase will display your configuration - **copy this carefully**

## Step 3: Get Your Firebase Configuration

After registering your web app, you'll see a configuration object like this:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 4: Update .env.local

1. Open `.env.local` in the project root
2. Replace the placeholder values with your Firebase credentials:

```bash
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
```

3. Save the file

## Step 5: Set Up Authentication

1. In Firebase console, go to **Authentication** (left sidebar)
2. Click **"Get Started"**
3. Click **"Email/Password"** provider
4. Toggle **"Enable"** to turn it on
5. Click **"Save"**

### Create Test Users

Since the demo uses these credentials, create users in Firebase:

1. Go to **Users** tab in Authentication
2. Click **"Add user"** for each:
   - Email: `admin@example.com` / Password: `admin123`
   - Email: `student@example.com` / Password: `student123`
   - Email: `faculty@example.com` / Password: `faculty123`

## Step 6: Set Up Firestore Database

1. In Firebase console, go to **Firestore Database** (left sidebar)
2. Click **"Create database"**
3. Select your region and click **"Continue"**
4. Choose **"Start in test mode"** (for development)
5. Click **"Create"**

### Create Collections

After Firestore is created, set up these collections:

1. **users** collection - stores user profiles
   - Documents: user IDs (auto-generated)
   - Fields:
     ```
     {
       "id": "user-id",
       "name": "User Name",
       "email": "user@example.com",
       "role": "admin|student|faculty",
       "photoURL": "https://...",
       "phone": "+63...",
       "address": "..."
     }
     ```

2. **students** collection - for student data
3. **faculty** collection - for faculty data
4. **courses** collection - for course data
5. **grades** collection - for grade records
6. **events** collection - for system events

## Step 7: Security Rules (Important for Production)

For development, test mode is fine. For production, update Firestore rules:

1. Go to **Firestore Database** → **Rules**
2. Replace with rules that match your security needs:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId || request.auth.uid != null;
    }
    match /students/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /faculty/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click **"Publish"**

## Step 8: Enable Storage (Optional)

For user profile pictures:

1. Go to **Storage** (left sidebar)
2. Click **"Get Started"**
3. Select your region
4. Start in test mode for development
5. Click **"Create"**

## Step 9: Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

2. Navigate to `http://localhost:5173` (or your dev server URL)

3. Try logging in with demo credentials:
   - Email: `admin@example.com`
   - Password: `admin123`

4. If successful, you're redirected to the dashboard

## Troubleshooting

### "Firebase configuration is not properly set"
- Check `.env.local` exists in project root
- Verify all environment variables are set correctly
- Restart the dev server after updating `.env.local`

### "Missing dependencies"
```bash
npm install firebase
# or
pnpm add firebase
```

### Firestore Permission Denied
- Check Firestore is in test mode (for development)
- Verify Authentication is set up
- Check Security Rules in Firestore console

### Users not created after signup
1. Check Firestore `users` collection exists
2. Verify Authentication is enabled in Firebase
3. Check browser console for errors (F12)

## Next Steps

1. **Create sample data** in Firestore collections
2. **Update dashboard pages** to fetch real data from Firestore using provided database service
3. **Configure email verification** in Authentication settings
4. **Set up password reset** functionality
5. **Deploy to Firebase Hosting** (optional)

## Database Service Usage

The app includes a database service (`src/lib/database.ts`) with helper functions:

```typescript
// Get a single document
const user = await getDocument('users', 'userId');

// Get all documents from collection
const students = await getCollection('students');

// Query with conditions
const adminUsers = await queryCollection('users', [['role', '==', 'admin']]);

// Update document
await updateDocument('users', 'userId', { name: 'New Name' });

// Delete document
await deleteDocument('courses', 'courseId');
```

Use these functions when updating pages to fetch data from Firestore.

## Contact & Support

For issues with Firebase setup, visit [Firebase Documentation](https://firebase.google.com/docs)

For app-specific issues, check the console (F12) for error messages.
