# BuildWise Backend Development Log

> **Student:** Anas (Final Year BCA)  
> **Goal:** Backend/DevOps/Cloud Internship Preparation  
> **Project:** BuildWise - Architecture Design Tool with Generative AI  
> **Repository:** https://github.com/anas-muhmed/BuildWise

---

## 📅 Session 1 - November 15, 2025
**Topic:** JWT Authentication System (MongoDB → Token Verification)  
**Duration:** Full Session  
**Learning Style:** Guided coding with manual typing and deep understanding

---

## ✅ What We Built Today

### 1. Environment Setup
**File:** `.env.local` (project root)

**Purpose:** Store sensitive configuration securely

**Configuration:**
```env
MONGODB_URI=mongodb+srv://<credentials>@devcluster.bi82l19.mongodb.net/buildwise
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRES_IN=7d
```

**Key Concepts Learned:**
- Never commit `.env.local` to Git (add to `.gitignore`)
- Environment variables accessed via `process.env.VARIABLE_NAME`
- MongoDB Atlas connection string format with authentication

---

### 2. MongoDB Connection Layer
**File:** `src/lib/backend/mongodb.ts` (38 lines)

**Purpose:** Establish database connection with HMR-safe caching

**Key Features:**
- Singleton pattern using `global._mongoose` object
- Prevents connection exhaustion during Hot Module Replacement (HMR)
- Validates `MONGODB_URI` exists before connecting
- Caches connection promise for reuse

**Bug Fixed:**
- Line 34: Added `await` to `global._mongoose!.conn = await global._mongoose!.promise`

**Key Concepts Learned:**
- Singleton pattern prevents multiple DB connections
- Global object survives Next.js HMR reloads
- Connection pooling for performance

---

### 3. Database Models

#### User Model
**File:** `src/lib/backend/models/User.ts` (25 lines)

**Schema Fields:**
- `name`: String (required)
- `email`: String (unique, lowercase, required)
- `password`: String (hashed, required)
- `role`: Enum ["student", "admin"], default: "student"
- `timestamps`: Auto-adds `createdAt` and `updatedAt`

**Key Features:**
- Email uniqueness enforced at database level
- Default role prevents privilege escalation
- Password stored as bcrypt hash (never plain text)

**Pattern Used:**
```typescript
export const User: Model<IUser> = 
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
```
This prevents HMR duplicate model errors.

---

#### Design Model
**File:** `src/lib/backend/models/Design.ts` (38 lines)

**Schema Fields:**
- `userId`: ObjectId (reference to User)
- `title`: String (optional)
- `prompt`: String (optional)
- `nodes`: Schema.Types.Mixed (flexible JSON)
- `edges`: Schema.Types.Mixed (flexible JSON)
- `timestamps`: Auto-adds `createdAt` and `updatedAt`

**Bug Fixed:**
- Changed from `type: Array` to `type: Schema.Types.Mixed` for flexible storage
- Allows storing complex nested objects without strict validation

**Key Concepts Learned:**
- Foreign key relationships via ObjectId references
- Schema.Types.Mixed for flexible JSON storage
- Trade-off: Flexibility vs validation

---

### 4. JWT Authentication Helpers
**File:** `src/lib/backend/auth.ts` (30 lines)

**Functions:**

#### `signToken(payload: object, expiresIn: string = "7d")`
**Purpose:** Create signed JWT token

**How it works:**
1. Takes user data (id, role)
2. Adds timestamps (iat, exp) automatically
3. Signs with JWT_SECRET using HMAC-SHA256
4. Returns token string

**Example:**
```typescript
const token = signToken({ id: user._id, role: user.role });
// Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

#### `verifyToken(token: string)`
**Purpose:** Verify and decode JWT token

**How it works:**
1. Verifies signature using JWT_SECRET
2. Checks expiration timestamp
3. Returns decoded payload OR null if invalid

**Example:**
```typescript
const payload = verifyToken(token);
// Returns: { id: "123", role: "student", iat: 123, exp: 456 }
// OR null if invalid/expired
```

**Key Concepts Learned:**
- JWT structure: `header.payload.signature`
- Base64 encoding (NOT encryption - anyone can decode!)
- Signature prevents tampering (needs JWT_SECRET to create)
- Stateless authentication (no server-side session storage)

---

### 5. Authentication Middleware
**File:** `src/lib/backend/authMiddleware.ts` (40 lines)

**Purpose:** DRY (Don't Repeat Yourself) authentication logic

**Function:** `requireAuth(req: Request): JWTPayload | NextResponse`

**Flow:**
1. Extract `Authorization` header from request
2. Check format: `Bearer <token>`
3. Extract token (remove "Bearer " prefix)
4. Verify token with `verifyToken()`
5. Validate payload has required fields (`id`)
6. Return payload OR 401 error response

**Pattern Used:**
```typescript
const authResult = requireAuth(req);
if (authResult instanceof NextResponse) return authResult;  // Error case
const user = authResult;  // Success case - type narrowing!
```

**Key Concepts Learned:**
- Type narrowing with `instanceof` check
- Discriminated unions (`JWTPayload | NextResponse`)
- Type guards for runtime type checking
- Middleware pattern reduces duplicate code (saved 84 lines!)

---

### 6. API Routes

#### Register Endpoint
**File:** `src/app/api/auth/register/route.ts`

**Method:** POST  
**Body:** `{ name, email, password }`

**Flow:**
1. Validate required fields
2. Check if email already exists (409 Conflict)
3. Hash password with bcrypt (10 salt rounds)
4. Create user in MongoDB
5. Generate JWT token
6. Return `{ user, token }`

**Security:**
- Passwords NEVER stored as plain text
- bcrypt uses salt rounds (prevents rainbow table attacks)
- Unique email constraint at database level

---

#### Login Endpoint
**File:** `src/app/api/auth/login/route.ts`

**Method:** POST  
**Body:** `{ email, password }`

**Flow:**
1. Validate required fields
2. Find user by email
3. Compare password with bcrypt.compare()
4. Generate JWT token if valid
5. Return `{ user, token }` OR 401 Unauthorized

**Security:**
- Same error message for "user not found" and "wrong password" (prevents user enumeration)
- bcrypt.compare() is timing-safe

---

#### Design Save Endpoint
**File:** `src/app/api/design/save/route.ts`

**Method:** POST  
**Auth:** Required (Bearer token)  
**Body:** `{ title, prompt, nodes, edges }`

**Flow:**
1. Authenticate user with `requireAuth()` middleware
2. Validate `nodes` array exists
3. Create design document linked to user
4. Return saved design

**Refactored:** Reduced from 40 lines to 15 lines using middleware!

---

#### Design Load Endpoint
**File:** `src/app/api/design/load/route.ts`

**Method:** GET  
**Auth:** Required (Bearer token)

**Flow:**
1. Authenticate user
2. Query designs where `userId` matches authenticated user
3. Sort by `createdAt` (newest first)
4. Return designs array

**Key Feature:** Users can ONLY see their own designs (data isolation)

---

#### Design Get Single Endpoint
**File:** `src/app/api/design/get/[id]/route.ts`

**Method:** GET  
**Auth:** Required (Bearer token)  
**Param:** Design ID in URL

**Flow:**
1. Authenticate user
2. Find design by ID
3. **Ownership check:** `design.userId === user.id OR user.role === "admin"`
4. Return design OR 403 Forbidden

**Security Feature:**
- Prevents horizontal privilege escalation (User A can't access User B's designs)
- Admin exception allows moderation

**Key Concept:**
```typescript
if (design.userId.toString() !== user.id && user.role !== "admin") {
  return 403;
}
```
This uses `&&` logic: Block ONLY if (not owner AND not admin)

---

#### Admin Users Endpoint
**File:** `src/app/api/admin/users/route.ts`

**Method:** GET  
**Auth:** Admin only  
**Returns:** List of all users

**Flow:**
1. Authenticate user
2. **Role check:** `user.role === "admin"`
3. Query all users, exclude passwords
4. Return users array

**Security Feature:**
- Role-based access control (RBAC)
- Passwords excluded from response (`.select("-password")`)

---

## 🔑 Key Concepts Learned Today

### 1. Authentication vs Authorization
- **Authentication:** WHO are you? (verify token, check identity)
- **Authorization:** What are you ALLOWED to do? (check role, check ownership)

### 2. JWT Deep Dive
- **Structure:** `header.payload.signature`
- **Encoding:** Base64 (NOT encryption!)
- **Security:** Signature prevents tampering
- **Stateless:** All data in token (no server sessions)

### 3. TypeScript Best Practices
- ✅ Avoid `any` type (use proper interfaces)
- ✅ Type guards (`instanceof`, `typeof`)
- ✅ Type assertions (`as JWTPayload | null`)
- ✅ Discriminated unions for error handling

### 4. Error Handling Pattern
```typescript
// ❌ BAD - loses type safety
catch (err: any) {
  return err.message;
}

// ✅ GOOD - type guard
catch (error) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}
```

### 5. Security Principles
- Defense in depth (multiple layers: auth → ownership → role)
- Never trust client input (verify on server)
- Password hashing (bcrypt with salt)
- Token expiration (auto-logout after 7 days)
- Ownership checks (users can't access other users' data)

### 6. DRY Principle (Don't Repeat Yourself)
- Middleware pattern extracts common logic
- Reduced 141 lines → 57 lines (84 lines saved!)
- Single source of truth for auth logic

---

## 🐛 Issues Solved & Debugging

### Issue 1: Mongoose Array Type Error
**Error:** `Type 'ArrayConstructor' is not assignable to type 'Mixed'`

**Solution:** Changed `type: Array` to `type: Schema.Types.Mixed`

**Why:** Schema.Types.Mixed allows flexible JSON storage without strict type validation

---

### Issue 2: Missing @types Packages
**Error:** `jwt.sign() overload error` in TypeScript

**Solution:** 
```bash
npm install --save-dev @types/jsonwebtoken @types/bcryptjs @types/cookie
```

**Why:** JavaScript libraries need separate type definition packages for TypeScript

---

### Issue 3: MongoDB Connection Exhaustion
**Problem:** Multiple connections during Next.js HMR

**Solution:** Singleton pattern with global caching

**Why:** Next.js HMR recreates modules but global object persists

---

### Issue 4: `payload` vs `user` Variable Confusion
**Problem:** After refactoring, some routes still used `payload` variable

**Solution:** Consistent naming: `user` for authenticated user data

---

## 📦 Git History

### Commit: `0f4809c`
**Date:** November 15, 2025  
**Message:** 
```
feat: add auth middleware and refactor design/admin routes
- Created requireAuth() middleware for DRY authentication
- Refactored 4 routes to use middleware (saved 84 lines)
- Implemented role-based access control for admin endpoints
- Added proper TypeScript types (no any usage)
```

**Files Added:**
- `src/lib/backend/authMiddleware.ts`
- `src/app/api/admin/users/route.ts`
- `src/app/api/design/save/route.ts`
- `src/app/api/design/load/route.ts`
- `src/app/api/design/get/[id]/route.ts`

**Stats:** 282 insertions, 5 files created

---

## 🔜 Next Steps (TODO)

### Phase 1: Testing (Not Started)
- [ ] Test register endpoint in Postman
- [ ] Test login endpoint in Postman
- [ ] Test design save/load/get endpoints
- [ ] Manually promote user to admin in MongoDB Atlas
- [ ] Test admin endpoint with admin token
- [ ] Verify ownership checks work (try accessing other user's design)

### Phase 2: Frontend Integration (Not Started)
- [ ] Create login/register UI pages
- [ ] Store JWT token in localStorage
- [ ] Add token to request headers
- [ ] Create save design button (calls `/api/design/save`)
- [ ] Create load designs button (calls `/api/design/load`)
- [ ] Display user's saved designs
- [ ] Add logout functionality (clear token)

### Phase 3: Advanced Features (Future)
- [ ] Expand to full ER diagram (Block, Connection, Version, AIFeedback models)
- [ ] Email verification for registration
- [ ] Password reset flow
- [ ] Rate limiting (prevent abuse)
- [ ] Error logging with Sentry
- [ ] Deploy to Vercel/Railway

---

## 📚 Resources & References

### Documentation:
- [JWT.io](https://jwt.io) - Decode and visualize JWT tokens
- [Mongoose Docs](https://mongoosejs.com/docs/guide.html) - Schema definitions
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) - App Router routes
- [bcrypt.js](https://github.com/dcodeIO/bcrypt.js) - Password hashing

### Key Learnings:
- Airbnb Study: TypeScript prevents 38% of bugs
- Industry Standard: bcrypt 10 salt rounds (2^10 iterations)
- JWT Best Practice: Short expiration for security (7 days)
- HTTP Status Codes: 401 (auth fail), 403 (permission denied), 409 (conflict)

---

## 💡 Interview-Ready Concepts

### "Explain JWT Authentication"
> "When a user logs in, we create a JWT token containing their ID and role, signed with a secret key. The client stores this token and sends it in the Authorization header with every request. The backend extracts the token, verifies the signature and expiration using the secret, then uses the decoded payload to check permissions. For example, in our admin routes, we verify the user's role is 'admin' before allowing access. This is stateless and scalable since the token carries all necessary data."

### "How do you prevent SQL injection?"
> "We use Mongoose ODM which automatically sanitizes inputs. Additionally, we validate all user input on the server side, use parameterized queries implicitly through Mongoose, and never concatenate user input into queries."

### "Difference between authentication and authorization?"
> "Authentication verifies WHO the user is (checking credentials, validating tokens). Authorization determines WHAT the user can do (checking roles, verifying ownership). In our system, authentication happens via JWT verification in the middleware, while authorization happens through role checks and ownership validation in each route."

---

## 🎯 Master's Plan Progress

| Phase | Status | Date |
|-------|--------|------|
| ✅ MongoDB Connection | Complete | Nov 15, 2025 |
| ✅ User/Design Models | Complete | Nov 15, 2025 |
| ✅ JWT Auth Helpers | Complete | Nov 15, 2025 |
| ✅ Register/Login Routes | Complete | Nov 15, 2025 |
| ✅ Auth Middleware | Complete | Nov 15, 2025 |
| ✅ Design Endpoints | Complete | Nov 15, 2025 |
| ✅ Admin Endpoint | Complete | Nov 15, 2025 |
| 🔜 Postman Testing | Next Session | TBD |
| 🔜 Frontend Integration | After Testing | TBD |
| 🔜 Full ER Diagram Implementation | Future | TBD |

---

## 📝 Session Notes

**What Worked Well:**
- Guided coding approach with manual typing
- Deep explanations of concepts (JWT structure, TypeScript patterns)
- Questioning anti-patterns (`err: any`, `payload: any`)
- Understanding boolean logic (`&&` operator in ownership checks)

**Challenges Faced:**
- Initial confusion about token data flow (resolved)
- TypeScript type narrowing concept (mastered with `instanceof`)
- Git branching strategy discussion (decided to implement later)

**Key Takeaway:**
> "Understanding the WHY behind the code is more important than just copying it. This session focused on building a solid mental model of JWT authentication, TypeScript type safety, and backend security principles."

---

## 📊 Master's Reality Check & Roadmap Update

### Current Status: **70% CRUD Complete** ✅
**Master's Verdict**: "You're ahead of 95% college teams. You're just scared because the project is big, not because you're late."

### What Master Said About Our Progress

**requireAuth Helper - Rating: ⭐ Strong (Tier 1)**
- ✅ Clean type safety with discriminated unions
- ✅ Proper error responses
- ✅ Production-ready and reusable
- 💡 Future optimization (NOT urgent): Rename to `getAuthUser()`, add optional `adminOnly` parameter

**The Reality Check**:
> "You already have the backbone Student Mode needs. Nothing is broken. One feature at a time. Finish CRUD → Build My Designs UI → THEN Student Mode. Don't design Student Mode database until you finish the basics."

### Master's Priority Order (The Right Way)

| Phase | Status | What to Build | Time Needed |
|-------|--------|---------------|-------------|
| 1. Backend Auth | ✅ DONE | MongoDB, JWT, middleware, 7 endpoints | ✅ Complete |
| 2. Complete CRUD | ⚙️ 70% | Add DELETE + UPDATE endpoints | 1-2 hours |
| 3. My Designs UI | ⏳ NEXT | Frontend page to list/load/delete designs | 2-3 hours |
| 4. Testing | ⏳ TODO | Postman + Frontend full flow | 1-2 hours |
| 5. Student Mode API | ⏳ TODO | 3 skeleton endpoints (mock data) | 2-3 hours |
| 6. Student Mode UI | ⏳ TODO | Guided wizard interface | 4-5 hours |
| 7. Real AI Integration | ⏳ DECEMBER | Replace mock with actual LLM | 1 week |

**Total Remaining**: ~15-20 hours (spread over days/weeks in class free time)

### Key Master Messages to Remember
- "You're not behind schedule. You're overthinking because the project feels big."
- "My Designs UI is MANDATORY before Student Mode. Users need to see their saved work."
- "Student Mode skeleton comes BEFORE real AI. Build structure first, intelligence later."
- "December is for LLM integration. That's the last piece, not the first."

### Master's Detailed Task List (What We've Done vs What's Left)

#### ✅ **Already Complete** (No Action Needed)
- ✅ **Refactor routes to use requireAuth** - We did this! All 4 routes use middleware (saved 84 lines)
- ✅ **requireAuth helper exists** - Built it line-by-line, production-ready

#### ⏳ **IMMEDIATE Tasks** (Next 3-4 hours)

**1. Delete Endpoint (20-40 min)** 🔴 HIGH PRIORITY
- Add `DELETE /api/design/[id]` route
- Check: owner OR admin can delete
- Master says: "Required for demo and edge-case testing"

**2. validateDesign Helper (20-40 min)** 🔴 HIGH PRIORITY
```typescript
// src/lib/backend/validateDesign.ts
export function validateDesign(data: any) {
  // Check: nodes is array
  // Check: each node has id + label
  // Check: edges is array
  // Check: max 500 nodes (prevent huge payloads)
  // Return: { valid: boolean, error?: string }
}
```
- Wire into `/api/design/save` route
- Master says: "Prevents DB trash and accidental huge payloads"

**3. Pagination + Index (30-60 min)** 🟡 MEDIUM PRIORITY
- Add `.skip().limit()` to `/api/design/load` and `/api/admin/users`
- Add index to Design model: `DesignSchema.index({ userId: 1, createdAt: -1 })`
- Master says: "Avoids slow queries in viva/test and looks professional"

#### ⏳ **Next Phase Tasks** (Next 3-5 hours)

**4. Admin Designs Endpoint + AdminLog Model (45-90 min)**
- `GET /api/admin/designs` - List ALL designs (not just user's)
- Create `AdminLog` model to track admin actions
- Log when admin views/exports data
- Master says: "Teacher/admin demo + audit trail"

**5. Mock /api/design/analyze (1-2 hours)**
- Analyze design based on nodes/edges count
- Return: performance score, security tips, cost estimate
- Use simple heuristics (no real AI yet)
- Master says: "Student Mode uses it; replace with LLM later"

#### ⏳ **Frontend Phase** (1-2 days)

**6. My Designs Page UI (1-2 days)**
- List saved designs with pagination
- Load design into canvas
- Delete button
- Rename (optional)
- Master says: "This is what makes it a real product, not screenshots"

#### ⏳ **Testing Phase** (1-2 hours)

**7. Postman Collection (1-2 hours)**
- Create collection with all endpoints
- Add example requests/responses
- Write basic API tests
- Master says: "Shows you're professional in viva and helps debug"

#### ⏳ **Optional Polish** (Variable time)
- Request body size limits
- Rate limiting on generate endpoint
- Soft-delete flag (instead of hard delete)
- createdBy field in AdminLog

---

### What We Need to Do IMMEDIATELY

**Option A: Follow Master's Exact Order (Recommended)** ⭐
1. Delete endpoint (20-40 min)
2. validateDesign helper (20-40 min)
3. Pagination + index (30-60 min)
**Total: 70-140 min (1.5-2.5 hours)**

**Option B: Quick Wins First**
1. Delete endpoint (simplest, 20 min)
2. Test in Postman (verify what works)
3. Then tackle validation + pagination

**Option C: Clarify Confusion First**
Ask me specific questions about any task that's unclear:
- What exactly is `.skip().limit()`?
- How do indexes work?
- What's AdminLog for?
- What are heuristics for analyze endpoint?

**Option D: Take a Break**
- You've done 70% CRUD
- Clear roadmap documented
- Come back fresh for delete endpoint

---

## 🎓 Skills Developed

**Technical:**
- MongoDB schema design
- JWT token management
- Middleware pattern implementation
- TypeScript advanced types (unions, guards, assertions)
- RESTful API design
- Security best practices (hashing, RBAC, ownership checks)
- Professional Git workflow (commits, pushes, messages)
- Comprehensive documentation writing

**Soft Skills:**
- Critical thinking (questioning code patterns)
- Problem-solving (debugging TypeScript errors)
- Documentation (writing clear commit messages)
- Professional workflow (Git version control)
- Project planning (understanding priorities)
- Handling feedback (Master's reality check)

---

**End of Session 1**

*Next session: Complete CRUD operations (delete/update endpoints)*

---

*Last Updated: November 15, 2025*  
*Session Duration: Full day (class free time)*  
*Status: ✅ Backend Authentication System Complete | ⚙️ CRUD 70% Complete*  
*Next Step: Add DELETE endpoint (30 mins) OR Build My Designs UI (2-3 hrs)*
