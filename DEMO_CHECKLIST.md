# Demo Checklist - Student Mode Complete Flow

## Master's 9-Step Implementation Complete ✅

All requirements from master implemented and ready for demo.

---

## Pre-Demo Setup

### 1. Environment Check
```powershell
# Verify .env.local has MongoDB connection
Get-Content .env.local | Select-String "MONGODB_URI"

# Install dependencies if needed
npm install

# Start dev server
npm run dev
```

### 2. Database Verification
```powershell
# Run conflict detection tests
node scripts/testConflicts.js

# Run student flow end-to-end test
node scripts/testStudentFlow.js
```

Expected output: All tests pass ✅

---

## Demo Flow (Follow in Order)

### Test 1: Create → Seed → Open Editor → Save Architecture

**Steps:**
1. Navigate to `/student/new` - Create new project
   - Fill in project details (title, features, team members)
   - Submit project

2. Go to Proposal page `/student/[id]/proposal`
   - Click "Open Editor" button
   - **Expected:** Polling starts, snapshot loads within 20 seconds
   - **Expected:** Builder opens with nodes visible (no blank state)

3. In Builder `/student/[id]/builder`
   - Drag nodes, add edges
   - Click Save
   - **Expected:** Toast/confirmation message
   - **Expected:** Snapshot version increments

**Acceptance Criteria:**
- ✅ No "stuck loading" screens
- ✅ Nodes render immediately
- ✅ Save persists changes to database
- ✅ Version number visible and incrementing

---

### Test 2: Approve All Modules → Finalize Snapshot

**Prerequisites:** Login as teacher or admin account

**Steps:**
1. Navigate to project's module view
2. For each module:
   - Click "Approve" button
   - **Expected:** API call to `/api/student/project/[projectId]/modules/[moduleId]/approve`
   - **Expected:** Snapshot version increments
   - **Expected:** Audit log entry created

3. Check audit log (admin panel):
   ```
   GET /api/admin/audit?projectId=<ID>
   ```
   - **Expected:** See `approve_module` entries with actor and timestamp

**Acceptance Criteria:**
- ✅ Approval requires teacher/admin role (RBAC enforced)
- ✅ Each approval creates immutable snapshot version
- ✅ Audit trail shows who approved and when

---

### Test 3: Rollback to Earlier Snapshot

**Steps:**
1. From builder or admin panel, trigger rollback:
   ```javascript
   POST /api/snapshots/[projectId]/rollback
   {
     "version": <older_version_number>
   }
   ```

2. Reload builder
   - **Expected:** Canvas shows older snapshot state
   - **Expected:** New snapshot created (not overwrite)
   - **Expected:** Audit log shows rollback action

**Acceptance Criteria:**
- ✅ Rollback requires teacher/admin role
- ✅ Creates new snapshot (immutable history)
- ✅ Audit log entry created

---

### Test 4: Trigger Conflict Case

**Setup:**
Simulate two modules with conflicting DB types:

```javascript
// Module A snapshot
{
  nodes: [
    { id: 'db-1', type: 'database', data: { dbType: 'postgres' } }
  ]
}

// Module B snapshot (conflict)
{
  nodes: [
    { id: 'db-1', type: 'database', data: { dbType: 'mongo' } }
  ]
}
```

**Steps:**
1. Attempt merge:
   ```javascript
   POST /api/student/project/[projectId]/merge
   {
     "nodes": [{ id: 'db-1', type: 'database', data: { dbType: 'mongo' } }]
   }
   ```

2. **Expected Response:**
   ```json
   {
     "ok": false,
     "conflicts": [
       {
         "id": "node-db-db-1",
         "nodeId": "db-1",
         "reason": "DB type mismatch: postgres !== mongo",
         "existingValue": "postgres",
         "incomingValue": "mongo"
       }
     ],
     "error": "Merge conflicts detected. Admin review required."
   }
   ```

**Acceptance Criteria:**
- ✅ Conflict detected and merge blocked
- ✅ Detailed conflict info returned
- ✅ Audit log shows conflict detection

---

### Test 5: Privacy Opt-In Test

**Test Case A: Privacy Opt-In = False (Default)**

```javascript
// Create project
{
  "title": "Privacy Test A",
  "privacy_opt_in": false
}
```

**Steps:**
1. Create project with `privacy_opt_in: false`
2. Generate snapshot via job
3. Inspect snapshot in database:
   ```javascript
   db.snapshots.findOne({ projectId: '<ID>' })
   ```
4. **Expected:** `ai_feedback.raw_llm_output` field NOT present

**Test Case B: Privacy Opt-In = True**

```javascript
// Create project
{
  "title": "Privacy Test B",
  "privacy_opt_in": true
}
```

**Steps:**
1. Create project with `privacy_opt_in: true`
2. Generate snapshot (ensure mock includes `raw_llm_output`)
3. Inspect snapshot
4. **Expected:** `ai_feedback.raw_llm_output` field IS present

**Acceptance Criteria:**
- ✅ Default `privacy_opt_in` is `false`
- ✅ Raw LLM output only stored when explicitly opted in
- ✅ Complies with data minimization principle

---

### Test 6: Admin Audit Log

**Steps:**
1. Perform several actions:
   - Save architecture (student)
   - Approve module (teacher)
   - Rollback snapshot (admin)
   - Trigger merge conflict

2. Query audit log:
   ```javascript
   GET /api/admin/audit?projectId=<ID>
   ```

3. **Expected Response:**
   ```json
   {
     "ok": true,
     "audit": [
       {
         "projectId": "...",
         "actor": "user-id-123",
         "action": "rollback_snapshot",
         "details": { "targetVersion": 1234567890, "role": "admin" },
         "timestamp": 1234567890
       },
       {
         "actor": "user-id-456",
         "action": "approve_module",
         "details": { "moduleId": "mod-1", "role": "teacher" },
         "timestamp": 1234567889
       },
       ...
     ]
   }
   ```

**Acceptance Criteria:**
- ✅ All major actions logged
- ✅ Actor ID and role captured
- ✅ Timestamp and details included
- ✅ Chronological order (newest first)

---

## Post-Demo Verification

### Backend Health Check

```powershell
# Run all test scripts
node scripts/testStudentFlow.js
node scripts/testConflicts.js
node scripts/simpleTest.js
```

All tests should pass ✅

### API Endpoint Smoke Test

```powershell
# List all new endpoints
Get-ChildItem -Recurse -Path "src/app/api" -Filter "route.ts" | Select-Object FullName
```

**New Endpoints Implemented:**
- ✅ `POST /api/student/project/[id]/save-architecture`
- ✅ `POST /api/student/project/[id]/generate-snapshot`
- ✅ `PATCH /api/student/project/[projectId]/modules/[moduleId]/approve`
- ✅ `POST /api/snapshots/[projectId]/rollback`
- ✅ `POST /api/student/project/[projectId]/merge`
- ✅ `GET /api/admin/audit`

### Frontend Components

**New Pages:**
- ✅ `/student/[id]/builder` - Student-specific builder with snapshot bootstrap
- ✅ Updated `/student/[id]/proposal` - Polling logic for Open Editor

---

## Known Issues & Limitations

### Current State:
- ✅ Backend 100% functional (verified via direct tests)
- ✅ All 9 master requirements implemented
- ⚠️ Next.js dev server intermittent stability (port conflicts)
- ⚠️ Visual diff modal - basic JSON display (not React Flow mini-diagram yet)

### Future Enhancements:
- [ ] React Flow mini-diagrams in diff modal
- [ ] Real-time WebSocket updates for snapshot polling
- [ ] Batch approval for multiple modules
- [ ] Conflict resolution UI (currently API only)

---

## Success Metrics

✅ **1. Open Editor Flow:**
- Polling completes within 20 seconds
- No blank canvas states
- SessionStorage used for fast loading

✅ **2. Save Architecture:**
- Changes persist to MongoDB
- Version increments automatically
- Audit log created

✅ **3. Approve Module:**
- RBAC enforced (teacher/admin only)
- Immutable snapshot created
- Audit trail complete

✅ **4. Rollback:**
- RBAC enforced
- History preserved (new snapshot, not overwrite)
- Audit logged

✅ **5. Conflict Detection:**
- Type mismatches caught
- DB type conflicts flagged
- Protocol/auth conflicts detected

✅ **6. Privacy Compliance:**
- Default opt-out working
- Raw LLM output conditional storage
- Data minimization enforced

✅ **7. Audit Log:**
- All actions tracked
- Actor and role captured
- Queryable by project

✅ **8. RBAC:**
- Student: Create, save, view
- Teacher: Approve, view audit
- Admin: Rollback, merge resolution, full audit

---

## Master's Verdict Checklist

Master said: "Stop celebrating with a victory dance and let's convert that working backend into a usable student flow so the UI doesn't behave like a haunted kiosk during your demo."

**Deliverables:**
- ✅ Open Editor flow wired with polling
- ✅ Builder bootstraps snapshot (sessionStorage + API fallback)
- ✅ Save Architecture endpoint functional
- ✅ Approve Module with RBAC and audit
- ✅ Rollback with RBAC and audit
- ✅ Conflict detection baseline (type, DB, protocol, auth)
- ✅ Privacy opt-in compliance
- ✅ Audit system with admin endpoint
- ✅ RBAC middleware for protected routes

**Status:** COMPLETE - Ready for demo 🎉

---

## Emergency Troubleshooting

### Server won't start:
```powershell
# Kill processes on ports 3000-3002
Get-NetTCPConnection -LocalPort 3000,3001,3002 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
npm run dev
```

### MongoDB connection fails:
```powershell
# Test connection
node scripts/simpleTest.js
```

### Snapshot not generating:
```powershell
# Manual trigger
node scripts/runJobForProject.js <PROJECT_ID>
```

### TypeScript errors:
```powershell
# Rebuild
npm run build
```

---

## Contact

Questions during demo? Check:
1. `BACKEND_LOG.md` - Previous backend implementation notes
2. `GENERATIVE_AI_DOCUMENTATION.md` - AI architecture details
3. This checklist's "Emergency Troubleshooting" section

**Master's final words:** "Spoonfeeding complete. Execute the demo. No excuses."
