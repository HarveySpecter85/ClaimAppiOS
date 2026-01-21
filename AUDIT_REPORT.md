# iOS App Audit Report & Recommendations

This report outlines the findings from the audit of the mobile application code, focusing on Authentication, Security, and iOS Compliance.

## 1. Code Cleanliness: Remove "Dead" WebView Code

**Finding:**
The app currently contains two different ways to log in:
1.  **Native Login (`login.jsx`):** This is the one you are actually using. It looks good and fits the app's design.
2.  **WebView Login (`AuthWebView.jsx` & `useAuthModal`):** This is a "web-based" login flow that is **not being used** by the app. It is "dead code."

**Why it matters:**
Keeping unused code makes the app confusing for developers and can lead to bugs. For example, `useAuth.js` currently has `signIn()` and `signUp()` functions that try to open this unused WebView, which could confuse future developers.

**Recommendation:**
*   **Action:** Delete `AuthWebView.jsx` and `useAuthModal.jsx`.
*   **Action:** Clean up `useAuth.js` to remove references to the modal (like `signIn`, `signUp`, and `useRequireAuth` that rely on the modal).
*   **Action:** Keep only the Native Login flow (`login.jsx`) and the `useAuthStore` which saves the user's session.

---

## 2. Token Management: Prevent "Silent" Logouts

**Finding:**
The app saves the user's "Session Token" (JWT) when they log in. However, **there is no code to handle what happens when this token expires.**

**Why it matters:**
*   **Current Behavior:** When the token expires (e.g., after 24 hours), the app will likely just stop working. Users might see "Network Error" or blank screens, but they won't be sent back to the Login screen.
*   **Ideal Behavior:** When the token expires, the app should either (a) automatically refresh it (if the backend supports it), or (b) detect the error and immediately send the user to the Login screen.

**Recommendation:**
*   **Action:** Since you are unsure about the backend's "Refresh Token" capabilities, the immediate fix is to **handle "401 Unauthorized" errors.**
*   **How:** We should add a "Interceptor" to your API calls. If the backend says "401 Unauthorized" (meaning "Session Expired"), the app should automatically log the user out and redirect them to the Login screen so they can sign in again.

---

## 3. Security: Add Biometric Authentication (FaceID / TouchID)

**Finding:**
You requested Biometric Authentication. Currently, the app does not have this feature. Users must type their password every time their session expires or if they log out.

**Why it matters:**
Biometrics are a standard expectation for secure iOS apps. It improves security (users don't type passwords in public) and convenience.

**Recommendation:**
*   **Action:** Install and implement `expo-local-authentication`.
*   **Flow:**
    1.  When the user opens the app, if they are already "logged in" but the app wants to verify it's them, show a "Unlock with FaceID" prompt.
    2.  Alternatively, you can save the user's email/password securely in the device's Keychain (using `SecureStore`) and use FaceID to unlock *that* to auto-login.
*   **Advice:** Given the current setup, the easiest win is to use FaceID to **access the app** when resuming from the background, or to auto-fill the login form.

---

## 4. iOS Compliance (Apple Guidelines)

**Finding:**
*   **Social Login:** You are **not** using Google/Facebook login. This is great, because it means you do **not** need to implement "Sign in with Apple."
*   **Account Deletion:** Apple requires that if an app allows users to create an account, it must also allow them to delete it. Since your app **does not** allow in-app registration (accounts are made by admins), you are technically exempt from the strict "Delete Button" rule.

**Recommendation:**
*   **Action:** To be safe and helpful, add a simple "Contact Admin to Delete Account" text or button in the Settings page. This prevents any risk of rejection during App Store Review.

---

## 5. Network Security: HTTPS Required

**Finding:**
Your environment configuration (`.env`) suggests an API URL like `https://api.your-domain.com`.

**Why it matters:**
iOS has a security feature called **App Transport Security (ATS)** which **blocks** all connections that are not `https://` (secure). If your backend is just `http://` (unsecured), the app will not work on iPhones unless you add special "exceptions" (which Apple discourages).

**Recommendation:**
*   **Action:** Verify 100% that your production backend server has an SSL Certificate (starts with `https://`).

---

## Summary of Next Steps

1.  **Delete** the unused "WebView" code to clean up the project.
2.  **Add** a "Logout on 401 Error" feature so users aren't stuck when their session expires.
3.  **Implement** `expo-local-authentication` to allow FaceID/TouchID unlocking.
4.  **Verify** your backend is HTTPS.

I am ready to help you implement these changes if you wish to proceed!
