# 🧪 TESTING GUIDE - BuildWise Full Application

## 🚀 Quick Start

```bash
# 1. Start MongoDB (if not running)
# Windows (if installed as service, it should already be running)
# Otherwise: mongod --dbpath C:\data\db

# 2. Start Next.js dev server
npm run dev

# 3. Open browser
http://localhost:3000
```

---

## 📋 Complete Testing Flow (Follow This Order!)

### ✅ Step 1: First-Time Setup (Register → Login)

**Expected Flow:** Register → Redirect to Home (with auth)

1. **Navigate to:** `http://localhost:3000`
   - ❌ Should redirect to `/login` (no token yet)

2. **Click "Sign up for free"** or go to `/register`
   - Fill form:
     - First Name: John
     - Last Name: Doe
     - Email: john@example.com
     - Password: password123
     - Confirm Password: password123
     - ✅ Check "Accept Terms"
   - Click **"Create Account"**

3. **Expected Result:**
   - ✅ Token saved to localStorage
   - ✅ Redirected to `/` (home page)
   - ✅ See NavHeader with logout button
   - ✅ See DashboardLayout with features

4. **Verify Authentication:**
   - Open DevTools (F12) → Console
   - Type: `localStorage.getItem('token')`
   - ✅ Should return JWT token string

---

### ✅ Step 2: Test Navigation & Home Page

1. **Home Page Features:** `/`
   - ✅ NavHeader visible (BuildWise logo, nav links, Logout button)
   - ✅ Hero section
   - ✅ 4 feature cards:
     - AI Architecture Designer
     - Start New Design
     - Student Mode
     - Generative AI Design

2. **Click each nav link to verify routing:**
   - Design Canvas → `/design`
   - Generative AI → `/generative-ai`
   - Student Mode → `/student`

3. **Test Logout:**
   - Click **"Logout"** button
   - ✅ Token cleared from localStorage
   - ✅ Redirected to `/login`

---

### ✅ Step 3: Test Student Mode (Main Feature)

**Login again first!** (john@example.com / password123)

#### 3.1 Student Landing Page

1. **Navigate to:** `/student`
   - ✅ See "Start New Project" button
   - ✅ Empty state (no projects yet)
   - ✅ Tips sidebar on right

#### 3.2 Create New Project

2. **Click "Start New Project"** → `/student/new`
   - **Choose App Type:** E-commerce
   - **Choose Skill Level:** Beginner (radio button)
   - **Select Features:** Check "Authentication" and "CRUD"
   - Click **"Create Project"**

3. **Expected Result:**
   - ✅ Redirected to `/student/[projectId]` (editor page)
   - ✅ See project title and skill level
   - ✅ Empty canvas (no nodes yet)

#### 3.3 Generate Architecture Steps

4. **Click "Generate Next Step"** button
   - ✅ Loading spinner appears
   - ✅ SVG canvas renders nodes (boxes)
   - ✅ Edges (lines) connecting nodes
   - ✅ Typing animation for explanations
   - ✅ AI score increases

5. **Generate 3-5 more steps:**
   - Click "Generate Next Step" repeatedly
   - ✅ Each step adds more nodes
   - ✅ Architecture grows progressively
   - ✅ Step list on right shows all steps

6. **Click on step in sidebar:**
   - ✅ Canvas updates to show that step's state
   - ✅ Explanations change

#### 3.4 Submit Project

7. **Click "Submit for Admin Review"**
   - ✅ Confirm dialog appears
   - ✅ After confirm, redirected to `/student`
   - ✅ See project in list with status "submitted"

---

### ✅ Step 4: Test Design Canvas (Drag & Drop)

1. **Navigate to:** `/design`

2. **Test Drag & Drop:**
   - From left palette, drag "Frontend" component
   - Drop on canvas
   - ✅ Component appears at drop location
   - Drag more components (Backend, Database, etc.)

3. **Test Connections:**
   - Click "Start Connection" button
   - Click source node, then target node
   - ✅ Line drawn between nodes

4. **Test Configuration:**
   - Double-click a node (or right-click → Configure)
   - ✅ Modal opens
   - Edit name, tech stack, notes
   - Click Save
   - ✅ Changes reflected on canvas

5. **Test Save Design:**
   - Enter title at top
   - Click "Save Design"
   - ✅ Success message appears

---

### ✅ Step 5: Test Generative AI Page

1. **Navigate to:** `/generative-ai`

2. **Enter Prompt:**
   - Type: "Create a social media app with microservices"
   - Click "Generate Architecture"

3. **Expected Result:**
   - ✅ Architecture canvas renders
   - ✅ Nodes positioned automatically
   - ✅ Insights panel shows recommendations
   - ✅ Can click nodes to see details in modal

4. **Test Export:**
   - Click "Export as JSON"
   - ✅ JSON file downloads

---

### ✅ Step 6: Test Admin Features (Advanced)

**Note:** Requires admin account. Create one manually in MongoDB:

```javascript
// MongoDB shell or Compass
db.admins.insertOne({
  email: "admin@buildwise.com",
  password: "$2a$10$..." // bcrypt hash of "admin123"
  name: "Admin User",
  createdAt: new Date()
})
```

#### 6.1 Admin Login

1. **Navigate to:** `/admin/auth/login`
   - Email: admin@buildwise.com
   - Password: admin123
   - ✅ Redirected to admin dashboard

#### 6.2 Review Student Submissions

2. **Navigate to:** `/admin/submissions`
   - ✅ See list of submitted student projects
   - ✅ User name, app type, status shown

3. **Test Verify:**
   - Click "Verify" button on a submission
   - ✅ Status changes to "verified"
   - ✅ AdminLog entry created

4. **Test Flag:**
   - Enter reason in "Quick Flag" textarea
   - Click a submission, then "Flag Selected"
   - ✅ Status changes to "flagged"
   - ✅ Reason saved in log

5. **Test Add Feedback:**
   - Click "View" on a submission
   - Enter feedback text in textarea
   - Click "Save Feedback"
   - ✅ Feedback saved to submission

---

## 🐛 Common Issues & Solutions

### Issue: "No token provided"

**Cause:** Not logged in  
**Solution:**
1. Check: `localStorage.getItem('token')` in console
2. If null, go to `/login` and login
3. If still failing, check `/api/auth/login` response in Network tab

### Issue: Page redirects to /login immediately

**Cause:** Token expired or invalid  
**Solution:**
1. Clear localStorage: `localStorage.clear()`
2. Register/login again
3. Check JWT_SECRET in `.env.local` matches backend

### Issue: Student Mode shows empty architecture

**Cause:** Generate step not called yet  
**Solution:**
1. Click "Generate Next Step" button
2. Wait for API response (check Network tab)
3. If API fails, check MongoDB connection

### Issue: Admin routes return 403 Forbidden

**Cause:** Not logged in as admin  
**Solution:**
1. Check: `localStorage.getItem('admin_token')`
2. Login at `/admin/auth/login` with admin credentials
3. Verify admin exists in `admins` collection

---

## 🎯 What to Test for Interviews

### When Demoing to Interviewer:

1. **Show Authentication Flow**
   - "Let me show you the registration process..."
   - Register → Auto-login → Token in localStorage
   - Logout → Protected route redirect

2. **Show Student Mode (Unique Feature)**
   - "This is our guided architecture builder for beginners..."
   - Create project → Generate steps → Submit
   - Explain skill levels and deterministic generator

3. **Show Admin Moderation**
   - "Admins can review student submissions..."
   - Verify/Flag/Add Feedback
   - Explain audit logging with AdminLog

4. **Explain Technical Decisions**
   - "We used JWT for stateless auth..."
   - "Soft delete pattern for data retention..."
   - "React Context for global auth state..."
   - "MongoDB compound indexes for performance..."

---

## 📊 API Testing (cURL Commands)

### Test Register API
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'
```

### Test Login API
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Test Student Projects (with token)
```bash
curl http://localhost:3000/api/student/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Admin Submissions
```bash
curl http://localhost:3000/api/admin/submissions \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## ✅ Testing Checklist

Use this before demo or submission:

- [ ] Register new user works
- [ ] Login with existing user works
- [ ] Logout clears token and redirects
- [ ] Protected routes redirect when not authenticated
- [ ] Home page shows all features
- [ ] Student Mode: Create project
- [ ] Student Mode: Generate steps (3-5 steps)
- [ ] Student Mode: Submit project
- [ ] Student Mode: Projects list shows submitted project
- [ ] Design Canvas: Drag & drop components
- [ ] Design Canvas: Connect components
- [ ] Design Canvas: Configure component
- [ ] Design Canvas: Save design
- [ ] Generative AI: Enter prompt and generate
- [ ] Admin: Login as admin
- [ ] Admin: View submissions
- [ ] Admin: Verify submission
- [ ] Admin: Flag submission with reason
- [ ] Admin: Add feedback to submission
- [ ] No console errors in DevTools
- [ ] All API calls return 200/201 (check Network tab)

---

**Last Updated:** November 21, 2025  
**Test Environment:** Windows, Node.js 18+, MongoDB 6+, Next.js 15
