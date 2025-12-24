# Quick Start Guide - Master's 9-Step Implementation

## Test Your Implementation (5 Minutes)

### 1. Conflict Detection Test
```powershell
node scripts/testConflicts.js
```
**Expected:** All 5 tests pass ✅

### 2. Backend Verification
```powershell
node scripts/simpleTest.js
```
**Expected:** Project + Snapshot created successfully ✅

### 3. Start Dev Server
```powershell
npm run dev
```
**Expected:** Server starts on port 3000 (or 3001/3002 if occupied)

---

## Demo Flow (10 Minutes)

### Scenario 1: Create → Seed → Open Editor
1. Navigate to `/student/new`
2. Create project with:
   - Title: "Demo Project"
   - Features: auth, crud
   - Team: 3 members
3. Go to proposal page
4. Click "Open Editor"
   - **Watch:** Loading indicator while polling
   - **Expected:** Builder opens with nodes visible in ~10-20 seconds

### Scenario 2: Save Architecture
1. In builder, drag a node
2. Click Save
3. **Expected:** Toast confirmation, version increments

### Scenario 3: Conflict Detection
Use curl/Postman to test merge endpoint:
```powershell
$headers = @{"Content-Type"="application/json"}
$body = @{
  nodes = @(
    @{
      id = "db-1"
      type = "database"
      data = @{ dbType = "mongo" }
    }
  )
} | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/student/project/<PROJECT_ID>/merge" -Headers $headers -Body $body
```
**Expected:** Conflict detected if existing DB has different type

---

## API Endpoints Quick Reference

### Student Endpoints:
```
POST   /api/student/project/[id]/save-architecture
POST   /api/student/project/[id]/generate-snapshot
GET    /api/student/project/[id]/snapshot?mode=latest
PATCH  /api/student/project/[projectId]/modules/[moduleId]/approve
```

### Admin Endpoints:
```
GET    /api/admin/audit?projectId=<ID>
POST   /api/snapshots/[projectId]/rollback
```

### Merge Endpoint:
```
POST   /api/student/project/[projectId]/merge
```

---

## Troubleshooting

### Server won't start:
```powershell
# Kill processes on ports 3000-3002
Get-NetTCPConnection -LocalPort 3000,3001,3002 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
npm run dev
```

### Snapshot not generating:
Check MongoDB connection in `.env.local`:
```
MONGODB_URI=mongodb+srv://...
```

### TypeScript errors:
```powershell
npm run build
```

---

## What to Tell Master

✅ **All 9 steps implemented:**
1. Open Editor polling - WORKING
2. Builder snapshot bootstrap - WORKING
3. Save Architecture endpoint - WORKING
4. Approve Module (RBAC) - WORKING
5. Rollback (RBAC) - WORKING
6. Audit system - WORKING
7. Conflict detection - TESTED ✅
8. Privacy opt-in - WORKING
9. Demo checklist - COMPLETE

✅ **Tests passing:**
- Conflict detection: 5/5 ✅
- MongoDB operations: All ✅
- Backend pipeline: Verified ✅

✅ **Ready for demo:**
- No blank canvas states
- Polling works (20 second timeout)
- RBAC enforced on approve/rollback
- Privacy compliance implemented
- Audit logging active

---

## Files to Show Master

1. **Frontend Polish:**
   - `src/app/student/[id]/proposal/page.tsx` - Polling logic
   - `src/app/student/[id]/builder/page.tsx` - Bootstrap implementation

2. **Backend Systems:**
   - `src/lib/backend/audit.ts` - Audit logging
   - `src/lib/backend/conflicts.ts` - Conflict detection
   - `src/lib/backend/rbac.ts` - RBAC middleware

3. **API Routes (6 new):**
   - Check `src/app/api/student/project/` for new endpoints
   - Check `src/app/api/admin/audit/` for audit endpoint
   - Check `src/app/api/snapshots/` for rollback endpoint

4. **Tests:**
   - `scripts/testConflicts.js` - Run to prove it works
   - `scripts/simpleTest.js` - Shows backend functional
   - `DEMO_CHECKLIST.md` - Complete test scenarios

---

## Success Metrics

Master's Requirements → Implementation Status:

1. **Open Editor polls snapshot** → ✅ 25 attempts, 800ms interval
2. **Builder bootstraps snapshot** → ✅ sessionStorage + API fallback
3. **Save Architecture endpoint** → ✅ POST endpoint with audit
4. **Approve Module** → ✅ RBAC enforced, immutable snapshots
5. **Rollback** → ✅ RBAC enforced, history preserved
6. **Audit list** → ✅ MongoDB collection + query endpoint
7. **Conflict detection** → ✅ Type/DB/protocol checks, tested
8. **RBAC + privacy** → ✅ Role checks, opt-in compliance
9. **Testing checklist** → ✅ 2 passing test scripts, demo guide

**No more haunted kiosk behavior.** 🎉

---

## Emergency Demo Commands

```powershell
# Quick health check
node scripts/simpleTest.js

# Test conflicts
node scripts/testConflicts.js

# Start server
npm run dev

# Check API
curl http://localhost:3000/api/student/project/<ID>/snapshot?mode=latest

# View audit logs
curl http://localhost:3000/api/admin/audit?projectId=<ID>
```

---

Master's final words: **"Spoonfeeding complete. Execute the demo. No excuses."**

Status: **READY** ✅
