# BuildWise RBAC API Reference

Quick reference for all new and updated API endpoints.

## Authentication

All endpoints require JWT Bearer token in Authorization header:
```
Authorization: Bearer <token>
```

## Bulk Operations

### POST /api/generative/projects/:projectId/modules/bulk-approve

Bulk approve or reject modules.

**Authorization**: Teacher or Admin only

**Request Body**:
```json
{
  "moduleIds": ["moduleId1", "moduleId2"],
  "action": "approve",  // or "reject"
  "note": "Looks good!"  // optional
}
```

**Response**:
```json
{
  "ok": true,
  "updated": [
    {
      "_id": "moduleId1",
      "status": "approved",
      "approvedBy": "userId",
      "approvedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Errors**:
- 400: Invalid moduleIds or action
- 401: Not authenticated
- 403: Not teacher/admin
- 500: Internal error

## Proposed Edits

### PATCH /api/generative/projects/:projectId/modules/:moduleId/propose

Propose an edit to a module.

**Authorization**: Any authenticated user

**Request Body**:
```json
{
  "diff": {
    "nodes": [
      { "id": "node1", "type": "service", "label": "Auth Service" }
    ],
    "edges": [
      { "from": "node1", "to": "node2" }
    ]
  }
}
```

**Response**:
```json
{
  "ok": true,
  "proposed": {
    "id": "editId123",
    "author": "userId",
    "diff": { "nodes": [...], "edges": [...] },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "status": "open"
  }
}
```

**Errors**:
- 400: Missing diff
- 401: Not authenticated
- 404: Module not found
- 500: Internal error

### POST /api/generative/projects/:projectId/modules/:moduleId/propose/:editId

Accept or reject a proposed edit.

**Authorization**: Teacher or Admin only

**Request Body**:
```json
{
  "action": "accept"  // or "reject"
}
```

**Response**:
```json
{
  "ok": true,
  "module": {
    "_id": "moduleId",
    "nodes": [...],  // updated if accepted
    "edges": [...],
    "status": "modified"
  },
  "edit": {
    "id": "editId123",
    "status": "accepted"
  }
}
```

**Accept Behavior**:
- Merges diff.nodes into module.nodes (deduplicated by id)
- Merges diff.edges into module.edges (deduplicated by from->to->label)
- Sets module.status = "modified"
- Sets module.approvedBy and module.approvedAt

**Reject Behavior**:
- Sets edit.status = "rejected"
- No changes to module canonical data

**Errors**:
- 400: Invalid action
- 401: Not authenticated
- 403: Not teacher/admin
- 404: Module or edit not found
- 500: Internal error

## Admin Submission Queue

### GET /api/admin/submissions

List student submissions with pagination.

**Authorization**: Teacher or Admin only

**Query Params**:
- `page`: Page number (default: 1)
- `limit` or `per`: Items per page (default: 20, max: 100)

**Example**: `GET /api/admin/submissions?page=1&limit=20`

**Response**:
```json
{
  "ok": true,
  "submissions": [
    {
      "_id": "submissionId",
      "projectId": "projectId",
      "userId": "userId",
      "status": "draft",
      "notes": "Feedback text",
      "grade": 95,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "per": 20
  }
}
```

**Errors**:
- 401: Not authenticated
- 403: Not teacher/admin
- 500: Internal error

### POST /api/admin/submissions/:id/review

Review a student submission.

**Authorization**: Teacher or Admin only

**Request Body**:
```json
{
  "action": "approve",  // or "reject" or "request_changes"
  "notes": "Great work! Minor improvements needed.",
  "grade": 95  // optional, numeric
}
```

**Response**:
```json
{
  "ok": true,
  "submission": {
    "_id": "submissionId",
    "status": "approved",
    "notes": "Great work!",
    "grade": 95
  }
}
```

**Status Mapping**:
- `approve` → status: "approved"
- `reject` → status: "rejected"
- `request_changes` → status: "reviewed"

**Errors**:
- 401: Not authenticated
- 403: Not teacher/admin
- 404: Submission not found
- 500: Internal error

## Server-Side Routes

### GET /generative/projects/:projectId/builder

Server-rendered builder page with role detection.

**Authorization**: Required (redirects to login if not authenticated)

**Server-Side Logic**:
1. Extracts JWT from Authorization header or cookie
2. Verifies user authentication
3. Loads project from database
4. Computes `studentView` flag:
   - `true` if user.role === "student" AND owns project
   - `false` if teacher/admin (full permissions)
5. Passes props to client component

**Client Props**:
```typescript
{
  projectId: string,
  user: {
    userId: string,
    role: string,
    email: string | null
  },
  studentView: boolean
}
```

**Access Control**:
- Unauthenticated: Shows login prompt
- Student (non-owner): Forbidden (could be allowed read-only in future)
- Student (owner): Restricted view (studentView: true)
- Teacher/Admin: Full access (studentView: false)

## Frontend API Helpers

All helpers in `src/lib/frontend/api.ts`:

### bulkApproveModules()
```typescript
await bulkApproveModules(
  projectId: string,
  moduleIds: string[],
  action: "approve" | "reject",
  token?: string
)
```

Returns: `{ ok: boolean, updated: Module[] }`

## Authentication Helpers

All helpers in `src/lib/backend/auth.ts`:

### getAuthUserFromRequest()
```typescript
const user = getAuthUserFromRequest(req);
// Returns: AuthUser | null
```

### requireAuthOrThrow()
```typescript
const user = requireAuthOrThrow(req);
// Returns: AuthUser or throws 401 error
```

### requireRoleOrThrow()
```typescript
const user = requireRoleOrThrow(req, ["teacher", "admin"]);
// Returns: AuthUser or throws 403 error if role not allowed
```

## Audit Trail

All critical operations create audit records:

**Actions Logged**:
- `bulk_approve_modules` - Bulk approval/rejection
- `bulk_reject_modules`
- `propose_module_edit` - Student proposes edit
- `accept_proposed_edit` - Teacher accepts edit
- `reject_proposed_edit` - Teacher rejects edit
- `submission_approve` - Admin approves submission
- `submission_reject` - Admin rejects submission
- `submission_request_changes` - Admin requests changes
- `llm_validation_failed` - LLM output failed schema validation

**Audit Model**:
```typescript
{
  projectId: string,
  action: string,
  actor: string | null,  // userId or null for system actions
  details: any,  // action-specific metadata
  timestamp: Date
}
```

## Privacy Controls

### storeRawLLMOutput Flag

Set in StudentProject creation payload:

```json
{
  "title": "My Project",
  "appType": "Food delivery",
  "skillLevel": "beginner",
  "selectedFeatures": ["auth", "crud"],
  "storeRawLLMOutput": false  // privacy-first default
}
```

**When true**: Raw LLM responses saved in `project.rawLLMOutputs[]`
**When false**: Only structured data saved (nodes, edges, rationale)

### LLM Wrapper Usage

```typescript
import { callLLMAndValidate, architectureSchema } from "@/lib/backend/services/llmWrapper";

const output = await callLLMAndValidate({
  projectId: "projectId",
  prompt: "Generate architecture for...",
  validateSchema: architectureSchema,
  storeRaw: project.storeRawLLMOutput  // respect user preference
});
```

## Error Handling

All endpoints return consistent error format:

```json
{
  "ok": false,
  "error": "Error message"
}
```

**HTTP Status Codes**:
- 200: Success
- 400: Bad request (validation error)
- 401: Unauthorized (not authenticated)
- 403: Forbidden (insufficient permissions)
- 404: Not found
- 500: Internal server error

## Testing Tokens

Generate test tokens with `scripts/make-token.js`:

```javascript
// Student token
const studentToken = signToken({
  userId: "student123",
  role: "student",
  email: "student@example.com"
});

// Teacher token
const teacherToken = signToken({
  userId: "teacher456",
  role: "teacher",
  email: "teacher@example.com"
});

// Admin token
const adminToken = signToken({
  userId: "admin789",
  role: "admin",
  email: "admin@example.com"
});
```

Use in API calls:
```typescript
fetch("/api/...", {
  headers: {
    "Authorization": `Bearer ${token}`
  }
})
```

## Rate Limiting (Future)

Consider adding rate limiting for:
- Bulk operations (max 50 modules per request)
- Proposed edits (max 10 per hour per user)
- LLM calls (based on user tier)

## Monitoring

Key metrics to track:
- Bulk approval usage by teachers
- Proposed edit acceptance rate
- LLM validation failure rate
- Privacy opt-in percentage
- Average review response time

---

**Last Updated**: Implementation completed
**Version**: 1.0
**Status**: Ready for production testing
