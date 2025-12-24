# BuildWise Server-Side RBAC & Student Mode Enhancement - Implementation Summary

## Overview
This implementation adds comprehensive server-side role-based access control (RBAC), bulk operations for teachers, proposed edit workflows, and privacy controls to the BuildWise platform.

## Changes Implemented

### 1. Core Infrastructure

#### A. Authentication & Authorization (`src/lib/backend/auth.ts`)
- ✅ Already had complete RBAC helpers:
  - `getAuthUserFromRequest()` - Parse JWT from Authorization header
  - `requireAuthOrThrow()` - Guard: throw if no authenticated user
  - `requireRoleOrThrow(req, allowedRoles)` - Guard: require specific role(s)
  - JWT verification with issuer validation

#### B. Module Model Updates (`src/lib/backend/models/Module.ts`)
- ✅ Added approval workflow fields:
  - `approvedBy: string` - User ID who approved
  - `approvedAt: Date` - Approval timestamp
- ✅ Added metadata object:
  - `meta: { createdBy, createdAt, [k: string]: any }`
- ✅ Added proposed edits array:
  - `proposedEdits: ProposedEdit[]` with schema:
    ```typescript
    {
      id: string,           // nanoid
      author: string,       // userId
      diff: { nodes?, edges? },
      createdAt: Date,
      status: "open" | "accepted" | "rejected"
    }
    ```
- ✅ Added position field to nodes for React Flow compatibility

#### C. Migration Script (`scripts/mig-modules-add-fields.js`)
- ✅ Adds default values to existing Module documents:
  - Sets `status: "proposed"` if missing
  - Initializes `meta` object with `createdBy` and `createdAt`
  - Initializes empty `proposedEdits` array
- Usage: `node scripts/mig-modules-add-fields.js`
- **⚠️ IMPORTANT: Backup database before running!**

### 2. Server-Side Builder Access Control

#### A. Server Component Wrapper (`src/app/generative/projects/[projectId]/builder/page.tsx`)
- ✅ Server component that:
  - Verifies JWT server-side using auth helpers
  - Loads project from database to check ownership
  - Computes `studentView` flag:
    - `true` if user is student AND owns the project
    - `false` for teachers/admins (full permissions)
  - Passes user info and flags to client component
  - Returns 401 error if not authenticated
  - Returns 404 error if project not found

#### B. Client Adapter (`src/components/generative-ai-v2/ModuleBuilderClient.tsx`)
- ✅ Client wrapper that receives server-injected props:
  - `projectId: string`
  - `user: { userId, role, email }`
  - `studentView: boolean`
- ✅ Passes props to existing BuilderPageClient component
- Eliminates need for `?student=true` URL parameter hack

### 3. Bulk Operations for Teachers

#### A. Bulk Approve API (`src/app/api/generative/projects/[projectId]/modules/bulk-approve/route.ts`)
- ✅ POST endpoint: bulk approve or reject modules
- ✅ RBAC: Only teacher/admin allowed
- ✅ Request body:
  ```json
  {
    "moduleIds": ["id1", "id2"],
    "action": "approve" | "reject",
    "note": "optional admin note"
  }
  ```
- ✅ Updates all specified modules in parallel
- ✅ Creates audit record with full details
- ✅ Returns updated modules array

#### B. Teacher Override Panel (`src/components/generative-ai-v2/TeacherOverridePanel.tsx`)
- ✅ UI component for bulk operations:
  - Checkbox selection for multiple modules
  - Shows module name and current status
  - Bulk Approve button (green)
  - Bulk Reject button (red outline)
  - Shows selection count in button labels
  - Loading state during operations
- ✅ Props: `{ projectId, modules, onUpdated }`
- ✅ Integrates with bulk-approve API endpoint

#### C. Frontend API Helper (`src/lib/frontend/api.ts`)
- ✅ Added `bulkApproveModules()` function:
  ```typescript
  bulkApproveModules(projectId, moduleIds, action, token?)
  ```
- Returns: `{ ok, updated: Module[] }`

### 4. Visual Status Badges

#### Node Renderer (`src/components/generative-ai-v2/NodeWithBadge.tsx`)
- ✅ Custom React Flow node component
- ✅ Displays:
  - Node label (main text)
  - Author name ("by {author}")
  - Status badge with color coding:
    - 🟢 Approved: green
    - 🟡 Proposed: yellow
    - 🔵 Modified: indigo
    - ⚪ Other: gray
- ✅ Usage in React Flow:
  ```typescript
  const nodeTypes = { badgeNode: NodeWithBadge };
  const flowNodes = modules.nodes.map(n => ({
    id: n.id,
    type: "badgeNode",
    data: { 
      label: n.label, 
      status: n.status, 
      author: n.meta?.createdBy 
    }
  }));
  ```

### 5. Proposed Edit Workflow

#### A. Propose Edit API (`src/app/api/generative/projects/[projectId]/modules/[moduleId]/propose/route.ts`)
- ✅ PATCH endpoint: propose an edit to a module
- ✅ RBAC: Any authenticated user can propose
- ✅ Request body:
  ```json
  {
    "diff": {
      "nodes": [...],
      "edges": [...]
    }
  }
  ```
- ✅ Creates proposed edit with unique ID (nanoid)
- ✅ Stores edit in module's `proposedEdits` array
- ✅ Creates audit record
- ✅ Returns: `{ ok, proposed: ProposedEdit }`

#### B. Accept/Reject Edit API (`src/app/api/generative/projects/[projectId]/modules/[moduleId]/propose/[editId]/route.ts`)
- ✅ POST endpoint: accept or reject a proposed edit
- ✅ RBAC: Only teacher/admin allowed
- ✅ Request body: `{ action: "accept" | "reject" }`
- ✅ Accept action:
  - Merges diff into canonical nodes/edges
  - Deduplicates by node ID and edge key
  - Updates module status to "modified"
  - Sets approvedBy and approvedAt
- ✅ Reject action:
  - Marks edit status as "rejected"
  - No changes to canonical data
- ✅ Creates audit record
- ✅ Returns: `{ ok, module, edit }`

#### C. Propose UI Components

**DiffModal** (`src/components/generative-ai-v2/DiffModal.tsx`)
- ✅ Modal showing before/after JSON comparison
- ✅ Side-by-side view with scrollable code blocks
- ✅ Props: `{ open, onClose, before, after }`

**ModuleCanvasPropose** (`src/components/generative-ai-v2/ModuleCanvasPropose.tsx`)
- ✅ Component for students to propose edits:
  - "Preview Diff" button opens DiffModal
  - "Propose Edits" button submits to API
  - Shows error messages
  - Loading state during submission
  - Success callback after submission
- ✅ Props:
  ```typescript
  {
    projectId: string,
    moduleId: string,
    currentNodes: Node[],
    currentEdges: Edge[],
    draftNodes: Node[],
    draftEdges: Edge[],
    onProposeSuccess?: () => void
  }
  ```

### 6. Admin Submission Queue

#### A. List Submissions API (Updated: `src/app/api/admin/submissions/route.ts`)
- ✅ GET endpoint: list student submissions
- ✅ RBAC: Only teacher/admin allowed
- ✅ Query params: `?page=1&limit=20`
- ✅ Returns: `{ ok, submissions: [], meta: { total, page, per } }`

#### B. Review Submission API (Updated: `src/app/api/admin/submissions/[id]/review/route.ts`)
- ✅ POST endpoint: review a student submission
- ✅ RBAC: Only teacher/admin allowed
- ✅ Request body:
  ```json
  {
    "action": "approve" | "reject" | "request_changes",
    "notes": "optional feedback",
    "grade": 95
  }
  ```
- ✅ Updates submission status
- ✅ Stores notes and grade
- ✅ Creates audit record
- ✅ Returns: `{ ok, submission }`

#### C. StudentSubmissionQueue Component (`src/components/admin/StudentSubmissionQueue.tsx`)
- ✅ Admin UI for reviewing submissions:
  - Lists all submissions with pagination
  - Shows project ID, user ID, timestamp
  - Shows current grade if present
  - Action buttons:
    - 🟢 Approve (with optional grade input)
    - 🔵 Request Changes (with note prompt)
    - 🔴 Reject
  - Shows submission notes
  - Auto-refreshes after each action
- ✅ Fetches from `/api/admin/submissions`
- ✅ Calls `/api/admin/submissions/:id/review`

### 7. Privacy Controls

#### A. StudentProject Model (`src/lib/backend/models/StudentProject.ts`)
- ✅ Added privacy fields:
  - `storeRawLLMOutput: boolean` (default: false)
  - `rawLLMOutputs: any[]` (only populated if opted in)
- ✅ Backward compatible with existing projects

#### B. LLM Wrapper (`src/lib/backend/services/llmWrapper.ts`)
- ✅ `callLLMAndValidate()` function:
  - Accepts: `{ projectId, prompt, validateSchema, storeRaw }`
  - Validates LLM output with AJV against schema
  - Creates audit record if validation fails
  - Respects `storeRaw` flag:
    - If `true` AND project has `storeRawLLMOutput: true`, saves raw output
    - Otherwise only structured data is saved
  - Returns validated output
- ✅ Example schema provided: `architectureSchema`
- ✅ Mock implementation included (replace with real provider)

#### C. Wizard Privacy Opt-In (`src/components/student/StudentNewWizard.tsx`)
- ✅ Added checkbox in Step 3 (Review):
  - Label: "Allow saving raw LLM outputs (for debugging & learning). Default: off."
  - Help text: "When disabled, only structured architecture data is saved. Enable to help improve the AI."
- ✅ Includes `storeRawLLMOutput` in project creation payload
- ✅ Default value: `false` (privacy-first approach)

## Integration Points

### Existing ModuleBuilderPage
To integrate the new server-side props, update your existing `BuilderPageClient`:

```typescript
// src/app/generative-ai-v2/[id]/builder/page.tsx
function BuilderPageClient(props: any) {
  // Read server-injected props when available
  const injected = (props && props.serverInjected) || null;
  const projectId = injected?.projectId || useParams()?.id;
  const isStudentView = injected?.studentView ?? false;
  const currentUser = injected?.user || null;
  
  // Use isStudentView to disable approve/reject buttons
  // Use currentUser for displaying user info
  // ... rest of component logic
}
```

### Teacher Override Panel Placement
Add to right sidebar in ModuleBuilder when user is teacher/admin:

```typescript
{currentUser && (currentUser.role === "teacher" || currentUser.role === "admin") && (
  <TeacherOverridePanel
    projectId={projectId}
    modules={modules}
    onUpdated={(updated) => {
      // Refresh modules list
      loadAll();
    }}
  />
)}
```

### Node Badges in ModuleCanvas
Register custom node type in React Flow:

```typescript
import NodeWithBadge from "@/components/generative-ai-v2/NodeWithBadge";

const nodeTypes = { badgeNode: NodeWithBadge };

const flowNodes = module.nodes.map(n => ({
  id: n.id,
  type: "badgeNode",
  data: { 
    label: n.label || n.id,
    status: n.status || module.status || "proposed",
    author: n.meta?.createdBy || module.meta?.createdBy || null
  },
  position: n.position || { x: 0, y: 0 }
}));

<ReactFlow nodes={flowNodes} edges={flowEdges} nodeTypes={nodeTypes} />
```

### Propose Edit Workflow
Show propose button for students in ModuleCanvas:

```typescript
{isStudentView && (
  <ModuleCanvasPropose
    projectId={projectId}
    moduleId={currentModule._id}
    currentNodes={currentModule.nodes}
    currentEdges={currentModule.edges}
    draftNodes={draftNodes}
    draftEdges={draftEdges}
    onProposeSuccess={() => {
      alert("Edit proposed successfully!");
      loadAll();
    }}
  />
)}
```

## Testing Checklist

### 1. Migration Script
- [ ] Backup database
- [ ] Run: `node scripts/mig-modules-add-fields.js`
- [ ] Verify: All modules have `status`, `meta`, `proposedEdits` fields
- [ ] Check audit: Migration creates no side effects

### 2. Server-Side Builder Access
- [ ] Create student JWT token (use `scripts/make-token.js`)
- [ ] Visit `/generative/projects/{projectId}/builder` as student
- [ ] Verify: Student sees restricted view (no approve/reject buttons)
- [ ] Visit same URL as teacher/admin
- [ ] Verify: Teacher sees full controls

### 3. Bulk Operations
- [ ] Login as teacher/admin
- [ ] Open TeacherOverridePanel in builder
- [ ] Select multiple modules
- [ ] Click "Bulk Approve"
- [ ] Verify: All selected modules change to "approved" status
- [ ] Check audit: Look for `bulk_approve_modules` entry in database

### 4. Proposed Edit Workflow
- [ ] Login as student (project owner)
- [ ] Edit a module in builder
- [ ] Click "Preview Diff" - verify diff modal shows
- [ ] Click "Propose Edits"
- [ ] Verify: proposedEdits array in module document
- [ ] Login as teacher
- [ ] Call accept/reject endpoint for the proposed edit
- [ ] Verify: Module nodes/edges updated (if accepted) or edit status changed (if rejected)

### 5. Admin Submission Queue
- [ ] Create test student submissions
- [ ] Login as teacher/admin
- [ ] Visit `/admin/submissions` (or your admin dashboard)
- [ ] Render `<StudentSubmissionQueue />` component
- [ ] Approve a submission with grade
- [ ] Verify: Submission status changes, grade saved
- [ ] Request changes with note
- [ ] Verify: Student sees feedback

### 6. Privacy Controls
- [ ] Create new project with wizard
- [ ] Check privacy checkbox in Step 3
- [ ] Verify: Project created with `storeRawLLMOutput: true`
- [ ] Trigger LLM call (e.g., generate roles)
- [ ] Verify: `rawLLMOutputs` array has entries in database
- [ ] Create project WITHOUT checkbox
- [ ] Verify: No raw outputs saved

### 7. RBAC Enforcement
- [ ] Try to call bulk-approve as student (no teacher/admin role)
- [ ] Verify: 403 Forbidden response
- [ ] Try to accept proposed edit as student
- [ ] Verify: 403 Forbidden response
- [ ] Try to access admin submissions as student
- [ ] Verify: 403 Forbidden response

## Files Created

1. ✅ `scripts/mig-modules-add-fields.js` - Migration script
2. ✅ `src/app/generative/projects/[projectId]/builder/page.tsx` - Server wrapper
3. ✅ `src/components/generative-ai-v2/ModuleBuilderClient.tsx` - Client adapter
4. ✅ `src/app/api/generative/projects/[projectId]/modules/bulk-approve/route.ts` - Bulk API
5. ✅ `src/components/generative-ai-v2/TeacherOverridePanel.tsx` - Bulk UI
6. ✅ `src/components/generative-ai-v2/NodeWithBadge.tsx` - Status badges
7. ✅ `src/app/api/generative/projects/[projectId]/modules/[moduleId]/propose/route.ts` - Propose API
8. ✅ `src/app/api/generative/projects/[projectId]/modules/[moduleId]/propose/[editId]/route.ts` - Accept/reject API
9. ✅ `src/components/generative-ai-v2/DiffModal.tsx` - Diff preview
10. ✅ `src/components/generative-ai-v2/ModuleCanvasPropose.tsx` - Propose UI
11. ✅ `src/components/admin/StudentSubmissionQueue.tsx` - Admin queue UI
12. ✅ `src/lib/backend/services/llmWrapper.ts` - LLM wrapper with privacy

## Files Updated

1. ✅ `src/lib/backend/models/Module.ts` - Added approval and proposedEdits fields
2. ✅ `src/lib/backend/models/StudentProject.ts` - Added privacy flags
3. ✅ `src/lib/frontend/api.ts` - Added bulkApproveModules helper
4. ✅ `src/components/student/StudentNewWizard.tsx` - Added privacy checkbox
5. ✅ `src/app/api/admin/submissions/route.ts` - Updated to use RBAC guards
6. ✅ `src/app/api/admin/submissions/[id]/review/route.ts` - Updated to use RBAC guards

## Security Notes

- ✅ All endpoints enforce JWT authentication
- ✅ Role-based access control guards (teacher/admin only for sensitive operations)
- ✅ Server-side permission checks (no client-side trust)
- ✅ Audit trail for all critical operations
- ✅ Privacy-first approach (raw LLM output opt-in, default off)
- ✅ Input validation with AJV for LLM outputs

## Next Steps (Not Implemented)

1. **Update existing ModuleBuilderPage** to accept `serverInjected` props
2. **Add TeacherOverridePanel** to builder sidebar
3. **Register NodeWithBadge** in React Flow nodeTypes
4. **Add ModuleCanvasPropose** for student edit submissions
5. **Integrate StudentSubmissionQueue** into admin dashboard
6. **Replace mock LLM provider** in llmWrapper.ts with real API (OpenAI, Anthropic, etc.)
7. **Test complete end-to-end flow** with real users

## Maintenance

- Migration script is idempotent (safe to run multiple times)
- All new fields have sensible defaults
- Backward compatible with existing data
- No breaking changes to existing APIs
- Privacy controls can be toggled per-project

---

**Status**: All core components implemented and ready for integration testing.
**Compile Errors**: None in new files (existing test file errors unrelated to this work)
**Ready for**: Manual testing and teacher feedback
