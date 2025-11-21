# 🚀 QUICK REFERENCE - BuildWise App

## 🔐 Authentication Flow

```
NOT AUTHENTICATED → /landing (public page)
                 ↓
         /register or /login
                 ↓
           Token saved to localStorage
                 ↓
         Redirect to / (home)
                 ↓
         All features accessible
```

**Token Storage:**
- User token: `localStorage.getItem('token')`
- Admin token: `localStorage.getItem('admin_token')`

---

## 📁 File Structure Quick Map

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (AuthProvider wraps all)
│   ├── page.tsx                      # Home (protected, redirects if no auth)
│   ├── landing/page.tsx              # Public marketing page
│   ├── login/page.tsx                # Login page (calls /api/auth/login)
│   ├── register/page.tsx             # Register page (calls /api/auth/register)
│   ├── design/page.tsx               # Drag & drop canvas (protected)
│   ├── generative-ai/page.tsx        # AI architecture generator (protected)
│   ├── student/
│   │   ├── page.tsx                  # Student projects list (protected)
│   │   ├── new/page.tsx              # Create new project wizard (protected)
│   │   └── [id]/page.tsx             # Student editor with SVG canvas (protected)
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts        # POST login
│       │   └── register/route.ts     # POST register
│       ├── student/
│       │   ├── projects/route.ts     # GET list projects
│       │   └── project/
│       │       ├── create/route.ts           # POST create project
│       │       ├── update-features/route.ts  # POST update features
│       │       ├── generate-step/route.ts    # POST generate next step
│       │       ├── submit/route.ts           # POST submit for review
│       │       └── [id]/route.ts             # GET project by ID
│       └── admin/
│           └── submissions/
│               ├── route.ts          # GET list submissions
│               └── [id]/
│                   ├── verify/route.ts   # POST verify
│                   ├── flag/route.ts     # POST flag
│                   └── review/route.ts   # POST add feedback
│
├── components/
│   ├── NavHeader.tsx                 # Global nav with logout
│   ├── ProtectedRoute.tsx            # Auth wrapper component
│   ├── canvas/                       # Design canvas components
│   ├── generative-ai/                # AI feature components
│   └── ui/                           # Shadcn UI components
│
└── lib/
    ├── authContext.tsx               # React Context for global auth state ⭐
    ├── mockStudentGenerator.ts       # Deterministic architecture generator ⭐
    └── backend/
        ├── mongodb.ts                # DB connection
        ├── authMiddleware.ts         # JWT verification ⭐
        └── models/
            ├── User.ts               # User model
            ├── Admin.ts              # Admin model
            ├── Design.ts             # Design model
            ├── StudentProject.ts     # Student project model ⭐
            ├── StudentSubmission.ts  # Student submission model ⭐
            └── AdminLog.ts           # Audit log model
```

---

## 🔑 Key Components

### AuthContext (`lib/authContext.tsx`)
```typescript
// Usage in any component
const { isAuthenticated, token, login, logout } = useAuth();

// Check if logged in
if (isAuthenticated) { /* ... */ }

// Login (saves token to localStorage + state)
login(tokenFromAPI);

// Logout (clears token, redirects to /login)
logout();
```

### ProtectedRoute (`components/ProtectedRoute.tsx`)
```typescript
// Wrap any page that requires authentication
export default function MyPage() {
  return (
    <ProtectedRoute>
      <NavHeader />
      <div>Protected content here</div>
    </ProtectedRoute>
  );
}
```

### Auth Middleware (`lib/backend/authMiddleware.ts`)
```typescript
// Use in any API route
export async function GET(req: Request) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth; // Error response
  
  // auth.id = user ID
  // auth.role = "admin" or undefined
  // auth.email = user email
}
```

---

## 🌐 API Endpoints Reference

### Authentication
| Method | Endpoint | Body | Returns | Auth Required |
|--------|----------|------|---------|---------------|
| POST | `/api/auth/register` | `{ name, email, password }` | `{ token, user }` | No |
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user }` | No |

### Student Mode
| Method | Endpoint | Body | Returns | Auth Required |
|--------|----------|------|---------|---------------|
| GET | `/api/student/projects` | - | `{ projects: [] }` | Yes |
| POST | `/api/student/project/create` | `{ appType, skillLevel }` | `{ projectId }` | Yes |
| POST | `/api/student/project/update-features` | `{ projectId, selectedFeatures }` | `{ ok: true }` | Yes |
| POST | `/api/student/project/generate-step` | `{ projectId }` | `{ step, nodes, edges }` | Yes |
| POST | `/api/student/project/submit` | `{ projectId, notes }` | `{ submissionId }` | Yes |
| GET | `/api/student/project/[id]` | - | `{ project: {...} }` | Yes |

### Admin Submissions
| Method | Endpoint | Body | Returns | Auth Required |
|--------|----------|------|---------|---------------|
| GET | `/api/admin/submissions` | Query: `?page=1&per=20` | `{ submissions: [], meta }` | Admin |
| POST | `/api/admin/submissions/[id]/verify` | - | `{ ok: true }` | Admin |
| POST | `/api/admin/submissions/[id]/flag` | `{ reason }` | `{ ok: true }` | Admin |
| POST | `/api/admin/submissions/[id]/review` | `{ note, status }` | `{ ok: true }` | Admin |

---

## 🗄️ Database Models

### User
```typescript
{
  name: string;
  email: string; // unique
  password: string; // bcrypt hashed
  createdAt: Date;
}
```

### StudentProject
```typescript
{
  userId: ObjectId;
  appType: string;
  skillLevel: "beginner" | "intermediate" | "advanced";
  selectedFeatures: string[];
  steps: any[]; // Array of step objects
  architecture: { nodes: [], edges: [] };
  explanations: string[];
  aiScore: number;
  status: "draft" | "submitted" | "verified" | "flagged" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}
```

### StudentSubmission
```typescript
{
  userId: ObjectId;
  projectId: ObjectId;
  architecture: { nodes: [], edges: [] };
  notes: string;
  aiFeedback: { score: number, suggestions: [] };
  adminFeedback: { adminId: ObjectId, note: string, createdAt: Date };
  status: "pending" | "verified" | "flagged";
  createdAt: Date;
}
```

---

## 🎨 Page Access Control

| Route | Public | User | Admin |
|-------|--------|------|-------|
| `/landing` | ✅ | ✅ | ✅ |
| `/login` | ✅ | ✅ | ✅ |
| `/register` | ✅ | ✅ | ✅ |
| `/` (home) | ❌ | ✅ | ✅ |
| `/design` | ❌ | ✅ | ✅ |
| `/generative-ai` | ❌ | ✅ | ✅ |
| `/student/*` | ❌ | ✅ | ✅ |
| `/admin/*` | ❌ | ❌ | ✅ |

---

## 🧪 Testing Commands

### cURL Examples

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

**Create Student Project:**
```bash
curl -X POST http://localhost:3000/api/student/project/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"appType":"ecommerce","skillLevel":"beginner"}'
```

**Generate Step:**
```bash
curl -X POST http://localhost:3000/api/student/project/generate-step \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"projectId":"PROJECT_ID"}'
```

---

## 🔥 Common Dev Tasks

### Add New Protected Page
1. Create page file: `app/newpage/page.tsx`
2. Import ProtectedRoute and NavHeader
3. Wrap content:
```typescript
export default function NewPage() {
  return (
    <ProtectedRoute>
      <NavHeader />
      <div>Your content</div>
    </ProtectedRoute>
  );
}
```

### Add New API Route
1. Create route file: `app/api/myroute/route.ts`
2. Use auth middleware:
```typescript
import { getAuthUser } from "@/lib/backend/authMiddleware";

export async function POST(req: Request) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth;
  
  // Your logic here
  return NextResponse.json({ ok: true });
}
```

### Access Auth in Component
```typescript
import { useAuth } from "@/lib/authContext";

export default function MyComponent() {
  const { isAuthenticated, token, logout } = useAuth();
  
  // Use auth state
  if (!isAuthenticated) return <div>Please login</div>;
  
  return <button onClick={logout}>Logout</button>;
}
```

---

## 📊 Environment Variables

Required in `.env.local`:

```bash
MONGODB_URI=mongodb://localhost:27017/buildwise
JWT_SECRET=your-secret-key-here
```

---

## 🎯 Interview Talking Points

**When asked "How does authentication work?"**
- "I implemented JWT-based auth with React Context for global state"
- "Token stored in localStorage, verified by middleware on every API call"
- "Protected routes automatically redirect unauthenticated users"
- "Separate admin_token for role-based access control"

**When asked "Explain Student Mode"**
- "Guided architecture builder with skill-level-based templates"
- "Deterministic mock generator (not random) for consistent UX"
- "SVG canvas with React components using foreignObject"
- "Submit → Admin review workflow with verify/flag/feedback"

**When asked "Database design decisions"**
- "MongoDB with Mongoose for flexible schema and rapid development"
- "Compound indexes on frequently queried fields (userId + status)"
- "Soft delete pattern with 'deleted' boolean flag"
- "AdminLog model for complete audit trail"

---

**Last Updated:** November 21, 2025  
**Version:** 1.0 (Production Ready)
