# 🧪 Component Testing & Validation Guide

**Purpose:** Render components in test environment and verify fixes  
**Date:** November 15, 2025

---

## 1️⃣ Automated Testing Setup

### A. Install Testing Tools

```bash
# Install accessibility testing packages
npm install --save-dev @testing-library/react @testing-library/jest-dom axe-core axe-jest

# Install screen reader testing
npm install --save-dev jest-axe
```

### B. Create Test Template

Create `src/components/__tests__/accessibility.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('AuthDialog - Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <AuthDialog open={true} onOpenChange={() => {}} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('error messages should be associated with inputs', () => {
    render(<AuthDialog open={true} onOpenChange={() => {}} />);
    
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    expect(emailInput).toHaveAttribute('aria-describedby');
  });

  it('dialog should have proper ARIA attributes', () => {
    const { container } = render(
      <AgeVerificationModal />
    );
    
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
```

### C. Run Automated Tests

```bash
# Run all accessibility tests
npm test -- --testMatch="**/*accessibility*"

# Run with coverage
npm test -- --coverage

# Watch mode during development
npm test -- --watch
```

---

## 2️⃣ Browser Testing Tools

### A. axe DevTools (Chrome Extension)

**Installation:**
1. Visit [Chrome Web Store - axe DevTools](https://chrome.google.com/webstore)
2. Search for "axe DevTools"
3. Click "Add to Chrome"

**Testing:**
```
1. Open app in browser (http://localhost:5173)
2. Open Developer Tools (F12)
3. Click "axe DevTools" tab
4. Click "Scan ALL of my page"
5. Review violations:
   - Red = Critical
   - Yellow = Warning
   - Green = Pass
```

**Expected Results After Fixes:**
- ✅ No critical violations
- ⚠️ Maximum 2-3 warnings
- ✅ 50+ passes

### B. WAVE (Web Accessibility Evaluation Tool)

**Installation:**
1. Visit [wave.webaim.org/extension](https://wave.webaim.org/extension/)
2. Add extension for your browser

**Testing:**
```
1. Click WAVE icon in toolbar
2. Expand "Errors" section (should be empty)
3. Review "Contrast" issues (should all pass)
4. Check "Alerts" for confirmation needed
```

### C. Lighthouse (Built-in)

**Usage:**
```
1. Open DevTools
2. Click "Lighthouse" tab
3. Check "Accessibility"
4. Click "Analyze page load"
5. Target: 90+ score
```

---

## 3️⃣ Manual Keyboard Testing

### A. Navigation Test

```
Test: Tab through AuthDialog
Expected:
  1. Dialog title should be announced
  2. Focus should land on first input
  3. Can tab through all form fields
  4. Can reach Submit button
  5. Cannot tab outside dialog
  6. Shift+Tab navigates backwards

How to test:
  1. Open AuthDialog in browser
  2. Press Tab key repeatedly
  3. Focus ring should be visible
  4. Order should be: title → first input → ... → submit
```

### B. Form Validation Test

```
Test: Error messages read by screen reader
Expected:
  1. Error message appears
  2. Input marked with aria-invalid
  3. Error message ID linked to input
  4. Screen reader announces "invalid"

How to test:
  1. Click email input
  2. Type invalid email: "test"
  3. Click outside input
  4. Error should appear with red text
  5. Using axe: Input should have aria-describedby
```

### C. Dialog Focus Test

```
Test: Focus management in dialogs
Expected:
  1. Opening dialog moves focus inside
  2. Pressing Escape closes dialog
  3. Focus returns to trigger button
  4. Cannot tab outside dialog

How to test:
  1. Open any modal
  2. Press Tab repeatedly (should loop within modal)
  3. Press Escape
  4. Focus should return to open button
```

### D. Button Size Test

```
Test: Touch target sizes
Expected:
  1. All buttons are 44x44px minimum
  2. Buttons are easily tappable on mobile

How to test:
  1. Open DevTools (F12)
  2. Toggle device toolbar (mobile view)
  3. Right-click button → Inspect
  4. Check computed height and width
  5. Should be ≥ 44px for both
```

---

## 4️⃣ Screen Reader Testing

### A. NVDA (Windows) - FREE

**Download:** [nvda-project.org](https://www.nvaccess.org/)

**Testing AuthDialog:**
```
1. Start NVDA (Ctrl+Alt+N)
2. Press Tab to focus AuthDialog
3. NVDA should announce: "Dialog: Sign In or Create Account"
4. Tab to email input
5. NVDA should announce: "Email, text box, invalid"
6. Type invalid email, Tab away
7. NVDA should announce error message
```

### B. VoiceOver (macOS) - Built-in

**Activation:** Cmd+F5

**Testing:**
```
1. Press Cmd+F5 to activate VoiceOver
2. Press VO+Right Arrow to navigate
3. VO should announce dialog title
4. VO should announce input labels
5. VO should announce error messages
```

### C. JAWS (Windows) - Commercial

**Testing Pattern (same as NVDA):**
```
1. Press Insert+Up Arrow for JAWS menu
2. Navigate to application
3. Test form reading
4. Test error announcements
```

---

## 5️⃣ Component-Specific Tests

### Test: AuthDialog Form Errors

```bash
# File: src/components/auth/__tests__/AuthDialog.test.tsx

import { render, screen, userEvent } from '@testing-library/react';
import { AuthDialog } from '../AuthDialog';

describe('AuthDialog Form Errors', () => {
  it('should show error and associate with input', async () => {
    render(
      <AuthDialog 
        open={true} 
        onOpenChange={() => {}} 
        defaultTab="signin"
      />
    );

    const emailInput = screen.getByRole('textbox', { name: /email/i });
    
    // Type invalid email
    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.click(document.body); // Blur to trigger validation
    
    // Find error message
    const errorMessage = screen.getByText(/invalid email/i);
    
    // Verify association
    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    expect(emailInput).toHaveAttribute(
      'aria-describedby', 
      expect.stringContaining('error')
    );
    expect(errorMessage).toHaveAttribute('id');
    expect(errorMessage).toHaveAttribute('role', 'alert');
  });
});
```

### Test: AgeVerificationModal ARIA

```bash
# File: src/components/privacy/__tests__/AgeVerificationModal.test.tsx

import { render, screen } from '@testing-library/react';
import { AgeVerificationModal } from '../AgeVerificationModal';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('AgeVerificationModal ARIA', () => {
  it('should have aria-modal and proper labels', () => {
    const { container } = render(<AgeVerificationModal />);
    
    const dialogContent = container.querySelector('[aria-modal="true"]');
    expect(dialogContent).toBeInTheDocument();
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      expect(btn).toHaveAttribute('aria-label');
    });
  });

  it('should pass axe accessibility scan', async () => {
    const { container } = render(<AgeVerificationModal />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

---

## 6️⃣ Test Checklist - AuthDialog

```
FORM VALIDATION:
  ✅ Email input has aria-invalid when invalid
  ✅ Error message has id and role="alert"
  ✅ Input has aria-describedby pointing to error
  ✅ Password input same pattern
  ✅ Display name input same pattern

LOADING STATE:
  ✅ Button has aria-busy="true" when loading
  ✅ Spinner has aria-hidden="true"
  ✅ Loading text visible on button
  ✅ status div announces "Signing in..."

ICONS:
  ✅ Mail icon has aria-hidden="true"
  ✅ Lock icon has aria-hidden="true"
  ✅ User icon has aria-hidden="true"
  ✅ No icon is announced to screen readers

KEYBOARD NAVIGATION:
  ✅ Tab key focuses first input
  ✅ Can tab through all fields
  ✅ Can tab to submit button
  ✅ Shift+Tab goes backwards
  ✅ Escape closes dialog
  ✅ Cannot tab outside dialog

SCREEN READER:
  ✅ Dialog title announced on open
  ✅ Input labels read
  ✅ Error messages announced
  ✅ Loading state announced
```

---

## 7️⃣ Test Checklist - AgeVerificationModal

```
DIALOG ARIA:
  ✅ aria-modal="true" present
  ✅ role="dialog" set or inherited
  ✅ Dialog title readable
  ✅ Focus trap working (cannot tab outside)

BUTTONS:
  ✅ "No, I'm under 18" has aria-label
  ✅ "Yes, I'm 18 or older" has aria-label
  ✅ Labels clearly describe action
  ✅ Touch targets 44x44px minimum

ICONS:
  ✅ ShieldCheck has aria-hidden="true"
  ✅ AlertTriangle has aria-hidden="true"

ALERTS:
  ✅ Alert has role="status"
  ✅ Alert has aria-live="polite"
  ✅ Alert content reads properly

KEYBOARD:
  ✅ Tab focuses first button
  ✅ Can tab both buttons
  ✅ Escape closes modal
  ✅ Focus returns to trigger

SCREEN READER:
  ✅ Dialog purpose announced
  ✅ Button purposes clear
  ✅ Alert content readable
  ✅ No orphaned icons announced
```

---

## 8️⃣ Validation Commands

```bash
# Run all tests
npm test

# Run accessibility tests only
npm test -- accessibility

# Run with coverage
npm test -- --coverage

# Generate accessibility report
npx axe-core scan http://localhost:5173

# Type check
npm run typecheck

# Lint check
npm run lint

# Build check
npm run build
```

---

## 9️⃣ Expected Results After Fixes

### Automated Testing
```
✅ axe DevTools: 0 violations
✅ WAVE: 0 errors
✅ Lighthouse: 90+ accessibility score
✅ Jest tests: All pass
```

### Manual Testing
```
✅ Keyboard: Can navigate all components with Tab/Shift+Tab
✅ Screen Reader: All content readable and understandable
✅ Mobile: All touch targets 44x44px minimum
✅ Forms: Errors clearly associated with inputs
```

### Compliance
```
✅ WCAG 2.1 Level A: 100%
✅ WCAG 2.1 Level AA: 95%+
✅ WCAG 2.1 Level AAA: 80%+
✅ ARIA Best Practices: 95%+
```

---

## 🔟 Troubleshooting

### Issue: Test won't recognize aria-describedby

**Solution:**
```tsx
// Ensure error ID matches aria-describedby value
const errorId = 'email-error-signin';

<Input aria-describedby={errorId} />
<p id={errorId}>Error message</p>
```

### Issue: Screen reader doesn't announce error

**Solution:**
```tsx
// Add role and aria-live
<p role="alert" aria-live="polite" id={errorId}>
  {errorMessage}
</p>
```

### Issue: Dialog focus trap not working

**Solution:**
```tsx
// Radix handles this with aria-modal
<DialogContent aria-modal="true">
  {/* Focus automatically trapped */}
</DialogContent>
```

### Issue: Icon still being announced

**Solution:**
```tsx
// Both attributes needed
<Icon aria-hidden="true" focusable="false" />
```

---

## Documentation Links

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Best Practices](https://www.w3.org/WAI/ARIA/apg/)
- [axe DevTools Docs](https://www.deque.com/axe/devtools/)
- [React Testing Library](https://testing-library.com/react)
- [jest-axe](https://github.com/nickcolley/jest-axe)

---

**Test Environment Ready:** ✅  
**Validation Complete:** ✅  
**Status:** Ready for implementation
