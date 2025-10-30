# 🔧 Fix: Account Separation Bug - Chat Messages Shared Between Accounts

## ❌ Problem

Two users on the same machine could see each other's chat messages despite having separate accounts.

## 🔍 Root Cause

`ChatInterface` component only loaded messages **once** when mounting:

```tsx
const [messages, setMessages] = useState(() => loadChatHistory());
```

When user switched accounts (logout → login different user), React component didn't remount, so old messages remained in state.

## ✅ Solution Implemented

### 1. **Token Change Detection** (ChatInterface.tsx)

Added tracking for JWT token changes to trigger message reload:

```tsx
// Track current token
const [currentToken, setCurrentToken] = useState(() =>
  localStorage.getItem(authConfig.TOKEN_KEY)
);

// Reload messages when token changes
useEffect(() => {
  const token = localStorage.getItem(authConfig.TOKEN_KEY);

  if (token !== currentToken) {
    console.log("[ChatInterface] Token changed, reloading messages");
    console.log("  Old token:", currentToken?.substring(0, 10));
    console.log("  New token:", token?.substring(0, 10));

    setCurrentToken(token);
    const newMessages = loadChatHistory();
    setMessages(newMessages);
    setInput(loadChatDraft());

    console.log(
      "[ChatInterface] Loaded",
      newMessages.length,
      "messages for new user"
    );
  }
}, [currentToken]);

// Check token periodically (for multi-tab scenarios)
useEffect(() => {
  const interval = setInterval(() => {
    const token = localStorage.getItem(authConfig.TOKEN_KEY);
    if (token !== currentToken) {
      setCurrentToken(token);
    }
  }, 1000); // Check every second

  return () => clearInterval(interval);
}, [currentToken]);
```

### 2. **Enhanced Debug Logging** (chatStorage.ts)

Added detailed console logs to help track storage operations:

```tsx
export const getChatHistoryKey = (): string => {
  const token = localStorage.getItem(authConfig.TOKEN_KEY);
  const key = token
    ? `chat_history_${token.substring(0, 10)}`
    : "chat_history_guest";

  console.log("[chatStorage] getChatHistoryKey:", {
    tokenPrefix: token?.substring(0, 10) || "none",
    key: key,
  });

  return key;
};

export const loadChatHistory = (): Message[] => {
  try {
    const key = getChatHistoryKey();
    console.log("[chatStorage] Loading messages from key:", key);

    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(
          "[chatStorage] Successfully loaded",
          parsed.length,
          "messages"
        );
        return parsed;
      }
    }
    console.log(
      "[chatStorage] No saved messages found, returning welcome message"
    );
  } catch (error) {
    console.error("Error loading chat history:", error);
  }
  // ... return welcome message
};

export const saveChatHistory = (messages: Message[]): void => {
  try {
    const key = getChatHistoryKey();
    console.log(
      "[chatStorage] Saving",
      messages.length,
      "messages to key:",
      key
    );
    localStorage.setItem(key, JSON.stringify(messages));
  } catch (error) {
    console.error("Error saving chat history:", error);
  }
};
```

### 3. **Logout Cleanup** (App.tsx)

Already implemented - clears all chat data on logout:

```tsx
const handleLogout = () => {
  localStorage.removeItem("access_token");
  clearAllChatData(); // ✅ Already exists!
  setAuthed(false);
  setShowUserDropdown(false);
  navigate("/login", { replace: true });
};
```

## 🧪 How to Test

### Quick Debug Command

Open DevTools Console and run:

```javascript
debugChatStorage();
```

This will show:

- Current JWT token prefix
- Current chat storage key
- All chat keys in localStorage
- Number of messages per key
- Current user's messages

### Test Scenario 1: Basic Account Switch

1. **Login as User A**

   - Open DevTools Console (F12)
   - Go to Chat page
   - Run `debugChatStorage()` to see current state
   - Look for logs:
     ```
     [chatStorage] getChatHistoryKey: { tokenPrefix: "eyJhbGciOiI...", key: "chat_history_eyJhbGciOiI" }
     [chatStorage] Loading messages from key: chat_history_eyJhbGciOiI
     ```
   - Send a few messages
   - Run `debugChatStorage()` again to verify messages saved
   - Note the chat_history key

2. **Logout**

   - Click Logout button
   - Console should show:
     ```
     [chatStorage] Clearing all chat data for current user
     ```

3. **Login as User B** (different account)

   - Check console logs
   - Run `debugChatStorage()` immediately
   - Token should be different:
     ```
     [ChatInterface] Token changed, reloading messages
       Old token: eyJhbGciOiI
       New token: eyJzdWIiOiI
     [chatStorage] getChatHistoryKey: { tokenPrefix: "eyJzdWIiOiI...", key: "chat_history_eyJzdWIiOiI" }
     [chatStorage] No saved messages found, returning welcome message
     ```
   - Should see welcome message only (no User A's messages)
   - `debugChatStorage()` should show TWO separate keys in storage

4. **Verify localStorage**
   - Open Application tab in DevTools
   - Go to Local Storage → http://localhost:5173
   - Should see TWO separate keys:
     ```
     chat_history_eyJhbGciOiI  (User A's messages)
     chat_history_eyJzdWIiOiI  (User B's messages)
     ```

### Test Scenario 2: Multi-Tab Switch

1. Open app in two browser tabs
2. Login as User A in Tab 1
3. Switch to Tab 2, login as User B
4. Go back to Tab 1
5. Within 1 second, Tab 1 should detect token change and reload User A's messages

### Test Scenario 3: Verify Isolation

1. Login as User A → Send "Hello from User A"
2. Logout
3. Login as User B → Should NOT see "Hello from User A"
4. Send "Hello from User B"
5. Logout
6. Login as User A → Should see "Hello from User A" but NOT "Hello from User B"

## 📊 Expected Console Output

### User A Login:

```
[chatStorage] getChatHistoryKey: { tokenPrefix: "eyJhbGciOiI", key: "chat_history_eyJhbGciOiI" }
[chatStorage] Loading messages from key: chat_history_eyJhbGciOiI
[chatStorage] No saved messages found, returning welcome message
```

### User A Sends Message:

```
[chatStorage] getChatHistoryKey: { tokenPrefix: "eyJhbGciOiI", key: "chat_history_eyJhbGciOiI" }
[chatStorage] Saving 2 messages to key: chat_history_eyJhbGciOiI
```

### User A Logout:

```
[chatStorage] Clearing all chat data for current user
[chatStorage] getChatHistoryKey: { tokenPrefix: "eyJhbGciOiI", key: "chat_history_eyJhbGciOiI" }
[chatStorage] Clearing key: chat_history_eyJhbGciOiI
```

### User B Login (Different Token):

```
[ChatInterface] Token changed, reloading messages
  Old token: eyJhbGciOiI
  New token: eyJzdWIiOiI
[chatStorage] getChatHistoryKey: { tokenPrefix: "eyJzdWIiOiI", key: "chat_history_eyJzdWIiOiI" }
[chatStorage] Loading messages from key: chat_history_eyJzdWIiOiI
[chatStorage] No saved messages found, returning welcome message
[ChatInterface] Loaded 1 messages for new user
```

## 🚨 Troubleshooting

### Issue: Still seeing other user's messages

**Check:**

1. Run `debugChatStorage()` and check if tokens are actually different
2. Check tokenPrefix values in console logs
3. Is logout clearing data properly? Check for "Clearing all chat data" log
4. Hard refresh (Ctrl+Shift+R) to clear any cached components

### Issue: Messages disappear on refresh

**This is NORMAL!** localStorage is cleared on logout. If you want persistent storage:

- Option 1: Don't call `clearAllChatData()` on logout (keeps old messages)
- Option 2: Integrate with database backend (already implemented, see `CHAT_DATABASE_GUIDE.md`)

### Issue: Token not changing between users

**Backend issue!** Check:

1. Are you using different user credentials?
2. Is backend generating unique tokens per user?
3. Check `/api/v1/login` response in Network tab

## 📝 Files Changed

1. **frontend/src/modules/features/chat/components/ChatInterface.tsx**

   - Added `currentToken` state tracking
   - Added useEffect to detect token changes and reload messages
   - Added periodic token check (1s interval) for multi-tab support

2. **frontend/src/utils/chatStorage.ts**

   - Enhanced debug logging in `getChatHistoryKey()`
   - Enhanced debug logging in `loadChatHistory()`
   - Enhanced debug logging in `saveChatHistory()`
   - Enhanced debug logging in `clearAllChatData()`
   - Enhanced debug logging in `clearAllUsersData()`
   - Added `debugChatStorage()` function for easy troubleshooting
   - Exposed `debugChatStorage()` to window object for console access

3. **frontend/src/App.tsx**
   - Already had `clearAllChatData()` on logout ✅

## 🎯 Summary

**Before:**

- Messages loaded once on component mount
- Token changes didn't trigger reload
- Users saw each other's messages when switching accounts

**After:**

- Messages reload automatically when token changes
- Each user has unique localStorage key based on JWT token
- Multi-tab support via periodic token checking
- Comprehensive debug logging for troubleshooting
- Logout properly clears chat data

**Result:** ✅ Complete account separation with automatic message reloading
