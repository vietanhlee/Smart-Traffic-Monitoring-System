# ✅ Account Separation Testing Checklist

## Pre-Test Setup

- [ ] Backend server running
- [ ] Frontend dev server running
- [ ] DevTools Console open (F12)
- [ ] Have 2 different test accounts ready

---

## ✅ Test 1: Basic Account Separation (5 min)

### Step 1: User A Login

- [ ] Login with User A credentials
- [ ] Navigate to Chat page
- [ ] Run `debugChatStorage()` in console
- [ ] Note the token prefix: `_________________`
- [ ] Send 3 test messages
- [ ] Run `debugChatStorage()` again
- [ ] Confirm 4 messages (welcome + 3 new): **[ YES / NO ]**

### Step 2: User A Logout

- [ ] Click Logout button
- [ ] Check console for: `[chatStorage] Clearing all chat data`
- [ ] Logout successful: **[ YES / NO ]**

### Step 3: User B Login

- [ ] Login with User B credentials
- [ ] Navigate to Chat page
- [ ] Check console for: `[ChatInterface] Token changed, reloading messages`
- [ ] Run `debugChatStorage()` in console
- [ ] Note the token prefix: `_________________`
- [ ] Token prefix DIFFERENT from User A: **[ YES / NO ]**
- [ ] Only see welcome message (no User A messages): **[ YES / NO ]**

### Step 4: Verify localStorage

- [ ] Open Application tab in DevTools
- [ ] Go to Local Storage → http://localhost:5173
- [ ] Check for TWO separate keys
- [ ] User A key exists: `chat_history_____________`
- [ ] User B key exists: `chat_history_____________`
- [ ] Keys are DIFFERENT: **[ YES / NO ]**

**✅ Test 1 Result:** **[ PASS / FAIL ]**

---

## ✅ Test 2: Message Isolation (3 min)

### Step 1: User A Messages

- [ ] Login User A
- [ ] Send message: "Hello from User A"
- [ ] Message appears in chat: **[ YES / NO ]**
- [ ] Logout

### Step 2: User B Can't See User A Messages

- [ ] Login User B
- [ ] Check chat messages
- [ ] "Hello from User A" is HIDDEN: **[ YES / NO ]**
- [ ] Only see welcome message: **[ YES / NO ]**

### Step 3: User B Messages

- [ ] Send message: "Hello from User B"
- [ ] Message appears in chat: **[ YES / NO ]**
- [ ] Logout

### Step 4: User A Can't See User B Messages

- [ ] Login User A again
- [ ] Check chat messages
- [ ] "Hello from User A" is VISIBLE: **[ YES / NO ]**
- [ ] "Hello from User B" is HIDDEN: **[ YES / NO ]**

**✅ Test 2 Result:** **[ PASS / FAIL ]**

---

## ✅ Test 3: Multi-Tab Support (2 min)

### Step 1: Open Two Tabs

- [ ] Tab 1: Open app, login User A
- [ ] Tab 2: Open app in new tab
- [ ] Both tabs running: **[ YES / NO ]**

### Step 2: Switch User in Tab 2

- [ ] Tab 2: Login User B
- [ ] Wait 2 seconds
- [ ] Tab 1: Check console for token change detection
- [ ] Tab 1: Messages still show User A's data: **[ YES / NO ]**

### Step 3: Verify Sync

- [ ] Tab 1: Run `debugChatStorage()`
- [ ] Tab 1: Token still User A's: **[ YES / NO ]**
- [ ] Tab 2: Run `debugChatStorage()`
- [ ] Tab 2: Token is User B's: **[ YES / NO ]**

**✅ Test 3 Result:** **[ PASS / FAIL ]**

---

## ✅ Test 4: Debug Function (1 min)

### Step 1: Run Debug Command

- [ ] Login any user
- [ ] Open Console (F12)
- [ ] Run: `debugChatStorage()`
- [ ] Output shows:
  - [ ] Current token prefix
  - [ ] Current chat key
  - [ ] All chat keys in localStorage
  - [ ] Message counts per key
  - [ ] Current user's messages

### Step 2: Verify Output Format

```
Expected output:
=== Chat Storage Debug Info ===
Current token: eyJ...
Token prefix: eyJhbGciOiI
Current chat key: chat_history_eyJhbGciOiI

All chat keys in localStorage:
  chat_history_eyJhbGciOiI: 5 messages

Current user's messages:
  5 messages loaded
  [0] Bot: Xin chào!...
  ...
=== End Debug Info ===
```

- [ ] Output format matches: **[ YES / NO ]**

**✅ Test 4 Result:** **[ PASS / FAIL ]**

---

## ✅ Test 5: Console Logging (2 min)

### Step 1: Check Login Logs

- [ ] Login User A
- [ ] Console shows:

```
[chatStorage] getChatHistoryKey: { tokenPrefix: "...", key: "..." }
[chatStorage] Loading messages from key: chat_history_...
[chatStorage] Successfully loaded X messages
```

- [ ] Logs present: **[ YES / NO ]**

### Step 2: Check Message Send Logs

- [ ] Send a message
- [ ] Console shows:

```
[chatStorage] getChatHistoryKey: { tokenPrefix: "...", key: "..." }
[chatStorage] Saving X messages to key: chat_history_...
```

- [ ] Logs present: **[ YES / NO ]**

### Step 3: Check Account Switch Logs

- [ ] Logout → Login different user
- [ ] Console shows:

```
[ChatInterface] Token changed, reloading messages
  Old token: ...
  New token: ...
[chatStorage] getChatHistoryKey: { tokenPrefix: "...", key: "..." }
[chatStorage] Loading messages from key: chat_history_...
[ChatInterface] Loaded X messages for new user
```

- [ ] Logs present: **[ YES / NO ]**

**✅ Test 5 Result:** **[ PASS / FAIL ]**

---

## 🚨 Failure Scenarios & Diagnostics

### Scenario 1: Same Token for Different Users

**Symptoms:**

- debugChatStorage() shows same token prefix for both users
- Messages are shared between accounts

**Console Output:**

```
[ChatInterface] Token changed, reloading messages
  Old token: eyJhbGciOiI
  New token: eyJhbGciOiI  ← SAME!
```

**Diagnosis:**

- [ ] Check Network tab → `/api/v1/login` response
- [ ] Verify `access_token` is different for each user
- [ ] Backend Issue: **[ YES / NO ]**

**Action:**

- Fix backend token generation to be unique per user

---

### Scenario 2: Messages Not Reloading on Login

**Symptoms:**

- Login different user but see old messages
- No "Token changed" log in console

**Diagnosis:**

- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Check if token actually changes: `localStorage.getItem('access_token')`
- [ ] Check console for errors
- [ ] React component cached: **[ YES / NO ]**

**Action:**

- Clear browser cache and hard refresh

---

### Scenario 3: Messages Disappear After Logout/Login

**Symptoms:**

- Logout User A → Login User A again
- Previous messages are gone

**Diagnosis:**

- [ ] Check if `clearAllChatData()` is called on logout
- [ ] This is EXPECTED behavior ✅

**Action:**

- This is correct! Logout clears data.
- To persist: Use database backend (see CHAT_DATABASE_GUIDE.md)

---

## 📊 Final Results

### Test Summary

- Test 1 (Account Separation): **[ PASS / FAIL ]**
- Test 2 (Message Isolation): **[ PASS / FAIL ]**
- Test 3 (Multi-Tab Support): **[ PASS / FAIL ]**
- Test 4 (Debug Function): **[ PASS / FAIL ]**
- Test 5 (Console Logging): **[ PASS / FAIL ]**

### Overall Result

- **All Tests Passed:** **[ YES / NO ]**
- **Fix Working Correctly:** **[ YES / NO ]**

### Issues Found

```
List any issues:
1.
2.
3.
```

### Next Steps

- [ ] If all tests pass → Fix confirmed working ✅
- [ ] If failures → Check Failure Scenarios section
- [ ] Run `debugChatStorage()` and share output for troubleshooting
- [ ] Check backend token generation if tokens are same

---

## 📝 Test Notes

**Date:** ****\_\_\_****
**Tester:** ****\_\_\_****
**Environment:**

- Backend URL: ****\_\_\_****
- Frontend URL: ****\_\_\_****
- Browser: ****\_\_\_****

**Additional Notes:**

```




```

---

**For detailed technical info, see:**

- `FIX_SUMMARY_VI.md` (Vietnamese explanation)
- `CHAT_ACCOUNT_SEPARATION_GUIDE.md` (Quick guide)
- `ACCOUNT_SEPARATION_FIX.md` (Technical details)
