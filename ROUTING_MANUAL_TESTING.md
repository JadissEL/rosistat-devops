# React Router Manual Testing Guide

**Purpose:** Step-by-step manual testing of React Router functionality  
**Target:** All 5 routes + 404 fallback  
**Estimated Time:** 10-15 minutes

---

## Pre-Testing Setup

### 1. Start Development Server

```bash
cd /workspaces/rosistat-devops
npm run dev
```

Expected output:
```
  VITE v5.0.0  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: available at [IP]
```

### 2. Open Browser

Visit: `http://localhost:5173/`

### 3. Open Developer Tools

- Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
- Press `Cmd+Option+I` (Mac)
- Go to Console tab to check for errors

---

## Test Scenarios

### Test 1: Home Page Load (`/`)

**Steps:**
1. Application starts automatically at `/`
2. Look for "RoSiStrat" title
3. Check for main content (strategy simulator)
4. Look for navigation menu/links

**Expected:**
- ✅ Page loads immediately
- ✅ Content is visible
- ✅ No console errors
- ✅ URL shows: `http://localhost:5173/`

**Verification:**
```javascript
// In browser console, should show:
window.location.pathname === "/"  // true
document.title.includes("RoSiStrat")  // true (check browser tab)
console.log("No errors in console")  // Check console tab
```

---

### Test 2: Navigate to About Page (`/about`)

**Steps:**
1. Look for "About" link on home page
2. Click the "About" link
3. Wait for page to load
4. Check page content

**Expected:**
- ✅ URL changes to: `http://localhost:5173/about`
- ✅ Page title changes to "About RoSiStrat"
- ✅ Creator information visible (Jadiss EL ANTAKI)
- ✅ "Back to RoSiStrat" button present
- ✅ No console errors

**Verification:**
```javascript
// In browser console:
window.location.pathname === "/about"  // true
document.body.innerHTML.includes("Jadiss")  // true
```

---

### Test 3: Navigate to Privacy Policy (`/privacy`)

**Steps:**
1. From About page (or home), find "Privacy" link
2. Click the "Privacy" link
3. Wait for page to load
4. Scroll and check content

**Expected:**
- ✅ URL changes to: `http://localhost:5173/privacy`
- ✅ Page title shows "Privacy Policy"
- ✅ Legal content visible
- ✅ "Back to RoSiStrat" button present
- ✅ No console errors

**Verification:**
```javascript
// In browser console:
window.location.pathname === "/privacy"  // true
document.body.innerHTML.includes("Privacy Policy")  // true
```

---

### Test 4: Navigate to Terms of Use (`/terms`)

**Steps:**
1. From Privacy page (or home), find "Terms" link
2. Click the "Terms" link
3. Wait for page to load
4. Scroll and check content

**Expected:**
- ✅ URL changes to: `http://localhost:5173/terms`
- ✅ Page title shows "Terms of Use"
- ✅ Legal content visible
- ✅ "Back to RoSiStrat" button present
- ✅ No console errors

**Verification:**
```javascript
// In browser console:
window.location.pathname === "/terms"  // true
document.body.innerHTML.includes("Terms of Use")  // true
```

---

### Test 5: Back Button Navigation

**Steps:**
1. Navigate: `/about` → `/privacy` → `/terms`
2. Click "Back to RoSiStrat" button
3. Should return to `/`
4. Click About again → Click "Back"
5. Should return to `/` again

**Expected:**
- ✅ Always returns to `/` (home)
- ✅ No console errors
- ✅ Page transitions smooth
- ✅ Navigation instant

**Verification:**
```javascript
// After clicking back:
window.location.pathname === "/"  // true
```

---

### Test 6: Browser History Navigation

**Steps:**
1. Start at home (`/`)
2. Click About → URL becomes `/about`
3. Click Privacy → URL becomes `/privacy`
4. Click browser "Back" button (or `Alt+Left`)
5. Should return to `/about`
6. Click browser "Back" again
7. Should return to `/`
8. Click browser "Forward" button (or `Alt+Right`)
9. Should go to `/about` again

**Expected:**
- ✅ Back button: `/privacy` → `/about` → `/`
- ✅ Forward button: `/` → `/about` → `/privacy`
- ✅ No page reloads
- ✅ Instant transitions

**Verification:**
```javascript
// Check URL bar or:
window.location.pathname  // should show current path
```

---

### Test 7: Deep Link Access

**Steps:**
1. In address bar, type: `http://localhost:5173/about`
2. Press Enter
3. Page should load immediately
4. Check content
5. Repeat for `/privacy` and `/terms`

**Expected:**
- ✅ Page loads immediately (no navigation needed)
- ✅ Correct content shows
- ✅ All links work
- ✅ No console errors

**This tests:** Routes are independently accessible (deep linking works)

---

### Test 8: 404 Error Page

**Steps:**
1. In address bar, type: `http://localhost:5173/undefined`
2. Press Enter
3. Should show 404 page
4. Try other fake routes:
   - `http://localhost:5173/broken`
   - `http://localhost:5173/admin`
   - `http://localhost:5173/user`

**Expected:**
- ✅ Shows "404" heading
- ✅ Shows "Oops! Page not found" message
- ✅ Shows "Return to Home" link
- ✅ Console shows error log
- ✅ Gray background (different styling)

**Console Check:**
```javascript
// Open console, should see:
// "404 Error: User attempted to access non-existent route: /undefined"
```

**Verification:**
```javascript
// In browser console:
window.location.pathname === "/undefined"  // true
document.body.innerHTML.includes("404")  // true
```

---

### Test 9: Return from 404 Page

**Steps:**
1. You should be on 404 page from Test 8
2. Click "Return to Home" link
3. Should go back to home page (`/`)

**Expected:**
- ✅ URL changes to: `http://localhost:5173/`
- ✅ Home page content visible
- ✅ No console errors

**Verification:**
```javascript
// After clicking link:
window.location.pathname === "/"  // true
```

---

### Test 10: Keyboard Navigation

**Steps:**
1. On home page, press `Tab` key repeatedly
2. Focus should move through links
3. Press `Enter` to activate a link
4. Should navigate to that page
5. Test this on each page

**Expected:**
- ✅ Tab moves focus visibly
- ✅ All links focusable
- ✅ Enter key activates links
- ✅ Focus indicators visible
- ✅ No keyboard traps

**This tests:** Accessibility for keyboard users

---

### Test 11: Multiple Navigation Cycles

**Steps:**
1. Navigate: `/` → `/about` → `/privacy` → `/terms` → `/`
2. Navigate: `/` → `/terms` → `/about` → `/`
3. Navigate: `/` → `/privacy` → `/` → `/about` → `/`
4. Test back button after each navigation
5. Check console for cumulative errors

**Expected:**
- ✅ All routes accessible from any route
- ✅ No console errors accumulate
- ✅ No memory leaks
- ✅ Smooth transitions throughout

**This tests:** Stability under repeated navigation

---

### Test 12: Console Monitoring

**Throughout all tests:**

```javascript
// Check console for these things:

// ✅ SHOULD SEE:
// - No errors (red messages)
// - 404 error log when accessing /undefined: 
//   "404 Error: User attempted to access non-existent route: /undefined"

// ❌ SHOULD NOT SEE:
// - Uncaught errors
// - Type errors
// - Undefined variable warnings
// - Network 404s (only route 404s)
// - Memory warnings
```

**Console Cleanup:**
1. Open DevTools → Console tab
2. Clear console (trash icon or `console.clear()`)
3. Perform test
4. Check for new errors

---

## Quick Test Checklist

Print this out or keep handy:

```
ROUTING TESTS:
□ Home page loads (/)
□ About page accessible (/about)
□ Privacy page accessible (/privacy)
□ Terms page accessible (/terms)
□ 404 page shows for undefined routes
□ "Back" buttons work
□ Browser back button works
□ Browser forward button works
□ Deep links work (/about directly)
□ Keyboard navigation works

CONTENT CHECKS:
□ Home page has correct content
□ About page shows "Jadiss"
□ Privacy page shows legal text
□ Terms page shows legal text
□ 404 page has "Return to Home" link

ERROR CHECKS:
□ No console errors (red)
□ 404 logged to console
□ No memory leaks
□ Fast transitions (<1 second)
□ No broken links

OVERALL:
□ All tests passed ✅
□ Ready for deployment ✅
```

---

## Troubleshooting

### Issue: Page not loading

**Solution:**
1. Check if dev server is running: `npm run dev`
2. Check if port 5173 is available
3. Check network tab in DevTools
4. Clear browser cache (Ctrl+Shift+Delete)

### Issue: Wrong page shows

**Solution:**
1. Check URL in address bar
2. Clear browser cache
3. Hard refresh (Ctrl+F5 or Cmd+Shift+R)
4. Check console for errors

### Issue: 404 page doesn't show

**Solution:**
1. Check route configuration in `src/App.tsx`
2. Verify catch-all route exists: `<Route path="*" element={<NotFound />} />`
3. Verify it's the last route
4. Check console for errors

### Issue: Links don't work

**Solution:**
1. Check link implementation uses `useNavigate()`
2. Check onClick handler is attached
3. Check for JavaScript errors in console
4. Try keyboard navigation (Tab + Enter)

### Issue: Back button doesn't work

**Solution:**
1. Browser back button should work automatically
2. Component back buttons use `useNavigate("/")`
3. Check if useNavigate is imported and used
4. Check for errors in console

---

## Performance Observation

### What to Watch

1. **Navigation Speed**
   - Should be instant (< 100ms)
   - No loading spinners needed
   - No page flicker

2. **DOM Changes**
   - Only content should change
   - Layout should stay consistent
   - No layout shift

3. **Scroll Position**
   - Page scrolls to top on navigation
   - Can be customized if needed

4. **Memory Usage**
   - DevTools → Performance tab
   - No memory growth over time
   - No garbage collection issues

---

## Final Sign-Off

After completing all 12 tests:

### If All Tests Pass ✅

```
✓ All 5 routes working
✓ 404 fallback working
✓ Navigation working
✓ Keyboard accessible
✓ No console errors
✓ Performance good

→ Ready for Production ✅
```

### If Issues Found ❌

1. Note the exact problem
2. Check `ROUTING_SIMULATION_REPORT.md`
3. Review `src/App.tsx`
4. Check test files for hints
5. Fix issue
6. Restart dev server
7. Retest

---

## Commands Reference

```bash
# Start dev server
npm run dev

# Run automated tests
npm test

# Type check
npm run typecheck

# Build for production
npm run build

# Format code
npm run format.fix
```

---

## Browser DevTools Tips

### Console Tab
- Check for errors (red) and warnings (yellow)
- Monitor 404 logs when testing error routes

### Network Tab
- Watch for navigation changes
- Should see no failed requests
- Routes are client-side, no network requests

### Performance Tab
- Measure navigation speed
- Check for jank or frame drops
- Monitor memory usage

### Application Tab
- Check localStorage (auth tokens)
- Check cookies (consent)
- Check Service Worker (if used)

---

## Time Estimate

| Test          | Time  |
| ------------- | ----- |
| Setup         | 2 min |
| Tests 1-9     | 10 min|
| Tests 10-12   | 5 min |
| **Total**     | **17 min** |

---

## Next Steps

After successful testing:

1. ✅ Review `ROUTING_VALIDATION_SUMMARY.md`
2. ✅ Check all automated tests: `npm test`
3. ✅ Verify TypeScript: `npm run typecheck`
4. ✅ Build: `npm run build`
5. ✅ Deploy with confidence

---

**Testing Date:** ________________  
**Tester:** ________________  
**Result:** ✅ Passed / ❌ Failed  

**Notes:**
```
_____________________________________________
_____________________________________________
_____________________________________________
```

---

**Last Updated:** November 16, 2025  
**Status:** Ready for Manual Testing
