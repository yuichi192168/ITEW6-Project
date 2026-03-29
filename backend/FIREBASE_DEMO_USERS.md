# Firebase Demo Users Setup Guide

This guide helps you create the demo users in Firebase with proper role assignments.

## Demo Users to Create

Create these three users in Firebase Authentication:

### 1. Admin User
- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Role**: Admin

### 2. Student User
- **Email**: `student@example.com`
- **Password**: `student123`
- **Role**: Student

### 3. Faculty User
- **Email**: `faculty@example.com`
- **Password**: `faculty123`
- **Role**: Faculty

## How Roles Are Assigned

**The app automatically assigns roles based on the email address:**

```
✓ Email contains "admin" → Admin role
✓ Email contains "faculty" → Faculty role
✓ Everything else → Student role
```

So:
- `admin@example.com` → automatically becomes **Admin**
- `professor@example.com` → automatically becomes **Student** (needs "faculty" in name)
- `faculty@example.com` → automatically becomes **Faculty**
- `john@example.com` → automatically becomes **Student**

## Step-by-Step: Create Users in Firebase

### 1. Open Firebase Console
Go to [https://console.firebase.google.com](https://console.firebase.google.com) and select your project `ccs-profiling-system`

### 2. Go to Authentication
- Left sidebar → **Authentication**
- Click **Users** tab

### 3. Create First User (Admin)
- Click **Add user**
- Email: `admin@example.com`
- Password: `admin123`
- Click **Create user**

### 4. Create Second User (Student)
- Click **Add user**
- Email: `student@example.com`
- Password: `student123`
- Click **Create user**

### 5. Create Third User (Faculty)
- Click **Add user**
- Email: `faculty@example.com`
- Password: `faculty123`
- Click **Create user**

## ✅ Verify It Works

1. Go to your app and refresh the page
2. Try logging in with each user:
   - `admin@example.com` / `admin123` → Should see **Admin Dashboard**
   - `student@example.com` / `student123` → Should see **Student Dashboard**
   - `faculty@example.com` / `faculty123` → Should see **Faculty Dashboard**

## Optional: Add User Data to Firestore

For enhanced functionality, create a **"users"** collection in Firestore with these documents:

### Document 1: admin
Collection: `users`
Document ID: `{user-uid-of-admin}`

```json
{
  "id": "{user-uid}",
  "name": "Admin User",
  "email": "admin@example.com",
  "role": "admin"
}
```

### Document 2: student
Collection: `users`
Document ID: `{user-uid-of-student}`

```json
{
  "id": "{user-uid}",
  "name": "John Student",
  "email": "student@example.com",
  "role": "student",
  "idNumber": "2024001",
  "program": "BSIT"
}
```

### Document 3: faculty
Collection: `users`
Document ID: `{user-uid-of-faculty}`

```json
{
  "id": "{user-uid}",
  "name": "Dr. Faculty",
  "email": "faculty@example.com",
  "role": "faculty",
  "department": "Computer Science",
  "specialization": "Web Development"
}
```

## How to Get User UID

After creating a user in Firebase, you need their UID to create the Firestore document:

1. In Firebase Console → **Authentication** → **Users**
2. Click on a user to view their details
3. Copy the **User UID** field
4. Use this as the Document ID in Firestore

## 🔍 How the App Uses This Data

1. **Login**: User logs in with email/password
2. **Role Detection**: Email is checked - if it contains "admin" → Admin dashboard, "faculty" → Faculty dashboard, else → Student dashboard
3. **Firestore Sync** (Optional): If user document exists in Firestore, it's fetched and updates the profile
4. **Fallback**: Even if Firestore is empty, the app works with just Firebase Auth + email-based role detection

## 📋 Quick Reference

| Email | Password | Auto Role | Dashboard |
|-------|----------|-----------|-----------|
| `admin@example.com` | `admin123` | Admin | `/dashboard/admin` |
| `student@example.com` | `student123` | Student | `/dashboard/student` |
| `faculty@example.com` | `faculty123` | Faculty | `/dashboard/faculty` |

## Troubleshooting

**Users not getting correct role?**
- Check the email address - it must contain "admin" or "faculty"
- When creating users, use exactly the emails shown above
- Restart your dev server after changing users

**Can't see Firestore data?**
- Firestore is optional - the app works without it
- If you want to add Firestore data, make sure "users" collection exists
- Check Firestore Security Rules allow reading/writing

**User details not updating?**
- The app fetches Firestore data in the background
- If no Firestore document exists, it uses Firebase Auth data
- You can add extra details to Firestore later

## Next Steps

1. ✅ Create the three demo users in Firebase
2. Test logging in with each role
3. (Optional) Add Firestore documents for richer user data
4. Create other collections (students, faculty, courses, grades) as needed
