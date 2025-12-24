# MASTER'S DIAGNOSTIC CHECKLIST - EXECUTION GUIDE

## ✅ COMPLETED STEPS

### 1. Code Improvements Added
- ✅ Added `normalizeSnapshot()` function to `jobs.ts` to ensure consistent snapshot structure
- ✅ Enhanced error logging in `enqueueSnapshotJob` with detailed console logs
- ✅ Added logging to snapshot GET endpoint
- ✅ Added `lastError` field to Project schema for failure tracking
- ✅ Created diagnostic scripts:
  - `scripts/checkSnapshots.js` - Check MongoDB snapshots directly
  - `scripts/runJobForProject.js` - Force-run snapshot generation for a project
  - `scripts/testApiFlow.js` - Test the full API flow

---

## 📋 NEXT STEPS - RUN THESE NOW

### STEP 1: Start/Restart Dev Server
```cmd
npm run dev
```
**Wait for it to fully start** (should show "Ready" message)

---

### STEP 2: Run API Flow Test
In a NEW terminal:
```cmd
node scripts/testApiFlow.js
```

**What to look for:**
- ✅ Create Response should have `{"ok":true,"projectId":"..."}`
- ✅ Seed Response should have `{"ok":true,"jobId":"..."}`
- ✅ Snapshot Response should eventually show `{"ok":true,"ready":true,"snapshot":{...}}`

**If ANY step fails**, copy the ENTIRE output and paste it.

---

### STEP 3: Check MongoDB Snapshots
```cmd
node scripts/checkSnapshots.js
```

**What to look for:**
- Should show list of snapshots with `projectId`, `version`, `nodes`, `edges`
- If empty, snapshot job didn't save

---

### STEP 4: Check Server Logs
Go to your dev server terminal and look for these log lines:
```
[api] created project <id> members: <n>
[job] enqueueSnapshotJob start <projectId>
[job] project loaded: <title>
[job] raw snapshot generated, keys: <keys>
[job] normalized snapshot, nodes: <n> edges: <n>
[job] snapshot saved <id> version <timestamp>
```

**If you see errors**, copy the full error stack trace.

---

### STEP 5: Manual Job Test (if automated test fails)
```cmd
node scripts/runJobForProject.js PROJECT_ID
```
Replace `PROJECT_ID` with the actual ID from Step 2.

**What to look for:**
- ✅ Should output: "✅ Saved snapshot id: ... version: ..."
- ❌ If errors, copy the full output

---

## 🚨 COMMON ISSUES & FIXES

### Issue: "Cannot find module"
**Fix**: Server not running or missing dependencies
```cmd
npm install
npm run dev
```

### Issue: "MongoServerSelectionError"
**Fix**: MongoDB not running
```cmd
# Start MongoDB (adjust for your setup)
mongod --dbpath C:\data\db
```

### Issue: Snapshot `ready:false` forever
**Causes**:
1. Job crashed silently - check server logs for errors
2. Generator returned malformed data - check `[job]` logs
3. DB save failed - run manual job test

---

## 📤 WHAT TO PASTE BACK

After running Steps 1-5, paste **in ONE message**:

1. **Output from `node scripts/testApiFlow.js`**
2. **Output from `node scripts/checkSnapshots.js`**
3. **Last 80 lines from dev server terminal** (copy from where you started the server)
4. **Answer these questions:**
   - Did create API work? (yes/no)
   - Did seed API work? (yes/no)
   - Did snapshot become ready? (yes/no)
   - Did manual job script save a snapshot? (yes/no if you ran it)

---

## 🎯 QUICK WIN TEST

If you just want to verify the pipeline works, run this ONE command:
```cmd
node scripts/testApiFlow.js
```

If it ends with "✅ Snapshot ready!" you're good.
If not, follow the full checklist above and paste outputs.

---

Generated: 2025-12-06
Master's Checklist v1.0
