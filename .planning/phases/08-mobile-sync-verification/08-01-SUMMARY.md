# Audit Summary 08-01: SyncContext Core Functionality

## Audit Date
2026-01-17

## Files Audited
- `apps/mobile/src/context/SyncContext.jsx`
- `apps/mobile/src/utils/useUpload.js`

---

## Task 1: Sync Trigger Mechanism

### App Start Auto-Sync Behavior
- **Location**: `SyncContext.jsx` lines 15-28
- **Behavior**: When the SyncProvider mounts, it calls `loadQueue()` to load any pending items from AsyncStorage
- **Auto-sync trigger**: A `useEffect` watches `queue.length` - when the queue has items (length > 0), it automatically triggers `syncNow()` after a 1-second delay

### 1-Second Delay Purpose
- **Line 23-26**: `setTimeout(() => { syncNow(); }, 1000)`
- **Purpose**: Comment states "We delay slightly to ensure app is ready"
- **Observation**: This is a pragmatic approach to ensure React Native and network are fully initialized before attempting sync operations

### Manual Sync Triggers
- **Function**: `syncNow()` (lines 143-181)
- **Exported via context**: Available to any component via `useSync()` hook
- **Guards**:
  - Returns immediately if `queue.length === 0` (nothing to sync)
  - Returns immediately if `isSyncing === true` (prevents concurrent sync operations)

### When Sync is Skipped
1. Empty queue (no items to sync)
2. Already syncing (prevents race conditions)
3. No automatic retry on failure (failed items remain in queue for next manual/app-start sync)

---

## Task 2: Error Handling Strategy

### What Happens on Sync Failure
- **Location**: Lines 154-165
- **Behavior**: On error, the item is NOT removed from the queue
- **Logging**: Error is logged via `console.error(`Failed to sync item ${item.id}`, error)`
- **Continuation**: Loop continues to try other items (does not stop on first error)
- **Comment notes**: "We stop on first error usually to preserve order or prevent cascading failures, or we can continue. For now, let's continue trying others but keep the failed one."

### Retry Behavior
- **No automatic retry**: Failed items remain in queue but sync does not retry automatically
- **Manual retry**: User must trigger `syncNow()` again or wait for next app start
- **Gap identified**: No exponential backoff or scheduled retry mechanism

### User Notification Patterns
1. **On add to queue** (line 58-62):
   ```javascript
   Alert.alert("Offline Mode", "No internet connection. Data saved locally and will be synced when you are online.")
   ```
2. **On successful sync** (lines 169-173):
   ```javascript
   Alert.alert("Sync Complete", `${successCount} items synced successfully.`)
   ```
3. **On partial failure** (lines 175-180):
   ```javascript
   Alert.alert("Sync Incomplete", `${errors.length} items failed to sync. Please try again when connection is better.`)
   ```

### Error Recovery Mechanisms
- **Persistence**: Queue is persisted to AsyncStorage, survives app restart
- **No automatic recovery**: Failed items stay in queue indefinitely until successful sync or manual removal
- **Gap identified**: No mechanism to clear stale/permanently-failed items

---

## Task 3: Media Upload Integration

### How Media Files Are Uploaded
- **Location**: `SyncContext.jsx` lines 87-108
- **Process**:
  1. Iterates through `analysisData.media_files`
  2. Checks if URI starts with `file://` (local file)
  3. If local, uploads via `useUpload` hook
  4. If already HTTP URL, passes through unchanged

### file:// vs http:// URL Handling
- **file:// handling** (lines 90-103):
  ```javascript
  if (file.uri && file.uri.startsWith("file://")) {
    const result = await upload({
      reactNativeAsset: {
        uri: file.uri,
        type: file.type === "video" ? "video/mp4" : "audio/m4a",
        name: `incident_${Date.now()}.${file.type === "video" ? "mp4" : "m4a"}`,
      },
    });
  }
  ```
- **http:// handling** (line 105): Files with non-file:// URIs are passed through as-is

### Uploadcare Integration (useUpload.js)
- **Client initialization**: Uses `@uploadcare/upload-client` with `EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY`
- **Upload methods supported**:
  1. `reactNativeAsset` with file object - uses FormData to `/_create/api/upload/`
  2. `reactNativeAsset` without file - uses Uploadcare presigned upload
  3. `url` - sends URL to `/_create/api/upload/` for server-side fetch
  4. `base64` - sends base64 data to `/_create/api/upload/`
  5. `buffer` - sends raw buffer with octet-stream content type

### Upload Failure Handling
- **In SyncContext** (lines 100-103): If `result.url` is falsy, throws error to abort sync
- **In useUpload** (lines 71-78): Returns `{ error: message }` instead of throwing
- **Error cases in useUpload**:
  - HTTP 413: "Upload failed: File too large."
  - Other errors: "Upload failed"
- **Gap identified**: `useUpload` returns error objects, but SyncContext only checks for `result.url` - may not handle error objects gracefully

---

## Task 4: Sync Limitations

### Data Types NOT Supported for Offline
- **Only supported**: `SUBMIT_INCIDENT` type (line 135-136)
- **Unknown types**: Logged as warning but no processing (line 138)
- **Not implemented**:
  - Claim updates
  - Status changes
  - Employee profile updates
  - Any other data mutations

### Scenarios That Cause Sync to Fail
1. **Network errors**: Any fetch failure (no retry)
2. **API errors**: Non-OK response status (400, 500, etc.)
3. **Media upload failures**: Uploadcare or server upload API failures
4. **Large files**: 413 errors not specially handled in SyncContext
5. **Employee creation failure**: Aborts entire incident submission
6. **Missing EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY**: Silent failure on upload

### Order Dependencies
- Queue processes items in FIFO order
- If an item fails, it stays in place - does not block subsequent items
- Comment indicates uncertainty about order preservation strategy

### Missing Features (Gap Analysis)
1. **No network detection**: Sync attempts regardless of connectivity
2. **No retry with backoff**: Failed items just sit in queue
3. **No queue item expiration**: Stale items persist indefinitely
4. **No conflict resolution**: If server data changed, no merge strategy
5. **No partial sync state**: All-or-nothing per item
6. **No sync progress indicator**: Only completion alerts
7. **No background sync**: Only foreground triggers
8. **Limited error details**: Generic alerts, no specific error info to user

---

## Recommendations for Phase 10

### High Priority
1. **Network connectivity check**: Use NetInfo to detect connectivity before sync attempt
2. **Retry mechanism**: Implement exponential backoff for failed items
3. **Error object handling**: Properly handle `{ error: message }` from useUpload

### Medium Priority
4. **Queue item expiration**: Add max age/retry count to prevent infinite queuing
5. **Better error reporting**: Show specific failure reasons to users
6. **Sync progress UI**: Show which items are syncing/pending

### Low Priority (Future Enhancement)
7. **Background sync**: Use Expo BackgroundFetch for periodic sync
8. **Conflict detection**: Timestamp comparison for server changes
9. **Expand data types**: Support more operations beyond SUBMIT_INCIDENT

---

## Verification Checklist

- [x] Sync trigger mechanism documented
- [x] Error handling strategy documented
- [x] Media upload integration documented
- [x] Sync limitations catalogued
- [x] SUMMARY.md created with findings

---

## Code Quality Observations

### Positive
- Clean separation of concerns (SyncContext for queue, useUpload for uploads)
- Persistent queue survives app restart
- User feedback via Alert for all major states
- Guards prevent concurrent sync operations

### Areas for Improvement
- No TypeScript types (uses .jsx)
- Hardcoded values (e.g., 1-second delay, video/audio types)
- Comment uncertainty about error handling strategy
- Import path inconsistency (plan says `hooks/` but actual is `utils/`)
