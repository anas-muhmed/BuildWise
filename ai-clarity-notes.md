# BuildWise Project Structure - Current State Analysis
**Last Updated:** January 18, 2026  
**Purpose:** Complete reference for AI integration and data flow

---

## 1. Architecture Snapshots Storage

### Location
- **MongoDB Model**: `src/lib/backend/snapshots.ts` → `Snapshot` collection
- **Alternative Model**: `src/lib/backend/models/ArchitectureSnapshot.ts`

### Data Structure
```typescript
{
  projectId: string,
  version: number,
  nodes: any[],
  edges: any[],
  modules: string[],
  rationale?: string,
  ai_feedback?: any,
  createdAt: Date
}
```

### API Endpoints
- ✅ `GET /api/generative/projects/[projectId]/snapshots` - Latest or history
- ✅ `POST /api/snapshots/[projectId]/rollback` - Rollback to version

### Files
- API: `src/app/api/generative/projects/[projectId]/snapshots/route.ts`
- API: `src/app/api/snapshots/[projectId]/rollback/route.ts`
- Model: `src/lib/backend/snapshots.ts`
- Service: `src/lib/backend/services/snapshotService.ts`

---

## 2. Requirements/Intake Answers Storage

### Location
- **MongoDB Model**: `src/lib/backend/models/DraftProject.ts` → `requirements` field

### Data Structure
```typescript
{
  app_type: string,
  users: string[],
  traffic: "small" | "medium" | "large",
  budget: "low" | "medium" | "high",
  team_size: number,
  must_have_features: string[],
  priorities: string[]
}
```

### API Endpoint
- ✅ `PATCH /api/generative/projects/[projectId]/requirements` - Saves intake data

### Data Flow
```
Intake Page → Requirements API → DraftProject.requirements field
```

### Files
- Page: `src/app/generative-ai/[projectId]/intake/page.tsx`
- API: `src/app/api/generative/projects/[projectId]/requirements/route.ts`
- Model: `src/lib/backend/models/DraftProject.ts`

---

## 3. Pages Showing Explanations/Scores

### Student Mode Canvas
**File**: `src/app/student-mode/[projectId]/canvas/page.tsx`

**Features:**
- Shows **score** (fetched from `/api/student-mode/score`)
- Shows **node explanations** (`explainNode()` function)
- Shows **edge explanations** (`explainEdge()` function)
- Has `showScoreBreakdown` toggle

**API Used:**
- ✅ `GET /api/student-mode/score?projectId=[id]`

### Proposal Page
**File**: `src/app/generative-ai/[projectId]/proposal/page.tsx`

**Features:**
- Shows **rationale** for each tech choice
- Shows **confidence** levels (high/medium/low)
- Shows **alternatives** and **learning resources**

**API Used:**
- ✅ `GET /api/generative/projects/[projectId]/proposal`
- ✅ `POST /api/generative/projects/[projectId]/proposal` - Generate proposal

### Module Insights Panel
**File**: `src/components/generative-ai-v2/ModuleInsights.tsx`

**Features:**
- Shows **"Why this module?"** rationale
- Shows **alternatives**
- Shows **teaching tips**
- Shows **AI feedback**

### Finalize/Execution Handoff Page
**File**: `src/app/generative-ai/[projectId]/finalize/page.tsx`

**Features:**
- Shows **readiness report** with checks
- Shows **cost breakdown**
- Shows **health score**

**API Used:**
- ✅ `GET /api/generative/projects/[projectId]/finalize`

---

## 4. AI/OpenAI Integration

### Current Status
**🔴 MOCK ONLY - No Real AI Integration**

### Files
- `src/lib/backend/services/llmWrapper.ts` - Wrapper ready but using mock data
- `src/app/api/mock-ai/route.ts` - Mock AI endpoint returning hardcoded suggestions

### Code Comments Found
```typescript
// "This is a wrapper — integrate your provider (OpenAI etc) here."
// const provider = getOpenAIProvider(); // COMMENTED OUT
```

### Conclusion
✅ Architecture ready for AI integration  
❌ NOT connected to OpenAI yet  
✅ Mock endpoints functional for testing

---

## 5. Recommended Location for New AI Endpoints

### Primary Recommendation
```
src/app/api/ai/reason/route.ts
```

### Alternative (Feature-Specific)
```
src/app/api/generative/ai/reason/route.ts
```

### Reasoning
- Current structure has `/api/mock-ai` at root level
- `/api/ai/` would be parallel to `/api/generative/`, `/api/student-mode/`
- Clean separation between AI utilities and feature-specific APIs
- Easier to maintain AI services independently

### Existing AI-Related Endpoints
- ✅ `/api/mock-ai` - Mock AI suggestions

---

## 6. Backend Tech Stack

### Framework
**Next.js 15.4.4** with App Router (Turbopack)

### API Style
**Next.js Route Handlers** (NOT Edge Runtime, NOT Server Actions)

### Pattern
```typescript
// src/app/api/[route]/route.ts
export async function GET(req: NextRequest) { ... }
export async function POST(req: NextRequest) { ... }
export async function PATCH(req: NextRequest) { ... }
export async function DELETE(req: NextRequest) { ... }
```

### Database
- **MongoDB** + **Mongoose**
- Connection: `src/lib/backend/mongodb.ts`

### Authentication
- **JWT tokens** via `getAuthUser()` middleware
- Middleware: `src/lib/backend/authMiddleware.ts`

### Current API Count
**58 route handlers** found across:
- `/api/generative/` - Generative AI features
- `/api/student-mode/` - Student learning mode
- `/api/design/` - Manual design canvas
- `/api/admin/` - Admin oversight
- `/api/auth/` - Authentication
- `/api/snapshots/` - Snapshot management
- `/api/mock-ai/` - Mock AI endpoints

---

## 7. Summary + Execution Data Assembly

### Finalize Endpoint
**File**: `src/app/api/generative/projects/[projectId]/finalize/route.ts`

### Data Sources
1. **Latest Snapshot**: `ArchitectureSnapshot.findOne({ project_id }).sort({ version: -1 })`
2. **Modules**: `Module.find({ projectId })`
3. **Project Requirements**: `DraftProject.findById(projectId).requirements`
4. **Readiness Report**: Generated via `generateReadinessReport(snapshot.nodes, requirements)`
5. **Cost Estimate**: Generated via `estimateCosts(snapshot.nodes, requirements)`

### Response Structure
```typescript
{
  ok: true,
  snapshot: { 
    version: number,
    nodes: any[],
    edges: any[],
    modules: string[]
  },
  readinessReport: { 
    overallScore: number,
    checks: Check[]
  },
  costEstimate: { 
    low: CostScenario,
    typical: CostScenario,
    peak: CostScenario,
    assumptions: string[]
  },
  modules: { 
    total: number,
    approved: number,
    proposed: number
  }
}
```

### Consumed By
**Frontend**: `src/app/generative-ai/[projectId]/finalize/page.tsx`

### Related Services
- `src/lib/backend/services/readinessAnalyzer.ts` - Health checks
- `src/lib/backend/services/costEstimator.ts` - Cost calculations

---

## Summary

BuildWise has a well-structured **MongoDB + Next.js API** setup with placeholder AI integration. 

**✅ Implemented:**
- Snapshot versioning and rollback
- Requirements/intake data storage
- Module-based architecture breakdown
- Readiness and cost analysis
- Score tracking in student mode
- Complete API layer (58 routes)

**❌ Not Implemented:**
- Real OpenAI/GPT integration
- AI reasoning endpoint (`/api/ai/reason`)
- Live LLM calls (all mocked)

**📊 Data Flow:**
```
User Input → Intake API → DraftProject.requirements
           → Proposal API → TechProposal
           → Module Builder → Module collection
           → Approval → ArchitectureSnapshot
           → Finalize → Assembled execution data
```

**🔧 Next Steps for AI Integration:**
1. Set up OpenAI API key
2. Replace mock responses in `llmWrapper.ts`
3. Create `/api/ai/reason` endpoint
4. Connect reasoning to proposal/module generation
5. Test with real prompts

---

**Status**: Production-ready architecture, awaiting AI provider connection.
