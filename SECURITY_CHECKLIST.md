# 🔒 Security Implementation Checklist

## Overview
This checklist guides you through securing all API routes that currently lack authentication.

## Routes Needing Authentication

### Priority 1: CRITICAL (Do First)

#### Student Mode Routes
- [ ] `/api/student-mode/decisions` - State changes
- [ ] `/api/student-mode/define` - Project creation
- [ ] `/api/student-mode/seed` - Database seeding
- [ ] `/api/student-mode/materialize` - Generation
- [ ] `/api/student-mode/execution` - Execution
- [ ] `/api/student-mode/score` - Score manipulation
- [ ] `/api/student-mode/decision-undo` - Undo actions
- [ ] `/api/student-mode/decision-reset` - Reset state
- [ ] `/api/student-mode/decision-toggle` - Toggle decisions
- [ ] `/api/student-mode/reasoning` - Reasoning submission
- [ ] `/api/student-mode/suggestions` - Get suggestions

#### Version Control Routes
- [ ] `/api/student-mode/version/save` - Save versions
- [ ] `/api/student-mode/version/load` - Load versions
- [ ] `/api/student-mode/version/compare` - Compare versions
- [ ] `/api/student-mode/version/list` - List versions

#### Snapshot Routes
- [ ] `/api/snapshots/[projectId]/rollback` - Rollback snapshots

#### Design Routes
- [ ] `/api/design/save` - Save designs

### Priority 2: HIGH (Do Next)

#### Generative AI Routes
- [ ] `/api/generative/projects` - Project CRUD
- [ ] `/api/generative/projects/[projectId]/requirements` - Requirements
- [ ] `/api/generative/projects/[projectId]/modules` - Modules
- [ ] `/api/generative/projects/[projectId]/publish` - Publishing
- [ ] `/api/generative/projects/[projectId]/snapshots/rollback` - Snapshots
- [ ] `/api/generative/ai/validate-answer` - Answer validation

#### Admin Routes
- [ ] `/api/admin/*` - All admin routes (use `withAdmin`)

---

## Implementation Pattern

### Step 1: Import Middleware

```typescript
import { withAuth, withAdmin } from "@/lib/backend/middleware/withAuth";
import { validateXXXPayload } from "@/lib/validation/schemas";
```

### Step 2: Wrap Handler

**Before:**
```typescript
export async function POST(req: NextRequest) {
  const { projectId } = await req.json();
  // ... logic
}
```

**After (Basic Auth):**
```typescript
export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  
  // Validate input
  const validation = validateDecisionPayload(body);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  
  const { projectId } = validation.data!;
  
  // Use user.userId, user.role for access control
  // ... logic
});
```

**After (Admin Only):**
```typescript
export const POST = withAdmin(async (req, user) => {
  // Only admins can access this
  // ... logic
});
```

### Step 3: Add Validation

Create validation function in `src/lib/validation/schemas.ts`:

```typescript
export function validateYourPayload(body: any): ValidationResult {
  if (!body) {
    return { valid: false, error: "Request body required" };
  }

  const { field1, field2 } = body;

  if (!field1 || typeof field1 !== "string") {
    return { valid: false, error: "Valid field1 required" };
  }

  // ... more validation

  return { valid: true, data: { field1, field2 } };
}
```

### Step 4: Add Access Control

```typescript
export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const validation = validateProjectPayload(body);
  
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { projectId } = validation.data!;

  // Check ownership
  const project = await getProject(projectId);
  
  if (project.userId !== user.userId && user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden - not your project" },
      { status: 403 }
    );
  }

  // ... rest of logic
});
```

---

## Testing Each Route

### 1. Test Without Auth (should fail)
```powershell
curl -X POST http://localhost:3000/api/student-mode/decision `
  -H "Content-Type: application/json" `
  -d '{"projectId":"test","decisionId":"dec1"}'

# Expected: {"error":"Unauthorized - valid Bearer token required"}
# Status: 401
```

### 2. Test With Invalid Token (should fail)
```powershell
curl -X POST http://localhost:3000/api/student-mode/decision `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer invalid-token" `
  -d '{"projectId":"test","decisionId":"dec1"}'

# Expected: {"error":"Unauthorized - valid Bearer token required"}
# Status: 401
```

### 3. Test With Valid Token (should succeed)
```powershell
# First, login to get token
$response = curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@test.com","password":"password123"}' | ConvertFrom-Json

$token = $response.token

# Then use token
curl -X POST http://localhost:3000/api/student-mode/decision `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $token" `
  -d '{"projectId":"test","decisionId":"dec1"}'

# Expected: Normal response
# Status: 200
```

### 4. Test Invalid Input (should fail validation)
```powershell
curl -X POST http://localhost:3000/api/student-mode/decision `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $token" `
  -d '{"projectId":"","decisionId":""}'

# Expected: {"error":"Valid projectId required"}
# Status: 400
```

---

## Route-by-Route Guide

### Example 1: `/api/student-mode/decisions`

**Current File**: `src/app/api/student-mode/decisions/route.ts`

```typescript
// BEFORE
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { projectId, key, value } = await req.json();
  // ... logic
}
```

```typescript
// AFTER
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/backend/middleware/withAuth";

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  
  // Validate
  if (!body.projectId || !body.key || body.value === undefined) {
    return NextResponse.json(
      { error: "projectId, key, and value required" },
      { status: 400 }
    );
  }

  const { projectId, key, value } = body;

  // Verify ownership (optional but recommended)
  // const project = await getProject(projectId);
  // if (project.userId !== user.userId) {
  //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // }

  // ... rest of logic
});
```

### Example 2: Admin Route

**Current File**: `src/app/api/admin/users/route.ts`

```typescript
// BEFORE
export async function GET(req: NextRequest) {
  // Anyone can access!
  const users = await User.find();
  return NextResponse.json({ users });
}
```

```typescript
// AFTER
import { withAdmin } from "@/lib/backend/middleware/withAuth";

export const GET = withAdmin(async (req, user) => {
  // Only admins can access
  const users = await User.find().select('-password'); // Don't send passwords!
  return NextResponse.json({ users });
});
```

---

## Validation Schema Examples

Add these to `src/lib/validation/schemas.ts`:

```typescript
export function validateSeedPayload(body: any): ValidationResult {
  if (!body?.action) {
    return { valid: false, error: "action required" };
  }

  if (!["seed", "clear", "reset"].includes(body.action)) {
    return { valid: false, error: "Invalid action" };
  }

  return { valid: true, data: body };
}

export function validateVersionPayload(body: any): ValidationResult {
  if (!body?.projectId) {
    return { valid: false, error: "projectId required" };
  }

  if (body.designId && typeof body.designId !== "string") {
    return { valid: false, error: "Invalid designId" };
  }

  return { valid: true, data: body };
}

export function validateSnapshotPayload(body: any): ValidationResult {
  if (!body?.snapshotId) {
    return { valid: false, error: "snapshotId required" };
  }

  return { valid: true, data: body };
}
```

---

## Progress Tracking

As you complete each route, mark it here:

```
✅ /api/student-mode/decision (DONE)
⬜ /api/student-mode/decisions
⬜ /api/student-mode/define
⬜ /api/student-mode/seed
... etc
```

---

## Common Patterns

### Pattern 1: User Owns Resource

```typescript
export const POST = withAuth(async (req, user) => {
  const { projectId } = await req.json();
  
  const project = await Project.findById(projectId);
  
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check ownership
  if (project.userId.toString() !== user.userId && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ... proceed
});
```

### Pattern 2: Teachers Can View, Only Admins Can Modify

```typescript
// GET - Teachers can view
export const GET = withTeacher(async (req, user) => {
  // Teachers and admins can access
  const data = await fetchData();
  return NextResponse.json({ data });
});

// POST - Only admins can modify
export const POST = withAdmin(async (req, user) => {
  // Only admins can modify
  await updateData();
  return NextResponse.json({ success: true });
});
```

### Pattern 3: Students Can Read Own, Admins Can Read All

```typescript
export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  if (user.role === "admin") {
    // Admin can see anyone's data
    const data = userId 
      ? await fetchUserData(userId) 
      : await fetchAllData();
    return NextResponse.json({ data });
  }

  // Students can only see their own
  const data = await fetchUserData(user.userId);
  return NextResponse.json({ data });
});
```

---

## Testing Checklist

For each route, verify:

- [ ] Returns 401 without token
- [ ] Returns 401 with invalid token
- [ ] Returns 403 if user lacks permission
- [ ] Returns 400 with invalid input
- [ ] Returns 200 with valid request
- [ ] Doesn't expose sensitive data
- [ ] Logs errors appropriately
- [ ] Handles edge cases gracefully

---

## Deployment Notes

**Before deploying with these changes:**

1. Update frontend to send Authorization header:
```typescript
fetch('/api/student-mode/decision', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
  },
  body: JSON.stringify({ projectId, decisionId }),
});
```

2. Test all functionality in development
3. Run integration tests
4. Check for broken dependencies
5. Deploy to staging first
6. Monitor error rates

---

## Questions?

- See `DEPLOYMENT_GUIDE.md` for more info
- Check existing secured routes for examples:
  - `src/app/api/student-mode/decision/route.ts`
  - `src/app/api/auth/login/route.ts`
- Review middleware: `src/lib/backend/middleware/withAuth.ts`

---

**Estimated Time**: 2-4 hours to secure all routes (depending on complexity)

**Priority**: HIGH - Do this before production deployment!
