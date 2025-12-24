# 🧪 BuildWise Student Mode - Quick Testing Guide

## 🚀 5-Minute Quick Start

### 1. Generate Test Tokens

Create `scripts/test-tokens.js`:
```javascript
require('dotenv').config();
const jwt = require('jsonwebtoken');

const tokens = {
  student: jwt.sign(
    { userId: 'student-123', role: 'student', email: 'student@test.com' },
    process.env.JWT_SECRET,
    { expiresIn: '7d', issuer: process.env.JWT_ISSUER || 'buildwise' }
  ),
  teacher: jwt.sign(
    { userId: 'teacher-456', role: 'teacher', email: 'teacher@test.com' },
    process.env.JWT_SECRET,
    { expiresIn: '7d', issuer: process.env.JWT_ISSUER || 'buildwise' }
  ),
  admin: jwt.sign(
    { userId: 'admin-789', role: 'admin', email: 'admin@test.com' },
    process.env.JWT_SECRET,
    { expiresIn: '7d', issuer: process.env.JWT_ISSUER || 'buildwise' }
  )
};

console.log('\n🔑 Copy these tokens to localStorage:\n');
console.log('STUDENT:', tokens.student);
console.log('\nTEACHER:', tokens.teacher);
console.log('\nADMIN:', tokens.admin);
```

Run: `node scripts/test-tokens.js`

### 2. Set Token in Browser

```javascript
// Open DevTools Console (F12)
// Paste one of these:

// For Student Mode:
localStorage.setItem('token', 'PASTE_STUDENT_TOKEN_HERE');

// For Teacher Mode:
localStorage.setItem('token', 'PASTE_TEACHER_TOKEN_HERE');
```

### 3. Run Migration (First Time Only)

```bash
node scripts/mig-modules-add-fields.js
```

---

## 🎯 Essential Test Flows

### Flow 1: Student Creates Project (2 minutes)

1. **Setup**: Student token in localStorage
2. **Navigate**: `http://localhost:3000/student`
3. **Actions**:
   - Click "New Project"
   - **Step 1**: Select "Food delivery" → Next
   - **Step 2**: Skill "Beginner", check "Auth" + "CRUD" → Next  
   - **Step 3**: ✅ Check "Allow saving raw LLM outputs" → Create Project
4. **Expected**: Redirects to `/student/{projectId}/proposal`

✅ **Verify**: Proposal page shows tech stack cards

---

### Flow 2: Start Building (1 minute)

1. **From Proposal Page**: Click "Start Building Architecture"
2. **Expected**: Redirects to builder page
3. **As Student**: 
   - ✅ Approve/Reject buttons DISABLED
   - ✅ Can edit nodes/edges
   - ✅ "Propose Edits" button visible

---

### Flow 3: Teacher Bulk Approve (2 minutes)

1. **Setup**: Teacher token in localStorage
2. **Navigate**: Same project builder
3. **Find**: TeacherOverridePanel in right sidebar
4. **Actions**:
   - ✅ Check 2-3 modules
   - Click "Bulk Approve (3)"
5. **Expected**: 
   - Success alert
   - Modules turn green/approved

---

### Flow 4: Propose & Accept Edit (3 minutes)

**As Student**:
1. Edit a node in builder
2. Click "Preview Diff" → See changes
3. Click "Propose Edits"
4. ✅ Success message

**As Teacher**:
1. Switch to teacher token
2. Test via console:
```javascript
// Get moduleId and editId from MongoDB
fetch('/api/generative/projects/PROJECT_ID/modules/MODULE_ID/propose/EDIT_ID', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({ action: 'accept' })
}).then(r => r.json()).then(console.log)
```
5. ✅ Edit merged into module

---

## 🐛 Quick Debugging

### Check Token
```javascript
// In browser console
const token = localStorage.getItem('token');
console.log('Token:', token);

// Decode to see role
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Role:', payload.role);
console.log('User ID:', payload.userId);
```

### Check API Errors
```javascript
// Network tab in DevTools
// Filter by: XHR
// Look for red (failed) requests
// Click → Preview to see error message
```

### Check Database
```bash
# Connect to MongoDB
mongosh

use buildwise

# Check projects
db.studentprojects.find().pretty()

# Check modules
db.modules.find({projectId: 'YOUR_PROJECT_ID'}).pretty()

# Check audits
db.audits.find().sort({_id: -1}).limit(5).pretty()
```

---

## ✅ Success Indicators

**Student Flow Works**:
- ✅ Wizard completes without errors
- ✅ Proposal page loads with recommendations
- ✅ Modules created from steps
- ✅ Builder restricts student actions

**Teacher Flow Works**:
- ✅ Bulk approve changes module statuses
- ✅ Override panel visible
- ✅ All controls enabled

**Security Works**:
- ✅ Student can't call bulk-approve (403 error)
- ✅ Unauthenticated users see login prompt
- ✅ JWT verification rejects invalid tokens

---

## 🎨 UI Feel-Good Checklist

### Colors & Theme
- [ ] Dark zinc-900 backgrounds
- [ ] Indigo accent colors (buttons, links)
- [ ] Emerald green for success (approved)
- [ ] Yellow for warnings (proposed)
- [ ] Red for errors/rejections

### Interactions
- [ ] Buttons have hover states
- [ ] Loading spinners show during operations
- [ ] Success messages appear after actions
- [ ] Modals open/close smoothly
- [ ] Forms validate inputs

### Typography
- [ ] Readable font sizes (14px+)
- [ ] Clear hierarchy (headings vs body)
- [ ] Monospace for code/IDs
- [ ] White text on dark backgrounds

### Responsiveness
- [ ] Works on mobile (375px)
- [ ] Works on tablet (768px)
- [ ] Works on desktop (1440px+)

---

## 🚨 Common Issues & Fixes

### "Unauthorized" Error
**Fix**: Check token is set correctly
```javascript
localStorage.getItem('token') // Should not be null
```

### "Module not found" Error
**Fix**: Ensure project has modules
```javascript
// Check in MongoDB
db.modules.find({projectId: 'YOUR_ID'}).count()
```

### Builder Page Blank
**Fix**: Check browser console for errors
```
F12 → Console tab → Look for red errors
```

### Bulk Approve Not Working
**Fix**: Verify teacher/admin role
```javascript
// Decode token
const payload = JSON.parse(atob(localStorage.getItem('token').split('.')[1]));
console.log('Role:', payload.role); // Should be 'teacher' or 'admin'
```

---

## 📊 Performance Expectations

- **Project Creation**: < 2 seconds
- **Module Generation**: < 3 seconds
- **Bulk Approve (10 modules)**: < 1 second
- **Builder Page Load**: < 1 second
- **Propose Edit**: < 500ms

---

## 🎯 Priority Test Order

1. ⭐ **Student Project Creation** (Core flow)
2. ⭐ **Proposal to Builder** (Critical path)
3. ⭐ **Teacher Bulk Operations** (Most used feature)
4. **Proposed Edit Flow** (Advanced feature)
5. **Admin Submission Queue** (Admin only)

---

## 📝 Quick Test Report Template

```
Date: _________
Tester: _________

✅ Student wizard works
✅ Proposal page loads
✅ Builder restricts student
✅ Teacher can bulk approve
✅ Privacy checkbox saves

Issues Found:
1. ______________
2. ______________

Ready for Demo: YES / NO
```

---

## 🎉 Success! What Next?

Once testing passes:

1. **Polish**: Fix any UI glitches found
2. **Document**: Update team wiki
3. **Train**: Show teachers new features
4. **Monitor**: Watch logs for first week
5. **Iterate**: Collect feedback, improve

---

## 🆘 Need Help?

**Documentation**:
- `RBAC_IMPLEMENTATION.md` - Technical details
- `RBAC_API_REFERENCE.md` - API endpoints

**Check Errors**:
```bash
# Terminal errors
npm run dev

# Browser errors
F12 → Console

# Database issues
mongosh
```

**Report Bugs**:
- Include: Steps to reproduce
- Include: Expected vs actual behavior
- Include: Browser console screenshot
- Include: Token role being used

---

**Happy Testing! 🚀**

*Estimated testing time: 15-20 minutes for full flow*
