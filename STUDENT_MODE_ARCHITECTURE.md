# Student Mode - Clean Architecture ✅

## Philosophy: One Page = One Mode

Each page has exactly ONE cognitive job. No overlap. Clear mental model.

---

## 🎯 Final Flow (7 Steps)

### 1. **Setup** (`/setup`)
**Mode:** Context setting  
**Job:** "Why are we here?"  
**Output:** Student understands the tool's purpose

### 2. **Define** (`/define`)
**Mode:** Project scoping  
**Job:** "What are we building?"  
**Output:** Project name, goal, audience

### 3. **Reasoning** (`/reasoning`)
**Mode:** Design thinking  
**Job:** "Why these decisions?"  
**Details:** 
- Single page, stepper UI (Question X of 7)
- No page explosion
- All questions in one flow

### 4. **Canvas** (`/canvas`)
**Mode:** Understanding architecture  
**Job:** "How does this system work?"  
**Details:**
- Click nodes → explanation
- Interactive, not editable
- Visual learning tool

### 5. **Team** (`/team`)
**Mode:** Execution planning  
**Job:** "Who builds what?"  
**Output:** Component assignments, skill gaps, workload balance

### 6. **Cost** (`/cost`)
**Mode:** Engineering maturity  
**Job:** "What are the tradeoffs?"  
**Output:** Infrastructure cost, effort, operational risk

### 7. **Summary** (`/summary`)
**Mode:** Reflection & preparation  
**Job:** "What do I tell my examiner?"  
**Includes:** 
- Project definition
- Architecture stats
- Key decisions
- **Execution phases** (merged from old /execution)
- **Risk analysis** (merged from old /risks)
- Viva defense checklist

---

## 🗑️ Removed Pages (Consolidated)

### ❌ `/materialize`
**Why removed:** Hidden system step, not a cognitive mode  
**Now:** Auto-runs after reasoning, redirects to canvas

### ❌ `/execution`
**Why removed:** Overlapped with team planning  
**Now:** Merged into Summary as "Execution Phases" section

### ❌ `/risks`
**Why removed:** Separate analysis mode created fragmentation  
**Now:** Merged into Summary as "Risk Analysis" section

---

## ✅ Benefits of Consolidation

1. **Clearer mental model** - Students always know where they are
2. **No cognitive overload** - One job per page
3. **Better viva prep** - Summary has everything in one place
4. **Faster navigation** - Fewer steps, same depth
5. **Teacher-friendly** - Linear narrative, easy to explain

---

## 🧭 Navigation System

**StepFooter** automatically handles:
- Back button (disabled on first step)
- Continue button (disabled when requirements not met)
- Progress dots showing current position
- Smooth transitions between modes

**No manual URL typing required** - all navigation is guided.

---

## 📊 Page Count

**Before consolidation:** 10+ pages (fragmented)  
**After consolidation:** 7 pages (intentional)  

Same depth, better organization.
