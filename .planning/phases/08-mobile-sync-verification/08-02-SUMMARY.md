# Audit 08-02: Offline Queue and Persistence

## Audit Status: COMPLETE

---

## Task 1: Queue Persistence

### AsyncStorage Key Usage
- **Key**: `offline_queue`
- **Location**: `apps/mobile/src/context/SyncContext.jsx`

### JSON Serialization Pattern
```javascript
// Save (line 43)
await AsyncStorage.setItem("offline_queue", JSON.stringify(newQueue));

// Load (line 32-34)
const storedQueue = await AsyncStorage.getItem("offline_queue");
if (storedQueue) {
  setQueue(JSON.parse(storedQueue));
}
```

### Corruption Recovery
- **FINDING**: No corruption recovery exists
- If `JSON.parse()` fails on corrupted data, it throws an exception
- The catch block only logs the error: `console.error("Failed to load queue", e)`
- Corrupted queue data results in empty queue (defaults to `[]` from useState)
- User data in corrupted queue is silently lost

### Storage Failure Handling
- **loadQueue failure**: Error logged, queue remains empty `[]`
- **saveQueue failure**: Error logged, state is still updated (`setQueue(newQueue)` runs after failed AsyncStorage write)
- **ISSUE**: saveQueue updates React state even when AsyncStorage fails (line 44), causing inconsistency between persisted and in-memory state

---

## Task 2: Queue Item Structure

### SUBMIT_INCIDENT Payload Structure
```javascript
{
  id: Date.now().toString(),      // Added by addToQueue (line 52)
  createdAt: new Date().toISOString(), // Added by addToQueue (line 53)
  type: "SUBMIT_INCIDENT",        // Set by caller
  title: "Incident: {incident_type}",  // Human-readable title
  desc: "{incident_date}",        // Human-readable description
  payload: {
    employeeId: number | null,    // Selected employee ID (if existing)
    employeeData: {               // Employee form data
      full_name: string,
      employee_id: string,
      job_position: string,
      employment_start_date: string,
      phone: string,
      client_id: number | null,
      position_name: string,
      pay_rate: string,
      role_description: string,
      hire_date: string,
      email: string
    },
    incidentData: {               // Incident form data
      incident_date: string,      // YYYY-MM-DD
      incident_time: string,      // HH:MM
      incident_type: string,
      severity: "low" | "medium" | "high",
      description: string,
      body_parts_injured: string[],
      date_reported_to_employer: string,
      reported_to_name: string
    },
    analysisData: {               // Analysis form data
      employment_tenure: string,
      time_on_task: string,
      shift_start_time: string,
      hours_worked: string,
      last_day_off: string,
      wearing_ppe: boolean,
      received_training: boolean,
      equipment_condition: "good" | string,
      task_supervision: boolean,
      media_files: [              // Array of media references
        { type: "video" | "audio", uri: string }
      ]
    },
    locationData: {               // Location form data
      location: string,
      site_area: string,
      address: string
    }
  }
}
```

### Media File References
- **URI Format**: Local file URIs starting with `file://`
- **ISSUE**: Media files are stored as local `file://` URIs which may become invalid if:
  - App cache is cleared
  - Device storage is low and OS clears temp files
  - App is reinstalled
- No media file validation or existence check before queuing

---

## Task 3: addToQueue Flow

### Where addToQueue is Called
- **Single call site**: `apps/mobile/src/hooks/useIncidentForm.js` (line 154)
- Called from within `handleNext()` function's catch block

### Online vs Offline Trigger Logic
```javascript
// useIncidentForm.js handleNext() flow (lines 65-166):
1. Try to create employee (if new) - fetch("/api/employees")
2. Try to upload media files - upload()
3. Try to submit incident - fetch("/api/incidents")
4. If any step fails -> catch block -> addToQueue()
```

- **Decision point**: Any exception during the try block triggers offline save
- **ISSUE**: No explicit network connectivity check
- **ISSUE**: Any error (not just network) triggers offline fallback:
  - Server 500 errors
  - Validation errors
  - Upload failures
  - These may not be resolvable by retry

### Error Fallback Behavior
- Entire payload saved to queue on ANY error
- User shown Alert: "Offline Mode - No internet connection..."
- User redirected to dashboard (line 162)
- **ISSUE**: Alert message claims "No internet connection" even for non-network errors

### Queue Item Creation
```javascript
// SyncContext.jsx addToQueue() (lines 50-62)
const newItem = {
  ...item,                           // Merges caller's data
  id: Date.now().toString(),         // Unique ID
  createdAt: new Date().toISOString() // Timestamp
};
const newQueue = [...queue, newItem];
await saveQueue(newQueue);
Alert.alert("Offline Mode", "...");
```

- ID generated from timestamp (could collide if multiple items queued in same millisecond)
- No duplicate detection or deduplication

---

## Task 4: removeFromQueue Flow

### When Items Are Removed
- **Only on successful sync**: `syncNow()` function (line 157)
- Removal happens after `syncItem()` succeeds: `await removeFromQueue(item.id)`

### Failed Item Handling
```javascript
// syncNow() lines 154-165
for (const item of currentQueue) {
  try {
    await syncItem(item);
    await removeFromQueue(item.id);  // Only on success
    successCount++;
  } catch (error) {
    console.error(`Failed to sync item ${item.id}`, error);
    errors.push(error.message);
    // Item stays in queue - continues to next item
  }
}
```

- **Failed items remain in queue permanently**
- No retry limit or failure count tracking
- No exponential backoff
- No item expiration/aging mechanism

### Queue Cleanup Mechanisms
- **FINDING**: No cleanup mechanisms exist
- No maximum queue size limit
- No item expiration based on createdAt
- No manual "delete from queue" user action exposed

### Orphan Item Handling
- **FINDING**: No orphan handling
- Items with invalid media URIs will fail forever
- Items with deleted employee references will fail forever
- No mechanism to identify or remove orphaned items

### Sync Trigger
- Auto-sync attempted on queue load (1 second delay, line 23-27)
- No manual retry button exposed to user
- No periodic retry mechanism
- No network connectivity listener to trigger sync

---

## Key Issues Summary

| Issue | Severity | Location |
|-------|----------|----------|
| No corruption recovery for queue data | High | SyncContext loadQueue() |
| saveQueue updates state on storage failure | Medium | SyncContext saveQueue() |
| Media URIs may become invalid while queued | High | useIncidentForm addToQueue |
| Any error triggers offline (not just network) | Medium | useIncidentForm handleNext() |
| Misleading "No internet" message for all errors | Low | SyncContext addToQueue() |
| Failed items stay in queue forever | High | SyncContext syncNow() |
| No retry limits or exponential backoff | Medium | SyncContext syncNow() |
| No maximum queue size | Medium | SyncContext |
| No item expiration mechanism | Medium | SyncContext |
| No orphan detection or cleanup | High | SyncContext |
| Timestamp-based ID collision possible | Low | SyncContext addToQueue() |
| No manual queue management for users | Medium | N/A |

---

## Files Audited

| File | Path |
|------|------|
| SyncContext | `apps/mobile/src/context/SyncContext.jsx` |
| useIncidentForm | `apps/mobile/src/hooks/useIncidentForm.js` |

---

## Recommendations for Phase 10

1. **Add corruption recovery**: Wrap JSON.parse in try-catch, clear corrupted data
2. **Fix saveQueue state sync**: Only update React state if AsyncStorage succeeds
3. **Add network check**: Use NetInfo to distinguish offline from server errors
4. **Add retry limits**: Track failure count, remove items after N failures
5. **Add item expiration**: Remove items older than X days
6. **Validate media files**: Check file existence before queuing
7. **Add queue management UI**: Let users view/delete queued items
8. **Add network listener**: Auto-sync when connectivity restored
