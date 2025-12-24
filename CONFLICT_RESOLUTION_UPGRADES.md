# Conflict Resolution - Production Upgrades

## New Features Added

### 1. Visual Diff Preview ✅
- **ConflictResolveModal** now shows side-by-side JSON comparison
- Left panel: "Before (canonical)" - current snapshot state
- Right panel: "After (module/merged)" - proposed changes
- Preview updates live when switching resolution actions
- No new backend routes needed - uses existing fetchLatestSnapshot + fetchModuleById

### 2. Audit List UI ✅
- **AuditList** component displays resolution history
- Shows: actor, action, timestamp, conflict details
- Sorted by most recent first
- Backend route: `GET /api/generative/projects/{projectId}/audits`
- Admin-protected (requires teacher/admin role)

### 3. Production Hardening ✅

#### Role-Based Authentication
- **requireAdminOrThrow** middleware
- Enforced on `/conflicts/resolve` and `/audits` endpoints
- Reads `x-user-id` and `x-user-role` headers
- Rejects non-admin/non-teacher requests with 403

#### Email Notifications
- Sends email when conflicts resolved
- Configurable recipient list via env
- Uses Nodemailer with SMTP
- Gracefully skips if SMTP not configured

## Installation Steps

### 1. Install Dependencies

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### 2. Environment Variables

Add to `.env.local`:

```env
# SMTP Configuration (optional - for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ALERT_FROM="BuildWise Alerts <noreply@yourdomain.com>"

# Email Recipients (comma-separated)
RESOLVE_NOTIFY=teacher@college.edu,admin@college.edu
```

**Note:** If SMTP not configured, system works normally but skips email sending.

### 3. Frontend Headers (Development)

For testing admin-protected routes in development, set headers:

```typescript
// In your fetch calls or API helpers
headers: {
  "x-user-id": "teacher123",
  "x-user-role": "teacher",
  "Authorization": `Bearer ${token}`
}
```

**Production:** Replace `getAuthUserFromHeader` in `src/lib/backend/auth.ts` with your JWT/session auth system.

## Files Created

```
src/lib/backend/auth.ts                                          # Auth helpers
src/app/api/generative/projects/[projectId]/audits/route.ts     # Audit list endpoint
src/app/api/generative/projects/[projectId]/modules/[moduleId]/route.ts  # Module fetch
src/components/generative-ai-v2/AuditList.tsx                    # Audit UI component
```

## Files Updated

```
src/app/api/generative/projects/[projectId]/conflicts/resolve/route.ts  # Auth + email
src/lib/frontend/api.ts                                                  # New helpers
src/components/generative-ai-v2/ConflictResolveModal.tsx               # Visual diff
```

## Usage Examples

### Visual Diff Preview
```typescript
// Modal automatically fetches and displays:
// - Canonical node/edge (current state)
// - Module node/edge (proposed change)
// - Merged result (when merge_meta selected)
```

### Audit List
```typescript
import AuditList from "@/components/generative-ai-v2/AuditList";

<AuditList projectId={projectId} />
```

### Email Notification
When admin resolves conflict:
```
Subject: BuildWise: Conflict resolved in project abc123
Body:
User teacher1 resolved conflict 673abc::node::db1 with action apply_module in project abc123.

Audit: {
  "_id": "...",
  "action": "apply_module",
  "actor": "teacher1",
  "details": { "modified": true }
}
```

## Security Considerations

### Current Auth Implementation
- Header-based role check (`x-user-role`)
- Simple but effective for development
- **NOT production-ready as-is**

### Production Requirements

1. **Replace auth adapter:**
```typescript
// In src/lib/backend/auth.ts
export function getAuthUserFromHeader(req: Request) {
  // Replace with:
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const decoded = verifyJWT(token); // Your JWT verify
  return { userId: decoded.userId, role: decoded.role };
}
```

2. **Add rate limiting:**
```typescript
import rateLimit from "express-rate-limit";
// Apply to resolve endpoint
```

3. **Add CSRF protection** for mutations

4. **Audit log retention policy** (GDPR compliance)

## Testing Checklist

### Visual Diff Preview
- [ ] Open conflict resolution modal
- [ ] Verify "Before" card shows canonical node
- [ ] Verify "After" card shows module node
- [ ] Toggle between actions (apply/merge/keep/rename)
- [ ] Confirm preview updates correctly
- [ ] Test with node conflicts
- [ ] Test with edge conflicts

### Audit List
- [ ] Navigate to audit list UI
- [ ] Verify audit records display
- [ ] Check timestamp formatting
- [ ] Verify details JSON readable
- [ ] Test with empty audit list
- [ ] Test with 10+ audit records (scrolling)

### Email Notifications
- [ ] Configure SMTP env vars
- [ ] Resolve a conflict
- [ ] Check recipient inbox for email
- [ ] Verify email contains: projectId, conflictId, action, actor
- [ ] Test with SMTP not configured (should skip gracefully)

### Auth Protection
- [ ] Call `/audits` without auth → 403
- [ ] Call `/conflicts/resolve` without auth → 403
- [ ] Call with `x-user-role: student` → 403
- [ ] Call with `x-user-role: teacher` → 200
- [ ] Call with `x-user-role: admin` → 200

## Known Limitations

1. **Auth system:** Header-based for dev only - replace with JWT
2. **Email delivery:** Synchronous - consider queue for production
3. **Diff preview:** JSON-only - no visual node cards yet
4. **Audit pagination:** Loads all records - add pagination for large datasets
5. **No undo:** Resolutions are permanent (by design)

## Future Enhancements

### Immediate (P1)
- [ ] JWT-based authentication
- [ ] Audit log pagination
- [ ] Email queue with retry logic
- [ ] Visual node cards in diff preview

### Medium (P2)
- [ ] Batch conflict resolution
- [ ] Audit export (CSV/JSON)
- [ ] Resolution analytics dashboard
- [ ] Webhook notifications (Slack/Discord)

### Long-term (P3)
- [ ] AI-suggested resolutions
- [ ] Conflict resolution templates
- [ ] Time-travel debugging (restore old snapshots)
- [ ] Real-time collaboration (multiple admins)

## Troubleshooting

### Email not sending
1. Check SMTP env vars are set
2. Verify SMTP credentials valid
3. Check firewall allows outbound port 587/465
4. Look for "[notify] SMTP not configured" warning in logs

### Auth errors
1. Verify `x-user-id` and `x-user-role` headers present
2. Check role is "admin" or "teacher"
3. Replace auth helper with your JWT system
4. Test with Postman/curl to isolate frontend issues

### Diff preview empty
1. Verify conflict.moduleId is valid
2. Check module fetch endpoint exists
3. Confirm snapshot has nodes/edges arrays
4. Look for fetch errors in browser console

## Support

For implementation questions:
1. Review test suite in `tests/conflictResolver.test.ts`
2. Check audit logs in MongoDB `audits` collection
3. Verify snapshot versions incrementing correctly
4. Test with isolated conflict scenarios

## Migration Notes

If upgrading from previous version:
1. Run `npm install nodemailer`
2. Add env vars (optional for email)
3. Replace ConflictResolveModal component
4. Add AuditList component to admin dashboard
5. Update API helper imports
6. Test with existing conflicts
