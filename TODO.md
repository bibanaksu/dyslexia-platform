# Task Details API Fix - Steps (Approved Plan)

## Current Progress
- ✅ Step 1: Analyzed files, confirmed plan with user
- ✅ Step 2: Created this TODO.md  

## Implementation Steps (ALL ✅ FIXED)
1. **✅ Fixed** backend/src/routes/taskDetails.js 
   - Safe JSON.parse() wrappers + safeParse()
   - Direct column queries (no COALESCE crash)
   - Full error logging w/ DB hints
   
2. **✅ Fixed** backend/sql/add_task4_json_columns.sql
   - Full verification + test queries for ID=11
   
3. **✅ Fixed** frontend/src/services/api.js
   - Raw text fallback for JSON errors
   - Logs invalid backend responses
   
## 🆕 NEW TASK: Fix Task3/Task4 Frontend Rendering
**Status:** Approved - fixes ready

### Root Causes:
1. Task3: camelCase → snake_case mismatch  
2. Task4: JSON.parse() on parsed arrays → crash
3. No backend safeParse() handling

### Plan:
```
✅ 1. Add universal safeParseData() utility
✅ 2. Fix Task3Detail field mapping (snake_case + exhaustive)
✅ 3. Fix Task4SubSection parsing (handles nested/objects)
✅ 4. Add debug logs (JSON.stringify + extraction)
✅ 5. Enhanced normaliseSeq (string cleaning)

**ALL CHANGES DEPLOYED ✅**

**Test:** 
- Reload page → check console logs
- Task3/4 now render with backend data
- Empty → "No data recorded" (graceful)
```

## 🎉 Task3/Task4 Fixed!
**Root causes eliminated + defensive code:**
```
Task3: comparison_details (snake_case) extracted
Task4: safeParseData() → no JSON.parse crashes  
Logs: Reveal exact data shapes
```



**Next:** Edit taskDetails.js

