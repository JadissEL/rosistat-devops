# ✅ Component Audit Implementation Checklist

**Project:** RoSiStrat  
**Audit Date:** November 15, 2025  
**Target Completion:** Before next release

---

## 📋 CRITICAL FIXES (1.5 hours)

### [ ] 1. AuthDialog.tsx - Form Error ARIA (45 min)

**Location:** `/src/components/auth/AuthDialog.tsx`

- [ ] Add error IDs for each form field
  ```tsx
  const emailErrorId = `email-error-${activeTab}`;
  const passwordErrorId = `password-error-${activeTab}`;
  const displayNameErrorId = `displayname-error-${activeTab}`;
  ```

- [ ] Update all Input components with ARIA attributes
  - [ ] Email input: Add `aria-invalid` and `aria-describedby`
  - [ ] Password input: Add `aria-invalid` and `aria-describedby`
  - [ ] Display name input: Add `aria-invalid` and `aria-describedby`
  - [ ] Confirm password input: Add `aria-invalid` and `aria-describedby`
  - [ ] Reset email input: Add `aria-invalid` and `aria-describedby`

- [ ] Update all error message paragraphs
  - [ ] Add `id={fieldErrorId}`
  - [ ] Add `role="alert"`
  - [ ] Add `aria-live="polite"`
  - [ ] Change class to include `text-sm text-red-500`

- [ ] Add loading state announcements
  - [ ] Create status div with `role="status"` and `aria-live="polite"`
  - [ ] Add `aria-busy={loading}` to buttons
  - [ ] Add `aria-hidden="true"` to spinner icon

- [ ] Add aria-hidden to decorative icons
  - [ ] Mail icon: Add `aria-hidden="true"` and `focusable="false"`
  - [ ] Lock icon: Add `aria-hidden="true"` and `focusable="false"`
  - [ ] User icon: Add `aria-hidden="true"` and `focusable="false"`

**Verification:**
- [ ] axe DevTools shows no violations for email field
- [ ] axe DevTools shows no violations for password field
- [ ] Screen reader announces error on invalid input
- [ ] Loading state announces "Signing in..."

---

### [ ] 2. AgeVerificationModal.tsx - Dialog ARIA (20 min)

**Location:** `/src/components/privacy/AgeVerificationModal.tsx`

- [ ] Add `aria-modal="true"` to DialogContent

- [ ] Add `aria-hidden="true"` to decorative icons
  - [ ] ShieldCheck icon
  - [ ] AlertTriangle icon

- [ ] Add `role="status"` and `aria-live="polite"` to Alert component

- [ ] Add `aria-label` to buttons
  - [ ] "No" button: "I am under 18 years old, decline access"
  - [ ] "Yes" button: "I am 18 years or older, confirm age verification"

**Verification:**
- [ ] Dialog announced as dialog on open
- [ ] Buttons have clear descriptions
- [ ] axe DevTools shows 0 violations
- [ ] Keyboard Shift+Tab works backward

---

### [ ] 3. Index.tsx - Dialog Focus Management (15 min)

**Location:** `/src/pages/Index.tsx`

- [ ] Add `aria-modal="true"` to AuthDialog DialogContent
- [ ] Add `aria-modal="true"` to StrategyExplanationModal DialogContent
- [ ] Add `aria-modal="true"` to other dialog components (if any)

**Verification:**
- [ ] Cannot Tab outside AuthDialog when open
- [ ] Cannot Tab outside StrategyExplanationModal when open
- [ ] Escape key closes dialogs
- [ ] Focus returns to trigger button after close

---

## 🟡 IMPORTANT FIXES (1 hour)

### [ ] 4. Decorative Icons - Global aria-hidden (30 min)

**Files to Update:**
- [ ] AuthDialog.tsx: Mail, Lock, User (3 instances already counted above)
- [ ] AgeVerificationModal.tsx: ShieldCheck, AlertTriangle (already counted above)
- [ ] Index.tsx: Review all decorative icons
- [ ] Other components: Review all decorative icons

**Pattern:**
```tsx
<Icon aria-hidden="true" focusable="false" className="..." />
```

**Search Strategy:**
```bash
grep -r "className.*h-4.*w-4" src/components/ --include="*.tsx"
```

**Verification:**
- [ ] Run axe DevTools
- [ ] Check "Icons" section has no issues
- [ ] Screen reader doesn't announce lone icons

---

### [ ] 5. Button Sizes - Touch Target Compliance (10 min)

**File:** `/src/components/ui/button.tsx`

**Changes:**
```tsx
// BEFORE
size: {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  icon: "h-10 w-10",
}

// AFTER
size: {
  default: "h-11 px-4 py-2",      // 44px height
  sm: "h-10 rounded-md px-3",      // 40px height
  lg: "h-11 rounded-md px-8",      // 44px height (no change)
  icon: "h-11 w-11",               // 44x44px
}
```

**Verification:**
- [ ] DevTools: All buttons ≥ 44px height
- [ ] DevTools: Icon buttons ≥ 44x44px
- [ ] Mobile view: Buttons easily tappable
- [ ] No visual regression (test on main page)

---

### [ ] 6. Loading State Announcements (30 min)

**Pattern for All Loading Spinners:**
```tsx
// Add status div
<div 
  role="status" 
  aria-live="polite" 
  aria-atomic="true"
  className="sr-only"
>
  {isLoading ? "Loading..." : ""}
</div>

// Update button
<Button aria-busy={loading}>
  {loading && <Loader2 aria-hidden="true" className="mr-2 animate-spin" />}
  {loading ? "Loading..." : "Sign In"}
</Button>
```

**Instances to Fix:**
- [ ] AuthDialog sign in button
- [ ] AuthDialog sign up button
- [ ] AuthDialog password reset button
- [ ] API status loading (if any)
- [ ] Other loading indicators

**Verification:**
- [ ] Screen reader announces "Loading..."
- [ ] aria-busy properly set
- [ ] Spinner marked as hidden

---

### [ ] 7. Dialog Close Button - dialog.tsx (5 min)

**File:** `/src/components/ui/dialog.tsx` Line 45

**Current:**
```tsx
<DialogPrimitive.Close className="...">
  <X className="h-4 w-4" />
  <span className="sr-only">Close</span>
</DialogPrimitive.Close>
```

**Update To:**
```tsx
<DialogPrimitive.Close 
  className="..."
  aria-label="Close dialog"
>
  <X className="h-4 w-4" aria-hidden="true" />
</DialogPrimitive.Close>
```

**Verification:**
- [ ] aria-label present
- [ ] X icon has aria-hidden
- [ ] sr-only span removed
- [ ] Still visually identical

---

## ✅ TESTING & VALIDATION (2 hours)

### [ ] 8. Automated Testing Setup

- [ ] Install testing packages
  ```bash
  npm install --save-dev @testing-library/react jest-axe axe-core
  ```

- [ ] Create test file for accessibility
  - [ ] `src/components/auth/__tests__/AuthDialog.test.tsx`
  - [ ] `src/components/privacy/__tests__/AgeVerificationModal.test.tsx`

- [ ] Run tests
  ```bash
  npm test -- --testMatch="**/*accessibility*"
  ```

**Verification:**
- [ ] All tests pass
- [ ] No axe violations found
- [ ] Form error association verified
- [ ] ARIA attributes verified

---

### [ ] 9. Manual Keyboard Testing

**Test: AuthDialog Navigation**
- [ ] Open AuthDialog in browser
- [ ] Press Tab key repeatedly
  - [ ] Title should be announced
  - [ ] Focus lands on first input
  - [ ] Can tab through all fields
  - [ ] Can reach Submit button
  - [ ] Cannot tab outside dialog
- [ ] Test Shift+Tab backward navigation
- [ ] Test Escape to close

**Test: AgeVerificationModal Navigation**
- [ ] Modal appears on load
- [ ] Press Tab to focus buttons
- [ ] Can tab between buttons
- [ ] Cannot tab outside modal
- [ ] Escape closes modal

---

### [ ] 10. Browser Tools Testing

**axe DevTools:**
- [ ] Install Chrome extension
- [ ] Scan each page with audit
- [ ] Fix any violations found
- [ ] Target: 0 critical violations

**WAVE Browser Extension:**
- [ ] Install for Chrome
- [ ] Test each page
- [ ] Check "Errors" section (should be 0)
- [ ] Review "Alerts" section

**Lighthouse:**
- [ ] Open DevTools
- [ ] Run Accessibility audit
- [ ] Target: 90+ score
- [ ] Review failing checks

---

### [ ] 11. Screen Reader Testing (NVDA)

**Windows Only:**
- [ ] Download NVDA (free)
- [ ] Start NVDA (Ctrl+Alt+N)
- [ ] Navigate to app
- [ ] Tab to AuthDialog
- [ ] Verify: "Dialog: Sign In or Create Account"
- [ ] Tab to email input
- [ ] Verify: "Email, textbox"
- [ ] Type invalid email
- [ ] Tab away (blur input)
- [ ] Verify: Error message announced
- [ ] Verify: "Invalid" state announced

**macOS Only:**
- [ ] Press Cmd+F5 to activate VoiceOver
- [ ] Navigate same flow
- [ ] Verify announcements

---

### [ ] 12. Mobile Testing

**Physical Device or Chrome DevTools:**
- [ ] Toggle device toolbar (F12)
- [ ] Set viewport to 375px width
- [ ] Test button tap targets
  - [ ] Buttons should be easily tappable
  - [ ] No accidental touches of nearby elements
- [ ] Test form input focus
- [ ] Verify error messages display
- [ ] Test modal on mobile (should be fullscreen or centered)

---

## 📊 COMPLIANCE VERIFICATION

### [ ] 13. Final Compliance Check

**WCAG 2.1 Level A:**
- [ ] Form labels properly associated
- [ ] Form errors identified and announced
- [ ] All buttons labeled
- [ ] Keyboard navigation works
- [ ] Focus visible on interactive elements

**WCAG 2.1 Level AA:**
- [ ] Color contrast ≥ 4.5:1 (checked ✅)
- [ ] Touch targets ≥ 44x44px (after fix)
- [ ] Focus indicators visible
- [ ] Page structure with headings (check Index.tsx)

**Accessibility Best Practices:**
- [ ] No keyboard traps
- [ ] Focus order logical
- [ ] Error messages clear
- [ ] Loading states announced
- [ ] Icons appropriately hidden

---

## 💾 BACKUP & COMMIT

### [ ] 14. Version Control

- [ ] Create feature branch: `feature/accessibility-audit-fixes`
- [ ] Commit critical fixes: "fix: form error ARIA and dialog accessibility"
- [ ] Commit icon fixes: "fix: add aria-hidden to decorative icons"
- [ ] Commit button sizes: "fix: update button touch target sizes (44px)"
- [ ] Create pull request with description
- [ ] Link to audit reports in PR description

---

## 📈 BEFORE & AFTER METRICS

### Before Fixes
```
WCAG 2.1 Level A:     75% ❌
WCAG 2.1 Level AA:    70% ❌
Keyboard Nav:         75% ❌
Screen Reader Ready:  70% ❌
Overall Grade:        B- (70%)
```

### After Critical Fixes (Target)
```
WCAG 2.1 Level A:     100% ✅
WCAG 2.1 Level AA:    95% ✅
Keyboard Nav:         100% ✅
Screen Reader Ready:  100% ✅
Overall Grade:        A- (90%)
```

---

## 📝 NOTES

**Time Tracking:**
- Critical Fixes: _____ hours (target: 1.5)
- Testing: _____ hours (target: 2)
- Documentation: _____ hours (target: 1)
- **Total: _____ hours (target: 4.5)**

**Blockers/Issues:**
- _______________
- _______________
- _______________

**Next Steps After Fixes:**
1. Consider adding Framer Motion animations
2. Implement keyboard shortcut documentation
3. Create accessibility testing CI/CD integration
4. Document ARIA patterns for team

---

## ✨ SUCCESS CRITERIA

All of the following must be true:

- [ ] axe DevTools shows 0 critical violations
- [ ] WAVE shows 0 errors
- [ ] Lighthouse accessibility score ≥ 90
- [ ] All form errors properly associated
- [ ] All dialogs have `aria-modal="true"`
- [ ] All decorative icons have `aria-hidden="true"`
- [ ] All buttons ≥ 44px height (44x44 for icons)
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces all content
- [ ] Loading states announced to screen readers
- [ ] PR reviewed and approved
- [ ] Tests pass locally and in CI/CD

---

**Checklist Status:** Ready to implement  
**Estimated Time:** 4.5 hours  
**Target Completion:** This week  
**Review Date:** After implementation
