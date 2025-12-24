# Conflict Resolution System

## Overview
Complete conflict resolution implementation for the AI Architecture Builder with audit logging, service layer architecture, modal UI, and comprehensive tests.

## Architecture

### Backend Components

#### 1. Audit Model (`src/lib/backend/models/Audit.ts`)
- Tracks all conflict resolutions with timestamp
- Fields: projectId, conflictId, action, actor, details, createdAt
- Indexed by projectId for fast queries

#### 2. Conflict Resolver Service (`src/lib/backend/services/conflictResolver.ts`)
- Pure service function: `resolveConflictService()`
- Handles 4 resolution actions:
  - **keep_canonical**: Preserves existing snapshot (no changes)
  - **apply_module**: Replaces canonical with module definition
  - **merge_meta**: Combines metadata from both sources
  - **rename_new**: Renames conflicting node ID in module
- Creates immutable snapshots (never mutates existing snapshots)
- Automatically increments version numbers
- Records audit trail for every resolution

#### 3. API Route (`src/app/api/generative/projects/[projectId]/conflicts/resolve/route.ts`)
- POST endpoint for conflict resolution
- Accepts: `{ conflictId, action, params }`
- Returns: `{ ok, snapshot, audit }`
- Extracts actor from `x-user-id` header

### Frontend Components

#### 1. API Helper (`src/lib/frontend/api.ts`)
- `resolveConflict()` function for calling backend
- Handles token authentication
- Returns parsed JSON response

#### 2. ConflictResolveModal (`src/components/generative-ai-v2/ConflictResolveModal.tsx`)
- Modal UI for choosing resolution action
- Radio buttons for 4 action types
- Input field for rename_new action
- Preview section showing what will change
- Handles loading states and error messages

#### 3. AdminConflictQueue (`src/components/generative-ai-v2/AdminConflictQueue.tsx`)
- Updated to integrate ConflictResolveModal
- Shows conflict list with "Resolve" buttons
- Displays conflict metadata (type, message, moduleId)
- Refreshes conflicts and snapshot after resolution

### Testing

#### Test Suite (`tests/conflictResolver.test.ts`)
- Uses Jest + mongodb-memory-server for isolated testing
- 4 test cases covering all resolution actions:
  1. **apply_module**: Verifies node type changes and version increments
  2. **rename_new**: Confirms module document updates
  3. **merge_meta**: Validates metadata merging
  4. **keep_canonical**: Ensures no unwanted changes

#### Running Tests
```bash
npm install --save-dev jest ts-jest @types/jest mongodb-memory-server
npm test
npm run test:watch  # Watch mode
```

## Conflict ID Format

ConflictIds follow a structured format for parsing:
- Node type conflict: `${moduleId}::node::${nodeId}`
- Node meta conflict: `${moduleId}::node::${nodeId}::meta`
- Edge conflict: `${moduleId}::edge::${fromId}::${toId}`

## Resolution Actions

### keep_canonical
- Preserves canonical snapshot unchanged
- Creates audit record only
- Use case: Module change is incorrect

### apply_module
- Replaces canonical node/edge with module version
- Creates new snapshot (version + 1)
- Use case: Module change is better than canonical

### merge_meta
- Combines metadata from both sources
- Canonical meta + module meta (module wins on conflicts)
- Creates new snapshot
- Use case: Both have valuable metadata

### rename_new
- Renames node ID in module document (mutates module)
- Does NOT create new snapshot
- Requires `params: { renameTo: "new_id" }`
- Use case: Avoid ID collision with canonical

## Immutable Snapshots

Key principles:
- Never mutate existing snapshots
- Always create new snapshot with version + 1
- Deactivate previous active snapshot
- Track author field for accountability

## Security Considerations

### Current State
- Actor extracted from `x-user-id` header
- No authentication checks in route

### Production Requirements
1. Add auth middleware to verify admin role
2. Validate user has permission for project
3. Rate limit resolution endpoint
4. Add CSRF protection

## Manual Testing Checklist

1. **Setup**
   - Create canonical snapshot with node (e.g., type: "database")
   - Create module with conflicting node (e.g., type: "cache")
   - GET `/api/generative/projects/{id}/conflicts` should list conflict

2. **Test apply_module**
   - Open AdminConflictQueue in builder UI
   - Click "Resolve" on conflict
   - Select "Apply module change"
   - Confirm resolution
   - Verify snapshot.version incremented
   - Verify node type changed to "cache"

3. **Test merge_meta**
   - Create conflict with different metadata
   - Resolve with "Merge metadata"
   - Verify both meta fields present in new snapshot

4. **Test rename_new**
   - Resolve with "Rename new node"
   - Enter new ID (e.g., "cache_v2")
   - Verify module document updated (not snapshot)

5. **Test keep_canonical**
   - Resolve with "Keep canonical"
   - Verify snapshot version unchanged
   - Verify audit record created

6. **Verify Audit Trail**
   - Check MongoDB `audits` collection
   - Confirm entries have: projectId, conflictId, action, actor, timestamp

## Future Enhancements

### Immediate (P1)
- Add auth middleware to route
- Implement role-based access control
- Add conflict resolution history view

### Medium (P2)
- Batch resolution for multiple conflicts
- Conflict resolution templates (save common patterns)
- Undo resolution action (revert to previous snapshot)
- Rich preview with diff view

### Long-term (P3)
- AI-suggested resolutions based on patterns
- Automatic resolution for simple conflicts
- Conflict resolution analytics dashboard
- Export audit logs to CSV/JSON

## Files Modified

### Created Files
- `src/lib/backend/models/Audit.ts`
- `src/lib/backend/services/conflictResolver.ts`
- `src/app/api/generative/projects/[projectId]/conflicts/resolve/route.ts`
- `src/components/generative-ai-v2/ConflictResolveModal.tsx`
- `tests/conflictResolver.test.ts`
- `jest.config.js`

### Modified Files
- `src/lib/frontend/api.ts` - Added `resolveConflict()` helper
- `src/components/generative-ai-v2/AdminConflictQueue.tsx` - Integrated modal
- `src/app/generative-ai-v2/[id]/builder/page.tsx` - Added projectId prop and onResolved handler
- `package.json` - Added test scripts

## Dependencies

```json
{
  "dependencies": {
    "mongoose": "^8.20.1",
    "ajv": "^8.17.1",
    "fast-deep-equal": "^3.1.3"
  },
  "devDependencies": {
    "jest": "latest",
    "ts-jest": "latest",
    "@types/jest": "latest",
    "mongodb-memory-server": "latest"
  }
}
```

## API Examples

### Resolve Conflict
```typescript
POST /api/generative/projects/{projectId}/conflicts/resolve
Content-Type: application/json
Authorization: Bearer {token}

{
  "conflictId": "673abc123::node::db1",
  "action": "apply_module",
  "params": {}
}

// Response
{
  "ok": true,
  "snapshot": { version: 2, nodes: [...], ... },
  "audit": { _id: "...", action: "apply_module", ... }
}
```

### Rename Node
```typescript
POST /api/generative/projects/{projectId}/conflicts/resolve
{
  "conflictId": "673abc123::node::temp1",
  "action": "rename_new",
  "params": { "renameTo": "service_v2" }
}
```

## Error Handling

### Client Errors (400)
- Missing conflictId or action
- Invalid conflictId format
- Module/node not found
- Missing renameTo param for rename_new

### Server Errors (500)
- Database connection issues
- Snapshot creation failures
- Audit record failures

All errors return: `{ ok: false, error: "message" }`

## Best Practices

1. **Always create audit records** - Even for no-op actions
2. **Never mutate snapshots** - Create new version instead
3. **Validate conflict before resolution** - Conflict may be stale
4. **Refresh conflicts after resolution** - Other conflicts may now be invalid
5. **Use transactions** - For atomic snapshot + audit creation (future)

## Monitoring

Key metrics to track:
- Resolution count by action type
- Average resolution time
- Conflicts resolved per user
- Snapshot version growth rate
- Failed resolution attempts

## Limitations

### Current
- No bulk resolution
- No resolution preview (basic only)
- No undo capability
- Manual action selection required

### By Design
- Non-destructive (keeps history)
- Admin-driven (no auto-resolution)
- Conflict-specific (not rule-based)

## Support

For issues or questions:
1. Check test suite for expected behavior
2. Review audit logs for resolution history
3. Verify snapshot versions incremented correctly
4. Check MongoDB for orphaned snapshots
